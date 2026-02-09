# 03-Styles - Picklist Dependency

## 📄 Primary Picklist
**Location**: `src/config/salesforce-picklists/styles.json`
**Contains**: `style_id`, `style_name`, `category_ids[]`
**Updated by**: Salesforce Admin → API sync

## 📝 Dependent Files in This Folder

### Files That Must Be Updated When styles.json Changes:

1. **category-style-mapping.ts**
   - Contains: Category → Valid Styles mappings
   - Update: Add new styles to appropriate categories
   - Impact: Style validation logic

2. **category-type-style-mapping.json**
   - Contains: Category → Type → Styles hierarchy
   - Update: Add new styles with product type associations
   - Impact: Product type inference

## ⚠️ Also Check
- Validation logic in `06-multiple-picklist-files/dual-ai-verification.service.ts` (VALID_SHOWER_STYLES)
