const mongoose = require('mongoose');
const { VerificationJob } = require('../dist/models/verification-job.model');

async function investigateLastTenJobs() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification', {
      serverSelectionTimeoutMS: 5000
    });

    const cutoffDate = new Date('2026-02-04T19:38:00Z');

    // Get last 10 verification jobs
    const jobs = await VerificationJob.find({
      createdAt: { $gte: cutoffDate }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('jobId rawPayload research status completedAt');

    console.log(`\n=== INVESTIGATION: Last 10 Verification Jobs (Feb 4-9) ===\n`);

    for (const job of jobs) {
      const raw = job.rawPayload?.product_information || {};
      const research = job.research || {};
      
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`JOB: ${job.jobId}`);
      console.log(`Created: ${new Date(job.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
      console.log(`Status: ${job.status}`);
      
      // WHAT SALESFORCE SENT
      console.log(`\n📥 RAW DATA FROM SALESFORCE:`);
      console.log(`  Model: ${raw.model_number || 'N/A'}`);
      console.log(`  Category: ${raw.category || 'N/A'}`);
      console.log(`  Brand: ${raw.brand || 'N/A'}`);
      
      // Check for URLs
      const urls = raw.urls || [];
      const fergusonUrl = raw.ferguson_url || null;
      const referenceUrl = raw.reference_url || raw.manufacturer_url || null;
      console.log(`\n  URLs Provided:`);
      console.log(`    Ferguson URL: ${fergusonUrl ? '✅ YES' : '❌ NO'}`);
      console.log(`    Reference URL: ${referenceUrl ? '✅ YES' : '❌ NO'}`);
      console.log(`    Additional URLs: ${urls.length > 0 ? urls.length : '❌ NONE'}`);
      
      // Check for images
      const images = raw.images || raw.stock_images || [];
      console.log(`\n  Images Provided:`);
      if (images.length > 0) {
        console.log(`    ✅ ${images.length} image URLs sent by Salesforce`);
        images.slice(0, 3).forEach((img, i) => {
          const imgUrl = typeof img === 'string' ? img : img?.url;
          console.log(`      ${i + 1}. ${imgUrl?.substring(0, 60)}...`);
        });
      } else {
        console.log(`    ❌ NO images sent`);
      }
      
      // Check for documents
      const documents = raw.documents || [];
      console.log(`\n  Documents Provided:`);
      if (documents.length > 0) {
        console.log(`    ✅ ${documents.length} document URLs sent`);
      } else {
        console.log(`    ❌ NO documents sent`);
      }
      
      // WHAT WE DID
      console.log(`\n🔬 WHAT WE DID:`);
      console.log(`  Research Performed: ${research.webPages || research.documents || research.images ? '✅ YES' : '❌ NO'}`);
      
      if (research.webPages?.length > 0) {
        console.log(`    Web Pages Scraped: ${research.webPages.length}`);
        const successful = research.webPages.filter(p => p.success).length;
        console.log(`      Success: ${successful}/${research.webPages.length}`);
      } else {
        console.log(`    Web Pages Scraped: ❌ NONE`);
      }
      
      if (research.documents?.length > 0) {
        console.log(`    Documents Processed: ${research.documents.length}`);
      } else {
        console.log(`    Documents Processed: ❌ NONE`);
      }
      
      if (research.images?.length > 0) {
        console.log(`    Images Analyzed: ${research.images.length}`);
        const successful = research.images.filter(i => i.success).length;
        console.log(`      Success: ${successful}/${research.images.length}`);
      } else {
        console.log(`    Images Analyzed: ❌ NONE - VISION AI NOT USED!`);
      }
      
      // WHY DIDN'T WE USE IT?
      if (images.length > 0 && (!research.images || research.images.length === 0)) {
        console.log(`\n⚠️  CRITICAL ISSUE: Salesforce sent ${images.length} images but we DIDN'T analyze them!`);
      }
      
      if ((fergusonUrl || referenceUrl || urls.length > 0) && (!research.webPages || research.webPages.length === 0)) {
        console.log(`\n⚠️  CRITICAL ISSUE: URLs available but we DIDN'T scrape them!`);
      }
    }

    console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`=== SUMMARY ===\n`);
    
    const totalJobs = jobs.length;
    const jobsWithImages = jobs.filter(j => {
      const raw = j.rawPayload?.product_information || {};
      const images = raw.images || raw.stock_images || [];
      return images.length > 0;
    }).length;
    
    const jobsWithResearch = jobs.filter(j => {
      const research = j.research || {};
      return research.webPages || research.documents || research.images;
    }).length;
    
    const jobsWithVision = jobs.filter(j => {
      const research = j.research || {};
      return research.images && research.images.length > 0;
    }).length;

    console.log(`Total jobs analyzed: ${totalJobs}`);
    console.log(`Jobs with images from SF: ${jobsWithImages}/${totalJobs} (${((jobsWithImages/totalJobs)*100).toFixed(0)}%)`);
    console.log(`Jobs with research performed: ${jobsWithResearch}/${totalJobs} (${((jobsWithResearch/totalJobs)*100).toFixed(0)}%)`);
    console.log(`Jobs with vision AI used: ${jobsWithVision}/${totalJobs} (${((jobsWithVision/totalJobs)*100).toFixed(0)}%)`);
    
    console.log(`\n🚨 GAP ANALYSIS:`);
    console.log(`   Should have used vision: ${jobsWithImages} jobs`);
    console.log(`   Actually used vision: ${jobsWithVision} jobs`);
    console.log(`   MISSED: ${jobsWithImages - jobsWithVision} jobs (${(((jobsWithImages - jobsWithVision)/jobsWithImages)*100).toFixed(0)}% failure rate)`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

investigateLastTenJobs();
