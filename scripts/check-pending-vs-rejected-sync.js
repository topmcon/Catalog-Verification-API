#!/usr/bin/env node
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification').then(async () => {
  const PendingSync = mongoose.model('PendingSync', new mongoose.Schema({}, {
    strict: false,
    collection: 'pending_picklist_syncs'
  }));
  
  const CreationRequest = mongoose.model('CreationRequest', new mongoose.Schema({}, {
    strict: false,
    collection: 'pending_creation_requests'
  }));

  console.log('\n🔍 Checking if pending attribute requests exist in rejected SF sync data\n');

  // Get rejected syncs with incoming_data
  const rejectedSyncs = await PendingSync.find({
    status: 'rejected',
    'incoming_data.attributes': { $exists: true }
  }).sort({ created_at: -1 }).limit(5).lean();

  if (rejectedSyncs.length === 0) {
    console.log('❌ No rejected syncs found with attribute data\n');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`Found ${rejectedSyncs.length} rejected syncs with attribute data`);
  console.log(`Using most recent: ${rejectedSyncs[0].sync_id} (${rejectedSyncs[0].created_at})\n`);

  const sfAttributes = rejectedSyncs[0].incoming_data.attributes || [];
  console.log(`SF sent ${sfAttributes.length} attributes in this sync\n`);

  // Get pending attribute requests
  const pendingAttrs = await CreationRequest.find({
    request_type: 'attribute',
    status: 'pending'
  }).lean();

  console.log(`We have ${pendingAttrs.length} pending attribute requests\n`);
  console.log('───────────────────────────────────────────────────────────────\n');

  // Build SF attribute map (normalized name -> full record)
  const sfAttrMap = new Map();
  sfAttributes.forEach(attr => {
    const key = attr.attribute_name.toLowerCase().trim();
    sfAttrMap.set(key, attr);
  });

  // Check which pending requests exist in SF sync
  const found = [];
  const notFound = [];

  for (const pending of pendingAttrs) {
    const key = pending.requested_value.toLowerCase().trim();
    if (sfAttrMap.has(key)) {
      const sfAttr = sfAttrMap.get(key);
      found.push({
        requested: pending.requested_value,
        sfName: sfAttr.attribute_name,
        sfId: sfAttr.attribute_id,
        requestCount: pending.request_count,
        jobsWaiting: pending.requested_by_jobs?.length || 0,
        requestId: pending.request_id
      });
    } else {
      notFound.push(pending.requested_value);
    }
  }

  if (found.length > 0) {
    console.log(`✅ FOUND ${found.length} pending attributes in rejected SF sync:\n`);
    found.sort((a, b) => b.requestCount - a.requestCount);
    found.forEach(f => {
      console.log(`  "${f.requested}" → "${f.sfName}" (${f.sfId})`);
      console.log(`    Request count: ${f.requestCount}, Jobs waiting: ${f.jobsWaiting}`);
      console.log(`    Request ID: ${f.requestId}\n`);
    });
    
    const totalWasted = found.reduce((sum, f) => sum + f.requestCount, 0);
    const totalJobsBlocked = found.reduce((sum, f) => sum + f.jobsWaiting, 0);
    console.log(`💥 IMPACT: ${totalWasted} wasted requests, ${totalJobsBlocked} jobs blocked`);
    console.log(`🔴 These attributes already exist in SF but we rejected the sync!\n`);
  } else {
    console.log('✅ None of the pending attributes exist in rejected SF sync\n');
  }

  console.log(`❌ ${notFound.length} pending attributes NOT in SF sync (genuinely missing)\n`);

  await mongoose.disconnect();
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
