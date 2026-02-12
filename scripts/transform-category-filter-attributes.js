#!/usr/bin/env node

/**
 * Transform category-filter-attributes.json from flat Salesforce format to grouped format
 * 
 * FROM (Salesforce format):
 * {
 *   "0": { "rank": 1, "category_name": "Range Hood", "attribute_name": "Installation Type" },
 *   "1": { "rank": 2, "category_name": "Range Hood", "attribute_name": "Voltage" }
 * }
 * 
 * TO (Code expects):
 * {
 *   "version": "1.0",
 *   "date": "2026-02-12",
 *   "total_categories": 179,
 *   "categories": {
 *     "Range Hood": {
 *       "category_id": "a01Hu000010Q5EoIAK",
 *       "attributes": [
 *         { "rank": 1, "name": "Installation Type", "sf_id": "a1aaZ000009X5F8QAK", "type": "picklist" },
 *         { "rank": 2, "name": "Voltage", "sf_id": "a1aaZ000009X681QAC", "type": "picklist" }
 *       ]
 *     }
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../src/config/salesforce-picklists/category-filter-attributes.json');
const OUTPUT_FILE = path.join(__dirname, '../src/config/salesforce-picklists/category-filter-attributes-transformed.json');

console.log('🔄 Transforming category-filter-attributes.json...\n');

// Read the flat format file
const flatData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

// Group by category
const categoriesMap = new Map();

// Convert object to array if needed
const attributesList = Array.isArray(flatData) ? flatData : Object.values(flatData);

console.log(`📄 Processing ${attributesList.length} attribute entries...`);

for (const item of attributesList) {
  const categoryName = item.category_name;
  const categoryId = item.category_id;
  
  if (!categoryName) {
    console.warn('⚠️  Skipping item without category_name:', item);
    continue;
  }
  
  if (!categoriesMap.has(categoryName)) {
    categoriesMap.set(categoryName, {
      category_id: categoryId,
      attributes: []
    });
  }
  
  // Add attribute to this category
  categoriesMap.get(categoryName).attributes.push({
    rank: item.rank || 0,
    name: item.attribute_name || item.name || '',
    sf_id: item.attribute_id || null,
    type: 'picklist' // Default to picklist, can enhance later
  });
}

// Sort attributes within each category by rank
for (const [categoryName, categoryData] of categoriesMap.entries()) {
  categoryData.attributes.sort((a, b) => a.rank - b.rank);
}

// Convert Map to object
const categoriesObject = {};
for (const [categoryName, categoryData] of categoriesMap.entries()) {
  categoriesObject[categoryName] = categoryData;
}

// Build final structure
const transformed = {
  version: "1.0",
  date: new Date().toISOString().split('T')[0],
  total_categories: categoriesMap.size,
  categories: categoriesObject
};

// Write transformed file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(transformed, null, 2), 'utf8');

console.log(`\n✅ Transformation complete!`);
console.log(`   Total categories: ${categoriesMap.size}`);
console.log(`   Output: ${OUTPUT_FILE}`);
console.log(`\n📊 Sample categories:`);

// Show first 5 categories as sample
const sampleCats = Array.from(categoriesMap.keys()).slice(0, 5);
for (const catName of sampleCats) {
  const catData = categoriesMap.get(catName);
  console.log(`   - ${catName}: ${catData.attributes.length} attributes`);
}

console.log(`\n🔧 Next steps:`);
console.log(`   1. Review the transformed file: ${path.basename(OUTPUT_FILE)}`);
console.log(`   2. If correct, replace the original file:`);
console.log(`      mv "${OUTPUT_FILE}" "${INPUT_FILE}"`);
console.log(`   3. Rebuild and deploy to production`);
