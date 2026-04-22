#!/usr/bin/env node
/**
 * SNAPSHOT BATCH QUALITY — Automated periodic aggregator
 * ======================================================
 * Runs every 30 minutes via cron. Computes quality/cost aggregates for the
 * recent window and persists ONE snapshot doc to MongoDB. Read-only against
 * verification_jobs and ai_usage; the only write is a single insert into
 * batch_quality_snapshots. NO impact on the verification pipeline.
 *
 * Cron (production):
 *   every 30 min: cd /opt/catalog-verification-api && /usr/bin/node \
 *     scripts/snapshot-batch-quality.js >> /var/log/quality-snapshot.log 2>&1
 *
 * Manual usage:
 *   node scripts/snapshot-batch-quality.js              # last 30 min window
 *   node scripts/snapshot-batch-quality.js --minutes=60 # last 60 min
 *   node scripts/snapshot-batch-quality.js --dry-run    # compute but don't store
 */

'use strict';
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

function parseArgs(argv) {
  const args = { minutes: 30, dryRun: false };
  for (const raw of argv.slice(2)) {
    if (raw === '--dry-run') args.dryRun = true;
    const m = raw.match(/^--minutes=(\d+)$/);
    if (m) args.minutes = parseInt(m[1], 10);
  }
  return args;
}

function pct(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * p)] || 0;
}

(async () => {
  const args = parseArgs(process.argv);
  const stamp = new Date();
  const since = new Date(stamp.getTime() - args.minutes * 60 * 1000);

  try {
    await mongoose.connect(MONGODB_URI);
    const Job = mongoose.model('Job',
      new mongoose.Schema({}, { strict: false, collection: 'verification_jobs' }));
    const Usage = mongoose.model('Usage',
      new mongoose.Schema({}, { strict: false, collection: 'ai_usage' }));
    const Snapshot = mongoose.model('Snapshot',
      new mongoose.Schema({}, { strict: false, collection: 'batch_quality_snapshots' }));

    const jobs = await Job.find({ createdAt: { $gte: since } }).lean();
    if (!jobs.length) {
      console.log(`[${stamp.toISOString()}] No jobs in last ${args.minutes} min — skipping snapshot.`);
      return;
    }

    // ── Job-level aggregates ─────────────────────────────────────
    const status = { completed: 0, failed: 0, processing: 0, pending: 0 };
    const procTimes = [];
    let manualReview = 0, finalReviewFail = 0, emptyCatLookup = 0, titleDup = 0;
    let webhookFail = 0, sfNotAcked = 0;
    let scoreSum = 0, scoreCount = 0;

    // ── Consensus aggregates (from Field_AI_Reviews) ─────────────
    let totalFields = 0, agreedFields = 0;
    const fieldStats = {};
    const sourceCounts = {};
    const overrules = { openai: 0, xai: 0 };
    const NARRATIVE_FIELDS = new Set(['product_family', 'description', 'product_title',
      'features_list', 'details', 'long_description', 'short_description']);
    let structuredTotal = 0, structuredAgreed = 0;

    // ── Phase B aggregates ──────────────────────────────────────
    let phaseBPerformed = 0, phaseBPass = 0, phaseBFlag = 0, phaseBFail = 0;
    let phaseBCorrections = 0;

    for (const j of jobs) {
      status[j.status] = (status[j.status] || 0) + 1;
      if (j.status === 'completed' && j.processingTimeMs > 0) procTimes.push(j.processingTimeMs);

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
      if (typeof v.verification_score === 'number') { scoreSum += v.verification_score; scoreCount++; }

      // Field consensus
      const far = r.Field_AI_Reviews || {};
      for (const [field, data] of Object.entries(far)) {
        if (!data || typeof data !== 'object') continue;
        totalFields++;
        const agreed = data.consensus === 'agreed';
        if (agreed) agreedFields++;
        if (!NARRATIVE_FIELDS.has(field)) {
          structuredTotal++;
          if (agreed) structuredAgreed++;
        }
        if (!fieldStats[field]) fieldStats[field] = { agreed: 0, total: 0 };
        fieldStats[field].total++;
        if (agreed) fieldStats[field].agreed++;
        const src = data.source || 'unknown';
        sourceCounts[src] = (sourceCounts[src] || 0) + 1;
        const finalVal = (data.final_value || '').toString().toLowerCase().trim();
        for (const provider of ['openai', 'xai']) {
          const aiVal = (data[provider] && data[provider].value || '').toString().toLowerCase().trim();
          if (aiVal && finalVal && aiVal !== finalVal) overrules[provider]++;
        }
      }

      // Phase B
      if (fr.phase_b_performed) {
        phaseBPerformed++;
        if (fr.final_review_status === 'PASS') phaseBPass++;
        else if (fr.final_review_status === 'FAIL') phaseBFail++;
        else phaseBFlag++;
        if (Array.isArray(fr.corrections_applied)) phaseBCorrections += fr.corrections_applied.length;
      }
    }

    // Bottom-5 weakest structured fields (significance: ≥30% of jobs)
    const minSample = Math.max(3, Math.floor(jobs.length * 0.3));
    const weakestFields = Object.entries(fieldStats)
      .filter(([f, s]) => s.total >= minSample && !NARRATIVE_FIELDS.has(f))
      .map(([f, s]) => ({ field: f, agreementPct: +(s.agreed / s.total * 100).toFixed(1), agreed: s.agreed, total: s.total }))
      .sort((a, b) => a.agreementPct - b.agreementPct)
      .slice(0, 5);

    // ── AI usage / cost ─────────────────────────────────────────
    const productIds = jobs.map((j) => j.sfCatalogId).filter(Boolean);
    const usage = await Usage.find({
      requestTimestamp: { $gte: new Date(since.getTime() - 60000), $lte: new Date(stamp.getTime() + 60000) },
      productId: { $in: productIds },
    }).lean();
    let totalCost = 0, totalTokens = 0;
    const byProvider = {}, byTask = {}, byModel = {};
    const latencyByModel = {};
    let retries = 0, jsonInvalid = 0, callFailed = 0;
    for (const u of usage) {
      totalCost += u.totalCost || 0;
      totalTokens += u.totalTokens || 0;
      byProvider[u.provider] = +((byProvider[u.provider] || 0) + (u.totalCost || 0)).toFixed(6);
      byTask[u.taskType] = +((byTask[u.taskType] || 0) + (u.totalCost || 0)).toFixed(6);
      byModel[u.aiModel] = (byModel[u.aiModel] || 0) + 1;
      if (!latencyByModel[u.aiModel]) latencyByModel[u.aiModel] = [];
      latencyByModel[u.aiModel].push(u.latencyMs || 0);
      if ((u.retryAttempt || 0) > 0) retries++;
      if (u.jsonValid === false) jsonInvalid++;
      if (u.outcome && u.outcome !== 'success') callFailed++;
    }
    const latencyStats = {};
    for (const [m, arr] of Object.entries(latencyByModel)) {
      latencyStats[m] = {
        calls: arr.length,
        p50: pct(arr, 0.5),
        p95: pct(arr, 0.95),
        p99: pct(arr, 0.99),
        avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
      };
    }

    // ── Build snapshot doc ──────────────────────────────────────
    const completed = status.completed || 0;
    const snapshot = {
      snapshotAt: stamp,
      windowStart: since,
      windowMinutes: args.minutes,
      jobCount: jobs.length,
      status,
      processingTime: completed ? {
        avgMs: Math.round(procTimes.reduce((a, b) => a + b, 0) / Math.max(procTimes.length, 1)),
        p50Ms: pct(procTimes, 0.5),
        p95Ms: pct(procTimes, 0.95),
        minMs: procTimes.length ? Math.min(...procTimes) : 0,
        maxMs: procTimes.length ? Math.max(...procTimes) : 0,
      } : null,
      quality: {
        completed,
        manualReviewRequired: manualReview,
        finalReviewFail,
        emptyCategoryLookup: emptyCatLookup,
        titleDuplication: titleDup,
        webhookFailed: webhookFail,
        sfNotAcknowledged: sfNotAcked,
        avgVerificationScore: scoreCount ? +(scoreSum / scoreCount).toFixed(2) : null,
        successRate: completed ? +((completed / jobs.length) * 100).toFixed(2) : 0,
      },
      consensus: {
        totalFieldDecisions: totalFields,
        overallAgreedPct: totalFields ? +((agreedFields / totalFields) * 100).toFixed(2) : null,
        structuredFieldDecisions: structuredTotal,
        structuredAgreedPct: structuredTotal ? +((structuredAgreed / structuredTotal) * 100).toFixed(2) : null,
        sourceCounts,
        overrules,
        weakestFields,
      },
      phaseB: {
        invoked: phaseBPerformed,
        invokedRatePct: jobs.length ? +((phaseBPerformed / jobs.length) * 100).toFixed(2) : 0,
        pass: phaseBPass,
        flag: phaseBFlag,
        fail: phaseBFail,
        totalCorrectionsApplied: phaseBCorrections,
      },
      cost: {
        totalUSD: +totalCost.toFixed(4),
        avgPerJobUSD: completed ? +(totalCost / completed).toFixed(4) : 0,
        avgPerCallUSD: usage.length ? +(totalCost / usage.length).toFixed(6) : 0,
        totalTokens,
        callCount: usage.length,
        byProvider,
        byTask,
        byModelCallCount: byModel,
      },
      latency: latencyStats,
      reliability: {
        retries,
        jsonInvalid,
        callFailed,
      },
    };

    if (args.dryRun) {
      console.log(JSON.stringify(snapshot, null, 2));
    } else {
      await Snapshot.create(snapshot);
      console.log(`[${stamp.toISOString()}] Snapshot saved | jobs=${jobs.length} success=${snapshot.quality.successRate}% consensus=${snapshot.consensus.overallAgreedPct}% structured=${snapshot.consensus.structuredAgreedPct}% cost=$${snapshot.cost.totalUSD} phaseB=${phaseBPerformed}/${jobs.length}`);
    }
  } catch (err) {
    console.error(`[${stamp.toISOString()}] ERROR: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
