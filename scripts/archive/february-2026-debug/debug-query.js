#!/usr/bin/env node
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    console.log('✅ Connected to MongoDB\n');
    
    const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false, collection: 'verification_jobs' }));
    
    // Try different queries
    console.log('Testing queries...\n');
    
    const totalCount = await Job.countDocuments();
    console.log(`Total documents in collection: ${totalCount}`);
    
    const completedCount = await Job.countDocuments({ status: 'completed' });
    console.log(`Completed documents: ${completedCount}`);
    
    const recent10 = await Job.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(10);
    console.log(`\nFound ${recent10.length} recent completed jobs\n`);
    
    if (recent10.length > 0) {
      recent10.slice(0, 3).forEach((job, i) => {
        console.log(`[${i+1}] ${job.sfCatalogName || 'N/A'}`);
        console.log(`    Status: ${job.status}`);
        console.log(`    Has result: ${!!job.result}`);
        console.log(`    Has Primary_Attributes: ${!!job.result?.Primary_Attributes}`);
        if (job.result?.Primary_Attributes) {
          console.log(`    Brand: ${job.result.Primary_Attributes.AI_Brand}`);
          console.log(`    Category: ${job.result.Primary_Attributes.AI_Product_Category}`);
        }
        console.log('');
      });
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
