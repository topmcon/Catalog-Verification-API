#!/usr/bin/env node
/**
 * VERIFY BATCH — Quality / Cost Monitoring Script
 * ================================================
 * Triggered by user prompt: "verify batch"
 *
 * Analyzes the most recent batch of verification jobs for:
 *   • Status & success rates (completed / failed / processing / pending)
 *   • Response correctness (empty lookups, missing critical fields,
 *     category/department mismatches with raw SF data)
 *   • Final-review failures and severity-flagged issues
 *   • Title/description anomalies (duplication, schema mismatches)
 *   • Webhook delivery & SF acknowledgment
 *   • AI cost breakdown (per provider, per task type, per job)
 *   • Processing time outliers
 *   • Self-healing activity in the same window
 *
 * Usage:
 *   node scripts/verify-batch.js                   # auto-detect last batch
 *   node scripts/verify-batch.js --size=54         # treat last 54 jobs as batch
 *   node scripts/verify-batch.js --minutes=15      # last 15 min window
 *   node scripts/verify-batch.js --catalog=ALT...  # single SF catalog id/name
 *
 * Auto-detect logic: looks back up to 60 minutes for the most recent
 * cluster of jobs with no gap >5 minutes between consecutive createdAt
 * timestamps; that contiguous cluster is "the batch".
 */

'use strict';

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

// ───────────────────────────── arg parsing ─────────────────────────────
function parseArgs(argv) {
  const args = { size: null, minutes: null, catalog: null };
  for (const raw of argv.slice(2)) {
    const m = raw.match(/^--(\w+)=(.+)$/);
    if (!m) continue;
    if (m[1] === 'size') args.size = parseInt(m[2], 10);
    else if (m[1] === 'minutes') args.minutes = parseInt(m[2], 10);
    else if (m[1] === 'catalog') args.catalog = m[2];
  }
  return args;
}

// ───────────────────────────── helpers ─────────────────────────────
const COLOR = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
};
const c = (color, s) => `${COLOR[color] || ''}${s}${COLOR.reset}`;

const fmtUSD = (n) => `$${(n || 0).toFixed(4)}`;
const fmtMs = (n) => n != null ? `${(n / 1000).toFixed(1)}s` : '—';
const fmtPct = (num, den) => den ? `${((num / den) * 100).toFixed(1)}%` : '—';
const fmtEST = (d) => new Date(d).toLocaleString('en-US', {
  timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'medium',
});
const truncate = (s, n) => {
  if (!s) return '';
  s = String(s);
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
};

// ───────────────────────────── batch detection ─────────────────────────────
async function detectBatch(VerificationJob, args) {
  if (args.catalog) {
    const job = await VerificationJob.findOne({
      $or: [{ sfCatalogName: args.catalog }, { sfCatalogId: args.catalog }],
    }).sort({ createdAt: -1 }).lean();
    if (!job) throw new Error(`No job found for catalog "${args.catalog}"`);
    return { jobs: [job], label: `single job (${args.catalog})` };
  }

  const lookbackMin = args.minutes || 60;
  const since = new Date(Date.now() - lookbackMin * 60 * 1000);
  const recent = await VerificationJob.find({ createdAt: { $gte: since } })
    .sort({ createdAt: -1 })
    .lean();

  if (!recent.length) {
    return { jobs: [], label: `no jobs in last ${lookbackMin} min` };
  }

  if (args.size) {
    return { jobs: recent.slice(0, args.size), label: `last ${args.size} jobs` };
  }
  if (args.minutes) {
    return { jobs: recent, label: `last ${args.minutes} min (${recent.length} jobs)` };
  }

  // Auto-detect contiguous cluster (no gap >5 min between consecutive jobs)
  const cluster = [recent[0]];
  for (let i = 1; i < recent.length; i++) {
    const gapMs = new Date(recent[i - 1].createdAt) - new Date(recent[i].createdAt);
    if (gapMs > 5 * 60 * 1000) break;
    cluster.push(recent[i]);
  }
  return { jobs: cluster, label: `auto-detected batch (${cluster.length} jobs)` };
}

// ───────────────────────────── job analysis ─────────────────────────────
function analyzeJob(job) {
  const issues = [];
  const r = job.result || {};
  const pa = r.Primary_Attributes || {};
  const fr = r.Final_Review || {};
  const v = r.Verification || {};
  const raw = job.rawPayload || {};

  // 1. Job-level status
  if (job.status === 'failed') issues.push({ sev: 'CRIT', msg: `Job FAILED: ${truncate(job.error, 80)}` });
  if (job.status === 'processing' || job.status === 'pending') {
    const ageMin = (Date.now() - new Date(job.createdAt)) / 60000;
    if (ageMin > 10) issues.push({ sev: 'CRIT', msg: `Stuck in ${job.status} for ${ageMin.toFixed(0)} min` });
  }

  // 2. Final review failures
  if (fr.final_review_status === 'FAIL') {
    issues.push({ sev: 'HIGH', msg: `Final review FAIL (${fr.issues_flagged || 0} issues)` });
  }
  if (Array.isArray(fr.validation_issues)) {
    const high = fr.validation_issues.filter((i) => i.severity === 'HIGH').length;
    if (high) issues.push({ sev: 'HIGH', msg: `${high} HIGH-severity validation issue(s)` });
  }

  // 3. Verification status
  if (r.Verification_Status === 'Manual Review Required') {
    issues.push({ sev: 'HIGH', msg: `Manual review required: ${truncate(r.Verification_Notes, 80)}` });
  }

  // 4. Empty critical lookups
  if (pa.AI_Product_Category && !pa.AI_Product_Category_Lookup) {
    issues.push({ sev: 'HIGH', msg: `Empty Category_Lookup (category="${pa.AI_Product_Category}" not in picklist)` });
  }
  if (pa.AI_Brand && !pa.AI_Brand_Lookup) {
    issues.push({ sev: 'MED', msg: `Empty Brand_Lookup for "${pa.AI_Brand}"` });
  }
  if (pa.AI_Style && !pa.AI_Style_Lookup) {
    issues.push({ sev: 'MED', msg: `Empty Style_Lookup for "${pa.AI_Style}"` });
  }

  // 5. Category mismatch with raw SF data (informational)
  const rawCat = (raw.Category_Legacy || raw.Web_Retailer_Category || '').toString();
  const aiCat = (pa.AI_Product_Category || '').toString();
  if (rawCat && aiCat) {
    const rawNorm = rawCat.toLowerCase().replace(/s$/, '');
    const aiNorm = aiCat.toLowerCase().replace(/s$/, '');
    if (rawNorm !== aiNorm && !rawNorm.includes(aiNorm) && !aiNorm.includes(rawNorm)) {
      issues.push({ sev: 'INFO', msg: `Category override: SF="${rawCat}" → AI="${aiCat}"` });
    }
  }

  // 6. Title anomalies
  const title = pa.AI_Product_Title || '';
  if (title) {
    // Duplicate consecutive words (e.g., "Tub Filler Tub Filler")
    const dup = title.match(/\b(\w[\w-]*(?:\s+\w[\w-]*){0,2})\s+\1\b/i);
    if (dup) issues.push({ sev: 'HIGH', msg: `Title duplication: "${dup[1]}"` });
    if (title.length < 30) issues.push({ sev: 'MED', msg: `Title very short (${title.length} chars)` });
    if (title.length > 120) issues.push({ sev: 'MED', msg: `Title very long (${title.length} chars)` });
  } else if (job.status === 'completed') {
    issues.push({ sev: 'HIGH', msg: 'Empty AI_Product_Title' });
  }

  // 7. Webhook delivery
  if (job.status === 'completed' && job.webhookSuccess === false) {
    issues.push({ sev: 'HIGH', msg: `Webhook delivery FAILED (${job.webhookAttempts} attempts)` });
  }
  if (job.status === 'completed' && job.webhookSuccess && job.salesforceAcknowledged === false) {
    issues.push({ sev: 'MED', msg: 'SF did NOT acknowledge webhook' });
  }
  if (job.salesforceProcessed === false && job.salesforceError) {
    issues.push({ sev: 'HIGH', msg: `SF processing error: ${truncate(job.salesforceError, 80)}` });
  }

  // 8. Processing time
  if (job.processingTimeMs > 240000) {
    issues.push({ sev: 'MED', msg: `Slow processing: ${fmtMs(job.processingTimeMs)}` });
  }

  // 9. Verification score anomalies
  if (typeof v.verification_score === 'number' && v.verification_score < 70) {
    issues.push({ sev: 'MED', msg: `Low verification score: ${v.verification_score}` });
  }

  return issues;
}

// ───────────────────────────── cost lookup ─────────────────────────────
async function getCostsForJobs(AIUsage, jobs) {
  if (!jobs.length) return { totalCost: 0, byProvider: {}, byTask: {}, byJob: {}, totalCalls: 0, raw: [] };

  const earliest = jobs.reduce((min, j) => {
    const t = new Date(j.createdAt);
    return t < min ? t : min;
  }, new Date());
  const latest = jobs.reduce((max, j) => {
    const t = new Date(j.completedAt || j.updatedAt || j.createdAt);
    return t > max ? t : max;
  }, new Date(0));

  const productIds = jobs.map((j) => j.sfCatalogId).filter(Boolean);
  const usage = await AIUsage.find({
    requestTimestamp: { $gte: new Date(earliest.getTime() - 60000), $lte: new Date(latest.getTime() + 60000) },
    productId: { $in: productIds },
  }).lean();

  const totals = { totalCost: 0, byProvider: {}, byTask: {}, byJob: {}, totalCalls: usage.length, raw: usage };
  for (const u of usage) {
    totals.totalCost += u.totalCost || 0;
    totals.byProvider[u.provider] = (totals.byProvider[u.provider] || 0) + (u.totalCost || 0);
    totals.byTask[u.taskType] = (totals.byTask[u.taskType] || 0) + (u.totalCost || 0);
    if (u.productId) totals.byJob[u.productId] = (totals.byJob[u.productId] || 0) + (u.totalCost || 0);
  }
  return totals;
}

// ───────────────────────────── reporting ─────────────────────────────
function header(title) {
  console.log('\n' + c('cyan', '═'.repeat(72)));
  console.log(c('cyan', '  ' + title));
  console.log(c('cyan', '═'.repeat(72)));
}

function printSummary(jobs, label) {
  header('🔍 VERIFY BATCH — Quality & Cost Report');
  console.log(`  Batch: ${c('bold', label)}`);
  if (jobs.length) {
    console.log(`  Window: ${fmtEST(jobs[jobs.length - 1].createdAt)} → ${fmtEST(jobs[0].createdAt)} EST`);
  }
  console.log('');
}

function printStatusBreakdown(jobs) {
  header('📊 STATUS BREAKDOWN');
  const buckets = { completed: 0, failed: 0, processing: 0, pending: 0 };
  for (const j of jobs) buckets[j.status] = (buckets[j.status] || 0) + 1;
  const total = jobs.length;

  const row = (label, n, color) => {
    const bar = '█'.repeat(Math.round((n / Math.max(total, 1)) * 30));
    console.log(`  ${label.padEnd(11)} ${c(color, n.toString().padStart(4))} (${fmtPct(n, total).padStart(6)})  ${c(color, bar)}`);
  };
  row('Completed', buckets.completed, 'green');
  row('Failed',    buckets.failed,    'red');
  row('Processing', buckets.processing, 'yellow');
  row('Pending',   buckets.pending,   'dim');
  console.log(`  ${c('bold', 'TOTAL'.padEnd(11))} ${c('bold', total.toString().padStart(4))}`);

  const completed = jobs.filter((j) => j.status === 'completed');
  if (completed.length) {
    const times = completed.map((j) => j.processingTimeMs || 0).filter((t) => t > 0);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times), max = Math.max(...times);
    console.log('');
    console.log(`  Processing time — avg ${fmtMs(avg)} | min ${fmtMs(min)} | max ${fmtMs(max)}`);
  }
}

function printQualityMetrics(jobs) {
  header('✅ QUALITY METRICS');
  const completed = jobs.filter((j) => j.status === 'completed');
  if (!completed.length) { console.log('  No completed jobs to analyze.'); return; }

  let manualReview = 0, finalReviewFail = 0, emptyCatLookup = 0, titleDup = 0;
  let webhookFail = 0, sfNotAcked = 0, sfErrored = 0;
  let totalScore = 0, scoreCount = 0;

  for (const j of completed) {
    const r = j.result || {};
    const pa = r.Primary_Attributes || {};
    const fr = r.Final_Review || {};
    const v = r.Verification || {};
    if (r.Verification_Status === 'Manual Review Required') manualReview++;
    if (fr.final_review_status === 'FAIL') finalReviewFail++;
    if (pa.AI_Product_Category && !pa.AI_Product_Category_Lookup) emptyCatLookup++;
    const t = pa.AI_Product_Title || '';
    if (t && /\b(\w[\w-]*(?:\s+\w[\w-]*){0,2})\s+\1\b/i.test(t)) titleDup++;
    if (j.webhookSuccess === false) webhookFail++;
    if (j.webhookSuccess && j.salesforceAcknowledged === false) sfNotAcked++;
    if (j.salesforceProcessed === false) sfErrored++;
    if (typeof v.verification_score === 'number') { totalScore += v.verification_score; scoreCount++; }
  }

  const row = (label, n, total, badIfNonZero = true) => {
    const color = n === 0 ? 'green' : badIfNonZero ? 'red' : 'yellow';
    console.log(`  ${label.padEnd(38)} ${c(color, n.toString().padStart(3))} / ${total} (${fmtPct(n, total)})`);
  };
  row('Manual Review Required',    manualReview, completed.length);
  row('Final Review = FAIL',       finalReviewFail, completed.length);
  row('Empty Category Lookup ID',  emptyCatLookup, completed.length);
  row('Title Duplication Detected', titleDup, completed.length);
  row('Webhook Delivery Failed',   webhookFail, completed.length);
  row('SF Did Not Acknowledge',    sfNotAcked, completed.length);
  row('SF Reported Processing Error', sfErrored, completed.length);
  if (scoreCount) {
    const avg = totalScore / scoreCount;
    const color = avg >= 85 ? 'green' : avg >= 70 ? 'yellow' : 'red';
    console.log(`  ${'Avg Verification Score'.padEnd(38)} ${c(color, avg.toFixed(1).padStart(5))}`);
  }
}

function printIssues(jobs) {
  header('⚠️  PER-JOB ISSUES (jobs with anomalies)');
  let any = false;
  for (const j of jobs) {
    const issues = analyzeJob(j);
    if (!issues.length) continue;
    any = true;
    const cat = (j.result && j.result.Primary_Attributes && j.result.Primary_Attributes.AI_Product_Category) || '?';
    console.log('');
    console.log(`  ${c('bold', j.sfCatalogName || j.sfCatalogId)} — ${c('dim', truncate(cat, 30))}`);
    for (const i of issues) {
      const color = i.sev === 'CRIT' ? 'red' : i.sev === 'HIGH' ? 'red' : i.sev === 'MED' ? 'yellow' : 'dim';
      console.log(`    ${c(color, '[' + i.sev.padEnd(4) + ']')} ${i.msg}`);
    }
  }
  if (!any) console.log(`  ${c('green', '✓ No anomalies detected — all jobs look clean.')}`);
}

function printCosts(costs, jobs) {
  header('💰 AI COST BREAKDOWN');
  if (costs.totalCalls === 0) {
    console.log(`  ${c('dim', '(No AI usage records found for this batch — cost tracking may not be wired for these task types.)')}`);
    return;
  }
  const completed = jobs.filter((j) => j.status === 'completed').length || jobs.length;
  console.log(`  Total AI calls: ${c('bold', costs.totalCalls)}`);
  console.log(`  Total cost:     ${c('bold', fmtUSD(costs.totalCost))}`);
  console.log(`  Avg / job:      ${fmtUSD(costs.totalCost / Math.max(completed, 1))}`);
  console.log(`  Avg / call:     ${fmtUSD(costs.totalCost / Math.max(costs.totalCalls, 1))}`);

  console.log('\n  ' + c('bold', 'By Provider:'));
  for (const [k, v] of Object.entries(costs.byProvider).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k.padEnd(12)} ${fmtUSD(v).padStart(10)} (${fmtPct(v, costs.totalCost)})`);
  }
  console.log('\n  ' + c('bold', 'By Task Type:'));
  for (const [k, v] of Object.entries(costs.byTask).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k.padEnd(22)} ${fmtUSD(v).padStart(10)} (${fmtPct(v, costs.totalCost)})`);
  }

  // Top 5 most expensive jobs
  const topJobs = Object.entries(costs.byJob).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (topJobs.length) {
    console.log('\n  ' + c('bold', 'Top 5 Most Expensive Jobs:'));
    const idToName = new Map(jobs.map((j) => [j.sfCatalogId, j.sfCatalogName]));
    for (const [pid, cost] of topJobs) {
      console.log(`    ${(idToName.get(pid) || pid).padEnd(28)} ${fmtUSD(cost).padStart(10)}`);
    }
  }
}

// ───────────────────────── consensus & per-field analytics ─────────────────────────
function printConsensusMetrics(jobs) {
  header('🤝 AI CONSENSUS (OpenAI vs xAI per-field)');
  const completed = jobs.filter((j) => j.status === 'completed' && j.result && j.result.Field_AI_Reviews);
  if (!completed.length) { console.log('  No Field_AI_Reviews data available.'); return; }

  const fieldStats = {};      // field -> { agreed, disagreed, sources: {...} }
  let totalFields = 0, agreedFields = 0;
  const sourceCounts = {};    // source -> count (e.g. both_agreed, openai_only, xai_only, tiebreaker, claude_review)
  const overrules = { openai: 0, xai: 0 }; // times this AI's value was NOT the final value

  for (const j of completed) {
    const fr = j.result.Field_AI_Reviews;
    for (const [field, data] of Object.entries(fr)) {
      if (!data || typeof data !== 'object') continue;
      totalFields++;
      const agreed = data.consensus === 'agreed';
      if (agreed) agreedFields++;

      if (!fieldStats[field]) fieldStats[field] = { agreed: 0, total: 0 };
      fieldStats[field].total++;
      if (agreed) fieldStats[field].agreed++;

      const src = data.source || 'unknown';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;

      // Overrule detection: AI provided a value but final_value differs (case-insensitive)
      const finalVal = (data.final_value || '').toString().toLowerCase().trim();
      for (const provider of ['openai', 'xai']) {
        const aiVal = (data[provider] && data[provider].value || '').toString().toLowerCase().trim();
        if (aiVal && finalVal && aiVal !== finalVal) overrules[provider]++;
      }
    }
  }

  console.log(`  Field-decisions analyzed:  ${totalFields} (across ${completed.length} jobs)`);
  const overallPct = fmtPct(agreedFields, totalFields);
  const color = agreedFields / Math.max(totalFields, 1) >= 0.85 ? 'green' :
                agreedFields / Math.max(totalFields, 1) >= 0.70 ? 'yellow' : 'red';
  console.log(`  Overall agreement rate:    ${c(color, overallPct)} (${agreedFields}/${totalFields})`);

  console.log('\n  ' + c('bold', 'Resolution Source (how each field was decided):'));
  const totalDecisions = Object.values(sourceCounts).reduce((a, b) => a + b, 0);
  for (const [src, n] of Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${src.padEnd(20)} ${n.toString().padStart(5)} (${fmtPct(n, totalDecisions)})`);
  }

  console.log('\n  ' + c('bold', 'Per-AI Overrule Count (AI value differed from final):'));
  console.log(`    OpenAI overruled:  ${overrules.openai}`);
  console.log(`    xAI overruled:     ${overrules.xai}`);

  console.log('\n  ' + c('bold', 'Bottom 5 Fields by Agreement (weakest):'));
  const ranked = Object.entries(fieldStats)
    .filter(([, s]) => s.total >= Math.max(3, completed.length * 0.3))  // significant sample only
    .map(([f, s]) => ({ field: f, pct: s.agreed / s.total, agreed: s.agreed, total: s.total }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5);
  if (!ranked.length) {
    console.log('    (insufficient sample size for per-field ranking)');
  } else {
    for (const r of ranked) {
      const fieldColor = r.pct >= 0.85 ? 'green' : r.pct >= 0.70 ? 'yellow' : 'red';
      console.log(`    ${r.field.padEnd(30)} ${c(fieldColor, (r.pct * 100).toFixed(0).padStart(3) + '%')}  (${r.agreed}/${r.total})`);
    }
  }
}

function printFinalReviewMetrics(jobs) {
  header('🎯 PHASE B FINAL REVIEW (Claude adjudication)');
  const completed = jobs.filter((j) => j.status === 'completed' && j.result);
  if (!completed.length) { console.log('  No completed jobs.'); return; }

  let phaseBPerformed = 0, phaseBPass = 0, phaseBFlag = 0, phaseBFail = 0;
  let totalCorrectionsApplied = 0, jobsWithCorrections = 0;
  let phaseAConfSum = 0, phaseAConfCount = 0;
  let finalScoreSum = 0, finalScoreCount = 0;

  for (const j of completed) {
    const fr = j.result.Final_Review || {};
    const v = j.result.Verification || {};
    if (fr.phase_b_performed) {
      phaseBPerformed++;
      if (fr.final_review_status === 'PASS') phaseBPass++;
      else if (fr.final_review_status === 'FAIL') phaseBFail++;
      else phaseBFlag++;

      const corrCount = Array.isArray(fr.corrections_applied) ? fr.corrections_applied.length : 0;
      if (corrCount > 0) { jobsWithCorrections++; totalCorrectionsApplied += corrCount; }

      if (typeof fr.phase_a_confidence === 'number') { phaseAConfSum += fr.phase_a_confidence; phaseAConfCount++; }
    }
    if (typeof v.verification_score === 'number') { finalScoreSum += v.verification_score; finalScoreCount++; }
  }

  console.log(`  Phase B invoked:          ${phaseBPerformed} / ${completed.length} (${fmtPct(phaseBPerformed, completed.length)})`);
  if (phaseBPerformed > 0) {
    console.log(`    PASS:                   ${phaseBPass} (${fmtPct(phaseBPass, phaseBPerformed)})`);
    console.log(`    FLAG:                   ${phaseBFlag} (${fmtPct(phaseBFlag, phaseBPerformed)})`);
    console.log(`    FAIL:                   ${phaseBFail} (${fmtPct(phaseBFail, phaseBPerformed)})`);
    console.log(`  Jobs with corrections:    ${jobsWithCorrections} (${fmtPct(jobsWithCorrections, phaseBPerformed)})`);
    console.log(`  Total corrections applied: ${totalCorrectionsApplied}`);
    if (phaseAConfCount) console.log(`  Avg Phase A confidence:   ${(phaseAConfSum / phaseAConfCount).toFixed(1)}`);
    if (finalScoreCount)  console.log(`  Avg final score:          ${(finalScoreSum / finalScoreCount).toFixed(1)}`);
  }
}

function printLatencyAndRetry(usage) {
  header('⏱️  AI LATENCY & RETRIES (per model)');
  if (!usage.length) { console.log('  No ai_usage records.'); return; }

  const byModel = {};
  let retries = 0, failed = 0, jsonInvalid = 0;
  for (const u of usage) {
    const key = `${u.provider}/${u.aiModel}`;
    if (!byModel[key]) byModel[key] = [];
    byModel[key].push(u.latencyMs || 0);
    if ((u.retryAttempt || 0) > 0) retries++;
    if (u.outcome && u.outcome !== 'success') failed++;
    if (u.jsonValid === false) jsonInvalid++;
  }

  const pct = (arr, p) => {
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * p)] || 0;
  };
  console.log('  ' + c('bold', 'Latency by Model (ms):'));
  console.log('    ' + 'model'.padEnd(36) + 'calls   p50    p95    p99    avg');
  for (const [k, arr] of Object.entries(byModel).sort((a, b) => b[1].length - a[1].length)) {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    console.log(`    ${k.padEnd(36)}${arr.length.toString().padStart(5)}  ${pct(arr, 0.5).toString().padStart(5)}  ${pct(arr, 0.95).toString().padStart(5)}  ${pct(arr, 0.99).toString().padStart(5)}  ${Math.round(avg).toString().padStart(5)}`);
  }
  console.log('');
  console.log(`  Retries:        ${retries} call(s)  ${retries > 0 ? c('yellow', '⚠️') : c('green', '✓')}`);
  console.log(`  Non-success:    ${failed} call(s)  ${failed > 0 ? c('red', '⚠️') : c('green', '✓')}`);
  console.log(`  JSON invalid:   ${jsonInvalid} call(s)  ${jsonInvalid > 0 ? c('red', '⚠️') : c('green', '✓')}`);
}

async function printSelfHealing(SelfHealingLog, jobs) {
  if (!jobs.length) return;
  header('🔧 SELF-HEALING IN BATCH WINDOW');
  const earliest = jobs.reduce((m, j) => new Date(j.createdAt) < m ? new Date(j.createdAt) : m, new Date());
  const latest = jobs.reduce((m, j) => {
    const t = new Date(j.completedAt || j.updatedAt || j.createdAt);
    return t > m ? t : m;
  }, new Date(0));

  const logs = await SelfHealingLog.find({
    createdAt: { $gte: new Date(earliest.getTime() - 60000), $lte: new Date(latest.getTime() + 60000) },
  }).lean();

  if (!logs.length) { console.log('  No self-healing activity in window.'); return; }
  const byOutcome = {};
  for (const l of logs) byOutcome[l.outcome] = (byOutcome[l.outcome] || 0) + 1;
  console.log(`  Total attempts: ${logs.length}`);
  for (const [k, v] of Object.entries(byOutcome)) console.log(`    ${k.padEnd(20)} ${v}`);
}

function printRecommendations(jobs, costs) {
  header('💡 RECOMMENDATIONS');
  const completed = jobs.filter((j) => j.status === 'completed');
  const failed = jobs.filter((j) => j.status === 'failed').length;
  const manual = completed.filter((j) => j.result && j.result.Verification_Status === 'Manual Review Required').length;
  const recs = [];
  if (failed > 0) recs.push(`🔴 ${failed} failed job(s) — investigate error field for each`);
  if (manual / Math.max(completed.length, 1) > 0.1) recs.push(`🟡 ${manual} job(s) need manual review (${fmtPct(manual, completed.length)}) — review for prompt improvement opportunities`);
  if (costs.totalCost > 1) recs.push(`💰 Batch cost ${fmtUSD(costs.totalCost)} — consider monitoring trend if running large volumes`);
  const stuck = jobs.filter((j) => (j.status === 'processing' || j.status === 'pending') && (Date.now() - new Date(j.createdAt)) / 60000 > 10).length;
  if (stuck > 0) recs.push(`🚨 ${stuck} stuck job(s) — may need manual intervention or recovery script`);
  if (!recs.length) recs.push('✅ No issues detected — batch processed cleanly.');
  for (const r of recs) console.log('  ' + r);
  console.log('');
}

// ───────────────────────────── main ─────────────────────────────
(async () => {
  const args = parseArgs(process.argv);
  try {
    await mongoose.connect(MONGODB_URI);

    const VerificationJob = mongoose.model('VerificationJob',
      new mongoose.Schema({}, { strict: false, collection: 'verification_jobs' }));
    const AIUsage = mongoose.model('AIUsage',
      new mongoose.Schema({}, { strict: false, collection: 'ai_usage' }));
    const SelfHealingLog = mongoose.model('SelfHealingLog',
      new mongoose.Schema({}, { strict: false, collection: 'selfhealinglogs' }));

    const { jobs, label } = await detectBatch(VerificationJob, args);
    if (!jobs.length) {
      console.log(c('yellow', `\nNo jobs found for batch criteria: ${label}\n`));
      console.log(c('dim', 'Try: node scripts/verify-batch.js --minutes=120  or  --size=100\n'));
      return;
    }

    printSummary(jobs, label);
    printStatusBreakdown(jobs);
    printQualityMetrics(jobs);
    const costs = await getCostsForJobs(AIUsage, jobs);
    printCosts(costs, jobs);
    printConsensusMetrics(jobs);
    printFinalReviewMetrics(jobs);
    printLatencyAndRetry(costs.raw || []);
    await printSelfHealing(SelfHealingLog, jobs);
    printIssues(jobs);
    printRecommendations(jobs, costs);
  } catch (err) {
    console.error(c('red', `\n❌ Error: ${err.message}\n`));
    if (process.env.DEBUG) console.error(err.stack);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
