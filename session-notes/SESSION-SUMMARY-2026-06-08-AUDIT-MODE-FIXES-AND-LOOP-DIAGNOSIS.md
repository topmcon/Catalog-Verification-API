# Session Summary — 2026-06-08 — Audit-Mode Pipeline Fixes + Loop-Convergence Diagnosis

> Cold-start pickup document. Read this top-to-bottom before resuming.
> **TL;DR**: Used Audit Mode (`detect`) to find what the verification pipeline got wrong on ~16 appliance/
> accessory products, fixed 4 real pipeline bugs in `dual-ai-verification.service.ts`, deployed 5 times — but the
> `confirm` loop never fully converged. **The key finding of this session is *why* it didn't converge** (the
> process is broken, not just the code). A process-improvement decision is **still open** — see "Open Decision".

---

## 1. Context — why we were doing this

Workflow (user's stated intent, verbatim earlier): the audit's purpose is to **identify, then fix
`dual-ai-verification.service.ts`** so the mistake never recurs for new SF API calls — not to tune the audit
prompt. The cycle is:

1. **detect** — Audit Mode read-only audit of previously-verified data vs fresh evidence → find mismatches
2. **investigate** — find WHY in the pipeline code
3. **fix** — correct the pipeline logic
4. **confirm** — re-verify the stored payload behind the independent audit gate; push to SF only on clean `MATCH`

By end of session the user stopped us: *"we need to revisit this process. Things have taken way too long. What is
broken or not properly functioning?"* — then **"save everything"**.

## 2. Architecture context (where these fixes live)

- **Audit Mode** (Finding #077): server-side `AUDIT_MODE` env toggle (`off|detect|confirm`). `detect` = read-only
  QA, no SF write. `confirm` = re-verify (no push) → independent audit gate → push only if `overall_status===
  'MATCH'` & 0 mismatches. Targeted confirm: `scripts/audit-confirm.js --catalog=X --execute` (needs
  `SALESFORCE_API_KEY` = the inbound `WEBHOOK_SECRET`). Review: `scripts/audit-report.js --mismatches`.
- The 7 audited fields: AI_Brand, AI_Product_Category, AI_Type, AI_Style, AI_Color, AI_Finish, AI_Product_Title.
  Evidence sources: Web Retailer, Ferguson, Legacy/Verified, Specification_Table.
- All pipeline fixes are in **`src/services/dual-ai-verification.service.ts`** (~15k lines).
- MongoDB collection is **`verification_jobs`** (underscore). Stored payload is at `rawPayload` (NOT `input`).
- **Deploy command** must use `npm install --include=dev` (plain `npm install` prunes `@types` devDeps and the
  `tsc` build fails). Production runs compiled JS from `dist/` — always `npm run build` after pull.

## 3. Real pipeline bugs found & fixed this session (Finding #078)

These were genuine code defects. See `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` Finding #078 for full detail.

**Bug A — `findInSpecificationTable` over-capture** (`1342a2f`, `1d61a95`)
Old regex `[^:;|\n]{2,60}` over flattened HTML swallowed adjacent spec rows (NS-UZ70SS4 color =
`"- Stainless steel look Product Height - 56 1/8 inches Produc"`). Rewrote to match 4 real HTML formats:
- A: `<td/th>KEY</td/th>…<td/dd>VALUE</td/dd>` (Ferguson)
- B: `<li>KEY - VALUE</li>` (Best Buy)   • C: `<li>KEY</li><li>VALUE</li>` (Best Buy)   • D: `<p>KEY: VALUE</p>`

**Bug B — AI_Color = "Panel Ready" despite explicit spec color** (`1d61a95`)
`||` chain short-circuited on `Color_Finish_Web_Retailer="Custom Panel Ready"`. Now sources evaluated
independently; values matching `panel ready|custom panel|integrated` skipped; first explicit color preferred.

**Bug C — AI_Finish = "Panel Ready" / plain color / duplicate-of-color** (`1d61a95`)
Return `''` for Panel Ready. Post-consensus guard clears finish matching
`white|black|bisque|ivory|almond|biscuit|grey|gray|silver|slate|panel ready|custom panel|integrated`, and clears
finish that equals the resolved color.

**Bug D — ACCESSORIES guard** (`5113692`, `87789ff`)
Preserves SF/WR `ACCESSORIES` category when both AIs try to override it with an appliance category — but only
when product text has explicit accessory-indicator keywords (`door panel|panel for|filter for|part for|
replacement for|compatible with|designed for use with|accessory for|bracket for`). Sets `accessoryGuardFired=
true` to bypass the dept-category validation that would otherwise revert it. Reads `Web_Retailer_Category`
directly for non-Appliances PATH B (where `salesforceCategory=null`). Guard code: `dual-ai-verification.service.ts`
~line 2668–2700.

## 4. ⚠️ THE KEY FINDING — why the loop did not converge

After 5 deploys, the affected set still showed mismatches. **Root cause is the process, not remaining code bugs.**
Evidence-backed:

1. **Non-deterministic audit oracle treated as ground truth.** B18IF70NSP (Bosch panel-ready dishwasher)
   **flipped its own verdict** same-day: 13:45 flagged `AI_Finish "Panel Ready"`; 14:19 flagged
   `AI_Color "Stainless Steel" → "Custom Panel Ready"`. Our Bug-B fix *caused* the 14:19 color mismatch — the
   spec-table "Stainless Steel" belongs to sibling SKU **B18IF70SLS**; this SKU's "N" suffix = panel-ready.
   You cannot converge code against a verdict that moves between runs.

2. **Every `confirm` re-runs the full live pipeline** (research, web search, image vision, dual-LLM) → slow
   (~90s+/product) and injects fresh non-determinism. Confirmed: NSCZ10WH6's "Glossy" finish came from
   `image_vision_analysis`, not the payload — not in our denylist, so it leaked.

3. **One product per prod-deploy, no regression set.** The ACCESSORIES guard fixed RD1884L4D but **regressed
   NSCZ10WH6** (real chest freezer → wrongly "Bathroom Hardware and Accessories" / type "Accessory"). Fixes
   oscillate because each is checked only against its target.

4. **Three failure classes conflated as "pipeline bugs"** — only Class 1 belongs in code:
   - Class 1 real pipeline bug (Bugs A–D) → code ✅
   - Class 2 ambiguous/bad data (B18IF70NSP panel-vs-stainless; NSCZ10WH6 web-retailer brand = MIDEA not
     INSIGNIA, flagged unreliable) → no deterministic code wins; data decision needed
   - Class 3 audit over-strictness (`AI_Style="Contemporary"` UNSUPPORTED on nearly every appliance;
     finish-must-be-empty) → the *audit* is too strict, not the pipeline

## 5. Recommended process fixes (NOT implemented — this is the open decision)

- **Local test harness on stored payloads**: load `verification_jobs.rawPayload`, run the deterministic post-LLM
  logic (or full pipeline) locally — iterate in seconds, deploy once. Most fixes this session are **pure
  functions** unit-testable with no LLM/deploy: `findInSpecificationTable`, finish guard, ACCESSORIES guard,
  explicitColor.
- **Human golden answers per SKU** (7 fields from primary evidence) → test code against those, not the auditor.
- **Fix audit over-strictness** so UNSUPPORTED / genuinely-ambiguous fields don't block a push.
- **Stop image-vision from populating `finish` for appliances** (root cause of "Glossy"), vs. extending denylist.

## 6. Files modified this session

| File | Change |
|------|--------|
| `src/services/dual-ai-verification.service.ts` | Bugs A–D (findInSpecificationTable rewrite, AI_Color/AI_Finish Panel Ready, finish sanity guard, ACCESSORIES guard + bypass + indicator keywords) + debug log |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` | Finding #078 + Quick Reference Index rows |
| `session-notes/SESSION-SUMMARY-2026-06-08-AUDIT-MODE-FIXES-AND-LOOP-DIAGNOSIS.md` | This file |

## 7. Commits (this session)

1. `1342a2f` — Fix findInSpecificationTable over-capture (Bug A, cell-pair Format A only)
2. `1d61a95` — Fix 5 pipeline bugs (Formats B/C/D + AI_Color/AI_Finish Panel Ready + finish sanity + ACCESSORIES)
3. `5113692` — Fix ACCESSORIES guard bypass — prevent dept-category validation reverting it
4. `87789ff` — Require accessory indicator keywords before ACCESSORIES guard fires
5. `414ce11` — Add debug log to ACCESSORIES guard to diagnose hasAccessoryIndicators
6. (Save Everything) — Finding #078 + this summary

> Note: commit messages 1–4 say "Finding #069" — that number was **already taken** (June 3 PDF-parse audit).
> This session's bugs are correctly registered as **Finding #078**.

## 8. System state at end of session

- **Sync**: LOCAL = GITHUB = PROD = `414ce11` (before the Save-Everything doc commit) → ALL SYNCED.
- **Health**: `https://verify.cxc-ai.com/health` → healthy.
- **AUDIT_MODE = `detect`** on prod — ⚠️ while on, **all normal inbound SF verification is rerouted to read-only
  audit (no SF writes)**. Must confirm with user whether to turn OFF. (User was asked at session end.)
- **No products from the failing set were pushed to SF** — all gated `MISMATCH_FOUND [not pushed]`. The 4 earlier
  clean products (NS-CZ10WH26, MF1851, SCFF1842, FFUE2024AW) were pushed in prior runs.

## 9. Remaining issues / next steps

1. **OPEN DECISION (highest priority)**: choose the new process (local harness + golden answers + audit-strictness
   fix) before resuming any more confirm runs. See §5. The AskUserQuestion at session end errored; user said "save
   everything" instead — so the decision is **not yet made**.
2. **Read the `ACCESSORY GUARD DEBUG` log** (`414ce11`) for NSCZ10WH6 to confirm *why* the guard still fired
   (which phrase matched `hasAccessoryIndicators`). Currently **unconfirmed**. Grep prod log for
   `ACCESSORY GUARD DEBUG`. If diagnosis is done, **revert the debug-log commit** (it's noise).
3. **Class-3 systemic fix**: `AI_Style="Contemporary"` is flagged UNSUPPORTED on nearly every appliance — decide
   whether pipeline should stop defaulting Style, or audit should stop flagging UNSUPPORTED as a failure.
4. **Turn AUDIT_MODE back to `off`** when the audit session is truly done (per CLAUDE.md Save-Everything step 9).

## 10. Key reference files

- `src/services/dual-ai-verification.service.ts` — pipeline; ACCESSORIES guard ~L2668, findInSpecificationTable
  helper, AI_Color ~L10844, AI_Finish ~L10938, finish sanity guard (post "Brushed" normalization).
- `src/config/audit-prompt.ts` — discriminative audit prompt (source authority rules, Panel-Ready Rule 1,
  Color Rule 2, Dimension Rule 3, brand aliases Rule 5, COLOR vs FINISH). This is where Class-3 strictness lives.
- `scripts/audit-report.js` — review mismatches; `scripts/audit-confirm.js` — targeted re-verify+push.
- `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` — Finding #077 (Audit Mode), #078 (this session).
- `CLAUDE.md` — Audit Mode section, Save-Everything / Establish-Connection procedures.

## 11. Secrets / access (for resume)

- SSH: `ssh mardeys-prod` (root@134.209.123.173). Prod path `/opt/catalog-verification-api/`.
- `SALESFORCE_API_KEY` for `audit-confirm.js --execute` = inbound `WEBHOOK_SECRET`
  (`af3d3fd8e8487c5a21abba91005f8c8700edca516f755dec9c1e2f140811aacd`).
- Audit results live in MongoDB `audit_jobs` (NOT in Salesforce).
