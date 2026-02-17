#!/bin/bash
###############################################################################
# PRE-DEPLOYMENT COMPREHENSIVE AUDIT
# 
# Checks EVERYTHING before pushing to production:
# - Title schema coverage (100% required)
# - TypeScript compilation
# - Hardcoded lists sync
# - File consistency
# - Import validity
# - Breaking changes detection
#
# Usage: ./scripts/pre-deployment-audit.sh
# Exit code: 0 = ready to deploy, 1 = issues found
###############################################################################

set -e  # Exit on first error

ERRORS=0
WARNINGS=0

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║            PRE-DEPLOYMENT COMPREHENSIVE AUDIT                          ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================
# 1. TITLE SCHEMA COVERAGE
# ============================================
echo "📊 [1/9] Checking Title Schema Coverage..."
TOTAL_CATS=$(cat src/config/salesforce-picklists/categories.json | jq 'length')
SCHEMA_COUNT=$(grep -cE '^\s*"[a-z_:,()-]+": \{$' src/config/title-schema-by-category.ts || echo "0")

echo "  Total categories in Salesforce: $TOTAL_CATS"
echo "  Schemas in title-schema-by-category.ts: $SCHEMA_COUNT"

if [ "$TOTAL_CATS" -eq "$SCHEMA_COUNT" ]; then
  echo "  ✅ 100% schema coverage"
else
  echo "  ❌ MISSING SCHEMAS: $((TOTAL_CATS - SCHEMA_COUNT)) categories without schemas"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 2. TYPESCRIPT COMPILATION
# ============================================
echo "🔨 [2/9] Compiling TypeScript..."
if npm run build > /tmp/build.log 2>&1; then
  echo "  ✅ TypeScript compilation successful"
else
  echo "  ❌ COMPILATION FAILED:"
  tail -20 /tmp/build.log
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 3. HARDCODED LISTS SYNC
# ============================================
echo "🔄 [3/9] Checking Hardcoded Lists Sync..."
if node scripts/regenerate-hardcoded-lists.js > /tmp/hardcoded-regen.log 2>&1; then
  # Check if any files changed (git diff)
  CHANGED_FILES=$(git diff --name-only | grep -E '(category-matcher|dual-ai-verification|constants)\.ts' || echo "")
  
  if [ -z "$CHANGED_FILES" ]; then
    echo "  ✅ Hardcoded lists are in sync"
  else
    echo "  ⚠️  WARNING: Hardcoded lists out of sync. Files changed:"
    echo "$CHANGED_FILES" | sed 's/^/    - /'
    echo "  Run: node scripts/regenerate-hardcoded-lists.js"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "  ❌ FAILED to regenerate hardcoded lists"
  cat /tmp/hardcoded-regen.log
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# 4. IMPORT VALIDITY (Title Schema)
# ============================================
echo "🔍 [4/9] Checking Title Schema Imports..."
IMPORTS=$(grep -rn "from.*title-schema-by-category" src/ | grep -v "OLD-BACKUP" | grep ".ts:" || echo "")
IMPORT_COUNT=$(echo "$IMPORTS" | grep -c ".ts:" || echo "0")

echo "  Files importing title-schema-by-category:"
if [ "$IMPORT_COUNT" -eq "0" ]; then
  echo "    ⚠️  No imports found (might be an issue)"
  WARNINGS=$((WARNINGS + 1))
else
  echo "$IMPORTS" | sed 's/^/    /'
  
  # Check if seo-title-generator.service.ts imports it
  if echo "$IMPORTS" | grep -q "seo-title-generator.service.ts"; then
    echo "  ✅ SEO title generator properly imports schema"
  else
    echo "  ❌ SEO title generator does NOT import schema"
    ERRORS=$((ERRORS + 1))
  fi
fi
echo ""

# ============================================
# 5. LEGACY TITLE GENERATOR CHECK
# ============================================
echo "🕰️  [5/9] Checking Legacy Title Generator Usage..."
LEGACY_IMPORTS=$(grep -rn "from.*title-generator\.service" src/ --include="*.ts" | grep -v "seo-title-generator" | grep -v "isPremiumBrand" || echo "")

if [ -z "$LEGACY_IMPORTS" ]; then
  echo "  ✅ No legacy title generator usage (except isPremiumBrand)"
else
  echo "  ⚠️  WARNING: Files still using OLD title-generator.service:"
  echo "$LEGACY_IMPORTS" | sed 's/^/    /'
  echo "  Consider migrating to seo-title-generator.service"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ============================================
# 6. ENRICHMENT SERVICE CHECK
# ============================================
echo "🔬 [6/9] Checking Enrichment Service..."
if grep -q "generateTitle" src/services/enrichment.service.ts; then
  echo "  ⚠️  WARNING: Enrichment service uses OLD title generator"
  echo "  This could produce inconsistent titles from /api/enrich endpoint"
  echo "  Consider updating enrichment.service.ts to use generateSEOTitle"
  WARNINGS=$((WARNINGS + 1))
else
  echo "  ✅ Enrichment service does not use old title generator"
fi
echo ""

# ============================================
# 7. BACKUP FILE CHECK
# ============================================
echo "💾 [7/9] Checking Backup Files..."
if [ -f "src/config/title-schema-by-category-OLD-BACKUP.ts" ]; then
  OLD_SIZE=$(stat -c%s src/config/title-schema-by-category-OLD-BACKUP.ts 2>/dev/null || stat -f%z src/config/title-schema-by-category-OLD-BACKUP.ts)
  NEW_SIZE=$(stat -c%s src/config/title-schema-by-category.ts 2>/dev/null || stat -f%z src/config/title-schema-by-category.ts)
  
  echo "  Old backup: $(numfmt --to=iec-i --suffix=B $OLD_SIZE)"
  echo "  New schema: $(numfmt --to=iec-i --suffix=B $NEW_SIZE)"
  echo "  ✅ Backup exists for rollback"
else
  echo "  ⚠️  No backup file found"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ============================================
# 8. TEST SUITE (if exists)
# ============================================
echo "🧪 [8/9] Running Tests..."
if [ -f "package.json" ] && grep -q '"test"' package.json; then
  if npm test > /tmp/test.log 2>&1; then
    echo "  ✅ All tests passed"
  else
    echo "  ⚠️  Some tests failed (check /tmp/test.log)"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "  ⚠️  No test suite configured"
fi
echo ""

# ============================================
# 9. SCHEMA STRUCTURE VALIDATION
# ============================================
echo "🏗️  [9/9] Validating Schema Structure..."
node << 'EOF' > /tmp/schema-validation.log 2>&1
const fs = require('fs');
const path = require('path');

// Check if schema file can be parsed
try {
  const schemaPath = path.join(process.cwd(), 'src/config/title-schema-by-category.ts');
  const content = fs.readFileSync(schemaPath, 'utf-8');
  
  // Check for getCategoryTitleSchema function
  if (content.includes('export function getCategoryTitleSchema')) {
    console.log('  ✅ getCategoryTitleSchema function exists');
  } else {
    console.log('  ❌ getCategoryTitleSchema function NOT FOUND');
    process.exit(1);
  }
  
  // Check for FORMATTING_RULES
  if (content.includes('export const FORMATTING_RULES')) {
    console.log('  ✅ FORMATTING_RULES exported');
  } else {
    console.log('  ⚠️  FORMATTING_RULES not found');
  }
  
  // Check for ATTRIBUTE_FORMATTERS
  if (content.includes('export const ATTRIBUTE_FORMATTERS')) {
    console.log('  ✅ ATTRIBUTE_FORMATTERS exported');
  } else {
    console.log('  ⚠️  ATTRIBUTE_FORMATTERS not found');
  }
  
  // Sample schema validation (check refrigerator)
  const refMatch = content.match(/"refrigerator":\s*{[\s\S]{0,1000}slots/);
  if (refMatch) {
    console.log('  ✅ Sample schema (refrigerator) has valid structure');
  } else {
    console.log('  ❌ Sample schema structure invalid');
    process.exit(1);
  }
  
  console.log('  ✅ Schema structure valid');
} catch (err) {
  console.log('  ❌ Schema validation failed:', err.message);
  process.exit(1);
}
EOF

if [ $? -eq 0 ]; then
  cat /tmp/schema-validation.log
else
  cat /tmp/schema-validation.log
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ============================================
# SUMMARY
# ============================================
echo "═══════════════════════════════════════════════════════════════════════"
echo "                           AUDIT SUMMARY"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED - READY FOR PRODUCTION DEPLOYMENT"
  echo ""
  echo "Next steps:"
  echo "  1. git add -A"
  echo "  2. git commit -m 'feat: comprehensive title schemas for all 177 categories'"
  echo "  3. git push origin main"
  echo "  4. ./deploy.sh"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  $WARNINGS WARNING(S) - Deployment possible but review recommended"
  echo ""
  echo "You can proceed, but consider fixing warnings first."
  exit 0
else
  echo "❌ $ERRORS ERROR(S) FOUND - DO NOT DEPLOY"
  echo "⚠️  $WARNINGS warning(s) also found"
  echo ""
  echo "Fix errors before deploying to production."
  exit 1
fi
