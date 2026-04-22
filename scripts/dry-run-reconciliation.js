#!/usr/bin/env node
/**
 * Dry-run reconciliation against current pending syncs.
 * NO FILES WRITTEN. NO DB CHANGES. Read-only simulation.
 *
 * Simulates the new request-only reconciliation logic so we can verify
 * expected counts before deploying.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // Load picklists from disk
  const basePath = path.join(process.cwd(), 'src/config/salesforce-picklists');
  const existingAttributes = JSON.parse(fs.readFileSync(path.join(basePath, 'attributes.json'), 'utf8'));
  const existingBrands = JSON.parse(fs.readFileSync(path.join(basePath, 'brands.json'), 'utf8'));
  const existingStyles = JSON.parse(fs.readFileSync(path.join(basePath, 'styles.json'), 'utf8'));

  // Load pending requests
  const pendingRequests = await db.collection('pending_creation_requests')
    .find({ status: 'pending' }).toArray();

  const reqByType = { attribute: new Map(), brand: new Map(), style: new Map() };
  for (const r of pendingRequests) {
    if (reqByType[r.request_type]) {
      reqByType[r.request_type].set(r.requested_value_normalized, r);
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  DRY-RUN RECONCILIATION (request-only mode simulation)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('CURRENT PICKLIST STATE:');
  console.log(`  attributes.json: ${existingAttributes.length} items`);
  console.log(`  brands.json:     ${existingBrands.length} items`);
  console.log(`  styles.json:     ${existingStyles.length} items\n`);

  console.log('PENDING REQUESTS (waiting for SF to fulfill):');
  console.log(`  attribute: ${reqByType.attribute.size}`);
  console.log(`  brand:     ${reqByType.brand.size}`);
  console.log(`  style:     ${reqByType.style.size}\n`);

  // Get the most recent pending sync
  const latestSync = await db.collection('pending_picklist_syncs')
    .find({ status: 'pending' })
    .sort({ created_at: -1 })
    .limit(1)
    .toArray();

  if (latestSync.length === 0) {
    console.log('No pending syncs found.');
    await mongoose.disconnect();
    return;
  }

  const sync = latestSync[0];
  console.log(`SIMULATING SYNC: ${sync.pending_id}`);
  console.log(`  Received: ${sync.created_at.toISOString()}`);
  console.log(`  Incoming: ${sync.incoming_data.attributes?.length || 0} attrs, ` +
              `${sync.incoming_data.brands?.length || 0} brands, ` +
              `${sync.incoming_data.styles?.length || 0} styles\n`);

  function simulate(typeName, incoming, existing, existingNameField, existingIdField, pendingMap) {
    if (!incoming || incoming.length === 0) {
      return { type: typeName, skipped: true };
    }

    const nameField = existingNameField;
    const idField = existingIdField;

    // De-dupe SF data
    const uniqueSf = new Map();
    const seenIds = new Set();
    let dupes = 0;
    for (const item of incoming) {
      const nameLower = item[nameField].toLowerCase().trim();
      if (uniqueSf.has(nameLower) || seenIds.has(item[idField])) {
        dupes++;
        continue;
      }
      uniqueSf.set(nameLower, item);
      seenIds.add(item[idField]);
    }

    const existingMap = new Map();
    existing.forEach(e => existingMap.set(e[nameField].toLowerCase().trim(), e));

    let existingUpdated = 0;
    let pendingAdded = 0;
    let unrequestedRejected = 0;
    const matchedRequests = [];
    const rejectedSamples = [];

    for (const [nameLower, sfItem] of uniqueSf) {
      const ex = existingMap.get(nameLower);
      const pend = pendingMap.get(nameLower);
      if (ex) {
        if (ex[idField] !== sfItem[idField]) existingUpdated++;
      } else {
        if (pend) {
          pendingAdded++;
          matchedRequests.push(sfItem[nameField]);
        } else {
          unrequestedRejected++;
          if (rejectedSamples.length < 5) rejectedSamples.push(sfItem[nameField]);
        }
      }
    }

    // Requests that won't be fulfilled (still pending after this sync)
    const stillPending = [];
    for (const [nameLower, req] of pendingMap) {
      if (!uniqueSf.has(nameLower)) stillPending.push(req.requested_value);
    }

    const finalCount = existing.length + pendingAdded;

    return {
      type: typeName,
      incoming_total: incoming.length,
      duplicates_in_sf_data: dupes,
      unique_sf_items: uniqueSf.size,
      existing_id_updates: existingUpdated,
      pending_matched_added: pendingAdded,
      unrequested_rejected: unrequestedRejected,
      requests_still_pending_after: stillPending.length,
      file_size_change: `${existing.length} → ${finalCount} (${pendingAdded >= 0 ? '+' : ''}${pendingAdded})`,
      matched_request_samples: matchedRequests.slice(0, 10),
      rejected_samples: rejectedSamples,
      still_pending_samples: stillPending.slice(0, 10)
    };
  }

  const results = [
    simulate('attributes', sync.incoming_data.attributes, existingAttributes,
             'attribute_name', 'attribute_id', reqByType.attribute),
    simulate('brands', sync.incoming_data.brands, existingBrands,
             'brand_name', 'brand_id', reqByType.brand),
    simulate('styles', sync.incoming_data.styles, existingStyles,
             'style_name', 'style_id', reqByType.style)
  ];

  for (const r of results) {
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`  ${r.type.toUpperCase()}`);
    console.log('───────────────────────────────────────────────────────────────');
    if (r.skipped) {
      console.log('  (no incoming data)\n');
      continue;
    }
    console.log(`  Incoming from SF:        ${r.incoming_total}`);
    console.log(`  Duplicates in SF data:   ${r.duplicates_in_sf_data}`);
    console.log(`  Unique SF items:         ${r.unique_sf_items}`);
    console.log(`  Existing ID updates:     ${r.existing_id_updates}`);
    console.log(`  ✅ Matched + added:       ${r.pending_matched_added}`);
    console.log(`  🚫 Unrequested rejected:  ${r.unrequested_rejected}`);
    console.log(`  ⏳ Requests still pending: ${r.requests_still_pending_after}`);
    console.log(`  File size: ${r.file_size_change}`);
    if (r.matched_request_samples.length > 0) {
      console.log(`  Matched samples: ${r.matched_request_samples.slice(0, 5).join(', ')}${r.matched_request_samples.length > 5 ? '...' : ''}`);
    }
    if (r.rejected_samples.length > 0) {
      console.log(`  Rejected samples: ${r.rejected_samples.join(', ')}`);
    }
    if (r.still_pending_samples.length > 0) {
      console.log(`  Still pending: ${r.still_pending_samples.slice(0, 5).join(', ')}${r.still_pending_samples.length > 5 ? '...' : ''}`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  EXPECTED VS ACTUAL CHECK');
  console.log('═══════════════════════════════════════════════════════════════');
  const attrR = results[0];
  const brandR = results[1];
  console.log(`  Expected: ~48 attr matches, ~617 attr rejected`);
  console.log(`  Actual:    ${attrR.pending_matched_added} attr matches, ${attrR.unrequested_rejected} rejected`);
  console.log(`  Expected: ~2 brand matches`);
  console.log(`  Actual:    ${brandR.pending_matched_added} brand matches, ${brandR.unrequested_rejected} rejected\n`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
