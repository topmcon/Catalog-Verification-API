#!/usr/bin/env node
/**
 * FIELD MAPPING REFERENCE SYNC AUDIT
 * ====================================
 * 
 * Validates that docs/RAW-FIELD-MAPPING-REFERENCE.md stays in sync with actual code.
 * 
 * Checks:
 *   1. Every FIELD_ALIASES key in smart-field-inference.service.ts is documented
 *   2. Every ATTRIBUTE_ALIASES key in picklist-matcher.service.ts is documented
 *   3. Every extract*FromTexts() function in dual-ai-verification.service.ts is documented
 *   4. Every rawProduct.* field in ai-prompt-builder.service.ts is documented
 *   5. Every AI_* output field in sanitizedPrimaryAttributes is documented
 * 
 * Usage:
 *   node scripts/audit-field-mapping-reference.js          # Full audit
 *   node scripts/audit-field-mapping-reference.js --check   # Exit 1 if out of sync
 * 
 * Integrates as Check #8 in pre-deploy-validate-all.sh
 */

const fs = require('fs');
const path = require('path');

const CHECK_MODE = process.argv.includes('--check');

const PROJECT_ROOT = path.join(__dirname, '..');
const REFERENCE_DOC = path.join(PROJECT_ROOT, 'docs/RAW-FIELD-MAPPING-REFERENCE.md');
const FIELD_ALIASES_FILE = path.join(PROJECT_ROOT, 'src/services/smart-field-inference.service.ts');
const ATTRIBUTE_ALIASES_FILE = path.join(PROJECT_ROOT, 'src/services/picklist-matcher.service.ts');
const DUAL_AI_FILE = path.join(PROJECT_ROOT, 'src/services/dual-ai-verification.service.ts');
const PROMPT_BUILDER_FILE = path.join(PROJECT_ROOT, 'src/services/ai-prompt-builder.service.ts');

let errors = 0;
let warnings = 0;

// ============================================================================
// UTILITY
// ============================================================================

function loadFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ File not found: ${filePath}`);
    errors++;
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// ============================================================================
// CHECK 1: FIELD_ALIASES keys documented
// ============================================================================

function checkFieldAliases(refDoc) {
  console.log('\n🔗 Check 1: FIELD_ALIASES keys documented in reference...');
  
  const source = loadFile(FIELD_ALIASES_FILE);
  if (!source) return;
  
  // Extract all FIELD_ALIASES keys from the source
  // Pattern: 'key_name': [ or "key_name": [
  const aliasKeys = [];
  const aliasRegex = /^  ['"]([a-z_]+)['"]\s*:\s*\[/gm;
  let match;
  
  // Only scan the FIELD_ALIASES block
  const aliasStart = source.indexOf('export const FIELD_ALIASES');
  const aliasEnd = source.indexOf('};', aliasStart);
  const aliasBlock = source.substring(aliasStart, aliasEnd);
  
  while ((match = aliasRegex.exec(aliasBlock)) !== null) {
    aliasKeys.push(match[1]);
  }
  
  const missing = [];
  for (const key of aliasKeys) {
    // Check if the key appears in the reference doc (case-insensitive, with backticks or in table)
    const keyPattern = new RegExp(`\\b${key.replace(/_/g, '[_\\\\s]')}\\b`, 'i');
    if (!keyPattern.test(refDoc)) {
      missing.push(key);
    }
  }
  
  console.log(`  Found ${aliasKeys.length} FIELD_ALIASES keys in code`);
  
  if (missing.length === 0) {
    console.log(`  ✅ All ${aliasKeys.length} FIELD_ALIASES keys are documented`);
  } else {
    console.log(`  ❌ ${missing.length} FIELD_ALIASES key(s) NOT in reference doc:`);
    missing.forEach(k => console.log(`     - ${k}`));
    errors += missing.length;
  }
  
  return aliasKeys;
}

// ============================================================================
// CHECK 2: ATTRIBUTE_ALIASES keys documented
// ============================================================================

function checkAttributeAliases(refDoc) {
  console.log('\n🔗 Check 2: ATTRIBUTE_ALIASES keys documented in reference...');
  
  const source = loadFile(ATTRIBUTE_ALIASES_FILE);
  if (!source) return;
  
  // Extract all ATTRIBUTE_ALIASES keys
  const aliasKeys = [];
  const aliasRegex = /^\s+['"]([^'"]+)['"]\s*:\s*['"]/gm;
  
  const aliasStart = source.indexOf('const ATTRIBUTE_ALIASES');
  const aliasEnd = source.indexOf('};', aliasStart);
  const aliasBlock = source.substring(aliasStart, aliasEnd);
  
  let match;
  while ((match = aliasRegex.exec(aliasBlock)) !== null) {
    aliasKeys.push(match[1]);
  }
  
  // De-duplicate (some aliases map to same canonical)
  const uniqueKeys = [...new Set(aliasKeys)];
  
  const missing = [];
  for (const key of uniqueKeys) {
    // Escape special regex chars in key
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!refDoc.includes(key)) {
      missing.push(key);
    }
  }
  
  console.log(`  Found ${uniqueKeys.length} ATTRIBUTE_ALIASES entries in code`);
  
  if (missing.length === 0) {
    console.log(`  ✅ All ${uniqueKeys.length} ATTRIBUTE_ALIASES entries are documented`);
  } else if (missing.length <= 5) {
    console.log(`  ⚠️  ${missing.length} ATTRIBUTE_ALIASES entry/entries not found in doc:`);
    missing.forEach(k => console.log(`     - "${k}"`));
    warnings += missing.length;
  } else {
    console.log(`  ❌ ${missing.length} ATTRIBUTE_ALIASES entries NOT in reference doc:`);
    missing.slice(0, 10).forEach(k => console.log(`     - "${k}"`));
    if (missing.length > 10) console.log(`     ... and ${missing.length - 10} more`);
    errors += missing.length;
  }
  
  return uniqueKeys;
}

// ============================================================================
// CHECK 3: Extract*FromTexts functions documented
// ============================================================================

function checkExtractors(refDoc) {
  console.log('\n🔗 Check 3: Extractor functions documented in reference...');
  
  const source = loadFile(DUAL_AI_FILE);
  if (!source) return;
  
  // Find all extract*FromTexts function declarations
  const extractorRegex = /const\s+(extract\w+FromTexts)\s*=/g;
  const extractors = [];
  let match;
  
  while ((match = extractorRegex.exec(source)) !== null) {
    extractors.push(match[1]);
  }
  
  const missing = [];
  for (const name of extractors) {
    if (!refDoc.includes(name)) {
      missing.push(name);
    }
  }
  
  console.log(`  Found ${extractors.length} extract*FromTexts() functions in code`);
  
  if (missing.length === 0) {
    console.log(`  ✅ All ${extractors.length} extractor functions are documented`);
  } else {
    console.log(`  ❌ ${missing.length} extractor(s) NOT in reference doc:`);
    missing.forEach(n => console.log(`     - ${n}()`));
    errors += missing.length;
  }
  
  return extractors;
}

// ============================================================================
// CHECK 4: AI prompt builder raw fields documented
// ============================================================================

function checkPromptFields(refDoc) {
  console.log('\n🔗 Check 4: AI prompt builder rawProduct fields documented...');
  
  const source = loadFile(PROMPT_BUILDER_FILE);
  if (!source) return;
  
  // Extract all rawProduct.FieldName references from the prompt template section (first 120 lines)
  const promptSection = source.split('\n').slice(0, 120).join('\n');
  const fieldRegex = /rawProduct\.([A-Za-z_]+)/g;
  const fields = new Set();
  let match;
  
  while ((match = fieldRegex.exec(promptSection)) !== null) {
    fields.add(match[1]);
  }
  
  const missing = [];
  for (const field of fields) {
    if (!refDoc.includes(field)) {
      missing.push(field);
    }
  }
  
  console.log(`  Found ${fields.size} rawProduct.* fields in AI prompt builder`);
  
  if (missing.length === 0) {
    console.log(`  ✅ All ${fields.size} prompt fields are documented`);
  } else {
    console.log(`  ❌ ${missing.length} prompt field(s) NOT in reference doc:`);
    missing.forEach(f => console.log(`     - rawProduct.${f}`));
    errors += missing.length;
  }
  
  return [...fields];
}

// ============================================================================
// CHECK 5: AI_* output fields documented
// ============================================================================

function checkOutputFields(refDoc) {
  console.log('\n🔗 Check 5: AI_* output fields documented in reference...');
  
  const source = loadFile(DUAL_AI_FILE);
  if (!source) return;
  
  // Find the sanitizedPrimaryAttributes block and extract AI_* field names
  // Look for patterns like: AI_Brand:, AI_Color:, AI_Width:, etc.
  const fieldRegex = /^\s+(AI_[A-Za-z_]+)\s*:/gm;
  const outputFields = new Set();
  let match;
  
  while ((match = fieldRegex.exec(source)) !== null) {
    outputFields.add(match[1]);
  }
  
  const missing = [];
  for (const field of outputFields) {
    if (!refDoc.includes(field)) {
      missing.push(field);
    }
  }
  
  console.log(`  Found ${outputFields.size} AI_* output fields in code`);
  
  if (missing.length === 0) {
    console.log(`  ✅ All ${outputFields.size} output fields are documented`);
  } else {
    console.log(`  ❌ ${missing.length} output field(s) NOT in reference doc:`);
    missing.forEach(f => console.log(`     - ${f}`));
    errors += missing.length;
  }
  
  return [...outputFields];
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║          FIELD MAPPING REFERENCE SYNC AUDIT                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  
  // Load reference document
  if (!fs.existsSync(REFERENCE_DOC)) {
    console.error('\n❌ Reference document not found: docs/RAW-FIELD-MAPPING-REFERENCE.md');
    console.error('   Create it first, then re-run this audit.');
    process.exit(1);
  }
  
  const refDoc = fs.readFileSync(REFERENCE_DOC, 'utf-8');
  console.log(`\nReference doc: ${refDoc.split('\n').length} lines`);
  
  // Run all checks
  const fieldAliasKeys = checkFieldAliases(refDoc);
  const attributeAliasKeys = checkAttributeAliases(refDoc);
  const extractors = checkExtractors(refDoc);
  const promptFields = checkPromptFields(refDoc);
  const outputFields = checkOutputFields(refDoc);
  
  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  FIELD_ALIASES keys:      ${fieldAliasKeys ? fieldAliasKeys.length : 0}`);
  console.log(`  ATTRIBUTE_ALIASES keys:   ${attributeAliasKeys ? attributeAliasKeys.length : 0}`);
  console.log(`  Extractor functions:      ${extractors ? extractors.length : 0}`);
  console.log(`  AI prompt fields:         ${promptFields ? promptFields.length : 0}`);
  console.log(`  AI_* output fields:       ${outputFields ? outputFields.length : 0}`);
  console.log('');
  
  if (errors === 0 && warnings === 0) {
    console.log('✅ FIELD MAPPING REFERENCE IS IN SYNC WITH CODE');
  } else if (errors === 0) {
    console.log(`⚠️  ${warnings} warning(s) — reference doc may need minor updates`);
  } else {
    console.log(`❌ ${errors} error(s), ${warnings} warning(s) — reference doc OUT OF SYNC`);
    console.log('');
    console.log('To fix: Update docs/RAW-FIELD-MAPPING-REFERENCE.md with the missing entries.');
    console.log('See "How to Add a New Field" (Section 11) in the reference doc.');
  }
  
  if (CHECK_MODE && errors > 0) {
    process.exit(1);
  }
}

main();
