const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('catalog-verification');
  
  const fifteenMin = new Date(Date.now() - 20 * 60 * 1000);
  const jobs = await db.collection('verification_jobs').find({ 
    createdAt: { $gte: fifteenMin } 
  }).toArray();
  
  const completed = jobs.filter(j => j.status === 'completed');
  const processing = jobs.filter(j => j.status === 'processing');
  const pending = jobs.filter(j => j.status === 'pending');
  const failed = jobs.filter(j => j.status === 'failed');
  
  console.log('━'.repeat(100));
  console.log(`📊 CURRENT STATUS`);
  console.log('━'.repeat(100));
  console.log(`Total: ${jobs.length} | ✅ Completed: ${completed.length} | ⚙️ Processing: ${processing.length} | ⏳ Pending: ${pending.length} | ❌ Failed: ${failed.length}`);
  console.log('━'.repeat(100) + '\n');
  
  if (completed.length > 0) {
    console.log(`✅ COMPLETED (${completed.length} total, showing last 20):\n`);
    completed.sort((a, b) => b.completedAt - a.completedAt).slice(0, 20).forEach((job, i) => {
      const cat = job.result?.Primary_Attributes?.Category_Subcategory?.split('/')[1]?.trim() || 'Unknown';
      const style = job.result?.Field_AI_Reviews?.product_style?.final_value || 'None';
      const time = Math.round((job.completedAt - job.createdAt) / 1000);
      console.log(`${String(i+1).padStart(2)}. ${job.sfCatalogName.padEnd(25)} → ${cat.substring(0,20).padEnd(20)} → "${style.padEnd(25)}" (${time}s)`);
    });
    console.log('');
  }
  
  if (processing.length > 0) {
    console.log(`⚙️ CURRENTLY PROCESSING (${processing.length}):\n`);
    processing.forEach((job, i) => {
      const elapsed = Math.round((Date.now() - job.createdAt.getTime()) / 1000);
      console.log(`${i+1}. ${job.sfCatalogName} (${elapsed}s elapsed)`);
    });
    console.log('');
  }
  
  console.log(`Progress: ${completed.length}/${jobs.length} (${Math.round(completed.length/jobs.length*100)}%)`);
  
  await client.close();
})();
