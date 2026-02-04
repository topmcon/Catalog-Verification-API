# Product Style Strategy - Hybrid Approach

**Updated**: 2026-02-04  
**Status**: Active

---

## Overview

The `Product_Style_Verified` field uses a **hybrid approach** where different category types prioritize different style classifications:

- **Appliances**: Functional type (Gas, French Door, Front Load, etc.)
- **Design Products** (Faucets, Lighting, Showers): Product type FIRST, design aesthetic as fallback
- **Theme attribute**: Captures design aesthetic separately in Additional_Attributes HTML

---

## Strategy by Category Type

### 🔧 Appliances (Functional Type = Style)

These categories use **functional/configuration type** as their primary style classification:

| Category | Style Examples | Purpose |
|----------|---------------|---------|
| **Refrigerator** | French Door, Side-by-Side, Bottom-Freezer, Top-Freezer | Configuration type |
| **Range** | Gas, Electric, Dual Fuel, Slide-In, Freestanding | Fuel + installation |
| **Dishwasher** | Built-In, Drawer, Portable, Top Control | Installation type |
| **Washer** | Front Load, Top Load | Loading type |
| **Cooktop** | Gas, Induction, Electric, Downdraft | Fuel type |
| **Microwave** | Over-the-Range, Countertop, Built-In, Drawer | Installation type |

**Example**: A gas range would be `Product_Style_Verified: "Gas"`, NOT "Modern"

---

### 🚿 Design Products (Product Type = Style)

These categories use **product type** as their primary style classification:

#### Showers

| Product Type | When to Use | Example Product |
|-------------|-------------|-----------------|
| **Showerhead** | Generic standalone showerhead | Basic wall-mounted showerhead |
| **Rain Head** | Large overhead rain showerheads | RIOBEL 356BK (2 GPM multi-function rain head) |
| **Handheld** | Handheld showerheads | Detachable handheld shower spray |
| **Shower System** | Complete systems (valve + trim + head) | Full shower kit with valve and multiple heads |
| **Body Spray** | Body spray jets | Side-mounted body spray nozzles |
| **Shower Panel** | Tower/panel systems | All-in-one shower tower panels |
| **Dual Shower** | Combo (fixed + handheld) | Combined showerhead with handheld option |
| **Alcove** | Installation type | 3-wall alcove shower enclosure |
| **Walk-In** | Installation type | Doorless walk-in shower |
| **Steam** | Special feature | Steam shower system |

**Fallback**: If no product type matches, use design style (Modern, Traditional, etc.)

**Example**: RIOBEL 356BK would be `Product_Style_Verified: "Rain Head"`, NOT "Modern"

#### Faucets

| Category | Product Type Examples |
|----------|---------------------|
| **Bathroom Faucets** | Single Hole, Widespread, Centerset, Wall Mounted, Vessel |
| **Kitchen Faucets** | Single Handle, Pull-Down, Pull-Out, Bridge, Pot Filler |
| **Shower Faucets** | Rain, Handheld, Dual, Thermostatic, Pressure Balance |
| **Tub Faucets** | Wall Mounted, Deck Mounted, Freestanding, Roman Tub |

#### Lighting

| Category | Product Type Examples |
|----------|---------------------|
| **Chandeliers** | Crystal, Candle, Drum, Globe, Sputnik, Linear |
| **Pendants** | Mini, Multi-Light, Drum, Globe, Cone, Linear |
| **Wall Sconces** | Up Light, Down Light, Swing Arm, Picture Light |
| **Ceiling Lights** | Flush Mount, Semi-Flush, Recessed, Track |

---

## How AI Selects Style

### Priority Order

1. **Check Ferguson/Web Retailer attributes** for product-specific identifiers
   - Ferguson "Showerhead" attribute → might indicate "Multi Function" vs "Fixed"
   - Ferguson "Faucet Type" → "Shower Faucet", "Tub Filler", etc.

2. **Infer product type from title/description**
   - "Rain Showerhead" → "Rain Head"
   - "Pull-Down Kitchen Faucet" → "Pull-Down"
   - "Crystal Chandelier" → "Crystal"

3. **Fallback to Ferguson Theme attribute** (if product type not determinable)
   - Theme: "Modern" → Use as last resort for design products

4. **Match against category mapping** in `category-style-mapping.ts`
   - Validates AI selection is appropriate for the category
   - If not in mapping, log warning

---

## Configuration File

All valid styles per category are defined in:

```
src/config/category-style-mapping.ts
```

### Structure

```typescript
export const CATEGORY_STYLE_MAPPING: Record<string, string[]> = {
  'Showers': [
    // PRODUCT TYPES (Primary - AI should prefer these)
    'Showerhead',
    'Rain Head',
    'Handheld',
    'Shower System',
    // ... more product types
    
    // INSTALLATION TYPES (Secondary)
    'Alcove',
    'Corner',
    'Walk-In',
    // ... more installation types
    
    // DESIGN STYLES (Fallback - only if no product type matches)
    ...UNIVERSAL_DESIGN_STYLES  // Modern, Contemporary, Traditional, etc.
  ],
  
  'Refrigerator': [
    'French Door',
    'Side-by-Side',
    'Bottom-Freezer',
    // ... functional types only (no design styles)
  ]
};
```

---

## AI Prompt Instructions

The AI receives this guidance in the prompt:

```typescript
"product_style": "value (CRITICAL: For design products like faucets/showers/lighting, 
prefer PRODUCT TYPE over design aesthetic. Example: 'Rain Head' not 'Modern', 
'Single Hole' not 'Contemporary'. For appliances, use functional type like 'Gas', 
'French Door', etc.)"
```

---

## Where Design Aesthetic Goes

Design aesthetic (Modern, Contemporary, Traditional, etc.) is captured in:

### 1. Additional_Attributes_HTML (Always)

```html
<tr>
  <td>Theme</td>
  <td>Modern</td>
</tr>
```

**Source**: Ferguson "Theme" attribute or AI inference

### 2. Product_Style_Verified (Fallback Only)

Only used when:
- No product type can be determined
- Category has no specific product types defined
- AI cannot infer product type from data

---

## Example: RIOBEL 356BK Showerhead

### Before (Old Behavior)
```json
{
  "Product_Style_Verified": "Modern",
  "Style_Id": "a1IaZ000001TWAPUA4",
  "Additional_Attributes_HTML": "... <tr><td>Theme</td><td>Modern</td></tr> ..."
}
```
❌ Problem: "Modern" is aesthetic, not product type. Not useful for filtering.

### After (New Behavior)
```json
{
  "Product_Style_Verified": "Rain Head",
  "Style_Id": "a1IaZ000001XYZ1234",  // (once SF creates it)
  "Additional_Attributes_HTML": "... <tr><td>Theme</td><td>Modern</td></tr> ..."
}
```
✅ Better: Customers can filter by product type. Design aesthetic still captured.

---

## Benefits

### For Customers
- **Better filtering**: Search for "Rain Head" showerheads vs all "Modern" products
- **Product type clarity**: Immediately understand what kind of product it is
- **Design aesthetic preserved**: Still visible in specs table

### For Salesforce
- **Useful picklists**: Style dropdown shows product types, not just aesthetics
- **Better categorization**: Products grouped by function, not just appearance
- **Consistent with appliances**: Same logic pattern across catalog

### For Development
- **Clear mapping**: Each category explicitly defines valid styles
- **Easy updates**: Add new product types to mapping file
- **AI guidance**: Prompt instructs AI to prefer product types

---

## Adding New Styles

When you need to add a new style (e.g., "Waterfall Showerhead"):

1. **Update mapping file**: Add to appropriate category in `category-style-mapping.ts`
   ```typescript
   'Showers': [
     'Showerhead',
     'Rain Head',
     'Waterfall',  // ← NEW
     // ...
   ]
   ```

2. **Deploy to production**: Code goes live

3. **First API call with new style**: 
   - AI uses "Waterfall" as product_style
   - Mapping validates it's appropriate for "Showers"
   - Sent to SF in `Style_Requests` array
   - SF creates new picklist value

4. **Future calls**: SF syncs back the new style with ID, system uses it

---

## Questions?

- **Q**: What if a product has BOTH a type and aesthetic?  
  **A**: Type goes in Product_Style, aesthetic goes in Theme (Additional_Attributes)

- **Q**: What if AI can't determine product type?  
  **A**: Falls back to design style (Modern, Traditional, etc.) or uses Theme from Ferguson

- **Q**: Do all categories need product types?  
  **A**: No - appliances use functional types, which they already have. This mainly affects design products.

- **Q**: What if a style doesn't exist in SF yet?  
  **A**: System sends it in Style_Requests, SF creates it, syncs back

---

## Related Files

- **Mapping**: `src/config/category-style-mapping.ts`
- **Matching Logic**: `src/services/dual-ai-verification.service.ts` (lines 4170-4380)
- **AI Prompt**: `src/services/dual-ai-verification.service.ts` (lines 2450-2470)
- **Style Requests**: `src/utils/picklist-matcher.ts` (Style_Requests builder)
