#!/usr/bin/env node
/**
 * batch-reject-pending-syncs.js
 * 
 * Script to batch reject all pending Salesforce picklist syncs.
 * Use this when Salesforce sends syncs without custom fields that would be lost.
 * 
 * Usage: node scripts/batch-reject-pending-syncs.js [--reason "Optional reason"]
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

// Pending sync schema
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
  reviewed_by: String,
  reject_reason: String
}, { collection: 'pending_picklist_syncs' });

async function batchRejectSyncs() {
  console.log(`\n${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}           BATCH REJECT PENDING PICKLIST SYNCS                  ${colors.reset}`);
  console.log(`${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  let customReason = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--reason' && args[i + 1]) {
      customReason = args[i + 1];
      i++;
    }
  }
  
  const rejectReason = customReason || 'Batch rejection to preserve custom fields (subcategory, styles_apply). Salesforce syncs do not include these fields.';
  const reviewedBy = 'copilot-batch-reject';
  
  try {
    await mongoose.connect(MONGODB_URI);
    
    const PendingSync = mongoose.model('PendingPicklistSync', PendingPicklistSyncSchema);
    
    // Get count of pending syncs before rejection
    const pendingCount = await PendingSync.countDocuments({ status: 'pending' });
    
    if (pendingCount === 0) {
      console.log(`${colors.green}✅ No pending syncs to reject.${colors.reset}\n`);
      await mongoose.disconnect();
      return;
    }
    
    console.log(`${colors.cyan}Found ${pendingCount} pending sync(s) to reject${colors.reset}\n`);
    
    // Get severity breakdown before rejection
    const criticalCount = await PendingSync.countDocuments({ 
      status: 'pending',
      'impact_assessment.severity': 'CRITICAL'
    });
    const highCount = await PendingSync.countDocuments({ 
      status: 'pending',
      'impact_assessment.severity': 'HIGH'
    });
    const mediumCount = await PendingSync.countDocuments({ 
      status: 'pending',
      'impact_assessment.severity': 'MEDIUM'
    });
    const lowCount = await PendingSync.countDocuments({ 
      status: 'pending',
      'impact_assessment.severity': 'LOW'
    });
    
    console.log(`${colors.yellow}Severity Breakdown:${colors.reset}`);
    if (criticalCount > 0) console.log(`  🔴 CRITICAL: ${criticalCount}`);
    if (highCount > 0) console.log(`  🟠 HIGH:     ${highCount}`);
    if (mediumCount > 0) console.log(`  🟡 MEDIUM:   ${mediumCount}`);
    if (lowCount > 0) console.log(`  🟢 LOW:      ${lowCount}`);
    console.log('');
    
    console.log(`${colors.yellow}Reject Reason:${colors.reset}`);
    console.log(`  ${rejectReason}\n`);
    
    console.log(`${colors.bold}Proceeding with batch rejection...${colors.reset}\n`);
    
    // Update all pending syncs to rejected
    const result = await PendingSync.updateMany(
      { status: 'pending' },
      {
        $set: {
          status: 'rejected',
          reviewed_at: new Date(),
          reviewed_by: reviewedBy,
          reject_reason: rejectReason
        }
      }
    );
    
    console.log(`${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}                      REJECTION COMPLETE                        ${colors.reset}`);
    console.log(`${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
    
    console.log(`${colors.green}✅ Successfully rejected ${result.modifiedCount} pending sync(s)${colors.reset}\n`);
    
    // Verify no pending syncs remain
    const remainingPending = await PendingSync.countDocuments({ status: 'pending' });
    const totalRejected = await PendingSync.countDocuments({ status: 'rejected' });
    
    console.log(`${colors.cyan}Updated Status:${colors.reset}`);
    console.log(`  Pending:  ${remainingPending === 0 ? colors.green + '0' + colors.reset : colors.red + remainingPending + colors.reset}`);
    console.log(`  Rejected: ${colors.yellow}${totalRejected}${colors.reset}`);
    console.log('');
    
    if (remainingPending === 0) {
      console.log(`${colors.bgGreen}${colors.bold} ✅ ALL PENDING SYNCS REJECTED ${colors.reset}\n`);
    } else {
      console.log(`${colors.bgRed}${colors.bold} ⚠️  WARNING: ${remainingPending} SYNCS STILL PENDING ${colors.reset}\n`);
    }
    
    console.log(`${colors.cyan}Next Steps:${colors.reset}`);
    console.log(`  1. Your current picklist files are preserved with custom fields intact`);
    console.log(`  2. Contact Salesforce team to include custom fields in future syncs`);
    console.log(`  3. Rejected syncs will auto-expire in 30 days if not reprocessed\n`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error(`\n${colors.red}Error during batch rejection:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the script
batchRejectSyncs();
