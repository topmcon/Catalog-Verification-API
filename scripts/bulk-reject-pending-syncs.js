#!/usr/bin/env node
/**
 * Bulk Reject Pending Picklist Syncs
 * 
 * Rejects all pending picklist syncs in the hold bucket to preserve custom fields.
 * Use this when Salesforce sends syncs that would overwrite subcategory/styles_apply.
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

// Define schema inline (matches PendingPicklistSync model)
const PendingPicklistSyncSchema = new mongoose.Schema({
  pending_id: String,
  created_at: Date,
  expires_at: Date,
  source_ip: String,
  status: String,
  pending_changes: Array,
  impact_assessment: mongoose.Schema.Types.Mixed,
  reviewed_at: Date,
  reviewed_by: String,
  notes: String
}, { collection: 'pending_picklist_syncs' });

const PendingSync = mongoose.model('PendingPicklistSync', PendingPicklistSyncSchema);

async function bulkRejectPendingSyncs() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('           BULK REJECT PENDING PICKLIST SYNCS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count pending syncs before rejection
    const pendingCount = await PendingSync.countDocuments({ status: 'pending' });
    console.log(`📋 Found ${pendingCount} pending sync(s) to reject\n`);

    if (pendingCount === 0) {
      console.log('✅ No pending syncs to reject\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Bulk update all pending syncs to rejected
    const result = await PendingSync.updateMany(
      { status: 'pending' },
      {
        $set: {
          status: 'rejected',
          reviewed_at: new Date(),
          reviewed_by: 'copilot-bulk-reject-script',
          notes: 'Bulk rejected to preserve custom fields (subcategory, styles_apply) - CRITICAL severity syncs would overwrite 316 items'
        }
      }
    );

    console.log(`✅ Successfully rejected ${result.modifiedCount} sync(s)\n`);

    // Get updated counts
    const stats = {
      pending: await PendingSync.countDocuments({ status: 'pending' }),
      approved: await PendingSync.countDocuments({ status: 'approved' }),
      rejected: await PendingSync.countDocuments({ status: 'rejected' })
    };

    console.log('📊 Updated Hold Bucket Status:');
    console.log(`   Pending:  ${stats.pending}`);
    console.log(`   Approved: ${stats.approved}`);
    console.log(`   Rejected: ${stats.rejected}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
bulkRejectPendingSyncs();
