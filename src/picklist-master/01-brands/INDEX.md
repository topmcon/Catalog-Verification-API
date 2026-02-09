# 01-Brands - Picklist Dependency

## 📄 Primary Picklist
**Location**: `src/config/salesforce-picklists/brands.json`
**Contains**: `brand_id`, `brand_name`
**Updated by**: Salesforce Admin → API sync

## 📝 Dependent Files in This Folder

### Files That Must Be Updated When brands.json Changes:

1. **text-cleaner.ts** (`BRAND_CORRECTIONS`)
   - Contains: ~70 brand capitalization mappings
   - Update: Add new brand capitalization rules
   - Example: 'cafe' → 'Café', 'kitchenaid' → 'KitchenAid'

2. **brand-config.ts** (Brand Tier Classifications)
   - Contains: PREMIUM_BRANDS, MID_TIER_BRANDS, VALUE_BRANDS
   - Update: Classify new brands into appropriate tier
   - Impact: Title generation, pricing logic

## ⚠️ Also Check
Files in `06-multiple-picklist-files/` folder when brands.json updates
