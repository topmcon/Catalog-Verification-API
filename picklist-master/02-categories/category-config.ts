/**
 * Category Name Aliases and Configuration
 * 
 * SOURCE: Extracted from src/config/constants.ts
 * DEPENDENCY: categories.json picklist
 * 
 * PURPOSE: Map category name variations to canonical forms
 * WHEN TO UPDATE: When new categories are added to categories.json, add common variations here
 */

/**
 * User-facing category name variations
 * Maps category names to their common aliases
 */
export const CATEGORY_NAME_ALIASES: Record<string, string[]> = {
  'Refrigerator': ['Fridge', 'Refrigerators', 'Frig'],
  'Dishwasher': ['Dishwashers', 'Dish Washer'],
  'Range': ['Stove', 'Ranges', 'Cooking Range', 'Gas Range', 'Electric Range'],
  'Cooktop': ['Cooktops', 'Cook Top', 'Stovetop'],
  'Oven': ['Ovens', 'Wall Oven', 'Wall Ovens'],
  'Microwave': ['Microwaves', 'Microwave Oven'],
  'Range Hood': ['Hood', 'Vent Hood', 'Ventilation', 'Range Hoods'],
  'Washer': ['Washing Machine', 'Washers'],
  'Dryer': ['Dryers', 'Clothes Dryer'],
  'Freezer': ['Freezers', 'Chest Freezer', 'Upright Freezer'],
  'Ice Maker': ['Icemaker', 'Ice Machine'],
  'All in One Washer / Dryer': ['Washer Dryer Combo', 'Combo Washer Dryer', 'Laundry Center'],
  'Bathroom Sink': ['Bath Sink', 'Lavatory', 'Lav Sink', 'Bathroom Sinks'],
  'Kitchen Sink': ['Kitchen Sinks', 'Undermount Sink'],
  'Toilet': ['Toilets', 'Commode', 'Water Closet'],
  'Bathtub': ['Bathtubs', 'Tub', 'Soaking Tub'],
  'Chandelier': ['Chandeliers', 'Crystal Chandelier'],
  'Pendant': ['Pendants', 'Pendant Light', 'Hanging Light'],
  'Wall Sconce': ['Wall Sconces', 'Sconce'],
  'Ceiling Fan': ['Ceiling Fans', 'Fan'],
  'Shower': ['Showers'],
  'Shower Faucet': ['Shower Faucets'],
  'Shower Accessory': ['Shower Accessories'],
};

/**
 * AI System Category Aliases
 * Maps variations to canonical category IDs used in AI schema lookup
 */
export const AI_CATEGORY_ALIASES: Record<string, string> = {
  'gas range': 'range',
  'gas ranges': 'range',
  'electric range': 'range',
  'electric ranges': 'range',
  'dual fuel range': 'range',
  'dual fuel ranges': 'range',
  'induction range': 'range',
  'freestanding range': 'range',
  'slide in range': 'range',
  'french door refrigerator': 'refrigerator',
  'side by side refrigerator': 'refrigerator',
  'bottom freezer refrigerator': 'refrigerator',
  'top freezer refrigerator': 'refrigerator',
  'wall oven': 'oven',
  'double wall oven': 'oven',
  'single wall oven': 'oven',
  'gas cooktop': 'cooktop',
  'electric cooktop': 'cooktop',
  'induction cooktop': 'cooktop',
  'over the range microwave': 'microwave',
  'countertop microwave': 'microwave',
  'built in microwave': 'microwave',
  'upright freezer': 'freezer',
  'chest freezer': 'freezer',
  'front load washer': 'washer',
  'top load washer': 'washer',
  'gas dryer': 'dryer',
  'electric dryer': 'dryer',
  'pedestal sink': 'bathroom_sinks',
  'vessel sink': 'bathroom_sinks',
  'undermount sink': 'bathroom_sinks',
  'drop in sink': 'bathroom_sinks',
  'freestanding bathtub': 'bathtubs',
  'alcove bathtub': 'bathtubs',
  'soaking tub': 'bathtubs',
  'whirlpool tub': 'bathtubs',
  'pull down faucet': 'kitchen_faucets',
  'pull out faucet': 'kitchen_faucets',
  'touchless faucet': 'kitchen_faucets',
  'single handle faucet': 'bathroom_faucets',
  'widespread faucet': 'bathroom_faucets',
  'one piece toilet': 'toilets',
  'two piece toilet': 'toilets',
  'comfort height toilet': 'toilets',
  'bidet toilet': 'toilets',
};

/**
 * Department names
 */
export const DEPARTMENTS = [
  'Appliances',
  'Plumbing & Bath',
  'Lighting',
  'Home Decor',
  'HVAC',
  'Outdoor',
  'Other / Needs Review'
] as const;

export type DepartmentName = typeof DEPARTMENTS[number];
