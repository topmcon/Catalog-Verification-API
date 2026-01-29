#!/usr/bin/env node
/**
 * Test Script: Research Attestation System
 * 
 * Verifies the 8-step mandatory checklist for "Procurement No Results"
 * Run: node scripts/test-research-attestation.js
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m'
};

// Import the compiled service
const { researchAttestationService } = require('../dist/services/research-attestation.service');
const { FIELD_STATUS_CODES, CHECKLIST_STEPS } = require('../dist/types/research-attestation.types');

console.log(`\n${colors.cyan}${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}   RESEARCH ATTESTATION SYSTEM - TEST SUITE${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    passed++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: Expected "${expected}", got "${actual}"`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// ============================================
// TEST 1: Create Empty Attestation
// ============================================
console.log(`\n${colors.yellow}Test Group 1: Attestation Creation${colors.reset}`);
console.log('─'.repeat(50));

test('Should create empty attestation with default values', () => {
  const attestation = researchAttestationService.createAttestation('test_field');
  assertEqual(attestation.fieldName, 'test_field', 'Field name mismatch');
  assertEqual(attestation.status, 'INCOMPLETE', 'Initial status should be INCOMPLETE');
  assertEqual(attestation.completedSteps, 0, 'Should have 0 completed steps');
  assertEqual(attestation.totalSteps, 8, 'Should have 8 total steps');
  assertEqual(attestation.completionRate, 0, 'Completion rate should be 0');
  assertEqual(attestation.canAttest, false, 'Should not be able to attest initially');
});

// ============================================
// TEST 2: Individual Step Recording
// ============================================
console.log(`\n${colors.yellow}Test Group 2: Step Recording${colors.reset}`);
console.log('─'.repeat(50));

test('Should record raw data review step', () => {
  const attestation = researchAttestationService.createAttestation('capacity_gallons');
  researchAttestationService.recordRawDataReview(attestation, {
    fieldsSearched: ['capacity', 'gallons', 'volume'],
    synonymsChecked: ['gal', 'gallon capacity'],
    searchAttempts: 3,
    found: false,
    notes: 'Searched all raw SF fields'
  });
  
  assertTrue(attestation.checklist.rawDataReview.completed, 'Raw data review should be completed');
  assertEqual(attestation.completedSteps, 1, 'Should have 1 completed step');
  assertEqual(attestation.completionRate, 12.5, 'Completion rate should be 12.5%');
});

test('Should record URL scraping step with found value', () => {
  const attestation = researchAttestationService.createAttestation('capacity_gallons');
  researchAttestationService.recordUrlScraping(attestation, {
    urlsChecked: ['https://example.com/product', 'https://manufacturer.com/specs'],
    found: true,
    valueFound: '60',
    source: 'https://manufacturer.com/specs',
    notes: 'Found in spec sheet'
  });
  
  assertTrue(attestation.checklist.urlScraping.completed, 'URL scraping should be completed');
  assertEqual(attestation.status, 'FOUND', 'Status should be FOUND');
  assertEqual(attestation.fieldValue, '60', 'Should have found value');
  assertEqual(attestation.foundSource, 'https://manufacturer.com/specs', 'Should record source');
});

test('Should record AI analysis reviews', () => {
  const attestation = researchAttestationService.createAttestation('weight');
  
  researchAttestationService.recordOpenAIReview(attestation, {
    aiConfidence: 85,
    found: true,
    suggestedValue: '150 lbs',
    reasoning: 'Found in product specifications'
  });
  
  researchAttestationService.recordXAIReview(attestation, {
    aiConfidence: 78,
    found: true,
    suggestedValue: '150 pounds',
    reasoning: 'Extracted from description'
  });
  
  assertTrue(attestation.checklist.openAIReview.completed, 'OpenAI review should be completed');
  assertTrue(attestation.checklist.xAIReview.completed, 'xAI review should be completed');
  assertEqual(attestation.completedSteps, 2, 'Should have 2 completed steps');
});

test('Should record smart inference step', () => {
  const attestation = researchAttestationService.createAttestation('installation_type');
  researchAttestationService.recordSmartInference(attestation, {
    aliasesChecked: ['freestanding', 'alcove', 'drop-in', 'undermount'],
    unitConversions: [],
    patternsMatched: ['Freestanding bathtub'],
    found: true,
    valueFound: 'Freestanding'
  });
  
  assertTrue(attestation.checklist.smartInference.completed, 'Smart inference should be completed');
  assertEqual(attestation.checklist.smartInference.aliasCount, 4, 'Should track alias count');
});

test('Should record image analysis step', () => {
  const attestation = researchAttestationService.createAttestation('dimensions');
  researchAttestationService.recordImageAnalysis(attestation, {
    imagesProcessed: 3,
    imageUrls: ['img1.jpg', 'img2.jpg', 'specs.pdf'],
    ocrTextExtracted: true,
    specSheetsAnalyzed: 1,
    labelsRead: 2,
    found: false,
    notes: 'No dimension data in images'
  });
  
  assertTrue(attestation.checklist.imageAnalysis.completed, 'Image analysis should be completed');
  assertEqual(attestation.checklist.imageAnalysis.imagesProcessed, 3, 'Should track images processed');
});

test('Should record cross-reference validation', () => {
  const attestation = researchAttestationService.createAttestation('material');
  researchAttestationService.recordCrossReference(attestation, {
    sourcesCompared: ['OpenAI', 'xAI', 'URL', 'Raw SF'],
    conflictsFound: false,
    consistencyScore: 95
  });
  
  assertTrue(attestation.checklist.crossReference.completed, 'Cross-reference should be completed');
  assertEqual(attestation.checklist.crossReference.sourceCount, 4, 'Should track source count');
});

// ============================================
// TEST 3: Full Research Cycle - Not Found
// ============================================
console.log(`\n${colors.yellow}Test Group 3: Complete Research Cycle - Procurement No Results${colors.reset}`);
console.log('─'.repeat(50));

test('Should mark as "Procurement No Results" when all steps complete but not found', () => {
  const attestation = researchAttestationService.createAttestation('btu_output');
  
  // Complete all 8 steps - none found data
  researchAttestationService.recordRawDataReview(attestation, { found: false, fieldsSearched: ['btu', 'heating'] });
  researchAttestationService.recordUrlScraping(attestation, { urlsChecked: ['url1', 'url2'], found: false });
  researchAttestationService.recordOpenAIReview(attestation, { aiConfidence: 30, found: false });
  researchAttestationService.recordXAIReview(attestation, { aiConfidence: 25, found: false });
  researchAttestationService.recordSmartInference(attestation, { aliasesChecked: ['btu', 'heating capacity'], found: false });
  researchAttestationService.recordImageAnalysis(attestation, { imagesProcessed: 2, found: false });
  researchAttestationService.recordCrossReference(attestation, { sourcesCompared: ['all'], conflictsFound: false });
  
  // Perform final verification
  researchAttestationService.performFinalVerification(attestation);
  
  assertEqual(attestation.status, 'FULLY_RESEARCHED', 'Status should be FULLY_RESEARCHED');
  assertEqual(attestation.fieldValue, FIELD_STATUS_CODES.PROCUREMENT_NO_RESULTS, 'Should return "Procurement No Results"');
  assertEqual(attestation.completionRate, 100, 'Completion rate should be 100%');
  assertTrue(attestation.canAttest, 'Should be able to attest');
  
  console.log(`  ${colors.dim}→ Field value: "${attestation.fieldValue}"${colors.reset}`);
});

// ============================================
// TEST 4: Full Research Cycle - Value Found
// ============================================
console.log(`\n${colors.yellow}Test Group 4: Complete Research Cycle - Value Found${colors.reset}`);
console.log('─'.repeat(50));

test('Should mark as FOUND when value discovered during research', () => {
  const attestation = researchAttestationService.createAttestation('flow_rate');
  
  // Step 1: Raw data - not found
  researchAttestationService.recordRawDataReview(attestation, { found: false });
  
  // Step 2: URL scraping - FOUND!
  researchAttestationService.recordUrlScraping(attestation, {
    urlsChecked: ['https://kohler.com/specs'],
    found: true,
    valueFound: '1.8 GPM',
    source: 'https://kohler.com/specs'
  });
  
  // Don't need to complete all steps once value is found
  assertEqual(attestation.status, 'FOUND', 'Status should be FOUND');
  assertEqual(attestation.fieldValue, '1.8 GPM', 'Should have the found value');
  assertEqual(attestation.foundAtStep, 'Step 2 - URL Scraping', 'Should record where found');
  
  console.log(`  ${colors.dim}→ Field value: "${attestation.fieldValue}" (found at ${attestation.foundAtStep})${colors.reset}`);
});

// ============================================
// TEST 5: Incomplete Research
// ============================================
console.log(`\n${colors.yellow}Test Group 5: Incomplete Research${colors.reset}`);
console.log('─'.repeat(50));

test('Should mark as "Research Incomplete" when steps are missing', () => {
  const attestation = researchAttestationService.createAttestation('voltage');
  
  // Only complete 3 steps
  researchAttestationService.recordRawDataReview(attestation, { found: false });
  researchAttestationService.recordOpenAIReview(attestation, { aiConfidence: 50, found: false });
  researchAttestationService.recordXAIReview(attestation, { aiConfidence: 45, found: false });
  
  // Try to finalize with incomplete steps
  researchAttestationService.performFinalVerification(attestation);
  
  assertEqual(attestation.status, 'INCOMPLETE', 'Status should be INCOMPLETE');
  assertEqual(attestation.fieldValue, FIELD_STATUS_CODES.RESEARCH_INCOMPLETE, 'Should return "Research Incomplete - Pending"');
  assertTrue(attestation.completionRate < 100, 'Completion rate should be less than 100%');
  assertTrue(attestation.incompleteReasons.length > 0, 'Should have incomplete reasons');
  
  console.log(`  ${colors.dim}→ Field value: "${attestation.fieldValue}"${colors.reset}`);
  console.log(`  ${colors.dim}→ Completion: ${attestation.completionRate.toFixed(0)}%${colors.reset}`);
  console.log(`  ${colors.dim}→ Missing: ${attestation.incompleteReasons.slice(0, 2).join(', ')}${colors.reset}`);
});

// ============================================
// TEST 6: Research Error (Conflicts)
// ============================================
console.log(`\n${colors.yellow}Test Group 6: Research Error (Conflicts)${colors.reset}`);
console.log('─'.repeat(50));

test('Should mark as "Research Error" when conflicts found', () => {
  const attestation = researchAttestationService.createAttestation('capacity');
  
  // Complete all steps but with conflicts
  researchAttestationService.recordRawDataReview(attestation, { found: false });
  researchAttestationService.recordUrlScraping(attestation, { urlsChecked: ['url1'], found: false });
  researchAttestationService.recordOpenAIReview(attestation, { aiConfidence: 80, found: true, suggestedValue: '60 gallons' });
  researchAttestationService.recordXAIReview(attestation, { aiConfidence: 75, found: true, suggestedValue: '72 gallons' });
  researchAttestationService.recordSmartInference(attestation, { aliasesChecked: [], found: false });
  researchAttestationService.recordImageAnalysis(attestation, { imagesProcessed: 0, found: false, notes: 'No images available' });
  
  // Cross-reference finds CONFLICT
  researchAttestationService.recordCrossReference(attestation, {
    sourcesCompared: ['OpenAI', 'xAI'],
    conflictsFound: true,
    conflictDetails: ['OpenAI: 60 gallons vs xAI: 72 gallons']
  });
  
  researchAttestationService.performFinalVerification(attestation);
  
  assertEqual(attestation.status, 'ERROR', 'Status should be ERROR');
  assertEqual(attestation.fieldValue, FIELD_STATUS_CODES.RESEARCH_ERROR, 'Should return "Research Error - Manual Review Required"');
  assertTrue(attestation.requiresHumanReview, 'Should require human review');
  
  console.log(`  ${colors.dim}→ Field value: "${attestation.fieldValue}"${colors.reset}`);
  console.log(`  ${colors.dim}→ Requires human review: ${attestation.requiresHumanReview}${colors.reset}`);
});

// ============================================
// TEST 7: Batch Attestation
// ============================================
console.log(`\n${colors.yellow}Test Group 7: Batch Attestation${colors.reset}`);
console.log('─'.repeat(50));

test('Should create batch attestation with summary', () => {
  // Create multiple field attestations
  const attestations = [];
  
  // Field 1: Found
  const att1 = researchAttestationService.createAttestation('brand');
  researchAttestationService.recordRawDataReview(att1, { found: true, valueFound: 'Kohler' });
  attestations.push(att1);
  
  // Field 2: Procurement No Results (complete ALL 8 steps)
  const att2 = researchAttestationService.createAttestation('warranty_years');
  researchAttestationService.recordRawDataReview(att2, { found: false, fieldsSearched: ['warranty'] });
  researchAttestationService.recordUrlScraping(att2, { urlsChecked: ['url1', 'url2'], found: false });
  researchAttestationService.recordOpenAIReview(att2, { aiConfidence: 30, found: false });
  researchAttestationService.recordXAIReview(att2, { aiConfidence: 25, found: false });
  researchAttestationService.recordSmartInference(att2, { aliasesChecked: ['warranty', 'guarantee'], found: false });
  researchAttestationService.recordImageAnalysis(att2, { imagesProcessed: 1, found: false, notes: 'No warranty info in images' });
  researchAttestationService.recordCrossReference(att2, { sourcesCompared: ['all'], conflictsFound: false });
  researchAttestationService.performFinalVerification(att2);
  attestations.push(att2);
  
  // Field 3: Incomplete
  const att3 = researchAttestationService.createAttestation('certifications');
  researchAttestationService.recordRawDataReview(att3, { found: false });
  researchAttestationService.performFinalVerification(att3);
  attestations.push(att3);
  
  // Create batch
  const batch = researchAttestationService.createBatchAttestation('PROD-123', 'SESSION-456', attestations);
  
  assertEqual(batch.totalFields, 3, 'Should have 3 total fields');
  assertEqual(batch.foundCount, 1, 'Should have 1 found');
  assertEqual(batch.notFoundCount, 1, 'Should have 1 not found (fully researched)');
  assertEqual(batch.incompleteCount, 1, 'Should have 1 incomplete');
  assertTrue(batch.humanReviewQueue.length > 0, 'Should have fields in human review queue');
  
  console.log(`  ${colors.dim}→ Total: ${batch.totalFields}, Found: ${batch.foundCount}, Not Found: ${batch.notFoundCount}, Incomplete: ${batch.incompleteCount}${colors.reset}`);
});

// ============================================
// TEST 8: Attestation Checkpoint Prompt
// ============================================
console.log(`\n${colors.yellow}Test Group 8: Claude Prompt Generation${colors.reset}`);
console.log('─'.repeat(50));

test('Should generate attestation checkpoint prompt', () => {
  const prompt = researchAttestationService.generateAttestationCheckpoint('capacity_gallons');
  
  assertTrue(prompt.includes('ATTESTATION CHECKPOINT'), 'Should include checkpoint header');
  assertTrue(prompt.includes('capacity_gallons'), 'Should include field name');
  assertTrue(prompt.includes('Step 1'), 'Should include step numbers');
  assertTrue(prompt.includes('Procurement No Results'), 'Should mention the status code');
  
  console.log(`  ${colors.dim}→ Prompt generated (${prompt.length} chars)${colors.reset}`);
});

// ============================================
// TEST 9: Webhook Formatting
// ============================================
console.log(`\n${colors.yellow}Test Group 9: Webhook Response Formatting${colors.reset}`);
console.log('─'.repeat(50));

test('Should format attestation for webhook response', () => {
  const attestation = researchAttestationService.createAttestation('material');
  researchAttestationService.recordRawDataReview(attestation, { found: true, valueFound: 'Acrylic' });
  
  const webhookFormat = researchAttestationService.formatForWebhook(attestation);
  
  assertTrue(webhookFormat.fieldName === 'material', 'Should include field name');
  assertTrue(webhookFormat.fieldValue === 'Acrylic', 'Should include field value');
  assertTrue(webhookFormat.researchAttestation !== undefined, 'Should include attestation details');
  assertTrue(webhookFormat.researchAttestation.status === 'FOUND', 'Should include status');
  
  console.log(`  ${colors.dim}→ Webhook format: { fieldName: "${webhookFormat.fieldName}", fieldValue: "${webhookFormat.fieldValue}", status: "${webhookFormat.researchAttestation.status}" }${colors.reset}`);
});

// ============================================
// TEST 10: Status Code Constants
// ============================================
console.log(`\n${colors.yellow}Test Group 10: Status Code Constants${colors.reset}`);
console.log('─'.repeat(50));

test('Should have correct status code values', () => {
  assertEqual(FIELD_STATUS_CODES.PROCUREMENT_NO_RESULTS, 'Procurement No Results', 'PROCUREMENT_NO_RESULTS mismatch');
  assertEqual(FIELD_STATUS_CODES.RESEARCH_INCOMPLETE, 'Research Incomplete - Pending', 'RESEARCH_INCOMPLETE mismatch');
  assertEqual(FIELD_STATUS_CODES.RESEARCH_ERROR, 'Research Error - Manual Review Required', 'RESEARCH_ERROR mismatch');
  
  console.log(`  ${colors.dim}→ PROCUREMENT_NO_RESULTS: "${FIELD_STATUS_CODES.PROCUREMENT_NO_RESULTS}"${colors.reset}`);
  console.log(`  ${colors.dim}→ RESEARCH_INCOMPLETE: "${FIELD_STATUS_CODES.RESEARCH_INCOMPLETE}"${colors.reset}`);
  console.log(`  ${colors.dim}→ RESEARCH_ERROR: "${FIELD_STATUS_CODES.RESEARCH_ERROR}"${colors.reset}`);
});

test('Should have all 8 checklist steps defined', () => {
  assertEqual(CHECKLIST_STEPS.length, 8, 'Should have exactly 8 steps');
  assertTrue(CHECKLIST_STEPS.includes('rawDataReview'), 'Should include rawDataReview');
  assertTrue(CHECKLIST_STEPS.includes('finalVerification'), 'Should include finalVerification');
  
  console.log(`  ${colors.dim}→ Steps: ${CHECKLIST_STEPS.join(', ')}${colors.reset}`);
});

// ============================================
// RESULTS
// ============================================
console.log(`\n${colors.cyan}${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}   TEST RESULTS${colors.reset}`);
console.log(`${colors.cyan}${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}`);

console.log(`\n  ${colors.green}Passed: ${passed}${colors.reset}`);
console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);
console.log(`  Total:  ${passed + failed}\n`);

if (failed === 0) {
  console.log(`${colors.green}${colors.bold}✓ All tests passed! Research Attestation System is working correctly.${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}${colors.bold}✗ Some tests failed. Please review the errors above.${colors.reset}\n`);
  process.exit(1);
}
