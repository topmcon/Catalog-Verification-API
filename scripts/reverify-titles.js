#!/usr/bin/env node
/**
 * RE-VERIFY TITLES — Batch re-run of stored SF payloads through current logic
 * ===========================================================================
 * Triggered by user prompt: "re-run titles" / "reverify titles"
 *
 * Purpose: After a title-logic fix (e.g. Finding #068 color-over-finish), re-run
 * the products whose stored titles the fix would change. Reads each job's stored
 * raw SF payload (request.rawPayload) from Mongo and re-POSTs it to the live
 * verification endpoint, then reports old title → new title diffs.
 *
 * SELECTION MODES (choose one; --bad-finish is the default):
 *   --bad-finish            Jobs whose AI_Product_Title ends in a BARE finish word
 *                           (Brushed / Matte / Satin / Polished / ...) — exactly the
 *                           titles the #068 fix corrects. (default)
 *   --catalog=ID1,ID2,...   Specific SF_Catalog_Id (or SF_Catalog_Name) values
 *   --category=Oven,Range   Re-run jobs whose verified category is in this list
 *   --since=2026-05-01      Jobs created on/after this date (UTC)
 *   --limit=N               Cap the number of jobs (default 100)
 *
 * SAFETY:
 *   Dry-run by DEFAULT — lists what WOULD be re-run, makes NO API calls.
 *   Pass --execute to actually POST. --concurrency=N (default 3) throttles load/cost.
 *
 * ENV:
 *   MONGODB_URI            (default mongodb://127.0.0.1:27017/catalog-verification)
 *   API_URL                (default https://verify.cxc-ai.com)
 *   SALESFORCE_API_KEY     required when --execute (X-API-Key header)
 *
 * Usage (on production server):
 *   node scripts/reverify-titles.js --bad-finish                 # dry run
 *   node scripts/reverify-titles.js --bad-finish --execute       # do it
 *   node scripts/reverify-titles.js --catalog=NQ70M7770DS --execute
 *   node scripts/reverify-titles.js --category=Oven,Range --limit=50 --execute
 */
'use strict';

const mongoose = require('mongoose');
const https = require('https');
const http = require('http');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';
const API_URL = process.env.API_URL || 'https://verify.cxc-ai.com';
const API_KEY = process.env.SALESFORCE_API_KEY || '';
const VERIFY_PATH = '/api/verify/salesforce';

// Bare, incomplete finish adjectives — must mirror INCOMPLETE_FINISH_WORDS in
// dual-ai-verification.service.ts smartAppearance().
const BARE_FINISH = '(brushed|matte|satin|polished|glossy|gloss|textured|smooth|honed|hammered|distressed|antique|aged|oiled)';
// Title pattern: "... <bare finish> - <model>"  OR  "... <bare finish>" at end.
const BAD_FINISH_TITLE = new RegExp(`\\b${BARE_FINISH}(\\s+-\\s+\\S.*)?\\s*$`, 'i');

const C = { reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m' };
const c = (k, s) => `${C[k] || ''}${s}${C.reset}`;

function parseArgs(argv) {
  const a = { mode: null, catalog: null, category: null, since: null, limit: 100, execute: false, concurrency: 3 };
  for (const raw of argv.slice(2)) {
    if (raw === '--bad-finish') a.mode = 'bad-finish';
    else if (raw === '--execute') a.execute = true;
    else {
      const m = raw.match(/^--(\w[\w-]*)=(.+)$/);
      if (!m) continue;
      const [, k, v] = m;
      if (k === 'catalog') { a.mode = 'catalog'; a.catalog = v.split(',').map(s => s.trim()).filter(Boolean); }
      else if (k === 'category') { a.mode = 'category'; a.category = v.split(',').map(s => s.trim()).filter(Boolean); }
      else if (k === 'since') { a.mode = a.mode || 'since'; a.since = new Date(v); }
      else if (k === 'limit') a.limit = parseInt(v, 10) || 100;
      else if (k === 'concurrency') a.concurrency = Math.max(1, parseInt(v, 10) || 3);
    }
  }
  if (!a.mode) a.mode = 'bad-finish';
  return a;
}

function buildQuery(args) {
  const q = {};
  if (args.since instanceof Date && !isNaN(args.since)) q.createdAt = { $gte: args.since };
  if (args.mode === 'catalog') {
    q.$or = [
      { 'request.SF_Catalog_Id': { $in: args.catalog } },
      { 'request.SF_Catalog_Name': { $in: args.catalog } },
    ];
  } else if (args.mode === 'category') {
    q['response.AI_Product_Category'] = { $in: args.category.map(s => new RegExp(`^${s}$`, 'i')) };
  } else if (args.mode === 'bad-finish') {
    q['response.AI_Product_Title'] = { $regex: BAD_FINISH_TITLE };
  }
  // Only jobs we can actually replay
  q['request.rawPayload'] = { $exists: true, $ne: null };
  return q;
}

function postVerify(payload) {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const url = new URL(VERIFY_PATH, API_URL);
    const lib = url.protocol === 'http:' ? http : https;
    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'http:' ? 80 : 443),
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'X-API-Key': API_KEY },
      timeout: 180000,
    }, (res) => {
      let data = '';
      res.on('data', (ch) => data += ch);
      res.on('end', () => {
        try { resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json: JSON.parse(data) }); }
        catch { resolve({ ok: false, status: res.statusCode, json: null, raw: data.slice(0, 200) }); }
      });
    });
    req.on('error', (e) => resolve({ ok: false, status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, error: 'timeout' }); });
    req.write(body);
    req.end();
  });
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let idx = 0;
  async function next() {
    const i = idx++;
    if (i >= items.length) return;
    results[i] = await worker(items[i], i);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
  return results;
}

(async () => {
  const args = parseArgs(process.argv);
  await mongoose.connect(MONGODB_URI);
  const coll = mongoose.connection.collection('api_tracker');

  const query = buildQuery(args);
  const docs = await coll
    .find(query, { projection: { 'request.rawPayload': 1, 'request.SF_Catalog_Id': 1, 'request.SF_Catalog_Name': 1, 'response.AI_Product_Title': 1, 'response.AI_Product_Category': 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(args.limit)
    .toArray();

  console.log(c('bold', `\n🔁 RE-VERIFY TITLES`));
  console.log(`Mode: ${c('cyan', args.mode)}   Matches: ${c('cyan', docs.length)} (limit ${args.limit})   API: ${API_URL}`);
  console.log(args.execute ? c('yellow', '⚠️  EXECUTE MODE — will POST to the live API\n') : c('dim', 'DRY RUN — no API calls (pass --execute to run)\n'));

  if (docs.length === 0) { console.log('Nothing matched. Done.'); await mongoose.disconnect(); return; }

  // Preview list
  docs.forEach((d, i) => {
    const id = d.request?.SF_Catalog_Name || d.request?.SF_Catalog_Id || '(no id)';
    console.log(`${String(i + 1).padStart(3)}. ${c('dim', (d.response?.AI_Product_Category || '?').padEnd(14))} ${id.padEnd(22)} ${c('yellow', d.response?.AI_Product_Title || '(no title)')}`);
  });

  if (!args.execute) {
    if (!API_KEY) console.log(c('dim', '\n(note: SALESFORCE_API_KEY not set in this shell — required for --execute)'));
    console.log(c('dim', `\nRe-run with --execute to reprocess these ${docs.length} job(s).`));
    await mongoose.disconnect();
    return;
  }

  if (!API_KEY) { console.log(c('red', '\n❌ SALESFORCE_API_KEY env var is required for --execute. Aborting.')); await mongoose.disconnect(); process.exit(1); }

  console.log(c('bold', `\nReprocessing ${docs.length} job(s) at concurrency ${args.concurrency}...\n`));
  let changed = 0, same = 0, failed = 0;
  await runPool(docs, args.concurrency, async (d, i) => {
    const id = d.request?.SF_Catalog_Name || d.request?.SF_Catalog_Id || `#${i}`;
    const oldTitle = d.response?.AI_Product_Title || '';
    const r = await postVerify(d.request.rawPayload);
    if (!r.ok) { failed++; console.log(`${c('red', '✗')} ${id} — HTTP ${r.status} ${r.error || r.raw || ''}`); return; }
    const newTitle = r.json?.data?.Primary_Attributes?.AI_Product_Title || r.json?.data?.AI_Product_Title || '(none)';
    if (newTitle !== oldTitle) {
      changed++;
      console.log(`${c('green', '✓ CHANGED')} ${id}\n     old: ${c('dim', oldTitle)}\n     new: ${c('green', newTitle)}`);
    } else {
      same++;
      console.log(`${c('dim', '= same   ')} ${id}  ${c('dim', newTitle)}`);
    }
  });

  console.log(c('bold', `\n── Summary ──`));
  console.log(`Titles changed: ${c('green', changed)}   Unchanged: ${same}   Failed: ${c(failed ? 'red' : 'dim', failed)}   Total: ${docs.length}`);
  await mongoose.disconnect();
})().catch((e) => { console.error('Fatal:', e); process.exit(1); });
