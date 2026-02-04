/**
 * Fix Attribute Data Corruption
 * 
 * Strategy:
 * 1. TRUE MATCHES (7): Update our name to match SF
 * 2. FALSE MATCHES (71): 
 *    - Fix existing record with SF's correct name (keep SF ID)
 *    - Add NEW record with our old name (NO SF ID - SF will assign later)
 * 3. REVIEW NEEDED (10): Flag for manual decision
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PICKLIST_DIR = path.join(ROOT_DIR, 'src/config/salesforce-picklists');
const AUDIT_DIR = path.join(ROOT_DIR, 'audit-results');

// Load analysis results
function loadAnalysis() {
  const analysisPath = path.join(AUDIT_DIR, 'attribute-mismatch-analysis.json');
  return JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
}

// Create backup
function createBackup() {
  const timestamp = Date.now();
  const backupDir = path.join(PICKLIST_DIR, 'backups', `corruption-fix-${timestamp}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const attributesPath = path.join(PICKLIST_DIR, 'attributes.json');
  const backupPath = path.join(backupDir, 'attributes.json');
  
  fs.copyFileSync(attributesPath, backupPath);
  console.log(`✅ Backup created: ${backupDir}`);
  
  return backupDir;
}

// Fix attributes
function fixAttributes(analysis) {
  const attributesPath = path.join(PICKLIST_DIR, 'attributes.json');
  const attributes = JSON.parse(fs.readFileSync(attributesPath, 'utf-8'));
  
  const changes = {
    trueMatchesUpdated: 0,
    falseMatchesFixed: 0,
    newAttributesAdded: 0,
    reviewNeeded: []
  };
  
  const newAttributes = [];
  
  // Process TRUE MATCHES - just update the name
  analysis.trueMatches.forEach(match => {
    const attr = attributes.find(a => a.attribute_id === match.id);
    if (attr) {
      console.log(`\n✅ TRUE MATCH: Updating name`);
      console.log(`   ID: ${match.id}`);
      console.log(`   OLD: "${attr.attribute_name}"`);
      console.log(`   NEW: "${match.sf_name}"`);
      
      attr.attribute_name = match.sf_name;
      changes.trueMatchesUpdated++;
    }
  });
  
  // Process FALSE MATCHES - fix name AND create new attribute
  analysis.falseMatches.forEach(match => {
    const attr = attributes.find(a => a.attribute_id === match.id);
    if (attr) {
      const oldName = attr.attribute_name;
      
      console.log(`\n❌ FALSE MATCH: Fixing corruption`);
      console.log(`   ID: ${match.id}`);
      console.log(`   1️⃣ Update existing record to SF's correct name:`);
      console.log(`      OLD: "${oldName}"`);
      console.log(`      NEW: "${match.sf_name}"`);
      
      // Update existing record with SF's correct name
      attr.attribute_name = match.sf_name;
      changes.falseMatchesFixed++;
      
      // Create NEW attribute for our old (wrong) name - NO SF ID
      const newAttr = {
        attribute_name: oldName,
        type: match.type
      };
      
      console.log(`   2️⃣ Create new attribute (waiting for SF ID):`);
      console.log(`      NAME: "${oldName}"`);
      console.log(`      TYPE: "${match.type}"`);
      console.log(`      SF_ID: (pending from Salesforce)`);
      
      newAttributes.push(newAttr);
      changes.newAttributesAdded++;
    }
  });
  
  // Flag REVIEW NEEDED items
  analysis.reviewNeeded.forEach(match => {
    changes.reviewNeeded.push({
      id: match.id,
      sf_name: match.sf_name,
      local_name: match.local_name,
      reason: match.reason,
      confidence: match.confidence
    });
  });
  
  // Add all new attributes to the end
  attributes.push(...newAttributes);
  
  return { attributes, changes };
}

// Save updated attributes
function saveAttributes(attributes) {
  const attributesPath = path.join(PICKLIST_DIR, 'attributes.json');
  fs.writeFileSync(attributesPath, JSON.stringify(attributes, null, 2));
  console.log(`\n✅ Updated attributes.json saved`);
}

// Generate manual review file
function generateReviewFile(reviewItems) {
  if (reviewItems.length === 0) return;
  
  const reviewPath = path.join(AUDIT_DIR, 'attributes-manual-review-needed.json');
  
  const reviewData = {
    total: reviewItems.length,
    instructions: [
      "These attributes have some word overlap but may be different concepts.",
      "For each item, decide:",
      "  - SAME ATTRIBUTE: Just different wording → Update name to match SF",
      "  - DIFFERENT ATTRIBUTES: Different concepts → Create new attribute like FALSE MATCHES",
      "",
      "After manual review, run the fix script again with your decisions."
    ],
    items: reviewItems
  };
  
  fs.writeFileSync(reviewPath, JSON.stringify(reviewData, null, 2));
  console.log(`\n📋 Manual review file created: ${reviewPath}`);
}

// Display summary
function displaySummary(changes, backupDir) {
  console.log('\n\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║              ✅ ATTRIBUTE CORRUPTION FIX COMPLETE                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 CHANGES SUMMARY:\n');
  console.log(`   ✅ TRUE MATCHES: ${changes.trueMatchesUpdated} names updated`);
  console.log(`   ❌ FALSE MATCHES: ${changes.falseMatchesFixed} corrupted records fixed`);
  console.log(`   🆕 NEW ATTRIBUTES: ${changes.newAttributesAdded} added (pending SF IDs)`);
  console.log(`   🔍 REVIEW NEEDED: ${changes.reviewNeeded.length} flagged for manual decision\n`);
  
  const totalBefore = 1058;
  const totalAfter = totalBefore + changes.newAttributesAdded;
  
  console.log('📈 ATTRIBUTE COUNT:\n');
  console.log(`   BEFORE: ${totalBefore} attributes`);
  console.log(`   AFTER:  ${totalAfter} attributes`);
  console.log(`   NEW:    +${changes.newAttributesAdded} (waiting for SF IDs)\n`);
  
  console.log('💾 BACKUP:\n');
  console.log(`   ${backupDir}\n`);
  
  if (changes.reviewNeeded.length > 0) {
    console.log('⚠️  NEXT STEPS:\n');
    console.log(`   1. Review ${changes.reviewNeeded.length} items in:`);
    console.log(`      audit-results/attributes-manual-review-needed.json`);
    console.log(`   2. Decide if each is SAME or DIFFERENT attribute`);
    console.log(`   3. Update accordingly\n`);
  }
  
  console.log('🎯 READY FOR SALESFORCE:\n');
  console.log(`   ✅ Send complete attributes.json to Salesforce`);
  console.log(`   ✅ SF will recognize ${changes.trueMatchesUpdated + changes.falseMatchesFixed} by ID`);
  console.log(`   ✅ SF will create IDs for ${changes.newAttributesAdded} new attributes`);
  console.log(`   ✅ SF will push back complete list with all IDs assigned\n`);
}

// Main execution
function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║          🔧 FIXING ATTRIBUTE DATA CORRUPTION                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  const analysis = loadAnalysis();
  const backupDir = createBackup();
  
  const { attributes, changes } = fixAttributes(analysis);
  saveAttributes(attributes);
  
  if (changes.reviewNeeded.length > 0) {
    generateReviewFile(changes.reviewNeeded);
  }
  
  displaySummary(changes, backupDir);
}

main();
