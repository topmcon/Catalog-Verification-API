#!/usr/bin/env node

const { MongoClient } = require('mongodb');

async function analyzePendingSyncs() {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db = client.db('catalog-verification');
  
  // Get the most recent pending sync
  const pending = await db.collection('pending_picklist_syncs').findOne(
    { status: 'pending' },
    { sort: { created_at: -1 } }
  );
  
  if (!pending) {
    console.log('No pending syncs found');
    await client.close();
    return;
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           PENDING SYNC vs EXISTING PICKLISTS ANALYSIS         ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Sync ID:', pending.pending_id);
  console.log('Received:', new Date(pending.created_at).toLocaleString('en-US', { timeZone: 'America/New_York' }));
  console.log('Status:', pending.status.toUpperCase());
  console.log('');
  console.log('Impact Assessment:');
  console.log('  Severity:', pending.impact_assessment.severity.toUpperCase());
  console.log('  Reason:', pending.impact_assessment.reason);
  console.log('  Total Additions: +' + pending.impact_assessment.total_additions);
  console.log('  Total Removals: -' + pending.impact_assessment.total_removals);
  if (pending.impact_assessment.custom_fields_at_risk > 0) {
    console.log('  🔴 CUSTOM FIELDS AT RISK:', pending.impact_assessment.custom_fields_at_risk);
  }
  console.log('');
  
  // Process each pending change
  for (const change of pending.pending_changes) {
    const changeAmount = change.incoming_count - change.current_count;
    const changeStr = changeAmount >= 0 ? '+' + changeAmount : changeAmount;
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                  ' + change.type.toUpperCase() + '                  ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Summary:');
    console.log('  Current:   ', change.current_count);
    console.log('  Proposed:  ', change.incoming_count);
    console.log('  Net Change:', changeStr);
    console.log('  NEW items: ', change.items_to_add.length);
    console.log('  REMOVED:   ', change.items_to_remove.length);
    console.log('');
    
    if (change.custom_fields_at_risk && change.custom_fields_at_risk.length > 0) {
      console.log('⚠️  CUSTOM FIELDS AT RISK:');
      console.log('   ', change.custom_fields_at_risk.join(', '));
      console.log('');
    }
    
    if (change.items_to_add.length > 0) {
      console.log('✅ NEW ' + change.type.toUpperCase() + ' (' + change.items_to_add.length + '):');
      const displayCount = Math.min(30, change.items_to_add.length);
      for (let i = 0; i < displayCount; i++) {
        console.log('  + ' + change.items_to_add[i]);
      }
      if (change.items_to_add.length > 30) {
        console.log('  ... and ' + (change.items_to_add.length - 30) + ' more');
      }
      console.log('');
    }
    
    if (change.items_to_remove.length > 0) {
      console.log('❌ REMOVED ' + change.type.toUpperCase() + ' (' + change.items_to_remove.length + '):');
      const displayCount = Math.min(30, change.items_to_remove.length);
      for (let i = 0; i < displayCount; i++) {
        console.log('  - ' + change.items_to_remove[i]);
      }
      if (change.items_to_remove.length > 30) {
        console.log('  ... and ' + (change.items_to_remove.length - 30) + ' more');
      }
      console.log('');
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                      OVERALL SUMMARY                           ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Total New Items:     ', pending.impact_assessment.total_additions);
  console.log('Total Removed Items: ', pending.impact_assessment.total_removals);
  console.log('');
  console.log('🔴 CRITICAL WARNING:');
  console.log('  Severity:', pending.impact_assessment.severity.toUpperCase());
  console.log('  Impact:', pending.impact_assessment.reason);
  console.log('');
  if (pending.impact_assessment.warnings && pending.impact_assessment.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    for (const warning of pending.impact_assessment.warnings) {
      console.log('   ', warning);
    }
    console.log('');
  }
  console.log('⚠️  RECOMMENDATION: DO NOT APPLY THIS SYNC');
  console.log('   Use batch-reject script to discard all pending syncs');
  console.log('');
  
  await client.close();
}

analyzePendingSyncs().catch(console.error);

