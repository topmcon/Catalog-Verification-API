#!/usr/bin/env node
/**
 * AUDIT CONFIRM — re-audit gate after a pipeline fix
 * ==================================================
 * The audit (detect) tells us a product's verified fields are wrong. After we fix the
 * pipeline logic and deploy, this script runs the CONFIRM step for those products:
 *
 *   re-run verification on the stored payload (no push) → re-audit the fresh output →
 *   ONLY if the re-audit is clean does the API push the corrected output to Salesforce
 *   (via the normal verification webhook). A clean re-audit is the ONLY proof the fix worked.
 *
 * This calls the live endpoint POST /api/verify/salesforce/audit with mode=confirm. It looks
 * up each catalog's model name from Mongo so you only need to pass catalog IDs.
 *
 * SELECTION:
 *   --catalog=ID1,ID2,...   SF_Catalog_Id (or SF_Catalog_Name) values to confirm   (required)
 *
 * MODE:
 *   --mode=confirm          (default) re-run + re-audit + push-on-pass
 *   --mode=detect           identification only (same as the SF "Run AI Audit" button)
 *
 * SAFETY:
 *   Dry-run by DEFAULT — shows what WOULD be sent, makes NO API calls.
 *   Pass --execute to actually fire. confirm mode COSTS AI tokens (full re-verification)
 *   and, on a clean re-audit, WRITES corrected fields back to Salesforce.
 *
 * ENV:
 *   MONGODB_URI            (default mongodb://127.0.0.1:27017/catalog-verification)
 *   API_URL                (default https://verify.cxc-ai.com)
 *   SALESFORCE_API_KEY     required when --execute  (X-API-Key header; = WEBHOOK_SECRET on prod)
 *
 * Usage (on production server):
 *   node scripts/audit-confirm.js --catalog=NQ70M7770DS                 # dry run
 *   node scripts/audit-confirm.js --catalog=NQ70M7770DS --execute       # re-audit + push-on-pass
 *   node scripts/audit-confirm.js --catalog=a03...,a03... --mode=detect --execute
 */
'use strict';

const mongoose = require('mongoose');
const https = require('https');
const http = require('http');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';
const API_URL = process.env.API_URL || 'https://verify.cxc-ai.com';
const API_KEY = process.env.SALESFORCE_API_KEY || '';
const AUDIT_PATH = '/api/verify/salesforce/audit';

const C = { reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m' };
const c = (k, s) => `${C[k] || ''}${s}${C.reset}`;

function parseArgs(argv) {
  const a = { catalog: null, mode: 'confirm', execute: false };
  for (const raw of argv.slice(2)) {
    if (raw === '--execute') a.execute = true;
    else if (raw.startsWith('--catalog=')) a.catalog = raw.slice('--catalog='.length).split(',').map(s => s.trim()).filter(Boolean);
    else if (raw.startsWith('--mode=')) a.mode = raw.slice('--mode='.length).trim();
  }
  return a;
}

function postJson(urlStr, body, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === 'https:' ? https : http;
    const data = JSON.stringify(body);
    const req = lib.request(
      { method: 'POST', hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80), path: u.pathname + u.search,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers } },
      (res) => { let buf = ''; res.on('data', d => (buf += d)); res.on('end', () => resolve({ status: res.statusCode, body: buf })); }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.catalog || args.catalog.length === 0) {
    console.error(c('red', 'ERROR: --catalog=ID1,ID2,... is required'));
    process.exit(1);
  }
  if (args.mode !== 'confirm' && args.mode !== 'detect') {
    console.error(c('red', `ERROR: --mode must be 'confirm' or 'detect' (got '${args.mode}')`));
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  const col = mongoose.connection.collection('verification_jobs');

  // Resolve each catalog id/name to {sfCatalogId, sfCatalogName, lastTitle}
  const targets = [];
  for (const key of args.catalog) {
    const job = await col.findOne(
      { $or: [{ sfCatalogId: key }, { sfCatalogName: key }], status: 'completed', result: { $exists: true } },
      { sort: { createdAt: -1 }, projection: { sfCatalogId: 1, sfCatalogName: 1, 'result.Primary_Attributes.AI_Product_Title': 1 } }
    );
    if (!job) {
      console.log(c('yellow', `  ⚠ ${key}: no completed verification job found — confirm cannot re-run (would return not_found)`));
      continue;
    }
    targets.push({
      sfCatalogId: job.sfCatalogId,
      sfCatalogName: job.sfCatalogName,
      lastTitle: job.result && job.result.Primary_Attributes ? job.result.Primary_Attributes.AI_Product_Title : '(n/a)',
    });
  }

  console.log(c('bold', `\nAUDIT ${args.mode.toUpperCase()} — ${targets.length} product(s) ${args.execute ? c('green', '[EXECUTE]') : c('yellow', '[DRY RUN]')}`));
  for (const t of targets) {
    console.log(`  • ${c('cyan', t.sfCatalogName)} (${t.sfCatalogId})  current title: ${c('dim', t.lastTitle)}`);
  }

  if (!args.execute) {
    console.log(c('yellow', '\nDRY RUN — no API calls made. Re-run with --execute to fire.'));
    await mongoose.disconnect();
    return;
  }

  if (!API_KEY) {
    console.error(c('red', '\nERROR: SALESFORCE_API_KEY env is required with --execute'));
    await mongoose.disconnect();
    process.exit(1);
  }

  for (const t of targets) {
    try {
      const res = await postJson(`${API_URL}${AUDIT_PATH}`, { SF_Catalog_Id: t.sfCatalogId, SF_Catalog_Name: t.sfCatalogName, mode: args.mode }, { 'x-api-key': API_KEY });
      const ok = res.status >= 200 && res.status < 300;
      let auditId = '';
      try { auditId = JSON.parse(res.body).auditId || ''; } catch (_) {}
      console.log(`  ${ok ? c('green', '✓') : c('red', '✗')} ${t.sfCatalogName} → HTTP ${res.status}${auditId ? `  auditId=${auditId}` : ''}`);
    } catch (e) {
      console.log(`  ${c('red', '✗')} ${t.sfCatalogName} → ${e.message}`);
    }
  }

  console.log(c('dim', `\nResults post back to Salesforce via webhook. Check status: GET ${AUDIT_PATH}/status/<auditId>`));
  await mongoose.disconnect();
}

main().catch((e) => { console.error(c('red', 'FATAL: ' + e.message)); process.exit(1); });
