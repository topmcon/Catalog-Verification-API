#!/usr/bin/env node
const fs = require('fs');
const mongoose = require('mongoose');

async function quickCount() {
  console.log('Loading existing attributes...');
  const existingAttributes = JSON.parse(
    fs.readFileSync('src/config/salesforce-picklists/attributes.json', 'utf8')
  );
  console.log(`Existing: ${existingAttributes.length} attributes`);

  const existingMap = new Set();
  existingAttributes.forEach(attr => {
    existingMap.add(attr.attribute_name.toLowerCase().trim());
  });

  console.log('Connecting to MongoDB...');
  await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
  
  const PendingSync = mongoose.model('PendingSync', new mongoose.Schema({}, {
    strict: false,
    collection: 'pending_picklist_syncs'
  }));

  console.log('Loading rejected sync...');
  const rejectedSync = await PendingSync.findOne({
    status: 'rejected'
  }).sort({ created_at: -1 }).lean();

  const sfAttributes = rejectedSync.incoming_data.attributes;
  console.log(`SF sent: ${sfAttributes.length} attributes`);

  console.log('Categorizing...');
  let alreadyHave = 0;
  let trulyNew = 0;

  for (const sfAttr of sfAttributes) {
    const sfNormalized = sfAttr.attribute_name.toLowerCase().trim();
    if (existingMap.has(sfNormalized)) {
      alreadyHave++;
    } else {
      trulyNew++;
    }
  }

  console.log('\n=== RESULTS ===');
  console.log(`Already in our system: ${alreadyHave} (${((alreadyHave/sfAttributes.length)*100).toFixed(1)}%)`);
  console.log(`Not in our system: ${trulyNew} (${((trulyNew/sfAttributes.length)*100).toFixed(1)}%)`);

  await mongoose.disconnect();
}

quickCount().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
