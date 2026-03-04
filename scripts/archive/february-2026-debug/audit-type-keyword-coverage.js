#!/usr/bin/env node
/**
 * TYPE KEYWORD COVERAGE AUDIT
 * ============================
 * Related to Finding #014: Missing keyword mappings for valid types
 * 
 * Purpose: Identify types in types.json that lack keyword mappings in type-matcher.service.ts
 * 
 * This script:
 * 1. Loads all types from types.json (~2816 types)
 * 2. Parses keyword aliases from type-matcher.service.ts (TYPE_ALIASES object)
 * 3. Parses semantic patterns from type-matcher.service.ts (SEMANTIC_TYPE_PATTERNS array)
 * 4. Reports types WITHOUT any keyword/pattern mappings
 * 5. Groups results by category for easy review
 * 6. Suggests potential keywords based on type names
 */

const fs = require('fs');
const path = require('path');

// File paths
const TYPES_JSON_PATH = path.join(__dirname, '../src/config/salesforce-picklists/types.json');
const TYPE_MATCHER_PATH = path.join(__dirname, '../src/services/type-matcher.service.ts');

/**
 * Load and parse types.json
 */
function loadTypes() {
  const content = fs.readFileSync(TYPES_JSON_PATH, 'utf8');
  return JSON.parse(content);
}

/**
 * Parse TYPE_ALIASES from type-matcher.service.ts
 * Returns Map: typeName -> array of keywords
 */
function parseTypeAliases(content) {
  const aliasMap = new Map(); // typeName -> [keywords]
  
  // Find const TYPE_ALIASES: Record<string, Record<string, string>> = {
  const aliasStart = content.indexOf('const TYPE_ALIASES');
  if (aliasStart === -1) {
    console.error('❌ Could not find TYPE_ALIASES in type-matcher.service.ts');
    return aliasMap;
  }
  
  // Extract the TYPE_ALIASES object (until closing };)
  let braceCount = 0;
  let aliasEnd = aliasStart;
  let foundFirstBrace = false;
  
  for (let i = aliasStart; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++;
      foundFirstBrace = true;
    } else if (content[i] === '}') {
      braceCount--;
      if (foundFirstBrace && braceCount === 0) {
        aliasEnd = i + 1;
        break;
      }
    }
  }
  
  const aliasSection = content.substring(aliasStart, aliasEnd);
  
  // Parse each line like: 'french door': { 'Refrigerator': 'French Door' },
  const lines = aliasSection.split('\n');
  
  for (const line of lines) {
    // Match pattern: 'keyword': { 'Category': 'Type Name' }
    const match = line.match(/'([^']+)':\s*\{\s*'([^']+)':\s*'([^']+)'/);
    if (match) {
      const keyword = match[1];
      const category = match[2];
      const typeName = match[3];
      
      const key = `${category}::${typeName}`;
      if (!aliasMap.has(key)) {
        aliasMap.set(key, []);
      }
      aliasMap.get(key).push(keyword);
    }
  }
  
  return aliasMap;
}

/**
 * Parse SEMANTIC_TYPE_PATTERNS from type-matcher.service.ts
 * Returns Set: "Category::Type Name"
 */
function parseSemanticPatterns(content) {
  const patternSet = new Set(); // "Category::Type Name"
  
  // Find const SEMANTIC_TYPE_PATTERNS
  const patternStart = content.indexOf('const SEMANTIC_TYPE_PATTERNS');
  if (patternStart === -1) {
    console.error('❌ Could not find SEMANTIC_TYPE_PATTERNS in type-matcher.service.ts');
    return patternSet;
  }
  
  // Extract until closing ];
  let bracketCount = 0;
  let patternEnd = patternStart;
  let foundFirstBracket = false;
  
  for (let i = patternStart; i < content.length; i++) {
    if (content[i] === '[') {
      bracketCount++;
      foundFirstBracket = true;
    } else if (content[i] === ']') {
      bracketCount--;
      if (foundFirstBracket && bracketCount === 0) {
        patternEnd = i + 1;
        break;
      }
    }
  }
  
  const patternSection = content.substring(patternStart, patternEnd);
  
  // Parse each pattern like: { pattern: /french\s*door/i, category: 'Refrigerator', typeName: 'French Door' },
  const lines = patternSection.split('\n');
  
  for (const line of lines) {
    // Match: category: 'Category', typeName: 'Type Name'
    const categoryMatch = line.match(/category:\s*'([^']+)'/);
    const typeMatch = line.match(/typeName:\s*'([^']+)'/);
    
    if (categoryMatch && typeMatch) {
      const category = categoryMatch[1];
      const typeName = typeMatch[1];
      patternSet.add(`${category}::${typeName}`);
    }
  }
  
  return patternSet;
}

/**
 * Suggest keywords based on type name
 */
function suggestKeywords(typeName) {
  const normalized = typeName.toLowerCase();
  const suggestions = [normalized];
  
  // Add hyphenated version
  if (normalized.includes(' ')) {
    suggestions.push(normalized.replace(/\s+/g, '-'));
  }
  
  // Add without hyphens
  if (normalized.includes('-')) {
    suggestions.push(normalized.replace(/-/g, ' '));
    suggestions.push(normalized.replace(/-/g, ''));
  }
  
  // Add singular/plural variations for common patterns
  if (normalized.endsWith('s') && !normalized.endsWith('ss')) {
    suggestions.push(normalized.slice(0, -1));
  } else if (!normalized.endsWith('s')) {
    suggestions.push(normalized + 's');
  }
  
  return [...new Set(suggestions)].slice(0, 3); // Return top 3 unique suggestions
}

/**
 * Main audit function
 */
function auditTypeKeywordCoverage() {
  console.log('🔍 TYPE KEYWORD COVERAGE AUDIT');
  console.log('================================\n');
  
  // Load data
  console.log('📂 Loading types.json...');
  const types = loadTypes();
  console.log(`   Found ${types.length} types\n`);
  
  console.log('📂 Parsing type-matcher.service.ts...');
  const typeMatcherContent = fs.readFileSync(TYPE_MATCHER_PATH, 'utf8');
  const aliasMap = parseTypeAliases(typeMatcherContent);
  const patternSet = parseSemanticPatterns(typeMatcherContent);
  console.log(`   Found ${aliasMap.size} keyword mappings`);
  console.log(`   Found ${patternSet.size} semantic patterns\n`);
  
  // Categorize types
  const typesByCategory = new Map(); // category -> [types]
  
  for (const type of types) {
    const category = type.category_usage || 'Universal';
    if (!typesByCategory.has(category)) {
      typesByCategory.set(category, []);
    }
    typesByCategory.get(category).push(type);
  }
  
  console.log(`📊 Types organized into ${typesByCategory.size} categories\n`);
  console.log('=' .repeat(80));
  console.log('\n');
  
  // Audit each category
  let totalMissing = 0;
  let totalTypes = 0;
  const missingByCategory = [];
  
  for (const [category, categoryTypes] of typesByCategory) {
    const missing = [];
    
    for (const type of categoryTypes) {
      totalTypes++;
      const key = `${category}::${type.type_name}`;
      
      // Check if has alias or semantic pattern
      const hasAlias = aliasMap.has(key);
      const hasPattern = patternSet.has(key);
      
      if (!hasAlias && !hasPattern) {
        missing.push(type);
        totalMissing++;
      }
    }
    
    if (missing.length > 0) {
      missingByCategory.push({ category, missing, total: categoryTypes.length });
    }
  }
  
  // Summary
  console.log('📊 AUDIT SUMMARY');
  console.log('================\n');
  console.log(`Total Types:          ${totalTypes}`);
  console.log(`Types with keywords:  ${totalTypes - totalMissing} ✅`);
  console.log(`Types WITHOUT:        ${totalMissing} ❌`);
  console.log(`Coverage:             ${((totalTypes - totalMissing) / totalTypes * 100).toFixed(1)}%`);
  console.log(`\nCategories affected:  ${missingByCategory.length} / ${typesByCategory.size}\n`);
  
  if (totalMissing === 0) {
    console.log('🎉 EXCELLENT! All types have keyword mappings!\n');
    return;
  }
  
  console.log('=' .repeat(80));
  console.log('\n');
  
  // Detailed report by category
  console.log('📋 MISSING KEYWORD MAPPINGS BY CATEGORY');
  console.log('========================================\n');
  
  // Sort by number of missing (highest first)
  missingByCategory.sort((a, b) => b.missing.length - a.missing.length);
  
  for (const { category, missing, total } of missingByCategory) {
    console.log(`\n### ${category}`);
    console.log(`Missing: ${missing.length} / ${total} types (${(missing.length / total * 100).toFixed(1)}%)\n`);
    
    for (const type of missing.slice(0, 10)) { // Show first 10
      const suggestions = suggestKeywords(type.type_name);
      console.log(`❌ "${type.type_name}"`);
      console.log(`   Type ID: ${type.type_id || 'pending'}`);
      console.log(`   Suggested keywords: ${suggestions.map(s => `'${s}'`).join(', ')}`);
      console.log('');
    }
    
    if (missing.length > 10) {
      console.log(`   ... and ${missing.length - 10} more\n`);
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('\n');
  
  // Recommendations
  console.log('💡 RECOMMENDATIONS');
  console.log('==================\n');
  console.log('1. Add keyword aliases to TYPE_ALIASES in type-matcher.service.ts');
  console.log('2. Add semantic patterns to SEMANTIC_TYPE_PATTERNS for complex matches');
  console.log('3. Priority: Focus on categories with highest missing counts first');
  console.log('4. Reference: Finding #014 in AUDIT-FINDINGS-AND-SOLUTIONS.md');
  console.log('5. Test: Re-run this audit after adding keywords to verify coverage\n');
  
  // Export detailed results
  const exportPath = path.join(__dirname, '../audit-results/type-keyword-coverage-audit.json');
  const exportDir = path.dirname(exportPath);
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  const exportData = {
    auditDate: new Date().toISOString(),
    summary: {
      totalTypes,
      typesWithKeywords: totalTypes - totalMissing,
      typesMissing: totalMissing,
      coveragePercent: ((totalTypes - totalMissing) / totalTypes * 100).toFixed(1),
      categoriesAffected: missingByCategory.length,
      totalCategories: typesByCategory.size
    },
    missingByCategory: missingByCategory.map(({ category, missing, total }) => ({
      category,
      missingCount: missing.length,
      totalTypes: total,
      coveragePercent: ((total - missing.length) / total * 100).toFixed(1),
      missingTypes: missing.map(t => ({
        typeName: t.type_name,
        typeId: t.type_id,
        typeGroup: t.type_group,
        suggestedKeywords: suggestKeywords(t.type_name)
      }))
    }))
  };
  
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
  console.log(`📄 Detailed results exported to: ${exportPath}\n`);
}

// Run audit
try {
  auditTypeKeywordCoverage();
} catch (error) {
  console.error('❌ Audit failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
