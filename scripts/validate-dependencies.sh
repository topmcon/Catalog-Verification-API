#!/bin/bash
###############################################################################
# DEPENDENCY VALIDATOR
# Comprehensive check that all dependent files are in sync
# Run before every deployment to catch missing updates
###############################################################################

set -e

ERRORS=0
WARNINGS=0
VERBOSE=0
CHECK_CATEGORY=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose)
      VERBOSE=1
      shift
      ;;
    --check-types)
      CHECK_CATEGORY="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║          DEPENDENCY VALIDATION AUDIT                               ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

###############################################################################
# 1. PICKLIST → TYPE MAPPING CONSISTENCY
###############################################################################
echo "🔗 Checking Picklist → Type Mapping Consistency..."

# Check that all types in category-type-mapping exist in types.json
TYPES_IN_MAPPING=$(grep -oP '"type_name":\s*"\K[^"]+' src/config/salesforce-picklists/category-type-mapping.json | sort -u)
TYPES_IN_MASTER=$(grep -oP '"type_name":\s*"\K[^"]+' src/config/salesforce-picklists/types.json | sort -u)

MISSING_TYPES=0
while IFS= read -r type; do
  if ! echo "$TYPES_IN_MASTER" | grep -qFx "$type"; then
    if [ $MISSING_TYPES -eq 0 ]; then
      echo "  ❌ Types in category-type-mapping.json NOT found in types.json:"
    fi
    echo "     - $type"
    MISSING_TYPES=$((MISSING_TYPES + 1))
  fi
done <<< "$TYPES_IN_MAPPING"

if [ $MISSING_TYPES -eq 0 ]; then
  echo "  ✅ All types in mapping exist in master types.json"
else
  echo "  ❌ $MISSING_TYPES type(s) missing from types.json"
  ERRORS=$((ERRORS + 1))
fi

###############################################################################
# 2. TYPE MATCHER KEYWORD COVERAGE
###############################################################################
echo "🎯 Checking Type Matcher Keyword Coverage..."

# Extract types from Refrigerator category (most likely to need keywords)
REFRIGERATOR_TYPES=$(grep -A 500 '"category_name": "Refrigerator"' src/config/salesforce-picklists/category-type-mapping.json | grep -oP '"type_name":\s*"\K[^"]+' | head -20)

MISSING_KEYWORDS=0
for type in $REFRIGERATOR_TYPES; do
  type_lower=$(echo "$type" | tr '[:upper:]' '[:lower:]')
  # Check if type has keyword mapping
  if ! grep -qi "'$type_lower'" src/services/type-matcher.service.ts && 
     ! grep -qi "$(echo $type | sed 's/ /.*/')" src/services/type-matcher.service.ts; then
    if [ $MISSING_KEYWORDS -eq 0 ]; then
      echo "  ⚠️  Types missing keyword mappings in type-matcher.service.ts:"
    fi
    echo "     - $type"
    MISSING_KEYWORDS=$((MISSING_KEYWORDS + 1))
  fi
done

if [ $MISSING_KEYWORDS -eq 0 ]; then
  echo "  ✅ Refrigerator types have keyword mappings"
else
  echo "  ⚠️  $MISSING_KEYWORDS refrigerator type(s) may need keyword mappings"
  WARNINGS=$((WARNINGS + 1))
fi

###############################################################################
# 3. AI PROMPT MENTIONS NEW TYPES
###############################################################################
echo "🤖 Checking AI Prompt Coverage..."

if [ -n "$CHECK_CATEGORY" ]; then
  echo "  Checking $CHECK_CATEGORY types are mentioned in AI prompts..."
  CAT_TYPES=$(grep -A 500 "\"category_name\": \"$CHECK_CATEGORY\"" src/config/salesforce-picklists/category-type-mapping.json | grep -oP '"type_name":\s*"\K[^"]+' | head -20)
  
  MISSING_PROMPT=0
  for type in $CAT_TYPES; do
    if ! grep -qi "$type" src/services/dual-ai-verification.service.ts; then
      if [ $MISSING_PROMPT -eq 0 ]; then
        echo "  ⚠️  Types for $CHECK_CATEGORY not mentioned in AI prompts:"
      fi
      echo "     - $type"
      MISSING_PROMPT=$((MISSING_PROMPT + 1))
    fi
  done
  
  if [ $MISSING_PROMPT -eq 0 ]; then
    echo "  ✅ $CHECK_CATEGORY types mentioned in AI prompts"
  else
    echo "  ⚠️  $MISSING_PROMPT type(s) not mentioned in AI guidance"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "  ⏭️  Skipped (use --check-types <category> to validate specific category)"
fi

###############################################################################
# 4. TITLE GENERATOR CONFIGURATIONS
###############################################################################
echo "📝 Checking Title Generator Configurations..."

# Check if REFRIGERATOR_CONFIGURATIONS includes common types
REQUIRED_REF_TYPES=("French Door" "Side-by-Side" "Wine Cooler" "Beverage Center" "Kegerator")
MISSING_CONFIG=0

for type in "${REQUIRED_REF_TYPES[@]}"; do
  if ! grep -qF "'$type'" src/services/title-generator.service.ts; then
    if [ $MISSING_CONFIG -eq 0 ]; then
      echo "  ⚠️  Types missing from REFRIGERATOR_CONFIGURATIONS:"
    fi
    echo "     - $type"
    MISSING_CONFIG=$((MISSING_CONFIG + 1))
  fi
done

if [ $MISSING_CONFIG -eq 0 ]; then
  echo "  ✅ Title generator includes key refrigerator types"
else
  echo "  ⚠️  $MISSING_CONFIG type(s) missing from title generator"
  WARNINGS=$((WARNINGS + 1))
fi

###############################################################################
# 5. HARDCODED LISTS SYNC STATUS
###############################################################################
echo "🔄 Checking Hardcoded Lists Sync..."

HARDCODED_CHECK=$(node scripts/regenerate-hardcoded-lists.js --check 2>&1)

if echo "$HARDCODED_CHECK" | grep -q "IN SYNC"; then
  echo "  ✅ Hardcoded lists are in sync with picklists"
elif echo "$HARDCODED_CHECK" | grep -q "OUT OF SYNC"; then
  echo "  ❌ Hardcoded lists OUT OF SYNC with picklists"
  echo "     Run: node scripts/regenerate-hardcoded-lists.js"
  ERRORS=$((ERRORS + 1))
else
  echo "  ✅ Hardcoded lists updated (regenerate-hardcoded-lists.js executed)"
fi

###############################################################################
# 6. SCHEMA COVERAGE
###############################################################################
echo "📊 Checking Schema Coverage..."

TOTAL_CATS=$(jq 'length' src/config/salesforce-picklists/categories.json)
SCHEMA_COUNT=$(grep -cE '^\s*"[a-z_:,()-]+": \{$' src/config/title-schema-by-category.ts)

if [ "$TOTAL_CATS" -eq "$SCHEMA_COUNT" ]; then
  echo "  ✅ 100% schema coverage ($SCHEMA_COUNT/$TOTAL_CATS categories)"
else
  MISSING=$((TOTAL_CATS - SCHEMA_COUNT))
  if [ $MISSING -lt 0 ]; then
    echo "  ⚠️  $((SCHEMA_COUNT - TOTAL_CATS)) extra schemas (may be aliases)"
    WARNINGS=$((WARNINGS + 1))
  else
    echo "  ❌ Missing $MISSING schemas"
    ERRORS=$((ERRORS + 1))
  fi
fi

###############################################################################
# 7. TYPESCRIPT COMPILATION
###############################################################################
echo "🔨 TypeScript Compilation..."

if npm run build >/dev/null 2>&1; then
  echo "  ✅ TypeScript compiles successfully"
else
  echo "  ❌ TypeScript compilation errors"
  ERRORS=$((ERRORS + 1))
fi

###############################################################################
# 8. CATEGORY ATTRIBUTES CONSISTENCY
###############################################################################
echo "📐 Checking Category Attributes..."

# Check if Refrigerator configuration description includes new types
if grep -q "Wine Cooler.*Beverage Center.*Kegerator" src/config/category-attributes.ts; then
  echo "  ✅ Category attributes include specialized refrigeration types"
else
  echo "  ⚠️  Category attributes may need updating for specialized types"
  WARNINGS=$((WARNINGS + 1))
fi

###############################################################################
# 9. TITLE SCHEMA SEO NOTES
###############################################################################
echo "🔍 Checking Title Schema Documentation..."

# Check if Refrigerator seoNotes mentions specialized types
if grep -A 5 '"categoryName": "Refrigerator"' src/config/title-schema-by-category.ts | grep -q "Wine Cooler\|Beverage Center\|Kegerator"; then
  echo "  ✅ Title schema seoNotes include specialized types"
else
  echo "  ⚠️  Title schema seoNotes may need specialized type examples"
  WARNINGS=$((WARNINGS + 1))
fi

###############################################################################
# SUMMARY
###############################################################################
echo ""
echo "═══════════════════════════════════════════════════════════════════"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ PASSED - All dependencies validated successfully"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  WARNINGS - $WARNINGS warning(s) found (review recommended)"
  exit 0
else
  echo "❌ FAILED - $ERRORS error(s), $WARNINGS warning(s)"
  echo "Fix errors before deploying."
  echo ""
  echo "Common fixes:"
  echo "  • node scripts/regenerate-hardcoded-lists.js"
  echo "  • Add missing keyword mappings to type-matcher.service.ts"
  echo "  • Update AI prompts in dual-ai-verification.service.ts"
  echo "  • Add types to title-generator.service.ts configurations"
  exit 1
fi
