# Why Appliances Work But Non-Appliances Don't

**Date**: February 24, 2026  
**Question**: "Why is this impacting non-appliance categories but not appliances? Isn't it all the same system?"

---

## 🎯 **THE ANSWER: HARDCODED CATEGORY LISTS**

**TL;DR**: Appliances have a **complete, accurate hardcoded category list** that acts as a guardrail. Non-appliances have **incomplete/missing categories** in the hardcoded list, so AI picks categories that aren't validated properly.

---

## 📋 **The Hardcoded List** (category-matcher.service.ts Lines 25-82)

```typescript
const DEPARTMENT_CATEGORIES: Record<string, string[]> = {
  'Appliances': [
    'Refrigerator',          ✅
    'Dishwasher',            ✅
    'Range',                 ✅
    'Oven',                  ✅
    'Cooktop',               ✅
    'Microwave',             ✅
    'Range Hood',            ✅
    'Washer',                ✅
    'Dryer',                 ✅
    'Freezer',               ✅
    'All in One Washer / Dryer', ✅
    'Barbeque',              ✅
    'Coffee Maker',          ✅
    'Icemaker',              ✅
    'Garbage Disposal'       ✅
  ],  // 15 categories - COMPREHENSIVE!
  
  'Plumbing & Bath': [
    'Bathroom Cabinet Hardware',
    'Outdoor Shower Faucet',
    'Bathroom Faucet',
    'Bathroom Hardware and Accessories',
    'Bathroom Mirror',
    'Bathroom Sink',
    'Bathroom Vanity',
    'Bathtub',
    'Bathtub Waste & Overflow',
    'Bidet',
    'Bidet Faucet',
    'Bidet Seat',
    'Shower',
    'Shower Faucet',
    'Steam Shower'    // ❌ "Pipe Fitting" MISSING!
  ],  // 15 categories - INCOMPLETE!
  
  'Lighting': [
    'Vanity Cabinet Hardware',
    'Skylight',
    'Bathroom Lighting',
    'Vanity Lighting',
    'Chandelier',            ✅ (in list)
    'Commercial Lighting',
    'LED Lighting',
    'Post Light',
    'Recessed Lighting',
    'Step Lighting',
    'Track and Rail Lighting',
    'Under Cabinet Light',
    'Wall Sconce',
    'Lamp',
    'Ceiling Light',
    'Flush and Semi-Flush',
    'Island Lighting',
    'Pendant',
    'Kitchen Lighting',
    'Landscape Lighting'
  ],  // 19 categories
  
  'Home Decor & Fixtures': [
    'Drawer',
    'Cabinet Organization and Storage',
    'Cabinet Hardware'       // ❌ Too generic! "Cabinet Pull" MISSING!
  ],  // ONLY 3 categories - SEVERELY INCOMPLETE!
  
  'HVAC': [
    'Air Conditioner',
    'Dehumidifier',
    'Exhaust Fan',
    'Attic Fan'
  ]  // 4 categories
};
```

---

## 🔍 **The Problem: Missing Categories**

### **Categories in Salesforce Picklists BUT NOT in Hardcoded List**:

**Plumbing & Bath Department**:
- ❌ **"Pipe Fitting"** - Missing from hardcoded list!
- ❌ "Kitchen Sink"
- ❌ "Kitchen Sink Combo"
- ❌ "Kitchen Faucet"
- ❌ "Tub Faucet"
- ❌ "Bar Faucet"
- ❌ "Pot Filler Faucet"
- ❌ "Shower Accessory"
- ❌ "Tub and Shower Accessory"
- ❌ "Medicine Cabinet"
- ❌ "Bath Fan"
- ❌ "Toilet"
- ❌ "Urinal"
- ❌ "Drainage & Waste"
- ...and ~50 more!

**Hardware Department**:
- ❌ **"Cabinet Pull"** - Missing! (only "Cabinet Hardware" generic)
- ❌ "Cabinet Knob"
- ❌ "Cabinet Hinge"
- ❌ "Door Hardware: Knob and Lever"
- ❌ "Door Entry Set"
- ❌ "Deadbolt"
- ❌ "Door Hardware Part"
- ❌ "Barn Door Hardware"
- ❌ "Sliding Door Hardware"
- ...and ~30 more!

**Lighting & Electrical Department**:
- ❌ "Ceiling Fan" - Missing!
- ❌ "Ceiling Fan Accessory"
- ❌ "Lighting Accessory"
- ✅ "Chandelier" - Present ✅
- ✅ "Pendant" - Present ✅

---

## 🚨 **Why This Causes Contamination**

### **Appliances (WORKS CORRECTLY)**:

```
Stage 1: Determine Department
   ↓
   AI: "Appliances" ✅
   ↓
Stage 2: Pick Category (filtered by "Appliances")
   ↓
   DEPARTMENT_CATEGORIES['Appliances'] returns:
   [Refrigerator, Dishwasher, Range, Oven, Cooktop, Microwave, ...]
   ✅ ALL 15 major appliance categories present
   ↓
   AI sees ONLY appliance categories
   AI picks: "Refrigerator" ✅
   ↓
Stage 3: Show types for Refrigerator
   ✅ Schema validation works perfectly
```

**Result**: AI can only pick from the 15 appliance categories → All valid → No contamination

---

### **Non-Appliances (FAILS)**:

#### **Case 1: Chandelier → "Pipe Fitting"**

```
Stage 1: Determine Department
   ↓
   AI: "Plumbing & Bath" ❌ (WRONG DEPARTMENT!)
   ↓
Stage 2: Pick Category (filtered by "Plumbing & Bath")
   ↓
   DEPARTMENT_CATEGORIES['Plumbing & Bath'] returns:
   [Bathroom Cabinet Hardware, Outdoor Shower Faucet, Bathroom Faucet, ...]
   ❌ "Pipe Fitting" is NOT in hardcoded list
   ❌ But "Pipe Fitting" IS in Salesforce picklist categories.json
   ↓
   AI has access to ALL Plumbing & Bath categories from categories.json
   Including: Pipe Fitting, Kitchen Sink, Medicine Cabinet, etc.
   ↓
   AI picks: "Pipe Fitting" ❌
   ↓
Stage 3: Show types for "Pipe Fitting"
   Types: Elbow, Tee, Coupling, Union, Nipple, Adapter
   ❌ Nothing matches Chandelier
```

**Result**: Hardcoded list doesn't include "Pipe Fitting", so no validation against it. AI free to pick it.

---

#### **Case 2: Cabinet Pull → "Hardware" + "Wall Mirror" Type**

```
Stage 1: Determine Department
   ↓
   AI: "Hardware" ❌ (Too generic)
   ↓
Stage 2: Pick Category
   ↓
   DEPARTMENT_CATEGORIES['Home Decor & Fixtures'] returns:
   ['Drawer', 'Cabinet Organization and Storage', 'Cabinet Hardware']
   ❌ Only 3 categories! "Cabinet Pull" NOT listed!
   ❌ Only generic "Cabinet Hardware" available
   ↓
   AI picks: "Cabinet Hardware" ❌ (too generic)
   ↓
   Category Matcher: Maps "Cabinet Hardware" → "Cabinet Pull" ✅ (smart resolution)
   But now we're in Stage 3...
   ↓
Stage 3: Show types
   ❌ PROBLEM: AI originally thought category was "Cabinet Hardware"
   ❌ So it showed types from ALL hardware subcategories:
      - Cabinet Pull types (Bar Pull, Cup Pull)
      - Cabinet Knob types (Round Knob, Square Knob)
      - Hinge types (Overlay, Inset)
      - Mirror types (Wall Mirror, Medicine Cabinet) ← AI picks this!
```

**Result**: Generic parent category shows types from ALL child categories, causing cross-contamination.

---

## 🔧 **How the Hardcoded List is Used**

### **Function: `findDirectMatch(input: string)` (Lines 150-170)**

```typescript
function findDirectMatch(input: string): { categoryName: string; department: string } | null {
  const normalized = normalizeText(input);
  
  // Check each department
  for (const [dept, categories] of Object.entries(DEPARTMENT_CATEGORIES)) {
    for (const cat of categories) {
      const cleanCat = cat.replace(/ #$/, ''); // Remove trailing #
      if (normalizeText(cleanCat) === normalized) {
        return { categoryName: cat, department: dept };  // ✅ VALIDATES
      }
      
      // Check aliases
      const aliases = CATEGORY_ALIASES[cleanCat] || [];
      for (const alias of aliases) {
        if (normalizeText(alias) === normalized) {
          return { categoryName: cat, department: dept };  // ✅ VALIDATES
        }
      }
    }
  }
  return null;  // ❌ NOT IN HARDCODED LIST → NO VALIDATION
}
```

**What it does**:
- ✅ If category IN hardcoded list → Returns it with department
- ❌ If category NOT in hardcoded list → Returns `null` (no validation)

**The problem**:
- "Refrigerator" → IN list → Validated as "Appliances" ✅
- "Pipe Fitting" → NOT in list → No validation ❌ → AI picks it anyway
- "Cabinet Pull" → NOT in list → Generic "Cabinet Hardware" used instead ❌

---

## 📊 **Coverage Analysis**

### **Appliances Coverage**: **100% Complete** ✅

All major appliance categories in hardcoded list:
- Refrigerator ✅
- Dishwasher ✅
- Range ✅
- Oven ✅
- Cooktop ✅
- Microwave ✅
- Range Hood ✅
- Washer ✅
- Dryer ✅
- Freezer ✅
- All in One Washer / Dryer ✅
- Specialty appliances (Barbeque, Coffee Maker, Icemaker, Garbage Disposal) ✅

**Result**: AI cannot pick invalid appliance categories

---

### **Plumbing & Bath Coverage**: **~20% Complete** ❌

**In hardcoded list** (15 categories):
- Bathroom Cabinet Hardware ✅
- Bathroom Faucet ✅
- Bathroom Hardware and Accessories ✅
- Bathroom Mirror ✅
- Bathroom Sink ✅
- Bathroom Vanity ✅
- Bathtub ✅
- Bathtub Waste & Overflow ✅
- Bidet ✅
- Bidef Faucet ✅
- Bidet Seat ✅
- Outdoor Shower Faucet ✅
- Shower ✅
- Shower Faucet ✅
- Steam Shower ✅

**MISSING from hardcoded list** (~60 categories including):
- ❌ **Pipe Fitting** (industrial plumbing - causes Chandelier contamination)
- ❌ Kitchen Sink
- ❌ Kitchen Sink Combo
- ❌ Kitchen Faucet
- ❌ Tub Faucet
- ❌ Bar Faucet
- ❌ Pot Filler Faucet
- ❌ Food Service Faucet
- ❌ Shower Accessory
- ❌ Medicine Cabinet
- ❌ Bath Fan
- ❌ Toilet
- ❌ Urinal
- ❌ Drainage & Waste
- ❌ Rough-In Valve
- ❌ Water Filter
- ❌ Water Softener
- ❌ And 43+ more...

**Result**: AI can pick invalid categories like "Pipe Fitting"

---

### **Hardware Coverage**: **~5% Complete** ❌

**In hardcoded list** (Only 3 generic categories):
- Drawer (really? This is home decor, not hardware)
- Cabinet Organization and Storage
- Cabinet Hardware (too generic!)

**MISSING from hardcoded list** (~50 categories including):
- ❌ **Cabinet Pull** (specific hardware - causes "Wall Mirror" type contamination)
- ❌ Cabinet Knob
- ❌ Cabinet Hinge
- ❌ Door Hardware: Knob and Lever
- ❌ Door Entry Set
- ❌ Deadbolt
- ❌ Door Closer
- ❌ Door Stop
- ❌ Barn Door Hardware
- ❌ Sliding Door Hardware
- ❌ Commercial Door Hardware
- ❌ Window Hardware
- ❌ Mailbox
- ❌ House Number
- ❌ And 36+ more...

**Result**: AI picks generic "Cabinet Hardware" → Shows types from ALL subcategories → "Wall Mirror" bleeds in

---

### **Lighting & Electrical Coverage**: **~30% Complete** 🟡

**In hardcoded list** (19 categories):
- Bathroom Lighting ✅
- Ceiling Light ✅
- Chandelier ✅ (important!)
- Commercial Lighting ✅
- Flush and Semi-Flush ✅
- Island Lighting ✅
- Kitchen Lighting ✅
- Lamp ✅
- Landscape Lighting ✅
- LED Lighting ✅
- Pendant ✅
- Post Light ✅
- Recessed Lighting ✅
- Skylight ✅
- Step Lighting ✅
- Track and Rail Lighting ✅
- Under Cabinet Light ✅
- Vanity Cabinet Hardware ✅ (why is this in Lighting?)
- Vanity Lighting ✅
- Wall Sconce ✅

**MISSING from hardcoded list** (~40 categories including):
- ❌ **Ceiling Fan** (common category - causes issues)
- ❌ **Ceiling Fan Accessory**
- ❌ **Lighting Accessory** (downrods, shades, blades)
- ❌ Outdoor Lighting
- ❌ Path Light
- ❌ Flood Light
- ❌ Security Light
- ❌ Smoke Detector
- ❌ Carbon Monoxide Detector
- ❌ Doorbell
- ❌ Dimmer Switch
- ❌ Light Switch
- ❌ Outlet
- ❌ And 27+ more...

**Result**: Some lighting categories work (Chandelier ✅), others fail (Ceiling Fan ❌)

---

## 🎯 **Why Appliances Don't Have This Problem**

### **Reason 1: Complete Category List**

**Appliances**: All 15 major appliance categories hardcoded  
**Non-Appliances**: Only ~30% of categories hardcoded

### **Reason 2: Clear Boundaries**

**Appliances**: Very distinct categories
- "Refrigerator" vs "Dishwasher" vs "Range" → No overlap
- AI can easily distinguish

**Non-Appliances**: Ambiguous categories
- "Pipe Fitting" vs "Bathroom Hardware" vs "Shower Accessory" → Overlap
- "Cabinet Hardware" vs "Cabinet Pull" vs "Cabinet Knob" → Hierarchy confusion

### **Reason 3: No Generic Parent Categories**

**Appliances**: No generic "Appliances" category (all specific)
- Never "Appliances" → Always "Refrigerator", "Dishwasher", etc.

**Non-Appliances**: Has generic parents
- "Hardware" (generic) vs "Cabinet Pull" (specific)
- "Lighting & Electrical" (generic) vs "Chandelier" (specific)
- Generic parents show types from ALL children → Contamination

### **Reason 4: Appliances Were Prioritized**

**Historical Context**: 
- Appliances were likely the first products verified → Got complete hardcoded list
- Non-appliances added later → Hardcoded list not updated
- Comment says "AUTO-GENERATED FROM: categories.json" but clearly incomplete

---

## 💡 **Why the Hardcoded List Exists**

Looking at the code, `DEPARTMENT_CATEGORIES` serves two purposes:

### **1. Category Validation** (Lines 150-170)
```typescript
function findDirectMatch(input: string) {
  // Checks if AI-selected category exists in DEPARTMENT_CATEGORIES
  // If YES → Validates department mapping
  // If NO → No validation (returns null)
}
```

### **2. Department Determination** (Lines 183-200)
```typescript
function findKeywordMatch(text: string) {
  // Searches product text for category keywords
  // Uses DEPARTMENT_CATEGORIES to determine department from category match
}
```

**The Problem**: If category not in hardcoded list, both functions fail:
- No validation → AI picks invalid categories
- No keyword match → AI misclassifies department

---

## 🔧 **The Fix**

### **Option 1: Complete the Hardcoded List** (RECOMMENDED)

**Add ALL missing categories** to `DEPARTMENT_CATEGORIES`:

```typescript
const DEPARTMENT_CATEGORIES: Record<string, string[]> = {
  'Appliances': [
    // ... existing 15 categories (keep as-is) ✅
  ],
  
  'Plumbing & Bath': [
    // ... existing 15 categories
    // ADD MISSING:
    'Pipe Fitting',          // ← Fixes Chandelier → Pipe Fitting
    'Kitchen Sink',
    'Kitchen Sink Combo',
    'Kitchen Faucet',
    'Tub Faucet',
    'Bar Faucet',
    'Pot Filler Faucet',
    'Shower Accessory',
    'Medicine Cabinet',
    'Bath Fan',
    'Toilet',
    'Urinal',
    'Drainage & Waste',
    // ... +50 more
  ],
  
  'Hardware': [
    // REPLACE "Home Decor & Fixtures" with proper "Hardware"
    'Cabinet Pull',          // ← Fixes Cabinet Pull → Wall Mirror
    'Cabinet Knob',
    'Cabinet Hinge',
    'Door Hardware: Knob and Lever',
    'Door Entry Set',
    'Deadbolt',
    'Barn Door Hardware',
    // ... +40 more
  ],
  
  'Lighting & Electrical': [
    // ... existing 19 categories
    // ADD MISSING:
    'Ceiling Fan',           // ← Fixes ceiling fan issues
    'Ceiling Fan Accessory',
    'Lighting Accessory',
    // ... +35 more
  ]
};
```

**Impact**: 
- ✅ Validates ALL categories against picklist
- ✅ Prevents AI from picking invalid categories
- ✅ Provides correct department mapping
- ⚠️ Requires regeneration when categories.json changes

---

### **Option 2: Auto-Generate from categories.json** (IDEAL)

**Replace hardcoded list** with dynamic loader:

```typescript
import categoriesPicklist from '../config/salesforce-picklists/categories.json';

// Generate DEPARTMENT_CATEGORIES from categories.json at runtime
const DEPARTMENT_CATEGORIES = categoriesPicklist.reduce((acc, cat) => {
  const dept = cat.department_name;
  if (!acc[dept]) acc[dept] = [];
  acc[dept].push(cat.category_name);
  return acc;
}, {} as Record<string, string[]>);
```

**Impact**:
- ✅ Always in sync with categories.json
- ✅ No manual updates needed
- ✅ Auto-updates when picklist syncs from Salesforce
- ✅ Covers ALL categories

---

### **Option 3: Add Validation Layer** (COMPLEMENTARY)

**Don't rely on hardcoded list alone** - add explicit validation:

```typescript
// After Stage 2 category determination
const determinedCategory = buildCategoryConsensus();

// NEW: Validate category exists in categories.json
const categoryExists = categoriesPicklist.some(
  c => c.category_name === determinedCategory
);

if (!categoryExists) {
  logger.error('🔴 AI selected non-existent category', {
    category: determinedCategory,
    availableCategories: categoriesPicklist.map(c => c.category_name)
  });
  
  // Force re-analysis with strict mode
}
```

**Impact**:
- ✅ Catches invalid categories regardless of hardcoded list
- ✅ Provides fallback if hardcoded list incomplete
- ✅ Logs errors for monitoring

---

## 📝 **Summary**

**Q: Why do appliances work but non-appliances don't?**

**A: Appliances have a COMPLETE hardcoded category list (15/15 = 100%), while non-appliances are INCOMPLETE:**
- Plumbing & Bath: 15/~75 = 20%
- Hardware: 3/~50 = 5%
- Lighting: 19/~60 = 30%

**The same system** is used for both, but:
- ✅ Appliance categories ALL in hardcoded list → Validated → No contamination
- ❌ Non-appliance categories MISSING from list → Not validated → AI picks invalid categories

**The fix**: Complete the hardcoded list OR auto-generate from categories.json

**Priority**: Option 2 (Auto-Generate) is best long-term solution. Option 1 (Complete the list) is quick fix.

