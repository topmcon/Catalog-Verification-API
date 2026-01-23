#!/bin/bash
# Extract raw input/output data from the 4 most recent Salesforce API calls

echo "==================================="
echo "EXTRACTING 4 MOST RECENT API CALLS"
echo "==================================="

# The 4 catalog IDs from the logs
CALL_IDS=(
  "a03aZ00000Nk21gQAB"  # Jan 22, 5:59 PM - Chandelier - Score 95
  "a03Hu00001N2EY9IAN"  # Jan 22, 12:46 PM - Score 94
  "a03Hu00001N1rXxIAJ"  # Jan 22, 9:44 AM - Dishwasher DW24T3IXV - Score 94
  "a03Hu00001N1rXxIAJ"  # Jan 22, 9:36 AM - Same dishwasher - Score 97
)

for i in "${!CALL_IDS[@]}"; do
  CATALOG_ID="${CALL_IDS[$i]}"
  CALL_NUM=$((i + 1))
  
  echo ""
  echo "========================================="
  echo "CALL #${CALL_NUM}: ${CATALOG_ID}"
  echo "========================================="
  
  # Extract from production logs (last occurrence of this catalog ID)
  ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com "
    # Find the request body
    echo '=== INPUT DATA ===' &&
    grep -A 200 'catalogId.*${CATALOG_ID}' /opt/catalog-verification-api/logs/combined.log | \
    grep -A 150 'Starting Dual AI' | \
    head -50 &&
    echo '' &&
    echo '=== OUTPUT DATA ===' &&
    grep -A 100 'catalogId.*${CATALOG_ID}' /opt/catalog-verification-api/logs/combined.log | \
    grep -A 80 'verification completed' | \
    head -30
  " > "/tmp/api-call-${CALL_NUM}-${CATALOG_ID}.log" 2>&1
  
  echo "Saved to: /tmp/api-call-${CALL_NUM}-${CATALOG_ID}.log"
done

echo ""
echo "==================================="
echo "EXTRACTION COMPLETE"
echo "==================================="
echo "Files saved in /tmp/"
ls -lh /tmp/api-call-*.log
