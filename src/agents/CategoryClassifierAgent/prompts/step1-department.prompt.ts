/**
 * Step 1: Department Classification Prompt
 * 
 * Determines: Appliances, Plumbing & Bath, or Lighting & Electrical
 * Handles: Cross-department conflicts (Ferguson vs Web Retailer mismatch)
 */

import { CategoryClassifierInput } from '../schema';

export function buildDepartmentPrompt(input: CategoryClassifierInput): string {
  return `You are a product classification expert. Your task: determine which DEPARTMENT this product belongs to.

**Available Departments:**
- **Appliances** (kitchen appliances, laundry appliances, refrigeration, cooking equipment, dishwashers, ranges, ovens, microwaves, ice makers, compactors, etc.)
- **Plumbing & Bath** (faucets, showers, tubs, sinks, toilets, bidets, bathroom fixtures, drains, valves, bathroom accessories)
- **Lighting & Electrical** (ceiling lights, wall sconces, chandeliers, pendant lights, outdoor lighting, lamps, bulbs, ceiling fans, track lighting, electrical components)

**Data Sources:**

Ferguson (distributor specialist):
- Category: "${input.fergusonCategory}"
- Product Type: "${input.fergusonProductType}"
- Title: "${input.fergusonTitle}"
${input.fergusonBusinessCategory ? `- Business Category: "${input.fergusonBusinessCategory}"` : ''}

Web Retailer (general merchant):
- Category: "${input.webRetailerCategory}"
- SubCategory: "${input.webRetailerSubCategory}"
- Title: "${input.webRetailerTitle}"
- URL: "${input.webRetailerURL}"

**⚠️ CRITICAL: Cross-Department Conflict Detection**

If the two sources suggest DIFFERENT departments, this is a data quality issue that must be flagged.

Example conflicts:
- Ferguson says "Lighting & Electrical (Ceiling Fan)" but Web Retailer says "Plumbing (Bathroom Sink)" → CRITICAL CONFLICT
- Ferguson says "Kitchen Faucet" but Web Retailer says "Kitchen Appliances" → SAME DEPARTMENT, not a conflict

When sources are in DIFFERENT departments:
1. Set "departmentMismatch": true
2. Choose the source that is:
   - More SPECIFIC (has detailed product type, not generic category)
   - More CONSISTENT with product title keywords
   - From a specialist domain (Ferguson for plumbing, specialized retailers for niche products)
3. Explain your reasoning in "conflictResolution"

**Your Task:**
1. Analyze both data sources
2. Determine: Is this an Appliance, Plumbing & Bath, or Lighting & Electrical product?
3. If sources disagree on department, flag it and explain which you trust and why

**Response Format (JSON only, no markdown):**
{
  "department": "Appliances" | "Plumbing & Bath" | "Lighting & Electrical",
  "confidence": <number 0-100>,
  "reasoning": "<Explain your decision in 1-2 sentences>",
  "departmentMismatch": <true | false>,
  "conflictResolution": "<If mismatch=true, explain which source you trusted and why>"
}

**Examples of correct department classification:**

Ferguson: "Refrigerators", Web Retailer: "Major Appliances"
→ {"department": "Appliances", "confidence": 100, "reasoning": "Both sources agree this is an appliance product", "departmentMismatch": false}

Ferguson: "Ceiling Fans", Web Retailer: "Bathroom Exhaust Fans"
→ {"department": "Lighting & Electrical", "confidence": 75, "reasoning": "Ceiling fans belong to Lighting & Electrical department. Web Retailer category may be incorrect if this is a decorative fan.", "departmentMismatch": true, "conflictResolution": "Trusted Ferguson (ceiling fans are Lighting & Electrical). Web Retailer's 'bathroom exhaust fan' would be ventilation, not decorative lighting."}

Ferguson: "Kitchen Faucets", Web Retailer: "Kitchen & Bath Fixtures"
→ {"department": "Plumbing & Bath", "confidence": 100, "reasoning": "Faucets are plumbing fixtures regardless of room", "departmentMismatch": false}
`;
}
