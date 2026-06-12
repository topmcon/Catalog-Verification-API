# Session Summary — 2026-06-12 — Platform Audit State Handoff

> Cold-start pickup document. Read this top-to-bottom before resuming.
> **TL;DR**: Context-window boundary session — no new code work. System is healthy at commit `4ff6e9a`.
> Platform Audit Phases 0–4 (ops hardening) are complete. The two active blockers before pipeline-quality
> fixes can proceed are: (1) human review of the 49-SKU golden set, and (2) SF team response to the
> duplicate-submissions brief. This document is the authoritative cold-start for any follow-on session.

---

## 1. System State (as of 2026-06-12 ~07:50 ET)

| Check | Result |
|-------|--------|
| Commit (local / GitHub / prod) | `4ff6e9a` — **ALL SYNCED** |
| Service | `active (running)` since 2026-06-10 16:06 UTC |
| Health | `{"status":"healthy"}` |
| AUDIT_MODE | `off` |
| Pending picklist syncs | **0** (none awaiting review) |
| Pending creation requests | **89** stale (Freestanding ×13, Counter Depth ×6 are highest-impact) |
| Last backup | 2026-06-12 06:00 ET, 8 archives retained in `/var/backups/catalog-verification/mongo/` |
| Test suite | 72/72 green (last verified 2026-06-10) |
| Validator | ALL 10 CHECKS PASSED on prod (last verified 2026-06-10) |

---

## 2. What Was Accomplished (Platform Audit — June 2026)

The entire prior context window was a structured whole-platform quality audit. Summary of phases completed:

### Phase 0 — Methodology design
- Three-layer audit methodology: L1 deterministic corpus scans, L2 calibrated LLM sampling, L3 human golden set.
- 5-Test Contract (T1–T5) applied to every phase; gate stack G0–G4 defined.
- Full audit methodology documented in `docs/PLATFORM-AUDIT-GUIDE.md` (master continuity guide, Status Board inside).

### G0 — Test baseline repair (2026-06-09)
- `npm test` was failing: 2 stale `html-generator` assertions, over-broad `testMatch`, setup.ts collected as suite.
- Fixed: narrowed `testMatch`, updated assertions to current inline-style contract, quarantined demo script.
- Added `npx jest --silent` as critical CHECK #2 in `scripts/pre-deploy-validate-all.sh`.
- **Result**: 72/72 green; jest gates every deploy for the first time.

### Phase 1 — Corpus scans (2026-06-09)
- Scanned **19,113 completed jobs** (Jan–Jun 2026); results in `audit-results/platform-audit/2026-06-09/`.
- Key headline findings (see `PHASE-1-SUMMARY.md` for full numbers):
  - **WST-04**: 85% of all AI spend ($820 of $968) on duplicate re-verifications — 2,091 SKUs submitted 2+ times.
  - **ACC-01**: 56.6% of titles (10,616 jobs) outside 60–80 char target.
  - **ACC-12**: 70% of style outputs are defaulted ("Contemporary" 49.4%, "Modern" 20.9%).
  - **ACC-05**: 39.7% finish = color (7,458 jobs) — pre-Fix #078 corpus.
  - **WST-03**: 2,818 Claude Phase B title corrections computed then discarded.
  - **WST-02/07**: $107.73 in research spend with `fieldsCaptured=0` (unmeasured efficacy).

### Phase 2 — Golden set (2026-06-09)
- 49 SKUs selected across 14 strata (appliances, non-appliances, edge cases, failing categories).
- Raw payloads exported to `audit-results/golden-set/payloads/`.
- Draft answers generated in `audit-results/golden-set/golden-answers.draft.json` (343 fields).
- **⚠️ BLOCKED ON HUMAN REVIEW** — harness (`scripts/golden-harness/run-harness.js`) judges only `status:"reviewed"` fields; no reviewed fields yet.

### Phase 3 — Code / security review (2026-06-10)
- All 11 CON/OVS items verified or refuted with primary evidence.
- Full writeup: `audit-results/platform-audit/2026-06-09/PHASE-3-REVIEW.md`.
- Key findings confirmed: CON-04 (no DB backups — CRIT), CON-07 (unauthenticated confirm endpoint), CON-08 (4 critical npm vulns), CON-01 (webhook secret in 2 tracked files).

### Phase 4 — Ops hardening (2026-06-10)
All 5 waves shipped; full evidence in `audit-results/platform-audit/ACCEPTANCE-LOG.md`.

| Fix | Status | Details |
|-----|--------|---------|
| **Finding #079** — CI auto-deploy removed | **CLOSED** `631fa7d` | `deploy-production` job in `ci-cd.yml` was running `rsync --delete` + `npm install --production` + restart on every push — root cause of devDeps saga (OVS-03), mid-job restarts (#078), phantom prod changes, deleted backups. Now build+test only. |
| **CON-04** — MongoDB backups | **CLOSED** | `scripts/ops/backup-mongo.sh` + 6h cron → `/var/backups/catalog-verification/mongo/`; 28-archive retention; restore-tested 19,267/19,267 exact. |
| **CON-07** — `/api/webhook/confirm` unauthed | **CLOSED** | `apiKeyAuth` middleware added; live-tested 401 before/after. |
| **CON-08** — npm vulns 92→12 | **PARTIAL** | Non-breaking fixes applied. 2 critical remain (jsforce — requires major upgrade, breaking changes). |
| **CON-01** — webhook secret scrubbed | **PARTIAL** | Secret removed from 2 tracked files. Git history still contains it; rotation requires SF coordination. |
| **OVS-05** — health digest | **PARTIAL** | `scripts/ops/health-digest.sh` + 06:30 daily cron; push alerting (email/Slack) channel decision pending. |

### Additional work (2026-06-10)
- **`src/utils/spec-table-extractor.ts`** — `findInSpecificationTable()` extracted from the 15.5k-line `dual-ai-verification.service.ts` to a pure testable function. Identical body, verified by diff. Used for Format A/B/C/D HTML spec table parsing.
- **`src/__tests__/utils/spec-table-extractor.test.ts`** — 11 jest unit tests on real golden-set payloads (Format A: B18IF70NSP→"Stainless Steel"; Format C: NS-CZ14WH2→"White"; Bug-A regression guard, null safety, >80-char reject, metacharacter safety).
- **`scripts/golden-harness/run-harness.js`** — G3 harness scaffold; loads `golden-answers.json` (or `.draft.json`); judges only `status:"reviewed"` entries; `--gate` exits 1 on any hard mismatch; `--field=` filter.
- **`audit-results/platform-audit/SCORECARD.md`** — Full ranked board (CRIT/HIGH/MED/LOW); living document.

### WST-04 Investigation + SF Team Brief (2026-06-10)
- Confirmed SF is re-sending already-verified products (user: "It shouldn't be sending the same thing multiple times").
- CVE28DP3NHD1: submitted 26 times across 3 waves; same byte-identical payload sent 9 times; every prior result acknowledged by SF before re-send.
- **`docs/SF-TEAM-BRIEF-DUPLICATE-SUBMISSIONS.md`** — Evidence-based brief for SF developer; 3 issues, 8 numbered questions. Committed at `4ff6e9a`.

---

## 3. Pending Items — What the Next Session Should Do

### Waiting on external parties

| Item | Owner | Priority |
|------|-------|----------|
| **SF team brief response** — 8 questions about duplicates, cagp-lot batch, picklist creation requests | SF dev | HIGH — blocks WST-04 root fix |
| **Golden-answers review** — 49 SKUs in `audit-results/golden-set/`; workflow in `README.md` | User | HIGH — blocks harness, L2, all pipeline-quality ACC/WST fixes |
| **CON-01 secret rotation** — git history still has old secret; rotation requires SF coordination | SF dev | MED |
| **cagp-lot 763 jobs** — real products needing resubmit, or test data to write off? | User/SF | MED |
| **GAP-03 picklist follow-up** — Freestanding/Counter Depth 70+ days stale | SF/user | MED |

### Decisions needed from user

| Decision | Implication |
|----------|-------------|
| Golden answers review (see above) | Unlocks everything downstream |
| jsforce major upgrade | Would fix 2 remaining CRIT npm vulns; breaking changes |
| OVS-05 push alerting channel (email / Slack) | Upgrade health digest from pull → push |
| CON-03: 20 SSH authorized keys on root | Inventory + prune with ops |
| WST-04 our-side guards | In-flight dedup + identical-payload window are designed, ready to code; worth building while awaiting SF answer? |

### Code work ready to build (no blocking decisions except golden review)

1. **WST-04 our-side guards** (designed, not yet coded):
   - *In-flight guard*: POST for a catalog ID with pending/processing job → return existing job ID (HTTP 202) instead of new run. Eliminates 1,422 in-flight duplicate class.
   - *Identical-payload dedup window*: byte-identical payload within 24h of completed run → re-deliver stored result via webhook. Eliminates the ×9-identical class.
   - Re-sends with changed payloads continue processing normally.

2. **Pipeline-quality fixes** (gated on golden review to avoid blind fixes):
   - **ACC-01**: title length outside 60–80 chars (10,616 jobs, 56.6%)
   - **ACC-12**: style always defaulting ("Contemporary" 70% combined)
   - **ACC-11**: repeated brand token in titles (2,108 jobs, 11.2%)
   - **WST-03**: Claude Phase B title corrections discarded — schema always wins (2,818 occurrences); needs L2 judgment on whether schema or Claude is more accurate

---

## 4. Key Reference Files

| File | Purpose |
|------|---------|
| `docs/PLATFORM-AUDIT-GUIDE.md` | Master methodology + Status Board + resume protocol |
| `audit-results/platform-audit/SCORECARD.md` | Ranked findings board (living) |
| `audit-results/platform-audit/ACCEPTANCE-LOG.md` | Phase-by-phase gate evidence |
| `audit-results/platform-audit/2026-06-09/PHASE-1-SUMMARY.md` | Corpus scan headline numbers |
| `audit-results/platform-audit/2026-06-09/PHASE-3-REVIEW.md` | Code/security review evidence |
| `audit-results/golden-set/README.md` | Golden-set review workflow |
| `audit-results/golden-set/golden-answers.draft.json` | 49 SKUs, 343 fields — awaiting human review |
| `docs/SF-TEAM-BRIEF-DUPLICATE-SUBMISSIONS.md` | Brief for SF dev (sent 2026-06-10) |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` | All findings #001–#079 |
| `scripts/golden-harness/run-harness.js` | G3 regression harness |
| `src/utils/spec-table-extractor.ts` | Extracted spec-table parser (11 unit tests) |

---

## 5. Architecture Context (for cold-start)

- **Core service**: `src/services/dual-ai-verification.service.ts` (~15k lines) — the pipeline. Do not edit without reading existing logic first.
- **Pipeline flow**: SF webhook POST → 202 immediate → async job queue → dual-AI (OpenAI + xAI) → Claude Phase B review (non-appliances only) → webhook response → SF confirms.
- **Title generation**: `src/services/seo-title-generator.service.ts` — slot system per `config/title-schema-by-category.ts`. Known issue: Claude Phase B title corrections always overridden by schema title (WST-03 / CLAUDE.md Known Issues).
- **Picklist matching**: 6-pass algorithm; threshold 0.7; below → `FailedMatchLog` + pending creation request.
- **MongoDB**: collection is `verification_jobs` (underscore), payload at `rawPayload`, two schema eras for `result.Primary_Attributes` (`AI_*` and `*_Verified`).
- **Deploy**: manual only — `git pull → npm install --include=dev → npm run build → systemctl restart`. NEVER pipe `npm install` through `tail` (masks exit code).

---

## 6. Commits This Session

No code commits. System state unchanged from `4ff6e9a` (2026-06-10).

---

## 7. Next Steps (in priority order)

1. **Human golden-answers review** → unlocks the entire pipeline-quality fix track. Start with any 5–10 SKUs using `audit-results/golden-set/README.md` workflow.
2. **Await SF response** to `docs/SF-TEAM-BRIEF-DUPLICATE-SUBMISSIONS.md` — once received, implement WST-04 our-side guards.
3. **Build WST-04 in-flight guard** (doesn't need SF answer — eliminates the duplicate class where SF fires before first run completes). Low risk, high ROI.
4. **Upgrade jsforce** when ready for a breaking-change maintenance window (fixes 2 remaining CRIT vulns, CON-08).
5. Once golden answers reviewed: run harness (`node scripts/golden-harness/run-harness.js`), identify pipeline mismatches, fix per Class 1/2/3 classification.
