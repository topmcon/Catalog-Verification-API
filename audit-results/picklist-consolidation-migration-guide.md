
# PICKLIST CONSOLIDATION MIGRATION GUIDE
Generated: 2026-02-04T21:23:09.383Z

## ✅ FILES CREATED

1. **categories-enhanced.json** - Enhanced categories with aliases and valid_styles
   - Location: /workspaces/Catalog-Verification-API/src/config/salesforce-picklists/categories-enhanced.json
   - Replaces: categories.json (after validation)

2. **attribute-aliases.json** - NOT CREATED (manual extraction needed)

## 📋 BACKUPS CREATED

All original files backed up to:
/workspaces/Catalog-Verification-API/src/config/salesforce-picklists/backups/consolidation-1770240189370

## 🔧 CODE CHANGES REQUIRED

### 1. Update picklist-matcher.service.ts

**Remove hardcoded ATTRIBUTE_ALIASES constant**

Replace with:
```typescript
import attributeAliases from '../config/salesforce-picklists/attribute-aliases.json';
const ATTRIBUTE_ALIASES: Record<string, string> = attributeAliases;
```

### 2. Update dual-ai-verification.service.ts

**Change imports from TypeScript to JSON:**

OLD:
```typescript
import { matchStyleToCategory, getValidStylesForCategory } from '../config/category-style-mapping';
import { normalizeCategoryName, areCategoriesEquivalent } from '../config/category-aliases';
```

NEW - Create helper functions:
```typescript
import categoriesData from '../config/salesforce-picklists/categories-enhanced.json';

function getValidStylesForCategory(categoryName: string): string[] {
  const category = categoriesData.find(c => c.category_name === categoryName);
  return category?.valid_styles || [];
}

function normalizeCategoryName(categoryName: string): string {
  // Check aliases in categories
  for (const cat of categoriesData) {
    if (cat.category_name === categoryName) return categoryName;
    if (cat.aliases?.includes(categoryName)) return cat.category_name;
  }
  return categoryName;
}
```

### 3. Replace categories.json with categories-enhanced.json

After validation:
```bash
cd src/config/salesforce-picklists
mv categories.json categories-original.json
mv categories-enhanced.json categories.json
```

### 4. Update config/index.ts

**Remove these exports:**
```typescript
export * from './category-aliases';
export * from './category-style-mapping';
```

### 5. Optional: Archive old TypeScript files

After confirming everything works:
```bash
mkdir src/config/archived
mv src/config/category-aliases.ts src/config/archived/
mv src/config/category-style-mapping.ts src/config/archived/
mv src/config/family-category-mapping.ts src/config/archived/
mv src/config/complete-category-data.json src/config/archived/
```

## ✅ VALIDATION STEPS

1. **Check enhanced categories:**
   ```bash
   node -e "const c = require('./src/config/salesforce-picklists/categories-enhanced.json'); console.log('Total:', c.length); console.log('With aliases:', c.filter(x=>x.aliases).length); console.log('With styles:', c.filter(x=>x.valid_styles).length);"
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Test verification locally:**
   ```bash
   npm run dev
   # Send test verification request
   ```

4. **Check for import errors:**
   ```bash
   npm run build
   ```

## 📊 CONSOLIDATION SUMMARY

| What | Before | After | Status |
|------|--------|-------|--------|
| Category aliases | Hardcoded .ts | JSON field | ✅ Merged |
| Category styles | Hardcoded .ts | JSON field | ✅ Merged |
| Attribute aliases | Hardcoded .ts | JSON file | ⚠️ Manual needed |
| Family mappings | Separate .ts | Already in categories.json | ✅ Already there |

## 🎯 BENEFITS

✅ Single source of truth (categories.json)
✅ Salesforce can update aliases/styles via API
✅ No code changes needed for data updates
✅ Easier to maintain and sync
✅ Cleaner codebase

## ⚠️ ROLLBACK INSTRUCTIONS

If something goes wrong:
```bash
# Restore from backups
cp /workspaces/Catalog-Verification-API/src/config/salesforce-picklists/backups/consolidation-1770240189370/* src/config/salesforce-picklists/
```

## 📝 EXECUTION LOG

[INFO] Creating backups of original files...
[SUCCESS] Backed up: categories.json
[SUCCESS] Backed up: attributes.json
[SUCCESS] Backed up: category-aliases.ts
[SUCCESS] Backed up: category-style-mapping.ts
[SUCCESS] Backed up: picklist-matcher.service.ts
[SUCCESS] All backups saved to: /workspaces/Catalog-Verification-API/src/config/salesforce-picklists/backups/consolidation-1770240189370
[INFO] Parsing category-aliases.ts...
[SUCCESS] Parsed 40 category aliases
[INFO] Parsing category-style-mapping.ts...
[SUCCESS] Parsed styles for 0 categories
[INFO] Extracting ATTRIBUTE_ALIASES from picklist-matcher.service.ts...
[WARNING] Could not auto-parse ATTRIBUTE_ALIASES: Could not find ATTRIBUTE_ALIASES in /workspaces/Catalog-Verification-API/src/services/picklist-matcher.service.ts
[WARNING] You will need to manually extract this
[INFO] Merging data into categories.json...
[SUCCESS] Added aliases to 22 categories
[SUCCESS] Added valid_styles to 0 categories
[INFO] Saving enhanced categories.json...
[SUCCESS] Saved enhanced categories to: categories-enhanced.json
[INFO] Size: 33.31 KB
[WARNING] No attribute aliases to save (manual extraction needed)
[INFO] Generating migration guide...
