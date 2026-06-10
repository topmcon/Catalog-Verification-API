#!/bin/bash
###############################################################################
# Daily health digest (OVS-05 / PLATFORM-AUDIT Phase 4)
#
# One screen of "did anything go wrong recently": webhook failures, FAIL
# reviews, errors, unacknowledged jobs, backup freshness, disk. Run ad hoc
# (Establish Connection) or from cron:
#   30 6 * * * /opt/catalog-verification-api/scripts/ops/health-digest.sh >> /opt/catalog-verification-api/logs/health-digest.log 2>&1
#
# This is a PULL digest (read it in the log / session start). Push alerting
# (email/Slack) needs a channel decision — see SCORECARD.md OVS-05.
###############################################################################
set -uo pipefail

APP=/opt/catalog-verification-api
LOG="$APP/logs/combined.log"
ERRLOG="$APP/logs/error.log"
BACKUP_DIR="/var/backups/catalog-verification/mongo"
TODAY=$(TZ=America/New_York date +%Y-%m-%d)
YESTERDAY=$(TZ=America/New_York date -d yesterday +%Y-%m-%d 2>/dev/null || TZ=America/New_York date -v-1d +%Y-%m-%d)

recent() { grep -h "^$YESTERDAY\|^$TODAY" "$1" 2>/dev/null; }

echo "════════ HEALTH DIGEST $(date -Is) (window: $YESTERDAY + $TODAY ET) ════════"

echo "— Service: $(systemctl is-active catalog-verification 2>/dev/null || echo unknown) | Health: $(curl -sf -m 5 https://verify.cxc-ai.com/health > /dev/null && echo OK || echo FAIL)"

WEBHOOK_FAIL=$(recent "$LOG" | grep -ci "webhook.*fail\|Invalid id" || true)
FAIL_REVIEWS=$(recent "$LOG" | grep -c "finalStatus.*FAIL\|review.*FAIL" || true)
ERRORS=$(recent "$ERRLOG" | wc -l | tr -d ' ')
echo "— Webhook failures: $WEBHOOK_FAIL | FAIL reviews: $FAIL_REVIEWS | error.log lines: $ERRORS"

docker exec mongodb mongosh catalog-verification --quiet --eval '
  const day = 1000*60*60*24;
  const since = new Date(Date.now() - 2*day);
  print("— Jobs (48h): completed " + db.verification_jobs.countDocuments({status:"completed", completedAt:{$gte:since}})
    + " | failed " + db.verification_jobs.countDocuments({status:"failed", updatedAt:{$gte:since}})
    + " | webhook-failed " + db.verification_jobs.countDocuments({webhookSuccess:false, updatedAt:{$gte:since}})
    + " | unacknowledged " + db.verification_jobs.countDocuments({status:"completed", salesforceAcknowledged:{$ne:true}, completedAt:{$gte:since}}));
  print("— Pending: picklist syncs " + db.pendingpicklistsyncs.countDocuments({status:"pending"})
    + " | creation requests " + db.pendingcreationrequests.countDocuments({status:"pending"}));
' 2>/dev/null || echo "— Mongo digest: UNAVAILABLE"

if LAST_BACKUP=$(ls -1t "$BACKUP_DIR"/*.archive.gz 2>/dev/null | head -1); then
  AGE_H=$(( ($(date +%s) - $(stat -c%Y "$LAST_BACKUP")) / 3600 ))
  SIZE_MB=$(( $(stat -c%s "$LAST_BACKUP") / 1048576 ))
  FLAG=$([ "$AGE_H" -gt 12 ] && echo " ⚠️ STALE (>12h)" || echo "")
  echo "— Last backup: ${AGE_H}h ago, ${SIZE_MB}MB, $(ls -1 "$BACKUP_DIR" | wc -l | tr -d ' ') retained$FLAG"
else
  echo "— Last backup: 🔴 NONE FOUND in $BACKUP_DIR"
fi

echo "— Disk: $(df -h / | awk 'NR==2 {print $5" used, "$4" free"}')"
echo "═══════════════════════════════════════════════════════════════════════"
