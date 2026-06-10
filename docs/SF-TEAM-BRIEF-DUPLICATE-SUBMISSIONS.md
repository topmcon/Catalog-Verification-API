# Brief for the Salesforce Team — Duplicate Verification Submissions (+ 2 open items)

**From**: Catalog Verification API team · **Date**: 2026-06-10
**Scope of data**: all 19,113 completed verification jobs, 2026-01-26 → 2026-06-09, production database
**Ask**: please review the three issues below and answer the numbered questions. Everything here is
measured from our stored job records — we can provide full CSVs (catalog IDs, timestamps, job IDs) for
any of it on request.

---

## Issue 1 (primary): the same products are being submitted for verification over and over

### What we observe (measured, not estimated)

- **2,091 distinct catalog records were submitted 2 or more times** — 16,214 excess verification runs.
  Top offenders were submitted **30+ times each** (`CVE28DP3NHD1`, `GYE22GYNFS`, `C3SSD`).
- This is the single largest cost driver of the integration: **≈85% of all AI verification spend to date
  (~$820 of ~$968) went to re-running products we had already verified.**
- From mid-February onward, on most active days **88–100% of ALL inbound submissions were repeats** of
  previously verified products. Examples:

  | Day | Submissions | Already-verified repeats |
  |-----|-------------|--------------------------|
  | Feb 10 | 272 | 272 (100%) |
  | Feb 11 | 735 | 735 (100%) |
  | Feb 24 | 1,542 | 1,479 (96%) |
  | Feb 25 | 1,317 | 1,306 (99%) |
  | Mar 23 | 764 | 763 (100%) |
  | May 3 | 156 | 156 (100%) |

- **Case study — `CVE28DP3NHD1`** (Café dishwasher): submitted **26 times between Feb 9 and Mar 21**, in
  three distinct waves (Feb 9–12, Feb 24–Mar 2, Mar 20–21). Of those 26 payloads, **one byte-identical
  payload was submitted 9 separate times**. Critically: **every one of the 26 runs completed, the result
  webhook was delivered successfully, and Salesforce acknowledged receipt every time** — and the product
  was sent again anyway.
- **1,422 submissions arrived while a previous job for the same record was still processing** (duplicate
  fired before the first one even finished — sometimes minutes apart).

### What this is NOT (ruled out on our side)

- Not failure retries: the duplicated runs show `webhookSuccess: true` and `salesforceAcknowledged: true`
  on virtually all prior runs. SF received and acknowledged our results before re-sending.
- Not our queue re-processing: each duplicate is a distinct inbound HTTP POST to
  `/api/verify/salesforce` creating a new job.

### What we suspect (hypotheses — this is what we need you to confirm or correct)

- **S1**: the selection logic that chooses records for verification callouts does **not exclude
  already-verified records** — either no "verified" flag is set on the record when our results arrive,
  or the flag isn't part of the selection criteria.
- **S2**: a scheduled batch/flow re-enqueues the same record set in waves (the date clustering — three
  waves for the same SKU weeks apart — looks scheduled or manually re-triggered, not event-driven).
- **S3**: the in-flight duplicates (1,422) look like a trigger/flow firing more than once per record
  change (e.g., on both insert and update, or per-field updates each firing a callout).
- Some re-sends carry **changed payloads** (e.g., updated retailer data) — those may be intentional
  re-verification. We have no visibility into which re-sends are intentional vs accidental.

### Questions for you — Issue 1

1. What initiates the verification callout (Flow / Apex batch / Process Builder / manual action), and
   what are its **selection criteria**?
2. Is there a field on the record that marks it as verified/processed when our result webhook arrives?
   Is that field **checked before re-sending**?
3. After SF acknowledges our result (the confirm callback), what updates happen on the record?
4. What explains the **wave pattern** (Feb 9–13, Feb 24–28, Mar 20–23, …)? Scheduled jobs? Bulk
   re-loads? Manual re-runs?
5. Is re-submission after **source data changes** intentional policy? If yes, what's the intended
   trigger, so we can distinguish legitimate refreshes from accidental re-sends?

### What we will do on our side regardless (FYI — no SF change required for these)

- **In-flight guard**: a submission for a record that already has a job pending/processing will return
  the existing job (HTTP 202, same contract) instead of starting a second run.
- **Identical-payload window**: a byte-identical payload re-submitted within 24h of a completed run will
  be answered by re-delivering the stored result through the normal webhook — SF still gets its
  response, we skip the redundant AI run.
- Re-sends with **changed** payloads will continue to process normally.

These protect cost on our side, but they don't fix the firehose — the selection logic is the root cause.

---

## Issue 2: the "cagp-lot" batch — 763 submissions SF rejected after we processed them

On **May 27** we received ~763 submissions with catalog IDs of the form `cagp-lot-XXX`. We processed all
of them (AI cost incurred), but **Salesforce rejected every result webhook** with `"Invalid id:
cagp-lot-XXX"` — none of the results were applied.

**Questions — Issue 2**
6. What were these records? A test batch? A migration artifact?
7. If they represent real products, should they be resubmitted with valid catalog IDs — or written off?

---

## Issue 3: 89 picklist creation requests pending, oldest 70+ days

When we encounter a value that doesn't exist in the picklists you sync to us (style, type, brand,
attribute), we send a creation request and SF acknowledges it (HTTP 200). Of **1,254 requests sent,
1,165 were fulfilled** (created in SF and synced back) — but **89 remain pending**, some for 70+ days.
Highest-impact examples: styles **"Freestanding"** and **"Counter Depth"**, which affect recurring
appliance verifications (every affected product gets a degraded match until these exist).

**Questions — Issue 3**
8. Is there a queue/owner on the SF side for these requests? Can the 89 pending be reviewed —
   approved or explicitly rejected (either answer lets us stop re-flagging them)?

---

## Appendix — how to cross-check on your side

- Pick any catalog ID from our duplicate list (we'll send the CSV) and pull its callout history in SF —
  you should see the same submission timestamps we logged.
- Our result delivery + your acknowledgment are both logged per job; we can provide
  `(catalog_id, submitted_at, completed_at, webhook_delivered_at, acknowledged)` tuples for any record.
- Contact us before changing callout selection logic in production — we'd like to coordinate a
  before/after measurement window so we can confirm the duplicate rate actually drops.
