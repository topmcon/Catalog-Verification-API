# Session Summary — 2026-04-30

## Findings #053, #054, #055 — Defense-in-Depth Hardening + System Alignment Audit

---

## 1. Context / Why

This session began as a follow-up to the **Monogram ZIWD24PWII wine cooler bug** (Findings #051, #052 from prior session) where the system mis-titled a wine cooler as a refrigerator. The earlier fixes addressed the **consensus** layer (#051) and the **title-generator slot** layer (#052), but did not yet address two remaining attack surfaces:

1. **The data layer** — extractors were still pulling stale tokens (e.g., "Refrigerator") from raw text and overriding AI-correct sub-product types.
2. **The post-render layer** — there was no validator confirming the final rendered title actually conformed to the schema's required slots and was free of cross-category contamination.

User then asked the broader question: **"is everything aligned correctly — every category, type, style?"** — which triggered a comprehensive cross-system alignment audit and surfaced a **silent department-correction bug** affecting every verification call.

---

## 2. Architecture Context

### Verification pipeline (relevant layers, top-to-bottom)
1. **Raw input** (Salesforce payload, scraped vendor text)
2. **Extractors** (regex/keyword pulls from text — `extractConfiguration`, `extractFinish`, etc.)
3. **AI proposals** (Claude/GPT propose Type, Style, Configuration, etc.)
4. **Consensus layer** (`mergeWithConsensus`) — picks AI vs. legacy field-by-field
5. **Title generator** (`generateTitleFromSchema`) — fills slots from schema-by-category
6. **Post-validation** (`performAutomatedValidation`) — runs CHECKS 1-4 over final output

### Source-of-truth picklists (`src/config/salesforce-picklists/*.json`)
- `categories.json` (160 entries)
- `types.json` (699 entries with `category_usage` references)
- `styles.json` (40 entries)
- `departments.json` (8 entries) ← **incomplete vs. real categories**
- `families.json` (8 entries) ← **incomplete vs. real categories**
- `category-type-mapping.json` (nested `{metadata, mappings:[...]}`)
- `category-style-mapping.json` (nested `{metadata, universal_styles, category_specific_mappings:[...]}`)

### Code-side helpers (canonical)
- `src/config/category-config.ts` line 407: `getDepartmentForCategory(category)` — picklist-derived
- Loaded once at startup from `categories.json`

---

## 3. Detailed Work Completed

### Finding #053 — Type-aware extractor suppression (data layer)
**Commit**: `d55f9ab`
**File**: `src/services/dual-ai-verification.service.ts`

- Added `DISTINCT_SUB_PRODUCT_TYPES` Set (Wine Cooler, Beverage Center, Kegerator, Ice Maker, Built-In Microwave, Drawer Microwave, Warming Drawer, Steam Oven, Wall Oven, Cooktop, Range Hood, etc.).
- Added `isDistinctSubProduct(type)` predicate.
- Added `safeExtractConfiguration(rawText, aiType)` wrapper — **suppresses** the regex extractor whenever AI has already classified the item as a distinct sub-product.

**Before**: Extractor pulled "Refrigerator" from vendor text → overrode AI's "Wine Cooler" → wrong title.
**After**: Extractor returns `null` whenever AI's type is in the distinct set → AI's correct value preserved.

---

### Finding #054 — Real title schema conformance validator (post-render layer)
**Commit**: `2d1b69e`
**File**: `src/services/dual-ai-verification.service.ts` → `performAutomatedValidation()` CHECK 4

**Before**: CHECK 4 was **dead code** — looked for `slot.priority === 'critical'` and `slot.source` which don't exist on schemas (real fields are `slot.required` and `slot.attribute`). Silent no-op since the day it was written.

**After**: CHECK 4 rewritten with three real validations:
- **(a) Required-slot presence** — every `slot.required === true` slot must produce a non-empty token in the rendered title
- **(b) Anti-contamination** — for distinct sub-products, the title must not contain forbidden tokens of the parent category (e.g., a Wine Cooler title cannot contain the word "Refrigerator"); also blocks bare-category contamination (title ≠ just the category name)
- **(c) Category presence** — title must include at least one keyword from the resolved category

Each failure pushes a structured issue into the validation report with severity tagging.

---

### Finding #055 — Replace stale hardcoded department/keyword maps (THIS SESSION'S BIGGEST FIX)
**Commit**: `e724d94`
**Files**: `src/services/dual-ai-verification.service.ts`, `scripts/audit-system-alignment.js` (NEW)

**Discovery during alignment audit**:
- `categoryDepartmentMap` (30 hardcoded entries) had **stale department names** that contradicted the picklist source-of-truth:
  - Code said: `"Faucet" → "Plumbing"` | Picklist canonical: `"Plumbing & Bath"`
  - Code said: `"Lighting" → "Lighting"` | Picklist canonical: `"Lighting & Electrical"`
- Result: every verification was emitting **wrong** "fix department from 'Plumbing & Bath' to 'Plumbing'" corrections.
- Effectively a silent regression — no error, just bad data flowing back to Salesforce.

**Fix**:
- **Removed** entire 30-entry hardcoded `categoryDepartmentMap`.
- **CHECK 2 (Department-Category Alignment)** now calls `getDepartmentForCategory(category)` from `category-config.ts` (already picklist-derived).
- Initially added a duplicate function — caused TS2440 import collision; removed and used existing import.

**`categoryKeywords` map cleanup**:
- **Removed 7 dead entries** referencing categories that **don't exist** in `categories.json`:
  - `'Faucet'`, `'Sink'`, `'Door Handle'`, `'Hinge'` (too generic — never real category names)
  - `'Tub Faucet'`, `'Bidet Faucet'`, `'Food Service Faucet'` (canonical names are `'Tub Filler'`, `'Bidet'`, no food-service equivalent)
- **Added 30+ canonical entries**: `'Bathroom Faucet'`, `'Kitchen Faucet'`, `'Bar Faucet'`, `'Pot Filler Faucet'`, `'Tub Filler'`, `'Outdoor Shower Faucet'`, `'Steam Shower'`, `'Toilet Seat'`, `'Bidet'`, `'Bidet Seat'`, `'Urinal'`, `'Bathtub'`, `'Bathroom Sink'`, `'Kitchen Sink'`, `'Bar & Prep Sink'`, `'Bathroom Vanity'`, `'Bathroom Mirror'`, `'Medicine Cabinet'`, `'Washer'`, `'Dryer'`, `'Freezer'`, `'Icemaker'`, `'Bathroom Lighting'`, `'Vanity Lighting'`, `'Recessed Lighting'`, `'Cabinet Hardware'`, `'Door Knob'`, `'Door Lever'`, `'Door Hinge'`, `'Cabinet Hinge'`.

---

### NEW: System Alignment Audit Script
**File**: `scripts/audit-system-alignment.js` (348 lines, NEW)

11 cross-system alignment checks:

| ID | Check | Severity |
|----|-------|----------|
| A1 | categories.json `department` values exist in departments.json | CRITICAL |
| A2 | categories.json `family` values exist in families.json | CRITICAL |
| A3 | families.json `department` values exist in departments.json | CRITICAL |
| B1 | types.json `category_usage` values exist in categories.json | HIGH |
| C1/C2 | category-type-mapping keys/types reference real categories/types | HIGH |
| D1/D2 | category-style-mapping keys/styles reference real categories/styles | HIGH |
| E1 | title-schema-by-category `categoryName` values exist in categories.json | HIGH |
| F1/F2 | hardcoded `categoryKeywords` covers critical categories + uses canonical names | MEDIUM |
| G1-G3 | hardcoded `categoryDepartmentMap` integrity (now reports 0 since map removed) | MEDIUM |
| H1 | Coverage warnings (categories with no entry in mapping) | INFO |
| I1 | Distinct sub-products missing schemas | INFO |

**Audit progression** this session:
- Initial run: 4 CRITICAL / 5 HIGH / 3 MEDIUM
- After Finding #055: **3 CRITICAL / 4 HIGH / 0 MEDIUM**
- All 3 remaining CRITICAL are **Salesforce picklist data drift** (not code bugs) — see Phase 2 plan below.

---

## 4. Files Modified

| File | Change |
|------|--------|
| `src/services/dual-ai-verification.service.ts` | #053 extractor suppression + #054 real CHECK 4 + #055 hardcoded map removal + canonical keywords |
| `scripts/audit-system-alignment.js` | **NEW** — 11-check cross-system alignment audit |

---

## 5. Commits This Session

| Hash | Finding | Title |
|------|---------|-------|
| `d55f9ab` | #053 | Type-aware extractor suppression for distinct sub-products |
| `2d1b69e` | #054 | Real title schema conformance validator (replaces dead code) |
| `e724d94` | #055 | Replace stale hardcoded department/keyword maps with picklist-derived lookup |

---

## 6. Current System State

| Environment | Commit |
|-------------|--------|
| Local       | `e724d94` |
| GitHub      | `e724d94` |
| Production  | `e724d94` |

- ✅ All 3 environments synced
- ✅ Production health: `{"status":"healthy"}`
- ✅ Pre-deploy validator: 9/9 checks passed
- ✅ Service active on `verify.cxc-ai.com`

---

## 7. Remaining Issues (Phase 2+ Plan)

The audit surfaced **Salesforce picklist data drift** that requires data-team coordination, NOT code fixes. Broken into bite-size phases:

| Phase | Scope | Risk | Effort | Type |
|-------|-------|------|--------|------|
| **2a** | Add `Industrial & Commercial` to `departments.json` (5 categories reference it) | Low | Small | SF data |
| **2b** | Add `Indoor Lighting`, `Plumbing & Bath` to `families.json` (7 categories reference them) | Low | Small | SF data |
| **2c** | Fix orphan `General → Electronics` in `families.json` | Low | Small | SF data |
| **3a** | Resolve 11 types with stale `category_usage` (plurals/old names) | Med | Med | SF data |
| **3b** | Resolve 7 categories referenced in code/schemas but missing from `categories.json`: `Drainage & Waste`, `Bidet Faucet`, `Food Service Faucet`, `Hot & Cold Water Dispenser`, `Backsplash Kitchen Tile`, `Kitchen Sink Combo`, `Bathroom Lighting (Bathroom)` — decide: remove from code OR add to picklist | Med | Med | Code + SF |
| **4** | Wire `audit-system-alignment.js` into `pre-deploy-validate-all.sh` as Check #10 (auto-block future drift) | Low | Small | Infra |

**Recommended order**: 4 (lock in protection) → 2a/2b/2c (low-risk data adds) → 3b (code cleanup) → 3a (SF coordination).

---

## 8. Next Steps

1. **User decision required**: Pick next phase from the table above (recommend Phase 4 first to prevent regression)
2. The `categoryKeywords` map's "missing canonical" warnings (F1) should resolve naturally as Phase 3b is addressed
3. Audit script can be re-run anytime: `node scripts/audit-system-alignment.js`

---

## 9. Key Reference Files

| File | Purpose |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | Verification orchestration, post-validation CHECKs 1-4 |
| `src/config/category-config.ts` | Picklist-derived `getDepartmentForCategory()` (line 407) |
| `src/config/salesforce-picklists/*.json` | Source-of-truth picklists (5 files) |
| `scripts/audit-system-alignment.js` | **NEW** 11-check cross-system audit |
| `scripts/pre-deploy-validate-all.sh` | 9-check pre-deploy validator (passing) |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` | Findings registry (#053, #054, #055 to be added) |

---

## 10. Lessons Learned

1. **Hardcoded validation maps drift silently.** No error, no warning — they just emit wrong corrections forever. Picklist-derived lookups via existing helpers eliminate this entire class of bug.
2. **Dead code in validators is worse than no validator** — it gives false confidence. CHECK 4 looked authoritative but was a no-op for years.
3. **Phase work to avoid token-budget exhaustion.** This session went deep on multiple fixes; user explicitly requested phasing for future sessions.
4. **Two distinct bug categories surfaced**: code-side drift (fixable now, did) vs. data-side drift (requires SF coordination, deferred). Treating them separately keeps each phase small.
