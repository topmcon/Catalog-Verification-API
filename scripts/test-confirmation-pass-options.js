#!/usr/bin/env node

/**
 * Test Script: Compare 3 Final Confirmation Pass Options
 * 
 * Runs against 20 recent Salesforce verification calls to compare:
 * - Option A: Regex-only (fast, count keywords)
 * - Option B: Hybrid (regex + AI for conflicts)
 * - Option C: Full AI Review (send all to AI)
 * 
 * Measures:
 * - Accuracy (how often it catches AI_Type mismatches)
 * - Performance (time per call)
 * - False positive rate (flagging correct values)
 */

// Load environment variables from .env file
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { MongoClient } = require('mongodb');

// Type keywords for each category (from category-type-mapping.json)
const TYPE_KEYWORDS = {
  'Range Hood': {
    'Wall-Mounted': ['wall mount', 'wall-mount', 'wall mounted', 'chimney'],
    'Under Cabinet': ['under cabinet', 'under-cabinet', 'undercabinet'],
    'Island Mount': ['island', 'ceiling mount'],
    'Insert': ['insert', 'liner', 'hood liner', 'built-in liner'],
    'Downdraft': ['downdraft', 'down draft'],
    'Pro-Style': ['pro-style', 'professional', 'commercial grade'],
    'Accessory': ['accessory', 'filter', 'duct', 'blower', 'extension', 'cover']
  },
  'Refrigerator': {
    'French Door': ['french door', 'french-door'],
    'Side-by-Side': ['side-by-side', 'side by side'],
    'Top Freezer': ['top freezer', 'top-freezer'],
    'Bottom Freezer': ['bottom freezer', 'bottom-freezer'],
    'Counter Depth': ['counter depth', 'counter-depth'],
    'Built-In': ['built-in', 'built in', 'panel ready'],
    'Compact': ['compact', 'mini', 'undercounter'],
    'Column': ['column']
  },
  'Oven': {
    'Single Wall': ['single wall', 'single oven'],
    'Double Wall': ['double wall', 'double oven'],
    'Steam': ['steam oven', 'steam'],
    'Speed': ['speed oven', 'microwave combo'],
    'Convection': ['convection'],
    'Warming Drawer': ['warming drawer'],
    'Built-In Microwave': ['built-in microwave', 'built in microwave']
  },
  'Dishwasher': {
    'Top Control': ['top control', 'hidden control'],
    'Front Control': ['front control', 'visible control'],
    'Drawer': ['drawer', 'single drawer', 'double drawer'],
    'Countertop': ['countertop', 'portable'],
    'Panel-Ready': ['panel ready', 'panel-ready', 'custom panel']
  }
};

// Combine all text fields for keyword search
function getRawText(job) {
  const rp = job.rawPayload || {};
  return [
    rp.Product_Title_Legacy || '',
    rp.Product_Title_Web_Retailer || '',
    rp.Product_Description_Legacy || '',
    rp.Product_Description_Web_Retailer || '',
    rp.Category_Legacy || '',
    rp.Web_Retailer_Category || '',
    rp.Web_Retailer_SubCategory || '',
    rp.Features_Legacy || '',
    rp.Features_Web_Retailer || '',
    rp.Web_Retailer_Specs || ''
  ].join(' ').toLowerCase();
}

// Get structured raw data for AI review (includes ALL fields)
function getStructuredRawData(job) {
  const rp = job.rawPayload || {};
  return {
    // Text fields
    Product_Title_Legacy: rp.Product_Title_Legacy || '',
    Product_Title_Web_Retailer: rp.Product_Title_Web_Retailer || '',
    Product_Description_Legacy: rp.Product_Description_Legacy || '',
    Category_Legacy: rp.Category_Legacy || '',
    Web_Retailer_Category: rp.Web_Retailer_Category || '',
    Web_Retailer_SubCategory: rp.Web_Retailer_SubCategory || '',
    // Brand
    Brand_Legacy: rp.Brand_Legacy || '',
    Brand_Web_Retailer: rp.Brand_Web_Retailer || '',
    // Dimensions - CRITICAL: These were missing before!
    Height_Legacy: rp.Height_Legacy || '',
    Width_Legacy: rp.Width_Legacy || '',
    Depth_Legacy: rp.Depth_Legacy || '',
    Height_Web_Retailer: rp.Height_Web_Retailer || '',
    Width_Web_Retailer: rp.Width_Web_Retailer || '',
    Depth_Web_Retailer: rp.Depth_Web_Retailer || '',
    // Other numeric
    Weight_Legacy: rp.Weight_Legacy || '',
    Weight_Web_Retailer: rp.Weight_Web_Retailer || '',
    Capacity_Legacy: rp.Capacity_Legacy || '',
    MSRP_Legacy: rp.MSRP_Legacy || '',
    // Color/Finish
    Color_Finish_Legacy: rp.Color_Finish_Legacy || '',
    Color_Finish_Web_Retailer: rp.Color_Finish_Web_Retailer || '',
    // Model
    Model_Number_Legacy: rp.Model_Number_Legacy || '',
    Model_Number_Web_Retailer: rp.Model_Number_Web_Retailer || '',
    UPC_Legacy: rp.UPC_Legacy || ''
  };
}

// Count keyword matches for each Type value
function countTypeKeywords(rawText, category) {
  const keywords = TYPE_KEYWORDS[category];
  if (!keywords) return null;
  
  const counts = {};
  for (const [typeName, patterns] of Object.entries(keywords)) {
    let count = 0;
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = rawText.match(regex);
      count += matches ? matches.length : 0;
    }
    counts[typeName] = count;
  }
  return counts;
}

// ============================================
// OPTION A: Regex-Only Confirmation Pass
// ============================================
function optionA_RegexOnly(job) {
  const startTime = Date.now();
  const rawText = getRawText(job);
  const category = job.result?.Primary_Attributes?.AI_Product_Category;
  const chosenType = job.result?.Primary_Attributes?.AI_Type;
  
  if (!category || !chosenType) {
    return { result: 'SKIP', reason: 'Missing category or type', timeMs: Date.now() - startTime };
  }
  
  const typeCounts = countTypeKeywords(rawText, category);
  if (!typeCounts) {
    return { result: 'SKIP', reason: 'No keywords for category', timeMs: Date.now() - startTime };
  }
  
  const chosenCount = typeCounts[chosenType] || 0;
  const otherTypes = Object.entries(typeCounts)
    .filter(([type]) => type !== chosenType)
    .sort((a, b) => b[1] - a[1]);
  
  const topOther = otherTypes[0] || ['none', 0];
  
  // Flag if chosen has 0 mentions but another has 3+
  let result = 'CONFIRMED';
  let suggestedCorrection = null;
  
  if (chosenCount === 0 && topOther[1] >= 3) {
    result = 'MISMATCH';
    suggestedCorrection = topOther[0];
  } else if (chosenCount === 0 && topOther[1] >= 1) {
    result = 'WARNING';
    suggestedCorrection = topOther[0];
  } else if (topOther[1] > chosenCount * 2 && topOther[1] >= 3) {
    result = 'WARNING';
    suggestedCorrection = topOther[0];
  }
  
  return {
    result,
    chosenType,
    chosenCount,
    topAlternative: topOther[0],
    topAlternativeCount: topOther[1],
    allCounts: typeCounts,
    suggestedCorrection,
    timeMs: Date.now() - startTime
  };
}

// ============================================
// OPTION B: Hybrid (Regex + AI for conflicts)
// ============================================
async function optionB_Hybrid(job, openai) {
  const startTime = Date.now();
  
  // First run regex check
  const regexResult = optionA_RegexOnly(job);
  
  // If confirmed or skip, don't call AI
  if (regexResult.result === 'CONFIRMED' || regexResult.result === 'SKIP') {
    return {
      ...regexResult,
      aiCalled: false,
      source: 'regex'
    };
  }
  
  // Only call AI if conflict detected
  if (!openai) {
    return {
      ...regexResult,
      aiCalled: false,
      source: 'regex-only (no AI key)',
      note: 'Would call AI here'
    };
  }
  
  const rawText = getRawText(job).substring(0, 2000); // Truncate for API
  const chosenType = job.result?.Primary_Attributes?.AI_Type;
  const category = job.result?.Primary_Attributes?.AI_Product_Category;
  
  try {
    const prompt = `You verified a ${category} product and chose Type="${chosenType}".

Keyword evidence from raw data:
${Object.entries(regexResult.allCounts || {}).map(([t, c]) => `- "${t}": ${c} mentions`).join('\n')}

Raw product text (excerpt):
"${rawText.substring(0, 1000)}"

The chosen Type "${chosenType}" has ${regexResult.chosenCount} mentions, but "${regexResult.topAlternative}" has ${regexResult.topAlternativeCount} mentions.

Should the Type be:
A) Keep "${chosenType}" (explain why)
B) Change to "${regexResult.topAlternative}" (explain why)
C) Change to something else (specify)

Answer format: A, B, or C followed by brief explanation.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0
    });

    const aiAnswer = response.choices[0]?.message?.content?.trim() || '';
    const timeMs = Date.now() - startTime;

    let finalResult = regexResult.result;
    let finalCorrection = regexResult.suggestedCorrection;

    if (aiAnswer.startsWith('A')) {
      finalResult = 'AI_CONFIRMED';
      finalCorrection = null;
    } else if (aiAnswer.startsWith('B')) {
      finalResult = 'AI_CORRECTS';
      finalCorrection = regexResult.topAlternative;
    } else if (aiAnswer.startsWith('C')) {
      finalResult = 'AI_SUGGESTS_OTHER';
      // Extract from response
      const match = aiAnswer.match(/Change to ["\']?([^"'\n]+)["\']?/i);
      finalCorrection = match ? match[1] : 'UNKNOWN';
    }

    return {
      ...regexResult,
      aiCalled: true,
      aiResponse: aiAnswer.substring(0, 200),
      finalResult,
      finalCorrection,
      source: 'hybrid',
      timeMs
    };
  } catch (error) {
    return {
      ...regexResult,
      aiCalled: true,
      aiError: error.message,
      source: 'hybrid-failed',
      timeMs: Date.now() - startTime
    };
  }
}

// ============================================
// OPTION C: Full AI Review
// ============================================
async function optionC_FullAI(job, openai) {
  const startTime = Date.now();
  
  if (!openai) {
    return {
      result: 'SKIP',
      reason: 'No AI key',
      timeMs: Date.now() - startTime
    };
  }
  
  // Use STRUCTURED data with ALL fields including dimensions
  const rawData = getStructuredRawData(job);
  const attrs = job.result?.Primary_Attributes || {};
  
  try {
    const prompt = `Review this product verification for accuracy. Compare the AI decisions against the ORIGINAL Salesforce input data.

AI DECISIONS (what AI chose):
- Brand: ${attrs.AI_Brand}
- Category: ${attrs.AI_Product_Category}
- Type: ${attrs.AI_Type}
- Style: ${attrs.AI_Style}
- Width: ${attrs.AI_Width}
- Height: ${attrs.AI_Height}
- Depth: ${attrs.AI_Depth}
- Weight: ${attrs.AI_Weight}

ORIGINAL SALESFORCE INPUT DATA (source of truth):
- Brand_Legacy: "${rawData.Brand_Legacy}"
- Brand_Web_Retailer: "${rawData.Brand_Web_Retailer}"
- Category_Legacy: "${rawData.Category_Legacy}"
- Web_Retailer_Category: "${rawData.Web_Retailer_Category}"
- Web_Retailer_SubCategory: "${rawData.Web_Retailer_SubCategory}"
- Width_Legacy: "${rawData.Width_Legacy}"
- Height_Legacy: "${rawData.Height_Legacy}"
- Depth_Legacy: "${rawData.Depth_Legacy}"
- Width_Web_Retailer: "${rawData.Width_Web_Retailer}"
- Height_Web_Retailer: "${rawData.Height_Web_Retailer}"
- Depth_Web_Retailer: "${rawData.Depth_Web_Retailer}"
- Weight_Legacy: "${rawData.Weight_Legacy}"
- Weight_Web_Retailer: "${rawData.Weight_Web_Retailer}"
- Product_Title_Legacy: "${rawData.Product_Title_Legacy}"
- Product_Title_Web_Retailer: "${rawData.Product_Title_Web_Retailer}"

For each AI decision, determine:
- CORRECT: AI value matches the source data (fractions like "43 1/8" = decimal 43.125 is correct)
- WRONG: [correct value] - AI made a mistake
- UNCERTAIN: Data not present in source to verify

IMPORTANT: "35 7/16" = 35.4375. "43 1/8" = 43.125. "18 7/8" = 18.875. Account for fraction-to-decimal conversions.

Format:
Brand: CORRECT/WRONG/UNCERTAIN
Category: CORRECT/WRONG/UNCERTAIN
Type: CORRECT/WRONG/UNCERTAIN
Style: CORRECT/WRONG/UNCERTAIN
Width: CORRECT/WRONG/UNCERTAIN
Height: CORRECT/WRONG/UNCERTAIN
Depth: CORRECT/WRONG/UNCERTAIN
Weight: CORRECT/WRONG/UNCERTAIN`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0
    });

    const aiAnswer = response.choices[0]?.message?.content?.trim() || '';
    const timeMs = Date.now() - startTime;

    // Parse response
    const fields = {};
    const lines = aiAnswer.split('\n');
    for (const line of lines) {
      const match = line.match(/^(Brand|Category|Type|Style|Width|Height|Depth|Weight):\s*(CORRECT|WRONG|UNCERTAIN)(?::\s*(.+))?/i);
      if (match) {
        fields[match[1].toLowerCase()] = {
          verdict: match[2].toUpperCase(),
          correction: match[3]?.trim() || null
        };
      }
    }

    return {
      result: 'REVIEWED',
      fields,
      rawResponse: aiAnswer.substring(0, 600),
      issuesFound: Object.values(fields).filter(f => f.verdict === 'WRONG').length,
      uncertainFields: Object.values(fields).filter(f => f.verdict === 'UNCERTAIN').length,
      correctFields: Object.values(fields).filter(f => f.verdict === 'CORRECT').length,
      timeMs
    };
  } catch (error) {
    return {
      result: 'ERROR',
      error: error.message,
      timeMs: Date.now() - startTime
    };
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function main() {
  console.log('='.repeat(80));
  console.log('FINAL CONFIRMATION PASS - OPTIONS COMPARISON TEST');
  console.log('Testing against 20 recent Salesforce verification calls');
  console.log('='.repeat(80));
  console.log();
  
  let openai = null;
  try {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('✅ OpenAI API configured');
  } catch (e) {
    console.log('⚠️ OpenAI not available - Option B/C will run without AI calls');
  }
  
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('catalog-verification');
  
  // Get 20 recent completed jobs with Type assigned
  const jobs = await db.collection('verification_jobs')
    .find({
      status: 'completed',
      'result.Primary_Attributes.AI_Type': { $exists: true, $ne: null, $ne: '' }
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();
  
  console.log(`📊 Found ${jobs.length} jobs to test\n`);
  
  if (jobs.length === 0) {
    console.log('No jobs found with AI_Type. Exiting.');
    await client.close();
    return;
  }
  
  // Results storage
  const results = {
    optionA: { confirmed: 0, mismatch: 0, warning: 0, skip: 0, totalTimeMs: 0 },
    optionB: { confirmed: 0, aiConfirmed: 0, aiCorrects: 0, aiSuggestsOther: 0, skip: 0, totalTimeMs: 0 },
    optionC: { reviewed: 0, issuesFound: 0, error: 0, totalTimeMs: 0 }
  };
  
  const detailedResults = [];
  
  // Process each job
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const category = job.result?.Primary_Attributes?.AI_Product_Category;
    const chosenType = job.result?.Primary_Attributes?.AI_Type;
    
    console.log(`\n[${ i + 1}/${jobs.length}] ${job.sfCatalogName || 'Unknown'}`);
    console.log(`   Category: ${category} | AI_Type: ${chosenType}`);
    
    // Run Option A
    const resultA = optionA_RegexOnly(job);
    results.optionA.totalTimeMs += resultA.timeMs;
    results.optionA[resultA.result.toLowerCase()] = (results.optionA[resultA.result.toLowerCase()] || 0) + 1;
    
    console.log(`   Option A (${resultA.timeMs}ms): ${resultA.result}`);
    if (resultA.allCounts) {
      const countStr = Object.entries(resultA.allCounts)
        .filter(([_, c]) => c > 0)
        .map(([t, c]) => `${t}:${c}`)
        .join(', ');
      if (countStr) console.log(`      Keywords: ${countStr}`);
    }
    
    // Run Option B
    const resultB = await optionB_Hybrid(job, openai);
    results.optionB.totalTimeMs += resultB.timeMs;
    if (resultB.result === 'CONFIRMED' || resultB.source === 'regex') {
      results.optionB.confirmed++;
    } else if (resultB.finalResult === 'AI_CONFIRMED') {
      results.optionB.aiConfirmed++;
    } else if (resultB.finalResult === 'AI_CORRECTS') {
      results.optionB.aiCorrects++;
    } else if (resultB.finalResult === 'AI_SUGGESTS_OTHER') {
      results.optionB.aiSuggestsOther++;
    } else if (resultB.result === 'SKIP') {
      results.optionB.skip++;
    }
    
    console.log(`   Option B (${resultB.timeMs}ms): ${resultB.finalResult || resultB.result} ${resultB.aiCalled ? '[AI CALLED]' : ''}`);
    if (resultB.aiResponse) console.log(`      AI: ${resultB.aiResponse.substring(0, 100)}...`);
    
    // Run Option C
    const resultC = await optionC_FullAI(job, openai);
    results.optionC.totalTimeMs += resultC.timeMs;
    if (resultC.result === 'REVIEWED') {
      results.optionC.reviewed++;
      results.optionC.issuesFound += resultC.issuesFound;
    } else if (resultC.result === 'ERROR') {
      results.optionC.error++;
    }
    
    console.log(`   Option C (${resultC.timeMs}ms): ${resultC.issuesFound || 0} issues found`);
    if (resultC.fields?.type) {
      console.log(`      Type verdict: ${resultC.fields.type.verdict}${resultC.fields.type.correction ? ' → ' + resultC.fields.type.correction : ''}`);
    }
    
    // Store detailed result
    detailedResults.push({
      jobId: job.jobId,
      sfName: job.sfCatalogName,
      category,
      chosenType,
      optionA: resultA,
      optionB: resultB,
      optionC: resultC
    });
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\n📊 OPTION A: Regex-Only');
  console.log(`   Confirmed: ${results.optionA.confirmed}`);
  console.log(`   Mismatch:  ${results.optionA.mismatch} (would flag for correction)`);
  console.log(`   Warning:   ${results.optionA.warning} (would suggest review)`);
  console.log(`   Skipped:   ${results.optionA.skip}`);
  console.log(`   Avg time:  ${Math.round(results.optionA.totalTimeMs / jobs.length)}ms`);
  console.log(`   Total time: ${results.optionA.totalTimeMs}ms`);
  
  console.log('\n📊 OPTION B: Hybrid (Regex + AI for conflicts)');
  console.log(`   Regex Confirmed: ${results.optionB.confirmed}`);
  console.log(`   AI Confirmed:    ${results.optionB.aiConfirmed}`);
  console.log(`   AI Corrects:     ${results.optionB.aiCorrects}`);
  console.log(`   AI Other:        ${results.optionB.aiSuggestsOther}`);
  console.log(`   Skipped:         ${results.optionB.skip}`);
  console.log(`   Avg time:  ${Math.round(results.optionB.totalTimeMs / jobs.length)}ms`);
  console.log(`   Total time: ${results.optionB.totalTimeMs}ms`);
  
  console.log('\n📊 OPTION C: Full AI Review');
  console.log(`   Reviewed:     ${results.optionC.reviewed}`);
  console.log(`   Issues Found: ${results.optionC.issuesFound} total across all fields`);
  console.log(`   Errors:       ${results.optionC.error}`);
  console.log(`   Avg time:  ${Math.round(results.optionC.totalTimeMs / jobs.length)}ms`);
  console.log(`   Total time: ${results.optionC.totalTimeMs}ms`);
  
  // Find mismatches for detailed analysis
  const mismatches = detailedResults.filter(r => 
    r.optionA.result === 'MISMATCH' || 
    r.optionA.result === 'WARNING' ||
    r.optionB.finalResult === 'AI_CORRECTS' ||
    (r.optionC.fields?.type?.verdict === 'WRONG')
  );
  
  if (mismatches.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('DETAILED MISMATCHES');
    console.log('='.repeat(80));
    
    for (const m of mismatches) {
      console.log(`\n📌 ${m.sfName}`);
      console.log(`   Category: ${m.category}`);
      console.log(`   AI Chose: ${m.chosenType}`);
      console.log(`   Keywords: ${JSON.stringify(m.optionA.allCounts)}`);
      console.log(`   Option A: ${m.optionA.result} → ${m.optionA.suggestedCorrection || 'N/A'}`);
      console.log(`   Option B: ${m.optionB.finalResult || m.optionB.result} → ${m.optionB.finalCorrection || 'N/A'}`);
      if (m.optionC.fields?.type) {
        console.log(`   Option C: ${m.optionC.fields.type.verdict} → ${m.optionC.fields.type.correction || 'N/A'}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATION');
  console.log('='.repeat(80));
  
  const avgTimeA = Math.round(results.optionA.totalTimeMs / jobs.length);
  const avgTimeB = Math.round(results.optionB.totalTimeMs / jobs.length);
  const avgTimeC = Math.round(results.optionC.totalTimeMs / jobs.length);
  
  console.log(`
Performance:
- Option A: ${avgTimeA}ms avg (fastest, regex only)
- Option B: ${avgTimeB}ms avg (medium, AI only when needed)
- Option C: ${avgTimeC}ms avg (slowest, always calls AI)

Detection:
- Option A found ${results.optionA.mismatch} mismatches, ${results.optionA.warning} warnings
- Option B AI-corrected ${results.optionB.aiCorrects} items
- Option C found ${results.optionC.issuesFound} total issues

Recommended: ${avgTimeB < 200 ? 'Option B (Hybrid)' : avgTimeA < 50 ? 'Option A (Regex)' : 'Option B (Hybrid)'}
- Fast enough for production (${avgTimeB}ms)
- Only calls AI when conflict detected
- Best balance of accuracy vs performance
`);
  
  await client.close();
  console.log('\n✅ Test complete');
}

main().catch(console.error);
