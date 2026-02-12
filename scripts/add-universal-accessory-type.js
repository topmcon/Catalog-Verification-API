#!/usr/bin/env node

/**
 * ADD UNIVERSAL ACCESSORY TYPE
 * =============================
 * Adds "Accessory" type to ALL categories in category-type-mapping.json
 * Also adds "Trim Kit" to Microwave category
 * 
 * Purpose: Allow any product to be classified as an accessory/part
 * regardless of its category (trim kits, parts, installation hardware)
 */

const fs = require('fs');
const path = require('path');

const MAPPING_FILE = path.join(__dirname, '../src/config/salesforce-picklists/category-type-mapping.json');

// Read current mapping
const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));

console.log('📋 Current state:');
console.log(`   Total categories: ${mapping.mappings.length}`);

// Accessory type definition (universal across all categories)
const ACCESSORY_TYPE = {
  type_name: 'Accessory',
  type_id: 'a1jaZ000001lF3DQAU', // Existing Salesforce ID
  status: 'existing',
  primary_filter: false // Not primary - only use for actual accessories
};

// Trim Kit type definition (specific to Microwave category)
const TRIM_KIT_TYPE = {
  type_name: 'Trim Kit',
  type_id: 'a1jaZ000001lFCKQA2', // Existing Salesforce ID
  status: 'existing',
  primary_filter: false
};

let categoriesUpdated = 0;
let categoriesSkipped = 0;
let microwaveUpdated = false;

// Process each category
for (const categoryMapping of mapping.mappings) {
  const categoryName = categoryMapping.category_name;
  
  // Check if Accessory already exists
  const hasAccessory = categoryMapping.types.some(t => t.type_name === 'Accessory');
  
  if (!hasAccessory) {
    // Add Accessory to the end of types list
    categoryMapping.types.push({ ...ACCESSORY_TYPE });
    categoriesUpdated++;
    console.log(`   ✅ Added Accessory to: ${categoryName}`);
  } else {
    categoriesSkipped++;
    console.log(`   ⏭️  Skipped (already has Accessory): ${categoryName}`);
  }
  
  // Special case: Add Trim Kit to Microwave category
  if (categoryName === 'Microwave') {
    const hasTrimKit = categoryMapping.types.some(t => t.type_name === 'Trim Kit');
    if (!hasTrimKit) {
      categoryMapping.types.push({ ...TRIM_KIT_TYPE });
      microwaveUpdated = true;
      console.log(`   ✅ Added Trim Kit to: Microwave`);
    } else {
      console.log(`   ⏭️  Skipped (already has Trim Kit): Microwave`);
    }
  }
}

// Update metadata
mapping.metadata.updated = new Date().toISOString().split('T')[0];

// Write updated mapping back to file
fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2), 'utf8');

console.log('\n✅ Update complete!');
console.log(`   Categories with Accessory added: ${categoriesUpdated}`);
console.log(`   Categories skipped (already had it): ${categoriesSkipped}`);
console.log(`   Microwave Trim Kit added: ${microwaveUpdated ? 'Yes' : 'Already exists'}`);
console.log(`\n📄 Updated file: ${MAPPING_FILE}`);
