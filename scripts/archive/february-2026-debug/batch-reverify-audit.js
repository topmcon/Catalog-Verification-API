#!/usr/bin/env node
/**
 * Batch Re-Verification Comprehensive Audit
 * 
 * Purpose: Compare original vs new verification results, identify differences,
 * improvements, regressions, and areas for logic improvement.
 * 
 * Usage: node scripts/batch-reverify-audit.js <original-file.json> <new-file.json>
 */

const fs = require('fs').promises;
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'audit-results');

function compareValues(original, newValue, fieldName) {
  const orig = String(original || '').trim();
  const curr = String(newValue || '').trim();
  
  if (orig === curr) {
    return { status: 'UNCHANGED', original: orig, new: curr };
  }
  
  // Check for improvements
  const notFoundVariants = ['Not Found', 'Not Applicable', 'N/A', '', 'null', 'undefined'];
  const origIsNotFound = notFoundVariants.includes(orig);
  const currIsNotFound = notFoundVariants.includes(curr);
  
  if (origIsNotFound && !currIsNotFound) {
    return { status: 'IMPROVED', original: orig, new: curr, note: 'Found value where it was missing' };
  }
  
  if (!origIsNotFound && currIsNotFound) {
    return { status: 'REGRESSION', original: orig, new: curr, note: 'Lost previously found value' };
  }
  
  // Both have values but different
  return { status: 'CHANGED', original: orig, new: curr, note: 'Value changed (needs review)' };
}

function generateDetailedReport(comparisons) {
  const report = {
    summary: {
      total_products: comparisons.length,
      unchanged: 0,
      improved: 0,
      regressed: 0,
      changed: 0,
      categories_changed: 0,
      types_changed: 0,
      styles_changed: 0
    },
    by_field: {
      category: { unchanged: 0, improved: 0, regressed: 0, changed: 0 },
      type: { unchanged: 0, improved: 0, regressed: 0, changed: 0 },
      style: { unchanged: 0, improved: 0, regressed: 0, changed: 0 },
      brand: { unchanged: 0, improved: 0, regressed: 0, changed: 0 },
      department: { unchanged: 0, improved: 0, regressed: 0, changed: 0 },
      family: { unchanged: 0, improved: 0, regressed: 0, changed: 0 }
    },
    improvements: [],
    regressions: [],
    category_changes: [],
    type_changes: [],
    style_changes: [],
    consensus_source_changes: {
      category: {},
      type: {},
      style: {}
    }
  };

  comparisons.forEach(comp => {
    let hasChange = false;
    let hasImprovement = false;
    let hasRegression = false;

    ['category', 'type', 'style', 'brand', 'department', 'family'].forEach(field => {
      const status = comp.comparison[field].status;
      report.by_field[field][status.toLowerCase()]++;
      
      if (status !== 'UNCHANGED') hasChange = true;
      if (status === 'IMPROVED') hasImprovement = true;
      if (status === 'REGRESSION') hasRegression = true;

      // Track specific changes
      if (field === 'category' && status !== 'UNCHANGED') {
        report.summary.categories_changed++;
        report.category_changes.push({
          product: comp.product_title,
          model: comp.model_number,
          original: comp.comparison.category.original,
          new: comp.comparison.category.new,
          status: status
        });
      }
      if (field === 'type' && status !== 'UNCHANGED') {
        report.summary.types_changed++;
        report.type_changes.push({
          product: comp.product_title,
          model: comp.model_number,
          category: comp.comparison.category.new || comp.comparison.category.original,
          original: comp.comparison.type.original,
          new: comp.comparison.type.new,
          status: status
        });
      }
      if (field === 'style' && status !== 'UNCHANGED') {
        report.summary.styles_changed++;
        report.style_changes.push({
          product: comp.product_title,
          model: comp.model_number,
          category: comp.comparison.category.new || comp.comparison.category.original,
          original: comp.comparison.style.original,
          new: comp.comparison.style.new,
          status: status
        });
      }
    });

    if (!hasChange) report.summary.unchanged++;
    if (hasImprovement) {
      report.summary.improved++;
      report.improvements.push({
        product: comp.product_title,
        model: comp.model_number,
        changes: Object.entries(comp.comparison)
          .filter(([k, v]) => v.status === 'IMPROVED')
          .map(([k, v]) => ({ field: k, from: v.original, to: v.new }))
      });
    }
    if (hasRegression) {
      report.summary.regressed++;
      report.regressions.push({
        product: comp.product_title,
        model: comp.model_number,
        changes: Object.entries(comp.comparison)
          .filter(([k, v]) => v.status === 'REGRESSION')
          .map(([k, v]) => ({ field: k, from: v.original, to: v.new }))
      });
    }
    if (hasChange && !hasImprovement && !hasRegression) {
      report.summary.changed++;
    }

    // Track consensus source changes
    ['category', 'type', 'style'].forEach(field => {
      const origSource = comp.original_response[`${field}_source`];
      const newSource = comp.new_response[`${field}_source`];
      if (origSource && newSource && origSource !== newSource) {
        const key = `${origSource} → ${newSource}`;
        report.consensus_source_changes[field][key] = (report.consensus_source_changes[field][key] || 0) + 1;
      }
    });
  });

  return report;
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         BATCH RE-VERIFICATION COMPREHENSIVE AUDIT              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const originalFile = process.argv[2];
  const newFile = process.argv[3];

  if (!originalFile || !newFile) {
    console.error('❌ Error: Both original and new result files required');
    console.log('\nUsage: node scripts/batch-reverify-audit.js <original-file.json> <new-file.json>');
    process.exit(1);
  }

  try {
    // Load both files
    console.log(`📥 Loading files...\n`);
    console.log(`  Original: ${originalFile}`);
    console.log(`  New:      ${newFile}\n`);

    const originalData = JSON.parse(await fs.readFile(originalFile, 'utf8'));
    const newData = JSON.parse(await fs.readFile(newFile, 'utf8'));

    console.log(`✅ Loaded ${originalData.length} original and ${newData.length} new results\n`);

    // Match up jobs by original_job_id
    console.log('🔍 Matching and comparing results...\n');

    const comparisons = [];
    const notMatched = [];

    originalData.forEach(orig => {
      const newResult = newData.find(n => n.original_job_id === orig.job_id);
      
      if (!newResult) {
        notMatched.push(orig.job_id);
        return;
      }

      const comparison = {
        job_id: orig.job_id,
        salesforce_id: orig.salesforce_id,
        product_title: orig.product_data.product_title,
        model_number: orig.product_data.model_number,
        manufacturer: orig.product_data.manufacturer_name,
        original_response: orig.original_response,
        new_response: newResult.new_response,
        comparison: {
          category: compareValues(orig.original_response.category, newResult.new_response.category, 'category'),
          type: compareValues(orig.original_response.type, newResult.new_response.type, 'type'),
          style: compareValues(orig.original_response.style, newResult.new_response.style, 'style'),
          brand: compareValues(orig.original_response.brand, newResult.new_response.brand, 'brand'),
          department: compareValues(orig.original_response.department, newResult.new_response.department, 'department'),
          family: compareValues(orig.original_response.family, newResult.new_response.family, 'family')
        }
      };

      comparisons.push(comparison);
    });

    if (notMatched.length > 0) {
      console.log(`⚠️  Warning: ${notMatched.length} original jobs could not be matched with new results\n`);
    }

    // Generate detailed report
    console.log('📊 Generating comprehensive audit report...\n');
    const report = generateDetailedReport(comparisons);

    // Save comparison data
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const comparisonFile = path.join(OUTPUT_DIR, `batch-reverify-comparison-${timestamp}.json`);
    await fs.writeFile(comparisonFile, JSON.stringify(comparisons, null, 2));

    // Save audit report
    const reportFile = path.join(OUTPUT_DIR, `batch-reverify-audit-report-${timestamp}.json`);
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    // Generate markdown report
    const mdReport = generateMarkdownReport(report, comparisons);
    const mdFile = path.join(OUTPUT_DIR, `BATCH-REVERIFY-AUDIT-${timestamp}.md`);
    await fs.writeFile(mdFile, mdReport);

    // Display summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    AUDIT SUMMARY                               ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`Total Products Compared: ${report.summary.total_products}\n`);

    console.log('Overall Results:');
    console.log(`  ✅ Unchanged:   ${report.summary.unchanged} (${((report.summary.unchanged/report.summary.total_products)*100).toFixed(1)}%)`);
    console.log(`  📈 Improved:    ${report.summary.improved} (${((report.summary.improved/report.summary.total_products)*100).toFixed(1)}%)`);
    console.log(`  📉 Regressed:   ${report.summary.regressed} (${((report.summary.regressed/report.summary.total_products)*100).toFixed(1)}%)`);
    console.log(`  🔄 Changed:     ${report.summary.changed} (${((report.summary.changed/report.summary.total_products)*100).toFixed(1)}%)\n`);

    console.log('Field-Level Changes:');
    console.log(`  Categories:    ${report.summary.categories_changed} changed`);
    console.log(`  Types:         ${report.summary.types_changed} changed`);
    console.log(`  Styles:        ${report.summary.styles_changed} changed\n`);

    console.log('By Field Status:');
    ['category', 'type', 'style'].forEach(field => {
      const stats = report.by_field[field];
      console.log(`\n  ${field.toUpperCase()}:`);
      console.log(`    Unchanged:  ${stats.unchanged}`);
      console.log(`    Improved:   ${stats.improved}`);
      console.log(`    Regressed:  ${stats.regressed}`);
      console.log(`    Changed:    ${stats.changed}`);
    });

    if (report.regressions.length > 0) {
      console.log('\n\n⚠️  REGRESSIONS DETECTED:\n');
      report.regressions.slice(0, 5).forEach((reg, i) => {
        console.log(`  ${i + 1}. ${reg.product} (${reg.model})`);
        reg.changes.forEach(ch => {
          console.log(`     ${ch.field}: "${ch.from}" → "${ch.to}"`);
        });
      });
      if (report.regressions.length > 5) {
        console.log(`\n  ... and ${report.regressions.length - 5} more (see full report)`);
      }
    }

    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('                    FILES GENERATED                             ');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`📁 Comparison Data:  ${comparisonFile}`);
    console.log(`📊 Audit Report:     ${reportFile}`);
    console.log(`📝 Markdown Report:  ${mdFile}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ Audit complete! Review the markdown report for detailed analysis.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function generateMarkdownReport(report, comparisons) {
  const timestamp = new Date().toISOString();
  
  let md = `# Batch Re-Verification Audit Report\n\n`;
  md += `**Generated**: ${timestamp}\n\n`;
  md += `---\n\n`;
  
  md += `## Executive Summary\n\n`;
  md += `- **Total Products Tested**: ${report.summary.total_products}\n`;
  md += `- **Unchanged**: ${report.summary.unchanged} (${((report.summary.unchanged/report.summary.total_products)*100).toFixed(1)}%)\n`;
  md += `- **Improved**: ${report.summary.improved} (${((report.summary.improved/report.summary.total_products)*100).toFixed(1)}%)\n`;
  md += `- **Regressed**: ${report.summary.regressed} (${((report.summary.regressed/report.summary.total_products)*100).toFixed(1)}%)\n`;
  md += `- **Changed**: ${report.summary.changed} (${((report.summary.changed/report.summary.total_products)*100).toFixed(1)}%)\n\n`;

  md += `### Field-Level Summary\n\n`;
  md += `| Field | Unchanged | Improved | Regressed | Changed |\n`;
  md += `|-------|-----------|----------|-----------|----------|\n`;
  ['category', 'type', 'style', 'brand', 'department', 'family'].forEach(field => {
    const s = report.by_field[field];
    md += `| ${field} | ${s.unchanged} | ${s.improved} | ${s.regressed} | ${s.changed} |\n`;
  });
  md += `\n---\n\n`;

  if (report.regressions.length > 0) {
    md += `## ⚠️ CRITICAL: Regressions Found (${report.regressions.length})\n\n`;
    md += `These products had WORSE results with the new logic:\n\n`;
    report.regressions.forEach((reg, i) => {
      md += `### ${i + 1}. ${reg.product}\n`;
      md += `- **Model**: ${reg.model}\n`;
      md += `- **Changes**:\n`;
      reg.changes.forEach(ch => {
        md += `  - **${ch.field}**: "${ch.from}" → "${ch.to}"\n`;
      });
      md += `\n`;
    });
    md += `\n---\n\n`;
  }

  if (report.improvements.length > 0) {
    md += `## ✅ Improvements (${report.improvements.length})\n\n`;
    md += `These products had BETTER results with the new logic:\n\n`;
    report.improvements.slice(0, 10).forEach((imp, i) => {
      md += `### ${i + 1}. ${imp.product}\n`;
      md += `- **Model**: ${imp.model}\n`;
      md += `- **Improvements**:\n`;
      imp.changes.forEach(ch => {
        md += `  - **${ch.field}**: "${ch.from}" → "${ch.to}"\n`;
      });
      md += `\n`;
    });
    if (report.improvements.length > 10) {
      md += `\n... and ${report.improvements.length - 10} more improvements (see JSON report)\n\n`;
    }
    md += `\n---\n\n`;
  }

  if (report.category_changes.length > 0) {
    md += `## Category Changes (${report.category_changes.length})\n\n`;
    md += `| Product | Model | Original | New | Status |\n`;
    md += `|---------|-------|----------|-----|--------|\n`;
    report.category_changes.forEach(ch => {
      md += `| ${ch.product.substring(0, 40)}... | ${ch.model || 'N/A'} | ${ch.original} | ${ch.new} | ${ch.status} |\n`;
    });
    md += `\n---\n\n`;
  }

  if (report.type_changes.length > 0) {
    md += `## Type Changes (${report.type_changes.length})\n\n`;
    md += `| Product | Category | Original Type | New Type | Status |\n`;
    md += `|---------|----------|---------------|----------|--------|\n`;
    report.type_changes.forEach(ch => {
      md += `| ${ch.product.substring(0, 30)}... | ${ch.category} | ${ch.original} | ${ch.new} | ${ch.status} |\n`;
    });
    md += `\n---\n\n`;
  }

  if (report.style_changes.length > 0) {
    md += `## Style Changes (${report.style_changes.length})\n\n`;
    md += `| Product | Category | Original Style | New Style | Status |\n`;
    md += `|---------|----------|----------------|-----------|--------|\n`;
    report.style_changes.forEach(ch => {
      md += `| ${ch.product.substring(0, 30)}... | ${ch.category} | ${ch.original} | ${ch.new} | ${ch.status} |\n`;
    });
    md += `\n---\n\n`;
  }

  md += `## Consensus Source Changes\n\n`;
  ['category', 'type', 'style'].forEach(field => {
    const changes = report.consensus_source_changes[field];
    if (Object.keys(changes).length > 0) {
      md += `### ${field.toUpperCase()}\n\n`;
      Object.entries(changes).forEach(([key, count]) => {
        md += `- ${key}: ${count} products\n`;
      });
      md += `\n`;
    }
  });

  md += `\n---\n\n`;
  md += `## Detailed Comparison Data\n\n`;
  md += `See \`batch-reverify-comparison-*.json\` for full product-by-product comparison.\n\n`;

  return md;
}

main().catch(console.error);
