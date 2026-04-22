/**
 * ConsoleFormatter — Renders a DebugReport as structured text for the logger.
 *
 * Output is designed for readability in log files and terminal output.
 * Each section is numbered and uses severity icons (✅ ⚠️ 🚨) from the checks.
 */

import { DebugReport, ChainStepEntry, PayloadSeverity } from '../DebugReport';

const SEPARATOR = '══════════════════════════════════════════════════════════';

export function formatDebugReport(report: DebugReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(SEPARATOR);
  lines.push(`  AGENT DEBUG REPORT — SF_Catalog_Id: ${report.sfCatalogId}`);
  lines.push(SEPARATOR);
  lines.push('');

  // [1] PAYLOAD HEALTH
  if (report.payloadHealth) {
    lines.push('[1] PAYLOAD HEALTH');
    for (const entry of report.payloadHealth.entries) {
      lines.push(`  ${entry.severity} ${entry.message}`);
    }
    lines.push('');
  }

  // [2] FERGUSON EXTRACTION
  if (report.fergusonExtract) {
    lines.push('[2] FERGUSON EXTRACTION (Phase 0.1A)');
    lines.push(`  Source: ${report.fergusonExtract.source}`);

    const extracted = report.fergusonExtract.extracted;
    const extractedKeys = Object.keys(extracted);
    if (extractedKeys.length > 0) {
      lines.push('  Extracted:');
      for (const key of extractedKeys) {
        lines.push(`    ${key}: "${truncate(extracted[key], 80)}"`);
      }
    } else {
      lines.push('  Extracted: (none — fields were already populated or absent)');
    }

    if (report.fergusonExtract.missingAfterExtraction.length > 0) {
      lines.push(`  Missing after extraction: ${report.fergusonExtract.missingAfterExtraction.join(', ')}`);
    }
    lines.push('');
  }

  // [3] CATEGORY CLASSIFIER INPUT
  if (report.categoryInput) {
    lines.push('[3] CATEGORY CLASSIFIER INPUT');
    for (const [key, val] of Object.entries(report.categoryInput.fields)) {
      if (val === undefined || val === '') {
        lines.push(`  ${key}: [ABSENT]`);
      } else {
        lines.push(`  ${key}: "${truncate(val, 80)}"`);
      }
    }
    for (const w of report.categoryInput.warnings) {
      lines.push(`  ${PayloadSeverity.WARNING} ${w}`);
    }
    lines.push('');
  }

  // [4] FAST-PATH DECISION
  if (report.fastPath) {
    const fp = report.fastPath;
    lines.push('[4] FAST-PATH DECISION');
    lines.push(`  Ferguson normalized: ${fp.fergusonNormalized ?? '[absent]'} → picklist match: ${fp.fergusonPicklistMatch ?? 'null'}`);
    lines.push(`  Web retailer normalized: ${fp.webRetailerNormalized ?? '[absent]'} → picklist match: ${fp.webRetailerPicklistMatch ?? 'null'}`);
    lines.push(`  Result: ${fp.hit ? 'FAST-PATH HIT ✅' : 'FAST-PATH MISS → Chain triggered'}`);
    lines.push(`  Reason: ${fp.reason}`);
    lines.push('');
  }

  // [5] CHAIN STEPS
  if (report.chainSteps.length > 0) {
    for (const step of report.chainSteps) {
      formatChainStep(lines, step);
    }
  }

  // [6] CONSENSUS RESULT
  if (report.consensus) {
    const c = report.consensus;
    lines.push('[6] CONSENSUS RESULT');
    lines.push(`  category: "${c.category}"`);
    lines.push(`  categoryId: "${c.categoryId}"`);
    lines.push(`  department: "${c.department}"`);
    lines.push(`  family: "${c.family}"`);
    lines.push(`  confidence: ${c.confidence}`);
    lines.push(`  locked: ${c.locked}`);
    lines.push(`  weakConsensus: ${c.weakConsensus}`);
    lines.push(`  agentSource: ${c.agentSource}`);
    lines.push('');
  }

  // [7] ORCHESTRATOR DECISION
  if (report.orchestrator) {
    const o = report.orchestrator;
    lines.push('[7] ORCHESTRATOR DECISION');
    lines.push(`  decision: ${o.decision}`);
    if (o.escalationReason) {
      lines.push(`  escalationReason: ${JSON.stringify(o.escalationReason)}`);
    }
    if (o.categoryHint) {
      lines.push(`  categoryHint: { value: "${o.categoryHint.value}", confidence: ${o.categoryHint.confidence}, source: "${o.categoryHint.source}" }`);
    }
    lines.push('');
  }

  // [8] MONOLITH COMPARISON
  if (report.comparison) {
    const cmp = report.comparison;
    lines.push('[8] MONOLITH COMPARISON');
    lines.push(`  Agent category:    "${cmp.agentCategory}" (confidence: ${cmp.agentConfidence})`);
    lines.push(`  Monolith category: "${cmp.monolithCategory}"`);
    lines.push(`  matched: ${cmp.matched ? 'true ✅' : 'false ❌'}`);
    lines.push(`  pipeline_comparison written: ${cmp.written ? 'yes' : 'no'}`);
    lines.push('');
  }

  // [TOTALS]
  if (report.totals) {
    lines.push(SEPARATOR);
    lines.push(
      `  TOTAL AGENT TIME: ${report.totals.agentTimeMs.toLocaleString()}ms` +
      ` | TOKENS: ${report.totals.totalTokens.toLocaleString()}` +
      ` | COST: $${report.totals.estimatedCost.toFixed(4)}`
    );
    lines.push(SEPARATOR);
  }

  lines.push('');
  return lines.join('\n');
}

// ────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────

function formatChainStep(lines: string[], step: ChainStepEntry): void {
  const tag = step.isRetry ? `[5r] CHAIN — ${step.label} RETRY` : `[5] CHAIN — ${step.label}`;
  lines.push(tag);
  lines.push(`  OpenAI:  "${step.openai.value}" (confidence: ${step.openai.confidence})`);
  lines.push(`           reasoning: "${truncate(step.openai.reasoning, 100)}"`);
  for (const [k, v] of Object.entries(step.openai.extras)) {
    lines.push(`           ${k}: ${JSON.stringify(v)}`);
  }
  lines.push(`  xAI:     "${step.xai.value}" (confidence: ${step.xai.confidence})`);
  lines.push(`           reasoning: "${truncate(step.xai.reasoning, 100)}"`);
  for (const [k, v] of Object.entries(step.xai.extras)) {
    lines.push(`           ${k}: ${JSON.stringify(v)}`);
  }
  lines.push(`  → ${step.outcome} (agreementScore: ${step.agreementScore})`);
  lines.push('');
}

function truncate(s: string, maxLen: number): string {
  if (!s) return '';
  return s.length > maxLen ? s.substring(0, maxLen) + '...' : s;
}
