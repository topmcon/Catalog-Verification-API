/**
 * SCHEMA INDEX
 * =============
 * Central export point for all category schemas.
 * Individual schema files are kept for maintainability.
 */

// Re-export all schemas from their respective files
export * from './plumbing-schemas';
export * from './lighting-schemas';
export * from './additional-appliance-schemas';
export * from './home-decor-hvac-schemas';
export * from './complete-category-schemas';

// Import schema maps for combined export
import { PLUMBING_SCHEMAS } from './plumbing-schemas';
import { LIGHTING_SCHEMAS } from './lighting-schemas';
import { ADDITIONAL_APPLIANCE_SCHEMAS } from './additional-appliance-schemas';
import { HOME_DECOR_HVAC_SCHEMAS } from './home-decor-hvac-schemas';
import completeCategorySchemas from './complete-category-schemas';

/**
 * All additional schemas combined (excludes base schemas in category-attributes.ts)
 */
export const ALL_ADDITIONAL_SCHEMAS = {
  ...PLUMBING_SCHEMAS,
  ...LIGHTING_SCHEMAS,
  ...ADDITIONAL_APPLIANCE_SCHEMAS,
  ...HOME_DECOR_HVAC_SCHEMAS,
  // Complete category schemas (individual exports)
  'Bidets #': completeCategorySchemas.BIDET_SCHEMA,
  'Drains #': completeCategorySchemas.DRAIN_SCHEMA,
  'Drainage & Waste #': completeCategorySchemas.DRAINAGE_WASTE_SCHEMA,
  'Rough-In Valves #': completeCategorySchemas.ROUGH_IN_VALVE_SCHEMA,
  'Garbage Disposals #': completeCategorySchemas.GARBAGE_DISPOSAL_SCHEMA,
  'Water Heaters #': completeCategorySchemas.WATER_HEATER_SCHEMA,
  'Bathtub Waste & Overflow #': completeCategorySchemas.BATHTUB_WASTE_OVERFLOW_SCHEMA,
  'Cabinet Hardware #': completeCategorySchemas.CABINET_HARDWARE_SCHEMA,
  'Door Hardware Parts #': completeCategorySchemas.DOOR_HARDWARE_PARTS_SCHEMA,
  'Bathroom Lighting #': completeCategorySchemas.BATHROOM_LIGHTING_SCHEMA,
  'Kitchen Lighting #': completeCategorySchemas.KITCHEN_LIGHTING_SCHEMA,
  'Commercial Lighting #': completeCategorySchemas.COMMERCIAL_LIGHTING_SCHEMA,
  'Lamps #': completeCategorySchemas.LAMP_SCHEMA,
  'Track and Rail Lighting #': completeCategorySchemas.TRACK_RAIL_LIGHTING_SCHEMA,
  'Lighting Accessories #': completeCategorySchemas.LIGHTING_ACCESSORIES_SCHEMA,
  'Mirrors #': completeCategorySchemas.MIRROR_SCHEMA,
  'Bathroom Mirrors #': completeCategorySchemas.BATHROOM_MIRROR_SCHEMA,
  'Furniture #': completeCategorySchemas.FURNITURE_SCHEMA,
  'Kitchen Accessories #': completeCategorySchemas.KITCHEN_ACCESSORIES_SCHEMA,
  'Outdoor Fireplaces #': completeCategorySchemas.OUTDOOR_FIREPLACE_SCHEMA,
  'Hydronic Expansion Tanks #': completeCategorySchemas.HYDRONIC_EXPANSION_TANK_SCHEMA,
  'Compactor #': completeCategorySchemas.COMPACTOR_SCHEMA,
  'Hot Water Dispensers #': completeCategorySchemas.HOT_WATER_DISPENSER_SCHEMA,
  'Water Filters #': completeCategorySchemas.WATER_FILTER_SCHEMA,
};
