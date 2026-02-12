#!/usr/bin/env node
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    
    // Check both possible collections
    const collections = ['verification_jobs', 'verificationjobs'];
    
    for (const collName of collections) {
      const Job = mongoose.model(`Job_${collName}`, new mongoose.Schema({}, { strict: false, collection: collName }));
      const count = await Job.countDocuments();
      const recent = await Job.find({}).sort({ receivedAt: -1 }).limit(5);
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`COLLECTION: ${collName}`);
      console.log(`Total documents: ${count}`);
      console.log('='.repeat(80));
      
      if (recent.length > 0) {
        console.log('\nLAST 5 JOBS:\n');
        recent.forEach((j, i) => {
          console.log(`[${i+1}] Status: ${j.status || 'undefined'}`);
          console.log(`    JobID: ${j.jobId || j._id.toString().substring(0, 8)}`);
          console.log(`    Product: ${j.payload?.Product_Name?.substring(0, 50) || 'N/A'}`);
          console.log(`    Brand: ${j.verifiedData?.brand_verified || '❌ MISSING'}`);
          console.log(`    Category: ${j.verifiedData?.category_verified || '❌ MISSING'}`);
          console.log(`    Time: ${new Date(j.receivedAt).toLocaleString()}`);
          console.log('');
        });
      }
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
