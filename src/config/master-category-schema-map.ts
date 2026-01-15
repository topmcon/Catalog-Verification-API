/**
 * MASTER CATEGORY SCHEMA MAP
 * 
 * This is the single source of truth for ALL category-to-schema mappings.
 * Contains:
 * - All category schemas from various departments
 * - All category name aliases and variations
 * - Helper functions for schema lookup
 * 
 * IMPORTANT: When adding a new category, add ALL possible name variations here
 */

import { CategoryAttributeConfig } from './category-attributes';

// Import all schemas from main category-attributes
import {
  REFRIGERATOR_SCHEMA,
  DISHWASHER_SCHEMA,
  RANGE_SCHEMA,
  OVEN_SCHEMA,
  COOKTOP_SCHEMA,
  MICROWAVE_SCHEMA,
  RANGE_HOOD_SCHEMA,
  WASHER_SCHEMA,
  DRYER_SCHEMA,
  FREEZER_SCHEMA,
  KITCHEN_SINK_SCHEMA,
  KITCHEN_FAUCET_SCHEMA,
  BATHROOM_FAUCET_SCHEMA,
  TOILET_SCHEMA,
  BATHTUB_SCHEMA,
  CHANDELIER_SCHEMA,
  PENDANT_SCHEMA,
  CEILING_FAN_SCHEMA,
} from './category-attributes';

// Import from separate schema files
import {
  BATHROOM_SINK_SCHEMA,
  BATHROOM_VANITY_SCHEMA,
  SHOWER_SCHEMA,
  TUB_FAUCET_SCHEMA,
  BAR_PREP_SINK_SCHEMA,
  BAR_FAUCET_SCHEMA,
  BATHROOM_HARDWARE_SCHEMA,
} from './schemas/plumbing-schemas';

import {
  CEILING_LIGHT_SCHEMA,
  WALL_SCONCE_SCHEMA,
  OUTDOOR_LIGHTING_SCHEMA,
  RECESSED_LIGHTING_SCHEMA,
  CEILING_FAN_WITH_LIGHT_SCHEMA,
} from './schemas/lighting-schemas';

import {
  ALL_IN_ONE_WASHER_DRYER_SCHEMA,
  WINE_COOLER_SCHEMA,
  ICE_MAKER_SCHEMA,
  PIZZA_OVEN_SCHEMA,
  COFFEE_MAKER_SCHEMA,
  BEVERAGE_CENTER_SCHEMA,
  WARMING_DRAWER_SCHEMA,
  OUTDOOR_GRILL_SCHEMA,
} from './schemas/additional-appliance-schemas';

import {
  BIDET_SCHEMA,
  DRAIN_SCHEMA,
  DRAINAGE_WASTE_SCHEMA,
  ROUGH_IN_VALVE_SCHEMA,
  GARBAGE_DISPOSAL_SCHEMA,
  WATER_HEATER_SCHEMA,
  BATHTUB_WASTE_OVERFLOW_SCHEMA,
  CABINET_HARDWARE_SCHEMA,
  DOOR_HARDWARE_PARTS_SCHEMA,
  BATHROOM_LIGHTING_SCHEMA,
  KITCHEN_LIGHTING_SCHEMA,
  COMMERCIAL_LIGHTING_SCHEMA,
  LAMP_SCHEMA,
  TRACK_RAIL_LIGHTING_SCHEMA,
  LIGHTING_ACCESSORIES_SCHEMA,
  MIRROR_SCHEMA,
  BATHROOM_MIRROR_SCHEMA,
  FURNITURE_SCHEMA,
  KITCHEN_ACCESSORIES_SCHEMA,
  OUTDOOR_FIREPLACE_SCHEMA,
  HYDRONIC_EXPANSION_TANK_SCHEMA,
  COMPACTOR_SCHEMA,
  HOT_WATER_DISPENSER_SCHEMA,
  WATER_FILTER_SCHEMA,
} from './schemas/complete-category-schemas';

import {
  STORAGE_DRAWERS_SCHEMA,
  CABINET_ORGANIZATION_SCHEMA,
  AIR_CONDITIONER_SCHEMA,
  RANGE_HOOD_LINER_SCHEMA,
  DRAWER_SCHEMA,
  PEDESTAL_SCHEMA,
} from './schemas/home-decor-hvac-schemas';

import logger from '../utils/logger';

/**
 * MASTER CATEGORY SCHEMA MAP
 * 
 * This map contains ALL category schemas with ALL possible name variations.
 * The response builder uses this map to find the correct schema for any category.
 * 
 * Naming conventions:
 * - Exact category names (e.g., "Refrigerator", "Kitchen Faucets")
 * - With # suffix (e.g., "Kitchen Faucets #")
 * - Uppercase variations (e.g., "REFRIGERATORS", "KITCHEN FAUCETS")
 * - Common aliases (e.g., "GAS RANGES" -> RANGE_SCHEMA)
 */
export const MASTER_CATEGORY_SCHEMA_MAP: Record<string, CategoryAttributeConfig> = {
  // ============================================
  // APPLIANCES - COOKING
  // ============================================
  
  // Range
  'Range': RANGE_SCHEMA,
  'Ranges': RANGE_SCHEMA,
  'RANGES': RANGE_SCHEMA,
  'Gas Range': RANGE_SCHEMA,
  'GAS RANGES': RANGE_SCHEMA,
  'Gas Ranges': RANGE_SCHEMA,
  'Electric Range': RANGE_SCHEMA,
  'ELECTRIC RANGES': RANGE_SCHEMA,
  'Electric Ranges': RANGE_SCHEMA,
  'Dual Fuel Range': RANGE_SCHEMA,
  'DUAL FUEL RANGES': RANGE_SCHEMA,
  'Dual Fuel Ranges': RANGE_SCHEMA,
  'Slide In Gas Range': RANGE_SCHEMA,
  'SLIDE IN GAS RANGE': RANGE_SCHEMA,
  'Slide In Electric Range': RANGE_SCHEMA,
  'SLIDE IN ELECTRIC RANGE': RANGE_SCHEMA,
  'Induction Range': RANGE_SCHEMA,
  'INDUCTION RANGES': RANGE_SCHEMA,
  'Freestanding Range': RANGE_SCHEMA,
  'FREESTANDING RANGES': RANGE_SCHEMA,
  
  // Oven / Wall Oven
  'Oven': OVEN_SCHEMA,
  'Ovens': OVEN_SCHEMA,
  'OVENS': OVEN_SCHEMA,
  'Wall Oven': OVEN_SCHEMA,
  'Wall Ovens': OVEN_SCHEMA,
  'WALL OVENS': OVEN_SCHEMA,
  'Single Wall Oven': OVEN_SCHEMA,
  'SINGLE WALL OVENS': OVEN_SCHEMA,
  'Double Wall Oven': OVEN_SCHEMA,
  'DOUBLE WALL OVENS': OVEN_SCHEMA,
  'Combination Wall Oven': OVEN_SCHEMA,
  
  // Cooktop
  'Cooktop': COOKTOP_SCHEMA,
  'Cooktops': COOKTOP_SCHEMA,
  'COOKTOPS': COOKTOP_SCHEMA,
  'Gas Cooktop': COOKTOP_SCHEMA,
  'GAS COOKTOPS': COOKTOP_SCHEMA,
  'Electric Cooktop': COOKTOP_SCHEMA,
  'ELECTRIC COOKTOPS': COOKTOP_SCHEMA,
  'Induction Cooktop': COOKTOP_SCHEMA,
  'INDUCTION COOKTOPS': COOKTOP_SCHEMA,
  
  // Microwave
  'Microwave': MICROWAVE_SCHEMA,
  'Microwaves': MICROWAVE_SCHEMA,
  'MICROWAVES': MICROWAVE_SCHEMA,
  'Microwave Oven': MICROWAVE_SCHEMA,
  'Over-the-Range Microwave': MICROWAVE_SCHEMA,
  'OTR MICROWAVES': MICROWAVE_SCHEMA,
  'Built-In Microwave': MICROWAVE_SCHEMA,
  'Countertop Microwave': MICROWAVE_SCHEMA,
  'Microwave Drawer': MICROWAVE_SCHEMA,
  
  // Range Hood
  'Range Hood': RANGE_HOOD_SCHEMA,
  'Range Hoods': RANGE_HOOD_SCHEMA,
  'RANGE HOODS': RANGE_HOOD_SCHEMA,
  'Hood': RANGE_HOOD_SCHEMA,
  'Hoods': RANGE_HOOD_SCHEMA,
  'Ventilation Hood': RANGE_HOOD_SCHEMA,
  'Kitchen Hood': RANGE_HOOD_SCHEMA,
  'Wall Mount Range Hood': RANGE_HOOD_SCHEMA,
  'Island Range Hood': RANGE_HOOD_SCHEMA,
  'Under Cabinet Range Hood': RANGE_HOOD_SCHEMA,
  
  // Range Hood Insert/Liner
  'Range Hood Insert/Liner': RANGE_HOOD_LINER_SCHEMA,
  'Range Hood Insert': RANGE_HOOD_LINER_SCHEMA,
  'Range Hood Liner': RANGE_HOOD_LINER_SCHEMA,
  'Hood Insert': RANGE_HOOD_LINER_SCHEMA,
  'Hood Liner': RANGE_HOOD_LINER_SCHEMA,
  
  // ============================================
  // APPLIANCES - REFRIGERATION
  // ============================================
  
  // Refrigerator
  'Refrigerator': REFRIGERATOR_SCHEMA,
  'Refrigerators': REFRIGERATOR_SCHEMA,
  'REFRIGERATORS': REFRIGERATOR_SCHEMA,
  'French Door Refrigerator': REFRIGERATOR_SCHEMA,
  'FRENCH DOOR REFRIGERATORS': REFRIGERATOR_SCHEMA,
  'Side by Side Refrigerator': REFRIGERATOR_SCHEMA,
  'SIDE BY SIDE REFRIGERATORS': REFRIGERATOR_SCHEMA,
  'Top Freezer Refrigerator': REFRIGERATOR_SCHEMA,
  'TOP FREEZER REFRIGERATORS': REFRIGERATOR_SCHEMA,
  'Bottom Freezer Refrigerator': REFRIGERATOR_SCHEMA,
  'BOTTOM FREEZER REFRIGERATORS': REFRIGERATOR_SCHEMA,
  'Built-In Refrigerator': REFRIGERATOR_SCHEMA,
  'Counter-Depth Refrigerator': REFRIGERATOR_SCHEMA,
  'Column Refrigerator': REFRIGERATOR_SCHEMA,
  
  // Freezer
  'Freezer': FREEZER_SCHEMA,
  'Freezers': FREEZER_SCHEMA,
  'FREEZERS': FREEZER_SCHEMA,
  'Upright Freezer': FREEZER_SCHEMA,
  'UPRIGHT FREEZERS': FREEZER_SCHEMA,
  'Chest Freezer': FREEZER_SCHEMA,
  'CHEST FREEZERS': FREEZER_SCHEMA,
  'Column Freezer': FREEZER_SCHEMA,
  
  // Wine Cooler
  'Wine Cooler': WINE_COOLER_SCHEMA,
  'Wine Coolers': WINE_COOLER_SCHEMA,
  'WINE COOLERS': WINE_COOLER_SCHEMA,
  'Wine Refrigerator': WINE_COOLER_SCHEMA,
  'Wine Storage': WINE_COOLER_SCHEMA,
  'Wine Cellar': WINE_COOLER_SCHEMA,
  
  // Ice Maker
  'Icemaker': ICE_MAKER_SCHEMA,
  'Icemakers': ICE_MAKER_SCHEMA,
  'ICEMAKERS': ICE_MAKER_SCHEMA,
  'Ice Maker': ICE_MAKER_SCHEMA,
  'Ice Makers': ICE_MAKER_SCHEMA,
  'ICE MAKERS': ICE_MAKER_SCHEMA,
  
  // Beverage Center
  'Beverage Center': BEVERAGE_CENTER_SCHEMA,
  'Beverage Centers': BEVERAGE_CENTER_SCHEMA,
  'BEVERAGE CENTERS': BEVERAGE_CENTER_SCHEMA,
  'Beverage Cooler': BEVERAGE_CENTER_SCHEMA,
  'Beverage Refrigerator': BEVERAGE_CENTER_SCHEMA,
  
  // ============================================
  // APPLIANCES - DISHWASHING
  // ============================================
  
  'Dishwasher': DISHWASHER_SCHEMA,
  'Dishwashers': DISHWASHER_SCHEMA,
  'DISHWASHERS': DISHWASHER_SCHEMA,
  'Built-In Dishwasher': DISHWASHER_SCHEMA,
  'Drawer Dishwasher': DISHWASHER_SCHEMA,
  'Portable Dishwasher': DISHWASHER_SCHEMA,
  
  // ============================================
  // APPLIANCES - LAUNDRY
  // ============================================
  
  // Washer
  'Washer': WASHER_SCHEMA,
  'Washers': WASHER_SCHEMA,
  'WASHERS': WASHER_SCHEMA,
  'Washing Machine': WASHER_SCHEMA,
  'Front Load Washer': WASHER_SCHEMA,
  'FRONT LOAD WASHERS': WASHER_SCHEMA,
  'Top Load Washer': WASHER_SCHEMA,
  'TOP LOAD WASHERS': WASHER_SCHEMA,
  
  // Dryer
  'Dryer': DRYER_SCHEMA,
  'Dryers': DRYER_SCHEMA,
  'DRYERS': DRYER_SCHEMA,
  'Gas Dryer': DRYER_SCHEMA,
  'GAS DRYERS': DRYER_SCHEMA,
  'Electric Dryer': DRYER_SCHEMA,
  'ELECTRIC DRYERS': DRYER_SCHEMA,
  
  // Combo
  'All in One Washer / Dryer': ALL_IN_ONE_WASHER_DRYER_SCHEMA,
  'Washer Dryer Combo': ALL_IN_ONE_WASHER_DRYER_SCHEMA,
  'WASHER DRYER COMBO': ALL_IN_ONE_WASHER_DRYER_SCHEMA,
  'Laundry Center': ALL_IN_ONE_WASHER_DRYER_SCHEMA,
  
  // Pedestal
  'Standalone Pedestal': PEDESTAL_SCHEMA,
  'Pedestal': PEDESTAL_SCHEMA,
  'Pedestals': PEDESTAL_SCHEMA,
  'Laundry Pedestal': PEDESTAL_SCHEMA,
  
  // ============================================
  // APPLIANCES - SPECIALTY
  // ============================================
  
  // Pizza Oven
  'Pizza Oven': PIZZA_OVEN_SCHEMA,
  'Pizza Ovens': PIZZA_OVEN_SCHEMA,
  'PIZZA OVENS': PIZZA_OVEN_SCHEMA,
  
  // Coffee Maker
  'Coffee Maker': COFFEE_MAKER_SCHEMA,
  'Coffee Makers': COFFEE_MAKER_SCHEMA,
  'COFFEE MAKERS': COFFEE_MAKER_SCHEMA,
  'Espresso Machine': COFFEE_MAKER_SCHEMA,
  'Coffee System': COFFEE_MAKER_SCHEMA,
  
  // Warming Drawer
  'Warming Drawer': WARMING_DRAWER_SCHEMA,
  'Warming Drawers': WARMING_DRAWER_SCHEMA,
  'WARMING DRAWERS': WARMING_DRAWER_SCHEMA,
  
  // Drawer (Refrigerator/Freezer)
  'Drawer': DRAWER_SCHEMA,
  'Refrigerator Drawer': DRAWER_SCHEMA,
  'Freezer Drawer': DRAWER_SCHEMA,
  
  // Outdoor
  'Barbeques': OUTDOOR_GRILL_SCHEMA,
  'Grill': OUTDOOR_GRILL_SCHEMA,
  'Grills': OUTDOOR_GRILL_SCHEMA,
  'GRILLS': OUTDOOR_GRILL_SCHEMA,
  'BBQ': OUTDOOR_GRILL_SCHEMA,
  'Outdoor Grill': OUTDOOR_GRILL_SCHEMA,
  'Gas Grill': OUTDOOR_GRILL_SCHEMA,
  'Charcoal Grill': OUTDOOR_GRILL_SCHEMA,
  'Pellet Grill': OUTDOOR_GRILL_SCHEMA,
  
  // ============================================
  // PLUMBING & BATH - KITCHEN
  // ============================================
  
  // Kitchen Sinks
  'Kitchen Sinks': KITCHEN_SINK_SCHEMA,
  'Kitchen Sinks #': KITCHEN_SINK_SCHEMA,
  'KITCHEN SINKS': KITCHEN_SINK_SCHEMA,
  'Kitchen Sink': KITCHEN_SINK_SCHEMA,
  'Farmhouse Sink': KITCHEN_SINK_SCHEMA,
  'Apron Sink': KITCHEN_SINK_SCHEMA,
  'Undermount Kitchen Sink': KITCHEN_SINK_SCHEMA,
  'Drop-In Kitchen Sink': KITCHEN_SINK_SCHEMA,
  
  // Kitchen Faucets
  'Kitchen Faucets': KITCHEN_FAUCET_SCHEMA,
  'Kitchen Faucets #': KITCHEN_FAUCET_SCHEMA,
  'KITCHEN FAUCETS': KITCHEN_FAUCET_SCHEMA,
  'Kitchen Faucet': KITCHEN_FAUCET_SCHEMA,
  'Pull-Down Kitchen Faucet': KITCHEN_FAUCET_SCHEMA,
  'Pull-Out Kitchen Faucet': KITCHEN_FAUCET_SCHEMA,
  'Bridge Faucet': KITCHEN_FAUCET_SCHEMA,
  'Pot Filler': KITCHEN_FAUCET_SCHEMA,
  
  // Bar & Prep Sinks
  'Bar & Prep Sinks': BAR_PREP_SINK_SCHEMA,
  'Bar & Prep Sinks #': BAR_PREP_SINK_SCHEMA,
  'Bar Sink': BAR_PREP_SINK_SCHEMA,
  'Bar Sinks': BAR_PREP_SINK_SCHEMA,
  'Prep Sink': BAR_PREP_SINK_SCHEMA,
  'Prep Sinks': BAR_PREP_SINK_SCHEMA,
  
  // Bar Faucets
  'Bar Faucets': BAR_FAUCET_SCHEMA,
  'Bar Faucets #': BAR_FAUCET_SCHEMA,
  'Bar Faucet': BAR_FAUCET_SCHEMA,
  'Prep Faucet': BAR_FAUCET_SCHEMA,
  
  // ============================================
  // PLUMBING & BATH - BATHROOM
  // ============================================
  
  // Bathroom Sinks
  'Bathroom Sinks': BATHROOM_SINK_SCHEMA,
  'Bathroom Sinks #': BATHROOM_SINK_SCHEMA,
  'BATHROOM SINKS': BATHROOM_SINK_SCHEMA,
  'Bathroom Sink': BATHROOM_SINK_SCHEMA,
  'Vessel Sink': BATHROOM_SINK_SCHEMA,
  'Pedestal Sink': BATHROOM_SINK_SCHEMA,
  'Undermount Bathroom Sink': BATHROOM_SINK_SCHEMA,
  'Wall Mount Sink': BATHROOM_SINK_SCHEMA,
  'Console Sink': BATHROOM_SINK_SCHEMA,
  'Lavatory': BATHROOM_SINK_SCHEMA,
  
  // Bathroom Faucets
  'Bathroom Faucets': BATHROOM_FAUCET_SCHEMA,
  'Bathroom Faucets #': BATHROOM_FAUCET_SCHEMA,
  'BATHROOM FAUCETS': BATHROOM_FAUCET_SCHEMA,
  'Bathroom Faucet': BATHROOM_FAUCET_SCHEMA,
  'Lavatory Faucet': BATHROOM_FAUCET_SCHEMA,
  'Widespread Faucet': BATHROOM_FAUCET_SCHEMA,
  'Centerset Faucet': BATHROOM_FAUCET_SCHEMA,
  'Single Hole Faucet': BATHROOM_FAUCET_SCHEMA,
  
  // Bathroom Vanities
  'Bathroom Vanities': BATHROOM_VANITY_SCHEMA,
  'Bathroom Vanities #': BATHROOM_VANITY_SCHEMA,
  'BATHROOM VANITIES': BATHROOM_VANITY_SCHEMA,
  'Bathroom Vanity': BATHROOM_VANITY_SCHEMA,
  'Vanity': BATHROOM_VANITY_SCHEMA,
  'Vanities': BATHROOM_VANITY_SCHEMA,
  'Single Vanity': BATHROOM_VANITY_SCHEMA,
  'Double Vanity': BATHROOM_VANITY_SCHEMA,
  
  // Toilets
  'Toilets': TOILET_SCHEMA,
  'Toilets #': TOILET_SCHEMA,
  'TOILETS': TOILET_SCHEMA,
  'Toilet': TOILET_SCHEMA,
  'One-Piece Toilet': TOILET_SCHEMA,
  'Two-Piece Toilet': TOILET_SCHEMA,
  'Wall-Hung Toilet': TOILET_SCHEMA,
  'Smart Toilet': TOILET_SCHEMA,
  'Bidet Toilet': TOILET_SCHEMA,
  
  // Bathtubs
  'Bathtubs': BATHTUB_SCHEMA,
  'Bathtubs #': BATHTUB_SCHEMA,
  'BATHTUBS': BATHTUB_SCHEMA,
  'Bathtub': BATHTUB_SCHEMA,
  'Bath Tub': BATHTUB_SCHEMA,
  'Tub': BATHTUB_SCHEMA,
  'Freestanding Tub': BATHTUB_SCHEMA,
  'Freestanding Bathtub': BATHTUB_SCHEMA,
  'Alcove Tub': BATHTUB_SCHEMA,
  'Drop-In Tub': BATHTUB_SCHEMA,
  'Soaking Tub': BATHTUB_SCHEMA,
  'Whirlpool Tub': BATHTUB_SCHEMA,
  'Air Tub': BATHTUB_SCHEMA,
  'Walk-In Tub': BATHTUB_SCHEMA,
  
  // Tub Faucets
  'Tub Faucets': TUB_FAUCET_SCHEMA,
  'Tub Faucets #': TUB_FAUCET_SCHEMA,
  'TUB FAUCETS': TUB_FAUCET_SCHEMA,
  'Tub Faucet': TUB_FAUCET_SCHEMA,
  'Roman Tub Faucet': TUB_FAUCET_SCHEMA,
  'Freestanding Tub Faucet': TUB_FAUCET_SCHEMA,
  'Tub Filler': TUB_FAUCET_SCHEMA,
  
  // Showers
  'Showers': SHOWER_SCHEMA,
  'Showers #': SHOWER_SCHEMA,
  'SHOWERS': SHOWER_SCHEMA,
  'Shower': SHOWER_SCHEMA,
  'Shower System': SHOWER_SCHEMA,
  'Shower Head': SHOWER_SCHEMA,
  'Shower Heads': SHOWER_SCHEMA,
  'Hand Shower': SHOWER_SCHEMA,
  'Rain Shower': SHOWER_SCHEMA,
  'Shower Faucet': SHOWER_SCHEMA,
  'Shower Trim': SHOWER_SCHEMA,
  
  // Bathroom Hardware
  'Bathroom Hardware and Accessories': BATHROOM_HARDWARE_SCHEMA,
  'Bathroom Hardware and Accessories #': BATHROOM_HARDWARE_SCHEMA,
  'Bathroom Accessories': BATHROOM_HARDWARE_SCHEMA,
  'Bathroom Hardware': BATHROOM_HARDWARE_SCHEMA,
  'BATHROOM HARDWARE': BATHROOM_HARDWARE_SCHEMA,
  'Towel Bar': BATHROOM_HARDWARE_SCHEMA,
  'Towel Ring': BATHROOM_HARDWARE_SCHEMA,
  'Robe Hook': BATHROOM_HARDWARE_SCHEMA,
  'TP Holder': BATHROOM_HARDWARE_SCHEMA,
  'Toilet Paper Holder': BATHROOM_HARDWARE_SCHEMA,
  
  // ============================================
  // LIGHTING
  // ============================================
  
  // Chandeliers
  'Chandeliers': CHANDELIER_SCHEMA,
  'Chandeliers #': CHANDELIER_SCHEMA,
  'CHANDELIERS': CHANDELIER_SCHEMA,
  'Chandelier': CHANDELIER_SCHEMA,
  'Crystal Chandelier': CHANDELIER_SCHEMA,
  
  // Pendants
  'Pendants': PENDANT_SCHEMA,
  'Pendants #': PENDANT_SCHEMA,
  'PENDANTS': PENDANT_SCHEMA,
  'Pendant': PENDANT_SCHEMA,
  'Pendant Light': PENDANT_SCHEMA,
  'Pendant Lights': PENDANT_SCHEMA,
  'PENDANT LIGHTS': PENDANT_SCHEMA,
  'Island Light': PENDANT_SCHEMA,
  'Mini Pendant': PENDANT_SCHEMA,
  
  // Ceiling Fans
  'Ceiling Fans': CEILING_FAN_SCHEMA,
  'Ceiling Fans #': CEILING_FAN_SCHEMA,
  'CEILING FANS': CEILING_FAN_SCHEMA,
  'Ceiling Fan': CEILING_FAN_SCHEMA,
  
  // Ceiling Fans with Light
  'Ceiling Fans with Light': CEILING_FAN_WITH_LIGHT_SCHEMA,
  'Ceiling Fans with Light #': CEILING_FAN_WITH_LIGHT_SCHEMA,
  'Ceiling Fan with Light': CEILING_FAN_WITH_LIGHT_SCHEMA,
  'Fan with Light': CEILING_FAN_WITH_LIGHT_SCHEMA,
  
  // Ceiling Lights
  'Ceiling Lights': CEILING_LIGHT_SCHEMA,
  'Ceiling Lights #': CEILING_LIGHT_SCHEMA,
  'CEILING LIGHTS': CEILING_LIGHT_SCHEMA,
  'Ceiling Light': CEILING_LIGHT_SCHEMA,
  'Flush Mount': CEILING_LIGHT_SCHEMA,
  'Flush Mount Light': CEILING_LIGHT_SCHEMA,
  'Flush Mount Lights': CEILING_LIGHT_SCHEMA,
  'Semi-Flush': CEILING_LIGHT_SCHEMA,
  'Semi-Flush Mount': CEILING_LIGHT_SCHEMA,
  'Semi-Flush Light': CEILING_LIGHT_SCHEMA,
  
  // Wall Sconces
  'Wall Sconces': WALL_SCONCE_SCHEMA,
  'Wall Sconces #': WALL_SCONCE_SCHEMA,
  'WALL SCONCES': WALL_SCONCE_SCHEMA,
  'Wall Sconce': WALL_SCONCE_SCHEMA,
  'Sconce': WALL_SCONCE_SCHEMA,
  'Sconces': WALL_SCONCE_SCHEMA,
  'Wall Light': WALL_SCONCE_SCHEMA,
  'Wall Lights': WALL_SCONCE_SCHEMA,
  
  // Outdoor Lighting
  'Outdoor Lighting': OUTDOOR_LIGHTING_SCHEMA,
  'Outdoor Lighting #': OUTDOOR_LIGHTING_SCHEMA,
  'OUTDOOR LIGHTING': OUTDOOR_LIGHTING_SCHEMA,
  'Outdoor Light': OUTDOOR_LIGHTING_SCHEMA,
  'Outdoor Lights': OUTDOOR_LIGHTING_SCHEMA,
  'Exterior Lighting': OUTDOOR_LIGHTING_SCHEMA,
  'Wall Lantern': OUTDOOR_LIGHTING_SCHEMA,
  'Post Light': OUTDOOR_LIGHTING_SCHEMA,
  'Pathway Light': OUTDOOR_LIGHTING_SCHEMA,
  'Flood Light': OUTDOOR_LIGHTING_SCHEMA,
  
  // Recessed Lighting
  'Recessed Lighting': RECESSED_LIGHTING_SCHEMA,
  'Recessed Lighting #': RECESSED_LIGHTING_SCHEMA,
  'RECESSED LIGHTING': RECESSED_LIGHTING_SCHEMA,
  'Recessed Light': RECESSED_LIGHTING_SCHEMA,
  'Recessed Lights': RECESSED_LIGHTING_SCHEMA,
  'Can Light': RECESSED_LIGHTING_SCHEMA,
  'Can Lights': RECESSED_LIGHTING_SCHEMA,
  'Downlight': RECESSED_LIGHTING_SCHEMA,
  'Downlights': RECESSED_LIGHTING_SCHEMA,
  
  // ============================================
  // HOME DECOR & FIXTURES
  // ============================================
  
  // Storage
  'Storage Drawers/Doors': STORAGE_DRAWERS_SCHEMA,
  'Storage Drawers/Doors #': STORAGE_DRAWERS_SCHEMA,
  'Storage Drawers': STORAGE_DRAWERS_SCHEMA,
  'Storage Doors': STORAGE_DRAWERS_SCHEMA,
  'Cabinet Doors': STORAGE_DRAWERS_SCHEMA,
  'Cabinet Drawers': STORAGE_DRAWERS_SCHEMA,
  
  // Cabinet Organization
  'Cabinet Organization and Storage': CABINET_ORGANIZATION_SCHEMA,
  'Cabinet Organization and Storage #': CABINET_ORGANIZATION_SCHEMA,
  'Cabinet Organization': CABINET_ORGANIZATION_SCHEMA,
  'Cabinet Organizer': CABINET_ORGANIZATION_SCHEMA,
  'Cabinet Organizers': CABINET_ORGANIZATION_SCHEMA,
  'Pull-Out Shelf': CABINET_ORGANIZATION_SCHEMA,
  'Lazy Susan': CABINET_ORGANIZATION_SCHEMA,
  
  // ============================================
  // HVAC
  // ============================================
  
  'Air Conditioners': AIR_CONDITIONER_SCHEMA,
  'Air Conditioners #': AIR_CONDITIONER_SCHEMA,
  'AIR CONDITIONERS': AIR_CONDITIONER_SCHEMA,
  'Air Conditioner': AIR_CONDITIONER_SCHEMA,
  'AC Unit': AIR_CONDITIONER_SCHEMA,
  'Mini Split': AIR_CONDITIONER_SCHEMA,
  'Window AC': AIR_CONDITIONER_SCHEMA,
  'Portable AC': AIR_CONDITIONER_SCHEMA,

  // ============================================
  // PLUMBING - ADDITIONAL CATEGORIES
  // ============================================

  // Bidets
  'Bidets': BIDET_SCHEMA,
  'Bidets #': BIDET_SCHEMA,
  'BIDETS': BIDET_SCHEMA,
  'Bidet': BIDET_SCHEMA,
  'Bidet Seat': BIDET_SCHEMA,
  'Bidet Attachment': BIDET_SCHEMA,
  'Electric Bidet': BIDET_SCHEMA,

  // Drains
  'Drains': DRAIN_SCHEMA,
  'Drains #': DRAIN_SCHEMA,
  'DRAINS': DRAIN_SCHEMA,
  'Drain': DRAIN_SCHEMA,
  'Shower Drain': DRAIN_SCHEMA,
  'Floor Drain': DRAIN_SCHEMA,
  'Linear Drain': DRAIN_SCHEMA,
  'Sink Drain': DRAIN_SCHEMA,

  // Drainage & Waste
  'Drainage & Waste': DRAINAGE_WASTE_SCHEMA,
  'Drainage & Waste #': DRAINAGE_WASTE_SCHEMA,
  'DRAINAGE & WASTE': DRAINAGE_WASTE_SCHEMA,
  'Drainage': DRAINAGE_WASTE_SCHEMA,
  'P-Trap': DRAINAGE_WASTE_SCHEMA,
  'Waste Arm': DRAINAGE_WASTE_SCHEMA,
  'Tailpiece': DRAINAGE_WASTE_SCHEMA,

  // Rough-In Valves
  'Rough-In Valves': ROUGH_IN_VALVE_SCHEMA,
  'Rough-In Valves #': ROUGH_IN_VALVE_SCHEMA,
  'ROUGH-IN VALVES': ROUGH_IN_VALVE_SCHEMA,
  'Rough In Valve': ROUGH_IN_VALVE_SCHEMA,
  'Rough Valve': ROUGH_IN_VALVE_SCHEMA,
  'Shower Valve': ROUGH_IN_VALVE_SCHEMA,
  'Thermostatic Valve': ROUGH_IN_VALVE_SCHEMA,
  'Pressure Balance Valve': ROUGH_IN_VALVE_SCHEMA,

  // Garbage Disposals
  'Garbage Disposals': GARBAGE_DISPOSAL_SCHEMA,
  'Garbage Disposals #': GARBAGE_DISPOSAL_SCHEMA,
  'GARBAGE DISPOSALS': GARBAGE_DISPOSAL_SCHEMA,
  'Garbage Disposal': GARBAGE_DISPOSAL_SCHEMA,
  'Disposer': GARBAGE_DISPOSAL_SCHEMA,
  'Food Waste Disposer': GARBAGE_DISPOSAL_SCHEMA,
  'InSinkErator': GARBAGE_DISPOSAL_SCHEMA,

  // Water Heaters
  'Water Heaters': WATER_HEATER_SCHEMA,
  'Water Heaters #': WATER_HEATER_SCHEMA,
  'WATER HEATERS': WATER_HEATER_SCHEMA,
  'Water Heater': WATER_HEATER_SCHEMA,
  'Tankless Water Heater': WATER_HEATER_SCHEMA,
  'Tank Water Heater': WATER_HEATER_SCHEMA,
  'Heat Pump Water Heater': WATER_HEATER_SCHEMA,
  'Electric Water Heater': WATER_HEATER_SCHEMA,
  'Gas Water Heater': WATER_HEATER_SCHEMA,

  // Bathtub Waste & Overflow
  'Bathtub Waste & Overflow': BATHTUB_WASTE_OVERFLOW_SCHEMA,
  'Bathtub Waste & Overflow #': BATHTUB_WASTE_OVERFLOW_SCHEMA,
  'BATHTUB WASTE & OVERFLOW': BATHTUB_WASTE_OVERFLOW_SCHEMA,
  'Tub Drain': BATHTUB_WASTE_OVERFLOW_SCHEMA,
  'Bath Drain': BATHTUB_WASTE_OVERFLOW_SCHEMA,
  'Overflow Drain': BATHTUB_WASTE_OVERFLOW_SCHEMA,

  // ============================================
  // HARDWARE
  // ============================================

  // Cabinet Hardware
  'Cabinet Hardware': CABINET_HARDWARE_SCHEMA,
  'Cabinet Hardware #': CABINET_HARDWARE_SCHEMA,
  'CABINET HARDWARE': CABINET_HARDWARE_SCHEMA,
  'Cabinet Knobs': CABINET_HARDWARE_SCHEMA,
  'Cabinet Pulls': CABINET_HARDWARE_SCHEMA,
  'Cabinet Handles': CABINET_HARDWARE_SCHEMA,
  'Drawer Pulls': CABINET_HARDWARE_SCHEMA,
  'Drawer Knobs': CABINET_HARDWARE_SCHEMA,

  // Door Hardware Parts
  'Door Hardware Parts': DOOR_HARDWARE_PARTS_SCHEMA,
  'Door Hardware Parts #': DOOR_HARDWARE_PARTS_SCHEMA,
  'DOOR HARDWARE PARTS': DOOR_HARDWARE_PARTS_SCHEMA,
  'Door Hinges': DOOR_HARDWARE_PARTS_SCHEMA,
  'Strike Plates': DOOR_HARDWARE_PARTS_SCHEMA,
  'Door Latches': DOOR_HARDWARE_PARTS_SCHEMA,

  // ============================================
  // LIGHTING - ADDITIONAL CATEGORIES
  // ============================================

  // Bathroom Lighting
  'Bathroom Lighting': BATHROOM_LIGHTING_SCHEMA,
  'Bathroom Lighting #': BATHROOM_LIGHTING_SCHEMA,
  'BATHROOM LIGHTING': BATHROOM_LIGHTING_SCHEMA,
  'Vanity Light': BATHROOM_LIGHTING_SCHEMA,
  'Vanity Lights': BATHROOM_LIGHTING_SCHEMA,
  'Bath Bar': BATHROOM_LIGHTING_SCHEMA,
  'Vanity Bar': BATHROOM_LIGHTING_SCHEMA,
  'Bath Light': BATHROOM_LIGHTING_SCHEMA,

  // Kitchen Lighting
  'Kitchen Lighting': KITCHEN_LIGHTING_SCHEMA,
  'Kitchen Lighting #': KITCHEN_LIGHTING_SCHEMA,
  'KITCHEN LIGHTING': KITCHEN_LIGHTING_SCHEMA,
  'Island Pendant': KITCHEN_LIGHTING_SCHEMA,
  'Kitchen Island Light': KITCHEN_LIGHTING_SCHEMA,
  'Under Cabinet Light': KITCHEN_LIGHTING_SCHEMA,
  'Under Cabinet Lighting': KITCHEN_LIGHTING_SCHEMA,

  // Commercial Lighting
  'Commercial Lighting': COMMERCIAL_LIGHTING_SCHEMA,
  'Commercial Lighting #': COMMERCIAL_LIGHTING_SCHEMA,
  'COMMERCIAL LIGHTING': COMMERCIAL_LIGHTING_SCHEMA,
  'Troffer': COMMERCIAL_LIGHTING_SCHEMA,
  'LED Panel': COMMERCIAL_LIGHTING_SCHEMA,
  'High Bay': COMMERCIAL_LIGHTING_SCHEMA,
  'High Bay Light': COMMERCIAL_LIGHTING_SCHEMA,

  // Lamps
  'Lamps': LAMP_SCHEMA,
  'Lamps #': LAMP_SCHEMA,
  'LAMPS': LAMP_SCHEMA,
  'Lamp': LAMP_SCHEMA,
  'Table Lamp': LAMP_SCHEMA,
  'Table Lamps': LAMP_SCHEMA,
  'Floor Lamp': LAMP_SCHEMA,
  'Floor Lamps': LAMP_SCHEMA,
  'Desk Lamp': LAMP_SCHEMA,
  'Desk Lamps': LAMP_SCHEMA,
  'Torchiere': LAMP_SCHEMA,

  // Track and Rail Lighting
  'Track and Rail Lighting': TRACK_RAIL_LIGHTING_SCHEMA,
  'Track and Rail Lighting #': TRACK_RAIL_LIGHTING_SCHEMA,
  'TRACK AND RAIL LIGHTING': TRACK_RAIL_LIGHTING_SCHEMA,
  'Track Lighting': TRACK_RAIL_LIGHTING_SCHEMA,
  'Track Light': TRACK_RAIL_LIGHTING_SCHEMA,
  'Track Lights': TRACK_RAIL_LIGHTING_SCHEMA,
  'Rail Lighting': TRACK_RAIL_LIGHTING_SCHEMA,
  'Monorail': TRACK_RAIL_LIGHTING_SCHEMA,
  'Track Head': TRACK_RAIL_LIGHTING_SCHEMA,

  // Lighting Accessories
  'Lighting Accessories': LIGHTING_ACCESSORIES_SCHEMA,
  'Lighting Accessories #': LIGHTING_ACCESSORIES_SCHEMA,
  'LIGHTING ACCESSORIES': LIGHTING_ACCESSORIES_SCHEMA,
  'Light Shade': LIGHTING_ACCESSORIES_SCHEMA,
  'Lamp Shade': LIGHTING_ACCESSORIES_SCHEMA,
  'Light Bulbs': LIGHTING_ACCESSORIES_SCHEMA,
  'LED Bulbs': LIGHTING_ACCESSORIES_SCHEMA,

  // ============================================
  // HOME DECOR - ADDITIONAL CATEGORIES
  // ============================================

  // Mirrors
  'Mirrors': MIRROR_SCHEMA,
  'Mirrors #': MIRROR_SCHEMA,
  'MIRRORS': MIRROR_SCHEMA,
  'Mirror': MIRROR_SCHEMA,
  'Wall Mirror': MIRROR_SCHEMA,
  'Wall Mirrors': MIRROR_SCHEMA,
  'Floor Mirror': MIRROR_SCHEMA,
  'Decorative Mirror': MIRROR_SCHEMA,

  // Bathroom Mirrors
  'Bathroom Mirrors': BATHROOM_MIRROR_SCHEMA,
  'Bathroom Mirrors #': BATHROOM_MIRROR_SCHEMA,
  'BATHROOM MIRRORS': BATHROOM_MIRROR_SCHEMA,
  'Bathroom Mirror': BATHROOM_MIRROR_SCHEMA,
  'Vanity Mirror': BATHROOM_MIRROR_SCHEMA,
  'Vanity Mirrors': BATHROOM_MIRROR_SCHEMA,
  'Lighted Mirror': BATHROOM_MIRROR_SCHEMA,
  'LED Mirror': BATHROOM_MIRROR_SCHEMA,
  'Medicine Cabinet Mirror': BATHROOM_MIRROR_SCHEMA,

  // Furniture
  'Furniture': FURNITURE_SCHEMA,
  'Furniture #': FURNITURE_SCHEMA,
  'FURNITURE': FURNITURE_SCHEMA,
  'Home Furniture': FURNITURE_SCHEMA,
  'Living Room Furniture': FURNITURE_SCHEMA,
  'Bedroom Furniture': FURNITURE_SCHEMA,

  // Kitchen Accessories
  'Kitchen Accessories': KITCHEN_ACCESSORIES_SCHEMA,
  'Kitchen Accessories #': KITCHEN_ACCESSORIES_SCHEMA,
  'KITCHEN ACCESSORIES': KITCHEN_ACCESSORIES_SCHEMA,
  'Kitchen Soap Dispenser': KITCHEN_ACCESSORIES_SCHEMA,
  'Paper Towel Holder': KITCHEN_ACCESSORIES_SCHEMA,
  'Utensil Holder': KITCHEN_ACCESSORIES_SCHEMA,

  // ============================================
  // OUTDOOR
  // ============================================

  // Outdoor Fireplaces
  'Outdoor Fireplaces': OUTDOOR_FIREPLACE_SCHEMA,
  'Outdoor Fireplaces #': OUTDOOR_FIREPLACE_SCHEMA,
  'OUTDOOR FIREPLACES': OUTDOOR_FIREPLACE_SCHEMA,
  'Outdoor Fireplace': OUTDOOR_FIREPLACE_SCHEMA,
  'Fire Pit': OUTDOOR_FIREPLACE_SCHEMA,
  'Fire Pits': OUTDOOR_FIREPLACE_SCHEMA,
  'Fire Table': OUTDOOR_FIREPLACE_SCHEMA,
  'Fire Tables': OUTDOOR_FIREPLACE_SCHEMA,
  'Chiminea': OUTDOOR_FIREPLACE_SCHEMA,

  // ============================================
  // HVAC - ADDITIONAL CATEGORIES
  // ============================================

  // Hydronic Expansion Tanks
  'Hydronic Expansion Tanks': HYDRONIC_EXPANSION_TANK_SCHEMA,
  'Hydronic Expansion Tanks #': HYDRONIC_EXPANSION_TANK_SCHEMA,
  'HYDRONIC EXPANSION TANKS': HYDRONIC_EXPANSION_TANK_SCHEMA,
  'Expansion Tank': HYDRONIC_EXPANSION_TANK_SCHEMA,
  'Expansion Tanks': HYDRONIC_EXPANSION_TANK_SCHEMA,
  'Thermal Expansion Tank': HYDRONIC_EXPANSION_TANK_SCHEMA,

  // ============================================
  // ADDITIONAL APPLIANCES
  // ============================================

  // Compactor
  'Compactor': COMPACTOR_SCHEMA,
  'Compactor #': COMPACTOR_SCHEMA,
  'COMPACTOR': COMPACTOR_SCHEMA,
  'Compactors': COMPACTOR_SCHEMA,
  'Trash Compactor': COMPACTOR_SCHEMA,
  'Trash Compactors': COMPACTOR_SCHEMA,

  // Hot Water Dispensers
  'Hot Water Dispensers': HOT_WATER_DISPENSER_SCHEMA,
  'Hot Water Dispensers #': HOT_WATER_DISPENSER_SCHEMA,
  'HOT WATER DISPENSERS': HOT_WATER_DISPENSER_SCHEMA,
  'Hot Water Dispenser': HOT_WATER_DISPENSER_SCHEMA,
  'Instant Hot Water': HOT_WATER_DISPENSER_SCHEMA,
  'InstaHot': HOT_WATER_DISPENSER_SCHEMA,

  // Water Filters
  'Water Filters': WATER_FILTER_SCHEMA,
  'Water Filters #': WATER_FILTER_SCHEMA,
  'WATER FILTERS': WATER_FILTER_SCHEMA,
  'Water Filter': WATER_FILTER_SCHEMA,
  'Water Filtration': WATER_FILTER_SCHEMA,
  'RO System': WATER_FILTER_SCHEMA,
  'Reverse Osmosis': WATER_FILTER_SCHEMA,
};

/**
 * Get category schema by name with intelligent fallback
 * Handles various naming conventions and performs fuzzy matching
 */
export function getSchemaForCategory(categoryName: string): CategoryAttributeConfig | null {
  if (!categoryName) {
    logger.warn('getSchemaForCategory called with empty category name');
    return null;
  }

  // 1. Direct match
  if (MASTER_CATEGORY_SCHEMA_MAP[categoryName]) {
    return MASTER_CATEGORY_SCHEMA_MAP[categoryName];
  }

  // 2. Try without # suffix
  const withoutHash = categoryName.replace(/ #$/, '').trim();
  if (MASTER_CATEGORY_SCHEMA_MAP[withoutHash]) {
    return MASTER_CATEGORY_SCHEMA_MAP[withoutHash];
  }

  // 3. Try with # suffix
  const withHash = categoryName.trim() + ' #';
  if (MASTER_CATEGORY_SCHEMA_MAP[withHash]) {
    return MASTER_CATEGORY_SCHEMA_MAP[withHash];
  }

  // 4. Case-insensitive exact match
  const lowerName = categoryName.toLowerCase().replace(/ #$/, '').trim();
  for (const [key, schema] of Object.entries(MASTER_CATEGORY_SCHEMA_MAP)) {
    if (key.toLowerCase().replace(/ #$/, '').trim() === lowerName) {
      return schema;
    }
  }

  // 5. Fuzzy match - check if category name contains key words
  const normalizedName = lowerName.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
  for (const [key, schema] of Object.entries(MASTER_CATEGORY_SCHEMA_MAP)) {
    const normalizedKey = key.toLowerCase().replace(/ #$/, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
    if (normalizedKey === normalizedName) {
      return schema;
    }
  }

  // 6. Partial match - check if the category name contains or is contained by a key
  for (const [key, schema] of Object.entries(MASTER_CATEGORY_SCHEMA_MAP)) {
    const normalizedKey = key.toLowerCase().replace(/ #$/, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
    if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
      logger.debug(`Fuzzy matched category "${categoryName}" to schema "${key}"`);
      return schema;
    }
  }

  logger.warn(`No schema found for category: "${categoryName}"`);
  return null;
}

/**
 * Get all available category names (for debugging/logging)
 */
export function getAllCategoryNames(): string[] {
  return Object.keys(MASTER_CATEGORY_SCHEMA_MAP);
}

/**
 * Get unique schemas (deduplicated by categoryName)
 */
export function getUniqueSchemas(): CategoryAttributeConfig[] {
  const seen = new Set<string>();
  const uniqueSchemas: CategoryAttributeConfig[] = [];
  
  for (const schema of Object.values(MASTER_CATEGORY_SCHEMA_MAP)) {
    if (!seen.has(schema.categoryName)) {
      seen.add(schema.categoryName);
      uniqueSchemas.push(schema);
    }
  }
  
  return uniqueSchemas;
}

/**
 * Validate that a category has a schema
 */
export function hasSchemaForCategory(categoryName: string): boolean {
  return getSchemaForCategory(categoryName) !== null;
}

export default {
  MASTER_CATEGORY_SCHEMA_MAP,
  getSchemaForCategory,
  getAllCategoryNames,
  getUniqueSchemas,
  hasSchemaForCategory,
};
