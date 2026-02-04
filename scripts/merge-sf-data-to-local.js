/**
 * Merge SF Data Into Local Picklists (IN PLACE)
 * ==============================================
 * 
 * Strategy:
 * 1. Load SF data from category_attribute_verify.file
 * 2. Load our 5 JSON picklist files
 * 3. Add ONLY items from SF that we don't have (no duplicates)
 * 4. Update existing files IN PLACE
 * 5. Create backup before any changes
 * 
 * Files Updated:
 * - categories.json (add missing categories)
 * - attributes.json (add missing attributes)
 * - brands.json, styles.json (no changes - SF doesn't have these)
 * - category-filter-attributes.json (keep ours - we'll send to SF)
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PICKLIST_DIR = path.join(ROOT_DIR, 'src/config/salesforce-picklists');
const SF_DATA_FILE = path.join(ROOT_DIR, 'category_attribute_verify.file');
const BACKUP_DIR = path.join(PICKLIST_DIR, 'backups', `merge-sf-${Date.now()}`);

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Parse SF data file
function parseSFData() {
  console.log('📥 Reading Salesforce data file...\n');
  
  const fileContent = fs.readFileSync(SF_DATA_FILE, 'utf-8');
  const jsonStart = fileContent.indexOf('{');
  const jsonContent = fileContent.substring(jsonStart);
  const sfData = JSON.parse(jsonContent);
  
  console.log(`   Version: ${sfData.version}`);
  console.log(`   Date: ${sfData.date}`);
  console.log(`   Total Categories: ${sfData.total_categories}\n`);
  
  return sfData;
}

// Extract SF categories and attributes
function extractSFPicklists(sfData) {
  const sfCategories = new Map();
  const sfAttributes = new Map();
  
  for (const [categoryName, categoryData] of Object.entries(sfData.categories)) {
    // Add category
    sfCategories.set(categoryData.category_id, {
      category_id: categoryData.category_id,
      category_name: categoryName,
      department: categoryData.department,
      family: categoryData.department // SF uses department, we can map to family
    });
    
    // Add attributes
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

// Create backups
function createBackups() {
  console.log('💾 Creating backups...\n');
  
  const filesToBackup = [
    'categories.json',
    'attributes.json',
    'brands.json',
    'styles.json',
    'category-filter-attributes.json'
  ];
  
  filesToBackup.forEach(file => {
    const source = path.join(PICKLIST_DIR, file);
    const dest = path.join(BACKUP_DIR, file);
    fs.copyFileSync(source, dest);
    console.log(`   ✅ Backed up: ${file}`);
  });
  
  console.log(`\n   Backups saved to: ${BACKUP_DIR}\n`);
}

// Merge categories
function mergeCategories(sfCategories) {
  console.log('🔀 Merging categories...\n');
  
  const localFile = path.join(PICKLIST_DIR, 'categories.json');
  const localCategories = JSON.parse(fs.readFileSync(localFile, 'utf-8'));
  
  const localIds = new Set(localCategories.map(c => c.category_id));
  const localNames = new Set(localCategories.map(c => c.category_name.toLowerCase()));
  
  let added = 0;
  
  sfCategories.forEach(sfCat => {
    const hasId = localIds.has(sfCat.category_id);
    const hasName = localNames.has(sfCat.category_name.toLowerCase());
    
    if (!hasId && !hasName) {
      // Completely new category
      localCategories.push(sfCat);
      added++;
      console.log(`   ➕ Added: ${sfCat.category_name} (${sfCat.category_id})`);
    } else if (hasId || hasName) {
      // Already exists, skip
      console.log(`   ⏭️  Skipped (exists): ${sfCat.category_name}`);
    }
  });
  
  // Save updated file
  fs.writeFileSync(localFile, JSON.stringify(localCategories, null, 2));
  
  console.log(`\n   ✅ Categories: ${localCategories.length} total (added ${added})\n`);
  
  return { total: localCategories.length, added };
}

// Merge attributes
function mergeAttributes(sfAttributes) {
  console.log('🔀 Merging attributes...\n');
  
  const localFile = path.join(PICKLIST_DIR, 'attributes.json');
  const localAttributes = JSON.parse(fs.readFileSync(localFile, 'utf-8'));
  
  const localIds = new Set(localAttributes.map(a => a.attribute_id));
  const localNames = new Set(localAttributes.map(a => a.attribute_name.toLowerCase()));
  
  let added = 0;
  
  sfAttributes.forEach(sfAttr => {
    const hasId = localIds.has(sfAttr.attribute_id);
    const hasName = localNames.has(sfAttr.attribute_name.toLowerCase());
    
    if (!hasId && !hasName) {
      // Completely new attribute
      localAttributes.push(sfAttr);
      added++;
      console.log(`   ➕ Added: ${sfAttr.attribute_name} (${sfAttr.attribute_id}) - ${sfAttr.type}`);
    } else if (hasId || hasName) {
      // Already exists, skip
      console.log(`   ⏭️  Skipped (exists): ${sfAttr.attribute_name}`);
    }
  });
  
  // Save updated file
  fs.writeFileSync(localFile, JSON.stringify(localAttributes, null, 2));
  
  console.log(`\n   ✅ Attributes: ${localAttributes.length} total (added ${added})\n`);
  
  return { total: localAttributes.length, added };
}

// Verify files
function verifyFiles() {
  console.log('🔍 Verifying updated files...\n');
  
  const files = [
    'categories.json',
    'attributes.json',
    'brands.json',
    'styles.json',
    'category-filter-attributes.json'
  ];
  
  files.forEach(file => {
    const filePath = path.join(PICKLIST_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const count = Array.isArray(data) ? data.length : Object.keys(data.categories || {}).length;
    console.log(`   ✅ ${file}: ${count} items`);
  });
  
  console.log('');
}

// Main execution
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║         🔄 MERGE SF DATA INTO LOCAL PICKLISTS (IN PLACE)         ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Step 1: Create backups
    createBackups();
    
    // Step 2: Parse SF data
    const sfData = parseSFData();
    const sfPicklists = extractSFPicklists(sfData);
    
    console.log(`   SF Categories: ${sfPicklists.categories.length}`);
    console.log(`   SF Attributes: ${sfPicklists.attributes.length}\n`);
    
    // Step 3: Merge categories
    const categoryResult = mergeCategories(sfPicklists.categories);
    
    // Step 4: Merge attributes
    const attributeResult = mergeAttributes(sfPicklists.attributes);
    
    // Step 5: Verify
    verifyFiles();
    
    // Summary
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ MERGE COMPLETE                               ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 Summary:\n');
    console.log(`   Categories: ${categoryResult.total} (added ${categoryResult.added} from SF)`);
    console.log(`   Attributes: ${attributeResult.total} (added ${attributeResult.added} from SF)`);
    console.log(`   Brands: 343 (unchanged - SF doesn't have brands)`);
    console.log(`   Styles: 10 (unchanged - SF doesn't have styles)`);
    console.log(`   Category Filters: (unchanged - will send to SF)\n`);
    
    console.log('🎯 Next Steps:\n');
    console.log('   1. Review the updated files in src/config/salesforce-picklists/');
    console.log('   2. Test the application to ensure everything works');
    console.log('   3. Send complete picklists TO Salesforce');
    console.log(`   4. Backups available at: ${BACKUP_DIR}\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
