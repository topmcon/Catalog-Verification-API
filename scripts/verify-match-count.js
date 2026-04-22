#!/usr/bin/env node
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';

async function main() {
  await mongoose.connect(MONGODB_URI);
  
  const PendingCreationRequest = mongoose.model('PendingCreationRequest', new mongoose.Schema({}, { strict: false, collection: 'pending_creation_requests' }));
  const PendingPicklistSync = mongoose.model('PendingPicklistSync', new mongoose.Schema({}, { strict: false, collection: 'pending_picklist_syncs' }));
  
  const ourRequests = await PendingCreationRequest.find({ status: 'pending' }).lean();
  const recentSync = await PendingPicklistSync.findOne({ status: 'pending' }).sort({ created_at: -1 }).lean();
  
  console.log('═══════════════════════════════════════════════════');
  console.log('MATCH VERIFICATION: Our Requests vs SF Inbound Sync');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('OUR PENDING REQUESTS:', ourRequests.length);
  console.log('  Attributes:', ourRequests.filter(r => r.request_type === 'attribute').length);
  console.log('  Styles:', ourRequests.filter(r => r.request_type === 'style').length);
  console.log('  Brands:', ourRequests.filter(r => r.request_type === 'brand').length);
  console.log('');
  
  if (!recentSync) {
    console.log('❌ NO PENDING SF SYNC FOUND\n');
    await mongoose.disconnect();
    return;
  }
  
  console.log('SF INBOUND SYNC FOUND');
  console.log('  Received:', new Date(recentSync.created_at).toLocaleString('en-US', { timeZone: 'America/New_York' }));
  console.log('');
  
  const sfData = recentSync.incoming_data || {};
  
  // Check attributes
  const ourAttrRequests = ourRequests.filter(r => r.request_type === 'attribute');
  const sfAttributes = sfData.attributes || [];
  let attrMatches = 0;
  const matchedAttrs = [];
  const unmatchedAttrs = [];
  
  ourAttrRequests.forEach(req => {
    const normalized = req.requested_value_normalized || req.requested_value.toLowerCase().trim();
    const found = sfAttributes.find(a => a.attribute_name.toLowerCase().trim() === normalized);
    if (found) {
      attrMatches++;
      matchedAttrs.push({ our: req.requested_value, sf: found.attribute_name, id: found.attribute_id });
    } else {
      unmatchedAttrs.push(req.requested_value);
    }
  });
  
  // Check brands
  const ourBrandRequests = ourRequests.filter(r => r.request_type === 'brand');
  const sfBrands = sfData.brands || [];
  let brandMatches = 0;
  const matchedBrands = [];
  const unmatchedBrands = [];
  
  ourBrandRequests.forEach(req => {
    const normalized = req.requested_value_normalized || req.requested_value.toLowerCase().trim();
    const found = sfBrands.find(b => b.brand_name.toLowerCase().trim() === normalized);
    if (found) {
      brandMatches++;
      matchedBrands.push({ our: req.requested_value, sf: found.brand_name, id: found.brand_id });
    } else {
      unmatchedBrands.push(req.requested_value);
    }
  });
  
  // Check styles
  const ourStyleRequests = ourRequests.filter(r => r.request_type === 'style');
  const sfStyles = sfData.styles || [];
  let styleMatches = 0;
  const matchedStyles = [];
  const unmatchedStyles = [];
  
  ourStyleRequests.forEach(req => {
    const normalized = req.requested_value_normalized || req.requested_value.toLowerCase().trim();
    const found = sfStyles.find(s => s.style_name.toLowerCase().trim() === normalized);
    if (found) {
      styleMatches++;
      matchedStyles.push({ our: req.requested_value, sf: found.style_name, id: found.style_id });
    } else {
      unmatchedStyles.push(req.requested_value);
    }
  });
  
  const totalMatches = attrMatches + brandMatches + styleMatches;
  const totalRequests = ourRequests.length;
  
  console.log('═══════════════════════════════════════════════════');
  console.log('MATCH RESULTS');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('Attributes: ' + attrMatches + ' of ' + ourAttrRequests.length + ' match (' + Math.round(attrMatches/ourAttrRequests.length*100) + '%)');
  console.log('Brands:     ' + brandMatches + ' of ' + ourBrandRequests.length + ' match');
  console.log('Styles:     ' + styleMatches + ' of ' + ourStyleRequests.length + ' match');
  console.log('');
  console.log('TOTAL:      ' + totalMatches + ' of ' + totalRequests + ' match (' + Math.round(totalMatches/totalRequests*100) + '%)\n');
  
  if (attrMatches > 0) {
    console.log('✅ MATCHED ATTRIBUTES (' + attrMatches + '):');
    matchedAttrs.slice(0, 10).forEach(m => console.log('  • ' + m.our + ' → SF ID: ' + m.id));
    if (attrMatches > 10) console.log('  ... and ' + (attrMatches - 10) + ' more');
    console.log('');
  }
  
  if (unmatchedAttrs.length > 0) {
    console.log('❌ UNMATCHED ATTRIBUTES (' + unmatchedAttrs.length + '):');
    unmatchedAttrs.slice(0, 10).forEach(a => console.log('  • ' + a));
    if (unmatchedAttrs.length > 10) console.log('  ... and ' + (unmatchedAttrs.length - 10) + ' more');
    console.log('');
  }
  
  if (brandMatches > 0) {
    console.log('✅ MATCHED BRANDS (' + brandMatches + '):');
    matchedBrands.forEach(m => console.log('  • ' + m.our + ' → SF ID: ' + m.id));
    console.log('');
  }
  
  if (unmatchedBrands.length > 0) {
    console.log('❌ UNMATCHED BRANDS (' + unmatchedBrands.length + '):');
    unmatchedBrands.forEach(b => console.log('  • ' + b));
    console.log('');
  }
  
  if (styleMatches > 0) {
    console.log('✅ MATCHED STYLES (' + styleMatches + '):');
    matchedStyles.forEach(m => console.log('  • ' + m.our + ' → SF ID: ' + m.id));
    console.log('');
  }
  
  if (unmatchedStyles.length > 0) {
    console.log('❌ UNMATCHED STYLES (' + unmatchedStyles.length + '):');
    unmatchedStyles.forEach(s => console.log('  • ' + s));
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');
  console.log('YES - We have ' + totalMatches + ' matches in the inbound SF sync');
  console.log('These ' + totalMatches + ' items can be fulfilled from this sync\n');
  
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
