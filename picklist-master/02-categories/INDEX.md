# 02-Categories - Picklist Dependency

## 📄 Primary Picklist
**Location**: `src/config/salesforce-picklists/categories.json`
**Contains**: `category_id`, `category_name`, `department`, `family`
**Updated by**: Salesforce Admin → API sync

## 📝 Dependent Files in This Folder

### Files That Must Be Updated When categories.json Changes:

1. **category-matcher.service.ts** (`DEPARTMENT_CATEGORIES`)
   - Contains: Department → Categories mappings
   - Update: Verify auto-generated mappings still match

2. **category-config.ts** (Category Aliases)
   - Contains: CATEGORY_NAME_ALIASES
   - Update: Add plural/variant forms for new categories

3. **category-consolidation-mapping.ts**
   - Contains: Deprecated → Parent category mappings
   - Update: Add mappings for removed categories

4. **category-aliases.ts**
   - Contains: Additional category name variations
   - Update: Add common variations for new categories

5. **family-category-mapping.ts**
   - Contains: Department → Family → Category hierarchy
   - Update: Update hierarchy if structure changed

6. **master-category-schema-map.ts**
   - Contains: Category name → Schema config mappings
   - Update: Add schema mappings for new categories

## ⚠️ Also Check
- Create new schemas in `04-attributes/` for new categories
- Files in `06-multiple-picklist-files/` folder
