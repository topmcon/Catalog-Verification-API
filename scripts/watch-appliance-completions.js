#!/usr/bin/env node
/**
 * REALTIME APPLIANCE FEATURES WATCHER
 * ====================================
 * Watches MongoDB for newly completed verifications and displays results
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'catalog-verification';

async function watchForCompletions() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB - Watching for completed verifications...\n');
    console.log('Press Ctrl+C to stop\n');
    console.log('='.repeat(100));
    
    const db = client.db(DB_NAME);
    const collection = db.collection('verificationjobs');
    
    // Get baseline - last processed ID
    let lastCheckedTime = new Date();
    
    setInterval(async () => {
      try {
        // Find new completed jobs since last check
        const newJobs = await collection.find({
          status: 'completed',
          updatedAt: { $gt: lastCheckedTime }
        })
        .sort({ updatedAt: 1 })
        .toArray();
        
        if (newJobs.length > 0) {
          for (const job of newJobs) {
            const response = job.response || {};
            const primaryAttrs = response.Primary_Attributes || {};
            const appFeatures = response.Appliance_Features;
            const topAttrs = response.Top_Filter_Attributes || {};
            
            const category = primaryAttrs.AI_Product_Category || 'Unknown';
            const title = primaryAttrs.AI_Product_Title || '';
            const brand = primaryAttrs.AI_Product_Brand || '';
            const type = primaryAttrs.AI_Product_Type || '';
            const style = primaryAttrs.AI_Product_Style || '';
            const catalogId = job.SF_Catalog_Id || 'Unknown';
            const department = primaryAttrs.AI_Product_Department || '';
            
            console.log(`\n${'='.repeat(100)}`);
            console.log(`⚡ NEW COMPLETION at ${new Date(job.updatedAt).toLocaleTimeString()}`);
            console.log(`\n📦 SF Catalog ID: ${catalogId}`);
            console.log(`📂 Department: ${department}`);
            console.log(`📁 Category: ${category}`);
            console.log(`🏷️  Brand: ${brand}`);
            console.log(`🔖 Type: ${type}`);
            console.log(`🎨 Style: ${style}`);
            console.log(`\n📝 TITLE:`);
            console.log(`   ${title}`);
            
            // Check for Width in title
            const widthMatch = title.match(/(\d+)-Inch/);
            if (widthMatch) {
              console.log(`   ✅ Width detected: ${widthMatch[0]}`);
            } else if (['Refrigerator', 'Freezer', 'Microwave', 'Washer', 'Dryer', 'All-in-One Washer/Dryer'].includes(category)) {
              console.log(`   ⚠️  Width missing (expected for ${category})`);
            }
            
            // Display key attributes
            if (Object.keys(topAttrs).length > 0) {
              console.log(`\n🔧 TOP ATTRIBUTES:`);
              const displayKeys = ['Capacity (Cu. Ft.)', 'Width (Inches)', 'Finish', 'Configuration', 'Installation_Type', 'Voltage', 'Fuel_Type'];
              displayKeys.forEach(key => {
                if (topAttrs[key]) {
                  console.log(`   - ${key}: ${topAttrs[key]}`);
                }
              });
            }
            
            // Display Appliance_Features if present
            if (appFeatures) {
              console.log(`\n⚡ APPLIANCE_FEATURES: PRESENT ✅`);
              console.log(`   - built_in: ${appFeatures.built_in} ${appFeatures.built_in && !['Oven', 'Refrigerator'].includes(category) ? '🔴 ERROR!' : ''}`);
              console.log(`   - panel_ready: ${appFeatures.panel_ready}`);
              console.log(`   - standard_depth: ${appFeatures.standard_depth}`);
              console.log(`   - full_depth: ${appFeatures.full_depth}`);
              console.log(`   - voltage_120v: ${appFeatures.voltage_120v}`);
              console.log(`   - voltage_240v: ${appFeatures.voltage_240v}`);
              console.log(`   - fuel_gas: ${appFeatures.fuel_gas}`);
              console.log(`   - fuel_electric: ${appFeatures.fuel_electric}`);
              
              // Validate built_in logic
              if (appFeatures.built_in && !['Oven', 'Refrigerator'].includes(category)) {
                console.log(`\n   🔴 ERROR: built_in=true for ${category} (should only be Oven/Refrigerator)`);
              } else if (appFeatures.built_in) {
                console.log(`\n   ✅ built_in logic correct for ${category}`);
              }
            } else if (department === 'Appliances') {
              console.log(`\n⚠️  APPLIANCE_FEATURES: MISSING (expected for Appliances department)`);
            }
            
            console.log(`\n⏱️  Processing time: ${((job.updatedAt - job.createdAt) / 1000).toFixed(1)}s`);
            console.log(`📤 Webhook: ${response.webhookDelivered ? '✅ Sent' : '⚠️  Pending'}`);
            
            lastCheckedTime = job.updatedAt;
          }
        }
      } catch (err) {
        console.error('Error checking for new jobs:', err.message);
      }
    }, 2000); // Check every 2 seconds
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Monitor stopped');
  process.exit(0);
});

// Start watching
watchForCompletions();
