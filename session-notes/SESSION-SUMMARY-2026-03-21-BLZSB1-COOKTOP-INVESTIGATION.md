# Session Summary — March 21, 2026 (EST)
**Descriptor**: BLZSB1 Cooktop Type Investigation — Outdoor Type + Yes-Burner Bug

---

## Context / Why

Continuing from the previous session where BLZSB1 (Blaze Drop-In Single Side Burner) was
misclassified as **Fire Pit Accessory** and fixed to **Cooktop** (commit `f2ce2bf`).  
After re-running, two new issues were identified:
1. **Type = "Gas"** — should be "Outdoor" for an outdoor side burner
2. **Title shows "Yes-Burner"** — AI returned "Yes" for `number_of_burners`; schema applied `{value}-Burner` blindly

This session addressed both issues, attempted a fix, then **reverted** after user preference.  
Session concluded with investigation of the root cause of why Type=Outdoor is never selected.

---

## Architecture Context

### Cooktop Type Selection
The `category-type-mapping.json` entry for Cooktop has:
```json
{
  "category_name": "Cooktop",
  "filter_label": "Cooktop Type",
  "logic": "Heat source",
  "types": ["Gas", "Electric", "Induction", "Radiant", "Downdraft", "Outdoor", "Accessory"]
}
```

The `"logic": "Heat source"` value is sent to the AI as the instruction for how to pick a type.
**This is the root cause**: the AI correctly applies "Heat source" logic → BLZSB1 runs on gas → Type = "Gas".  
"Outdoor" exists in the type list but there is no instruction telling the AI that outdoor/side-burner
context should override the heat source logic.

### typeCandidates Priority (dual-ai-verification.service.ts)
The type that lands in the final result uses this priority order:
```
[determinedType (openaiType || xaiType), consensus.agreedPrimaryAttributes.product_type, openaiResult.primaryAttributes.product_type, xaiResult.primaryAttributes.product_type, ...]
```
`determinedType` (position 0) is drawn from the raw AI model outputs, so even if `consensus.agreedPrimaryAttributes.product_type` is corrected post-consensus, the raw AI "Gas" answer can still win.

---

## Work Completed This Session

### 1. BLZSB1 Type=Outdoor + Yes-Burner Fix — ATTEMPTED & REVERTED
**Commit**: `8b3dbee` → **Reverted in**: `8b28cf1`

**What was implemented (then reverted):**

#### A. Cooktop typeSelectionGuide (dual-ai-verification.service.ts)
Added a Cooktop-specific block in the AI prompt's `typeSelectionGuide` section:
- "Outdoor context wins over heat source for outdoor side burners / drop-in burners"
- Example: "Drop-In Single Side Burner" → Type: Outdoor

#### B. RULE 3 in `validateConsensusCategory()` (dual-ai-verification.service.ts)
Hard validation rule for post-AI correction:
```typescript
if (normalizedCategory === 'cooktop') {
  const outdoorBurnerPatterns = [/side.?burner/i, /drop.?in.*burner/i, /outdoor.*burner/i];
  if (isOutdoorBurner && currentType !== 'outdoor') {
    return { isValid: false, correctedCategory: 'Cooktop', correctedType: 'Outdoor', ... };
  }
}
```
Plus fix to propagate `correctedType` to `openaiResult` and `xaiResult` so `determinedType` (position 0) picks it up:
```typescript
openaiResult.primaryAttributes.product_type = validation.correctedType;
xaiResult.primaryAttributes.product_type = validation.correctedType;
```

#### C. Yes-Burner numeric guard (seo-title-generator.service.ts)
Guard for the `{value}-Burner` format in Burner Count title slot:
```typescript
if (slot.attribute === 'Burner Count' && isNaN(Number(String(formattedValue).trim()))) {
  formattedValue = ''; // skip non-numeric values like 'Yes', 'N/A'
}
```

**User reverted this change** — all three fixes are no longer in codebase.

### 2. Root Cause Investigation — Concluded
Confirmed the core issue is `"logic": "Heat source"` in category-type-mapping.json.
The AI treats "Outdoor" as just another candidate in a heat-source-selection task.
Two valid approaches identified (see Next Steps).

---

## Files Modified This Session

| File | Change | Status |
|------|--------|--------|
| `src/services/dual-ai-verification.service.ts` | Cooktop typeSelectionGuide + RULE 3 + propagation fix | **REVERTED** |
| `src/services/seo-title-generator.service.ts` | Yes-Burner numeric guard | **REVERTED** |

---

## Commits This Session

| Hash | Message | Status |
|------|---------|--------|
| `f2ce2bf` | Fix BLZSB1: Fire Pit Accessory → Cooktop | ✅ LIVE |
| `8b3dbee` | Fix BLZSB1: Type=Outdoor + Yes-Burner guard | ↩️ Reverted |
| `8b28cf1` | Revert of 8b3dbee | ✅ LIVE (current) |

---

## Current System State

- **Local commit**: `8b28cf1`
- **GitHub commit**: `8b28cf1`
- **Production commit**: `8b28cf1`
- **Sync status**: ✅ ALL SYNCED
- **Service health**: Running (confirmed after redeploy)

BLZSB1 currently produces:
- Category: Cooktop ✅ (fixed in f2ce2bf)
- Type: Gas ⚠️ (should be Outdoor — fix reverted)
- Title: may include "Yes-Burner" ⚠️ (fix reverted)

---

## Open Issues

### Issue A: BLZSB1 Type = "Outdoor" not selected (OPEN)
- **Root cause**: `"logic": "Heat source"` in category-type-mapping.json — AI picks Gas because BLZSB1 runs on gas
- **Severity**: Medium — filter accuracy issue, not a critical failure
- **Fix reverted** — user wants to approach differently

### Issue B: "Yes-Burner" in titles (OPEN)
- **Root cause**: AI returns `"Yes"` for `number_of_burners` on single-burner products; schema template `{value}-Burner` blindly applied
- **Severity**: Medium — bad title output for Cooktop products with ambiguous burner counts
- **Fix reverted** — needs different approach or re-implementation

---

## Next Steps

Two valid approaches to fix the Cooktop Outdoor type issue:

**Option A — typeSelectionGuide + RULE 3 (what was reverted)**  
Add AI prompt guidance + hard-coded post-AI correction rule. Most targeted.  
The reverted fix was complete and correct (propagation bug was also fixed before revert).  
Can be re-applied if user wants to proceed this way.

**Option B — Change `logic` field in category-type-mapping.json for Cooktop**  
Change from `"Heat source"` to something like `"Heat source; use Outdoor for side burners and drop-in outdoor burners"`.  
Simpler — one JSON edit that flows through to all AI prompts automatically.  
Risk: may affect how other tools/audits interpret the logic field.

**Option C — Add `type_hint` field to the product-specific matching logic**  
Using brand/model-specific rules (e.g., if model contains "BLZSB" → force Outdoor).  
Most surgical but also most fragile.

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `src/config/salesforce-picklists/category-type-mapping.json` | Cooktop type definitions, `logic` field |
| `src/services/dual-ai-verification.service.ts` | `validateConsensusCategory()`, `typeSelectionGuide`, `typeCandidates` priority |
| `src/services/seo-title-generator.service.ts` | `{value}-Burner` format application for Burner Count slot |
| `src/config/salesforce-picklists/categories.json` | Category picklist |
