#!/bin/bash
###############################################################################
# catalog-verification MongoDB backup (CON-04 / PLATFORM-AUDIT Phase 4)
#
# Dumps the catalog-verification database from the mongodb docker container as
# a gzipped archive. Designed for cron (every 6h) on production:
#   0 */6 * * * /opt/catalog-verification-api/scripts/ops/backup-mongo.sh >> /opt/catalog-verification-api/logs/backup.log 2>&1
#
# Retention: newest 28 archives (= 7 days at 4/day). Restore procedure:
#   docker exec -i mongodb mongorestore --archive --gzip \
#     --nsFrom='catalog-verification.*' --nsTo='catalog-verification.*' < <archive>
# (restore to a scratch DB first by changing --nsTo, verify counts, then real restore)
#
# NOTE: archives stay on the same host — off-box replication is a follow-up
# decision (destination/credentials). On-host backups still cover the dominant
# risks: bad deploy, accidental drop/update, container corruption.
###############################################################################
set -euo pipefail

# OUTSIDE /opt/catalog-verification-api — Finding #079: the (now-removed) CI auto-deploy
# ran `rsync --delete` over the app dir and wiped in-tree backups. Keep archives out of
# any deploy tool's blast radius permanently.
BACKUP_DIR="/var/backups/catalog-verification/mongo"
RETENTION=28
MIN_BYTES=1000000   # a healthy dump of 19k+ jobs is far larger; tiny = something broke

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/catalog-verification-$STAMP.archive.gz"

docker exec mongodb mongodump --db=catalog-verification --archive --gzip --quiet > "$OUT"

SIZE=$(stat -c%s "$OUT" 2>/dev/null || stat -f%z "$OUT")
if [ "$SIZE" -lt "$MIN_BYTES" ]; then
  echo "$(date -Is) BACKUP FAILED: $OUT is only $SIZE bytes" >&2
  rm -f "$OUT"
  exit 1
fi

# retention: keep newest $RETENTION archives
ls -1t "$BACKUP_DIR"/catalog-verification-*.archive.gz 2>/dev/null | tail -n +$((RETENTION + 1)) | xargs -r rm -f

echo "$(date -Is) BACKUP OK $OUT ($SIZE bytes), $(ls -1 "$BACKUP_DIR" | wc -l) archives retained"
