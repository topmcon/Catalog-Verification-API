/**
 * CategoryClassifierAgent - Unit Tests
 * 
 * Tests the 5 core scenarios:
 * 1. Fast-path happy path (exact match)
 * 2. Fast-path miss, chain resolves
 * 3. Cross-department conflict, AIs agree
 * 4. Cross-department conflict, AIs disagree
 * 5. Asymmetric confidence (high disparity)
 */

import { CategoryClassifierAgent } from '../CategoryClassifierAgent';
import { CategoryClassifierInput, CategoryClassifierOutput } from '../schema';
import { AgentConsensus, AgentTaskType, PipelineVersion } from '../../base/types';

// Import fixtures
import fastPathExactMatch from './__fixtures__/fast-path-exact-match.json';
import fastPathMissChain from './__fixtures__/fast-path-miss-chain-resolves.json';
import crossDeptAgree from './__fixtures__/cross-dept-conflict-ais-agree.json';
import crossDeptDisagree from './__fixtures__/cross-dept-conflict-ais-disagree.json';
import asymmetricConfidence from './__fixtures__/asymmetric-confidence.json';

// Mock OpenAI at module level
const mockOpenAICreate = jest.fn();
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockOpenAICreate
        }
      }
    }))
  };
});

// Mock AI usage tracking (MongoDB)
jest.mock('../../../models/ai-usage.model', () => ({
  AIUsage: {
    create: jest.fn().mockResolvedValue({}),
    findOneAndUpdate: jest.fn().mockResolvedValue({})
  }
}));

// Mock logger
jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

/**
 * Helper: Setup model-routed mocks for dual-AI consensus tests.
 * Since Promise.all runs both providers in parallel, mockResolvedValueOnce
 * will interleave unpredictably. This routes responses by model name instead.
 */
function setupDualAIMock(
  fixture: any,
  openaiTokens: { step1: any; step2: any; step3: any },
  xaiTokens: { step1: any; step2: any; step3: any }
) {
  const openaiCalls: Array<{ content: string; usage: any }> = [
    { content: JSON.stringify(fixture.mockedAIResponses.step1Department.openai), usage: openaiTokens.step1 },
    { content: JSON.stringify(fixture.mockedAIResponses.step2Family.openai), usage: openaiTokens.step2 },
    { content: JSON.stringify(fixture.mockedAIResponses.step3Category.openai), usage: openaiTokens.step3 },
  ];
  const xaiCalls: Array<{ content: string; usage: any }> = [
    { content: JSON.stringify(fixture.mockedAIResponses.step1Department.xai), usage: xaiTokens.step1 },
    { content: JSON.stringify(fixture.mockedAIResponses.step2Family.xai), usage: xaiTokens.step2 },
    { content: JSON.stringify(fixture.mockedAIResponses.step3Category.xai), usage: xaiTokens.step3 },
  ];
  let openaiIdx = 0;
  let xaiIdx = 0;

  mockOpenAICreate.mockImplementation((args: any) => {
    const isXAI = args.model === 'grok-1';
    const call = isXAI ? xaiCalls[xaiIdx++] : openaiCalls[openaiIdx++];
    return Promise.resolve({
      choices: [{ message: { content: call.content } }],
      usage: call.usage,
    });
  });
}

describe('CategoryClassifierAgent', () => {
  let agent: CategoryClassifierAgent;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create agent instance
    agent = new CategoryClassifierAgent({
      sessionId: 'test-session-001',
      taskType: AgentTaskType.CATEGORY_CLASSIFICATION,
      pipelineVersion: PipelineVersion.AGENT_V1,
    });
  });

  /**
   * TEST 1: Fast-path happy path
   * Both sources normalize to identical picklist entry
   */
  describe('Fast-Path Optimization', () => {
    it('should skip AI chain when both sources normalize to same category', async () => {
      const input = fastPathExactMatch.input as CategoryClassifierInput;
      
      const result = await agent.execute(input, 'openai');

      // Should return fast-path result
      expect(result.reasoning.fastPathUsed).toBe(true);
      expect(result.category).toBe('Refrigerator');
      expect(result.categoryId).toBe('a01Hu000010Q5EpIAK');
      expect(result.confidence).toBe(92);
      expect(result.department).toBe('Appliances');
      expect(result.family).toBe('Kitchen');
      
      // Should NOT have called AI
      expect(mockOpenAICreate).not.toHaveBeenCalled();
      
      // Should have low processing time
      expect(result.processingTimeMs).toBeLessThan(100);
    });

    it('should fall back to chain when fast-path normalization fails', async () => {
      const input = fastPathMissChain.input as CategoryClassifierInput;
      
      // Mock AI responses for 3-step chain
      mockOpenAICreate
        // Step 1: Department (OpenAI)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify(fastPathMissChain.mockedAIResponses.step1Department.openai)
            }
          }],
          usage: { prompt_tokens: 250, completion_tokens: 50, total_tokens: 300 }
        })
        // Step 2: Family (OpenAI)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify(fastPathMissChain.mockedAIResponses.step2Family.openai)
            }
          }],
          usage: { prompt_tokens: 200, completion_tokens: 40, total_tokens: 240 }
        })
        // Step 3: Category (OpenAI)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify(fastPathMissChain.mockedAIResponses.step3Category.openai)
            }
          }],
          usage: { prompt_tokens: 300, completion_tokens: 60, total_tokens: 360 }
        });

      const result = await agent.execute(input, 'openai');

      // Should have used chain
      expect(result.reasoning.fastPathUsed).toBe(false);
      expect(result.category).toBe('Refrigerator');
      expect(result.department).toBe('Appliances');
      expect(result.family).toBe('Kitchen');
      
      // Should have called AI 3 times (one per step)
      expect(mockOpenAICreate).toHaveBeenCalledTimes(3);
      
      // Should have weighted confidence from 3 steps
      expect(result.confidence).toBeGreaterThan(85);
      expect(result.confidence).toBeLessThan(95);
    });
  });

  /**
   * TEST 2: Cross-department conflict - AIs agree
   */
  describe('Cross-Department Conflict Handling', () => {
    it('should detect conflict and both AIs agree on correct department', async () => {
      const input = crossDeptAgree.input as CategoryClassifierInput;
      
      // Use model-routed mock for parallel Promise.all execution
      setupDualAIMock(crossDeptAgree, {
        step1: { prompt_tokens: 280, completion_tokens: 70, total_tokens: 350 },
        step2: { prompt_tokens: 220, completion_tokens: 45, total_tokens: 265 },
        step3: { prompt_tokens: 320, completion_tokens: 65, total_tokens: 385 },
      }, {
        step1: { prompt_tokens: 280, completion_tokens: 65, total_tokens: 345 },
        step2: { prompt_tokens: 220, completion_tokens: 40, total_tokens: 260 },
        step3: { prompt_tokens: 320, completion_tokens: 60, total_tokens: 380 },
      });

      // Run consensus (both AIs)
      const consensus = await agent.runWithConsensus(input, 3);

      // Should detect cross-department conflict
      expect(consensus.value?.reasoning.departmentMismatch).toBe(true);
      expect(consensus.value?.reasoning.conflictResolution).toContain('Lighting & Electrical');
      
      // Both AIs should agree on final category
      expect(consensus.agreed).toBe(true);
      expect(consensus.value?.category).toBe('Vanity Lighting');
      expect(consensus.value?.department).toBe('Lighting & Electrical');
      expect(consensus.value?.family).toBe('Bath');
      
      // Should have perfect agreement
      expect(consensus.agreementScore).toBe(100);
      expect(consensus.discrepancies).toHaveLength(0);
      
      // Should have called AI 6 times (3 steps × 2 providers)
      expect(mockOpenAICreate).toHaveBeenCalledTimes(6);
    });

    it('should fail consensus when AIs disagree on department', async () => {
      const input = crossDeptDisagree.input as CategoryClassifierInput;
      
      // Use model-routed mock for parallel Promise.all execution
      setupDualAIMock(crossDeptDisagree, {
        step1: { prompt_tokens: 290, completion_tokens: 75, total_tokens: 365 },
        step2: { prompt_tokens: 230, completion_tokens: 50, total_tokens: 280 },
        step3: { prompt_tokens: 330, completion_tokens: 70, total_tokens: 400 },
      }, {
        step1: { prompt_tokens: 290, completion_tokens: 70, total_tokens: 360 },
        step2: { prompt_tokens: 230, completion_tokens: 45, total_tokens: 275 },
        step3: { prompt_tokens: 330, completion_tokens: 65, total_tokens: 395 },
      });

      const consensus = await agent.runWithConsensus(input, 0); // No retries - test first-pass disagreement detection

      // Should fail consensus
      expect(consensus.agreed).toBe(false);
      expect(consensus.agreementScore).toBe(0);
      
      // Should have critical discrepancy
      const criticalDiscrepancy = consensus.discrepancies.find(d => d.severity === 'critical');
      expect(criticalDiscrepancy).toBeDefined();
      expect(criticalDiscrepancy?.field).toBe('department');
      expect(criticalDiscrepancy?.openaiValue).toBe('Plumbing & Bath');
      expect(criticalDiscrepancy?.xaiValue).toBe('Lighting & Electrical');
      
      // Should allow retry
      expect(consensus.retryAllowed).toBe(true);
      
      // Should have retry context
      expect(consensus.retryContext).toBeDefined();
      expect(consensus.retryContext?.message).toContain('department');
      expect(consensus.retryContext?.previousResults).toBeDefined();
    });
  });

  /**
   * TEST 3: Asymmetric confidence
   */
  describe('Asymmetric Confidence Detection', () => {
    it('should flag weakConsensus when confidence disparity > 25 points', async () => {
      const input = asymmetricConfidence.input as CategoryClassifierInput;
      
      // Use model-routed mock for parallel Promise.all execution
      setupDualAIMock(asymmetricConfidence, {
        step1: { prompt_tokens: 270, completion_tokens: 60, total_tokens: 330 },
        step2: { prompt_tokens: 210, completion_tokens: 45, total_tokens: 255 },
        step3: { prompt_tokens: 310, completion_tokens: 70, total_tokens: 380 },
      }, {
        step1: { prompt_tokens: 270, completion_tokens: 55, total_tokens: 325 },
        step2: { prompt_tokens: 210, completion_tokens: 40, total_tokens: 250 },
        step3: { prompt_tokens: 310, completion_tokens: 65, total_tokens: 375 },
      });

      const consensus = await agent.runWithConsensus(input, 3);

      // Both AIs agreed on category
      expect(consensus.value?.category).toBe('Refrigerator');
      
      // But should flag weak consensus
      expect(consensus.agreed).toBe(true);
      expect(consensus.agreementScore).toBeLessThan(100); // Should be 85, not 100
      expect(consensus.agreementScore).toBeGreaterThanOrEqual(80);
      
      // Should have confidence discrepancy
      const confidenceDiscrepancy = consensus.discrepancies.find(d => d.field === 'confidence');
      expect(confidenceDiscrepancy).toBeDefined();
      expect(confidenceDiscrepancy?.severity).toBe('low');
      expect(confidenceDiscrepancy?.resolution).toContain('High disparity detected');
      
      // Should apply confidence penalty
      expect(consensus.value?.confidence).toBeLessThan(94); // Should be 84 (94 - 10)
      expect(consensus.value?.confidence).toBeGreaterThanOrEqual(80);
      
      // Should allow retry
      expect(consensus.retryAllowed).toBe(true);
      expect(consensus.source).toBe('partial-consensus');
    });
  });

  /**
   * Test helper: Verify token tracking
   */
  describe('Token Usage Tracking', () => {
    it('should aggregate token usage across all chain steps', async () => {
      const input = fastPathMissChain.input as CategoryClassifierInput;
      
      mockOpenAICreate
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(fastPathMissChain.mockedAIResponses.step1Department.openai) }}],
          usage: { prompt_tokens: 250, completion_tokens: 50, total_tokens: 300 }
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(fastPathMissChain.mockedAIResponses.step2Family.openai) }}],
          usage: { prompt_tokens: 200, completion_tokens: 40, total_tokens: 240 }
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(fastPathMissChain.mockedAIResponses.step3Category.openai) }}],
          usage: { prompt_tokens: 300, completion_tokens: 60, total_tokens: 360 }
        });

      const result = await agent.execute(input, 'openai');

      // Should have aggregated tokens from all 3 steps
      expect(result.tokensUsed).toBeDefined();
      expect(result.tokensUsed?.prompt).toBe(250 + 200 + 300); // 750
      expect(result.tokensUsed?.completion).toBe(50 + 40 + 60); // 150
      expect(result.tokensUsed?.total).toBe(900);
      
      // Should have calculated cost
      expect(result.tokensUsed?.cost).toBeGreaterThan(0);
    });
  });

  /**
   * Test helper: Classification hash stability
   */
  describe('Classification Hash', () => {
    it('should generate deterministic hash for same dept/family/category', async () => {
      const input = fastPathExactMatch.input as CategoryClassifierInput;
      
      const result1 = await agent.execute(input, 'openai');
      const result2 = await agent.execute(input, 'openai');

      // Same classification should produce same hash
      expect(result1.classificationHash).toBeDefined();
      expect(result2.classificationHash).toBeDefined();
      expect(result1.classificationHash).toBe(result2.classificationHash);
      
      // Hash should be a non-empty string (deterministic digest)
      expect(typeof result1.classificationHash).toBe('string');
      expect(result1.classificationHash!.length).toBeGreaterThan(0);
    });
  });
});
