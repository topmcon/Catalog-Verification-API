const mongoose = require('mongoose');

async function testOrchestrator() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    console.log('\n🔍 TESTING ORCHESTRATOR LOGIC\n');
    
    const jobId = '811a7b79-1149-447b-a9ff-a2ef23955097';
    
    // Import models
    const VerificationJob = require('./dist/models/verification-job.model').default;
    const APITracker = require('./dist/models/api-tracker.model').default;
    
    console.log('1. Loading job...');
    const job = await VerificationJob.findOne({ jobId });
    console.log('   Job found:', !!job);
    
    console.log('\n2. Loading tracker...');
    const tracker = await APITracker.findOne({ sessionId: jobId });
    console.log('   Tracker found:', !!tracker);
    console.log('   Has issues:', tracker?.issues !== undefined);
    console.log('   Issues count:', tracker?.issues?.length || 0);
    
    if (tracker) {
      console.log('\n3. Tracker object type:', tracker.constructor.name);
      console.log('   Is plain object:', tracker.constructor === Object);
      console.log('   Is Mongoose document:', tracker.constructor.name === 'model');
      
      console.log('\n4. Issues property:');
      console.log('   Type:', typeof tracker.issues);
      console.log('   Is array:', Array.isArray(tracker.issues));
      
      if (tracker.issues) {
        console.log('\n5. Testing filter (as in orchestrator):');
        const missingFields = tracker.issues
          ?.filter((issue) => issue.type === 'missing_top15_field')
          ?.map((issue) => issue.field) || [];
        
        console.log('   Missing fields count:', missingFields.length);
        console.log('   Missing fields:', missingFields);
        
        if (missingFields.length === 0) {
          console.log('\n❌ PROBLEM: Filter returned 0 results even though issues exist!');
          console.log('\nDirect access to first issue:');
          console.log('   tracker.issues[0]:', tracker.issues[0]);
          console.log('   tracker.issues[0].type:', tracker.issues[0]?.type);
        } else {
          console.log('\n✅ Filter works correctly!');
        }
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Test complete\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testOrchestrator();
