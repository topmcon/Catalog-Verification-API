/**
 * Step 2: Family Classification Prompt
 * 
 * Narrows from Department → Family
 * Uses hierarchical product family structure
 */

import { CategoryClassifierInput } from '../schema';

// Family mappings by department
const FAMILIES_BY_DEPARTMENT: Record<string, string[]> = {
  'Appliances': [
    'Kitchen',
    'Laundry',
    'Refrigeration',
    'Cooking',
    'Dishwashers',
    'Cleaning',
    'Ventilation',
  ],
  'Plumbing & Bath': [
    'Bath',
    'Kitchen Plumbing',
    'Bathroom Plumbing',
    'Bathtub & Shower',
    'Sinks & Faucets',
    'Toilets & Bidets',
    'Bathroom Accessories',
    'Water Heaters',
    'Drains & Parts',
  ],
  'Lighting & Electrical': [
    'Bath',
    'Indoor Lighting',
    'Outdoor Lighting',
    'Ceiling Fans',
    'Light Bulbs',
    'Lighting Accessories',
    'Track & Rail Lighting',
  ],
};

export function buildFamilyPrompt(
  input: CategoryClassifierInput,
  department: string
): string {
  const validFamilies = FAMILIES_BY_DEPARTMENT[department] || [];
  
  if (validFamilies.length === 0) {
    throw new Error(`Unknown department: ${department}`);
  }
  
  return `You are a product classification expert. In Step 1, you determined this is a **${department}** product.

**Your Task:** Narrow to the specific FAMILY within ${department}.

**Valid Families for ${department}:**
${validFamilies.map((f, idx) => `${idx + 1}. ${f}`).join('\n')}

**Product Context:**

Ferguson Data:
- Title: "${input.fergusonTitle}"
- Product Type: "${input.fergusonProductType}"
- Category: "${input.fergusonCategory}"

Web Retailer Data:
- Title: "${input.webRetailerTitle}"
- SubCategory: "${input.webRetailerSubCategory}"
- Category: "${input.webRetailerCategory}"

**Guidelines:**

${getFamilyGuidelines(department)}

**Response Format (JSON only, no markdown):**
{
  "family": "<one of the valid families listed above>",
  "confidence": <number 0-100>,
  "reasoning": "<Explain your decision in 1-2 sentences>"
}

**Examples for ${department}:**

${getFamilyExamples(department)}
`;
}

function getFamilyGuidelines(department: string): string {
  const guidelines: Record<string, string> = {
    'Appliances': `- **Kitchen**: Refrigerators, ranges, ovens, cooktops, microwaves, dishwashers, garbage disposals, ice makers
- **Laundry**: Washers, dryers, laundry centers, pedestals
- **Refrigeration**: Refrigerators, freezers, ice machines (separate from Kitchen for large catalog)
- **Cooking**: Ranges, ovens, cooktops, rangetops, grills (separate from Kitchen)
- **Dishwashers**: Built-in, portable, drawer dishwashers
- **Cleaning**: Vacuum cleaners, trash compactors
- **Ventilation**: Range hoods, vent fans`,
    
    'Plumbing & Bath': `- **Kitchen Plumbing**: Kitchen faucets, kitchen sinks, pot fillers, soap dispensers
- **Bathroom Plumbing**: Bathroom faucets, lavatory faucets, bathroom sinks
- **Bathtub & Shower**: Tubs, showers, shower doors, tub fillers, shower heads, shower systems
- **Sinks & Faucets**: General sink and faucet category (use more specific if possible)
- **Toilets & Bidets**: Toilets, toilet seats, bidets, bidet seats
- **Bathroom Accessories**: Towel bars, mirrors, medicine cabinets, bathroom hardware
- **Water Heaters**: Tank, tankless, hybrid water heaters
- **Drains & Parts**: Drains, valves, flanges, plumbing parts`,
    
    'Lighting': `- **Indoor Lighting**: Chandeliers, pendants, flush mounts, ceiling lights, wall sconces, table lamps, floor lamps
- **Outdoor Lighting**: Outdoor wall lights, post lights, landscape lighting, outdoor hanging lights
- **Ceiling Fans**: Ceiling fans with or without lights
- **Light Bulbs**: LED, incandescent, halogen, CFL bulbs
- **Lighting Accessories**: Dimmers, switches, lighting controls, lamp shades
- **Track & Rail Lighting**: Track lighting systems, rail lighting, monorail`,
  };
  
  return guidelines[department] || '';
}

function getFamilyExamples(department: string): string {
  const examples: Record<string, string> = {
    'Appliances': `Title: "Samsung 28 Cu. Ft. French Door Refrigerator"
→ {"family": "Refrigeration", "confidence": 100, "reasoning": "Refrigerator clearly belongs to Refrigeration family"}

Title: "GE Profile 30-Inch Gas Range"
→ {"family": "Cooking", "confidence": 100, "reasoning": "Gas range is a cooking appliance"}

Title: "Bosch 24-Inch Built-In Dishwasher"
→ {"family": "Dishwashers", "confidence": 100, "reasoning": "Dishwasher belongs to Dishwashers family"}`,
    
    'Plumbing & Bath': `Title: "Kohler Devonshire 8-Inch Widespread Bathroom Faucet"
→ {"family": "Bathroom Plumbing", "confidence": 100, "reasoning": "Bathroom faucet belongs to Bathroom Plumbing"}

Title: "Moen Arbor Single Handle Pull-Down Kitchen Faucet"
→ {"family": "Kitchen Plumbing", "confidence": 100, "reasoning": "Kitchen faucet belongs to Kitchen Plumbing"}

Title: "BainUltra Infiniti 6636 Drop-In Bathtub"
→ {"family": "Bathtub & Shower", "confidence": 100, "reasoning": "Bathtub belongs to Bathtub & Shower family"}`,
    
    'Lighting': `Title: "Kichler Barrington 3-Light Chandelier"
→ {"family": "Indoor Lighting", "confidence": 100, "reasoning": "Chandelier is indoor decorative lighting"}

Title: "Hunter 52-Inch Ceiling Fan with Light"
→ {"family": "Ceiling Fans", "confidence": 100, "reasoning": "Ceiling fan belongs to Ceiling Fans family"}

Title: "Progress Lighting P5504 Outdoor Wall Lantern"
→ {"family": "Outdoor Lighting", "confidence": 100, "reasoning": "Outdoor wall lantern belongs to Outdoor Lighting"}`,
  };
  
  return examples[department] || 'No examples available for this department.';
}
