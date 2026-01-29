const mongoose = require('mongoose');

async function checkTrackers() {
  await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
  
  const APITracker = mongoose.model('APITracker', new mongoose.Schema({}, { strict: false, collection: 'apitrackers' }));
  
  const trackers = await APITracker.find().lean();
  
  console.log('\n=== ALL API TRACKERS ===\n');
  console.log(`Total found: ${trackers.length}\n`);
  
  trackers.forEach((tracker, i) => {
    console.log(`${i + 1}. Session: ${tracker.sessionId}`);
    console.log(`   Issues: ${tracker.issues?.length || 0}`);
    console.log(`   Self-Healing Attempts: ${tracker.selfHealingAttempts?.length || 0}`);
    console.log(`   Created: ${tracker.timestamp || tracker.createdAt || 'N/A'}\n`);
  });
  
  await mongoose.disconnect();
}

checkTrackers().catch(console.error);
