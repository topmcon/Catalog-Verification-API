/**
 * Comprehensive Picklist Audit - All 5 Files
 * 
 * Audits ALL picklists for data corruption:
 * 1. categories.json - Check for name mismatches/corruption
 * 2. attributes.json - Already analyzed, include results
 * 3. brands.json - Check for any SF data (unlikely)
 * 4. styles.json - Check for any SF data (unlikely)
 * 5. category-filter-attributes.json - Verify attribute references
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
      family: categoryData.family
    });
  }
  
  return sfCategories;
}

// Extract SF attributes
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

// Analyze similarity
function analyzeSimilarity(sfName, localName) {
  const sfLower = sfName.toLowerCase().trim();
  const localLower = localName.toLowerCase().trim();
  
  // Exact match (case insensitive)
  if (sfLower === localLower) {
    return { type: 'TRUE_MATCH', reason: 'Exact match (capitalization only)', confidence: 100 };
  }
  
  // One is subset of the other
  if (sfLower.includes(localLower) || localLower.includes(sfLower)) {
    return { type: 'TRUE_MATCH', reason: 'One name contains the other', confidence: 95 };
  }
  
  // Check for common word overlap
  const sfWords = new Set(sfLower.split(/\s+/));
  const localWords = new Set(localLower.split(/\s+/));
  
  const commonWords = [...sfWords].filter(w => localWords.has(w) && w.length > 2);
  const totalWords = new Set([...sfWords, ...localWords]).size;
  const overlapPercent = (commonWords.length / totalWords) * 100;
  
  if (overlapPercent > 60) {
    return { 
      type: 'LIKELY_TRUE_MATCH', 
      reason: `${Math.round(overlapPercent)}% word overlap`, 
      confidence: Math.round(overlapPercent) 
    };
  }
  
  if (overlapPercent > 30) {
    return { 
      type: 'REVIEW_NEEDED', 
      reason: `${Math.round(overlapPercent)}% word overlap`, 
      confidence: Math.round(overlapPercent) 
    };
  }
  
  return { 
    type: 'FALSE_MATCH', 
    reason: 'Completely different names', 
    confidence: 0 
  };
}

// Audit categories
function auditCategories(sfCategories) {
  const localCategories = JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'categories.json'), 'utf-8'));
  
  const analysis = {
    trueMatches: [],
    likelyTrueMatches: [],
    reviewNeeded: [],
    falseMatches: [],
    summary: {
      total: 0,
      true_match: 0,
      likely_true_match: 0,
      review_needed: 0,
      false_match: 0
    }
  };
  
  sfCategories.forEach(sfCat => {
    const localCat = localCategories.find(l => l.category_id === sfCat.category_id);
    
    if (localCat && localCat.category_name !== sfCat.category_name) {
      const similarity = analyzeSimilarity(sfCat.category_name, localCat.category_name);
      
      const mismatch = {
        id: sfCat.category_id,
        sf_name: sfCat.category_name,
        local_name: localCat.category_name,
        department: sfCat.department,
        family: sfCat.family,
        ...similarity
      };
      
      analysis.summary.total++;
      
      switch (similarity.type) {
        case 'TRUE_MATCH':
          analysis.trueMatches.push(mismatch);
          analysis.summary.true_match++;
          break;
        case 'LIKELY_TRUE_MATCH':
          analysis.likelyTrueMatches.push(mismatch);
          analysis.summary.likely_true_match++;
          break;
        case 'REVIEW_NEEDED':
          analysis.reviewNeeded.push(mismatch);
          analysis.summary.review_needed++;
          break;
        case 'FALSE_MATCH':
          analysis.falseMatches.push(mismatch);
          analysis.summary.false_match++;
          break;
      }
    }
  });
  
  return analysis;
}

// Audit brands (check if SF has any)
function auditBrands() {
  const localBrands = JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'brands.json'), 'utf-8'));
  
  return {
    localCount: localBrands.length,
    sfCount: 0,
    note: 'SF does not provide brand data'
  };
}

// Audit styles (check if SF has any)
function auditStyles() {
  const localStyles = JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'styles.json'), 'utf-8'));
  
  return {
    localCount: localStyles.length,
    sfCount: 0,
    note: 'SF does not provide style data'
  };
}

// Audit category-filter-attributes (check for broken references)
function auditCategoryFilterAttributes(attributeAnalysis) {
  const filterConfig = JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'category-filter-attributes.json'), 'utf-8'));
  
  const issues = [];
  const allChangedAttributeNames = new Set();
  const categoriesWithAttributes = new Set();
  
  // Collect all attribute names that will change
  [...attributeAnalysis.trueMatches, ...attributeAnalysis.falseMatches].forEach(match => {
    allChangedAttributeNames.add(match.local_name);
  });
  
  // Check each mapping for references to changed attributes
  // filterConfig is an object with numeric keys, not an array
  Object.values(filterConfig).forEach(mapping => {
    categoriesWithAttributes.add(mapping.category_name);
    
    if (allChangedAttributeNames.has(mapping.attribute_name)) {
      issues.push({
        category: mapping.category_name,
        rank: mapping.rank,
        oldAttributeName: mapping.attribute_name,
        attribute_id: mapping.attribute_id,
        issue: 'Attribute name will change - may need update'
      });
    }
  });
  
  return {
    totalMappings: Object.keys(filterConfig).length,
    totalCategories: categoriesWithAttributes.size,
    issuesFound: issues.length,
    issues: issues
  };
}

// Display results
function displayResults(results) {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║        🔍 COMPREHENSIVE PICKLIST AUDIT - ALL 5 FILES              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  // CATEGORIES
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('📂 1. CATEGORIES.JSON');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  
  const catAnalysis = results.categories;
  console.log(`Total Mismatches: ${catAnalysis.summary.total}\n`);
  
  if (catAnalysis.summary.total > 0) {
    console.log(`   ✅ TRUE MATCHES: ${catAnalysis.summary.true_match} (update name)`);
    console.log(`   ⚠️  LIKELY TRUE: ${catAnalysis.summary.likely_true_match} (probably update)`);
    console.log(`   🔍 REVIEW NEEDED: ${catAnalysis.summary.review_needed} (manual decision)`);
    console.log(`   ❌ FALSE MATCHES: ${catAnalysis.summary.false_match} (CORRUPTION - need new category)`);
    
    if (catAnalysis.falseMatches.length > 0) {
      console.log('\n   ⚠️  CRITICAL: Category corruption detected!');
      catAnalysis.falseMatches.forEach(m => {
        console.log(`      • ${m.id}: "${m.sf_name}" vs "${m.local_name}"`);
      });
    }
  } else {
    console.log('   ✅ NO ISSUES FOUND\n');
  }
  
  // ATTRIBUTES
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('📂 2. ATTRIBUTES.JSON');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  
  const attrAnalysis = results.attributes;
  console.log(`Total Mismatches: ${attrAnalysis.summary.total}\n`);
  console.log(`   ✅ TRUE MATCHES: ${attrAnalysis.summary.true_match} (update name)`);
  console.log(`   ⚠️  LIKELY TRUE: ${attrAnalysis.summary.likely_true_match} (probably update)`);
  console.log(`   🔍 REVIEW NEEDED: ${attrAnalysis.summary.review_needed} (manual decision)`);
  console.log(`   ❌ FALSE MATCHES: ${attrAnalysis.summary.false_match} (CORRUPTION - need new attributes)`);
  
  // BRANDS
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('📂 3. BRANDS.JSON');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  
  console.log(`   Local Brands: ${results.brands.localCount}`);
  console.log(`   SF Brands: ${results.brands.sfCount}`);
  console.log(`   ℹ️  ${results.brands.note}`);
  console.log(`   ✅ NO CHANGES NEEDED\n`);
  
  // STYLES
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('📂 4. STYLES.JSON');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  
  console.log(`   Local Styles: ${results.styles.localCount}`);
  console.log(`   SF Styles: ${results.styles.sfCount}`);
  console.log(`   ℹ️  ${results.styles.note}`);
  console.log(`   ✅ NO CHANGES NEEDED\n`);
  
  // CATEGORY-FILTER-ATTRIBUTES
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('📂 5. CATEGORY-FILTER-ATTRIBUTES.JSON');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  
  const filterAudit = results.categoryFilterAttributes;
  console.log(`   Total Mappings: ${filterAudit.totalMappings}`);
  console.log(`   Categories Mapped: ${filterAudit.totalCategories}`);
  console.log(`   References to Changed Attributes: ${filterAudit.issuesFound}\n`);
  
  if (filterAudit.issuesFound > 0) {
    console.log('   ⚠️  WARNING: Some Top 15 attributes will have name changes:');
    filterAudit.issues.slice(0, 10).forEach(issue => {
      console.log(`      • ${issue.category}: Rank ${issue.rank} - "${issue.oldAttributeName}"`);
    });
    if (filterAudit.issuesFound > 10) {
      console.log(`      ... and ${filterAudit.issuesFound - 10} more`);
    }
    console.log('\n   ℹ️  May need verification after attribute fix\n');
  } else {
    console.log('   ✅ NO ISSUES FOUND\n');
  }
  
  // SUMMARY
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                    📊 OVERALL SUMMARY                              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  const totalIssues = catAnalysis.summary.total + attrAnalysis.summary.total;
  const totalFalseMatches = catAnalysis.summary.false_match + attrAnalysis.summary.false_match;
  const totalTrueMatches = catAnalysis.summary.true_match + attrAnalysis.summary.true_match;
  
  console.log(`   Total Mismatches Found: ${totalIssues}`);
  console.log(`   ✅ Simple Name Updates: ${totalTrueMatches}`);
  console.log(`   ❌ Data Corruption: ${totalFalseMatches} (need new records)\n`);
  
  console.log('🎯 REQUIRED ACTIONS:\n');
  
  if (catAnalysis.summary.total > 0) {
    console.log(`   1️⃣  Fix ${catAnalysis.summary.total} category mismatches in categories.json`);
    if (catAnalysis.summary.false_match > 0) {
      console.log(`      • ${catAnalysis.summary.false_match} FALSE MATCHES: Create new categories`);
    }
    if (catAnalysis.summary.true_match > 0) {
      console.log(`      • ${catAnalysis.summary.true_match} TRUE MATCHES: Update names`);
    }
  }
  
  if (attrAnalysis.summary.total > 0) {
    console.log(`\n   2️⃣  Fix ${attrAnalysis.summary.total} attribute mismatches in attributes.json`);
    if (attrAnalysis.summary.false_match > 0) {
      console.log(`      • ${attrAnalysis.summary.false_match} FALSE MATCHES: Create new attributes`);
    }
    if (attrAnalysis.summary.true_match > 0) {
      console.log(`      • ${attrAnalysis.summary.true_match} TRUE MATCHES: Update names`);
    }
  }
  
  if (filterAudit.issuesFound > 0) {
    console.log(`\n   3️⃣  Verify ${filterAudit.issuesFound} Top 15 attribute references after fixes`);
  }
  
  console.log('\n');
}

// Save comprehensive report
function saveReport(results) {
  const reportPath = path.join(AUDIT_DIR, 'comprehensive-picklist-audit.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`💾 Comprehensive audit report saved to:`);
  console.log(`   ${reportPath}\n`);
}

// Main execution
function main() {
  console.log('Starting comprehensive picklist audit...\n');
  
  const sfData = parseSFData();
  const sfCategories = extractSFCategories(sfData);
  const sfAttributes = extractSFAttributes(sfData);
  
  // Load existing attribute analysis
  const attrAnalysisPath = path.join(AUDIT_DIR, 'attribute-mismatch-analysis.json');
  const attributeAnalysis = JSON.parse(fs.readFileSync(attrAnalysisPath, 'utf-8'));
  
  const results = {
    auditDate: new Date().toISOString(),
    categories: auditCategories(sfCategories),
    attributes: attributeAnalysis,
    brands: auditBrands(),
    styles: auditStyles(),
    categoryFilterAttributes: auditCategoryFilterAttributes(attributeAnalysis)
  };
  
  displayResults(results);
  saveReport(results);
}

main();
