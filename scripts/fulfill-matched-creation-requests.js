#!/usr/bin/env node

/**
 * Fulfill Matched Creation Requests
 * 
 * Cross-references pending creation requests against the latest held SF sync,
 * shows what would be fulfilled, and asks for confirmation before executing.
 * 
 * Only updates SF IDs on pending request records in MongoDB.
 * Does NOT modify any picklist files.
 * 
 * Run: node scripts/fulfill-matched-creation-requests.js
 */

const mongoose = require('mongoose');
const readline = require('readline');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

// Models
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
  requested_by_jobs: [new mongoose.Schema({
    job_id: String, sf_catalog_id: String, model_number: String, requested_at: Date
  }, { _id: false })],
  first_requested_by: new mongoose.Schema({
    job_id: String, sf_catalog_id: String, model_number: String, requested_at: Date
  }, { _id: false }),
  request_count: Number,
  context: new mongoose.Schema({
    suggested_for_category: String, source: String, reason: String
  }, { _id: false })
}, { collection: 'pending_creation_requests' });

const PendingCreationRequest = mongoose.model('PendingCreationRequest', PendingCreationRequestSchema);
const PendingPicklistSync = mongoose.model('PendingPicklistSync', 
  new mongoose.Schema({}, { strict: false, collection: 'pending_picklist_syncs' })
);

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()); }));
}

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Get pending requests
    const pendingRequests = await PendingCreationRequest.find({ status: 'pending' }).lean();
    if (pendingRequests.length === 0) {
      console.log('✅ No pending creation requests to fulfill.');
      await mongoose.disconnect();
      return;
    }
    
    // Get latest held sync
    const latestSync = await PendingPicklistSync.findOne({ status: 'pending' })
      .sort({ created_at: -1 }).lean();
    
    if (!latestSync) {
      console.log('⚠️  No held SF syncs available to cross-reference.');
      await mongoose.disconnect();
      return;
    }
    
    const incomingData = latestSync.incoming_data || {};
    
    // Build lookup from SF data
    const sfLookup = {};
    const fieldMap = {
      attribute: { arr: incomingData.attributes, nameField: 'attribute_name', idField: 'attribute_id' },
      brand:     { arr: incomingData.brands,     nameField: 'brand_name',     idField: 'brand_id' },
      category:  { arr: incomingData.categories,  nameField: 'category_name',  idField: 'category_id' },
      style:     { arr: incomingData.styles,      nameField: 'style_name',     idField: 'style_id' },
      type:      { arr: incomingData.types,       nameField: 'type_name',      idField: 'type_id' }
    };
    
    for (const [type, config] of Object.entries(fieldMap)) {
      sfLookup[type] = new Map();
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
    const matches = [];
    for (const req of pendingRequests) {
      const val = (req.requested_value || '').toLowerCase().trim();
      const valSpaced = val.replace(/_/g, ' ');
      const lookup = sfLookup[req.request_type];
      const match = lookup?.get(val) || lookup?.get(valSpaced);
      
      if (match) {
        matches.push({ request: req, sfId: match.id, sfName: match.name });
      }
    }
    
    if (matches.length === 0) {
      console.log('📭 No matches found between pending requests and SF sync data.');
      await mongoose.disconnect();
      return;
    }
    
    // Present matches for confirmation
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  ${matches.length} MATCH(ES) READY TO FULFILL`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('  The following pending requests match items in the latest SF sync.');
    console.log('  Fulfilling will ONLY update the SF ID on the request record.');
    console.log('  No picklist files will be created, overwritten, or replaced.');
    console.log('');
    
    let totalJobs = 0;
    for (const { request: req, sfId } of matches) {
      const jobs = req.requested_by_jobs?.length || req.request_count || 1;
      totalJobs += jobs;
      const cat = req.context?.suggested_for_category || 'N/A';
      console.log(`  ✅ "${req.requested_value}" (${req.request_type}) → SF ID: ${sfId}`);
      console.log(`     Category: ${cat} | ${jobs} job${jobs > 1 ? 's' : ''} waiting`);
    }
    console.log('');
    console.log(`  Total: ${matches.length} items, ${totalJobs} jobs to unblock`);
    console.log('');
    
    // Ask for confirmation
    const answer = await ask('  Confirm fulfillment? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('');
      console.log('  ❌ Cancelled. No changes made.');
      await mongoose.disconnect();
      return;
    }
    
    // Execute fulfillment
    console.log('');
    let fulfilled = 0;
    for (const { request: req, sfId } of matches) {
      await PendingCreationRequest.updateOne(
        { _id: req._id, status: 'pending' },
        { $set: { 
          status: 'fulfilled', 
          fulfilled_at: new Date(), 
          sf_id_received: sfId, 
          updated_at: new Date() 
        }}
      );
      fulfilled++;
      console.log(`  ✅ Fulfilled: "${req.requested_value}" → ${sfId}`);
    }
    
    console.log('');
    console.log(`  ✅ Done. ${fulfilled} request(s) fulfilled.`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
