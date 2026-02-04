/**
 * Verify Category Mappings for FALSE MATCHES
 * 
 * For each FALSE MATCH attribute, check:
 * 1. Where does SF say it belongs? (category + rank)
 * 2. Where do WE say it belongs? (category + rank)
 * 3. Are they the same or different?
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PICKLIST_DIR = path.join(ROOT_DIR, 'src/config/salesforce-picklists');
const SF_DATA_FILE = path.join(ROOT_DIR, 'category_attribute_verify.file');
const AUDIT_DIR = path.join(ROOT_DIR, 'audit-results');

// Parse SF data
function parseSFData() {
  const fileContent = fs.readFileSync(SF_DATA_FILE, 'utf-8');
  const jsonStart = fileContent.indexOf('{');
  const jsonContent = fileContent.substring(jsonStart);
  return JSON.parse(jsonContent);
}

// Build SF category mapping by attribute ID
function buildSFAttributeMap(sfData) {
  const sfMap = new Map();
  
  for (const [categoryName, categoryData] of Object.entries(sfData.categories)) {
    if (categoryData.attributes) {
      categoryData.attributes.forEach(attr => {
        if (attr.sf_id) {
          sfMap.set(attr.sf_id, {
            category_id: categoryData.category_id,
            category_name: categoryName,
            attribute_id: attr.sf_id,
            attribute_name: attr.name,
            rank: attr.rank,
            type: attr.type
          });
        }
      });
    }
  }
  
  return sfMap;
}

// Build our category mapping by attribute ID
function buildLocalAttributeMap() {
  const filterData = JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'category-filter-attributes.json'), 'utf-8'));
  const localMap = new Map();
  
  Object.values(filterData).forEach(mapping => {
    if (mapping.attribute_id) {
      localMap.set(mapping.attribute_id, {
        category_id: mapping.category_id,
        category_name: mapping.category_name,
        attribute_id: mapping.attribute_id,
        attribute_name: mapping.attribute_name,
        rank: mapping.rank
      });
    }
  });
  
  return localMap;
}

// Verify mappings for FALSE MATCHES
function verifyFalseMatchMappings() {
  const analysisPath = path.join(AUDIT_DIR, 'attribute-mismatch-analysis.json');
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
  
  const sfData = parseSFData();
  const sfMap = buildSFAttributeMap(sfData);
  const localMap = buildLocalAttributeMap();
  
  const results = {
    correctMappings: [],
    wrongCategory: [],
    wrongRank: [],
    notInSF: [],
    notInLocal: []
  };
  
  analysis.falseMatches.forEach(match => {
    const sfMapping = sfMap.get(match.id);
    const localMapping = localMap.get(match.id);
    
    const result = {
      attribute_id: match.id,
      sf_name: match.sf_name,
      local_name: match.local_name
    };
    
    // Check if attribute exists in both systems
    if (!sfMapping) {
      results.notInSF.push({
        ...result,
        note: 'SF does not have this attribute ID in any category'
      });
      return;
    }
    
    if (!localMapping) {
      results.notInLocal.push({
        ...result,
        sf_category: sfMapping.category_name,
        sf_rank: sfMapping.rank,
        note: 'Not in our category-filter-attributes.json'
      });
      return;
    }
    
    // Compare mappings
    const categoryMatch = sfMapping.category_name === localMapping.category_name;
    const rankMatch = String(sfMapping.rank) === String(localMapping.rank);
    
    result.sf_category = sfMapping.category_name;
    result.local_category = localMapping.category_name;
    result.sf_rank = sfMapping.rank;
    result.local_rank = localMapping.rank;
    
    if (categoryMatch && rankMatch) {
      results.correctMappings.push({
        ...result,
        action: 'Update attribute_name only'
      });
    } else if (!categoryMatch && rankMatch) {
      results.wrongCategory.push({
        ...result,
        action: 'Update category_name AND attribute_name'
      });
    } else if (categoryMatch && !rankMatch) {
      results.wrongRank.push({
        ...result,
        action: 'Update rank AND attribute_name'
      });
    } else {
      results.wrongCategory.push({
        ...result,
        action: 'Update category_name, rank, AND attribute_name'
      });
    }
  });
  
  return results;
}

// Display results
function displayResults(results) {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║      🔍 CATEGORY MAPPING VERIFICATION - FALSE MATCHES             ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  const total = results.correctMappings.length + results.wrongCategory.length + 
                results.wrongRank.length + results.notInSF.length + results.notInLocal.length;
  
  console.log(`📊 SUMMARY:\n`);
  console.log(`   Total FALSE MATCHES: ${total}`);
  console.log(`   ✅ Correct Category & Rank: ${results.correctMappings.length} (just update name)`);
  console.log(`   ❌ Wrong Category: ${results.wrongCategory.length} (update category + name)`);
  console.log(`   ⚠️  Wrong Rank: ${results.wrongRank.length} (update rank + name)`);
  console.log(`   🔍 Not in SF Top 15: ${results.notInSF.length}`);
  console.log(`   🔍 Not in Our Mappings: ${results.notInLocal.length}\n`);
  
  // CORRECT MAPPINGS
  if (results.correctMappings.length > 0) {
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ CORRECT MAPPINGS - Category & Rank Match                      ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('These are in the correct category with correct rank.\n');
    console.log('ACTION: Update attribute_name only\n');
    
    results.correctMappings.slice(0, 10).forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.attribute_id}`);
      console.log(`   Category: ${item.sf_category} (Rank ${item.sf_rank})`);
      console.log(`   SF Name:    "${item.sf_name}"`);
      console.log(`   Our Name:   "${item.local_name}"`);
      console.log(`   ✅ Keep category, update name\n`);
    });
    
    if (results.correctMappings.length > 10) {
      console.log(`   ... and ${results.correctMappings.length - 10} more\n`);
    }
  }
  
  // WRONG CATEGORY
  if (results.wrongCategory.length > 0) {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  ❌ WRONG CATEGORY - Category Mismatch                            ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('⚠️  CRITICAL: These are mapped to the WRONG category!\n');
    console.log('ACTION: Update category_name, rank, AND attribute_name\n');
    
    results.wrongCategory.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.attribute_id}`);
      console.log(`   SF:   "${item.sf_name}" in ${item.sf_category} (Rank ${item.sf_rank})`);
      console.log(`   Ours: "${item.local_name}" in ${item.local_category} (Rank ${item.local_rank})`);
      console.log(`   ❌ Wrong category mapping!\n`);
    });
  }
  
  // WRONG RANK
  if (results.wrongRank.length > 0) {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  ⚠️  WRONG RANK - Rank Mismatch                                   ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('Category is correct, but rank is wrong.\n');
    console.log('ACTION: Update rank AND attribute_name\n');
    
    results.wrongRank.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.attribute_id}`);
      console.log(`   Category: ${item.sf_category}`);
      console.log(`   SF Rank:    ${item.sf_rank}`);
      console.log(`   Our Rank:   ${item.local_rank}`);
      console.log(`   SF Name:    "${item.sf_name}"`);
      console.log(`   Our Name:   "${item.local_name}"`);
      console.log(`   ⚠️  Update rank\n`);
    });
  }
  
  // NOT IN SF
  if (results.notInSF.length > 0) {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  🔍 NOT IN SF - No Longer in SF Top 15                           ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('SF does not include these in any category Top 15.\n');
    console.log('ACTION: Remove from category-filter-attributes.json\n');
    
    results.notInSF.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.attribute_id}`);
      console.log(`   Our Name: "${item.local_name}"`);
      console.log(`   Note: ${item.note}\n`);
    });
  }
  
  // NOT IN LOCAL
  if (results.notInLocal.length > 0) {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  🔍 NOT IN OUR MAPPINGS - Missing from Our File                  ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('SF has these but we don\'t have them mapped.\n');
    console.log('ACTION: Add to category-filter-attributes.json\n');
    
    results.notInLocal.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.attribute_id}`);
      console.log(`   SF Name: "${item.sf_name}"`);
      console.log(`   SF Category: ${item.sf_category} (Rank ${item.sf_rank})`);
      console.log(`   Note: ${item.note}\n`);
    });
  }
  
  // RECOMMENDATIONS
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                    🎯 RECOMMENDATIONS                              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('STEP 1: Use SF Data as Source of Truth\n');
  console.log(`   → Update category-filter-attributes.json to match SF's mappings`);
  console.log(`   → Fix ${results.correctMappings.length} attribute names`);
  console.log(`   → Fix ${results.wrongCategory.length} category placements`);
  console.log(`   → Fix ${results.wrongRank.length} rank assignments\n`);
  
  if (results.notInLocal.length > 0) {
    console.log('STEP 2: Add Missing SF Attributes\n');
    console.log(`   → Add ${results.notInLocal.length} attributes from SF\n`);
  }
  
  if (results.notInSF.length > 0) {
    console.log('STEP 3: Handle Deprecated Attributes\n');
    console.log(`   → Remove ${results.notInSF.length} attributes no longer in SF Top 15\n`);
  }
  
  console.log('STEP 4: Create New Attributes\n');
  console.log(`   → Add ${total} new attributes (our old names) to attributes.json`);
  console.log(`   → Wait for SF to assign IDs and tell us category placement\n`);
}

// Save report
function saveReport(results) {
  const reportPath = path.join(AUDIT_DIR, 'category-mapping-verification.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`💾 Detailed report saved to: ${reportPath}\n`);
}

// Main execution
function main() {
  const results = verifyFalseMatchMappings();
  displayResults(results);
  saveReport(results);
}

main();
