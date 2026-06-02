# Session Summary — June 2, 2026
## Findings #066 (Range Type Resolution) + #067 (Slide-In / Brushed Finish)

---

## Context & Goal

Session continued from a prior conversation that ran out of context. The prior session had:
- Created `CLAUDE.md` (new file, 467 lines) at repo root
- Updated `.github/copilot-instructions.md` (+103 lines) with architecture overview and known issues
- Fixed circular dependency in `src/utils/logger.ts`
- Identified the "Claude title override" bug as the primary source of bad SF responses

This session's goal: diagnose and fix specific bad verification responses flagged by SF users.

---

## Finding #066 — Range Type: Front Control vs Top Control (FCRG3051BS)

### Problem

SF reported: "Title is incorrect, should be top control not front control."

Product: **Frigidaire FCRG3051BS** — a freestanding gas range with controls on the rear backsplash panel.

**Data available in the payload:**
- `Product_Title_Legacy`: "Frigidaire 30-Inch **Front Control** Gas Range Stainless Steel"
- `Specification_Table` → `Control Location: **Rear**` (explicit spec attribute)
- Ferguson spec: `Control Location: Rear`

### Root Cause (4-layer failure)

1. **OpenAI anchored on legacy title** — extracted "Front Control" from `Product_Title_Legacy` despite being told not to trust legacy data. xAI correctly read the spec and returned "Rear Control".

2. **Phase 2.5 "both valid same priority" branch** — when both types are valid and equal priority, `determinedType` was left as `openaiType` ("Front Control") by default. No spec cross-reference was applied.

3. **`determinedType` overrides consensus** — `determinedType` is first in `typeCandidates` array and always wins over smart resolution results.

4. **Smart resolution "first AI wins"** — even after Phase 2.5 punted to consensus, the `resolveDisagreementSmart` STEP 6b fallback defaulted to OpenAI when both values were semantic (non-quantity) terms.

5. **"Top Control" not valid for Range** — when the AI prompt fix made xAI return "Top Control", `isValidTypeForCategory` rejected it because "Top Control" was missing from Range's `category-type-mapping.json` (only had Front Control, Rear Control, Pro-Style, Outdoor).

### Fix (5 commits, all deployed)

**`src/services/dual-ai-verification.service.ts`**:

1. **`extractTypeSpecHints()`** (new helper, ~line 1310) — parses `Specification_Table` and `Web_Retailer_Specs` for `Control Location`, `Range Configuration`, `Range Type`. Returns a `Record<string, string>` used as authoritative spec evidence.

2. **Phase 2.5 spec tiebreaker** (~line 3293) — in the "both valid same priority" else branch, apply `extractTypeSpecHints()` before falling back to consensus. If spec says `Control Location: Rear` and xAI matches but OpenAI doesn't, force `determinedType = xaiType` and align both AIs.

3. **STEP 6c in `resolveDisagreementSmart`** (~line 1560) — new step between STEP 6b and the "first for consistency" tiebreaker. Checks `specHints['control_location']`: Rear/Top → prefer the AI with rear/top control type; Front → prefer the AI with front control type.

4. **Post-consensus normalization** (~line 8990) — for Range category: `"Rear Control"` → `"Top Control"` (preferred consumer picklist term). Also: if spec says Slide-In but `aiProductType` isn't Slide-In, override it.

5. **`TYPE_PRIORITY['range']`** — added Range to the priority hierarchy: `['pro-style', 'slide-in', 'outdoor', 'top control', 'front control', 'rear control']`.

**`src/config/salesforce-picklists/category-type-mapping.json`**:
- Added `"Top Control"` as valid primary_filter type for Range (type_id: `a1jaZ000001lFC4QAM`, status: existing).

**`src/services/dual-ai-verification.service.ts` Stage 3 prompt**:
- Added Range TYPE CLARIFICATION block to `getCategorySpecificPrompt()` (same pattern as Dishwasher, Dryer, Washer). Instructs AIs: `Control Location: Rear` → `"Top Control"`, not "Rear Control" or "Front Control". Legacy titles frequently mislabeled.

### Verification

Confirmed fixed via live SF re-trigger. Final log:
```
✅ Phase 2.5 spec tiebreaker: xAI type confirmed by spec
  specControlLocation: "Rear", resolvedTo: "Rear Control" → normalized to "Top Control"
FINAL RESPONSE: type: "Top Control", title: "Frigidaire 30-Inch Top Control Gas Range Stainless Steel - FCRG3051BS"
```

### Commits
- `3113fa8` — initial fix: extractTypeSpecHints, STEP 6c, AI prompt Range clarification
- `5af2b7e` — normalization: "Rear Control" → "Top Control" post-consensus
- `eb3e3b4` — fix Phase 2.5 where determinedType actually locks in (root cause)
- `d4c5ba4` — add Top Control to Range valid types in category-type-mapping

---

## Finding #067 — Slide-In Type + Brushed Finish (WEE750H0HZ)

### Problem

SF reported: "Title is incorrect, it's not saying stainless steel it's saying 'Brushed'."

Product: **Whirlpool WEE750H0HZ** — a 30" slide-in electric range, Stainless Steel finish.

Two bugs in the same response:
1. `AI_Finish`: "Brushed" → should be "Stainless Steel"
2. `AI_Type`: "Front Control" → should be "Slide-In"
3. Title: "Whirlpool 30-Inch **Front Control** Electric Range **Brushed**" → should be "Whirlpool 30-Inch **Slide-In** Electric Range **Stainless Steel**"

### Root Cause — Brushed Finish

The AI extracted "Brushed" as the finish because:
- WEE750H0HZ has a brushed/matte stainless steel surface texture
- The AI extracted the surface treatment ("brushed") rather than the color/material name ("Stainless Steel")
- "Brushed" without a material suffix (Nickel, Gold, etc.) is an incomplete descriptor — not a valid finish name
- `Color_Finish_Web_Retailer` = "Stainless Steel" was available in the payload but AI ignored it

March 2026 run had finish = "" (empty, correct fallback to color). May 2026 run introduced "Brushed" — AI became more aggressive in extracting finish details.

### Root Cause — Slide-In Type

Audit Finding #015 (prior session) moved "Slide-In" from the Range Type field to the Installation Type attribute. This was correct for attribute categorization but broke the title — the Range title template `{Brand} {Width} {Type} {Fuel Type} {Category} {Finish} {Model}` has no Installation Type slot. Result: slide-in ranges had no meaningful type descriptor in the title, and "Front Control" filled the Type slot by default.

The WEE750H0HZ spec explicitly states:
- `Range Configuration: Slide-In`
- `Range Type: Slide-in`
- `installation_type: "Slide-In"` (already correct in Top_Filter_Attributes)

Both AIs consistently extracted `product_type: "Front Control"` because the controls ARE on the front, and no guidance existed to prioritize "Slide-In" over "Front Control" for slide-in ranges.

### Fix

**`src/services/dual-ai-verification.service.ts`**:

1. **`extractTypeSpecHints()` extended** — now also parses `Range Configuration` and `Range Type` from `Specification_Table` and `Web_Retailer_Specs` array (structured data).

2. **Phase 2.5 spec tiebreaker** — handles `range_configuration: "Slide-In"`. Forces both AIs to "Slide-In" type. Takes precedence over control location logic.

3. **STEP 6c extended** — range configuration check runs before control location check. If spec confirms Slide-In and neither AI said it, overrides to "Slide-In" directly.

4. **Post-consensus Range normalization** — if spec says Slide-In and `aiProductType` doesn't contain "slide", override to "Slide-In" at the final type resolution stage.

5. **Finish normalization** — after AI_Finish is resolved, if value is exactly `"Brushed"` (no material suffix), replace with the product color value (`Color_Finish_Web_Retailer` or consensus color). Log: `"Normalized incomplete finish descriptor 'Brushed' → color value"`.

**`src/config/salesforce-picklists/category-type-mapping.json`**:
- Added `"Slide-In"` as valid primary_filter type for Range (type_id: `a1jaZ000001lFAuQAM`, status: existing, type_group: "Installation Config").

Note: `TYPE_PRIORITY['range']` already puts `slide-in` above `front control` and `top control` from Finding #066 fix.

### Verification

Confirmed fixed via live SF re-trigger:
```
FINAL RESPONSE: type: "Slide-In", finish: "Stainless Steel"
title: "Whirlpool 30-Inch Slide-In Electric Range Stainless Steel - WEE750H0HZ"
```

### Commits
- `e9e94a1` — Slide-In type for Ranges + Brushed finish normalization

---

## New Script: audit-recent-jobs.js

**`scripts/audit-recent-jobs.js`** — audits the last N completed verification_jobs for known failure patterns.

**Checks:**
| Code | Pattern | Description |
|---|---|---|
| `FINISH_BRUSHED` | `AI_Finish = "Brushed"` | Incomplete finish descriptor |
| `RANGE_TYPE_WRONG` | Range + spec Slide-In + type not Slide-In | Slide-In range with wrong type |
| `RANGE_REAR_CONTROL` | Range + type "Rear Control" | Should be "Top Control" |
| `RANGE_CONTROL_MISMATCH` | Range + spec Control Location Rear + type "Front Control" | Should be "Top Control" |
| `TITLE_BRUSHED` | Title contains "Brushed" as finish word | Bad title finish |

**Usage:**
```bash
ssh mardeys-prod "cd /opt/catalog-verification-api && node scripts/audit-recent-jobs.js"
ssh mardeys-prod "cd /opt/catalog-verification-api && node scripts/audit-recent-jobs.js --size=100"
ssh mardeys-prod "cd /opt/catalog-verification-api && node scripts/audit-recent-jobs.js --requeue --dry-run"
ssh mardeys-prod "cd /opt/catalog-verification-api && node scripts/audit-recent-jobs.js --requeue"
```

**Audit of last 50 jobs (run June 2, 2026):**
- Clean: 38 jobs
- Flagged: 12 jobs
  - 2 × RANGE_CONTROL_MISMATCH (FCRG3051BS — old runs, already corrected)
  - 2 × RANGE_REAR_CONTROL (WFES5030RZ, WFES3030RB)
  - 8 × FINISH_BRUSHED (various Range Hoods, Ranges, Washer)

**Pending:** requeue of 10 non-FCRG3051BS flagged jobs not yet run (user to confirm).

### Commit
- `9ccba2d` — feat(scripts): audit-recent-jobs.js

---

## Files Modified This Session

| File | Change |
|---|---|
| `src/services/dual-ai-verification.service.ts` | extractTypeSpecHints(), Phase 2.5 spec tiebreaker, STEP 6c, TYPE_PRIORITY range, Range/Dishwasher AI prompts, finish normalization, Slide-In override |
| `src/config/salesforce-picklists/category-type-mapping.json` | Added Top Control + Slide-In to Range valid types |
| `scripts/audit-recent-jobs.js` | New script — audits last N jobs for failure patterns, supports --requeue |
| `CLAUDE.md` | New file — full project context for Claude Code sessions |
| `.github/copilot-instructions.md` | Added SSH correction, architecture overview, known issues, sync rule |
| `src/utils/logger.ts` | Fixed circular dependency (removed config import, use process.env directly) |

---

## Commits This Session

```
9ccba2d feat(scripts): audit-recent-jobs.js
e9e94a1 fix(#067): Slide-In type for Ranges + Brushed finish normalization
d4c5ba4 fix(#066): add Top Control to Range valid types in category-type-mapping
eb3e3b4 fix(#066): apply spec tiebreaker in Phase 2.5 where determinedType is actually locked in
5af2b7e fix(#066): normalize Range "Rear Control" → "Top Control" post-consensus
3113fa8 fix(#066): Range type resolution — spec data beats legacy title for Front/Top Control
```

---

## System State at Session End

- **Production commit**: `9ccba2d` (all synced)
- **Service**: active, healthy — `curl https://verify.cxc-ai.com/health` → `{"status":"healthy"}`
- **Picklist sync hold bucket**: 0 pending (2 CRITICAL syncs from SF auto-rejected by reconcile — 0 changes applied)

---

## Known Issues Updated

### ✅ RESOLVED: Finding #066 — Range "Front Control" vs "Top Control"
Fixed via 4 commits. Spec data now authoritative for type resolution in Phase 2.5 and smart resolution.

### ✅ RESOLVED: Finding #067 — Slide-In Range type + "Brushed" finish
Fixed via 1 commit. Slide-In added to Range valid types and prioritized over Front/Top Control. "Brushed" finish normalized to color value.

### 🟡 OPEN: 10 historical jobs with bad data need requeue
Run: `node scripts/audit-recent-jobs.js --size=50 --requeue`
Jobs: WFES5030RZ, WFES3030RB, ZAZE42DS, CGSR366L, AK7136BSBF, INLX35SSV2, WF53BB8900A, Z1C0178, LSIS6338FE, ZRGM90BS

### 🟡 OPEN: Claude Title Override (active — pre-existing)
When Claude Phase B proposes a title correction, schema title always wins. Location: `dual-ai-verification.service.ts` ~line 12356. Not investigated this session.

### 🟡 OPEN: Pre-deploy validation script broken on production
`tsc` not in system PATH on production server — `npm run build` works but `bash scripts/pre-deploy-validate-all.sh` fails on CHECK #1/#2. GPM format check also fails (pre-existing). Script needs to use `./node_modules/.bin/tsc` or `npm run build`.

### 🟡 OPEN: 6 garbage attributes in attributes.json (pre-existing)
`actual_product`, `detected_product`, `image_detected`, `serial_number_example`, `serial_example`, `listing` — all `NEEDS_SF_ID`. Could fuzzy-match against real products.

---

## Next Steps

1. **Requeue 10 flagged jobs**: `node scripts/audit-recent-jobs.js --size=50 --requeue`
2. **Fix pre-deploy validation script**: update `tsc` call to use `./node_modules/.bin/tsc`
3. **Investigate Claude title override** at `dual-ai-verification.service.ts` ~line 12356
4. **Remove 6 garbage attributes** from `attributes.json`
5. **Update AUDIT-FINDINGS-AND-SOLUTIONS.md** with Findings #066 and #067
