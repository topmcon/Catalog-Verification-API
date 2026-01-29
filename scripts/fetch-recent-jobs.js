/**
 * Fetch last 5 verification jobs from production database
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

// Schema
const verificationJobSchema = new mongoose.Schema({
  jobId: String,
  rawPayload: Object,
  response: Object,
  status: String,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'verification_jobs', strict: false });

const VerificationJob = mongoose.model('VerificationJob', verificationJobSchema);

async function fetchRecentJobs() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    console.log('Fetching last 5 jobs...\n');
    
    const jobs = await VerificationJob
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    if (jobs.length === 0) {
      console.log('No jobs found in database.');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`Found ${jobs.length} recent jobs:\n`);
    
    jobs.forEach((job, index) => {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`JOB #${index + 1}`);
      console.log(`${'='.repeat(70)}`);
      console.log(`Job ID: ${job.jobId}`);
      console.log(`Created: ${job.createdAt}`);
      console.log(`Status: ${job.status}`);
      
      if (job.response) {
        console.log(`\nResponse Summary:`);
        console.log(`  Category: ${job.response.category || 'null'}`);
        console.log(`  Brand: ${job.response.brand || 'null'}`);
        console.log(`  Style: ${job.response.style || 'null'}`);
        console.log(`  Family: ${job.response.family || 'null'}`);
        
        // Count populated fields
        const populatedFields = Object.keys(job.response).filter(
          key => job.response[key] !== null && job.response[key] !== undefined
        );
        console.log(`  Populated Fields: ${populatedFields.length}`);
        
        // Check for null TOP15 fields
        const top15Fields = [
          'brand', 'category', 'style', 'family',
          'width', 'height', 'depth', 'weight',
          'color', 'finish', 'material', 'voltage',
          'wattage', 'capacity', 'warranty'
        ];
        
        const missingTop15 = top15Fields.filter(
          field => !job.response[field] || job.response[field] === null
        );
        
        if (missingTop15.length > 0) {
          console.log(`  Missing TOP15 Fields (${missingTop15.length}): ${missingTop15.join(', ')}`);
        }
      }
      
      if (job.rawPayload) {
        console.log(`\nRaw Payload Available: YES`);
        console.log(`  SF Catalog ID: ${job.rawPayload.sf_catalog_id || 'unknown'}`);
        
        // Save to file for testing
        const fs = require('fs');
        const path = require('path');
        const filename = path.join(__dirname, '..', 'test-data', `recent-job-${index + 1}.json`);
        
        fs.writeFileSync(filename, JSON.stringify({
          jobId: job.jobId,
          rawPayload: job.rawPayload,
          response: job.response,
          createdAt: job.createdAt
        }, null, 2));
        
        console.log(`  Saved to: test-data/recent-job-${index + 1}.json`);
      }
    });
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`\nSUMMARY:`);
    console.log(`Total jobs fetched: ${jobs.length}`);
    console.log(`Saved to test-data/ for testing`);
    console.log(`\nTo test self-healing on these jobs:`);
    console.log(`  curl -X POST http://localhost:3001/api/self-healing/trigger \\`);
    console.log(`    -H "Content-Type: application/json" \\`);
    console.log(`    -d '{"jobId": "${jobs[0]?.jobId}"}'`);
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fetchRecentJobs();
