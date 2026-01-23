/**
 * Text Cleaner Utility
 * Cleans, formats, and enhances customer-facing text content
 */

/**
 * Known brand name mappings to proper format
 */
const BRAND_CORRECTIONS: Record<string, string> = {
  // Café brand variants (GE Appliances)
  'cafe': 'Café',
  'Cafe': 'Café',
  'CAFE': 'Café',
  'Caf(eback)': 'Café',
  'CAF(EBACK)': 'Café',
  'Cafe(back)': 'Café',
  'CAFE(BACK)': 'Café',
  'Caf?(eback)': 'Café',
  'Caf\\u00e9': 'Café',
  'Caf&eacute;': 'Café',
  // Monogram brand
  'monogram': 'Monogram',
  'MONOGRAM': 'Monogram',
  // Bosch
  'bosch': 'Bosch',
  'BOSCH': 'Bosch',
  // Thermador
  'thermador': 'Thermador',
  'THERMADOR': 'Thermador',
  // KitchenAid
  'kitchenaid': 'KitchenAid',
  'KITCHENAID': 'KitchenAid',
  'Kitchenaid': 'KitchenAid',
  'kitchen aid': 'KitchenAid',
  'Kitchen Aid': 'KitchenAid',
  // SubZero / Sub-Zero
  'subzero': 'Sub-Zero',
  'sub zero': 'Sub-Zero',
  'Sub Zero': 'Sub-Zero',
  'SUBZERO': 'Sub-Zero',
  'SUB-ZERO': 'Sub-Zero',
  'SUB ZERO': 'Sub-Zero',
  // Wolf
  'wolf': 'Wolf',
  'WOLF': 'Wolf',
  // Miele
  'miele': 'Miele',
  'MIELE': 'Miele',
  // Viking
  'viking': 'Viking',
  'VIKING': 'Viking',
  // Samsung
  'samsung': 'Samsung',
  'SAMSUNG': 'Samsung',
  // LG
  'lg': 'LG',
  // Whirlpool
  'whirlpool': 'Whirlpool',
  'WHIRLPOOL': 'Whirlpool',
  // Maytag
  'maytag': 'Maytag',
  'MAYTAG': 'Maytag',
  // Frigidaire
  'frigidaire': 'Frigidaire',
  'FRIGIDAIRE': 'Frigidaire',
  // GE Profile
  'ge profile': 'GE Profile',
  'GE PROFILE': 'GE Profile',
  'Ge Profile': 'GE Profile',
  // GE
  'ge': 'GE',
};

/**
 * Common encoding fixes for special characters
 */
const ENCODING_FIXES: Record<string, string> = {
  // Trademark and copyright symbols
  '(TM)': '™',
  '(tm)': '™',
  '(R)': '®',
  '(r)': '®',
  '(C)': '©',
  '(c)': '©',
  
  // Common HTML entities
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&bull;': '•',
  '&hellip;': '…',
  
  // Measurement symbols
  '\"': '"',
  "''": '"',
  'cu. ft.': 'cu ft',
  'cu.ft.': 'cu ft',
  'sq. ft.': 'sq ft',
  'sq.ft.': 'sq ft',
  
  // Fix common misspellings/typos
  'wifi': 'WiFi',
  'wi-fi': 'WiFi',
  'Wi-fi': 'WiFi',
  'Wifi': 'WiFi',
  'WIFI': 'WiFi',
  'bluetooth': 'Bluetooth',
  'led': 'LED',
  'btu': 'BTU',
  'BTU\'s': 'BTU',
  'BTUs': 'BTU',
};

/**
 * Words that should always be uppercase
 */
const UPPERCASE_WORDS = new Set([
  'led', 'btu', 'wifi', 'usb', 'hdmi', 'ac', 'dc', 'ul', 'ada', 'lp', 'tv', 'lcd', 'dba',
  'cfm', 'rpm', 'psi', 'gpm', 'fht', 'ep', 'ss', 'ss', 'uk', 'us', 'uk', 'eu',
]);

/**
 * Words that should always be lowercase (unless at start of sentence)
 */
const LOWERCASE_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by',
  'with', 'in', 'of', 'up', 'as', 'into', 'onto', 'upon', 'per', 'via',
]);

/**
 * Clean and fix encoding issues in text
 */
export function cleanEncodingIssues(text: string | undefined | null): string {
  if (!text) return '';
  
  // Ensure we're working with a string
  if (typeof text !== 'string') {
    text = String(text);
  }
  
  let cleaned = text;
  
  // Apply brand corrections first - use case-insensitive string replacement
  // Sort by length descending to match longer patterns first (e.g., "CAF(EBACK)" before "Cafe")
  const sortedBrands = Object.entries(BRAND_CORRECTIONS)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [bad, good] of sortedBrands) {
    // For short patterns (< 4 chars), use word boundaries to avoid matching inside words
    // For patterns with special chars (parentheses), use literal matching
    const hasSpecialChars = /[()\\[\]{}]/.test(bad);
    const isShort = bad.length < 4;
    
    let regex: RegExp;
    if (hasSpecialChars) {
      // Exact match for patterns with special characters
      regex = new RegExp(escapeRegex(bad), 'gi');
    } else if (isShort) {
      // Word boundary match for short patterns like "ge", "lg"
      regex = new RegExp(`\\b${escapeRegex(bad)}\\b`, 'gi');
    } else {
      // Case-insensitive for longer patterns
      regex = new RegExp(escapeRegex(bad), 'gi');
    }
    cleaned = cleaned.replace(regex, good);
  }
  
  // Apply encoding fixes
  for (const [bad, good] of Object.entries(ENCODING_FIXES)) {
    cleaned = cleaned.split(bad).join(good);
  }
  
  // Fix multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Fix escaped quotes
  cleaned = cleaned.replace(/\\"/g, '"');
  cleaned = cleaned.replace(/\\'/g, "'");
  
  // Remove zero-width characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // Fix broken unicode
  cleaned = cleaned.normalize('NFC');
  
  return cleaned.trim();
}

/**
 * Fix brand name to proper format
 */
export function fixBrandName(brand: string | undefined | null): string {
  if (!brand) return '';
  
  // Ensure we're working with a string
  const brandStr = typeof brand === 'string' ? brand : String(brand);
  const trimmed = brandStr.trim();
  
  // Check for exact match first
  if (BRAND_CORRECTIONS[trimmed]) {
    return BRAND_CORRECTIONS[trimmed];
  }
  
  // Check case-insensitive
  const lower = trimmed.toLowerCase();
  for (const [bad, good] of Object.entries(BRAND_CORRECTIONS)) {
    if (bad.toLowerCase() === lower) {
      return good;
    }
  }
  
  // Return cleaned version
  return cleanEncodingIssues(trimmed);
}

/**
 * Escape special regex characters
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format a product title to be clean and professional
 */
export function formatTitle(title: string | undefined | null, brand?: string, _category?: string): string {
  if (!title) return '';
  
  // Ensure we're working with a string
  const titleStr = typeof title === 'string' ? title : String(title);
  
  let formatted = cleanEncodingIssues(titleStr);
  
  // Remove excessive quotation marks and apostrophes at start/end
  formatted = formatted.replace(/^["']+|["']+$/g, '');
  
  // Fix inch marks - ensure proper format
  formatted = formatted.replace(/(\d+)\s*["″]\s*/g, '$1-Inch ');
  formatted = formatted.replace(/(\d+)\s*[''′]\s*/g, '$1 ft ');
  formatted = formatted.replace(/(\d+)-Inch\s+/gi, '$1" ');
  
  // Ensure consistent capitalization
  formatted = toTitleCase(formatted);
  
  // Ensure brand is at the beginning if provided and not already there
  if (brand) {
    const cleanBrand = cleanEncodingIssues(brand);
    const brandRegex = new RegExp(`^${escapeRegex(cleanBrand)}\\s*`, 'i');
    if (!brandRegex.test(formatted)) {
      formatted = `${cleanBrand} ${formatted}`;
    } else {
      // Fix brand case at the start
      formatted = formatted.replace(brandRegex, `${cleanBrand} `);
    }
  }
  
  // Remove duplicate brand mentions
  if (brand) {
    const cleanBrand = cleanEncodingIssues(brand);
    const parts = formatted.split(/\s+/);
    const brandLower = cleanBrand.toLowerCase();
    let foundFirst = false;
    const deduped = parts.filter(p => {
      if (p.toLowerCase() === brandLower) {
        if (foundFirst) return false;
        foundFirst = true;
      }
      return true;
    });
    formatted = deduped.join(' ');
  }
  
  // Remove common filler words at end
  formatted = formatted.replace(/\s+(range|oven|unit|appliance)\s*$/i, (match) => match);
  
  return formatted.trim();
}

/**
 * Format and clean a product description
 */
export function formatDescription(description: string | undefined | null): string {
  if (!description) return '';
  
  // Ensure we're working with a string
  const descStr = typeof description === 'string' ? description : String(description);
  
  let formatted = cleanEncodingIssues(descStr);
  
  // Protect known camelCase words before sentence splitting
  const protectedWords: Record<string, string> = {
    'WiFi': '___WIFI___',
    'SmartHQ': '___SMARTHQ___',
    'AirFry': '___AIRFRY___',
    'TrueConvection': '___TRUECONVECTION___',
    'EasyClean': '___EASYCLEAN___',
    'PowerBoil': '___POWERBOIL___',
    'PowerPlus': '___POWERPLUS___',
    'AutoClean': '___AUTOCLEAN___',
    'QuietMark': '___QUIETMARK___',
  };
  
  // Replace protected words with placeholders
  for (const [word, placeholder] of Object.entries(protectedWords)) {
    formatted = formatted.replace(new RegExp(word, 'gi'), placeholder);
  }
  
  // Split run-on sentences (sentences without proper spacing)
  formatted = formatted.replace(/([a-z])([A-Z][a-z])/g, '$1. $2');
  
  // Restore protected words
  for (const [word, placeholder] of Object.entries(protectedWords)) {
    formatted = formatted.replace(new RegExp(placeholder, 'g'), word);
  }
  
  // Fix missing spaces after periods
  formatted = formatted.replace(/\.([A-Z])/g, '. $1');
  
  // Fix missing spaces after commas
  formatted = formatted.replace(/,([A-Za-z])/g, ', $1');
  
  // Remove excessive punctuation
  formatted = formatted.replace(/\.{2,}/g, '.');
  formatted = formatted.replace(/,{2,}/g, ',');
  formatted = formatted.replace(/!{2,}/g, '!');
  
  // Ensure sentences end with proper punctuation
  const sentences = formatted.split(/(?<=[.!?])\s+/);
  formatted = sentences
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => {
      // Capitalize first letter of sentence
      if (s.length > 0) {
        s = s.charAt(0).toUpperCase() + s.slice(1);
      }
      // Add period if sentence doesn't end with punctuation
      if (s.length > 0 && !/[.!?]$/.test(s)) {
        s += '.';
      }
      return s;
    })
    .join(' ');
  
  // Fix common grammar issues
  formatted = fixGrammar(formatted);
  
  return formatted.trim();
}

/**
 * Extract and format a features list from description text
 */
export function extractFeatures(description: string | undefined | null, existingFeatures?: string): string[] {
  const features: string[] = [];
  const seenFeatures = new Set<string>();
  
  // Parse existing features if provided (from AI or raw data)
  if (existingFeatures) {
    // Ensure we're working with a string
    const featuresStr = typeof existingFeatures === 'string' ? existingFeatures : String(existingFeatures);
    
    // If it's HTML format, extract <li> items properly
    if (featuresStr.includes('<li>')) {
      const liRegex = /<li>(.*?)<\/li>/gs;  // 's' flag allows . to match newlines
      const matches = featuresStr.matchAll(liRegex);
      
      for (const match of matches) {
        const rawFeature = match[1].trim();
        // Remove any nested HTML tags and collapse whitespace
        const cleanedFeature = rawFeature
          .replace(/<[^>]+>/g, ' ')  // Remove any nested tags
          .replace(/\s+/g, ' ')       // Collapse multiple spaces/newlines to single space
          .trim();
        
        if (cleanedFeature.length > 10) {
          const cleaned = cleanEncodingIssues(cleanedFeature);
          if (!seenFeatures.has(cleaned.toLowerCase())) {
            features.push(cleaned);
            seenFeatures.add(cleaned.toLowerCase());
          }
        }
      }
    } else {
      // Plain text format - split on bullets, newlines, etc.
      const existingList = featuresStr
        .replace(/<[^>]+>/g, ' ')  // Remove HTML tags
        .replace(/\s+/g, ' ')       // Collapse whitespace
        .split(/[•\-\*]/)           // Split on bullet markers only
        .map(f => f.trim())
        .filter(f => f.length > 10);
      
      for (const f of existingList) {
        const cleaned = cleanEncodingIssues(f);
        if (!seenFeatures.has(cleaned.toLowerCase())) {
          features.push(cleaned);
          seenFeatures.add(cleaned.toLowerCase());
        }
      }
    }
  }
  
  // If we already have enough features from existing data, return them
  if (features.length >= 5) {
    return features.slice(0, 15);
  }
  
  // Otherwise, extract features from description
  if (!description) return features;
  
  const cleanDesc = cleanEncodingIssues(description);
  
  // Expanded list of feature keywords for appliances
  const featureKeywords = [
    // Technology features
    'wifi', 'smart', 'connect', 'app', 'bluetooth', 'digital', 'electronic',
    'sensor', 'touch', 'control', 'precision', 'monitor', 'technology',
    // Cooking features
    'convection', 'air fry', 'steam', 'bake', 'broil', 'grill', 'roast',
    'simmer', 'boil', 'rapid', 'even', 'preheat',
    // Cleaning features
    'self-clean', 'steam clean', 'easy clean', 'no chemical', 'clean',
    // Capacity/size features
    'capacity', 'spacious', 'large', 'cu ft', 'burner', 'rack', 'drawer',
    // Energy/efficiency
    'energy', 'efficient', 'quiet', 'save',
    // Material/design
    'stainless', 'glass', 'cast iron', 'continuous grate', 'edge-to-edge',
    // Temperature features
    'temperature', 'probe', 'btu', 'degrees', 'thermostat',
    // Convenience features
    'timer', 'delay', 'adjustable', 'removable', 'flexible', 'convertible',
    // Specific appliance features
    'ice', 'water', 'filter', 'door', 'led', 'light', 'warming'
  ];
  
  // Split by sentence boundaries
  const sentences = cleanDesc.split(/(?<=[.!])\s+/);
  
  for (const sentence of sentences) {
    // Skip very short or very long sentences
    if (sentence.length < 15 || sentence.length > 250) continue;
    
    // Check if sentence describes a feature
    const hasKeyword = featureKeywords.some(kw => 
      sentence.toLowerCase().includes(kw)
    );
    
    if (hasKeyword) {
      // Extract the feature description
      let feature = sentence.trim();
      
      // Clean up the feature text
      feature = feature.replace(/^[-•*]\s*/, '');
      feature = feature.replace(/^\d+\.\s*/, ''); // Remove numbered list markers
      
      // Only capitalize first letter if needed
      if (feature.length > 0) {
        feature = feature.charAt(0).toUpperCase() + feature.slice(1);
      }
      
      // Ensure ends with period
      if (!/[.!?]$/.test(feature)) {
        feature += '.';
      }
      
      // Avoid duplicates
      if (!seenFeatures.has(feature.toLowerCase()) && feature.length > 15 && feature.length <= 200) {
        features.push(feature);
        seenFeatures.add(feature.toLowerCase());
      }
    }
  }
  
  // If still no features, be more aggressive - take all meaningful sentences
  if (features.length < 3 && sentences.length > 0) {
    for (const sentence of sentences) {
      if (sentence.length >= 30 && sentence.length <= 200 && features.length < 8) {
        let feature = sentence.trim();
        feature = feature.replace(/^[-•*]\s*/, '');
        
        if (feature.length > 0 && !seenFeatures.has(feature.toLowerCase())) {
          feature = feature.charAt(0).toUpperCase() + feature.slice(1);
          if (!/[.!?]$/.test(feature)) feature += '.';
          features.push(feature);
          seenFeatures.add(feature.toLowerCase());
        }
      }
    }
  }
  
  // Limit to reasonable number of features
  return features.slice(0, 15);
}

/**
 * Generate HTML feature list from features array
 */
export function generateFeaturesHtml(features: string[]): string {
  if (!features || features.length === 0) {
    return '<ul></ul>';
  }
  
  let html = '<ul>\n';
  
  for (const feature of features) {
    const escapedFeature = escapeHtml(feature);
    html += `  <li>${escapedFeature}</li>\n`;
  }
  
  html += '</ul>';
  return html;
}

/**
 * Convert text to proper title case
 */
export function toTitleCase(text: string): string {
  return text.replace(/\b\w+/g, (word, index) => {
    const lower = word.toLowerCase();
    
    // Always uppercase certain abbreviations
    if (UPPERCASE_WORDS.has(lower)) {
      return word.toUpperCase();
    }
    
    // Keep lowercase articles/prepositions unless first word
    if (index > 0 && LOWERCASE_WORDS.has(lower)) {
      return lower;
    }
    
    // Standard title case
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * Format a single sentence
 */
export function formatSentence(sentence: string): string {
  if (!sentence) return '';
  
  let formatted = sentence.trim();
  
  // Capitalize first letter
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  
  // Ensure ends with period if no other punctuation
  if (!/[.!?]$/.test(formatted)) {
    formatted += '.';
  }
  
  return formatted;
}

/**
 * Fix common grammar issues
 */
export function fixGrammar(text: string): string {
  let fixed = text;
  
  // Fix double spaces
  fixed = fixed.replace(/\s{2,}/g, ' ');
  
  // Fix space before punctuation
  fixed = fixed.replace(/\s+([.,!?;:])/g, '$1');
  
  // Fix missing space after punctuation (except for numbers like 3.5)
  fixed = fixed.replace(/([.,!?;:])([A-Za-z])/g, '$1 $2');
  
  // Fix "a" vs "an"
  fixed = fixed.replace(/\ba\s+([aeiou])/gi, 'an $1');
  fixed = fixed.replace(/\ban\s+([^aeiou\s])/gi, 'a $1');
  
  // Fix common contractions
  fixed = fixed.replace(/\bits\s+a\b/gi, "it's a");
  fixed = fixed.replace(/\byour\s+a\b/gi, "you're a");
  fixed = fixed.replace(/\byour\s+the\b/gi, "you're the");
  
  // Fix double words
  fixed = fixed.replace(/\b(\w+)\s+\1\b/gi, '$1');
  
  return fixed;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Extract color/finish from text (recognizes materials as both color and finish)
 */
export function extractColorFinish(text: string | undefined | null): { color: string; finish: string } {
  if (!text) return { color: '', finish: '' };
  
  const lowerText = text.toLowerCase();
  
  // Common appliance materials that serve as BOTH color and finish
  const materials = [
    { pattern: /black\s+stainless\s*steel/i, color: 'Black Stainless Steel', finish: 'Stainless Steel' },
    { pattern: /stainless\s*steel/i, color: 'Stainless Steel', finish: 'Stainless Steel' },
    { pattern: /brushed\s+stainless/i, color: 'Stainless Steel', finish: 'Brushed Stainless' },
    { pattern: /fingerprint\s+resistant\s+stainless/i, color: 'Stainless Steel', finish: 'Fingerprint Resistant' },
    { pattern: /white/i, color: 'White', finish: 'White' },
    { pattern: /black/i, color: 'Black', finish: 'Black' },
    { pattern: /bisque/i, color: 'Bisque', finish: 'Bisque' },
    { pattern: /slate/i, color: 'Slate', finish: 'Slate' },
    { pattern: /panel\s+ready/i, color: 'Panel Ready', finish: 'Panel Ready' },
    { pattern: /custom\s+panel/i, color: 'Panel Ready', finish: 'Panel Ready' },
  ];
  
  for (const mat of materials) {
    if (mat.pattern.test(lowerText)) {
      return { color: mat.color, finish: mat.finish };
    }
  }
  
  return { color: '', finish: '' };
}

/**
 * Clean all customer-facing text in a product response
 */
export interface CustomerFacingText {
  title: string;
  description: string;
  features: string[];
  featuresHtml: string;
  brand: string;
}

export function cleanCustomerFacingText(
  title: string | undefined | null,
  description: string | undefined | null,
  existingFeatures: string | undefined | null,
  brand: string | undefined | null,
  category?: string
): CustomerFacingText {
  const cleanBrand = fixBrandName(brand);
  const cleanTitle = formatTitle(title, cleanBrand, category);
  const cleanDescription = formatDescription(description);
  const features = extractFeatures(description, existingFeatures || undefined);
  const featuresHtml = generateFeaturesHtml(features);
  
  return {
    title: cleanTitle,
    description: cleanDescription,
    features,
    featuresHtml,
    brand: cleanBrand,
  };
}

export default {
  cleanEncodingIssues,
  fixBrandName,
  formatTitle,
  formatDescription,
  extractFeatures,
  generateFeaturesHtml,
  toTitleCase,
  formatSentence,
  fixGrammar,
  escapeHtml,
  extractColorFinish,
  cleanCustomerFacingText,
};
