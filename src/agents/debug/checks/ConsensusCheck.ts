/**
 * ConsensusCheck — Records the final consensus result from CategoryClassifierAgent.
 */

import { AgentConsensus } from '../../base/types';
import { CategoryClassifierOutput } from '../../CategoryClassifierAgent/schema';
import { ConsensusSection } from '../DebugReport';

export function buildConsensusSection(
  consensus: AgentConsensus<CategoryClassifierOutput>,
): ConsensusSection | undefined {
  if (!consensus.value) return undefined;

  const v = consensus.value;
  return {
    category: v.category,
    categoryId: v.categoryId,
    department: v.department,
    family: v.family,
    confidence: v.confidence,
    locked: v.locked,
    weakConsensus: consensus.agreed && consensus.agreementScore < 80,
    agentSource: v.reasoning?.fastPathUsed ? 'fast-path' : 'chain',
  };
}
