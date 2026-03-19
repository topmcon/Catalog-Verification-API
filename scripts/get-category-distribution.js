const { MongoClient } = require('mongodb');

(async () => {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db = client.db('catalog-verification');
  
  console.log('=== Category Distribution (All Time) ===\n');
  
  const results = await db.collection('verification_jobs').aggregate([
    { $match: { status: 'completed', 'result.Primary_Attributes': { $exists: true } } },
    { $group: { _id: '$result.Primary_Attributes.AI_Product_Category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 40 }
  ]).toArray();
  
  const total = results.reduce((sum, r) => sum + r.count, 0);
  
  results.forEach((r, i) => {
    const pct = ((r.count / total) * 100).toFixed(1);
    console.log(`${(i+1).toString().padStart(2)}. ${(r._id || 'NULL').padEnd(45)} ${r.count.toString().padStart(6)}  (${pct.padStart(5)}%)`);
  });
  
  console.log(`\n${'TOTAL'.padEnd(48)} ${total.toString().padStart(6)}`);
  
  client.close();
})();
