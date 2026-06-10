/**
 * GAP-01, 03, 04, 05, 06 — Coverage & backlog gap scan (READ-ONLY).
 * Runs on prod: node scripts/platform-audit/scan-gaps.js
 * See docs/PLATFORM-AUDIT-GUIDE.md §4.3. (GAP-02 is scan-config-coverage.js, runs locally.)
 */
const path = require('path');
const {
  connect, normalizePrimary, isEmptyish, deriveScenario, saveReport,
} = require('./lib/common');

const root = path.join(__dirname, '..', '..');
const attributes = require(path.join(root, 'src/config/salesforce-picklists/attributes.json'));

const KNOWN_GARBAGE = new Set(['actual_product', 'detected_product', 'image_detected', 'serial_number_example', 'serial_example', 'listing']);
const FIELDS = ['brand', 'category', 'type', 'style', 'color', 'finish', 'width', 'height', 'depth', 'weight', 'msrp', 'upc', 'model', 'title'];

async function main() {
  const { client, db } = await connect();

  // ── GAP-01 + GAP-05: one streaming pass over completed jobs ──
  const fieldEmpty = new Map();   // category -> field -> {n, empty}
  const scenarios = new Map();    // scenario -> {n, scoreSum, scoreN, webhookOk, mismatch? }
  let scanned = 0;

  const cursor = db.collection('verification_jobs').find(
    { status: 'completed' },
    { projection: {
      sfCatalogName: 1, webhookSuccess: 1,
      'result.Primary_Attributes': 1, 'result.Verification.verification_score': 1,
      'rawPayload.Ferguson_Title': 1, 'rawPayload.Ferguson_Price': 1, 'rawPayload.Ferguson_Raw_Data': 1,
      'rawPayload.Ferguson_Brand': 1, 'rawPayload.Product_Description_Web_Retailer': 1,
      'rawPayload.Features_Web_Retailer': 1, 'rawPayload.Specification_Table': 1, 'rawPayload.Web_Retailer_Key': 1,
    } }
  );

  for await (const job of cursor) {
    const p = normalizePrimary(job.result && job.result.Primary_Attributes);
    if (!p || p.era === 'unknown') continue;
    scanned++;
    const cat = isEmptyish(p.category) ? '(none)' : String(p.category);

    if (!fieldEmpty.has(cat)) fieldEmpty.set(cat, new Map());
    const fm = fieldEmpty.get(cat);
    for (const f of FIELDS) {
      if (p.era === 'verified' && f === 'type') continue; // legacy era has no type field
      if (!fm.has(f)) fm.set(f, { n: 0, empty: 0 });
      const cell = fm.get(f);
      cell.n++;
      if (isEmptyish(p[f])) cell.empty++;
    }

    const sc = deriveScenario(job.rawPayload);
    if (!scenarios.has(sc)) scenarios.set(sc, { n: 0, scoreSum: 0, scoreN: 0, webhookOk: 0 });
    const s = scenarios.get(sc);
    s.n++;
    const score = job.result && job.result.Verification && job.result.Verification.verification_score;
    if (typeof score === 'number') { s.scoreSum += score; s.scoreN++; }
    if (job.webhookSuccess === true) s.webhookOk++;
  }

  // GAP-01 outputs: overall per-field rates + worst category cells
  const overallField = {};
  for (const f of FIELDS) overallField[f] = { n: 0, empty: 0 };
  const worstCells = [];
  for (const [cat, fm] of fieldEmpty) {
    for (const [f, cell] of fm) {
      overallField[f].n += cell.n; overallField[f].empty += cell.empty;
      if (cell.n >= 30) worstCells.push({ category: cat, field: f, n: cell.n, emptyPct: +(100 * cell.empty / cell.n).toFixed(1) });
    }
  }
  worstCells.sort((a, b) => b.emptyPct - a.emptyPct);
  const gap01 = {
    overall: Object.fromEntries(FIELDS.map((f) => [f, {
      n: overallField[f].n, emptyPct: overallField[f].n ? +(100 * overallField[f].empty / overallField[f].n).toFixed(1) : null,
    }])),
    worstCategoryCells: worstCells.slice(0, 30),
  };

  // ── GAP-05 summary ──
  const gap05 = [...scenarios.entries()].map(([scenario, s]) => ({
    scenario, n: s.n, pct: +(100 * s.n / scanned).toFixed(1),
    avgScore: s.scoreN ? +(s.scoreSum / s.scoreN).toFixed(1) : null,
    webhookOkPct: +(100 * s.webhookOk / s.n).toFixed(1),
  })).sort((a, b) => b.n - a.n);

  // ── GAP-03: pending creation requests + failed match logs ──
  const gap03 = {};
  try {
    const pcr = db.collection('pending_creation_requests');
    gap03.pendingCreationTotal = await pcr.countDocuments();
    const sample = await pcr.findOne();
    gap03.sampleKeys = sample ? Object.keys(sample) : [];
    const groupKey = sample && (sample.status !== undefined ? '$status' : null);
    if (groupKey) {
      gap03.byStatus = await pcr.aggregate([{ $group: { _id: groupKey, n: { $sum: 1 } } }, { $sort: { n: -1 } }]).toArray();
    }
    const typeKey = sample && (sample.type !== undefined ? '$type' : sample.request_type !== undefined ? '$request_type' : sample.field !== undefined ? '$field' : null);
    if (typeKey) {
      gap03.byType = await pcr.aggregate([{ $group: { _id: typeKey, n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 15 }]).toArray();
    }
    // age buckets
    if (sample && sample.createdAt) {
      const now = Date.now();
      const buckets = { '<7d': 0, '7-30d': 0, '30-60d': 0, '>60d': 0 };
      await pcr.find({}, { projection: { createdAt: 1 } }).forEach((d) => {
        const age = (now - new Date(d.createdAt).getTime()) / 86400000;
        buckets[age < 7 ? '<7d' : age < 30 ? '7-30d' : age < 60 ? '30-60d' : '>60d']++;
      });
      gap03.ageBuckets = buckets;
    }
  } catch (e) { gap03.error = e.message; }

  try {
    const fml = db.collection('failed_match_logs');
    gap03.failedMatchTotal = await fml.countDocuments();
    const sample = await fml.findOne();
    gap03.failedMatchSampleKeys = sample ? Object.keys(sample) : [];
    const fieldKey = sample && (sample.fieldType !== undefined ? '$fieldType' : sample.field !== undefined ? '$field' : sample.type !== undefined ? '$type' : null);
    if (fieldKey) {
      gap03.failedMatchByField = await fml.aggregate([{ $group: { _id: fieldKey, n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 15 }]).toArray();
    }
    const valKey = sample && (sample.attemptedValue !== undefined ? '$attemptedValue' : sample.value !== undefined ? '$value' : null);
    if (valKey) {
      gap03.failedMatchTopValues = await fml.aggregate([{ $group: { _id: valKey, n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 20 }]).toArray();
    }
  } catch (e) { gap03.failedMatchError = e.message; }

  // ── GAP-04: NEEDS_SF_ID inventory (local file, but reported with corpus data) ──
  const needsSfId = attributes.filter((a) => a.attribute_id === 'NEEDS_SF_ID').map((a) => a.attribute_name);
  const gap04 = {
    total: needsSfId.length,
    knownGarbage: needsSfId.filter((n) => KNOWN_GARBAGE.has(n)),
    legitimate: needsSfId.filter((n) => !KNOWN_GARBAGE.has(n)),
  };

  // ── GAP-06: audit coverage ──
  const gap06 = {
    fieldsAuditedByAuditMode: 7,
    primaryAttributeFieldsInOutput: 26,
    auditJobsToDate: await db.collection('audit_jobs').countDocuments(),
    note: 'Audit Mode covers 7 of ~26 primary output fields + ~15 top-filter attributes; no QA exists for the rest.',
  };

  await client.close();

  console.log('\n═══ GAP SCAN ═══');
  console.log('  GAP-01 overall empty rates:', JSON.stringify(gap01.overall));
  console.log('  GAP-01 worst cells (top 5):', JSON.stringify(gap01.worstCategoryCells.slice(0, 5)));
  console.log('  GAP-03 pending creation:', gap03.pendingCreationTotal, 'byStatus:', JSON.stringify(gap03.byStatus || []));
  console.log('  GAP-03 failed matches:', gap03.failedMatchTotal);
  console.log('  GAP-04 NEEDS_SF_ID:', gap04.total, `(garbage: ${gap04.knownGarbage.length})`);
  console.log('  GAP-05 scenarios:', JSON.stringify(gap05));
  console.log('  GAP-06:', JSON.stringify(gap06));

  saveReport('scan-gaps', { generated: new Date().toISOString(), scanned, gap01, gap03, gap04, gap05, gap06 });
}

main().catch((e) => { console.error(e); process.exit(1); });
