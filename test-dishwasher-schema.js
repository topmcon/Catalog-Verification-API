// Test dishwasher schema lookup
const { getCategoryTitleSchema } = require('./dist/config/title-schema-by-category.js');
const { generateSEOTitle } = require('./dist/services/seo-title-generator.service.js');

console.log('\n=== DISHWASHER SCHEMA TEST ===\n');

// Test schema lookup
const schema = getCategoryTitleSchema('Dishwasher');
console.log('1. Schema lookup result:', !!schema ? 'FOUND ✅' : 'NOT FOUND ❌');

if (schema) {
  console.log('\n2. Schema details:');
  console.log('   Category:', schema.categoryName);
  console.log('   Slots count:', schema.slots.length);
  console.log('\n3. Slot configuration:');
  schema.slots.forEach((slot, idx) => {
    console.log(`   Position ${slot.position}: ${slot.attribute} ${slot.required ? '(required)' : ''} ${slot.format ? `- format: ${slot.format}` : ''}`);
  });
  console.log('\n4. Example title:', schema.exampleTitle);
}

// Test title generation with sample data
console.log('\n=== TITLE GENERATION TEST ===\n');
const testInput = {
  brand: 'JENNAIR',
  modelNumber: 'JDAF5924RM',
  category: 'Dishwasher',
  width: '23.56',
  placeSettings: '14',
  installationType: 'Built-In',
  style: 'Contemporary',
  finish: 'Stainless Steel'
};

console.log('5. Test input:');
console.log(JSON.stringify(testInput, null, 2));

const generatedTitle = generateSEOTitle(testInput);
console.log('\n6. Generated title:', generatedTitle);

console.log('\n7. Title analysis:');
console.log('   Has width?', generatedTitle.includes('Inch') ? '✅ YES' : '❌ NO');
console.log('   Has place settings?', generatedTitle.includes('Place Setting') ? '✅ YES' : '❌ NO');
console.log('   Has installation type?', generatedTitle.includes('Built-In') ? '✅ YES' : '❌ NO');
console.log('   Has style (SHOULD NOT)?', generatedTitle.includes('Contemporary') ? '❌ YES (WRONG!)' : '✅ NO');

console.log('\n=== END TEST ===\n');
