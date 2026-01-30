/**
 * Send Cleaned Styles to Salesforce
 * Pushes the updated styles.json (252 styles) to Salesforce via their API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const SALESFORCE_URL = 'https://data-nosoftware-2565.my.salesforce-sites.com/services/apexrest/category_attributes_verify';
const API_KEY = '873648276-550e8400'; // From Postman collection

// Load styles
const stylesPath = path.join(__dirname, '../src/config/salesforce-picklists/styles.json');
const stylesData = JSON.parse(fs.readFileSync(stylesPath, 'utf-8'));

console.log('\n🚀 Sending Cleaned Styles to Salesforce...\n');
console.log(`📁 Source: ${stylesPath}`);
console.log(`📊 Total Styles: ${stylesData.length}`);
console.log(`🌐 Endpoint: ${SALESFORCE_URL}\n`);

// Prepare payload
const payload = {
  type: 'styles',
  total_count: stylesData.length,
  styles: stylesData
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
      console.log('✅ SUCCESS! Cleaned styles sent to Salesforce\n');
      
      try {
        const response = JSON.parse(data);
        console.log('📋 Response Data:');
        console.log(JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('📋 Response (raw):');
        console.log(data);
      }
      
      console.log('\n📊 Summary:');
      console.log(`   ✅ Sent ${stylesData.length} cleaned styles to Salesforce`);
      console.log(`   ❌ Removed 28 attribute-styles (Gas, Single Handle, etc.)`);
      console.log(`   ✅ Salesforce now has updated styles list`);
    } else {
      console.log('❌ ERROR! Failed to send styles\n');
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
