#!/usr/bin/env node
/**
 * Analyze 50 Salesforce Calls - Comprehensive Audit
 * 
 * Purpose: Extract and analyze the 50 most recent verification jobs
 * to identify category/type/style matching accuracy and logic issues.
 */

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

const MONGO_URL = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'catalog-verification';
const OUTPUT_DIR = path.join(__dirname, '..', 'audit-results');

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       SALESFORCE 50-CALL COMPREHENSIVE AUDIT                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const client = await MongoClient.connect(MONGO_URL);
  const db = client.db(DB_NAME);

  try {
    // Get last 50 completed jobs with full data
    const jobs = await db.collection('verification_jobs')
      .find({ status: 'completed' })
      .sort({ _id: -1 })
      .limit(50)
      .toArray();

    console.log(`✅ Retrieved ${jobs.length} jobs\n`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    
    // Extract detailed analysis data
    const analyzed = jobs.map((job, index) => {
      const result = job.result || {};
      const fieldAiReviews = result.Field_AI_Reviews || {};
      const aiReview = result.AI_Review || {};
      const verification = result.Verification || {};
      const primaryAttrs = result.Primary_Attributes || {};
      const raw = job.rawPayload || {};

      return {
        index: index + 1,
        job_id: job._id.toString(),
        sf_catalog_id: job.sfCatalogId,
        sf_catalog_name: job.sfCatalogName,
        status: job.status,
        created_at: job.createdAt,
        processing_time_ms: job.processingTimeMs || (job.completedAt && job.startedAt 
          ? new Date(job.completedAt) - new Date(job.startedAt)
          : null),
        
        // Product Input Data
        input: {
          model_number: raw.Model_Number_Legacy,
          brand: raw.Brand_Legacy,
          category: raw.Category_Legacy,
          product_title: raw.Product_Title_Legacy,
          upc: raw.UPC_Legacy
        },

        // AI Results from Field_AI_Reviews
        category: {
          openai: fieldAiReviews.category?.openai?.value,
          xai: fieldAiReviews.category?.xai?.value,
          consensus: fieldAiReviews.category?.consensus,
          source: fieldAiReviews.category?.source,
          final: fieldAiReviews.category?.final_value || primaryAttrs.AI_Product_Category,
          confidence: fieldAiReviews.category?.openai?.confidence || fieldAiReviews.category?.xai?.confidence,
          agreed: fieldAiReviews.category?.openai?.value === fieldAiReviews.category?.xai?.value
        },

        type: {
          openai: fieldAiReviews.product_type?.openai?.value,
          xai: fieldAiReviews.product_type?.xai?.value,
          consensus: fieldAiReviews.product_type?.consensus,
          source: fieldAiReviews.product_type?.source,
          final: fieldAiReviews.product_type?.final_value || primaryAttrs.AI_Type,
          confidence: fieldAiReviews.product_type?.openai?.confidence || fieldAiReviews.product_type?.xai?.confidence,
          agreed: fieldAiReviews.product_type?.openai?.value === fieldAiReviews.product_type?.xai?.value
        },

        style: {
          openai: fieldAiReviews.product_style?.openai?.value,
          xai: fieldAiReviews.product_style?.xai?.value,
          consensus: fieldAiReviews.product_style?.consensus,
          source: fieldAiReviews.product_style?.source,
          final: fieldAiReviews.product_style?.final_value || primaryAttrs.AI_Style,
          confidence: fieldAiReviews.product_style?.openai?.confidence || fieldAiReviews.product_style?.xai?.confidence,
          agreed: fieldAiReviews.product_style?.openai?.value === fieldAiReviews.product_style?.xai?.value
        },

        brand: {
          openai: fieldAiReviews.brand?.openai?.value,
          xai: fieldAiReviews.brand?.xai?.value,
          consensus: fieldAiReviews.brand?.consensus,
          source: fieldAiReviews.brand?.source,
          final: fieldAiReviews.brand?.final_value || primaryAttrs.AI_Brand,
          agreed: fieldAiReviews.brand?.openai?.value === fieldAiReviews.brand?.xai?.value
        },

        department: {
          final: primaryAttrs.AI_Product_Department,
          source: 'primary_attrs'
        },

        family: {
          final: fieldAiReviews.product_family?.final_value || primaryAttrs.AI_Product_Family,
          source: fieldAiReviews.product_family?.source || 'primary_attrs'
        },

        // Verification Metrics
        verification: {
          score: verification.verification_score,
          status: verification.verification_status,
          timestamp: verification.verification_timestamp,
          corrections_count: verification.corrections_made?.length || 0,
          corrections: verification.corrections_made?.map(c => ({
            field: c.field,
            original: c.originalValue,
            corrected: c.correctedValue,
            source: c.source
          }))
        },

        // AI Review
        review: {
          openai_confidence: aiReview.openai?.confidence,
          xai_confidence: aiReview.xai?.confidence,
          agreement_percentage: aiReview.consensus?.agreement_percentage,
          agreement_status: aiReview.consensus?.agreement_status
        },

        // Webhook Status
        webhook: {
          sent: job.webhookSuccess,
          sf_acknowledged: job.salesforceAcknowledged,
          sf_processed: job.salesforceProcessed
        }
      };
    });

    // Calculate Statistics
    const stats = {
      total: analyzed.length,
      timespan: {
        first: jobs[jobs.length - 1]?.createdAt,
        last: jobs[0]?.createdAt,
        duration_seconds: (new Date(jobs[0]?.createdAt) - new Date(jobs[jobs.length - 1]?.createdAt)) / 1000
      },
      
      category: {
        agreed: analyzed.filter(j => j.category.agreed).length,
        disagreed: analyzed.filter(j => !j.category.agreed).length,
        unique_values: [...new Set(analyzed.map(j => j.category.final))].filter(Boolean).length,
        top_values: {}
      },
      
      type: {
        agreed: analyzed.filter(j => j.type.agreed).length,
        disagreed: analyzed.filter(j => !j.type.agreed).length,
        unique_values: [...new Set(analyzed.map(j => j.type.final))].filter(Boolean).length,
        top_values: {}
      },
      
      style: {
        agreed: analyzed.filter(j => j.style.agreed).length,
        disagreed: analyzed.filter(j => !j.style.agreed).length,
        unique_values: [...new Set(analyzed.map(j => j.style.final))].filter(Boolean).length,
        top_values: {}
      },

      department: {
        unique_values: [...new Set(analyzed.map(j => j.department.final))].filter(Boolean).length,
        distribution: {}
      },

      family: {
        unique_values: [...new Set(analyzed.map(j => j.family.final))].filter(Boolean).length,
        distribution: {}
      },

      verification: {
        avg_score: analyzed.reduce((sum, j) => sum + (j.verification.score || 0), 0) / analyzed.length,
        avg_processing_time_ms: analyzed.reduce((sum, j) => sum + (j.processing_time_ms || 0), 0) / analyzed.length,
        total_corrections: analyzed.reduce((sum, j) => sum + j.verification.corrections_count, 0)
      },

      webhook: {
        success_rate: analyzed.filter(j => j.webhook.sent).length / analyzed.length * 100,
        sf_acknowledged_rate: analyzed.filter(j => j.webhook.sf_acknowledged).length / analyzed.length * 100
      }
    };

    // Count top values
    ['category', 'type', 'style'].forEach(field => {
      const counts = {};
      analyzed.forEach(j => {
        const val = j[field].final;
        if (val) counts[val] = (counts[val] || 0) + 1;
      });
      stats[field].top_values = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});
    });

    // Department/Family distribution
    analyzed.forEach(j => {
      const dept = j.department.final;
      const fam = j.family.final;
      if (dept) stats.department.distribution[dept] = (stats.department.distribution[dept] || 0) + 1;
      if (fam) stats.family.distribution[fam] = (stats.family.distribution[fam] || 0) + 1;
    });

    // Identify issues
    const issues = {
      category_disagreements: analyzed.filter(j => !j.category.agreed).map(j => ({
        index: j.index,
        job_id: j.job_id,
        model: j.input.model_number,
        openai: j.category.openai,
        xai: j.category.xai,
        final: j.category.final,
        source: j.category.source
      })),

      type_disagreements: analyzed.filter(j => !j.type.agreed).map(j => ({
        index: j.index,
        job_id: j.job_id,
        model: j.input.model_number,
        openai: j.type.openai,
        xai: j.type.xai,
        final: j.type.final,
        source: j.type.source
      })),

      style_disagreements: analyzed.filter(j => !j.style.agreed).map(j => ({
        index: j.index,
        job_id: j.job_id,
        model: j.input.model_number,
        openai: j.style.openai,
        xai: j.style.xai,
        final: j.style.final,
        source: j.style.source
      })),

      low_verification_scores: analyzed.filter(j => j.verification.score < 80).map(j => ({
        index: j.index,
        job_id: j.job_id,
        model: j.input.model_number,
        score: j.verification.score,
        corrections_count: j.verification.corrections_count
      })),

      webhook_failures: analyzed.filter(j => !j.webhook.sent).map(j => ({
        index: j.index,
        job_id: j.job_id,
        model: j.input.model_number
      }))
    };

    // Save full analysis
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    const dataFile = path.join(OUTPUT_DIR, `sf-50-calls-analysis-${timestamp}.json`);
    await fs.writeFile(dataFile, JSON.stringify({ metadata: { timestamp, stats }, jobs: analyzed }, null, 2));

    // Generate Markdown Report
    let report = `# Salesforce 50-Call Comprehensive Audit\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Total Jobs:** ${stats.total}\n`;
    report += `**Timespan:** ${new Date(stats.timespan.first).toISOString()} to ${new Date(stats.timespan.last).toISOString()}\n`;
    report += `**Duration:** ${stats.timespan.duration_seconds.toFixed(1)}s (${(stats.timespan.duration_seconds / stats.total).toFixed(2)}s per job)\n\n`;

    report += `---\n\n## 📊 Executive Summary\n\n`;
    report += `### Category Analysis\n`;
    report += `- **Agreement Rate:** ${(stats.category.agreed / stats.total * 100).toFixed(1)}% (${stats.category.agreed}/${stats.total})\n`;
    report += `- **Disagreements:** ${stats.category.disagreed}\n`;
    report += `- **Unique Categories:** ${stats.category.unique_values}\n\n`;

    report += `### Type Analysis\n`;
    report += `- **Agreement Rate:** ${(stats.type.agreed / stats.total * 100).toFixed(1)}% (${stats.type.agreed}/${stats.total})\n`;
    report += `- **Disagreements:** ${stats.type.disagreed}\n`;
    report += `- **Unique Types:** ${stats.type.unique_values}\n\n`;

    report += `### Style Analysis\n`;
    report += `- **Agreement Rate:** ${(stats.style.agreed / stats.total * 100).toFixed(1)}% (${stats.style.agreed}/${stats.total})\n`;
    report += `- **Disagreements:** ${stats.style.disagreed}\n`;
    report += `- **Unique Styles:** ${stats.style.unique_values}\n\n`;

    report += `### Verification Quality\n`;
    report += `- **Average Score:** ${stats.verification.avg_score.toFixed(1)}/100\n`;
    report += `- **Avg Processing Time:** ${(stats.verification.avg_processing_time_ms / 1000).toFixed(2)}s\n`;
    report += `- **Total Corrections:** ${stats.verification.total_corrections}\n`;
    report += `- **Webhook Success Rate:** ${stats.webhook.success_rate.toFixed(1)}%\n\n`;

    report += `---\n\n## 🎯 Top Values Detected\n\n`;
    
    report += `### Top 10 Categories\n`;
    Object.entries(stats.category.top_values).forEach(([cat, count]) => {
      report += `- **${cat}**: ${count} (${(count/stats.total*100).toFixed(1)}%)\n`;
    });

    report += `\n### Top 10 Types\n`;
    Object.entries(stats.type.top_values).forEach(([type, count]) => {
      report += `- **${type}**: ${count} (${(count/stats.total*100).toFixed(1)}%)\n`;
    });

    report += `\n### Top 10 Styles\n`;
    Object.entries(stats.style.top_values).forEach(([style, count]) => {
      report += `- **${style}**: ${count} (${(count/stats.total*100).toFixed(1)}%)\n`;
    });

    report += `\n### Department Distribution\n`;
    Object.entries(stats.department.distribution).sort((a, b) => b[1] - a[1]).forEach(([dept, count]) => {
      report += `- **${dept}**: ${count}\n`;
    });

    report += `\n### Family Distribution\n`;
    Object.entries(stats.family.distribution).sort((a, b) => b[1] - a[1]).forEach(([fam, count]) => {
      report += `- **${fam}**: ${count}\n`;
    });

    report += `\n---\n\n## ⚠️ Issues Identified\n\n`;
    
    if (issues.category_disagreements.length > 0) {
      report += `### Category Disagreements (${issues.category_disagreements.length})\n\n`;
      issues.category_disagreements.forEach(issue => {
        report += `- **#${issue.index}** (${issue.model}): OpenAI="${issue.openai}" vs xAI="${issue.xai}" → Final="${issue.final}" (${issue.source})\n`;
      });
      report += `\n`;
    }

    if (issues.type_disagreements.length > 0) {
      report += `### Type Disagreements (${issues.type_disagreements.length})\n\n`;
      issues.type_disagreements.forEach(issue => {
        report += `- **#${issue.index}** (${issue.model}): OpenAI="${issue.openai}" vs xAI="${issue.xai}" → Final="${issue.final}" (${issue.source})\n`;
      });
      report += `\n`;
    }

    if (issues.style_disagreements.length > 0) {
      report += `### Style Disagreements (${issues.style_disagreements.length})\n\n`;
      issues.style_disagreements.forEach(issue => {
        report += `- **#${issue.index}** (${issue.model}): OpenAI="${issue.openai}" vs xAI="${issue.xai}" → Final="${issue.final}" (${issue.source})\n`;
      });
      report += `\n`;
    }

    if (issues.low_verification_scores.length > 0) {
      report += `### Low Verification Scores (<80) (${issues.low_verification_scores.length})\n\n`;
      issues.low_verification_scores.forEach(issue => {
        report += `- **#${issue.index}** (${issue.model}): Score=${issue.score}, Corrections=${issue.corrections_count}\n`;
      });
      report += `\n`;
    }

    if (issues.webhook_failures.length > 0) {
      report += `### Webhook Failures (${issues.webhook_failures.length})\n\n`;
      issues.webhook_failures.forEach(issue => {
        report += `- **#${issue.index}** (${issue.model}): Job ${issue.job_id}\n`;
      });
      report += `\n`;
    }

    report += `---\n\n## 📋 Detailed Job List\n\n`;
    analyzed.forEach(job => {
      report += `### Job #${job.index}: ${job.input.model_number || 'N/A'}\n`;
      report += `- **SF Catalog ID:** ${job.sf_catalog_id}\n`;
      report += `- **Category:** ${job.category.final} ${job.category.agreed ? '✅' : `⚠️ (OpenAI: ${job.category.openai}, xAI: ${job.category.xai})`}\n`;
      report += `- **Type:** ${job.type.final} ${job.type.agreed ? '✅' : `⚠️ (OpenAI: ${job.type.openai}, xAI: ${job.type.xai})`}\n`;
      report += `- **Style:** ${job.style.final} ${job.style.agreed ? '✅' : `⚠️ (OpenAI: ${job.style.openai}, xAI: ${job.style.xai})`}\n`;
      report += `- **Brand:** ${job.brand.final}\n`;
      report += `- **Department:** ${job.department.final}\n`;
      report += `- **Family:** ${job.family.final}\n`;
      report += `- **Verification Score:** ${job.verification.score}/100\n`;
      report += `- **Processing Time:** ${(job.processing_time_ms / 1000).toFixed(2)}s\n`;
      if (job.verification.corrections_count > 0) {
        report += `- **Corrections:** ${job.verification.corrections_count}\n`;
        job.verification.corrections.forEach(c => {
          report += `  - ${c.field}: "${c.original}" → "${c.corrected}"\n`;
        });
      }
      report += `\n`;
    });

    const reportFile = path.join(OUTPUT_DIR, `SF-50-CALLS-AUDIT-${timestamp}.md`);
    await fs.writeFile(reportFile, report);

    console.log(`\n${'═'.repeat(65)}`);
    console.log(`📁 OUTPUT FILES:\n`);
    console.log(`   Data: ${dataFile}`);
    console.log(`   Report: ${reportFile}\n`);
    console.log(`${'═'.repeat(65)}`);
    console.log(`\n✅ Audit complete!\n`);

    // Console summary
    console.log(`📊 KEY FINDINGS:\n`);
    console.log(`   Category Agreement:  ${(stats.category.agreed / stats.total * 100).toFixed(1)}% (${stats.category.disagreed} disagreements)`);
    console.log(`   Type Agreement:      ${(stats.type.agreed / stats.total * 100).toFixed(1)}% (${stats.type.disagreed} disagreements)`);
    console.log(`   Style Agreement:     ${(stats.style.agreed / stats.total * 100).toFixed(1)}% (${stats.style.disagreed} disagreements)`);
    console.log(`   Avg Verification:    ${stats.verification.avg_score.toFixed(1)}/100`);
    console.log(`   Webhook Success:     ${stats.webhook.success_rate.toFixed(1)}%\n`);

    if (issues.category_disagreements.length > 0 || issues.type_disagreements.length > 0 || issues.style_disagreements.length > 0) {
      console.log(`⚠️  ATTENTION NEEDED:\n`);
      if (issues.category_disagreements.length > 0) {
        console.log(`   ${issues.category_disagreements.length} category disagreements between AI models`);
      }
      if (issues.type_disagreements.length > 0) {
        console.log(`   ${issues.type_disagreements.length} type disagreements between AI models`);
      }
      if (issues.style_disagreements.length > 0) {
        console.log(`   ${issues.style_disagreements.length} style disagreements between AI models`);
      }
      console.log(`\n   Review detailed report for specifics.\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

main().catch(console.error);
