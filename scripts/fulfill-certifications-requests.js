#!/usr/bin/env node
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification').then(async () => {
  const CreationRequest = mongoose.model('CreationRequest', new mongoose.Schema({}, {
    strict: false,
    collection: 'pending_creation_requests'
  }));

  console.log('\n🔧 Fulfilling certifications/certification pending requests\n');

  // Update certifications (plural)
  const cert1 = await CreationRequest.findOneAndUpdate(
    { requested_value: 'certifications', request_type: 'attribute', status: 'pending' },
    { 
      status: 'fulfilled',
      fulfilled_at: new Date(),
      fulfilled_sf_id: 'a1aaZ000009X61eQAC',
      fulfillment_notes: 'Attribute already existed in SF picklist. Bug fix: removed incorrect ATTRIBUTE_ALIASES mapping that prevented matching.'
    },
    { new: true }
  ).lean();

  if (cert1) {
    console.log('✅ Fulfilled "certifications" (plural)');
    console.log(`   SF ID: ${cert1.fulfilled_sf_id}`);
    console.log(`   Request count: ${cert1.request_count}`);
    console.log(`   Jobs waiting: ${cert1.requested_by_jobs?.length || 0}`);
  } else {
    console.log('⚠️  "certifications" request not found or already fulfilled');
  }

  // Update certification (singular)
  const cert2 = await CreationRequest.findOneAndUpdate(
    { requested_value: 'certification', request_type: 'attribute', status: 'pending' },
    { 
      status: 'fulfilled',
      fulfilled_at: new Date(),
      fulfilled_sf_id: 'a1aaZ000009X61eQAC',
      fulfillment_notes: 'Mapped to plural form "certifications" via ATTRIBUTE_ALIASES. Bug fix: corrected alias to point to existing SF attribute.'
    },
    { new: true }
  ).lean();

  if (cert2) {
    console.log('\n✅ Fulfilled "certification" (singular)');
    console.log(`   SF ID: ${cert2.fulfilled_sf_id}`);
    console.log(`   Request count: ${cert2.request_count}`);
    console.log(`   Jobs waiting: ${cert2.requested_by_jobs?.length || 0}`);
  } else {
    console.log('\n⚠️  "certification" request not found or already fulfilled');
  }

  console.log('\n📊 Summary:');
  console.log(`   Total jobs unblocked: ${(cert1?.requested_by_jobs?.length || 0) + (cert2?.requested_by_jobs?.length || 0)}`);
  console.log(`   Total wasted requests: ${(cert1?.request_count || 0) + (cert2?.request_count || 0)}`);
  console.log(`   SF ID provided: a1aaZ000009X61eQAC`);
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
