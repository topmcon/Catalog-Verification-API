#!/usr/bin/env node
/**
 * CHECK PICKLIST SYNC STATUS
 * ==========================
 * Shows detailed information about the most recent picklist sync from Salesforce
 * including what changed, when, and any items that were added/removed.
 * 
 * Used by "Establish Connection" procedure to monitor picklist updates.
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

async function checkPicklistSyncStatus() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Define schema loosely to read any structure
    const PicklistSyncLog = mongoose.model(
      'PicklistSyncLog', 
      new mongoose.Schema({}, { strict: false, collection: 'picklist_sync_logs' })
    );
    
    // Get the most recent sync
    const latest = await PicklistSyncLog.findOne().sort({ timestamp: -1 }).lean();
    
    if (!latest) {
      console.log('📋 No picklist syncs found in database');
      process.exit(0);
    }
    
    // Format timestamp to EST
    const syncDate = new Date(latest.timestamp);
    const estDateStr = syncDate.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'long'
    });
    
    // Calculate how long ago
    const now = new Date();
    const diffMs = now - syncDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    let timeAgo = '';
    if (diffDays > 0) {
      timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = 'just now';
    }
    
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           📋 LATEST PICKLIST SYNC FROM SALESFORCE            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🆔 Sync ID: ${latest.sync_id}`);
    console.log(`🕐 Timestamp (EST): ${estDateStr}`);
    console.log(`⏱️  Time Ago: ${timeAgo}`);
    console.log(`⚡ Processing Time: ${latest.processing_time_ms || 'N/A'}ms`);
    console.log(`📡 Source IP: ${latest.source_ip || 'N/A'}`);
    console.log(`🔑 API Key: ${latest.api_key_hint || 'N/A'}`);
    console.log('');
    
    // Show detailed changes
    if (latest.summaries && latest.summaries.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('                      📊 CHANGES SUMMARY');
      console.log('═══════════════════════════════════════════════════════════════');
      
      let totalAdded = 0;
      let totalRemoved = 0;
      
      latest.summaries.forEach(summary => {
        const type = summary.type.toUpperCase();
        const added = summary.items_added || 0;
        const removed = summary.items_removed || 0;
        
        totalAdded += added;
        totalRemoved += removed;
        
        console.log('');
        console.log(`📦 ${type}:`);
        console.log(`   Before: ${summary.previous_count || 0} items`);
        console.log(`   After:  ${summary.new_count || 0} items`);
        
        if (added > 0 || removed > 0) {
          console.log(`   Change: ${added > 0 ? '+' + added : ''} ${removed > 0 ? '-' + removed : ''}`);
          
          // Show added items
          if (summary.added_items && summary.added_items.length > 0) {
            console.log('');
            console.log('   ✅ ADDED:');
            const addedToShow = summary.added_items.slice(0, 10);
            addedToShow.forEach(item => {
              console.log(`      + ${item}`);
            });
            if (summary.added_items.length > 10) {
              console.log(`      ... and ${summary.added_items.length - 10} more`);
            }
          }
          
          // Show removed items
          if (summary.removed_items && summary.removed_items.length > 0) {
            console.log('');
            console.log('   ❌ REMOVED:');
            const removedToShow = summary.removed_items.slice(0, 10);
            removedToShow.forEach(item => {
              console.log(`      - ${item}`);
            });
            if (summary.removed_items.length > 10) {
              console.log(`      ... and ${summary.removed_items.length - 10} more`);
            }
          }
        } else {
          console.log('   Change: No changes (sync confirmed existing data)');
        }
      });
      
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`📊 TOTALS: ${totalAdded} items added, ${totalRemoved} items removed`);
      console.log('═══════════════════════════════════════════════════════════════');
    } else {
      console.log('⚠️  No change summary available for this sync');
    }
    
    // Check if there are uncommitted changes on production
    console.log('');
    console.log('💡 TIP: Check if changes are committed to GitHub:');
    console.log('   ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && git status src/config/salesforce-picklists/ --short"');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPicklistSyncStatus();
