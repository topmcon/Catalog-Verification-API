/**
 * Compare Salesforce Picklists with Our Local Data
 * 
 * Strategy:
 * 1. Parse SF data from uploaded file (category_attribute_verify.file)
 * 2. Load our local picklists
 * 3. Compare and identify:
 *    - Categories in SF but not in our list
 *    - Categories in our list but not in SF
 *    - Attributes in SF but not in our list
 *    - Attributes in our list but not in SF
 * 4. Generate merged picklists (add SF data we're missing)
 * 5. Show what we would send back to SF (complete merged list)
 * 
 * NO DATA LOSS - preserve everything from both sides
 */

const fs = require('fs');
const path = require('path');

// File paths
const SF_DATA_FILE = path.join(__dirname, '../category_attribute_verify.file');
const LOCAL_PICKLISTS_DIR = path.join(__dirname, '../src/config/salesforce-picklists');

const LOCAL_FILES = {
  categories: path.join(LOCAL_PICKLISTS_DIR, 'categories.json'),
  attributes: path.join(LOCAL_PICKLISTS_DIR, 'attributes.json'),
  brands: path.join(LOCAL_PICKLISTS_DIR, 'brands.json'),
  categoryFilters: path.join(LOCAL_PICKLISTS_DIR, 'category-filter-attributes.json')
};

// Parse SF data file
function parseSFData() {
  console.log('\n📥 Reading Salesforce data file...\n');
  
  const fileContent = fs.readFileSync(SF_DATA_FILE, 'utf-8');
  
  // Find the JSON payload (skip HTTP headers)
  const jsonStart = fileContent.indexOf('{');
  const jsonContent = fileContent.substring(jsonStart);
  
  const sfData = JSON.parse(jsonContent);
  
  console.log(`   Version: ${sfData.version}`);
  console.log(`   Date: ${sfData.date}`);
  console.log(`   Total Categories: ${sfData.total_categories}`);
  
  return sfData;
}

// Load local picklists
function loadLocalPicklists() {
  console.log('\n📂 Loading local picklists...\n');
  
  const local = {
    categories: JSON.parse(fs.readFileSync(LOCAL_FILES.categories, 'utf-8')),
    attributes: JSON.parse(fs.readFileSync(LOCAL_FILES.attributes, 'utf-8')),
    brands: JSON.parse(fs.readFileSync(LOCAL_FILES.brands, 'utf-8')),
    categoryFilters: JSON.parse(fs.readFileSync(LOCAL_FILES.categoryFilters, 'utf-8'))
  };
  
  console.log(`   Categories: ${local.categories.length}`);
  console.log(`   Attributes: ${local.attributes.length}`);
  console.log(`   Brands: ${local.brands.length}`);
  console.log(`   Category Filters: ${local.categoryFilters.length}`);
  
  return local;
}

// Extract unique data from SF
function extractSFPicklists(sfData) {
  const sfCategories = new Map();
  const sfAttributes = new Map();
  
  // Parse SF categories structure
  for (const [categoryName, categoryData] of Object.entries(sfData.categories)) {
    // Add category
    sfCategories.set(categoryData.category_id, {
      category_id: categoryData.category_id,
      category_name: categoryName,
      department: categoryData.department
    });
    
    // Add attributes from this category
    if (categoryData.attributes) {
      categoryData.attributes.forEach(attr => {
        if (attr.sf_id && !sfAttributes.has(attr.sf_id)) {
          sfAttributes.set(attr.sf_id, {
            attribute_id: attr.sf_id,
            attribute_name: attr.name,
            type: attr.type
          });
        }
      });
    }
  }
  
  return {
    categories: Array.from(sfCategories.values()),
    attributes: Array.from(sfAttributes.values())
  };
}

// Compare categories
function compareCategories(sfCategories, localCategories) {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                    📊 CATEGORY COMPARISON                          ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  const sfById = new Map(sfCategories.map(c => [c.category_id, c]));
  const sfByName = new Map(sfCategories.map(c => [c.category_name.toLowerCase(), c]));
  const localById = new Map(localCategories.map(c => [c.category_id, c]));
  const localByName = new Map(localCategories.map(c => [c.category_name.toLowerCase(), c]));
  
  const comparison = {
    inBoth: [],
    onlyInSF: [],
    onlyInLocal: [],
    nameMismatch: []
  };
  
  // Check SF categories
  sfCategories.forEach(sfCat => {
    const localById = localCategories.find(l => l.category_id === sfCat.category_id);
    const localByName = localCategories.find(l => l.category_name.toLowerCase() === sfCat.category_name.toLowerCase());
    
    if (localById) {
      if (localById.category_name === sfCat.category_name) {
        comparison.inBoth.push({ sf: sfCat, local: localById });
      } else {
        comparison.nameMismatch.push({ sf: sfCat, local: localById });
      }
    } else if (localByName) {
      comparison.nameMismatch.push({ sf: sfCat, local: localByName });
    } else {
      comparison.onlyInSF.push(sfCat);
    }
  });
  
  // Check local categories not in SF
  localCategories.forEach(localCat => {
    const sfById = sfCategories.find(s => s.category_id === localCat.category_id);
    const sfByName = sfCategories.find(s => s.category_name.toLowerCase() === localCat.category_name.toLowerCase());
    
    if (!sfById && !sfByName) {
      comparison.onlyInLocal.push(localCat);
    }
  });
  
  // Display results
  console.log(`✅ In Both (Synced):        ${comparison.inBoth.length}`);
  console.log(`📥 Only in SF (We need):    ${comparison.onlyInSF.length}`);
  console.log(`📤 Only in Local (SF needs): ${comparison.onlyInLocal.length}`);
  console.log(`⚠️  Name Mismatches:        ${comparison.nameMismatch.length}`);
  
  if (comparison.onlyInSF.length > 0) {
    console.log('\n📥 Categories in SF that we should ADD to our list:\n');
    comparison.onlyInSF.forEach((cat, idx) => {
      if (idx < 10) {
        console.log(`   ${idx + 1}. ${cat.category_name} (${cat.category_id})`);
      }
    });
    if (comparison.onlyInSF.length > 10) {
      console.log(`   ... and ${comparison.onlyInSF.length - 10} more`);
    }
  }
  
  if (comparison.onlyInLocal.length > 0) {
    console.log('\n📤 Categories we have that SF should ADD:\n');
    comparison.onlyInLocal.forEach((cat, idx) => {
      if (idx < 10) {
        console.log(`   ${idx + 1}. ${cat.category_name} (${cat.category_id})`);
      }
    });
    if (comparison.onlyInLocal.length > 10) {
      console.log(`   ... and ${comparison.onlyInLocal.length - 10} more`);
    }
  }
  
  if (comparison.nameMismatch.length > 0) {
    console.log('\n⚠️  Name Mismatches (same ID, different name):\n');
    comparison.nameMismatch.forEach((pair, idx) => {
      if (idx < 5) {
        console.log(`   ${idx + 1}. SF: "${pair.sf.category_name}" vs Local: "${pair.local.category_name}"`);
        console.log(`      ID: ${pair.sf.category_id}`);
      }
    });
    if (comparison.nameMismatch.length > 5) {
      console.log(`   ... and ${comparison.nameMismatch.length - 5} more`);
    }
  }
  
  return comparison;
}

// Compare attributes
function compareAttributes(sfAttributes, localAttributes) {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                    🏷️  ATTRIBUTE COMPARISON                        ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  const comparison = {
    inBoth: [],
    onlyInSF: [],
    onlyInLocal: [],
    nameMismatch: []
  };
  
  // Check SF attributes
  sfAttributes.forEach(sfAttr => {
    const localById = localAttributes.find(l => l.attribute_id === sfAttr.attribute_id);
    const localByName = localAttributes.find(l => l.attribute_name.toLowerCase() === sfAttr.attribute_name.toLowerCase());
    
    if (localById) {
      if (localById.attribute_name === sfAttr.attribute_name) {
        comparison.inBoth.push({ sf: sfAttr, local: localById });
      } else {
        comparison.nameMismatch.push({ sf: sfAttr, local: localById });
      }
    } else if (localByName) {
      comparison.nameMismatch.push({ sf: sfAttr, local: localByName });
    } else {
      comparison.onlyInSF.push(sfAttr);
    }
  });
  
  // Check local attributes not in SF
  localAttributes.forEach(localAttr => {
    const sfById = sfAttributes.find(s => s.attribute_id === localAttr.attribute_id);
    const sfByName = sfAttributes.find(s => s.attribute_name.toLowerCase() === localAttr.attribute_name.toLowerCase());
    
    if (!sfById && !sfByName) {
      comparison.onlyInLocal.push(localAttr);
    }
  });
  
  // Display results
  console.log(`✅ In Both (Synced):        ${comparison.inBoth.length}`);
  console.log(`📥 Only in SF (We need):    ${comparison.onlyInSF.length}`);
  console.log(`📤 Only in Local (SF needs): ${comparison.onlyInLocal.length}`);
  console.log(`⚠️  Name Mismatches:        ${comparison.nameMismatch.length}`);
  
  if (comparison.onlyInSF.length > 0) {
    console.log('\n📥 Attributes in SF that we should ADD to our list:\n');
    comparison.onlyInSF.forEach((attr, idx) => {
      if (idx < 10) {
        console.log(`   ${idx + 1}. ${attr.attribute_name} (${attr.attribute_id}) - ${attr.type}`);
      }
    });
    if (comparison.onlyInSF.length > 10) {
      console.log(`   ... and ${comparison.onlyInSF.length - 10} more`);
    }
  }
  
  if (comparison.onlyInLocal.length > 0) {
    console.log('\n📤 Attributes we have that SF should ADD:\n');
    comparison.onlyInLocal.forEach((attr, idx) => {
      if (idx < 10) {
        console.log(`   ${idx + 1}. ${attr.attribute_name} (${attr.attribute_id})`);
      }
    });
    if (comparison.onlyInLocal.length > 10) {
      console.log(`   ... and ${comparison.onlyInLocal.length - 10} more`);
    }
  }
  
  if (comparison.nameMismatch.length > 0) {
    console.log('\n⚠️  Name Mismatches (same ID, different name):\n');
    comparison.nameMismatch.forEach((pair, idx) => {
      if (idx < 5) {
        console.log(`   ${idx + 1}. SF: "${pair.sf.attribute_name}" vs Local: "${pair.local.attribute_name}"`);
        console.log(`      ID: ${pair.sf.attribute_id}`);
      }
    });
    if (comparison.nameMismatch.length > 5) {
      console.log(`   ... and ${comparison.nameMismatch.length - 5} more`);
    }
  }
  
  return comparison;
}

// Generate merged picklists
function generateMergedPicklists(sfPicklists, localPicklists, categoryComparison, attributeComparison) {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                    🔀 GENERATING MERGED PICKLISTS                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  // Merge categories (add SF categories we don't have)
  const mergedCategories = [...localPicklists.categories];
  categoryComparison.onlyInSF.forEach(sfCat => {
    mergedCategories.push(sfCat);
  });
  
  // Merge attributes (add SF attributes we don't have)
  const mergedAttributes = [...localPicklists.attributes];
  attributeComparison.onlyInSF.forEach(sfAttr => {
    mergedAttributes.push(sfAttr);
  });
  
  console.log(`✅ Merged Categories: ${mergedCategories.length} (added ${categoryComparison.onlyInSF.length} from SF)`);
  console.log(`✅ Merged Attributes: ${mergedAttributes.length} (added ${attributeComparison.onlyInSF.length} from SF)`);
  
  return {
    categories: mergedCategories,
    attributes: mergedAttributes,
    brands: localPicklists.brands // Brands not in SF file, keep ours
  };
}

// Save merged picklists
function saveMergedPicklists(mergedPicklists) {
  const outputDir = path.join(__dirname, '../audit-results');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const files = {
    categories: path.join(outputDir, 'merged-categories.json'),
    attributes: path.join(outputDir, 'merged-attributes.json'),
    brands: path.join(outputDir, 'merged-brands.json')
  };
  
  fs.writeFileSync(files.categories, JSON.stringify(mergedPicklists.categories, null, 2));
  fs.writeFileSync(files.attributes, JSON.stringify(mergedPicklists.attributes, null, 2));
  fs.writeFileSync(files.brands, JSON.stringify(mergedPicklists.brands, null, 2));
  
  console.log('\n💾 Saved merged picklists to audit-results/:\n');
  console.log(`   - merged-categories.json (${mergedPicklists.categories.length} items)`);
  console.log(`   - merged-attributes.json (${mergedPicklists.attributes.length} items)`);
  console.log(`   - merged-brands.json (${mergedPicklists.brands.length} items)`);
}

// Main execution
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║         🔍 SALESFORCE PICKLIST COMPARISON & SYNC ANALYSIS         ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  
  try {
    // Parse SF data
    const sfData = parseSFData();
    
    // Load local picklists
    const localPicklists = loadLocalPicklists();
    
    // Extract SF picklists
    console.log('\n🔍 Extracting SF categories and attributes...\n');
    const sfPicklists = extractSFPicklists(sfData);
    console.log(`   SF Categories: ${sfPicklists.categories.length}`);
    console.log(`   SF Attributes: ${sfPicklists.attributes.length}`);
    
    // Compare categories
    const categoryComparison = compareCategories(sfPicklists.categories, localPicklists.categories);
    
    // Compare attributes
    const attributeComparison = compareAttributes(sfPicklists.attributes, localPicklists.attributes);
    
    // Generate merged picklists
    const mergedPicklists = generateMergedPicklists(
      sfPicklists,
      localPicklists,
      categoryComparison,
      attributeComparison
    );
    
    // Save merged picklists
    saveMergedPicklists(mergedPicklists);
    
    // Summary and recommendations
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                    📋 SYNC RECOMMENDATIONS                         ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('STEP 1: Review merged picklists in audit-results/\n');
    
    if (categoryComparison.onlyInSF.length > 0 || attributeComparison.onlyInSF.length > 0) {
      console.log('STEP 2: Update our local picklists with merged data');
      console.log('   → This adds SF categories/attributes we were missing\n');
    }
    
    if (categoryComparison.onlyInLocal.length > 0 || attributeComparison.onlyInLocal.length > 0) {
      console.log('STEP 3: Send merged picklists to Salesforce');
      console.log('   → This gives SF the categories/attributes they are missing\n');
    }
    
    if (categoryComparison.nameMismatch.length > 0 || attributeComparison.nameMismatch.length > 0) {
      console.log('⚠️  STEP 4: Resolve name mismatches manually');
      console.log('   → Same IDs but different names need manual review\n');
    }
    
    console.log('✅ NO DATA LOSS - all items from both sides are preserved!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
