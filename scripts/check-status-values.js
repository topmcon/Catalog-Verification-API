#!/usr/bin/env node
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    
    const Job = mongoose.model('Job', new mongoose.Schema({}, { strict: false, collection: 'verification_jobs' }));
    
    // Get status breakdown
    const statuses = await Job.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n=== JOB STATUS BREAKDOWN ===\n');
    statuses.forEach(s => {
      console.log(`  ${s._id || 'null'}: ${s.count}`);
    });
    
    // Get sample from each status
    for (const statusGroup of statuses.slice(0, 3)) {
      const status = statusGroup._id;
      console.log(`\n--- Sample ${status} job ---`);
      const sample = await Job.findOne({ status }).sort({ createdAt: -1 });
      if (sample) {
        console.log(`JobID: ${sample.jobId}`);
        console.log(`Model: ${sample.sfCatalogName}`);
        console.log(`Created: ${sample.createdAt}`);
        console.log(`Status: ${sample.status}`);
        if (sample.result?.Primary_Attributes) {
          console.log(`Brand: ${sample.result.Primary_Attributes.AI_Brand || 'N/A'}`);
          console.log(`Category: ${sample.result.Primary_Attributes.AI_Product_Category || 'N/A'}`);
        }
      }
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
