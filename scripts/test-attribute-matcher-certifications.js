#!/usr/bin/env node
const path = require('path');

async function testMatcher() {
  console.log('\n🔍 Testing PicklistMatcherService with "certifications"\n');
  
  try {
    // Import the singleton instance (lowercase)
    const picklistMatcherModule = require(path.join(__dirname, '../dist/services/picklist-matcher.service.js'));
    const picklistMatcher = picklistMatcherModule.default || picklistMatcherModule.picklistMatcher;
    
    console.log('✅ Loaded picklistMatcher singleton');
    console.log('📦 Matcher type:', typeof picklistMatcher);
    
    // Test 1: Without forceIdLookup
    console.log('\n--- Test 1: matchAttribute("certifications") ---');
    const result1 = picklistMatcher.matchAttribute('certifications');
    console.log('Result:', JSON.stringify(result1, null, 2));
    
    // Test 2: With forceIdLookup: true
    console.log('\n--- Test 2: matchAttribute("certifications", {forceIdLookup: true}) ---');
    const result2 = picklistMatcher.matchAttribute('certifications', { forceIdLookup: true });
    console.log('Result:', JSON.stringify(result2, null, 2));
    
    // Test 3: Check if initialized
    console.log('\n--- Test 3: Check initialization status ---');
    console.log('Initialized:', picklistMatcher.initialized);
    console.log('Attributes count:', picklistMatcher.attributes?.length || 0);
    
    // Test 4: Search for certifications in attributes array directly  
    if (picklistMatcher.attributes) {
      const certMatch = picklistMatcher.attributes.find(a => 
        a.attribute_name.toLowerCase() === 'certifications'
      );
      console.log('\n--- Test 4: Direct array search ---');
      console.log('Found in attributes array:', certMatch ? 'YES' : 'NO');
      if (certMatch) {
        console.log('  Name:', certMatch.attribute_name);
        console.log('  ID:', certMatch.attribute_id);
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testMatcher();
