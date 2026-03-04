#!/usr/bin/env node
/**
 * Analyze Pending Attribute Creation Requests
 * 
 * Checks how many attributes we've requested SF IDs for and their status.
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

// Pending creation request schema
const PendingCreationRequestSchema = new mongoose.Schema({
  request_id: String,
  request_type: String, // 'brand', 'category', 'style', 'type', 'attribute'
  requested_value: String,
  requested_value_normalized: String,
  created_at: Date,
  updated_at: Date,
  last_sent_at: Date,
  request_count: Number,
  requested_by_jobs: [String],
  context: mongoose.Schema.Types.Mixed,
  status: String, // 'pending', 'fulfilled', 'rejected', 'expired'
  salesforce_id: String,
  fulfilled_at: Date
}, { collection: 'pending_creation_requests' });

const PendingCreationRequest = mongoose.model('PendingCreationRequest', PendingCreationRequestSchema);

async function analyzePendingAttributes() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('     PENDING ATTRIBUTE CREATION REQUESTS - DETAILED ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all pending attributes
    const pendingAttributes = await PendingCreationRequest.find({
      request_type: 'attribute',
      status: 'pending'
    })
    .sort({ request_count: -1 })
    .lean();

    console.log(`📊 Total Pending Attribute Requests: ${pendingAttributes.length}\n`);

    if (pendingAttributes.length === 0) {
      console.log('✅ No pending attribute requests\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Calculate statistics
    const totalJobsWaiting = pendingAttributes.reduce((sum, attr) => sum + (attr.requested_by_jobs?.length || 0), 0);
    const totalRequests = pendingAttributes.reduce((sum, attr) => sum + (attr.request_count || 0), 0);
    
    const now = new Date();
    const ageInDays = (createdAt) => {
      if (!createdAt) return 0;
      return Math.floor((now - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    };

    const byAge = {
      today: 0,
      '1-2days': 0,
      '3-7days': 0,
      '8-14days': 0,
      '15+days': 0
    };

    pendingAttributes.forEach(attr => {
      const days = ageInDays(attr.created_at);
      if (days === 0) byAge.today++;
      else if (days <= 2) byAge['1-2days']++;
      else if (days <= 7) byAge['3-7days']++;
      else if (days <= 14) byAge['8-14days']++;
      else byAge['15+days']++;
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                      STATISTICS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log(`   📋 Unique Attributes Requested: ${pendingAttributes.length}`);
    console.log(`   🔢 Total Requests Made: ${totalRequests}`);
    console.log(`   ⏳ Jobs Waiting: ${totalJobsWaiting}\n`);

    console.log('   Age Distribution:');
    console.log(`      Today: ${byAge.today}`);
    console.log(`      1-2 days: ${byAge['1-2days']}`);
    console.log(`      3-7 days: ${byAge['3-7days']}`);
    console.log(`      8-14 days: ${byAge['8-14days']}`);
    console.log(`      15+ days: ${byAge['15+days']}\n`);

    // Group by category context
    const byCategory = {};
    pendingAttributes.forEach(attr => {
      const category = attr.context?.category || 'Unknown';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(attr);
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                BY CATEGORY CONTEXT');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const sortedCategories = Object.entries(byCategory)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 15);

    sortedCategories.forEach(([category, attrs]) => {
      console.log(`   📦 ${category}: ${attrs.length} attributes`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('             TOP 20 MOST REQUESTED ATTRIBUTES');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const top20 = pendingAttributes.slice(0, 20);
    
    top20.forEach((attr, index) => {
      const days = ageInDays(attr.created_at);
      const ageStr = days === 0 ? 'today' : `${days}d ago`;
      console.log(`   ${index + 1}. "${attr.requested_value}"`);
      console.log(`      Times Requested: ${attr.request_count}`);
      console.log(`      Jobs Waiting: ${attr.requested_by_jobs?.length || 0}`);
      console.log(`      First Requested: ${ageStr}`);
      console.log(`      Category: ${attr.context?.category || 'Unknown'}`);
      console.log('');
    });

    // Check for stale requests (>7 days)
    const staleRequests = pendingAttributes.filter(attr => ageInDays(attr.created_at) > 7);
    
    if (staleRequests.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('                 ⚠️  STALE REQUESTS (>7 DAYS)');
      console.log('═══════════════════════════════════════════════════════════════\n');
      
      console.log(`   Found ${staleRequests.length} attributes pending for >7 days\n`);
      console.log('   Top 10 oldest:');
      
      staleRequests
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .slice(0, 10)
        .forEach((attr, index) => {
          const days = ageInDays(attr.created_at);
          console.log(`      ${index + 1}. "${attr.requested_value}" - ${days} days old (${attr.context?.category || 'Unknown'})`);
        });
      
      console.log('\n   💡 Recommendation: Follow up with SF team on stale requests\n');
    }

    // Get fulfilled count for comparison
    const fulfilledCount = await PendingCreationRequest.countDocuments({
      request_type: 'attribute',
      status: 'fulfilled'
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                      SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log(`   ⏳ Pending: ${pendingAttributes.length}`);
    console.log(`   ✅ Fulfilled: ${fulfilledCount}`);
    console.log(`   📊 Success Rate: ${fulfilledCount > 0 ? ((fulfilledCount / (fulfilledCount + pendingAttributes.length)) * 100).toFixed(1) : 0}%\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

analyzePendingAttributes();
