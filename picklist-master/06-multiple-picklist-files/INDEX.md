# 06-Multiple-Picklist-Files - Cross-Picklist Dependencies

## 🔗 Multiple Picklist Dependencies

Files in this folder use data from **2+ picklists** simultaneously and must be reviewed whenever **any** of the source picklists update.

## 📝 Files in This Folder

### 1. dual-ai-verification.service.ts
**Picklists Used**: Categories, Styles, Attributes
**Contains**:
- `LIGHTING_CATEGORIES` - Categories that are lighting products
- `SHOWER_PLUMBING_CATEGORIES` - Shower/plumbing categories
- `VALID_SHOWER_STYLES` - Allowed styles for shower products
**Update When**: Categories or Styles picklist changes

### 2. consensus.service.ts
**Picklists Used**: All picklists
**Purpose**: Compares AI responses against all picklists
**Update When**: Any picklist format changes

### 3. response-builder.service.ts
**Picklists Used**: Brands, Categories, Styles, Attributes
**Purpose**: Builds final verification response
**Update When**: Any picklist field names or IDs change

### 4. title-generator.service.ts
**Picklists Used**: Brands, Categories, Styles
**Purpose**: Generates product titles using picklist data
**Update When**: Brand tiers, category names, or style names change

### 5. openai.service.ts
**Picklists Used**: All picklists (sent to AI)
**Purpose**: Sends picklists to OpenAI for verification
**Update When**: Any picklist structure changes

### 6. xai.service.ts
**Picklists Used**: All picklists (sent to AI)
**Purpose**: Sends picklists to xAI for verification
**Update When**: Any picklist structure changes

### 7. enrichment.service.ts
**Picklists Used**: Categories, Attributes
**Purpose**: Enriches product data with attributes
**Update When**: Category-attribute relationships change

## ⚠️ Update Checklist

When **any** picklist updates, review this folder for:
1. Hardcoded category lists (LIGHTING_CATEGORIES, etc.)
2. Picklist structure assumptions in AI prompts
3. Field name mappings (brand_id, category_id, etc.)
4. Validation logic that depends on specific picklist values
