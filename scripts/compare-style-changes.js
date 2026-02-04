const { MongoClient } = require('mongodb');
const { getValidStylesForCategory, matchStyleToCategory } = require('../dist/config/category-style-mapping');

(async () => {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('catalog-verification');
  
  // Fetch last 30 completed jobs
  const jobs = await db.collection('verification_jobs').find({
    status: 'completed'
  }).sort({ created_at: -1 }).limit(30).toArray();
  
  console.log(`\n${'='.repeat(120)}`);
  console.log('PRODUCT STYLE COMPARISON: OLD vs NEW (Last 30 Jobs)');
  console.log(`${'='.repeat(120)}\n`);
  
  const results = [];
  let changedCount = 0;
  let noChangeCount = 0;
  let noStyleCount = 0;
  
  jobs.forEach((job, index) => {
    const category = job.result?.Primary_Attributes?.Category_Subcategory?.split(' / ')[1] || 
                     job.sfCatalogName?.match(/Category:\s*([^,\n]+)/)?.[1]?.trim() ||
                     job.rawPayload?.salesforceData?.Category__c || 
                     'Unknown';
    
    const productName = job.rawPayload?.salesforceData?.Product_Name__c || 
                       job.sfCatalogName ||
                       job.result?.Primary_Attributes?.Product_Title || 
                       'Unknown Product';
    
    // Get the OLD style that was returned (from Field_AI_Reviews)
    const oldStyle = job.result?.Field_AI_Reviews?.product_style?.final_value || 
                     job.result?.Primary_Attributes?.Product_Style ||
                     null;
    
    if (!oldStyle || oldStyle === 'N/A' || oldStyle === 'Not Found') {
      noStyleCount++;
      results.push({
        index: index + 1,
        category,
        productName: productName.substring(0, 50),
        oldStyle: oldStyle || 'None',
        newStyle: 'None',
        changed: false,
        reason: 'No style in original response'
      });
      return;
    }
    
    // Get what the NEW style would be using the updated mapping
    const validStyles = getValidStylesForCategory(category);
    const newStyle = matchStyleToCategory(oldStyle, category) || oldStyle;
    
    const changed = oldStyle !== newStyle;
    if (changed) changedCount++;
    else noChangeCount++;
    
    results.push({
      index: index + 1,
      category,
      productName: productName.substring(0, 50),
      oldStyle,
      newStyle,
      changed,
      validForCategory: validStyles.includes(newStyle)
    });
  });
  
  // Print summary table
  console.log(`┌─────┬────────────────────────────┬──────────────────────────────────────────────────────┬─────────────────────────┬─────────────────────────┬─────────┐`);
  console.log(`│ No. │ Category                   │ Product                                              │ OLD Style               │ NEW Style               │ Changed │`);
  console.log(`├─────┼────────────────────────────┼──────────────────────────────────────────────────────┼─────────────────────────┼─────────────────────────┼─────────┤`);
  
  results.forEach(r => {
    const no = String(r.index).padEnd(3);
    const cat = r.category.substring(0, 26).padEnd(26);
    const prod = r.productName.substring(0, 52).padEnd(52);
    const oldS = r.oldStyle.substring(0, 23).padEnd(23);
    const newS = r.newStyle.substring(0, 23).padEnd(23);
    const chg = r.changed ? '   ✅   ' : '   ❌   ';
    
    console.log(`│ ${no} │ ${cat} │ ${prod} │ ${oldS} │ ${newS} │ ${chg} │`);
  });
  
  console.log(`└─────┴────────────────────────────┴──────────────────────────────────────────────────────┴─────────────────────────┴─────────────────────────┴─────────┘`);
  
  // Print summary statistics
  console.log(`\n${'='.repeat(120)}`);
  console.log('SUMMARY STATISTICS');
  console.log(`${'='.repeat(120)}\n`);
  console.log(`Total Jobs Analyzed:        ${jobs.length}`);
  console.log(`Jobs with Style Changes:    ${changedCount} (${((changedCount/jobs.length)*100).toFixed(1)}%)`);
  console.log(`Jobs with No Change:        ${noChangeCount} (${((noChangeCount/jobs.length)*100).toFixed(1)}%)`);
  console.log(`Jobs with No Style:         ${noStyleCount} (${((noStyleCount/jobs.length)*100).toFixed(1)}%)`);
  
  // Show detailed changes
  const changedJobs = results.filter(r => r.changed && r.oldStyle !== 'None');
  if (changedJobs.length > 0) {
    console.log(`\n${'='.repeat(120)}`);
    console.log('DETAILED CHANGES (Product Type First Strategy)');
    console.log(`${'='.repeat(120)}\n`);
    
    changedJobs.forEach(r => {
      console.log(`${r.index}. ${r.category}`);
      console.log(`   Product: ${r.productName}`);
      console.log(`   OLD (Design Aesthetic): "${r.oldStyle}"`);
      console.log(`   NEW (Product Type):     "${r.newStyle}"`);
      console.log(`   Valid for Category:     ${r.validForCategory ? '✅ Yes' : '❌ No - will use fallback'}`);
      console.log('');
    });
  }
  
  await client.close();
})();
