# Golden Set — Review Workflow

**What this is**: 49 stratified SKUs that will become the platform's permanent ground truth and
regression gate (PLATFORM-AUDIT-GUIDE §5). Selected 2026-06-09 from Phase 1 strata: the #078 product
set, finish==color hits, junk colors, title duplication, model mismatches, dimension gaps, panel-ready,
Canadian, legacy-era, all 4 data-source scenarios, and clean passthrough cases (T2).

**Files**
- `payloads/<SKU>.json` — the full stored inbound payload + the current pipeline output (7 fields) +
  strata tags. This is the evidence to judge against. Nothing here is ground truth.
- `golden-answers.draft.json` — ⚠️ **DRAFT**. Pre-filled from the current pipeline output, which Phase 1
  proved is often wrong (finish==color on 39.7% of corpus, style defaulted on 70%). It exists only to
  speed up review.

**How to review (per SKU, per field)**
1. Open the SKU's payload file; read Web Retailer / Ferguson / Legacy / Specification_Table evidence.
2. For each of the 7 fields set:
   - `correct`: the value the evidence supports (`""` if the evidence supports empty, e.g. no finish stated)
   - `evidence`: a short verbatim quote from the payload that proves it
   - `ambiguous: true` + a note when the sources genuinely conflict (e.g. sibling-SKU spec tables) —
     ambiguous fields are excluded from hard pass/fail in the harness
   - `status`: `"reviewed"`
3. Set `failure_class` when the current output is wrong: 1 = pipeline bug, 2 = bad/ambiguous source data,
   3 = not applicable here (auditor strictness is judged in calibration, not in golden answers).
4. Save as `golden-answers.json` (drop `.draft`) once every entry is reviewed. Partial review is fine —
   the harness only trusts `status: "reviewed"` entries.

**Review rules (from the #078 lessons)**
- A finish is a surface treatment (Brushed, Matte, Polished). "White" is a color. No finish stated → `""`.
- "Panel Ready" is a color/config, never a finish.
- The SF catalog name is the authoritative SKU; spec tables may describe sibling variants.
- Style: if no marketing style is stated anywhere, the honest golden answer is `""` (do not accept the
  pipeline's "Contemporary" default).
- Titles: judge content (brand, type, true dimension, color, model), not formatting taste.

**After sign-off**: the harness (`scripts/golden-harness/`, to be built) replays these payloads through
the pipeline's deterministic functions and diffs against `golden-answers.json`. Every Class-1 fix must
pass it before deploy (gate G3).
