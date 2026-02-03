const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/latest-50-results.json', 'utf8'));

console.log('======================================================================');
console.log('ANALYSIS OF LATEST 50 VERIFICATION RESULTS');
console.log('======================================================================');

const startDate = data.length > 0 && data[data.length-1].createdAt ? data[data.length-1].createdAt.slice(0,10) : 'N/A';
const endDate = data.length > 0 && data[0].createdAt ? data[0].createdAt.slice(0,10) : 'N/A';
console.log('Date Range:', startDate, 'to', endDate);
console.log('Total Results:', data.length);

// Helper to find a field in field_results
function findField(fieldResults, fieldName) {
  if (!fieldResults) return null;
  return fieldResults.find(f => f.field_name && f.field_name.toLowerCase() === fieldName.toLowerCase());
}

// 1. Style Matching Analysis
const missingStyles = [];
const matchedStyles = [];

for (const r of data) {
  const styleField = findField(r.field_results, 'product_style');
  const style = styleField ? styleField.final_value : null;
  const inputPayload = r.input_payload || {};
  const inputStyle = inputPayload.Ferguson_Product_Style;
  
  if (!style || style === '' || style === 'Not Specified' || style === 'N/A' || style === 'Not Found') {
    missingStyles.push({
      id: r.sf_catalog_id,
      brand: r.brand,
      inputStyle: inputStyle,
      aiValues: styleField ? { openai: styleField.openai_value, xai: styleField.xai_value } : null
    });
  } else {
    matchedStyles.push({ style, inputStyle });
  }
}

console.log('\n--- STYLE MATCHING ---');
console.log('Matched Styles:', matchedStyles.length);
console.log('Missing Styles:', missingStyles.length);
if (missingStyles.length > 0 && missingStyles.length <= 10) {
  console.log('Missing Style Products:');
  missingStyles.forEach(m => {
    const aiInfo = m.aiValues ? ` [OpenAI: ${m.aiValues.openai}, xAI: ${m.aiValues.xai}]` : '';
    console.log('  -', m.id, '|', m.brand, '| Input:', m.inputStyle || 'none', aiInfo);
  });
}

// 2. Brand Matching Analysis
const missingBrands = [];
const matchedBrands = [];

for (const r of data) {
  const brand = r.brand;
  const inputPayload = r.input_payload || {};
  const inputBrand = inputPayload.Ferguson_Brand || inputPayload.Brand_Web_Retailer;
  
  if (!brand || brand === '' || brand === 'Unknown') {
    missingBrands.push({
      id: r.sf_catalog_id,
      inputBrand: inputBrand
    });
  } else {
    matchedBrands.push({ brand, inputBrand });
  }
}

console.log('\n--- BRAND MATCHING ---');
console.log('Matched Brands:', matchedBrands.length);
console.log('Missing Brands:', missingBrands.length);
if (missingBrands.length > 0) {
  missingBrands.slice(0, 10).forEach(m => console.log('  -', m.id, '| Input:', m.inputBrand));
}

// 3. Overall Success Rate
let verifiedCount = 0;
let partialCount = 0;
let failedCount = 0;

for (const r of data) {
  const status = r.verification_status || r.status;
  if (status === 'verified' || status === 'success') {
    verifiedCount++;
  } else if (status === 'partial' || status === 'needs_review') {
    partialCount++;
  } else {
    failedCount++;
  }
}

console.log('\n--- VERIFICATION STATUS ---');
console.log('Verified:', verifiedCount);
console.log('Partial/Needs Review:', partialCount);
console.log('Failed/Other:', failedCount);

// 4. Consensus Analysis
let totalAgreed = 0;
let totalDisagreed = 0;
let totalPartial = 0;

for (const r of data) {
  if (r.field_results) {
    for (const f of r.field_results) {
      if (f.consensus_status === 'agreed') totalAgreed++;
      else if (f.consensus_status === 'disagreed') totalDisagreed++;
      else if (f.consensus_status === 'partial') totalPartial++;
    }
  }
}

console.log('\n--- FIELD CONSENSUS ---');
console.log('Fields Agreed (both AIs match):', totalAgreed);
console.log('Fields Partial (one AI found):', totalPartial);
console.log('Fields Disagreed:', totalDisagreed);

// 5. Verification Score Distribution
const scores = data.map(r => r.verification_score || 0);
const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
const highScores = scores.filter(s => s >= 90).length;
const medScores = scores.filter(s => s >= 70 && s < 90).length;
const lowScores = scores.filter(s => s < 70).length;

console.log('\n--- VERIFICATION SCORES ---');
console.log('Average Score:', avgScore.toFixed(1));
console.log('High (90+):', highScores);
console.log('Medium (70-89):', medScores);
console.log('Low (<70):', lowScores);

// 6. Categories
const categories = {};
for (const r of data) {
  const cat = r.product_category || 'Unknown';
  categories[cat] = (categories[cat] || 0) + 1;
}

console.log('\n--- CATEGORIES ---');
const topCats = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5);
topCats.forEach(([cat, count]) => console.log('  -', cat, ':', count));

// 7. Check for specific field coverage
const fieldCoverage = {};
for (const r of data) {
  if (r.field_results) {
    for (const f of r.field_results) {
      if (!fieldCoverage[f.field_name]) {
        fieldCoverage[f.field_name] = { found: 0, missing: 0 };
      }
      const hasValue = f.final_value && f.final_value !== 'N/A' && f.final_value !== 'Not Found' && f.final_value !== '';
      if (hasValue) {
        fieldCoverage[f.field_name].found++;
      } else {
        fieldCoverage[f.field_name].missing++;
      }
    }
  }
}

console.log('\n--- KEY FIELD COVERAGE ---');
const keyFields = ['brand', 'product_style', 'product_title', 'msrp', 'weight', 'color', 'finish', 'material'];
for (const field of keyFields) {
  if (fieldCoverage[field]) {
    const pct = Math.round(fieldCoverage[field].found / (fieldCoverage[field].found + fieldCoverage[field].missing) * 100);
    console.log('  -', field, ':', fieldCoverage[field].found, 'found,', fieldCoverage[field].missing, 'missing', `(${pct}%)`);
  }
}

// 8. Brands processed
const brands = {};
for (const r of data) {
  const brand = r.brand || 'Unknown';
  brands[brand] = (brands[brand] || 0) + 1;
}

console.log('\n--- BRANDS PROCESSED ---');
const topBrands = Object.entries(brands).sort((a, b) => b[1] - a[1]).slice(0, 8);
topBrands.forEach(([brand, count]) => console.log('  -', brand, ':', count));

console.log('\n======================================================================');
