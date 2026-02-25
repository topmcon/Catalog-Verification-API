#!/bin/bash

# Monitor Failed Job Retests
# Tracks the 27 failed jobs being re-sent through the system

echo "=================================================="
echo "🔍 LIVE MONITORING: Failed Job Re-Tests"
echo "=================================================="
echo ""
echo "Monitoring for these model numbers:"
echo "  - W92403, W4018 (Towel Warmers)"
echo "  - LD6004W5BK, 462-1S-CH, TW1051BBS (Wall Sconces)"
echo "  - DW80R5061UG, JDAF5924RM, DW24XV (Dishwashers)"
echo "  - Plus 18 more items..."
echo ""
echo "Waiting for Salesforce to send requests..."
echo "=================================================="
echo ""

# Model numbers to track
MODELS=(
  "W92403"
  "W4018"
  "10209"
  "P5755108"
  "TW1051BBS"
  "462-1S-CH"
  "LD6004W5BK"
  "LD6004W6C"
  "DR536-BNW"
  "2915OZ"
  "6347900"
  "46771-01"
  "LIJ42"
  "TK928HB"
  "24F"
  "DW80R5061UG"
  "JDAF5924RM"
  "DW24XV"
  "FAB28UPBL1"
  "STU8623X"
  "ZDT925SPNCSS"
  "ZDT985SINII"
  "DW80M9960US"
  "DW80R9950US"
  "AGSR36WH"
  "TK30NDB1"
  "LRONC0605V"
)

# Track results
RESULTS_FILE="/tmp/retest-results-$(date +%Y%m%d-%H%M%S).txt"
echo "Retest Results - Started $(date)" > "$RESULTS_FILE"
echo "========================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

# Counter
FOUND_COUNT=0

# Monitor in real-time
tail -f /opt/catalog-verification-api/logs/combined.log | while read line; do
  # Check if line contains verification completion
  if echo "$line" | grep -q "VERIFICATION COMPLETE"; then
    # Extract model number
    MODEL=$(echo "$line" | grep -oP 'SF_Catalog_Name:\s*\K[^,}]+' | tr -d '"' | xargs)
    
    # Check if it's one of our tracked models
    for target_model in "${MODELS[@]}"; do
      if [ "$MODEL" = "$target_model" ]; then
        FOUND_COUNT=$((FOUND_COUNT + 1))
        TIMESTAMP=$(echo "$line" | grep -oP '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z')
        
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ Job $FOUND_COUNT/27 COMPLETED: $MODEL"
        echo "   Time: $TIMESTAMP"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Extract status and score
        sleep 1  # Brief delay to let full log write
        RECENT_LOGS=$(tail -100 /opt/catalog-verification-api/logs/combined.log)
        
        STATUS=$(echo "$RECENT_LOGS" | grep "$MODEL" | grep -oP 'verification_status":\s*"\K[^"]+' | tail -1)
        SCORE=$(echo "$RECENT_LOGS" | grep "$MODEL" | grep -oP 'verification_score":\s*\K[0-9]+' | tail -1)
        
        if [ -n "$STATUS" ]; then
          echo "   Status: $STATUS"
          echo "   Score: $SCORE"
          
          # Log to file
          echo "Model: $MODEL | Status: $STATUS | Score: $SCORE | Time: $TIMESTAMP" >> "$RESULTS_FILE"
          
          # Check if it's a status change from failed
          if [ "$STATUS" = "verified" ] || [ "$STATUS" = "needs_review" ]; then
            echo "   🎉 IMPROVEMENT: Was 'failed', now '$STATUS'"
          elif [ "$STATUS" = "failed" ]; then
            echo "   ⚠️  STILL FAILED: Needs investigation"
          fi
        fi
        
        echo ""
        
        # Check if we've found all 27
        if [ $FOUND_COUNT -eq 27 ]; then
          echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          echo "🎯 ALL 27 JOBS COMPLETED!"
          echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          echo ""
          echo "Results saved to: $RESULTS_FILE"
          cat "$RESULTS_FILE"
          exit 0
        fi
      fi
    done
  fi
done
