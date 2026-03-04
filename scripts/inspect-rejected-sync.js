#!/usr/bin/env node
/**
 * Inspect Rejected Sync Structure
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/catalog-verification';

const PendingPicklistSyncSchema = new mongoose.Schema({}, {
  strict: false,
  collection: 'pending_picklist_syncs'
});

const PendingSync = mongoose.model('PendingPicklistSync', PendingPicklistSyncSchema);

async function inspectSync() {
  try {
    await mongoose.connect(MONGO_URI);
    
    // Get one rejected sync
    const sync = await PendingSync.findOne({ status: 'rejected' })
      .sort({ created_at: -1 })
      .lean();

    if (!sync) {
      console.log('No rejected syncs found');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('\n📋 Sample Rejected Sync Structure:\n');
    console.log('Top-level fields:');
    Object.keys(sync).forEach(key => {
      const value = sync[key];
      const type = Array.isArray(value) ? 'Array' : typeof value;
      const preview = Array.isArray(value) ? `[${value.length} items]` : 
                     typeof value === 'object' && value !== null ? '{...}' :
                     String(value).substring(0, 50);
      console.log(`  ${key}: ${type} - ${preview}`);
    });

    // Check pending_changes structure
    if (sync.pending_changes && Array.isArray(sync.pending_changes) && sync.pending_changes.length > 0) {
      console.log('\n📋 Sample pending_changes item:');
      const sample = sync.pending_changes[0];
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = Array.isArray(value) ? 'Array' : typeof value;
        const preview = Array.isArray(value) ? `[${value.length} items]` : 
                       String(value).substring(0, 50);
        console.log(`  ${key}: ${type} - ${preview}`);
      });

      // If items_to_add exists, show structure
      if (sample.items_to_add && sample.items_to_add.length > 0) {
        console.log('\n📋 Sample item in items_to_add:');
        console.log(JSON.stringify(sample.items_to_add[0], null, 2));
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

inspectSync();
