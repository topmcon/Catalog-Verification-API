#!/bin/bash
###############################################################################
# COMPREHENSIVE PRE-DEPLOYMENT VALIDATOR
# Combines all validation scripts into single comprehensive check
# Run this before EVERY deployment
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║           COMPREHENSIVE PRE-DEPLOYMENT VALIDATION                  ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Track if we should abort deployment
ABORT_DEPLOYMENT=false

# ============================================================================
# Helper function to run a check
# ============================================================================
run_check() {
  local check_name="$1"
  local check_command="$2"
  local is_critical="${3:-true}"  # Default to critical
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "CHECK #$TOTAL_CHECKS: $check_name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  if eval "$check_command"; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo ""
    echo "✅ CHECK #$TOTAL_CHECKS PASSED"
  else
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    echo ""
    echo "❌ CHECK #$TOTAL_CHECKS FAILED"
    
    if [ "$is_critical" = "true" ]; then
      echo "   🚨 CRITICAL FAILURE - Deployment will be aborted"
      ABORT_DEPLOYMENT=true
    else
      echo "   ⚠️  WARNING - Review before proceeding"
    fi
  fi
}

# ============================================================================
# CHECK 1: TypeScript Compilation
# Uses ./node_modules/.bin/tsc directly — bare `tsc` is not on PATH on production
# and `npm run build` fails there whenever devDeps were pruned (OVS-03 / G0 fix).
# ============================================================================
run_check "TypeScript Compilation (typecheck)" \
  "./node_modules/.bin/tsc --noEmit" \
  "true"

# ============================================================================
# CHECK 1b: Unit Tests (jest) — G0: a red suite can't gate anything;
# this wires `npm test` into the deploy procedure for the first time.
# ============================================================================
run_check "Unit Tests (jest)" \
  "npx jest --silent" \
  "true"

# ============================================================================
# CHECK 2: Dependency Consistency
# ============================================================================
run_check "Dependency Consistency (Picklists, Types, Mappings)" \
  "bash scripts/validate-dependencies.sh" \
  "true"

# ============================================================================
# CHECK 3: Feature Completeness
# ============================================================================
run_check "Feature Completeness (Declared vs Implemented)" \
  "node scripts/audit-declared-vs-implemented.js" \
  "true"

# ============================================================================
# CHECK 4: Title System Runtime Test
# ============================================================================
run_check "Title System Runtime Test (All 177 Categories)" \
  "node scripts/audit-title-system.js" \
  "true"

# ============================================================================
# CHECK 5: Title Generation Validation
# ============================================================================
run_check "Title Generation Validation (Sample Data)" \
  "node scripts/test-title-generation.js" \
  "true"

# ============================================================================
# CHECK 6: Picklist Field Validation
# ============================================================================
run_check "Picklist Field Name Validation" \
  "node scripts/audit-picklist-fields.js" \
  "false"  # Non-critical

# ============================================================================
# CHECK 7: Hardcoded Lists Sync Check
# ============================================================================
run_check "Hardcoded Lists Sync Check" \
  "node scripts/regenerate-hardcoded-lists.js --check" \
  "false"  # Non-critical

# ============================================================================
# CHECK 8: Field Mapping Reference Sync
# ============================================================================
run_check "Field Mapping Reference Sync" \
  "node scripts/audit-field-mapping-reference.js --check" \
  "false"  # Non-critical — doc out of sync is a warning, not a blocker

# ============================================================================
# CHECK 9: Style Cross-Reference (category-style-mapping vs styles.json)
# ============================================================================
run_check "Style Cross-Reference (Mapping vs Picklist)" \
  "node scripts/audit-style-crossref.js" \
  "true"  # Critical — missing styles break picklist matcher

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                    VALIDATION SUMMARY                              ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Total Checks:       $TOTAL_CHECKS"
echo "Passed:             $PASSED_CHECKS ✅"
echo "Failed:             $FAILED_CHECKS ❌"
echo ""

if [ "$ABORT_DEPLOYMENT" = "true" ]; then
  echo "╔═══════════════════════════════════════════════════════════════════╗"
  echo "║                  🚫 DEPLOYMENT BLOCKED 🚫                          ║"
  echo "╚═══════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Critical failures detected. Fix the issues above before deploying."
  echo ""
  exit 1
elif [ "$FAILED_CHECKS" -gt 0 ]; then
  echo "╔═══════════════════════════════════════════════════════════════════╗"
  echo "║             ⚠️  WARNINGS DETECTED - REVIEW REQUIRED ⚠️             ║"
  echo "╚═══════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Non-critical warnings found. Review and proceed with caution."
  echo ""
  exit 0
else
  echo "╔═══════════════════════════════════════════════════════════════════╗"
  echo "║            ✅ ALL CHECKS PASSED - SAFE TO DEPLOY ✅                ║"
  echo "╚═══════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "All validation checks passed successfully!"
  echo ""
  exit 0
fi
