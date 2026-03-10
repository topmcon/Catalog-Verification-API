#!/usr/bin/env node
/**
 * Check Recent Product Titles
 * Quick script to view recent verified product titles from the database
 */

const { MongoClient } = require('mongodb');

async function checkRecentTitles() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  
  try {
    await client.connect();
    const db = client.db('catalog-verification');
    const collection = db.collection('verification_jobs');
    
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const recentJobs = await collection
      .find(
        { 
          status: 'completed',
          createdAt: { $gte: tenMinutesAgo }
        },
        {
          projection: {
            'primaryResults.Product_Title_Verified': 1,
            'primaryResults.GPM_Verified': 1,
            'primaryResults.Brand_Verified': 1,
            'primaryResults.Category_Verified': 1,
            'rawProduct.Ferguson_Title': 1,
            'updatedAt': 1
          }
        }
      )
      .sort({ updatedAt: -1 })
      .limit(15)
      .toArray();
    
    console.log(`\n✅ Found ${recentJobs.length} completed verifications in the last 10 minutes\n`);
    
    recentJobs.forEach((job, index) => {
      const title = job.primaryResults?.Product_Title_Verified || 'N/A';
      const gpm = job.primaryResults?.GPM_Verified || 'N/A';
      const brand = job.primaryResults?.Brand_Verified || 'N/A';
      const category = job.primaryResults?.Category_Verified || 'N/A';
      const fergusonTitle = job.rawProduct?.Ferguson_Title || 'N/A';
      
      console.log(`${index + 1}. ${brand} - ${category}`);
      console.log(`   GPM: ${gpm}`);
      console.log(`   Title: ${title}`);
      if (fergusonTitle !== 'N/A') {
        console.log(`   Ferguson: ${fergusonTitle}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkRecentTitles();
