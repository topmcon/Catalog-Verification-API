# Session Summary — April 21, 2026
## SF Response Watch System + Out-of-Order Retry Logic

---

## Context / Why This Session Was Started

Continuation from the previous session where request-only picklist reconciliation was implemented and deployed (commit `f8bafb3`). After deploying, we manually approved a pending sync which fulfilled 50 of 60 pending outbound creation requests (60→10 pending). Then we built a re-trigger mechanism to resend the remaining stale requests through the verification pipeline.

This session completed two remaining gaps:

1. **Out-of-order detection in retrigger script** — a regression where the OR logic (out-of-order OR ≥7 days) had been dropped, leaving only age-based logic. User caught this: "we specifically discussed the order do you not see that"
2. **15-minute SF response watch** — system to detect when Salesforce fails to acknowledge a pending creation request within 15 minutes

---

## Architecture Context

### Pending Creation Request Flow
```
Verification job encounters unknown value (e.g., attribute not in picklist)
  → pending-creation-request.service.createRequest()
    → Saves to MongoDB `pending_creation_requests` collection
    → Sends outbound webhook to Salesforce
    → Sets awaiting_response_until = now + 15min  ← NEW

SF receives request → adds value to their picklist → sends sync back via POST /api/picklists/sync
  → picklist.controller: receivePendingSync()
    → Auto-reconcile: picklistReconciliation.reconcileAttributes/Brands/Styles()
      → For each NEW item in sync: check pending_creation_requests for match
        → MATCH → fulfill request, write to JSON, clear awaiting_response_until ← NEW
        → NO MATCH → ignore (rejected — request-only mode)
    → Reload picklists in memory

15-min cron (check-sf-response-deadlines.js):
  → Query pending with awaiting_response_until in past
  → Set needs_attention=true, attention_reason (clears awaiting_response_until)
  → Establish Connection script surfaces these next session
```

### Stale Request Retrigger Flow
```
scripts/retrigger-pending-requests.js
  → Query all pending requests
  → For each: check if out-of-order (newer request fulfilled while this is still pending)
               OR age ≥ 7 days
  → If either condition: POST original SF payload back to /api/verify/salesforce
    → Regenerates verification job → triggers new outbound creation request
    → Sets awaiting_response_until = now + 15min on the pending document
```

---

## Work Completed This Session

### Fix 1: Out-of-Order Logic in Retrigger Script
**File**: `scripts/retrigger-pending-requests.js`

**Before**: Trigger condition was age ≥ 7 days only (regression)
**After**: Trigger condition is `out-of-order OR age ≥ 7 days`

Out-of-order detection:
- Sort all pending requests by `first_requested_at` (oldest first)
- For each pending request at index N: count how many **later-requested** items have been fulfilled
- If count > 0: the request is out-of-order → retrigger
- Example: Item 1,2,3,4 pending, item 5 fulfilled → items 1-4 are out-of-order

```javascript
// Out-of-order check
const newerFulfilled = await PendingCreationRequest.countDocuments({
  request_type: req.request_type,
  first_requested_at: { $gt: req.first_requested_at },
  status: 'fulfilled'
});
const isOutOfOrder = newerFulfilled > 0;
const isOldEnough = ageInDays >= 7;
const shouldRetrigger = isOutOfOrder || isOldEnough;
```

**Previous session result**: 9/10 pending re-triggered, retry counters bumped 1→2

---

### Feature: 15-Minute SF Response Deadline Watch

**Problem**: After sending a creation request to Salesforce, there was no mechanism to detect if SF failed to respond. Requests could sit pending indefinitely.

**Solution**: Add a watch timer field to each pending request. Cron checks every 5 min. If 15 min passes with no fulfillment, flag for human review.

#### Model Change
**File**: `src/models/pending-creation-request.model.ts`

Added field to interface and schema:
```typescript
awaiting_response_until?: Date;
```
Schema:
```javascript
awaiting_response_until: { type: Date, index: true }
```

---

#### Service: Set Watch on New Request
**File**: `src/services/pending-creation-request.service.ts`

On `createRequest()`:
```typescript
awaiting_response_until: new Date(Date.now() + 15 * 60 * 1000),
```

On `fulfillRequest()`:
```typescript
$unset: { awaiting_response_until: '' }
```

---

#### Service: Clear Watch on Fulfillment (Reconciliation Paths)
**File**: `src/services/picklist-reconciliation.service.ts`

Added `pending.awaiting_response_until = undefined` before each `pending.save()` call in:
- `reconcileAttributes()` — main reconciliation path
- `reconcileBrands()` — brand reconciliation
- `reconcileStyles()` — style reconciliation
- `updatePendingAttributeIds()` — attribute ID update path (uses `$unset` in MongoDB query)

---

#### Script: Retrigger Sets Watch on Retry
**File**: `scripts/retrigger-pending-requests.js`

When a stale request is re-triggered:
```javascript
await PendingCreationRequest.updateOne({ _id: pending._id }, {
  $set: {
    retry_count: (pending.retry_count || 0) + 1,
    last_sent_at: new Date(),
    awaiting_response_until: new Date(Date.now() + 15 * 60 * 1000)
  }
});
```

---

#### New Script: Cron Deadline Checker
**File**: `scripts/check-sf-response-deadlines.js` *(NEW)*

```javascript
// Query pending requests with active deadline in the past
const overdue = await PendingCreationRequest.find({
  awaiting_response_until: { $exists: true, $ne: null },
  status: 'pending'
}).where('awaiting_response_until').lt(now);

// Flag each as needs_attention, clear watch to prevent re-flagging
for (const req of overdue) {
  await PendingCreationRequest.updateOne({ _id: req._id }, {
    $set: {
      needs_attention: true,
      attention_reason: `SF did not respond within 15 min of request send.`
    },
    $unset: { awaiting_response_until: '' }
  });
}
```

Output format:
```
[2026-04-22T02:48:04.263Z] SF response check: 10 watched, 10 flagged, 0 still in window
🔴 Newly flagged for attention:
   • style/"Not Applicable" (20m late)
   • attribute/"dynamic_cool_air_distribution" (602m late)
   ...
```

---

#### Cron Installation (Production)
```
*/5 * * * * cd /opt/catalog-verification-api && /usr/bin/node scripts/check-sf-response-deadlines.js >> /var/log/sf-deadline-check.log 2>&1
```

---

#### Backfill: Existing Pending Requests
All 10 pre-existing pending requests were backfilled with `awaiting_response_until = last_sent_at + 15min`. First cron run immediately flagged all 10 as `needs_attention` (they were past their windows). The watch field is cleared after flagging to prevent repeat alerts.

---

## Files Modified This Session

| File | Change |
|------|--------|
| `src/models/pending-creation-request.model.ts` | Added `awaiting_response_until?: Date` to interface and schema |
| `src/services/pending-creation-request.service.ts` | Set watch on `createRequest()`, clear in `fulfillRequest()` |
| `src/services/picklist-reconciliation.service.ts` | Clear watch at all 4 fulfillment paths |
| `scripts/retrigger-pending-requests.js` | Fix OR logic; set watch on retry |
| `scripts/check-sf-response-deadlines.js` | **NEW** — cron checker script |

---

## Commits This Session

| Commit | Message |
|--------|---------|
| `f8bafb3` | feat: request-only picklist reconciliation + auto-apply on sync receipt *(from previous session)* |
| `ac54461` | feat: 15-min SF response watch + out-of-order retry trigger |

---

## Current System State

| Environment | Commit | Status |
|-------------|--------|--------|
| Local | `ac54461` | ✅ Clean |
| GitHub | `ac54461` | ✅ Synced |
| Production | `ac54461` | ✅ Deployed |
| Service | — | ✅ Active |
| Health API | — | ✅ `{"status":"healthy"}` |

**Cron (production)**: `*/5 * * * *` → `check-sf-response-deadlines.js`

**Pending creation requests**: 10 → all flagged `needs_attention=true`
- 4 styles: Not Applicable, Freestanding, Counter Depth, Showerhead
- 6 attributes: motion_activated_illumination, is_discontinued, cu_pc_certified, forced_air_cooling, warning_signal, dynamic_cool_air_distribution

---

## Remaining Warnings / Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| 10 pending requests all flagged | 🟡 MEDIUM | Expected — all past 15-min window. Will surface on next Establish Connection. Awaiting SF to create these values and send sync. |
| `dynamic_cool_air_distribution` → 602m late | 🟡 MEDIUM | Been open longest, was already re-triggered last session. SF has not responded. May need manual follow-up with SF team. |
| Pending requests max retry = 3 | ℹ️ INFO | Budget per request is 3 retries before no more re-triggers. Need to confirm behavior after budget exhausted. |

---

## Next Steps

1. **Await SF response**: The 10 flagged attributes/styles are now pending on Salesforce's side. When SF adds them and sends a sync, the auto-reconcile will fulfill them automatically.
2. **Monitor cron**: Check `/var/log/sf-deadline-check.log` on next Establish Connection to confirm cron is running cleanly.
3. **Consider manual SF follow-up**: Especially for `dynamic_cool_air_distribution` (~10 hours overdue).
4. **Check retry budget logic**: Confirm what happens when a request hits max_retries (currently 3). Should there be escalation logic beyond `needs_attention`?
5. **Retrigger remaining 10**: Once SF sends a new sync (auto-reconcile will handle), but if nothing arrives within a day, re-run `node scripts/retrigger-pending-requests.js` from production.

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `scripts/check-sf-response-deadlines.js` | Cron: flag overdue SF responses |
| `scripts/check-pending-creation-requests.js` | Establish Connection: surface flagged items |
| `scripts/retrigger-pending-requests.js` | Re-send stale requests (out-of-order OR 7d) |
| `scripts/dry-run-reconciliation.js` | Simulate reconciliation without DB writes |
| `src/services/picklist-reconciliation.service.ts` | Request-only reconcile logic |
| `src/controllers/picklist.controller.ts` | Sync receipt → auto-reconcile |
| `src/models/pending-creation-request.model.ts` | Model with needs_attention + awaiting_response_until |
| `src/services/pending-creation-request.service.ts` | Create/fulfill with watch set/clear |
