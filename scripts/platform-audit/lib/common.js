/**
 * Shared helpers for the Phase 1 platform-audit scanners (docs/PLATFORM-AUDIT-GUIDE.md §6.1).
 * All scanners are READ-ONLY. They connect to the local MongoDB (run on prod via SSH)
 * and write JSON results to audit-results/platform-audit/<date>/.
 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'catalog-verification';

// Session files use US Eastern dates per CLAUDE.md, not UTC
const RUN_DATE = process.env.AUDIT_DATE ||
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
const OUT_DIR = process.env.AUDIT_OUT ||
  path.join(__dirname, '..', '..', '..', 'audit-results', 'platform-audit', RUN_DATE);

async function connect() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  return { client, db: client.db(DB_NAME) };
}

/**
 * Normalize the two Primary_Attributes schema eras into one shape.
 *  - AI_* era (Feb 5 2026 → present, ~14.9k jobs)
 *  - *_Verified era (Jan 26 – Feb 11 2026, ~3.8k jobs)
 */
function normalizePrimary(pa) {
  if (!pa) return null;
  if (pa.AI_Brand !== undefined || pa.AI_Product_Title !== undefined) {
    return {
      era: 'ai',
      brand: pa.AI_Brand, category: pa.AI_Product_Category, department: pa.AI_Product_Department,
      type: pa.AI_Type, style: pa.AI_Style, color: pa.AI_Color, finish: pa.AI_Finish,
      width: pa.AI_Width, height: pa.AI_Height, depth: pa.AI_Depth, weight: pa.AI_Weight,
      msrp: pa.AI_MSRP, title: pa.AI_Product_Title, model: pa.AI_Model_Number,
      upc: pa.AI_UPC_GTIN,
    };
  }
  if (pa.Brand_Verified !== undefined || pa.Product_Title_Verified !== undefined) {
    return {
      era: 'verified',
      brand: pa.Brand_Verified, category: pa.Category_Verified, department: pa.Department_Verified,
      type: undefined, style: pa.Product_Style_Verified, color: pa.Color_Verified, finish: pa.Finish_Verified,
      width: pa.Width_Verified, height: pa.Height_Verified, depth: pa.Depth_Verified, weight: pa.Weight_Verified,
      msrp: pa.MSRP_Verified, title: pa.Product_Title_Verified, model: pa.Model_Number_Verified,
      upc: pa.UPC_GTIN_Verified,
    };
  }
  return { era: 'unknown' };
}

const EMPTYISH = /^(\s*|not\s*found|not\s*applicable|n\/a|none|null|undefined)$/i;
function isEmptyish(v) {
  if (v === null || v === undefined) return true;
  return EMPTYISH.test(String(v));
}

/** Parse a dimension that may be "32.313", "32 5/16", "43 15/16", "30" → number (inches) or null */
function parseDim(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const s = String(v).replace(/["”inches]+\s*$/i, '').trim();
  const frac = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (frac) return parseInt(frac[1], 10) + parseInt(frac[2], 10) / parseInt(frac[3], 10);
  const num = parseFloat(s.replace(/,/g, ''));
  return isFinite(num) ? num : null;
}

/** Best-effort data-source scenario from the stored rawPayload */
function deriveScenario(rp) {
  if (!rp) return 'unknown';
  const hasFerguson = !isEmptyish(rp.Ferguson_Title) || !isEmptyish(rp.Ferguson_Price) ||
    !isEmptyish(rp.Ferguson_Raw_Data) || !isEmptyish(rp.Ferguson_Brand);
  const hasWR = !isEmptyish(rp.Product_Description_Web_Retailer) || !isEmptyish(rp.Features_Web_Retailer) ||
    !isEmptyish(rp.Specification_Table) || !isEmptyish(rp.Web_Retailer_Key);
  if (hasFerguson && hasWR) return 'both_sources';
  if (hasFerguson) return 'ferguson_only';
  if (hasWR) return 'web_retailer_only';
  return 'no_sources';
}

/** Counter with bounded example capture */
function makeCheck(id, description) {
  return { id, description, count: 0, total: 0, examples: [],
    hit(example) { this.count++; if (this.examples.length < 15 && example) this.examples.push(example); },
    seen() { this.total++; },
  };
}

function finishChecks(checks) {
  const out = {};
  for (const c of Object.values(checks)) {
    out[c.id] = {
      description: c.description, flagged: c.count, scanned: c.total,
      rate: c.total ? +(100 * c.count / c.total).toFixed(2) : null,
      examples: c.examples,
    };
  }
  return out;
}

function saveReport(name, data) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`\n💾 saved → ${file}`);
}

function printSummary(title, checkResults) {
  console.log(`\n═══ ${title} ═══`);
  for (const [id, r] of Object.entries(checkResults)) {
    const rate = r.rate === null ? '—' : `${r.rate}%`;
    console.log(`  ${id}: ${r.flagged}/${r.scanned} (${rate})  ${r.description}`);
  }
}

module.exports = {
  connect, normalizePrimary, isEmptyish, parseDim, deriveScenario,
  makeCheck, finishChecks, saveReport, printSummary, OUT_DIR, RUN_DATE,
};
