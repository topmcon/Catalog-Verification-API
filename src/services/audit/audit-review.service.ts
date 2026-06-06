/**
 * AUDIT-REVIEW SERVICE
 * ====================
 * The reusable core of Audit Mode. Identification-only — it never writes to Salesforce and
 * never emits corrections for write-back.
 *
 * Responsibilities:
 *   1. lookupForAudit()  — 3-tier resolution of the claimed values + evidence
 *                          (stored job → payload-carried → NOT_FOUND).
 *   2. assembleEvidence() — flatten the 4 payload evidence sources into a readable block.
 *   3. runAudit()        — discriminative Claude pass → strict AuditReport.
 *
 * Used by BOTH the /audit endpoint (detect) and the confirm orchestrator (re-audit a fresh
 * verification before anything is allowed to reach Salesforce).
 */

import Anthropic from '@anthropic-ai/sdk';
import logger from '../../utils/logger';
import config from '../../config';
import { VerificationJob } from '../../models/verification-job.model';
import { SalesforceIncomingProduct, SalesforceIncomingAttribute } from '../../types/salesforce.types';
import {
  AUDIT_FIELDS,
  AuditFieldName,
  AuditInput,
  AuditReport,
  AuditFieldVerdict,
  ClaimedValues,
  AuditRequest,
  AuditEvidenceSource,
} from '../../types/audit.types';
import { buildAuditPrompt } from '../../config/audit-prompt';

const MAX_FIELD_CHARS = 4000; // bound tokens per evidence field

/** Minimal HTML → text: strip tags, decode common entities, collapse whitespace. */
function htmlToText(input: unknown): string {
  if (input === null || input === undefined) return '';
  let s = String(input);
  s = s.replace(/<\s*br\s*\/?\s*>/gi, '\n');
  s = s.replace(/<\/(p|div|li|tr|h[1-6])\s*>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  s = s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return s.length > MAX_FIELD_CHARS ? s.slice(0, MAX_FIELD_CHARS) + ' …[truncated]' : s;
}

function fmtAttrs(attrs?: SalesforceIncomingAttribute[]): string {
  if (!Array.isArray(attrs) || attrs.length === 0) return '';
  return attrs
    .filter((a) => a && (a.name || a.value))
    .map((a) => `  • ${a.name}: ${a.value}`)
    .join('\n');
}

function section(title: string, lines: Array<[string, unknown]>, attrs?: string): string {
  const body = lines
    .map(([label, val]) => {
      const v = htmlToText(val);
      return v ? `${label}: ${v}` : '';
    })
    .filter(Boolean);
  if (attrs) body.push(`Attributes:\n${attrs}`);
  if (body.length === 0) return '';
  return `### ${title}\n${body.join('\n')}`;
}

/**
 * Assemble the 4 evidence sources (payload-only, no external fetches) into a readable block.
 */
export function assembleEvidence(p: Partial<SalesforceIncomingProduct>): string {
  const blocks: string[] = [];

  blocks.push(
    section(
      'WEB RETAILER',
      [
        ['Brand', p.Brand_Web_Retailer],
        ['Category', p.Web_Retailer_Category],
        ['SubCategory', p.Web_Retailer_SubCategory],
        ['Color/Finish', p.Color_Finish_Web_Retailer],
        ['Title', p.Product_Title_Web_Retailer],
        ['Description', p.Product_Description_Web_Retailer],
        ['Features', p.Features_Web_Retailer],
      ],
      fmtAttrs(p.Web_Retailer_Specs)
    )
  );

  blocks.push(
    section(
      'FERGUSON',
      [
        ['Brand', p.Ferguson_Brand],
        ['Base Category', p.Ferguson_Base_Category],
        ['Business Category', p.Ferguson_Business_Category],
        ['Base Type', p.Ferguson_Base_Type],
        ['Product Type', p.Ferguson_Product_Type],
        ['Color', p.Ferguson_Color],
        ['Finish', p.Ferguson_Finish],
        ['Title', p.Ferguson_Title],
        ['Description', p.Ferguson_Description],
      ],
      fmtAttrs(p.Ferguson_Attributes)
    )
  );

  blocks.push(
    section('LEGACY / PREVIOUSLY-VERIFIED', [
      ['Brand', p.Brand_Legacy],
      ['Category', p.Category_Legacy],
      ['Color/Finish', p.Color_Finish_Legacy],
      ['Title', p.Product_Title_Legacy],
      ['Description', p.Product_Description_Legacy],
      ['Features', p.Features_Legacy],
    ])
  );

  blocks.push(section('SPECIFICATION TABLE', [['Spec Table', p.Specification_Table]]));

  const text = blocks.filter(Boolean).join('\n\n');
  return text || '(no evidence available in payload)';
}

/** Pull the 7 claimed values out of a stored verification result's Primary_Attributes. */
export function claimedFromResult(result: any): ClaimedValues {
  const pa = (result && result.Primary_Attributes) || {};
  const out = {} as ClaimedValues;
  for (const f of AUDIT_FIELDS) {
    const v = pa[f];
    out[f] = v === undefined || v === null ? null : String(v);
  }
  return out;
}

/** Normalize an arbitrary partial claimed object (Tier-2 / fresh result) into ClaimedValues. */
function normalizeClaimed(src: Partial<Record<string, unknown>>): ClaimedValues {
  const out = {} as ClaimedValues;
  for (const f of AUDIT_FIELDS) {
    const v = src[f];
    out[f] = v === undefined || v === null || v === '' ? (v === '' ? '' : null) : String(v);
  }
  return out;
}

/**
 * 3-tier resolution of what to audit.
 *  Tier 1: latest completed VerificationJob for this catalog (our stored output).
 *  Tier 2: SF-supplied Claimed_AI_Values + Evidence on the request.
 *  Tier 3: nothing → not_found.
 */
export async function lookupForAudit(req: AuditRequest): Promise<AuditInput | { source: 'not_found' }> {
  const sfCatalogId = req.SF_Catalog_Id;

  // Tier 1 — internal stored output (preferred)
  const job = await VerificationJob.findOne({ sfCatalogId, status: 'completed', result: { $exists: true } })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  if (job && job.result) {
    logger.info('AUDIT: resolved claimed+evidence from stored job (Tier 1)', {
      sfCatalogId,
      jobId: (job as any).jobId,
    });
    return {
      sfCatalogId,
      sfCatalogName: req.SF_Catalog_Name || (job as any).sfCatalogName,
      claimed: claimedFromResult(job.result),
      evidence: (job.rawPayload || {}) as Partial<SalesforceIncomingProduct>,
      source: 'stored_job',
    };
  }

  // Tier 2 — SF carried the data in the request
  if (req.Claimed_AI_Values && req.Evidence) {
    logger.info('AUDIT: resolved claimed+evidence from request payload (Tier 2 fallback)', { sfCatalogId });
    return {
      sfCatalogId,
      sfCatalogName: req.SF_Catalog_Name,
      claimed: normalizeClaimed(req.Claimed_AI_Values as Record<string, unknown>),
      evidence: req.Evidence,
      source: 'payload_carried',
    };
  }

  // Tier 3 — nothing to audit
  logger.warn('AUDIT: no stored job and no payload-carried data — cannot audit (Tier 3)', { sfCatalogId });
  return { source: 'not_found' };
}

function coerceVerdict(claimed: string | null, raw: any): AuditFieldVerdict {
  const status =
    raw && (raw.status === 'MATCH' || raw.status === 'MISMATCH' || raw.status === 'UNSUPPORTED')
      ? raw.status
      : 'UNSUPPORTED';
  const v: AuditFieldVerdict = { status, claimed };
  if (status === 'MISMATCH') {
    v.correct = raw?.correct ?? null;
    v.evidence = raw?.evidence ? String(raw.evidence) : undefined;
    v.root_cause = raw?.root_cause ? String(raw.root_cause) : undefined;
  } else if (status === 'MATCH') {
    v.evidence = raw?.evidence ? String(raw.evidence) : undefined;
  } else {
    v.note = raw?.note ? String(raw.note) : 'Evidence did not address this field.';
  }
  return v;
}

/** Strip markdown fences and extract the first JSON object from a model response. */
function parseJsonObject(text: string): any {
  let t = (text || '').trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const match = t.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in audit response');
  return JSON.parse(match[0]);
}

/**
 * Run the discriminative audit. Throws on a hard model/parse failure (caller sends audit_error).
 */
export async function runAudit(input: AuditInput): Promise<AuditReport> {
  const evidenceText = assembleEvidence(input.evidence);
  const prompt = buildAuditPrompt(input.claimed, evidenceText);

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

  const t0 = Date.now();
  const response = await anthropic.messages.create({
    model: config.audit.model,
    max_tokens: config.audit.maxTokens,
    temperature: 0.1, // discriminative judgment — keep deterministic
    messages: [{ role: 'user', content: prompt }],
  });

  const textPart = response.content.find((c: any) => c.type === 'text') as any;
  const rawText = textPart?.text || '';
  const parsed = parseJsonObject(rawText);
  const parsedFields = (parsed && parsed.fields) || {};

  const fields: Partial<Record<AuditFieldName, AuditFieldVerdict>> = {};
  let mismatches = 0;
  let matches = 0;
  for (const f of AUDIT_FIELDS) {
    const verdict = coerceVerdict(input.claimed[f], parsedFields[f]);
    fields[f] = verdict;
    if (verdict.status === 'MISMATCH') mismatches++;
    else if (verdict.status === 'MATCH') matches++;
  }

  const overall_status: AuditReport['overall_status'] =
    mismatches > 0 ? 'MISMATCH_FOUND' : matches > 0 ? 'MATCH' : 'INCONCLUSIVE';

  const report: AuditReport = {
    overall_status,
    fields_checked: AUDIT_FIELDS.length,
    mismatches_found: mismatches,
    fields,
    audited_at: new Date().toISOString(),
    model: config.audit.model,
    evidence_source: input.source as AuditEvidenceSource,
  };

  logger.info('AUDIT: completed', {
    sfCatalogId: input.sfCatalogId,
    overall_status,
    mismatches,
    matches,
    durationMs: Date.now() - t0,
    inputTokens: response.usage?.input_tokens,
    outputTokens: response.usage?.output_tokens,
  });

  return report;
}

/** Convenience: resolve + audit by request. Returns null source when nothing to audit. */
export async function auditFromRequest(
  req: AuditRequest
): Promise<{ report: AuditReport } | { notFound: true }> {
  const resolved = await lookupForAudit(req);
  if ('source' in resolved && resolved.source === 'not_found') {
    return { notFound: true };
  }
  const report = await runAudit(resolved as AuditInput);
  return { report };
}
