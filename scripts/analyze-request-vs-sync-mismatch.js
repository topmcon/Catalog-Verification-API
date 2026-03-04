#!/usr/bin/env node
const mongoose = require('mongoose');

async function analyzeMismatch() {
  console.log('\n🔍 REQUEST vs SYNC MISMATCH ANALYSIS\n');
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

  // Get pending attribute requests (what WE asked for)
  const pendingRequests = await CreationRequest.find({ 
    status: 'pending',
    request_type: 'attribute'
  }).lean();

  console.log(`📤 WHAT WE REQUESTED FROM SF: ${pendingRequests.length} attributes\n`);
  console.log('Sample of what we requested (first 10):');
  pendingRequests.slice(0, 10).forEach((req, i) => {
    console.log(`  ${i+1}. "${req.requested_value}" (requested ${req.request_count} times, ${req.requested_by_jobs?.length || 0} jobs waiting)`);
  });
  console.log('');

  // Get rejected SF sync (what SF sent)
  const rejectedSync = await PendingSync.findOne({
    status: 'rejected'
  }).sort({ created_at: -1 }).lean();

  if (!rejectedSync || !rejectedSync.incoming_data?.attributes) {
    console.log('❌ No rejected sync found\n');
    await mongoose.disconnect();
    return;
  }

  const sfAttributes = rejectedSync.incoming_data.attributes;
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`📥 WHAT SF SENT BACK: ${sfAttributes.length} attributes\n`);
  console.log('Sample of what SF sent (first 10):');
  sfAttributes.slice(0, 10).forEach((attr, i) => {
    console.log(`  ${i+1}. "${attr.attribute_name}" → ID: ${attr.attribute_id}`);
  });
  console.log('');

  // Build maps for matching
  const weRequestedMap = new Map();
  pendingRequests.forEach(req => {
    weRequestedMap.set(req.requested_value.toLowerCase(), req);
  });

  const sfSentMap = new Map();
  sfAttributes.forEach(attr => {
    sfSentMap.set(attr.attribute_name.toLowerCase(), attr);
  });

  // Three-way analysis
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🎯 MATCHING ANALYSIS:\n');

  // 1. Items we requested that SF sent (VALID - can reconcile)
  const validMatches = [];
  for (const req of pendingRequests) {
    const sfItem = sfSentMap.get(req.requested_value.toLowerCase());
    if (sfItem) {
      validMatches.push({
        name: req.requested_value,
        sfId: sfItem.attribute_id,
        requestCount: req.request_count,
        jobsWaiting: req.requested_by_jobs?.length || 0
      });
    }
  }

  console.log(`✅ VALID MATCHES (we requested, SF sent): ${validMatches.length}\n`);
  console.log('These can be safely reconciled (first 15):');
  validMatches.slice(0, 15).forEach((match, i) => {
    console.log(`  ${i+1}. "${match.name}" → SF ID: ${match.sfId}`);
    console.log(`      (${match.jobsWaiting} jobs waiting, requested ${match.requestCount} times)`);
  });
  if (validMatches.length > 15) console.log(`  ... and ${validMatches.length - 15} more`);
  console.log('');

  // 2. Items we requested that SF didn't send (STILL PENDING)
  const stillPending = [];
  for (const req of pendingRequests) {
    if (!sfSentMap.has(req.requested_value.toLowerCase())) {
      stillPending.push({
        name: req.requested_value,
        requestCount: req.request_count,
        jobsWaiting: req.requested_by_jobs?.length || 0
      });
    }
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`⏳ WE REQUESTED BUT SF DIDN'T SEND: ${stillPending.length}\n`);
  if (stillPending.length > 0) {
    console.log('These remain pending (need SF to create them):');
    stillPending.forEach((item, i) => {
      console.log(`  ${i+1}. "${item.name}" (${item.jobsWaiting} jobs waiting, requested ${item.requestCount} times)`);
    });
    console.log('');
  }

  // 3. Items SF sent that we didn't request (ANOMALY - should reject)
  const unrequestedItems = [];
  for (const attr of sfAttributes) {
    if (!weRequestedMap.has(attr.attribute_name.toLowerCase())) {
      unrequestedItems.push({
        name: attr.attribute_name,
        sfId: attr.attribute_id
      });
    }
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`🚨 SF SENT BUT WE DIDN'T REQUEST: ${unrequestedItems.length}\n`);
  if (unrequestedItems.length > 0) {
    console.log('⚠️  POTENTIAL DATA MISMATCH - These should be investigated:');
    console.log('Why did SF send items we never requested?\n');
    
    // Group by first letter to see patterns
    const firstLetterGroups = {};
    unrequestedItems.forEach(item => {
      const firstLetter = item.name[0].toUpperCase();
      if (!firstLetterGroups[firstLetter]) firstLetterGroups[firstLetter] = [];
      firstLetterGroups[firstLetter].push(item);
    });

    // Show detailed breakdown
    console.log('Showing first 30 unrequested items:');
    unrequestedItems.slice(0, 30).forEach((item, i) => {
      console.log(`  ${i+1}. "${item.name}" → SF ID: ${item.sfId}`);
    });
    if (unrequestedItems.length > 30) {
      console.log(`  ... and ${unrequestedItems.length - 30} more\n`);
    }

    console.log(`\nBreakdown by first letter (shows patterns):`);
    Object.keys(firstLetterGroups).sort().forEach(letter => {
      const count = firstLetterGroups[letter].length;
      console.log(`  ${letter}: ${count} items`);
    });
    console.log('');
  }

  // Summary and recommendations
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📊 SUMMARY:\n');
  console.log(`  We requested: ${pendingRequests.length} attributes`);
  console.log(`  SF sent: ${sfAttributes.length} attributes`);
  console.log(`  Valid matches: ${validMatches.length} (${((validMatches.length/pendingRequests.length)*100).toFixed(1)}% of our requests)`);
  console.log(`  Still pending: ${stillPending.length} (${((stillPending.length/pendingRequests.length)*100).toFixed(1)}% of our requests)`);
  console.log(`  Unrequested items: ${unrequestedItems.length} (${((unrequestedItems.length/sfAttributes.length)*100).toFixed(1)}% of SF's data)\n`);

  if (unrequestedItems.length > 0) {
    console.log('🚨 CRITICAL FINDING:');
    console.log(`  SF sent ${unrequestedItems.length} attributes we NEVER requested!`);
    console.log('  This indicates a data synchronization issue between our system and SF.\n');
    console.log('💡 RECOMMENDATION:');
    console.log('  1. Only reconcile the ${validMatches.length} valid matches');
    console.log('  2. REJECT the ${unrequestedItems.length} unrequested items');
    console.log('  3. Investigate why SF has attributes we never requested\n');
  } else {
    console.log('✅ SYNC QUALITY: Perfect match - SF only sent what we requested\n');
  }

  await mongoose.disconnect();
}

analyzeMismatch().catch(err => {
  console.error(err);
  process.exit(1);
});
