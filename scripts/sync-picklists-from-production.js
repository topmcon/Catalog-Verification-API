#!/usr/bin/env node
/**
 * SYNC PICKLISTS FROM PRODUCTION
 * 
 * This script syncs all picklist files from production to local,
 * showing differences and ensuring no data is lost.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SSH_KEY = '~/.ssh/cxc_ai_deploy';
const SSH_HOST = 'root@verify.cxc-ai.com';
const PROD_PATH = '/opt/catalog-verification-api/src/config/salesforce-picklists';
const LOCAL_PATH = path.join(__dirname, '../src/config/salesforce-picklists');

const PICKLIST_FILES = [
  'attributes.json',
  'brands.json',
  'categories.json',
  'styles.json',
  'category-filter-attributes.json'
];

console.log('═══════════════════════════════════════════════════════');
console.log('🔄 PICKLIST SYNC - Production → Local');
console.log('═══════════════════════════════════════════════════════\n');

function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function downloadFile(filename) {
  const remotePath = `${PROD_PATH}/${filename}`;
  const tempPath = `/tmp/prod_${filename}`;
  const sshCommand = `scp -i ${SSH_KEY} ${SSH_HOST}:${remotePath} ${tempPath}`;
  
  console.log(`📥 Downloading ${filename}...`);
  execCommand(sshCommand);
  return tempPath;
}

function compareFiles(filename, prodPath, localPath) {
  console.log(`\n📊 Comparing ${filename}:`);
  
  const prodData = JSON.parse(fs.readFileSync(prodPath, 'utf8'));
  const localData = JSON.parse(fs.readFileSync(localPath, 'utf8'));
  
  let prodCount, localCount, prodItems, localItems;
  
  // Handle different file structures
  if (filename === 'category-filter-attributes.json') {
    prodCount = Object.keys(prodData.categories || {}).length;
    localCount = Object.keys(localData.categories || {}).length;
    prodItems = Object.keys(prodData.categories || {});
    localItems = Object.keys(localData.categories || {});
  } else if (Array.isArray(prodData)) {
    prodCount = prodData.length;
    localCount = localData.length;
    
    // Determine unique identifier field
    const idField = filename === 'attributes.json' ? 'attribute_name' :
                   filename === 'brands.json' ? 'brand_name' :
                   filename === 'categories.json' ? 'category_name' :
                   'style_name';
    
    prodItems = prodData.map(item => item[idField]);
    localItems = localData.map(item => item[idField]);
  } else {
    console.log('  ⚠️  Unknown file structure');
    return { proceed: true, changes: [] };
  }
  
  console.log(`  Production: ${prodCount} items`);
  console.log(`  Local: ${localCount} items`);
  
  // Find differences
  const onlyInProd = prodItems.filter(item => !localItems.includes(item));
  const onlyInLocal = localItems.filter(item => !prodItems.includes(item));
  
  const changes = [];
  
  if (onlyInProd.length > 0) {
    console.log(`  🆕 ${onlyInProd.length} NEW in production:`);
    onlyInProd.slice(0, 10).forEach(item => console.log(`     + ${item}`));
    if (onlyInProd.length > 10) {
      console.log(`     ... and ${onlyInProd.length - 10} more`);
    }
    changes.push({ type: 'new', count: onlyInProd.length, items: onlyInProd });
  }
  
  if (onlyInLocal.length > 0) {
    console.log(`  ⚠️  ${onlyInLocal.length} ONLY in local (will be removed):`);
    onlyInLocal.slice(0, 10).forEach(item => console.log(`     - ${item}`));
    if (onlyInLocal.length > 10) {
      console.log(`     ... and ${onlyInLocal.length - 10} more`);
    }
    changes.push({ type: 'removed', count: onlyInLocal.length, items: onlyInLocal });
  }
  
  if (onlyInProd.length === 0 && onlyInLocal.length === 0) {
    console.log(`  ✅ Files are identical`);
  }
  
  return {
    proceed: true,
    changes,
    prodCount,
    localCount
  };
}

function syncFile(filename) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${filename}`);
  console.log('='.repeat(60));
  
  const prodPath = downloadFile(filename);
  const localPath = path.join(LOCAL_PATH, filename);
  
  if (!fs.existsSync(localPath)) {
    console.log(`  ⚠️  Local file doesn't exist, will create it`);
    fs.copyFileSync(prodPath, localPath);
    console.log(`  ✅ Created ${filename}`);
    return;
  }
  
  const comparison = compareFiles(filename, prodPath, localPath);
  
  if (comparison.changes.length === 0) {
    console.log(`  ✅ No sync needed - files match`);
    return;
  }
  
  // Create backup before overwriting
  const backupPath = `${localPath}.backup.${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;
  fs.copyFileSync(localPath, backupPath);
  console.log(`  💾 Backup created: ${path.basename(backupPath)}`);
  
  // Copy production version to local
  fs.copyFileSync(prodPath, localPath);
  console.log(`  ✅ Synced ${filename} from production`);
  
  return comparison;
}

// Main execution
console.log(`📍 Production: ${SSH_HOST}:${PROD_PATH}`);
console.log(`📍 Local: ${LOCAL_PATH}\n`);

const results = {};

PICKLIST_FILES.forEach(filename => {
  const result = syncFile(filename);
  if (result) {
    results[filename] = result;
  }
});

// Summary
console.log('\n\n═══════════════════════════════════════════════════════');
console.log('📊 SYNC SUMMARY');
console.log('═══════════════════════════════════════════════════════\n');

let totalNew = 0;
let totalRemoved = 0;

Object.entries(results).forEach(([filename, result]) => {
  const newItems = result.changes.find(c => c.type === 'new');
  const removedItems = result.changes.find(c => c.type === 'removed');
  
  if (newItems) totalNew += newItems.count;
  if (removedItems) totalRemoved += removedItems.count;
  
  console.log(`${filename}:`);
  console.log(`  Production: ${result.prodCount} | Local: ${result.localCount}`);
  if (newItems) console.log(`  🆕 New: ${newItems.count}`);
  if (removedItems) console.log(`  ⚠️  Removed: ${removedItems.count}`);
  console.log();
});

console.log(`Total changes: +${totalNew} new, -${totalRemoved} removed\n`);
console.log('✅ Sync complete!\n');
console.log('Next steps:');
console.log('  1. Review changes above');
console.log('  2. Run: npm run build');
console.log('  3. Commit: git add . && git commit -m "Sync picklists from production"');
console.log('  4. Push: git push origin main\n');
