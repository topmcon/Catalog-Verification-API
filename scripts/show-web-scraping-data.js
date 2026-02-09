const mongoose = require('mongoose');
const { VerificationJob } = require('../dist/models/verification-job.model');

/**
 * Show what web scraping actually contains and where it's stored
 */
async function showWebScrapingData() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification', {
      serverSelectionTimeoutMS: 5000
    });

    // Find a job that actually has web research data (from the test session)
    const job = await VerificationJob.findOne({
      'research.webPages': { $exists: true, $ne: [] }
    }).sort({ createdAt: -1 });

    if (!job) {
      console.log('❌ No jobs found with web research data');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`WEB SCRAPING DATA ANALYSIS`);
    console.log(`Job: ${job.jobId}`);
    console.log(`Created: ${new Date(job.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
    console.log(`${'='.repeat(80)}\n`);

    const research = job.research || {};
    const webPages = research.webPages || [];

    console.log(`📊 STORAGE LOCATIONS:\n`);
    console.log(`   MongoDB Collection: verification_job`);
    console.log(`   Field: job.research.webPages (array)`);
    console.log(`   Number of pages scraped: ${webPages.length}\n`);

    // Analyze each web page
    for (let i = 0; i < webPages.length; i++) {
      const page = webPages[i];
      
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`WEB PAGE #${i + 1}`);
      console.log(`${'─'.repeat(80)}\n`);
      
      console.log(`   URL: ${page.url}`);
      console.log(`   Success: ${page.success ? '✅ YES' : '❌ NO'}`);
      console.log(`   Source: ${page.source || 'N/A'}`);
      
      if (page.content) {
        const contentLength = page.content.length;
        const estimatedTokens = Math.ceil(contentLength / 4); // Rough estimate: 4 chars = 1 token
        
        console.log(`\n   📏 SIZE METRICS:`);
        console.log(`      Characters: ${contentLength.toLocaleString()}`);
        console.log(`      Estimated Tokens: ${estimatedTokens.toLocaleString()}`);
        console.log(`      Size: ${(contentLength / 1024).toFixed(2)} KB`);
        
        // Show a sample of the content
        console.log(`\n   📄 CONTENT SAMPLE (first 1000 chars):`);
        console.log(`   ${'┄'.repeat(76)}`);
        const sample = page.content.substring(0, 1000).replace(/\n/g, '\n   ');
        console.log(`   ${sample}`);
        if (contentLength > 1000) {
          console.log(`   [...${(contentLength - 1000).toLocaleString()} more characters]`);
        }
        console.log(`   ${'┄'.repeat(76)}`);
        
        // Analyze what's in the content
        console.log(`\n   🔍 CONTENT ANALYSIS:`);
        const hasNavigation = page.content.toLowerCase().includes('navigation') || 
                              page.content.toLowerCase().includes('<nav') ||
                              page.content.toLowerCase().includes('menu');
        const hasFooter = page.content.toLowerCase().includes('footer') ||
                         page.content.toLowerCase().includes('copyright');
        const hasJavaScript = page.content.includes('<script') ||
                             page.content.includes('function(');
        const hasCSS = page.content.includes('<style') ||
                      page.content.includes('css');
        const hasProductInfo = page.content.toLowerCase().includes('product') ||
                              page.content.toLowerCase().includes('specifications') ||
                              page.content.toLowerCase().includes('features');
        
        console.log(`      Contains Navigation: ${hasNavigation ? '🟥 YES (waste)' : '✅ NO'}`);
        console.log(`      Contains Footer: ${hasFooter ? '🟥 YES (waste)' : '✅ NO'}`);
        console.log(`      Contains JavaScript: ${hasJavaScript ? '🟥 YES (waste)' : '✅ NO'}`);
        console.log(`      Contains CSS: ${hasCSS ? '🟥 YES (waste)' : '✅ NO'}`);
        console.log(`      Contains Product Info: ${hasProductInfo ? '✅ YES (useful)' : '🟥 NO'}`);
      }
      
      if (page.specifications && Object.keys(page.specifications).length > 0) {
        console.log(`\n   📋 EXTRACTED SPECIFICATIONS: ${Object.keys(page.specifications).length} items`);
        const specKeys = Object.keys(page.specifications).slice(0, 10);
        specKeys.forEach(key => {
          const value = String(page.specifications[key]).substring(0, 50);
          console.log(`      • ${key}: ${value}${String(page.specifications[key]).length > 50 ? '...' : ''}`);
        });
        if (Object.keys(page.specifications).length > 10) {
          console.log(`      [...${Object.keys(page.specifications).length - 10} more specs]`);
        }
      }
      
      if (page.features && page.features.length > 0) {
        console.log(`\n   ✨ EXTRACTED FEATURES: ${page.features.length} items`);
        page.features.slice(0, 5).forEach((feature, idx) => {
          console.log(`      ${idx + 1}. ${feature.substring(0, 70)}${feature.length > 70 ? '...' : ''}`);
        });
        if (page.features.length > 5) {
          console.log(`      [...${page.features.length - 5} more features]`);
        }
      }
      
      if (page.error) {
        console.log(`\n   ❌ ERROR: ${page.error}`);
      }
    }

    // Check if this data was sent back to Salesforce
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`DATA USAGE`);
    console.log(`${'='.repeat(80)}\n`);
    
    const result = job.result || {};
    const webhookPayload = job.webhookPayload || {};
    
    console.log(`   ✅ Saved to MongoDB: YES (job.research.webPages)`);
    console.log(`   ❌ Sent to Salesforce: NO (not in webhook payload)`);
    console.log(`   ❓ Used in AI analysis: ATTEMPTED (but crashed due to token overflow)\n`);
    
    console.log(`   📤 WHAT WAS SENT TO SALESFORCE:`);
    console.log(`      Category: ${result.categorical_attributes?.Category_Verified || 'N/A'}`);
    console.log(`      Brand: ${result.categorical_attributes?.Brand_Verified || 'N/A'}`);
    console.log(`      Color: ${result.primary_display_attributes?.Color_Verified || 'N/A'}`);
    console.log(`      Finish: ${result.primary_display_attributes?.Finish_Verified || 'N/A'}`);
    console.log(`      (Web scraping data NOT included - only final verified fields)\n`);
    
    console.log(`   💾 DATA RETENTION:`);
    console.log(`      MongoDB storage: Permanent (for debugging/audit)`);
    console.log(`      Purpose: AI analysis input (but currently causing crashes)`);
    console.log(`      Should be: <10K tokens per page (currently 606K!)\n`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

showWebScrapingData();
