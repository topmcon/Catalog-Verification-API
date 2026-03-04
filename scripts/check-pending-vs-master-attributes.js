#!/usr/bin/env node
/**
 * Check if pending attribute requests already exist in master attributes.json
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb://127.0.0.1:27017/catalog-verification';
const ATTRIBUTES_PATH = path.join(__dirname, '../src/config/salesforce-picklists/attributes.json');

async function checkForExisting() {
  try {
    await mongoose.connect(MONGO_URI);
    
    const CreationRequest = mongoose.model('CreationRequest', new mongoose.Schema({}, {
      strict: false,
      collection: 'pending_creation_requests'
    }));
    
    console.log('\n══ CHECKING PENDING vs MASTER ATTRIBUTES ══\n');
    
    // Load master attributes
    const masterAttributes = JSON.parse(fs.readFileSync(ATTRIBUTES_PATH, 'utf8'));
    console.log(`📋 Master attributes.json: ${masterAttributes.length} attributes\n`);
    
    // Create lookup by normalized attribute_name
    const masterByName = {};
    masterAttributes.forEach(attr => {
      const normalized = (attr.attribute_name || '').toLowerCase().trim().replace(/\s+/g, ' ');
      masterByName[normalized] = attr;
    });
    
    // Get pending attributes
    const pending = await CreationRequest.find({
      request_type: 'attribute',
      status: 'pending'
    }).lean();
    
    console.log(`📋 Pending attribute requests: ${pending.length}\n`);
    
    // Check for matches
    const alreadyExist = [];
    const genuinelyMissing = [];
    
    pending.forEach(req => {
      const normalized = req.requested_value_normalized;
      if (masterByName[normalized]) {
        alreadyExist.push({
          requested: req.requested_value,
          normalized: normalized,
          existing: masterByName[normalized],
          request_count: req.request_count,
          jobs_waiting: req.requested_by_jobs?.length || 0
        });
      } else {
        genuinelyMissing.push(req);
      }
    });
    
    if (alreadyExist.length > 0) {
      console.log(`🔴 PROBLEM: ${alreadyExist.length} pending requests ALREADY EXIST in master list!\n`);
      console.log(`This means the attribute matching logic is NOT checking attributes.json properly.\n`);
      
      console.log('Top 10 examples:\n');
      alreadyExist.slice(0, 10).forEach((item, i) => {
        console.log(`  ${i+1}. Requested: "${item.requested}"`);
        console.log(`     Exists as: "${item.existing.attribute_name}" (ID: ${item.existing.attribute_id})`);
        console.log(`     Request count: ${item.request_count}, Jobs waiting: ${item.jobs_waiting}\n`);
      });
      
      const totalWastedRequests = alreadyExist.reduce((sum, item) => sum + item.request_count, 0);
      const totalWastedJobs = alreadyExist.reduce((sum, item) => sum + item.jobs_waiting, 0);
      
      console.log(`   Total wasted requests: ${totalWastedRequests}`);
      console.log(`   Total jobs unnecessarily waiting: ${totalWastedJobs}\n`);
      
    } else {
      console.log(`✅ GOOD: All ${pending.length} pending requests are genuinely missing from master list\n`);
    }
    
    console.log('════════════════════════════════════════════\n');
    console.log(`Summary:`);
    console.log(`  ✅ Genuinely missing: ${genuinelyMissing.length}`);
    console.log(`  🔴 Already exist: ${alreadyExist.length}\n`);
    
    if (alreadyExist.length > 0) {
      console.log(`⚠️  BUG DETECTED: Attribute matching is not checking attributes.json\n`);
      console.log(`This explains why jobs are waiting - they're requesting attributes we already have!\n`);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkForExisting();
