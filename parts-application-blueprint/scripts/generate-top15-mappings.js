#!/usr/bin/env node
/**
 * Generate Top 15 Filter Attribute Mappings for 100+ Categories
 * Phase 5 of Parts Application Blueprint Expansion
 */

const fs = require('fs');
const path = require('path');

// Load current picklists
const picklists = path.join(__dirname, '..', 'picklists');
console.log('Loading picklists from:', picklists);
const categories = JSON.parse(fs.readFileSync(path.join(picklists, 'categories.json'), 'utf8'));
const attributes = JSON.parse(fs.readFileSync(path.join(picklists, 'attributes.json'), 'utf8'));
const currentMappings = JSON.parse(fs.readFileSync(path.join(picklists, 'category-filter-attributes.json'), 'utf8'));
console.log(`Loaded: ${categories.length} categories, ${attributes.length} attributes, ${currentMappings.length} current mappings`);

// Common attributes for all parts
const commonAttrs = [
  'ATTR_001', // Compatible Brand
  'ATTR_002', // Compatible Model
  'ATTR_003', // Part Number
  'ATTR_031', // OEM or Aftermarket
  'ATTR_029', // Warranty Period
  'ATTR_030', // Condition
  'ATTR_033', // Replaces Part Numbers
];

// Category-specific Top 15 mappings
const categoryMappings = {
  // Refrigeration - Compressor, Evaporator, Condenser, Ice Maker, etc.
  'PARTS_CAT_002': ['ATTR_042', 'ATTR_040', 'ATTR_041', 'ATTR_007', 'ATTR_008', 'ATTR_271', 'ATTR_025', 'ATTR_024'],
  'PARTS_CAT_003': ['ATTR_042', 'ATTR_040', 'ATTR_041', 'ATTR_007', 'ATTR_017', 'ATTR_018', 'ATTR_014', 'ATTR_025'],
  'PARTS_CAT_004': ['ATTR_271', 'ATTR_007', 'ATTR_017', 'ATTR_018', 'ATTR_014', 'ATTR_025', 'ATTR_024', 'ATTR_027'],
  'PARTS_CAT_005': ['ATTR_273', 'ATTR_275', 'ATTR_276', 'ATTR_007', 'ATTR_274', 'ATTR_277', 'ATTR_278', 'ATTR_025'],
  
  // Laundry - Motors, Belts, Pumps, Control Boards
  'PARTS_CAT_011': ['ATTR_044', 'ATTR_010', 'ATTR_011', 'ATTR_007', 'ATTR_008', 'ATTR_013', 'ATTR_046', 'ATTR_047'],
  'PARTS_CAT_012': ['ATTR_163', 'ATTR_164', 'ATTR_165', 'ATTR_166', 'ATTR_167', 'ATTR_014', 'ATTR_027', 'ATTR_032'],
  'PARTS_CAT_013': ['ATTR_094', 'ATTR_007', 'ATTR_095', 'ATTR_096', 'ATTR_097', 'ATTR_091', 'ATTR_008', 'ATTR_025'],
  'PARTS_CAT_014': ['ATTR_104', 'ATTR_007', 'ATTR_105', 'ATTR_106', 'ATTR_017', 'ATTR_018', 'ATTR_027', 'ATTR_028'],
  
  // Cooking - Bake Elements, Control Panels, Igniters, Gas Valves
  'PARTS_CAT_018': ['ATTR_050', 'ATTR_009', 'ATTR_007', 'ATTR_051', 'ATTR_053', 'ATTR_052', 'ATTR_017', 'ATTR_014'],
  'PARTS_CAT_019': ['ATTR_007', 'ATTR_017', 'ATTR_018', 'ATTR_014', 'ATTR_015', 'ATTR_027', 'ATTR_028', 'ATTR_032'],
  'PARTS_CAT_020': ['ATTR_007', 'ATTR_014', 'ATTR_017', 'ATTR_018', 'ATTR_027', 'ATTR_028', 'ATTR_032', 'ATTR_050'],
  'PARTS_CAT_021': ['ATTR_007', 'ATTR_009', 'ATTR_289', 'ATTR_290', 'ATTR_024', 'ATTR_025', 'ATTR_027', 'ATTR_028'],
  
  // HVAC - Filters, Thermostats, Blower Motors
  'PARTS_CAT_058': ['ATTR_189', 'ATTR_190', 'ATTR_188', 'ATTR_191', 'ATTR_192', 'ATTR_017', 'ATTR_018', 'ATTR_020'],
  'PARTS_CAT_059': ['ATTR_007', 'ATTR_244', 'ATTR_256', 'ATTR_225', 'ATTR_226', 'ATTR_254', 'ATTR_027', 'ATTR_028'],
  'PARTS_CAT_060': ['ATTR_044', 'ATTR_010', 'ATTR_011', 'ATTR_007', 'ATTR_008', 'ATTR_247', 'ATTR_046', 'ATTR_047'],
  
  // Small Appliance - Kitchen (Blender Blades, Coffee Filters, Mixer Attachments)
  'PARTS_CAT_091': ['ATTR_204', 'ATTR_205', 'ATTR_206', 'ATTR_193', 'ATTR_207', 'ATTR_208', 'ATTR_209', 'ATTR_014'],
  'PARTS_CAT_092': ['ATTR_188', 'ATTR_191', 'ATTR_199', 'ATTR_195', 'ATTR_198', 'ATTR_014', 'ATTR_266', 'ATTR_032'],
  'PARTS_CAT_093': ['ATTR_210', 'ATTR_211', 'ATTR_212', 'ATTR_213', 'ATTR_194', 'ATTR_207', 'ATTR_014', 'ATTR_027'],
  
  // Small Appliance - Home Environment (Vacuum Bags, Air Purifier Filters)
  'PARTS_CAT_116': ['ATTR_216', 'ATTR_217', 'ATTR_215', 'ATTR_218', 'ATTR_219', 'ATTR_220', 'ATTR_014', 'ATTR_032'],
  'PARTS_CAT_117': ['ATTR_189', 'ATTR_190', 'ATTR_188', 'ATTR_191', 'ATTR_230', 'ATTR_231', 'ATTR_234', 'ATTR_235'],
  
  // Lawn & Garden - Mower Blades, Belts, Air Filters, Spark Plugs
  'PARTS_CAT_135': ['ATTR_151', 'ATTR_152', 'ATTR_153', 'ATTR_154', 'ATTR_155', 'ATTR_205', 'ATTR_206', 'ATTR_014'],
  'PARTS_CAT_136': ['ATTR_163', 'ATTR_164', 'ATTR_165', 'ATTR_166', 'ATTR_167', 'ATTR_014', 'ATTR_027', 'ATTR_032'],
  'PARTS_CAT_137': ['ATTR_162', 'ATTR_188', 'ATTR_191', 'ATTR_017', 'ATTR_018', 'ATTR_014', 'ATTR_156', 'ATTR_027'],
  'PARTS_CAT_138': ['ATTR_161', 'ATTR_156', 'ATTR_157', 'ATTR_158', 'ATTR_160', 'ATTR_014', 'ATTR_027', 'ATTR_032'],
  
  // Lawn & Garden - Chainsaw Chains, Pressure Washer Nozzles
  'PARTS_CAT_153': ['ATTR_176', 'ATTR_177', 'ATTR_178', 'ATTR_179', 'ATTR_151', 'ATTR_205', 'ATTR_014', 'ATTR_027'],
  'PARTS_CAT_154': ['ATTR_182', 'ATTR_180', 'ATTR_181', 'ATTR_183', 'ATTR_184', 'ATTR_185', 'ATTR_014', 'ATTR_024'],
  
  // Commercial - Ice Machines, Fryers, Dishwasher Racks
  'PARTS_CAT_159': ['ATTR_273', 'ATTR_275', 'ATTR_276', 'ATTR_277', 'ATTR_274', 'ATTR_278', 'ATTR_007', 'ATTR_267'],
  'PARTS_CAT_160': ['ATTR_292', 'ATTR_293', 'ATTR_289', 'ATTR_294', 'ATTR_007', 'ATTR_267', 'ATTR_268', 'ATTR_270'],
  'PARTS_CAT_161': ['ATTR_295', 'ATTR_287', 'ATTR_288', 'ATTR_284', 'ATTR_014', 'ATTR_267', 'ATTR_017', 'ATTR_018'],
};

// Generate mappings
let mappings = [...currentMappings]; // Start with existing 9 categories
let newMappingsCount = 0;

// Get attribute names map
const attrMap = {};
attributes.forEach(attr => {
  attrMap[attr.attribute_id] = attr.attribute_name;
});

// Get category names map
const catMap = {};
categories.forEach(cat => {
  catMap[cat.category_id] = cat.category_name;
});

// Process each category mapping
Object.entries(categoryMappings).forEach(([catId, specificAttrs]) => {
  // Skip if already mapped
  if (currentMappings.some(m => m.category_id === catId)) {
    console.log(`Skipping ${catId} - already mapped`);
    return;
  }
  
  const catName = catMap[catId];
  if (!catName) {
    console.warn(`Warning: Category ${catId} not found in categories.json`);
    return;
  }
  
  // Combine common + specific attributes (limit to 15)
  const allAttrs = [
    ...commonAttrs.slice(0, 2), // Brand, Model first
    ...specificAttrs.slice(0, 8), // Category-specific (8)
    ...commonAttrs.slice(2, 7), // Part Number, OEM, Warranty, Condition, Replaces (5)
  ].slice(0, 15);
  
  // Create 15 mapping entries for this category
  allAttrs.forEach((attrId, index) => {
    const attrName = attrMap[attrId];
    if (!attrName) {
      console.warn(`Warning: Attribute ${attrId} not found`);
      return;
    }
    
    mappings.push({
      category_id: catId,
      category_name: catName,
      attribute_id: attrId,
      attribute_name: attrName,
      rank: String(index + 1)
    });
    newMappingsCount++;
  });
  
  console.log(`✅ Added ${catName} (${catId})`);
});

// Add more general categories (fill up to 100+)
const additionalCategories = [
  // More Refrigeration (30 total)
  'PARTS_CAT_006', 'PARTS_CAT_007', 'PARTS_CAT_008', 'PARTS_CAT_009',
  'PARTS_CAT_015', 'PARTS_CAT_016', 'PARTS_CAT_022', 'PARTS_CAT_023',
  'PARTS_CAT_024', 'PARTS_CAT_025', 'PARTS_CAT_026', 'PARTS_CAT_027',
  'PARTS_CAT_028', 'PARTS_CAT_029', 'PARTS_CAT_030', 'PARTS_CAT_031',
  'PARTS_CAT_032', 'PARTS_CAT_033', 'PARTS_CAT_034', 'PARTS_CAT_035',
  'PARTS_CAT_036', 'PARTS_CAT_037', 'PARTS_CAT_038', 'PARTS_CAT_039',
  
  // More Laundry (25 total)
  'PARTS_CAT_061', 'PARTS_CAT_063', 'PARTS_CAT_064', 'PARTS_CAT_065',
  'PARTS_CAT_066', 'PARTS_CAT_068', 'PARTS_CAT_069', 'PARTS_CAT_071',
  'PARTS_CAT_072', 'PARTS_CAT_073', 'PARTS_CAT_074', 'PARTS_CAT_075',
  'PARTS_CAT_076', 'PARTS_CAT_077', 'PARTS_CAT_078', 'PARTS_CAT_079',
  'PARTS_CAT_080', 'PARTS_CAT_081', 'PARTS_CAT_082', 'PARTS_CAT_083',
  'PARTS_CAT_084',
  
  // More Cooking (20 total)
  'PARTS_CAT_094', 'PARTS_CAT_095', 'PARTS_CAT_096', 'PARTS_CAT_097',
  'PARTS_CAT_098', 'PARTS_CAT_099', 'PARTS_CAT_100', 'PARTS_CAT_101',
  'PARTS_CAT_102', 'PARTS_CAT_103', 'PARTS_CAT_104', 'PARTS_CAT_105',
  'PARTS_CAT_106', 'PARTS_CAT_107', 'PARTS_CAT_108', 'PARTS_CAT_109',
  
  // HVAC (15 total)
  'PARTS_CAT_111', 'PARTS_CAT_112', 'PARTS_CAT_113', 'PARTS_CAT_114',
  'PARTS_CAT_115', 'PARTS_CAT_118', 'PARTS_CAT_119', 'PARTS_CAT_120',
  'PARTS_CAT_121', 'PARTS_CAT_122', 'PARTS_CAT_123', 'PARTS_CAT_124',
  
  // Small Appliance - Kitchen (18 total)
  'PARTS_CAT_139', 'PARTS_CAT_140', 'PARTS_CAT_141', 'PARTS_CAT_142',
  'PARTS_CAT_143', 'PARTS_CAT_144', 'PARTS_CAT_145', 'PARTS_CAT_146',
  'PARTS_CAT_147', 'PARTS_CAT_148', 'PARTS_CAT_149', 'PARTS_CAT_150',
  'PARTS_CAT_151', 'PARTS_CAT_152', 'PARTS_CAT_156', 'PARTS_CAT_157',
  
  // Small Appliance - Home Environment (12 total)
  'PARTS_CAT_162', 'PARTS_CAT_163', 'PARTS_CAT_164', 'PARTS_CAT_165',
  'PARTS_CAT_166', 'PARTS_CAT_167', 'PARTS_CAT_168', 'PARTS_CAT_169',
  'PARTS_CAT_170', 'PARTS_CAT_171', 'PARTS_CAT_172', 'PARTS_CAT_173',
  
  // Lawn & Garden - Mowers (15 total)
  'PARTS_CAT_174', 'PARTS_CAT_175', 'PARTS_CAT_176', 'PARTS_CAT_177',
  'PARTS_CAT_178', 'PARTS_CAT_179', 'PARTS_CAT_180', 'PARTS_CAT_181',
  'PARTS_CAT_182', 'PARTS_CAT_183', 'PARTS_CAT_184', 'PARTS_CAT_185',
  'PARTS_CAT_186', 'PARTS_CAT_187', 'PARTS_CAT_188',
  
  // Lawn & Garden - Outdoor Power (15 total)
  'PARTS_CAT_189', 'PARTS_CAT_190', 'PARTS_CAT_191', 'PARTS_CAT_192',
  'PARTS_CAT_193', 'PARTS_CAT_194', 'PARTS_CAT_195', 'PARTS_CAT_196',
  'PARTS_CAT_197', 'PARTS_CAT_198', 'PARTS_CAT_199', 'PARTS_CAT_200',
  'PARTS_CAT_201', 'PARTS_CAT_202', 'PARTS_CAT_203',
  
  // Commercial (12 total)
  'PARTS_CAT_204', 'PARTS_CAT_205', 'PARTS_CAT_206', 'PARTS_CAT_207',
  'PARTS_CAT_208', 'PARTS_CAT_209', 'PARTS_CAT_210', 'PARTS_CAT_211',
  'PARTS_CAT_212', 'PARTS_CAT_213', 'PARTS_CAT_214', 'PARTS_CAT_215',
];

// Add generic mappings for additional categories
additionalCategories.forEach(catId => {
  // Skip if already mapped
  if (mappings.some(m => m.category_id === catId)) {
    return;
  }
  
  const catName = catMap[catId];
  if (!catName) {
    return;
  }
  
  // Use common attributes + some generic ones
  const genericAttrs = [
    'ATTR_001', 'ATTR_002', // Brand, Model
    'ATTR_007', 'ATTR_008', 'ATTR_009', // Voltage, Amperage, Wattage
    'ATTR_017', 'ATTR_018', 'ATTR_019', // Length, Width, Height
    'ATTR_014', 'ATTR_015', // Material, Color
    'ATTR_003', 'ATTR_031', 'ATTR_029', 'ATTR_030', 'ATTR_033' // Part#, OEM, Warranty, Condition, Replaces
  ].slice(0, 15);
  
  genericAttrs.forEach((attrId, index) => {
    const attrName = attrMap[attrId];
    if (!attrName) return;
    
    mappings.push({
      category_id: catId,
      category_name: catName,
      attribute_id: attrId,
      attribute_name: attrName,
      rank: String(index + 1)
    });
    newMappingsCount++;
  });
  
  console.log(`✅ Added ${catName} (${catId}) - generic mapping`);
});

// Save expanded mappings
fs.writeFileSync(
  path.join(picklists, 'category-filter-attributes.json'),
  JSON.stringify(mappings, null, 2)
);

const totalCategories = new Set(mappings.map(m => m.category_id)).size;
console.log('\n=== PHASE 5 EXPANSION COMPLETE ===');
console.log(`Total Category Mappings: ${totalCategories}`);
console.log(`Total Attribute Assignments: ${mappings.length}`);
console.log(`New Mappings Added: ${newMappingsCount}`);
console.log(`File: category-filter-attributes.json`);
