#!/bin/bash

###############################################################################
# DEPENDENCY CHECKLIST VALIDATOR
# 
# Purpose: Quick check of critical dependencies before deployment
# Usage: bash scripts/quick-dependency-check.sh
# 
# This script provides a rapid health check of the most critical dependencies
# For comprehensive validation, use: bash scripts/pre-deploy-validate-all.sh
###############################################################################

set -e  # Exit on error

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       DEPENDENCY CHECKLIST VALIDATOR (Quick Check)            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Reference: docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Check function
check() {
  local check_name="$1"
  local check_command="$2"
  local is_critical="${3:-false}"  # Default non-critical
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  echo -n "🔍 Checking: $check_name ... "
  
  if eval "$check_command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    return 0
  else
    if [ "$is_critical" = "true" ]; then
      echo -e "${RED}❌ FAIL (CRITICAL)${NC}"
      FAILED_CHECKS=$((FAILED_CHECKS + 1))
      return 1
    else
      echo -e "${YELLOW}⚠️  WARNING${NC}"
      WARNING_CHECKS=$((WARNING_CHECKS + 1))
      return 0
    fi
  fi
}

cd "$PROJECT_ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  CRITICAL FILE EXISTENCE CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Core service files
check "dual-ai-verification.service.ts" "test -f src/services/dual-ai-verification.service.ts" true
check "seo-title-generator.service.ts" "test -f src/services/seo-title-generator.service.ts" true
check "title-schema-by-category.ts" "test -f src/config/title-schema-by-category.ts" true

# Size class system
check "category-size-classes.ts" "test -f src/config/category-size-classes.ts" true
check "size-class-rounder.ts" "test -f src/utils/size-class-rounder.ts" true

# Picklist files
check "categories.json" "test -f src/config/salesforce-picklists/categories.json" true
check "brands.json" "test -f src/config/salesforce-picklists/brands.json" true
check "styles.json" "test -f src/config/salesforce-picklists/styles.json" true
check "types.json" "test -f src/config/salesforce-picklists/types.json" true
check "attributes.json" "test -f src/config/salesforce-picklists/attributes.json" true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  INTEGRATION POINT CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check size class imports
check "getSizeClassConfig imports" "grep -r 'getSizeClassConfig' src/**/*.ts | wc -l | awk '{exit !(\$1 == 9)}'" false
check "roundToStandardSize imports" "grep -r 'roundToStandardSize' src/**/*.ts | wc -l | awk '{exit !(\$1 == 8)}'" false

# Check AI_Product_Filter_Class field exists
check "AI_Product_Filter_Class in types" "grep -q 'AI_Product_Filter_Class' src/types/salesforce.types.ts" true
check "AI_Product_Filter_Class in dual-AI" "grep -q 'AI_Product_Filter_Class' src/services/dual-ai-verification.service.ts" true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  VALIDATION SCRIPT CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Validation scripts exist
check "pre-deploy-validate-all.sh" "test -f scripts/pre-deploy-validate-all.sh" true
check "validate-dependencies.sh" "test -f scripts/validate-dependencies.sh" true
check "audit-picklist-fields.js" "test -f scripts/audit-picklist-fields.js" false
check "regenerate-hardcoded-lists.js" "test -f scripts/regenerate-hardcoded-lists.js" false
check "validate-size-classes.js" "test -f scripts/validate-size-classes.js" false
check "test-size-class-rounding.js" "test -f scripts/test-size-class-rounding.js" false

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  DOCUMENTATION CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Master Architecture Checklist" "test -f docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md" true
check "Audit Findings Document" "test -f docs/AUDIT-FINDINGS-AND-SOLUTIONS.md" false
check "Complete Verification Process Tree" "test -f docs/architecture/COMPLETE-VERIFICATION-PROCESS-TREE.md" false

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  PICKLIST STRUCTURE CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check picklist JSON structure (basic validation)
check "categories.json valid JSON" "jq empty src/config/salesforce-picklists/categories.json" true
check "brands.json valid JSON" "jq empty src/config/salesforce-picklists/brands.json" true
check "types.json valid JSON" "jq empty src/config/salesforce-picklists/types.json" true

# Check for key fields
check "categories have category_id" "jq -e '.[0].category_id' src/config/salesforce-picklists/categories.json" false
check "brands have brand_id" "jq -e '.[0].brand_id' src/config/salesforce-picklists/brands.json" false

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                       RESULTS SUMMARY                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Total Checks:    $TOTAL_CHECKS"
echo -e "${GREEN}Passed:          $PASSED_CHECKS${NC}"
echo -e "${YELLOW}Warnings:        $WARNING_CHECKS${NC}"
echo -e "${RED}Failed:          $FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -gt 0 ]; then
  echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ QUICK CHECK FAILED - Critical issues detected             ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "⚠️  DO NOT DEPLOY - Fix critical failures first"
  echo ""
  echo "Next Steps:"
  echo "1. Review failed checks above"
  echo "2. Fix critical issues"
  echo "3. Run comprehensive validation:"
  echo "   bash scripts/pre-deploy-validate-all.sh"
  echo ""
  exit 1
elif [ $WARNING_CHECKS -gt 0 ]; then
  echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║  ⚠️  QUICK CHECK PASSED WITH WARNINGS                         ║${NC}"
  echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "✅ Critical dependencies OK"
  echo "⚠️  Some non-critical checks have warnings"
  echo ""
  echo "Recommended Next Steps:"
  echo "1. Review warnings above"
  echo "2. Run comprehensive validation:"
  echo "   bash scripts/pre-deploy-validate-all.sh"
  echo "3. Proceed with deployment if comprehensive validation passes"
  echo ""
  exit 0
else
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅ QUICK CHECK PASSED - All critical dependencies OK         ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "✨ All quick checks passed!"
  echo ""
  echo "Before deployment, also run comprehensive validation:"
  echo "   bash scripts/pre-deploy-validate-all.sh"
  echo ""
  echo "📋 Reference: docs/architecture/MASTER-ARCHITECTURE-VERIFICATION-CHECKLIST.md"
  echo ""
  exit 0
fi
