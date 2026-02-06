const { MongoClient } = require('mongodb');

async function showTodaysAnalytics() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('catalog-verification');
  const logs = db.collection('inconclusiveresponselogs');
  const jobs = db.collection('verification_jobs');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('RESPONSE QUALITY ANALYTICS - TODAY\'S SESSION');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Get today's date range (all of Feb 5, 2026)
  const startOfDay = new Date('2026-02-05T00:00:00.000Z');
  const endOfDay = new Date('2026-02-06T00:00:00.000Z');
  
  // Count total jobs processed today
  const totalJobs = await jobs.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay }
  });
  
  // Get all inconclusive responses from today
  const todaysLogs = await logs.find({
    timestamp: { $gte: startOfDay, $lt: endOfDay }
  }).toArray();
  
  console.log('📊 SESSION OVERVIEW');
  console.log('─'.repeat(60));
  console.log('Total verification jobs:', totalJobs);
  console.log('Inconclusive responses detected:', todaysLogs.length);
  console.log('');
  
  if (todaysLogs.length === 0) {
    console.log('🎉 NO INCONCLUSIVE RESPONSES DETECTED!');
    console.log('All AI responses were clear and actionable.\n');
    await client.close();
    process.exit(0);
  }
  
  // GROUP BY RESPONSE TYPE
  console.log('═══════════════════════════════════════════════════════');
  console.log('BREAKDOWN BY RESPONSE TYPE');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const byType = {};
  todaysLogs.forEach(log => {
    const type = log.responseType || 'unknown';
    byType[type] = (byType[type] || 0) + 1;
  });
  
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const percent = ((count / todaysLogs.length) * 100).toFixed(1);
      console.log(`${type.toUpperCase().padEnd(20)} ${count.toString().padStart(4)} (${percent}%)`);
    });
  
  // GROUP BY FIELD
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('BREAKDOWN BY FIELD (Top 10 Most Problematic)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const byField = {};
  todaysLogs.forEach(log => {
    const field = log.fieldName || 'unknown';
    byField[field] = (byField[field] || 0) + 1;
  });
  
  Object.entries(byField)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([field, count]) => {
      const percent = ((count / todaysLogs.length) * 100).toFixed(1);
      console.log(`${field.padEnd(30)} ${count.toString().padStart(4)} (${percent}%)`);
    });
  
  // SAMPLE RESPONSES
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('SAMPLE INCONCLUSIVE RESPONSES (First 5)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  todaysLogs.slice(0, 5).forEach((log, i) => {
    console.log(`${i + 1}. ${log.fieldName || 'unknown field'} (${log.responseType})`);
    console.log(`   Catalog: ${log.sfCatalogName || 'N/A'}`);
    console.log(`   AI Response: "${(log.aiResponse || '').substring(0, 100)}..."`);
    console.log('');
  });
  
  // RECOMMENDATIONS
  console.log('═══════════════════════════════════════════════════════');
  console.log('RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const topFields = Object.entries(byField)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (topFields.length > 0) {
    console.log('🔍 Fields needing prompt improvement:');
    topFields.forEach(([field, count]) => {
      console.log(`   - ${field} (${count} inconclusive responses)`);
    });
    console.log('');
  }
  
  const topTypes = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (topTypes.length > 0) {
    console.log('⚠️  Most common response issues:');
    topTypes.forEach(([type, count]) => {
      console.log(`   - ${type} (${count} occurrences)`);
    });
    console.log('');
  }
  
  // QUALITY SCORE
  const qualityScore = ((1 - (todaysLogs.length / (totalJobs * 10))) * 100).toFixed(1);
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📈 OVERALL QUALITY SCORE: ${qualityScore}%`);
  console.log('═══════════════════════════════════════════════════════');
  console.log(`(Based on ${todaysLogs.length} inconclusive responses out of ~${totalJobs * 10} total AI calls)`);
  console.log('');
  
  await client.close();
  process.exit(0);
}

showTodaysAnalytics().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
