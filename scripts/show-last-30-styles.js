const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('catalog-verification');
  
  // Get last 30 jobs with full details
  const jobs = await db.collection('verification_jobs').find({
    status: 'completed'
  }).sort({ createdAt: -1 }).limit(30).toArray();
  
  console.log('\n' + '='.repeat(140));
  console.log('PRODUCT STYLE ANALYSIS: Last 30 Salesforce API Calls');
  console.log('='.repeat(140) + '\n');
  
  console.log('No. | Category              | Product                  | Model           | Style                | Date');
  console.log('-'.repeat(140));
  
  jobs.forEach((job, i) => {
    const category = job.result?.Primary_Attributes?.Category_Subcategory?.split('/')[1]?.trim() || 'Unknown';
    const product = (job.sfCatalogName || 'Unknown').substring(0, 24);
    const model = (job.result?.Primary_Attributes?.Model_Number || 'N/A').substring(0, 15);
    const style = (job.result?.Field_AI_Reviews?.product_style?.final_value || job.result?.Primary_Attributes?.Product_Style || 'None').substring(0, 20);
    const date = new Date(job.createdAt).toISOString().split('T')[0];
    
    const no = String(i + 1).padStart(3);
    const cat = category.substring(0, 21).padEnd(21);
    const prod = product.padEnd(24);
    const mod = model.padEnd(15);
    const sty = style.padEnd(20);
    
    console.log(`${no} | ${cat} | ${prod} | ${mod} | ${sty} | ${date}`);
  });
  
  console.log('\n' + '='.repeat(140));
  
  // Group by category and style
  const stylesByCategory = {};
  jobs.forEach(job => {
    const category = job.result?.Primary_Attributes?.Category_Subcategory?.split('/')[1]?.trim() || 'Unknown';
    const style = job.result?.Field_AI_Reviews?.product_style?.final_value || job.result?.Primary_Attributes?.Product_Style || 'None';
    
    if (!stylesByCategory[category]) {
      stylesByCategory[category] = {};
    }
    if (!stylesByCategory[category][style]) {
      stylesByCategory[category][style] = 0;
    }
    stylesByCategory[category][style]++;
  });
  
  console.log('\nSTYLE DISTRIBUTION BY CATEGORY:\n');
  Object.keys(stylesByCategory).sort().forEach(cat => {
    console.log(`${cat}:`);
    Object.entries(stylesByCategory[cat]).sort((a, b) => b[1] - a[1]).forEach(([style, count]) => {
      console.log(`  - ${style}: ${count} job${count > 1 ? 's' : ''}`);
    });
    console.log('');
  });
  
  await client.close();
})();
