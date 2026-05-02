#!/usr/bin/env node
/**
 * Resend All Pending Creation Requests to Salesforce
 *
 * Historical context: checkAndCreateRequest() was recording requests in MongoDB but
 * never actually POSTing to Salesforce. This script finds every pending request that
 * was silently dropped and sends them all correctly now.
 *
 * Usage: node scripts/resend-pending-creation-requests.js [--dry-run]
 */

const mongoose = require('mongoose');
const https = require('https');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/catalog-verification';
const SALESFORCE_URL = 'https://data-nosoftware-2565.my.salesforce-sites.com/services/apexrest/category_attributes_verify';
const API_KEY = '873648276-550e8400';
const DRY_RUN = process.argv.includes('--dry-run');

const PendingCreationRequestSchema = new mongoose.Schema({
  request_id: String,
  request_type: String,
  requested_value: String,
  requested_value_normalized: String,
  status: String,
  created_at: Date,
  sent_to_sf_count: Number,
  last_sent_at: Date,
  request_count: Number,
  requested_by_jobs: Array,
  context: mongoose.Schema.Types.Mixed
}, { collection: 'pending_creation_requests' });

const PendingRequest = mongoose.model('PendingCreationRequest', PendingCreationRequestSchema);

function postToSalesforce(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const url = new URL(SALESFORCE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': API_KEY
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

function buildPayload(type, value, context) {
  switch (type) {
    case 'style':
      return {
        type: 'styles',
        action: 'create_request',
        total_count: 1,
        styles: [{
          style_id: `temp_resend_${Date.now()}`,
          style_name: value,
          requested_for_category: context?.suggested_for_category || ''
        }]
      };
    case 'attribute':
      return {
        type: 'attributes',
        action: 'create_request',
        total_count: 1,
        attributes: [{
          attribute_id: 'NEEDS_SF_ID',
          attribute_name: value,
          requested_for_category: context?.suggested_for_category || ''
        }]
      };
    case 'brand':
      return {
        type: 'brands',
        action: 'create_request',
        total_count: 1,
        brands: [{ brand_id: 'NEEDS_SF_ID', brand_name: value }]
      };
    case 'category':
      return {
        type: 'categories',
        action: 'create_request',
        total_count: 1,
        categories: [{
          category_id: 'NEEDS_SF_ID',
          category_name: value,
          department: context?.suggested_for_category || ''
        }]
      };
    default:
      return { type, action: 'create_request', total_count: 1, items: [{ name: value }] };
  }
}

async function main() {
  console.log('\n' + '═'.repeat(65));
  console.log('       RESEND PENDING CREATION REQUESTS TO SALESFORCE');
  if (DRY_RUN) console.log('       *** DRY RUN — no requests will be sent ***');
  console.log('═'.repeat(65) + '\n');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  const pending = await PendingRequest.find({ status: 'pending' }).sort({ created_at: 1 });
  console.log(`📋 Found ${pending.length} pending creation requests\n`);

  if (pending.length === 0) {
    console.log('✅ Nothing to send.\n');
    await mongoose.disconnect();
    return;
  }

  // Group by type for summary
  const byType = {};
  for (const req of pending) {
    byType[req.request_type] = (byType[req.request_type] || 0) + 1;
  }
  console.log('📊 Breakdown by type:');
  for (const [type, count] of Object.entries(byType)) {
    console.log(`   ${type.padEnd(12)} ${count}`);
  }
  console.log('');

  let sent = 0, failed = 0;
  const results = [];

  for (const req of pending) {
    const payload = buildPayload(req.request_type, req.requested_value, req.context);
    const daysOld = Math.floor((Date.now() - new Date(req.created_at).getTime()) / 86400000);
    const jobCount = req.requested_by_jobs?.length || 0;

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would send: ${req.request_type} "${req.requested_value}" (${daysOld}d old, ${jobCount} jobs waiting)`);
      sent++;
      continue;
    }

    try {
      const result = await postToSalesforce(payload);
      let sfResponse = {};
      try { sfResponse = JSON.parse(result.body); } catch {}

      if (result.status === 200) {
        // Update MongoDB record
        await PendingRequest.updateOne(
          { _id: req._id },
          {
            $inc: { sent_to_sf_count: 1 },
            $set: { last_sent_at: new Date() }
          }
        );
        sent++;
        console.log(`  ✅ ${req.request_type.padEnd(10)} "${req.requested_value}" → HTTP ${result.status}`);
        results.push({ value: req.requested_value, type: req.request_type, status: 'sent', sfResponse });
      } else {
        failed++;
        console.log(`  ❌ ${req.request_type.padEnd(10)} "${req.requested_value}" → HTTP ${result.status} ${result.body}`);
        results.push({ value: req.requested_value, type: req.request_type, status: 'failed', httpStatus: result.status });
      }

      // Small delay to avoid hammering SF
      await new Promise(r => setTimeout(r, 200));

    } catch (err) {
      failed++;
      console.log(`  ❌ ${req.request_type.padEnd(10)} "${req.requested_value}" → ERROR: ${err.message}`);
      results.push({ value: req.requested_value, type: req.request_type, status: 'error', error: err.message });
    }
  }

  console.log('\n' + '─'.repeat(65));
  console.log(`RESULTS: ${sent} sent successfully${failed > 0 ? `, ${failed} failed` : ''}`);
  
  if (!DRY_RUN) {
    console.log('\n⏰ SF typically sends back a picklist sync within 3-5 minutes.');
    console.log('   Watch for inbound POST /api/picklists/sync with the new items.');
    console.log('   Run: ssh root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log | grep -E \'SFDC-Callout|fulfilled\'"');
  }
  console.log('');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
