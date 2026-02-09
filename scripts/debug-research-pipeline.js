const mongoose = require('mongoose');
const { VerificationJob } = require('../dist/models/verification-job.model');

/**
 * Debug script to trace why research pipeline isn't executing
 * Simulates the analyzeDataSources logic to find where it's breaking
 */
async function debugResearchPipeline() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification', {
      serverSelectionTimeoutMS: 5000
    });

    const cutoffDate = new Date('2026-02-04T19:38:00Z');

    // Get one recent job with images
    const job = await VerificationJob.findOne({
      createdAt: { $gte: cutoffDate },
      'rawPayload.Stock_Images': { $exists: true, $ne: [] }
    })
    .sort({ createdAt: -1 });

    if (!job) {
      console.log('❌ No jobs found with Stock_Images');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`RESEARCH PIPELINE DEBUG`);
    console.log(`Job: ${job.jobId}`);
    console.log(`Created: ${new Date(job.createdAt).toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
    console.log(`${'='.repeat(80)}\n`);

    const rawProduct = job.rawPayload || {};

    // STEP 1: Simulate analyzeDataSources()
    console.log('STEP 1: Analyze Data Sources\n');

    // Count Web Retailer fields
    const webRetailerFields = [
      rawProduct.Brand_Web_Retailer,
      rawProduct.Model_Number_Web_Retailer,
      rawProduct.MSRP_Web_Retailer,
      rawProduct.Product_Title_Web_Retailer,
      rawProduct.Product_Description_Web_Retailer,
      rawProduct.Web_Retailer_Category,
      rawProduct.Web_Retailer_SubCategory,
      rawProduct.Depth_Web_Retailer,
      rawProduct.Width_Web_Retailer,
      rawProduct.Height_Web_Retailer,
    ];
    const webRetailerFieldCount = webRetailerFields.filter(f => f && typeof f === 'string' && f.trim() !== '').length;
    const webRetailerSpecsCount = (rawProduct.Web_Retailer_Specs || []).length;
    const hasWebRetailerData = webRetailerFieldCount >= 2 || webRetailerSpecsCount > 0;

    console.log(`   Web Retailer Data:`);
    console.log(`      Field Count: ${webRetailerFieldCount}/10`);
    console.log(`      Specs Count: ${webRetailerSpecsCount}`);
    console.log(`      Has Data: ${hasWebRetailerData ? '✅ YES' : '❌ NO'}`);

    // Count Ferguson fields
    const fergusonFields = [
      rawProduct.Ferguson_Brand,
      rawProduct.Ferguson_Model_Number,
      rawProduct.Ferguson_Price,
      rawProduct.Ferguson_Title,
      rawProduct.Ferguson_Description,
      rawProduct.Ferguson_Product_Type,
      rawProduct.Ferguson_Width,
      rawProduct.Ferguson_Height,
      rawProduct.Ferguson_Depth,
    ];
    const fergusonFieldCount = fergusonFields.filter(f => f && typeof f === 'string' && f.trim() !== '').length;
    const fergusonAttributesCount = (rawProduct.Ferguson_Attributes || []).length;
    const hasFergusonData = fergusonFieldCount >= 2 || fergusonAttributesCount > 0;

    console.log(`\n   Ferguson Data:`);
    console.log(`      Field Count: ${fergusonFieldCount}/9`);
    console.log(`      Attributes Count: ${fergusonAttributesCount}`);
    console.log(`      Has Data: ${hasFergusonData ? '✅ YES' : '❌ NO'}`);

    // Collect URLs
    const referenceUrlLocal = rawProduct.Reference_URL || rawProduct.Manufacturer_URL || null;
    const availableUrls = [];
    
    console.log(`\n   URL Collection:`);
    console.log(`      Ferguson_URL: ${rawProduct.Ferguson_URL || 'null'}`);
    console.log(`      Reference_URL: ${rawProduct.Reference_URL || 'null'}`);
    console.log(`      Manufacturer_URL: ${rawProduct.Manufacturer_URL || 'null'}`);
    console.log(`      referenceUrlLocal: ${referenceUrlLocal || 'null'}`);

    if (rawProduct.Ferguson_URL && rawProduct.Ferguson_URL.startsWith('http')) {
      availableUrls.push(rawProduct.Ferguson_URL);
      console.log(`      ✅ Added Ferguson_URL to availableUrls`);
    } else {
      console.log(`      ❌ Ferguson_URL not added (${rawProduct.Ferguson_URL ? 'does not start with http' : 'is null'})`);
    }

    if (referenceUrlLocal && referenceUrlLocal.startsWith('http')) {
      availableUrls.push(referenceUrlLocal);
      console.log(`      ✅ Added Reference_URL to availableUrls`);
    } else {
      console.log(`      ❌ Reference_URL not added (${referenceUrlLocal ? 'does not start with http' : 'is null'})`);
    }

    console.log(`\n   Result: availableUrls.length = ${availableUrls.length}`);
    if (availableUrls.length > 0) {
      availableUrls.forEach((url, idx) => {
        console.log(`      ${idx + 1}. ${url}`);
      });
    }

    // Collect documents
    const availableDocuments = (rawProduct.Documents || [])
      .map(d => typeof d === 'string' ? d : d?.url)
      .filter(url => !!url && url.startsWith('http'));

    console.log(`\n   Documents: ${availableDocuments.length}`);

    // Collect images
    const availableImages = (rawProduct.Stock_Images || [])
      .map(i => typeof i === 'string' ? i : i?.url)
      .filter(url => !!url && url.startsWith('http'));

    console.log(`   Images: ${availableImages.length}`);

    // Determine scenario
    let scenario;
    let requiresExternalResearch;
    let requiresConfirmationResearch;

    if (hasWebRetailerData && hasFergusonData) {
      scenario = 'both_sources';
      requiresExternalResearch = false;
      requiresConfirmationResearch = false;
    } else if (hasWebRetailerData && !hasFergusonData) {
      scenario = 'web_retailer_only';
      requiresExternalResearch = false;
      requiresConfirmationResearch = true;
    } else if (!hasWebRetailerData && hasFergusonData) {
      scenario = 'ferguson_only';
      requiresExternalResearch = false;
      requiresConfirmationResearch = true;
    } else {
      scenario = 'no_sources';
      requiresExternalResearch = true;
      requiresConfirmationResearch = false;
    }

    console.log(`\n   Scenario: ${scenario}`);
    console.log(`   requiresExternalResearch: ${requiresExternalResearch}`);
    console.log(`   requiresConfirmationResearch: ${requiresConfirmationResearch}`);

    // STEP 2: Check shouldPreResearch
    console.log(`\n\nSTEP 2: Check Research Trigger\n`);

    const shouldPreResearch = requiresExternalResearch || 
                              requiresConfirmationResearch ||
                              availableUrls.length > 0;

    console.log(`   shouldPreResearch Logic:`);
    console.log(`      requiresExternalResearch = ${requiresExternalResearch}`);
    console.log(`      requiresConfirmationResearch = ${requiresConfirmationResearch}`);
    console.log(`      availableUrls.length > 0 = ${availableUrls.length > 0} (length=${availableUrls.length})`);
    console.log(`\n   Result: shouldPreResearch = ${shouldPreResearch ? '✅ TRUE' : '❌ FALSE'}`);

    // STEP 3: Check config (simulate)
    console.log(`\n\nSTEP 3: Check Configuration\n`);
    
    const config = require('../dist/config/index.js').default;
    console.log(`   config.research.enabled = ${config.research.enabled}`);
    console.log(`   config.research.enableImageAnalysis = ${config.research.enableImageAnalysis}`);
    console.log(`   config.research.enableWebFetch = ${config.research.enableWebFetch}`);
    console.log(`   config.research.enablePdfExtract = ${config.research.enablePdfExtract}`);

    const wouldExecute = shouldPreResearch && (config.research?.enabled !== false);
    console.log(`\n   Final Check: shouldPreResearch && (config.research.enabled !== false)`);
    console.log(`   Result: ${wouldExecute ? '✅ SHOULD EXECUTE RESEARCH' : '❌ WILL NOT EXECUTE RESEARCH'}`);

    // STEP 4: Check actual job data
    console.log(`\n\nSTEP 4: Check Actual Job Results\n`);
    
    const research = job.research || {};
    console.log(`   Actual research object exists: ${Object.keys(research).length > 0 ? 'YES' : 'NO'}`);
    console.log(`   Web pages scraped: ${research.webPages?.length || 0}`);
    console.log(`   PDFs processed: ${research.documents?.length || 0}`);
    console.log(`   Images analyzed: ${research.images?.length || 0}`);

    // THE SMOKING GUN
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`DIAGNOSIS`);
    console.log(`${'='.repeat(80)}\n`);

    if (wouldExecute && (!research.images || research.images.length === 0) && availableImages.length > 0) {
      console.log(`   🚨 CRITICAL ISSUE FOUND!`);
      console.log(`\n   According to logic:`);
      console.log(`      ✅ shouldPreResearch = TRUE`);
      console.log(`      ✅ config.research.enabled = TRUE`);
      console.log(`      ✅ ${availableImages.length} images available`);
      console.log(`      ✅ ${availableUrls.length} URLs available`);
      console.log(`      ✅ ${availableDocuments.length} documents available`);
      console.log(`\n   But actual execution:`);
      console.log(`      ❌ 0 images analyzed`);
      console.log(`      ❌ 0 web pages scraped`);
      console.log(`      ❌ 0 PDFs processed`);
      console.log(`\n   → Research pipeline IS CONFIGURED CORRECTLY but NOT EXECUTING`);
      console.log(`   → Problem must be in execution path (exception, timeout, or code path not reached)`);
    } else if (!wouldExecute) {
      console.log(`   Research would not execute based on trigger logic`);
      console.log(`   Reason: ${!shouldPreResearch ? 'shouldPreResearch is FALSE' : 'config.research.enabled is FALSE'}`);
    } else {
      console.log(`   Logic suggests research should have executed and appears to have done so`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

debugResearchPipeline();
