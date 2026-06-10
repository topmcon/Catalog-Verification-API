# Platform Audit — Acceptance / Evidence Log

> Required by PLATFORM-AUDIT-GUIDE.md §6.0: every phase's verification results are recorded here
> (date, commit, tests, pass/fail, evidence pointer). Newest entries at the top.

---

## 2026-06-10 — Phase 4 wave 2: webhook/confirm auth (CON-07), health digest (OVS-05), SCORECARD

**Scope**: `apiKeyAuth` on `POST /api/webhook/confirm` + `GET /api/webhook/status`; `scripts/ops/health-digest.sh`
(+ 06:30 cron); initial `SCORECARD.md` (Phase 1+3+4 synthesis).

| Test | Result | Evidence |
|------|--------|----------|
| T1 true-positive | ✅ | `POST /api/webhook/confirm` no key → **401** (was 200 pre-fix, live-tested both states) |
| T2 passthrough | ✅ | Main SF inbound `/api/verify/salesforce` behavior unchanged (401 without key = its pre-existing auth, SF sends the key); endpoint had **zero legitimate traffic ever** (0 `sf_save_confirmed` audit logs in DB history) so no SF flow can break |
| T3 mode-gating | n/a | — |
| T4 safety | ✅ | digest is read-only; `set -uo pipefail`; mongo section degrades to "UNAVAILABLE" |
| T5 observability | ✅ | digest live run: service active, health OK, backup 0h/1242MB, jobs/pending counts, disk; cron count = 2 (backup + digest) |

Gates: typecheck clean · 72/72 · validator ALL 10 PASSED · deployed, service active · digest verified on prod.

---

## 2026-06-10 — Phase 4 wave 1: backups (CON-04), secret scrub (CON-01), npm fixes (CON-08), Finding #079

**Commits**: backup script → scrub → `npm audit fix` (92→12 vulns, criticals 4→2; axios type fix) →
**`631fa7d` Finding #079** (CI auto-deploy removed, backups relocated).

| Verification | Result | Evidence |
|------|--------|----------|
| Backup T1 (produces archive) | ✅ | 1.3GB archive, traced run (`bash -x`) every step green |
| Backup T2 (restorable) | ✅ | mongorestore to scratch DB: **19,267/19,267** verification_jobs round-trip exact; scratch dropped |
| Backup T4 (safety) | ✅ | MIN_BYTES sanity check; retention prunes to 28; relocated to `/var/backups/` after #079 rsync deletion |
| Secret scrub | ✅ | `git grep <secret>` → no tracked file matches (history/rotation pending user) |
| npm fixes G1/G2/G4 | ✅ | typecheck clean, 72/72 tests, validator ALL 10 PASSED local AND prod post-repair |
| #079 fix effective | ✅ | Post-fix push: CI run = build+test only (39s, no deploy); devDeps intact on prod afterwards; 3-way sync `631fa7d` |

**Finding #079 discovery chain**: devDeps vanished between verified states → npm debug logs showed
`npm install --production` runs correlated with pushes → `ci-cd.yml` deploy job (rsync --delete + prune +
restart on every push). Explains OVS-03 history, #078 mid-job restarts, phantom prod local changes, and
the deletion of the first backup. Full writeup: AUDIT-FINDINGS-AND-SOLUTIONS.md #079.

---

## 2026-06-10 — spec-table extractor extraction + first pipeline unit tests + golden harness

**Commit**: `fe6165b` · **Scope**: `findInSpecificationTable` extracted from
`dual-ai-verification.service.ts` (15,528 lines) to `src/utils/spec-table-extractor.ts` (identical body,
verified by diff during extraction); 11 jest tests added; `scripts/golden-harness/run-harness.js` built;
`PHASE-3-REVIEW.md` published.

| Gate | Result | Evidence |
|------|--------|----------|
| G1 build | ✅ | `tsc --noEmit` clean local; **prod dist verified**: `dist/services/dual-ai-verification.service.js` contains `require("../utils/spec-table-extractor")`, `dist/utils/spec-table-extractor.js` present |
| G2 logic | ✅ | Suite 72/72 (was 61). New tests use REAL golden payloads: T1 per HTML format (A: B18IF70NSP Color→"Stainless Steel"; C: NS-CZ14WH2/NS-CZ70WH26L Color Finish→"White"; B/D synthetic per #078 shapes). T2: #078 Bug A regression guard (no adjacent-row bleed), absent-attr→null, null-input→null, >80-char reject, regex-escape |
| G3 results | ✅ (scaffold) | Harness runs in draft mode: 49 entries / 343 fields awaiting review / judges only `status:"reviewed"`; `--gate` exits 1 on mismatch |
| G4 deploy | ✅ | Validator ALL 10 PASSED pre-deploy; unpiped `npm install --include=dev` (exit 0 echoed); service active; `/health` healthy; 3-way sync `fe6165b` |

**Phase 3** closed same commit — every CON/OVS item verified-or-refuted with primary evidence
(`audit-results/platform-audit/2026-06-09/PHASE-3-REVIEW.md`). Top outcomes: CON-04 **no DB backups (CRIT)**;
CON-08 4 critical npm vulns; CON-01 secret in 2 tracked files; CON-07 mostly refuted (live 401) except
unauthenticated `POST /api/webhook/confirm` (live 200); CON-05 mostly refuted (`recoverStaleJobs()` exists).

---

## 2026-06-09 — G0: Test baseline repair (gate prerequisite)

**Commit**: (this commit) · **Scope**: jest.config.js, tsconfig.json, html-generator.test.ts,
pre-deploy-validate-all.sh, attribute-request-flow demo quarantine.

**Baseline before**: 5 suites / 3 failed — 2 stale `html-generator` assertions (implementation moved to
inline styles for SF compatibility; tests still expected a `<style>` tag and a `tableClass` that the code
deliberately ignores), plus `setup.ts` and a zero-test demo script collected as suites by the over-broad
`testMatch: '**/__tests__/**/*.ts'`. `npm test` wired into no procedure.

**Changes**:
1. html-generator tests updated to assert the CURRENT contract: inline styles always, `<style>` never,
   legacy `includeStyles`/`tableClass` options ignored (they are dead options in the implementation).
2. `testMatch` narrowed to `*.test.ts`/`*.spec.ts`; `__tests__/manual/` ignored.
3. Demo script quarantined to `src/__tests__/manual/attribute-request-flow.demo.ts` (import path fixed
   one level deeper; still runnable manually). `src/__tests__` excluded from the production `tsc` compile
   (ts-jest owns test compilation) — the rename had unmasked latent type errors because only `*.test.ts`
   was excluded before.
4. `pre-deploy-validate-all.sh`: CHECK #1 now `./node_modules/.bin/tsc --noEmit` (bare `tsc` is not on
   prod PATH — OVS-03); new critical CHECK #2 `npx jest --silent` — `npm test` is now part of the deploy
   gate for the first time.

**Verification (T1–T5 shape)**:
| Test | Result | Evidence |
|------|--------|----------|
| T1 true-positive (red suite blocks) | ✅ | Pre-fix run: `Tests: 2 failed, 59 passed` → CHECK failed, DEPLOYMENT BLOCKED banner |
| T2 passthrough (green suite passes) | ✅ | Post-fix local run: `Test Suites: 3 passed / Tests: 61 passed`; full validator: ALL 10 CHECKS PASSED — SAFE TO DEPLOY |
| T3 mode-gating | n/a (no execute mode) | Validator is read-only; gates deploy only |
| T4 safety/bounds | ✅ | Jest runs with no DB/network (unit scope); validator unchanged in failure semantics (critical → ABORT) |
| T5 observability | ✅ (local) / prod run below | CHECK #1/#2 lines appear in validator output; prod execution recorded in this entry after deploy |

**Prod execution (the G0 acid test)**: first prod run FAILED checks #1–#3 — devDependencies (ts-jest,
@types/*) were absent despite the deploy running `npm install --include=dev`. Root cause of the masking:
the deploy command piped install output through `| tail -1`, which **swallows npm's exit code** (no
pipefail), so a failed install chained on to a "successful" deploy. Re-running `npm install --include=dev`
unpiped installed everything; second validator run on prod: **ALL 10 CHECKS PASSED — SAFE TO DEPLOY**
(2026-06-09 ~21:45 EST).

**Lesson (added to deploy discipline)**: never pipe deploy-critical commands through `tail`/`grep` without
`set -o pipefail`; the canonical deploy already uses plain `npm install --include=dev` — keep it unpiped.
This also explains the historical "tsc not in PATH on prod" reports (OVS-03): pruned/incomplete devDeps,
not a PATH problem. CHECK #1 now uses `./node_modules/.bin/tsc --noEmit` which both works and fails loudly
when typescript is genuinely missing.
