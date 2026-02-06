const { MongoClient } = require('mongodb');

async function showDetailedAnalytics() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('catalog-verification');
  const logs = db.collection('inconclusiveresponselogs');
  const jobs = db.collection('verification_jobs');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('RESPONSE QUALITY ANALYTICS - TODAY\'S SESSION');
  console.log('February 5, 2026');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const startOfDay = new Date('2026-02-05T00:00:00.000Z');
  const endOfDay = new Date('2026-02-06T00:00:00.000Z');
  
  const totalJobs = await jobs.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay }
  });
  
  const todaysLogs = await logs.find({
    timestamp: { $gte: startOfDay, $lt: endOfDay }
  }).toArray();
  
  console.log('📊 SESSION OVERVIEW');
  console.log('─'.repeat(60));
  console.log('Total verification jobs processed:  ', totalJobs);
  console.log('Inconclusive AI responses detected: ', todaysLogs.length);
  console.log('Quality score:                       ', ((1 - (todaysLogs.length / (totalJobs * 15))) * 100).toFixed(1) + '%');
  console.log('');
  
  // GROUP BY INCONCLUSIVE TYPE
  console.log('═══════════════════════════════════════════════════════');
  console.log('BREAKDOWN BY INCONCLUSIVE TYPE');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const byType = {};
  todaysLogs.forEach(log => {
    const type = log.inconclusive_type || 'unknown';
    byType[type] = (byType[type] || 0) + 1;
  });
  
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const percent = ((count / todaysLogs.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(count / 20));
      console.log(`${type.toUpperCase().padEnd(20)} ${count.toString().padStart(4)} (${percent.toString().padStart(5)}%) ${bar}`);
    });
  
  // GROUP BY FIELD
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('BREAKDOWN BY FIELD (Top 15 Most Problematic)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const byField = {};
  todaysLogs.forEach(log => {
    const field = log.field_name || 'unknown';
    byField[field] = (byField[field] || 0) + 1;
  });
  
  Object.entries(byField)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([field, count]) => {
      const percent = ((count / todaysLogs.length) * 100).toFixed(1);
      console.log(`${field.padEnd(35)} ${count.toString().padStart(4)} (${percent.toString().padStart(5)}%)`);
    });
  
  // CONSENSUS FAILURES
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('AI CONSENSUS ANALYSIS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const consensusFailed = todaysLogs.filter(log => log.consensus_reached === false).length;
  const consensusRate = ((1 - (consensusFailed / todaysLogs.length)) * 100).toFixed(1);
  
  console.log('Total inconclusive responses:     ', todaysLogs.length);
  console.log('Consensus failures (OpenAI ≠ xAI):', consensusFailed);
  console.log('Consensus success rate:           ', consensusRate + '%');
  console.log('');
  
  // PATTERN DETECTION
  console.log('═══════════════════════════════════════════════════════');
  console.log('DETECTED PATTERNS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const byPattern = {};
  todaysLogs.forEach(log => {
    const pattern = log.pattern_detected || 'No pattern';
    byPattern[pattern] = (byPattern[pattern] || 0) + 1;
  });
  
  Object.entries(byPattern)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([pattern, count]) => {
      console.log(`${pattern.padEnd(40)} ${count.toString().padStart(4)}`);
    });
  
  // PROBLEMATIC PRODUCTS
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('PRODUCTS WITH MOST ISSUES (Top 10)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const byProduct = {};
  todaysLogs.forEach(log => {
    const model = log.model_number || 'Unknown';
    byProduct[model] = (byProduct[model] || 0) + 1;
  });
  
  Object.entries(byProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([model, count]) => {
      console.log(`${model.padEnd(35)} ${count.toString().padStart(4)} issues`);
    });
  
  // RECOMMENDATIONS
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🎯 KEY INSIGHTS & RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const topIssues = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 3);
  
  console.log('1. Most Common Issues:');
  topIssues.forEach(([type, count]) => {
    console.log(`   • ${type}: ${count} occurrences (${((count/todaysLogs.length)*100).toFixed(1)}%)`);
  });
  console.log('');
  
  const topFields = Object.entries(byField).sort((a, b) => b[1] - a[1]).slice(0, 3);
  console.log('2. Fields Needing Attention:');
  topFields.forEach(([field, count]) => {
    console.log(`   • ${field}: ${count} inconclusive responses`);
  });
  console.log('');
  
  if (consensusRate < 90) {
    console.log('3. ⚠️  AI Consensus Rate Low');
    console.log(`   • Only ${consensusRate}% consensus between OpenAI and xAI`);
    console.log('   • Consider adjusting prompts or adding tie-breaker AI');
  } else {
    console.log('3. ✅ AI Consensus Rate Excellent');
    console.log(`   • ${consensusRate}% agreement between OpenAI and xAI`);
  }
  console.log('');
  
  // FINAL SCORE
  const avgIssuesPerJob = (todaysLogs.length / totalJobs).toFixed(1);
  console.log('═══════════════════════════════════════════════════════');
  console.log('📈 OVERALL PERFORMANCE METRICS');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Jobs processed:              ${totalJobs}`);
  console.log(`Avg inconclusive per job:    ${avgIssuesPerJob}`);
  console.log(`AI consensus rate:           ${consensusRate}%`);
  console.log(`Overall quality score:       ${((1 - (todaysLogs.length / (totalJobs * 15))) * 100).toFixed(1)}%`);
  console.log('');
  
  await client.close();
  process.exit(0);
}

showDetailedAnalytics().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
