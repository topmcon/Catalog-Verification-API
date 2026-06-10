# Platform Audit Guide — Gaps, Enhancements, Oversight, Concerns, Waste, Inaccuracies

> **Purpose**: The standing methodology and execution plan for auditing the ENTIRE Catalog Verification
> platform — not one product at a time. This is the continuity document: any session (human or AI) should
> be able to open this file cold, see exactly where the audit stands, and execute the next step.
>
> **Created**: 2026-06-09, directly out of Finding #078 (the audit-loop convergence failure).
> **Maintained by**: every session that works on the audit. Update the Status Board below before ending a session.
> **Companion docs**: `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` (the findings registry — every confirmed issue gets
> a Finding number there), `CLAUDE.md` (operational procedures), session-notes/ (per-session detail).

---

## 📌 STATUS BOARD — update this every session

| Phase | Description | Status | Last touched | Notes |
|-------|-------------|--------|--------------|-------|
| 0 | This guide written & methodology agreed | ✅ Done | 2026-06-09 | — |
| G0 | Test baseline repair: jest green + tests wired into pre-deploy gate (§6.0) | ✅ Done | 2026-06-09 | 61/61 green; jest = critical CHECK #2 in `pre-deploy-validate-all.sh`; validator passes ALL 10 on prod. Evidence: `ACCEPTANCE-LOG.md` |
| 1 | Corpus-wide deterministic scans + waste mining + config coverage | ✅ Done | 2026-06-09 | 19,113 jobs scanned; results + `PHASE-1-SUMMARY.md` in `audit-results/platform-audit/2026-06-09/` |
| 2 | Calibrated sampled LLM audit + golden set creation | 🟡 In progress | 2026-06-09 | Selection DONE: 49 SKUs, 14 strata, payloads + draft answers in `audit-results/golden-set/`. **Blocked on human review** (workflow: `audit-results/golden-set/README.md`). Then: calibration + L2 sampling |
| 3 | Code / architecture / security review (static, local) | ⬜ Not started | — | Can run in parallel with Phase 2 |
| 4 | Synthesis → ranked scorecard → prioritized fixes via golden harness | ⬜ Not started | — | Fixes logged as Findings |

**Current next action**: HUMAN — review `audit-results/golden-set/golden-answers.draft.json` per the
workflow in `audit-results/golden-set/README.md` (49 SKUs; partial review is usable). In parallel, an
agent session can run Phase 3 (§6.3 static code/security review) and build the golden harness scaffold
(`scripts/golden-harness/`) so it's ready the moment answers are signed off. G0 is done — the fix gate
(G1–G4) is live; code fixes may now ship through it. **Phase 1 headlines**: 85% of all AI spend = duplicate re-verifications
(WST-04, ≈$820); style defaulting covers 70% of corpus (ACC-12); finish==color 39.7% (ACC-05); title-length
rule violated 56.6% (ACC-01); research efficacy unmeasured — fieldsCaptured=0 on 100% of web-search/vision
calls (WST-02/07). Scanner TODOs for next pass: era-split tables for ACC-07a/ACC-08, GAP-03 age buckets,
ACC-10 conversion validation, fixture self-tests per the §6.0 Phase 1 gate (not yet written).

---

## 1. Why this methodology (the lesson that created this document)

Finding #078 (June 8, 2026) proved the previous approach — fix one product, deploy, re-run a live LLM audit,
repeat — **cannot converge and does not scale**:

1. **The LLM audit verdict is non-deterministic.** The same product (B18IF70NSP) flipped its own verdict
   between two same-day runs. Code cannot be converged against a moving target.
2. **Each live confirm re-runs the full pipeline** (research, web search, image vision, dual-LLM) — ~90s+
   per product and fresh randomness every run (e.g. image vision invented a "Glossy" finish not present in
   any source data).
3. **No regression set** — a fix aimed at one product silently regressed a sibling (ACCESSORIES guard fixed
   RD1884L4D, broke NSCZ10WH6).
4. **Failure classes were conflated.** Only one of three classes is fixable in pipeline code:
   - **Class 1 — real pipeline bug** → fix in code, verify with deterministic tests
   - **Class 2 — ambiguous/bad source data** (sibling-SKU spec sheets, wrong retailer brand) → data decision, not code
   - **Class 3 — audit over-strictness** (e.g. Style always UNSUPPORTED) → fix the auditor, not the pipeline

**Therefore, the platform audit follows these principles:**

- **P1 — Mine stored data first.** Every job's full input (`rawPayload`) and output (`result`) is already in
  MongoDB. Most of the audit needs zero live traffic and zero AI spend.
- **P2 — Deterministic before probabilistic.** Rules that compute the same answer every run come first and
  run against the *whole corpus*. LLM judgment is a triage layer on *samples*, and is calibrated before trusted.
- **P3 — Human golden answers are the only ground truth.** A small hand-verified SKU set beats an unlimited
  number of LLM verdicts.
- **P4 — Classify before fixing.** Every finding is tagged Class 1/2/3 before any code changes.
- **P5 — Measure impact, then prioritize.** The output is quantified ("X% of jobs affected", "$Y/month wasted"),
  so the fix order is driven by measured impact, not by the most recent complaint.

---

## 2. The three measurement layers

| Layer | What | Trust | Cost | Coverage |
|-------|------|-------|------|----------|
| **L1 Deterministic** | Rule-based scans over stored jobs + config cross-checks | High (same answer every run) | ~$0, minutes | **Entire corpus** |
| **L2 LLM-judged** | `detect`-style audit verdicts | Medium — use only after calibration (§5.2) | AI tokens | Stratified samples |
| **L3 Human golden** | Hand-verified correct values per SKU | Ground truth | Human time | 50–100 SKUs |

Anything L1 can express as a rule should never be delegated to L2. L2 exists for semantic questions rules
can't catch ("does this title describe the right product?"). L3 calibrates L2 and gates all future fixes.

---

## 3. Evidence inventory — where everything already lives

### MongoDB (production, `catalog-verification` db, via `ssh mardeys-prod` + `docker exec mongodb mongosh`)

| Collection | What's in it | Audit use |
|------------|-------------|-----------|
| `verification_jobs` | Full inbound payload (`rawPayload`), full output (`result`), `status`, `webhookSuccess`, `salesforceAcknowledged`, `processingTimeMs`, timestamps | The core corpus for L1 scans — inputs AND outputs for every job ever run |
| `audit_jobs` | Audit Mode verdicts (detect/confirm), per-field status, evidence, root-cause | L2 history; calibration data |
| `aiusage` | Per-call AI cost/token records | Waste analysis (§4.2) |
| `pendingcreationrequests` | Picklist items SF hasn't created (49 stale as of June 2026) | Gap analysis |
| `pendingpicklistsyncs` | Held SF picklist syncs | Oversight analysis |

> ⚠️ Collection is `verification_jobs` (underscore). Payload field is `rawPayload`, NOT `input`.

### Logs
- `/opt/catalog-verification-api/logs/combined.log` and `error.log` — webhook failures, FAIL reviews,
  guard firings, research/vision activity.

### Config & code (local repo)
- `src/config/salesforce-picklists/*.json` (brands, categories, styles, attributes, types)
- `src/config/title-schema-by-category.ts`, `category-size-classes.ts`, `category-attributes.ts`,
  `category-type-mapping.json`, `model-family-overrides.json`
- `src/services/dual-ai-verification.service.ts` (~15k lines — the pipeline)
- `src/config/audit-prompt.ts` (the L2 auditor — where Class-3 strictness lives)

### Existing scripts (run on prod via SSH)
- `scripts/verify-batch.js` — recent-cluster quality report
- `scripts/verification-api-accuracy-audit.js` — last-300-calls field audit (prototype of L1 thinking)
- `scripts/audit-report.js` / `scripts/audit-confirm.js` — L2 review / targeted re-verify+push
- `scripts/show-session-analytics.js`, `scripts/check-pending-picklist-syncs.js`,
  `scripts/check-pending-creation-requests.js`

---

## 4. The six audit dimensions and their concrete checks

Every check has an ID. Scan results and scorecard entries reference these IDs. Add new checks here as they're
conceived — this list is expected to grow.

### 4.1 INACCURACIES (`ACC-*`) — is the output wrong?

L1 deterministic scans over every completed job's `result` vs its own `rawPayload`:

| ID | Check | Signal of |
|----|-------|-----------|
| ACC-01 | Title length outside 60–80 chars | Schema/slot failures |
| ACC-02 | Model number in title ≠ `SF_Catalog_Name` | Sibling-SKU bleed (Finding #065 class) |
| ACC-03 | Title dimension vs spec-table width: gap > 4" | Wrong size class / default-size guessing |
| ACC-04 | `AI_Finish` matches plain-color/config denylist (`white\|black\|…\|panel ready\|integrated`) | Color-as-finish (Finding #078 Bug C class) |
| ACC-05 | `AI_Finish` equals `AI_Color` | Duplicate finish |
| ACC-06 | `AI_Color` length > 30 chars, or contains digits/`inch`/`cm` | Spec-table over-capture (Bug A class) |
| ACC-07 | Category not valid for department | Validation bypass bugs |
| ACC-08 | Type not valid for category (vs `category-type-mapping.json`) | Type-system drift |
| ACC-09 | Brand not in `brands.json` | Brand hallucination / alias gaps |
| ACC-10 | Canadian (`CA_` key) jobs: price/weight conversion sanity | Phase 0.0 failures |
| ACC-11 | Repeated tokens in title (e.g. "White … White") | Slot duplication |
| ACC-12 | `AI_Style` = "Contemporary" rate per category (a near-100% rate = a default, not an extraction) | Style defaulting (Class 3 vs Class 1 — decide which) |
| ACC-13 | Dimensions non-numeric, zero, or implausible (>200") | Extraction failures |
| ACC-14 | MSRP vs Ferguson MSRP discrepancy > 30% | Phase 0.2 flag efficacy |

L2 (sampled, calibrated): semantic title accuracy, category correctness for ambiguous products,
accessory-vs-appliance classification. L3: golden-set comparison once built (§5).

### 4.2 WASTE (`WST-*`) — what are we paying for that delivers nothing?

Mined from `aiusage` + `verification_jobs` + logs:

| ID | Check |
|----|-------|
| WST-01 | Cost per job, broken down by phase/provider; distribution and outliers |
| WST-02 | Research efficacy: how often Phases 4–6 (retries, web search) fire vs how often they actually change a field's final value. Research that changes nothing is pure spend |
| WST-03 | Claude Phase B corrections computed then **discarded** (the known title-override issue — we pay Claude for a title we throw away) |
| WST-04 | Same SKU verified multiple times (duplicate spend); count and cost |
| WST-05 | Jobs fully processed but rejected by SF (`webhookSuccess`/rejection messages — the cagp-lot pattern: 763 jobs paid for, zero applied) |
| WST-06 | Processing time > 300s — where does the time go (research? retries? vision?) |
| WST-07 | Image-vision contribution audit: which fields does vision actually populate, and how often are those values contradicted by payload text (it invented "Glossy"). A field vision should not own (e.g. `finish`) is both waste AND an inaccuracy vector |
| WST-08 | Token-truncation events: how often, and did truncated jobs have worse outcomes |

### 4.3 GAPS (`GAP-*`) — what's missing?

| ID | Check |
|----|-------|
| GAP-01 | "Not Found"/empty rate per output field per category — a coverage heatmap. High-rate cells = extraction gaps or genuinely absent data (classify which) |
| GAP-02 | Config cross-coverage (pure local L1): every category in `categories.json` has a title schema, size class, type mapping, and top-15 attribute set. Orphans in either direction |
| GAP-03 | Picklist gap backlog: FailedMatchLog patterns + 49 stale pending creation requests (Freestanding/Counter Depth styles are 72+ days old) — quantify job impact of each missing item |
| GAP-04 | `NEEDS_SF_ID` inventory in `attributes.json`: separate the ~33 legitimate from the 6 known-garbage entries (`actual_product`, `detected_product`, `image_detected`, `serial_number_example`, `serial_example`, `listing`) |
| GAP-05 | Data-source scenario distribution (`both_sources` / `ferguson_only` / `web_retailer_only` / `no_sources`) × outcome quality — which scenarios systematically underperform |
| GAP-06 | Audit coverage gap: Audit Mode judges 7 fields; the pipeline outputs ~40. What QA exists (or should) for the other 33 |

### 4.4 OVERSIGHT (`OVS-*`) — what has no feedback loop or owner?

| ID | Check |
|----|-------|
| OVS-01 | Webhook outcome rates: `webhookSuccess`, `salesforceAcknowledged`, rejection reasons — is anyone alerted when SF rejects? |
| OVS-02 | **No regression suite / golden set** — the #078 root cause. Closed by §5 |
| OVS-03 | Pre-deploy validation broken on prod (`tsc` not in PATH; GPM check failing) — a safety control that silently doesn't run |
| OVS-04 | Pending picklist sync aging — held items with no review SLA |
| OVS-05 | No alerting on `error.log`, FAIL reviews, or webhook failures (only manual log-watching) |
| OVS-06 | The Known Issues list in `CLAUDE.md` — unowned backlog; each item needs an owner/decision (cagp-lot resubmission?, 10 historical requeues, garbage attributes) |
| OVS-07 | Audit results feed nothing back automatically — verdicts accumulate in `audit_jobs` with no loop into prompts, config, or alerts |
| OVS-08 | Doc-sync compliance: `CLAUDE.md` ↔ `.github/copilot-instructions.md` drift check |
| OVS-09 | Test suite not a functioning gate: 2 stale failures (red baseline), ~0% pipeline coverage, `npm test` absent from every deploy/validation procedure (verified 2026-06-09). Closed by G0 + G2 (§6.0) |

### 4.5 CONCERNS (`CON-*`) — risk: security, reliability, architecture

| ID | Check |
|----|-------|
| CON-01 | Secrets hygiene: the inbound `WEBHOOK_SECRET` appears in plaintext in committed session notes. Inventory all secret occurrences in the repo; decide rotation + scrubbing policy |
| CON-02 | MongoDB runs unauthenticated (mitigated by localhost-only binding — verify that binding and the Docker port mapping) |
| CON-03 | Production access = root SSH, single key. No audit trail of changes beyond git |
| CON-04 | Single server, no redundancy; MongoDB backup existence/restore-test status unknown — verify |
| CON-05 | `systemctl restart` kills in-flight jobs (observed twice in #078 work) — no drain/graceful shutdown |
| CON-06 | `dual-ai-verification.service.ts` at ~15k lines concentrates nearly all change risk in one file; no unit tests around its pure functions |
| CON-07 | Endpoint auth coverage: verify every mutating endpoint (`/approve`, `/reject`, sync, audit) actually enforces `apiKeyAuth` — the documented approve `curl` carries no auth header |
| CON-08 | `npm audit` findings (warnings observed during deploys) — triage severity |

### 4.6 ENHANCEMENTS (`ENH-*`) — ranked opportunities (fed by all of the above)

Standing candidates (extend as the audit produces more):

| ID | Enhancement | Origin |
|----|-------------|--------|
| ENH-01 | **Local test harness** running stored `rawPayload`s through the deterministic post-LLM functions (`findInSpecificationTable`, finish guard, ACCESSORIES guard, explicitColor…) — seconds per iteration, no deploy, no LLM | #078 |
| ENH-02 | **Golden set as permanent regression gate** for every pipeline change | #078 / §5 |
| ENH-03 | Gate image-vision out of fields it shouldn't own (e.g. `finish` for appliances) instead of growing denylists | #078 "Glossy" |
| ENH-04 | Reconcile the Claude Phase B title override: use Claude's title when component fields demonstrably differ, instead of always discarding it | Known Issues |
| ENH-05 | Audit-prompt strictness fixes so UNSUPPORTED (e.g. Style) doesn't block a confirm push | Class 3 |
| ENH-06 | Per-field confidence scores in output | June 2026 audit deferred list |
| ENH-07 | Spec routing — route dropped specs through attribute matching (task T7, still pending) | June 2026 audit |
| ENH-08 | Alerting: webhook failures, FAIL reviews, error.log spikes → notification | OVS-01/05 |
| ENH-09 | Graceful drain on restart (stop intake, finish in-flight, then exit) | CON-05 |

---

## 5. The golden set — the platform's ground truth

### 5.1 What it is
50–100 SKUs with **human-verified** correct values for the 7 audited fields (Brand, Category, Type, Style,
Color, Finish, Title), each value backed by a citation into that SKU's own stored payload.

**Location**: `audit-results/golden-set/golden-answers.json`
**Format** (one entry per SKU):

```json
{
  "sf_catalog_id": "a03...",
  "sf_catalog_name": "NS-CZ10WH6",
  "fields": {
    "AI_Brand":            { "correct": "INSIGNIA", "evidence": "Spec Table: Brand: Insignia™", "ambiguous": false },
    "AI_Product_Category": { "correct": "Freezer",  "evidence": "Spec Table: Freezer Type: Chest", "ambiguous": false },
    "AI_Style":            { "correct": "",         "evidence": "no style in any source", "ambiguous": true,
                             "note": "Class-3 decision needed: pipeline defaults Contemporary" }
  },
  "failure_class": "1|2|3 or null",
  "reviewed_by": "tmc", "reviewed_date": "YYYY-MM-DD"
}
```

### 5.2 Selection & calibration
- Stratify by: category, data-source scenario, retailer/format (the 4 spec-table HTML formats), and
  known-trouble clusters (panel-ready, accessories, Canadian, no_sources).
- Include every product from Finding #078 (their ambiguities are documented and hard-won).
- **Calibration step**: run the L2 auditor against the golden set; measure its false-positive/false-negative
  rate per field. That rate determines how much weight L2 verdicts get in the scorecard — and is itself a
  Class-3 finding generator (each FP pattern = an audit-prompt fix).

### 5.3 The harness
`scripts/golden-harness/` (to be built, local): loads golden SKUs' `rawPayload` (from a Mongo export
committed to `audit-results/golden-set/payloads/`), runs the deterministic pipeline functions over them,
diffs against golden answers. **Every pipeline fix must pass the harness before deploy.** No more
one-product-per-deploy loops.

---

## 6. Phased execution plan

### 6.0 Verification gates — tests after EVERY phase (build, logic, results)

> Honest baseline as of 2026-06-09 (verified, not assumed):
> - **Build**: `npm run build`/`npm run typecheck` exist but are manual; the automated gate
>   (`pre-deploy-validate-all.sh`, 9 checks) is **broken on prod** (tsc PATH — OVS-03).
> - **Logic**: Jest installed, 61 tests, **59 pass / 2 fail** (stale `html-generator` assertions).
>   Coverage = 4 utility files only. The core pipeline (~15k lines), title generation, picklist
>   matcher, and every #078-fixed function have **zero** tests. `npm test` is wired into **no**
>   procedure (verified absent from pre-deploy script and deploy workflow).
> - **Results**: no deterministic gate. `verify-batch.js` is observational; the confirm audit gate
>   is non-deterministic. No golden set yet.
>
> The gates below close this. **G0 is a prerequisite before any audit-driven code fix ships.**

**G0 — Test baseline repair (one-time prerequisite)**
1. Fix or quarantine the 2 stale `html-generator` tests so `npx jest` runs green (a red suite can't gate anything).
2. Add `npm test` + `npm run typecheck` to `pre-deploy-validate-all.sh` and fix its prod PATH bug
   (use `./node_modules/.bin/tsc`) so the gate actually executes where deploys happen.

**The gate stack — applied to every code change, in every phase:**

| Gate | Confirms | Command / mechanism | Pass criteria |
|------|----------|--------------------|---------------|
| **G1 Build** | It compiles & ships | `npm run typecheck` + `npm run build` locally; after deploy, verify `dist/` actually contains the change (grep a changed symbol on prod — the `--include=dev` prune gotcha has shipped stale dist before) | Zero tsc errors; changed code present in prod `dist/` |
| **G2 Logic** | Functions do what we think | `npx jest` green, **plus a new unit test for every pure function touched** (fixture in, expected out — `findInSpecificationTable`, finish guard, ACCESSORIES guard, explicitColor are the first targets) | Suite green; new behavior covered by a test that fails on the old code |
| **G3 Results** | Outputs are right at corpus scale | Golden harness diff (§5.3) once built; until then, re-run the affected L1 scan(s) and compare before/after numbers | No golden-set regressions; affected ACC/GAP metric improves, nothing else degrades |
| **G4 Deploy** | Prod is healthy & synced | `pre-deploy-validate-all.sh` → deploy → `/health` → 3-way commit sync check | All green, ALL SYNCED |

**The 5-Test Contract — the shape every G2/G3 verification takes** (ported 2026-06-09 from
`Coco-AI/docs/AGENTIC_LOOP_BUILD_PLAN.md`, the user's standing cross-project rule; adapted to this platform):

| # | Test | Proves (here) |
|---|------|---------------|
| **T1** | **True-positive** — the bad case the fix/check targets | It catches what it claims to catch (e.g. ACCESSORIES guard fires for the RD1884L4D door panel; a scanner flags a fixture with a known violation) |
| **T2** | **True-negative / passthrough** — a normal product | **No false positives.** The #078 lesson: the guard was never passthrough-tested, so it silently misclassified the NSCZ10WH6 chest freezer. Every fix MUST include the sibling/normal case |
| **T3** | **Mode-gating** — dry-run vs execute | `detect` writes nothing to SF; `confirm` pushes only on clean MATCH; scanners are read-only; `--execute` vs default behave as documented |
| **T4** | **Safety / bounds** — adverse input | No runaway retries, AI cost within budget, restart-safe, nothing reaches SF outside the gate |
| **T5** | **Observability** — check the review surface after T1–T4 | Scan output / `audit-report.js` / scorecard reflect reality, AND the targeted corpus metric actually moved |

Rules carried over from the source contract: tests run against the **real system or real stored payloads —
no mocks**; they are **scripted and reproducible** (fixed inputs, asserted outputs, non-zero exit on failure);
and every phase's 5-test results are recorded in an **evidence log**:
`audit-results/platform-audit/ACCEPTANCE-LOG.md` (date, commit, T1–T5 pass/fail, evidence pointer per test).
5 per phase is the floor — apply the full contract per fix where practical.

**Per-phase exit gates** (in addition to the stack above):
- **Phase 1 gate**: the scan scripts are themselves tested — each check ID gets a small fixture test
  (synthetic job docs with known violations → scanner must report the exact expected counts). Then
  **manually spot-check ≥5 flagged jobs per check ID** against raw payloads before trusting any number.
  A miscounting audit tool is worse than no tool.
- **Phase 2 gate**: golden set entries double-reviewed (each SKU's values traced to a quoted payload
  citation); L2 calibration FP/FN rates computed against the golden set and recorded BEFORE any L2
  verdict enters the scorecard.
- **Phase 3 gate**: every CON/OVS item closes with primary evidence (config line, query result, log
  excerpt) — "verified" or "refuted", never "assumed".
- **Phase 4 gate**: every fix passes G1→G4 **plus** the golden harness; after deploy, re-run the
  affected L1 scans to confirm the corpus-level number actually moved. A fix without a moved metric
  is not closed.

### Phase 1 — Corpus-wide L1 scans (read-only, ~$0 AI)
**Build**: `scripts/platform-audit/` — one runner per dimension family:
`scan-accuracy.js` (ACC-01…14), `scan-waste.js` (WST-01…08), `scan-gaps.js` (GAP-01…06),
plus `scan-config-coverage.js` (GAP-02, runs purely locally).
**Run**: on prod via SSH against MongoDB (read-only); JSON + summary output to
`audit-results/platform-audit/YYYY-MM-DD/`.
**Exit criteria**: every check has a number attached (count, %, $ where applicable) across the full corpus,
broken down by category and data-source scenario.

### Phase 2 — Calibrated L2 sampling + golden set
1. Use Phase 1 stratification to pick the golden 50–100 SKUs; human-verify them (§5).
2. Calibrate the L2 auditor against the golden set; record FP/FN rates.
3. Run L2 `detect` audits on stratified samples for the semantic checks (weighted by calibration).
**Exit criteria**: golden set committed; auditor calibration numbers known; sampled semantic-accuracy
estimates per category.

### Phase 3 — Static code / architecture / security review (local)
Work the CON-* list plus a structural review of `dual-ai-verification.service.ts` (dead code paths,
duplicated logic, untested pure functions, phase ordering risks). OVS-03 (fix prod validation script)
and OVS-08 (doc drift) belong here too.
**Exit criteria**: every CON/OVS item verified-or-refuted with evidence; refuted items closed, confirmed
items quantified.

### Phase 4 — Synthesis, scorecard, prioritized fixes
1. Merge all results into the **scorecard** (§7).
2. Tag every finding Class 1/2/3 and severity (impact × frequency).
3. Promote confirmed issues into `AUDIT-FINDINGS-AND-SOLUTIONS.md` with Finding numbers.
4. Fix in priority order. **Every Class-1 fix goes through the golden harness (ENH-01/02) before deploy.**
   Class-2 items get data decisions (escalate to user/SF). Class-3 items fix `audit-prompt.ts`.
**Exit criteria**: ranked backlog exists; top-severity fixes shipped and harness-verified.

---

## 7. Scorecard conventions

**Location**: `audit-results/platform-audit/SCORECARD.md` (created in Phase 4; living document).
Each row:

```
| Check ID | Finding (one sentence) | Class | Severity | Quantified impact | Status | Finding # |
```

- **Class**: 1 (pipeline code) / 2 (source data) / 3 (auditor) / O (operational/process)
- **Severity**: CRIT (wrong data reaching SF / security) · HIGH (systematic quality or material spend) ·
  MED (degraded quality, bounded) · LOW (cosmetic/cleanup)
- **Quantified impact**: a number — % of jobs, $ per month, count. "Seems bad" doesn't go in the scorecard.
- Confirmed issues that get fixed are promoted to `AUDIT-FINDINGS-AND-SOLUTIONS.md` (next free Finding
  number — check the registry first; #078 is the latest as of this writing).

---

## 8. Continuity protocol — how any session resumes this work

1. **Read this file first**, top to bottom. The Status Board (§0) says what's done and what's next.
2. Check `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` for findings promoted since the board was last updated.
3. Execute the next step per the phase definition (§6). Stay read-only against prod unless a fix has been
   harness-verified.
4. **Before ending the session**: update the Status Board, log new checks/IDs in §4, and run the standard
   "Save Everything" procedure from `CLAUDE.md` (session summary, commit, sync, health, Audit Mode off).
5. Rules that always apply:
   - No live `confirm` runs until the golden harness exists (ENH-01/02) — that's the #078 lesson.
   - Classify (1/2/3) before coding.
   - Every claim in the scorecard carries a number and an evidence pointer (query, log line, or file:line).

---

*Registered alongside Finding #078. Update history: created 2026-06-09.*
