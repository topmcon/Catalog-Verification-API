#!/bin/bash

# Daily Health Check Script
# Runs via cron at 8am EST daily
# Purpose: Automated system health monitoring

DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M:%S)
LOG_DIR="/opt/catalog-verification-api/logs"
HEALTH_LOG="$LOG_DIR/health-check-$DATE.log"

echo "================================================================================" > $HEALTH_LOG
echo "DAILY HEALTH CHECK: $DATE $TIME" >> $HEALTH_LOG
echo "================================================================================" >> $HEALTH_LOG
echo "" >> $HEALTH_LOG

# 1. Check service status
echo "🔧 SERVICE STATUS:" >> $HEALTH_LOG
echo "" >> $HEALTH_LOG
if systemctl is-active --quiet catalog-verification; then
  echo "   ✅ catalog-verification service: RUNNING" >> $HEALTH_LOG
else
  echo "   🚨 catalog-verification service: STOPPED" >> $HEALTH_LOG
  systemctl status catalog-verification | head -20 >> $HEALTH_LOG
fi

if systemctl is-active --quiet nginx; then
  echo "   ✅ nginx service: RUNNING" >> $HEALTH_LOG
else
  echo "   🚨 nginx service: STOPPED" >> $HEALTH_LOG
fi

if docker ps | grep -q mongodb; then
  echo "   ✅ MongoDB container: RUNNING" >> $HEALTH_LOG
else
  echo "   🚨 MongoDB container: STOPPED" >> $HEALTH_LOG
fi
echo "" >> $HEALTH_LOG

# 2. Check port availability
echo "🌐 PORT AVAILABILITY:" >> $HEALTH_LOG
echo "" >> $HEALTH_LOG
ss -tlnp | grep -E '(3001|27017|443|80)' >> $HEALTH_LOG
echo "" >> $HEALTH_LOG

# 3. Check API health endpoint
echo "🏥 API HEALTH ENDPOINT:" >> $HEALTH_LOG
echo "" >> $HEALTH_LOG
HEALTH_RESPONSE=$(curl -s https://verify.cxc-ai.com/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
  echo "   ✅ API responding: $HEALTH_RESPONSE" >> $HEALTH_LOG
else
  echo "   🚨 API not responding or unhealthy: $HEALTH_RESPONSE" >> $HEALTH_LOG
fi
echo "" >> $HEALTH_LOG

# 4. Run daily job statistics
echo "📊 DAILY JOB STATISTICS:" >> $HEALTH_LOG
echo "" >> $HEALTH_LOG
cd /opt/catalog-verification-api
node scripts/daily-job-stats.js >> $HEALTH_LOG 2>&1

# 5. Check for recent errors in logs
echo "" >> $HEALTH_LOG
echo "❌ RECENT ERRORS (last 100 lines):" >> $HEALTH_LOG
echo "" >> $HEALTH_LOG
tail -100 $LOG_DIR/error.log 2>/dev/null | grep -i "error" | tail -20 >> $HEALTH_LOG

# 6. Check disk space
echo "" >> $HEALTH_LOG
echo "💾 DISK SPACE:" >> $HEALTH_LOG
echo "" >> $HEALTH_LOG
df -h | grep -E '(Filesystem|/$)' >> $HEALTH_LOG

# 7. Check memory usage
echo "" >> $HEALTH_LOG
echo "🧠 MEMORY USAGE:" >> $HEALTH_LOG
echo "" >> $HEALTH_LOG
free -h >> $HEALTH_LOG

# 8. Determine overall status
echo "" >> $HEALTH_LOG
echo "================================================================================" >> $HEALTH_LOG
echo "OVERALL STATUS" >> $HEALTH_LOG
echo "================================================================================" >> $HEALTH_LOG
echo "" >> $HEALTH_LOG

if grep -q "CRITICAL" $HEALTH_LOG; then
  echo "🚨 STATUS: CRITICAL - IMMEDIATE ACTION REQUIRED" >> $HEALTH_LOG
  echo "" >> $HEALTH_LOG
  echo "Critical issues detected. Review log file: $HEALTH_LOG" >> $HEALTH_LOG
  
  # TODO: Send alert email/Slack notification
  # echo "CRITICAL: Health check failed on $DATE" | mail -s "Production Alert" admin@example.com
  
  exit 1
elif grep -q "WARNING" $HEALTH_LOG; then
  echo "⚠️  STATUS: WARNING - ATTENTION NEEDED" >> $HEALTH_LOG
  echo "" >> $HEALTH_LOG
  echo "System degraded. Review log file: $HEALTH_LOG" >> $HEALTH_LOG
  exit 0
else
  echo "✅ STATUS: HEALTHY" >> $HEALTH_LOG
  echo "" >> $HEALTH_LOG
  echo "All systems operating normally." >> $HEALTH_LOG
  exit 0
fi
