#!/usr/bin/env node
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false, collection: 'verificationjobs' }));
    
    // Get recent jobs
    const recent = await Job.find({}).sort({ receivedAt: -1 }).limit(10);
    const statuses = await Job.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('\n=== STATUS BREAKDOWN ===');
    statuses.forEach(s => console.log(`  ${s._id}: ${s.count}`));
    
    console.log('\n=== LAST 10 JOBS ===\n');
    recent.forEach((j, i) => {
      console.log(`[${i+1}] Status: ${j.status || 'undefined'}`);
      console.log(`    JobID: ${j.jobId || j._id.toString().substring(0, 8)}`);
      console.log(`    Product: ${j.payload?.Product_Name?.substring(0, 50) || 'N/A'}`);
      console.log(`    Brand: ${j.verifiedData?.brand_verified || '❌ MISSING'}`);
      console.log(`    Category: ${j.verifiedData?.category_verified || '❌ MISSING'}`);
      console.log(`    Time: ${new Date(j.receivedAt).toLocaleString()}`);
      console.log('');
    });
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
