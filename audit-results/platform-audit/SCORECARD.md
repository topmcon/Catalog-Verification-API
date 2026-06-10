# Platform Audit — Scorecard (living document)

> Phase 4 synthesis per PLATFORM-AUDIT-GUIDE §7. Every row: quantified impact + evidence pointer.
> Class: 1 = pipeline code · 2 = source data/picklist drift · 3 = auditor strictness · O = operational/process.
> Status: OPEN · FIX-SHIPPED (gated, metric not yet re-measured) · CLOSED (metric moved / verified) · DECISION (user/business call needed).
> Sources: `2026-06-09/PHASE-1-SUMMARY.md` (corpus numbers), `2026-06-09/PHASE-3-REVIEW.md` (CON/OVS), `ACCEPTANCE-LOG.md` (fix evidence).
>
> **Last updated**: 2026-06-10.

## CRIT / HIGH

| Check | Finding | Class | Sev | Quantified impact | Status | Finding # |
|-------|---------|-------|-----|-------------------|--------|-----------|
| — | **CI auto-deploy fought all manual ops**: rsync --delete + `npm install --production` + restart on every push. Caused OVS-03 devDeps saga, #078 mid-job restarts, phantom prod local changes, deleted backups AND the vanishing Phase 1 scan results | O | CRIT | Months of failed deploys/mysteries; deleted 1.3GB backup | **CLOSED** (`631fa7d`; post-fix push leaves devDeps intact) | **#079** |
| CON-04 | No DB backups for catalog-verification (19,113-job history, no restore path) | O | CRIT | Total-loss exposure | **CLOSED** (6h cron → `/var/backups/`, restore-tested 19,267/19,267) | #079-adjacent |
| WST-04 | Duplicate verifications: 2,091 catalog IDs run 2+ times, 16,214 excess runs (top SKU ×35) | O | HIGH | **≈$820 of $967.54 total spend (85%)** | DECISION — needs cause split: SF re-sends vs our re-queues vs intentional | — |
| ACC-01 | Title length outside 60–80 (p50=64 but p10=42/p90=87, min 2, max 198) | 1 | HIGH | **10,616 jobs (56.6%)** | OPEN — also confirm 60–80 is still the requirement | — |
| ACC-12 | Style defaulted, not extracted ("Contemporary" 49.4% + "Modern" 20.9%; Laundry Pedestal 100%) | 1/3 | HIGH | **9,263 jobs Contemporary (70% combined)** | OPEN — policy decision: empty style vs default | — |
| ACC-05 | Finish duplicates color (#078 Bug-C at corpus scale; Range Hood 1,283, Refrigerator 1,196) | 1 | HIGH | **7,458 jobs (39.7%)** — corpus is pre-fix; guard shipped Jun 8 | FIX-SHIPPED — re-scan after golden review to confirm metric moves on new jobs | #078 |
| WST-03 | Claude Phase B title corrections computed then discarded ("using schema-generated version") | 1 | HIGH | **2,818 occurrences** (paid output thrown away) | OPEN — golden review will judge schema vs Claude titles (L2 priority question) | — |
| CON-08 | npm vulnerabilities | O | HIGH | was 92 (4 crit) → **12 (2 crit)**; rest need breaking jsforce upgrade / dev-only | FIX-SHIPPED (residual DECISION: jsforce major) | — |
| CON-01 | WEBHOOK_SECRET committed (2 tracked files + git history) | O | HIGH | Inbound API auth exposed to anyone with repo read | PARTIAL (files scrubbed) — **DECISION: rotation** (needs SF coordination) | — |

## MED

| Check | Finding | Class | Sev | Quantified impact | Status | Finding # |
|-------|---------|-------|-----|-------------------|--------|-----------|
| WST-02/07 | Research efficacy unmeasurable: `fieldsCaptured=0` on 100% of web-search (33,393 calls, $60.18) and image-vision (12,303, $47.55) | O | MED | **$107.73 spend with no efficacy signal** | OPEN — instrumentation fix; also gates the image-vision "Glossy" issue (#078) | — |
| ACC-07a | Output category not in current picklist | 2 | MED | 2,190 jobs (11.7%) — sampled 100% legacy-era names | OPEN — era-split scanner pass required before action | — |
| ACC-11 | Repeated token in titles ("WAC Lighting … by Wac Lighting") | 1 | MED | **2,108 jobs (11.2%)** | OPEN | — |
| ACC-04 | Finish = plain color/config descriptor | 1 | MED | 1,692 jobs (9.0%) — pre-fix corpus | FIX-SHIPPED (#078 Bug C) — re-measure | #078 |
| ACC-08 | Type invalid for category | 1/2 | MED | 1,394 jobs (7.4%) | OPEN — era + mapping-version split needed | — |
| GAP-02b | 67/160 categories (41.9%) lack a top-15 attribute schema; fuzzy resolver accepts 0.50 matches | 1 | MED | 67 categories | OPEN | — |
| ACC-06 | Junk/over-captured color values (#078 Bug-A class) | 1 | MED | 735 jobs (3.9%) — pre-fix corpus | FIX-SHIPPED — unit-tested (11 tests); re-measure | #078 |
| ACC-02 | Title doesn't end with authoritative SKU | 1 | MED | 543 jobs (2.9%) | OPEN | — |
| GAP-05 | Verification score doesn't discriminate (≈88–90 for every scenario incl. `no_sources`) | 1 | MED | Score is not measuring evidence | OPEN — scoring redesign candidate | — |
| CON-07 | `/api/webhook/confirm` accepted unauthenticated POSTs | O | MED | 0 legitimate uses ever (0 audit-log confirmations; SF uses the authenticated endpoint) | **FIX-SHIPPED** (apiKeyAuth required; live-tested) | — |
| OVS-05 | No alerting — failures discovered only by reading logs | O | MED | 55 webhook-failed + 200 unacknowledged jobs sat unnoticed (WST-05) | PARTIAL (daily digest script + cron) — push-channel DECISION pending | — |
| CON-03 | 20 authorized SSH keys on root, provenance unknown | O | MED | Shared server, shared deploy keys | DECISION — inventory/prune with ops | — |
| GAP-03 | 89 pending picklist creation requests (1,201 attr / 39 type / 10 brand / 4 style submitted; 1,165 fulfilled) | 2 | MED | Stale matching for affected values (Freestanding 72+ days) | DECISION — SF follow-up | — |

## LOW / informational

| Check | Finding | Impact | Status |
|-------|---------|--------|--------|
| ACC-03 | Title dimension >4" off stored dims | 78 jobs (0.42%) — real but rare | FIX-SHIPPED (#078) — re-measure |
| ACC-09/13/14 | Brand not in picklist 44 · implausible dims 36 · MSRP>30% 34 | <0.3% each | OPEN (low) |
| WST-06/08 | >300s jobs: 72 · truncation events: 16 | bounded | OPEN (low) |
| WST-01 | gpt-4-turbo-preview cost $354 for 1,014 calls — historical (last used Feb 4); steady-state ≈$0.05/job | none (already migrated) | CLOSED |
| GAP-01 | Field coverage strong: brand/model/title ~0.2% empty; worst: color 7.0%, finish 5.8% | — | informational |
| GAP-04 | NEEDS_SF_ID inventory = 0 (Known Issues entry was stale) | doc drift fixed | CLOSED |
| GAP-06 | Audit Mode covers 7 of ~26 primary fields | QA scope gap | OPEN (low) |
| CON-02/05 | Mongo localhost-only · restart recovery exists (verification jobs) | refuted concerns | CLOSED (residuals noted in PHASE-3-REVIEW) |

## Standing user decisions (blocking nothing, awaiting answers)

1. **Golden-answers review** — 49 SKUs (`audit-results/golden-set/README.md`) → unlocks harness gate + L2 calibration + the schema-vs-Claude-title question (n=2,818)
2. **WST-04 duplicates** — investigate why SF re-sends the same SKUs ×35 before any spend optimization
3. **CON-01 rotation** · **cagp-lot 763 jobs** · **GAP-03 SF follow-up** · **CON-03 key pruning** · **jsforce major upgrade**
