const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification').then(async () => {
  const result = await mongoose.connection.db.collection('pending_picklist_syncs').updateMany(
    { status: 'pending' },
    { 
      $set: { 
        status: 'rejected',
        reviewed_by: 'copilot-session-apr15-2026',
        reviewed_at: new Date(),
        notes: 'Rejected - conflicts with custom fields (subcategory, styles_apply). Only approved items we requested.' 
      }
    }
  );
  console.log('✅ Rejected ' + result.modifiedCount + ' pending syncs');
  await mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
