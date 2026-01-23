/**
 * SMART FIELD INFERENCE SERVICE
 * =============================
 * 
 * Uses common sense reasoning to map extracted data to Salesforce fields
 * even when the field names don't exactly match.
 * 
 * Examples:
 * - "38-gallon capacity" → capacity_gallons: 38
 * - "Weight: 146 lb" → Weight__c: 146
 * - "Soaking Depth: 15 inches" → water_depth: 15
 * - "BTU Rating: 12,000" → btu_output: 12000
 */

import logger from '../utils/logger';

// ============================================
// FIELD ALIAS MAPPINGS
// ============================================

/**
 * Maps various natural language terms to their Salesforce field names
 * Key: Salesforce field key (snake_case)
 * Value: Array of aliases that should map to this field
 */
export const FIELD_ALIASES: Record<string, string[]> = {
  // Capacity fields
  'capacity_gallons': [
    'capacity (gallons)', 'gallon capacity', 'water capacity', 'tub capacity',
    'tank capacity', 'total capacity', 'volume', 'gallons', 'gal capacity',
    'water volume', 'fill capacity', 'bath capacity'
  ],
  'capacity': [
    'oven capacity', 'cu ft', 'cubic feet', 'interior capacity', 'drum capacity',
    'total capacity', 'storage capacity', 'freezer capacity', 'refrigerator capacity'
  ],
  
  // Weight fields
  'weight': [
    'product weight', 'shipping weight', 'net weight', 'gross weight',
    'item weight', 'unit weight', 'weight lbs', 'weight (lbs)', 'lbs', 'pounds'
  ],
  'weight_capacity': [
    'max weight', 'maximum weight', 'load capacity', 'weight limit',
    'supported weight', 'capacity lbs'
  ],
  
  // Dimension fields
  'nominal_length': [
    'length', 'overall length', 'tub length', 'product length', 'total length',
    'exterior length', 'inside length', 'interior length'
  ],
  'nominal_width': [
    'width', 'overall width', 'tub width', 'product width', 'total width',
    'exterior width', 'inside width', 'interior width'
  ],
  'water_depth': [
    'soaking depth', 'water depth', 'fill depth', 'interior depth',
    'bathing depth', 'soak depth', 'maximum water depth'
  ],
  'height': [
    'overall height', 'product height', 'total height', 'rim height',
    'exterior height', 'tub height'
  ],
  
  // Flow/Rate fields
  'flow_rate': [
    'gpm', 'gallons per minute', 'flow', 'water flow', 'flow rate gpm',
    'max flow rate', 'maximum flow'
  ],
  'btu_output': [
    'btu', 'btus', 'btu rating', 'heating capacity', 'burner output',
    'max btu', 'total btu'
  ],
  'cfm': [
    'airflow', 'air flow', 'cfm rating', 'ventilation', 'exhaust rate',
    'cubic feet per minute'
  ],
  
  // Bathtub specific
  'installation_type': [
    'tub type', 'mounting type', 'installation', 'install type',
    'freestanding', 'alcove', 'drop-in', 'undermount'
  ],
  'drain_placement': [
    'drain location', 'drain position', 'drain side', 'outlet position',
    'waste location', 'reversible drain', 'center drain', 'left drain', 'right drain'
  ],
  'tub_shape': [
    'shape', 'bathtub shape', 'oval', 'rectangular', 'corner', 'round'
  ],
  'number_of_jets': [
    'jets', 'jet count', 'whirlpool jets', 'air jets', 'massage jets',
    'total jets', 'hydro jets'
  ],
  'number_of_bathers': [
    'bather capacity', 'person capacity', 'seating', 'seats',
    'how many bathers', 'occupancy'
  ],
  
  // Material/Finish
  'material': [
    'construction', 'made of', 'constructed of', 'body material',
    'tub material', 'basin material', 'shell material'
  ],
  'finish': [
    'surface finish', 'exterior finish', 'coating', 'surface',
    'polish', 'texture'
  ],
  
  // Boolean features
  'overflow': [
    'has overflow', 'overflow included', 'overflow drain', 'overflow feature'
  ],
  'drain_assembly_included': [
    'drain included', 'includes drain', 'drain assembly', 'comes with drain'
  ],
  'ada': [
    'ada compliant', 'ada approved', 'accessible', 'handicap accessible',
    'wheelchair accessible'
  ],
  'soaking': [
    'soaking tub', 'deep soak', 'soaker', 'soaking bath'
  ],
  'whirlpool': [
    'whirlpool tub', 'jetted', 'hydromassage', 'hydrotherapy'
  ],
  'air_bath': [
    'air jets', 'air massage', 'air tub', 'bubbler'
  ],
  
  // Appliance specific
  'fuel_type': [
    'power source', 'energy source', 'gas', 'electric', 'dual fuel'
  ],
  'configuration': [
    'style', 'type', 'format', 'freestanding', 'slide-in', 'drop-in'
  ],
  'number_of_burners': [
    'burners', 'burner count', 'cooking zones', 'elements'
  ],
  'convection': [
    'convection oven', 'true convection', 'fan assisted', 'convect'
  ],
  'self_cleaning': [
    'cleaning type', 'pyrolytic', 'steam clean', 'self clean'
  ],
  'smart_home': [
    'wifi', 'smart', 'connected', 'app control', 'voice control',
    'alexa', 'google home'
  ],
  'energy_star': [
    'energy star certified', 'energy efficient', 'energy rating'
  ],
  
  // Electrical
  'voltage': [
    'volts', 'electrical', 'power requirements', 'v', 'vac'
  ],
  'amperage': [
    'amps', 'amp rating', 'current', 'ampere'
  ],
  'wattage': [
    'watts', 'power consumption', 'w', 'watt'
  ]
};

// ============================================
// VALUE EXTRACTION PATTERNS
// ============================================

interface ExtractedValue {
  value: string | number | boolean;
  unit?: string;
  confidence: number;
  source: string;
}

/**
 * Patterns for extracting numeric values with units
 */
const VALUE_PATTERNS: Record<string, RegExp[]> = {
  gallons: [
    /(\d+(?:\.\d+)?)\s*(?:gallons?|gal\.?)\s*(?:capacity)?/i,
    /capacity[:\s]*(\d+(?:\.\d+)?)\s*(?:gallons?|gal\.?)/i,
    /(\d+(?:\.\d+)?)\s*-?\s*gallon/i
  ],
  weight_lbs: [
    /(\d+(?:\.\d+)?)\s*(?:lbs?\.?|pounds?)/i,
    /weight[:\s]*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:lb|lbs)/i
  ],
  inches: [
    /(\d+(?:\.\d+)?)\s*(?:"|in\.?|inch(?:es)?)/i,
    /(\d+(?:\.\d+)?)\s*['"]?\s*(?:x|by)/i  // Dimensions like 60" x 30"
  ],
  btu: [
    /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:btu|btus)/i,
    /btu[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i
  ],
  cfm: [
    /(\d+(?:\.\d+)?)\s*(?:cfm|cubic feet per minute)/i,
    /cfm[:\s]*(\d+(?:\.\d+)?)/i
  ],
  gpm: [
    /(\d+(?:\.\d+)?)\s*(?:gpm|gallons? per minute)/i,
    /gpm[:\s]*(\d+(?:\.\d+)?)/i,
    /flow[:\s]*(\d+(?:\.\d+)?)/i
  ],
  cubic_feet: [
    /(\d+(?:\.\d+)?)\s*(?:cu\.?\s*ft\.?|cubic feet)/i,
    /capacity[:\s]*(\d+(?:\.\d+)?)\s*(?:cu\.?\s*ft\.?)/i
  ],
  count: [
    /(\d+)\s*(?:jets?|burners?|elements?)/i,
    /(?:jets?|burners?)[:\s]*(\d+)/i
  ],
  voltage: [
    /(\d+)\s*(?:v|volts?|vac)/i,
    /(\d+)\/(\d+)\s*(?:v|vac)/i  // 240/208V
  ]
};

// ============================================
// INFERENCE FUNCTIONS
// ============================================

/**
 * Extract a numeric value from text using the appropriate pattern
 */
function extractNumericValue(text: string, valueType: string): number | null {
  const patterns = VALUE_PATTERNS[valueType];
  if (!patterns) return null;
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Remove commas and parse
      const numStr = match[1].replace(/,/g, '');
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        return num;
      }
    }
  }
  return null;
}

/**
 * Normalize a field name for comparison
 */
function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find the best matching Salesforce field for a given attribute name
 */
export function findFieldMatch(attributeName: string): { fieldKey: string; confidence: number } | null {
  const normalized = normalizeFieldName(attributeName);
  
  // Direct match check
  for (const [fieldKey, aliases] of Object.entries(FIELD_ALIASES)) {
    // Check if the attribute name exactly matches a known alias
    for (const alias of aliases) {
      const normalizedAlias = normalizeFieldName(alias);
      
      // Exact match
      if (normalized === normalizedAlias) {
        return { fieldKey, confidence: 1.0 };
      }
      
      // Strong partial match (one contains the other significantly)
      if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
        const shorter = Math.min(normalized.length, normalizedAlias.length);
        const longer = Math.max(normalized.length, normalizedAlias.length);
        const ratio = shorter / longer;
        
        if (ratio > 0.6) {
          return { fieldKey, confidence: ratio };
        }
      }
    }
    
    // Also check if field key matches directly
    const normalizedKey = normalizeFieldName(fieldKey.replace(/_/g, ' '));
    if (normalized === normalizedKey || normalized.includes(normalizedKey)) {
      return { fieldKey, confidence: 0.9 };
    }
  }
  
  return null;
}

/**
 * Infer field values from features list or description text
 */
export function inferFieldsFromText(
  text: string,
  targetFields: string[]
): Record<string, ExtractedValue> {
  const results: Record<string, ExtractedValue> = {};
  
  if (!text) return results;
  
  const normalizedText = text.toLowerCase();
  
  for (const fieldKey of targetFields) {
    // Get the appropriate extraction pattern based on field type
    let extractedValue: number | string | boolean | null = null;
    let unit: string | undefined;
    
    // Capacity (gallons) - for bathtubs, water heaters
    if (fieldKey === 'capacity_gallons' || fieldKey.includes('gallon')) {
      extractedValue = extractNumericValue(text, 'gallons');
      unit = 'gallons';
    }
    // Capacity (cubic feet) - for appliances
    else if (fieldKey === 'capacity' || fieldKey.includes('cu_ft')) {
      extractedValue = extractNumericValue(text, 'cubic_feet');
      unit = 'cu. ft.';
    }
    // Weight
    else if (fieldKey === 'weight' || fieldKey.includes('weight')) {
      extractedValue = extractNumericValue(text, 'weight_lbs');
      unit = 'lbs';
    }
    // BTU
    else if (fieldKey === 'btu_output' || fieldKey.includes('btu')) {
      extractedValue = extractNumericValue(text, 'btu');
      unit = 'BTU';
    }
    // CFM
    else if (fieldKey === 'cfm') {
      extractedValue = extractNumericValue(text, 'cfm');
      unit = 'CFM';
    }
    // GPM / Flow Rate
    else if (fieldKey === 'flow_rate' || fieldKey.includes('gpm')) {
      extractedValue = extractNumericValue(text, 'gpm');
      unit = 'GPM';
    }
    // Dimensions
    else if (fieldKey.includes('length') || fieldKey.includes('width') || 
             fieldKey.includes('height') || fieldKey.includes('depth')) {
      extractedValue = extractNumericValue(text, 'inches');
      unit = 'inches';
    }
    // Count fields (jets, burners)
    else if (fieldKey.includes('number_of') || fieldKey.includes('count')) {
      extractedValue = extractNumericValue(text, 'count');
    }
    // Boolean fields - check for presence
    else if (['overflow', 'ada', 'soaking', 'whirlpool', 'air_bath', 'convection', 
              'smart_home', 'energy_star', 'drain_assembly_included'].includes(fieldKey)) {
      const aliases = FIELD_ALIASES[fieldKey] || [];
      for (const alias of aliases) {
        if (normalizedText.includes(normalizeFieldName(alias))) {
          // Check for negation
          const negationPattern = new RegExp(`no\\s+${alias}|without\\s+${alias}|${alias}\\s*:\\s*no`, 'i');
          extractedValue = !negationPattern.test(text);
          break;
        }
      }
    }
    
    if (extractedValue !== null) {
      results[fieldKey] = {
        value: extractedValue,
        unit,
        confidence: 0.8,
        source: 'text_inference'
      };
    }
  }
  
  return results;
}

/**
 * Main inference function - analyzes all available data sources
 * and maps values to Salesforce fields using common sense
 */
export function inferMissingFields(
  rawSpecs: Array<{ name: string; value: string }>,
  featuresText: string,
  descriptionText: string,
  targetFields: string[],
  category?: string
): Record<string, ExtractedValue> {
  const results: Record<string, ExtractedValue> = {};
  
  logger.info('Smart field inference starting', {
    specsCount: rawSpecs?.length || 0,
    featuresLength: featuresText?.length || 0,
    descriptionLength: descriptionText?.length || 0,
    targetFieldsCount: targetFields.length,
    category
  });
  
  // Step 1: Try to match raw specs to target fields using aliases
  if (rawSpecs && Array.isArray(rawSpecs)) {
    for (const spec of rawSpecs) {
      if (!spec.name || spec.value === undefined || spec.value === null || spec.value === '') continue;
      
      const fieldMatch = findFieldMatch(spec.name);
      
      if (fieldMatch && targetFields.includes(fieldMatch.fieldKey)) {
        // Don't overwrite if we already have a higher confidence match
        if (!results[fieldMatch.fieldKey] || results[fieldMatch.fieldKey].confidence < fieldMatch.confidence) {
          results[fieldMatch.fieldKey] = {
            value: spec.value,
            confidence: fieldMatch.confidence,
            source: `spec_alias_match:${spec.name}`
          };
          
          logger.info('Field inferred from spec alias', {
            specName: spec.name,
            fieldKey: fieldMatch.fieldKey,
            value: spec.value,
            confidence: fieldMatch.confidence
          });
        }
      }
    }
  }
  
  // Step 2: Extract values from features text
  const missingFields = targetFields.filter(f => !results[f]);
  if (missingFields.length > 0 && featuresText) {
    const featuresInferred = inferFieldsFromText(featuresText, missingFields);
    
    for (const [fieldKey, extracted] of Object.entries(featuresInferred)) {
      if (!results[fieldKey]) {
        results[fieldKey] = extracted;
        logger.info('Field inferred from features text', {
          fieldKey,
          value: extracted.value,
          source: 'features_text'
        });
      }
    }
  }
  
  // Step 3: Extract values from description text
  const stillMissing = targetFields.filter(f => !results[f]);
  if (stillMissing.length > 0 && descriptionText) {
    const descInferred = inferFieldsFromText(descriptionText, stillMissing);
    
    for (const [fieldKey, extracted] of Object.entries(descInferred)) {
      if (!results[fieldKey]) {
        results[fieldKey] = {
          ...extracted,
          confidence: extracted.confidence * 0.9 // Slightly lower confidence for description
        };
        logger.info('Field inferred from description', {
          fieldKey,
          value: extracted.value,
          source: 'description_text'
        });
      }
    }
  }
  
  logger.info('Smart field inference complete', {
    targetFields: targetFields.length,
    fieldsInferred: Object.keys(results).length,
    inferredFields: Object.keys(results)
  });
  
  return results;
}

/**
 * Category-specific field mapping overrides
 * Some categories have unique field names that need special handling
 */
export const CATEGORY_FIELD_OVERRIDES: Record<string, Record<string, string>> = {
  'Bathtubs': {
    'capacity_gallons': 'capacity_gallons',  // Maps to "Capacity (Gallons)" SF field
    'water_depth': 'water_depth',            // Maps to "Water Depth" SF field
    'tub_shape': 'tub_shape',
    'number_of_bathers': 'number_of_bathers'
  },
  'Water Heaters': {
    'capacity_gallons': 'total_capacity',    // Different field name in SF
    'first_hour_rating': 'first_hour_delivery'
  },
  'Refrigerators': {
    'refrigerator_capacity': 'refrigerator_capacity',
    'freezer_capacity': 'freezer_capacity',
    'total_capacity': 'total_capacity'
  },
  'Dishwashers': {
    'place_settings': 'place_setting_capacity'
  }
};

/**
 * Get the correct Salesforce field key for a category
 */
export function getCategoryFieldKey(category: string, genericFieldKey: string): string {
  const overrides = CATEGORY_FIELD_OVERRIDES[category];
  if (overrides && overrides[genericFieldKey]) {
    return overrides[genericFieldKey];
  }
  return genericFieldKey;
}

export default {
  FIELD_ALIASES,
  findFieldMatch,
  inferFieldsFromText,
  inferMissingFields,
  getCategoryFieldKey,
  CATEGORY_FIELD_OVERRIDES
};
