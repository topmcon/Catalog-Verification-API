#!/bin/bash
# auto-sync-picklists.sh
# Automatically sync picklist changes from production back to GitHub
# This script runs on production after any picklist sync

set -e

REPO_DIR="/opt/catalog-verification-api"
PICKLIST_DIR="$REPO_DIR/src/config/salesforce-picklists"
LOG_FILE="$REPO_DIR/logs/picklist-sync-to-git.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

cd "$REPO_DIR"

# Check if there are any changes in picklist files
if git diff --quiet "$PICKLIST_DIR/"; then
    log "No picklist changes detected"
    exit 0
fi

log "Picklist changes detected, syncing to GitHub..."

# Configure git if needed
git config user.email "api@verify.cxc-ai.com" 2>/dev/null || true
git config user.name "Catalog Verification API" 2>/dev/null || true

# Get list of changed files
CHANGED_FILES=$(git diff --name-only "$PICKLIST_DIR/")
log "Changed files: $CHANGED_FILES"

# Stage only picklist files
git add "$PICKLIST_DIR/"

# Create descriptive commit message
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S EST')
COMMIT_MSG="Auto-sync picklists from Salesforce ($TIMESTAMP)"

# Commit
git commit -m "$COMMIT_MSG"

# Push to GitHub
if git push origin main; then
    log "Successfully pushed picklist changes to GitHub"
    echo "SUCCESS: Picklists synced to GitHub"
else
    log "ERROR: Failed to push to GitHub"
    echo "ERROR: Failed to push to GitHub"
    exit 1
fi
