/**
 * FastPathCheck — Records why fast-path was hit or missed.
 *
 * The debugger calls this from CategoryClassifierAgent's fast-path logic.
 * It doesn't re-run the logic — the agent writes the check during execution.
 */

import { FastPathEntry } from '../DebugReport';

/**
 * Factory for a "miss" result with an explanatory reason.
 */
export function fastPathMiss(reason: string, partial?: Partial<FastPathEntry>): FastPathEntry {
  return {
    fergusonNormalized: partial?.fergusonNormalized ?? null,
    fergusonPicklistMatch: partial?.fergusonPicklistMatch ?? null,
    webRetailerNormalized: partial?.webRetailerNormalized ?? null,
    webRetailerPicklistMatch: partial?.webRetailerPicklistMatch ?? null,
    hit: false,
    reason,
  };
}

/**
 * Factory for a "hit" result.
 */
export function fastPathHit(
  fergusonNormalized: string,
  fergusonPicklistMatch: string,
  webRetailerNormalized: string,
  webRetailerPicklistMatch: string,
): FastPathEntry {
  return {
    fergusonNormalized,
    fergusonPicklistMatch,
    webRetailerNormalized,
    webRetailerPicklistMatch,
    hit: true,
    reason: 'Both sources normalized to same picklist category',
  };
}
