const mongoose = require('mongoose');
const { AIUsage } = require('../dist/models/ai-usage.model');

async function checkVisionTaskTypes() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification', {
      serverSelectionTimeoutMS: 5000
    });

    const cutoffDate = new Date('2026-02-04T19:38:00Z');

    // Get sample vision calls with their session context
    const samples = await AIUsage.find({
      requestTimestamp: { $gte: cutoffDate },
      aiModel: 'grok-2-vision-1212'
    })
    .sort({ requestTimestamp: 1 })
    .limit(10)
    .select('sessionId taskType requestTimestamp');

    console.log('\n=== Sample Vision AI Calls ===');
    samples.forEach(s => {
      const time = new Date(s.requestTimestamp).toLocaleString('en-US', { timeZone: 'America/New_York' });
      console.log(`${time} | Session: ${s.sessionId.substring(0, 8)}... | Task: ${s.taskType || 'unknown'}`);
    });

    // Count by task type
    const byTask = await AIUsage.aggregate([
      { $match: { requestTimestamp: { $gte: cutoffDate }, aiModel: 'grok-2-vision-1212' } },
      { $group: { _id: '$taskType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n=== Vision Calls by Task Type ===');
    byTask.forEach(t => {
      const taskType = t._id || 'unknown';
      console.log(`${taskType}: ${t.count.toLocaleString()} calls`);
    });

    // Get unique session IDs to see how many different verification jobs used vision
    const uniqueSessions = await AIUsage.distinct('sessionId', {
      requestTimestamp: { $gte: cutoffDate },
      aiModel: 'grok-2-vision-1212'
    });

    console.log(`\n=== Session Analysis ===`);
    console.log(`Unique sessions with vision: ${uniqueSessions.length}`);
    console.log(`Total vision calls: 2,516`);
    console.log(`Avg calls per session: ${(2516 / uniqueSessions.length).toFixed(1)}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkVisionTaskTypes();
