# Category Hierarchy Analysis

**Generated:** February 6, 2026  
**Source:** `src/config/salesforce-picklists/categories.json`  
**Total Categories:** 212

## Executive Summary

Our current category list contains significant redundancy where many categories are essentially sub-types of broader "core" categories. This creates confusion for AI classification and potential inconsistencies in product categorization.

**Key Issues:**
- **Ceiling Fans:** 17 overlapping categories (all are just ceiling fans with different features)
- **Cabinet Hardware:** 20 overlapping categories (all are cabinet hardware variants)
- **Lighting:** Multiple room-specific AND type-specific categories causing overlap
- **11 Exact Duplicates:** Same category appears in multiple departments

---

## Recommended Core Categories & Their Sub-Categories

### 🚿 FAUCETS

#### Core: Bathroom Faucets
| Sub-Category | Rationale |
|--------------|-----------|
| Shower Faucets | Showers are in bathrooms - these are bathroom faucets |
| Bidet Faucets | Bidets are in bathrooms - these are bathroom faucets |
| Tub Faucets* | Tubs are in bathrooms - these are bathroom faucets |
| Outdoor Shower Faucets | Edge case - could be separate due to outdoor use |

*Note: "Tub Faucets" doesn't exist as separate category but logically would fall here*

#### Core: Kitchen Faucets
| Sub-Category | Rationale |
|--------------|-----------|
| Bar Faucets | Bar prep area is kitchen-adjacent, similar function |
| Pot Filler Faucets | Used exclusively in kitchens |
| Food Service Faucets | Commercial kitchen faucets |
| Hot & Cold Water Dispensers | Mounted at kitchen sink |

---

### 🪭 CEILING FANS (MAJOR CONSOLIDATION NEEDED)

#### Core: Ceiling Fans
**All of these are just ceiling fans with different features/attributes:**

| Sub-Category | What Makes It "Different" | Should Be... |
|--------------|---------------------------|--------------|
| Ceiling Fans with Light | Has integrated light | Attribute: `has_light: true` |
| Ceiling Fans with Remotes | Has remote control | Attribute: `has_remote: true` |
| Ceiling Fans without Light | No light | Attribute: `has_light: false` |
| DC Motor Ceiling Fans | Motor type | Attribute: `motor_type: DC` |
| Designer Ceiling Fans | Aesthetic designation | Attribute: `style: Designer` |
| Dual Ceiling Fans | Blade configuration | Attribute: `blade_config: Dual` |
| Fandelier Ceiling Fans | Chandelier + fan combo | Style or feature attribute |
| Hugger Fans | Low-profile mount | Attribute: `mount_type: Hugger` |
| Indoor Ceiling Fans | Location | Attribute: `indoor_outdoor: Indoor` |
| Large Ceiling Fans | Size | Attribute: `size: Large` |
| LED Ceiling Fans | Light type | Attribute: `light_type: LED` |
| Outdoor Ceiling Fans | Location | Attribute: `indoor_outdoor: Outdoor` |
| Small Ceiling Fans | Size | Attribute: `size: Small` |
| Smart Home Fans | Smart features | Attribute: `smart_enabled: true` |
| Trending Ceiling Fans | Marketing designation | Should not be a category |
| Lighted Ceiling Fans | Same as "with Light" | Duplicate concept |

**Recommendation:** Single "Ceiling Fans" category with attributes for features.

---

### 💡 LIGHTING

#### Core: Ceiling Lights
| Sub-Category | Rationale |
|--------------|-----------|
| Chandeliers | Type of ceiling-mounted light |
| Pendants | Type of ceiling-mounted light |
| Flush and Semi-Flush | Ceiling mount style |
| Island Lighting | Ceiling-mounted over island |
| Recessed Lighting | Ceiling-mounted (recessed) |
| Track and Rail Lighting | Ceiling-mounted track systems |

#### Core: Wall Lights
| Sub-Category | Rationale |
|--------------|-----------|
| Wall Sconces | Wall-mounted fixture |
| Vanity Lighting | Wall-mounted bathroom fixture |
| Step Lighting | Wall-mounted stair lights |

#### Core: Outdoor Lighting
| Sub-Category | Rationale |
|--------------|-----------|
| Landscape Lighting | Outdoor ground/path lights |
| Post Lights | Outdoor post-mounted |

#### Core: Task Lighting
| Sub-Category | Rationale |
|--------------|-----------|
| Under Cabinet Lights | Task lighting under cabinets |
| Lamps | Portable task/ambient lighting |

#### Room-Specific Categories (Could be consolidated)
| Category | Could Merge Into |
|----------|------------------|
| Bathroom Lighting | Wall Lights (Vanity) + Ceiling Lights |
| Kitchen Lighting | Ceiling Lights (Pendants, Recessed) |
| Commercial Lighting | Separate department concern |

#### Feature Categories (Should be attributes, not categories)
| Category | Should Be Attribute |
|----------|---------------------|
| LED Lighting | `light_source: LED` |
| Light Bulbs | Accessory, not fixture category |

---

### 🔧 CABINET HARDWARE (MAJOR CONSOLIDATION NEEDED)

#### Core: Cabinet Hardware
**All of these are cabinet hardware variants:**

| Sub-Category | Type | Keep As Category? |
|--------------|------|-------------------|
| Cabinet Knobs | Knob | Yes - distinct product type |
| Cabinet Pulls | Pull | Yes - distinct product type |
| Cabinet Hinges | Hinge | Yes - distinct product type |
| Cabinet Catches and Latches | Hardware | Yes - distinct product type |
| Cabinet Locks | Lock | Yes - distinct product type |
| Drawer Slides and Accessories | Hardware | Yes - distinct product type |
| Backplates | Accessory | Yes - distinct product type |
| Appliance Pulls | Pull variant | Could merge into Cabinet Pulls |
| Cabinet Organization and Storage | Different category entirely | Separate from hardware |

**Price/Quality Tiers (Should NOT be categories):**
| Sub-Category | Should Be... |
|--------------|--------------|
| Affordable Cabinet Knobs | Attribute: `price_tier: Affordable` |
| Affordable Cabinet Pulls | Attribute: `price_tier: Affordable` |
| Luxury Cabinet Knobs | Attribute: `price_tier: Luxury` |
| Luxury Cabinet Pulls | Attribute: `price_tier: Luxury` |
| Designer Cabinet Hardware | Attribute: `style: Designer` |

**Bulk/Template Categories (Should NOT be categories):**
| Sub-Category | Should Be... |
|--------------|--------------|
| Cabinet Hardware Bulk Packs | Order type, not product type |
| Cabinet Hardware Mounting Templates | Accessory/Tool |
| Cabinet Finishing | Different product entirely |

**Room-Specific (Redundant):**
| Sub-Category | Already Covered By |
|--------------|-------------------|
| Vanity Cabinet Hardware | Cabinet Knobs/Pulls |
| Bathroom Cabinet Hardware | Cabinet Knobs/Pulls |

---

### 🚪 DOOR HARDWARE

#### Core: Door Hardware
| Sub-Category | Keep? | Rationale |
|--------------|-------|-----------|
| Door Knobs | Yes | Distinct type |
| Door Levers | Yes | Distinct type |
| Handlesets | Yes | Distinct type |
| Deadbolts | Yes | Distinct type |
| Door Hinges | Yes | Distinct type |
| Mortise Locks | Yes | Distinct type |
| Keyless Entry | Yes | Distinct type |

#### Application-Specific (Could be attributes)
| Sub-Category | Could Be Attribute |
|--------------|-------------------|
| Barn Door Hardware | `door_type: Barn` |
| Closet and Pocket Door Hardware | `door_type: Closet/Pocket` |
| Commercial Door Hardware | `commercial: true` |
| Screen and Storm Door Hardware | `door_type: Screen/Storm` |
| Sliding Door Hardware | `door_type: Sliding` |

#### Redundant Categories
| Sub-Category | Issues |
|--------------|--------|
| Door Hardware: Knobs and Levers | Combines Door Knobs + Door Levers |
| Door Entry Sets | Could be Handlesets |
| Door Hardware Parts | Accessories, not hardware |
| Lock Combo Packs | Sales packaging, not product type |
| Multi Point Door Hardware | Feature of locks |
| Keyed Hardware | All locks are keyed or keyless |
| Designer Hardware | Style attribute |

---

### 🍳 APPLIANCES

#### Core: Kitchen Appliances
| Sub-Category | Keep? | Notes |
|--------------|-------|-------|
| Refrigerator | Yes | Major appliance |
| Freezer | Yes | Major appliance |
| Range | Yes | Major appliance |
| Oven | Yes | Major appliance (wall oven) |
| Cooktop | Yes | Major appliance |
| Microwave | Yes | Major appliance |
| Dishwasher | Yes | Major appliance |
| Range Hood | Yes | Major appliance |
| Garbage Disposals | Yes | Kitchen appliance |
| Icemaker | Yes | Could merge with Refrigeration |

**Redundant with Kitchen Appliances:**
| Sub-Category | Issue |
|--------------|-------|
| Cooking | Too vague - Range/Oven/Cooktop cover this |
| Refrigeration | Covered by Refrigerator/Freezer/Icemaker |
| Drawer | What kind of drawer? Vague |

**Specialty (Keep separate):**
| Sub-Category | Rationale |
|--------------|-----------|
| Barbeques | Outdoor cooking, distinct |
| Coffee Maker | Small appliance, distinct |
| Pizza Oven | Specialty, distinct |

#### Core: Laundry Appliances
| Sub-Category | Keep? |
|--------------|-------|
| Washer | Yes |
| Dryer | Yes |
| All in One Washer/Dryer | Yes |
| Standalone Pedestal | Accessory, not appliance |

---

### 🔥 HEATING & COOLING

#### Core: Heating
| Sub-Category | Keep? | Notes |
|--------------|-------|-------|
| Stoves and Fireplaces | Yes | Indoor heating |
| Indoor Heating | Redundant with above |
| Room Heater | Could merge with Indoor Heating |
| Fire Pits | Yes | Outdoor heating + ambiance |
| Patio Heaters | Yes | Outdoor heating |
| Outdoor Fireplaces | Could merge with Fire Pits |
| Outdoor Heating | Too vague - covered by Patio Heaters/Fire Pits |

#### Core: Cooling
| Sub-Category | Keep? |
|--------------|-------|
| Air Conditioners | Yes |
| Mini Split Air Conditioners | Could be attribute of Air Conditioners |
| Evaporative Coolers | Yes |
| Ceiling Fans | Yes (see Fans section) |

#### Core: Ventilation
| Sub-Category | Keep? |
|--------------|-------|
| Exhaust Fans | Yes |
| Bath Fans | Could merge with Exhaust Fans |
| Air Filters | Yes |

---

### 🚽 BATH FIXTURES

#### Core: Toilets
| Sub-Category | Relationship |
|--------------|--------------|
| Toilet Seats | Accessory/component of Toilets |

#### Core: Bidets
| Sub-Category | Relationship |
|--------------|--------------|
| Bidet Seats | Could be accessory or combo product |
| Bidet Faucets | Bidet-specific faucet |

#### Core: Bathtubs
| Sub-Category | Relationship |
|--------------|--------------|
| Bathtub Waste & Overflow | Accessory/component |
| Tub and Shower Accessories | Accessories |

#### Core: Showers
| Sub-Category | Relationship |
|--------------|--------------|
| Steam Showers | Type of shower |
| Shower Faucets | Could be under Faucets |
| Shower Accessories | Accessories |

#### Core: Sinks
| Category | Location |
|----------|----------|
| Bathroom Sinks | Bath |
| Kitchen Sinks | Kitchen |
| Bar & Prep Sinks | Kitchen |
| Kitchen Sink Combos | Sink + Faucet combo |

---

## Exact Duplicates (Same Category in Multiple Departments)

| Category | Department 1 | Department 2 | Recommendation |
|----------|-------------|--------------|----------------|
| Outdoor Ceiling Fans | Lighting & Electrical | Outdoor | Keep in Lighting only |
| Outdoor Lighting | Lighting & Electrical | Outdoor | Keep in Lighting only |
| Fire Pits | Outdoor | HVAC | Keep in Outdoor only |
| Generators | Outdoor | HVAC | Keep in one location |
| Patio Heaters | Outdoor | HVAC | Keep in Outdoor only |
| Cabinet Hardware | Kitchen Plumbing | Hardware | Keep in Hardware only |
| Lamps | Lighting & Electrical | Home Décor | Keep in Lighting only |
| Rugs | Outdoor | Home Décor | Keep in Home Décor only |
| Hardscaping | Outdoor | Flooring | Keep in Outdoor only |
| Tankless Water Heaters | Bath | Kitchen | Keep in one location |
| Bathroom Lighting | Plumbing & Bath | Plumbing & Bath (x2!) | Merge duplicates |

---

## Unusual/Problem Entries

| Category | Issue | Recommendation |
|----------|-------|----------------|
| conbaucets | Typo | Delete or correct |
| Luxury Kitchen | Vague - not a product type | Delete |
| Trending Ceiling Fans | Marketing term, not product type | Delete |
| Commercial Restroom | Too vague | Specify products |

---

## Recommendations Summary

### Immediate Actions
1. **Remove 11 exact duplicates** - Pick one department per category
2. **Delete typo/vague entries** - conbaucets, Luxury Kitchen, Trending Ceiling Fans
3. **Consolidate Ceiling Fans** - 17 categories → 1 category with attributes

### Short-Term Consolidation
1. **Cabinet Hardware** - 20 categories → ~8 categories (by function, not price/style)
2. **Lighting** - Remove room-specific categories, use location attributes
3. **Door Hardware** - Remove combo/packaging categories

### Long-Term Strategy
1. Use **attributes instead of categories** for:
   - Price tiers (Affordable, Luxury)
   - Styles (Designer, Modern)
   - Features (LED, Smart, Remote)
   - Sizes (Small, Large)
   - Location (Indoor, Outdoor)
2. Keep categories focused on **product function/type**

---

## Proposed Core Category List (Consolidated)

### Appliances
- Refrigerator
- Freezer
- Range
- Oven
- Cooktop
- Microwave
- Dishwasher
- Range Hood
- Washer
- Dryer
- Garbage Disposal
- Icemaker

### Faucets
- Bathroom Faucets
- Kitchen Faucets
- Bar Faucets
- Shower Faucets
- Pot Filler Faucets

### Sinks
- Bathroom Sinks
- Kitchen Sinks
- Bar & Prep Sinks

### Bath Fixtures
- Toilets
- Bidets
- Bathtubs
- Showers
- Bathroom Vanities

### Lighting
- Ceiling Lights (Chandeliers, Pendants, Flush Mount, Recessed)
- Wall Lights (Sconces, Vanity)
- Outdoor Lighting
- Under Cabinet Lighting
- Lamps

### Ceiling Fans
- Ceiling Fans (with attributes for features)

### Cabinet Hardware
- Cabinet Knobs
- Cabinet Pulls
- Cabinet Hinges
- Cabinet Latches
- Cabinet Locks

### Door Hardware
- Door Knobs
- Door Levers
- Handlesets
- Deadbolts
- Door Hinges

### HVAC
- Air Conditioners
- Heaters
- Fireplaces
- Exhaust Fans
- Thermostats

### Outdoor
- Fire Pits
- Patio Heaters
- Outdoor Kitchens
- Landscape Lighting

---

*This analysis should be reviewed with the Salesforce team before making changes to the picklist.*
