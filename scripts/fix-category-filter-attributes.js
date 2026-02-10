/**
 * FIX CATEGORY FILTER ATTRIBUTES JSON
 * ====================================
 * Transforms flat array structure to nested categories structure
 * 
 * FROM: { "0": { rank, category_name, attribute_name, attribute_id }, ... }
 * TO:   { version, categories: { "Range": { attributes: [...] }, ... } }
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/config/salesforce-picklists/category-filter-attributes.json');

console.log('Reading flat structure file...');
const rawData = fs.readFileSync(filePath, 'utf-8');
const flatData = JSON.parse(rawData);

// Convert flat array to nested categories structure
const categories = {};

for (const key in flatData) {
  const item = flatData[key];
  const categoryName = item.category_name;
  
  if (!categoryName) continue;
  
  // Initialize category if not exists
  if (!categories[categoryName]) {
    categories[categoryName] = {
      category_id: item.category_id || null,
      department: item.department || null,
      attributes: []
    };
  }
  
  // Add attribute to category
  categories[categoryName].attributes.push({
    rank: item.rank || 999,
    name: item.attribute_name,
    sf_id: item.attribute_id || null,
    type: item.type || 'string'
  });
}

// Sort attributes by rank within each category
for (const categoryName in categories) {
  categories[categoryName].attributes.sort((a, b) => a.rank - b.rank);
}

// Build final structure
const nestedData = {
  version: '5.0',
  date: new Date().toISOString().split('T')[0],
  total_categories: Object.keys(categories).length,
  categories: categories
};

// Backup original file
const backupPath = filePath.replace('.json', '.backup.' + Date.now() + '.json');
fs.writeFileSync(backupPath, rawData);
console.log(`✅ Backup saved: ${backupPath}`);

// Write transformed file
fs.writeFileSync(filePath, JSON.stringify(nestedData, null, 2));
console.log(`✅ Fixed structure written to ${filePath}`);
console.log(`📊 Total categories: ${nestedData.total_categories}`);

// Summary
const totalAttributes = Object.values(categories).reduce((sum, cat) => sum + cat.attributes.length, 0);
console.log(`📊 Total attributes: ${totalAttributes}`);
console.log('');
console.log('Sample category:', Object.keys(categories)[0]);
console.log(JSON.stringify(categories[Object.keys(categories)[0]], null, 2));
