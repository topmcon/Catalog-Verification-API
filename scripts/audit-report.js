#!/usr/bin/env node
/**
 * AUDIT REPORT — review audit results (our side)
 * ==============================================
 * When AUDIT_MODE=detect|confirm, inbound SF verification calls are rerouted to the audit
 * protocol and the results are stored in the `audit_jobs` collection (NOT sent to Salesforce,
 * which has no audit branch). This script renders those results in a readable table.
 *
 * FILTERS:
 *   --mismatches            Only show audits that found at least one MISMATCH (default: show all)
 *   --mode=detect|confirm   Only this audit mode
 *   --catalog=ID1,ID2       Only these SF_Catalog_Id / SF_Catalog_Name values
 *   --since=YYYY-MM-DD      Audits created on/after this date (UTC)
 *   --limit=N               Cap rows (default 50)
 *   --json                  Emit raw JSON instead of the table
 *
 * ENV:
 *   MONGODB_URI   (default mongodb://127.0.0.1:27017/catalog-verification)
 *
 * Usage (on production server):
 *   node scripts/audit-report.js --mismatches
 *   node scripts/audit-report.js --catalog=NQ70M7770DS
 *   node scripts/audit-report.js --since=2026-06-06 --limit=100
 */
'use strict';

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';
const C = { reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m' };
const c = (k, s) => `${C[k] || ''}${s}${C.reset}`;

function parseArgs(argv) {
  const a = { mismatches: false, mode: null, catalog: null, since: null, limit: 50, json: false };
  for (const raw of argv.slice(2)) {
    if (raw === '--mismatches') a.mismatches = true;
    else if (raw === '--json') a.json = true;
    else if (raw.startsWith('--mode=')) a.mode = raw.slice(7).trim();
    else if (raw.startsWith('--catalog=')) a.catalog = raw.slice(10).split(',').map(s => s.trim()).filter(Boolean);
    else if (raw.startsWith('--since=')) a.since = new Date(raw.slice(8).trim() + 'T00:00:00Z');
    else if (raw.startsWith('--limit=')) a.limit = parseInt(raw.slice(8), 10) || 50;
  }
  return a;
}

const STATUS_COLOR = { MATCH: 'green', MISMATCH: 'red', UNSUPPORTED: 'dim' };

async function main() {
  const args = parseArgs(process.argv);
  await mongoose.connect(MONGODB_URI);
  const col = mongoose.connection.collection('audit_jobs');

  const q = {};
  if (args.mode) q.mode = args.mode;
  if (args.catalog) q.$or = [{ sfCatalogId: { $in: args.catalog } }, { sfCatalogName: { $in: args.catalog } }];
  if (args.since && !isNaN(args.since)) q.createdAt = { $gte: args.since };
  if (args.mismatches) q['report.mismatches_found'] = { $gt: 0 };

  const rows = await col.find(q).sort({ createdAt: -1 }).limit(args.limit).toArray();

  if (args.json) {
    console.log(JSON.stringify(rows, null, 2));
    await mongoose.disconnect();
    return;
  }

  console.log(c('bold', `\nAUDIT RESULTS — ${rows.length} job(s)${args.mismatches ? ' with mismatches' : ''}\n`));

  let totalMismatch = 0;
  for (const r of rows) {
    const rep = r.report || {};
    const overall = rep.overall_status || r.status;
    const overallColor = overall === 'MISMATCH_FOUND' ? 'red' : overall === 'MATCH' ? 'green' : 'yellow';
    const pushTag = r.mode === 'confirm' ? (r.confirmPushed ? c('green', ' [PUSHED]') : c('yellow', ' [not pushed]')) : '';
    console.log(
      `${c('cyan', r.sfCatalogName || r.sfCatalogId)} ${c('dim', '(' + r.sfCatalogId + ')')}  ` +
      `${c('dim', r.mode)} → ${c(overallColor, overall)}${pushTag}  ${c('dim', new Date(r.createdAt).toISOString())}`
    );

    if (r.status === 'not_found') {
      console.log(c('dim', `   (${r.error || 'nothing to audit'})`));
    } else if (r.status === 'failed') {
      console.log(c('red', `   ERROR: ${r.error || 'unknown'}`));
    }

    const fields = rep.fields || {};
    for (const fname of Object.keys(fields)) {
      const v = fields[fname] || {};
      if (v.status === 'MATCH') continue; // show only problems / unknowns in the table
      if (v.status === 'MISMATCH') totalMismatch++;
      const sc = STATUS_COLOR[v.status] || 'reset';
      let line = `   ${c(sc, v.status.padEnd(11))} ${fname}: claimed ${c('yellow', JSON.stringify(v.claimed))}`;
      if (v.status === 'MISMATCH') line += ` → correct ${c('green', JSON.stringify(v.correct))}`;
      console.log(line);
      if (v.evidence) console.log(c('dim', `        evidence: ${v.evidence}`));
      if (v.root_cause) console.log(c('dim', `        root cause: ${v.root_cause}`));
      if (v.note) console.log(c('dim', `        note: ${v.note}`));
    }
    console.log('');
  }

  console.log(c('bold', `Total field-level mismatches shown: ${totalMismatch}`));
  console.log(c('dim', 'Use --mismatches to filter, --json for raw output, --catalog=ID to drill in.'));
  await mongoose.disconnect();
}

main().catch((e) => { console.error(c('red', 'FATAL: ' + e.message)); process.exit(1); });
