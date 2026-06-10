/**
 * ACC-01..14 — Corpus-wide deterministic accuracy scan (READ-ONLY).
 * Runs on prod: node scripts/platform-audit/scan-accuracy.js
 * Scans every completed verification_jobs doc's result vs its own rawPayload + picklist configs.
 * See docs/PLATFORM-AUDIT-GUIDE.md §4.1.
 */
const path = require('path');
const {
  connect, normalizePrimary, isEmptyish, parseDim,
  makeCheck, finishChecks, saveReport, printSummary,
} = require('./lib/common');

const root = path.join(__dirname, '..', '..');
const categories = require(path.join(root, 'src/config/salesforce-picklists/categories.json'));
const brands = require(path.join(root, 'src/config/salesforce-picklists/brands.json'));
const typeMappingFile = require(path.join(root, 'src/config/salesforce-picklists/category-type-mapping.json'));

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const normTight = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]+/g, '');

const allCategories = new Set(categories.map((c) => norm(c.category_name)));
const deptCategories = new Map(); // dept -> Set(category)
for (const c of categories) {
  const d = norm(c.department);
  if (!deptCategories.has(d)) deptCategories.set(d, new Set());
  deptCategories.get(d).add(norm(c.category_name));
}
const brandSet = new Set(brands.map((b) => norm(b.brand_name)));
const categoryTypes = new Map(); // norm(category) -> Set(norm(type))
for (const m of Object.values(typeMappingFile.mappings || {})) {
  const key = norm(m.category_name);
  if (!categoryTypes.has(key)) categoryTypes.set(key, new Set());
  for (const t of m.types || []) categoryTypes.get(key).add(norm(t.type_name));
}

const FINISH_DENYLIST = /^(white|black|bisque|ivory|almond|biscuit|grey|gray|silver|slate|panel\s*ready|custom\s*panel(\s*ready)?|integrated)$/i;
const TITLE_DIM = /(\d+(?:\.\d+)?)\s*-\s*inch/i;
const DUP_STOPWORDS = new Set(['inch', 'with', 'cubic', 'steel']); // 'steel' legitimately repeats in e.g. "Stainless Steel" + "Steel Tub"

async function main() {
  const { client, db } = await connect();
  const checks = {
    acc01: makeCheck('ACC-01', 'title length outside 60–80 chars'),
    acc02: makeCheck('ACC-02', 'model number in title ≠ SF_Catalog_Name'),
    acc03: makeCheck('ACC-03', 'title dimension gap > 4" vs all stored dimensions'),
    acc04: makeCheck('ACC-04', 'finish is a plain color / config descriptor'),
    acc05: makeCheck('ACC-05', 'finish duplicates color'),
    acc06: makeCheck('ACC-06', 'color value is junk (over-capture: digits/units/HTML or >30 chars)'),
    acc07a: makeCheck('ACC-07a', 'category not in picklist at all'),
    acc07b: makeCheck('ACC-07b', 'category not valid for its department'),
    acc08: makeCheck('ACC-08', 'type not valid for category (per type mapping)'),
    acc09: makeCheck('ACC-09', 'brand not in brands.json picklist'),
    acc10: makeCheck('ACC-10', 'Canadian (CA_) jobs (informational count)'),
    acc11: makeCheck('ACC-11', 'repeated token in title (duplication)'),
    acc13: makeCheck('ACC-13', 'dimension non-numeric / ≤0 / >200 inches'),
    acc14: makeCheck('ACC-14', 'MSRP vs Ferguson price discrepancy > 30%'),
  };
  const styleCounts = new Map();           // style -> n   (ACC-12)
  const styleByCategory = new Map();       // category -> {n, contemporary}
  const flaggedByCategory = new Map();     // checkId -> Map(category -> n)
  const eraCounts = { ai: 0, verified: 0, unknown: 0 };
  const titleLengths = [];

  const bump = (checkId, category) => {
    if (!flaggedByCategory.has(checkId)) flaggedByCategory.set(checkId, new Map());
    const m = flaggedByCategory.get(checkId);
    m.set(category, (m.get(category) || 0) + 1);
  };

  const cursor = db.collection('verification_jobs').find(
    { status: 'completed' },
    { projection: {
      sfCatalogName: 1, sfCatalogId: 1, createdAt: 1,
      'result.Primary_Attributes': 1,
      'rawPayload.Web_Retailer_Key': 1, 'rawPayload.Ferguson_Price': 1,
      'rawPayload.Ferguson_MSRP': 1, 'rawPayload.SF_Catalog_Name': 1,
    } }
  );

  let scanned = 0;
  for await (const job of cursor) {
    const p = normalizePrimary(job.result && job.result.Primary_Attributes);
    if (!p || p.era === 'unknown') { eraCounts.unknown++; continue; }
    eraCounts[p.era]++;
    scanned++;
    const cat = isEmptyish(p.category) ? '(none)' : String(p.category);
    const name = job.sfCatalogName || job.sfCatalogId;
    const ex = (extra) => ({ sku: name, category: cat, era: p.era, ...extra });
    for (const c of Object.values(checks)) c.seen();

    // ACC-01 + length capture
    const title = isEmptyish(p.title) ? '' : String(p.title).trim();
    if (title) {
      titleLengths.push(title.length);
      if (title.length < 60 || title.length > 80) { checks.acc01.hit(ex({ len: title.length, title: title.slice(0, 90) })); bump('ACC-01', cat); }
    }

    // ACC-02 — trailing model in title vs authoritative SKU
    if (title && job.sfCatalogName && title.includes(' - ')) {
      const tail = normTight(title.split(' - ').pop());
      const sku = normTight(job.sfCatalogName);
      if (tail && sku && tail !== sku && !tail.includes(sku) && !sku.includes(tail)) {
        checks.acc02.hit(ex({ titleModel: title.split(' - ').pop(), sku: job.sfCatalogName })); bump('ACC-02', cat);
      }
    }

    // ACC-03 — title dimension vs stored dims
    const dimMatch = title.match(TITLE_DIM);
    if (dimMatch) {
      const t = parseFloat(dimMatch[1]);
      const dims = [parseDim(p.width), parseDim(p.height), parseDim(p.depth)].filter((d) => d !== null && d > 0);
      if (dims.length) {
        const gap = Math.min(...dims.map((d) => Math.abs(t - d)));
        if (gap > 4) { checks.acc03.hit(ex({ titleInch: t, dims, gap: +gap.toFixed(1) })); bump('ACC-03', cat); }
      }
    }

    // ACC-04 / ACC-05 — finish sanity
    const finish = isEmptyish(p.finish) ? '' : String(p.finish).trim();
    const color = isEmptyish(p.color) ? '' : String(p.color).trim();
    if (finish && FINISH_DENYLIST.test(finish)) { checks.acc04.hit(ex({ finish })); bump('ACC-04', cat); }
    else if (finish && color && finish.toLowerCase() === color.toLowerCase()) { checks.acc05.hit(ex({ finish, color })); bump('ACC-05', cat); }

    // ACC-06 — color junk
    if (color && (color.length > 30 || /<[^>]+>/.test(color) || (/\d/.test(color) && /(inch|inches|cm|mm|lbs|cu\.?\s?ft)/i.test(color)))) {
      checks.acc06.hit(ex({ color: color.slice(0, 80) })); bump('ACC-06', cat);
    }

    // ACC-07 — category validity
    if (!isEmptyish(p.category)) {
      const catN = norm(p.category);
      if (!allCategories.has(catN)) { checks.acc07a.hit(ex({ category: p.category })); bump('ACC-07a', cat); }
      else if (!isEmptyish(p.department)) {
        const deptSet = deptCategories.get(norm(p.department));
        if (deptSet && !deptSet.has(catN)) { checks.acc07b.hit(ex({ category: p.category, department: p.department })); bump('ACC-07b', cat); }
      }
    }

    // ACC-08 — type validity (AI era only; verified era has no type field)
    if (p.era === 'ai' && !isEmptyish(p.type) && !isEmptyish(p.category)) {
      const tset = categoryTypes.get(norm(p.category));
      if (tset && tset.size && !tset.has(norm(p.type))) { checks.acc08.hit(ex({ type: p.type })); bump('ACC-08', cat); }
    }

    // ACC-09 — brand picklist
    if (!isEmptyish(p.brand) && !brandSet.has(norm(p.brand))) { checks.acc09.hit(ex({ brand: p.brand })); bump('ACC-09', cat); }

    // ACC-10 — Canadian conversions (count only)
    if (String((job.rawPayload || {}).Web_Retailer_Key || '').startsWith('CA_')) checks.acc10.hit(ex({}));

    // ACC-11 — repeated tokens in title
    if (title) {
      const tokens = title.toLowerCase().match(/[a-z]{4,}/g) || [];
      const seen = new Map();
      let dup = null;
      for (const t of tokens) {
        if (DUP_STOPWORDS.has(t)) continue;
        seen.set(t, (seen.get(t) || 0) + 1);
        if (seen.get(t) >= 2) { dup = t; break; }
      }
      if (dup) { checks.acc11.hit(ex({ dupToken: dup, title: title.slice(0, 90) })); bump('ACC-11', cat); }
    }

    // ACC-12 — style distribution
    const style = isEmptyish(p.style) ? '(empty)' : String(p.style).trim();
    styleCounts.set(style, (styleCounts.get(style) || 0) + 1);
    if (!styleByCategory.has(cat)) styleByCategory.set(cat, { n: 0, contemporary: 0 });
    const sb = styleByCategory.get(cat);
    sb.n++; if (/^contemporary$/i.test(style)) sb.contemporary++;

    // ACC-13 — dimension sanity
    for (const [label, v] of [['width', p.width], ['height', p.height], ['depth', p.depth]]) {
      if (isEmptyish(v)) continue;
      const d = parseDim(v);
      if (d === null || d <= 0 || d > 200) { checks.acc13.hit(ex({ dim: label, value: String(v).slice(0, 40) })); bump('ACC-13', cat); break; }
    }

    // ACC-14 — MSRP vs Ferguson
    const fp = parseDim((job.rawPayload || {}).Ferguson_Price) || parseDim((job.rawPayload || {}).Ferguson_MSRP);
    const msrp = parseDim(p.msrp);
    if (fp && msrp && fp > 0) {
      const ratio = msrp / fp;
      if (ratio > 1.43 || ratio < 0.7) { checks.acc14.hit(ex({ msrp, fergusonPrice: fp, ratio: +ratio.toFixed(2) })); bump('ACC-14', cat); }
    }
  }
  await client.close();

  // ACC-12 summary
  const styleDist = [...styleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    .map(([style, n]) => ({ style, n, pct: +(100 * n / scanned).toFixed(1) }));
  const contemporaryHeavy = [...styleByCategory.entries()]
    .filter(([, v]) => v.n >= 30)
    .map(([category, v]) => ({ category, n: v.n, contemporaryPct: +(100 * v.contemporary / v.n).toFixed(1) }))
    .sort((a, b) => b.contemporaryPct - a.contemporaryPct).slice(0, 20);

  const byCategory = {};
  for (const [checkId, m] of flaggedByCategory) {
    byCategory[checkId] = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([category, count]) => ({ category, count }));
  }

  titleLengths.sort((a, b) => a - b);
  const pct = (q) => titleLengths.length ? titleLengths[Math.floor(q * (titleLengths.length - 1))] : null;

  const summary = finishChecks(checks);
  summary['ACC-12'] = {
    description: 'style value distribution (defaulting detector)',
    flagged: styleCounts.get('Contemporary') || 0, scanned,
    rate: scanned ? +(100 * (styleCounts.get('Contemporary') || 0) / scanned).toFixed(2) : null,
    examples: styleDist,
  };

  printSummary('ACC ACCURACY SCAN', summary);
  console.log(`\n  eras: ${JSON.stringify(eraCounts)}  | title length p10/p50/p90: ${pct(0.1)}/${pct(0.5)}/${pct(0.9)}`);
  saveReport('scan-accuracy', {
    generated: new Date().toISOString(), scanned, eraCounts,
    titleLength: { p10: pct(0.1), p50: pct(0.5), p90: pct(0.9), min: titleLengths[0], max: titleLengths[titleLengths.length - 1] },
    summary, styleDistribution: styleDist, contemporaryHeavyCategories: contemporaryHeavy, byCategory,
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
