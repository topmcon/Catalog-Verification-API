const mongoose = require('mongoose');
const APITracker = require('/opt/catalog-verification-api/dist/models/api-tracker.model').default;

async function testQuery() {
  await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
  
  const jobId = '811a7b79-1149-447b-a9ff-a2ef23955097';
  
  console.log('\n=== TESTING TRACKER QUERY ===\n');
  console.log('Looking for sessionId:', jobId);
  
  console.log('\n1. Mongoose Model Query:');
  const tracker = await APITracker.findOne({ sessionId: jobId });
  console.log('   Result:', tracker ? 'FOUND ✅' : 'NOT FOUND ❌');
  
  if (tracker) {
    console.log('   Has issues:', tracker.issues?.length || 0);
  }
  
  console.log('\n2. Raw MongoDB Query:');
  const raw = await mongoose.connection.db.collection('api_trackers').findOne({ sessionId: jobId });
  console.log('   Result:', raw ? 'FOUND ✅' : 'NOT FOUND ❌');
  
  if (raw) {
    console.log('   Has issues:', raw.issues?.length || 0);
  }
  
  if (!tracker && raw) {
    console.log('\n⚠️  PROBLEM: Raw query works but Mongoose model fails!');
    console.log('   This suggests a model configuration issue.');
  }
  
  await mongoose.disconnect();
  console.log('\n=== TEST COMPLETE ===\n');
}

testQuery().catch(console.error);
