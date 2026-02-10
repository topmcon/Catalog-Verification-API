#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load existing types from types.json
const typesPath = path.join(__dirname, '../src/config/salesforce-picklists/types.json');
const existingTypes = JSON.parse(fs.readFileSync(typesPath, 'utf8'));

// Create a lookup map (case-insensitive)
const typeMap = new Map();
existingTypes.forEach(type => {
  typeMap.set(type.type_name.toLowerCase().trim(), type.type_id);
});

// Types mentioned in master plan that need checking
const typesToCheck = [
  // Kitchen Faucet
  'Pull-Down', 'Pull-Out', 'Commercial / Pre-Rinse', 'Single Handle', 'Double Handle',
  'Wall Mount', 'Deck Mount', 'Bridge', 'Touchless / Motion Sensor',
  
  // Bathroom Faucet
  'Centerset (4")', 'Widespread (8")', 'Single Hole', 'Vessel Sink', 'Waterfall',
  
  // Tub Faucet
  'Freestanding', 'Roman Tub (3-Hole or 4-Hole)', 'Tub Filler with Hand Shower', 'Floor Mount',
  
  // Shower Faucet
  'Thermostatic', 'Pressure Balance', 'Dual Function (Shower + Hand Shower)',
  'Multi-Function (3+ outlets)', 'Rain Shower', 'Handheld Only', 'Body Spray System',
  
  // Bar Faucet
  'Dual Handle',
  
  // Bidet Faucet
  // (Deck Mount, Wall Mount, Single Handle, Dual Handle already listed)
  
  // Pot Filler
  'Articulating Arm',
  
  // Food Service Faucet
  'Pre-Rinse', 'Swing Spout',
  
  // Outdoor Shower
  // (Freestanding, Handheld already listed)
  
  // Bathtub
  'Alcove', 'Drop-In', 'Undermount', 'Clawfoot', 'Japanese Soaking', 'Whirlpool / Jetted',
  'Air Bath', 'Walk-In',
  
  // Bathroom Sink
  'Drop-In / Self-Rimming', 'Semi-Recessed', 'Console', 'Integrated Vanity Top',
  
  // Kitchen Sink
  'Top Mount / Drop-In', 'Farmhouse / Apron Front', 'Single Bowl', 'Double Bowl',
  'Triple Bowl', 'Workstation Sink',
  
  // Toilet
  'Two-Piece', 'One-Piece', 'Wall-Hung', 'Smart / Bidet Toilet', 'Elongated Bowl',
  'Round Bowl', 'Comfort Height / ADA',
  
  // Shower
  'Shower Stall Kit',
  
  // Ceiling Fan
  'Indoor', 'Outdoor', 'Hugger (Low Profile)', 'DC Motor', 'Dual Motor',
  
  // Water Heater
  'Tankless', 'Whole House', 'Point of Use', 'Electric', 'Gas', 'Condensing',
  'Non-Condensing'
];

console.log('TYPE MAPPING RESULTS\n');
console.log('='.repeat(100));
console.log('\n');

const results = {
  found: [],
  notFound: [],
  partialMatch: []
};

typesToCheck.forEach(typeName => {
  const lowerName = typeName.toLowerCase().trim();
  
  // Exact match
  if (typeMap.has(lowerName)) {
    results.found.push({ name: typeName, id: typeMap.get(lowerName), match: 'exact' });
    return;
  }
  
  // Try without parentheses/special chars
  const simplifiedName = lowerName.replace(/\s*\([^)]*\)/g, '').replace(/\s*\/\s*/g, ' ').trim();
  if (typeMap.has(simplifiedName)) {
    results.found.push({ name: typeName, id: typeMap.get(simplifiedName), match: 'simplified', existingName: simplifiedName });
    return;
  }
  
  // Try partial matches (first word, main keyword)
  let found = false;
  for (const [existingType, id] of typeMap.entries()) {
    if (existingType.includes(simplifiedName) || simplifiedName.includes(existingType)) {
      results.partialMatch.push({ name: typeName, id, existingName: existingType });
      found = true;
      break;
    }
  }
  
  if (!found) {
    results.notFound.push(typeName);
  }
});

console.log('✅ TYPES FOUND IN types.json (Use these IDs):\n');
results.found.forEach(item => {
  console.log(`  ${item.name.padEnd(40)} → ${item.id}  ${item.match === 'simplified' ? `(as "${item.existingName}")` : ''}`);
});

console.log('\n\n⚠️  PARTIAL MATCHES (Review carefully):\n');
results.partialMatch.forEach(item => {
  console.log(`  ${item.name.padEnd(40)} → ${item.id} (exists as "${item.existingName}")`);
});

console.log('\n\n❌ NEW TYPES NEEDED (not in types.json):\n');
results.notFound.forEach(typeName => {
  console.log(`  ${typeName}`);
});

console.log('\n\n' + '='.repeat(100));
console.log(`SUMMARY: ${results.found.length} found, ${results.partialMatch.length} partial, ${results.notFound.length} new needed`);
console.log('='.repeat(100));
