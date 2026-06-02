#!/usr/bin/env node
/**
 * audit-recent-jobs.js
 *
 * Audits the last N completed verification jobs for known failure patterns.
 * Flags bad results and optionally requeues them for re-verification.
 *
 * Usage:
 *   node scripts/audit-recent-jobs.js              # audit last 50 jobs
 *   node scripts/audit-recent-jobs.js --size=100   # audit last 100 jobs
 *   node scripts/audit-recent-jobs.js --requeue    # audit + requeue flagged jobs
 *   node scripts/audit-recent-jobs.js --requeue --dry-run  # show what would be requeued
 */

const { MongoClient } = require('mongodb');
const http = require('http');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';
const API_PORT = process.env.PORT || 3001;

// Parse CLI args
const args = process.argv.slice(2);
const SIZE   = parseInt((args.find(a => a.startsWith('--size=')) || '--size=50').split('=')[1]);
const REQUEUE  = args.includes('--requeue');
const DRY_RUN  = args.includes('--dry-run');

// ─── Known failure patterns ───────────────────────────────────────────────────

function checkJob(job) {
  const issues = [];
  const pa = job.result?.Primary_Attributes || {};
  const category = pa.AI_Product_Category || '';
  const type     = pa.AI_Type || '';
  const finish   = pa.AI_Finish || '';
  const title    = pa.AI_Product_Title || '';

  // 1. "Brushed" finish — incomplete descriptor, should be color value
  if (/^brushed$/i.test(finish.trim())) {
    issues.push({ code: 'FINISH_BRUSHED', detail: `AI_Finish="${finish}" — should be color (e.g. Stainless Steel)`, field: 'finish' });
  }

  if (category === 'Range') {
    const rawSpec = (job.rawPayload?.Specification_Table || '') + JSON.stringify(job.rawPayload?.Web_Retailer_Specs || []);

    // 2. Range with Slide-In spec but Front/Top/Rear Control type
    const isSlideInSpec = /range configuration[^:]*:\s*slide/i.test(rawSpec) || /range type[^:]*:\s*slide/i.test(rawSpec);
    if (isSlideInSpec && !/slide/i.test(type)) {
      issues.push({ code: 'RANGE_TYPE_WRONG', detail: `Spec says Slide-In but AI_Type="${type}"`, field: 'type' });
    }

    // 3. Range with "Rear Control" — should be "Top Control"
    if (/^rear control$/i.test(type.trim())) {
      issues.push({ code: 'RANGE_REAR_CONTROL', detail: `AI_Type="Rear Control" — should be "Top Control"`, field: 'type' });
    }

    // 4. Range with Control Location: Rear in spec but Front Control type
    const controlLocRear = /control location[^:]*:\s*rear/i.test(rawSpec);
    if (controlLocRear && /^front control$/i.test(type.trim())) {
      issues.push({ code: 'RANGE_CONTROL_MISMATCH', detail: `Spec "Control Location: Rear" but AI_Type="Front Control" — should be "Top Control"`, field: 'type' });
    }
  }

  // 5. Title contains "Brushed" as a finish word
  if (/\sBrushed\s*-\s/i.test(title) || /\sBrushed\s*$/i.test(title)) {
    issues.push({ code: 'TITLE_BRUSHED', detail: `Title contains "Brushed" as finish: "${title}"`, field: 'title' });
  }

  return issues;
}

// ─── Requeue a job via internal API ──────────────────────────────────────────

function requeue(rawPayload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(rawPayload);
    const req = http.request({
      hostname: '127.0.0.1',
      port: API_PORT,
      path: '/api/verify/salesforce',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  console.log(`\n📋 AUDITING LAST ${SIZE} COMPLETED VERIFICATION JOBS`);
  console.log('='.repeat(60));

  const jobs = await db.collection('verification_jobs')
    .find({ status: 'completed' })
    .sort({ completedAt: -1 })
    .limit(SIZE)
    .toArray();

  console.log(`Found ${jobs.length} completed jobs\n`);

  const flagged = [];
  const clean = [];

  for (const job of jobs) {
    const issues = checkJob(job);
    if (issues.length > 0) {
      flagged.push({ job, issues });
    } else {
      clean.push(job);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`✅ CLEAN: ${clean.length} jobs`);
  console.log(`🔴 FLAGGED: ${flagged.length} jobs\n`);

  if (flagged.length === 0) {
    console.log('No issues found in last', SIZE, 'jobs.');
    await client.close();
    return;
  }

  // ── Issue breakdown ────────────────────────────────────────────────────────
  const codeCounts = {};
  for (const { issues } of flagged) {
    for (const i of issues) {
      codeCounts[i.code] = (codeCounts[i.code] || 0) + 1;
    }
  }
  console.log('ISSUE BREAKDOWN:');
  for (const [code, count] of Object.entries(codeCounts)) {
    console.log(`  ${code}: ${count}`);
  }
  console.log();

  // ── Per-job detail ─────────────────────────────────────────────────────────
  console.log('FLAGGED JOBS:');
  console.log('-'.repeat(60));
  for (const { job, issues } of flagged) {
    const pa = job.result?.Primary_Attributes || {};
    console.log(`\nModel: ${job.sfCatalogName}  (${job.sfCatalogId})`);
    console.log(`  Category: ${pa.AI_Product_Category || 'N/A'}  |  Type: ${pa.AI_Type || 'N/A'}  |  Finish: ${pa.AI_Finish || 'N/A'}`);
    console.log(`  Title:    ${pa.AI_Product_Title || 'N/A'}`);
    console.log(`  Completed: ${job.completedAt?.toISOString?.() || 'N/A'}`);
    for (const issue of issues) {
      console.log(`  ⚠️  [${issue.code}] ${issue.detail}`);
    }
  }

  // ── Requeue ────────────────────────────────────────────────────────────────
  if (REQUEUE) {
    console.log('\n' + '='.repeat(60));
    console.log(DRY_RUN ? '🔍 DRY RUN — would requeue:' : '🔄 REQUEUING flagged jobs...');
    console.log('='.repeat(60));

    let requeued = 0;
    let failed = 0;

    for (const { job } of flagged) {
      if (!job.rawPayload) {
        console.log(`  SKIP ${job.sfCatalogName} — no rawPayload stored`);
        continue;
      }
      if (DRY_RUN) {
        console.log(`  WOULD REQUEUE: ${job.sfCatalogName}`);
        continue;
      }
      try {
        const res = await requeue(job.rawPayload);
        if (res.status === 202) {
          console.log(`  ✅ Requeued: ${job.sfCatalogName}`);
          requeued++;
        } else {
          console.log(`  ❌ Failed (${res.status}): ${job.sfCatalogName} — ${res.body.substring(0, 80)}`);
          failed++;
        }
      } catch (e) {
        console.log(`  ❌ Error: ${job.sfCatalogName} — ${e.message}`);
        failed++;
      }
      // Brief pause to avoid flooding the queue
      await new Promise(r => setTimeout(r, 200));
    }

    if (!DRY_RUN) {
      console.log(`\nRequeue summary: ${requeued} requeued, ${failed} failed`);
    }
  } else {
    console.log('\nRun with --requeue to re-process flagged jobs.');
    console.log('Run with --requeue --dry-run to preview without requeuing.');
  }

  await client.close();
}

main().catch(e => { console.error(e); process.exit(1); });
