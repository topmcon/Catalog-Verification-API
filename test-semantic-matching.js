/**
 * Test Semantic Picklist Matching
 * Demonstrates that all 4 picklist matchers work across different AI outputs
 */

const picklistMatcher = require('./dist/services/picklist-matcher.service').default;
const { matchTypeToPicklist } = require('./dist/services/type-matcher.service');

console.log('='.repeat(80));
console.log('SEMANTIC PICKLIST MATCHING TEST');
console.log('='.repeat(80));

// Test 1: Brand Matching (semantic equivalence)
console.log('\n1. BRAND MATCHING TEST');
console.log('-'.repeat(80));
const brandTests = [
  { openai: 'Fischer & Paykel', xai: 'Fisher & Paykel' },
  { openai: 'KOHLER', xai: 'Kohler' },
  { openai: 'Delta Faucet', xai: 'Delta' }
];

brandTests.forEach(test => {
  const openaiMatch = picklistMatcher.matchBrand(test.openai);
  const xaiMatch = picklistMatcher.matchBrand(test.xai);
  
  const sameId = openaiMatch.matched && xaiMatch.matched && 
                 openaiMatch.matchedValue?.brand_id === xaiMatch.matchedValue?.brand_id;
  
  console.log(`OpenAI: "${test.openai}" → ${openaiMatch.matched ? openaiMatch.matchedValue.brand_name : 'NO MATCH'}`);
  console.log(`xAI:    "${test.xai}" → ${xaiMatch.matched ? xaiMatch.matchedValue.brand_name : 'NO MATCH'}`);
  console.log(`Result: ${sameId ? '✅ SEMANTIC MATCH (same brand_id)' : '❌ Different brands'}`);
  console.log('');
});

// Test 2: Category Matching (semantic equivalence)
console.log('\n2. CATEGORY MATCHING TEST');
console.log('-'.repeat(80));
const categoryTests = [
  { openai: 'Ovens', xai: 'Oven' },
  { openai: 'Kitchen Faucet', xai: 'Kitchen Faucets' },
  { openai: 'Refrigerator', xai: 'Refrigerators' }
];

categoryTests.forEach(test => {
  const openaiMatch = picklistMatcher.matchCategory(test.openai);
  const xaiMatch = picklistMatcher.matchCategory(test.xai);
  
  const sameId = openaiMatch.matched && xaiMatch.matched && 
                 openaiMatch.matchedValue?.category_id === xaiMatch.matchedValue?.category_id;
  
  console.log(`OpenAI: "${test.openai}" → ${openaiMatch.matched ? openaiMatch.matchedValue.category_name : 'NO MATCH'}`);
  console.log(`xAI:    "${test.xai}" → ${xaiMatch.matched ? xaiMatch.matchedValue.category_name : 'NO MATCH'}`);
  console.log(`Result: ${sameId ? '✅ SEMANTIC MATCH (same category_id)' : '❌ Different categories'}`);
  console.log('');
});

// Test 3: Type Matching (alias resolution + semantic equivalence)
console.log('\n3. TYPE MATCHING TEST (Category-Aware with Aliases)');
console.log('-'.repeat(80));
const typeTests = [
  { openai: 'Built-in Oven', xai: 'Single', category: 'Oven' },
  { openai: 'Wall Oven', xai: 'Single', category: 'Oven' },
  { openai: 'Side by Side', xai: 'Side-by-Side', category: 'Refrigerator' },
  { openai: 'French Door Refrigerator', xai: 'French Door', category: 'Refrigerator' }
];

typeTests.forEach(test => {
  const openaiMatch = matchTypeToPicklist(test.openai, test.category);
  const xaiMatch = matchTypeToPicklist(test.xai, test.category);
  
  const sameId = openaiMatch.matched && xaiMatch.matched && 
                 openaiMatch.matchedValue?.type_id === xaiMatch.matchedValue?.type_id;
  
  console.log(`Category: ${test.category}`);
  console.log(`OpenAI: "${test.openai}" → ${openaiMatch.matched ? openaiMatch.matchedValue.type_name : 'NO MATCH'} (method: ${openaiMatch.matchMethod})`);
  console.log(`xAI:    "${test.xai}" → ${xaiMatch.matched ? xaiMatch.matchedValue.type_name : 'NO MATCH'} (method: ${xaiMatch.matchMethod})`);
  console.log(`Result: ${sameId ? '✅ SEMANTIC MATCH (same type_id)' : '❌ Different types'}`);
  console.log('');
});

// Test 4: Style Matching (semantic equivalence)
console.log('\n4. STYLE MATCHING TEST');
console.log('-'.repeat(80));
const styleTests = [
  { openai: 'Contemporary', xai: 'Contemporary' },
  { openai: 'Modern', xai: 'Modern' },
  { openai: 'Traditional', xai: 'Traditional' }
];

styleTests.forEach(test => {
  const openaiMatch = picklistMatcher.matchStyle(test.openai);
  const xaiMatch = picklistMatcher.matchStyle(test.xai);
  
  const sameId = openaiMatch.matched && xaiMatch.matched && 
                 openaiMatch.matchedValue?.style_id === xaiMatch.matchedValue?.style_id;
  
  console.log(`OpenAI: "${test.openai}" → ${openaiMatch.matched ? openaiMatch.matchedValue.style_name : 'NO MATCH'}`);
  console.log(`xAI:    "${test.xai}" → ${xaiMatch.matched ? xaiMatch.matchedValue.style_name : 'NO MATCH'}`);
  console.log(`Result: ${sameId ? '✅ SEMANTIC MATCH (same style_id)' : '❌ Different styles'}`);
  console.log('');
});

console.log('='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
