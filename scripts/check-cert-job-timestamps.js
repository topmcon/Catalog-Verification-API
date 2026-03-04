#!/usr/bin/env node
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification').then(async () => {
  const CreationRequest = mongoose.model('CreationRequest', new mongoose.Schema({}, {
    strict: false,
    collection: 'pending_creation_requests'
  }));
  
  const cert = await CreationRequest.findOne({
    requested_value: 'certifications',
    status: 'pending'
  }).lean();
  
  if (cert && cert.requested_by_jobs) {
    const jobs = cert.requested_by_jobs;
    console.log(`\nTotal jobs: ${jobs.length}\n`);
    
    const sorted = jobs.sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));
    
    console.log('Most recent 5 jobs requesting certifications:');
    sorted.slice(0, 5).forEach(job => {
      console.log(`  ${job.job_id} at ${new Date(job.requested_at).toISOString()}`);
    });
    
    console.log('\nOldest 5 jobs:');
    sorted.slice(-5).forEach(job => {
      console.log(`  ${job.job_id} at ${new Date(job.requested_at).toISOString()}`);
    });
    console.log('');
  }
  
  await mongoose.disconnect();
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
