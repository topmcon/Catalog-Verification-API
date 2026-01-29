const mongoose = require('mongoose');

async function debugIssueDetection() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    console.log('\n🔍 DEBUGGING ISSUE DETECTION\n');
    
    const jobId = '811a7b79-1149-447b-a9ff-a2ef23955097';
    
    // Load using raw collection
    const db = mongoose.connection.db;
    const tracker = await db.collection('api_trackers').findOne({ sessionId: jobId });
    
    console.log('1. Tracker found:', !!tracker);
    console.log('2. Has issues property:', tracker?.issues !== undefined);
    console.log('3. Issues is array:', Array.isArray(tracker?.issues));
    console.log('4. Issues count:', tracker?.issues?.length || 0);
    
    if (tracker?.issues && tracker.issues.length > 0) {
      console.log('\n5. First issue:');
      console.log('   Type:', tracker.issues[0].type);
      console.log('   Field:', tracker.issues[0].field);
      console.log('   Severity:', tracker.issues[0].severity);
      
      console.log('\n6. All issue types:');
      tracker.issues.forEach((issue, i) => {
        console.log(`   [${i}] ${issue.type} - ${issue.field}`);
      });
      
      console.log('\n7. Filter test:');
      const filtered = tracker.issues.filter(i => i.type === 'missing_top15_field');
      console.log('   Filtered count:', filtered.length);
      console.log('   Filtered fields:', filtered.map(i => i.field));
    } else {
      console.log('\n❌ NO ISSUES FOUND IN TRACKER');
    }
    
    // Now test with the actual model
    console.log('\n8. Testing with APITracker model:');
    const APITracker = require('../dist/models/api-tracker.model').default;
    const modelTracker = await APITracker.findOne({ sessionId: jobId });
    
    console.log('   Model tracker found:', !!modelTracker);
    console.log('   Model has issues:', modelTracker?.issues !== undefined);
    console.log('   Model issues count:', modelTracker?.issues?.length || 0);
    
    await mongoose.disconnect();
    console.log('\n✅ Debug complete\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

debugIssueDetection();
