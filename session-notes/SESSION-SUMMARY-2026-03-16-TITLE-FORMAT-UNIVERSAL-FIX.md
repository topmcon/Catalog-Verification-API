# Session Summary — 2026-03-16 — Title Formatting Universal Fix & Medicine Cabinet Enhancement

## Context / Why

After deploying the Mirror→Bathroom Mirror reclassification fix (commit `a4fcb45`), user re-ran 15 mirror products through the API. 12/15 were correctly reclassified, but 6 title formatting issues emerged across the results. This session investigated and fixed all 6 issues through 4 commits, culminating in a **universal rule**: the schema-generated title is ALWAYS used, never Claude's rewritten title.

### Products That Revealed Issues
- **AM3036P-CH** — "Wall Mirror Bathroom Mirror" redundancy in title (Claude rewrite)
- **ET2** — Missing dimensions despite schema including Width×Height
- **868M22XWHZ** — Trailing "X" in title (Claude rewrite artifact)
- **MC1640D4FPRE4** — Type=Frameless but title said "Framed" (old Claude rewrite)
- **MC2040D4FPLE4** — Type=Frameless but title said "Lighted" (old Claude rewrite)
- **Multiple mirrors** — Fractional/decimal dimensions not rounded in title output

---

## Architecture Context

### Title Pipeline (Before This Session)
```
seoTitleInput (AI + raw data) → finalSeoTitleInput (+ Claude corrections) →
generateSEOTitle() → toTitleCase() → enforceModelAtEnd() →
IF Claude corrected title: use Claude's title string
ELSE: use schema-generated title
```

### Title Pipeline (After This Session)
```
seoTitleInput (AI + raw data) → finalSeoTitleInput (+ Claude corrections) →
Category post-processing (Medicine Cabinet: Installation Type + Lighted) →
generateSEOTitle() → toTitleCase() → roundDimensionsInTitle() →
length check → enforceModelAtEnd() →
ALWAYS: use schema-generated title (never Claude's title string)
```

**Key change**: Claude's field corrections still flow through `finalSeoTitleInput` (so schema uses corrected values), but Claude never rewrites the full title string. This prevents ALL categories from having title formatting rules bypassed.

---

## Detailed Work Completed

### Commit 1: `196aa08` — Bathroom Mirror merge fix, dimension handler, rounding

**Fix 1 — Bathroom Mirror merge logic** (`seo-title-generator.service.ts` ~line 932):
```typescript
// BEFORE: Exact string match to find Type in parts array
parts.findIndex(p => p.toLowerCase() === (input.type || '').toLowerCase())

// AFTER: Loose .includes('mirror') to detect mirror-related parts for merging
parts.findIndex(p => p.toLowerCase().includes('mirror'))
// With fallback: if no mirror part found, push full category instead of merging
```
This fixed "Wall Mirror Bathroom Mirror" redundancy — the merge now correctly identifies the Type part to replace.

**Fix 2 — Composite dimension handler unreachable** (`seo-title-generator.service.ts` `formatValue()`):
```typescript
// BEFORE: Dimensions (W×H) handler was AFTER the undefined check
if (value === undefined) return '';  // ← This fires first for composite attributes
// ... later: Dimensions (W×H) handler ← NEVER REACHED

// AFTER: Composite handlers moved BEFORE undefined check
if (attributeName === 'Dimensions (W×H)' || attributeName === 'Width×Height') {
  // Compose from width + height fields → "24×30" format
  // This runs BEFORE any undefined check
}
```

**Fix 3 — Width×Height in ATTRIBUTE_TO_FIELD** (`seo-title-generator.service.ts` line 138):
Added `'Width×Height': 'dimensionsWxH'` mapping for Medicine Cabinet schema.

**Fix 4 — `roundDimensionsInTitle()` post-processor** (`seo-title-generator.service.ts` lines 389-418):
```typescript
// Rounds fraction notation: "15-1/2" → "16", "23-3/4" → "24"
// Rounds decimals near ×: "23.5×29.5" → "24×30"
// Rounds decimals before -Inch: "23.5-Inch" → "24-Inch"
// Applied AFTER toTitleCase(), BEFORE length check
// ONLY affects title string — does NOT modify verified data fields
```

### Commit 2: `fab2b00` — Per-category mirror title override (superseded)

Added per-category override for mirror categories (same pattern as existing sink override from Finding #035). This was a stepping stone — investigated production logs showing Claude was rewriting ALL titles, not just failing ones. **Superseded by commit `4730d9c`.**

### Commit 3: `4730d9c` — Universal schema title (THE KEY FIX)

**Root cause discovery**: Queried production logs for 7 mirror products. Found that `generateSEOTitle()` was producing correct titles for ALL of them, but Claude's Final Review was rewriting the title string, re-introducing bugs.

Example — AM3036P-CH:
- Schema generated: `"CRAFT + MAIN Rectangular Bathroom Wall Mirror Chrome AM3036P-CH"` ✅
- Claude rewrote to: `"CRAFT + MAIN 30×36 Rectangular Wall Mirror Bathroom Mirror Chrome AM3036P-CH"` ❌

**Fix**: Replaced branching logic with universal rule:
```typescript
// BEFORE (3 paths):
if (!titleWasCorrectedByClaude) { use schema title }
else if (category is sink) { use schema title }  // Finding #035
else { use Claude's title }

// AFTER (1 path):
sanitizedPrimaryAttributes.AI_Product_Title = finalSeoTitle;  // ALWAYS schema
```

Net -22 lines of code. Claude's field corrections still flow through `finalSeoTitleInput` → schema uses corrected Brand, Type, Finish, etc. But Claude never rewrites the formatted title string itself.

**Impact**: Fixes ALL categories universally. Removed the per-category sink override (Finding #035) and mirror override (commit `fab2b00`) as both are now redundant.

### Commit 4: `e78781f` — Medicine Cabinet: Installation Type + Lighted detection

User asked "what else from our findings do we need to correct?" — investigated MC1640D4FPRE4 and MC2040D4FPLE4.

**Fix 1 — Installation Type slot** (`title-schema-by-category.ts`):
```typescript
// Medicine Cabinet template BEFORE:
'{Brand} {Width×Height} {Type} {Category} {Finish} {Model Number}'

// AFTER:
'{Brand} {Width×Height} {Installation Type} {Type} {Category} {Finish} {Model Number}'
```

**Fix 2 — Medicine Cabinet post-processing** (`dual-ai-verification.service.ts`):
```typescript
// Installation Type normalization:
// "Recessed, Surface" → "Recessed" (take first value)
// "Surface" → "Surface Mount" (normalize)

// Lighted detection from source data:
// Regex: /lighted|interior light|led light|nightlight|light.*defogger|illuminat/i
// Searches: deptTitles + deptFeatures + Ferguson specs
// If found: prepends "Lighted" to Type (e.g., "Frameless" → "Lighted Frameless")
```

---

## Files Modified

| File | Commit | Changes |
|------|--------|---------|
| `src/services/seo-title-generator.service.ts` | `196aa08` | Bathroom Mirror merge (.includes), dimension handler position, Width×Height mapping, `roundDimensionsInTitle()` |
| `src/services/dual-ai-verification.service.ts` | `fab2b00` | Per-category mirror title override (superseded) |
| `src/services/dual-ai-verification.service.ts` | `4730d9c` | Universal schema title — always use `finalSeoTitle`, removed sink/mirror overrides |
| `src/services/dual-ai-verification.service.ts` | `e78781f` | Medicine Cabinet Installation Type normalization + Lighted detection |
| `src/config/title-schema-by-category.ts` | `e78781f` | Medicine Cabinet schema: added Installation Type slot |

---

## Commits

| Commit | Message |
|--------|---------|
| `196aa08` | Fix title generation: Bathroom Mirror redundancy, dimension rounding, Width×Height gap |
| `fab2b00` | Override Claude title for mirror categories (prevents Wall Mirror Bathroom Mirror redundancy) |
| `4730d9c` | Universal: always use schema-generated title, never Claude's title rewrite |
| `e78781f` | Medicine Cabinet: add Installation Type + Lighted detection to title schema |

---

## Current System State

- **Local**: `e78781f` ✅
- **GitHub**: `e78781f` ✅
- **Production**: `e78781f` ✅
- **All Synced**: ✅
- **Service Health**: Healthy
- **Pre-deploy Validation**: 7/7 passed

---

## Data Priority Chain Confirmed

User asked about field population priority for title inputs. Confirmed the chain:

| Priority | Source |
|----------|--------|
| 1 (Highest) | AI Consensus (both AIs agree) |
| 2 | Individual AI (higher confidence wins; validation-first for finish/installation) |
| 3 | Raw text extraction via regex (titles → descriptions → features) |
| 4 | Structured fields (Ferguson_Width, Ferguson_Finish, etc.) |
| 5 | Legacy fields (Width_Legacy, Height_Legacy) |
| 6 (Overlay) | Claude's Final Review corrections (finalSeoTitleInput overrides seoTitleInput) |

**Department-aware ordering**: For non-Appliance depts, Ferguson data comes first; for Appliances, Web Retailer comes first.

---

## All Findings Resolved This Session

| # | Issue | Root Cause | Fix |
|---|-------|------------|-----|
| 1 | "Wall Mirror Bathroom Mirror" redundancy | Exact string match in merge logic + Claude title rewrite | `.includes('mirror')` + universal schema title |
| 2 | MC1640D4FPRE4 "Framed" in title (Type=Frameless) | Claude's old title rewrite overriding schema | Universal schema title prevents this |
| 3 | MC2040D4FPLE4 "Lighted" in title (Type=Frameless) | Claude's old title rewrite overriding schema | Universal schema title prevents this |
| 4 | ET2 missing dimensions | Composite dimension handler below undefined check | Handler moved before undefined check |
| 5 | 868M22XWHZ trailing "X" in title | Claude title rewrite artifact | Universal schema title prevents this |
| 6 | Fractional/decimal dimensions unrounded | No rounding in title pipeline | `roundDimensionsInTitle()` post-processor |
| 7 | Medicine Cabinet missing Installation Type | Not in schema | Added slot + normalization |
| 8 | Medicine Cabinet missing Lighted indicator | Not detected from source data | Added lighted regex detection |

---

## Remaining Issues / Observations

1. **No outstanding code issues** — All 7/7 pre-deploy validation checks pass
2. **Products need re-verification** — The fixes only apply to NEW verifications; affected products need re-processing from Salesforce
3. **Monitor Medicine Cabinet results** — Installation Type + Lighted detection is new logic; watch for edge cases in initial production usage

---

## Next Steps

1. **Re-verify test products** — Send the 15 mirror products through again to confirm all title formatting is now correct
2. **Run API Accuracy Report** — Check overall title quality after new verifications flow through
3. **Monitor Medicine Cabinet** — Watch for Installation Type and Lighted detection accuracy
4. **Consider expanding lighted detection** — May want to extend to other categories (Bathroom Mirror already has lighted type handling)

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `src/services/dual-ai-verification.service.ts` | Main verification service — universal title logic, Medicine Cabinet post-processing |
| `src/services/seo-title-generator.service.ts` | Title generation — merge logic, formatValue, roundDimensionsInTitle |
| `src/config/title-schema-by-category.ts` | Category title templates (Medicine Cabinet, Bathroom Mirror, etc.) |
| `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` | Institutional knowledge — Findings #042-#045 added this session |
| `session-notes/SESSION-SUMMARY-2026-03-16-MIRROR-CATEGORY-TITLE-FIXES.md` | Earlier session — Mirror→Bathroom Mirror reclassification (commit `a4fcb45`) |
