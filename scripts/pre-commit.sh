#!/bin/bash
###############################################################################
# PRE-COMMIT HOOK
# Runs quick validation before allowing commit
# Install: cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
###############################################################################

echo ""
echo "🔍 Running pre-commit validation..."
echo ""

# Only run checks if TypeScript files changed
CHANGED_TS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$')

if [ -z "$CHANGED_TS_FILES" ]; then
  echo "✅ No TypeScript files changed - skipping validation"
  exit 0
fi

echo "📝 Changed TypeScript files:"
echo "$CHANGED_TS_FILES" | sed 's/^/   - /'
echo ""

# Check if title system files changed
TITLE_SYSTEM_FILES=$(echo "$CHANGED_TS_FILES" | grep -E '(title-schema-by-category|seo-title-generator)')

if [ -n "$TITLE_SYSTEM_FILES" ]; then
  echo "⚠️  Title system files changed - running comprehensive checks..."
  echo ""
  
  # Build to ensure compilation works
  echo "1️⃣ Compiling TypeScript..."
  if ! npm run build > /dev/null 2>&1; then
    echo ""
    echo "❌ TypeScript compilation failed!"
    echo "   Run 'npm run build' to see errors"
    exit 1
  fi
  echo "   ✅ Compilation successful"
  
  # Run quick title system check
  echo ""
  echo "2️⃣ Testing title generation..."
  if ! node scripts/test-title-generation.js > /dev/null 2>&1; then
    echo ""
    echo "❌ Title generation test failed!"
    echo "   Run 'node scripts/test-title-generation.js' to see details"
    exit 1
  fi
  echo "   ✅ Title generation test passed"
  
  # Check feature completeness
  echo ""
  echo "3️⃣ Checking feature completeness..."
  if ! node scripts/audit-declared-vs-implemented.js > /dev/null 2>&1; then
    echo ""
    echo "❌ Feature completeness check failed!"
    echo "   Run 'node scripts/audit-declared-vs-implemented.js' to see details"
    exit 1
  fi
  echo "   ✅ Feature completeness check passed"
fi

# Check if picklist files changed
PICKLIST_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep 'salesforce-picklists/.*\.json$')

if [ -n "$PICKLIST_FILES" ]; then
  echo ""
  echo "⚠️  Picklist files changed - validating structure..."
  
  for file in $PICKLIST_FILES; do
    if ! python -m json.tool "$file" > /dev/null 2>&1; then
      echo ""
      echo "❌ Invalid JSON in $file"
      exit 1
    fi
  done
  echo "   ✅ Picklist JSON valid"
fi

echo ""
echo "✅ Pre-commit validation passed - proceeding with commit"
echo ""
exit 0
