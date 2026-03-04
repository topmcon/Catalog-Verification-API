#!/bin/bash

# Live job monitoring script
# Usage: ./scripts/monitor-live-jobs.sh

echo "🔍 LIVE JOB MONITOR - Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

while true; do
  clear
  echo "🔍 LIVE JOB MONITOR - $(date '+%H:%M:%S')"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node -e \"
const { MongoClient } = require('mongodb');

(async () => {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('catalog-verification');
  
  // Get jobs from last 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const jobs = await db.collection('verification_jobs').find({
    createdAt: { \\\$gte: tenMinutesAgo }
  }).toArray();
  
  const completed = jobs.filter(j => j.status === 'completed');
  const processing = jobs.filter(j => j.status === 'processing');
  const pending = jobs.filter(j => j.status === 'pending');
  const failed = jobs.filter(j => j.status === 'failed');
  
  console.log(\\\`📊 STATUS (Last 10 minutes)\\\`);
  console.log(\\\`   Total: \\\${jobs.length} jobs\\\`);
  console.log(\\\`   ✅ Completed: \\\${completed.length}\\\`);
  console.log(\\\`   ⚙️  Processing: \\\${processing.length}\\\`);
  console.log(\\\`   ⏳ Pending: \\\${pending.length}\\\`);
  console.log(\\\`   ❌ Failed: \\\${failed.length}\\\`);
  console.log('');
  
  if (completed.length > 0) {
    console.log('━'.repeat(80));
    console.log('✅ RECENTLY COMPLETED (Last 10):');
    console.log('━'.repeat(80));
    
    const recent = completed.sort((a, b) => b.completedAt - a.completedAt).slice(0, 10);
    recent.forEach((job, i) => {
      const category = job.result?.Primary_Attributes?.Category_Subcategory?.split('/')[1]?.trim() || 'Unknown';
      const style = job.result?.Field_AI_Reviews?.product_style?.final_value || 'None';
      const time = Math.round((job.completedAt - job.createdAt) / 1000);
      const ago = Math.round((Date.now() - job.completedAt.getTime()) / 1000);
      
      console.log(\\\`\\\${i+1}. \\\${job.sfCatalogName.padEnd(20)} | Category: \\\${category.substring(0,15).padEnd(15)} | Style: \\\${style.padEnd(20)} | \\\${time}s (\\\${ago}s ago)\\\`);
    });
    console.log('');
  }
  
  if (processing.length > 0) {
    console.log('━'.repeat(80));
    console.log('⚙️  CURRENTLY PROCESSING:');
    console.log('━'.repeat(80));
    processing.forEach((job, i) => {
      const elapsed = Math.round((Date.now() - job.createdAt.getTime()) / 1000);
      console.log(\\\`\\\${i+1}. \\\${job.sfCatalogName} (running for \\\${elapsed}s)\\\`);
    });
    console.log('');
  }
  
  await client.close();
})();
\""
  
  echo ""
  echo "Refreshing in 10 seconds... (Ctrl+C to stop)"
  sleep 10
done
