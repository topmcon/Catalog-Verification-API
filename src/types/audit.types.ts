/**
 * Audit Mode Types
 * ================
 * Audit Mode is an IDENTIFICATION-ONLY pass. It takes the 7 AI-generated fields we
 * previously produced for a product (the "claimed" values) and checks each against the
 * raw payload evidence (Web Retailer, Ferguson, Legacy/Verified, Specification_Table).
 *
 * It does NOT generate corrected fields for write-back. Any correction that ultimately
 * reaches Salesforce must come from a real verification run that has subsequently
 * passed a re-audit (see audit-review.service.ts → confirm orchestrator).
 *
 * The response shape mirrors exactly what the Salesforce CatalogVerificationRest audit
 * branch stores into AI_Audit_Report__c. There is intentionally NO `corrections` key.
 */

/** The 7 AI fields under audit. Keys match Primary_Attributes.* in the verification response. */
export const AUDIT_FIELDS = [
  'AI_Brand',
  'AI_Product_Category',
  'AI_Type',
  'AI_Style',
  'AI_Color',
  'AI_Finish',
  'AI_Product_Title',
] as const;

export type AuditFieldName = (typeof AUDIT_FIELDS)[number];

/** The 7 claimed AI values being audited (what the AI previously produced). */
export type ClaimedValues = Record<AuditFieldName, string | null>;

/** Per-field verdict. */
export interface AuditFieldVerdict {
  // MATCH       → claimed value is supported by the evidence
  // MISMATCH    → evidence contradicts the claimed value (correct + evidence required)
  // UNSUPPORTED → no evidence either way (cannot confirm or deny; not a failure)
  status: 'MATCH' | 'MISMATCH' | 'UNSUPPORTED';
  claimed: string | null;
  correct?: string | null;   // present on MISMATCH — the value the evidence supports
  evidence?: string;         // verbatim/near-verbatim snippet from the payload that justifies the verdict
  root_cause?: string;       // MISMATCH only — hypothesis for WHY the pipeline produced the wrong value
  note?: string;             // UNSUPPORTED only — why no determination could be made
}

export interface AuditReport {
  overall_status: 'MATCH' | 'MISMATCH_FOUND' | 'INCONCLUSIVE';
  fields_checked: number;
  mismatches_found: number;
  fields: Partial<Record<AuditFieldName, AuditFieldVerdict>>;
  audited_at: string;        // ISO 8601
  model: string;             // model used for the audit
  evidence_source: AuditEvidenceSource; // where claimed+evidence came from (tier)
}

/** Where the audited data came from — the 3-tier lookup outcome. */
export type AuditEvidenceSource = 'stored_job' | 'payload_carried' | 'not_found';

/** Inbound request to POST /api/verify/salesforce/audit. */
export interface AuditRequest {
  SF_Catalog_Id: string;
  SF_Catalog_Name: string;
  webhookUrl?: string;
  // Tier-2 fallback: SF may optionally include the data so audits work even when we have
  // no stored record. When present these override the internal lookup.
  Claimed_AI_Values?: Partial<ClaimedValues>;
  Evidence?: Partial<import('./salesforce.types').SalesforceIncomingProduct>;
  mode?: 'detect' | 'confirm'; // detect (default) = identify; confirm = re-audit a fresh verification
}

/** The webhook payload we POST back to Salesforce — matches the SF audit branch contract. */
export interface AuditWebhookPayload {
  audit_mode: true;
  SF_Catalog_Id: string;
  SF_Catalog_Name: string;
  status: 'audit_complete' | 'audit_not_found' | 'audit_error';
  audit_report?: AuditReport;
  message?: string;
}

/** Inputs to the reusable audit core. */
export interface AuditInput {
  sfCatalogId: string;
  sfCatalogName: string;
  claimed: ClaimedValues;
  /** Raw payload providing the evidence (the original incoming SF product). */
  evidence: Partial<import('./salesforce.types').SalesforceIncomingProduct>;
  source: AuditEvidenceSource;
}
