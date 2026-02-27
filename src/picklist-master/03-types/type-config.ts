/**
 * TYPE CONFIGURATION
 * ==================
 * Type is the NEW middle layer between Category and Style.
 * Types represent functional variations or configurations within a category.
 * 
 * Example: Refrigerator → 4-Door Flex (Type) → French Door (Style)
 * 
 * **PICKLIST SYNC**: When Salesforce updates types.json, validate mappings here.
 * Last review: 2026-02-09
 */

import typesPicklist from '../../config/salesforce-picklists/types.json';
import categoryTypeMappingPicklist from '../../config/salesforce-picklists/category-type-mapping.json';

// ============================================
// TYPE INTERFACES
// ============================================

export interface TypePicklistItem {
  type_name: string;
  type_id: string;
  status: 'existing' | 'new_needed';
  applicable_categories?: Array<{
    department: string;
    category_name: string;
  }>;
}

export interface CategoryTypeMapping {
  department_name: string;
  family_name: string;
  category_name: string;
  category_id: string;
  filter_label: string;
  logic: string;
  types: Array<{
    type_name: string;
    status: 'existing' | 'new_needed';
    primary_filter: boolean;
  }>;
}

export interface CategoryTypeMappingData {
  metadata: {
    version: string;
    created: string;
    purpose: string;
    hierarchy: string;
    note: string;
  };
  mappings: CategoryTypeMapping[];
}

// ============================================
// PICKLIST DATA
// ============================================

/**
 * All types from Salesforce types.json
 */
export const TYPES: TypePicklistItem[] = typesPicklist as TypePicklistItem[];

/**
 * Category to Type mappings from Salesforce category-type-mapping.json
 */
export const CATEGORY_TYPE_MAPPINGS: CategoryTypeMappingData = categoryTypeMappingPicklist as CategoryTypeMappingData;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all types for a specific category
 */
export function getTypesForCategory(categoryName: string): TypePicklistItem[] {
  return TYPES.filter(type => 
    type.applicable_categories?.some(cat => 
      cat.category_name.toLowerCase() === categoryName.toLowerCase()
    )
  );
}

/**
 * Get type by ID
 */
export function getTypeById(typeId: string): TypePicklistItem | undefined {
  return TYPES.find(type => type.type_id === typeId);
}

/**
 * Get type by name
 */
export function getTypeByName(typeName: string): TypePicklistItem | undefined {
  return TYPES.find(type => 
    type.type_name.toLowerCase() === typeName.toLowerCase()
  );
}

/**
 * Get category-type mapping for a specific category
 */
export function getCategoryTypeMapping(categoryName: string): CategoryTypeMapping | undefined {
  return CATEGORY_TYPE_MAPPINGS.mappings.find(mapping => 
    mapping.category_name.toLowerCase() === categoryName.toLowerCase()
  );
}

/**
 * Check if a type is valid for a category
 */
export function isValidTypeForCategory(typeName: string, categoryName: string): boolean {
  const mapping = getCategoryTypeMapping(categoryName);
  if (!mapping) return false;
  
  return mapping.types.some(type => 
    type.type_name.toLowerCase() === typeName.toLowerCase()
  );
}

/**
 * Get all type names
 */
export function getAllTypeNames(): string[] {
  return TYPES.map(type => type.type_name);
}

/**
 * Get primary filter types for a category
 */
export function getPrimaryTypesForCategory(categoryName: string): string[] {
  const mapping = getCategoryTypeMapping(categoryName);
  if (!mapping) return [];
  
  return mapping.types
    .filter(type => type.primary_filter)
    .map(type => type.type_name);
}

/**
 * Get department and family for a type
 */
export function getTypeContext(typeName: string): { department: string; family: string; category: string } | undefined {
  const mapping = CATEGORY_TYPE_MAPPINGS.mappings.find(m =>
    m.types.some(t => t.type_name.toLowerCase() === typeName.toLowerCase())
  );
  
  if (!mapping) return undefined;
  
  return {
    department: mapping.department_name,
    family: mapping.family_name,
    category: mapping.category_name
  };
}

// ============================================
// TYPE CLARIFICATIONS
// ============================================

/**
 * TYPE CLARIFICATIONS
 * ===================
 * Contextual descriptions for ambiguous Type values to help AI make correct selections.
 * Similar to CATEGORY_CLARIFICATIONS pattern proven successful.
 * 
 * Purpose: Provide semantic guidance when type names alone don't convey full meaning
 * Example: "Microwave Combo" → "(Combination oven with built-in microwave - also called 'Combination Wall Oven')"
 * 
 * Last updated: 2026-02-12
 */
export const TYPE_CLARIFICATIONS: Record<string, string> = {
  // ============================================
  // UNIVERSAL TYPES
  // ============================================
  "Accessory": "(Replacement parts, handles, knobs, trim kits, installation hardware FOR a specific appliance brand/model - NOT decorative cabinet hardware. Example: 'Café handle kit for Range model CXPR8' = Accessory)",
  "Not Applicable": "(ONLY use if product genuinely has no functional type - very rare)",
  "Not Found": "(ONLY use if none of the available types match - should be rare)",
  
  // ============================================
  // COOKTOP CLARIFICATIONS
  // ============================================
  "Induction": "(Electromagnetic heating technology - electric-powered, no open flame)",
  "Electric": "(Standard electric coil or smoothtop - includes radiant heating)",
  "Radiant": "(Smooth glass surface with electric heating elements beneath)",
  "Gas": "(Uses natural gas or propane fuel - visible flame)",
  "Downdraft": "(Built-in ventilation/exhaust that vents down instead of up)",
  
  // ============================================
  // OVEN CLARIFICATIONS
  // ============================================
  "Microwave Combo": "(Combination wall oven with built-in microwave - also called 'Combination Wall Oven')",
  "Double Wall": "(Dual oven configuration - two separate oven compartments stacked vertically)",
  "Single": "(Traditional single-cavity wall oven - one oven compartment)",
  "Speed Oven": "(High-speed cooking combining microwave and convection)",
  "Steam": "(Steam cooking capability - uses water vapor for healthier cooking)",
  "Convection": "(Fan-circulated heat for even cooking)",
  
  // ============================================
  // MICROWAVE CLARIFICATIONS
  // ============================================
  "Over-the-Range": "(Mounts above cooking range - includes ventilation)",
  "Countertop": "(Portable microwave - sits on counter)",
  "Drawer": "(Pulls out like a drawer - various applications)",
  "Under Cabinet": "(Mounts underneath cabinets)",
  "Trim Kit": "(Installation accessory for built-in appearance - NOT the microwave itself)",
  
  // ============================================
  // REFRIGERATOR CLARIFICATIONS
  // ============================================
  "French Door": "(Refrigerator on top with two doors, freezer drawer below)",
  "Side-by-Side": "(Refrigerator and freezer as vertical side-by-side compartments)",
  "Top-Freezer": "(Freezer compartment on top, refrigerator below - classic design)",
  "Bottom-Freezer": "(Refrigerator on top, freezer drawer below)",
  "4-Door Flex": "(Four-door design with flexible middle compartment)",
  "Column": "(Built-in vertical column - all refrigerator or all freezer)",
  
  // ============================================
  // RANGE CLARIFICATIONS
  // ============================================
  "Slide-In": "(No backguard - slides between cabinets for seamless look)",
  "Freestanding": "(Finished sides - stands alone anywhere)",
  "Dual Fuel": "(Gas cooktop + electric oven - best of both)",
  
  // ============================================
  // DISHWASHER CLARIFICATIONS
  // ============================================
  "Top Control": "(Controls on top edge of door - hidden when closed)",
  "Front Control": "(Controls visible on front of door)",
  "Portable": "(Wheels for mobility - connects to faucet)",
  
  // ============================================
  // WASHER/DRYER CLARIFICATIONS
  // ============================================
  "Front Load": "(Door on front - typically stackable, more efficient)",
  "Top Load": "(Lid on top - traditional design)",
  "Unitized": "(Combined washer + dryer in single unit)",
  
  // ============================================
  // PLUMBING CLARIFICATIONS
  // ============================================
  "Pull-Down": "(Spray head pulls straight down into sink)",
  "Pull-Out": "(Spray wand pulls out toward you)",
  "Single Handle": "(One lever controls both temperature and flow)",
  "Two Handle": "(Separate hot and cold handles)",
  "Widespread": "(Separate hot/cold handles + spout - 8-16 inch spread)",
  "Centerset": "(Handles and spout combined in one unit - 4 inch spread)",
  "Vessel": "(Designed for above-counter vessel sinks)",
  "Wall Mount": "(Mounts to wall instead of sink/counter or above range)",
  
  // ============================================
  // BATHTUB/SINK CLARIFICATIONS
  // ============================================
  "Alcove": "(Three-wall installation - most common)",
  "Drop-In": "(Drops into surrounding deck, platform, or counter cutout)",
  "Undermount": "(Mounted under counter - no visible rim)",
  "Apron Front": "(Exposed front panel - farmhouse style)",
  "Pedestal": "(Sink on decorative column - hides plumbing)",
  
  // ============================================
  // LIGHTING CLARIFICATIONS
  // ============================================
  "LED": "(Light Emitting Diode - energy efficient, long-lasting)",
  "Incandescent": "(Traditional bulb - warm light, less efficient)",
  "Halogen": "(Bright white light - dimmable)",
  
  // ============================================
  // RANGE HOOD CLARIFICATIONS
  // ============================================
  "Island": "(Suspended from ceiling over island)",
  "Insert": "(Liner that fits into custom cabinet)",
  
  // ============================================
  // HARDWARE CLARIFICATIONS
  // ============================================
  "Entry": "(Keyed lock - for exterior doors)",
  "Privacy": "(Interior lock with emergency release - bathroom/bedroom)",
  "Passage": "(No lock - for hallways and closets)",
  "Dummy": "(Non-functional - decorative only)",
  "Knob": "(Round pull - typically smaller)",
  "Pull": "(Bar or handle - horizontal orientation)",
  "Bar Pull": "(Straight horizontal bar)",
  "Cup Pull": "(Recessed cup shape - vintage style)"
};

/**
 * Get clarification text for a type name
 */
export function getTypeClarification(typeName: string): string | undefined {
  return TYPE_CLARIFICATIONS[typeName];
}
