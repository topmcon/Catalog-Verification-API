#!/usr/bin/env node
/**
 * Analyze Top 15 Filter Attributes for Category Mismatches
 * Identifies attributes that don't apply to their assigned categories
 */

const data = require('../docs/optimized-top15-filter-attributes.json');

const analysis = {
  missingSfIds: [],
  potentialMismatches: [],
};

const attrUsage = new Map();

// Collect attribute usage across all categories
for (const [category, catData] of Object.entries(data.categories)) {
  for (const attr of catData.attributes) {
    if (!attrUsage.has(attr.name)) {
      attrUsage.set(attr.name, []);
    }
    attrUsage.get(attr.name).push({ category, rank: attr.rank, sf_id: attr.sf_id });
    
    if (attr.sf_id === null) {
      analysis.missingSfIds.push({ category, attribute: attr.name, rank: attr.rank });
    }
  }
}

// Define invalid attribute/category combinations
const invalidCombos = [
  { attr: 'Sanitary Rinse', invalidIn: ['Dryer'], reason: 'Sanitary Rinse is a washing function, not a drying function' },
  { attr: 'CFM', invalidIn: ['Microwave'], reason: 'CFM only relevant for over-the-range models (not all microwaves)' },
];

for (const combo of invalidCombos) {
  for (const [category, catData] of Object.entries(data.categories)) {
    const found = catData.attributes.find(a => a.name === combo.attr);
    if (found && combo.invalidIn.some(inv => category.includes(inv))) {
      analysis.potentialMismatches.push({
        category, attribute: combo.attr, rank: found.rank, reason: combo.reason
      });
    }
  }
}

// Find widely used attributes
const widelyUsedAttrs = [];
for (const [attrName, usages] of attrUsage) {
  if (usages.length >= 15) {
    widelyUsedAttrs.push({ name: attrName, count: usages.length });
  }
}

console.log(JSON.stringify({
  totalCategories: Object.keys(data.categories).length,
  missingSfIds: analysis.missingSfIds,
  potentialMismatches: analysis.potentialMismatches,
  widelyUsedAttributes: widelyUsedAttrs.sort((a,b) => b.count - a.count)
}, null, 2));
