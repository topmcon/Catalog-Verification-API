#!/usr/bin/env node
/**
 * Check SF Response Deadlines
 *
 * Runs periodically (cron). For each pending creation request with an active watch:
 *   - If status==fulfilled → watch was already cleared; nothing to do
 *   - If awaiting_response_until is in the past AND still pending → SF missed deadline
 *       → set needs_attention=true and attention_reason
 *       → clear awaiting_response_until so we don't re-flag the same item every run
 *   - If still in window → log how much time remains
 *
 * Flagged items surface during "Establish Connection" via
 * scripts/check-pending-creation-requests.js.
 *
 * Usage:
 *   node scripts/check-sf-response-deadlines.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

const RESPONSE_WINDOW_MIN = parseInt(process.env.SF_RESPONSE_WINDOW_MIN || '15', 10);
const VERBOSE = process.argv.includes('--verbose');

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const now = new Date();

  // Active watches: requests with a deadline set
  const watched = await db.collection('pending_creation_requests').find({
    awaiting_response_until: { $exists: true, $ne: null },
    status: 'pending'  // only flag items still pending
  }).toArray();

  if (watched.length === 0) {
    if (VERBOSE) console.log(`[${now.toISOString()}] No active SF response watches.`);
    await mongoose.disconnect();
    return;
  }

  let flagged = 0;
  let stillWaiting = 0;
  const flaggedItems = [];

  for (const req of watched) {
    const deadline = new Date(req.awaiting_response_until);
    const minutesPastDeadline = Math.round((now.getTime() - deadline.getTime()) / 60000);

    if (now > deadline) {
      // Deadline missed — flag for attention
      const ageMin = Math.round((now.getTime() - new Date(req.last_sent_at || req.created_at).getTime()) / 60000);
      const reason = `SF did not respond within ${RESPONSE_WINDOW_MIN} min after (re)send `
        + `(${minutesPastDeadline} min past deadline; retry ${req.sent_to_sf_count}/3; total wait ${ageMin} min)`;

      await db.collection('pending_creation_requests').updateOne(
        { _id: req._id },
        {
          $set: {
            needs_attention: true,
            attention_reason: reason,
            updated_at: now
          },
          $unset: {
            awaiting_response_until: ''  // Clear so we don't re-flag every run
          }
        }
      );
      flagged++;
      flaggedItems.push(`${req.request_type}/"${req.requested_value}" (${minutesPastDeadline}m late)`);
    } else {
      stillWaiting++;
      if (VERBOSE) {
        const minRemaining = Math.round((deadline.getTime() - now.getTime()) / 60000);
        console.log(`  ⏱️  ${req.request_type}/"${req.requested_value}" — ${minRemaining}m remaining`);
      }
    }
  }

  // Always log a one-line summary so cron output is useful
  console.log(`[${now.toISOString()}] SF response check: ${watched.length} watched, `
    + `${flagged} flagged, ${stillWaiting} still in window`);

  if (flagged > 0) {
    console.log('🔴 Newly flagged for attention:');
    for (const item of flaggedItems) console.log(`   • ${item}`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
