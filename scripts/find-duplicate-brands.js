const fs = require('fs');
const path = require('path');

// Read our current brands.json
const brandsPath = path.join(__dirname, '../src/config/salesforce-picklists/brands.json');
const brands = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));

// Normalize brand names for comparison (remove special chars, spaces, etc.)
function normalize(name) {
  return name.toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Remove all non-alphanumeric
    .trim();
}

// Create a map of normalized names to original entries
const brandMap = new Map();
const duplicates = [];

brands.forEach(brand => {
  const normalized = normalize(brand.brand_name);
  
  if (brandMap.has(normalized)) {
    // Found a duplicate!
    const existing = brandMap.get(normalized);
    duplicates.push({
      normalized,
      entries: [existing, brand]
    });
  } else {
    brandMap.set(normalized, brand);
  }
});

console.log('=== DUPLICATE BRANDS FOUND ===\n');

if (duplicates.length === 0) {
  console.log('No duplicates found based on normalized names.');
} else {
  duplicates.forEach((dup, index) => {
    console.log(`${index + 1}. Normalized: "${dup.normalized}"`);
    dup.entries.forEach(entry => {
      console.log(`   - "${entry.brand_name}" (${entry.brand_id})`);
    });
    console.log('');
  });
}

// Also find similar brands (Levenshtein distance or partial matches)
console.log('\n=== POTENTIALLY SIMILAR BRANDS ===\n');

const allBrands = Array.from(brandMap.values());
const similar = [];

for (let i = 0; i < allBrands.length; i++) {
  for (let j = i + 1; j < allBrands.length; j++) {
    const name1 = allBrands[i].brand_name;
    const name2 = allBrands[j].brand_name;
    
    // Check if one contains the other (ignoring case)
    const lower1 = name1.toLowerCase();
    const lower2 = name2.toLowerCase();
    
    if ((lower1.includes(lower2) || lower2.includes(lower1)) && 
        Math.abs(name1.length - name2.length) < 15) {
      similar.push({
        brand1: allBrands[i],
        brand2: allBrands[j]
      });
    }
  }
}

if (similar.length === 0) {
  console.log('No similar brands found.');
} else {
  similar.forEach((sim, index) => {
    console.log(`${index + 1}. Similar brands:`);
    console.log(`   - "${sim.brand1.brand_name}" (${sim.brand1.brand_id})`);
    console.log(`   - "${sim.brand2.brand_name}" (${sim.brand2.brand_id})`);
    console.log('');
  });
}

console.log(`\nTotal brands in file: ${brands.length}`);
console.log(`Unique normalized brands: ${brandMap.size}`);
console.log(`Duplicates found: ${duplicates.length}`);
console.log(`Similar brands found: ${similar.length}`);
