#!/usr/bin/env node
/**
 * Send All Picklists to Salesforce
 * 
 * Pushes our complete picklist data to Salesforce so they can compare
 * their lists with ours and see the differences.
 * 
 * Includes:
 * - categories.json (with subcategory + styles_apply custom fields)
 * - brands.json
 * - attributes.json  
 * - styles.json
 * - types.json
 * 
 * Usage: node scripts/send-all-picklists-to-salesforce.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const SALESFORCE_URL = 'https://data-nosoftware-2565.my.salesforce-sites.com/services/apexrest/category_attributes_verify';
const API_KEY = '873648276-550e8400';

const PICKLIST_DIR = path.join(__dirname, '../src/config/salesforce-picklists');

// Load all picklists
function loadPicklist(filename) {
  const filepath = path.join(PICKLIST_DIR, filename);
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Failed to load ${filename}:`, e.message);
    return [];
  }
}

console.log('\n' + '═'.repeat(60));
console.log('   📤 SENDING ALL PICKLISTS TO SALESFORCE');
console.log('═'.repeat(60) + '\n');

// Load all picklists
const categories = loadPicklist('categories.json');
const brands = loadPicklist('brands.json');
const attributes = loadPicklist('attributes.json');
const styles = loadPicklist('styles.json');
const types = loadPicklist('types.json');

console.log('📊 Picklist Summary:');
console.log(`   Categories: ${categories.length}`);
console.log(`     • With subcategory: ${categories.filter(c => c.subcategory).length}`);
console.log(`     • With styles_apply: ${categories.filter(c => c.styles_apply).length}`);
console.log(`   Brands: ${brands.length}`);
console.log(`   Attributes: ${attributes.length}`);
console.log(`   Styles: ${styles.length}`);
console.log(`   Types: ${types.length}`);

// Prepare comprehensive payload
const payload = {
  type: 'full_picklist_sync',
  source: 'catalog-verification-api',
  timestamp: new Date().toISOString(),
  reason: 'Comparison sync - our custom taxonomy includes subcategory and styles_apply fields',
  
  summary: {
    categories_count: categories.length,
    brands_count: brands.length,
    attributes_count: attributes.length,
    styles_count: styles.length,
    types_count: types.length,
    categories_with_subcategory: categories.filter(c => c.subcategory).length,
    categories_with_styles_apply: categories.filter(c => c.styles_apply).length
  },
  
  notes: [
    'Our categories include custom fields: subcategory and styles_apply',
    'Parent group categories removed: Kitchen Appliances, Laundry Appliances, Cabinet Hardware, Outdoor Lighting, Outdoor Heating, Furniture',
    'These parent groups should NOT be product categories',
    'subcategory maps each category to its department for filtering',
    'styles_apply lists which styles are valid for each category'
  ],
  
  categories: categories,
  brands: brands,
  attributes: attributes,
  styles: styles,
  types: types
};

const payloadString = JSON.stringify(payload, null, 0);
const payloadSizeKB = (Buffer.byteLength(payloadString) / 1024).toFixed(2);

console.log(`\n📦 Payload Size: ${payloadSizeKB} KB`);
console.log(`🌐 Endpoint: ${SALESFORCE_URL}\n`);

// Make request
function sendToSalesforce() {
  return new Promise((resolve, reject) => {
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

    console.log('⏳ Sending to Salesforce...');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`\n📡 Response Status: ${res.statusCode} ${res.statusMessage}\n`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ SUCCESS! All picklists sent to Salesforce\n');
          
          try {
            const response = JSON.parse(data);
            console.log('📋 Response:');
            console.log(JSON.stringify(response, null, 2));
          } catch (e) {
            console.log('📋 Response (raw):');
            console.log(data.substring(0, 500));
          }
          
          resolve(true);
        } else {
          console.log('❌ ERROR! Failed to send picklists\n');
          console.log('Error Response:');
          console.log(data.substring(0, 1000));
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.write(payloadString);
    req.end();
  });
}

// Also save a local copy for reference
function saveLocalReport() {
  const reportPath = path.join(__dirname, '../audit-results/picklist-comparison-sent-to-sf.json');
  
  const report = {
    sent_at: new Date().toISOString(),
    endpoint: SALESFORCE_URL,
    
    summary: payload.summary,
    notes: payload.notes,
    
    // Key differences we want SF to see
    key_points: {
      categories: {
        count: categories.length,
        parent_groups_removed: [
          'Kitchen Appliances',
          'Laundry Appliances', 
          'Cabinet Hardware',
          'Outdoor Lighting',
          'Outdoor Heating',
          'Furniture'
        ],
        custom_fields: {
          subcategory: 'Maps category to department (e.g., "Washer" → "Laundry")',
          styles_apply: 'Lists valid styles for each category'
        },
        sample_with_custom_fields: categories.filter(c => c.subcategory && c.styles_apply).slice(0, 5)
      },
      
      brands: {
        count: brands.length,
        sample: brands.slice(0, 10).map(b => b.brand_name)
      },
      
      attributes: {
        count: attributes.length,
        sample: attributes.slice(0, 20).map(a => a.attribute_name)
      },
      
      styles: {
        count: styles.length,
        all_styles: styles.map(s => s.style_name || s.name)
      },
      
      types: {
        count: types.length,
        sample: types.slice(0, 20).map(t => t.type_name || t.name)
      }
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Local report saved: ${reportPath}`);
}

// Run
async function main() {
  try {
    await sendToSalesforce();
    saveLocalReport();
    
    console.log('\n' + '═'.repeat(60));
    console.log('   PICKLIST SYNC COMPLETE');
    console.log('═'.repeat(60));
    console.log('\n📋 What was sent:');
    console.log(`   • ${categories.length} categories (with subcategory + styles_apply)`);
    console.log(`   • ${brands.length} brands`);
    console.log(`   • ${attributes.length} attributes`);
    console.log(`   • ${styles.length} styles`);
    console.log(`   • ${types.length} types`);
    console.log('\n🔔 Salesforce should now see our complete taxonomy.\n');
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

main();
