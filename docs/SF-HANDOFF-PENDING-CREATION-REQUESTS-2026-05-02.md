# SF Dev Handoff — Pending Creation Requests Not Being Fulfilled

**Date:** 2026-05-02
**From:** Catalog Verification API team (verify.cxc-ai.com)
**To:** Salesforce Developer / Data Team
**Priority:** 🔴 High — 70 verification jobs blocked
**Subject:** 11 outbound creation requests have been pending for 7–63 days with no fulfillment

---

## TL;DR

Our verification API has been sending **outbound creation requests** to Salesforce for 11 picklist items it has encountered in real product data but cannot find in the picklists you sync to us. SF picklist syncs **are arriving daily** (5 in the last 24 hours, 9,239 attributes / 17 styles each), but **none of the 11 items we have requested appear in any of those syncs**.

We are not seeing rejections or errors back from SF — just silence on these specific items. This blocks 70 active verification jobs.

We need to confirm:
1. Are these creation requests reaching the right Salesforce queue / process?
2. Are any of these items being **intentionally rejected** (and if so, can we get a rejection signal so we can apply a fallback)?
3. For items SF will not create, what value/category should our system map to instead?

---

## How the workflow is supposed to work (recap)

```
                                 ┌─────────────────────────────────┐
                                 │ verify.cxc-ai.com (our API)     │
                                 └─────────────────────────────────┘
                                              │
   1. Verification job sees raw value         │
      "Counter Depth" but it is not in        │
      our picklist                            │
                                              ▼
                                 ┌─────────────────────────────────┐
                                 │ Create PendingCreationRequest   │
                                 │ status = pending                │
                                 │ Send webhook to SF              │
                                 └─────────────────────────────────┘
                                              │
   2. Webhook to SF with the value            │
      and context (category, source job)      │
                                              ▼
                                 ┌─────────────────────────────────┐
                                 │ Salesforce                      │
                                 │ - Receives webhook              │
                                 │ - Creates picklist entry  (?)   │ ← we are stuck here
                                 │ - Includes it in next sync (?)  │
                                 └─────────────────────────────────┘
                                              │
   3. SF pushes updated picklist sync         │
      (POST /api/picklists/sync)              │
                                              ▼
                                 ┌─────────────────────────────────┐
                                 │ Our auto-reconciler             │
                                 │ matches by lowercase exact name │
                                 │ → marks request status=fulfilled│
                                 │ → unblocks waiting jobs         │
                                 └─────────────────────────────────┘
```

**Step 3 is working perfectly** — over 975 historical items have been reconciled this way. The problem is **Step 2** for these 11 specific items.

---

## What we have observed

### SF syncs are arriving normally (last 24 hours)

| Sync received (UTC) | Status | Attributes | Styles |
|---|---|---|---|
| 2026-05-02 12:34 | auto-approved | 9239 | 17 |
| 2026-05-02 03:15 | auto-approved | 9239 | 17 |
| 2026-05-02 02:53 | auto-approved | 9239 | 17 |
| 2026-05-01 21:15 | auto-approved | 9239 | 17 |
| 2026-05-01 20:18 | auto-approved | 9239 | 17 |

### None of our 11 outstanding requests appear in any sync

Latest sync's full **17 styles**:
```
Built-In, Farmhouse, Industrial, Traditional, Transitional,
Contemporary, Rustic, Victorian, Vintage, Modern, Art Deco,
Tropical, Bohemian, Coastal, Geometric, Southwestern, Striped
```

Notably absent: `Freestanding`, `Counter Depth`, `Not Applicable`, `Showerhead`.

---

## The 11 pending items

### 🎨 Style requests (4 items, 63 jobs blocked)

| Style value | Category context | Jobs waiting | First requested | Retries |
|---|---|---|---|---|
| **"Not Applicable"** | Range Hood | **43** | 63 days ago | 2/3 |
| **"Freestanding"** | Refrigerator | **13** | 41 days ago | 2/3 |
| **"Counter Depth"** | Refrigerator | **6** | 41 days ago | 2/3 |
| **"Showerhead"** | Shower | 1 | 40 days ago | 2/3 |

**Sample jobs**: `a03Hu00001N2DOQIA3` (Range Hood, ZVW1360SPSS), `a03Hu00001N1vHxIAJ` (Refrigerator, FFPS3133UM), `a03Hu00001N1wjEIAR` (Refrigerator, GBE17HYRFS)

### 🔧 Attribute requests (7 items, 7 jobs blocked)

| Attribute key | Category context | Days pending | Retries |
|---|---|---|---|
| `motion_activated_illumination` | Storage Drawer/Door | 63 | 2/3 |
| `is_discontinued` | Shower Faucet | 61 | 2/3 |
| `cu_pc_certified` | Bathroom Vanity | 61 | 2/3 |
| `forced_air_cooling` | Refrigerator | 32 | 2/3 |
| `warning_signal` | Refrigerator | 32 | 2/3 |
| `dynamic_cool_air_distribution` | Freezer | 11 | 1/3 |
| `daily_ice_making_capacity` | Refrigerator | 7 | 1/3 |

---

## Possible diagnostic categories — please help us classify

For each item below, please tell us **which bucket it falls into** so we know whether to wait for SF or fix it on our end:

### Bucket 1 — "We never received this request"
SF has no record of the inbound webhook for this value.
👉 *Action needed:* SF dev to investigate webhook delivery / queue routing. We can resend on demand.

### Bucket 2 — "We received it but it is intentionally rejected"
Reason: not a valid picklist value per SF data governance (e.g., "Not Applicable" might violate data policy).
👉 *Action needed:* SF to send back an explicit rejection signal so our system can mark it `rejected` and apply a fallback. Without rejection, the value sits forever in `pending`.

### Bucket 3 — "Wrong picklist type — should be on a different field"
Example we suspect: **"Freestanding"** and **"Counter Depth"** are likely *Refrigerator configuration / installation type*, not a *style*. They should never be on the styles picklist.
👉 *Action needed:* Tell us which SF picklist field the value belongs on, and we will reroute it on our side.

### Bucket 4 — "Will be created — just slow"
Backlog / capacity issue.
👉 *Action needed:* ETA, please.

### Bucket 5 — "Already exists under a different name"
Example: SF may have created `Showerhead` as `Shower Head` or `N/A` instead of `Not Applicable`.
👉 *Action needed:* Tell us the canonical SF name and ID; we will alias it.

---

## Specific questions per item

### Style: "Not Applicable" for Range Hood (43 jobs blocked, 63 days)
- Is "Not Applicable" rejected as a non-meaningful style?
- If yes, what should we set Range Hood `style` to when no other style applies?
- Is there a "no-style-needed" sentinel, or should the field be left blank?

### Style: "Freestanding" + "Counter Depth" for Refrigerator (19 jobs blocked, 41 days)
- These look like **installation types**, not styles. Are they on the wrong picklist?
- Is there a Refrigerator-specific `installation_type` or `configuration` picklist we should be writing to instead?

### Style: "Showerhead" for Shower (1 job, 40 days)
- Could SF have already created this as `Shower Head` (two words)?
- Or is "Showerhead" actually a `type` (sub-product) rather than a `style`?

### Attributes (all 7)
- Are technical/spec attributes like `motion_activated_illumination`, `forced_air_cooling`, `daily_ice_making_capacity` valid picklist additions, or should they live on a different SF object (e.g., a custom feature spec table)?
- Is there an attribute-naming convention we should follow (e.g., underscores vs spaces, sentence case vs snake_case)?

---

## What we have on our side (already deployed)

We have already implemented robust handling for the lifecycle:

1. **Auto-reconcile on sync receipt** — every time SF sends a picklist sync, we automatically match incoming items against our pending requests by lowercase exact name. Matches → marked `fulfilled`, unblocks jobs immediately. (This is firing 5×/day successfully on every other item.)
2. **Stale-request retry** — requests are auto-resent to SF after the 15-min response window expires, up to 3 retries.
3. **Hold bucket for unmatched** — picklist syncs that contain items we did not request are held for manual review (no silent overwrite of our custom fields).
4. **Audit reporting** — `scripts/check-pending-creation-requests.js` and `scripts/check-pending-picklist-syncs.js` give us full visibility on every Establish Connection.

So the system is doing its job. The 11 items are stuck purely because they never come back in any SF sync.

---

## What we are asking SF to do

**Short term (this week)**:
1. Confirm whether SF has a record of webhooks for these 11 items
2. For each item, tell us which of the 5 buckets above it falls into
3. For "wrong picklist" items (Bucket 3), tell us the correct SF picklist field

**Medium term (process improvement)**:
1. Implement an explicit **rejection signal** SF can send back when it will not create a requested item, so we can mark it `rejected` instead of leaving it `pending` forever
2. Optionally include a **reason code** (`invalid_value`, `wrong_picklist`, `already_exists_as`, `policy_rejection`) so our pipeline can apply a sensible fallback automatically

---

## Contact

- Our verification API: `https://verify.cxc-ai.com`
- Full request data available on demand for any item
- Webhook resend endpoint exists on our side; we can re-send any of these on request
- Logs can be pulled from our side for any specific job ID listed above
