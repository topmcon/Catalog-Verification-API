const mongoose = require('mongoose');
const { VerificationJob } = require('../dist/models/verification-job.model');

/**
 * Analyze how many attributes we receive vs. return to Salesforce
 */
async function analyzeAttributeCoverage() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification', {
      serverSelectionTimeoutMS: 5000
    });

    const cutoffDate = new Date('2026-02-04T19:38:00Z');

    // Get a few recent completed jobs
    const jobs = await VerificationJob.find({
      createdAt: { $gte: cutoffDate },
      status: 'completed'
    })
    .sort({ createdAt: -1 })
    .limit(5);

    if (jobs.length === 0) {
      console.log('❌ No completed jobs found');
      await mongoose.disconnect();
      return;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`ATTRIBUTE COVERAGE ANALYSIS`);
    console.log(`Analyzing ${jobs.length} recent completed jobs`);
    console.log(`${'='.repeat(80)}\n`);

    let totalStats = {
      totalAttributesReceived: 0,
      totalPrimaryUsed: 0,
      totalTop15Used: 0,
      totalInHTMLTable: 0,
      totalDropped: 0
    };

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const raw = job.rawPayload || {};
      const result = job.result || {};
      
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`JOB #${i + 1}: ${job.jobId}`);
      console.log(`Category: ${raw.Web_Retailer_Category || 'Unknown'}`);
      console.log(`Model: ${raw.SF_Catalog_Name || raw.Model_Number_Web_Retailer}`);
      console.log(`${'─'.repeat(80)}\n`);

      // Count attributes RECEIVED from Salesforce
      const webRetailerSpecs = raw.Web_Retailer_Specs || [];
      const fergusonAttributes = raw.Ferguson_Attributes || [];
      const totalReceived = webRetailerSpecs.length + fergusonAttributes.length;

      console.log(`📥 RECEIVED FROM SALESFORCE:`);
      console.log(`   Web_Retailer_Specs: ${webRetailerSpecs.length} attributes`);
      console.log(`   Ferguson_Attributes: ${fergusonAttributes.length} attributes`);
      console.log(`   TOTAL RECEIVED: ${totalReceived} attributes\n`);

      if (webRetailerSpecs.length > 0) {
        console.log(`   Sample Web_Retailer_Specs (first 5):`);
        webRetailerSpecs.slice(0, 5).forEach((spec, idx) => {
          console.log(`      ${idx + 1}. ${spec.name}: ${String(spec.value).substring(0, 40)}...`);
        });
        console.log('');
      }

      // Count attributes SENT BACK to Salesforce
      const primaryAttrs = result.primary_display_attributes || {};
      const topFilterAttrs = result.top_filter_attributes || {};
      const categoricalAttrs = result.categorical_attributes || {};
      
      // Primary attributes (global fields)
      const primaryKeys = Object.keys(primaryAttrs).filter(k => {
        const val = primaryAttrs[k];
        return val && val !== '' && val !== 'N/A' && val !== 'Not Applicable';
      });

      // Top 15 filter attributes (category-specific)
      const top15Keys = Object.keys(topFilterAttrs).filter(k => {
        const val = topFilterAttrs[k];
        return val && val !== '' && val !== 'N/A' && val !== 'Not Applicable';
      });

      // Categorical attributes (Brand, Category, SubCategory)
      const categoricalKeys = Object.keys(categoricalAttrs).filter(k => {
        const val = categoricalAttrs[k];
        return val && val !== '' && val !== 'N/A' && val !== 'Not Applicable';
      });

      console.log(`📤 SENT BACK TO SALESFORCE:\n`);
      
      console.log(`   Categorical Attributes: ${categoricalKeys.length} fields`);
      if (categoricalKeys.length > 0) {
        categoricalKeys.slice(0, 5).forEach(key => {
          console.log(`      • ${key}: ${categoricalAttrs[key]}`);
        });
      }
      console.log('');

      console.log(`   Primary Display Attributes: ${primaryKeys.length} fields`);
      if (primaryKeys.length > 0) {
        primaryKeys.slice(0, 5).forEach(key => {
          console.log(`      • ${key}: ${String(primaryAttrs[key]).substring(0, 40)}`);
        });
      }
      console.log('');

      console.log(`   Top 15 Filter Attributes: ${top15Keys.length} fields`);
      if (top15Keys.length > 0) {
        top15Keys.forEach(key => {
          console.log(`      • ${key}: ${topFilterAttrs[key]}`);
        });
      }
      console.log('');

      // Check if Additional_Attributes_HTML exists
      const additionalHTML = result.additional_attributes_html || result.Additional_Attributes_HTML || '';
      const hasHTMLTable = additionalHTML && additionalHTML.length > 50; // More than just empty table tags

      console.log(`   Additional Attributes HTML Table: ${hasHTMLTable ? '✅ YES' : '❌ NONE'}`);
      if (hasHTMLTable) {
        // Count rows in HTML table (rough estimate)
        const rowCount = (additionalHTML.match(/<tr>/g) || []).length - 1; // -1 for header row
        console.log(`      Estimated attributes in table: ${rowCount}`);
        console.log(`      Table size: ${(additionalHTML.length / 1024).toFixed(2)} KB`);
        
        // Show a snippet
        if (additionalHTML.length > 200) {
          const snippet = additionalHTML.substring(0, 200).replace(/\s+/g, ' ');
          console.log(`      Sample: ${snippet}...`);
        }
      }
      console.log('');

      // Calculate used vs unused
      const totalUsedInStructured = categoricalKeys.length + primaryKeys.length + top15Keys.length;
      const estimatedInHTML = hasHTMLTable ? (additionalHTML.match(/<tr>/g) || []).length - 1 : 0;
      const totalUsed = totalUsedInStructured + estimatedInHTML;
      const dropped = Math.max(0, totalReceived - totalUsed);

      console.log(`📊 COVERAGE SUMMARY:`);
      console.log(`   Received: ${totalReceived} attributes`);
      console.log(`   Used in structured fields: ${totalUsedInStructured}`);
      console.log(`   Used in HTML table: ${estimatedInHTML}`);
      console.log(`   TOTAL RETURNED: ${totalUsed} (${totalReceived > 0 ? ((totalUsed/totalReceived)*100).toFixed(1) : 0}%)`);
      console.log(`   DROPPED/UNUSED: ${dropped} (${totalReceived > 0 ? ((dropped/totalReceived)*100).toFixed(1) : 0}%)\n`);

      // Accumulate stats
      totalStats.totalAttributesReceived += totalReceived;
      totalStats.totalPrimaryUsed += totalUsedInStructured;
      totalStats.totalTop15Used += top15Keys.length;
      totalStats.totalInHTMLTable += estimatedInHTML;
      totalStats.totalDropped += dropped;
    }

    // Overall summary
    console.log(`\n${'='.repeat(80)}`);
    console.log(`OVERALL STATISTICS (${jobs.length} jobs)`);
    console.log(`${'='.repeat(80)}\n`);

    console.log(`   Total Attributes Received: ${totalStats.totalAttributesReceived}`);
    console.log(`   Used in Structured Fields: ${totalStats.totalPrimaryUsed}`);
    console.log(`   Used in HTML Table: ${totalStats.totalInHTMLTable}`);
    console.log(`   TOTAL RETURNED: ${totalStats.totalPrimaryUsed + totalStats.totalInHTMLTable} (${totalStats.totalAttributesReceived > 0 ? (((totalStats.totalPrimaryUsed + totalStats.totalInHTMLTable)/totalStats.totalAttributesReceived)*100).toFixed(1) : 0}%)`);
    console.log(`   DROPPED: ${totalStats.totalDropped} (${totalStats.totalAttributesReceived > 0 ? ((totalStats.totalDropped/totalStats.totalAttributesReceived)*100).toFixed(1) : 0}%)\n`);

    console.log(`💡 FINDINGS:\n`);
    
    const returnRate = totalStats.totalAttributesReceived > 0 ? 
      ((totalStats.totalPrimaryUsed + totalStats.totalInHTMLTable)/totalStats.totalAttributesReceived)*100 : 0;
    
    if (returnRate >= 90) {
      console.log(`   ✅ EXCELLENT: Returning ${returnRate.toFixed(1)}% of received attributes`);
    } else if (returnRate >= 70) {
      console.log(`   🟡 GOOD: Returning ${returnRate.toFixed(1)}% of received attributes`);
      console.log(`   ⚠️  Consider: Some attributes may be filtered as duplicates or empty`);
    } else if (returnRate >= 50) {
      console.log(`   🟠 MODERATE: Returning ${returnRate.toFixed(1)}% of received attributes`);
      console.log(`   ⚠️  WARNING: ${(100 - returnRate).toFixed(1)}% of data is dropped`);
    } else {
      console.log(`   🔴 POOR: Only returning ${returnRate.toFixed(1)}% of received attributes`);
      console.log(`   🚨 CRITICAL: ${(100 - returnRate).toFixed(1)}% of data is being lost!`);
    }

    if (totalStats.totalInHTMLTable === 0 && totalStats.totalDropped > 0) {
      console.log(`\n   🚨 HTML TABLE IS EMPTY but ${totalStats.totalDropped} attributes are dropped!`);
      console.log(`   This suggests buildAdditionalAttributesHTML() may not be working correctly.`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

analyzeAttributeCoverage();
