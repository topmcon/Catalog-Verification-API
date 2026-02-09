/**
 * Reprocess jobs that failed with context_length_exceeded errors
 * Uses the original data from VerificationJobs collection
 */

const mongoose = require('mongoose');
const axios = require('axios');

// Sessions that failed with context_length_exceeded (from logs)
const FAILED_SESSIONS = [
  '5a86cbc9-ed0c-4774-8961-e9cea2498364', // 132K tokens
  '1bbe59d0-9694-40c4-82c3-d1893a1ec11e', // 131K tokens
  '38c22809-938f-4263-be4c-4894938f0c03', // 128K tokens
  'd591b80c-591e-4a8b-af26-aab3abb82343', // 128K tokens
  'bddf104b-485b-4990-afcf-5b4ec8c1b1aa', // 143K tokens (the wall oven!)
];

async function reprocessFailedJobs() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
    console.log('✅ Connected to MongoDB');
    
    const VerificationJob = mongoose.model('VerificationJob', new mongoose.Schema({}, { strict: false, collection: 'verificationjobs' }));
    
    const results = [];
    
    for (const sessionId of FAILED_SESSIONS) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Processing session: ${sessionId}`);
      console.log('='.repeat(80));
      
      // Find the original job
      const job = await VerificationJob.findOne({ sessionId }).lean();
      
      if (!job) {
        console.log(`❌ Job not found for session ${sessionId}`);
        results.push({
          sessionId,
          status: 'not_found',
          error: 'Job not found in database'
        });
        continue;
      }
      
      console.log(`✅ Found job: ${job.SF_Catalog_Id || 'Unknown ID'}`);
      console.log(`   Model: ${job.Model_Number_Web_Retailer || 'Unknown'}`);
      console.log(`   Brand: ${job.Brand_Web_Retailer || 'Unknown'}`);
      console.log(`   Original specs count: ${job.Web_Retailer_Specs?.length || 0}`);
      console.log(`   Ferguson attrs count: ${job.Ferguson_Attributes?.length || 0}`);
      
      // Prepare the request body (use the original product data)
      const requestBody = {
        SF_Catalog_Id: job.SF_Catalog_Id,
        SF_Catalog_Name: job.SF_Catalog_Name,
        Brand_Web_Retailer: job.Brand_Web_Retailer,
        Model_Number_Web_Retailer: job.Model_Number_Web_Retailer,
        Product_Title_Web_Retailer: job.Product_Title_Web_Retailer,
        Product_Description_Web_Retailer: job.Product_Description_Web_Retailer,
        MSRP_Web_Retailer: job.MSRP_Web_Retailer,
        Web_Retailer_Category: job.Web_Retailer_Category,
        Web_Retailer_SubCategory: job.Web_Retailer_SubCategory,
        Width_Web_Retailer: job.Width_Web_Retailer,
        Height_Web_Retailer: job.Height_Web_Retailer,
        Depth_Web_Retailer: job.Depth_Web_Retailer,
        Weight_Web_Retailer: job.Weight_Web_Retailer,
        Capacity_Web_Retailer: job.Capacity_Web_Retailer,
        Color_Finish_Web_Retailer: job.Color_Finish_Web_Retailer,
        Web_Retailer_Specs: job.Web_Retailer_Specs || [],
        Ferguson_Brand: job.Ferguson_Brand,
        Ferguson_Model_Number: job.Ferguson_Model_Number,
        Ferguson_Title: job.Ferguson_Title,
        Ferguson_Description: job.Ferguson_Description,
        Ferguson_Price: job.Ferguson_Price,
        Ferguson_Min_Price: job.Ferguson_Min_Price,
        Ferguson_Max_Price: job.Ferguson_Max_Price,
        Ferguson_Base_Category: job.Ferguson_Base_Category,
        Ferguson_Product_Type: job.Ferguson_Product_Type,
        Ferguson_Business_Category: job.Ferguson_Business_Category,
        Ferguson_Width: job.Ferguson_Width,
        Ferguson_Height: job.Ferguson_Height,
        Ferguson_Depth: job.Ferguson_Depth,
        Ferguson_Finish: job.Ferguson_Finish,
        Ferguson_Manufacturer_Warranty: job.Ferguson_Manufacturer_Warranty,
        Ferguson_Attributes: job.Ferguson_Attributes || [],
        Ferguson_URL: job.Ferguson_URL,
        Reference_URL: job.Reference_URL || job.Manufacturer_URL,
        Stock_Images: job.Stock_Images || [],
        Documents: job.Documents || [],
        Specification_Table: job.Specification_Table,
      };
      
      try {
        console.log(`\n🔄 Reprocessing with new token management...`);
        
        const response = await axios.post('http://localhost:3001/api/verify/salesforce', requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.API_KEY || 'test-key',
          },
          timeout: 180000, // 3 minutes
        });
        
        console.log(`✅ SUCCESS!`);
        console.log(`   Status: ${response.data.Verification_Status}`);
        console.log(`   Category: ${response.data.Category_Verified}`);
        console.log(`   Brand: ${response.data.Brand_Verified}`);
        console.log(`   Processing time: ${response.data.metadata?.processing_time_ms || 'N/A'}ms`);
        
        // Check if token management was applied
        const wasToken Truncated = response.data.metadata?.token_management_applied || false;
        console.log(`   Token management applied: ${wasTruncated ? '✅ YES' : '❌ NO'}`);
        
        results.push({
          sessionId,
          status: 'success',
          catalogId: job.SF_Catalog_Id,
          modelNumber: job.Model_Number_Web_Retailer,
          verificationStatus: response.data.Verification_Status,
          category: response.data.Category_Verified,
          processingTime: response.data.metadata?.processing_time_ms,
          tokenManagementApplied: wasTruncated,
        });
        
      } catch (error) {
        console.log(`❌ FAILED to reprocess`);
        console.log(`   Error: ${error.response?.data?.error || error.message}`);
        
        results.push({
          sessionId,
          status: 'failed',
          catalogId: job.SF_Catalog_Id,
          modelNumber: job.Model_Number_Web_Retailer,
          error: error.response?.data?.error || error.message,
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('REPROCESSING SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total sessions: ${FAILED_SESSIONS.length}`);
    console.log(`Successful: ${results.filter(r => r.status === 'success').length}`);
    console.log(`Failed: ${results.filter(r => r.status === 'failed').length}`);
    console.log(`Not found: ${results.filter(r => r.status === 'not_found').length}`);
    
    console.log(`\n📊 Detailed Results:\n`);
    console.log(JSON.stringify(results, null, 2));
    
    await mongoose.disconnect();
    return results;
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

reprocessFailedJobs();
