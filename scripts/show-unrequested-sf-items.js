#!/usr/bin/env node
const mongoose = require('mongoose');

async function showUnrequested() {
  console.log('\n🚨 ATTRIBUTES SF SENT THAT WE NEVER REQUESTED\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
  
  const CreationRequest = mongoose.model('CreationRequest', new mongoose.Schema({}, {
    strict: false,
    collection: 'pending_creation_requests'
  }));

  const PendingSync = mongoose.model('PendingSync', new mongoose.Schema({}, {
    strict: false,
    collection: 'pending_picklist_syncs'
  }));

  // Get what WE requested
  const pendingRequests = await CreationRequest.find({ 
    status: 'pending',
    request_type: 'attribute'
  }).lean();

  const weRequestedMap = new Set();
  pendingRequests.forEach(req => {
    weRequestedMap.add(req.requested_value.toLowerCase());
  });

  console.log(`📤 What we requested: ${weRequestedMap.size} unique attributes\n`);

  // Get what SF sent
  const rejectedSync = await PendingSync.findOne({
    status: 'rejected'
  }).sort({ created_at: -1 }).lean();

  if (!rejectedSync || !rejectedSync.incoming_data?.attributes) {
    console.log('❌ No rejected sync found\n');
    await mongoose.disconnect();
    return;
  }

  const sfAttributes = rejectedSync.incoming_data.attributes;
  console.log(`📥 What SF sent: ${sfAttributes.length} total attributes\n`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Find items SF sent that we didn't request
  const unrequested = [];
  for (const attr of sfAttributes) {
    if (!weRequestedMap.has(attr.attribute_name.toLowerCase())) {
      unrequested.push({
        name: attr.attribute_name,
        id: attr.attribute_id
      });
    }
  }

  console.log(`🚨 SF sent ${unrequested.length} attributes WE NEVER REQUESTED:\n`);
  console.log('Sample of unrequested attributes (first 50):\n');
  
  unrequested.slice(0, 50).forEach((attr, i) => {
    console.log(`  ${i+1}. "${attr.name}" → ID: ${attr.id}`);
  });
  
  if (unrequested.length > 50) {
    console.log(`\n  ... and ${unrequested.length - 50} more unrequested attributes\n`);
  }

  // Group by first letter to see patterns
  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('Breakdown by first letter (shows if there are patterns):\n');
  
  const letterGroups = {};
  unrequested.forEach(attr => {
    const firstChar = attr.name[0].toUpperCase();
    if (!letterGroups[firstChar]) letterGroups[firstChar] = 0;
    letterGroups[firstChar]++;
  });

  Object.keys(letterGroups).sort().forEach(letter => {
    const count = letterGroups[letter];
    const bar = '█'.repeat(Math.ceil(count / 50));
    console.log(`  ${letter}: ${count.toString().padStart(4)} ${bar}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('💡 RECOMMENDATION:\n');
  console.log(`  ✅ Accept and reconcile: 588 attributes (items we requested)`);
  console.log(`  ❌ REJECT: ${unrequested.length} attributes (items we never requested)`);
  console.log(`  ⏳ Keep pending: 6 attributes (we requested but SF doesn't have)\n`);
  console.log('This prevents polluting our system with unrequested data.\n');

  await mongoose.disconnect();
}

showUnrequested().catch(err => {
  console.error(err);
  process.exit(1);
});
