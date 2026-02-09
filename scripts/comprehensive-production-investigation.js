const mongoose = require('mongoose');
const { VerificationJob } = require('../dist/models/verification-job.model');

async function comprehensiveInvestigation() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification', {
      serverSelectionTimeoutMS: 5000
    });

    const cutoffDate = new Date('2026-02-04T19:38:00Z');

    // Get last 10 jobs with full data
    const jobs = await VerificationJob.find({
      createdAt: { $gte: cutoffDate }
    })
    .sort({ createdAt: -1 })
    .limit(10);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`  COMPREHENSIVE PRODUCTION INVESTIGATION`);
    console.log(`  Last 10 Verification Jobs (Feb 4-9, 2026)`);
    console.log(`${'='.repeat(80)}\n`);

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const raw = job.rawPayload || {};
      const research = job.research || {};
      const result = job.result || {};
      
      console.log(`\n${'━'.repeat(80)}`);
      console.log(`JOB #${i + 1}: ${job.jobId}`);
      console.log(`Status: ${job.status}`);
      console.log(`Created: ${new Date(job.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
      console.log(`SF Catalog: ${job.sfCatalogId} / ${job.sfCatalogName}`);
      
      // ====== WHAT SALESFORCE SENT ======
      console.log(`\n📥 WHAT SALESFORCE SENT TO US:`);
      
      const stockImages = raw.Stock_Images || [];
      const documents = raw.Documents || [];
      const fergusonUrl = raw.Ferguson_URL;
      const referenceUrl = raw.Reference_URL || raw.Manufacturer_URL;
      
      console.log(`   Images: ${stockImages.length > 0 ? `✅ ${stockImages.length} images` : '❌ NONE'}`);
      if (stockImages.length > 0) {
        stockImages.forEach((img, idx) => {
          const url = typeof img === 'string' ? img : img?.url;
          console.log(`      ${idx + 1}. ${url ? url.substring(url.lastIndexOf('/') + 1) : 'N/A'}`);
        });
      }
      
      console.log(`   Documents: ${documents.length > 0 ? `✅ ${documents.length} PDFs` : '❌ NONE'}`);
      if (documents.length > 0 && documents.length <= 3) {
        documents.forEach((doc, idx) => {
          const url = typeof doc === 'string' ? doc : doc?.url;
          console.log(`      ${idx + 1}. ${url ? url.substring(url.lastIndexOf('/') + 1) : 'N/A'}`);
        });
      }
      
      console.log(`   URLs:`);
      console.log(`      Ferguson: ${fergusonUrl ? '✅ ' + fergusonUrl.substring(0, 50) + '...' : '❌ NONE'}`);
      console.log(`      Reference: ${referenceUrl ? '✅ ' + referenceUrl.substring(0, 50) + '...' : '❌ NONE'}`);
      
      // ====== WHAT WE DID ======
      console.log(`\n🔬 WHAT WE ACTUALLY DID:`);
      
      const webPagesScraped = research.webPages || [];
      const docsProcessed = research.documents || [];
      const imagesAnalyzed = research.images || [];
      
      console.log(`   Web Scraping: ${webPagesScraped.length > 0 ? `✅ ${webPagesScraped.length} pages` : '❌ DID NOT SCRAPE'}`);
      if (webPagesScraped.length > 0) {
        const successful = webPagesScraped.filter(p => p.success).length;
        console.log(`      Success Rate: ${successful}/${webPagesScraped.length}`);
      }
      
      console.log(`   PDF Processing: ${docsProcessed.length > 0 ? `✅ ${docsProcessed.length} docs` : '❌ DID NOT PROCESS'}`);
      if (docsProcessed.length > 0) {
        const successful = docsProcessed.filter(d => d.success).length;
        console.log(`      Success Rate: ${successful}/${docsProcessed.length}`);
      }
      
      console.log(`   Vision AI: ${imagesAnalyzed.length > 0 ? `✅ ${imagesAnalyzed.length} images` : '❌ DID NOT USE VISION AI'}`);
      if (imagesAnalyzed.length > 0) {
        const successful = imagesAnalyzed.filter(i => i.success).length;
        console.log(`      Success Rate: ${successful}/${imagesAnalyzed.length}`);
        imagesAnalyzed.forEach((img, idx) => {
          console.log(`      ${idx + 1}. ${img.success ? '✅' : '❌'} ${img.detectedColor || 'no color'} / ${img.detectedFinish || 'no finish'}`);
        });
      }
      
      // ====== THE PROBLEM ======
      console.log(`\n⚠️  CRITICAL GAPS:`);
      
      if (stockImages.length > 0 && imagesAnalyzed.length === 0) {
        console.log(`   🚨 Salesforce sent ${stockImages.length} images but WE DID NOT ANALYZE THEM!`);
      }
      
      if ((fergusonUrl || referenceUrl) && webPagesScraped.length === 0) {
        console.log(`   🚨 URLs available but WE DID NOT SCRAPE THEM!`);
      }
      
      if (documents.length > 0 && docsProcessed.length === 0) {
        console.log(`   🚨 ${documents.length} PDFs sent but WE DID NOT PROCESS THEM!`);
      }
      
      // ====== WHAT WE SENT BACK ======
      console.log(`\n📤 WHAT WE SENT BACK TO SALESFORCE:`);
      const categorical = result?.categorical_attributes || {};
      const primary = result?.primary_display_attributes || {};
      const stockImagesReturned = result?.stock_images || [];
      
      console.log(`   Category: ${categorical?.Category_Verified || 'N/A'}`);
      console.log(`   Brand: ${categorical?.Brand_Verified || 'N/A'}`);
      console.log(`   Color: ${primary?.Color_Verified || 'N/A'}`);
      console.log(`   Finish: ${primary?.Finish_Verified || 'N/A'}`);
      console.log(`   Stock Images Returned: ${stockImagesReturned.length} (sent ${stockImages.length})`);
      
      if (stockImages.length > 0 && imagesAnalyzed.length === 0) {
        const color = primary?.Color_Verified;
        const finish = primary?.Finish_Verified;
        if (!color || !finish || color === 'N/A' || finish === 'N/A') {
          console.log(`   ⚠️  Could have extracted Color/Finish from ${stockImages.length} images but DIDN'T!`);
        }
      }
    }

    // ====== SUMMARY ======
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`SUMMARY OF FINDINGS`);
    console.log(`${'='.repeat(80)}\n`);
    
    const totalImages = jobs.reduce((sum, j) => sum + (j.rawPayload?.Stock_Images?.length || 0), 0);
    const totalDocs = jobs.reduce((sum, j) => sum + (j.rawPayload?.Documents?.length || 0), 0);
    const totalUrls = jobs.filter(j => j.rawPayload?.Ferguson_URL || j.rawPayload?.Reference_URL).length;
    
    const imagesAnalyzed = jobs.reduce((sum, j) => sum + (j.research?.images?.length || 0), 0);
    const docsProcessed = jobs.reduce((sum, j) => sum + (j.research?.documents?.length || 0), 0);
    const urlsScraped = jobs.reduce((sum, j) => sum + (j.research?.webPages?.length || 0), 0);
    
    console.log(`📊 WHAT SALESFORCE SENT:`);
    console.log(`   Total Stock Images: ${totalImages}`);
    console.log(`   Total PDF Documents: ${totalDocs}`);
    console.log(`   Jobs with URLs: ${totalUrls}/10`);
    
    console.log(`\n🔬 WHAT WE ACTUALLY USED:`);
    console.log(`   Images Analyzed: ${imagesAnalyzed}/${totalImages} (${totalImages > 0 ? ((imagesAnalyzed/totalImages)*100).toFixed(0) : 0}%)`);
    console.log(`   PDFs Processed: ${docsProcessed}/${totalDocs} (${totalDocs > 0 ? ((docsProcessed/totalDocs)*100).toFixed(0) : 0}%)`);
    console.log(`   Web Pages Scraped: ${urlsScraped}`);
    
    console.log(`\n🚨 CRITICAL WASTE:`);
    console.log(`   UNUSED Images: ${totalImages - imagesAnalyzed} (${totalImages > 0 ? (((totalImages - imagesAnalyzed)/totalImages)*100).toFixed(0) : 0}% waste rate)`);
    console.log(`   UNUSED PDFs: ${totalDocs - docsProcessed} (${totalDocs > 0 ? (((totalDocs - docsProcessed)/totalDocs)*100).toFixed(0) : 0}% waste rate)`);
    console.log(`   UNUSED URLs: ${totalUrls} jobs with URLs available`);
    
    console.log(`\n💡 CONCLUSION:`);
    if (imagesAnalyzed === 0 && totalImages > 0) {
      console.log(`   ⚠️  VISION AI IS COMPLETELY DISABLED - ${totalImages} images wasted!`);
    }
    if (docsProcessed === 0 && totalDocs > 0) {
      console.log(`   ⚠️  PDF PROCESSING IS COMPLETELY DISABLED - ${totalDocs} documents wasted!`);
    }
    if (urlsScraped === 0 && totalUrls > 0) {
      console.log(`   ⚠️  WEB SCRAPING IS COMPLETELY DISABLED - ${totalUrls} URLs wasted!`);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

comprehensiveInvestigation();
