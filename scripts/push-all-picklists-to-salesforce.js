/**
 * Push All Picklists to Salesforce
 * 
 * This script sends ALL our current picklist data to Salesforce to sync them with our lists.
 * Picklists: brands, categories, attributes, styles
 * 
 * Usage: node scripts/push-all-picklists-to-salesforce.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const SALESFORCE_URL = 'https://data-nosoftware-2565.my.salesforce-sites.com/services/apexrest/category_attributes_verify';
const API_KEY = '873648276-550e8400';

const DRY_RUN = process.argv.includes('--dry-run');

// Picklist file paths
const PICKLIST_DIR = path.join(__dirname, '../src/config/salesforce-picklists');

const PICKLISTS = {
  brands: {
    file: 'brands.json',
    type: 'brands',
    itemKey: 'brands'
  },
  categories: {
    file: 'categories.json',
    type: 'categories',
    itemKey: 'categories'
  },
  attributes: {
    file: 'attributes.json',
    type: 'attributes',
    itemKey: 'attributes'
  },
  styles: {
    file: 'styles.json',
    type: 'styles',
    itemKey: 'styles'
  }
};

function loadPicklist(name) {
  const config = PICKLISTS[name];
  const filePath = path.join(PICKLIST_DIR, config.file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return data;
}

function makeRequest(payload) {
  return new Promise((resolve, reject) => {
    const payloadString = JSON.stringify(payload);
    const url = new URL(SALESFORCE_URL);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString),
        'x-api-key': API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payloadString);
    req.end();
  });
}

async function pushPicklist(name) {
  const config = PICKLISTS[name];
  const data = loadPicklist(name);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Pushing ${name.toUpperCase()} to Salesforce`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   📁 File: ${config.file}`);
  console.log(`   📊 Count: ${data.length} items`);

  const payload = {
    type: config.type,
    action: 'sync_from_api',
    total_count: data.length,
    [config.itemKey]: data
  };

  if (DRY_RUN) {
    console.log(`   🔍 DRY RUN - Would send ${data.length} ${name}`);
    console.log(`   📋 Sample payload structure:`);
    console.log(`      type: "${config.type}"`);
    console.log(`      action: "sync_from_api"`);
    console.log(`      total_count: ${data.length}`);
    console.log(`      ${config.itemKey}: [${data.length} items]`);
    return { success: true, dryRun: true };
  }

  try {
    const response = await makeRequest(payload);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(`   ✅ SUCCESS! Status: ${response.statusCode}`);
      try {
        const responseData = JSON.parse(response.body);
        console.log(`   📋 Response: ${JSON.stringify(responseData).substring(0, 200)}...`);
      } catch (e) {
        console.log(`   📋 Response: ${response.body.substring(0, 200)}...`);
      }
      return { success: true, statusCode: response.statusCode };
    } else {
      console.log(`   ❌ FAILED! Status: ${response.statusCode} ${response.statusMessage}`);
      console.log(`   📋 Error: ${response.body.substring(0, 500)}`);
      return { success: false, statusCode: response.statusCode, error: response.body };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n' + '╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(10) + '🚀 PUSH ALL PICKLISTS TO SALESFORCE' + ' '.repeat(12) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - No data will be sent to Salesforce\n');
  }

  console.log(`🌐 Endpoint: ${SALESFORCE_URL}`);
  console.log(`📅 Date: ${new Date().toISOString()}`);

  // Load and show summary
  console.log('\n📊 PICKLIST SUMMARY:');
  for (const [name, config] of Object.entries(PICKLISTS)) {
    const data = loadPicklist(name);
    console.log(`   ${name.padEnd(12)}: ${data.length} items`);
  }

  // Ask for confirmation if not dry run
  if (!DRY_RUN) {
    console.log('\n⚠️  WARNING: This will update Salesforce picklists with our data!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const results = {};
  
  // Push each picklist
  for (const name of Object.keys(PICKLISTS)) {
    results[name] = await pushPicklist(name);
    
    // Small delay between requests
    if (!DRY_RUN) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('═'.repeat(60));
  
  let successCount = 0;
  let failCount = 0;
  
  for (const [name, result] of Object.entries(results)) {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${name.padEnd(12)}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    if (result.success) successCount++;
    else failCount++;
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log(`   Total: ${successCount} succeeded, ${failCount} failed`);
  
  if (DRY_RUN) {
    console.log('\n💡 To actually push data, run without --dry-run flag');
  }
  
  console.log('\n');
  
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
