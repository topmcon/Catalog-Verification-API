/**
 * ComparisonCheck — Records agent category vs monolith category comparison.
 */

import { ComparisonSection } from '../DebugReport';

export function buildComparisonSection(
  agentCategory: string,
  agentConfidence: number,
  monolithCategory: string,
  written: boolean,
): ComparisonSection {
  return {
    agentCategory,
    agentConfidence,
    monolithCategory,
    matched: agentCategory === monolithCategory,
    written,
  };
}
