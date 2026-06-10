/**
 * Phase 2 — Golden-set selection + payload export + DRAFT answers (READ-ONLY).
 * Runs on prod: node scripts/platform-audit/select-golden-set.js
 *
 * Stratified selection (~55-65 SKUs) driven by Phase 1 findings (PLATFORM-AUDIT-GUIDE §5.2):
 *   - the Finding #078 product set (pinned — their ambiguities are documented)
 *   - heavy-hit strata: finish==color (ACC-05), plain-color finish (ACC-04), junk color (ACC-06),
 *     title duplication (ACC-11), model mismatch (ACC-02), dimension gap (ACC-03)
 *   - panel-ready cluster, Canadian (CA_) jobs, legacy-era jobs
 *   - all 4 data-source scenarios, including CLEAN jobs (T2 passthrough cases)
 *
 * Output (tar back to repo, commit):
 *   audit-results/golden-set/payloads/<SKU>.json   — full stored rawPayload + current output
 *   audit-results/golden-set/golden-answers.draft.json — 7 fields per SKU, pre-filled from the
 *     current pipeline output, every field status:"needs_review" — A HUMAN MUST SIGN OFF before
 *     this becomes golden-answers.json. Draft values are NOT ground truth.
 */
const fs = require('fs');
const path = require('path');
const { connect, normalizePrimary, isEmptyish, parseDim, deriveScenario } = require('./lib/common');

const OUT_BASE = process.env.GOLDEN_OUT || path.join(__dirname, '..', '..', 'audit-results', 'golden-set');

const PINNED_078 = new Set([
  'NS-UZ70SS4', 'NS-CZ70WH26L', 'B18IF70NSP', 'FCM7STWW', 'NSCZ10WH6', 'NS-CZ10WH6',
  'NS-CZ14WH', 'NS-CZ14WH2', 'RD1884L4D', 'NS-CZ10WH26', 'MF1851', 'SCFF1842', 'FFUE2024AW',
].map((s) => s.toUpperCase()));

const FINISH_DENYLIST = /^(white|black|bisque|ivory|almond|biscuit|grey|gray|silver|slate|panel\s*ready|custom\s*panel(\s*ready)?|integrated)$/i;
const TITLE_DIM = /(\d+(?:\.\d+)?)\s*-\s*inch/i;

const QUOTAS = {
  pinned_078: 13,
  finish_eq_color: 8,
  finish_plain_color: 4,
  color_junk: 4,
  title_dup: 4,
  model_mismatch: 3,
  dimension_gap: 3,
  panel_ready: 3,
  canadian: 3,
  legacy_era: 3,
  scenario_no_sources: 3,
  scenario_ferguson_only: 3,
  scenario_wr_only: 3,
  clean_passthrough: 6,
};

async function main() {
  const { client, db } = await connect();
  const picked = new Map();   // sfCatalogId -> {job, strata: []}
  const counts = Object.fromEntries(Object.keys(QUOTAS).map((k) => [k, 0]));

  const take = (stratum, job) => {
    if (counts[stratum] >= QUOTAS[stratum]) return false;
    const key = String(job.sfCatalogId);
    if (picked.has(key)) { picked.get(key).strata.push(stratum); counts[stratum]++; return true; }
    picked.set(key, { job, strata: [stratum] });
    counts[stratum]++;
    return true;
  };

  // newest first so the golden set reflects the current pipeline era where possible
  const cursor = db.collection('verification_jobs')
    .find({ status: 'completed' }, { projection: { sfCatalogId: 1, sfCatalogName: 1, createdAt: 1, rawPayload: 1, result: 1 } })
    .sort({ createdAt: -1 });

  for await (const job of cursor) {
    if (Object.entries(QUOTAS).every(([k, q]) => counts[k] >= q)) break;
    const p = normalizePrimary(job.result && job.result.Primary_Attributes);
    if (!p || p.era === 'unknown') continue;
    const name = String(job.sfCatalogName || '').toUpperCase();
    const rp = job.rawPayload || {};
    const title = isEmptyish(p.title) ? '' : String(p.title).trim();
    const color = isEmptyish(p.color) ? '' : String(p.color).trim();
    const finish = isEmptyish(p.finish) ? '' : String(p.finish).trim();

    if (PINNED_078.has(name)) { take('pinned_078', job); continue; }

    let flagged = false;
    if (finish && color && finish.toLowerCase() === color.toLowerCase()) flagged = take('finish_eq_color', job) || true;
    else if (finish && FINISH_DENYLIST.test(finish)) flagged = take('finish_plain_color', job) || true;
    if (color && (color.length > 30 || (/\d/.test(color) && /(inch|cm|lbs)/i.test(color)))) flagged = take('color_junk', job) || true;
    if (title) {
      const tokens = title.toLowerCase().match(/[a-z]{4,}/g) || [];
      const seen = new Set();
      for (const t of tokens) {
        if (['inch', 'with', 'cubic', 'steel'].includes(t)) continue;
        if (seen.has(t)) { flagged = take('title_dup', job) || true; break; }
        seen.add(t);
      }
      if (job.sfCatalogName && title.includes(' - ')) {
        const tail = title.split(' - ').pop().toUpperCase().replace(/[^A-Z0-9]+/g, '');
        const sku = name.replace(/[^A-Z0-9]+/g, '');
        if (tail && sku && tail !== sku && !tail.includes(sku) && !sku.includes(tail)) flagged = take('model_mismatch', job) || true;
      }
      const dm = title.match(TITLE_DIM);
      if (dm) {
        const t = parseFloat(dm[1]);
        const dims = [parseDim(p.width), parseDim(p.height), parseDim(p.depth)].filter((d) => d !== null && d > 0);
        if (dims.length && Math.min(...dims.map((d) => Math.abs(t - d))) > 4) flagged = take('dimension_gap', job) || true;
      }
    }
    if (/panel\s*ready|custom\s*panel/i.test(JSON.stringify([rp.Color_Finish_Web_Retailer, color, finish]))) flagged = take('panel_ready', job) || true;
    if (String(rp.Web_Retailer_Key || '').startsWith('CA_')) flagged = take('canadian', job) || true;
    if (p.era === 'verified') flagged = take('legacy_era', job) || true;

    const sc = deriveScenario(rp);
    if (sc === 'no_sources') flagged = take('scenario_no_sources', job) || true;
    else if (sc === 'ferguson_only') flagged = take('scenario_ferguson_only', job) || true;
    else if (sc === 'web_retailer_only' && !flagged) take('scenario_wr_only', job);
    else if (!flagged && p.era === 'ai') take('clean_passthrough', job);
  }
  await client.close();

  // write payloads + draft answers
  const payloadDir = path.join(OUT_BASE, 'payloads');
  fs.mkdirSync(payloadDir, { recursive: true });
  const draft = [];
  for (const { job, strata } of picked.values()) {
    const p = normalizePrimary(job.result.Primary_Attributes);
    const safeName = String(job.sfCatalogName || job.sfCatalogId).replace(/[^A-Za-z0-9._-]+/g, '_');
    fs.writeFileSync(path.join(payloadDir, `${safeName}.json`), JSON.stringify({
      sf_catalog_id: job.sfCatalogId, sf_catalog_name: job.sfCatalogName,
      createdAt: job.createdAt, era: p.era, strata,
      scenario: deriveScenario(job.rawPayload),
      rawPayload: job.rawPayload,
      currentOutput: {
        AI_Brand: p.brand, AI_Product_Category: p.category, AI_Type: p.type,
        AI_Style: p.style, AI_Color: p.color, AI_Finish: p.finish, AI_Product_Title: p.title,
      },
    }, null, 2));
    draft.push({
      sf_catalog_id: job.sfCatalogId, sf_catalog_name: job.sfCatalogName, strata,
      scenario: deriveScenario(job.rawPayload), era: p.era,
      fields: Object.fromEntries([
        ['AI_Brand', p.brand], ['AI_Product_Category', p.category], ['AI_Type', p.type],
        ['AI_Style', p.style], ['AI_Color', p.color], ['AI_Finish', p.finish], ['AI_Product_Title', p.title],
      ].map(([f, v]) => [f, {
        draft: isEmptyish(v) ? '' : v,
        correct: null,             // ← human fills
        evidence: '',              // ← human quotes the payload
        ambiguous: false,
        status: 'needs_review',
      }])),
      failure_class: null, reviewed_by: null, reviewed_date: null,
    });
  }
  fs.writeFileSync(path.join(OUT_BASE, 'golden-answers.draft.json'), JSON.stringify({
    generated: new Date().toISOString(),
    WARNING: 'DRAFT — pre-filled from current pipeline output, which Phase 1 proved is often wrong. NOT ground truth until human review flips status to reviewed and fills evidence.',
    strataCounts: counts, total: draft.length, entries: draft,
  }, null, 2));

  console.log('\n═══ GOLDEN SET SELECTION ═══');
  console.log('strata fill:', JSON.stringify(counts, null, 0));
  console.log(`total unique SKUs: ${picked.size}`);
  console.log(`payloads → ${payloadDir}`);
  console.log(`draft answers → ${path.join(OUT_BASE, 'golden-answers.draft.json')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
