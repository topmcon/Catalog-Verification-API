# Setting Up Copilot Instructions for Production-First Workflows

This guide explains how to set up the "Establish Connection" and "Save Everything" workflows for any repository, with instructions for different deployment methods.

---

## What This Setup Provides

1. **Establish Connection** - Quick command to check system status:
   - SSH connectivity
   - Commit sync (local vs GitHub vs production)
   - Service health
   - Recent session context

2. **Save Everything** - One command to wrap up work:
   - Create session summary for handoff
   - Commit and push to GitHub
   - Deploy to production
   - Verify sync

---

## Step 1: Determine Your Deployment Method

### Method A: Git-Based Deployment (like Catalog-Verification-API)
Production server has git repo, you `git pull` to deploy.

```
Local → git push → GitHub → ssh + git pull → Production
```

**Check if you use this:**
```bash
ssh user@server "ls -la /path/to/app/.git"
# If .git folder exists, you're using git-based deployment
```

### Method B: Rsync Deployment
No git on production, files copied via rsync.

```
Local → git push → GitHub → rsync → Production
```

**Check if you use this:**
```bash
ssh user@server "ls -la /path/to/app/.git"
# If .git folder doesn't exist, you're using rsync
```

### Method C: Docker Deployment
Production runs containers, deploy via docker pull.

```
Local → git push → GitHub → CI builds image → docker pull → Production
```

---

## Step 2: Gather Your Configuration Values

Fill in this table for your project:

| Value | Your Setting |
|-------|--------------|
| Project name | _______________ |
| Server domain | _______________ |
| SSH key path | _______________ |
| SSH user | _______________ |
| Deploy path on server | _______________ |
| Systemd service name | _______________ |
| API port | _______________ |
| Health check URL | _______________ |
| Build command | _______________ |

---

## Step 3: Create Your copilot-instructions.md

### For Git-Based Deployment (Method A)

```markdown
# Copilot Instructions - [PROJECT_NAME]

## ⚠️ PRODUCTION-FIRST OPERATIONS

**ALWAYS DEFAULT TO PRODUCTION SERVER** unless explicitly told otherwise.

---

## SSH Access

ssh -i [SSH_KEY_PATH] [SSH_USER]@[SERVER_DOMAIN]

---

## Establish Connection Procedure

When user says "Establish Connection":

1. **SSH Connectivity**:
   ssh -i [SSH_KEY_PATH] [SSH_USER]@[SERVER_DOMAIN] "echo connected"

2. **Compare Commits**:
   LOCAL=$(git rev-parse --short HEAD)
   GITHUB=$(git ls-remote origin main | cut -c1-7)
   PROD=$(ssh -i [SSH_KEY_PATH] [SSH_USER]@[SERVER_DOMAIN] "cat [DEPLOY_PATH]/.git/refs/heads/main | cut -c1-7")
   echo "LOCAL: $LOCAL | GITHUB: $GITHUB | PROD: $PROD"

3. **Service Health**:
   ssh -i [SSH_KEY_PATH] [SSH_USER]@[SERVER_DOMAIN] "systemctl status [SERVICE_NAME] | head -10"

4. **API Health**:
   curl -s https://[SERVER_DOMAIN]/health

5. **Find latest session summary** in session-notes/ folder

---

## Save Everything Procedure

When user says "Save everything":

1. Create session summary in session-notes/SESSION-SUMMARY-YYYY-MM-DD.md
2. git add -A && git commit -m "..." && git push origin main
3. Deploy:
   ssh -i [SSH_KEY_PATH] [SSH_USER]@[SERVER_DOMAIN] \
     "cd [DEPLOY_PATH] && git pull origin main && npm install && npm run build && systemctl restart [SERVICE_NAME]"
4. Verify sync (all three commits match)
5. Health check
```

### For Rsync Deployment (Method B)

```markdown
# Copilot Instructions - [PROJECT_NAME]

## ⚠️ PRODUCTION-FIRST OPERATIONS

**ALWAYS DEFAULT TO PRODUCTION SERVER** unless explicitly told otherwise.

---

## SSH Access

ssh -i [SSH_KEY_PATH] [SSH_USER]@[SERVER_DOMAIN]

---

## Establish Connection Procedure

When user says "Establish Connection":

1. **SSH Connectivity**:
   ssh -i [SSH_KEY_PATH] [SSH_USER]@[SERVER_DOMAIN] "echo connected"

2. **Compare Commits** (GitHub only - no git on production):
   LOCAL=$(git rev-parse --short HEAD)
   GITHUB=$(git ls-remote origin main | cut -c1-7)
   # No production commit check - rsync doesn't track git

3. **Check Deployed Version** (use a version file or timestamp):
   ssh -i [SSH_KEY_PATH] [SSH_USER]@[SERVER_DOMAIN] "cat [DEPLOY_PATH]/version.txt 2>/dev/null || stat -c '%y' [DEPLOY_PATH]/[MAIN_FILE]"

4. **Service Health**:
   ssh -i [SSH_KEY_PATH] [SSH_USER]@[SERVER_DOMAIN] "systemctl status [SERVICE_NAME] | head -10"

5. **API Health**:
   curl -s https://[SERVER_DOMAIN]/health

6. **Find latest session summary** in session-notes/ folder

---

## Save Everything Procedure

When user says "Save everything":

1. Create session summary in session-notes/SESSION-SUMMARY-YYYY-MM-DD.md
2. git add -A && git commit -m "..." && git push origin main
3. Build locally (if needed): npm run build
4. Deploy via rsync:
   rsync -avz --delete \
     --exclude 'node_modules' \
     --exclude '.git' \
     --exclude 'logs' \
     -e "ssh -i [SSH_KEY_PATH]" \
     ./ [SSH_USER]@[SERVER_DOMAIN]:[DEPLOY_PATH]/
5. Restart service:
   ssh -i [SSH_KEY_PATH] [SSH_USER]@[SERVER_DOMAIN] "cd [DEPLOY_PATH] && npm install --production && systemctl restart [SERVICE_NAME]"
6. Update version marker:
   ssh -i [SSH_KEY_PATH] [SSH_USER]@[SERVER_DOMAIN] "echo $(git rev-parse --short HEAD) > [DEPLOY_PATH]/version.txt"
7. Health check
```

---

## Step 4: Key Differences to Handle

### Git vs Rsync Sync Verification

**Git-based** can verify 3-way sync:
```bash
LOCAL=$(git rev-parse --short HEAD)
GITHUB=$(git ls-remote origin main | cut -c1-7)
PROD=$(ssh ... "cat /path/.git/refs/heads/main | cut -c1-7")
# Compare all three
```

**Rsync-based** needs a version file:
```bash
# Create version.txt during deploy
echo $(git rev-parse --short HEAD) > version.txt
rsync ...

# Check during establish connection
DEPLOYED=$(ssh ... "cat /path/version.txt")
```

### Build Location

**Git-based**: Build on server after git pull
```bash
ssh ... "cd /path && npm run build"
```

**Rsync-based**: Usually build locally, then rsync dist/
```bash
npm run build
rsync -avz ./dist/ user@server:/path/dist/
```

---

## Step 5: Test Your Commands

Before finalizing, test each command:

```bash
# 1. SSH works?
ssh -i ~/.ssh/your_key user@server "echo OK"

# 2. Can read service status?
ssh -i ~/.ssh/your_key user@server "systemctl status your-service"

# 3. Health endpoint works?
curl -s https://your-domain.com/health

# 4. Deploy command works?
# (test with a small change first)
```

---

## Our Current Setup (Catalog-Verification-API)

For reference, here's what we use:

| Setting | Value |
|---------|-------|
| Method | Git-based deployment |
| Server | verify.cxc-ai.com |
| SSH Key | ~/.ssh/cxc_ai_deploy |
| SSH User | root |
| Deploy Path | /opt/catalog-verification-api |
| Service | catalog-verification |
| Port | 3001 |
| Health | https://verify.cxc-ai.com/health |
| Build | npm run build (TypeScript) |

**Deploy command:**
```bash
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \
  "cd /opt/catalog-verification-api && \
   git pull origin main && \
   npm install && \
   npm run build && \
   systemctl restart catalog-verification"
```

**Sync verification:**
```bash
LOCAL=$(git rev-parse --short HEAD)
GITHUB=$(git ls-remote origin main | cut -c1-7)
PROD=$(ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cat /opt/catalog-verification-api/.git/refs/heads/main | cut -c1-7")
```

---

## Troubleshooting

### "Can't read .git/refs/heads/main on production"
You're using rsync deployment, not git. Use a version.txt file instead.

### "Permission denied on SSH"
- Check key path is correct
- Check key has correct permissions: `chmod 600 ~/.ssh/your_key`
- Verify the key is added on server's authorized_keys

### "Service restart fails"
- Verify service name: `systemctl list-units | grep your-service`
- Check if service file exists: `ls /etc/systemd/system/your-service.service`

### "Health check fails after deploy"
- Service might need time to start: add `sleep 3` before health check
- Check logs: `journalctl -u your-service -n 50`
