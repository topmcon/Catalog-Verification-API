#!/usr/bin/env node

/**
 * FINAL CONFIRMATION PASS - COMPREHENSIVE RAW vs AI COMPARISON
 * =============================================================
 * 
 * This is the REAL test: Compare AI outputs against raw source data
 * to find where AI made errors or invented information.
 * 
 * For each job, we check:
 * 1. BRAND: Does AI brand match raw Brand_Legacy?
 * 2. CATEGORY: Does AI category match raw Category_Legacy?
 * 3. TYPE: Is AI type supported by raw title/description keywords?
 * 4. DIMENSIONS: Do AI dimensions match raw Height/Depth/Width_Legacy?
 * 5. WEIGHT: Does AI weight match raw Weight_Legacy?
 * 6. STYLE: Is AI style valid for the product?
 * 
 * Options:
 * A) Regex-only: Fast pattern matching
 * B) Hybrid: Regex + AI for uncertain cases
 * C) Full AI: Send everything to AI for verification
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { MongoClient } = require('mongodb');
const OpenAI = require('openai');

// ============================================================================
// CONFIGURATION
// ============================================================================

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'catalog-verification';

// Parse command line args
const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const optionArg = args.find(a => a.startsWith('--option='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 50;
const OPTION = optionArg ? optionArg.split('=')[1].toUpperCase() : 'ALL';

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Get all raw text from job for keyword searching
 */
function getRawText(job) {
  const raw = job.rawPayload || {};
  return [
    raw.Product_Title_Legacy,
    raw.Product_Description_Legacy,
    raw.Brand_Legacy,
    raw.Model_Number_Legacy,
    raw.Ferguson_Product_Type,
    raw.Web_Retailer_SubCategory
  ].filter(Boolean).join(' ').toLowerCase();
}

/**
 * Convert fraction string to decimal
 * "43 1/8" -> 43.125
 */
function fractionToDecimal(str) {
  if (!str) return null;
  const s = str.toString().trim();
  
  // Match: "43 1/8" or "43.5" or "43"
  const match = s.match(/^(\d+)(?:\s+(\d+)\/(\d+))?$/);
  if (match) {
    const whole = parseFloat(match[1]);
    if (match[2] && match[3]) {
      return whole + parseFloat(match[2]) / parseFloat(match[3]);
    }
    return whole;
  }
  
  // Try plain number
  const num = parseFloat(s.replace(/[^\d.]/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * OPTION A: Regex-only validation
 * Compare AI outputs against raw data using pattern matching
 */
function optionA_RegexValidation(job) {
  const raw = job.rawPayload || {};
  const ai = job.result?.Primary_Attributes || {};
  const rawText = getRawText(job);
  const issues = [];
  
  // 1. BRAND CHECK
  const rawBrand = (raw.Brand_Legacy || '').toLowerCase().trim();
  const aiBrand = (ai.Brand_Verified || '').toLowerCase().trim();
  if (aiBrand && rawBrand) {
    // Check if AI brand is different from raw brand
    if (!rawBrand.includes(aiBrand) && !aiBrand.includes(rawBrand)) {
      // Check if AI brand appears anywhere in raw text
      if (!rawText.includes(aiBrand.split(' ')[0])) {
        issues.push({
          field: 'Brand',
          severity: 'ERROR',
          raw: raw.Brand_Legacy,
          ai: ai.Brand_Verified,
          reason: 'AI brand not found in raw data'
        });
      }
    }
  }
  
  // 2. CATEGORY CHECK
  const rawCat = (raw.Category_Legacy || '').toLowerCase().trim();
  const aiCat = (ai.Category_Verified || '').toLowerCase().trim();
  if (aiCat && rawCat && rawCat !== aiCat) {
    // Categories should match exactly or be closely related
    if (!aiCat.includes(rawCat) && !rawCat.includes(aiCat)) {
      issues.push({
        field: 'Category',
        severity: 'ERROR',
        raw: raw.Category_Legacy,
        ai: ai.Category_Verified,
        reason: 'AI category differs from raw category'
      });
    }
  }
  
  // 3. TYPE CHECK - Most important for Range Hoods
  const aiType = (ai.AI_Type || '').toLowerCase().trim();
  if (aiType && aiType !== 'accessory') {
    const typeKeywords = {
      'insert': ['insert', 'liner', 'hood liner'],
      'wall-mounted': ['wall mount', 'wall-mount', 'wall mounted', 'chimney'],
      'wall mount': ['wall mount', 'wall-mount', 'wall mounted', 'chimney'],
      'under cabinet': ['under cabinet', 'under-cabinet', 'undercabinet'],
      'island mount': ['island', 'ceiling mount', 'ceiling-mount'],
      'island': ['island', 'ceiling mount'],
      'downdraft': ['downdraft', 'down draft', 'down-draft'],
      'pro-style': ['pro-style', 'professional', 'pro style'],
      'freestanding': ['freestanding', 'free-standing', 'free standing'],
      'slide-in': ['slide-in', 'slide in', 'slidein'],
      'drop-in': ['drop-in', 'drop in', 'dropin'],
      'french door': ['french door', 'french-door'],
      'side-by-side': ['side by side', 'side-by-side', 'sxs'],
      'single': ['single', 'wall oven', 'single oven'],
      'double wall': ['double', 'double oven', 'double wall'],
      'top-freezer': ['top freezer', 'top-freezer'],
      'bottom-freezer': ['bottom freezer', 'bottom-freezer'],
      'column': ['column', 'all refrigerator', 'all freezer']
    };
    
    const keywords = typeKeywords[aiType] || [aiType];
    const foundInRaw = keywords.some(kw => rawText.includes(kw));
    
    if (!foundInRaw) {
      // Check if there's a CONFLICTING type keyword in raw
      let conflictingType = null;
      for (const [type, kws] of Object.entries(typeKeywords)) {
        if (type !== aiType && kws.some(kw => rawText.includes(kw))) {
          conflictingType = type;
          break;
        }
      }
      
      if (conflictingType) {
        issues.push({
          field: 'Type',
          severity: 'ERROR',
          raw: `Found "${conflictingType}" keywords`,
          ai: ai.AI_Type,
          reason: `Raw data suggests "${conflictingType}" but AI chose "${ai.AI_Type}"`
        });
      } else {
        issues.push({
          field: 'Type',
          severity: 'WARNING',
          raw: 'No type keywords found',
          ai: ai.AI_Type,
          reason: 'AI type not supported by raw text (inference)'
        });
      }
    }
  }
  
  // 4. DIMENSIONS CHECK
  const dimFields = [
    { name: 'Height', raw: raw.Height_Legacy, ai: ai.Height_Verified },
    { name: 'Depth', raw: raw.Depth_Legacy, ai: ai.Depth_Verified },
    { name: 'Width', raw: raw.Width_Legacy, ai: ai.Width_Verified }
  ];
  
  for (const dim of dimFields) {
    if (dim.raw && dim.ai) {
      const rawVal = fractionToDecimal(dim.raw);
      const aiVal = fractionToDecimal(dim.ai);
      
      if (rawVal && aiVal) {
        const diff = Math.abs(rawVal - aiVal);
        if (diff > 0.5) {  // More than 0.5 inch difference
          issues.push({
            field: dim.name,
            severity: diff > 2 ? 'ERROR' : 'WARNING',
            raw: dim.raw,
            ai: dim.ai,
            reason: `Dimension differs by ${diff.toFixed(2)}"`
          });
        }
      }
    }
  }
  
  // 5. WEIGHT CHECK
  if (raw.Weight_Legacy && ai.Weight_Verified) {
    const rawWeight = parseFloat(raw.Weight_Legacy.toString().replace(/[^\d.]/g, ''));
    const aiWeight = parseFloat(ai.Weight_Verified.toString().replace(/[^\d.]/g, ''));
    
    if (!isNaN(rawWeight) && !isNaN(aiWeight)) {
      const diff = Math.abs(rawWeight - aiWeight);
      if (diff > 2) {  // More than 2 lbs difference
        issues.push({
          field: 'Weight',
          severity: diff > 10 ? 'ERROR' : 'WARNING',
          raw: raw.Weight_Legacy,
          ai: ai.Weight_Verified,
          reason: `Weight differs by ${diff.toFixed(1)} lbs`
        });
      }
    }
  }
  
  return {
    status: issues.filter(i => i.severity === 'ERROR').length > 0 ? 'ERROR' :
            issues.filter(i => i.severity === 'WARNING').length > 0 ? 'WARNING' : 'PASS',
    issues,
    method: 'regex'
  };
}

/**
 * OPTION B: Hybrid validation
 * Use regex first, then AI for uncertain cases
 */
async function optionB_HybridValidation(job, openai) {
  const regexResult = optionA_RegexValidation(job);
  
  // If regex finds no issues, we're done
  if (regexResult.status === 'PASS') {
    return { ...regexResult, method: 'regex' };
  }
  
  // If we have errors/warnings, use AI to confirm
  if (!openai) {
    return { ...regexResult, method: 'regex (no AI available)' };
  }
  
  const raw = job.rawPayload || {};
  const ai = job.result?.Primary_Attributes || {};
  
  const prompt = `You are validating AI product verification results against raw source data.

RAW SOURCE DATA (what the retailer provided):
- Title: ${raw.Product_Title_Legacy || 'N/A'}
- Brand: ${raw.Brand_Legacy || 'N/A'}
- Category: ${raw.Category_Legacy || 'N/A'}
- Description: ${(raw.Product_Description_Legacy || '').substring(0, 500)}
- Height: ${raw.Height_Legacy || 'N/A'}
- Depth: ${raw.Depth_Legacy || 'N/A'}
- Width: ${raw.Width_Legacy || 'N/A'}
- Weight: ${raw.Weight_Legacy || 'N/A'}
- SubCategory: ${raw.Web_Retailer_SubCategory || 'N/A'}

AI VERIFICATION OUTPUT (what our system returned):
- Brand: ${ai.Brand_Verified || 'N/A'}
- Category: ${ai.Category_Verified || 'N/A'}
- Type: ${ai.AI_Type || 'N/A'}
- Height: ${ai.Height_Verified || 'N/A'}
- Depth: ${ai.Depth_Verified || 'N/A'}
- Width: ${ai.Width_Verified || 'N/A'}
- Weight: ${ai.Weight_Verified || 'N/A'}

FLAGGED ISSUES BY REGEX:
${regexResult.issues.map(i => `- ${i.field}: ${i.reason} (Raw: ${i.raw}, AI: ${i.ai})`).join('\n')}

For each flagged issue, respond with:
1. Is it a REAL ERROR (AI got it wrong)?
2. Is it a FALSE POSITIVE (AI is actually correct)?
3. What should the correct value be?

Format your response as JSON:
{
  "issues": [
    {
      "field": "field_name",
      "verdict": "ERROR" | "FALSE_POSITIVE",
      "correct_value": "the correct value",
      "explanation": "brief explanation"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    
    const aiReview = JSON.parse(response.choices[0].message.content);
    
    // Update issues based on AI review
    const confirmedIssues = [];
    for (const issue of regexResult.issues) {
      const aiVerdict = aiReview.issues?.find(i => i.field.toLowerCase() === issue.field.toLowerCase());
      if (aiVerdict && aiVerdict.verdict === 'ERROR') {
        confirmedIssues.push({
          ...issue,
          aiVerified: true,
          correctValue: aiVerdict.correct_value,
          explanation: aiVerdict.explanation
        });
      }
    }
    
    return {
      status: confirmedIssues.length > 0 ? 'ERROR' : 'PASS',
      issues: confirmedIssues,
      method: 'hybrid (AI verified)',
      regexFlagged: regexResult.issues.length,
      aiConfirmed: confirmedIssues.length
    };
    
  } catch (err) {
    console.error('AI call failed:', err.message);
    return { ...regexResult, method: 'regex (AI failed)' };
  }
}

/**
 * OPTION C: Full AI validation
 * Send raw + AI data to AI for comprehensive review
 */
async function optionC_FullAIValidation(job, openai) {
  if (!openai) {
    return { status: 'SKIPPED', issues: [], method: 'no AI available' };
  }
  
  const raw = job.rawPayload || {};
  const ai = job.result?.Primary_Attributes || {};
  
  const prompt = `You are a product data quality validator. Compare the AI verification output against the raw source data and identify ANY discrepancies.

RAW SOURCE DATA (ground truth from retailer):
- Title: ${raw.Product_Title_Legacy || 'N/A'}
- Brand: ${raw.Brand_Legacy || 'N/A'}
- Category: ${raw.Category_Legacy || 'N/A'}
- Model: ${raw.Model_Number_Legacy || 'N/A'}
- Description: ${(raw.Product_Description_Legacy || '').substring(0, 800)}
- Height: ${raw.Height_Legacy || 'N/A'}
- Depth: ${raw.Depth_Legacy || 'N/A'}
- Width: ${raw.Width_Legacy || 'N/A'}
- Weight: ${raw.Weight_Legacy || 'N/A'}
- SubCategory: ${raw.Web_Retailer_SubCategory || 'N/A'}
- Product Type: ${raw.Ferguson_Product_Type || 'N/A'}

AI VERIFICATION OUTPUT (what our system returned to Salesforce):
- Brand_Verified: ${ai.Brand_Verified || 'N/A'}
- Category_Verified: ${ai.Category_Verified || 'N/A'}
- AI_Type: ${ai.AI_Type || 'N/A'}
- Height_Verified: ${ai.Height_Verified || 'N/A'}
- Depth_Verified: ${ai.Depth_Verified || 'N/A'}
- Width_Verified: ${ai.Width_Verified || 'N/A'}
- Weight_Verified: ${ai.Weight_Verified || 'N/A'}
- Product_Style_Verified: ${ai.Product_Style_Verified || 'N/A'}

VALIDATION RULES:
1. Brand must match raw Brand_Legacy or be clearly supported by title/description
2. Category must match raw Category_Legacy
3. Type must be supported by keywords in title/description (e.g., "insert", "wall mount", "island")
4. Dimensions must match raw values (accounting for fraction→decimal conversion like "43 1/8" = 43.125)
5. Weight must match raw value

Respond with JSON listing ALL discrepancies found:
{
  "issues": [
    {
      "field": "field_name",
      "raw_value": "what raw data shows",
      "ai_value": "what AI returned",
      "severity": "ERROR" | "WARNING",
      "explanation": "why this is wrong"
    }
  ],
  "summary": "Brief overall assessment"
}

If everything matches correctly, return: { "issues": [], "summary": "All AI outputs match raw data" }`;

  try {
    const start = Date.now();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    const elapsed = Date.now() - start;
    
    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      status: result.issues?.length > 0 ? 'ERROR' : 'PASS',
      issues: result.issues || [],
      summary: result.summary,
      method: 'full AI review',
      timeMs: elapsed
    };
    
  } catch (err) {
    console.error('AI call failed:', err.message);
    return { status: 'ERROR', issues: [{ field: 'AI', reason: err.message }], method: 'AI failed' };
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTest() {
  console.log('='.repeat(80));
  console.log('FINAL CONFIRMATION PASS - RAW vs AI VALIDATION TEST');
  console.log(`Testing ${LIMIT} recent jobs | Option: ${OPTION}`);
  console.log('='.repeat(80));
  
  // Initialize
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  
  let openai = null;
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('✅ OpenAI configured');
  } catch (err) {
    console.log('⚠️ OpenAI not available');
  }
  
  // Get jobs
  const jobs = await db.collection('verification_jobs').find({
    status: 'completed',
    'result.Primary_Attributes': { $exists: true }
  }).sort({ updatedAt: -1 }).limit(LIMIT).toArray();
  
  console.log(`📊 Found ${jobs.length} jobs to test\n`);
  
  // Results tracking
  const results = {
    A: { pass: 0, warning: 0, error: 0, totalTime: 0, issues: [] },
    B: { pass: 0, warning: 0, error: 0, totalTime: 0, issues: [], aiCalls: 0 },
    C: { pass: 0, warning: 0, error: 0, totalTime: 0, issues: [] }
  };
  
  // Run tests
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const model = job.rawPayload?.Model_Number_Legacy || '?';
    const category = job.rawPayload?.Category_Legacy || '?';
    const aiType = job.result?.Primary_Attributes?.AI_Type || '?';
    
    console.log(`\n[${i + 1}/${jobs.length}] ${model}`);
    console.log(`   Category: ${category} | AI_Type: ${aiType}`);
    
    // Option A
    if (OPTION === 'ALL' || OPTION === 'A') {
      const startA = Date.now();
      const resultA = optionA_RegexValidation(job);
      const timeA = Date.now() - startA;
      results.A.totalTime += timeA;
      
      if (resultA.status === 'PASS') results.A.pass++;
      else if (resultA.status === 'WARNING') results.A.warning++;
      else results.A.error++;
      
      if (resultA.issues.length > 0) {
        results.A.issues.push({ model, issues: resultA.issues });
      }
      
      console.log(`   Option A (${timeA}ms): ${resultA.status} - ${resultA.issues.length} issues`);
      resultA.issues.forEach(iss => console.log(`      ${iss.severity}: ${iss.field} - ${iss.reason}`));
    }
    
    // Option B
    if (OPTION === 'ALL' || OPTION === 'B') {
      const startB = Date.now();
      const resultB = await optionB_HybridValidation(job, openai);
      const timeB = Date.now() - startB;
      results.B.totalTime += timeB;
      
      if (resultB.method.includes('AI')) results.B.aiCalls++;
      
      if (resultB.status === 'PASS') results.B.pass++;
      else if (resultB.status === 'WARNING') results.B.warning++;
      else results.B.error++;
      
      if (resultB.issues.length > 0) {
        results.B.issues.push({ model, issues: resultB.issues });
      }
      
      const aiNote = resultB.regexFlagged ? ` (regex flagged ${resultB.regexFlagged}, AI confirmed ${resultB.aiConfirmed || 0})` : '';
      console.log(`   Option B (${timeB}ms): ${resultB.status} - ${resultB.issues.length} issues${aiNote}`);
      resultB.issues.forEach(iss => console.log(`      ${iss.severity}: ${iss.field} - ${iss.reason}`));
    }
    
    // Option C
    if (OPTION === 'ALL' || OPTION === 'C') {
      const startC = Date.now();
      const resultC = await optionC_FullAIValidation(job, openai);
      const timeC = Date.now() - startC;
      results.C.totalTime += timeC;
      
      if (resultC.status === 'PASS') results.C.pass++;
      else if (resultC.status === 'WARNING') results.C.warning++;
      else results.C.error++;
      
      if (resultC.issues?.length > 0) {
        results.C.issues.push({ model, issues: resultC.issues });
      }
      
      console.log(`   Option C (${timeC}ms): ${resultC.status} - ${resultC.issues?.length || 0} issues`);
      resultC.issues?.forEach(iss => console.log(`      ${iss.severity}: ${iss.field} - ${iss.explanation}`));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  if (OPTION === 'ALL' || OPTION === 'A') {
    console.log('\n📊 OPTION A: Regex-Only');
    console.log(`   Pass: ${results.A.pass} | Warning: ${results.A.warning} | Error: ${results.A.error}`);
    console.log(`   Total time: ${results.A.totalTime}ms | Avg: ${Math.round(results.A.totalTime / jobs.length)}ms`);
    console.log(`   Products with issues: ${results.A.issues.length}`);
  }
  
  if (OPTION === 'ALL' || OPTION === 'B') {
    console.log('\n📊 OPTION B: Hybrid (Regex + AI)');
    console.log(`   Pass: ${results.B.pass} | Warning: ${results.B.warning} | Error: ${results.B.error}`);
    console.log(`   AI calls: ${results.B.aiCalls}/${jobs.length} (${Math.round(results.B.aiCalls/jobs.length*100)}%)`);
    console.log(`   Total time: ${results.B.totalTime}ms | Avg: ${Math.round(results.B.totalTime / jobs.length)}ms`);
    console.log(`   Products with issues: ${results.B.issues.length}`);
  }
  
  if (OPTION === 'ALL' || OPTION === 'C') {
    console.log('\n📊 OPTION C: Full AI Review');
    console.log(`   Pass: ${results.C.pass} | Warning: ${results.C.warning} | Error: ${results.C.error}`);
    console.log(`   Total time: ${results.C.totalTime}ms | Avg: ${Math.round(results.C.totalTime / jobs.length)}ms`);
    console.log(`   Products with issues: ${results.C.issues.length}`);
  }
  
  // Show issues found
  console.log('\n' + '='.repeat(80));
  console.log('ISSUES FOUND');
  console.log('='.repeat(80));
  
  const allIssues = [];
  if (results.A.issues.length > 0) {
    console.log('\n--- Option A Issues ---');
    results.A.issues.slice(0, 10).forEach(r => {
      console.log(`\n${r.model}:`);
      r.issues.forEach(i => console.log(`  ${i.severity} ${i.field}: ${i.reason}`));
      console.log(`    Raw: ${i.raw} | AI: ${i.ai}`);
    });
  }
  
  if (results.B.issues.length > 0) {
    console.log('\n--- Option B Issues (AI Confirmed) ---');
    results.B.issues.slice(0, 10).forEach(r => {
      console.log(`\n${r.model}:`);
      r.issues.forEach(i => {
        console.log(`  ${i.severity} ${i.field}: ${i.reason}`);
        if (i.correctValue) console.log(`    → Correct: ${i.correctValue}`);
      });
    });
  }
  
  if (results.C.issues.length > 0) {
    console.log('\n--- Option C Issues (Full AI) ---');
    results.C.issues.slice(0, 10).forEach(r => {
      console.log(`\n${r.model}:`);
      r.issues.forEach(i => {
        console.log(`  ${i.severity} ${i.field}: ${i.explanation}`);
        console.log(`    Raw: ${i.raw_value} | AI: ${i.ai_value}`);
      });
    });
  }
  
  await client.close();
}

runTest().catch(console.error);
