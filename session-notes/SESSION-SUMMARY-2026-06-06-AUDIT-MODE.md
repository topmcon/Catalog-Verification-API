# Session Summary — June 6, 2026
## Audit Mode — server-side toggle to audit AI-verified data for accuracy (Finding #077)

---

## Context / Why

The user is seeing AI-verified products in Salesforce with **incorrect titles and fields** (wrong
colors, categories, types) that are *clearly* contradicted by the product's own description,
features, or spec table. They wanted a way to **audit** already-verified data against that evidence,
find the mistakes, diagnose *why* the pipeline got them wrong, fix the logic, **confirm** the fix,
and only then push corrected data back.

A long design conversation established the architecture. Two hard constraints emerged:
1. **The audit must be identification-only** — it never invents corrections that bypass the
   pipeline. Anything that reaches SF must be the output of a real verification run.
2. **The verification pipeline cannot certify its own fix** — it already "passed" the wrong answer
   once. The **audit is the independent gate**: a fix is only confirmed when a *re-audit* flips to
   MATCH with an evidence citation.

The user then added the decisive simplification: **they cannot build the Salesforce side.** So the
entire feature is now a **server-side toggle on our end** — SF keeps sending normal verification
calls; when the toggle is on, we reroute them to the audit protocol. No SF changes required.

---

## Architecture (as built)

**One env toggle**: `AUDIT_MODE` in `/opt/catalog-verification-api/.env` (read at boot).

| `AUDIT_MODE` | Inbound `/api/verify/salesforce` call does… | Writes to SF? |
|--------------|----------------------------------------------|---------------|
| `off` (default) | Normal verification (unchanged) | ✅ normal |
| `detect` | Audits our **previously-verified** output (latest completed `verification_jobs` result) vs the **fresh** evidence SF just sent; report stored in `audit_jobs`. No verify, no push. `not_found` if never verified. | ❌ never |
| `confirm` | Re-verifies the inbound payload **without pushing** (calling `verifyProductWithDualAI` directly never fires the webhook) → independent audit gate → pushes corrected output via the **normal** verification webhook **only if** the re-audit is clean (`overall_status === 'MATCH'`, 0 mismatches) | ✅ only audit-passed |

**7 audited fields**: AI_Brand, AI_Product_Category, AI_Type, AI_Style, AI_Color, AI_Finish,
AI_Product_Title.
**4 evidence sources (payload-only, no external fetch)**: Web Retailer, Ferguson, Legacy/Verified,
Specification_Table.

**The audit prompt is discriminative** ("is this claimed value supported by the evidence — yes/no?"),
not generative, so it doesn't just repeat the generator's mistake. Every verdict must cite a verbatim
evidence snippet; every MISMATCH includes the correct value + a root-cause hypothesis. Strict JSON,
**no `corrections` key**.

**Results live on our side** (`audit_jobs` collection), reviewed via `scripts/audit-report.js` and
`GET /api/verify/salesforce/audit/status/:auditId`. They are NOT sent to SF (SF has no audit field);
`AUDIT_SEND_TO_SF` gates that and stays **false**.

**Flow**: `detect` → review mismatches + root causes → fix pipeline + deploy → `confirm` → resend →
only fixed products push to SF → `off`.

---

## Files Added

| File | Purpose |
|------|---------|
| `src/types/audit.types.ts` | `AuditReport`, `AuditFieldVerdict` (MATCH/MISMATCH/UNSUPPORTED), `AuditRequest`, `AuditWebhookPayload`, `AUDIT_FIELDS` |
| `src/config/audit-prompt.ts` | Version-controlled discriminative audit prompt (cite-the-evidence, root-cause, no corrections) |
| `src/services/audit/audit-review.service.ts` | Core: 3-tier lookup, `assembleEvidence` (4 sources, HTML→text), `runAudit` (Claude → parsed `AuditReport`), `claimedFromResult` |
| `src/services/audit/audit-processor.service.ts` | Routed detect/confirm + endpoint detect/confirm; `maybeSendToSf` gate |
| `src/services/audit/audit-webhook.service.ts` | Sends `audit_mode:true` report to SF (only if `AUDIT_SEND_TO_SF=true`) |
| `src/models/audit-job.model.ts` | `audit_jobs` collection (mode, routed, status, report, confirmPushed) |
| `src/controllers/audit.controller.ts` | `auditSalesforce`, `getAuditStatus`, `routeVerificationToAudit` |
| `scripts/audit-report.js` | Review audit results (our side) — filters: `--mismatches`, `--mode`, `--catalog`, `--since`, `--json` |
| `scripts/audit-confirm.js` | Targeted confirm after a fix (dry-run default, `--execute`) |

## Files Modified

| File | Change |
|------|--------|
| `src/config/index.ts` | `config.audit` = { mode (`AUDIT_MODE` off/detect/confirm), enabled, sendToSf (`AUDIT_SEND_TO_SF`), model, maxTokens }; back-compat with `AUDIT_MODE_ENABLED=true`→detect |
| `src/controllers/salesforce-async-verification.controller.ts` | When `config.audit.mode !== 'off'`, reroute inbound call to `routeVerificationToAudit` (after field validation) |
| `src/routes/salesforce-async-verification.routes.ts` | Registered `POST /salesforce/audit` + `GET /salesforce/audit/status/:auditId` (behind existing `apiKeyAuth`) |
| `CLAUDE.md` / `.github/copilot-instructions.md` | New **Audit Mode** section; Establish Connection step (ask to turn ON); Save Everything step (always ask to turn OFF) |

---

## Key implementation facts (verified against real prod data)

- Stored verification output shape (confirmed by inspecting a real `verification_jobs` doc on prod):
  `job.result.Primary_Attributes.{AI_Brand, AI_Product_Category, AI_Type, AI_Style, AI_Color,
  AI_Finish, AI_Product_Title}` at the TOP level (NOT under `.data`). Evidence in `job.rawPayload`.
- Inbound `/salesforce` auth = `apiKeyAuth` checking `x-api-key` header against `WEBHOOK_SECRET`
  (= the `af3d3fd8…` key SF already sends). Audit endpoint inherits this — no SF auth change.
- Prod env is `/opt/catalog-verification-api/.env` via systemd `EnvironmentFile`; `ANTHROPIC_API_KEY`
  present. Toggling `AUDIT_MODE` requires editing `.env` + `systemctl restart`.
- Claude model for audit: `claude-sonnet-4-6` (same family as Phase B review), temp 0.1.

---

## Current System State

- **Local type-check**: `./node_modules/.bin/tsc --noEmit` → **0 errors**. Both scripts pass `node --check`.
- **Deployed**: see deploy section in this summary — shipped **dormant** (`AUDIT_MODE=off`), so normal
  traffic is untouched until deliberately enabled.
- **SF side**: the earlier SF-side build (CatalogAuditAPI, Run_AI_Audit button, audit branch in
  CatalogVerificationRest) is **NOT needed** for this approach and was shelved (user can't build SF).

## Remaining / Next Steps

1. **Test**: set `AUDIT_MODE=detect` on prod (+restart), send a known-bad product (e.g. an oven/range)
   through SF's normal verification, then `node scripts/audit-report.js --mismatches` to confirm it
   flags the issue with evidence + root cause. Then `off`.
2. **Optional enhancement**: no-restart runtime toggle (authenticated admin endpoint to set the mode
   in-memory) so flipping doesn't require a service restart / risk dropped traffic.
3. **Deferred (unchanged from prior session)**: type-system remediation (122 names), per-field AI
   confidence, T7 route-dropped-specs, 49 stale SF creation requests (now 73).

## Key Reference Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` → "Audit Mode" section | Toggle commands, modes, review/confirm scripts, workflow |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` → Finding #077 | This feature's registry entry |
| `scripts/audit-report.js` / `scripts/audit-confirm.js` | Review + targeted-confirm tooling |
| `src/services/audit/audit-review.service.ts` | The audit core (lookup + evidence + Claude) |
