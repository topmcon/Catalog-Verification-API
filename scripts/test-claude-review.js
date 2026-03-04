/**
 * TEST: Phase B - Claude Cross-Check (WITH REAL PICKLIST DATA)
 * Tests the Anthropic Claude API call for Final Review Stage
 * 
 * CRITICAL CHANGE: Claude now receives our actual picklist data (categories, types,
 * styles, departments) and must propose EXACT valid values from our system.
 * 
 * Test 1: GE Refrigerator Handle miscategorized as Cabinet Pull
 *   - Expected: FAIL with proposedCorrections using valid picklist values
 *   - Category fix should be a REAL category from our system
 *   - Type fix should be valid for the proposed category
 * 
 * Test 2: Good KitchenAid Refrigerator
 *   - Expected: PASS with all-null proposedCorrections
 * 
 * Run: node scripts/test-claude-review.js
 */

require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk').default;
const fs = require('fs');
const path = require('path');

// Load REAL picklist data (same as production system)
function loadPicklist(fileName) {
  const filePath = path.join(__dirname, '..', 'src', 'config', 'salesforce-picklists', fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const categories = loadPicklist('categories.json');
const categoryTypeMappingRaw = loadPicklist('category-type-mapping.json');
const categoryTypeMapping = categoryTypeMappingRaw.mappings || [];
const categoryStyleMapping = loadPicklist('category-style-mapping.json');

// Extract valid values
const validCategories = categories.map(c => c.category_name);
const validDepartments = [...new Set(categories.map(c => c.department))];
const validStyles = (categoryStyleMapping.universal_styles || []).map(s => s.style_name);

function getValidTypesForCategory(categoryName) {
  const mapping = categoryTypeMapping.find(m =>
    m.category_name.toLowerCase() === categoryName.toLowerCase()
  );
  return mapping && mapping.types ? mapping.types.map(t => t.type_name) : [];
}

function getDeptForCategory(categoryName) {
  const cat = categories.find(c => c.category_name === categoryName);
  return cat ? cat.department : null;
}

// Build category->department reference
const categoryDeptRef = validCategories.map(c => `${c} -> ${getDeptForCategory(c)}`).join('\n');

function buildReviewPrompt(rawProduct, aiResults, phaseAWarnings, category) {
  const validTypesForCat = getValidTypesForCategory(category);
  const correctDept = getDeptForCategory(category);

  // Try to get title schema
  let titleSchemaInfo = 'Not available in test environment';
  try {
    const schemaModule = require('../dist/config/title-schema-by-category');
    if (schemaModule.getCategoryTitleSchema) {
      const schema = schemaModule.getCategoryTitleSchema(category);
      if (schema) {
        titleSchemaInfo = `Template: ${schema.template}\nSlots: ${schema.slots.map(s => `${s.attribute}${s.required ? '*' : ''}`).join(', ')}\nExample: ${schema.exampleTitle}`;
      }
    }
  } catch(e) { /* not built yet - skip */ }

  return `You are performing a FINAL REVIEW of an AI-verified product catalog entry.
Your job is to catch mistakes AND PROPOSE CONCRETE SOLUTIONS using our actual system data.

TWO AIs (OpenAI GPT-4 and xAI Grok) already analyzed this product and reached consensus.
Your role: Find errors and provide EXACT corrected values from OUR picklists.

CRITICAL RULES:
- ALL suggested fixes MUST use values from the VALID OPTIONS sections below
- Do NOT invent categories, types, or departments - use ONLY what is listed
- If you propose a category change, also propose the correct department and valid types
- Every FAIL must include a complete proposed solution, not just what is wrong

===================================================================
VALID OPTIONS FROM OUR SYSTEM (Use ONLY these values):
===================================================================

VALID DEPARTMENTS (${validDepartments.length} total):
${validDepartments.join(', ')}

VALID CATEGORIES BY DEPARTMENT:
${categoryDeptRef}

VALID TYPES FOR "${category}" (current category):
${validTypesForCat.length > 0 ? validTypesForCat.join(', ') : 'No types defined for this category'}

VALID STYLES (universal):
${validStyles.join(', ')}

CORRECT DEPARTMENT FOR "${category}": ${correctDept || 'NOT FOUND'}

TITLE SCHEMA FOR "${category}":
${titleSchemaInfo}

===================================================================
RAW PRODUCT DATA (Ground Truth):
===================================================================

Title: "${rawProduct.Product_Title_Web_Retailer || ''}"
Ferguson Title: "${rawProduct.Ferguson_Title || 'N/A'}"
Description: "${(rawProduct.Product_Description_Web_Retailer || '').substring(0, 400)}"
Brand: "${rawProduct.Brand_Web_Retailer || ''}"
Model: "${rawProduct.Model_Number_Web_Retailer || ''}"
Spec Table: ${rawProduct.Specification_Table || 'N/A'}

===================================================================
AI VERIFICATION RESULTS (What both AIs agreed on):
===================================================================

Category: ${aiResults.category}
Department: ${aiResults.department}
Type: ${aiResults.type}
Style: ${aiResults.style}
Brand: ${aiResults.brand}
Generated Title: ${aiResults.generatedTitle}

===================================================================
AUTOMATED VALIDATION WARNINGS (Phase A detected these):
===================================================================

${phaseAWarnings.join('\n')}

===================================================================
YOUR TASK - Review AND Propose Solutions:
===================================================================

1. **Category**: Does "${aiResults.category}" fit the raw data? If wrong, which VALID CATEGORY from our list is correct?
2. **Department**: Does "${aiResults.department}" match? If wrong, use the CORRECT DEPARTMENT for your proposed category
3. **Type**: Is "${aiResults.type}" valid? If wrong, pick from VALID TYPES for the correct category
4. **Accessory Detection**: If raw data shows "for [appliance]", "replacement", "compatible with" -> Type should be "Accessory"
5. **Title**: Does "${aiResults.generatedTitle}" represent this product? If wrong, propose a title using the TITLE SCHEMA slots
6. **Style**: Is "${aiResults.style}" reasonable for this product?

===================================================================
RESPONSE FORMAT (JSON ONLY):
===================================================================

{
  "reviewStatus": "PASS" | "FLAG" | "FAIL",
  "confidenceInResults": 0-100,
  "issues": [
    {
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "field": "category" | "department" | "type" | "style" | "title",
      "currentValue": "what AI selected",
      "issue": "Clear description of the problem",
      "evidence": "Direct quote from raw data proving the error",
      "suggestedFix": "EXACT value from our valid picklist options above"
    }
  ],
  "proposedCorrections": {
    "category": "exact valid category name or null if correct",
    "department": "exact valid department or null if correct",
    "type": "exact valid type for the proposed category or null if correct",
    "style": "exact valid style or null if correct",
    "title": "proposed corrected title using schema slots or null if correct"
  },
  "reasoning": "Brief explanation of your overall assessment and WHY these corrections are needed"
}

RULES:
- proposedCorrections values MUST come from the VALID OPTIONS listed above
- If a field is correct, set it to null in proposedCorrections
- Only flag issues with CLEAR EVIDENCE from raw data
- If results look correct, return "PASS" with empty issues and all-null proposedCorrections
- For FAIL: you MUST provide complete proposedCorrections - never fail without a solution
- Return ONLY the JSON object, no other text`;
}

async function testClaudeReview() {
  console.log('\n===============================================================');
  console.log('PHASE B TEST: Claude Cross-Check (WITH REAL PICKLIST DATA)');
  console.log('===============================================================\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }
  console.log(`API Key: ${apiKey.substring(0, 15)}...`);
  console.log(`Loaded: ${validCategories.length} categories, ${validDepartments.length} departments, ${validStyles.length} universal styles`);

  const anthropic = new Anthropic({ apiKey });

  // ===============================================================
  // TEST 1: GE Refrigerator Handle miscategorized as Cabinet Pull
  // ===============================================================
  console.log('\n---------------------------------------------------------------');
  console.log('TEST 1: GE Refrigerator Handle (Miscategorized as Cabinet Pull)');
  console.log('Expected: FAIL with valid proposedCorrections');
  console.log('---------------------------------------------------------------\n');

  const rawProduct1 = {
    Product_Title_Web_Retailer: 'GE Refrigerator Door Handle - Stainless Steel',
    Product_Description_Web_Retailer: 'Replacement door handle for GE refrigerators, compatible with models GFSS6KKY, GSS25GSH. Stainless steel finish. Easy installation.',
    Brand_Web_Retailer: 'GE',
    Model_Number_Web_Retailer: 'WR12X10877',
    Specification_Table: 'Compatible: GE Refrigerators, Material: Stainless Steel, Type: Replacement Part'
  };

  const aiResults1 = {
    category: 'Cabinet Pull',
    department: 'Hardware',
    type: 'Not Applicable',
    style: 'Contemporary',
    brand: 'GE',
    generatedTitle: 'GE Stainless Steel Cabinet Pull'
  };

  const warnings1 = [
    '[HIGH] category: Selected category "Cabinet Pull" but raw data lacks supporting keywords (cabinet pull, drawer pull, cabinet handle)',
    '[HIGH] type: Accessory pattern found ("for GE refrigerators", "replacement", "compatible with") but Type != "Accessory"',
    '[MEDIUM] title: Title too short (31 chars, recommended 60-150)'
  ];

  const prompt1 = buildReviewPrompt(rawProduct1, aiResults1, warnings1, aiResults1.category);

  const startTime1 = Date.now();
  try {
    const response1 = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt1 }]
    });

    const duration1 = Date.now() - startTime1;
    const text1 = response1.content[0].type === 'text' ? response1.content[0].text : '';
    
    console.log(`Response in ${duration1}ms`);
    console.log(`  Model: ${response1.model}`);
    console.log(`  Input: ${response1.usage.input_tokens} tokens | Output: ${response1.usage.output_tokens} tokens`);
    console.log(`  Cost: ~$${((response1.usage.input_tokens * 3 + response1.usage.output_tokens * 15) / 1000000).toFixed(4)}`);

    const cleaned1 = text1.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed1 = JSON.parse(cleaned1);

    console.log(`\n  Review Status: ${parsed1.reviewStatus === 'FAIL' ? 'FAIL' : parsed1.reviewStatus === 'FLAG' ? 'FLAG' : 'PASS'} ${parsed1.reviewStatus}`);
    console.log(`  Confidence: ${parsed1.confidenceInResults}%`);
    console.log(`  Issues: ${parsed1.issues?.length || 0}`);
    console.log(`  Reasoning: ${parsed1.reasoning}\n`);

    // Show issues
    if (parsed1.issues?.length > 0) {
      console.log('  Issues Found:');
      parsed1.issues.forEach((issue, i) => {
        console.log(`    ${i + 1}. [${issue.severity}] ${issue.field}: ${issue.issue}`);
        console.log(`       Evidence: "${issue.evidence}"`);
        console.log(`       Fix: ${issue.suggestedFix}`);
      });
    }

    // Show proposed corrections
    console.log('\n  Proposed Corrections:');
    const pc = parsed1.proposedCorrections;
    if (pc) {
      console.log(`    Category:   ${pc.category || '(no change)'}`);
      console.log(`    Department: ${pc.department || '(no change)'}`);
      console.log(`    Type:       ${pc.type || '(no change)'}`);
      console.log(`    Style:      ${pc.style || '(no change)'}`);
      console.log(`    Title:      ${pc.title || '(no change)'}`);
    } else {
      console.log('    No proposedCorrections in response!');
    }

    // ===============================================================
    // VALIDATE: Are the proposed corrections VALID picklist values?
    // ===============================================================
    console.log('\n  --- PICKLIST VALIDATION ---');
    let allValid = true;

    if (pc?.category) {
      const catValid = validCategories.includes(pc.category);
      console.log(`    Category "${pc.category}": ${catValid ? 'VALID (exists in picklist)' : 'INVALID (not in our categories.json)'}`);
      if (!catValid) allValid = false;

      // If category valid, check department
      if (catValid && pc.department) {
        const expectedDept = getDeptForCategory(pc.category);
        const deptMatch = pc.department === expectedDept;
        console.log(`    Department "${pc.department}" for "${pc.category}": ${deptMatch ? 'CORRECT' : `WRONG (should be "${expectedDept}")`}`);
        if (!deptMatch) allValid = false;
      }

      // If category valid, check type
      if (catValid && pc.type) {
        const validTypesForProposed = getValidTypesForCategory(pc.category);
        const typeValid = validTypesForProposed.includes(pc.type);
        console.log(`    Type "${pc.type}" for "${pc.category}": ${typeValid ? 'VALID' : `INVALID (valid: ${validTypesForProposed.join(', ')})`}`);
        if (!typeValid) allValid = false;
      }
    }

    if (pc?.style) {
      const styleValid = validStyles.includes(pc.style);
      console.log(`    Style "${pc.style}": ${styleValid ? 'VALID' : 'INVALID (not in universal styles)'}`);
      if (!styleValid) allValid = false;
    }

    console.log(`\n  ${allValid ? 'ALL PROPOSED VALUES ARE VALID PICKLIST ENTRIES' : 'SOME PROPOSED VALUES WERE INVALID'}`);

    // Expected behavior checks
    console.log('\n  --- EXPECTED vs ACTUAL ---');
    const statusOk = parsed1.reviewStatus === 'FAIL';
    console.log(`    Status: Expected FAIL, Got ${parsed1.reviewStatus} ${statusOk ? 'OK' : 'MISMATCH'}`);
    
    const hasProposedCorrections = pc && (pc.category || pc.department || pc.type);
    console.log(`    Has Proposed Corrections: ${hasProposedCorrections ? 'YES' : 'NO'}`);
    
    const notGeneric = pc?.category && pc.category !== 'Appliance Parts';
    console.log(`    Not Generic Fix: ${notGeneric ? 'YES (used real picklist value)' : 'Still using generic values'}`);

    console.log(`\n  TEST 1 RESULT: ${statusOk && hasProposedCorrections && allValid ? 'PASSED' : 'NEEDS REVIEW'}`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }

  // ===============================================================
  // TEST 2: Good product (should PASS)
  // ===============================================================
  console.log('\n---------------------------------------------------------------');
  console.log('TEST 2: Good KitchenAid Refrigerator (Should PASS)');
  console.log('---------------------------------------------------------------\n');

  const rawProduct2 = {
    Product_Title_Web_Retailer: 'KitchenAid 48-Inch Built-In French Door Refrigerator',
    Product_Description_Web_Retailer: 'Premium refrigerator with 29.5 cubic feet capacity, stainless steel finish, LED lighting, Ice maker included.',
    Brand_Web_Retailer: 'KitchenAid',
    Model_Number_Web_Retailer: 'KBSD708MSS',
    Specification_Table: 'Width: 48 inches, Capacity: 29.5 Cu. Ft., Built-In: Yes, Finish: Stainless Steel'
  };

  const aiResults2 = {
    category: 'Refrigerator',
    department: 'Appliances',
    type: 'Not Applicable',
    style: 'Contemporary',
    brand: 'KitchenAid',
    generatedTitle: 'KitchenAid 48-Inch Built-In French Door Refrigerator - 29.5 Cu. Ft. Stainless Steel'
  };

  const warnings2 = ['No automated validation warnings'];

  const prompt2 = buildReviewPrompt(rawProduct2, aiResults2, warnings2, aiResults2.category);

  const startTime2 = Date.now();
  try {
    const response2 = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt2 }]
    });

    const duration2 = Date.now() - startTime2;
    const text2 = response2.content[0].type === 'text' ? response2.content[0].text : '';

    console.log(`Response in ${duration2}ms`);
    console.log(`  Tokens: ${response2.usage.input_tokens}/${response2.usage.output_tokens}`);
    console.log(`  Cost: ~$${((response2.usage.input_tokens * 3 + response2.usage.output_tokens * 15) / 1000000).toFixed(4)}`);

    const cleaned2 = text2.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed2 = JSON.parse(cleaned2);

    console.log(`\n  Review Status: ${parsed2.reviewStatus} ${parsed2.reviewStatus}`);
    console.log(`  Confidence: ${parsed2.confidenceInResults}%`);
    console.log(`  Issues: ${parsed2.issues?.length || 0}`);
    console.log(`  Reasoning: ${parsed2.reasoning}`);

    const pc2 = parsed2.proposedCorrections;
    if (pc2) {
      const allNull = !pc2.category && !pc2.department && !pc2.type && !pc2.style && !pc2.title;
      console.log(`\n  Proposed Corrections: ${allNull ? 'All null (correct - no changes needed)' : 'Has corrections (unexpected for good product)'}`);
      if (!allNull) {
        console.log(`    Category: ${pc2.category || 'null'}, Department: ${pc2.department || 'null'}, Type: ${pc2.type || 'null'}, Style: ${pc2.style || 'null'}`);
      }
    }

    const passOk = parsed2.reviewStatus === 'PASS';
    console.log(`\n  TEST 2 RESULT: ${passOk ? 'PASSED' : 'Got ' + parsed2.reviewStatus + ' instead of PASS'}`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }

  console.log('\n===============================================================');
  console.log('ALL PHASE B TESTS COMPLETE');
  console.log('===============================================================\n');
}

testClaudeReview().catch(console.error);
