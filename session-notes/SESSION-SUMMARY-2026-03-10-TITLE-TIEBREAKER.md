# SESSION SUMMARY — March 10, 2026 (Title-Based Tiebreaker)

## Context / Why
During the previous session analyzing 73 lighting products, we found that the AI verification system was miscategorizing certain products when the two AI models (OpenAI and xAI) disagreed on the category. The existing logic simply picked the higher-confidence AI or fell back to Salesforce's category — neither of which checked the actual product title for clues. This led to:
- Medicine Cabinets classified as "Wall Decor" (item FMC022436L)
- Wall Sconces classified as "Track and Rail Lighting" (item RL2782NB)

A previous attempt to fix this via category aliases was incorrect (commit cb3695a) and was reverted (commit efe5f68). This session implemented the correct universal approach: **Option C — Title-Based Tiebreaker**.

## Architecture Context
The verification system uses a 3-stage hierarchical AI pipeline:
- **Stage 1**: Department determination (9 departments)
- **Stage 2**: Category determination (161 categories) — **THIS IS WHERE THE FIX GOES**
- **Stage 3**: Type/Style/Attribute extraction (constrained to selected category)

Stage 2 has two paths:
- **PATH A** (SF Category exists): AIs independently verify Salesforce's category
- **PATH B** (No SF Category): AIs determine category from scratch

Both paths had weak tiebreaker logic when AIs disagreed.

## Work Completed

### 1. Baseline Saved (Before)
Saved 75 most recent verification results from production to:
- `audit-results/baseline-before-tiebreaker-2026-03-11.json` (raw data)
- `audit-results/baseline-before-tiebreaker-2026-03-11.txt` (readable table)

### 2. Title-Based Tiebreaker Implementation

**New File: `src/config/category-title-keywords.ts`**
- Keyword map for ~140 non-appliance categories
- Each category has 3-6 distinctive title keywords
- Example: `'Medicine Cabinet': ['medicine cabinet', 'mirrored cabinet', 'recessed cabinet']`
- Appliance categories excluded (per user request — appliances work well already)

**Modified: `src/config/category-config.ts`** (+38 lines)
- Added import of `NON_APPLIANCE_CATEGORY_TITLE_KEYWORDS`
- Added `resolveCategoryDisagreementByTitle(title, candidateA, candidateB)` function
- Returns `{ winner, loser, matchedKeywords }` or `null` if inconclusive

**Modified: `src/services/dual-ai-verification.service.ts`** (+93 lines, -18 lines)
- **PATH A insertion** (~line 2241): When AIs disagree with each other AND SF category exists:
  - Title tiebreaker runs FIRST for non-appliance categories
  - If conclusive → uses title-matched category (overrides SF tiebreaker)
  - If inconclusive → falls through to existing SF tiebreaker (unchanged)
- **PATH B insertion** (~line 2340): When AIs disagree with no SF category:
  - Title tiebreaker runs AFTER buildConsensus() picked higher confidence
  - If conclusive → overrides the confidence-based pick
  - If inconclusive → keeps existing pick (unchanged)
- Fixed TS2454 error: `determinedCategory` initialization for flow analysis

### 3. Guardrails
- **Only fires on AI disagreement** — if both AIs agree, tiebreaker is skipped entirely
- **Non-appliance only** — `isAppliancesCategory()` check bypasses for appliances
- **Null-safe fallback** — if no keyword match, existing logic takes over (zero regression risk)
- **Full logging** — every tiebreaker decision logged with keywords, winner, loser, title used

## Files Modified
| File | Change | Lines |
|------|--------|-------|
| `src/config/category-title-keywords.ts` | **NEW** — keyword map | 189 lines |
| `src/config/category-config.ts` | Added import + resolver function | +38 lines |
| `src/services/dual-ai-verification.service.ts` | 2 tiebreaker insertions | +93/-18 lines |
| `audit-results/baseline-before-tiebreaker-2026-03-11.json` | **NEW** — baseline data | 1 line |
| `audit-results/baseline-before-tiebreaker-2026-03-11.txt` | **NEW** — baseline readable | 77 lines |
| `audit-results/CATEGORY-MATCHING-ANALYSIS.md` | **NEW** — prior session analysis | 182 lines |

## Commits
| Hash | Message |
|------|---------|
| `dfa681f` | feat: Add title-based tiebreaker for non-appliance category disagreements |

## Current System State
- **Local**: `dfa681f`
- **GitHub**: `dfa681f`
- **Production**: `dfa681f`
- **Status**: ✅ ALL SYNCED
- **Service**: Healthy (restarted 21:25 EDT)
- **Health**: `{"status":"healthy"}`

## Pre-Deploy Validation
- Check #1 (TypeScript): ✅ PASSED
- Check #2 (Dependencies): ✅ PASSED
- Check #3 (Feature Completeness): ✅ PASSED
- Check #4 (Title System Runtime): ✅ PASSED
- Check #5 (Title Generation): ❌ FAILED (PRE-EXISTING — "Brand missing from title" — not related to our changes)
- Check #6 (Picklist Fields): ✅ PASSED
- Check #7 (Hardcoded Lists): ✅ PASSED

## Remaining Warnings / Issues
1. **Check #5 pre-existing failure** — Title generation test has "Brand missing from title" issue across all 162 categories. This predates our changes and needs separate investigation.
2. **407 pending picklist syncs** at CRITICAL severity (from prior sessions)
3. **32 pending attribute creation requests** 8-10 days old

## How to Compare Before/After
Once new calls come through after deployment:
```bash
# Fetch new results (after tiebreaker is active)
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cd /opt/catalog-verification-api && node -e \"
const mongoose = require('mongoose');
async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/catalog-verification');
  const db = mongoose.connection.db;
  const jobs = await db.collection('verification_jobs').find({
    status: 'completed',
    completedAt: { \\\$gte: new Date('2026-03-11T01:26:00Z') }
  }).sort({completedAt: -1}).limit(75).project({
    sfCatalogId: 1, sfCatalogName: 1,
    'result.Primary_Attributes.AI_Product_Category': 1,
    'result.Primary_Attributes.AI_Product_Department': 1,
    'result.Primary_Attributes.AI_Type': 1,
    completedAt: 1
  }).toArray();
  console.log(JSON.stringify(jobs));
  await mongoose.disconnect();
}
run();
\""

# Check if tiebreaker actually fired
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "grep -c 'Title tiebreaker' /opt/catalog-verification-api/logs/combined.log"
```

## Next Steps
1. **Wait for Salesforce to push the same batch of calls** — you need to re-trigger those 73+ lighting products
2. **Compare categories** — look for items where category changed between baseline and new results
3. **Check logs for tiebreaker activations** — `grep "Title tiebreaker" combined.log`
4. **Monitor for any regression** — ensure no products that were correctly categorized before are now wrong
5. **If tiebreaker works well** — consider expanding to Option B (post-category validation) for cases where both AIs agree on the wrong category
6. **Address remaining items**: LED extraction, dimension validation, light count cross-reference

## Key Reference Files
| File | Purpose |
|------|---------|
| `src/config/category-title-keywords.ts` | Keyword map — edit to add/remove keywords |
| `src/config/category-config.ts` | `resolveCategoryDisagreementByTitle()` — the tiebreaker logic |
| `src/services/dual-ai-verification.service.ts` | Main pipeline — lines ~2241 and ~2340 for insertions |
| `audit-results/baseline-before-tiebreaker-2026-03-11.json` | Before results (75 items) |
| `/memories/repo/deployment-rules.md` | NEVER deploy without user confirmation |
