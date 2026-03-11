# Category Matching Analysis - Items 58 & 68

**Date**: 2026-03-11  
**Issue**: Two items from 73-item lighting/plumbing test are being miscategorized

---

## Item 68: FMC022436L - Medicine Cabinet

### Current State (WRONG):
- **AI Category**: Wall Decor ❌
- **AI Type**: Accessory

### Product Data:
- **Ferguson Title**: "24" Bathroom Medicine Cabinet with LED Lighting & Defogger"
- **Model**: FMC022436L
- **Actual Product**: Bathroom medicine cabinet with integrated LED lighting

### Correct Match (EXISTS IN SALESFORCE):
- **Department**: Plumbing & Bath
- **Family**: Bath
- **Category**: Medicine Cabinet ✅ (ID: a01aZ00000dC5DqQAK)
- **Type**: Lighted ✅ (existing type)

### Available Types for Medicine Cabinet:
1. Recessed
2. Surface Mount
3. Framed
4. Frameless
5. **Lighted** ← CORRECT TYPE
6. Accessory

### Why It's Matching Wrong:
- Category matcher not recognizing "Medicine Cabinet" from title
- Falling through to "Wall Decor" as a wall-mounted decorative item
- Need to improve matching keywords for Medicine Cabinet category

---

## Item 58: RL2782NB - Picture Light

### Current State (WRONG):
- **AI Category**: Track and Rail Lighting ❌
- **AI Type**: Down Light

### Product Data:
- **Ferguson Title**: "32" Langley Wide LED Picture Light"
- **Model**: RL2782NB
- **Actual Product**: LED picture light for illuminating artwork

### Issue Discovery:
- **"Picture Light" exists as a TYPE** in types.json (ID: a1jaZ000001lF9GQAU)
- **"Picture Light" is NOT mapped to any CATEGORY** in category-type-mapping.json
- This is an **orphaned type** - exists but has no category assignment

### Correct Match (EXISTS IN SALESFORCE):
**Option 1: Wall Sconce** (BEST MATCH)
- **Department**: Lighting & Electrical
- **Family**: Indoor Lighting
- **Category**: Wall Sconce ✅ (ID: a01aZ00000dC5EeQAK)
- **Type**: Down Light ✅ (existing type)
- **Reasoning**: Picture lights are wall-mounted fixtures that direct light downward onto artwork

**Available Types for Wall Sconce**:
1. Wall Sconce
2. Swing Arm
3. Up Light
4. **Down Light** ← CORRECT TYPE (lights directed downward)
5. Bath Bar
6. Vanity
7. 1-Light, 2-Light, 3-Light, etc.

### Why It's Matching Wrong:
- AI sees "Light" in title and matches to specialty lighting categories
- "Track and Rail Lighting" is also in Specialty Lighting subcategory
- Need to improve matching to recognize picture lights belong in Wall Sconce category

---

## Recommended Fix Strategy

### For Medicine Cabinet (Item 68):
**Approach**: Improve category keyword matching

1. **Add category matching keywords** for "Medicine Cabinet":
   - "medicine cabinet"
   - "bathroom medicine cabinet"
   - "medicine cabinets"
   - "LED medicine cabinet"
   - "lighted medicine cabinet"
   
2. **Prevent "Wall Decor" false positive**:
   - Add exclusion logic: if title contains "cabinet" + ("medicine" or "bathroom"), skip "Wall Decor"
   - "Wall Decor" should only match truly decorative items, not functional storage

### For Picture Light (Item 58):
**Approach**: Map picture light products to Wall Sconce category

1. **Add category matching keywords** for "Wall Sconce":
   - "picture light"
   - "art light"
   - "display light"
   
2. **AI prompts should recognize**:
   - Picture lights are a type of wall-mounted directional lighting
   - Should be categorized as Wall Sconce with Type=Down Light
   - Function: illuminate artwork/pictures from above

---

## Implementation Plan

### Phase 1: Category Matcher Service Updates
**File**: `src/services/category-matcher.service.ts` or `src/config/category-aliases.ts`

```typescript
// Add to category matching logic:
const CATEGORY_KEYWORDS = {
  'Medicine Cabinet': [
    'medicine cabinet',
    'medicine cabinets',
    'bathroom medicine cabinet',
    'led medicine cabinet',
    'lighted medicine cabinet',
    'mirrored medicine cabinet'
  ],
  'Wall Sconce': [
    'wall sconce',
    'wall sconces',
    'picture light',
    'art light',
    'display light',
    'swing arm light'
  ]
};

// Add exclusion logic for Wall Decor:
if (normalizedText.includes('cabinet') && 
    (normalizedText.includes('medicine') || normalizedText.includes('bathroom'))) {
  // Exclude "Wall Decor" match
  return 'Medicine Cabinet';
}
```

### Phase 2: AI Prompt Enhancement
**File**: `src/services/dual-ai-verification.service.ts`

Add context to AI prompts:
- Medicine cabinets with LED/lighting → Category: Medicine Cabinet, Type: Lighted
- Picture lights for artwork → Category: Wall Sconce, Type: Down Light

### Phase 3: Validation
Test with both items:
- Item 68: Should match Medicine Cabinet + Type: Lighted
- Item 58: Should match Wall Sconce + Type: Down Light

---

## Notes

### Picture Light Type Issue:
- "Picture Light" type (ID: a1jaZ000001lF9GQAU) exists in types.json
- NOT mapped to any category in category-type-mapping.json
- This is likely a Salesforce data gap
- **Workaround**: Map picture light products to Wall Sconce + Down Light (functionally equivalent)
- **Long-term**: Request Salesforce to either:
  - Map "Picture Light" type to Wall Sconce category, OR
  - Create dedicated Picture Light category if warranted

### Wall Decor False Positives:
- Wall Decor should only match purely decorative items
- Functional wall-mounted items (medicine cabinets, sconces) incorrectly matching
- Need stricter matching rules to prevent this

---

## Success Criteria

✅ Item 68 (FMC022436L) matches to: Medicine Cabinet + Type: Lighted  
✅ Item 58 (RL2782NB) matches to: Wall Sconce + Type: Down Light  
✅ Wall Decor only matches non-functional decorative items  
✅ No changes to Salesforce picklists required (using existing hierarchy)
