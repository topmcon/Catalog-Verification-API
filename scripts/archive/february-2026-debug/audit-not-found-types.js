/**
 * AUDIT: Not Found Types Analysis
 * ================================
 * Analyzes verification jobs to find patterns where AI returns "Not Found" for types
 * Provides actionable insights for:
 * 1. Missing type aliases
 * 2. AI prompt improvements
 * 3. Category schema gaps
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Import type configuration
const CATEGORY_TYPE_MAPPINGS = require('../src/config/salesforce-picklists/category-type-mapping.json');

async function analyzeNotFoundTypes() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  
  try {
    const db = client.db('catalog-verification');
    const jobs = db.collection('verification_jobs');
    
    console.log('🔍 SEARCHING FOR "NOT FOUND" TYPES...\n');
    
    // Find all jobs with "Not Found" type
    const notFoundJobs = await jobs.find({
      'result.ai_type': 'Not Found',
      status: 'completed'
    }).sort({ createdAt: -1 }).limit(500).toArray();
    
    console.log(`Found ${notFoundJobs.length} jobs with "Not Found" type\n`);
    
    if (notFoundJobs.length === 0) {
      console.log('✅ No "Not Found" types found! System is working correctly.');
      return;
    }
    
    // Analyze patterns
    const patterns = {
      byCategory: {},
      byTitleKeywords: {},
      byFergusonTitle: {},
      byWebRetailerTitle: {},
      missingAliases: []
    };
    
    for (const job of notFoundJobs) {
      const category = job.result?.ai_category || 'Unknown';
      const fergusonTitle = job.input?.ferguson_title || '';
      const webRetailerTitle = job.input?.web_retailer_title || '';
      const modelNumber = job.input?.ferguson_model_number || job.input?.model_number || 'N/A';
      
      // Count by category
      if (!patterns.byCategory[category]) {
        patterns.byCategory[category] = { count: 0, examples: [] };
      }
      patterns.byCategory[category].count++;
      if (patterns.byCategory[category].examples.length < 5) {
        patterns.byCategory[category].examples.push({
          model: modelNumber,
          ferguson: fergusonTitle,
          webRetailer: webRetailerTitle
        });
      }
      
      // Extract keywords from titles (potential type indicators)
      const allTitles = `${fergusonTitle} ${webRetailerTitle}`.toLowerCase();
      const keywords = extractTypeKeywords(allTitles);
      
      for (const keyword of keywords) {
        if (!patterns.byTitleKeywords[keyword]) {
          patterns.byTitleKeywords[keyword] = { count: 0, category, examples: [] };
        }
        patterns.byTitleKeywords[keyword].count++;
        if (patterns.byTitleKeywords[keyword].examples.length < 3) {
          patterns.byTitleKeywords[keyword].examples.push({
            title: fergusonTitle || webRetailerTitle,
            category
          });
        }
      }
    }
    
    // Generate report
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 NOT FOUND TYPE ANALYSIS REPORT');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Section 1: By Category
    console.log('🏷️  NOT FOUND TYPES BY CATEGORY:\n');
    const sortedCategories = Object.entries(patterns.byCategory)
      .sort((a, b) => b[1].count - a[1].count);
    
    for (const [category, data] of sortedCategories) {
      console.log(`${category}: ${data.count} occurrences`);
      
      // Check if category has types defined
      const categoryMapping = CATEGORY_TYPE_MAPPINGS.mappings.find(
        m => m.category_name === category
      );
      
      if (!categoryMapping) {
        console.log(`  ⚠️  NO TYPE MAPPING FOUND FOR THIS CATEGORY!`);
      } else {
        console.log(`  ℹ️  Has ${categoryMapping.types.length} types configured:`);
        const typeNames = categoryMapping.types.map(t => t.type_name).join(', ');
        console.log(`     ${typeNames}`);
      }
      
      console.log(`  Examples:`);
      for (const ex of data.examples.slice(0, 3)) {
        const title = ex.ferguson || ex.webRetailer || 'N/A';
        console.log(`     - ${ex.model}: ${title.substring(0, 80)}`);
      }
      console.log('');
    }
    
    // Section 2: Common Keywords
    console.log('\n🔑 COMMON TYPE KEYWORDS IN TITLES:\n');
    const sortedKeywords = Object.entries(patterns.byTitleKeywords)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 30);
    
    for (const [keyword, data] of sortedKeywords) {
      console.log(`"${keyword}": ${data.count} times → Category: ${data.category}`);
      
      // Check if this keyword exists in type-matcher aliases
      const needsAlias = checkIfKeywordNeedsAlias(keyword, data.category);
      if (needsAlias) {
        patterns.missingAliases.push({ keyword, category: data.category, count: data.count });
      }
    }
    
    // Section 3: Missing Aliases Recommendations
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('💡 RECOMMENDED TYPE ALIASES TO ADD');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    if (patterns.missingAliases.length > 0) {
      console.log('Add these to TYPE_ALIASES in type-matcher.service.ts:\n');
      
      for (const alias of patterns.missingAliases.slice(0, 20)) {
        const categoryMapping = CATEGORY_TYPE_MAPPINGS.mappings.find(
          m => m.category_name === alias.category
        );
        
        if (categoryMapping && categoryMapping.types.length > 0) {
          const suggestedType = suggestBestTypeMatch(alias.keyword, categoryMapping.types);
          console.log(`  '${alias.keyword}': { '${alias.category}': '${suggestedType}' }, // ${alias.count} occurrences`);
        }
      }
    } else {
      console.log('✅ No obvious missing aliases detected.');
    }
    
    // Section 4: AI Prompt Issues
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('🤖 AI PROMPT ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const totalJobs = await jobs.countDocuments({ status: 'completed' });
    const notFoundRate = (notFoundJobs.length / totalJobs * 100).toFixed(2);
    
    console.log(`Total completed jobs: ${totalJobs}`);
    console.log(`"Not Found" types: ${notFoundJobs.length} (${notFoundRate}%)`);
    
    if (parseFloat(notFoundRate) > 5) {
      console.log(`\n⚠️  HIGH "NOT FOUND" RATE!`);
      console.log(`\nRecommendation: Strengthen AI prompts with:`);
      console.log(`  1. Explicit "NEVER return 'Not Found'" instruction`);
      console.log(`  2. Guidance to pick CLOSEST semantic match`);
      console.log(`  3. Fallback: Pick most common [PRIMARY] type`);
    } else {
      console.log(`\n✅ "Not Found" rate is acceptable (< 5%)`);
    }
    
    // Save detailed report to file
    const reportPath = path.join(__dirname, '../audit-results/not-found-types-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalAnalyzed: notFoundJobs.length,
      notFoundRate: parseFloat(notFoundRate),
      byCategory: patterns.byCategory,
      topKeywords: sortedKeywords.slice(0, 50),
      missingAliases: patterns.missingAliases,
      rawJobs: notFoundJobs.slice(0, 100).map(j => ({
        model: j.input?.ferguson_model_number,
        category: j.result?.ai_category,
        fergusonTitle: j.input?.ferguson_title,
        webRetailerTitle: j.input?.web_retailer_title,
        createdAt: j.createdAt
      }))
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved: audit-results/not-found-types-report.json`);
    
  } finally {
    await client.close();
  }
}

/**
 * Extract potential type keywords from title
 */
function extractTypeKeywords(title) {
  const keywords = new Set();
  const lower = title.toLowerCase();
  
  // Common type patterns
  const patterns = [
    /\b(monoblock|single hole|centerset|widespread|wall mount|deck mount)\b/g,
    /\b(towel bar|toilet paper holder|tissue holder|robe hook)\b/g,
    /\b(medicine cabinet|wall mirror|vanity mirror)\b/g,
    /\b(indoor|outdoor|hugger|downrod)\b/g,
    /\b(single bowl|double bowl|undermount|drop-in|farmhouse)\b/g,
    /\b(chandelier|pendant|flush mount|semi-flush)\b/g,
    /\b(pull-down|pull-out|pot filler|bar faucet)\b/g,
    /\b(built-in|freestanding|slide-in|drop-in)\b/g,
    /\b(french door|side-by-side|top freezer|bottom freezer)\b/g,
    /\b(gas|electric|induction|dual fuel)\b/g,
    /\b(roman tub|deck mounted|wall mounted)\b/g,
    /\b(recessed|canless|gimbal|adjustable)\b/g
  ];
  
  for (const pattern of patterns) {
    const matches = lower.matchAll(pattern);
    for (const match of matches) {
      keywords.add(match[1]);
    }
  }
  
  return Array.from(keywords);
}

/**
 * Check if keyword needs an alias (doesn't exist in type-matcher)
 */
function checkIfKeywordNeedsAlias(keyword, category) {
  // This is a simplified check - in real implementation, would parse type-matcher.service.ts
  // For now, flag common patterns that likely need aliases
  const commonMissingPatterns = [
    'monoblock', 'single handle', 'deck mounted', 'roman tub',
    'towel bar', 'toilet paper', 'tissue holder',
    'wall mirror', 'medicine cabinet',
    'indoor', 'outdoor', 'hugger',
    'single bowl', 'double bowl', 'undermount', 'drop-in',
    'pull-down', 'pull-out',
    'built-in', 'freestanding'
  ];
  
  return commonMissingPatterns.some(pattern => keyword.includes(pattern));
}

/**
 * Suggest best type match for keyword
 */
function suggestBestTypeMatch(keyword, types) {
  const lower = keyword.toLowerCase();
  
  // Try exact or partial match first
  for (const type of types) {
    const typeLower = type.type_name.toLowerCase();
    if (typeLower.includes(lower) || lower.includes(typeLower)) {
      return type.type_name;
    }
  }
  
  // Semantic mappings
  const semanticMappings = {
    'monoblock': 'Single Hole',
    'single handle': 'Single Hole',
    'deck mounted': 'Deck Mount',
    'roman tub': 'Deck Mount',
    'towel bar': 'Towel Bar',
    'toilet paper': 'Toilet Paper Holder',
    'tissue holder': 'Toilet Paper Holder',
    'wall mirror': 'Wall Mirror',
    'medicine cabinet': 'Medicine Cabinet',
    'indoor': 'Indoor',
    'outdoor': 'Outdoor',
    'hugger': 'Hugger',
    'single bowl': 'Single Bowl',
    'double bowl': 'Double Bowl',
    'undermount': 'Undermount',
    'drop-in': 'Drop-In',
    'pull-down': 'Pull-Down',
    'pull-out': 'Pull-Out',
    'built-in': 'Built-In',
    'freestanding': 'Freestanding'
  };
  
  if (semanticMappings[lower]) {
    // Check if suggested type actually exists in this category
    const matchingType = types.find(t => 
      t.type_name.toLowerCase() === semanticMappings[lower].toLowerCase()
    );
    if (matchingType) {
      return matchingType.type_name;
    }
  }
  
  // Fallback: Return first PRIMARY type
  const primaryType = types.find(t => t.primary_filter);
  return primaryType ? primaryType.type_name : types[0].type_name;
}

// Run analysis
analyzeNotFoundTypes()
  .then(() => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
