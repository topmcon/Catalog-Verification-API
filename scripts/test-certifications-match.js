#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ATTRIBUTES_PATH = path.join(__dirname, '../src/config/salesforce-picklists/attributes.json');

// Load attributes
const attributes = JSON.parse(fs.readFileSync(ATTRIBUTES_PATH, 'utf8'));

console.log('\n══ TESTING "certifications" MATCH ══\n');
console.log(`Total attributes in master list: ${attributes.length}\n`);

// Search for "certifications"
const searchTerm = 'certifications';
const normalized = searchTerm.toLowerCase().trim();

const exactMatch = attributes.find(a => 
  a.attribute_name.toLowerCase() === normalized
);

if (exactMatch) {
  console.log(`✅ FOUND exact match:`);
  console.log(`   attribute_name: "${exactMatch.attribute_name}"`);
  console.log(`   attribute_id: "${exactMatch.attribute_id}"\n`);
} else {
  console.log(`❌ NO exact match found\n`);
}

// Show all attributes with "cert" in the name
const withCert = attributes.filter(a => 
  a.attribute_name.toLowerCase().includes('cert')
);

console.log(`Attributes containing "cert": ${withCert.length}\n`);
withCert.forEach(a => {
  console.log(`  - "${a.attribute_name}" (${a.attribute_id})`);
});

console.log('\n');
