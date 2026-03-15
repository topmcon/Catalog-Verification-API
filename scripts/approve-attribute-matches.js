#!/usr/bin/env node
/**
 * Approve all attribute matches from SF sync
 * Updates attributes.json with SF IDs and marks pending requests as fulfilled
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function approveMatches() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('catalog-verification');

  // Get sync with most attributes
  const syncs = await db.collection('pending_picklist_syncs').find({ status: 'pending' }).toArray();
  console.log(`Found ${syncs.length} pending syncs`);
  
  if (syncs.length === 0) {
    console.log('No pending syncs found!');
    await client.close();
    return;
  }
  
  // Find sync with most attributes
  let best = null;
  let maxAttrs = 0;
  for (const s of syncs) {
    const attrCount = s.incoming_data?.attributes?.length || 0;
    if (attrCount > maxAttrs) {
      maxAttrs = attrCount;
      best = s;
    }
  }
  
  if (!best || !best.incoming_data?.attributes) {
    console.log('No sync has attributes data!');
    await client.close();
    return;
  }
  
  const sfAttrs = best.incoming_data.attributes;
  console.log(`Using sync with ${sfAttrs.length} attributes`);

  // Get pending requests
  const pending = await db.collection('pending_creation_requests')
    .find({ type: 'attribute', status: 'pending' }).toArray();

  // Build SF lookup
  const sfLookup = {};
  sfAttrs.forEach(a => { sfLookup[a.attribute_name.toLowerCase()] = a; });

  // Find matches
  const matches = [];
  for (const p of pending) {
    const sfAttr = sfLookup[p.value.toLowerCase()];
    if (sfAttr) matches.push({ pending: p, sf: sfAttr });
  }

  console.log(`Found ${matches.length} matches to approve\n`);

  // Read current attributes.json
  const attrsPath = path.join(__dirname, '../src/config/salesforce-picklists/attributes.json');
  const attrs = JSON.parse(fs.readFileSync(attrsPath, 'utf8'));

  let updated = 0;
  for (const m of matches) {
    // Update JSON
    const idx = attrs.findIndex(a => a.attribute_name.toLowerCase() === m.pending.value.toLowerCase());
    if (idx >= 0 && attrs[idx].attribute_id === 'NEEDS_SF_ID') {
      attrs[idx].attribute_id = m.sf.attribute_id;
      updated++;
      console.log(`✅ ${m.pending.value} → ${m.sf.attribute_id}`);
    }
    // Mark MongoDB as fulfilled
    await db.collection('pending_creation_requests').updateOne(
      { _id: m.pending._id },
      { $set: { status: 'fulfilled', fulfilledAt: new Date(), sfId: m.sf.attribute_id } }
    );
  }

  fs.writeFileSync(attrsPath, JSON.stringify(attrs, null, 2));
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`  Updated ${updated} IDs in attributes.json`);
  console.log(`  Marked ${matches.length} requests as fulfilled`);

  await client.close();
}

approveMatches().catch(e => { console.error(e); process.exit(1); });
