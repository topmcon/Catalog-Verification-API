/**
 * Send Category Filter Attributes to Salesforce
 * Pushes the updated category-filter-attributes.json data to Salesforce via their API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const SALESFORCE_URL = 'https://data-nosoftware-2565.my.salesforce-sites.com/services/apexrest/category_attributes_verify';
const API_KEY = '873648276-550e8400'; // From Postman collection

// Load category filter attributes
const categoryFilterPath = path.join(__dirname, '../src/config/salesforce-picklists/category-filter-attributes.json');
const categoryFilterData = JSON.parse(fs.readFileSync(categoryFilterPath, 'utf-8'));

console.log('\n🚀 Sending Category Filter Attributes to Salesforce...\n');
console.log(`📁 Source: ${categoryFilterPath}`);
console.log(`📊 Version: ${categoryFilterData.version}`);
console.log(`📅 Date: ${categoryFilterData.date}`);
console.log(`📦 Total Categories: ${categoryFilterData.total_categories}`);
console.log(`🌐 Endpoint: ${SALESFORCE_URL}\n`);

// Prepare payload
const payload = {
  version: categoryFilterData.version,
  date: categoryFilterData.date,
  total_categories: categoryFilterData.total_categories,
  categories: categoryFilterData.categories
};

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

// Make request
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`\n✅ Response Status: ${res.statusCode} ${res.statusMessage}\n`);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ SUCCESS! Category filter attributes sent to Salesforce\n');
      
      try {
        const response = JSON.parse(data);
        console.log('📋 Response Data:');
        console.log(JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('📋 Response (raw):');
        console.log(data);
      }
    } else {
      console.log('❌ ERROR! Failed to send category filter attributes\n');
      console.log('Error Response:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request Error:', error.message);
  process.exit(1);
});

// Send request
req.write(payloadString);
req.end();
