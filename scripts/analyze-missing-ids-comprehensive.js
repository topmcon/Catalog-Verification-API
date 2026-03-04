#!/usr/bin/env node
const fs = require('fs');
const mongoose = require('mongoose');

const FILES = [
  { path: 'src/config/salesforce-picklists/attributes.json', type: 'attribute', idField: 'attribute_id', nameField: 'attribute_name' },
  { path: 'src/config/salesforce-picklists/brands.json', type: 'brand', idField: 'brand_id', nameField: 'brand_name' },
  { path: 'src/config/salesforce-picklists/categories.json', type: 'category', idField: 'category_id', nameField: 'category_name' },
  { path: 'src/config/salesforce-picklists/types.json', type: 'type', idField: 'type_id', nameField: 'type_name' },
  { path: 'src/config/salesforce-picklists/styles.json', type: 'style', idField: 'style_id', nameField: 'style_name' }
];

function isPendingId(id) {
  if (!id) return true;
  const str = String(id).toUpperCase();
  return str.startsWith('PENDING-') || str === 'NEEDS_SF_ID' || str === 'NULL' || str === '';
}

async function analyze() {
  console.log('\n📊 COMPREHENSIVE MISSING ID ANALYSIS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Step 1: Load all master picklists and find items with missing IDs
  const allMissingItems = [];
  const summaryByType = {};

  for (const file of FILES) {
    const data = JSON.parse(fs.readFileSync(file.path));
    const missingIds = data.filter(item => isPendingId(item[file.idField]));
    
    summaryByType[file.type] = {
      total: data.length,
      missingIds: missingIds.length,
      items: missingIds.map(item => ({
        name: item[file.nameField],
        currentId: item[file.idField] || 'null',
        type: file.type
      }))
    };

    allMissingItems.push(...summaryByType[file.type].items);
  }

  // Display master list summary
  console.log('📋 MASTER PICKLIST FILES - ITEMS WITHOUT SF IDs:\n');
  let totalMissing = 0;
  for (const [type, stats] of Object.entries(summaryByType)) {
    console.log(`  ${type}s: ${stats.missingIds} missing IDs / ${stats.total} total (${((stats.missingIds/stats.total)*100).toFixed(1)}%)`);
    totalMissing += stats.missingIds;
  }
  console.log(`\n  TOTAL MISSING: ${totalMissing} items across all 5 files\n`);

  if (totalMissing === 0) {
    console.log('✅ All items have SF IDs! No missing IDs found.\n');
    return;
  }

  // Step 2: Connect to MongoDB and check against pending requests
  await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
  
  const CreationRequest = mongoose.model('CreationRequest', new mongoose.Schema({}, {
    strict: false,
    collection: 'pending_creation_requests'
  }));

  const PendingSync = mongoose.model('PendingSync', new mongoose.Schema({}, {
    strict: false,
    collection: 'pending_picklist_syncs'
  }));

  const pendingRequests = await CreationRequest.find({ status: 'pending' }).lean();
  
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🔍 CROSS-REFERENCE WITH PENDING CREATION REQUESTS:\n');

  const inPendingBucket = [];
  const notInPendingBucket = [];

  for (const missing of allMissingItems) {
    const match = pendingRequests.find(req => 
      req.request_type === missing.type && 
      req.requested_value.toLowerCase() === missing.name.toLowerCase()
    );
    
    if (match) {
      inPendingBucket.push({ ...missing, requestCount: match.request_count, jobsWaiting: match.requested_by_jobs?.length || 0 });
    } else {
      notInPendingBucket.push(missing);
    }
  }

  console.log(`  ✅ IN PENDING BUCKET: ${inPendingBucket.length} items`);
  console.log(`  ⚠️  NOT IN PENDING BUCKET: ${notInPendingBucket.length} items\n`);

  if (inPendingBucket.length > 0) {
    console.log('  Items in pending bucket (top 10):');
    inPendingBucket.slice(0, 10).forEach(item => {
      console.log(`    - ${item.name} (${item.type}) | ID: ${item.currentId} | Requested: ${item.requestCount} times, ${item.jobsWaiting} jobs waiting`);
    });
    if (inPendingBucket.length > 10) console.log(`    ... and ${inPendingBucket.length - 10} more`);
    console.log('');
  }

  if (notInPendingBucket.length > 0) {
    console.log('  Items NOT in pending bucket (likely old/unused):');
    notInPendingBucket.forEach(item => {
      console.log(`    - ${item.name} (${item.type}) | ID: ${item.currentId}`);
    });
    console.log('');
  }

  // Step 3: Check rejected SF syncs
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🗄️  CROSS-REFERENCE WITH REJECTED SF SYNC:\n');

  const rejectedSync = await PendingSync.findOne({
    status: 'rejected'
  }).sort({ created_at: -1 }).lean();

  if (!rejectedSync || !rejectedSync.incoming_data) {
    console.log('  ❌ No rejected sync found with incoming data\n');
    await mongoose.disconnect();
    return;
  }

  console.log(`  Using sync: ${rejectedSync.sync_id} (${new Date(rejectedSync.created_at).toISOString()})\n`);

  // Build maps of SF sync data
  const sfDataMaps = {
    attribute: new Map(),
    brand: new Map(),
    category: new Map(),
    type: new Map(),
    style: new Map()
  };

  if (rejectedSync.incoming_data.attributes) {
    rejectedSync.incoming_data.attributes.forEach(attr => {
      sfDataMaps.attribute.set(attr.attribute_name.toLowerCase(), attr.attribute_id);
    });
  }
  if (rejectedSync.incoming_data.brands) {
    rejectedSync.incoming_data.brands.forEach(b => {
      sfDataMaps.brand.set(b.brand_name.toLowerCase(), b.brand_id);
    });
  }
  if (rejectedSync.incoming_data.categories) {
    rejectedSync.incoming_data.categories.forEach(c => {
      sfDataMaps.category.set(c.category_name.toLowerCase(), c.category_id);
    });
  }
  if (rejectedSync.incoming_data.types) {
    rejectedSync.incoming_data.types.forEach(t => {
      sfDataMaps.type.set(t.type_name.toLowerCase(), t.type_id);
    });
  }
  if (rejectedSync.incoming_data.styles) {
    rejectedSync.incoming_data.styles.forEach(s => {
      sfDataMaps.style.set(s.style_name.toLowerCase(), s.style_id);
    });
  }

  // Check which missing items exist in SF sync
  const inRejectedSync = [];
  const notInRejectedSync = [];

  for (const missing of allMissingItems) {
    const sfId = sfDataMaps[missing.type].get(missing.name.toLowerCase());
    if (sfId) {
      inRejectedSync.push({ ...missing, sfId });
    } else {
      notInRejectedSync.push(missing);
    }
  }

  console.log(`  ✅ IN REJECTED SF SYNC: ${inRejectedSync.length} items have SF IDs available`);
  console.log(`  ❌ NOT IN REJECTED SF SYNC: ${notInRejectedSync.length} items (SF doesn't have them)\n`);

  if (inRejectedSync.length > 0) {
    console.log('  Items available in rejected sync (can be updated):');
    inRejectedSync.forEach(item => {
      const inBucket = inPendingBucket.find(p => p.name === item.name && p.type === item.type);
      const status = inBucket ? `IN BUCKET (${inBucket.jobsWaiting} jobs waiting)` : 'not in bucket';
      console.log(`    - ${item.name} (${item.type}) → SF ID: ${item.sfId} | ${status}`);
    });
    console.log('');
  }

  if (notInRejectedSync.length > 0) {
    console.log('  Items NOT in rejected sync (genuinely missing from SF):');
    notInRejectedSync.forEach(item => {
      console.log(`    - ${item.name} (${item.type}) | Current ID: ${item.currentId}`);
    });
    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📊 SUMMARY:\n');
  console.log(`  Total items missing SF IDs in master lists: ${totalMissing}`);
  console.log(`  └─ In pending creation requests: ${inPendingBucket.length} (${((inPendingBucket.length/totalMissing)*100).toFixed(1)}%)`);
  console.log(`  └─ Not in pending requests: ${notInPendingBucket.length} (${((notInPendingBucket.length/totalMissing)*100).toFixed(1)}%)`);
  console.log(`  └─ Available in rejected SF sync: ${inRejectedSync.length} (${((inRejectedSync.length/totalMissing)*100).toFixed(1)}%)`);
  console.log(`  └─ Not in rejected SF sync: ${notInRejectedSync.length} (${((notInRejectedSync.length/totalMissing)*100).toFixed(1)}%)\n`);

  const canBeUpdatedNow = inRejectedSync.filter(item => 
    inPendingBucket.some(p => p.name === item.name && p.type === item.type)
  ).length;

  console.log(`💡 ACTIONABLE:`);
  console.log(`  ${canBeUpdatedNow} items can be updated RIGHT NOW (in both pending bucket AND rejected sync)`);
  console.log(`  Approving the rejected sync would unblock these items\n`);

  await mongoose.disconnect();
}

analyze().catch(err => {
  console.error(err);
  process.exit(1);
});
