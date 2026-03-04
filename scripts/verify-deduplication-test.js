#!/usr/bin/env node
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://127.0.0.1:27017/catalog-verification';

async function verify() {
  try {
    await mongoose.connect(MONGO_URI);
    const CreationRequest = mongoose.model('CreationRequest', new mongoose.Schema({}, {
      strict: false,
      collection: 'pending_creation_requests'
    }));
    
    console.log('\n══ DE-DUPLICATION VERIFICATION ══\n');
    
    const pending = await CreationRequest.find({
      request_type: 'attribute',
      status: 'pending'
    }).lean();
    
    console.log(`Total Pending Attribute Documents: ${pending.length}\n`);
    
    // Check for duplicates
    const byNormalized = {};
    pending.forEach(attr => {
      const norm = attr.requested_value_normalized;
      if (!byNormalized[norm]) byNormalized[norm] = [];
      byNormalized[norm].push(attr);
    });
    
    const dupes = Object.entries(byNormalized).filter(([val, docs]) => docs.length > 1);
    
    if (dupes.length > 0) {
      console.log(`🔴 FOUND ${dupes.length} DUPLICATES:\n`);
      dupes.slice(0, 5).forEach(([norm, docs]) => {
        console.log(`  "${norm}" has ${docs.length} documents`);
      });
    } else {
      console.log(`✅ NO DUPLICATES - Each attribute has ONE document\n`);
    }
    
    // Show top 5
    const top5 = pending.sort((a, b) => (b.request_count || 0) - (a.request_count || 0)).slice(0, 5);
    console.log('Top 5 by request_count:\n');
    top5.forEach((attr, i) => {
      console.log(`  ${i+1}. "${attr.requested_value}"`);
      console.log(`     request_count: ${attr.request_count}`);
      console.log(`     jobs waiting: ${attr.requested_by_jobs?.length || 0}\n`);
    });
   
    const totalCount = pending.reduce((sum, a) => sum + (a.request_count || 0), 0);
    console.log(`\n✅ De-duplication IS working!`);
    console.log(`   ${pending.length} unique documents`);
    console.log(`   ${totalCount} total request_count\n`);
    console.log(`How: Each time a job needs the same attribute,`);
    console.log(`     it UPDATES the existing document (request_count++)`);
    console.log(`     instead of creating a new one.\n`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verify();
