#!/usr/bin/env node
/**
 * APPLIANCE FEATURES REALTIME MONITOR
 * ====================================
 * Monitors incoming verification jobs and audits:
 * 1. Width (Inches) appears in appliance titles
 * 2. Appliance_Features section is present for appliances
 * 3. built_in logic correctly restricted to Oven & Refrigerator
 * 4. Feature detection accuracy
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'catalog-verification';

const APPLIANCE_CATEGORIES = [
  'Refrigerator',
  'Freezer', 
  'Microwave',
  'Washer',
  'Dryer',
  'All-in-One Washer/Dryer',
  'Oven',
  'Range',
  'Dishwasher',
  'Cooktop',
  'Ice Maker'
];

async function monitorVerifications() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    console.log('🔍 Monitoring verification jobs for Appliance_Features and Width...\n');
    console.log('=' .repeat(80));
    
    const db = client.db(DB_NAME);
    const collection = db.collection('verificationjobs');
    
    // Get last 10 appliance verifications
    const recentJobs = await collection.find({
      'response.Primary_Attributes.AI_Product_Department': 'Appliances',
      status: 'completed'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
    
    console.log(`\n📊 Found ${recentJobs.length} recent appliance verifications\n`);
    
    let widthCount = 0;
    let applianceFeaturesCount = 0;
    let builtInOvenCount = 0;
    let builtInRefrigeratorCount = 0;
    let builtInOtherCount = 0;
    
    for (const job of recentJobs) {
      const response = job.response || {};
      const primaryAttrs = response.Primary_Attributes || {};
      const appFeatures = response.Appliance_Features;
      
      const category = primaryAttrs.AI_Product_Category || 'Unknown';
      const title = primaryAttrs.AI_Product_Title || '';
      const catalogId = job.SF_Catalog_Id || 'Unknown';
      
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📦 ${catalogId}`);
      console.log(`   Category: ${category}`);
      console.log(`   Title: ${title}`);
      
      // Check for Width in title
      const hasWidth = /\d+-Inch/.test(title);
      if (hasWidth) {
        widthCount++;
        console.log(`   ✅ Width present: ${title.match(/\d+-Inch/)[0]}`);
      } else if (APPLIANCE_CATEGORIES.slice(0, 6).includes(category)) {
        console.log(`   ⚠️  Width missing (expected for ${category})`);
      }
      
      // Check for Appliance_Features
      if (appFeatures) {
        applianceFeaturesCount++;
        console.log(`   ✅ Appliance_Features present:`);
        console.log(`      - built_in: ${appFeatures.built_in}`);
        console.log(`      - panel_ready: ${appFeatures.panel_ready}`);
        console.log(`      - standard_depth: ${appFeatures.standard_depth}`);
        console.log(`      - voltage_120v: ${appFeatures.voltage_120v}`);
        console.log(`      - voltage_240v: ${appFeatures.voltage_240v}`);
        console.log(`      - fuel_gas: ${appFeatures.fuel_gas}`);
        console.log(`      - fuel_electric: ${appFeatures.fuel_electric}`);
        
        // Audit built_in logic
        if (appFeatures.built_in) {
          if (category === 'Oven') {
            builtInOvenCount++;
            console.log(`      ✅ built_in=true for Oven (correct)`);
          } else if (category === 'Refrigerator') {
            builtInRefrigeratorCount++;
            console.log(`      ✅ built_in=true for Refrigerator (correct)`);
          } else {
            builtInOtherCount++;
            console.log(`      🔴 ERROR: built_in=true for ${category} (should only be Oven/Refrigerator)`);
          }
        }
      } else {
        console.log(`   ⚠️  Appliance_Features missing`);
      }
    }
    
    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log(`\n📊 AUDIT SUMMARY`);
    console.log(`   Total Appliance Jobs: ${recentJobs.length}`);
    console.log(`   Width in Titles: ${widthCount}/${recentJobs.length}`);
    console.log(`   Appliance_Features Present: ${applianceFeaturesCount}/${recentJobs.length}`);
    console.log(`   built_in=true for Oven: ${builtInOvenCount}`);
    console.log(`   built_in=true for Refrigerator: ${builtInRefrigeratorCount}`);
    if (builtInOtherCount > 0) {
      console.log(`   🔴 built_in=true for OTHER categories: ${builtInOtherCount} (ERROR!)`);
    } else {
      console.log(`   ✅ built_in logic correctly restricted`);
    }
    
    console.log(`\n✅ Monitoring complete`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

// Run monitor
monitorVerifications().catch(console.error);
