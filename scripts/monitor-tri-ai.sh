#!/bin/bash
# Tri-AI Architecture Monitor
# Tracks OpenAI + xAI analysts → Claude judge performance

echo "=== TRI-AI ARCHITECTURE MONITOR ==="
echo "Deployment: $(date)"
echo ""

# Get production logs
LOGS=$(ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "cat /opt/catalog-verification-api/logs/combined.log")

echo "📊 ACTIVITY SUMMARY"
echo "==================="
echo "OpenAI analyses:  $(echo "$LOGS" | grep -c 'analyzeWithOpenAI')"
echo "xAI analyses:     $(echo "$LOGS" | grep -c 'analyzeWithXAI')"
echo "Claude judgments: $(echo "$LOGS" | grep -c 'claudeReviewAndJudge')"
echo ""

echo "🎯 CONSENSUS METRICS"
echo "===================="
echo "Approvals:        $(echo "$LOGS" | grep -c 'Decision: approve')"
echo "Escalations:      $(echo "$LOGS" | grep -c 'Decision: escalate')"
echo "Semantic matches: $(echo "$LOGS" | grep -c 'semantic agreement detected')"
echo ""

echo "⚠️  ERROR TRACKING"
echo "=================="
echo "xAI errors:       $(echo "$LOGS" | grep -c 'xAI.*error')"
echo "grok-2-latest:    $(echo "$LOGS" | grep -c 'grok-2-latest')"
echo "grok-3:           $(echo "$LOGS" | grep -c 'grok-3')"
echo ""

echo "📈 RECENT ACTIVITY (Last 10 tri-AI decisions)"
echo "=============================================="
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -200 /opt/catalog-verification-api/logs/combined.log" | grep -E 'Decision: (approve|escalate)|consensus achieved|semantic agreement' | tail -10

echo ""
echo "🔄 LIVE LOG STREAM (Press Ctrl+C to stop)"
echo "=========================================="
ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "tail -f /opt/catalog-verification-api/logs/combined.log" | grep --line-buffered -E 'tri-AI|OpenAI.*xAI|Claude|judge|Decision:'
