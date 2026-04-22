#!/usr/bin/env node
/**
 * Re-trigger verification jobs for pending creation requests.
 *
 * For each pending request older than 7 days, finds the original verification job
 * (via first_requested_by.job_id) and POSTs the same payload to /api/verify/salesforce.
 *
 * This causes the verification pipeline to re-run, which sends the unknown picklist
 * value (e.g. Brand_Verified="Bain Ultra") back to Salesforce via webhook. SF should
 * then create the picklist item, which we'll receive in the next inbound sync.
 *
 * Behavior:
 *  - Increments sent_to_sf_count
 *  - Updates last_sent_at
 *  - Flags needs_attention=true if sent_to_sf_count reaches MAX_RETRIES
 *  - Skips requests with no resolvable original job
 *
 * Usage:
 *   node scripts/retrigger-pending-requests.js          # dry-run (default safe)
 *   node scripts/retrigger-pending-requests.js --apply  # actually POST to API
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const axios = require('axios');

const APPLY = process.argv.includes('--apply');
const STALE_AGE_DAYS = parseInt(process.env.RETRIGGER_STALE_DAYS || '7', 10);
const MAX_RETRIES = 3;
const API_BASE = process.env.RETRIGGER_API_BASE || 'http://127.0.0.1:3001';
const API_KEY = process.env.WEBHOOK_SECRET || '';
const REQUEST_DELAY_MS = 1500; // be polite to the queue

if (!API_KEY) {
  console.error('❌ WEBHOOK_SECRET env var required (used as x-api-key)');
  process.exit(1);
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  RETRIGGER PENDING REQUESTS  (${APPLY ? 'APPLY MODE' : 'DRY-RUN'})`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  const staleDate = new Date(Date.now() - STALE_AGE_DAYS * 24 * 60 * 60 * 1000);

  // Find ALL pending requests with retry budget remaining
  const allPending = await db.collection('pending_creation_requests').find({
    status: 'pending',
    sent_to_sf_count: { $lt: MAX_RETRIES }
  }).sort({ created_at: 1 }).toArray();

  // Apply trigger logic: retry if EITHER
  //   (a) request is older than STALE_AGE_DAYS days, OR
  //   (b) at least one same-type request created AFTER it has been fulfilled
  //       (out-of-order fulfillment = SF skipped this one)
  const pending = [];
  for (const req of allPending) {
    const ageDays = Math.floor((Date.now() - new Date(req.created_at).getTime()) / 86400000);
    const newerFulfilled = await db.collection('pending_creation_requests').countDocuments({
      request_type: req.request_type,
      created_at: { $gt: req.created_at },
      status: 'fulfilled'
    });

    let triggerReason = null;
    if (newerFulfilled > 0) {
      triggerReason = `out-of-order: ${newerFulfilled} newer ${req.request_type} request(s) already fulfilled`;
    } else if (ageDays >= STALE_AGE_DAYS) {
      triggerReason = `aged: ${ageDays}d old (no fulfilled newer requests yet)`;
    }

    if (triggerReason) {
      pending.push({ ...req, _ageDays: ageDays, _newerFulfilled: newerFulfilled, _triggerReason: triggerReason });
    }
  }

  console.log(`Scanned ${allPending.length} pending requests with retry budget remaining`);
  console.log(`  → ${pending.length} need retry (out-of-order OR ≥${STALE_AGE_DAYS}d old)\n`);

  if (pending.length === 0) {
    await mongoose.disconnect();
    return;
  }

  let attempted = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  let flagged = 0;

  for (const req of pending) {
    const ageDays = req._ageDays;
    const sfIds = [...new Set(
      (req.requested_by_jobs || [])
        .map(j => j.sf_catalog_id)
        .filter(Boolean)
    )];

    console.log('───────────────────────────────────────────────────────────────');
    console.log(`${req.request_type.toUpperCase()}: "${req.requested_value}"`);
    console.log(`  Trigger: ${req._triggerReason}`);
    console.log(`  Age: ${ageDays}d | Retries: ${req.sent_to_sf_count}/${MAX_RETRIES} | SF Catalog IDs requesting: ${sfIds.length}`);

    if (sfIds.length === 0) {
      console.log('  ⏭️  SKIP: no sf_catalog_id stored on request\n');
      skipped++;
      continue;
    }

    // Find the most recent verification job for any of those SF Catalog IDs
    // (most recent = freshest data, most likely to still match SF state)
    const job = await db.collection('verification_jobs')
      .find({ sfCatalogId: { $in: sfIds }, rawPayload: { $exists: true, $ne: null } })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();

    if (!job || !job.rawPayload) {
      console.log(`  ⏭️  SKIP: no verification job with rawPayload for SF Catalog IDs ${sfIds.slice(0,3).join(',')}...\n`);
      skipped++;
      continue;
    }

    console.log(`  Found job: jobId=${job.jobId} SF=${job.sfCatalogId} `
      + `Model=${job.rawPayload.SF_Catalog_Name} created=${job.createdAt.toISOString().slice(0,10)}`);

    if (!APPLY) {
      console.log('  🟡 DRY-RUN: would POST original payload to /api/verify/salesforce\n');
      attempted++;
      continue;
    }

    // POST original payload back to verification endpoint
    try {
      const resp = await axios.post(`${API_BASE}/api/verify/salesforce`, job.rawPayload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        timeout: 30000
      });

      const newJobId = resp.data?.jobId;
      console.log(`  ✅ Re-queued. New jobId=${newJobId} (status=${resp.status})`);

      // Bump retry counter
      const newCount = (req.sent_to_sf_count || 0) + 1;
      const update = {
        sent_to_sf_count: newCount,
        last_sent_at: new Date(),
        awaiting_response_until: new Date(Date.now() + 15 * 60 * 1000), // 15-min SF response watch
        updated_at: new Date()
      };
      if (newCount >= MAX_RETRIES) {
        update.needs_attention = true;
        update.attention_reason = `Retried ${newCount} times over ${ageDays} days; SF still has not created this item`;
        flagged++;
        console.log(`  🚩 FLAGGED for attention (hit max retries)`);
      }

      await db.collection('pending_creation_requests').updateOne(
        { _id: req._id },
        { $set: update }
      );
      succeeded++;
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      console.log(`  ❌ FAIL: ${msg}`);
      failed++;
    }

    console.log('');
    attempted++;

    if (REQUEST_DELAY_MS > 0 && attempted < pending.length) {
      await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Total stale:       ${pending.length}`);
  console.log(`  Attempted:         ${attempted}`);
  console.log(`  Re-queued:         ${succeeded}`);
  console.log(`  Failed:            ${failed}`);
  console.log(`  Skipped:           ${skipped}`);
  console.log(`  Flagged (max):     ${flagged}`);
  if (!APPLY) {
    console.log('\n  Run again with --apply to actually re-queue jobs.');
  } else {
    console.log('\n  Verification queue will process re-triggered jobs in 30-120s each.');
    console.log('  Monitor logs:  ssh ... "tail -f /opt/catalog-verification-api/logs/combined.log"');
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
