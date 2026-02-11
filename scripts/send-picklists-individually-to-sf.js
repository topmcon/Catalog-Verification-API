#!/usr/bin/env node
/**
 * Send All Picklists to Salesforce (Individual Calls)
 * 
 * Sends each picklist type separately to Salesforce's API
 * so they can update their lists to match ours.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const SALESFORCE_URL = 'https://data-nosoftware-2565.my.salesforce-sites.com/services/apexrest/category_attributes_verify';
const API_KEY = '873648276-550e8400';

const PICKLIST_DIR = path.join(__dirname, '../src/config/salesforce-picklists');

function loadPicklist(filename) {
  const filepath = path.join(PICKLIST_DIR, filename);
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function sendToSalesforce(payload) {
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.write(payloadString);
    req.end();
  });
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('   📤 SENDING PICKLISTS TO SALESFORCE (INDIVIDUAL)');
  console.log('═'.repeat(60) + '\n');

  // Load all
  const categories = loadPicklist('categories.json');
  const brands = loadPicklist('brands.json');
  const attributes = loadPicklist('attributes.json');
  const styles = loadPicklist('styles.json');
  const types = loadPicklist('types.json');

  const picklists = [
    { name: 'categories', type: 'categories', data: categories, key: 'categories' },
    { name: 'brands', type: 'brands', data: brands, key: 'brands' },
    { name: 'attributes', type: 'attributes', data: attributes, key: 'attributes' },
    { name: 'styles', type: 'styles', data: styles, key: 'styles' },
    { name: 'types', type: 'types', data: types, key: 'types' }
  ];

  const results = [];

  for (const pl of picklists) {
    console.log(`\n📤 Sending ${pl.name} (${pl.data.length} items)...`);
    
    const payload = {
      type: pl.type,
      source: 'catalog-verification-api',
      total_count: pl.data.length,
      [pl.key]: pl.data
    };

    try {
      const response = await sendToSalesforce(payload);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      try {
        const parsed = JSON.parse(response.data);
        console.log(`   Success: ${parsed.success}`);
        if (parsed.message) {
          console.log(`   Message: ${parsed.message.substring(0, 100)}...`);
        }
      } catch (e) {
        console.log(`   Response: ${response.data.substring(0, 100)}...`);
      }
      
      results.push({ name: pl.name, status: response.status, success: response.status === 200 });
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({ name: pl.name, status: 'error', success: false });
    }
    
    // Wait between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '═'.repeat(60));
  console.log('   RESULTS SUMMARY');
  console.log('═'.repeat(60));
  
  for (const r of results) {
    const icon = r.success ? '✅' : '❌';
    console.log(`   ${icon} ${r.name}: ${r.status}`);
  }

  console.log('\n📋 Categories include custom fields:');
  console.log('   • subcategory - maps to department');
  console.log('   • styles_apply - valid styles for category\n');
}

main().catch(console.error);
