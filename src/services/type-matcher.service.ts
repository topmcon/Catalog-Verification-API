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
  'built-in': { 'Oven': 'Single', 'Refrigerator': 'Column', 'Dishwasher': 'Drawer', 'Microwave': 'Built-In', 'Icemaker': 'Undercounter' },
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
  'single door': { 'Refrigerator': 'Single Door' },
  'single door refrigerator': { 'Refrigerator': 'Single Door' },
  'single-door': { 'Refrigerator': 'Single Door' },
  'compact': { 'Refrigerator': 'Single Door' },
  'compact refrigerator': { 'Refrigerator': 'Single Door' },
  'mini fridge': { 'Refrigerator': 'Single Door' },
  'mini refrigerator': { 'Refrigerator': 'Single Door' },
  'top freezer': { 'Refrigerator': 'Top-Freezer' },
  'top freezer refrigerator': { 'Refrigerator': 'Top-Freezer' },
  'top-freezer': { 'Refrigerator': 'Top-Freezer' },
  'top mount': { 'Refrigerator': 'Top-Freezer', 'Kitchen Sink': 'Drop-In', 'Bathroom Sink': 'Drop-In' },
  'bottom freezer': { 'Refrigerator': 'Bottom-Freezer' },
  'bottom freezer refrigerator': { 'Refrigerator': 'Bottom-Freezer' },
  'bottom-freezer': { 'Refrigerator': 'Bottom-Freezer' },
  'bottom mount': { 'Refrigerator': 'Bottom-Freezer' },
  'built-in refrigerator': { 'Refrigerator': 'Column' },
  'built-in microwave': { 'Microwave': 'Built-In' },
  'built in microwave': { 'Microwave': 'Built-In' },
  'built in': { 'Refrigerator': 'Column', 'Dishwasher': 'Drawer', 'Microwave': 'Built-In', 'Icemaker': 'Undercounter' },
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
  'gas': { 'Range': 'Gas', 'Cooktop': 'Gas' },
  'electric range': { 'Range': 'Electric' },
  'electric': { 'Range': 'Electric', 'Cooktop': 'Electric' },
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
  'unitized': { 'All in One Washer / Dryer': 'Unitized', 'Dryer': 'Unitized' },
  'stacked': { 'All in One Washer / Dryer': 'Unitized' },
  'laundry center': { 'All in One Washer / Dryer': 'Unitized' },
  'ventless': { 'All in One Washer / Dryer': 'Ventless' },
  'vent-free': { 'All in One Washer / Dryer': 'Ventless' },
  'condensing dryer': { 'All in One Washer / Dryer': 'Ventless' },
  
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
  'island': { 'Range Hood': 'Island', 'Pendant': 'Island' },
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
  '1 light': { 'Lighting': '1-Light', 'Vanity Light': '1-Light' },
  '1-light': { 'Lighting': '1-Light', 'Vanity Light': '1-Light' },
  'single light': { 'Lighting': '1-Light', 'Vanity Light': '1-Light' },
  '3 light': { 'Lighting': '3-Light', 'Vanity Light': '3-Light' },
  '3-light': { 'Lighting': '3-Light', 'Vanity Light': '3-Light' },
  'three light': { 'Lighting': '3-Light', 'Vanity Light': '3-Light' },
  '4 light': { 'Lighting': '4-Light', 'Vanity Light': '4-Light' },
  '4-light': { 'Lighting': '4-Light', 'Vanity Light': '4-Light' },
  'four light': { 'Lighting': '4-Light', 'Vanity Light': '4-Light' },
  '5 light': { 'Lighting': '5-Light', 'Vanity Light': '5-Light' },
  '5-light': { 'Lighting': '5-Light', 'Vanity Light': '5-Light' },
  'five light': { 'Lighting': '5-Light', 'Vanity Light': '5-Light' },
  '6 light': { 'Lighting': '6-Light', 'Vanity Light': '6-Light' },
  '6-light': { 'Lighting': '6-Light', 'Vanity Light': '6-Light' },
  'six light': { 'Lighting': '6-Light', 'Vanity Light': '6-Light' },
  
  // ============================================
  // PLUMBING ALASES - Kitchen Faucets
  // ============================================
  'pull-down': { 'Kitchen Faucet': 'Pull-Down' },
  'pull down': { 'Kitchen Faucet': 'Pull-Down' },
  'pulldown': { 'Kitchen Faucet': 'Pull-Down' },
  'pull-out': { 'Kitchen Faucet': 'Pull-Out' },
  'pull out': { 'Kitchen Faucet': 'Pull-Out' },
  'pullout': { 'Kitchen Faucet': 'Pull-Out' },
  'single handle': { 'Kitchen Faucet': 'Single Handle', 'Bathroom Faucet': 'Single Hole' },
  'double handle': { 'Kitchen Faucet': 'Two Handle', 'Bathroom Faucet': 'Widespread' },
  'two handle': { 'Kitchen Faucet': 'Two Handle', 'Bathroom Faucet': 'Widespread' },
  'pot filler': { 'Kitchen Faucet': 'Pot Filler', 'Pot Filler Faucet': 'Wall Mount' },
  'bar faucet': { 'Kitchen Faucet': 'Bar Prep', 'Bar Faucet': 'Single Hole' },
  'commercial style': { 'Kitchen Faucet': 'Commercial Style' },
  'commercial kitchen': { 'Kitchen Faucet': 'Commercial Style' },
  'pro style': { 'Kitchen Faucet': 'Commercial Style' },
  'touch on': { 'Kitchen Faucet': 'Touch-On' },
  'touch-on': { 'Kitchen Faucet': 'Touch-On' },
  'touch activated': { 'Kitchen Faucet': 'Touch-On' },
  
  // ============================================
  // PLUMBINGALIASES - Bathroom Faucets
  // ============================================
  'widespread': { 'Bathroom Faucet': 'Widespread' },
  'centerset': { 'Bathroom Faucet': 'Centerset' },
  'single hole': { 'Bathroom Faucet': 'Single Hole' },
  'monoblock': { 'Bathroom Faucet': 'Single Hole' },
  'mono-block': { 'Bathroom Faucet': 'Single Hole' },
  'one hole': { 'Bathroom Faucet': 'Single Hole' },
  '1 hole': { 'Bathroom Faucet': 'Single Hole' },
  'vessel': { 'Bathroom Faucet': 'Vessel' },
  'vessel faucet': { 'Bathroom Faucet': 'Vessel' },
  'wall mount faucet': { 'Bathroom Faucet': 'Wall Mount' },
  'wall mounted faucet': { 'Bathroom Faucet': 'Wall Mount' },
  'touchless': { 'Bathroom Faucet': 'Touchless', 'Kitchen Faucet': 'Touchless' },
  'sensor faucet': { 'Bathroom Faucet': 'Touchless', 'Kitchen Faucet': 'Touchless' },
  'wall mount bathroom': { 'Bathroom Faucet': 'Wall Mount' },
  
  // ============================================
  // PLUMBING ALIASES - Tub & Shower Faucets
  // ============================================
  'roman tub': { 'Tub Faucet': 'Deck Mount' },
  'deck mount': { 'Tub Faucet': 'Deck Mount', 'Kitchen Faucet': 'Deck Mount' },
  'deck mounted': { 'Tub Faucet': 'Deck Mount', 'Kitchen Faucet': 'Deck Mount' },
  'roman tub faucet': { 'Tub Faucet': 'Deck Mount' },
  'deck mount tub': { 'Tub Faucet': 'Deck Mount' },
  'tub filler': { 'Tub Faucet': 'Freestanding', 'Pot Filler Faucet': 'Wall Mount' },
  'freestanding tub filler': { 'Tub Faucet': 'Freestanding' },
  'freestanding tub faucet': { 'Tub Faucet': 'Freestanding' },
  'thermostatic': { 'Showerheads & Accessories': 'Thermostatic' },
  'pressure balance': { 'Showerheads & Accessories': 'Pressure Balance' },
  'shower system': { 'Showerheads & Accessories': 'Shower System', 'Shower': 'Shower System' },
  'shower tower': { 'Showerheads & Accessories': 'Shower System', 'Shower': 'Shower System' },
  'rain shower': { 'Showerheads & Accessories': 'Rain' },
  'body spray': { 'Showerheads & Accessories': 'Body Spray' },
  
  // ============================================
  // PLUMBING ALIASES - Sinks & Bathtubs
  // ============================================
  'freestanding tub': { 'Bathtub': 'Freestanding' },
  'alcove': { 'Bathtub': 'Alcove' },
  'alcove tub': { 'Bathtub': 'Alcove' },
  'drop-in': { 'Bathtub': 'Drop-In', 'Kitchen Sink': 'Drop-In' },
  'drop in': { 'Bathtub': 'Drop-In', 'Kitchen Sink': 'Drop-In' },
  'drop-in sink': { 'Kitchen Sink': 'Drop-In', 'Bathroom Sink': 'Drop-In' },
  'topmount': { 'Kitchen Sink': 'Drop-In', 'Bathroom Sink': 'Drop-In' },
  'undermount': { 'Kitchen Sink': 'Undermount', 'Bathroom Sink': 'Undermount' },
  'undermount sink': { 'Kitchen Sink': 'Undermount', 'Bathroom Sink': 'Undermount' },
  'under mount': { 'Kitchen Sink': 'Undermount', 'Bathroom Sink': 'Undermount' },
  'farmhouse': { 'Kitchen Sink': 'Apron Front' },
  'farmhouse sink': { 'Kitchen Sink': 'Apron Front' },
  'apron': { 'Kitchen Sink': 'Apron Front' },
  'apron front': { 'Kitchen Sink': 'Apron Front' },
  'apron front sink': { 'Kitchen Sink': 'Apron Front' },
  'single bowl': { 'Kitchen Sink': 'Single Bowl', 'Bar & Prep Sink': 'Single Bowl' },
  'single basin': { 'Kitchen Sink': 'Single Bowl', 'Bathroom Sink': 'Single Bowl' },
  'double bowl': { 'Kitchen Sink': 'Double Bowl' },
  'double basin': { 'Kitchen Sink': 'Double Bowl' },
  'triple bowl': { 'Kitchen Sink': 'Triple Bowl' },
  'triple basin': { 'Kitchen Sink': 'Triple Bowl' },
  'pedestal': { 'Bathroom Sink': 'Pedestal' },
  'pedestal sink': { 'Bathroom Sink': 'Pedestal' },
  'console': { 'Bathroom Sink': 'Console' },
  'wall hung': { 'Bathroom Sink': 'Wall Mount', 'Toilet': 'Wall Mount' },
  'wall-hung': { 'Bathroom Sink': 'Wall Mount', 'Toilet': 'Wall Mount' },
  
  // ============================================
  // TOILET ALIASES
  // ============================================
  'comfort height': { 'Toilet': 'Comfort Height' },
  'comfort height toilet': { 'Toilet': 'Comfort Height' },
  'chair height': { 'Toilet': 'Comfort Height' },
  'right height': { 'Toilet': 'Comfort Height' },
  'dual flush': { 'Toilet': 'Dual-Flush' },
  'dual-flush': { 'Toilet': 'Dual-Flush' },
  'dual flush toilet': { 'Toilet': 'Dual-Flush' },
  'gravity flush': { 'Toilet': 'Gravity' },
  'gravity toilet': { 'Toilet': 'Gravity' },
  'pressure assisted': { 'Toilet': 'Pressure-Assisted' },
  'pressure-assisted': { 'Toilet': 'Pressure-Assisted' },
  'power flush': { 'Toilet': 'Pressure-Assisted' },
  'round front': { 'Toilet': 'Round-Front' },
  'round-front': { 'Toilet': 'Round-Front' },
  'round bowl': { 'Toilet': 'Round-Front' },
  'elongated': { 'Toilet': 'Elongated' },
  'elongated bowl': { 'Toilet': 'Elongated' },
  'smart toilet': { 'Toilet': 'Smart/Electronic' },
  'electronic toilet': { 'Toilet': 'Smart/Electronic' },
  'bidet toilet': { 'Toilet': 'Smart/Electronic' },
  'intelligent toilet': { 'Toilet': 'Smart/Electronic' },
  'standard height': { 'Toilet': 'Standard Height' },
  'standard height toilet': { 'Toilet': 'Standard Height' },
  'wall hung toilet': { 'Toilet': 'Wall-Hung' },
  'wall-hung toilet': { 'Toilet': 'Wall-Hung' },
  'wall mount toilet': { 'Toilet': 'Wall-Hung' },
  
  // ============================================
  // BATHROOM HARDWARE ALIASES
  // ============================================
  'towel bar': { 'Bathroom Hardware and Accessories': 'Towel Bar' },
  'towel rack': { 'Bathroom Hardware and Accessories': 'Towel Bar' },
  'toilet paper holder': { 'Bathroom Hardware and Accessories': 'Toilet Paper Holder' },
  'toilet tissue holder': { 'Bathroom Hardware and Accessories': 'Toilet Paper Holder' },
  'tissue holder': { 'Bathroom Hardware and Accessories': 'Toilet Paper Holder' },
  'toilet paper': { 'Bathroom Hardware and Accessories': 'Toilet Paper Holder' },
  'tp holder': { 'Bathroom Hardware and Accessories': 'Toilet Paper Holder' },
  'robe hook': { 'Bathroom Hardware and Accessories': 'Robe Hook' },
  'towel hook': { 'Bathroom Hardware and Accessories': 'Towel Hook' },
  'towel ring': { 'Bathroom Hardware and Accessories': 'Towel Ring' },
  'soap dispenser': { 'Bathroom Hardware and Accessories': 'Soap Dispenser' },
  'soap dish': { 'Bathroom Hardware and Accessories': 'Soap Dish' },
  'towel warmer': { 'Bathroom Hardware and Accessories': 'Towel Warmer' },
  'grab bar': { 'Bathroom Hardware and Accessories': 'Grab Bar' },
  'safety bar': { 'Bathroom Hardware and Accessories': 'Grab Bar' },
  
  // ============================================
  // MEDICINE CABINET & MIRROR ALIASES
  // ============================================
  'medicine cabinet': { 'Medicine Cabinet': 'Medicine Cabinet' },
  'medicine cab': { 'Medicine Cabinet': 'Medicine Cabinet' },
  'recessed cabinet': { 'Medicine Cabinet': 'Recessed' },
  'surface mount': { 'Medicine Cabinet': 'Surface Mount' },
  'surface mounted': { 'Medicine Cabinet': 'Surface Mount' },
  'wall mirror': { 'Medicine Cabinet': 'Wall Mirror', 'Bathroom Mirror': 'Wall Mirror' },
  'vanity mirror': { 'Medicine Cabinet': 'Vanity Mirror', 'Bathroom Mirror': 'Vanity Mirror' },
  'lighted mirror': { 'Bathroom Mirror': 'Lighted' },
  'led mirror': { 'Bathroom Mirror': 'Lighted' }, // 'LED' is not a valid type — map to 'Lighted'
  'led bathroom mirror': { 'Bathroom Mirror': 'Lighted' },
  'lighted bathroom mirror': { 'Bathroom Mirror': 'Lighted' },
  'mirror with led': { 'Bathroom Mirror': 'Lighted' },
  'mirror with light': { 'Bathroom Mirror': 'Lighted' },
  'mirror with lighting': { 'Bathroom Mirror': 'Lighted' },
  'backlit mirror': { 'Bathroom Mirror': 'Lighted' },
  'back-lit mirror': { 'Bathroom Mirror': 'Lighted' },
  'illuminated mirror': { 'Bathroom Mirror': 'Lighted' },
  'vanity lighted mirror': { 'Bathroom Mirror': 'Lighted' },
  'lighted wall mirror': { 'Bathroom Mirror': 'Lighted' },
  
  // ============================================
  // CEILING FAN ALIASES
  // ============================================
  'indoor': { 'Ceiling Fan': 'Indoor' },
  'indoor fan': { 'Ceiling Fan': 'Indoor' },
  'outdoor': { 'Ceiling Fan': 'Outdoor', 'Pendant': 'Outdoor', 'Chandelier': 'Outdoor' },
  'outdoor fan': { 'Ceiling Fan': 'Outdoor' },
  'hugger': { 'Ceiling Fan': 'Hugger' },
  'hugger fan': { 'Ceiling Fan': 'Hugger' },
  'flush mount fan': { 'Ceiling Fan': 'Hugger' },
  'low profile': { 'Ceiling Fan': 'Hugger' },
  'downrod': { 'Ceiling Fan': 'Downrod' },
  'downrod fan': { 'Ceiling Fan': 'Downrod' },
  'dual mount': { 'Ceiling Fan': 'Dual Mount' },
  
  // ============================================
  // LIGHTING ACCESSORIES ALIASES
  // ============================================
  'ceiling canopy': { 'Lighting Accessory': 'Canopy' },
  'canopy kit': { 'Lighting Accessory': 'Canopy' },
  'ceiling fan downrod': { 'Ceiling Fan Accessory': 'Downrod' },
  'ceiling fan accessory': { 'Ceiling Fan Accessory': 'Accessory' },
  'fan light kit': { 'Ceiling Fan Accessory': 'Light Kit' },
  'light kit': { 'Ceiling Fan Accessory': 'Light Kit' },
  
  // ============================================
  // RECESSED LIGHTING ALIASES
  // ============================================
  'canless': { 'Recessed Lighting': 'Canless' },
  'canless recessed': { 'Recessed Lighting': 'Canless' },
  'wafer': { 'Recessed Lighting': 'Canless' },
  'gimbal': { 'Recessed Lighting': 'Gimbal' },
  'adjustable': { 'Recessed Lighting': 'Adjustable' },
  'baffle': { 'Recessed Lighting': 'Baffle' },
  'retrofit': { 'Recessed Lighting': 'Retrofit' },
  'new construction': { 'Recessed Lighting': 'New Construction' },
  
  // ============================================
  // PENDANT & CHANDELIER ALIASES
  // ============================================
  'mini pendant': { 'Pendant': 'Mini Pendant' },
  'mini': { 'Pendant': 'Mini Pendant' },
  'multi light': { 'Pendant': 'Multi-Light', 'Chandelier': 'Multi-Light' },
  'multi-light': { 'Pendant': 'Multi-Light', 'Chandelier': 'Multi-Light' },
  'cluster': { 'Pendant': 'Multi-Light', 'Chandelier': 'Cluster' },
  'drum': { 'Pendant': 'Drum' },
  'drum pendant': { 'Pendant': 'Drum' },
  'linear': { 'Pendant': 'Linear', 'Chandelier': 'Linear' },
  'linear pendant': { 'Pendant': 'Linear' },
  'kitchen island': { 'Pendant': 'Island' },
  'globe': { 'Pendant': 'Globe' },
  'lantern': { 'Pendant': 'Lantern', 'Chandelier': 'Lantern' },
  'commercial lantern': { 'Chandelier': 'Lantern' },
  'candelabra': { 'Chandelier': 'Candelabra' },
  'crystal': { 'Chandelier': 'Crystal' },
  'flush mount': { 'Flush and Semi-Flush': 'Flush Mount' },
  'semi flush': { 'Flush and Semi-Flush': 'Semi-Flush' },
  'semi-flush': { 'Flush and Semi-Flush': 'Semi-Flush' },
  
  // ============================================
  // VANITY LIGHTING ALIASES
  // ============================================
  'vanity': { 'Bathroom Lighting': 'Vanity' },
  'vanity light': { 'Bathroom Lighting': 'Vanity' },
  'bath bar': { 'Bathroom Lighting': 'Vanity' },
  'bathroom vanity': { 'Bathroom Lighting': 'Vanity' },
  
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
  // Valid Barbeque types: Gas, Electric, Charcoal, Pellet, Kamado, Wood-Fired, Accessory
  // ============================================
  'gas grill': { 'Barbeque': 'Gas' },
  'propane grill': { 'Barbeque': 'Gas' },
  'natural gas grill': { 'Barbeque': 'Gas' },
  'electric grill': { 'Barbeque': 'Electric' },
  'charcoal grill': { 'Barbeque': 'Charcoal' },
  'pellet grill': { 'Barbeque': 'Pellet' },
  'wood pellet': { 'Barbeque': 'Pellet' },
  'kamado': { 'Barbeque': 'Kamado' },
  'wood-fired': { 'Barbeque': 'Wood-Fired' },
  'wood fired': { 'Barbeque': 'Wood-Fired' },
  // BBQ Accessories
  'grill cart': { 'Barbeque': 'Accessory' },
  'flat top grill cart': { 'Barbeque': 'Accessory' },
  'grill cover': { 'Barbeque': 'Accessory' },
  'grill accessory': { 'Barbeque': 'Accessory' },
  'side burner': { 'Barbeque': 'Accessory' },
  'rotisserie': { 'Barbeque': 'Accessory' },
  'grill mat': { 'Barbeque': 'Accessory' },
  'grill tool': { 'Barbeque': 'Accessory' },
  'grill brush': { 'Barbeque': 'Accessory' },
  'smoker box': { 'Barbeque': 'Accessory' },
  'warming rack': { 'Barbeque': 'Accessory' },
  'griddle plate': { 'Barbeque': 'Accessory' },
  
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
  { pattern: /single[\s-]*door|compact.*refrigerator|mini.*fridge/i, category: 'Refrigerator', typeName: 'Single Door' },
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
  { pattern: /front[\s-]*load.*dryer/i, category: 'Dryer', typeName: 'Front Load' },
  { pattern: /top[\s-]*load.*dryer/i, category: 'Dryer', typeName: 'Top Load' },
  { pattern: /unitized.*dryer|laundry.*center/i, category: 'Dryer', typeName: 'Unitized' },
  
  // Freezer patterns
  { pattern: /chest.*freezer/i, category: 'Freezer', typeName: 'Chest' },
  { pattern: /upright.*freezer/i, category: 'Freezer', typeName: 'Upright' },
  
  // Drawer patterns (standalone drawer appliances)
  { pattern: /warming.*drawer/i, category: 'Drawer', typeName: 'Warming' },
  { pattern: /storage.*drawer/i, category: 'Drawer', typeName: 'Storage' },
  { pattern: /refrigerat.*drawer/i, category: 'Drawer', typeName: 'Refrigerator Drawer' },
  
  // Bathroom Mirror — lighted detection
  // These patterns fire on Ferguson_Title, Web_Retailer title, or any hint text describing a mirror
  // that has integrated LED / light features.  Must come BEFORE generic lighting patterns.
  { pattern: /lighted\s+(?:wall\s+|vanity\s+|bathroom\s+)?mirror|illuminated\s+mirror|backlit\s+mirror|back-lit\s+mirror/i, category: 'Bathroom Mirror', typeName: 'Lighted' },
  { pattern: /led\s+(?:wall\s+|vanity\s+|bathroom\s+)?mirror|mirror\s+with\s+(?:led|integrated\s+led|built(?:-|\s)in\s+led)/i, category: 'Bathroom Mirror', typeName: 'Lighted' },
  { pattern: /mirror\s+with\s+(?:led\s+)?light(?:ing)?\b/i, category: 'Bathroom Mirror', typeName: 'Lighted' },
  { pattern: /(?:led|integrated|built(?:-|\s)in)\s+light(?:ing)?\s+(?:mirror|bathroom|vanity)/i, category: 'Bathroom Mirror', typeName: 'Lighted' },
  // mirror defogger almost always means built-in light
  { pattern: /mirror\s+defog(?:ger)?/i, category: 'Bathroom Mirror', typeName: 'Lighted' },

  // Lighting patterns (light count)
  { pattern: /\b1[\s-]*light|single[\s-]*light/i, category: 'Lighting', typeName: '1-Light' },
  { pattern: /\b3[\s-]*light|three[\s-]*light/i, category: 'Lighting', typeName: '3-Light' },
  { pattern: /\b4[\s-]*light|four[\s-]*light/i, category: 'Lighting', typeName: '4-Light' },
  { pattern: /\b5[\s-]*light|five[\s-]*light/i, category: 'Lighting', typeName: '5-Light' },
  { pattern: /\b6[\s-]*light|six[\s-]*light/i, category: 'Lighting', typeName: '6-Light' },
  
  // Toilet patterns
  { pattern: /comfort[\s-]*height|chair[\s-]*height|right[\s-]*height/i, category: 'Toilet', typeName: 'Comfort Height' },
  { pattern: /dual[\s-]*flush/i, category: 'Toilet', typeName: 'Dual-Flush' },
  { pattern: /gravity[\s-]*flush/i, category: 'Toilet', typeName: 'Gravity' },
  { pattern: /pressure[\s-]*assisted|power[\s-]*flush/i, category: 'Toilet', typeName: 'Pressure-Assisted' },
  { pattern: /round[\s-]*front|round[\s-]*bowl/i, category: 'Toilet', typeName: 'Round-Front' },
  { pattern: /elongated[\s-]*bowl/i, category: 'Toilet', typeName: 'Elongated' },
  { pattern: /smart.*toilet|electronic.*toilet|bidet.*toilet|intelligent.*toilet/i, category: 'Toilet', typeName: 'Smart/Electronic' },
  { pattern: /standard[\s-]*height.*toilet/i, category: 'Toilet', typeName: 'Standard Height' },
  { pattern: /wall[\s-]*hung.*toilet|wall[\s-]*mount.*toilet/i, category: 'Toilet', typeName: 'Wall-Hung' },
  
  // Kitchen Faucet patterns
  { pattern: /commercial[\s-]*style|pro[\s-]*style/i, category: 'Kitchen Faucet', typeName: 'Commercial Style' },
  { pattern: /touch[\s-]*on|touch[\s-]*activated/i, category: 'Kitchen Faucet', typeName: 'Touch-On' },
  
  // Range Hood patterns
  { pattern: /wall[\s-]*mount.*hood|chimney.*hood/i, category: 'Range Hood', typeName: 'Wall Mount' },
  { pattern: /under[\s-]*cabinet.*hood/i, category: 'Range Hood', typeName: 'Under Cabinet' },
  { pattern: /island.*hood/i, category: 'Range Hood', typeName: 'Island' },
  { pattern: /downdraft/i, category: 'Range Hood', typeName: 'Downdraft' },
  
  // Barbeque patterns - Valid types: Gas, Electric, Charcoal, Pellet, Kamado, Wood-Fired, Accessory
  { pattern: /gas\s*grill|propane|natural\s*gas/i, category: 'Barbeque', typeName: 'Gas' },
  { pattern: /electric\s*grill/i, category: 'Barbeque', typeName: 'Electric' },
  { pattern: /charcoal/i, category: 'Barbeque', typeName: 'Charcoal' },
  { pattern: /pellet|wood\s*pellet/i, category: 'Barbeque', typeName: 'Pellet' },
  { pattern: /kamado|ceramic\s*cooker/i, category: 'Barbeque', typeName: 'Kamado' },
  { pattern: /wood[\s-]*fired/i, category: 'Barbeque', typeName: 'Wood-Fired' },
  // BBQ Accessories
  { pattern: /grill\s*cart|flat\s*top.*cart/i, category: 'Barbeque', typeName: 'Accessory' },
  { pattern: /grill\s*cover/i, category: 'Barbeque', typeName: 'Accessory' },
  { pattern: /side\s*burner/i, category: 'Barbeque', typeName: 'Accessory' },
  { pattern: /rotisserie/i, category: 'Barbeque', typeName: 'Accessory' },
  { pattern: /grill\s*mat|grill\s*tool|grill\s*brush/i, category: 'Barbeque', typeName: 'Accessory' },
  { pattern: /smoker\s*box|warming\s*rack|griddle\s*plate/i, category: 'Barbeque', typeName: 'Accessory' },
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
  
  // Get valid types for this category FIRST (needed for validation)
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
  
  // If no type provided, try semantic extraction from subcategory hint
  // BUT ONLY if the extracted type is valid for this category
  if (!aiType || !aiType.trim()) {
    if (subcategoryHint) {
      const semanticType = extractTypeFromSemanticContext(subcategoryHint, category);
      if (semanticType) {
        // ⚠️ CRITICAL: Validate extracted type is valid for this category
        const isValidForCategory = validTypes.some(t => 
          t.type_name.toLowerCase() === semanticType.toLowerCase()
        );
        
        if (isValidForCategory) {
          const typePicklistItem = getTypeByName(semanticType);
          if (typePicklistItem) {
            logger.info('Type extracted from subcategory hint (validated for category)', {
              subcategory: subcategoryHint,
              extracted: semanticType,
              category,
              validForCategory: true
            });
            return {
              matched: true,
              matchedValue: typePicklistItem,
              confidence: 0.85,
              matchMethod: 'fuzzy',
              originalInput: subcategoryHint
            };
          }
        } else {
          logger.warn('Type extracted from subcategory but NOT valid for category - ignoring', {
            subcategory: subcategoryHint,
            extracted: semanticType,
            category,
            validTypesForCategory: validTypes.map(t => t.type_name).slice(0, 10)
          });
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

  // Category mapping and validTypes already retrieved above
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
