# Agentic Loops — Build & Execution Plan

> The followable, work-package-level plan for implementing the agentic loops.
> Companion to:
> - `AGENTIC-LOOPS-ROLLOUT-AND-SCOPE.md` (the *why*, rollout ladder, runaway-prevention rules, model tiering)
> - the enumeration report (the 19 *opportunities*)
>
> This document is the *how and in what order*. It is meant to be executed top to bottom.
> Timezone: US Eastern. Production-first per CLAUDE.md.

---

## How to use this plan

- Work is grouped into **Milestones (M0–M5)**. M0 is **foundation** and blocks everything else.
- Each unit of work is a **Work Package (WP)** with a stable ID, explicit **deliverable files**, **dependencies**, **build steps**, and **acceptance criteria** (the gate that says "done").
- Every loop WP also lists its **rollout stages** (`off → shadow → gated → live`) and what evidence promotes it between stages.
- A WP is **not done** until its acceptance criteria pass *and* its row in `docs/LOOP-REGISTRY.md` is updated.
- One WP ≈ one PR. Keep PRs small and behind a flag.

**Status legend:** ☐ not started · ◐ in progress · ☑ done

---

## Conventions

### Loop ID scheme
`LOOP-<phase><n>` — e.g. `LOOP-1a` (Phase 1, first loop). Maps 1:1 to a finding in the enumeration report.

### Definition of Done (every loop WP)
1. Implemented behind its env flag, default `off`.
2. Uses the shared `loopController` (M0/F1) for all stop conditions — no hand-rolled caps.
3. Emits telemetry (M0/F3): `loopId`, `loopStage`, `loopIterations`, cost.
4. Registered with the circuit breaker (M0/F4).
5. Golden-set replay (M0/F5) shows **no field regression** and improvement on the target field.
6. `compareResponses()` shows **zero net-new critical regressions** in a shadow window.
7. Cost delta measured via `aiusage` and within the budget envelope.
8. `bash scripts/pre-deploy-validate-all.sh` passes.
9. Row added/updated in `docs/LOOP-REGISTRY.md`.
10. Known Issues + `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` updated.

---

## Milestone 0 — Foundation (blocks all loops)

No loop ships until M0 is complete. This is the shared machinery so each loop is safe and observable by construction.

### WP-F1 — Shared loop controller ☐
**Goal:** One utility that enforces every runaway-prevention rule, so no loop reimplements them.
**Deliverable:** `src/utils/loop-controller.ts`
**Dependencies:** none
**Build steps:**
- Implement a `LoopController` class/factory taking `{ maxIterations, budgetUsdCap, wallClockMs, loopId }`.
- Methods: `shouldContinue({ iteration, progressMetric, proposedValue, costSoFarUsd, startedAt })` returning `{ continue: boolean, stopReason: 'converged'|'no_progress'|'oscillation'|'budget'|'timeout'|'max_iterations' }`.
- Internally tracks: previous progress metric (early-exit on no improvement), a proposal-history set (oscillation/flap detection), elapsed wall-clock, cumulative cost.
- Emit a structured log line per decision with `loopId` + `stopReason`.
**Acceptance criteria:**
- Unit tests in `src/__tests__/` cover each stop reason (cap hit, no-progress exit, oscillation A→B→A, budget exceeded, timeout).
- A loop using it cannot exceed `maxIterations` regardless of progress signal.

### WP-F2 — Flag config + Loop Registry ☐
**Goal:** Central feature-flag table and the human-readable registry.
**Deliverables:** `src/config/loop-flags.ts`, `docs/LOOP-REGISTRY.md`
**Dependencies:** none
**Build steps:**
- `loop-flags.ts`: read each loop's flag from `process.env` (`LOOP_<NAME>` ∈ `off|shadow|gated|live`), default `off`. Single accessor `getLoopStage(loopId)`.
- `LOOP-REGISTRY.md`: table with columns `loopId · finding · env flag · stage · model tier · accuracyΔ · cost/job · iter p99 · breaker · last reviewed`. Seed one row per planned loop, all `off`.
**Acceptance criteria:** `getLoopStage()` returns `off` for unset flags; registry lists all planned loops.

### WP-F3 — Telemetry tagging ☐
**Goal:** Make loop behavior measurable using existing collections.
**Deliverables:** edits to `src/services/ai-usage-tracking.service.ts` and `src/models/verification-job.model.ts`
**Dependencies:** none
**Build steps:**
- Add optional fields to job records: `loopRuns: [{ loopId, stage, iterations, stopReason, costUsd }]`.
- Tag `aiusage` writes made inside a loop with `loopId` + `loopStage`.
**Acceptance criteria:** a job that ran a loop shows its `loopRuns` entry; `aiusage` rows carry the loop tag.

### WP-F4 — Circuit breaker ☐
**Goal:** Systemic protection — auto-disable a loop that's failing across many jobs.
**Deliverable:** `src/services/loop-circuit-breaker.service.ts` (wire in the commented-out `ErrorRecoveryService` ref at `dual-ai-verification.service.ts:92`)
**Dependencies:** F2 (to flip flags), F3 (to read failure rate)
**Build steps:**
- Rolling window per loop: fraction of jobs hitting cap/budget/timeout.
- If fraction > threshold (default 25% over 20 jobs) → set the loop flag to `off` in-process, log CRITICAL, fire `alertingService`.
- Expose breaker state for the status script.
**Acceptance criteria:** simulated failure storm trips the breaker and the loop falls back to single-shot without a redeploy.

### WP-F5 — Golden set + replay harness ☐
**Goal:** Ground truth for "true results."
**Deliverables:** `scripts/build-golden-set.js`, `scripts/replay-golden-set.js`, `audit-results/golden-set.json`
**Dependencies:** none (reads `audit_jobs` + `verificationjobs`)
**Build steps:**
- `build-golden-set.js`: pull audit-confirmed (`overall_status: MATCH` w/ evidence citation) jobs, ≥200 products spanning Appliances + each non-appliance dept + hard cases (slide-in ranges, lighted mirrors, `CA_` SKUs, `no_sources`). Write `{sfCatalogId, rawPayload, expectedFields}`.
- `replay-golden-set.js --loop=<id> --flag=on|off`: run each payload through `verifyProductWithDualAI()`, diff vs `expectedFields`, print per-field accuracy and the on-vs-off delta.
**Acceptance criteria:** harness runs end to end on production and prints a per-field accuracy table for baseline (all flags `off`).

### WP-F6 — Status / tracking command ☐
**Goal:** One command to see every loop's state and results.
**Deliverable:** `scripts/loop-status.js`
**Dependencies:** F2, F3, F4
**Build steps:**
- For each loop in the registry: current stage, golden-set accuracyΔ, cost/job vs baseline, iteration distribution (p50/p99), breaker state, last-reviewed date.
- Output styled like `verify-batch.js`. Add it as step in the "Establish Connection" routine in CLAUDE.md.
**Acceptance criteria:** running it prints a complete per-loop dashboard; all loops show `off` pre-implementation.

**M0 exit gate:** F1–F6 all ☑, unit tests green, `loop-status.js` runs clean on production.

---

## Milestone 1 — Orchestration loops (no AI model; lowest risk)

These resolve active Known Issues, cost no model tokens, and have no SF-output risk in shadow. Each plugs into the existing 5-min `selfHealingErrorDetector` scanner.

### WP-1a — Stale creation-request auto-retry ☐  → finding 4.2/2.1
**Flag:** `LOOP_STALE_REQUEST_RETRY` · **Model:** none
**Deliverables:** edits to `src/services/self-healing/error-detector.service.ts`, reuse logic from `scripts/detect-and-retry-stale-requests.js`
**Build steps:** add a 7th detection method that finds requests > 7 days old with out-of-order-fulfillment evidence; on `live`, re-send via `pendingCreationRequestService.notifySalesforce()`; after `MAX_RETRIES` move to `needs_attention`.
**Rollout:** shadow = log what it *would* resend → live = actually resend.
**Acceptance:** the 72-day `Freestanding`/`Counter Depth` backlog is retried; nothing retried more than `MAX_RETRIES`; terminal state reached.
**Why first:** clears a real, named Known Issue; pure code; trivially reversible.

### WP-1b — Attribute garbage-gate ☐  → finding 2.4
**Flag:** `LOOP_ATTR_GATE` · **Model:** none
**Deliverables:** edits to `pendingCreationRequestService.addAttributeWithPlaceholder()`
**Build steps:** before writing `attributes.json`, run heuristics (single common noun, metadata term, verb phrase, len<3) + Levenshtein near-duplicate check vs existing attributes; reject to a `rejected_attribute_requests` collection instead of writing.
**Acceptance:** the 6 known garbage names (`actual_product`, etc.) are rejected; legitimate new attributes pass.

### WP-1c — Webhook SF-rejection classifier + resend ☐  → finding 2.2/4.1
**Flag:** `LOOP_WEBHOOK_RESEND` · **Model:** none
**Deliverables:** new scanner method folding in `scripts/resend-failed-webhooks.js`
**Build steps:** find jobs `webhookSuccess && !salesforceProcessed`; classify `salesforceError` → (a) field-mapping (auto-fix payload + resend), (b) invalid-id (escalate), (c) transient (backoff retry).
**Acceptance:** field-mapping rejections auto-recover; invalid-id cases surface for human review.

### WP-1d — Catalog-index write verification ☐  → finding 2.3
**Flag:** `LOOP_INDEX_VERIFY` · **Model:** none
**Build steps:** after `catalogIndexService.recordVerification()`, query the doc back; on mismatch/failure, queue a reconciliation retry.

### WP-1e — Pending-request fuzzy dedup ☐  → finding 3.4
**Flag:** `LOOP_REQUEST_DEDUP` · **Model:** none
**Build steps:** before creating a new creation request, fuzzy-match (>0.8) against pending + recently-fulfilled; treat near-match as in-flight.

**M1 exit gate:** all WPs `live`, registry updated, one full "Verify Batch" + "Establish Connection" cycle clean.

---

## Milestone 2 — Classification confidence gates

Existing OpenAI+xAI dual-AI for the rounds; Haiku 4.5 for tiebreaking.

### WP-2a — Department confidence-gap tiebreaker ☐  → finding 3.1
**Flag:** `LOOP_DEPT_TIEBREAK` · **Model:** Haiku 4.5 adjudicator
**Deliverables:** edits to the department block in `dual-ai-verification.service.ts` (~2463–2489)
**Build steps:** on disagreement with confidence gap > 0.25 where the lower-confidence AI is being preferred, call a Haiku adjudicator with both outputs + payload; override only if adjudicator agrees.
**Rollout:** `AUDIT_MODE=detect` shadow → `confirm` gate → live.

### WP-2b — Progress-based category retry ☐  → finding 3.2
**Flag:** `LOOP_CATEGORY_RETRY` · **Model:** existing dual-AI
**Build steps:** replace the single fixed retry (~3104–3243) with a `loopController`-driven loop; exit on convergence or no-progress; floor below confidence 0.6 → flag for review instead of guessing.

### WP-2c — Progress-based type retry ☐  → finding 3.3
**Flag:** `LOOP_TYPE_RETRY` · **Model:** existing dual-AI
**Build steps:** wrap the Phase 5 while-loop (~3987) in `loopController`; early-exit when unresolved-disagreement count stops decreasing.

---

## Milestone 3 — Cost-tiered verifier

The main cost lever. Haiku gate → Sonnet default → Opus on hard cases.

### WP-3a — Necessity score + Haiku pre-check ☐  → finding 5.1
**Flag:** `LOOP_PHASEB_TIER` · **Models:** Haiku 4.5 (pre-check) → Sonnet 4.6 (default) → Opus 4.8 (disputed)
**Deliverables:** edits to `executeFinalReviewStage()` (~15155–15200)
**Build steps:** compute necessity score from Phase A warnings, unresolved disagreements, confidence, not-found count; below threshold → Haiku pre-check on primary attributes; escalate to Sonnet full review only on signal; Opus only for disputed/CRITICAL.
**Acceptance:** clean batches skip full review (~50–70%); golden-set accuracy held; measurable cost drop in `aiusage`.

### WP-3b — Tiered Phase 6 web search ☐  → finding 5.2
**Flag:** `LOOP_WEBSEARCH_TIER` · **Model:** single existing provider vs dual
**Build steps:** gate dual-AI search by missing-field count/criticality (~4193–4228); ≤2 non-critical → single-AI w/ confidence gate.

### WP-3c — Complete self-healing detectors ☐  → finding 5.3
**Flag:** `LOOP_SELFHEAL_ACTION` · **Model:** existing
**Build steps:** implement `detectPicklistMismatches()` (query `FailedMatchLog`) and `detectMappingFailures()`; wire `canRetryResearch:true` to an actual research-only re-queue.

---

## Milestone 4 — Claude correction loop (highest accuracy gain, highest complexity)

Most capable of oscillating → §2.1 + §2.2 of scope doc are mandatory.

### WP-4a — Claude → validate → refine loop ☐  → finding 1.3
**Flag:** `LOOP_CLAUDE_CORRECTION` · **Model:** Sonnet 4.6 default, Opus 4.8 disputed
**Deliverables:** edits to `performClaudeReview()` / `executeFinalReviewStage()`; fixes the "Claude Title Override" bad-response source.
**Build steps:** validate each proposed correction against picklist constraints; on fail, send targeted feedback to Claude and re-propose (via `loopController`); regenerate SEO title only from fully-validated state.
**Acceptance:** title path no longer ships schema titles built from pre-correction wrong fields; golden-set title accuracy up.

### WP-4b — Phase A auto-correction loop ☐  → finding 1.4
**Flag:** `LOOP_PHASEA_AUTOFIX` · **Model:** none/deterministic
**Build steps:** for LOW/MEDIUM Phase A findings, attempt deterministic correction (spec-table extraction, dimension swap), re-run the specific check, escalate only on failure.

### WP-4c — Two-round Stage 3 extraction ☐  → finding 1.1
**Flag:** `LOOP_STAGE3_ANCHORS` · **Model:** existing dual-AI
**Build steps:** extract 5 anchor fields first; gate full extraction on anchor confidence ≥ 0.80.

### WP-4d — Phase 0.5 source-quality gate ☐  → finding 1.2
**Flag:** `LOOP_RESEARCH_QUALITY` · **Model:** none
**Build steps:** assess scraped source quality (pages succeeded, specs extracted) before injecting into AI prompts; below threshold → retry alt URL strategy or mark `no_sources`.

---

## Milestone 5 — Autonomous audit cycle

### WP-5a — Audit-cycle state machine ☐  → finding 4.3
**Flag:** `LOOP_AUDIT_ORCHESTRATION` · **Model:** existing audit verifier
**Build steps:** orchestrate `detect → compile mismatches → (human approves fix) → confirm affected catalogs → off` on top of existing `processRoutedConfirm()`. Human gate stays for the fix; everything else automated.

### WP-5b — Post-deploy auto-requeue sweep ☐  → finding 4.4
**Flag:** `LOOP_POSTDEPLOY_REQUEUE` · **Model:** none
**Build steps:** on git-hash change, run `audit-recent-jobs.js` scoped to jobs whose changed code paths affected `type`/`category`; auto-requeue. Clears the "10 historical jobs" Known Issue automatically.

---

## The standard per-loop lifecycle (every loop follows this)

```
1. BUILD      Implement behind flag=off, using loopController + telemetry. Unit tests. PR.
2. MERGE      Deploy with flag=off. Confirm zero behavior change (Stage 0).
3. SHADOW     flag=shadow (or AUDIT_MODE=detect). Run a batch. replay-golden-set + compareResponses.
              GATE: no field regression, zero net-new critical regressions.
4. GATED      flag=gated (or AUDIT_MODE=confirm). Resend golden/affected products. Only correct output ships.
              GATE: golden-set accuracy ≥ baseline, cost within envelope, iter p99 < cap.
5. LIVE       flag=live. Monitor first batch via "Run Live Logger". Update registry row.
6. WATCH      loop-status.js in every Establish Connection. Breaker auto-disables on regression.
```

---

## Tracking & review cadence

| Cadence | Action | Tool |
|---------|--------|------|
| Per job (automatic) | Loop run tagged with id/stage/iterations/cost | `loopRuns` + `aiusage` (WP-F3) |
| Per shadow/gated window | Accuracy & regression check | `replay-golden-set.js`, `compareResponses` |
| Per session ("Establish Connection") | Dashboard of all loops | `loop-status.js` (WP-F6) |
| Per promotion | Update stage + metrics | `docs/LOOP-REGISTRY.md` |
| Continuous (automatic) | Systemic failure → auto-disable | circuit breaker (WP-F4) |
| Per bug fixed | Document finding + fix | `AUDIT-FINDINGS-AND-SOLUTIONS.md` |

---

## Dependency graph / sequencing

```
M0 (F1 loop-controller, F2 flags+registry, F3 telemetry, F4 breaker, F5 golden+replay, F6 status)
      │  (F1,F2,F3 → F4; all → F6)
      ▼
M1 orchestration (1a→1b→1c→1d→1e)   ← start here after M0; no model, clears Known Issues
      ▼
M2 classification (2a,2b,2c)         ← needs loopController + golden set
      ▼
M3 cost-tiered verifier (3a,3b,3c)   ← needs Haiku/Sonnet/Opus wiring + cost telemetry
      ▼
M4 Claude correction (4a→4b→4c→4d)   ← highest risk; needs breaker proven on M2/M3
      ▼
M5 autonomous audit (5a,5b)          ← builds on confirm path + everything above
```

**Critical path:** M0 must finish before any loop. Within M1–M5, loops inside a milestone are mostly independent and can be parallelized once M0 exists, but ship one PR at a time.

---

## Risk register

| Risk | Mitigation |
|------|------------|
| A loop runs away (the self-healing-removal incident) | Centralized `loopController` + circuit breaker (WP-F1, F4); mandatory DoD item |
| Loop "passes" a wrong answer | Independent audit gate (`AUDIT_MODE=confirm`); golden set is from audit-confirmed jobs |
| Cost blowout from looping | Per-job budget ceiling + daily budget + `aiusage` tracking + tiered models |
| Regression slips to production | `off→shadow→gated→live` ladder; every flip reversible via `.env` + restart |
| Oscillating Claude corrections (M4) | Proposal-history flap detection in `loopController` |
| Production `tsc` not in PATH (Known Issue) | Use `npm run build`; fix `pre-deploy-validate-all.sh` to use `./node_modules/.bin/tsc` |

---

## Immediate next actions (first PR after this plan)

1. **WP-F1** (loop controller) + **WP-F2** (flags + registry) — the smallest mergeable foundation slice.
2. **WP-F5** (golden set + replay) — so we can measure from day one.
3. Then **WP-1a** (stale-request retry) as the first real, testable loop.

Everything above is behind flags defaulting to `off`, so building M0 changes no production behavior.
