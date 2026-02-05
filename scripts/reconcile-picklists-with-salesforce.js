#!/usr/bin/env node

/**
 * Reconcile Picklists with Clean Salesforce Data
 * 
 * This script takes a clean picklist from Salesforce and reconciles it with our current picklist:
 * 1. Removes duplicates (preferring SF's version)
 * 2. Adds new items from our list that SF doesn't have
 * 3. Generates detailed reports
 * 
 * Usage:
 *   node scripts/reconcile-picklists-with-salesforce.js <picklist-type> <sf-clean-file>
 * 
 * Example:
 *   node scripts/reconcile-picklists-with-salesforce.js attributes sf-clean-attributes.json
 * 
 * Picklist types: attributes, brands, categories, styles
 */

const fs = require('fs');
const path = require('path');

const PICKLIST_DIR = path.join(__dirname, '../src/config/salesforce-picklists');

const PICKLIST_CONFIGS = {
  attributes: {
    file: 'attributes.json',
    nameKey: 'attribute_name',
    idKey: 'attribute_id'
  },
  brands: {
    file: 'brands.json',
    nameKey: 'brand_name',
    idKey: 'brand_id'
  },
  categories: {
    file: 'categories.json',
    nameKey: 'category_name',
    idKey: 'category_id'
  },
  styles: {
    file: 'styles.json',
    nameKey: 'style_name',
    idKey: 'style_id'
  }
};

function normalizeForComparison(str) {
  return str.toLowerCase().trim();
}

function reconcilePicklists(picklistType, sfCleanFilePath) {
  const config = PICKLIST_CONFIGS[picklistType];
  if (!config) {
    console.error(`❌ Invalid picklist type: ${picklistType}`);
    console.error(`Valid types: ${Object.keys(PICKLIST_CONFIGS).join(', ')}`);
    process.exit(1);
  }

  // Load files
  const ourPicklistPath = path.join(PICKLIST_DIR, config.file);
  
  if (!fs.existsSync(ourPicklistPath)) {
    console.error(`❌ Our picklist not found: ${ourPicklistPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(sfCleanFilePath)) {
    console.error(`❌ SF clean file not found: ${sfCleanFilePath}`);
    process.exit(1);
  }

  console.log(`\n🔄 Reconciling ${picklistType.toUpperCase()} picklist...\n`);

  const ourPicklist = JSON.parse(fs.readFileSync(ourPicklistPath, 'utf8'));
  const sfCleanPicklist = JSON.parse(fs.readFileSync(sfCleanFilePath, 'utf8'));

  console.log(`📊 Current counts:`);
  console.log(`   Our list: ${ourPicklist.length} items`);
  console.log(`   SF clean list: ${sfCleanPicklist.length} items\n`);

  // Create maps for efficient lookup
  const { nameKey, idKey } = config;
  
  // Map SF items by normalized name for deduplication
  const sfMap = new Map();
  sfCleanPicklist.forEach(item => {
    const normalizedName = normalizeForComparison(item[nameKey]);
    sfMap.set(normalizedName, item);
  });

  // Track what we find
  const reconciledList = [];
  const duplicatesRemoved = [];
  const newItemsFromOurList = [];
  const itemsFromSF = [];

  // First, add all SF items (these are canonical)
  sfCleanPicklist.forEach(item => {
    reconciledList.push(item);
    itemsFromSF.push(item[nameKey]);
  });

  // Then, check our list for items NOT in SF
  ourPicklist.forEach(ourItem => {
    const normalizedName = normalizeForComparison(ourItem[nameKey]);
    
    if (sfMap.has(normalizedName)) {
      // This is a duplicate - SF version is already in reconciledList
      const sfItem = sfMap.get(normalizedName);
      
      // Check if IDs differ (indicating duplicate with different ID)
      if (ourItem[idKey] !== sfItem[idKey]) {
        duplicatesRemoved.push({
          name: ourItem[nameKey],
          ourId: ourItem[idKey],
          sfId: sfItem[idKey]
        });
      }
    } else {
      // This is NEW - we have it but SF doesn't
      newItemsFromOurList.push({
        name: ourItem[nameKey],
        id: ourItem[idKey]
      });
      
      // Add to reconciled list
      reconciledList.push(ourItem);
    }
  });

  // Sort reconciled list by name for consistency
  reconciledList.sort((a, b) => {
    const nameA = a[nameKey].toLowerCase();
    const nameB = b[nameKey].toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Generate report
  console.log(`\n📈 RECONCILIATION RESULTS:`);
  console.log(`   ✅ Items from SF (canonical): ${itemsFromSF.length}`);
  console.log(`   ➕ New items from our list: ${newItemsFromOurList.length}`);
  console.log(`   🗑️  Duplicates removed: ${duplicatesRemoved.length}`);
  console.log(`   📦 Final reconciled count: ${reconciledList.length}\n`);

  // Show duplicates removed
  if (duplicatesRemoved.length > 0) {
    console.log(`\n🗑️  DUPLICATES REMOVED (kept SF version):`);
    duplicatesRemoved.forEach((dup, idx) => {
      console.log(`   ${idx + 1}. "${dup.name}"`);
      console.log(`      ❌ Removed ID: ${dup.ourId}`);
      console.log(`      ✅ Kept SF ID: ${dup.sfId}`);
    });
  }

  // Show new items from our list
  if (newItemsFromOurList.length > 0) {
    console.log(`\n➕ NEW ITEMS FROM OUR LIST (not in SF yet):\n`);
    newItemsFromOurList.forEach((item, idx) => {
      console.log(`   ${idx + 1}. "${item.name}" (ID: ${item.id || 'null'})`);
    });
    console.log(`\n   💡 These items should be reviewed and potentially added to Salesforce.`);
  }

  // Create backup of current file
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupPath = ourPicklistPath.replace('.json', `.backup-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(ourPicklist, null, 2));
  console.log(`\n💾 Backup created: ${path.basename(backupPath)}`);

  // Write reconciled list
  fs.writeFileSync(ourPicklistPath, JSON.stringify(reconciledList, null, 2));
  console.log(`✅ Reconciled picklist written to: ${config.file}`);

  // Save detailed report
  const reportPath = path.join(__dirname, `../audit-results/reconciliation-${picklistType}-${timestamp}.json`);
  const report = {
    timestamp: new Date().toISOString(),
    picklistType,
    originalCount: ourPicklist.length,
    sfCleanCount: sfCleanPicklist.length,
    reconciledCount: reconciledList.length,
    duplicatesRemoved,
    newItemsFromOurList,
    summary: {
      itemsFromSF: itemsFromSF.length,
      newItemsAdded: newItemsFromOurList.length,
      duplicatesRemoved: duplicatesRemoved.length
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved: ${path.basename(reportPath)}`);

  // Show next steps
  console.log(`\n🎯 NEXT STEPS:`);
  console.log(`   1. Review the reconciled picklist: ${config.file}`);
  console.log(`   2. Review new items from our list (${newItemsFromOurList.length} items)`);
  console.log(`   3. Consider adding new items to Salesforce if needed`);
  console.log(`   4. Commit and deploy the updated picklist\n`);

  return report;
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error(`\n❌ Usage: node ${path.basename(__filename)} <picklist-type> <sf-clean-file>\n`);
    console.error(`Picklist types: ${Object.keys(PICKLIST_CONFIGS).join(', ')}\n`);
    console.error(`Example:`);
    console.error(`  node ${path.basename(__filename)} attributes sf-clean-attributes.json\n`);
    process.exit(1);
  }

  const [picklistType, sfCleanFile] = args;
  reconcilePicklists(picklistType, sfCleanFile);
}

module.exports = { reconcilePicklists };
