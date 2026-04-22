# Session Summary — 2026-04-22 — Oven Type Disambiguation: "Combi Microwave" Fix

## Context / Why

User flagged that **SMEG SFU4104MCS** (a single-cavity 24" compact oven) was being categorized as `Microwave Combo` (which implies two stacked cavities). User correctly noted: *"combi is not confirmation. Nothing else says combination oven. This is a single oven. How do we fix this from happening again."*

Prior session (commit `f5d7082`) had fixed 8 verification API output bugs and validated AI providers. This session focused on the categorization accuracy issue surfaced by the SMEG product.

Comparison case validated as correct:
- **Samsung NQ70CG700DMTAA** ✅ correctly classified as `Microwave Combo` (genuinely 2 cavities: 1.9 cu ft microwave + 5.1 cu ft oven, 30" wall oven)
- **SMEG SFU4104MCS** ❌ incorrectly classified as `Microwave Combo` (actually 1 cavity, 1.41 cu ft, 24" compact oven with combi heating modes)

## Architecture Context

Type assignment for Ovens flows through two stages:
1. **AI Stage** — Both OpenAI + xAI receive a category-specific prompt with `typeSelectionGuide` text (in `dual-ai-verification.service.ts` around line 5020). They independently output `product_type`.
2. **Type Matcher** — The AI output is normalized via `type-matcher.service.ts` (TYPE_ALIASES dict + regex fallback patterns), then validated against the Salesforce picklist `category-type-mapping.json` (Oven valid types: `Single`, `Double Wall`, `Microwave Combo`, `Accessory`).

Investigation revealed the AI was bypassing the type-matcher entirely by directly outputting the literal Salesforce picklist value `"Microwave Combo"` — because the source title from AJ Madison was *"SMEG 24-Inch Microwave Combo Oven Silver - SFU4104MCS"* and the Oven prompt was vague (only 4 lines, no cavity-count rule).

## Detailed Work Completed

### Fix #1 — Type Matcher Targeted Exclusion (commit `638b31a`)

Initially attempted a broad refactor that removed 6 type aliases. Production log audit revealed this would break 833+ legitimate matches:

| Removed Alias | Production Occurrences |
|---|---|
| `combo-wall-oven` | 199 |
| `Combination Oven` | 190 |
| `microwave-combination` | 120 |
| `Combination Wall Oven` | 104 |
| `microwave combo` | 90 |
| `combo oven` | 68 |
| `Microwave Combination` | 62 |
| **TOTAL legitimate at risk** | **~833** |
| `Combi Microwave` (the bug) | **~12** |

**Reverted** the broad changes and applied a **targeted exclusion** instead:

In `src/services/type-matcher.service.ts`:
- Added 3 new aliases mapping `combi microwave` family → `Single` (before generic combo aliases run):
  - `'combi microwave': { 'Oven': 'Single' }`
  - `'combi-microwave': { 'Oven': 'Single' }`
  - `'combination microwave oven': { 'Oven': 'Single' }`
- Added regex pattern `/\bcombi[\s-]*microwave\b/i` → `Single` placed **before** generic `combination.*oven` patterns so it wins (order-dependent match)
- All 9 original Microwave Combo aliases preserved unchanged

### Fix #2 — AI Prompt Cavity-Count Rule (commit `0564955`)

Test call with fix #1 still returned `Microwave Combo` for SMEG. Root cause: AI was directly outputting `"Microwave Combo"` (matching the picklist verbatim) so the type-matcher never had a chance to substitute.

In `src/services/dual-ai-verification.service.ts` (lines ~5020-5040), replaced the vague 4-line Oven type guidance:

**BEFORE:**
```
For Ovens, analyze model number and cavity count:
  - Model with "30" or "OB30" → 30" built-in
  - Check specs for "single cavity" vs "double cavity"
  - Look for "Single", "Double Wall", "Combination" in title
```

**AFTER (16 lines):**
```
For Ovens, the Type is determined by CAVITY COUNT and CAVITY CONFIGURATION (NOT cooking method):
  Valid types: "Single", "Double Wall", "Microwave Combo", "Accessory"

  ⚠️ CRITICAL DISAMBIGUATION:
    • "Microwave Combo" = TWO SEPARATE CAVITIES stacked (one microwave + one oven), typically 30" wall oven
      - REQUIRED: Spec must show 2 distinct cavities with separate capacities (e.g., "1.9 cu ft microwave + 5.1 cu ft oven")
      - Total combined height usually 40"+ (two units stacked)
    • "Single" = ONE CAVITY oven, regardless of cooking methods inside it
      - Includes "Combi Microwave" (single cavity with microwave + convection heating modes)
      - Includes "Combination Oven" / "Combi Oven" when only ONE cavity exists
      - Includes 24" compact built-in ovens with multi-mode cooking
    • "Double Wall" = TWO IDENTICAL OVEN CAVITIES (no microwave), typically 30" wall oven

  🔍 DECISION RULE: Count the cavities in the spec table FIRST, then assign type:
    - 1 cavity → "Single" (even if marketed as "Microwave Combo Oven" or "Combi")
    - 2 cavities, one is microwave → "Microwave Combo"
    - 2 cavities, both are ovens → "Double Wall"

  ⚠️ DO NOT trust the source title alone — many compact ovens are marketed with
     "Combo" or "Combination" terminology referring to cooking METHODS, not separate cavities.
```

### Defense-in-Depth Strategy

Two layers of protection now:
1. **AI prompt** teaches correct decision rule (catches issue at source)
2. **Type matcher** has explicit `combi microwave` → `Single` mapping (catches if AI gets it wrong but uses combi terminology)

Note: If AI directly outputs the literal picklist string `"Microwave Combo"` (as it did for SMEG), only the prompt fix helps — the type-matcher accepts valid picklist values verbatim.

## Files Modified

| File | Change |
|---|---|
| `src/services/type-matcher.service.ts` | +9 lines: 3 new TYPE_ALIASES + 1 regex pattern for `combi microwave` → `Single` |
| `src/services/dual-ai-verification.service.ts` | +16/-4 lines: Replaced vague Oven type guidance with explicit cavity-count decision rule |
| `session-notes/SESSION-SUMMARY-2026-04-22-OVEN-TYPE-COMBI-FIX.md` | NEW — this file |

## Commits

| Hash | Message |
|---|---|
| `638b31a` | fix(type-matcher): exclude 'Combi Microwave' cooking method from Microwave Combo type |
| `0564955` | fix(ai-prompt): clarify Oven type selection by cavity count, not cooking method |

## Current System State

| Item | Status |
|---|---|
| LOCAL commit | `0564955` |
| GITHUB commit | `0564955` |
| PRODUCTION commit | `0564955` |
| Sync | ✅ ALL SYNCED |
| Service | active |
| Health endpoint | `{"status":"healthy"}` |
| Pre-deploy validation | 9/9 checks passed |
| Production build | clean (had to `npm install` once for missing `tsc`) |

## Test Calls Observed

| Time (EST) | Job ID | SF ID | Outcome |
|---|---|---|---|
| 00:13:26 | `e79fa33e` | `a03Hu00001N2KxAIAV` (SFU4104MCS) | Returned `Microwave Combo` (BEFORE fixes) |
| 00:27:40 | `62276002` | `a03Hu00001N2KxAIAV` | LOST — SIGTERM at 00:27:51 mid-processing, no recovery |
| 00:30:49 | `ac15e478` | `a03Hu00001N2KxAIAV` | Returned `Microwave Combo` (after fix #1 only — proved AI was bypassing type-matcher) |

User has not yet re-tested after fix #2 (commit `0564955`).

## Remaining Warnings / Issues

### 🟡 Web Scraper Failures
The AJ Madison URL for SMEG SFU4104MCS returned `MINIMAL_CONTENT` (0 specs extracted) on every test. This eliminates external validation, forcing AI to rely solely on `Web_Retailer_Data`. If specs were available, cavity count would be more obvious.
- **Severity**: Medium — affects all single-source AJ Madison products
- **Recommendation**: Investigate AJ Madison anti-bot detection or add to puppeteer-required hostnames

### 🟡 Image Analysis Provider Mismatch
xAI `grok-3` model rejected image inputs: `"Image inputs are not supported by this model."` This was the only image source for SMEG.
- **Severity**: Low (multimodal fallback exists)
- **Recommendation**: Audit xAI model selection — should be `grok-vision` or `grok-2-vision` for image tasks

### 🟡 Service Restarts Mid-Processing
Two SIGTERMs hit the service at 00:26:43 and 00:27:51 (likely related to picklist sync at 00:20). One in-flight job (`62276002`) was killed without recovery.
- **Severity**: Medium — silent data loss
- **Recommendation**: Investigate restart triggers and confirm async-processor stale job recovery actually catches mid-Stage-1 jobs

## Next Steps

1. **User to re-send SMEG test call** to validate fix #2 effectiveness — the AI should now output `Single` based on the new cavity-count prompt
2. If AI still outputs `Microwave Combo`, escalate to a **post-AI guard** that overrides type when:
   - `category === 'Oven'` AND
   - Total capacity < 3 cu ft OR width ≤ 24" OR specs explicitly say "1 cavity" / "single cavity"
3. Update `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` with this finding (Combi Microwave misclassification)
4. Investigate AJ Madison scraper failures (separate concern)
5. Review service restart triggers around picklist sync

## Key Reference Files

| File | Purpose |
|---|---|
| `src/services/type-matcher.service.ts` | TYPE_ALIASES dict (lines 32-150) and regex patterns (lines ~580-620) for normalizing AI output |
| `src/services/dual-ai-verification.service.ts` | Lines 5018-5040: category-specific Oven type selection guidance for AI prompts |
| `src/config/salesforce-picklists/category-type-mapping.json` | Lines 295-321: valid Oven types from Salesforce |
| `src/config/salesforce-picklists/types.json` | Master types picklist (line 1479: "Microwave Combo" definition) |
| `src/services/title-generator.service.ts` | Line 237-239: title-side type inference (also has combination/combo logic) |
| `src/services/smart-field-inference.service.ts` | Line 354: smart inference combo oven recognition |
