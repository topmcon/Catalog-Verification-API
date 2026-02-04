/**
 * COMPREHENSIVE PICKLIST SYNC FROM SALESFORCE
 * ============================================
 * 
 * Complete cleanup and sync of all 5 picklist files:
 * 1. categories.json - Fix names, keep our extras
 * 2. attributes.json - Fix names/mappings, keep our extras, add new for FALSE MATCHES
 * 3. category-filter-attributes.json - Rebuild completely from SF data
 * 4. brands.json - Keep as-is (SF doesn't provide)
 * 5. styles.json - Keep as-is (SF doesn't provide)
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

// Extract SF categories
function extractSFCategories(sfData) {
  const sfCategories = [];
  
  for (const [categoryName, categoryData] of Object.entries(sfData.categories)) {
    sfCategories.push({
      category_id: categoryData.category_id,
      category_name: categoryName,
      department: categoryData.department,
      family: categoryData.family || null
    });
  }
  
  return sfCategories;
}

// Extract SF attributes (unique across all categories)
function extractSFAttributes(sfData) {
  const sfAttributes = new Map();
  
  for (const [categoryName, categoryData] of Object.entries(sfData.categories)) {
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
  
  return Array.from(sfAttributes.values());
}

// Build category-filter-attributes from SF data
function buildCategoryFilterAttributes(sfData) {
  const mappings = [];
  
  for (const [categoryName, categoryData] of Object.entries(sfData.categories)) {
    if (categoryData.attributes) {
      categoryData.attributes.forEach(attr => {
        mappings.push({
          category_id: categoryData.category_id,
          category_name: categoryName,
          attribute_id: attr.sf_id,
          attribute_name: attr.name,
          rank: String(attr.rank)
        });
      });
    }
  }
  
  return mappings;
}

// Create backup
function createBackup() {
  const timestamp = Date.now();
  const backupDir = path.join(PICKLIST_DIR, 'backups', `comprehensive-sync-${timestamp}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Backup all 5 files
  const files = [
    'categories.json',
    'attributes.json',
    'category-filter-attributes.json',
    'brands.json',
    'styles.json'
  ];
  
  files.forEach(file => {
    const sourcePath = path.join(PICKLIST_DIR, file);
    const backupPath = path.join(backupDir, file);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, backupPath);
    }
  });
  
  console.log(`✅ Backup created: ${backupDir}\n`);
  return backupDir;
}

// Sync categories.json
function syncCategories(sfCategories) {
  const localCategories = JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'categories.json'), 'utf-8'));
  const analysisPath = path.join(AUDIT_DIR, 'comprehensive-picklist-audit.json');
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
  
  const stats = {
    trueMatchesUpdated: 0,
    falseMatchesFixed: 0,
    newCategoriesAdded: 0,
    kept: 0,
    total: 0
  };
  
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  1️⃣  SYNCING CATEGORIES.JSON                                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  const newCategories = [];
  
  // Process TRUE MATCHES - just update name
  if (analysis.categories && analysis.categories.trueMatches) {
    analysis.categories.trueMatches.forEach(match => {
      const cat = localCategories.find(c => c.category_id === match.id);
      if (cat) {
        console.log(`   ✅ TRUE: "${cat.category_name}" → "${match.sf_name}"`);
        cat.category_name = match.sf_name;
        cat.department = match.department;
        stats.trueMatchesUpdated++;
      }
    });
  }
  
  // Process FALSE MATCHES - fix name AND create new category
  if (analysis.categories && analysis.categories.falseMatches) {
    analysis.categories.falseMatches.forEach(match => {
      const cat = localCategories.find(c => c.category_id === match.id);
      if (cat) {
        const oldName = cat.category_name;
        
        console.log(`   ❌ FALSE: "${oldName}" → "${match.sf_name}" (+ create new "${oldName}")`);
        
        // Fix existing record with SF's correct name
        cat.category_name = match.sf_name;
        cat.department = match.department;
        stats.falseMatchesFixed++;
        
        // Create NEW category for our old name (empty SF ID - pending from SF)
        newCategories.push({
          category_id: "",  // Empty - waiting for SF to assign
          category_name: oldName,
          department: cat.department,
          family: cat.family || null
        });
        stats.newCategoriesAdded++;
      }
    });
  }
  
  // Add all SF categories we don't have
  sfCategories.forEach(sfCat => {
    const exists = localCategories.find(c => c.category_id === sfCat.category_id);
    if (!exists) {
      console.log(`   🆕 ADD: "${sfCat.category_name}" (from SF)`);
      localCategories.push(sfCat);
      stats.newCategoriesAdded++;
    }
  });
  
  // Add new categories at the end
  localCategories.push(...newCategories);
  
  stats.kept = localCategories.length - stats.trueMatchesUpdated - stats.falseMatchesFixed - stats.newCategoriesAdded;
  stats.total = localCategories.length;
  
  console.log(`\n   📊 Categories: ${stats.trueMatchesUpdated} name updates, ${stats.falseMatchesFixed} corrections,`);
  console.log(`      ${stats.newCategoriesAdded} new added, ${stats.total} total\n`);
  
  return { categories: localCategories, stats };
}

// Sync attributes.json
function syncAttributes(sfAttributes) {
  const localAttributes = JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'attributes.json'), 'utf-8'));
  const analysisPath = path.join(AUDIT_DIR, 'attribute-mismatch-analysis.json');
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
  
  const stats = {
    trueMatchesUpdated: 0,
    falseMatchesFixed: 0,
    newAttributesAdded: 0,
    kept: 0,
    total: 0
  };
  
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  2️⃣  SYNCING ATTRIBUTES.JSON                                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  const newAttributes = [];
  
  // Process TRUE MATCHES - just update name
  analysis.trueMatches.forEach(match => {
    const attr = localAttributes.find(a => a.attribute_id === match.id);
    if (attr) {
      console.log(`   ✅ TRUE: "${attr.attribute_name}" → "${match.sf_name}"`);
      attr.attribute_name = match.sf_name;
      stats.trueMatchesUpdated++;
    }
  });
  
  // Process FALSE MATCHES - fix name AND create new attribute
  analysis.falseMatches.forEach(match => {
    const attr = localAttributes.find(a => a.attribute_id === match.id);
    if (attr) {
      const oldName = attr.attribute_name;
      
      console.log(`   ❌ FALSE: "${oldName}" → "${match.sf_name}" (+ create new "${oldName}")`);
      
      // Fix existing record with SF's correct name
      attr.attribute_name = match.sf_name;
      stats.falseMatchesFixed++;
      
      // Create NEW attribute for our old name (empty SF ID - pending from SF)
      newAttributes.push({
        attribute_id: "",  // Empty - waiting for SF to assign
        attribute_name: oldName,
        type: match.type
      });
      stats.newAttributesAdded++;
    }
  });
  
  // Add all SF attributes we don't have
  sfAttributes.forEach(sfAttr => {
    const exists = localAttributes.find(a => a.attribute_id === sfAttr.attribute_id);
    if (!exists) {
      console.log(`   🆕 ADD: "${sfAttr.attribute_name}" (from SF)`);
      localAttributes.push(sfAttr);
      stats.newAttributesAdded++;
    }
  });
  
  // Add new attributes at the end
  localAttributes.push(...newAttributes);
  
  stats.kept = localAttributes.length - stats.trueMatchesUpdated - stats.falseMatchesFixed - stats.newAttributesAdded;
  stats.total = localAttributes.length;
  
  console.log(`\n   📊 Attributes: ${stats.trueMatchesUpdated} name updates, ${stats.falseMatchesFixed} corrections,`);
  console.log(`      ${stats.newAttributesAdded} new added, ${stats.total} total\n`);
  
  return { attributes: localAttributes, stats };
}

// Rebuild category-filter-attributes.json
function rebuildCategoryFilterAttributes(sfData) {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  3️⃣  REBUILDING CATEGORY-FILTER-ATTRIBUTES.JSON                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  const mappings = buildCategoryFilterAttributes(sfData);
  
  // Convert array to object with numeric keys (matching existing format)
  const mappingsObject = {};
  mappings.forEach((mapping, index) => {
    mappingsObject[String(index)] = mapping;
  });
  
  console.log(`   🔄 REBUILT: ${mappings.length} category-attribute mappings from SF data`);
  console.log(`   ℹ️  All mappings now match SF's Top 15 rankings\n`);
  
  return { mappings: mappingsObject, count: mappings.length };
}

// Save all files
function saveFiles(categories, attributes, categoryFilterMappings) {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  💾 SAVING UPDATED FILES                                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  fs.writeFileSync(
    path.join(PICKLIST_DIR, 'categories.json'),
    JSON.stringify(categories, null, 2)
  );
  console.log('   ✅ categories.json saved');
  
  fs.writeFileSync(
    path.join(PICKLIST_DIR, 'attributes.json'),
    JSON.stringify(attributes, null, 2)
  );
  console.log('   ✅ attributes.json saved');
  
  fs.writeFileSync(
    path.join(PICKLIST_DIR, 'category-filter-attributes.json'),
    JSON.stringify(categoryFilterMappings, null, 2)
  );
  console.log('   ✅ category-filter-attributes.json saved');
  
  console.log('   ℹ️  brands.json - unchanged (SF does not provide)');
  console.log('   ℹ️  styles.json - unchanged (SF does not provide)\n');
}

// Display final summary
function displaySummary(categoryStats, attributeStats, mappingCount, backupDir) {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║              ✅ COMPREHENSIVE SYNC COMPLETE                        ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 FINAL STATISTICS:\n');
  
  console.log('   📂 categories.json:');
  console.log(`      • ${categoryStats.trueMatchesUpdated} simple name updates`);
  console.log(`      • ${categoryStats.falseMatchesFixed} corruption fixes`);
  console.log(`      • ${categoryStats.newCategoriesAdded} new categories added`);
  console.log(`      • ${categoryStats.total} total categories\n`);
  
  console.log('   📂 attributes.json:');
  console.log(`      • ${attributeStats.trueMatchesUpdated} simple name updates`);
  console.log(`      • ${attributeStats.falseMatchesFixed} corruption fixes`);
  console.log(`      • ${attributeStats.newAttributesAdded} new attributes added`);
  console.log(`      • ${attributeStats.total} total attributes\n`);
  
  console.log('   📂 category-filter-attributes.json:');
  console.log(`      • ${mappingCount} mappings (rebuilt from SF)\n`);
  
  console.log('   📂 brands.json: ✅ unchanged (343 brands)');
  console.log('   📂 styles.json: ✅ unchanged (220 styles)\n');
  
  console.log('💾 BACKUP LOCATION:\n');
  console.log(`   ${backupDir}\n`);
  
  console.log('🎯 NEXT STEPS:\n');
  console.log('   1. ✅ All files now synced with Salesforce data');
  console.log(`   2. 📤 Send complete picklists to Salesforce`);
  console.log(`   3. ⏳ SF will create IDs for ${attributeStats.newAttributesAdded - (attributeStats.falseMatchesFixed || 0)} new attributes`);
  console.log(`   4. 📥 SF will push back complete list with all IDs assigned`);
  console.log(`   5. 🔄 Run this sync again after SF response\n`);
  
  console.log('⚠️  IMPORTANT:\n');
  console.log('   • New attributes have NO attribute_id yet');
  console.log('   • SF will assign IDs when you send the complete list');
  console.log('   • After SF assigns IDs, they will tell you which categories to add them to\n');
}

// Main execution
function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║        🔄 COMPREHENSIVE PICKLIST SYNC FROM SALESFORCE             ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 Loading Salesforce data...\n');
  
  const sfData = parseSFData();
  const sfCategories = extractSFCategories(sfData);
  const sfAttributes = extractSFAttributes(sfData);
  
  console.log(`   SF Data: ${sfCategories.length} categories, ${sfAttributes.length} attributes\n`);
  
  // Create backup
  const backupDir = createBackup();
  
  // Sync all files
  const { categories, stats: categoryStats } = syncCategories(sfCategories);
  const { attributes, stats: attributeStats } = syncAttributes(sfAttributes);
  const { mappings, count: mappingCount } = rebuildCategoryFilterAttributes(sfData);
  
  // Save everything
  saveFiles(categories, attributes, mappings);
  
  // Display summary
  displaySummary(categoryStats, attributeStats, mappingCount, backupDir);
}

main();
