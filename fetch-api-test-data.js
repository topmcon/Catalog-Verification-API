#!/usr/bin/env node
/**
 * Fetch the 4 most recent Salesforce API call data from production
 * Extracts both INPUT (what Salesforce sent) and OUTPUT (what we returned)
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// The 4 catalog IDs we want to test
const CATALOG_IDS = [
  'a03aZ00000Nk21gQAB', // Chandelier - Jan 22, 5:59 PM
  'a03Hu00001N2EY9IAN', // Refrigerator - Jan 22, 12:46 PM
  'a03Hu00001N1rXxIAJ', // Dishwasher (first call) - Jan 22, 9:44 AM
  'a03Hu00001N1rXxIAJ', // Dishwasher (second call) - Jan 22, 9:36 AM
];

const sshCmd = (cmd) => `ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "${cmd}"`;

async function fetchProductData(catalogId, index) {
  return new Promise((resolve, reject) => {
    // Query production MongoDB for the actual product data
    const mongoQuery = `docker exec mongodb mongosh catalog-verification --quiet --eval '
      db.products.findOne(
        { SF_Catalog_Id: "${catalogId}" },
        { sort: { updatedAt: -1 } }
      )
    '`;
    
    exec(sshCmd(mongoQuery), { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error fetching ${catalogId}:`, error.message);
        resolve(null);
        return;
      }
      
      try {
        // Clean up MongoDB output
        const jsonStr = stdout.trim();
        if (!jsonStr || jsonStr === 'null') {
          console.log(`⚠️  No data found for ${catalogId}`);
          resolve(null);
          return;
        }
        
        const product = JSON.parse(jsonStr);
        
        // Save to file
        const filename = `test-data-${index + 1}-${catalogId}.json`;
        const filepath = path.join(__dirname, 'test-data', filename);
        
        // Create test-data directory if it doesn't exist
        if (!fs.existsSync(path.join(__dirname, 'test-data'))) {
          fs.mkdirSync(path.join(__dirname, 'test-data'));
        }
        
        fs.writeFileSync(filepath, JSON.stringify(product, null, 2));
        console.log(`✅ Saved: ${filename}`);
        
        resolve({ catalogId, product, filepath });
      } catch (parseError) {
        console.error(`❌ Parse error for ${catalogId}:`, parseError.message);
        resolve(null);
      }
    });
  });
}

async function main() {
  console.log('================================================');
  console.log('FETCHING API TEST DATA FROM PRODUCTION');
  console.log('================================================\n');
  
  const results = [];
  
  for (let i = 0; i < CATALOG_IDS.length; i++) {
    const catalogId = CATALOG_IDS[i];
    console.log(`\n[${i + 1}/4] Fetching ${catalogId}...`);
    const result = await fetchProductData(catalogId, i);
    if (result) {
      results.push(result);
    }
  }
  
  console.log('\n================================================');
  console.log(`COMPLETE: ${results.length} products fetched`);
  console.log('================================================');
  console.log('\nTest data saved in: ./test-data/');
  console.log('\nNext steps:');
  console.log('1. Review the JSON files');
  console.log('2. Use them to test the new optimized flow');
  console.log('3. Compare performance: old (~80s) vs new (~40s expected)');
}

main().catch(console.error);
