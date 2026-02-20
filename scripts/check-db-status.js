const { MongoClient } = require('mongodb');

(async () => {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db = client.db('catalog-verification');
  
  const statuses = await db.collection('verification_jobs').distinct('status');
  console.log('Available statuses:', statuses);
  
  for (const status of statuses) {
    const count = await db.collection('verification_jobs').countDocuments({ status });
    console.log(`  ${status}: ${count}`);
  }
  
  const sample = await db.collection('verification_jobs').findOne({}, { sort: { created_at: -1 } });
  if (sample) {
    console.log('\nMost recent job:');
    console.log('  ID:', sample._id);
    console.log('  Status:', sample.status);
    console.log('  Created:', sample.created_at);
    console.log('  Has ai_consensus:', !!sample.ai_consensus);
  }
  
  await client.close();
})().catch(console.error);
