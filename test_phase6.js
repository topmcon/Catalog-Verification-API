const { MongoClient } = require('mongodb');
const https = require('https');

async function testPhase6() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('catalog-verification');
  
  // Get 5 recent jobs with some missing fields
  const jobs = await db.collection('verificationjobs')
    .find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  
  console.log(`Found ${jobs.length} recent jobs`);
  
  // Analyze which would trigger Phase 6
  let wouldTriggerCount = 0;
  const criticalFields = ['brand', 'msrp', 'weight', 'upc_gtin', 'product_style', 'color', 'finish'];
  const notFoundIndicators = ['not found', 'unknown', 'n/a', 'not available', 'not specified', ''];
  
  for (const job of jobs) {
    const stillMissing = [];
    const primaryAttrs = job.result?.primary_attributes || {};
    const top15Attrs = job.result?.top_15_category_attributes || {};
    
    // Check primary
    for (const field of criticalFields) {
      const value = primaryAttrs[field];
      if (!value || notFoundIndicators.includes(String(value).toLowerCase().trim())) {
        stillMissing.push(field);
      }
    }
    
    // Check top15 for known critical fields
    const top15Critical = ['width', 'height', 'depth', 'material', 'voltage'];
    for (const [field, value] of Object.entries(top15Attrs)) {
      if (top15Critical.includes(field.toLowerCase())) {
        if (!value || notFoundIndicators.includes(String(value).toLowerCase().trim())) {
          stillMissing.push(field);
        }
      }
    }
    
    const prioritized = stillMissing.filter(f => 
      criticalFields.includes(f.toLowerCase()) || 
      top15Critical.includes(f.toLowerCase())
    ).slice(0, 10);
    
    if (prioritized.length > 0) {
      wouldTriggerCount++;
      if (wouldTriggerCount <= 10) {
        console.log(`\n${job.result?.primary_attributes?.brand || 'Unknown Brand'} - ${job.rawProduct?.SF_Catalog_Name || 'Unknown Model'}`);
        console.log(`  Missing critical fields: ${prioritized.join(', ')}`);
      }
    }
  }
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`SUMMARY: ${wouldTriggerCount} of ${jobs.length} jobs would now trigger Phase 6 web search`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  await client.close();
}

testPhase6().catch(console.error);
