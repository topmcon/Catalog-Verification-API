/**
 * Step 3: Category Classification Prompt
 * 
 * Final step: Select EXACT category from picklist for the determined family
 * Includes few-shot examples and historical misclassification warnings
 */

import { CategoryClassifierInput } from '../schema';
import { getFewShotExamples, getHistoricalMisclassifications } from './examples';

interface CategoryOption {
  category_name: string;
  category_id: string;
  subcategory?: string;
}

/**
 * Build Step 3 prompt with dynamic picklist options
 */
export async function buildCategoryPrompt(
  input: CategoryClassifierInput,
  department: string,
  family: string
): Promise<string> {
  // Get valid categories for this family from config
  const validCategories = await getCategoriesForFamily(family);
  
  // Get few-shot examples (high-confidence + source-conflict cases)
  const examples = await getFewShotExamples(family, 3);
  
  // Get historical misclassifications for this family
  const mistakes = await getHistoricalMisclassifications(family);
  
  return `You are a product classification expert. You've determined:
- **Department**: ${department}
- **Family**: ${family}

**Your Task:** Select the EXACT category name from this list. You must choose ONE category that precisely matches the product.

**Valid Categories for ${family}:**

${validCategories.map((c, idx) => `${idx + 1}. **${c.category_name}** (ID: ${c.category_id})${c.subcategory ? ` — ${c.subcategory}` : ''}`).join('\n')}

${validCategories.length === 0 ? '⚠️ ERROR: No categories found for this family. This should not happen.' : ''}

**Product Context:**

Ferguson Data:
- Category: "${input.fergusonCategory}"
- Product Type: "${input.fergusonProductType}"
- Title: "${input.fergusonTitle}"
${input.fergusonURL ? `- URL: "${input.fergusonURL}"` : ''}

Web Retailer Data:
- Category: "${input.webRetailerCategory}"
- SubCategory: "${input.webRetailerSubCategory}"
- Title: "${input.webRetailerTitle}"
- URL: "${input.webRetailerURL}"
${input.webRetailerDescription ? `- Description: "${input.webRetailerDescription.substring(0, 200)}..."` : ''}

${examples ? `\n**Few-Shot Examples (${family} family - learn from these):**\n${examples}\n` : ''}

${mistakes.length > 0 ? `\n**⚠️ Common Mistakes to Avoid (${family} family):**\n${mistakes.map((m, idx) => `${idx + 1}. ${m}`).join('\n')}\n` : ''}

**Important Guidelines:**

1. **Be SPECIFIC**: Choose the most specific category that matches the product
   - Example: "Chandelier" not "Ceiling Light" if it's a multi-arm chandelier
   - Example: "Refrigerator" not "Major Appliances"

2. **Match EXACT picklist name**: Your category must be one of the options listed above (exact spelling)

3. **Product title keywords matter**:
   - "Refrigerator" in title → category is "Refrigerator"
   - "Faucet" in title → category is some type of faucet (Kitchen Faucet, Bathroom Faucet, Tub Filler, etc.)
   - "Shower" in title → either "Shower", "Showerhead", or "Steam Shower"

4. **Trust specialist sources**:
   - Ferguson is a plumbing/fixtures specialist → trust for faucets, showers, tubs
   - Web retailers may use generic categories → use title keywords to verify

**Response Format (JSON only, no markdown):**
{
  "category": "<exact category name from the list above>",
  "categoryId": "<corresponding category ID>",
  "confidence": <number 0-100>,
  "reasoning": "<Explain your decision in 1-2 sentences>"
}

**Example Responses:**

Input: Ferguson="Refrigerators", WebRetailer="Kitchen Appliances", Title="Samsung 28 Cu. Ft. French Door Refrigerator"
Output: {"category": "Refrigerator", "categoryId": "a01Hu000010Q5EpIAK", "confidence": 100, "reasoning": "Title clearly states 'Refrigerator'. Ferguson category confirms."}

Input: Ferguson="Kitchen Faucets", WebRetailer="Kitchen Fixtures", Title="Moen Arbor Pull-Down Kitchen Faucet"
Output: {"category": "Kitchen Faucet", "categoryId": "a01Hu000010Q5FaIAK", "confidence": 100, "reasoning": "Title states 'Kitchen Faucet'. Ferguson category is specific."}

Input: Ferguson="Ceiling Lights", WebRetailer="Lighting", Title="Kichler Barrington 3-Light Chandelier"
Output: {"category": "Chandelier", "categoryId": "a01Hu000010Q5GbIAK", "confidence": 95, "reasoning": "Title explicitly says 'Chandelier'. More specific than generic 'Ceiling Light'."}
`;
}

/**
 * Get categories for a given family from config
 * Uses family-category-mapping.ts
 */
async function getCategoriesForFamily(family: string): Promise<CategoryOption[]> {
  try {
    // Import category mapping config
    const { FAMILY_CATEGORY_MAPPINGS } = await import('../../../config/family-category-mapping');
    const categories = await import('../../../config/salesforce-picklists/categories.json');
    
    // Get categories for this family
    const familyMapping = FAMILY_CATEGORY_MAPPINGS.find(m => m.family === family);
    const familyCategories = familyMapping?.categories || [];
    
    // Map to full category objects with IDs
    return familyCategories.map((catName: string) => {
      const catData = categories.find((c: any) => c.category_name === catName);
      return {
        category_name: catName,
        category_id: catData?.category_id || 'UNKNOWN_ID',
        subcategory: catData?.subcategory,
      };
    });
  } catch (error) {
    console.error('Error loading categories for family:', family, error);
    return [];
  }
}
