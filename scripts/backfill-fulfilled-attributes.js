#!/usr/bin/env node

/**
 * Backfill Fulfilled Attributes
 * 
 * This script adds attributes that were marked as "fulfilled" in MongoDB
 * (with sf_id_received) but were never written to attributes.json.
 * 
 * This is a one-time fix for the gap that existed before we added
 * attribute extraction to the reject flow.
 * 
 * Usage: node scripts/backfill-fulfilled-attributes.js [--dry-run]
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';
const ATTRIBUTES_PATH = path.join(process.cwd(), 'src/config/salesforce-picklists/attributes.json');

const isDryRun = process.argv.includes('--dry-run');

// Schema for pending creation requests
const PendingCreationRequestSchema = new mongoose.Schema({
  request_id: String,
  request_type: String,
  requested_value: String,
  requested_value_normalized: String,
  status: String,
  created_at: Date,
  updated_at: Date,
  fulfilled_at: Date,
  sf_id_received: String,
  context: {
    suggested_for_category: String,
    source: String,
    reason: String
  }
}, { collection: 'pending_creation_requests' });

const PendingCreationRequest = mongoose.model('PendingCreationRequest', PendingCreationRequestSchema);

function normalize(str) {
  return str.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║         BACKFILL FULFILLED ATTRIBUTES TO JSON                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Load current attributes.json
    const currentAttrs = JSON.parse(fs.readFileSync(ATTRIBUTES_PATH, 'utf8'));
    console.log(`📁 Current attributes.json: ${currentAttrs.length} attributes`);
    
    // Build lookup by normalized name and by ID
    const attrByNormName = new Map();
    const attrById = new Set();
    
    for (const attr of currentAttrs) {
      attrByNormName.set(normalize(attr.attribute_name), attr);
      if (attr.attribute_id) {
        attrById.add(attr.attribute_id);
      }
    }
    
    // Get fulfilled requests with SF IDs
    const fulfilled = await PendingCreationRequest.find({
      status: 'fulfilled',
      request_type: 'attribute',
      sf_id_received: { $exists: true, $ne: null }
    }).lean();
    
    console.log(`📋 Fulfilled requests with SF IDs: ${fulfilled.length}`);
    
    // Categorize
    const alreadyInJsonById = [];
    const alreadyInJsonByName = [];
    const needToAdd = [];
    
    for (const f of fulfilled) {
      // Check by SF ID first
      if (attrById.has(f.sf_id_received)) {
        alreadyInJsonById.push(f);
        continue;
      }
      
      // Check by normalized name
      const norm = normalize(f.requested_value);
      if (attrByNormName.has(norm)) {
        alreadyInJsonByName.push(f);
        continue;
      }
      
      // Not found - need to add
      needToAdd.push(f);
    }
    
    console.log('');
    console.log('┌─────────────────────────────────────────┬──────────┐');
    console.log('│ Status                                  │ Count    │');
    console.log('├─────────────────────────────────────────┼──────────┤');
    console.log(`│ Already in JSON (by ID)                 │ ${String(alreadyInJsonById.length).padStart(8)} │`);
    console.log(`│ Already in JSON (by name)               │ ${String(alreadyInJsonByName.length).padStart(8)} │`);
    console.log(`│ 🆕 Need to add to JSON                  │ ${String(needToAdd.length).padStart(8)} │`);
    console.log('└─────────────────────────────────────────┴──────────┘');
    console.log('');
    
    if (needToAdd.length === 0) {
      console.log('✅ Nothing to add - all fulfilled attributes already in JSON!');
      await mongoose.disconnect();
      return;
    }
    
    // Show what we'll add
    console.log('Attributes to add:');
    needToAdd.slice(0, 20).forEach(f => {
      console.log(`  + "${f.requested_value}" → ID: ${f.sf_id_received}`);
    });
    if (needToAdd.length > 20) {
      console.log(`  ... and ${needToAdd.length - 20} more`);
    }
    console.log('');
    
    if (isDryRun) {
      console.log('🔍 DRY RUN - Would add ' + needToAdd.length + ' attributes to JSON');
      await mongoose.disconnect();
      return;
    }
    
    // Add new attributes to JSON
    const toAdd = needToAdd.map(f => ({
      attribute_name: f.requested_value,
      attribute_id: f.sf_id_received
    }));
    
    // Merge with existing, avoiding duplicates
    const finalAttrs = [...currentAttrs];
    const existingNorms = new Set(currentAttrs.map(a => normalize(a.attribute_name)));
    
    for (const newAttr of toAdd) {
      const norm = normalize(newAttr.attribute_name);
      if (!existingNorms.has(norm)) {
        finalAttrs.push(newAttr);
        existingNorms.add(norm);
      }
    }
    
    // Sort alphabetically
    finalAttrs.sort((a, b) => a.attribute_name.localeCompare(b.attribute_name));
    
    // Write back
    fs.writeFileSync(ATTRIBUTES_PATH, JSON.stringify(finalAttrs, null, 2), 'utf8');
    
    console.log(`✅ Updated attributes.json: ${currentAttrs.length} → ${finalAttrs.length} attributes`);
    console.log(`   Added ${finalAttrs.length - currentAttrs.length} new attributes`);
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
