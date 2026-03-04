#!/usr/bin/env node
/**
 * Analyze Rejected Picklist Syncs - Check SF ID Coverage
 * 
 * Checks how many Salesforce IDs from our local picklists exist in the 
 * rejected sync data that Salesforce sent over.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

// Load local picklists
const PICKLIST_DIR = path.join(__dirname, '../src/config/salesforce-picklists');

const localPicklists = {
  brands: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'brands.json'), 'utf8')),
  categories: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'categories.json'), 'utf8')),
  styles: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'styles.json'), 'utf8')),
  types: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'types.json'), 'utf8')),
  attributes: JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'attributes.json'), 'utf8'))
};

// Pending sync schema
const PendingPicklistSyncSchema = new mongoose.Schema({
  pending_id: String,
  created_at: Date,
  expires_at: Date,
  source_ip: String,
  status: String,
  sync_data: mongoose.Schema.Types.Mixed,
  pending_changes: Array,
  impact_assessment: mongoose.Schema.Types.Mixed,
  reviewed_at: Date,
  reviewed_by: String,
  notes: String
}, { collection: 'pending_picklist_syncs' });

const PendingSync = mongoose.model('PendingPicklistSync', PendingPicklistSyncSchema);

async function analyzeRejectedSyncs() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('     REJECTED SYNC ANALYSIS - SALESFORCE ID COVERAGE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the most recent rejected sync with incoming_data
    const recentRejected = await PendingSync.findOne({ 
      status: 'rejected',
      incoming_data: { $exists: true, $ne: null }
    })
    .sort({ created_at: -1 })
    .lean();

    if (!recentRejected) {
      console.log('❌ No rejected syncs with incoming_data found\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`📋 Analyzing most recent rejected sync:`);
    console.log(`   Pending ID: ${recentRejected.pending_id}`);
    console.log(`   Created: ${new Date(recentRejected.created_at).toLocaleString('en-US', { timeZone: 'America/New_York' })} EST`);
    console.log(`   Status: ${recentRejected.status}\n`);

    const syncData = recentRejected.incoming_data;

    // Analyze each picklist type
    const results = {};

    for (const [picklistType, localData] of Object.entries(localPicklists)) {
      const sfData = syncData[picklistType];
      
      if (!sfData || !Array.isArray(sfData)) {
        console.log(`⚠️  ${picklistType}: No data in sync from Salesforce`);
        continue;
      }

      // Extract IDs
      const localIds = new Set(localData.map(item => {
        // Handle different ID field names
        return item.brand_id || item.category_id || item.style_id || item.type_id || item.attribute_id;
      }).filter(Boolean));

      const sfIds = new Set(sfData.map(item => {
        return item.brand_id || item.category_id || item.style_id || item.type_id || item.attribute_id;
      }).filter(Boolean));

      // Find matches and mismatches
      const inBoth = [...localIds].filter(id => sfIds.has(id));
      const onlyLocal = [...localIds].filter(id => !sfIds.has(id));
      const onlySF = [...sfIds].filter(id => !localIds.has(id));

      results[picklistType] = {
        localCount: localIds.size,
        sfCount: sfIds.size,
        inBoth: inBoth.length,
        onlyLocal: onlyLocal.length,
        onlySF: onlySF.length,
        onlyLocalIds: onlyLocal.slice(0, 10), // Sample
        onlySFIds: onlySF.slice(0, 10) // Sample
      };
    }

    // Display results
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                   ID COVERAGE ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const [picklistType, data] of Object.entries(results)) {
      const coverage = data.localCount > 0 ? ((data.inBoth / data.localCount) * 100).toFixed(1) : 0;
      
      console.log(`\n📊 ${picklistType.toUpperCase()}`);
      console.log(`   Local IDs: ${data.localCount}`);
      console.log(`   SF Sync IDs: ${data.sfCount}`);
      console.log(`   ✅ In Both: ${data.inBoth} (${coverage}% of local coverage)`);
      console.log(`   🔵 Only in Local: ${data.onlyLocal}`);
      console.log(`   🟡 Only in SF Sync: ${data.onlySF}`);

      if (data.onlyLocal > 0 && data.onlyLocalIds.length > 0) {
        console.log(`   📝 Sample Local IDs not in SF (first 10): ${data.onlyLocalIds.join(', ')}`);
      }

      if (data.onlySF > 0 && data.onlySFIds.length > 0) {
        console.log(`   📝 Sample SF IDs not in Local (first 10): ${data.onlySFIds.join(', ')}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                      SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const totalLocal = Object.values(results).reduce((sum, r) => sum + r.localCount, 0);
    const totalMatched = Object.values(results).reduce((sum, r) => sum + r.inBoth, 0);
    const totalCoverage = totalLocal > 0 ? ((totalMatched / totalLocal) * 100).toFixed(1) : 0;

    console.log(`   Total Local IDs: ${totalLocal}`);
    console.log(`   Total Matched in SF Sync: ${totalMatched}`);
    console.log(`   Overall Coverage: ${totalCoverage}%\n`);

    if (totalCoverage < 90) {
      console.log('⚠️  WARNING: Less than 90% of local IDs found in SF sync!');
      console.log('   This may indicate:');
      console.log('   - SF is sending outdated/incomplete data');
      console.log('   - Local picklists have custom additions SF doesn\'t have');
      console.log('   - ID field name mismatches\n');
    } else {
      console.log('✅ Good coverage - most local IDs exist in SF sync data\n');
    }

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

analyzeRejectedSyncs();
