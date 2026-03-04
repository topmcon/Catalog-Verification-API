#!/usr/bin/env node
/**
 * Check all creation request statuses
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/catalog-verification';

async function checkStatuses() {
  try {
    await mongoose.connect(MONGO_URI);
    
    const CreationRequest = mongoose.model('CreationRequest', new mongoose.Schema({}, {
      strict: false,
      collection: 'pending_creation_requests'
    }));
    
    // Get all statuses
    const statuses = await CreationRequest.aggregate([
      { $group: { _id: { type: '$type', status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.type': 1, '_id.status': 1 } }
    ]);
    
    console.log('\n📊 Creation Requests by Type and Status:\n');
    
    let currentType = null;
    statuses.forEach(s => {
      if (currentType !== s._id.type) {
        currentType = s._id.type;
        console.log(`\n${currentType || 'null'}:`);
      }
      console.log(`   ${s._id.status || 'null'}: ${s.count}`);
    });
    
    // Get total by type
    const byType = await CreationRequest.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n\n📊 Total by Type:\n');
    byType.forEach(t => {
      console.log(`   ${t._id || 'null'}: ${t.count}`);
    });
    
    // Sample a few documents
    const sample = await CreationRequest.findOne({}).lean();
    
    if (sample) {
      console.log('\n\n📋 Sample Document Fields:\n');
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = Array.isArray(value) ? 'Array' : typeof value;
        console.log(`   ${key}: ${type}`);
      });
    }
    
    console.log('\n');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkStatuses();
