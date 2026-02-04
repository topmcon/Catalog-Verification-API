/**
 * Analyze Attribute Mismatches - Determine True vs False Matches
 * 
 * TRUE MATCH: Same attribute concept, just different name
 *   Example: "Wine Bottle Capacity" vs "Wine Bottle Capacity (750 ml)" → update name
 *   Action: Replace our name with SF's name
 * 
 * FALSE MATCH: Completely different attributes sharing same SF ID
 *   Example: "Lockable" vs "Max Capacity (Pounds)" → different concepts!
 *   Action: 
 *     1. Keep SF attribute with SF ID
 *     2. Create NEW attribute for our misnamed one (new ID from SF)
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

// Analyze similarity between two attribute names
function analyzeSimilarity(sfName, localName) {
  const sfLower = sfName.toLowerCase().trim();
  const localLower = localName.toLowerCase().trim();
  
  // Exact match (case insensitive)
  if (sfLower === localLower) {
    return { type: 'TRUE_MATCH', reason: 'Exact match (capitalization only)', confidence: 100 };
  }
  
  // One is subset of the other (e.g., "Wine Bottle Capacity" vs "Wine Bottle Capacity (750 ml)")
  if (sfLower.includes(localLower) || localLower.includes(sfLower)) {
    return { type: 'TRUE_MATCH', reason: 'One name contains the other (added clarification)', confidence: 95 };
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
      reason: `${Math.round(overlapPercent)}% word overlap: [${commonWords.join(', ')}]`, 
      confidence: Math.round(overlapPercent) 
    };
  }
  
  if (overlapPercent > 30) {
    return { 
      type: 'REVIEW_NEEDED', 
      reason: `${Math.round(overlapPercent)}% word overlap - may be related`, 
      confidence: Math.round(overlapPercent) 
    };
  }
  
  // No similarity - completely different
  return { 
    type: 'FALSE_MATCH', 
    reason: 'Completely different attribute names - no overlap', 
    confidence: 0 
  };
}

// Main analysis
function analyzeAttributeMismatches() {
  const sfData = parseSFData();
  const sfAttributes = extractSFAttributes(sfData);
  const localAttributes = JSON.parse(fs.readFileSync(path.join(PICKLIST_DIR, 'attributes.json'), 'utf-8'));
  
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
  
  sfAttributes.forEach(sfAttr => {
    const localAttr = localAttributes.find(l => l.attribute_id === sfAttr.attribute_id);
    
    if (localAttr && localAttr.attribute_name !== sfAttr.attribute_name) {
      const similarity = analyzeSimilarity(sfAttr.attribute_name, localAttr.attribute_name);
      
      const mismatch = {
        id: sfAttr.attribute_id,
        sf_name: sfAttr.attribute_name,
        local_name: localAttr.attribute_name,
        type: sfAttr.type,
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

// Display results
function displayResults(analysis) {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║        🔍 ATTRIBUTE MISMATCH ANALYSIS REPORT                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 SUMMARY:\n');
  console.log(`   Total Mismatches: ${analysis.summary.total}`);
  console.log(`   ✅ TRUE MATCHES: ${analysis.summary.true_match} (update name only)`);
  console.log(`   ⚠️  LIKELY TRUE: ${analysis.summary.likely_true_match} (probably update name)`);
  console.log(`   🔍 REVIEW NEEDED: ${analysis.summary.review_needed} (manual decision)`);
  console.log(`   ❌ FALSE MATCHES: ${analysis.summary.false_match} (need new attribute)\n`);
  
  // TRUE MATCHES
  if (analysis.trueMatches.length > 0) {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TRUE MATCHES - Update Our Name to Match SF                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    analysis.trueMatches.forEach((m, idx) => {
      console.log(`${idx + 1}. ${m.id}`);
      console.log(`   SF:    "${m.sf_name}"`);
      console.log(`   Local: "${m.local_name}"`);
      console.log(`   ✅ ACTION: Update to "${m.sf_name}"\n`);
    });
  }
  
  // LIKELY TRUE MATCHES
  if (analysis.likelyTrueMatches.length > 0) {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  ⚠️  LIKELY TRUE MATCHES - Probably Update Name                   ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    analysis.likelyTrueMatches.forEach((m, idx) => {
      console.log(`${idx + 1}. ${m.id} (${m.confidence}% confidence)`);
      console.log(`   SF:    "${m.sf_name}"`);
      console.log(`   Local: "${m.local_name}"`);
      console.log(`   Reason: ${m.reason}`);
      console.log(`   ⚠️  ACTION: Update to "${m.sf_name}" (verify first)\n`);
    });
  }
  
  // REVIEW NEEDED
  if (analysis.reviewNeeded.length > 0) {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  🔍 REVIEW NEEDED - Manual Decision Required                      ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    analysis.reviewNeeded.forEach((m, idx) => {
      console.log(`${idx + 1}. ${m.id}`);
      console.log(`   SF:    "${m.sf_name}"`);
      console.log(`   Local: "${m.local_name}"`);
      console.log(`   Reason: ${m.reason}`);
      console.log(`   🔍 ACTION: Manual review needed\n`);
    });
  }
  
  // FALSE MATCHES
  if (analysis.falseMatches.length > 0) {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  ❌ FALSE MATCHES - Need New Attribute Creation                   ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    
    console.log('These are DIFFERENT attributes incorrectly sharing the same SF ID.\n');
    console.log('ACTIONS REQUIRED:\n');
    console.log('1. Keep SF attribute with SF ID');
    console.log('2. Create NEW attribute for our misnamed one');
    console.log('3. Send to SF for new ID assignment\n');
    
    analysis.falseMatches.forEach((m, idx) => {
      console.log(`${idx + 1}. ID: ${m.id}`);
      console.log(`   SF attribute:    "${m.sf_name}" (keep with ID ${m.id})`);
      console.log(`   Our attribute:   "${m.local_name}" (needs NEW ID)`);
      console.log(`   ❌ ACTION: Create new attribute for "${m.local_name}"\n`);
    });
  }
  
  // RECOMMENDATIONS
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                    🎯 RECOMMENDATIONS                              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('STEP 1: Auto-Fix True Matches\n');
  console.log(`   → Update ${analysis.summary.true_match} attribute names automatically`);
  console.log(`   → These are just capitalization or minor clarifications\n`);
  
  console.log('STEP 2: Review & Fix Likely Matches\n');
  console.log(`   → Review ${analysis.summary.likely_true_match} attributes manually`);
  console.log(`   → Most are probably the same attribute, confirm before updating\n`);
  
  console.log('STEP 3: Manual Review\n');
  console.log(`   → Review ${analysis.summary.review_needed} attributes with partial overlap`);
  console.log(`   → Decide if they're the same or different\n`);
  
  console.log('STEP 4: Create New Attributes\n');
  console.log(`   → ${analysis.summary.false_match} attributes are completely different`);
  console.log(`   → Keep SF's attribute with SF ID`);
  console.log(`   → Create new attributes for our misnamed ones`);
  console.log(`   → Send to SF for ID assignment\n`);
}

// Save detailed report
function saveReport(analysis) {
  const reportPath = path.join(AUDIT_DIR, 'attribute-mismatch-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  console.log(`\n💾 Detailed report saved to: ${reportPath}\n`);
}

// Main execution
function main() {
  const analysis = analyzeAttributeMismatches();
  displayResults(analysis);
  saveReport(analysis);
}

main();
