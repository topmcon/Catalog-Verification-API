# Top 15 Filter Attributes - Category Mismatch Analysis

> **Generated:** 2025-01-27  
> **Purpose:** Review attributes in Top 15 that may not apply to their assigned categories  
> **Source:** `docs/optimized-top15-filter-attributes.json`

---

## Summary

| Metric | Count |
|--------|-------|
| Total Categories Analyzed | 61 |
| Attributes Missing SF IDs | 35 |
| Potential Mismatches Found | 2 |
| Widely Used Attributes (15+ categories) | 7 |

---

## 🚨 CONFIRMED MISMATCHES (Need Removal)

These attributes DO NOT apply to their assigned categories and should be removed from the Top 15:

### 1. Dryer → "Sanitary Rinse" (Rank 12)

| Field | Value |
|-------|-------|
| **Category** | Dryer |
| **Attribute** | Sanitary Rinse |
| **Current Rank** | 12 |
| **SF ID** | `a1aaZ000008mBx4QAE` |
| **Issue** | Sanitary Rinse is a **WASHING** function that uses high-temperature water to sanitize clothes. Dryers do not use water - they only apply heat to dry clothes. |
| **Action Required** | REMOVE from Dryer's Top 15 |
| **Replacement Suggestion** | Consider: "Steam Refresh", "Wrinkle Care", or "Allergy Cycle" |

### 2. Microwave → "CFM" (Rank 4)

| Field | Value |
|-------|-------|
| **Category** | Microwave |
| **Attribute** | CFM (Cubic Feet per Minute) |
| **Current Rank** | 4 |
| **SF ID** | `a1aaZ000008mBoNQAU` |
| **Issue** | CFM is **only relevant for Over-the-Range (OTR) microwaves** that include ventilation fans. Countertop, built-in, and drawer microwaves do not have CFM ratings. |
| **Action Required** | CONDITIONAL - Only applicable to OTR installations |
| **Note** | May need to split into "Microwave" vs "Over-the-Range Microwave" categories, or mark CFM as conditional |

---

## ⚠️ ATTRIBUTES MISSING SALESFORCE IDs

These attributes are defined in Top 15 but have **no corresponding Salesforce ID** (sf_id: null). They cannot be properly synced to Salesforce.

### High Priority (Rank 1-7)

| Category | Attribute | Rank | Action |
|----------|-----------|------|--------|
| **Cabinet Organization** | Organizer Type | 1 | REQUEST SF ID |
| **Storage & Closet Systems** | Storage Type | 1 | REQUEST SF ID |
| **Furnaces & Heaters** | AFUE Rating | 3 | REQUEST SF ID |
| **Bidets** | Spray Adjustability | 4 | REQUEST SF ID |
| **Hydronic Expansion Tanks** | Pre-Charge Pressure | 5 | REQUEST SF ID |
| **Range** | Double Oven | 7 | REQUEST SF ID |
| **Toilet Seats** | Quick Release | 7 | REQUEST SF ID |
| **Steam Showers** | Aromatherapy | 7 | REQUEST SF ID |
| **Furnaces & Heaters** | Multi-Stage | 7 | REQUEST SF ID |
| **Storage & Closet Systems** | Modular | 7 | REQUEST SF ID |

### Medium Priority (Rank 8-12)

| Category | Attribute | Rank | Action |
|----------|-----------|------|--------|
| **Steam Showers** | Auto Drain | 8 | REQUEST SF ID |
| **Mirrors** | Beveled | 8 | REQUEST SF ID |
| **Rough-In Valves** | For Use With | 10 | REQUEST SF ID |
| **Furnaces & Heaters** | ECM Motor | 10 | REQUEST SF ID |
| **Coffee Makers** | Adjustable Brew Strength | 10 | REQUEST SF ID |
| **Hydronic Expansion Tanks** | Replaceable Bladder | 11 | REQUEST SF ID |
| **Cabinet Organization** | Lazy Susan | 11 | REQUEST SF ID |
| **Coffee Makers** | Keep Warm | 11 | REQUEST SF ID |
| **Bar Faucets** | Deck Plate Included | 12 | REQUEST SF ID |
| **Bidets** | Remote Control | 12 | REQUEST SF ID |
| **Air Conditioners** | Remote Control | 12 | REQUEST SF ID |
| **Hydronic Expansion Tanks** | Temperature Range | 12 | REQUEST SF ID |
| **Coffee Makers** | Removable Water Reservoir | 12 | REQUEST SF ID |
| **Ice Makers** | Indicator Light | 12 | REQUEST SF ID |

### Lower Priority (Rank 13-15)

| Category | Attribute | Rank | Action |
|----------|-----------|------|--------|
| **Bidets** | Air Dryer | 13 | REQUEST SF ID |
| **Ceiling Fan Accessories** | Universal Fit | 13 | REQUEST SF ID |
| **Cabinet Organization** | Load Capacity | 13 | REQUEST SF ID |
| **Coffee Makers** | Pause and Pour | 13 | REQUEST SF ID |
| **Toilet Seats** | Remote Control | 14 | REQUEST SF ID |
| **Bathroom Mirrors** | Beveled | 14 | REQUEST SF ID |
| **Garbage Disposals** | Septic Safe | 14 | REQUEST SF ID |
| **Bidets** | Deodorizer | 14 | REQUEST SF ID |
| **Cabinet Organization** | Dividers Included | 14 | REQUEST SF ID |
| **Storage & Closet Systems** | Load Capacity | 14 | REQUEST SF ID |
| **Ventilation** | Ventilation Type | 2 | REQUEST SF ID |

---

## 📊 WIDELY USED ATTRIBUTES (Potential Over-Generalization)

These attributes appear in **15+ categories**. Review if they're actually relevant to ALL these categories:

| Attribute | Categories Using | Review Status |
|-----------|------------------|---------------|
| **Collection** | 30 | ✅ OK - Product families span categories |
| **Material** | 22 | ✅ OK - Universal attribute |
| **Energy Star** | 18 | ✅ OK - Certification applies broadly |
| **Installation Type** | 18 | ✅ OK - Most products need installation |
| **ADA** | 18 | ✅ OK - Accessibility is universal |
| **Smart Home** | 17 | ✅ OK - Smart features span categories |
| **LED** | 17 | ⚠️ REVIEW - Mainly for lighting, but many products have indicator LEDs |

---

## 📋 CATEGORIES BY DEPARTMENT

### APPLIANCES (20 categories)
- Range, Refrigerator, Dishwasher, Wall Oven, Cooktop, Range Hood
- Washer, Dryer, Freezer, Wine Cooler, Microwave
- Air Conditioners, Furnaces & Heaters, Ventilation
- Coffee Makers, Ice Makers, Garbage Disposals, Water Heaters
- Barbeques & Grills, Pizza Ovens

### PLUMBING (17 categories)
- Toilets, Toilet Seats, Bidets
- Kitchen Faucets, Bathroom Faucets, Bar Faucets, Pot Filler Faucets, Tub Faucets
- Bathroom Sinks, Kitchen Sinks, Bar & Prep Sinks
- Bathtubs, Showers, Steam Showers, Shower Accessories
- Drains, Rough-In Valves, Hydronic Expansion Tanks

### LIGHTING (12 categories)
- Ceiling Lights, Chandeliers, Pendant Lights, Wall Sconces
- Recessed Lighting, Track Lighting, Under Cabinet Lighting
- Bathroom Vanity Lighting, Outdoor Lighting, Commercial Lighting
- Ceiling Fans, Ceiling Fan Accessories, Lamps

### HARDWARE & FURNITURE (8 categories)
- Cabinet Hardware, Door Hardware, Bathroom Hardware
- Bathroom Vanities, Bathroom Mirrors, Mirrors
- Cabinet Organization, Storage & Closet Systems, Furniture

---

## 🔧 RECOMMENDED ACTIONS

### Immediate
1. **Remove** "Sanitary Rinse" from Dryer category
2. **Review** "CFM" for Microwave (conditional on installation type)

### Short-term
3. **Request SF IDs** for all 35 missing attributes (provide to Salesforce team)
4. **Create** a JSON file with all missing attribute requests

### Long-term
5. **Audit** each category's Top 15 against actual product data
6. **Consider** splitting categories that have significantly different attribute needs (e.g., Microwave vs OTR Microwave)

---

## 📁 FILES TO UPDATE

1. `docs/optimized-top15-filter-attributes.json` - Remove/fix mismatched attributes
2. `src/config/master-category-attributes.ts` - Sync with JSON changes
3. Salesforce - Create missing attributes and sync IDs back

---

## 🔗 Related Issues

- [ ] Dryer: Remove "Sanitary Rinse" from Top 15 (rank 12)
- [ ] Microwave: Review "CFM" applicability (rank 4)
- [ ] Request 35 Salesforce IDs for missing attributes
- [ ] Update AI prompts to not extract inapplicable attributes

---

*Last Updated: 2025-01-27*
