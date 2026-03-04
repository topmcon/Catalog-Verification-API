#!/usr/bin/env node
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb://127.0.0.1:27017/catalog-verification';
const ATTRIBUTES_PATH = path.join(__dirname, '../src/config/salesforce-picklists/attributes.json');

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    const CreationRequest = mongoose.model('CreationRequest', new mongoose.Schema({}, {
      strict: false,
      collection: 'pending_creation_requests'
    }));
    
    console.log('\n══ PENDING vs MASTER ATTRIBUTES CHECK ══\n');
    
    const masterAttributes = JSON.parse(fs.readFileSync(ATTRIBUTES_PATH, 'utf8'));
    console.log(`Master attributes.json: ${masterAttributes.length} attributes\n`);
    
    const masterByName = {};
    masterAttributes.forEach(attr => {
      const normalized = (attr.attribute_name || '').toLowerCase().trim().replace(/\s+/g, ' ');
      masterByName[normalized] = attr;
    });
    
    const pending = await CreationRequest.find({
      request_type: 'attribute',
      status: 'pending'
    }).lean();
    
    console.log(`Pending requests: ${pending.length}\n`);
    
    const alreadyExist = [];
    const genuinelyMissing = [];
    
    pending.forEach(req => {
      const normalized = req.requested_value_normalized;
      if (masterByName[normalized]) {
        alreadyExist.push({
          requested: req.requested_value,
          existing: masterByName[normalized],
          request_count: req.request_count,
          jobs: req.requested_by_jobs?.length || 0
        });
      } else {
        genuinelyMissing.push(req);
      }
    });
    
    if (alreadyExist.length > 0) {
      console.log(`🔴 PROBLEM: ${alreadyExist.length} pending requests ALREADY EXIST!\n`);
      console.log('Top 10 examples:\n');
      alreadyExist.slice(0, 10).forEach((item, i) => {
        console.log(`  ${i+1}. Requested: "${item.requested}"`);
        console.log(`     Exists as: "${item.existing.attribute_name}"`);
        console.log(`     ID: ${item.existing.attribute_id}`);
        console.log(`     Request count: ${item.request_count}, Jobs: ${item.jobs}\n`);
      });
      
      const totalWasted = alreadyExist.reduce((sum, item) => sum + item.request_count, 0);
      const totalJobsWaiting = alreadyExist.reduce((sum, item) => sum + item.jobs, 0);
      
      console.log(`Total wasted requests: ${totalWasted}`);
      console.log(`Total jobs waiting: ${totalJobsWaiting}\n`);
      console.log(`⚠️  BUG: Attribute matching not checking attributes.json properly!\n`);
    } else {
      console.log(`✅ All ${pending.length} pending requests are genuinely missing\n`);
    }
    
    console.log(`Summary:`);
    console.log(`  Genuinely missing: ${genuinelyMissing.length}`);
    console.log(`  Already exist: ${alreadyExist.length}\n`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

check();
