/**
 * Fetch last 10 verification jobs from production MongoDB
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function main() {
  const uri = 'mongodb://127.0.0.1:27017/catalog-verification';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('catalog-verification');
    const jobs = await db.collection('verification_jobs')
      .find({
        status: 'completed',
        result: { $exists: true, $ne: null }
      })
      .sort({ completedAt: -1 })
      .limit(10)
      .toArray();

    console.log(`✅ Found ${jobs.length} completed jobs`);

    // Save to file
    const outputPath = path.join(__dirname, '../test-data/production-jobs-snapshot.json');
    fs.writeFileSync(outputPath, JSON.stringify(jobs, null, 2));
    
    console.log(`✅ Saved to: ${outputPath}`);
    console.log(`\nJobs:`);
    jobs.forEach((job, i) => {
      console.log(`${i + 1}. ${job.sfCatalogName} (${job.sfCatalogId}) - ${job.completedAt} - Score: ${job.result?.Verification?.verification_score || 0}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
