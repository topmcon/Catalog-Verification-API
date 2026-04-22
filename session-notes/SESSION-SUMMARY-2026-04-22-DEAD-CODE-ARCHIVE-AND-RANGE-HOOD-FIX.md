# Session Summary — April 22, 2026 (EDT) — Afternoon

## Range Hood Misclassification Fix + Dead Code Archive

**Session window**: ~9:45 AM EDT — present
**Final commit**: (set by Save Everything)
**Sync target**: LOCAL = GITHUB = PROD

---

## Context / Why

User flagged an SF verification result for `ALT723612HEA` (HEAT GRILLS outdoor BBQ
hood) that came back with `AI_Product_Category = "Outdoor Fireplace"` and an empty
`AI_Product_Category_Lookup`. Raw SF data was correct (`Category_Legacy=Range Hood`,
`Web_Retailer_Category=HOODS`, `Web_Retailer_SubCategory=DUCTED HOOD`), but the AI
overrode it because the prompt didn't anticipate outdoor-kitchen/BBQ hoods.

Initial fix attempt edited the wrong file (`src/agents/CategoryClassifierAgent/`),
which is **dead code** — the production pipeline runs `dual-ai-verification.service.ts`,
not the Phase 1 agent scaffolding. User asked for a holistic check so we don't keep
troubleshooting one symptom after another.

---

## Architecture Context

**Confirmed production request flow** for `POST /api/verify/salesforce`:

```
routes/salesforce-async-verification.routes.ts
  → controllers/salesforce-async-verification.controller.ts (enqueues job)
  → services/async-verification-processor.service.ts (worker polls queue)
  → services/dual-ai-verification.service.ts → verifyProductWithDualAI()
    → category-matcher, type-matcher, consensus, response-builder
  → webhook back to SF
```

**Dead/unwired** (was misleading code-search results):
- `src/agents/**` (entire tree — Phase 1 agent rewrite, never wired in)
  - `CategoryClassifierAgent` with its own prompts/schema/consensus
  - `VerificationOrchestrator` (zero imports from production)
  - `BaseAgent`, `AgentDebugLogger`, debug checks
- `src/config/title-schema-by-category-OLD-BACKUP.ts` (6,791-line stale backup)

---

## Detailed Work Completed

### Fix #1 — Range Hood department prompt (production code path)

**File**: `src/services/dual-ai-verification.service.ts` → `getDepartmentOnlyPrompt()`

**Before** — Appliances dept description didn't mention ventilation/range hoods;
Outdoor dept description didn't disambiguate that it does NOT contain hoods.

**After** — Two targeted additions:

1. Appliances now explicitly lists **"Range Hood (including outdoor kitchen / BBQ hoods)"**
2. Outdoor dept now carries an explicit negative rule:
   *"NOTE: Outdoor does NOT contain ventilation hoods — even hoods designed for
   outdoor kitchens belong to Appliances → Range Hood"*
3. Added concrete example block:
   *"Outdoor Range Hood / BBQ Hood / Outdoor Kitchen Hood / Ducted Hood (any brand
   including HEAT, Cambridge, Vent-A-Hood) → Appliances, Range Hood. Even when the
   brand name includes 'Grills' or 'BBQ' and the description repeats 'outdoor
   kitchen', a hood is still a Range Hood. Outdoor department does NOT contain
   hoods. Keywords like CFM, blower, baffle filter, ducted, capture area confirm
   Range Hood."*

**Why this is safe** (verified):
- `Range Hood` is universally `department=Appliances` in `categories.json` (no
  outdoor variant exists)
- Outdoor dept categories verified via grep: Storage Drawer/Door, Fire Pit,
  Fire Pit Accessory, Outdoor Fireplace, Outdoor Shower Faucet, Outdoor
  Lighting, Mail Box, Generator, Garden Decor, Hardscaping, Entry Set,
  Exterior Door — zero hood overlap
- Rule is additive disambiguation, not a heuristic override; it teaches a
  taxonomic fact that's always true

### Fix #2 — Preliminary category mapping (defense-in-depth)

**File**: `src/services/response-builder.service.ts` → `mapToVerifiedCategory()`

Added two entries to the `categoryMap`:
```typescript
'DUCTED HOOD': 'Range Hood',
'DUCTED HOODS': 'Range Hood',
```

**Why**: `Web_Retailer_SubCategory` for this product was literally `"DUCTED HOOD"`.
The mapping already had `'HOODS': 'Range Hood'` so `Web_Retailer_Category=HOODS`
was matching, but adding the subcategory-level term makes the preliminary mapping
unambiguous before the AI even runs. Strictly additive — no other picklist uses
"ducted hood".

### Fix #3 — Archive dead code (root-cause hygiene)

`git mv`'d the following to `archive/dead-code-2026-04-22/`:
- `src/agents/` → `archive/dead-code-2026-04-22/agents/`
- `src/config/title-schema-by-category-OLD-BACKUP.ts` → `archive/dead-code-2026-04-22/`

**Verification before move**:
- `grep -rn "VerificationOrchestrator" src/` → zero hits outside `agents/orchestrator/`
- `grep -rn "CategoryClassifierAgent" src/` → only `agents/base/types.ts` enum
  (also moved with the tree)
- `grep -rn "title-schema-by-category-OLD-BACKUP" src/` → zero hits
- Build passes cleanly after move

History preserved via `git mv`; reversible with one revert if anything was
secretly needed.

### Fix #4 — Guard comment to prevent recurrence

**File**: `src/services/dual-ai-verification.service.ts` (header)

Added explicit warning:
```
⚠️ THIS IS THE ACTIVE PRODUCTION VERIFICATION ENGINE for POST /api/verify/salesforce.
   If you are investigating or modifying verification behavior, edit THIS file.
   Do NOT edit anything in archive/dead-code-2026-04-22/agents/ — that is unwired
   Phase 1 scaffolding (see SESSION-SUMMARY-2026-04-06-AGENT-ARCHITECTURE-PHASE1.md).
```

Plus a request-flow diagram inline. This is cheap insurance — future investigators
(human or AI) hit this file and immediately know they're in the right place.

---

## Files Modified

| File | Change |
|---|---|
| `src/services/dual-ai-verification.service.ts` | Added guard header + Range Hood disambiguation in `getDepartmentOnlyPrompt()` |
| `src/services/response-builder.service.ts` | Added `'DUCTED HOOD'` / `'DUCTED HOODS'` → `'Range Hood'` mapping |
| `src/agents/**` (28 files) | Moved to `archive/dead-code-2026-04-22/agents/` |
| `src/config/title-schema-by-category-OLD-BACKUP.ts` | Moved to `archive/dead-code-2026-04-22/` |

---

## Validation

- `npm run build` ✅ clean
- `bash scripts/pre-deploy-validate-all.sh` ✅ all 9 checks passed
  - TypeScript compilation, dependency consistency, feature completeness,
    title system runtime, title generation, picklist fields, hardcoded
    lists, field mapping reference, style cross-reference

---

## Remaining Concerns (deferred to future sessions)

1. **`/api/verify-legacy` endpoint** still mounted in `routes/index.ts:27` →
   `verification.controller.ts` → still calls `verifyProductWithDualAI`. Need to
   audit production logs for any traffic before removing. If unused, remove the
   route + controller + `salesforce-verification.service.ts` re-exports.

2. **`title-generator.service.ts` vs `seo-title-generator.service.ts`** — the
   former appears to be vestigial except for the `isPremiumBrand` helper used by
   `description-generator.service.ts`. Worth inlining and deleting the rest.

3. **74 pending picklist syncs** still in HOLD bucket (CRITICAL severity, would
   wipe 314 custom fields). Carries from prior sessions — needs SF team
   conversation, not code fix.

4. **10 pending creation requests** outbound to SF (some 53 days old). Same.

5. **27.6% failure rate** observed in last-4-hours analytics during Establish
   Connection. Worth a separate dive into the 53 failed jobs to categorize root
   causes.

6. **6 dryer SKUs** from prior session still need re-test against `bfe0cd7` to
   confirm Front Load classification.

---

## Next Steps

1. Re-test `ALT723612HEA` after deploy → should now classify as
   `Appliances → Range Hood` with populated `AI_Product_Category_Lookup`
2. Spot-check 2-3 other outdoor-branded items for any unintended side effects
3. Tackle `/api/verify-legacy` audit (item 1 above) in a dedicated session
4. Address the 27.6% failure rate (item 5)

---

## Key Reference Files

| File | Purpose |
|---|---|
| `src/services/dual-ai-verification.service.ts` (line ~4696, `getDepartmentOnlyPrompt`) | Production AI department prompt — where Fix #1 lives |
| `src/services/response-builder.service.ts` (line ~653, `mapToVerifiedCategory`) | Preliminary picklist → category mapping — where Fix #2 lives |
| `src/services/async-verification-processor.service.ts` | Queue worker that calls the verification engine |
| `src/routes/salesforce-async-verification.routes.ts` | Active endpoint mount for `/api/verify/salesforce` |
| `archive/dead-code-2026-04-22/` | Archived dead code — DO NOT edit, history preserved |
| `session-notes/SESSION-SUMMARY-2026-04-06-AGENT-ARCHITECTURE-PHASE1.md` | Origin of the (now-archived) agent scaffolding |
