/**
 * Audit: Salesforce Categories vs Repository Categories
 * Compares SF category/department structure with our picklist files
 */

const fs = require('fs');
const path = require('path');

// Salesforce data (parsed from user's table)
const SF_DATA = {
  departments: [
    'Appliances',
    'Electronics',
    'Flooring',
    'Hardware',
    'Heating & Cooling',
    'Home Décor & Furniture',
    'Industrial & Commercial',
    'Lighting & Electrical',
    'Not Applicable Department',
    'Outdoor',
    'Plumbing & Bath'
  ],
  categories: {
    'Appliances': [
      'All in One Washer / Dryer',
      'Appliances',
      'Barbeque',
      'Beverage Center',
      'Coffee Maker',
      'Cooking',
      'Cooktop',
      'Dishwasher',
      'Drawer',
      'Dryer',
      'Freezer',
      'Icemaker',
      'Kitchen Appliances',
      'Laundry Appliances',
      'Microwave',
      'Oven',
      'Pizza Oven',
      'Range',
      'Range Hood',
      'Refrigeration',
      'Refrigerator',
      'Standalone Pedestal',
      'Washer',
      'Wine Cooler'
    ],
    'Electronics': [
      'Home Electronics'
    ],
    'Flooring': [
      'Carpet Tile',
      'Hardscaping',
      'Hardwood Flooring',
      'Laminate Flooring',
      'Luxury Vinyl Flooring',
      'Tile',
      'Waterproof Flooring'
    ],
    'Hardware': [
      'Affordable Cabinet Knob',
      'Affordable Cabinet Pull',
      'Appliance Pull',
      'Backplate',
      'Barn Door Hardware',
      'Cabinet Catch and Latch',
      'Cabinet Finishing',
      'Cabinet Hardware',
      'Cabinet Hardware Bulk Pack',
      'Cabinet Hardware Mounting Template',
      'Cabinet Hinge',
      'Cabinet Knob',
      'Cabinet Lock',
      'Cabinet Organization and Storage',
      'Cabinet Pull',
      'Closet and Pocket Door Hardware',
      'Commercial Door Hardware',
      'Deadbolt',
      'Designer Cabinet Hardware',
      'Designer Hardware',
      'Door',
      'Door Entry Set',
      'Door Hardware Part',
      'Door Hardware: Knob and Lever',
      'Door Hinge',
      'Door Knob',
      'Door Lever',
      'Drawer Slide and Accessory',
      'Handleset',
      'Home Hardware',
      'Keyed Hardware',
      'Keyless Entry',
      'Lock Combo Pack',
      'Luxury Cabinet Knob',
      'Luxury Cabinet Pull',
      'Mortise Lock',
      'Multi Point Door Hardware',
      'Safe, Lock and Lock Box',
      'Safety & Security',
      'Screen and Storm Door Hardware',
      'Sliding Door Hardware',
      'Storage and Organization',
      'Vanity Cabinet Hardware'
    ],
    'Heating & Cooling': [
      'Air Conditioner',
      'Air Filter',
      'Commercial HVAC',
      'Dehumidifier',
      'Ducting',
      'Evaporative Cooler',
      'Exhaust Fan',
      'Fire Pit',
      'Generator',
      'Heating',
      'HVAC Accessory',
      'Indoor Heating',
      'Mini Split Air Conditioner',
      'Patio Heater',
      'Room Heater',
      'Skylight',
      'Stove and Chimney Pipe',
      'Stove and Fireplace',
      'Thermostat',
      'Water Heater'
    ],
    'Home Décor & Furniture': [
      'Chair',
      'Furniture',
      'Home Accents',
      'Home Organization',
      'Lamp',
      'Mirror',
      'Outdoor and Patio Furniture',
      'Rug',
      'Wall Decor'
    ],
    'Industrial & Commercial': [
      'Chemicals & Compounds',
      'Commercial Lighting',
      'Commercial Restroom',
      'Drainage & Waste',
      'Hydronic Expansion Tank',
      'Industrial Strainer',
      'Water Fountain'
    ],
    'Lighting & Electrical': [
      'Air Circulator',
      'Attic Fan',
      'Ceiling Fan',
      'Ceiling Fan Accessory',
      'Ceiling Fan with Light',
      'Ceiling Fan with Remote',
      'Ceiling Fan without Light',
      'Ceiling Light',
      'Chandelier',
      'DC Motor Ceiling Fan',
      'Designer Ceiling Fan',
      'Dual Ceiling Fan',
      'Fandelier Ceiling Fan',
      'Hugger Fan',
      'Indoor Ceiling Fan',
      'Island Lighting',
      'Kitchen Lighting',
      'Lamp',
      'Landscape Lighting',
      'Large Ceiling Fan',
      'LED Ceiling Fan',
      'LED Lighting',
      'Light Bulbs',
      'Light Switches & Dimmers',
      'Lighted Ceiling Fan',
      'Lighting Accessory',
      'Outdoor Ceiling Fan',
      'Outdoor Lighting',
      'Pendant',
      'Post Light',
      'Recessed Lighting',
      'Small Ceiling Fan',
      'Smart Home Fan',
      'Step Lighting',
      'Track and Rail Lighting',
      'Trending Ceiling Fan',
      'Under Cabinet Light',
      'Utility Fan',
      'Vanity Lighting',
      'Wall Mounted Fan',
      'Wall Sconce'
    ],
    'Not Applicable Department': [
      'Do Not List (On Hold)'
    ],
    'Outdoor': [
      'Entry Set',
      'Exterior Door',
      'Fire Pit',
      'Fire Pit Accessory',
      'Garden Decor',
      'Generator',
      'Hardscaping',
      'Mail Box',
      'Outdoor Ceiling Fan',
      'Outdoor Fireplace',
      'Outdoor Heating',
      'Outdoor Kitchen',
      'Outdoor Lighting',
      'Outdoor Shower Faucet',
      'Patio Heater',
      'Rug',
      'Storage Drawer/Door'
    ],
    'Plumbing & Bath': [
      'Backsplash Kitchen Tile',
      'Bar & Prep Sink',
      'Bar Faucet',
      'Bath Fan',
      'Bathroom Cabinet Hardware',
      'Bathroom Faucet',
      'Bathroom Hardware and Accessories',
      'Bathroom Lighting',
      'Bathroom Lighting (Bathroom)',
      'Bathroom Mirror',
      'Bathroom Sink',
      'Bathroom Vanity',
      'Bathtub',
      'Bathtub Waste & Overflow',
      'Bidet',
      'Bidet Faucet',
      'Bidet Seat',
      'Cabinet Hardware',
      'Flush and Semi-Flush',
      'Food Service Faucet',
      'Garbage Disposal',
      'Hot & Cold Water Dispenser',
      'Kitchen Accessory',
      'Kitchen Faucet',
      'Kitchen Furniture and Decor',
      'Kitchen Sink',
      'Kitchen Sink Combo',
      'Kitchen Storage & Organization',
      'Kitchen Tile',
      'Luxury Kitchen',
      'Medicine Cabinet',
      'Pipe Fitting',
      'Pot Filler Faucet',
      'Pressure Valve',
      'Rough-In Valve',
      'Shower',
      'Shower Accessory',
      'Shower Faucet',
      'Steam Shower',
      'Tankless Water Heater',
      'Toilet',
      'Toilet Seat',
      'Tub and Shower Accessory',
      'Tub Faucet',
      'Urinal',
      'Water Filtration'
    ]
  }
};

// Load our repository data
const picklistPath = path.join(__dirname, '../src/config/salesforce-picklists');
const repoDepts = JSON.parse(fs.readFileSync(path.join(picklistPath, 'departments.json'), 'utf8'));
const repoCats = JSON.parse(fs.readFileSync(path.join(picklistPath, 'categories.json'), 'utf8'));

// Extract unique department names from repo
const repoDeptNames = [...new Set(repoDepts.map(d => d.department_name || d.name).filter(Boolean))].sort();

// Group repo categories by department
const repoCatsByDept = {};
repoDeptNames.forEach(dept => {
  repoCatsByDept[dept] = repoCats
    .filter(c => (c.department || c.department_name) === dept)
    .map(c => c.category_name || c.name)
    .filter(Boolean)
    .sort();
});

// Count total SF categories
const sfTotalCategories = Object.values(SF_DATA.categories).reduce((sum, cats) => sum + cats.length, 0);

console.log('═══════════════════════════════════════════════════════════════');
console.log('     SALESFORCE vs REPOSITORY CATEGORY AUDIT');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('📊 SUMMARY:');
console.log(`   SF Departments: ${SF_DATA.departments.length}`);
console.log(`   Repo Departments: ${repoDeptNames.length}`);
console.log(`   SF Categories: ${sfTotalCategories}`);
console.log(`   Repo Categories: ${repoCats.length}`);

// 1. DEPARTMENT COMPARISON
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('1️⃣  DEPARTMENT COMPARISON');
console.log('═══════════════════════════════════════════════════════════════\n');

const sfDeptsSet = new Set(SF_DATA.departments);
const repoDeptsSet = new Set(repoDeptNames);

const newDepts = SF_DATA.departments.filter(d => !repoDeptsSet.has(d));
const missingDepts = repoDeptNames.filter(d => !sfDeptsSet.has(d));
const matchingDepts = SF_DATA.departments.filter(d => repoDeptsSet.has(d));

console.log(`✅ Matching: ${matchingDepts.length}`);
matchingDepts.forEach(d => console.log(`   • ${d}`));

if (newDepts.length > 0) {
  console.log(`\n🆕 NEW in Salesforce (missing in repo): ${newDepts.length}`);
  newDepts.forEach(d => console.log(`   • ${d}`));
}

if (missingDepts.length > 0) {
  console.log(`\n❌ MISSING in Salesforce (extra in repo): ${missingDepts.length}`);
  missingDepts.forEach(d => console.log(`   • ${d}`));
}

// 2. CATEGORY COMPARISON BY DEPARTMENT
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('2️⃣  CATEGORY COMPARISON BY DEPARTMENT');
console.log('═══════════════════════════════════════════════════════════════\n');

const allDepts = [...new Set([...SF_DATA.departments, ...repoDeptNames])].sort();

allDepts.forEach(dept => {
  const sfCats = new Set(SF_DATA.categories[dept] || []);
  const repoCats = new Set(repoCatsByDept[dept] || []);
  
  const newCats = [...sfCats].filter(c => !repoCats.has(c)).sort();
  const missingCats = [...repoCats].filter(c => !sfCats.has(c)).sort();
  const matchingCats = [...sfCats].filter(c => repoCats.has(c));
  
  console.log(`\n${dept}:`);
  console.log(`   SF: ${sfCats.size} | Repo: ${repoCats.size} | Match: ${matchingCats.length}`);
  
  if (newCats.length > 0) {
    console.log(`   🆕 NEW in SF (${newCats.length}):`);
    newCats.forEach(c => console.log(`      • ${c}`));
  }
  
  if (missingCats.length > 0) {
    console.log(`   ❌ MISSING in SF (${missingCats.length}):`);
    missingCats.forEach(c => console.log(`      • ${c}`));
  }
});

// 3. DUPLICATES & NAMING ISSUES
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('3️⃣  DUPLICATES & NAMING ISSUES');
console.log('═══════════════════════════════════════════════════════════════\n');

// Check for categories appearing in multiple SF departments
const sfCatCounts = {};
Object.entries(SF_DATA.categories).forEach(([dept, cats]) => {
  cats.forEach(cat => {
    if (!sfCatCounts[cat]) sfCatCounts[cat] = [];
    sfCatCounts[cat].push(dept);
  });
});

const sfDuplicates = Object.entries(sfCatCounts).filter(([cat, depts]) => depts.length > 1);
if (sfDuplicates.length > 0) {
  console.log('⚠️  SF CATEGORIES IN MULTIPLE DEPARTMENTS:');
  sfDuplicates.forEach(([cat, depts]) => {
    console.log(`   • "${cat}" appears in:`);
    depts.forEach(d => console.log(`      - ${d}`));
  });
}

// Check for similar names (case/spacing differences)
console.log('\n🔍 POTENTIAL NAMING DISCREPANCIES:');
const allSfCats = Object.values(SF_DATA.categories).flat();
const allRepoCats = repoCats.map(c => c.category_name || c.name).filter(Boolean);

const namingIssues = [];
allSfCats.forEach(sfCat => {
  const sfNormalized = sfCat.toLowerCase().trim();
  allRepoCats.forEach(repoCat => {
    const repoNormalized = repoCat.toLowerCase().trim();
    if (sfNormalized === repoNormalized && sfCat !== repoCat) {
      namingIssues.push({ sf: sfCat, repo: repoCat });
    }
  });
});

if (namingIssues.length > 0) {
  console.log('   Found case/spacing differences:');
  namingIssues.forEach(issue => {
    console.log(`   • SF: "${issue.sf}" vs Repo: "${issue.repo}"`);
  });
} else {
  console.log('   ✅ No case/spacing mismatches found');
}

// 4. SUMMARY & RECOMMENDATIONS
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('4️⃣  SUMMARY & ACTIONABLE ITEMS');
console.log('═══════════════════════════════════════════════════════════════\n');

const totalNew = Object.values(SF_DATA.categories).reduce((sum, cats) => {
  const repoCatsForDept = repoCatsByDept[Object.keys(SF_DATA.categories).find(k => SF_DATA.categories[k] === cats)] || [];
  return sum + cats.filter(c => !repoCatsForDept.includes(c)).length;
}, 0) + newDepts.length;

const totalMissing = repoCats.length - Object.values(SF_DATA.categories).reduce((sum, cats) => {
  const sfSet = new Set(cats);
  const dept = Object.keys(SF_DATA.categories).find(k => SF_DATA.categories[k] === cats);
  const repoForDept = repoCatsByDept[dept] || [];
  return sum + repoForDept.filter(c => sfSet.has(c)).length;
}, 0);

console.log(`🆕 Total NEW items in SF: ${totalNew}`);
console.log(`   • ${newDepts.length} new departments`);
console.log(`   • Categories to add (see detailed list above)`);

console.log(`\n❌ Total items in Repo NOT in SF: ${totalMissing + missingDepts.length}`);
console.log(`   • ${missingDepts.length} extra departments`);
console.log(`   • Categories that may be deprecated (see detailed list above)`);

console.log(`\n⚠️  Critical Issues:`);
if (sfDuplicates.length > 0) {
  console.log(`   • ${sfDuplicates.length} categories appear in multiple SF departments`);
}
if (namingIssues.length > 0) {
  console.log(`   • ${namingIssues.length} case/spacing mismatches between SF and repo`);
}

console.log('\n💡 NEXT STEPS:');
console.log('   1. Review NEW departments/categories - add to repo if valid');
console.log('   2. Review MISSING items - remove from repo if deprecated');
console.log('   3. Resolve duplicate department assignments in Salesforce');
console.log('   4. Fix any naming discrepancies (case/spacing)');
console.log('   5. Update category-type-mapping.json for new categories');
console.log('   6. Run pre-deployment validation after changes');

console.log('\n═══════════════════════════════════════════════════════════════\n');
