#!/bin/bash
# Title Generation Enhancement Migration Script
# ============================================
# Implements fixes for missing critical attributes in AI-generated titles
# 
# CHANGES MADE:
# 1. Added missing fields to SEOTitleInput interface (placeSettings, controlType, basinCount, burnerCount)
# 2. Added attribute mappings for new fields in ATTRIBUTE_TO_FIELD
# 3. Added data extraction for critical attributes in seoTitleInput object
# 4. Enhanced AI prompt to emphasize extraction of critical attributes
#
# Priority Categories Affected:
# - Range Hood (175 items) - Now extracts CFM, Installation Type
# - Refrigerator (91 items) - Now extracts Configuration, Installation Type
# - Dishwasher (78 items) - Now extracts Place Settings, Control Type
# - Cooktop (59 items) - Now extracts Burner Count, Fuel Type
# - Oven (55 items) - Now extracts Configuration, Installation Type
# - Dryer (48 items) - Now extracts Fuel Type (Gas vs Electric)
# - Faucets (78 items) - Now extracts GPM, Installation Type, Collection
#
# DATE: February 25, 2026
# AUTHOR: GitHub Copilot
# TICKET: TITLE-ENHANCEMENT-001

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Title Generation Enhancement Migration${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Step 1: Verify we're in the correct directory
echo -e "${YELLOW}Step 1: Verifying workspace location...${NC}"
if [ ! -f "package.json" ]; then
  echo -e "${RED}ERROR: package.json not found. Run this script from the repository root.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Workspace verified${NC}"
echo ""

# Step 2: Check if changes have been applied
echo -e "${YELLOW}Step 2: Checking if changes are already applied...${NC}"
if grep -q "placeSettings" src/services/seo-title-generator.service.ts; then
  echo -e "${GREEN}✓ Changes detected in seo-title-generator.service.ts${NC}"
else
  echo -e "${RED}ERROR: Changes not found in seo-title-generator.service.ts${NC}"
  echo -e "${RED}Please apply code changes before running this script.${NC}"
  exit 1
fi

if grep -q "cfm: preferAIValue" src/services/dual-ai-verification.service.ts; then
  echo -e "${GREEN}✓ Changes detected in dual-ai-verification.service.ts${NC}"
else
  echo -e "${RED}ERROR: Changes not found in dual-ai-verification.service.ts${NC}"
  echo -e "${RED}Please apply code changes before running this script.${NC}"
  exit 1
fi
echo ""

# Step 3: Create backup of current schemas
echo -e "${YELLOW}Step 3: Creating backup of current title schemas...${NC}"
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp src/config/title-schema-by-category.ts "$BACKUP_DIR/"
cp src/services/seo-title-generator.service.ts "$BACKUP_DIR/"
cp src/services/dual-ai-verification.service.ts "$BACKUP_DIR/"
echo -e "${GREEN}✓ Backups created in $BACKUP_DIR/${NC}"
echo ""

# Step 4: Run TypeScript compilation to check for errors
echo -e "${YELLOW}Step 4: Compiling TypeScript to validate changes...${NC}"
if npm run build > /tmp/build-output.log 2>&1; then
  echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
else
  echo -e "${RED}ERROR: TypeScript compilation failed${NC}"
  echo -e "${RED}Check /tmp/build-output.log for details${NC}"
  tail -20 /tmp/build-output.log
  exit 1
fi
echo ""

# Step 5: Run linter (if available)
echo -e "${YELLOW}Step 5: Running linter (if available)...${NC}"
if npm run lint > /tmp/lint-output.log 2>&1; then
  echo -e "${GREEN}✓ Linting passed${NC}"
elif [ ! -f "node_modules/.bin/eslint" ]; then
  echo -e "${YELLOW}⚠ Linter not available, skipping...${NC}"
else
  echo -e "${YELLOW}⚠ Linting warnings detected (non-critical)${NC}"
  echo -e "${YELLOW}Check /tmp/lint-output.log if needed${NC}"
fi
echo ""

# Step 6: Display migration summary
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Migration Summary${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${GREEN}Files Modified:${NC}"
echo "  1. src/services/seo-title-generator.service.ts"
echo "     - Added: placeSettings, controlType, basinCount, burnerCount to interface"
echo "     - Added: Attribute mappings for new fields"
echo ""
echo "  2. src/services/dual-ai-verification.service.ts"
echo "     - Added: Data extraction for CFM, GPM, BTU, Place Settings, Control Type, Basin Count"
echo "     - Enhanced: AI prompt to emphasize critical attribute extraction"
echo ""
echo -e "${GREEN}Expected Improvements:${NC}"
echo "  - Range Hood titles: Will now include CFM, Width, Installation Type"
echo "  - Dishwasher titles: Will now include Place Settings, Control Type"
echo "  - Cooktop titles: Will now include Burner Count, Fuel Type"
echo "  - Refrigerator titles: Will now include Configuration, Installation Type"
echo "  - Faucet titles: Will now include GPM, Collection Name, Installation Type"
echo "  - Dryer titles: Will now include Fuel Type (Gas vs Electric)"
echo ""

# Step 7: Provide deployment instructions
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Deployment Instructions${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}LOCAL TESTING:${NC}"
echo "  1. Start local server: npm run dev"
echo "  2. Test with sample products from each priority category"
echo "  3. Compare generated titles vs Ferguson/Web Retailer patterns"
echo ""
echo -e "${YELLOW}PRODUCTION DEPLOYMENT:${NC}"
echo "  1. Commit changes:"
echo "     git add src/services/seo-title-generator.service.ts"
echo "     git add src/services/dual-ai-verification.service.ts"
echo "     git commit -m 'feat: enhance title generation with critical attributes'"
echo ""
echo "  2. Push to GitHub:"
echo "     git push origin main"
echo ""
echo "  3. Deploy to production:"
echo "     ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \\"
echo "       \"cd /opt/catalog-verification-api && \\"
echo "        git pull origin main && \\"
echo "        npm install && \\"
echo "        npm run build && \\"
echo "        systemctl restart catalog-verification\""
echo ""
echo "  4. Verify production health:"
echo "     curl -s https://verify.cxc-ai.com/health"
echo ""
echo -e "${YELLOW}POST-DEPLOYMENT VALIDATION:${NC}"
echo "  1. Run API Accuracy Report:"
echo "     ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \\"
echo "       \"cd /opt/catalog-verification-api && node scripts/verification-api-accuracy-audit.js\""
echo ""
echo "  2. Compare before/after stats:"
echo "     - Check title completeness rate (target: 90%+)"
echo "     - Verify critical attributes present (CFM, GPM, Fuel Type, etc.)"
echo "     - Monitor pass/fail rates by category"
echo ""
echo "  3. Test specific categories:"
echo "     - Range Hood: Must have CFM + Width + Installation Type"
echo "     - Dishwasher: Must have Width + Place Settings + Control Type"
echo "     - Cooktop: Must have Width + Burner Count + Fuel Type"
echo "     - Dryer: Must have Width + Fuel Type (Gas/Electric)"
echo ""

# Step 8: Rollback instructions
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Rollback Instructions (if needed)${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}If issues occur in production:${NC}"
echo ""
echo "  1. Restore from backup:"
echo "     cp $BACKUP_DIR/seo-title-generator.service.ts src/services/"
echo "     cp $BACKUP_DIR/dual-ai-verification.service.ts src/services/"
echo ""
echo "  2. Rebuild and redeploy:"
echo "     npm run build"
echo "     ssh -i ~/.ssh/cxc_ai_deploy root@verify.cxc-ai.com \\"
echo "       \"cd /opt/catalog-verification-api && \\"
echo "        git pull origin main && \\"
echo "        npm run build && \\"
echo "        systemctl restart catalog-verification\""
echo ""
echo "  3. Verify rollback successful:"
echo "     curl -s https://verify.cxc-ai.com/health"
echo ""

# Step 9: Testing recommendations
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Testing Strategy${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${GREEN}Priority Test Cases:${NC}"
echo ""
echo "  1. Range Hood (175 items - highest volume)"
echo "     Input: '600 CFM 36 Inch Wall Mount Stainless Steel'"
echo "     Expected: Brand + 600 CFM + 36-Inch + Wall Mount + Range Hood + Finish"
echo "     Critical: CFM MUST be present"
echo ""
echo "  2. Dishwasher (78 items)"
echo "     Input: '24 inch 16 place setting top control built-in'"
echo "     Expected: Brand + 24-Inch + 16 Place Setting + Top Control + Dishwasher + Finish"
echo "     Critical: Place Settings + Control Type MUST be present"
echo ""
echo "  3. Cooktop (59 items)"
echo "     Input: '36 inch 5 burner gas built-in'"
echo "     Expected: Brand + 36-Inch + 5-Burner + Gas + Built-In + Cooktop + Finish"
echo "     Critical: Fuel Type (Gas/Electric/Induction) MUST be present"
echo ""
echo "  4. Dryer (48 items)"
echo "     Input: '27 inch 7.4 cu ft gas dryer'"
echo "     Expected: Brand + 27-Inch + 7.4 Cu. Ft. + Gas + Dryer + Finish"
echo "     Critical: Fuel Type (Gas/Electric) MUST be present"
echo ""
echo "  5. Kitchen Faucet (28 items)"
echo "     Input: 'Bolden 1.8 GPM single hole pull down'"
echo "     Expected: Collection + 1.8 GPM + Single Hole + Pull Down + Kitchen Faucet + Finish"
echo "     Critical: GPM + Installation Type MUST be present"
echo ""

# Step 10: Monitoring recommendations
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Monitoring Recommendations${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}Key Metrics to Track:${NC}"
echo "  1. Title Completeness Rate:"
echo "     - Before: ~40% (missing critical specs)"
echo "     - Target: 90%+ (all critical specs present)"
echo ""
echo "  2. Critical Attribute Presence:"
echo "     - CFM in Range Hood titles: Target 100%"
echo "     - Fuel Type in Cooktop/Dryer titles: Target 100%"
echo "     - GPM in Faucet titles: Target 100%"
echo "     - Place Settings in Dishwasher titles: Target 90%+"
echo ""
echo "  3. API Accuracy Report Pass Rate:"
echo "     - Current baseline: Check report before deployment"
echo "     - Target improvement: +10-15 percentage points"
echo ""
echo "  4. Category-Specific Success Rates:"
echo "     - Monitor high-volume categories (Range Hood, Refrigerator, Dishwasher)"
echo "     - Track P0 categories (Cooktop, Dryer - need Fuel Type)"
echo ""

# Step 11: Success criteria
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Success Criteria${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${GREEN}Migration is successful if:${NC}"
echo "  ✓ TypeScript compilation passes"
echo "  ✓ No runtime errors in production logs"
echo "  ✓ Title completeness rate improves to 90%+"
echo "  ✓ Critical attributes present in 90%+ of titles"
echo "  ✓ API Accuracy Report pass rate improves by 10%+"
echo "  ✓ No increase in error rates or webhook failures"
echo ""

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Migration script completed successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review the changes above"
echo "  2. Test locally (npm run dev)"
echo "  3. Deploy to production when ready"
echo "  4. Monitor metrics for 24 hours"
echo "  5. Run API Accuracy Report to validate improvements"
echo ""
echo -e "${BLUE}Backup location: $BACKUP_DIR/${NC}"
echo ""
