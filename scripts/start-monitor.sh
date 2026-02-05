#!/bin/bash

# Quick Start - Real-Time Response Quality Monitor
# Run this on production while making Salesforce verification calls

echo "=================================================="
echo "🚀 STARTING REAL-TIME RESPONSE QUALITY MONITOR"
echo "=================================================="
echo ""
echo "This will show live tracking of inconclusive AI responses"
echo "as Salesforce verifications happen."
echo ""
echo "You'll see:"
echo "  📈 Summary statistics (total, this session, last minute)"
echo "  🏷️  Breakdown by type (N/A, Unknown, Not Found, etc.)"
echo "  🤖 Breakdown by AI provider (OpenAI, xAI, Both)"
echo "  🔴 Top problematic fields"
echo "  🔔 Recent activity stream (last 5 responses)"
echo ""
echo "Updates every 2 seconds automatically."
echo "Press Ctrl+C to stop monitoring."
echo ""
echo "=================================================="
echo ""

# Run the monitor
npm run monitor-response-quality
