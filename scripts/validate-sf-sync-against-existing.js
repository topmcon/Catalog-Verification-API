#!/usr/bin/env node
const fs = require('fs');
const mongoose = require('mongoose');

async function validateSync() {
  console.log('\n🔍 VALIDATING SF SYNC DATA AGAINST OUR EXISTING LISTS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Load OUR existing attributes.json
  const existingAttributes = JSON.parse(
    fs.readFileSync('src/config/salesforce-picklists/attributes.json', 'utf8')
  );

  console.log(`📚 OUR EXISTING attributes.json: ${existingAttributes.length} items\n`);

  // Build map of what we already have (case-insensitive, normalized)
  const existingMap = new Map();
  existingAttributes.forEach(attr => {
    const normalized = attr.attribute_name.toLowerCase().trim();
    existingMap.set(normalized, {
      original: attr.attribute_name,
      id: attr.attribute_id
    });
  });

  // Connect to MongoDB
  await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
  
  const CreationRequest = mongoose.model('CreationRequest', new mongoose.Schema({}, {
    strict: false,
    collection: 'pending_creation_requests'
  }));

  const PendingSync = mongoose.model('PendingSync', new mongoose.Schema({}, {
    strict: false,
    collection: 'pending_picklist_syncs'
  }));

  // Get pending requests
  const pendingRequests = await CreationRequest.find({ 
    status: 'pending',
    request_type: 'attribute'
  }).lean();

  const pendingMap = new Map();
  pendingRequests.forEach(req => {
    const normalized = req.requested_value.toLowerCase().trim();
    pendingMap.set(normalized, req);
  });

  console.log(`📤 PENDING REQUESTS: ${pendingRequests.length} new attributes we're asking for\n`);

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
  console.log(`📥 SF SENT: ${sfAttributes.length} total attributes\n`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Categorize SF data
  const alreadyHave = [];           // In our existing attributes.json
  const pendingMatches = [];        // Matches our pending requests
  const trulyNew = [];              // Not in existing, not in pending
  const namingMismatches = [];      // Potential capitalization/plural issues

  for (const sfAttr of sfAttributes) {
    const sfNormalized = sfAttr.attribute_name.toLowerCase().trim();
    
    // Check if we already have it
    if (existingMap.has(sfNormalized)) {
      const existing = existingMap.get(sfNormalized);
      alreadyHave.push({
        sfName: sfAttr.attribute_name,
        ourName: existing.original,
        sfId: sfAttr.attribute_id,
        ourId: existing.id,
        exactMatch: sfAttr.attribute_name === existing.original
      });
    }
    // Check if it matches pending request
    else if (pendingMap.has(sfNormalized)) {
      pendingMatches.push({
        name: sfAttr.attribute_name,
        sfId: sfAttr.attribute_id
      });
    }
    // Truly new
    else {
      trulyNew.push({
        name: sfAttr.attribute_name,
        sfId: sfAttr.attribute_id
      });
    }
  }

  // Analyze naming mismatches in "already have"
  const exactMatches = alreadyHave.filter(item => item.exactMatch);
  const caseMismatches = alreadyHave.filter(item => !item.exactMatch);

  console.log('📊 CATEGORIZATION OF SF DATA:\n');
  console.log(`  ✅ ALREADY IN OUR SYSTEM: ${alreadyHave.length} (${((alreadyHave.length/sfAttributes.length)*100).toFixed(1)}%)`);
  console.log(`     └─ Exact name match: ${exactMatches.length}`);
  console.log(`     └─ Case/format mismatch: ${caseMismatches.length}\n`);
  
  console.log(`  🆕 MATCHES PENDING REQUESTS: ${pendingMatches.length} (${((pendingMatches.length/sfAttributes.length)*100).toFixed(1)}%)`);
  console.log(`     └─ These are NEW attributes we asked SF to create\n`);
  
  console.log(`  ❓ TRULY UNREQUESTED: ${trulyNew.length} (${((trulyNew.length/sfAttributes.length)*100).toFixed(1)}%)`);
  console.log(`     └─ Not in our system, not in pending requests\n`);

  // Show case/format mismatches
  if (caseMismatches.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('⚠️  CASE/FORMAT MISMATCHES (SF vs Our System):\n');
    console.log('These items are the same but have different capitalization:\n');
    
    caseMismatches.slice(0, 20).forEach((item, i) => {
      console.log(`  ${i+1}. SF: "${item.sfName}" vs Ours: "${item.ourName}"`);
      console.log(`     SF ID: ${item.sfId} | Our ID: ${item.ourId}`);
    });
    
    if (caseMismatches.length > 20) {
      console.log(`\n  ... and ${caseMismatches.length - 20} more case mismatches\n`);
    }
  }

  // Show sample of truly unrequested
  if (trulyNew.length > 0) {
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('❓ SAMPLE OF TRULY UNREQUESTED ATTRIBUTES:\n');
    console.log('These are NOT in our system and we never requested them:\n');
    
    trulyNew.slice(0, 30).forEach((item, i) => {
      console.log(`  ${i+1}. "${item.name}" → ID: ${item.sfId}`);
    });
    
    if (trulyNew.length > 30) {
      console.log(`\n  ... and ${trulyNew.length - 30} more\n`);
    }
  }

  // Reconciliation recommendation
  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('💡 RECONCILIATION STRATEGY:\n');
  console.log(`  1. ✅ UPDATE IDs for ${alreadyHave.length} existing attributes (ID sync only)`);
  console.log(`     - Keep our attribute names (preserve capitalization)`);
  console.log(`     - Update IDs if they changed in SF\n`);
  
  console.log(`  2. ✅ ADD ${pendingMatches.length} new attributes from pending requests`);
  console.log(`     - These are items we explicitly requested`);
  console.log(`     - Add to attributes.json with SF IDs`);
  console.log(`     - Mark pending requests as fulfilled\n`);
  
  console.log(`  3. ❌ REJECT ${trulyNew.length} unrequested attributes`);
  console.log(`     - Not in our system, we never asked for them`);
  console.log(`     - Don't add to attributes.json`);
  console.log(`     - Prevents polluting our system\n`);

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🎯 VALIDATION RESULT:\n');
  
  const totalExpected = alreadyHave.length + pendingMatches.length;
  const coverage = (totalExpected / sfAttributes.length) * 100;
  
  console.log(`  Expected items (existing + pending): ${totalExpected}`);
  console.log(`  SF sent total: ${sfAttributes.length}`);
  console.log(`  Coverage: ${coverage.toFixed(1)}%`);
  console.log(`  Truly unrequested: ${trulyNew.length} (${(100-coverage).toFixed(1)}%)\n`);

  if (coverage > 80) {
    console.log('✅ GOOD: Most of SF data is expected (existing + requested)\n');
  } else {
    console.log('⚠️  WARNING: Large amount of unrequested data from SF\n');
  }

  await mongoose.disconnect();
}

validateSync().catch(err => {
  console.error(err);
  process.exit(1);
});
