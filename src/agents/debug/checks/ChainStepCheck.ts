/**
 * ChainStepCheck — Records each AI chain step (Department → Family → Category) and retries.
 *
 * Agents call `recordChainStep()` after each dual-AI call.
 */

import { ChainStepEntry } from '../DebugReport';

/**
 * Build a ChainStepEntry from the raw AI responses.
 */
export function buildChainStepEntry(
  step: number,
  label: string,
  isRetry: boolean,
  openaiResult: { value: string; confidence: number; reasoning: string; [k: string]: any },
  xaiResult: { value: string; confidence: number; reasoning: string; [k: string]: any },
  agreementScore: number,
  outcome: string,
): ChainStepEntry {
  const { value: _ov, confidence: _oc, reasoning: _or, ...openaiExtras } = openaiResult;
  const { value: _xv, confidence: _xc, reasoning: _xr, ...xaiExtras } = xaiResult;

  return {
    step,
    label,
    isRetry,
    openai: {
      value: openaiResult.value,
      confidence: openaiResult.confidence,
      reasoning: openaiResult.reasoning,
      extras: openaiExtras,
    },
    xai: {
      value: xaiResult.value,
      confidence: xaiResult.confidence,
      reasoning: xaiResult.reasoning,
      extras: xaiExtras,
    },
    agreementScore,
    outcome,
  };
}
