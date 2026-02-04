/**
 * Show All Name Mismatches Between SF and Local Picklists
 * Shows complete list of categories and attributes with different names but same IDs
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PICKLIST_DIR = path.join(ROOT_DIR, 'src/config/salesforce-picklists');
const SF_DATA_FILE = path.join(ROOT_DIR, 'category_attribute_verify.file');

// Parse SF data
function parseSFData() {
  const fileContent = fs.readFileSync(SF_DATA_FILE, 'utf-8');
  const jsonStart = fileContent.indexOf('{');
  const jsonContent = fileContent.substring(jsonStart);
  return JSON.parse(jsonContent);
}

// Extract SF picklists
function extractSFPicklists(sfData) {
  const sfCategories = new Map();
  const sfAttributes = new Map();
  
  for (const [categoryName, categoryData] of Object.entries(sfData.categories)) {
    sfCategories.set(categoryData.category_id, {
      category_id: categoryData.category_id,
      category_name: categoryName,
      department: categoryData.department
    });
    
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

// Compare and find mismatches
function findMismatches() {
  const sfData = parseSFData();
  const sfPicklists = extractSFPicklists(sfData);
  
  const localCategories = JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'categories.json'), 'utf-8'));
  const localAttributes = JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'attributes.json'), 'utf-8'));
  
  const categoryMismatches = [];
  const attributeMismatches = [];
  
  // Find category mismatches
  sfPicklists.categories.forEach(sfCat => {
    const localCat = localCategories.find(l => l.category_id === sfCat.category_id);
    if (localCat && localCat.category_name !== sfCat.category_name) {
      categoryMismatches.push({
        id: sfCat.category_id,
        sf_name: sfCat.category_name,
        local_name: localCat.category_name,
        recommendation: sfCat.category_name.toLowerCase() === localCat.category_name.toLowerCase() 
          ? 'CAPITALIZATION ONLY' 
          : 'DIFFERENT NAMES'
      });
    }
  });
  
  // Find attribute mismatches
  sfPicklists.attributes.forEach(sfAttr => {
    const localAttr = localAttributes.find(l => l.attribute_id === sfAttr.attribute_id);
    if (localAttr && localAttr.attribute_name !== sfAttr.attribute_name) {
      attributeMismatches.push({
        id: sfAttr.attribute_id,
        sf_name: sfAttr.attribute_name,
        local_name: localAttr.attribute_name,
        type: sfAttr.type,
        recommendation: sfAttr.attribute_name.toLowerCase() === localAttr.attribute_name.toLowerCase() 
          ? 'CAPITALIZATION ONLY' 
          : 'DIFFERENT NAMES'
      });
    }
  });
  
  return { categoryMismatches, attributeMismatches };
}

// Main execution
function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║              📋 NAME MISMATCH RESOLUTION REPORT                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  const { categoryMismatches, attributeMismatches } = findMismatches();
  
  // Category Mismatches
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║         📊 CATEGORY NAME MISMATCHES (18 total)                    ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  categoryMismatches.forEach((mismatch, idx) => {
    console.log(`${idx + 1}. ID: ${mismatch.id}`);
    console.log(`   SF:    "${mismatch.sf_name}"`);
    console.log(`   Local: "${mismatch.local_name}"`);
    console.log(`   Type:  ${mismatch.recommendation}`);
    console.log(`   ✅ RECOMMENDATION: Use SF name "${mismatch.sf_name}"\n`);
  });
  
  // Attribute Mismatches
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║         🏷️  ATTRIBUTE NAME MISMATCHES (116 total)                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  // Group by type
  const capitalOnly = attributeMismatches.filter(m => m.recommendation === 'CAPITALIZATION ONLY');
  const different = attributeMismatches.filter(m => m.recommendation === 'DIFFERENT NAMES');
  
  console.log(`📝 Capitalization Only: ${capitalOnly.length}\n`);
  capitalOnly.slice(0, 20).forEach((mismatch, idx) => {
    console.log(`${idx + 1}. SF: "${mismatch.sf_name}" vs Local: "${mismatch.local_name}"`);
    console.log(`   ID: ${mismatch.id} | Type: ${mismatch.type}`);
    console.log(`   ✅ Fix: Use SF capitalization\n`);
  });
  
  if (capitalOnly.length > 20) {
    console.log(`   ... and ${capitalOnly.length - 20} more capitalization mismatches\n`);
  }
  
  console.log(`\n📝 Different Names: ${different.length}\n`);
  different.forEach((mismatch, idx) => {
    console.log(`${idx + 1}. SF: "${mismatch.sf_name}" vs Local: "${mismatch.local_name}"`);
    console.log(`   ID: ${mismatch.id} | Type: ${mismatch.type}`);
    console.log(`   ⚠️  Review: Determine which name is correct\n`);
  });
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                    📋 RESOLUTION SUMMARY                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('🎯 RECOMMENDATIONS:\n');
  console.log('1. CATEGORY MISMATCHES (18 total):');
  console.log('   → Use Salesforce names (they are the source of truth)');
  console.log('   → Most are substantive differences (e.g., "Wall Oven" vs "Oven")\n');
  
  console.log(`2. ATTRIBUTE MISMATCHES (${attributeMismatches.length} total):`);
  console.log(`   → ${capitalOnly.length} are capitalization only - use SF capitalization`);
  console.log(`   → ${different.length} are different names - review individually\n`);
  
  console.log('💡 SUGGESTED APPROACH:\n');
  console.log('   Option A: Update our names to match SF (recommended)');
  console.log('   → Salesforce is the source of truth');
  console.log('   → Ensures consistency across systems\n');
  
  console.log('   Option B: Keep our names, send to SF');
  console.log('   → SF will use their existing names');
  console.log('   → May cause confusion in matching\n');
  
  console.log('🔧 TO FIX: Create a script to update local names to match SF names\n');
}

main();
