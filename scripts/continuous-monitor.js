const { MongoClient } = require('mongodb');

let lastCompletedCount = 0;
const startTime = Date.now();

async function monitor() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('catalog-verification');
  
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const jobs = await db.collection('verification_jobs').find({
    createdAt: { $gte: fifteenMinutesAgo }
  }).toArray();
  
  const completed = jobs.filter(j => j.status === 'completed');
  const processing = jobs.filter(j => j.status === 'processing');
  const pending = jobs.filter(j => j.status === 'pending');
  const failed = jobs.filter(j => j.status === 'failed');
  
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  
  console.clear();
  console.log('🔍 LIVE MONITORING - Elapsed: ' + elapsed + 's');
  console.log('━'.repeat(100));
  console.log(`📊 Total: ${jobs.length} | ✅ Completed: ${completed.length} | ⚙️ Processing: ${processing.length} | ⏳ Pending: ${pending.length} | ❌ Failed: ${failed.length}`);
  console.log('━'.repeat(100) + '\n');
  
  // Show new completions
  if (completed.length > lastCompletedCount) {
    const newCompletions = completed.sort((a, b) => b.completedAt - a.completedAt).slice(0, completed.length - lastCompletedCount);
    console.log('🎉 NEW COMPLETIONS:\n');
    newCompletions.forEach((job) => {
      const category = job.result?.Primary_Attributes?.Category_Subcategory?.split('/')[1]?.trim() || 'Unknown';
      const style = job.result?.Field_AI_Reviews?.product_style?.final_value || 'None';
      console.log(`  ✨ ${job.sfCatalogName} → ${category} → Style: "${style}"`);
    });
    console.log('');
    lastCompletedCount = completed.length;
  }
  
  // Show all completed
  if (completed.length > 0) {
    console.log('✅ ALL COMPLETED JOBS:\n');
    completed.sort((a, b) => b.completedAt - a.completedAt).forEach((job, i) => {
      const category = job.result?.Primary_Attributes?.Category_Subcategory?.split('/')[1]?.trim() || 'Unknown';
      const style = job.result?.Field_AI_Reviews?.product_style?.final_value || 'None';
      const time = Math.round((job.completedAt - job.createdAt) / 1000);
      console.log(`  ${i+1}. ${job.sfCatalogName.padEnd(25)} | ${category.substring(0,20).padEnd(20)} | Style: ${style.padEnd(25)} | ${time}s`);
    });
    console.log('');
  }
  
  if (processing.length > 0) {
    console.log('⚙️ PROCESSING:\n');
    processing.forEach((job, i) => {
      const elapsed = Math.round((Date.now() - job.createdAt.getTime()) / 1000);
      console.log(`  ${i+1}. ${job.sfCatalogName} (running for ${elapsed}s)`);
    });
    console.log('');
  }
  
  await client.close();
  
  // Stop if all done
  if (pending.length === 0 && processing.length === 0 && completed.length === jobs.length && jobs.length > 0) {
    console.log('━'.repeat(100));
    console.log('🎉 ALL JOBS COMPLETED!');
    console.log('━'.repeat(100));
    process.exit(0);
  }
  
  // Continue monitoring
  setTimeout(monitor, 15000); // Check every 15 seconds
}

monitor().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
