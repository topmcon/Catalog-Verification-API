/**
 * Compare and Sync Picklists with Salesforce
 * 
 * This script:
 * 1. Fetches Salesforce's current picklists via their API
 * 2. Compares them to our local picklists
 * 3. Shows detailed differences (what SF has that we don't, what we have that SF doesn't)
 * 4. Optionally syncs in either direction after user confirmation
 * 
 * Usage: 
 *   node scripts/compare-and-sync-picklists.js                    # Compare only
 *   node scripts/compare-and-sync-picklists.js --fetch-from-sf    # Fetch SF picklists first
 *   node scripts/compare-and-sync-picklists.js --push-to-sf       # Push our lists to SF (after compare)
 * 
 * Note: Salesforce must expose a GET endpoint for picklists, or we use the /sync endpoint
 *       to request their current data.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

// Configuration
const SALESFORCE_URL = 'https://data-nosoftware-2565.my.salesforce-sites.com/services/apexrest/category_attributes_verify';
const API_KEY = '873648276-550e8400';

// Picklist file paths
const PICKLIST_DIR = path.join(__dirname, '../src/config/salesforce-picklists');

const PICKLISTS = {
  brands: {
    file: 'brands.json',
    idField: 'brand_id',
    nameField: 'brand_name'
  },
  categories: {
    file: 'categories.json',
    idField: 'category_id',
    nameField: 'category_name'
  },
  attributes: {
    file: 'attributes.json',
    idField: 'attribute_id',
    nameField: 'attribute_name'
  },
  styles: {
    file: 'styles.json',
    idField: 'style_id',
    nameField: 'style_name'
  }
};

function loadLocalPicklist(name) {
  const config = PICKLISTS[name];
  const filePath = path.join(PICKLIST_DIR, config.file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return data;
  } catch (error) {
    console.error(`Failed to load ${name}: ${error.message}`);
    return [];
  }
}

function makeRequest(method, url, payload = null, apiKey = API_KEY) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    };

    if (payload) {
      const payloadString = JSON.stringify(payload);
      options.headers['Content-Length'] = Buffer.byteLength(payloadString);
    }

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

    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
}

async function fetchSalesforcePicklists() {
  console.log('\n📡 Requesting current picklists from Salesforce...\n');
  
  // Try to request SF to send us their current picklists
  // This assumes SF has an endpoint that responds with their current data
  const payload = {
    action: 'get_current_picklists',
    request_type: 'fetch_all'
  };

  try {
    const response = await makeRequest('POST', SALESFORCE_URL, payload);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        const data = JSON.parse(response.body);
        return data;
      } catch (e) {
        console.log('⚠️  Could not parse SF response as JSON');
        console.log('Response:', response.body.substring(0, 500));
        return null;
      }
    } else {
      console.log(`⚠️  SF returned status ${response.statusCode}`);
      console.log('Response:', response.body.substring(0, 500));
      return null;
    }
  } catch (error) {
    console.log(`❌ Error fetching from SF: ${error.message}`);
    return null;
  }
}

function comparePicklists(localData, sfData, config) {
  const localById = new Map();
  const localByName = new Map();
  const sfById = new Map();
  const sfByName = new Map();

  // Index local data
  localData.forEach(item => {
    const id = item[config.idField];
    const name = item[config.nameField];
    if (id) localById.set(id, item);
    if (name) localByName.set(name.toLowerCase(), item);
  });

  // Index SF data
  sfData.forEach(item => {
    const id = item[config.idField];
    const name = item[config.nameField];
    if (id) sfById.set(id, item);
    if (name) sfByName.set(name.toLowerCase(), item);
  });

  const result = {
    localCount: localData.length,
    sfCount: sfData.length,
    onlyInLocal: [],      // We have, SF doesn't
    onlyInSF: [],         // SF has, we don't
    inBoth: [],           // Same ID or name in both
    nameMatches: [],      // Same name but different ID
    idMatches: []         // Same ID but different name
  };

  // Find items only in local
  localData.forEach(item => {
    const id = item[config.idField];
    const name = item[config.nameField];
    
    const sfHasId = sfById.has(id);
    const sfHasName = sfByName.has(name?.toLowerCase());

    if (!sfHasId && !sfHasName) {
      result.onlyInLocal.push(item);
    } else if (sfHasId && sfHasName) {
      result.inBoth.push(item);
    } else if (sfHasName && !sfHasId) {
      result.nameMatches.push({ local: item, sf: sfByName.get(name.toLowerCase()) });
    } else if (sfHasId && !sfHasName) {
      result.idMatches.push({ local: item, sf: sfById.get(id) });
    }
  });

  // Find items only in SF
  sfData.forEach(item => {
    const id = item[config.idField];
    const name = item[config.nameField];
    
    const localHasId = localById.has(id);
    const localHasName = localByName.has(name?.toLowerCase());

    if (!localHasId && !localHasName) {
      result.onlyInSF.push(item);
    }
  });

  return result;
}

function printComparisonReport(name, comparison, config) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📦 ${name.toUpperCase()}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`   Local: ${comparison.localCount} items`);
  console.log(`   SF:    ${comparison.sfCount} items`);
  console.log(`   ─────────────────────────────────`);
  console.log(`   ✅ In Both:        ${comparison.inBoth.length}`);
  console.log(`   📤 Only in Local:  ${comparison.onlyInLocal.length} (we have, SF doesn't)`);
  console.log(`   📥 Only in SF:     ${comparison.onlyInSF.length} (SF has, we don't)`);
  
  if (comparison.nameMatches.length > 0) {
    console.log(`   ⚠️  Name matches (diff ID): ${comparison.nameMatches.length}`);
  }
  if (comparison.idMatches.length > 0) {
    console.log(`   ⚠️  ID matches (diff name): ${comparison.idMatches.length}`);
  }

  // Show details for items only in local (first 10)
  if (comparison.onlyInLocal.length > 0) {
    console.log(`\n   📤 ONLY IN LOCAL (first 10):`);
    comparison.onlyInLocal.slice(0, 10).forEach(item => {
      console.log(`      - ${item[config.nameField]} (${item[config.idField]})`);
    });
    if (comparison.onlyInLocal.length > 10) {
      console.log(`      ... and ${comparison.onlyInLocal.length - 10} more`);
    }
  }

  // Show details for items only in SF (first 10)
  if (comparison.onlyInSF.length > 0) {
    console.log(`\n   📥 ONLY IN SF (first 10):`);
    comparison.onlyInSF.slice(0, 10).forEach(item => {
      console.log(`      - ${item[config.nameField]} (${item[config.idField]})`);
    });
    if (comparison.onlyInSF.length > 10) {
      console.log(`      ... and ${comparison.onlyInSF.length - 10} more`);
    }
  }

  // Show name/ID mismatches
  if (comparison.nameMatches.length > 0) {
    console.log(`\n   ⚠️  NAME MATCHES WITH DIFFERENT IDs:`);
    comparison.nameMatches.slice(0, 5).forEach(({ local, sf }) => {
      console.log(`      "${local[config.nameField]}"`);
      console.log(`         Local ID: ${local[config.idField]}`);
      console.log(`         SF ID:    ${sf[config.idField]}`);
    });
  }
}

async function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function pushToSalesforce(name, data, config) {
  console.log(`\n   📤 Pushing ${data.length} ${name} to Salesforce...`);
  
  const payload = {
    type: name,
    action: 'sync_from_api',
    total_count: data.length,
    [name]: data
  };

  try {
    const response = await makeRequest('POST', SALESFORCE_URL, payload);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(`   ✅ SUCCESS! Status: ${response.statusCode}`);
      return true;
    } else {
      console.log(`   ❌ FAILED! Status: ${response.statusCode}`);
      console.log(`   Response: ${response.body.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n' + '╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(8) + '🔄 COMPARE & SYNC PICKLISTS WITH SALESFORCE' + ' '.repeat(5) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');

  const args = process.argv.slice(2);
  const fetchFromSF = args.includes('--fetch-from-sf');
  const pushToSF = args.includes('--push-to-sf');

  // Load local picklists
  console.log('\n📁 Loading local picklists...');
  const localPicklists = {};
  for (const [name, config] of Object.entries(PICKLISTS)) {
    localPicklists[name] = loadLocalPicklist(name);
    console.log(`   ${name.padEnd(12)}: ${localPicklists[name].length} items`);
  }

  // Try to fetch SF picklists
  let sfPicklists = null;
  
  if (fetchFromSF) {
    sfPicklists = await fetchSalesforcePicklists();
  }

  if (!sfPicklists) {
    console.log('\n' + '═'.repeat(60));
    console.log('⚠️  CANNOT DIRECTLY FETCH SF PICKLISTS');
    console.log('═'.repeat(60));
    console.log('\nSalesforce does not expose a GET endpoint for picklists.');
    console.log('We can only compare when SF sends us their data via sync.\n');
    
    console.log('OPTIONS:');
    console.log('  1. Request SF team to trigger a picklist sync to our API');
    console.log('  2. Push our current lists to SF (may overwrite SF data!)');
    console.log('  3. Compare with last received SF sync (from MongoDB logs)\n');
    
    if (pushToSF) {
      console.log('\n⚠️  --push-to-sf flag detected');
      console.log('This will send our local picklists to SF WITHOUT comparison.\n');
      
      const answer = await askQuestion('Are you sure you want to push ALL local picklists to SF? (yes/no): ');
      
      if (answer === 'yes') {
        console.log('\n🚀 Pushing local picklists to Salesforce...');
        
        for (const [name, config] of Object.entries(PICKLISTS)) {
          await pushToSalesforce(name, localPicklists[name], config);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between requests
        }
        
        console.log('\n✅ Push complete!');
      } else {
        console.log('\n❌ Cancelled.');
      }
    } else {
      console.log('💡 To push our lists to SF, run:');
      console.log('   node scripts/compare-and-sync-picklists.js --push-to-sf\n');
    }
    
    return;
  }

  // If we got SF data, compare
  console.log('\n📊 Comparing picklists...');
  
  const comparisons = {};
  for (const [name, config] of Object.entries(PICKLISTS)) {
    const sfData = sfPicklists[name] || [];
    comparisons[name] = comparePicklists(localPicklists[name], sfData, config);
    printComparisonReport(name, comparisons[name], config);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 OVERALL SUMMARY');
  console.log('═'.repeat(60));
  
  let totalOnlyLocal = 0;
  let totalOnlySF = 0;
  let totalInBoth = 0;

  for (const [name, comp] of Object.entries(comparisons)) {
    totalOnlyLocal += comp.onlyInLocal.length;
    totalOnlySF += comp.onlyInSF.length;
    totalInBoth += comp.inBoth.length;
  }

  console.log(`   Items in both:     ${totalInBoth}`);
  console.log(`   Only in Local:     ${totalOnlyLocal}`);
  console.log(`   Only in SF:        ${totalOnlySF}`);

  if (totalOnlyLocal > 0 || totalOnlySF > 0) {
    console.log('\n⚠️  DIFFERENCES DETECTED!');
    console.log('\nRecommendations:');
    
    if (totalOnlyLocal > 0) {
      console.log(`   📤 You have ${totalOnlyLocal} items SF doesn't have`);
      console.log('      → Consider pushing these to SF');
    }
    
    if (totalOnlySF > 0) {
      console.log(`   📥 SF has ${totalOnlySF} items you don't have`);
      console.log('      → Consider pulling these from SF');
    }
  } else {
    console.log('\n✅ ALL PICKLISTS ARE IN SYNC!');
  }

  console.log('\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
