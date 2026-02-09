#!/bin/bash
#
# AUTO-COMMIT PICKLISTS TO GITHUB
# This script runs on production after Salesforce syncs picklist data
# It commits and pushes changes to GitHub automatically
#

set -e

# Configuration
REPO_DIR="/opt/catalog-verification-api"
PICKLIST_DIR="$REPO_DIR/src/config/salesforce-picklists"

cd "$REPO_DIR"

# Check if there are any changes
if git diff --quiet "$PICKLIST_DIR"/*.json; then
    echo "No picklist changes detected"
    exit 0
fi

# Configure git (if not already configured)
git config user.email "auto-sync@verify.cxc-ai.com"
git config user.name "Catalog Verification Auto-Sync"

# Stage picklist changes
git add "$PICKLIST_DIR"/*.json

# Count changes
ATTRS=$(git diff --cached --numstat | grep attributes.json | awk '{print $1+$2}')
BRANDS=$(git diff --cached --numstat | grep brands.json | awk '{print $1+$2}')
CATS=$(git diff --cached --numstat | grep categories.json | awk '{print $1+$2}')
STYLES=$(git diff --cached --numstat | grep styles.json | awk '{print $1+$2}')

TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

# Commit with descriptive message
git commit -m "Auto-sync picklists from Salesforce [$TIMESTAMP]

Changes:
- Attributes: ${ATTRS:-0} lines
- Brands: ${BRANDS:-0} lines  
- Categories: ${CATS:-0} lines
- Styles: ${STYLES:-0} lines

Triggered by Salesforce picklist sync to production."

# Push to GitHub
git push origin main

echo "✅ Picklists auto-committed and pushed to GitHub"
