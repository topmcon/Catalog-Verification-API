# 04-Attributes - Picklist Dependency

## 📄 Primary Picklist
**Location**: `src/config/salesforce-picklists/attributes.json`
**Contains**: `attribute_id`, `attribute_name`
**Updated by**: Salesforce Admin → API sync

## 📝 Dependent Files in This Folder

### Files That Must Be Updated When attributes.json Changes:

1. **attribute-config.ts** (Attribute Aliases)
   - Contains: ATTRIBUTE_ALIASES (200+ mappings)
   - Update: Add variants for new attributes
   - Example: 'colour' → 'Color', 'bulb type' → 'Bulb Type'

2. **category-attributes.ts**
   - Contains: Category → Required/Optional Attributes
   - Update: Add new attributes to category requirements

### Schema Files (schemas/ subfolder)

Category-specific attribute schemas that define which attributes are required/optional for each category:

- `appliances-schema.ts`
- `bathroom-schema.ts`
- `building-materials-schema.ts`
- `electrical-schema.ts`
- `flooring-schema.ts`
- `furniture-schema.ts`
- `hardware-schema.ts`
- `heating-cooling-schema.ts`
- `kitchen-schema.ts`
- `lighting-schema.ts`
- `outdoor-schema.ts`
- `paint-schema.ts`
- `plumbing-schema.ts`
- `tools-schema.ts`
- `windows-doors-schema.ts`

**When attributes.json updates**: Review all category schemas to ensure new attributes are mapped to appropriate categories.

## ⚠️ Also Check
- `06-multiple-picklist-files/` folder for cross-picklist attribute logic
