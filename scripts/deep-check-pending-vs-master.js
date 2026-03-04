#!/usr/bin/env node
const fs = require('fs');
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification').then(async () => {
  const CreationRequest = mongoose.model('CreationRequest', new mongoose.Schema({}, {
    strict: false,
    collection: 'pending_creation_requests'
  }));

  const pending = await CreationRequest.find({
    request_type: 'attribute',
    status: 'pending'
  }).lean();

  const attributesPath = 'src/config/salesforce-picklists/attributes.json';
  const masterAttributes = JSON.parse(fs.readFileSync(attributesPath));
  
  const normalize = (str) => str.toLowerCase().trim();
  
  const masterMap = new Map();
  masterAttributes.forEach(attr => {
    const key = normalize(attr.attribute_name);
    masterMap.set(key, attr);
  });

  console.log(`\n📋 Checking ${pending.length} pending attributes against ${masterAttributes.length} master attributes\n`);

  const matches = [];
  const missing = [];

  for (const req of pending) {
    const key = normalize(req.requested_value);
    if (masterMap.has(key)) {
      const masterAttr = masterMap.get(key);
      matches.push({
        requested: req.requested_value,
        master: masterAttr.attribute_name,
        id: masterAttr.attribute_id,
        request_count: req.request_count,
        jobs: req.requested_by_jobs?.length || 0
      });
    } else {
      missing.push(req.requested_value);
    }
  }

  console.log(`✅ MATCHES (attributes that exist in master): ${matches.length}`);
  console.log(`❌ MISSING (genuinely need from SF): ${missing.length}\n`);

  if (matches.length > 0) {
    console.log('🔴 PROBLEM - These pending requests ALREADY EXIST in master:\n');
    matches.sort((a, b) => b.request_count - a.request_count);
    matches.forEach(m => {
      console.log(`  "${m.requested}" → "${m.master}" (${m.id})`);
      console.log(`    Request count: ${m.request_count}, Jobs waiting: ${m.jobs}\n`);
    });
    
    const totalWasted = matches.reduce((sum, m) => sum + m.request_count, 0);
    const totalJobsBlocked = matches.reduce((sum, m) => sum + m.jobs, 0);
    console.log(`💥 IMPACT: ${totalWasted} wasted requests, ${totalJobsBlocked} jobs blocked\n`);
  }

  if (missing.length > 10) {
    console.log(`❌ First 10 genuinely missing: ${missing.slice(0, 10).join(', ')}`);
    console.log(`   (${missing.length - 10} more...)\n`);
  } else {
    console.log(`❌ Genuinely missing: ${missing.join(', ')}\n`);
  }

  await mongoose.disconnect();
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
