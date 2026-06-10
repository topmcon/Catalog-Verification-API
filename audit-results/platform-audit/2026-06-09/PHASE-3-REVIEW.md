# Phase 3 — Static Code / Architecture / Security Review

**Date**: 2026-06-09 (evening ET) · **Method**: primary evidence only (config lines, live HTTP tests,
queries, greps) per PLATFORM-AUDIT-GUIDE §6.0 Phase 3 gate — every item closes "CONFIRMED" or "REFUTED",
never "assumed".

| Item | Verdict | Severity |
|------|---------|----------|
| CON-01 secrets in repo | ✅ CONFIRMED | HIGH |
| CON-02 MongoDB exposure | ❎ REFUTED (localhost-only) — residual: no mongo auth | LOW |
| CON-03 root SSH | 🟡 PARTIAL — hardened, but 20 authorized keys | MED |
| CON-04 no DB backups | ✅ CONFIRMED | **CRIT** |
| CON-05 restart kills jobs | ❎ MOSTLY REFUTED — recovery exists for verification jobs | LOW/MED |
| CON-06 15k-line core file | ✅ CONFIRMED (15,528 lines, ~0% test coverage) | MED |
| CON-07 endpoint auth | ❎ MOSTLY REFUTED — one real exception: `/api/webhook/confirm` | MED |
| CON-08 npm vulnerabilities | ✅ CONFIRMED — 4 critical / 46 high / 42 moderate | HIGH |
| OVS-05 no alerting | ✅ CONFIRMED | MED |
| OVS-06 unowned Known-Issues backlog | ✅ CONFIRMED (standing user decisions listed) | MED |
| OVS-08 CLAUDE.md ↔ copilot drift | 🟡 LIGHT — synced sections present in both | LOW |

---

## CON-01 — Secrets committed to the repo · ✅ CONFIRMED · HIGH

**Evidence**: `git grep` finds the production inbound `WEBHOOK_SECRET` value in two tracked files:
`docs/api/WEBHOOK-PAYLOAD-EXAMPLE.md` and `session-notes/SESSION-SUMMARY-2026-06-08-AUDIT-MODE-FIXES-AND-LOOP-DIAGNOSIS.md`
(and therefore in git history on GitHub). No `.env` is tracked; no OpenAI/xAI key patterns found in tracked files.

**Action (user decision — rotation requires SF coordination)**: rotate `WEBHOOK_SECRET`, replace the
two occurrences with a placeholder, and treat history as burned (rotation makes scrubbing optional).

## CON-02 — MongoDB exposure · ❎ REFUTED (as network exposure) · LOW residual

**Evidence**: `docker ps` → `mongodb 127.0.0.1:27017->27017/tcp`; `ss -tlnp` → docker-proxy listening on
`127.0.0.1:27017` only. Not internet-reachable.
**Residual**: mongod runs without authentication, and the box is **shared with other applications**
(a second container `coco-mongodb-prod`, plus `/opt/melocrm`, `/root/Coco-AI`) — any compromised local
process can read/write our DB. Acceptable risk to note, not urgent.

## CON-03 — Root SSH · 🟡 PARTIAL · MED

**Evidence**: `sshd_config`: `PermitRootLogin prohibit-password`, `PasswordAuthentication no`,
`PubkeyAuthentication yes` — properly hardened against password attacks.
**Concern that stands**: `/root/.ssh/authorized_keys` contains **20 keys**. Unknown how many are stale or
whose they are. **Action**: inventory and prune (user/ops decision — other apps' deploy keys live there too).

## CON-04 — Database backups · ✅ CONFIRMED (none for our DB) · **CRIT**

**Evidence**: the only backup cron on the host is `0 */6 * * * /opt/melocrm/scripts/backup-db.sh` —
**melocrm's, not ours**. No mongodump artifacts or backup directory exists for `catalog-verification`.
19,113 jobs of verification history + audit results + picklist state have **zero restore path**.
**Action**: add a `mongodump` cron (e.g. every 6h, 7-day retention, off-box copy). Cheap, high value —
candidate for the first Phase 4 fix.

## CON-05 — Restarts kill in-flight jobs · ❎ MOSTLY REFUTED · LOW/MED

**Evidence**: `async-verification-processor.service.ts:35-76` — `recoverStaleJobs()` runs on startup and
re-queues orphaned `processing` jobs ("Recovered stale jobs orphaned by service restart"). Normal
verification work survives restarts by design.
**Residual (observed in #078)**: audit-mode confirm jobs are **not** covered by this recovery — killed
confirms stayed dead. MED only while running audit confirms; note for the harness era.

## CON-06 — Core-file concentration risk · ✅ CONFIRMED · MED

**Evidence**: `dual-ai-verification.service.ts` = **15,528 lines**, ~82 top-level functions. Unit-test
coverage of this file: **zero** (the suite covers 3 utility files only). Every #078 bug lived here.
**Action**: don't big-bang refactor; extract + test pure functions opportunistically as fixes touch them
(the harness work starts this — `findInSpecificationTable` first).

## CON-07 — Endpoint auth coverage · ❎ MOSTLY REFUTED · MED exception

**Evidence**: `routes/index.ts:27-38` applies `apiKeyAuth` at mount to every sensitive router
(picklists, failed-matches, catalog-index, analytics, dashboard, self-healing, enrichment);
`/api/verify` router has `router.use(apiKeyAuth)`. **Live test**: `POST /api/picklists/sync/pending/test/approve`
with no key → **401**. The auth-less `curl` examples in CLAUDE.md are a **documentation bug** (they would 401),
not an API hole.
**Confirmed exception**: `POST /api/webhook/confirm` → **200 with no auth** (live-tested). It mutates
`salesforceProcessed` state and is deliberately public "(SF calls this after saving)". Spoofable
confirmations = data-integrity nuisance, not catastrophic. **Action**: validate sessionId existence +
require the webhook signature SF already uses elsewhere.

## CON-08 — Dependency vulnerabilities · ✅ CONFIRMED · HIGH

**Evidence**: `npm audit` → `{"critical":4,"high":46,"moderate":42,"total":92}`.
**Action**: triage the 4 criticals first (likely transitive via old scraping/parsing deps); `npm audit fix`
non-breaking set, then evaluate breaking upgrades. Run through G1–G4 like any code change.

## OVS-05 — No alerting · ✅ CONFIRMED · MED

**Evidence**: no notification code anywhere in `src/` (no mailer/slack/webhook-alert patterns), no
alerting cron. Webhook failures, FAIL reviews, and error.log spikes are discovered only by manually
reading logs. **Action**: ENH-08; a 10-line cron that greps error.log + webhook failures into a daily
digest would cover 80%.

## OVS-06 — Unowned Known-Issues backlog · ✅ CONFIRMED · MED

Standing items needing a **user/business decision** (unchanged): cagp-lot 763 rejected jobs (resubmit or
write off — ~85% of historical AI spend was duplicates incl. these), 49 stale SF picklist creation
requests (Freestanding/Counter Depth 72+ days), 10 historical jobs needing requeue, garbage
`NEEDS_SF_ID` attributes cleanup (per Phase 1 GAP-04: now resolved — verify), webhook-secret rotation (CON-01).

## OVS-08 — Instruction-file drift · 🟡 LIGHT · LOW

**Evidence**: section-level comparison — both files carry the synced sections (Audit Mode, Platform
Audit, Known Issues, deploy/SSH procedures). copilot-instructions.md has extra sections (Establish
Connection / Save Everything detail) and CLAUDE.md references the `mardeys-prod` alias vs copilot's
`cxc_ai_deploy` key (already documented as environment-specific). No contradiction found.
**Action**: none urgent; keep the sync rule.

---

## Recommended Phase 4 fix order (from this review)

1. **CON-04 backups** — CRIT, ~30 min of work, zero risk
2. **CON-01 secret rotation** — HIGH (needs SF coordination — user decision)
3. **CON-08 npm criticals** — HIGH, through G1–G4
4. **CON-07 `/api/webhook/confirm`** — MED, small change
5. **OVS-05 alert digest** — MED, small standalone script
6. CON-03 key inventory — user/ops
