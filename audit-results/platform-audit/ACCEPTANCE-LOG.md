# Platform Audit — Acceptance / Evidence Log

> Required by PLATFORM-AUDIT-GUIDE.md §6.0: every phase's verification results are recorded here
> (date, commit, tests, pass/fail, evidence pointer). Newest entries at the top.

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
