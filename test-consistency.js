/**
 * Consistency Test - Run each payload 3 times and compare results
 */

const https = require('https');

const API_URL = 'https://verify.cxc-ai.com/api/verify/salesforce';
const API_KEY = 'af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd';

// Test payloads
const bathtubPayload = {
  SF_Catalog_Id: 'TEST-BATHTUB-001',
  SF_Catalog_Name: 'MTI Baths Andrea 19 Bathtub',
  Model_Number_Web_Retailer: '?',
  Brand_Web_Retailer: 'MTI Baths',
  Product_Title_Web_Retailer: 'MTI Baths Andrea 19 Freestanding Soaking Bathtub',
  Product_Description_Web_Retailer: 'The Andrea 19 is a stunning freestanding bathtub featuring a sculpted design and premium SculptureStone material.',
  MSRP_Web_Retailer: '4299.00',
  Web_Retailer_Category: 'Bathtubs',
  Web_Retailer_SubCategory: 'Freestanding Bathtubs',
  Ferguson_Brand: 'MTI Baths',
  Ferguson_Price: '3899.00',
  Ferguson_URL: 'https://www.ferguson.com/product/mti-baths-andrea-19',
  Reference_URL: 'https://www.webretailer.com/bathtubs/mti-andrea-19',
  Stock_Images: [
    { url: 'https://images.retailer.com/mti-andrea-19-front.jpg' },
    { url: 'https://images.retailer.com/mti-andrea-19-side.jpg' }
  ],
  Documents: [
    { url: 'https://docs.mtibaths.com/spec-sheet.pdf', name: 'Spec Sheet', type: 'specification' }
  ]
};

const sinkPayload = {
  SF_Catalog_Id: 'TEST-SINK-001',
  SF_Catalog_Name: 'Kohler Undermount Bathroom Sink',
  Model_Number_Web_Retailer: 'K-2882-0',
  Brand_Web_Retailer: 'Kohler',
  Product_Title_Web_Retailer: 'Kohler Verticyl Undermount Bathroom Sink',
  Product_Description_Web_Retailer: 'Clean sophisticated design with an oval basin shape, perfect for modern bathrooms.',
  MSRP_Web_Retailer: '289.00',
  Web_Retailer_Category: 'Bathroom Sinks',
  Ferguson_Brand: 'Kohler',
  Ferguson_Price: '259.00',
  Ferguson_URL: 'https://www.ferguson.com/product/kohler-verticyl-k2882',
  Reference_URL: 'https://www.webretailer.com/sinks/kohler-verticyl',
  Stock_Images: [
    { url: 'https://images.kohler.com/k-2882-0-top.jpg' }
  ],
  Documents: [
    { url: 'https://www.kohler.com/specs/K-2882-0.pdf', name: 'Product Specifications', type: 'specification' }
  ]
};

async function makeRequest(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const url = new URL(API_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve({ error: responseData });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function extractKey(response) {
  // Response might be wrapped in 'data' key
  const data = response.data || response;
  
  return {
    category: data.Primary_Attributes?.Category_Verified || 'N/A',
    subcategory: data.Primary_Attributes?.SubCategory_Verified || 'N/A',
    brand: data.Primary_Attributes?.Brand_Verified || 'N/A',
    score: data.Verification?.verification_score || 'N/A',
    status: data.Status || 'N/A',
    aiAgreement: data.AI_Review?.consensus?.agreement_percentage || 'N/A',
    openaiReviewed: data.AI_Review?.openai?.reviewed || false,
    xaiReviewed: data.AI_Review?.xai?.reviewed || false,
    fieldCount: Object.keys(data.Field_AI_Reviews || {}).length
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runConsistencyTest() {
  console.log('='.repeat(80));
  console.log('🔄 CONSISTENCY TEST - Running each payload 3 times');
  console.log('='.repeat(80));
  console.log('');

  // Test Bathtub
  console.log('━'.repeat(80));
  console.log('TEST 1: MTI Baths Bathtub - 3 consecutive calls');
  console.log('━'.repeat(80));

  const bathtubResults = [];
  for (let i = 1; i <= 3; i++) {
    console.log(`\n📤 Bathtub Call #${i}...`);
    const startTime = Date.now();
    const response = await makeRequest(bathtubPayload);
    const elapsed = Date.now() - startTime;
    
    const key = extractKey(response);
    bathtubResults.push(key);
    
    console.log(`   Category: ${key.category}`);
    console.log(`   SubCategory: ${key.subcategory}`);
    console.log(`   Brand: ${key.brand}`);
    console.log(`   Score: ${key.score}`);
    console.log(`   Status: ${key.status}`);
    console.log(`   AI Agreement: ${key.aiAgreement}%`);
    console.log(`   OpenAI Reviewed: ${key.openaiReviewed}`);
    console.log(`   xAI Reviewed: ${key.xaiReviewed}`);
    console.log(`   Fields Tracked: ${key.fieldCount}`);
    console.log(`   Response Time: ${elapsed}ms`);
    
    if (i < 3) await sleep(2000);
  }

  // Test Sink
  console.log('\n' + '━'.repeat(80));
  console.log('TEST 2: Kohler Sink - 3 consecutive calls');
  console.log('━'.repeat(80));

  const sinkResults = [];
  for (let i = 1; i <= 3; i++) {
    console.log(`\n📤 Sink Call #${i}...`);
    const startTime = Date.now();
    const response = await makeRequest(sinkPayload);
    const elapsed = Date.now() - startTime;
    
    const key = extractKey(response);
    sinkResults.push(key);
    
    console.log(`   Category: ${key.category}`);
    console.log(`   SubCategory: ${key.subcategory}`);
    console.log(`   Brand: ${key.brand}`);
    console.log(`   Score: ${key.score}`);
    console.log(`   Status: ${key.status}`);
    console.log(`   AI Agreement: ${key.aiAgreement}%`);
    console.log(`   OpenAI Reviewed: ${key.openaiReviewed}`);
    console.log(`   xAI Reviewed: ${key.xaiReviewed}`);
    console.log(`   Fields Tracked: ${key.fieldCount}`);
    console.log(`   Response Time: ${elapsed}ms`);
    
    if (i < 3) await sleep(2000);
  }

  // Consistency Analysis
  console.log('\n' + '━'.repeat(80));
  console.log('📊 CONSISTENCY ANALYSIS');
  console.log('━'.repeat(80));

  // Bathtub consistency
  console.log('\n🛁 BATHTUB:');
  const bathtubCategories = bathtubResults.map(r => r.category);
  const bathtubCatConsistent = bathtubCategories.every(c => c === bathtubCategories[0]);
  console.log(`   Category: ${bathtubCatConsistent ? '✅ CONSISTENT' : '⚠️  VARIES'} - ${bathtubCategories.join(' | ')}`);
  
  const bathtubScores = bathtubResults.map(r => r.score);
  const bathtubScoreConsistent = bathtubScores.every(s => s === bathtubScores[0]);
  console.log(`   Scores: ${bathtubScoreConsistent ? '✅ CONSISTENT' : '⚠️  VARIES'} - ${bathtubScores.join(' | ')}`);
  
  const bathtubAI = bathtubResults.map(r => r.aiAgreement);
  console.log(`   AI Agreement: ${bathtubAI.join('% | ')}%`);

  // Sink consistency
  console.log('\n🚰 SINK:');
  const sinkCategories = sinkResults.map(r => r.category);
  const sinkCatConsistent = sinkCategories.every(c => c === sinkCategories[0]);
  console.log(`   Category: ${sinkCatConsistent ? '✅ CONSISTENT' : '⚠️  VARIES'} - ${sinkCategories.join(' | ')}`);
  
  const sinkScores = sinkResults.map(r => r.score);
  const sinkScoreConsistent = sinkScores.every(s => s === sinkScores[0]);
  console.log(`   Scores: ${sinkScoreConsistent ? '✅ CONSISTENT' : '⚠️  VARIES'} - ${sinkScores.join(' | ')}`);
  
  const sinkAI = sinkResults.map(r => r.aiAgreement);
  console.log(`   AI Agreement: ${sinkAI.join('% | ')}%`);

  // Overall summary
  console.log('\n' + '='.repeat(80));
  console.log('📈 OVERALL CONSISTENCY SUMMARY');
  console.log('='.repeat(80));
  
  const allConsistent = bathtubCatConsistent && sinkCatConsistent;
  if (allConsistent) {
    console.log('✅ ALL CATEGORIES CONSISTENT across multiple runs');
  } else {
    console.log('⚠️  SOME INCONSISTENCIES detected - AI responses may vary');
  }
  
  console.log('');
}

runConsistencyTest().catch(console.error);
