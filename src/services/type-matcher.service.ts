/**
 * TYPE MATCHER SERVICE
 * ====================
 * Matches AI-derived product types to Salesforce Type picklist
 * Similar to style-matcher and brand-matcher
 */

import {
  getTypeByName,
  isValidTypeForCategory,
  getCategoryTypeMapping,
  TypePicklistItem
} from '../picklist-master/03-types/type-config';
import logger from '../utils/logger';

export interface TypeMatchResult {
  matched: boolean;
  matchedValue: TypePicklistItem | null;
  confidence: number;
  matchMethod: 'exact' | 'normalized' | 'fuzzy' | 'none';
  originalInput: string;
}

/**
 * Common AI output aliases that should map to specific type picklist values
 * Key: normalized alias (lowercase), Value: { category: correct type_name }
 * This handles cases where AI outputs descriptions that don't match picklist names exactly
 * 
 * IMPORTANT: All type_name values MUST match exactly what's in types.json
 */
const TYPE_ALIASES: Record<string, Record<string, string>> = {
  // ============================================
  // OVEN ALIASES
  // ============================================
  'built-in': { 'Oven': 'Single', 'Refrigerator': 'Column', 'Dishwasher': 'Drawer', 'Microwave': 'Over-the-Range', 'Icemaker': 'Undercounter', 'Barbeque': 'Built-In Access Doors' },
  'built-in oven': { 'Oven': 'Single' },
  'built in oven': { 'Oven': 'Single' },
  'wall oven': { 'Oven': 'Single' },
  'single wall oven': { 'Oven': 'Single' },
  'single wall': { 'Oven': 'Single' },
  'single oven': { 'Oven': 'Single' },
  'single': { 'Oven': 'Single' },
  'double oven': { 'Oven': 'Double Wall' },
  'double wall oven': { 'Oven': 'Double Wall' },
  'double wall': { 'Oven': 'Double Wall' },
  'double': { 'Oven': 'Double Wall' },
  'microwave oven combo': { 'Oven': 'Microwave Combo' },
  'microwave combination': { 'Oven': 'Microwave Combo' },
  'microwave combo': { 'Oven': 'Microwave Combo' },
  'combo oven': { 'Oven': 'Microwave Combo' },
  'combination oven': { 'Oven': 'Microwave Combo' },
  'combination wall oven': { 'Oven': 'Microwave Combo' },
  'combo wall oven': { 'Oven': 'Microwave Combo' },
  'oven microwave combo': { 'Oven': 'Microwave Combo' },
  'oven microwave combination': { 'Oven': 'Microwave Combo' },
  'speed cook': { 'Oven': 'Speed Oven' },
  'speed oven': { 'Oven': 'Speed Oven' },
  'steam oven': { 'Oven': 'Steam' },
  'steam': { 'Oven': 'Steam' },
  'convection oven': { 'Oven': 'Convection' },
  'convection': { 'Oven': 'Convection' },
  
  // ============================================
  // REFRIGERATOR ALIASES
  // ============================================
  'side by side': { 'Refrigerator': 'Side-by-Side' },
  'side-by-side': { 'Refrigerator': 'Side-by-Side' },
  'side-by-side refrigerator': { 'Refrigerator': 'Side-by-Side' },
  'sxs': { 'Refrigerator': 'Side-by-Side' },
  'french door': { 'Refrigerator': 'French Door' },
  'french door refrigerator': { 'Refrigerator': 'French Door' },
  'frenchdoor': { 'Refrigerator': 'French Door' },
  '4 door': { 'Refrigerator': '4-Door Flex' },
  '4-door': { 'Refrigerator': '4-Door Flex' },
  '4-door flex': { 'Refrigerator': '4-Door Flex' },
  'four door': { 'Refrigerator': '4-Door Flex' },
  'quad door': { 'Refrigerator': '4-Door Flex' },
  'top freezer': { 'Refrigerator': 'Top-Freezer' },
  'top freezer refrigerator': { 'Refrigerator': 'Top-Freezer' },
  'top-freezer': { 'Refrigerator': 'Top-Freezer' },
  'top mount': { 'Refrigerator': 'Top-Freezer' },
  'bottom freezer': { 'Refrigerator': 'Bottom-Freezer' },
  'bottom freezer refrigerator': { 'Refrigerator': 'Bottom-Freezer' },
  'bottom-freezer': { 'Refrigerator': 'Bottom-Freezer' },
  'bottom mount': { 'Refrigerator': 'Bottom-Freezer' },
  'built-in refrigerator': { 'Refrigerator': 'Column' },
  'built in': { 'Refrigerator': 'Column', 'Dishwasher': 'Drawer', 'Microwave': 'Over-the-Range', 'Icemaker': 'Undercounter', 'Barbeque': 'Built-In Access Doors' },
  'column': { 'Refrigerator': 'Column', 'Freezer': 'Column' },
  'column refrigerator': { 'Refrigerator': 'Column' },
  'undercounter': { 'Refrigerator': 'Undercounter' },
  'under counter': { 'Refrigerator': 'Undercounter' },
  'under-counter': { 'Refrigerator': 'Undercounter' },
  'wine': { 'Refrigerator': 'Wine Cooler' },
  'wine cooler': { 'Refrigerator': 'Wine Cooler' },
  'wine refrigerator': { 'Refrigerator': 'Wine Cooler' },
  'beverage': { 'Refrigerator': 'Beverage Center' },
  'beverage center': { 'Refrigerator': 'Beverage Center' },
  'beverage cooler': { 'Refrigerator': 'Beverage Center' },
  'can capacity': { 'Refrigerator': 'Beverage Center' },
  'can beverage': { 'Refrigerator': 'Beverage Center' },
  'kegerator': { 'Refrigerator': 'Kegerator' },
  'keg': { 'Refrigerator': 'Kegerator' },
  'beer dispenser': { 'Refrigerator': 'Kegerator' },
  'beer fridge': { 'Refrigerator': 'Kegerator' },
  
  // ============================================
  // RANGE ALIASES
  // ============================================
  'freestanding': { 'Range': 'Freestanding', 'Freezer': 'Freestanding' },
  'freestanding range': { 'Range': 'Freestanding' },
  'free standing': { 'Range': 'Freestanding' },
  'slide-in': { 'Range': 'Slide-In' },
  'slide-in range': { 'Range': 'Slide-In' },
  'slide in': { 'Range': 'Slide-In' },
  'slide in range': { 'Range': 'Slide-In' },
  'slidein': { 'Range': 'Slide-In' },
  'dual fuel': { 'Range': 'Dual Fuel' },
  'dual fuel range': { 'Range': 'Dual Fuel' },
  'gas range': { 'Range': 'Gas' },
  'gas': { 'Range': 'Gas', 'Cooktop': 'Gas', 'Dryer': 'Gas' },
  'electric range': { 'Range': 'Electric' },
  'electric': { 'Range': 'Electric', 'Cooktop': 'Electric', 'Dryer': 'Electric' },
  'induction': { 'Range': 'Induction', 'Cooktop': 'Induction' },
  'induction range': { 'Range': 'Induction' },
  
  // ============================================
  // COOKTOP ALIASES
  // ============================================
  'gas cooktop': { 'Cooktop': 'Gas' },
  'electric cooktop': { 'Cooktop': 'Electric' },
  'electric induction': { 'Cooktop': 'Induction' },
  'electric induction cooktop': { 'Cooktop': 'Induction' },
  'induction cooktop': { 'Cooktop': 'Induction' },
  'radiant': { 'Cooktop': 'Electric' },
  'radiant cooktop': { 'Cooktop': 'Electric' },
  
  // ============================================
  // DISHWASHER ALIASES
  // ============================================
  'built-in dishwasher': { 'Dishwasher': 'Drawer' },
  'built in dishwasher': { 'Dishwasher': 'Drawer' },
  'portable': { 'Dishwasher': 'Portable' },
  'portable dishwasher': { 'Dishwasher': 'Portable' },
  'drawer': { 'Dishwasher': 'Drawer', 'Microwave': 'Drawer' },
  'drawer dishwasher': { 'Dishwasher': 'Drawer' },
  'dish drawer': { 'Dishwasher': 'Drawer' },
  
  // ============================================
  // WASHER/DRYER ALIASES
  // ============================================
  'front load': { 'Washer': 'Front Load', 'Dryer': 'Front Load' },
  'front-load': { 'Washer': 'Front Load', 'Dryer': 'Front Load' },
  'front load washer': { 'Washer': 'Front Load' },
  'front loading': { 'Washer': 'Front Load', 'Dryer': 'Front Load' },
  'top load': { 'Washer': 'Top Load', 'Dryer': 'Top Load' },
  'top-load': { 'Washer': 'Top Load', 'Dryer': 'Top Load' },
  'top load washer': { 'Washer': 'Top Load' },
  'top loading': { 'Washer': 'Top Load', 'Dryer': 'Top Load' },
  'electric dryer': { 'Dryer': 'Electric' },
  'gas dryer': { 'Dryer': 'Gas' },
  'unitized': { 'All in One Washer / Dryer': 'Unitized' },
  'stacked': { 'All in One Washer / Dryer': 'Unitized' },
  'laundry center': { 'All in One Washer / Dryer': 'Unitized' },
  
  // ============================================
  // MICROWAVE ALIASES
  // ============================================
  'trim kit': { 'Microwave': 'Trim Kit' },
  'microwave trim kit': { 'Microwave': 'Trim Kit' },
  'installation kit': { 'Microwave': 'Trim Kit' },
  'built-in kit': { 'Microwave': 'Trim Kit' },
  'over the range': { 'Microwave': 'Over-the-Range' },
  'over-the-range': { 'Microwave': 'Over-the-Range' },
  'otr': { 'Microwave': 'Over-the-Range' },
  'countertop': { 'Microwave': 'Countertop' },
  'counter top': { 'Microwave': 'Countertop' },
  'microwave drawer': { 'Microwave': 'Drawer' },
  
  // ============================================
  // RANGE HOOD ALIASES
  // ============================================
  'wall mount': { 'Range Hood': 'Wall Mount' },
  'wall mounted': { 'Range Hood': 'Wall Mount' },
  'chimney': { 'Range Hood': 'Wall Mount' },
  'island': { 'Range Hood': 'Island' },
  'island mount': { 'Range Hood': 'Island' },
  'under cabinet': { 'Range Hood': 'Under Cabinet' },
  'undercabinet': { 'Range Hood': 'Under Cabinet' },
  'insert': { 'Range Hood': 'Insert' },
  'liner': { 'Range Hood': 'Insert' },
  'inline': { 'Range Hood': 'Inline', 'Exhaust Fan': 'Inline' },
  'in-line': { 'Range Hood': 'Inline', 'Exhaust Fan': 'Inline' },
  'downdraft': { 'Range Hood': 'Downdraft' },
  
  // ============================================
  // FREEZER ALIASES
  // ============================================
  'chest': { 'Freezer': 'Chest' },
  'chest freezer': { 'Freezer': 'Chest' },
  'upright': { 'Freezer': 'Upright' },
  'upright freezer': { 'Freezer': 'Upright' },
  
  // ============================================
  // LIGHTING ALIASES
  // ============================================
  'led': { 'Lamp': 'LED', 'Light Bulb': 'LED', 'Recessed Lighting': 'LED' },
  'incandescent': { 'Light Bulb': 'Incandescent' },
  'halogen': { 'Light Bulb': 'Halogen' },
  'mini pendant': { 'Pendant': 'Mini Pendant' },
  'multi light': { 'Pendant': 'Multi-Light' },
  'drum': { 'Pendant': 'Drum' },
  'linear': { 'Pendant': 'Linear', 'Chandelier': 'Linear' },
  
  // ============================================
  // PLUMBING ALIASES
  // ============================================
  'pull-down': { 'Kitchen Faucet': 'Pull-Down' },
  'pull down': { 'Kitchen Faucet': 'Pull-Down' },
  'pulldown': { 'Kitchen Faucet': 'Pull-Down' },
  'pull-out': { 'Kitchen Faucet': 'Pull-Out' },
  'pull out': { 'Kitchen Faucet': 'Pull-Out' },
  'pullout': { 'Kitchen Faucet': 'Pull-Out' },
  'single handle': { 'Kitchen Faucet': 'Single Handle', 'Bathroom Faucet': 'Single Handle' },
  'double handle': { 'Kitchen Faucet': 'Two Handle', 'Bathroom Faucet': 'Widespread' },
  'two handle': { 'Kitchen Faucet': 'Two Handle', 'Bathroom Faucet': 'Widespread' },
  'widespread': { 'Bathroom Faucet': 'Widespread' },
  'centerset': { 'Bathroom Faucet': 'Centerset' },
  'vessel': { 'Bathroom Faucet': 'Vessel' },
  'wall mount faucet': { 'Bathroom Faucet': 'Wall Mount' },
  'freestanding tub': { 'Bathtub': 'Freestanding' },
  'alcove': { 'Bathtub': 'Alcove' },
  'drop-in': { 'Bathtub': 'Drop-In', 'Kitchen Sink': 'Drop-In' },
  'drop in': { 'Bathtub': 'Drop-In', 'Kitchen Sink': 'Drop-In' },
  'undermount': { 'Kitchen Sink': 'Undermount', 'Bathroom Sink': 'Undermount' },
  'farmhouse': { 'Kitchen Sink': 'Apron Front' },
  'apron': { 'Kitchen Sink': 'Apron Front' },
  'apron front': { 'Kitchen Sink': 'Apron Front' },
  'pedestal': { 'Bathroom Sink': 'Pedestal' },
  
  // ============================================
  // HARDWARE ALIASES
  // ============================================
  'entry': { 'Door Hardware: Knob and Lever': 'Entry' },
  'passage': { 'Door Hardware: Knob and Lever': 'Passage' },
  'privacy': { 'Door Hardware: Knob and Lever': 'Privacy' },
  'dummy': { 'Door Hardware: Knob and Lever': 'Dummy' },
  'knob': { 'Cabinet Hardware': 'Knob' },
  'pull': { 'Cabinet Hardware': 'Pull' },
  'handle': { 'Cabinet Hardware': 'Handle', 'Door Hardware: Knob and Lever': 'Entry' },
  'bar pull': { 'Cabinet Hardware': 'Bar Pull' },
  'cup pull': { 'Cabinet Hardware': 'Cup Pull' },
  
  // ============================================
  // OUTDOOR/BBQ ALIASES
  // ============================================
  'built-in grill': { 'Barbeque': 'Built-In Access Doors' },
  'freestanding grill': { 'Barbeque': 'Freestanding' },
  'portable grill': { 'Barbeque': 'Portable' },
  
  // ============================================
  // MISC ALIASES
  // ============================================
  'standard': { 'Bath Fan': 'Standard', 'Exhaust Fan': 'Standard' },
  'flexible': { 'Ducting': 'Flexible' },
  'rigid': { 'Ducting': 'Rigid' },
  'pull-out shelf': { 'Kitchen Storage & Organization': 'Pull-Out Shelf' },
};

/**
 * SEMANTIC EXTRACTION PATTERNS
 * Used to extract type hints from subcategory or description strings
 * Each pattern maps to a category and type when found in text
 */
const SEMANTIC_TYPE_PATTERNS: Array<{
  pattern: RegExp;
  category: string;
  typeName: string;
}> = [
  // Refrigerator patterns
  { pattern: /french\s*door/i, category: 'Refrigerator', typeName: 'French Door' },
  { pattern: /side[\s-]*by[\s-]*side/i, category: 'Refrigerator', typeName: 'Side-by-Side' },
  { pattern: /top[\s-]*freezer/i, category: 'Refrigerator', typeName: 'Top-Freezer' },
  { pattern: /bottom[\s-]*freezer/i, category: 'Refrigerator', typeName: 'Bottom-Freezer' },
  { pattern: /4[\s-]*door|four[\s-]*door|quad[\s-]*door/i, category: 'Refrigerator', typeName: '4-Door Flex' },
  { pattern: /built[\s-]*in.*refrigerator|column.*refrigerator/i, category: 'Refrigerator', typeName: 'Built-In' },
  { pattern: /undercounter|under[\s-]*counter/i, category: 'Refrigerator', typeName: 'Undercounter' },
  { pattern: /wine.*cooler|wine.*refrigerator/i, category: 'Refrigerator', typeName: 'Wine' },
  { pattern: /beverage.*center|beverage.*cooler/i, category: 'Refrigerator', typeName: 'Beverage' },
  
  // Range patterns
  { pattern: /slide[\s-]*in.*range|slide[\s-]*in.*electric|slide[\s-]*in.*gas/i, category: 'Range', typeName: 'Slide-In' },
  { pattern: /freestanding.*range|freestanding.*electric|freestanding.*gas/i, category: 'Range', typeName: 'Freestanding' },
  { pattern: /dual[\s-]*fuel/i, category: 'Range', typeName: 'Dual Fuel' },
  
  // Oven patterns
  { pattern: /single.*wall.*oven|single.*oven/i, category: 'Oven', typeName: 'Single' },
  { pattern: /double.*wall.*oven|double.*oven/i, category: 'Oven', typeName: 'Double Wall' },
  { pattern: /combination.*wall.*oven|combination.*oven|combo.*wall.*oven/i, category: 'Oven', typeName: 'Microwave Combo' },
  { pattern: /microwave.*combo|combo.*microwave|oven.*microwave.*combo/i, category: 'Oven', typeName: 'Microwave Combo' },
  { pattern: /speed.*oven/i, category: 'Oven', typeName: 'Speed Oven' },
  { pattern: /steam.*oven/i, category: 'Oven', typeName: 'Steam' },
  
  // Microwave patterns  
  { pattern: /trim.*kit|installation.*kit|built.*in.*kit/i, category: 'Microwave', typeName: 'Trim Kit' },
  { pattern: /over[\s-]*the[\s-]*range.*microwave|otr.*microwave/i, category: 'Microwave', typeName: 'Over-the-Range' },
  { pattern: /countertop.*microwave/i, category: 'Microwave', typeName: 'Countertop' },
  { pattern: /microwave.*drawer|drawer.*microwave/i, category: 'Microwave', typeName: 'Drawer' },
  { pattern: /built[\s-]*in.*microwave/i, category: 'Microwave', typeName: 'Built-In' },
  
  // Cooktop patterns
  { pattern: /gas.*cooktop/i, category: 'Cooktop', typeName: 'Gas' },
  { pattern: /induction.*cooktop|electric.*induction.*cooktop/i, category: 'Cooktop', typeName: 'Induction' },
  { pattern: /electric.*cooktop|radiant.*cooktop/i, category: 'Cooktop', typeName: 'Electric' },
  
  // Dishwasher patterns
  { pattern: /built[\s-]*in.*dishwasher/i, category: 'Dishwasher', typeName: 'Built-In' },
  { pattern: /portable.*dishwasher/i, category: 'Dishwasher', typeName: 'Portable' },
  { pattern: /drawer.*dishwasher|dish.*drawer/i, category: 'Dishwasher', typeName: 'Drawer' },
  
  // Washer/Dryer patterns
  { pattern: /front[\s-]*load.*washer/i, category: 'Washer', typeName: 'Front Load' },
  { pattern: /top[\s-]*load.*washer/i, category: 'Washer', typeName: 'Top Load' },
  { pattern: /electric.*dryer/i, category: 'Dryer', typeName: 'Electric' },
  { pattern: /gas.*dryer/i, category: 'Dryer', typeName: 'Gas' },
  
  // Freezer patterns
  { pattern: /chest.*freezer/i, category: 'Freezer', typeName: 'Chest' },
  { pattern: /upright.*freezer/i, category: 'Freezer', typeName: 'Upright' },
  
  // Range Hood patterns
  { pattern: /wall[\s-]*mount.*hood|chimney.*hood/i, category: 'Range Hood', typeName: 'Wall Mount' },
  { pattern: /under[\s-]*cabinet.*hood/i, category: 'Range Hood', typeName: 'Under Cabinet' },
  { pattern: /island.*hood/i, category: 'Range Hood', typeName: 'Island' },
  { pattern: /downdraft/i, category: 'Range Hood', typeName: 'Downdraft' },
];

/**
 * Extract type hint from a subcategory or description string using semantic patterns
 * @param text - Text to analyze (e.g., "FRENCH DOOR FREESTANDING REFRIGERATOR")
 * @param category - Target category to filter patterns
 * @returns Matching type name or null
 */
export function extractTypeFromSemanticContext(text: string, category: string): string | null {
  if (!text || !category) return null;
  
  const normalizedCategory = category.toLowerCase().trim();
  
  for (const { pattern, category: patternCat, typeName } of SEMANTIC_TYPE_PATTERNS) {
    // Only apply patterns that match the target category
    if (patternCat.toLowerCase() === normalizedCategory && pattern.test(text)) {
      logger.debug('Semantic type extraction matched', { 
        text: text.substring(0, 50), 
        category, 
        typeName 
      });
      return typeName;
    }
  }
  
  return null;
}

/**
 * Try to resolve a type via alias mapping
 * @param aiType - AI-provided type name
 * @param category - Product category
 * @returns Resolved type name or null
 */
function resolveTypeAlias(aiType: string, category: string): string | null {
  const normalizedInput = aiType.toLowerCase().trim();
  const aliases = TYPE_ALIASES[normalizedInput];
  if (aliases) {
    // Check exact category match
    if (aliases[category]) {
      return aliases[category];
    }
    // Check case-insensitive category match
    for (const [cat, typeName] of Object.entries(aliases)) {
      if (cat.toLowerCase() === category.toLowerCase()) {
        return typeName;
      }
    }
  }
  return null;
}

/**
 * Normalize type name for matching
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes extra spaces
 */
function normalizeTypeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Match AI-derived type to Salesforce Type picklist
 * 
 * @param aiType - Type name from AI analysis
 * @param category - Product category (types are category-specific)
 * @param subcategoryHint - Optional subcategory string for semantic extraction fallback
 * @returns Match result with confidence score
 */
export function matchTypeToPicklist(
  aiType: string | null | undefined,
  category: string,
  subcategoryHint?: string
): TypeMatchResult {
  const originalInput = aiType || '';
  
  // If no type provided, try semantic extraction from subcategory hint
  if (!aiType || !aiType.trim()) {
    if (subcategoryHint) {
      const semanticType = extractTypeFromSemanticContext(subcategoryHint, category);
      if (semanticType) {
        const typePicklistItem = getTypeByName(semanticType);
        if (typePicklistItem) {
          logger.info('Type extracted from subcategory (no AI type provided)', {
            subcategory: subcategoryHint,
            extracted: semanticType,
            category
          });
          return {
            matched: true,
            matchedValue: typePicklistItem,
            confidence: 0.85,
            matchMethod: 'fuzzy',
            originalInput: subcategoryHint
          };
        }
      }
    }
    return {
      matched: false,
      matchedValue: null,
      confidence: 0,
      matchMethod: 'none',
      originalInput
    };
  }

  // Get valid types for this category
  const categoryMapping = getCategoryTypeMapping(category);
  if (!categoryMapping) {
    logger.warn('No type mapping found for category', { category, aiType });
    return {
      matched: false,
      matchedValue: null,
      confidence: 0,
      matchMethod: 'none',
      originalInput
    };
  }

  const validTypes = categoryMapping.types;
  const normalizedInput = normalizeTypeName(aiType);

  // TRY 0: Alias resolution (handles common AI descriptions like "Built-In Oven" → "Single" for Oven)
  const aliasResolved = resolveTypeAlias(aiType, category);
  if (aliasResolved) {
    const aliasType = validTypes.find(t => t.type_name.toLowerCase() === aliasResolved.toLowerCase());
    if (aliasType) {
      const typePicklistItem = getTypeByName(aliasType.type_name);
      if (typePicklistItem) {
        logger.info('Type matched (alias resolution)', {
          input: aiType,
          alias: aliasResolved,
          matched: aliasType.type_name,
          category,
          confidence: 0.95
        });
        return {
          matched: true,
          matchedValue: typePicklistItem,
          confidence: 0.95,
          matchMethod: 'fuzzy',
          originalInput
        };
      }
    }
  }

  // TRY 1: Exact match (case-insensitive)
  for (const type of validTypes) {
    if (normalizeTypeName(type.type_name) === normalizedInput) {
      const typePicklistItem = getTypeByName(type.type_name);
      if (typePicklistItem) {
        logger.info('Type matched (exact)', {
          input: aiType,
          matched: type.type_name,
          category,
          confidence: 1.0
        });
        return {
          matched: true,
          matchedValue: typePicklistItem,
          confidence: 1.0,
          matchMethod: 'exact',
          originalInput
        };
      }
    }
  }

  // TRY 2: Partial match - check if input contains type or vice versa
  for (const type of validTypes) {
    const normalizedType = normalizeTypeName(type.type_name);
    
    // Input contains the full type name
    if (normalizedInput.includes(normalizedType)) {
      const typePicklistItem = getTypeByName(type.type_name);
      if (typePicklistItem) {
        logger.info('Type matched (partial - input contains type)', {
          input: aiType,
          matched: type.type_name,
          category,
          confidence: 0.9
        });
        return {
          matched: true,
          matchedValue: typePicklistItem,
          confidence: 0.9,
          matchMethod: 'fuzzy',
          originalInput
        };
      }
    }
    
    // Type name contains the input
    if (normalizedType.includes(normalizedInput)) {
      const typePicklistItem = getTypeByName(type.type_name);
      if (typePicklistItem) {
        logger.info('Type matched (partial - type contains input)', {
          input: aiType,
          matched: type.type_name,
          category,
          confidence: 0.85
        });
        return {
          matched: true,
          matchedValue: typePicklistItem,
          confidence: 0.85,
          matchMethod: 'fuzzy',
          originalInput
        };
      }
    }
  }

  // TRY 3: Token matching - check if key words overlap
  const inputTokens = normalizedInput.split(' ').filter(t => t.length > 2);
  if (inputTokens.length > 0) {
    for (const type of validTypes) {
      const typeTokens = normalizeTypeName(type.type_name).split(' ').filter(t => t.length > 2);
      const matchingTokens = inputTokens.filter(token => typeTokens.includes(token));
      
      // If more than 50% of tokens match, consider it a match
      const matchRatio = matchingTokens.length / Math.max(inputTokens.length, typeTokens.length);
      if (matchRatio >= 0.5) {
        const typePicklistItem = getTypeByName(type.type_name);
        if (typePicklistItem) {
          logger.info('Type matched (token overlap)', {
            input: aiType,
            matched: type.type_name,
            category,
            matchRatio,
            confidence: 0.7 + (matchRatio * 0.2)
          });
          return {
            matched: true,
            matchedValue: typePicklistItem,
            confidence: 0.7 + (matchRatio * 0.2),
            matchMethod: 'fuzzy',
            originalInput
          };
        }
      }
    }
  }

  // TRY 4: Semantic extraction from subcategory hint as last resort
  if (subcategoryHint) {
    const semanticType = extractTypeFromSemanticContext(subcategoryHint, category);
    if (semanticType) {
      const typePicklistItem = getTypeByName(semanticType);
      if (typePicklistItem) {
        logger.info('Type matched (semantic extraction fallback)', {
          input: aiType,
          subcategory: subcategoryHint,
          extracted: semanticType,
          category,
          confidence: 0.8
        });
        return {
          matched: true,
          matchedValue: typePicklistItem,
          confidence: 0.8,
          matchMethod: 'fuzzy',
          originalInput
        };
      }
    }
  }

  // NO MATCH FOUND
  logger.warn('Type not matched to picklist', {
    input: aiType,
    category,
    validTypesCount: validTypes.length
  });

  return {
    matched: false,
    matchedValue: null,
    confidence: 0,
    matchMethod: 'none',
    originalInput
  };
}

/**
 * Validate that a type is valid for a given category
 * Returns validation result with reason if invalid
 */
export function validateTypeForCategory(
  typeName: string,
  categoryName: string
): { valid: boolean; reason?: string } {
  if (!typeName || !categoryName) {
    return {
      valid: false,
      reason: 'Missing type or category name'
    };
  }

  const isValid = isValidTypeForCategory(typeName, categoryName);
  
  if (!isValid) {
    const categoryMapping = getCategoryTypeMapping(categoryName);
    const validTypes = categoryMapping
      ? categoryMapping.types.map(t => t.type_name).slice(0, 5)
      : [];
    
    return {
      valid: false,
      reason: `Type "${typeName}" is not valid for category "${categoryName}". Valid options include: ${validTypes.join(', ')}${categoryMapping && categoryMapping.types.length > 5 ? '...' : ''}`
    };
  }

  return { valid: true };
}
