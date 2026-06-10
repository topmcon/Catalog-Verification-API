/**
 * WST-01..08 — Cost & waste scan (READ-ONLY).
 * Runs on prod: node scripts/platform-audit/scan-waste.js
 * Mines ai_usage (157k+ call records), verification_jobs, inconclusiveresponselogs.
 * See docs/PLATFORM-AUDIT-GUIDE.md §4.2.
 * WST-03 (discarded Claude titles) and WST-08 (truncation) live in logs — companion grep:
 *   grep -c "Claude corrected title but using schema-generated version" logs/combined.log
 *   grep -c "TOKEN RISK DETECTED" logs/combined.log
 */
const { connect, saveReport } = require('./lib/common');

async function main() {
  const { client, db } = await connect();
  const usage = db.collection('ai_usage');
  const jobs = db.collection('verification_jobs');
  const out = { generated: new Date().toISOString() };

  // ── WST-01: cost breakdown ──
  out.wst01 = {};
  out.wst01.byTask = await usage.aggregate([
    { $group: { _id: { taskType: '$taskType', provider: '$provider', aiModel: '$aiModel' },
      n: { $sum: 1 }, cost: { $sum: '$totalCost' }, avgLatencyMs: { $avg: '$latencyMs' },
      tokens: { $sum: '$totalTokens' } } },
    { $sort: { cost: -1 } },
  ]).toArray().then((rows) => rows.map((r) => ({
    ...r._id, n: r.n, cost: +r.cost.toFixed(2), avgLatencyMs: Math.round(r.avgLatencyMs || 0), tokens: r.tokens,
  })));
  const totals = await usage.aggregate([{ $group: { _id: null, cost: { $sum: '$totalCost' }, n: { $sum: 1 } } }]).toArray();
  out.wst01.totalCost = +totals[0].cost.toFixed(2);
  out.wst01.totalCalls = totals[0].n;
  const completedJobs = await jobs.countDocuments({ status: 'completed' });
  out.wst01.completedJobs = completedJobs;
  out.wst01.avgCostPerJob = +(totals[0].cost / completedJobs).toFixed(4);
  // per-session cost distribution (sessions with a real UUID id)
  const sess = await usage.aggregate([
    { $match: { sessionId: { $regex: /^[0-9a-f]{8}-/ } } },
    { $group: { _id: '$sessionId', cost: { $sum: '$totalCost' }, calls: { $sum: 1 } } },
    { $group: { _id: null, sessions: { $sum: 1 }, avgCost: { $avg: '$cost' }, maxCost: { $max: '$cost' }, avgCalls: { $avg: '$calls' } } },
  ]).toArray();
  if (sess[0]) out.wst01.perSession = { sessions: sess[0].sessions, avgCost: +sess[0].avgCost.toFixed(4), maxCost: +sess[0].maxCost.toFixed(2), avgCalls: +sess[0].avgCalls.toFixed(1) };

  // ── WST-02: research & web-search efficacy ──
  out.wst02 = {};
  out.wst02.webSearch = await usage.aggregate([
    { $match: { taskType: { $regex: /web-search/i } } },
    { $group: { _id: '$outcome', n: { $sum: 1 }, cost: { $sum: '$totalCost' },
      zeroFields: { $sum: { $cond: [{ $eq: ['$fieldsCaptured', 0] }, 1, 0] } } } },
  ]).toArray().then((rows) => rows.map((r) => ({ outcome: r._id, n: r.n, cost: +r.cost.toFixed(2), zeroFieldsCaptured: r.zeroFields })));
  out.wst02.inconclusiveResponses = await db.collection('inconclusiveresponselogs').countDocuments();
  const incSample = await db.collection('inconclusiveresponselogs').findOne();
  out.wst02.inconclusiveSampleKeys = incSample ? Object.keys(incSample) : [];
  // group inconclusive by best available discriminator
  for (const key of ['provider', 'taskType', 'reason', 'field', 'stage']) {
    if (incSample && incSample[key] !== undefined) {
      out.wst02[`inconclusiveBy_${key}`] = await db.collection('inconclusiveresponselogs').aggregate([
        { $group: { _id: `$${key}`, n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 10 },
      ]).toArray();
      break;
    }
  }

  // ── WST-03: Claude final-review spend (override counts come from log grep) ──
  out.wst03 = (await usage.aggregate([
    { $match: { taskType: 'final-review' } },
    { $group: { _id: '$provider', n: { $sum: 1 }, cost: { $sum: '$totalCost' } } },
  ]).toArray()).map((r) => ({ provider: r._id, n: r.n, cost: +r.cost.toFixed(2) }));

  // ── WST-04: duplicate verifications of the same catalog id ──
  const dups = await jobs.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$sfCatalogId', n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
    { $group: { _id: null, dupGroups: { $sum: 1 }, excessJobs: { $sum: { $subtract: ['$n', 1] } }, maxRuns: { $max: '$n' } } },
  ]).toArray();
  out.wst04 = dups[0]
    ? { dupCatalogIds: dups[0].dupGroups, excessJobs: dups[0].excessJobs, maxRunsForOneId: dups[0].maxRuns,
        estExcessSpend: +(dups[0].excessJobs * (out.wst01.avgCostPerJob || 0)).toFixed(2) }
    : { dupCatalogIds: 0, excessJobs: 0 };
  out.wst04.topDuplicated = await jobs.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$sfCatalogId', name: { $first: '$sfCatalogName' }, n: { $sum: 1 } } },
    { $sort: { n: -1 } }, { $limit: 10 },
  ]).toArray().then((rows) => rows.map((r) => ({ sku: r.name, runs: r.n })));

  // ── WST-05: completed but never accepted by SF ──
  out.wst05 = {
    completedWebhookFailed: await jobs.countDocuments({ status: 'completed', webhookSuccess: { $ne: true } }),
    completedNotAcknowledged: await jobs.countDocuments({ status: 'completed', salesforceAcknowledged: { $ne: true } }),
    failedJobs: await jobs.countDocuments({ status: 'failed' }),
  };
  out.wst05.estSpendOnUnacceptedJobs = +(out.wst05.completedWebhookFailed * (out.wst01.avgCostPerJob || 0)).toFixed(2);

  // ── WST-06: processing time ──
  const timeBuckets = await jobs.aggregate([
    { $match: { status: 'completed', processingTimeMs: { $gt: 0 } } },
    { $bucket: { groupBy: '$processingTimeMs', boundaries: [0, 60000, 120000, 300000, 600000, 1e9],
      default: 'other', output: { n: { $sum: 1 } } } },
  ]).toArray();
  const labels = { 0: '<60s', 60000: '60–120s', 120000: '120–300s', 300000: '300–600s', 600000: '>600s' };
  out.wst06 = { buckets: timeBuckets.map((b) => ({ bucket: labels[b._id] || String(b._id), n: b.n })) };
  out.wst06.slowest = await jobs.find({ status: 'completed' }, { projection: { sfCatalogName: 1, processingTimeMs: 1 } })
    .sort({ processingTimeMs: -1 }).limit(10).toArray()
    .then((rows) => rows.map((r) => ({ sku: r.sfCatalogName, seconds: Math.round(r.processingTimeMs / 1000) })));

  // ── WST-07: image-vision contribution ──
  const vision = await usage.aggregate([
    { $match: { taskType: 'image-analysis' } },
    { $group: { _id: null, n: { $sum: 1 }, cost: { $sum: '$totalCost' },
      jsonValid: { $sum: { $cond: ['$jsonValid', 1, 0] } },
      zeroFields: { $sum: { $cond: [{ $eq: ['$fieldsCaptured', 0] }, 1, 0] } } } },
  ]).toArray();
  out.wst07 = vision[0]
    ? { calls: vision[0].n, cost: +vision[0].cost.toFixed(2),
        jsonValidPct: +(100 * vision[0].jsonValid / vision[0].n).toFixed(1),
        zeroFieldsCapturedPct: +(100 * vision[0].zeroFields / vision[0].n).toFixed(1) }
    : null;

  out.wst08 = { note: 'truncation events are log-only — run: grep -c "TOKEN RISK DETECTED" logs/combined.log' };

  await client.close();

  console.log('\n═══ WST WASTE SCAN ═══');
  console.log('  WST-01 total:', `$${out.wst01.totalCost}`, `(${out.wst01.totalCalls} calls, ${out.wst01.completedJobs} jobs, avg $${out.wst01.avgCostPerJob}/job)`);
  console.log('  WST-01 top tasks:', JSON.stringify(out.wst01.byTask.slice(0, 5)));
  console.log('  WST-02 web search:', JSON.stringify(out.wst02.webSearch), '| inconclusive logs:', out.wst02.inconclusiveResponses);
  console.log('  WST-03 final-review:', JSON.stringify(out.wst03));
  console.log('  WST-04 duplicates:', JSON.stringify({ ...out.wst04, topDuplicated: out.wst04.topDuplicated.slice(0, 5) }));
  console.log('  WST-05 unaccepted:', JSON.stringify(out.wst05));
  console.log('  WST-06 buckets:', JSON.stringify(out.wst06.buckets));
  console.log('  WST-07 vision:', JSON.stringify(out.wst07));

  saveReport('scan-waste', out);
}

main().catch((e) => { console.error(e); process.exit(1); });
