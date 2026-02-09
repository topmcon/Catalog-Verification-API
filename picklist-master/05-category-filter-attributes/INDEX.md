# 05-Category-Filter-Attributes - Picklist Dependency

## 📄 Primary Picklist
**Location**: `src/config/salesforce-picklists/category-filter-attributes.json`
**Contains**: Filter attributes for Salesforce catalog search/browse
**Updated by**: Salesforce Admin → API sync

## 📝 Dependent Files in This Folder

### Files That Must Be Updated When category-filter-attributes.json Changes:

1. **filter-lookups.ts**
   - Contains: Fast lookup maps for filter attributes
   - Update: Regenerate lookups after picklist updates
   - Impact: Filter attribute validation

2. **category-filter-config.ts**
   - Contains: Category-specific filter configurations
   - Update: Add filter configs for new categories
   - Impact: Search/browse functionality

## ⚠️ Also Check
- Filter logic in `06-multiple-picklist-files/` folder
