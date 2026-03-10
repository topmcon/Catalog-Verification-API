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
const fs = require('fs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

// Reuse the same timestamp file as show-session-analytics.js
const LAST_CONNECTION_FILE = '/tmp/last_establish_connection.timestamp';
const DEFAULT_LOOKBACK_DAYS = 7;

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

// Schema for held picklist syncs (to cross-reference SF data)
const PendingPicklistSyncSchema = new mongoose.Schema({}, { 
  strict: false, 
  collection: 'pending_picklist_syncs' 
});
const PendingPicklistSync = mongoose.model('PendingPicklistSync', PendingPicklistSyncSchema);

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
    
    // ============================================================
    // CROSS-REFERENCE: Check held SF syncs for matching items
    // Report only — nothing is auto-applied
    // ============================================================
    const latestSync = await PendingPicklistSync.findOne({ status: 'pending' })
      .sort({ created_at: -1 }).lean();
    
    if (latestSync && pendingRequests.length > 0) {
      const incomingData = latestSync.incoming_data || {};
      
      // Build lookup maps from SF sync data
      const sfLookup = {
        attribute: new Map(),
        brand: new Map(),
        category: new Map(),
        style: new Map(),
        type: new Map()
      };
      
      const fieldMap = {
        attribute: { arr: incomingData.attributes, nameField: 'attribute_name', idField: 'attribute_id' },
        brand:     { arr: incomingData.brands,     nameField: 'brand_name',     idField: 'brand_id' },
        category:  { arr: incomingData.categories,  nameField: 'category_name',  idField: 'category_id' },
        style:     { arr: incomingData.styles,      nameField: 'style_name',     idField: 'style_id' },
        type:      { arr: incomingData.types,       nameField: 'type_name',      idField: 'type_id' }
      };
      
      for (const [type, config] of Object.entries(fieldMap)) {
        if (Array.isArray(config.arr)) {
          for (const item of config.arr) {
            const name = (item[config.nameField] || '').toLowerCase().trim();
            const nameUnderscored = name.replace(/\s+/g, '_');
            if (name && item[config.idField]) {
              sfLookup[type].set(name, { name: item[config.nameField], id: item[config.idField] });
              if (nameUnderscored !== name) {
                sfLookup[type].set(nameUnderscored, { name: item[config.nameField], id: item[config.idField] });
              }
            }
          }
        }
      }
      
      // Find matches
      const matchedRequests = [];
      const unmatchedRequests = [];
      
      for (const req of pendingRequests) {
        const val = (req.requested_value || '').toLowerCase().trim();
        const valSpaced = val.replace(/_/g, ' ');
        const lookup = sfLookup[req.request_type];
        
        const match = lookup?.get(val) || lookup?.get(valSpaced);
        
        if (match) {
          matchedRequests.push({ request: req, sfName: match.name, sfId: match.id });
        } else {
          unmatchedRequests.push(req);
        }
      }
      
      const syncDate = latestSync.created_at 
        ? new Date(latestSync.created_at).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
        : 'unknown';
      
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('  🔍 SF SYNC CROSS-REFERENCE (Latest held sync: ' + syncDate + ' EST)');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');
      
      if (matchedRequests.length > 0) {
        let totalJobsToUnblock = 0;
        
        console.log(`  🟢 ${matchedRequests.length} MATCH(ES) FOUND — SF has created these items`);
        console.log('     These can be fulfilled (SF ID updated) pending your confirmation.');
        console.log('');
        
        for (const { request: req, sfName, sfId } of matchedRequests) {
          const jobs = req.requested_by_jobs?.length || req.request_count || 1;
          totalJobsToUnblock += jobs;
          const cat = req.context?.suggested_for_category || 'N/A';
          console.log(`    ✅ "${req.requested_value}" (${req.request_type})`);
          console.log(`       SF ID: ${sfId} | Category: ${cat} | ${jobs} job${jobs > 1 ? 's' : ''} waiting`);
          console.log(`       Pending since: ${formatTimeAgo(req.created_at)}`);
        }
        console.log('');
        console.log(`    📊 Total: ${matchedRequests.length} items ready to fulfill, ${totalJobsToUnblock} jobs to unblock`);
        console.log('');
        console.log('    ⏳ ACTION REQUIRED: Confirm to fulfill these matched requests.');
        console.log('       Run: node scripts/fulfill-matched-creation-requests.js');
        console.log('');
      }
      
      if (unmatchedRequests.length > 0) {
        console.log(`  🔴 ${unmatchedRequests.length} UNMATCHED — SF has NOT created these yet`);
        console.log('');
        for (const req of unmatchedRequests) {
          const jobs = req.requested_by_jobs?.length || req.request_count || 1;
          const cat = req.context?.suggested_for_category || 'N/A';
          console.log(`    ❌ "${req.requested_value}" (${req.request_type})`);
          console.log(`       Category: ${cat} | ${jobs} job${jobs > 1 ? 's' : ''} waiting | Pending: ${formatTimeAgo(req.created_at)}`);
        }
        console.log('');
      }
      
      if (matchedRequests.length === 0 && unmatchedRequests.length === 0) {
        console.log('  No pending requests to cross-reference.');
        console.log('');
      }
    } else if (pendingRequests.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('  🔍 SF SYNC CROSS-REFERENCE');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('  No held SF syncs available to cross-reference against.');
      console.log('');
    }
    
    // Determine lookback window (since last session or default)
    let sinceTime;
    let timeWindowLabel;
    
    if (fs.existsSync(LAST_CONNECTION_FILE)) {
      const lastTimestamp = fs.readFileSync(LAST_CONNECTION_FILE, 'utf8').trim();
      const lastDate = new Date(lastTimestamp);
      if (!isNaN(lastDate.getTime())) {
        sinceTime = lastDate;
        const hoursAgo = Math.round((Date.now() - lastDate.getTime()) / (1000 * 60 * 60));
        const daysAgo = Math.floor(hoursAgo / 24);
        timeWindowLabel = daysAgo > 0 
          ? `${daysAgo} day${daysAgo > 1 ? 's' : ''} (since last session: ${lastDate.toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} EST)`
          : `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} (since last session)`;
      }
    }
    
    if (!sinceTime) {
      sinceTime = new Date(Date.now() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
      timeWindowLabel = `${DEFAULT_LOOKBACK_DAYS} days (no previous session found)`;
    }
    
    // Get ALL fulfilled requests since last session
    const recentlyFulfilled = await PendingCreationRequest.find({
      status: 'fulfilled',
      fulfilled_at: { $gte: sinceTime }
    }).sort({ fulfilled_at: -1 }).lean();
    
    console.log('───────────────────────────────────────────────────────────────');
    if (recentlyFulfilled.length > 0) {
      console.log(`✅ RECONCILED / FULFILLED SINCE LAST SESSION (${timeWindowLabel})`);
      console.log('───────────────────────────────────────────────────────────────');
      console.log(`  ${recentlyFulfilled.length} request(s) were matched when SF sent picklist syncs back`);
      console.log('');
      
      // Group by type
      const fulfilledByType = {};
      for (const req of recentlyFulfilled) {
        if (!fulfilledByType[req.request_type]) fulfilledByType[req.request_type] = [];
        fulfilledByType[req.request_type].push(req);
      }
      
      let totalJobsUnblocked = 0;
      
      for (const [type, requests] of Object.entries(fulfilledByType)) {
        const emoji = {
          brand: '🏷️',
          category: '📁',
          style: '🎨',
          type: '📋',
          attribute: '🔧'
        }[type] || '❓';
        
        console.log(`  ${emoji} ${type.toUpperCase()} (${requests.length} fulfilled):`);
        
        for (const req of requests) {
          const jobCount = req.requested_by_jobs?.length || req.request_count || 1;
          totalJobsUnblocked += jobCount;
          const fulfilledDate = new Date(req.fulfilled_at).toLocaleString('en-US', { 
            timeZone: 'America/New_York', 
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
          });
          console.log(`    ✅ "${req.requested_value}" → SF ID: ${req.sf_id_received || 'N/A'}`);
          console.log(`       Fulfilled: ${fulfilledDate} EST | Was pending: ${formatTimeAgo(req.created_at)} | Unblocked ${jobCount} job${jobCount > 1 ? 's' : ''}`);
          if (req.context?.suggested_for_category) {
            console.log(`       Category: ${req.context.suggested_for_category}`);
          }
        }
        console.log('');
      }
      
      console.log(`  📊 Summary: ${recentlyFulfilled.length} items reconciled, ${totalJobsUnblocked} jobs unblocked`);
      console.log('');
    } else {
      console.log(`📭 NO RECONCILIATIONS SINCE LAST SESSION (${timeWindowLabel})`);
      console.log('───────────────────────────────────────────────────────────────');
      console.log('  No pending requests were matched/fulfilled by SF picklist syncs.');
      console.log('');
    }
    
    // Also show lifetime fulfilled stats
    const totalFulfilledAllTime = counts.fulfilled || 0;
    if (totalFulfilledAllTime > 0) {
      const oldestFulfilled = await PendingCreationRequest.findOne({ status: 'fulfilled' })
        .sort({ fulfilled_at: 1 }).lean();
      const newestFulfilled = await PendingCreationRequest.findOne({ status: 'fulfilled' })
        .sort({ fulfilled_at: -1 }).lean();
      
      if (oldestFulfilled && newestFulfilled) {
        const oldestDate = new Date(oldestFulfilled.fulfilled_at).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' });
        const newestDate = new Date(newestFulfilled.fulfilled_at).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' });
        console.log(`  📈 Lifetime: ${totalFulfilledAllTime} total items reconciled (${oldestDate} – ${newestDate})`);
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
      console.log('   Matches will be reported during "Establish Connection" for your confirmation.');
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
