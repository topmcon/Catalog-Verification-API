#!/usr/bin/env node
/**
 * Test Type prompt functions
 */

const {
  getAllCategoriesWithTypesForPrompt,
  getTypeHierarchyExplanation
} = require('../dist/config/type-prompts');

console.log('Testing Type prompt functions...\n');

try {
  console.log('1. Testing getTypeHierarchyExplanation()...');
  const hierarchy = getTypeHierarchyExplanation();
  console.log(`✅ Success - Length: ${hierarchy.length} characters`);
  console.log(`First 200 chars: ${hierarchy.substring(0, 200)}...\n`);
  
  console.log('2. Testing getAllCategoriesWithTypesForPrompt()...');
  const categoryTypes = getAllCategoriesWithTypesForPrompt();
  console.log(`✅ Success - Length: ${categoryTypes.length} characters`);
  console.log(`First 200 chars: ${categoryTypes.substring(0, 200)}...\n`);
  
  console.log('✅ All Type prompt functions working correctly!');
  
} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}
