#!/usr/bin/env node
/**
 * VIEW QUALITY TRENDS — Show recent quality snapshots side-by-side
 * ================================================================
 * Reads from batch_quality_snapshots (populated by snapshot-batch-quality.js
 * cron). Pure read-only.
 *
 * Usage:
 *   node scripts/view-quality-trends.js              # last 24 hours
 *   node scripts/view-quality-trends.js --hours=72   # last 3 days
 *   node scripts/view-quality-trends.js --hours=168  # last week
 *   node scripts/view-quality-trends.js --regressions  # only show regressions
 */

'use strict';
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

const COLOR = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};
const c = (color, s) => `${COLOR[color] || ''}${s}${COLOR.reset}`;

function parseArgs(argv) {
  const args = { hours: 24, regressions: false };
  for (const raw of argv.slice(2)) {
    if (raw === '--regressions') args.regressions = true;
    const m = raw.match(/^--hours=(\d+)$/);
    if (m) args.hours = parseInt(m[1], 10);
  }
  return args;
}

const fmtEST = (d) => new Date(d).toLocaleString('en-US', {
  timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

function delta(curr, prev, betterIsHigher = true) {
  if (curr == null || prev == null) return c('dim', '   —');
  const d = curr - prev;
  if (Math.abs(d) < 0.5) return c('dim', '  ≈0');
  const isImprovement = (d > 0) === betterIsHigher;
  const arrow = d > 0 ? '↑' : '↓';
  const sign = d > 0 ? '+' : '';
  return c(isImprovement ? 'green' : 'red', `${arrow}${sign}${d.toFixed(1)}`);
}

(async () => {
  const args = parseArgs(process.argv);
  const since = new Date(Date.now() - args.hours * 3600 * 1000);

  try {
    await mongoose.connect(MONGODB_URI);
    const Snapshot = mongoose.model('Snapshot',
      new mongoose.Schema({}, { strict: false, collection: 'batch_quality_snapshots' }));

    const snaps = await Snapshot.find({ snapshotAt: { $gte: since } })
      .sort({ snapshotAt: 1 }).lean();

    if (!snaps.length) {
      console.log(c('yellow', `\nNo snapshots in last ${args.hours} hours.`));
      console.log(c('dim', `Make sure cron is running: */30 * * * * node scripts/snapshot-batch-quality.js\n`));
      return;
    }

    console.log('\n' + c('cyan', '═'.repeat(96)));
    console.log(c('cyan', `  📈 QUALITY TRENDS — last ${args.hours} hours (${snaps.length} snapshots)`));
    console.log(c('cyan', '═'.repeat(96)));

    // Aggregate roll-up for the period
    const totalJobs = snaps.reduce((a, s) => a + (s.jobCount || 0), 0);
    const totalCost = snaps.reduce((a, s) => a + (s.cost?.totalUSD || 0), 0);
    const totalCalls = snaps.reduce((a, s) => a + (s.cost?.callCount || 0), 0);
    const totalPhaseB = snaps.reduce((a, s) => a + (s.phaseB?.invoked || 0), 0);
    const avgConsensus = snaps.filter((s) => s.consensus?.structuredAgreedPct != null);
    const consensusAvg = avgConsensus.length
      ? avgConsensus.reduce((a, s) => a + s.consensus.structuredAgreedPct, 0) / avgConsensus.length
      : null;

    console.log(c('bold', '\n  PERIOD SUMMARY'));
    console.log(`    Jobs processed:       ${totalJobs}`);
    console.log(`    Total AI cost:        $${totalCost.toFixed(4)}  (${totalCalls} calls)`);
    console.log(`    Phase B invocations:  ${totalPhaseB} (${((totalPhaseB / Math.max(totalJobs, 1)) * 100).toFixed(1)}%)`);
    if (consensusAvg != null) console.log(`    Avg structured consensus: ${consensusAvg.toFixed(1)}%`);

    // Per-snapshot table
    console.log(c('bold', '\n  TIMELINE'));
    const hdr = '  ' +
      'Time'.padEnd(18) +
      'Jobs'.padStart(5) +
      'Success'.padStart(9) +
      'Score'.padStart(7) +
      'Cons%'.padStart(8) +
      'Struct%'.padStart(9) +
      'PhaseB'.padStart(8) +
      'Cost$'.padStart(9) +
      'p95(s)'.padStart(8);
    console.log(c('dim', hdr));
    console.log(c('dim', '  ' + '─'.repeat(94)));

    const rows = [];
    for (let i = 0; i < snaps.length; i++) {
      const s = snaps[i];
      const prev = i > 0 ? snaps[i - 1] : null;
      const score = s.quality?.avgVerificationScore;
      const successRate = s.quality?.successRate;
      const cons = s.consensus?.overallAgreedPct;
      const struct = s.consensus?.structuredAgreedPct;
      const pbRate = s.phaseB?.invokedRatePct || 0;
      const cost = s.cost?.totalUSD || 0;
      const allLat = Object.values(s.latency || {}).map((l) => l.p95 || 0);
      const p95 = allLat.length ? Math.max(...allLat) / 1000 : 0;

      rows.push({ s, prev, score, successRate, cons, struct, pbRate, cost, p95 });
    }

    let regressionsFound = 0;
    for (const r of rows) {
      const isReg = r.prev && (
        (r.struct != null && r.prev.consensus?.structuredAgreedPct != null && r.struct - r.prev.consensus.structuredAgreedPct < -5) ||
        (r.successRate != null && r.prev.quality?.successRate != null && r.successRate - r.prev.quality.successRate < -5) ||
        (r.score != null && r.prev.quality?.avgVerificationScore != null && r.score - r.prev.quality.avgVerificationScore < -5)
      );
      if (args.regressions && !isReg) continue;
      if (isReg) regressionsFound++;

      const marker = isReg ? c('red', '⚠') : ' ';
      const line = `${marker} ` +
        fmtEST(r.s.snapshotAt).padEnd(18) +
        (r.s.jobCount || 0).toString().padStart(5) +
        (r.successRate != null ? r.successRate.toFixed(1) + '%' : '—').padStart(9) +
        (r.score != null ? r.score.toFixed(1) : '—').padStart(7) +
        (r.cons != null ? r.cons.toFixed(1) + '%' : '—').padStart(8) +
        (r.struct != null ? r.struct.toFixed(1) + '%' : '—').padStart(9) +
        (r.pbRate.toFixed(0) + '%').padStart(8) +
        ('$' + r.cost.toFixed(3)).padStart(9) +
        r.p95.toFixed(1).padStart(8);
      console.log(line);
    }

    if (args.regressions && regressionsFound === 0) {
      console.log(c('green', '  ✓ No regressions detected in this window.'));
    }

    // Most recent vs oldest comparison (drift detection)
    if (snaps.length >= 2) {
      const first = snaps[0], last = snaps[snaps.length - 1];
      console.log(c('bold', '\n  DRIFT (oldest → newest)'));
      const dCons = delta(last.consensus?.structuredAgreedPct, first.consensus?.structuredAgreedPct, true);
      const dScore = delta(last.quality?.avgVerificationScore, first.quality?.avgVerificationScore, true);
      const dSucc = delta(last.quality?.successRate, first.quality?.successRate, true);
      const dCost = delta(last.cost?.avgPerJobUSD * 1000, first.cost?.avgPerJobUSD * 1000, false); // x1000 for visibility, lower better
      console.log(`    Structured consensus:  ${dCons}  pts`);
      console.log(`    Avg verification score: ${dScore}  pts`);
      console.log(`    Success rate:          ${dSucc}  pts`);
      console.log(`    Cost per job (mil):    ${dCost}  USD/1000`);
    }

    // Aggregate weakest fields across the window
    const fieldAgreement = {};
    for (const s of snaps) {
      for (const f of (s.consensus?.weakestFields || [])) {
        if (!fieldAgreement[f.field]) fieldAgreement[f.field] = { agreed: 0, total: 0 };
        fieldAgreement[f.field].agreed += f.agreed || 0;
        fieldAgreement[f.field].total += f.total || 0;
      }
    }
    const ranked = Object.entries(fieldAgreement)
      .map(([f, s]) => ({ field: f, pct: s.total ? (s.agreed / s.total) * 100 : 0, agreed: s.agreed, total: s.total }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5);
    if (ranked.length) {
      console.log(c('bold', '\n  PERSISTENT WEAKEST STRUCTURED FIELDS (across window)'));
      for (const r of ranked) {
        const color = r.pct >= 85 ? 'green' : r.pct >= 70 ? 'yellow' : 'red';
        console.log(`    ${r.field.padEnd(30)} ${c(color, r.pct.toFixed(1) + '%').padStart(20)}  (${r.agreed}/${r.total})`);
      }
    }
    console.log('');
  } catch (err) {
    console.error(c('red', `\n❌ Error: ${err.message}\n`));
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
