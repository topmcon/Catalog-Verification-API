/**
 * Few-shot examples for Step 3 category classification
 * 
 * Strategy: Pull from category_metrics collection
 * Filter: High confidence + source conflict cases (most instructive)
 */

import logger from '../../../utils/logger';

export interface FewShotExample {
  fergusonCategory: string;
  webRetailerCategory: string;
  fergusonTitle: string;
  webRetailerTitle: string;
  correctCategory: string;
  reasoning: string;
}

/**
 * Get few-shot examples for a specific family
 * 
 * Pulls from category_metrics where:
 * - ai_agreement_rate >= 0.95 (high confidence)
 * - Ferguson category != Web Retailer category (source conflict)
 * - family matches requested family
 * 
 * @param family Product family (e.g., "Kitchen", "Bath", "Refrigeration")
 * @param count Number of examples to return (default: 3)
 * @returns Array of few-shot examples
 */
export async function getFewShotExamples(
  family: string,
  count: number = 3
): Promise<string> {
  try {
    // TODO: Query category_metrics collection
    // For now, return hardcoded examples per family
    // In production, this would be dynamic
    
    const examplesByFamily: Record<string, FewShotExample[]> = {
      'Kitchen': [
        {
          fergusonCategory: 'Kitchen Fixtures',
          webRetailerCategory: 'Kitchen Appliances',
          fergusonTitle: 'Moen Arbor Single Handle Pull-Down Kitchen Faucet',
          webRetailerTitle: 'Moen 7594SRS Arbor Kitchen Faucet with Pull Down Spray',
          correctCategory: 'Kitchen Faucet',
          reasoning: 'Product is a faucet (fixture), not an appliance. Ferguson category is more specific.',
        },
        {
          fergusonCategory: 'Refrigeration',
          webRetailerCategory: 'Major Appliances',
          fergusonTitle: 'Sub-Zero 42-Inch Built-In Side-by-Side Refrigerator',
          webRetailerTitle: 'Sub-Zero BI42SIDSPH 42" Side-by-Side Refrigerator',
          correctCategory: 'Refrigerator',
          reasoning: 'Clearly a refrigerator. Ferguson provides specific category.',
        },
      ],
      'Refrigeration': [
        {
          fergusonCategory: 'Refrigerators',
          webRetailerCategory: 'Kitchen Appliances',
          fergusonTitle: 'Samsung 28 Cu. Ft. French Door Refrigerator',
          webRetailerTitle: 'Samsung RF28T5001SR French Door Refrigerator',
          correctCategory: 'Refrigerator',
          reasoning: 'Both sources agree this is a refrigerator.',
        },
      ],
      'Bath': [
        {
          fergusonCategory: 'Bathroom Faucets',
          webRetailerCategory: 'Bathroom Fixtures',
          fergusonTitle: 'Kohler Devonshire 8-Inch Widespread Bathroom Faucet',
          webRetailerTitle: 'Kohler K-394-4 Devonshire Faucet',
          correctCategory: 'Bathroom Faucet',
          reasoning: 'Product is a bathroom faucet. Ferguson is more specific.',
        },
      ],
      'Bathtub & Shower': [
        {
          fergusonCategory: 'Shower Accessories',
          webRetailerCategory: 'Bathroom',
          fergusonTitle: 'Kohler Purist Showerhead with Katalyst Spray',
          webRetailerTitle: 'Kohler K-14787 Purist Showerhead',
          correctCategory: 'Showerhead',
          reasoning: 'Showerhead is more specific than "Shower Accessories".',
        },
      ],
      'Indoor Lighting': [
        {
          fergusonCategory: 'Ceiling Lights',
          webRetailerCategory: 'Home Lighting',
          fergusonTitle: 'Kichler Barrington 3-Light Chandelier',
          webRetailerTitle: 'Kichler 42478NI Barrington Chandelier',
          correctCategory: 'Chandelier',
          reasoning: 'Chandelier is a specific type of ceiling light.',
        },
      ],
    };
    
    const examples = examplesByFamily[family] || [];
    const selected = examples.slice(0, count);
    
    if (selected.length === 0) {
      return ''; // No examples for this family
    }
    
    // Format as few-shot examples
    return selected.map((ex, idx) => `
**Example ${idx + 1}:**
Ferguson: "${ex.fergusonCategory}" / "${ex.fergusonTitle}"
Web Retailer: "${ex.webRetailerCategory}" / "${ex.webRetailerTitle}"
Correct Category: "${ex.correctCategory}"
Reasoning: ${ex.reasoning}
`).join('\n');
    
  } catch (error) {
    logger.error('Error fetching few-shot examples:', error);
    return ''; // Fallback: no examples
  }
}

/**
 * Get historical misclassifications for a family
 * 
 * Queries category_metrics for categories where ai_agreement_rate < 0.85
 * Also checks failed_match_logs for field: "category"
 * 
 * @param family Product family
 * @returns Array of common mistakes to avoid
 */
export async function getHistoricalMisclassifications(
  family: string
): Promise<string[]> {
  try {
    // TODO: Query category_metrics and failed_match_logs
    // For now, return hardcoded common mistakes
    
    const mistakesByFamily: Record<string, string[]> = {
      'Kitchen': [
        'Do NOT confuse "Kitchen Faucet" with "Tub Filler" (tub fillers have different mounting)',
        'Do NOT classify garbage disposals as "Kitchen Sink" (they are "Garbage Disposal")',
      ],
      'Bathtub & Shower': [
        'Do NOT confuse "Shower" with "Steam Shower" (steam showers have steam generators)',
        'Do NOT classify shower bases as "Shower Accessory" (they are "Shower")',
        'Do NOT confuse "Tub Filler" with "Bathroom Faucet" (tub fillers mount on tub, not sink)',
      ],
      'Indoor Lighting': [
        'Do NOT classify ceiling fans as "Ceiling Light" (they are "Ceiling Fan" even if they have lights)',
        'Do NOT confuse "Chandelier" with "Pendant" (chandeliers are multi-arm, pendants are single)',
      ],
    };
    
    return mistakesByFamily[family] || [];
  } catch (error) {
    logger.error('Error fetching historical misclassifications:', error);
    return [];
  }
}
