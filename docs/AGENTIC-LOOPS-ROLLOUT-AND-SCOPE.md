# Agentic Loops — Rollout, Testing, Runaway Prevention & Model Scoping

> Companion to the enumeration report. This document answers four operational questions before any loop ships:
> 1. **How do we roll out and test** to confirm functionality and *true* results?
> 2. **How do we prevent runaway loops?**
> 3. **What model do we run loops in?**
> 4. **What is the phased scope** (which loops, in what order)?
>
> Timezone: US Eastern. Production-first per CLAUDE.md.

---

## 0. Guiding principle — reuse the machinery we already have

This system already contains every primitive needed to roll out, gate, and regression-test a loop safely. **Do not build a parallel framework.** Each new loop plugs into existing infrastructure:

| Need | Already exists | Where |
|------|----------------|-------|
| Shadow / canary / gate mechanism | **Audit Mode** (`detect` / `confirm` / `off`) | `src/services/audit/audit-processor.service.ts`; `.env` `AUDIT_MODE` |
| Independent verifier gate | `runAudit()` — "the pipeline cannot certify its own fix" | `src/services/audit/audit-review.service.ts` |
| Before/after regression detection | `compareResponses()` + `Prior_Response_Data` | `src/services/response-comparison.service.ts`; wired in `async-verification-processor.service.ts:196` |
| Accuracy ground-truth audit | `verification-api-accuracy-audit.js` (last 300 calls) | `scripts/` |
| Per-job AI cost ledger | `aiusage` collection | `src/services/ai-usage-tracking.service.ts` |
| Batch quality snapshot | `verify-batch.js`, `snapshot-batch-quality.js` | `scripts/` |
| Background scanner pattern (poll → act) | `selfHealingErrorDetector.start()` (5-min interval, `isScanning` guard) | `src/services/self-healing/error-detector.service.ts` |
| Feature toggling via env | `AUDIT_MODE`, `config.research.enabled`, etc. | `.env` + `src/config` |

**Every loop ships behind its own env flag** (e.g. `LOOP_DEPT_TIEBREAK=off|shadow|on`), mirroring the `AUDIT_MODE` pattern. No loop becomes the default path until it has passed shadow + gated stages.

---

## 1. Rollout & Testing — confirming *true* results

### 1.1 Four-stage rollout ladder (per loop)

Every loop moves through these stages. It cannot skip a stage; promotion is a deliberate human decision backed by the metrics in §1.3.

```
STAGE 0  OFF            Loop code deployed but inert (flag=off). Confirms no regression from merge alone.
STAGE 1  SHADOW         Loop runs in parallel; logs what it WOULD do; original single-shot output still ships.
STAGE 2  GATED          Loop output is produced, then verified by an independent check; ships only on pass,
                        otherwise falls back to single-shot output. (= AUDIT_MODE=confirm semantics.)
STAGE 3  LIVE           Loop is the default path. Flag remains so it can be disabled instantly.
```

**Mapping to Audit Mode for verification-pipeline loops** (findings 1.1–1.4, 3.1–3.3, 5.1–5.2):
- **Shadow** = `AUDIT_MODE=detect` — audits stored output vs. fresh evidence, never writes to SF. Run the loop variant here and store its proposed result in `audit_jobs` for comparison. No SF risk.
- **Gated** = `AUDIT_MODE=confirm` — re-verify (with loop on), independent `runAudit()` gate, push **only** on MATCH with evidence citation. This is exactly the "fix is only confirmed when re-audit flips to MATCH" contract already in CLAUDE.md.
- **Live** = `AUDIT_MODE=off` with the loop's own flag on.

**For orchestration loops** (findings 2.1–2.3, 4.1–4.2 — no AI judgment, just act→verify→retry): shadow = log-only dry run (the scripts already support `--dry-run` / no-`--execute`); live = enable in the scanner. There is no "gated" middle stage because there is no model output to gate.

### 1.2 The golden set (ground truth for "true results")

"Functionality works" ≠ "results are true." We need labeled ground truth:

1. **Seed the golden set** from `audit-confirmed` jobs — products where `runAudit()` returned `overall_status: MATCH` with an evidence citation. These are the closest thing to verified-correct answers we have. Target ≥ 200 products spanning Appliances + each non-appliance department, including known-hard cases (slide-in ranges, lighted mirrors, Canadian `CA_` SKUs, `no_sources` jobs).
2. **Store** as `audit-results/golden-set.json`: `{ sfCatalogId, rawPayload, expectedFields }`.
3. **Replay harness** (new script `scripts/replay-golden-set.js`): feed each payload through `verifyProductWithDualAI()` with the loop flag on vs. off, diff against `expectedFields`. Report per-field accuracy delta, not just pass/fail.

A loop only earns promotion to LIVE if golden-set accuracy is **≥** baseline on every field and strictly **>** on at least the field the loop targets.

### 1.3 Metrics gate for each promotion

Pull from existing telemetry — no new instrumentation required for most:

| Metric | Source | Promotion bar |
|--------|--------|---------------|
| Field accuracy (golden set) | `replay-golden-set.js` | No regression on any field; improvement on target field |
| Regression count | `compareResponses()` → `regressions`, `criticalChanges` | Zero net new critical regressions in shadow window |
| AI cost / job | `aiusage` collection | Within budget envelope (§3.5); cost-saving loops must show the saving |
| Loop iteration count distribution | new log field `loopIterations` | p99 below the hard cap; no clustering at the cap (= not converging) |
| Webhook / SF push success | `salesforceProcessed` field | No decrease |
| Processing time p95 | `processingTimeMs` | Within SLA (alert threshold already 300s) |

Run `verify-batch.js` and `verification-api-accuracy-audit.js` at the end of every shadow window. Capture a `snapshot-batch-quality.js` before flipping each flag so there is a rollback baseline.

### 1.4 Deployment procedure (per the existing "Save Everything" flow)

1. `bash scripts/pre-deploy-validate-all.sh` (9 checks; blocks on TypeScript/feature/title failures).
2. Deploy with loop flag = `off`. Confirm health + no behavior change (Stage 0).
3. Flip flag to `shadow`, restart, let a representative batch flow, run the metrics gate.
4. Flip to `gated` (`AUDIT_MODE=confirm` for pipeline loops); resend golden/affected products; confirm only correct outputs push.
5. Flip to `live`; monitor with "Run Live Logger" for the first batch.
6. Each flip is a `systemctl restart catalog-verification` and a one-line `.env` edit — same as the Audit Mode toggle.

---

## 2. Avoiding Runaway Loops

A loop without a hard stop is an incident waiting to happen — runaway token spend, wedged job queue, oscillating corrections. **Every loop must declare all of the following stop conditions before merge.** These are layered defenses; no single one is trusted alone.

### 2.1 Mandatory stop conditions (per loop)

1. **Hard iteration cap.** A constant max (the codebase already uses `MAX_CONSENSUS_RETRIES = 3`). The cap is never removed — loop improvements make the *early exit* smarter, never the ceiling higher.
2. **Progress requirement (early exit).** Track the metric the loop is trying to improve (e.g. unresolved-disagreement count, confidence). If it does **not** improve between iterations, exit immediately. This is the single most important addition vs. today's fixed-count retries (see findings 3.2, 3.3): today the loop burns all 3 iterations even when iteration 1 already converged or is stuck.
3. **Oscillation / flap detection.** Keep a history of proposed values. If a value repeats (loop proposes X → verifier rejects → proposes Y → re-proposes X), stop and escalate — the loop and verifier disagree irreconcilably. Prevents A↔B ping-pong.
4. **Per-job AI budget ceiling.** Read running cost from `aiusage`. If a single job exceeds a hard dollar cap (e.g. `LOOP_MAX_JOB_COST_USD`), stop the loop, ship best-available output, flag for review. This bounds the worst case regardless of iteration logic.
5. **Wall-clock timeout.** Per-job deadline (the system already alerts at 300s and recovers `processing` jobs stuck > 10 min in `async-verification-processor.service.ts:50`). The loop must check elapsed time and bail before the stale-job recovery would fire.
6. **Reentrancy guard.** For background scanner loops, reuse the existing `isScanning` boolean pattern so two scans never overlap.

### 2.2 Global circuit breaker

Beyond per-job limits, a **systemic** breaker protects against a bad deploy that makes *every* job hit the cap:

- Track, across a rolling window, the fraction of jobs that exhaust the iteration cap or hit the budget ceiling.
- If that fraction exceeds a threshold (e.g. > 25% over 20 jobs), **trip the breaker**: auto-disable the loop flag (fall back to single-shot), log CRITICAL, alert. The commented-out `ErrorRecoveryService` import at `dual-ai-verification.service.ts:92` was scaffolding for exactly this — wire it in.
- This is also why every loop keeps its flag in LIVE: the breaker flips the flag, it doesn't require a redeploy.

### 2.3 Orchestration-loop specifics (webhook retry, stale-request retry)

These run unattended forever, so they additionally need:
- **Bounded retry count with backoff + jitter** — the model already has `sent_to_sf_count < MAX_RETRIES (3)` and `webhook` exponential backoff (`RETRY_DELAY_MS * (attempt+1)`).
- **Dead-letter / escalation state** — after max retries, move to `needs_attention` and surface in "Establish Connection" rather than retrying forever. (Today stale requests have no terminal state — see finding 4.2.)
- **No `sleep`-based waiting in the request path** — drive retries off the existing 5-min scanner interval, not blocking waits.

### 2.4 Self-healing history is the cautionary tale

Webhook self-healing was **removed** because it caused "queue backups and 100% failure rate" (`webhook.service.ts:142`). That is the canonical runaway: an unbounded auto-retry/heal loop with no circuit breaker took down throughput. Every loop in this plan must demonstrably *not* repeat that — which is why §2.1 and §2.2 are non-negotiable gates, not suggestions.

---

## 3. What Model Do We Run Loops In?

Loops are not one model. **Tier by role**, and never run an expensive verifier where a cheap one or no model suffices. Current pricing (cached 2026-05-26):

| Model | ID | Input $/1M | Output $/1M | Context |
|-------|-----|-----------|-------------|---------|
| Claude Opus 4.8 | `claude-opus-4-8` | $5.00 | $25.00 | 1M |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | $3.00 | $15.00 | 1M |
| Claude Haiku 4.5 | `claude-haiku-4-5` | $1.00 | $5.00 | 200K |

### 3.1 Model assignment by loop role

| Loop role | Findings | Model | Rationale |
|-----------|----------|-------|-----------|
| **Orchestration** (act → verify → retry; no judgment) | 2.1, 2.2, 2.3, 2.4, 3.4, 4.1, 4.2 | **None** | Pure code: HTTP status checks, DB queries, string heuristics, Levenshtein. Zero model cost. Run everywhere. |
| **Primary extraction loops** (department, category, type rounds) | 1.1, 3.2, 3.3 | **Existing OpenAI + xAI dual-AI** | Keep the dual-AI consensus model these already use. Don't introduce a third provider into the consensus — just make the *loop control* smarter (progress-based exit). |
| **Routing tiebreaker / adjudicator** | 3.1 (dept disagreement) | **Haiku 4.5** | A fast, cheap third opinion to break a 2-way tie. Low stakes per call, called rarely (only on disagreement). |
| **Lightweight pre-check** (necessity scoring before full review) | 5.1 | **Haiku 4.5** | Reads only primary attributes, flags obvious errors. Cheap gate that decides whether the expensive verifier runs at all. |
| **Independent verifier gate** (Phase B correction loop, audit gate) | 1.3, 1.4, audit `runAudit()` | **Sonnet 4.6** default; **Opus 4.8** for genuinely ambiguous/disputed jobs | Sonnet is the cost-effective default verifier. Reserve Opus for the hardest cases (unresolved disagreements, low-confidence, CRITICAL-severity) where correctness dominates cost. |
| **Single-AI targeted web search** (1–2 low-stakes missing fields) | 5.2 | **One** of the existing providers (not dual) | Halves Phase 6 cost for simple cases; dual-AI reserved for ≥3 missing or any critical field. |

### 3.2 The cost-tiering pattern (Haiku gate → Sonnet/Opus verifier)

This is the core lever for finding 5.1 (Phase B fires on *every* non-appliance job today, `requiresAIReview` hardcoded `true`):

```
necessity_score = f(phaseA.warnings, unresolvedDisagreements, overallConfidence, notFoundCount)
if necessity_score < THRESHOLD:
    Haiku 4.5 pre-check on primary attributes only   # ~$1/$5 per 1M
    if Haiku flags nothing → ship, skip full review   # ~50-70% of clean batches
    else escalate ↓
Sonnet 4.6 full Phase B review                        # default verifier
if disputed / low-confidence / CRITICAL → Opus 4.8    # hardest cases only
```

A clean, fully-agreed job costs a Haiku pre-check instead of a full Opus/Sonnet review. Disputed jobs still get the strongest model. Measured against the current "Opus-class review on all" baseline, this is where the cost savings live.

### 3.3 Why not run loops on Opus everywhere?

Opus 4.8 is the most capable model and the right default for *hard reasoning*, but at $5/$25 it is the wrong default for a per-job inner loop that may iterate 3×. The discipline is: **cheapest tier that meets the bar, escalate on signal.** Orchestration loops use no model; tiebreakers and pre-checks use Haiku; the default verifier is Sonnet; Opus is the escalation target, not the floor.

### 3.4 Anthropic SDK conventions for any new model calls

When wiring Claude into a loop (verifier, tiebreaker, pre-check), use `@anthropic-ai/sdk` with:
- `thinking: { type: "adaptive" }` for reasoning-heavy verifier calls; `output_config: { effort: ... }` (`low` for Haiku pre-checks, `high` for Opus on hard cases). `budget_tokens` is removed on Opus 4.8 — do not use it.
- Structured output via `output_config.format` (json_schema) for the verifier's PASS/FLAG/FAIL + corrections payload — not assistant prefills (prefills 400 on the 4.x family).
- Stream any call with large context; use `.finalMessage()`.
- Parse tool/JSON output with `JSON.parse()` — never raw string-match.

### 3.5 Budget envelope

Set per-loop and global caps in `.env` (e.g. `LOOP_MAX_JOB_COST_USD`, `LOOP_DAILY_BUDGET_USD`). The `aiusage` ledger already tracks per-job, per-provider, per-task cost — wire the budget ceiling (§2.1.4) and the daily breaker to read from it.

---

## 4. Phased Implementation Scope

Ordered by impact-to-effort and risk. Each phase is independently shippable and independently reversible.

### Phase 1 — Orchestration loops (no AI, highest ROI, lowest risk)
Resolves active Known Issues directly; no model cost; no SF-output risk in shadow.
- **4.2 / 2.1** Stale creation-request auto-retry → wire `detect-and-retry-stale-requests.js` logic into `selfHealingErrorDetector.scanForIssues()`. *Resolves the 72-day stale `Freestanding`/`Counter Depth` backlog.*
- **2.4** Attribute garbage-gate in `addAttributeWithPlaceholder()` → heuristic + near-duplicate check before writing `attributes.json`. *Prevents recurrence of the `cagp-lot` garbage entries.*
- **2.2 / 4.1** Webhook SF-rejection classifier + auto-resend → fold `resend-failed-webhooks.js` into the scanner.
- **2.3** Catalog-index write verification (query-back after write).
- **3.4** Pending-request fuzzy dedup before creating a new request.

**Stop conditions:** bounded retries (already `MAX_RETRIES=3`), dead-letter → `needs_attention`, reentrancy guard, global breaker on retry-storm.

### Phase 2 — Classification confidence gates (existing dual-AI + Haiku tiebreaker)
- **3.1** Department confidence-gap tiebreaker (Haiku adjudicator). *Single decision that gates the whole pipeline.*
- **3.2 / 3.3** Convert fixed-count category/type retries to progress-based loops with early exit + oscillation detection.

**Roll out via** `AUDIT_MODE=detect` shadow → `confirm` gate → live. **Stop conditions:** §2.1 in full.

### Phase 3 — Cost-tiered verifier (Haiku gate → Sonnet → Opus)
- **5.1** Necessity score + Haiku pre-check before full Phase B. *Primary cost win.*
- **5.2** Single-AI vs dual-AI Phase 6 web search by field count/criticality.
- **5.3** Complete the two empty self-healing detectors (`detectPicklistMismatches`, `detectMappingFailures`) and wire `canRetryResearch` to an actual re-queue action.

### Phase 4 — Claude correction loop (highest complexity, highest accuracy gain)
- **1.3** Claude → validate-each-correction → refine loop. *Fixes the active "Claude Title Override" bad-response source.*
- **1.4** Phase A auto-correction loop for LOW/MEDIUM findings.
- **1.1** Two-round Stage 3 extraction (anchors first).
- **1.2** Phase 0.5 source-quality gate before AI injection.

**Verifier model:** Sonnet 4.6 default, Opus 4.8 on disputed. **Stop conditions:** §2.1 + §2.2 mandatory — this is the loop most capable of oscillating (propose correction → reject → re-propose).

### Phase 5 — Audit-cycle orchestration (autonomous end-to-end)
- **4.3** State-machine wrapping `detect → compile → human-approve fix → confirm → off`. The per-product `processRoutedConfirm()` already exists; this orchestrates the batch.
- **4.4** Post-deploy auto-requeue sweep (trigger `audit-recent-jobs.js` on git-hash change). *Clears the "10 historical jobs" Known Issue automatically.*

---

## 5. Pre-Ship Checklist (every loop)

- [ ] Behind an `.env` flag with `off | shadow | gated | live` semantics
- [ ] Hard iteration cap (constant, never removed)
- [ ] Progress-based early exit (exits when target metric stops improving)
- [ ] Oscillation/flap detection (proposal history)
- [ ] Per-job AI budget ceiling reading from `aiusage`
- [ ] Wall-clock timeout (bails before 300s alert / 10-min stale recovery)
- [ ] Reentrancy guard (scanner loops)
- [ ] Registered with the global circuit breaker
- [ ] Model tier assigned per §3.1 (cheapest that meets the bar)
- [ ] Golden-set replay shows no field regression, improvement on target field
- [ ] `compareResponses()` shows zero net new critical regressions in shadow
- [ ] Cost delta measured against baseline via `aiusage`
- [ ] `pre-deploy-validate-all.sh` passes
- [ ] Rollback baseline captured via `snapshot-batch-quality.js`
- [ ] Known-Issues + `AUDIT-FINDINGS-AND-SOLUTIONS.md` updated on completion
