# Platform Audit — Phase 1 Results (Corpus-Wide Deterministic Scans)

**Run date**: 2026-06-09 (US Eastern) · **Read-only** · AI cost: $0
**Corpus**: 19,113 completed jobs (2026-01-26 → 2026-06-09) · eras: 14,943 `AI_*` (current schema, Feb 5→) / 3,824 `*_Verified` (legacy, Jan 26–Feb 11) / 346 unknown
**Scanners**: `scripts/platform-audit/` (scan-accuracy, scan-gaps, scan-waste on prod; scan-config-coverage local) · raw JSON in this directory
**Method**: docs/PLATFORM-AUDIT-GUIDE.md §6.1 — L1 deterministic only; class labels below are *candidates* pending Phase 4 classification.

---

## Headline findings (by measured impact)

| # | Check | Finding | Quantified impact | Candidate class |
|---|-------|---------|-------------------|-----------------|
| 1 | WST-04 | **Duplicate verifications dominate all AI spend.** 2,091 catalog IDs verified 2+ times; 16,214 excess runs. Top: CVE28DP3NHD1 ×35, GYE22GYNFS ×35, C3SSD ×34 | **≈$820 of $967.54 total spend (85%)** | O (process) — needs cause split: SF re-sends vs our re-queues vs intentional re-verifies |
| 2 | ACC-01 | **Title length rule broadly violated.** p10=42, p50=64, p90=87, min=2, max=198 (target 60–80) | **10,616 jobs (56.6%)** | 1 (pipeline) + decide if 60–80 is still the real requirement |
| 3 | ACC-12 | **Style is defaulted, not extracted.** "Contemporary" 49.4% + "Modern" 20.9% = 70% of corpus; Laundry Pedestal 100% Contemporary, Washer 81.5%, Icemaker 80.4%. Echoes audit-mode finding (Style ~always UNSUPPORTED) | **9,263 jobs Contemporary** | 1/3 — pipeline invents style; audit flags it; needs a policy decision |
| 4 | ACC-05 | **Finish duplicates color** (the #078 Bug-C class, at scale). Top: Range Hood 1,283, Refrigerator 1,196, Dishwasher 516 | **7,458 jobs (39.7%)** | 1 (pipeline) — post-#078 guard only ships Jun 8; corpus is pre-fix |
| 5 | WST-03 | **Claude Phase B title corrections are computed then discarded** ("using schema-generated version") | **2,818 occurrences** (log) | 1 — known issue, now quantified |
| 6 | WST-02/07 | **Research efficacy is unmeasurable**: `fieldsCaptured=0` on 100% of web-search calls (33,393, $60.18) AND 100% of image-vision calls (12,303, $47.55). Cannot tell if $108 of research spend contributes anything | **$107.73 unmeasured** | O (instrumentation gap) |
| 7 | ACC-07a | Output category not in current picklist — 2,190 jobs (11.7%); **sampled examples are 100% legacy-era** ("Bathtubs", "Shower Faucet", "Kitchen Faucets" — old plural/variant names) | 2,190 jobs; AI-era share TBD | 2 (era/picklist drift) — era split required before any code action |
| 8 | ACC-11 | Repeated token in title, e.g. "WAC Lighting Esprit … by Wac Lighting" | **2,108 jobs (11.2%)** | 1 (title slot duplication) |
| 9 | ACC-04 | Finish = plain color / config descriptor ("White", "Panel Ready") | **1,692 jobs (9.0%)** | 1 — pre-#078-fix corpus |
| 10 | ACC-08 | Type not valid for its category per type mapping | **1,394 jobs (7.4%)** | 1/2 — needs era + mapping-version split |
| 11 | GAP-02b | **67/160 categories (41.9%) have no top-15 attribute schema** (master map resolver). Also: fuzzy resolution accepts weak matches ("Shower Accessory"→"Shower" at 0.50) | 67 categories | 1 (config gap) |
| 12 | ACC-06 | Color value is junk/over-capture (digits/units/HTML or >30 chars) — Bug-A class at scale | **735 jobs (3.9%)** | 1 — pre-fix corpus |
| 13 | ACC-02 | Title does not end with the authoritative SKU (e.g. KOES730SPS title ends "Printshield™ Finish") | 543 jobs (2.9%) | 1 |
| 14 | GAP-05 | **Verification score doesn't discriminate**: avg score is ~88–90 for every data-source scenario (`no_sources` 88.0 vs `both_sources` 88.6). A confidence score that's identical with and without evidence isn't measuring evidence | scenario mix: both 72.3%, WR-only 23.5%, none 3.7%, Ferguson-only 0.4% | 1 (scoring) |
| 15 | WST-05 | Completed but never accepted by SF: 55 webhook-failed + 200 unacknowledged; 149 failed jobs | ≈$2.78 + unknown SF-side gaps | O |

## Smaller / informational

- **ACC-03** title dimension >4" off stored dims: 78 jobs (0.42%) — the NS-CZ14WH2-class bug is real but rare.
- **ACC-09** brand not in picklist: 44 (0.23%). **ACC-13** implausible dims: 36. **ACC-14** MSRP vs Ferguson >30%: 34.
- **ACC-10** Canadian jobs: 514 (2.7%) — conversion deep-check deferred to Phase 2.
- **WST-06** processing time: 94% of jobs 60–300s; 72 jobs >300s. **WST-08** truncation events: 16 (log).
- **WST-01** model history: gpt-4-turbo-preview cost $354.13 for only 1,014 calls (37% of all spend) — **historical**, last used 2026-02-04 (since replaced by gpt-4o-mini at ~1/100 the per-call cost). Current steady-state ≈ $0.05/job.
- **GAP-01** field coverage is strong overall: brand/model/title 0.2% empty; worst primary fields: color 7.0%, finish 5.8%, style 4.9%. Worst cells: Furniture/msrp 84% empty (n=38).
- **GAP-03** pending creation requests: 1,254 total → 1,165 fulfilled, **89 pending** (1,201 attribute, 39 type, 10 brand, 4 style). Failed match logs: 1,947. (Age bucketing failed in this run — `createdAt` key differs; fix in next scanner pass.)
- **GAP-04** NEEDS_SF_ID inventory: **0** — the CLAUDE.md Known Issues entry (33 legit + 6 garbage) is **stale**; resolved by commit `98c17ac`. Concrete OVS-08 (doc drift) hit. → Update Known Issues sections.
- **GAP-06** Audit Mode covers 7 of ~26 primary output fields; 84 audit jobs to date.
- **`inconclusiveresponselogs`**: 116,246 records with rich per-field diagnosis (`field_name`, `inconclusive_type`, `ai_provider`, `potential_cause`) — major mining target for Phase 2/4.

## Process notes

- Scan results initially disappeared from prod's `audit-results/` between runs (cause not identified; no hooks/gitignore/cron cleaner found). Re-ran and tar'd in the same shell — all four JSONs captured. Watch for recurrence.
- `verification_jobs.result.Primary_Attributes` has two schema eras; `lib/common.js#normalizePrimary` handles both. 346 docs match neither (uninspected).
- ACC-07a/ACC-08 need an **era-split breakdown** added to scan-accuracy.js before Phase 4 classification (current byCategory tables don't separate eras).

## What Phase 2 should take from this

1. **Stratification for the golden set**: include heavy-hit categories (Range Hood, Refrigerator, Dishwasher for finish/color; WAC/Innovations lighting for title duplication; Furniture for MSRP gaps), all 4 scenarios, both eras, Canadian jobs, and the #078 product set.
2. **Priority semantic questions for the calibrated L2 pass**: is the schema title or the discarded Claude title better (n=2,818)? Is "Contemporary" ever evidence-backed? What % of finish==color cases should be empty?
3. **Fix scanner gaps**: era-split tables, GAP-03 age buckets, ACC-10 conversion validation.
