# Session Summary — April 22, 2026 (EDT)
## Dryer Type Classification: Two Cascading Fixes (Unitized → Top Load → Front Load)

**Session window**: ~5:25 AM – 9:00 AM EDT (April 22, 2026)
**Final production commit**: `bfe0cd7`
**Sync status**: ✅ LOCAL = GITHUB = PROD = `bfe0cd7`

---

## Context / Why

User flagged a categorization bug: "These appear to be a standard front load dryer but it has been classified as a unitized unit. why?" — provided 6 standalone dryer SKUs (Samsung, LG, Whirlpool) all wrongly classified as `Type=Unitized` despite being category `Dryer`.

Investigation revealed this was a **regression** introduced by commit `4dace16` (March 21, 2026 — "Add washer/dryer type clarifications to prevent attribute confusion"). Side-by-side history showed multiple SKUs were correctly `Front Load` on March 2 but had become `Unitized` by March 21.

After fixing Unitized, a second-order bug appeared: 4 of 6 dryers came back as `Top Load` instead of `Front Load` due to retail merchandising strings polluting the AI input.

---

## Architecture Context

The AI type-selection prompt is built dynamically per category in `src/services/dual-ai-verification.service.ts` (lines 5086-5128 area). For dryers/washers, it appends a `typeSelectionGuide` text block telling OpenAI + xAI which Salesforce picklist values are valid `Type` choices and how to interpret raw input data (titles, descriptions, dimensions, retail categories).

**Data flow**:
1. SF sends `rawPayload` (Documents, Title_Legacy, Title_Web_Retailer, Web_Retailer_SubCategory, dimensions, etc.)
2. Pipeline assembles category-specific guidance into `typeSelectionGuide`
3. OpenAI + xAI receive prompt → return classifications
4. `type-matcher.service.ts` normalizes AI output to picklist values via TYPE_ALIASES + regex
5. Result written to `verification_jobs.result.Primary_Attributes.AI_Type` and webhooked to Salesforce

**Two surfaces of failure** addressed this session:
- **Prompt-level**: vague keyword triggers (`"Stacked"`) created false positives for `Unitized`
- **Input-level**: SF data contained merchandising terms (`"TOP LOAD MATCHING DRYER"`) that AI interpreted literally

---

## Detailed Work Completed

### Fix #1 — Remove "Stacked" trigger (commit `b715e3e`)

**Problem**: Prompt line at `dual-ai-verification.service.ts:5097` listed:
```
"Unitized" / "Laundry Center" / "Stacked" / "All-in-One" → Unitized
```
Manufacturer specs commonly say "stackable" or "stack-ready" as a feature. AI matched these strings to `"Stacked"` → output `Unitized`.

**Before**:
```typescript
typeSelectionGuide += `       - "Unitized" / "Laundry Center" / "Stacked" / "All-in-One" → Unitized\n`;
```

**After** (replaced 13-line block with 27-line block):
- Removed `"Stacked"` from Unitized triggers
- Added explicit **UNITIZED RULE** block: `Unitized` requires ONE physical unit containing BOTH washer AND dryer
- Added category guard: standalone dryers → almost certainly Front Load or Top Load, NOT Unitized
- Added explicit anti-pattern: `"Stacked" / "Stack" → DO NOT trigger Unitized`
- Added concrete example: `"7.4 cu. ft. Stackable Smart Gas Dryer" → Front Load`

### Fix #2 — Decode "TOP LOAD MATCHING" merchandising strings (commit `bfe0cd7`)

**Problem**: After Fix #1, dryers were no longer Unitized, but 4/6 became `Top Load`. Investigation found Salesforce's `Web_Retailer_SubCategory` field carried strings like:
- `LAUNDRY | TOP LOAD MATCHING GAS DRYER`

This is **retail merchandising** — it means a Front Load dryer styled to *visually pair with* a Top Load washer. AI parsed "TOP LOAD" literally.

**Evidence (09:34 UTC batch)**:

| Model | `Web_Retailer_SubCategory` | Title_Legacy | AI Result |
|---|---|---|---|
| DVG52A5500V | TOP LOAD MATCHING GAS DRYER | "Top Load Gas Dryer" | Top Load ❌ |
| DLGX8901B | TOP LOAD MATCHING GAS DRYER | "Unitized" | Top Load ❌ |
| WGD560LHW | FRONT LOAD GAS DRYER | "Unitized" | Top Load ❌ (extra weird) |
| DVG55CG7100W | TOP LOAD MATCHING GAS DRYER | "Top Load Gas Dryer" | Top Load ❌ |
| DLGX6701B | FRONT LOAD GAS DRYER | "Unitized" | Front Load ✅ |
| DVE45T6020WA | (no web data) | clean | Front Load ✅ |

**Fix**: Added ~30 lines to `typeSelectionGuide` for dryers/washers:
- New **CRITICAL — RETAIL "MATCHING" CATEGORIES ARE NOT TYPES** block decoding `"TOP LOAD MATCHING DRYER"` → Front Load
- New **DRYER LOADING CONFIG REALITY** block (category-conditional):
  - "Nearly all modern standalone dryers are physically Front Load (door on front)"
  - "`Top Load` Type for dryers is RARE — only legacy/portable/compact units"
  - Standard 27" wide × 38-46" tall × 30-32" deep → Front Load
  - DO NOT pick Top Load just because it pairs with a top-load washer set
  - DO NOT pick Top Load just because a previous title incorrectly said Top Load
  - Default to Front Load for dryers when unclear
- Added two new example mappings citing the exact Samsung DVG52A5500V case

### Operational incident — Lost 53 in-flight Range Hood jobs

**What happened**: Service restart at 09:29:29 UTC (after Fix #1 deploy) killed 53 Range Hood verification jobs that arrived seconds earlier (last job ingested 09:29:28 UTC). All sat in `status=processing` for ~2.8 hours with no recovery mechanism.

**Detection**: User flagged "all of these say [Requested]" — investigation showed 53 stuck jobs still in `processing` state.

**Recovery**: Wrote `scripts/replay-stuck-recovery.js`:
1. Marked all 53 stuck jobs as `failed` with reason note (audit trail preserved)
2. Replayed each `rawPayload` through `POST /api/verify/salesforce` with concurrency=3, 500ms inter-call delay
3. All 53 returned HTTP 202 (accepted)
4. All completed before second restart at 12:43:11 UTC — **no jobs killed by Fix #2 deploy**

**Lesson**: Service restarts during active processing windows kill in-flight work. Should ideally drain queue before restart or use rolling deploy.

---

## Files Modified

| File | What Changed |
|---|---|
| `src/services/dual-ai-verification.service.ts` | Two consecutive prompt updates for dryer/washer Type guidance — removed `"Stacked"` Unitized trigger, added UNITIZED RULE block, added RETAIL MATCHING decoder, added DRYER LOADING REALITY block, added 2 new example mappings |
| `scripts/replay-stuck-recovery.js` (new on prod, not in repo yet) | One-off recovery script: marks stuck jobs as failed, replays `rawPayload` via API |

---

## Commits (this session)

| Hash | Message |
|---|---|
| `b715e3e` | Fix: Remove Stacked trigger word causing Front Load dryers to be misclassified as Unitized |
| `bfe0cd7` | fix(ai-prompt): decode 'TOP LOAD MATCHING' as Front Load dryer; standalone dryers default to Front Load |

Both committed and pushed to `origin/main` and deployed to production.

---

## Current System State

| Environment | Commit | Health |
|---|---|---|
| LOCAL | `bfe0cd7` | Working tree clean |
| GITHUB | `bfe0cd7` | Pushed |
| PRODUCTION | `bfe0cd7` | ✅ active, restarted 12:43:11 UTC |

- API health: healthy (verified `/health` endpoint)
- Stuck jobs: 0
- Range Hood replay batch: completed successfully
- Service restart count this session: 2 (09:29:29 UTC, 12:43:11 UTC)

---

## Verification Evidence

**Fix #1 verification** (Stacked → Unitized):
- 09:34 UTC batch: 0/6 dryers came back as Unitized (was 6/6 stuck on Unitized before fix)
- DLGX6701B and DVE45T6020WA: now correctly Front Load ✅

**Fix #2 verification**: PENDING — user needs to re-send the 6 dryers after `bfe0cd7` deployed at 12:43:11 UTC. Expected: all 6 → Front Load.

---

## Remaining Warnings / Issues

1. **PENDING**: Re-test 6 dryer SKUs against `bfe0cd7` to confirm all now classify as Front Load
2. **Service-restart-kills-in-flight-jobs**: No graceful drain on restart. Affected 53 Range Hood jobs this session. Consider:
   - Add `processing` → recovery on service start
   - Or implement queue drain before restart
3. **Stale title contamination**: AI sometimes echoes its OWN previous bad title. The Fix #2 prompt explicitly addresses this ("DO NOT pick Top Load just because a previous title incorrectly said Top Load — re-evaluate from raw data") but worth monitoring
4. **One-off recovery script** `scripts/replay-stuck-recovery.js` was written directly on production via SSH; should be added to repo as a proper utility for future incidents
5. **Carry-over from prior session** (still open):
   - SMEG SFU4104MCS re-test pending validation post-`0564955`
   - AJ Madison web scraper failures
   - xAI grok-3 image input rejection (needs vision model)
   - 74 pending picklist syncs awaiting review (CRITICAL — 314 custom fields at risk)
   - 10 pending creation requests in SF (some 53 days old)

---

## Next Steps

1. **User re-sends 6 dryers** (DVG52A5500V, DLGX8901B, WGD560LHW, DVG55CG7100W, DLGX6701B, DVE45T6020WA) — confirm all → Front Load
2. Add `scripts/replay-stuck-recovery.js` to repo as a proper recovery utility (with safety prompts, dry-run mode)
3. Consider adding stuck-job auto-recovery on service start (detect `processing` jobs older than N minutes, requeue or fail with clear reason)
4. Address the 74 pending picklist syncs (CRITICAL severity from prior sessions)
5. Update `docs/AUDIT-FINDINGS-AND-SOLUTIONS.md` with two new findings:
   - Finding #049: `"Stacked"` keyword triggered Unitized misclassification
   - Finding #050: `"TOP LOAD MATCHING"` retail merchandising string parsed as loading config

---

## Key Reference Files

| File | Purpose |
|---|---|
| `src/services/dual-ai-verification.service.ts` (lines ~5086-5160) | Dryer/washer AI type-selection prompt — both fixes applied here |
| `src/services/type-matcher.service.ts` | Picklist normalization layer (TYPE_ALIASES + regex patterns) |
| `src/config/salesforce-picklists/category-type-mapping.json` (lines 567-602) | Valid Dryer types: Front Load, Top Load, Unitized, Accessory |
| `scripts/replay-stuck-recovery.js` (prod only) | One-off recovery for service-restart-killed jobs |
| `scripts/clear-stuck-jobs.js` (existing) | Marks stuck jobs as completed without replay (NOT what we needed) |
| MongoDB `verification_jobs` collection | `result.Primary_Attributes.AI_Type`, `rawPayload.*`, `sfCatalogName`, `status`, `createdAt` |
