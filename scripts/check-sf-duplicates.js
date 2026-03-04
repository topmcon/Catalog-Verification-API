#!/usr/bin/env node
const fs = require('fs');
const mongoose = require('mongoose');

async function checkDuplicates() {
  console.log('🔍 Checking for duplicates in SF sync data\n');

  // Load existing
  const existingAttributes = JSON.parse(
    fs.readFileSync('src/config/salesforce-picklists/attributes.json', 'utf8')
  );
  console.log(`Our system: ${existingAttributes.length} attributes\n`);

  await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
  
  const PendingSync = mongoose.model('PendingSync', new mongoose.Schema({}, {
    strict: false,
    collection: 'pending_picklist_syncs'
  }));

  const rejectedSync = await PendingSync.findOne({
    status: 'rejected'
  }).sort({ created_at: -1 }).lean();

  const sfAttributes = rejectedSync.incoming_data.attributes;
  console.log(`SF sent: ${sfAttributes.length} total items\n`);

  // Check for duplicates in SF data
  const sfNameCounts = new Map();
  const sfIdCounts = new Map();

  sfAttributes.forEach(attr => {
    const name = attr.attribute_name.toLowerCase().trim();
    const id = attr.attribute_id;
    
    sfNameCounts.set(name, (sfNameCounts.get(name) || 0) + 1);
    sfIdCounts.set(id, (sfIdCounts.get(id) || 0) + 1);
  });

  // Find duplicates
  const dupNames = Array.from(sfNameCounts.entries())
    .filter(([name, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  const dupIds = Array.from(sfIdCounts.entries())
    .filter(([id, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📊 DUPLICATE ANALYSIS:\n');
  console.log(`Duplicate attribute names: ${dupNames.length}`);
  console.log(`Duplicate attribute IDs: ${dupIds.length}\n`);

  if (dupNames.length > 0) {
    console.log('Top duplicate names (first 20):');
    dupNames.slice(0, 20).forEach(([name, count]) => {
      console.log(`  "${name}" appears ${count} times`);
    });
    console.log('');
  }

  if (dupIds.length > 0) {
    console.log('Top duplicate IDs (first 10):');
    dupIds.slice(0, 10).forEach(([id, count]) => {
      console.log(`  ${id} appears ${count} times`);
    });
    console.log('');
  }

  // Calculate unique counts
  const uniqueNames = sfNameCounts.size;
  const uniqueIds = sfIdCounts.size;

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`SF sent ${sfAttributes.length} total items:`);
  console.log(`  Unique names: ${uniqueNames}`);
  console.log(`  Unique IDs: ${uniqueIds}`);
  console.log(`  Duplicate names: ${sfAttributes.length - uniqueNames}`);
  console.log(`  Duplicate IDs: ${sfAttributes.length - uniqueIds}\n`);

  // Now check against our system with unique SF data
  const existingMap = new Set();
  existingAttributes.forEach(attr => {
    existingMap.add(attr.attribute_name.toLowerCase().trim());
  });

  const uniqueSfNames = Array.from(sfNameCounts.keys());
  let matchesExisting = 0;
  let notInSystem = 0;

  uniqueSfNames.forEach(name => {
    if (existingMap.has(name)) {
      matchesExisting++;
    } else {
      notInSystem++;
    }
  });

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Comparing ${uniqueNames} unique SF attributes to our ${existingAttributes.length}:\n`);
  console.log(`  ✅ Matches our existing: ${matchesExisting} (${((matchesExisting/uniqueNames)*100).toFixed(1)}%)`);
  console.log(`  ❓ Not in our system: ${notInSystem} (${((notInSystem/uniqueNames)*100).toFixed(1)}%)\n`);

  await mongoose.disconnect();
}

checkDuplicates().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
