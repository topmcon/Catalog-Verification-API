#!/usr/bin/env node
/**
 * Generate comprehensive category title schema reference document
 */

const fs = require('fs');
const path = require('path');

const schemas = require('../dist/config/title-schema-by-category.js').CATEGORY_TITLE_SCHEMAS;
const categories = JSON.parse(fs.readFileSync('./src/config/salesforce-picklists/categories.json', 'utf8'));

// Normalization function matching getCategoryTitleSchema() in title-schema-by-category.ts
function normalizeCategory(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')     // spaces → underscores
    .replace(/[/&]/g, '_')    // forward slash and ampersand → underscore  
    .replace(/__+/g, '_');    // multiple underscores → single
}

// Group by department
const byDept = {};
for (const cat of categories) {
  const dept = cat.department || 'Unknown';
  if (!byDept[dept]) {
    byDept[dept] = [];
  }
  
  // Find schema using the exact normalization logic from the codebase
  const normalized = normalizeCategory(cat.category_name);
  const schema = schemas[normalized];
  
  byDept[dept].push({
    name: cat.category_name,
    family: cat.family,
    schema: schema || null,
    normalized
  });
}

// Sort departments and categories
const sortedDepts = Object.keys(byDept).sort();
let md = '# Complete Category Title Schema Reference\n\n';
md += '> Generated: ' + new Date().toISOString().split('T')[0] + '\n';
md += '> Total Categories: ' + categories.length + '\n';
md += '> Total Schemas: ' + Object.keys(schemas).length + '\n\n';
md += '## Table of Contents\n\n';

// Generate TOC
for (const dept of sortedDepts) {
  const anchor = dept.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  md += '- [' + dept + '](#' + anchor + ')\n';
}
md += '\n---\n\n';

const brands = ['GE', 'Samsung', 'Kohler', 'Delta', 'Moen', 'LG', 'Bosch', 'KitchenAid', 'Whirlpool', 'Frigidaire'];
const finishes = ['Stainless Steel', 'Brushed Nickel', 'Matte Black', 'Chrome', 'White', 'Oil Rubbed Bronze'];
const types = ['Standard', 'Professional', 'Premium', 'Commercial', 'Residential'];

let schemaFoundCount = 0;
let schemaMissingCount = 0;

for (const dept of sortedDepts) {
  md += '## ' + dept + '\n\n';
  
  // Group by family within department
  const byFamily = {};
  for (const cat of byDept[dept]) {
    const fam = cat.family || 'General';
    if (!byFamily[fam]) {
      byFamily[fam] = [];
    }
    byFamily[fam].push(cat);
  }
  
  for (const fam of Object.keys(byFamily).sort()) {
    md += '### ' + fam + '\n\n';
    
    for (const cat of byFamily[fam].sort((a,b) => a.name.localeCompare(b.name))) {
      md += '#### ' + cat.name + '\n\n';
      
      if (cat.schema) {
        schemaFoundCount++;
        md += '**Template:** `' + (cat.schema.template || 'N/A') + '`\n\n';
        
        // Slots table
        if (cat.schema.slots && cat.schema.slots.length > 0) {
          md += '| Pos | Attribute | Required | Format |\n';
          md += '|-----|-----------|----------|--------|\n';
          for (const slot of cat.schema.slots) {
            const fmt = slot.format || '-';
            const req = slot.required ? '✅' : '❌';
            md += '| ' + slot.position + ' | ' + slot.attribute + ' | ' + req + ' | `' + fmt + '` |\n';
          }
          md += '\n';
        }
        
        // Example from schema
        if (cat.schema.exampleTitle) {
          md += '**Schema Example:** `' + cat.schema.exampleTitle + '`\n\n';
        }
        
        // Generate 3 realistic variations
        md += '**Sample Titles:**\n';
        for (let i = 0; i < 3; i++) {
          const brand = brands[(i * 3) % brands.length];
          const finish = finishes[(i * 2) % finishes.length];
          const type = types[i % types.length];
          const width = [24, 30, 36][i];
          const model = ['ABC-' + (100 + i*50), 'XYZ-' + (200 + i*100), 'PRO-' + (500 + i*25)][i];
          
          let title = brand + ' ';
          
          // Build title based on slots
          if (cat.schema.slots) {
            const slotTypes = cat.schema.slots.map(s => s.attribute);
            
            if (slotTypes.some(a => a.includes('Width') || a.includes('Inch') || a.includes('Diameter'))) {
              title += width + '-Inch ';
            }
            if (slotTypes.includes('Type') && !cat.name.includes('Hardware')) {
              title += type + ' ';
            }
          }
          
          title += cat.name + ' ' + finish + ' - ' + model;
          title = title.replace(/\s+/g, ' ').trim();
          
          // Ensure reasonable length
          if (title.length > 80) {
            title = title.substring(0, 77) + '...';
          }
          
          md += (i+1) + '. `' + title + '`\n';
        }
        md += '\n';
        
        // SEO notes
        if (cat.schema.seoNotes) {
          md += '> **SEO Notes:** ' + cat.schema.seoNotes + '\n\n';
        }
      } else {
        schemaMissingCount++;
        md += '⚠️ *Schema not found*\n\n';
        md += '- Normalized key searched: `' + cat.normalized + '`\n';
        md += '- Status: Missing schema definition\n\n';
      }
      
      md += '---\n\n';
    }
  }
}

// Summary at the end
md += '## Summary\n\n';
md += '| Metric | Count |\n';
md += '|--------|-------|\n';
md += '| Total Categories | ' + categories.length + ' |\n';
md += '| Schemas Found | ' + schemaFoundCount + ' |\n';
md += '| Schemas Missing | ' + schemaMissingCount + ' |\n';
md += '| Coverage | ' + ((schemaFoundCount / categories.length) * 100).toFixed(1) + '% |\n';

fs.writeFileSync('./docs/CATEGORY-TITLE-SCHEMA-REFERENCE.md', md);
console.log('✅ Created: docs/CATEGORY-TITLE-SCHEMA-REFERENCE.md');
console.log('   Total categories: ' + categories.length);
console.log('   Schemas found: ' + schemaFoundCount);
console.log('   Schemas missing: ' + schemaMissingCount);
