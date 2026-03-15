#!/usr/bin/env node
/**
 * Check all pending attribute requests against SF sync data
 */

const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
  
  // Get sync with most attributes
  const syncs = await mongoose.connection.db.collection('pending_picklist_syncs')
    .find({ status: 'pending' })
    .sort({ created_at: -1 })
    .limit(20)
    .toArray();
  
  let bestSync = null;
  let maxAttrs = 0;
  for (const s of syncs) {
    const count = s.incoming_data?.attributes?.length || 0;
    if (count > maxAttrs) {
      maxAttrs = count;
      bestSync = s;
    }
  }
  
  console.log('Using sync with', maxAttrs, 'attributes');
  
  const sfAttrs = bestSync.incoming_data.attributes;
  
  // Get pending requests
  const pending = await mongoose.connection.db.collection('pending_creation_requests')
    .find({ request_type: 'attribute', status: 'pending' }).toArray();
  
  console.log('Our pending requests:', pending.length);
  
  // Build SF lookup
  const sfMap = new Map();
  sfAttrs.forEach(a => sfMap.set(a.attribute_name.toLowerCase().trim(), a.attribute_id));
  
  // Find matches
  const matches = [];
  const notFound = [];
  for (const req of pending) {
    const key = req.requested_value.toLowerCase().trim();
    if (sfMap.has(key)) {
      matches.push({ name: req.requested_value, sfId: sfMap.get(key) });
    } else {
      notFound.push(req.requested_value);
    }
  }
  
  console.log('');
  console.log('=== FULL ANALYSIS ===');
  console.log('✅ MATCHES:', matches.length);
  console.log('❌ NOT FOUND in SF:', notFound.length);
  
  if (notFound.length > 0) {
    console.log('');
    console.log('Attributes we requested but SF has NOT sent:');
    notFound.forEach(n => console.log('  •', n));
  }
  
  await mongoose.disconnect();
}

main().catch(console.error);
