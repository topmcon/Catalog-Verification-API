#!/bin/bash
###############################################################################
# QUICK PRE-DEPLOYMENT AUDIT
# Streamlined checks before pushing to production
###############################################################################

ERRORS=0
WARNINGS=0

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║          QUICK PRE-DEPLOYMENT AUDIT                                ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Schema Coverage
echo "📊 Schema Coverage Check..."
TOTAL_CATS=$(cat src/config/salesforce-picklists/categories.json | jq 'length')
SCHEMA_COUNT=$(grep -cE '^\s*"[a-z_:,()-]+": \{$' src/config/title-schema-by-category.ts)
if [ "$TOTAL_CATS" -eq "$SCHEMA_COUNT" ]; then
  echo "  ✅ 100% coverage ($SCHEMA_COUNT/$TOTAL_CATS categories)"
else
  echo "  ❌ Missing $((TOTAL_CATS - SCHEMA_COUNT)) schemas"
  ERRORS=$((ERRORS + 1))
fi

# 2. TypeScript Compilation Test
echo "🔨 TypeScript Compilation Test..."
if npm run build >/dev/null 2>&1; then
  echo "  ✅ Project compiles successfully"
else
  echo "  ❌ TypeScript compilation errors"
  ERRORS=$((ERRORS + 1))
fi

# 3. Import Check
echo "🔍 Import Validation..."
if grep -q "getCategoryTitleSchema" src/services/seo-title-generator.service.ts; then
  echo "  ✅ SEO title generator imports schema correctly"
else
  echo "  ❌ SEO title generator missing schema import"
  ERRORS=$((ERRORS + 1))
fi

# 4. Legacy Usage Check
echo "🕰️  Legacy Title Generator Check..."
LEGACY=$(grep -l "from.*'./title-generator.service'" src/services/*.ts | grep -v "seo-title-generator" || echo "")
LEGACY_COUNT=$(echo "$LEGACY" | grep -c ".ts" || echo "0")
if [ "$LEGACY_COUNT" -gt "0" ]; then
  echo "  ⚠️  $LEGACY_COUNT file(s) still use old title generator:"
  echo "$LEGACY" | sed 's/^/    - /'
  WARNINGS=$((WARNINGS + 1))
else
  echo "  ✅ No legacy usage detected"
fi

# 5. Enrichment Service Check
echo "🔬 Enrichment Service Check..."
if grep -q "generateTitle.*title-generator" src/services/enrichment.service.ts; then
  echo "  ⚠️  WARNING: Enrichment service uses OLD title generator"
  echo "    → /api/enrich endpoint will produce different titles"
  echo "    → Run: node scripts/update-enrichment-to-seo.js (to be created)"
  WARNINGS=$((WARNINGS + 1))
else
  echo "  ✅ Enrichment service updated or doesn't use title generator"
fi

# 6. Git Status
echo "📁 Git Status Check..."
CHANGED=$(git status --porcelain | wc -l)
if [ "$CHANGED" -gt "0" ]; then
  echo "  ⚠️  $CHANGED uncommitted changes"
  git status --short | head -10 | sed 's/^/    /'
  if [ "$CHANGED" -gt "10" ]; then
    echo "    ... and $((CHANGED - 10)) more"
  fi
else
  echo "  ✅ Working directory clean"
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
  echo "✅ PASSED ($WARNINGS warning(s)) - Ready to deploy"
  echo ""
  echo "To deploy:"
  echo "  1. git add -A"
  echo "  2. git commit -m 'feat: Add comprehensive title schemas (177 categories)'"
  echo "  3. git push origin main"
  echo "  4. ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com 'cd /opt/catalog-verification-api && git pull && npm install && npm run build && systemctl restart catalog-verification'"
  exit 0
else
  echo "❌ FAILED - $ERRORS error(s), $WARNINGS warning(s)"
  echo "Fix errors before deploying."
  exit 1
fi
