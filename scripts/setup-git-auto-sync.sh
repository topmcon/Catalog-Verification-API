#!/bin/bash
# setup-git-auto-sync.sh
# One-time setup script to enable automatic picklist sync to GitHub
# Run this on the production server

set -e

REPO_DIR="/opt/catalog-verification-api"

echo "Setting up Git auto-sync for picklist files..."

cd "$REPO_DIR"

# Configure git identity
git config user.email "api@verify.cxc-ai.com"
git config user.name "Catalog Verification API (Auto-Sync)"

# Make the auto-sync script executable
chmod +x "$REPO_DIR/scripts/auto-sync-picklists.sh"

# Create logs directory if it doesn't exist
mkdir -p "$REPO_DIR/logs"

echo ""
echo "=========================================="
echo "Git auto-sync setup complete!"
echo ""
echo "IMPORTANT: GitHub Authentication Required"
echo "=========================================="
echo ""
echo "To enable automatic push to GitHub, you need to configure authentication."
echo ""
echo "Option 1: GitHub Personal Access Token (Recommended)"
echo "  1. Create a token at: https://github.com/settings/tokens"
echo "  2. Give it 'repo' scope"
echo "  3. Update the remote URL:"
echo "     git remote set-url origin https://YOUR_TOKEN@github.com/topmcon/Catalog-Verification-API.git"
echo ""
echo "Option 2: Deploy Key (More secure for automation)"
echo "  1. Generate a deploy key: ssh-keygen -t ed25519 -f ~/.ssh/github_deploy"
echo "  2. Add the public key to the repo's deploy keys (with write access)"
echo "  3. Update remote: git remote set-url origin git@github.com:topmcon/Catalog-Verification-API.git"
echo "  4. Configure SSH to use the key"
echo ""
echo "After setup, test with:"
echo "  cd $REPO_DIR && bash scripts/auto-sync-picklists.sh"
echo ""
