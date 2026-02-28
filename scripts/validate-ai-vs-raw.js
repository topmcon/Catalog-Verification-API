/**
 * VALIDATE AI OUTPUT vs RAW DATA
 * ==============================
 * Compares what AI decided vs what raw Salesforce data shows
 * This is the core validation for Final Confirmation Pass
 */

const { MongoClient } = require('mongodb');

async function validateAIvsRaw() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('catalog-verification');
  
  console.log('=== AI OUTPUT vs RAW DATA VALIDATION ===');
  console.log('Testing 200 recent completed jobs\n');
  
  const jobs = await db.collection('verification_jobs').find({
    status: 'completed',
    'result.Primary_Attributes': { $exists: true }
  }).sort({ updatedAt: -1 }).limit(200).toArray();
  
  const issues = {
    brand: [],
    category: [],
    type: [],
    dimensions: [],
    weight: []
  };
  
  let checked = 0;
  
  for (const job of jobs) {
    const raw = job.rawPayload || {};
    const ai = job.result?.Primary_Attributes || {};
    checked++;
    
    // Combine all raw text for searching
    const rawText = [
      raw.Product_Title_Legacy,
      raw.Product_Description_Legacy,
      raw.Brand_Legacy,
      raw.Model_Number_Legacy,
      raw.Ferguson_Product_Type
    ].filter(Boolean).join(' ').toLowerCase();
    
    // 1. BRAND CHECK - Is AI brand in raw data?
    const aiBrand = (ai.Brand_Verified || '').toLowerCase();
    if (aiBrand && !rawText.includes(aiBrand.split(' ')[0])) {
      issues.brand.push({
        model: raw.Model_Number_Legacy,
        aiBrand: ai.Brand_Verified,
        rawBrand: raw.Brand_Legacy,
        inRaw: false
      });
    }
    
    // 2. CATEGORY CHECK - Does AI category match raw category?
    const aiCat = (ai.Category_Verified || '').toLowerCase();
    const rawCat = (raw.Category_Legacy || '').toLowerCase();
    if (aiCat && rawCat && !aiCat.includes(rawCat) && !rawCat.includes(aiCat)) {
      issues.category.push({
        model: raw.Model_Number_Legacy,
        aiCat: ai.Category_Verified,
        rawCat: raw.Category_Legacy
      });
    }
    
    // 3. TYPE CHECK - Is AI type keyword found in raw?
    const aiType = (ai.AI_Type || '').toLowerCase();
    if (aiType && aiType !== 'accessory') {
      const typeKeywords = {
        'insert': ['insert', 'liner'],
        'wall mount': ['wall mount', 'wall-mount', 'wallmount', 'chimney'],
        'wall-mounted': ['wall mount', 'wall-mount', 'wallmount', 'wall mounted', 'chimney'],
        'island': ['island'],
        'island mount': ['island'],
        'under cabinet': ['under cabinet', 'undercabinet', 'under-cabinet'],
        'downdraft': ['downdraft', 'down draft'],
        'french door': ['french door', 'french-door'],
        'side-by-side': ['side by side', 'side-by-side', 'sxs'],
        'single': ['single', 'wall oven', 'built-in', 'built in'],
        'double wall': ['double', 'double oven', 'double wall'],
        'pro-style': ['pro', 'professional', 'pro-style'],
        'freestanding': ['freestanding', 'free-standing', 'free standing'],
        'slide-in': ['slide-in', 'slide in', 'slidein'],
        'drop-in': ['drop-in', 'drop in', 'dropin']
      };
      
      const keywords = typeKeywords[aiType] || [aiType];
      const found = keywords.some(kw => rawText.includes(kw));
      
      if (!found) {
        issues.type.push({
          model: raw.Model_Number_Legacy,
          aiType: ai.AI_Type,
          title: (raw.Product_Title_Legacy || '').substring(0, 50),
          category: raw.Category_Legacy
        });
      }
    }
    
    // 4. DIMENSIONS CHECK - Are AI dimensions in raw?
    const rawDims = {
      height: raw.Height_Legacy,
      depth: raw.Depth_Legacy,
      width: raw.Width_Legacy
    };
    
    const aiDims = {
      height: ai.Height_Verified,
      depth: ai.Depth_Verified,
      width: ai.Width_Verified
    };
    
    for (const [dim, rawVal] of Object.entries(rawDims)) {
      const aiVal = aiDims[dim];
      if (rawVal && aiVal) {
        // Convert fraction to decimal for comparison
        const rawNum = rawVal.toString().match(/([\d.]+)/)?.[1];
        const aiNum = aiVal.toString().match(/([\d.]+)/)?.[1];
        
        if (rawNum && aiNum) {
          const diff = Math.abs(parseFloat(rawNum) - parseFloat(aiNum));
          if (diff > 1) { // More than 1 inch difference
            issues.dimensions.push({
              model: raw.Model_Number_Legacy,
              dim: dim,
              raw: rawVal,
              ai: aiVal
            });
          }
        }
      }
    }
    
    // 5. WEIGHT CHECK
    const rawWeight = raw.Weight_Legacy;
    const aiWeight = ai.Weight_Verified;
    if (rawWeight && aiWeight) {
      const rawNum = rawWeight.toString().match(/([\d.]+)/)?.[1];
      const aiNum = aiWeight.toString().match(/([\d.]+)/)?.[1];
      if (rawNum && aiNum && Math.abs(parseFloat(rawNum) - parseFloat(aiNum)) > 5) {
        issues.weight.push({
          model: raw.Model_Number_Legacy,
          raw: rawWeight,
          ai: aiWeight
        });
      }
    }
  }
  
  console.log('Jobs checked:', checked);
  console.log('\n=== DISCREPANCIES FOUND ===');
  
  console.log('\n1. BRAND MISMATCHES:', issues.brand.length);
  issues.brand.slice(0, 5).forEach(b => {
    console.log('   ', b.model, '- AI:', b.aiBrand, 'Raw:', b.rawBrand);
  });
  if (issues.brand.length > 5) console.log('   ...and', issues.brand.length - 5, 'more');
  
  console.log('\n2. CATEGORY MISMATCHES:', issues.category.length);
  issues.category.slice(0, 5).forEach(c => {
    console.log('   ', c.model, '- AI:', c.aiCat, 'Raw:', c.rawCat);
  });
  if (issues.category.length > 5) console.log('   ...and', issues.category.length - 5, 'more');
  
  console.log('\n3. TYPE NOT SUPPORTED BY RAW:', issues.type.length);
  issues.type.slice(0, 10).forEach(t => {
    console.log('   ', t.model, '- AI Type:', t.aiType, '| Category:', t.category);
    console.log('     Title:', t.title);
  });
  if (issues.type.length > 10) console.log('   ...and', issues.type.length - 10, 'more');
  
  console.log('\n4. DIMENSION DISCREPANCIES (>1" diff):', issues.dimensions.length);
  issues.dimensions.slice(0, 5).forEach(d => {
    console.log('   ', d.model, '-', d.dim, 'Raw:', d.raw, 'AI:', d.ai);
  });
  if (issues.dimensions.length > 5) console.log('   ...and', issues.dimensions.length - 5, 'more');
  
  console.log('\n5. WEIGHT DISCREPANCIES (>5 lbs diff):', issues.weight.length);
  issues.weight.slice(0, 5).forEach(w => {
    console.log('   ', w.model, '- Raw:', w.raw, 'AI:', w.ai);
  });
  if (issues.weight.length > 5) console.log('   ...and', issues.weight.length - 5, 'more');
  
  const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
  const accuracy = ((checked - totalIssues) / checked * 100).toFixed(1);
  
  console.log('\n=== SUMMARY ===');
  console.log('Total jobs:', checked);
  console.log('Total discrepancies:', totalIssues);
  console.log('Field breakdown:');
  console.log('  - Brand:', issues.brand.length);
  console.log('  - Category:', issues.category.length);
  console.log('  - Type:', issues.type.length);
  console.log('  - Dimensions:', issues.dimensions.length);
  console.log('  - Weight:', issues.weight.length);
  console.log('Overall accuracy:', accuracy + '%');
  
  await client.close();
}

validateAIvsRaw().catch(console.error);
