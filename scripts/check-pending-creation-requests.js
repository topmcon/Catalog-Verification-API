#!/usr/bin/env node

/**
 * Check Pending Creation Requests Report
 * 
 * Shows all outbound requests sent to Salesforce for creating new picklist items
 * that are still awaiting fulfillment.
 * 
 * Run: node scripts/check-pending-creation-requests.js
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

// Model schema (replicated for standalone script)
const JobReferenceSchema = new mongoose.Schema({
  job_id: String,
  sf_catalog_id: String,
  model_number: String,
  requested_at: Date
}, { _id: false });

const RequestContextSchema = new mongoose.Schema({
  suggested_for_category: String,
  source: String,
  reason: String,
  additional_data: mongoose.Schema.Types.Mixed
}, { _id: false });

const PendingCreationRequestSchema = new mongoose.Schema({
  request_id: String,
  request_type: String,
  requested_value: String,
  requested_value_normalized: String,
  status: String,
  created_at: Date,
  updated_at: Date,
  fulfilled_at: Date,
  expires_at: Date,
  sf_id_received: String,
  requested_by_jobs: [JobReferenceSchema],
  first_requested_by: JobReferenceSchema,
  request_count: Number,
  context: RequestContextSchema,
  sent_to_sf_count: Number,
  last_sent_at: Date
}, { collection: 'pending_creation_requests' });

const PendingCreationRequest = mongoose.model('PendingCreationRequest', PendingCreationRequestSchema);

function formatTimeAgo(date) {
  if (!date) return 'unknown';
  const now = new Date();
  const diff = now - new Date(date);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
}

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('         PENDING CREATION REQUESTS - OUTBOUND TO SALESFORCE     ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    // Get counts by status
    const statusCounts = await PendingCreationRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const counts = { pending: 0, fulfilled: 0, rejected: 0, expired: 0 };
    statusCounts.forEach(s => { counts[s._id] = s.count; });
    
    console.log('Request Status Overview:');
    console.log(`  ⏳ Pending:    ${counts.pending}`);
    console.log(`  ✅ Fulfilled:  ${counts.fulfilled}`);
    console.log(`  ❌ Rejected:   ${counts.rejected}`);
    console.log(`  ⌛ Expired:    ${counts.expired}`);
    console.log('');
    
    if (counts.pending === 0) {
      console.log(' ✅ NO PENDING CREATION REQUESTS ');
      console.log('');
      console.log('All requested items have been fulfilled by Salesforce or no requests sent.');
      await mongoose.disconnect();
      return;
    }
    
    console.log(` ⚠️  ${counts.pending} REQUEST(S) AWAITING SALESFORCE RESPONSE `);
    console.log('');
    
    // Get pending requests by type
    const pendingByType = await PendingCreationRequest.aggregate([
      { $match: { status: 'pending' } },
      { $group: { 
        _id: '$request_type', 
        count: { $sum: 1 },
        totalJobs: { $sum: '$request_count' }
      }}
    ]);
    
    console.log('Pending by Type:');
    for (const type of pendingByType) {
      const emoji = {
        brand: '🏷️',
        category: '📁',
        style: '🎨',
        type: '📋',
        attribute: '🔧'
      }[type._id] || '❓';
      console.log(`  ${emoji} ${type._id}: ${type.count} unique (${type.totalJobs} total requests)`);
    }
    console.log('');
    
    // Get detailed list
    const pendingRequests = await PendingCreationRequest.find({ status: 'pending' })
      .sort({ request_type: 1, created_at: 1 })
      .lean();
    
    // Group by type for display
    const byType = {};
    pendingRequests.forEach(req => {
      if (!byType[req.request_type]) byType[req.request_type] = [];
      byType[req.request_type].push(req);
    });
    
    for (const [type, requests] of Object.entries(byType)) {
      console.log('───────────────────────────────────────────────────────────────');
      console.log(`${type.toUpperCase()} REQUESTS (${requests.length})`);
      console.log('───────────────────────────────────────────────────────────────');
      
      for (const req of requests) {
        console.log(`  📌 "${req.requested_value}"`);
        console.log(`     Request ID: ${req.request_id.substring(0, 8)}...`);
        console.log(`     First requested: ${formatTimeAgo(req.created_at)}`);
        console.log(`     Times requested: ${req.request_count} (${req.requested_by_jobs?.length || 1} jobs waiting)`);
        
        if (req.context?.suggested_for_category) {
          console.log(`     For category: ${req.context.suggested_for_category}`);
        }
        
        if (req.first_requested_by) {
          console.log(`     First job: ${req.first_requested_by.sf_catalog_id || 'N/A'}`);
          if (req.first_requested_by.model_number) {
            console.log(`     Model: ${req.first_requested_by.model_number}`);
          }
        }
        console.log('');
      }
    }
    
    // Show recently fulfilled for context
    const recentlyFulfilled = await PendingCreationRequest.find({
      status: 'fulfilled',
      fulfilled_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ fulfilled_at: -1 }).limit(5).lean();
    
    if (recentlyFulfilled.length > 0) {
      console.log('───────────────────────────────────────────────────────────────');
      console.log('RECENTLY FULFILLED (Last 24 hours)');
      console.log('───────────────────────────────────────────────────────────────');
      
      for (const req of recentlyFulfilled) {
        console.log(`  ✅ "${req.requested_value}" (${req.request_type})`);
        console.log(`     SF ID: ${req.sf_id_received}`);
        console.log(`     Fulfilled: ${formatTimeAgo(req.fulfilled_at)}`);
        console.log('');
      }
    }
    
    // Summary and recommendations
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    // Check for old pending requests
    const oldRequests = pendingRequests.filter(r => {
      const age = Date.now() - new Date(r.created_at).getTime();
      return age > 7 * 24 * 60 * 60 * 1000; // Older than 7 days
    });
    
    if (oldRequests.length > 0) {
      console.log(`⚠️  ${oldRequests.length} request(s) pending for more than 7 days`);
      console.log('   Consider following up with Salesforce team or rejecting stale requests.');
      console.log('');
    }
    
    // Check for high-volume requests (many jobs waiting)
    const highVolume = pendingRequests.filter(r => r.request_count >= 5);
    if (highVolume.length > 0) {
      console.log(`🔥 ${highVolume.length} request(s) needed by 5+ verification jobs:`);
      for (const req of highVolume.slice(0, 5)) {
        console.log(`   - "${req.requested_value}" (${req.request_type}): ${req.request_count} jobs waiting`);
      }
      console.log('');
    }
    
    if (counts.pending > 0) {
      console.log('📋 To view in Salesforce:');
      console.log('   These items were sent via webhook and should appear in SF queue.');
      console.log('');
      console.log('🔄 When SF creates items and sends picklist sync:');
      console.log('   System will automatically match and mark requests as fulfilled.');
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
