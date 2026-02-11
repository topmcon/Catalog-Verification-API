#!/usr/bin/env node
/**
 * check-pending-picklist-syncs.js
 * 
 * Script to check for pending Salesforce picklist syncs awaiting review.
 * Used during "Establish Connection" to notify about held syncs.
 * 
 * Usage: node scripts/check-pending-picklist-syncs.js
 */

const mongoose = require('mongoose');
const path = require('path');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

// Pending sync schema (simplified for script)
const PendingPicklistSyncSchema = new mongoose.Schema({
  pending_id: String,
  created_at: Date,
  expires_at: Date,
  source_ip: String,
  status: String,
  pending_changes: [{
    type: String,
    current_count: Number,
    incoming_count: Number,
    items_to_add: [String],
    items_to_remove: [String],
    custom_fields_at_risk: [String]
  }],
  impact_assessment: {
    severity: String,
    reason: String,
    total_additions: Number,
    total_removals: Number,
    custom_fields_at_risk: Number,
    warnings: [String]
  },
  reviewed_at: Date,
  reviewed_by: String
}, { collection: 'pending_picklist_syncs' });

async function checkPendingSyncs() {
  console.log(`\n${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}           PENDING PICKLIST SYNCS - HOLD BUCKET STATUS           ${colors.reset}`);
  console.log(`${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  try {
    await mongoose.connect(MONGODB_URI);
    
    const PendingSync = mongoose.model('PendingPicklistSync', PendingPicklistSyncSchema);
    
    // Get counts
    const pendingCount = await PendingSync.countDocuments({ status: 'pending' });
    const approvedCount = await PendingSync.countDocuments({ status: 'approved' });
    const rejectedCount = await PendingSync.countDocuments({ status: 'rejected' });
    
    console.log(`${colors.cyan}Hold Bucket Status:${colors.reset}`);
    console.log(`  Pending Review:  ${pendingCount > 0 ? colors.bgYellow + colors.bold + ' ' + pendingCount + ' ' + colors.reset : colors.green + '0' + colors.reset}`);
    console.log(`  Approved:        ${colors.green}${approvedCount}${colors.reset}`);
    console.log(`  Rejected:        ${colors.yellow}${rejectedCount}${colors.reset}`);
    console.log('');
    
    if (pendingCount === 0) {
      console.log(`${colors.green}✅ No pending syncs awaiting review.${colors.reset}\n`);
      await mongoose.disconnect();
      return;
    }
    
    // Get pending syncs
    const pendingSyncs = await PendingSync.find({ status: 'pending' })
      .sort({ created_at: -1 })
      .limit(10)
      .lean();
    
    console.log(`${colors.bgYellow}${colors.bold} ⚠️  ${pendingCount} SYNC(S) AWAITING REVIEW ${colors.reset}\n`);
    
    for (const sync of pendingSyncs) {
      const createdAt = new Date(sync.created_at);
      const expiresAt = new Date(sync.expires_at);
      const now = new Date();
      const ageHours = Math.round((now - createdAt) / (1000 * 60 * 60));
      const ageStr = ageHours < 24 ? `${ageHours} hours ago` : `${Math.round(ageHours / 24)} days ago`;
      
      // Severity color
      let severityColor = colors.green;
      let severityIcon = '🟢';
      if (sync.impact_assessment.severity === 'critical') {
        severityColor = colors.red;
        severityIcon = '🔴';
      } else if (sync.impact_assessment.severity === 'high') {
        severityColor = colors.yellow;
        severityIcon = '🟡';
      } else if (sync.impact_assessment.severity === 'medium') {
        severityColor = colors.yellow;
        severityIcon = '🟠';
      }
      
      console.log(`${colors.bold}───────────────────────────────────────────────────────────────${colors.reset}`);
      console.log(`${colors.bold}Pending ID:${colors.reset} ${sync.pending_id}`);
      console.log(`${colors.bold}Received:${colors.reset}   ${createdAt.toLocaleString('en-US', { timeZone: 'America/New_York' })} EST (${ageStr})`);
      console.log(`${colors.bold}Expires:${colors.reset}    ${expiresAt.toLocaleString('en-US', { timeZone: 'America/New_York' })} EST`);
      console.log(`${colors.bold}Source IP:${colors.reset}  ${sync.source_ip || 'unknown'}`);
      console.log('');
      
      // Impact Assessment
      console.log(`${colors.bold}Impact Assessment:${colors.reset}`);
      console.log(`  ${severityIcon} Severity: ${severityColor}${sync.impact_assessment.severity.toUpperCase()}${colors.reset}`);
      console.log(`  Reason: ${sync.impact_assessment.reason}`);
      console.log(`  Additions: ${colors.green}+${sync.impact_assessment.total_additions}${colors.reset}`);
      console.log(`  Removals: ${colors.red}-${sync.impact_assessment.total_removals}${colors.reset}`);
      
      if (sync.impact_assessment.custom_fields_at_risk > 0) {
        console.log(`  ${colors.bgRed}${colors.white} CUSTOM FIELDS AT RISK: ${sync.impact_assessment.custom_fields_at_risk} ${colors.reset}`);
      }
      
      // Warnings
      if (sync.impact_assessment.warnings && sync.impact_assessment.warnings.length > 0) {
        console.log('');
        console.log(`  ${colors.yellow}Warnings:${colors.reset}`);
        for (const warning of sync.impact_assessment.warnings) {
          console.log(`    ${warning}`);
        }
      }
      console.log('');
      
      // Changes by type
      console.log(`${colors.bold}Changes by Picklist Type:${colors.reset}`);
      for (const change of sync.pending_changes) {
        const countChange = change.incoming_count - change.current_count;
        const countChangeStr = countChange >= 0 ? `+${countChange}` : `${countChange}`;
        console.log(`  ${colors.cyan}${change.type}:${colors.reset} ${change.current_count} → ${change.incoming_count} (${countChangeStr})`);
        
        if (change.items_to_add.length > 0) {
          const addPreview = change.items_to_add.slice(0, 5).join(', ');
          const moreAdd = change.items_to_add.length > 5 ? ` +${change.items_to_add.length - 5} more` : '';
          console.log(`    ${colors.green}+ Add:${colors.reset} ${addPreview}${moreAdd}`);
        }
        
        if (change.items_to_remove.length > 0) {
          const removePreview = change.items_to_remove.slice(0, 5).join(', ');
          const moreRemove = change.items_to_remove.length > 5 ? ` +${change.items_to_remove.length - 5} more` : '';
          console.log(`    ${colors.red}- Remove:${colors.reset} ${removePreview}${moreRemove}`);
        }
        
        if (change.custom_fields_at_risk && change.custom_fields_at_risk.length > 0) {
          console.log(`    ${colors.bgRed}${colors.white} ⚠️ CUSTOM FIELDS LOST: ${change.custom_fields_at_risk.join(', ')} ${colors.reset}`);
        }
      }
      console.log('');
    }
    
    console.log(`${colors.bold}───────────────────────────────────────────────────────────────${colors.reset}`);
    console.log('');
    console.log(`${colors.bold}Actions Required:${colors.reset}`);
    console.log(`  To approve a sync: POST /api/picklists/sync/pending/{pending_id}/approve`);
    console.log(`  To reject a sync:  POST /api/picklists/sync/pending/{pending_id}/reject`);
    console.log('');
    console.log(`  ${colors.cyan}Or use curl:${colors.reset}`);
    console.log(`  curl -X POST https://verify.cxc-ai.com/api/picklists/sync/pending/{pending_id}/approve`);
    console.log(`  curl -X POST https://verify.cxc-ai.com/api/picklists/sync/pending/{pending_id}/reject`);
    console.log('');
    
    if (pendingSyncs.some(s => s.impact_assessment.severity === 'critical')) {
      console.log(`${colors.bgRed}${colors.white}${colors.bold}`);
      console.log(` ⚠️  CRITICAL: Some pending syncs would OVERWRITE custom fields!          `);
      console.log(` Review carefully before approving. Consider rejecting if custom fields    `);
      console.log(` like 'subcategory' and 'styles_apply' would be lost.                      `);
      console.log(`${colors.reset}`);
      console.log('');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error(`${colors.red}Error checking pending syncs:${colors.reset}`, error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkPendingSyncs();
