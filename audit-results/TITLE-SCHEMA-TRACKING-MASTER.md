# Title Schema Tracking - Master List
**Created**: February 25, 2026  
**Last Updated**: February 25, 2026  
**Purpose**: Track schema updates for all 43 categories from competitive audit  
**Source**: Analysis of 642 Salesforce verification results vs Ferguson vs Web Retailer

---

## CRITICAL RULE: MODEL NUMBER PLACEMENT

⚠️ **ALL TITLES MUST END WITH MODEL NUMBER** ⚠️

**Format**: `[Specs...] [Category] [Finish] - [MODEL]`

**Example**: `600 CFM 36-Inch Wall Mount THERMADOR Range Hood - Stainless Steel - VTI1190B`

---

## STATUS LEGEND

| Status | Meaning | Action Required |
|--------|---------|----------------|
| ✅ **UPDATED** | Schema has been updated with competitive specs | Test with real data, monitor results |
| ⚠️ **PARTIAL** | Some improvements made, but missing key specs | Complete remaining updates |
| ❌ **NOT UPDATED** | Still using baseline schema, needs improvement | Design and implement new schema |
| 🔍 **NEEDS REVIEW** | Schema exists but competitive data unclear | Gather more examples, then update |

## PRIORITY LEVELS

| Priority | Criteria | Timeline |
|----------|----------|----------|
| **P0 - CRITICAL** | >80% competitor inclusion, high-volume category | Immediate (this session) |
| **P1 - HIGH** | >60% competitor inclusion, medium-volume | Next 1-2 weeks |
| **P2 - MEDIUM** | >40% competitor inclusion, lower-volume | Next 1-2 months |
| **P3 - LOW** | <40% competitor inclusion or low data | Future (as data available) |

---

## APPLIANCES (23 Categories)

### 1. All in One Washer / Dryer
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: `{Brand} {Type} {Category} {Finish}`  
**Current Example**: `LG Contemporary All in One Washer / Dryer Black Steel`

**Recommended Schema**: `{Brand} {Width (Inches)} {Washer Capacity} {Dryer Capacity} {Fuel Type} {Category} {Finish} - {Model}`  
**Recommended Example**: `LG 27-Inch 4.5 Cu. Ft. Washer 7.4 Cu. Ft. Gas Dryer All in One Washer / Dryer - Black Steel - WKGX201HBA`

**Missing Elements**:
- ❌ Width (27" standard)
- ❌ Washer capacity (cu. ft.)
- ❌ Dryer capacity (cu. ft.)
- ❌ Fuel type (Gas/Electric/Heat Pump)
- ✅ Model number (needs to be at END)

**Competitor Pattern**:
- **Ferguson**: "27\" 4.5 Cu. Ft. Washer, 7.4 Cu. Ft. Dryer, Gas Fuel"
- **Web Retailer**: "27 Inch Wide Energy Star Certified Laundry Center with 4.5 Cu. Ft. Washer and 7.4 Cu. Ft. Gas Dryer"

**Notes**: Very specific product type with dual capacity specs. Width always 27". Fuel type critical for dryer.

---

### 2. Barbeque
**Status**: ❌ NOT UPDATED  
**Priority**: P3  
**Current Schema**: Unknown (check system)  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Width (Inches)} {Burner Count} {Fuel Type} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `NAPOLEON 48-Inch 4-Burner Natural Gas Built-In Barbeque with Rotisserie - Stainless Steel - BIG26RBI`

**Missing Elements**: TBD - need more audit data

**Notes**: Low volume category. Update when more data available.

---

### 3. Cooktop
**Status**: ✅ UPDATED  
**Priority**: P0  
**Current Schema**: `{Brand} {Width (Inches)} {Burner Count} {Fuel Type} {Installation Type} {Category} {Finish}`  
**Current Example**: `GE 36-Inch 5-Burner Gas Built-In Cooktop - Stainless Steel`

**⚠️ ACTION REQUIRED**: **ADD MODEL NUMBER TO END**  
**Recommended Schema**: `{Brand} {Width (Inches)} {Burner Count} {Fuel Type} {Installation Type} {Category} {Finish} - {Model}`  
**Recommended Example**: `GE 36-Inch 5-Burner Gas Built-In Cooktop - Stainless Steel - PGP966SETSS`

**Updated Elements**:
- ✅ Burner Count added
- ✅ Fuel Type (Gas/Electric/Induction)
- ✅ Installation Type
- ❌ Model number MISSING (needs to be added back)

**Competitor Pattern**:
- **Ferguson**: "36\" 5 Burner Gas Cooktop with 15,000 BTU Power Boil Burner"
- **Web Retailer**: "36 Inch Wide 5 Burner Gas Cooktop with 15,000 BTU Power Boil Burner - Stainless Steel"

**Notes**: Schema updated but missing model number at end. Fix immediately.

---

### 4. Dishwasher
**Status**: ✅ UPDATED  
**Priority**: P0  
**Current Schema**: `{Brand} {Width (Inches)} {Place Settings} {Control Type} {Type} {Category} {Finish}`  
**Current Example**: `GE 24-Inch 16 Place Setting Top Control Built-In Dishwasher - Fingerprint Resistant Slate`

**⚠️ ACTION REQUIRED**: **ADD MODEL NUMBER TO END**  
**Recommended Schema**: `{Brand} {Width (Inches)} {Place Settings} {Control Type} {Type} {Category} {Finish} - {Model}`  
**Recommended Example**: `GE 24-Inch 16 Place Setting Top Control Built-In Dishwasher - Fingerprint Resistant Slate - GDT665SSNSS`

**Updated Elements**:
- ✅ Place Settings added (12/14/16)
- ✅ Control Type added (Top Control/Front Control)
- ✅ Type (Built-In/Portable/Drawer)
- ❌ Model number MISSING (needs to be added back)

**Competitor Pattern**:
- **Ferguson**: "24\" 16 Place Setting Top Control Dishwasher with Dry Boost - Fingerprint Resistant Slate"
- **Web Retailer**: "24 Inch Wide 16 Place Setting Energy Star Certified Top Control Dishwasher with TwinChill™ - Slate"

**Notes**: Schema updated but missing model number at end. Fix immediately.

---

### 5. Drawer (Warming/Storage)
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: `{Brand} {Type} {Category} {Finish}`  
**Current Example**: `Brand Warming Drawer Finish - Model`

**Recommended Schema**: `{Brand} {Width (Inches)} {Type} {Capacity} {Category} {Finish} - {Model}`  
**Recommended Example**: `GE 27-Inch Warming Drawer 1.7 Cu. Ft. Drawer - Stainless Steel - PJ7000SFSS`

**Missing Elements**:
- ❌ Width (24\"/27\"/30\" common)
- ❌ Capacity (if applicable)
- ❌ Type (Warming/Storage) could be more specific

**Notes**: Medium volume. Type differentiation important (Warming vs Storage Drawer).

---

### 6. Dryer
**Status**: ❌ NOT UPDATED  
**Priority**: P1  
**Current Schema**: `{Brand} {Type} {Category} {Finish}`  
**Current Example**: `Brand Contemporary Dryer Finish - Model`

**Recommended Schema**: `{Brand} {Width (Inches)} {Capacity (Cu. Ft.)} {Fuel Type} {Control Type} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `GE 27-Inch 7.8 Cu. Ft. Gas Front Control Dryer with Sensor Dry - White - GFD65GSSNWW`

**Missing Elements**:
- ❌ Width (24\"/27\" standard)
- ❌ Capacity (cu. ft.)
- ❌ Fuel Type (Gas/Electric/Heat Pump) - CRITICAL
- ❌ Control Type (Front/Top)
- ❌ Key features (Sensor Dry, Steam, WiFi)

**Competitor Pattern**:
- **Ferguson**: "27\" 7.8 Cu. Ft. Gas Dryer with Sensor Dry Technology"
- **Web Retailer**: "27 Inch Wide 7.8 Cu. Ft. Energy Star Certified Gas Dryer with HE Sensor Dry - White"

**Notes**: Fuel type is CRITICAL spec (Gas vs Electric very different products). Capacity important for matching.

---

### 7. Freezer
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: `{Brand} {Capacity} {Category} {Finish}`  
**Current Example**: `Brand 15 Cu. Ft. Freezer Finish - Model`

**Recommended Schema**: `{Brand} {Width (Inches)} {Capacity (Cu. Ft.)} {Configuration} {Installation Type} {Category} {Finish} - {Model}`  
**Recommended Example**: `GE 28-Inch 14.1 Cu. Ft. Upright Freestanding Freezer - White - FUF14DLRWW`

**Missing Elements**:
- ❌ Width
- ❌ Configuration (Upright/Chest/Compact)
- ❌ Installation Type (Freestanding/Built-In)

**Notes**: Configuration (Upright vs Chest) is key differentiator.

---

### 8. Icemaker
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: `{Brand} {Type} {Category} {Finish}`  
**Current Example**: `Brand Undercounter Icemaker Finish - Model`

**Recommended Schema**: `{Brand} {Width (Inches)} {Ice Production (lbs/day)} {Installation Type} {Category} {Finish} - {Model}`  
**Recommended Example**: `SCOTSMAN 15-Inch 80 lbs/day Undercounter Icemaker - Stainless Steel - SCN60PA1SS`

**Missing Elements**:
- ❌ Width (15\"/18\"/24\" common)
- ❌ Ice production rate (lbs per day)
- ❌ Ice type (Cube/Nugget/Flake) if applicable

**Notes**: Production capacity is critical spec for icemakers.

---

### 9. Microwave
**Status**: ❌ NOT UPDATED  
**Priority**: P1  
**Current Schema**: `{Brand} {Type} {Category} {Finish}`  
**Current Example**: `Brand Over-the-Range Microwave Finish - Model`

**Recommended Schema**: `{Brand} {Width (Inches)} {Capacity (Cu. Ft.)} {Wattage} {Type} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `GE 30-Inch 1.7 Cu. Ft. 1000W Over-the-Range Microwave with Sensor Cooking - Stainless Steel - JVM3160RFSS`

**Missing Elements**:
- ❌ Width (24\"/27\"/30\" for OTR)
- ❌ Capacity (cu. ft.)
- ❌ Wattage (900W/1000W/1200W)
- ❌ Features (Sensor Cooking, Convection)

**Competitor Pattern**:
- **Ferguson**: "30\" 1.7 Cu. Ft. 1000W Over-the-Range Microwave with Sensor Cooking"
- **Web Retailer**: "30 Inch Wide 1.7 Cu. Ft. 1000 Watt Over the Range Microwave with Sensor Cooking - Stainless Steel"

**Notes**: Type (OTR/Countertop/Drawer/Under Cabinet) is already captured. Wattage is key spec.

---

### 10. Oven
**Status**: ❌ NOT UPDATED  
**Priority**: P1  
**Current Schema**: `{Brand} {Width} {Type} {Category} {Finish}`  
**Current Example**: `Brand 30-Inch Single Wall Oven Finish - Model`

**Recommended Schema**: `{Brand} {Width (Inches)} {Configuration} {Convection Type} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `GE 30-Inch Single Wall Oven with True European Convection - Stainless Steel - JTS5000SNSS`

**Missing Elements**:
- ❌ Convection type (True/European/Regular/None)
- ❌ Configuration more specific (Single/Double/Combo with Microwave/Steam)
- ❌ Self-clean type (Steam/Pyrolytic)
- ❌ Key features

**Competitor Pattern**:
- **Ferguson**: "30\" Single Wall Oven with True European Convection and Self-Clean"
- **Web Retailer**: "30 Inch Wide 5.0 Cu. Ft. Single Electric Wall Oven with True European Convection - Stainless Steel"

**Notes**: Convection type is major differentiator.

---

### 11. Range
**Status**: ❌ NOT UPDATED  
**Priority**: P1  
**Current Schema**: `{Brand} {Width} {Fuel Type} {Installation Type} {Category} {Finish}`  
**Current Example**: `Brand 30-Inch Gas Slide-In Range Finish - Model`

**Recommended Schema**: `{Brand} {Width (Inches)} {Burner Count} {Fuel Type} {Installation Type} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `GE 30-Inch 5-Burner Gas Slide-In Range with Air Fry - Stainless Steel - JGS760SPSS`

**Missing Elements**:
- ❌ Burner/element count
- ❌ Oven capacity (cu. ft.)
- ❌ Convection (Yes/No)
- ❌ Key features (Air Fry, WiFi, Steam Clean)

**Competitor Pattern**:
- **Ferguson**: "30\" 5 Burner Gas Slide-In Range with Convection and Air Fry"
- **Web Retailer**: "30 Inch Wide 5.3 Cu. Ft. Free Standing Gas Range with Air Fry and Convection - Stainless Steel"

**Notes**: Ranges are high-value items. Burner count and Air Fry are trending features.

---

### 12. Range Hood
**Status**: ✅ UPDATED  
**Priority**: P0  
**Current Schema**: `{CFM} {Width (Inches)} {Type} {Brand} {Category} {Finish}`  
**Current Example**: `600 CFM 36-Inch Wall Mount THERMADOR Range Hood - Stainless Steel`

**⚠️ ACTION REQUIRED**: **ADD MODEL NUMBER TO END**  
**Recommended Schema**: `{CFM} {Width (Inches)} {Type} {Brand} {Category} {Finish} - {Model}`  
**Recommended Example**: `600 CFM 36-Inch Wall Mount THERMADOR Range Hood - Stainless Steel - VTI1190B`

**Updated Elements**:
- ✅ CFM moved to position 1 (CRITICAL spec)
- ✅ Width
- ✅ Mount Type (Wall Mount/Under-Cabinet/Island/Insert)
- ❌ Model number MISSING (needs to be added back)

**Competitor Pattern**:
- **Ferguson**: "600 CFM 36\" Wall Mounted Range Hood with 4-Speed Blower"
- **Web Retailer**: "36 Inch Wide 600 CFM Wall Mount Range Hood with 3 Speed Slide Control - Stainless Steel"

**Notes**: Schema updated but missing model number at end. Fix immediately. Speed count could be added if available.

---

### 13. Refrigerator
**Status**: ⚠️ PARTIAL  
**Priority**: P1  
**Current Schema**: `{Brand} {Capacity (Cu. Ft.)} {Configuration} {Installation Type} {Category} {Finish}`  
**Current Example**: `Brand 28 Cu. Ft. Refrigerator Finish - Model`

**⚠️ ACTION REQUIRED**: **NEEDS CONFIGURATION/WIDTH/FEATURES**  
**Recommended Schema**: `{Brand} {Width (Inches)} {Capacity (Cu. Ft.)} {Configuration} {Installation Type} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `GE 36-Inch 27.7 Cu. Ft. French Door Counter-Depth Refrigerator with WiFi - Stainless Steel - GFE28GYNFS`

**Missing Elements**:
- ❌ Width (30\"/33\"/36\"/42\" common)
- ❌ Configuration needs to be specific: French Door, Side-by-Side, Bottom-Freezer, Top-Freezer, 4-Door Flex
- ❌ Counter-Depth designation (major differentiator)
- ❌ Key features (WiFi, Ice Maker type, Door-in-Door, FlexZone)
- ⚠️ Model number present but needs verification

**Competitor Pattern**:
- **Ferguson**: "36\" 27.7 Cu. Ft. French Door Counter-Depth Refrigerator with Internal Water Dispenser"
- **Web Retailer**: "36 Inch Wide 27.7 Cu. Ft. Energy Star Certified French Door Refrigerator with External Water Dispenser - Stainless Steel"

**Notes**: Configuration (French Door, Side-by-Side, etc.) is CRITICAL for customer search. Counter-Depth is major price/feature differentiator.

---

## PLUMBING & BATH (15 Categories)

### 14. Bar Faucet
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: `{Brand} {Type} {Category} {Finish}`  
**Current Example**: `Brand Contemporary Bar Faucet Finish - Model`

**Recommended Schema**: `{Brand} {Spout Type} {GPM} {Installation Type} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `DELTA Pull-Down 1.8 GPM Deck Mount Bar Faucet with Touch2O Technology - Chrome - 9183-DST`

**Missing Elements**:
- ❌ Spout type (Pull-Down/Pull-Out/Standard)
- ❌ GPM flow rate (1.5/1.8/2.2)
- ❌ Installation type (Deck Mount/Wall Mount)
- ❌ Handle count (Single/2-Handle)
- ❌ Key features (Touch, Touch2O, Touchless)

**Competitor Pattern**:
- **Ferguson**: "Pull-Down Bar Faucet with 1.8 GPM and Touch2O Technology - Chrome"
- **Web Retailer**: "Single Handle Pull Down Bar Faucet with 1.8 GPM and MagnaTite Docking - Chrome"

**Notes**: Similar to kitchen faucet but smaller category. GPM and tech features important.

---

### 15. Bath Fan
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: `{Brand} {CFM} {Category} {Finish}`  
**Current Example**: `Brand 110 CFM Bath Fan - Model`

**Recommended Schema**: `{Brand} {CFM} {Sone Rating} {Features} {Category} - {Model}`  
**Recommended Example**: `BROAN 110 CFM 0.9 Sone Bath Fan with LED Light and Night Light - White - AER110L`

**Missing Elements**:
- ❌ Sone rating (noise level)
- ❌ Features (LED Light, Night Light, Heater, Motion Sensor)
- ❌ Energy Star (if applicable)

**Notes**: CFM and Sone are key specs. Light/heater combos common.

---

### 16. Bathroom Cabinet Hardware
**Status**: ❌ NOT UPDATED  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Type} {Length (Inches)} {Material} {Category} {Finish} - {Model}`  
**Recommended Example**: `AMEROCK Bar Pull 3.75-Inch Zinc Cabinet Hardware - Polished Chrome - BP55270-26`

**Notes**: Low volume. Similar to general cabinet hardware. Update when more data available.

---

### 17. Bathroom Faucet
**Status**: ❌ NOT UPDATED  
**Priority**: P1  
**Current Schema**: `{Brand} {Type} {Category} {Finish}`  
**Current Example**: `Brand Widespread Bathroom Faucet Finish - Model`

**Recommended Schema**: `{Brand} {Mount Type} {GPM} {Handle Count} {Spout Height} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `DELTA Widespread 1.2 GPM Two Handle High-Arc Bathroom Faucet with Pop-Up Drain - Chrome - 3551LF`

**Missing Elements**:
- ❌ Mount type (Widespread/Centerset/Single Hole/Wall Mount)
- ❌ GPM flow rate (1.2/1.5)
- ❌ Handle count (Single/Two Handle)
- ❌ Spout height (High-Arc/Low-Arc/Standard)
- ❌ Drain included (with/without Pop-Up)
- ❌ Key features (Touch, Touchless, WaterSense)

**Competitor Pattern**:
- **Ferguson**: "Widespread Two Handle High-Arc Bathroom Faucet with 1.2 GPM and Pop-Up Drain - Chrome"
- **Web Retailer**: "Widespread Two Handle High Arc Bathroom Faucet with 1.2 GPM and Metal Pop-Up Drain Assembly - Chrome"

**Notes**: Mount type (Widespread/Centerset/Single Hole) is CRITICAL - affects installation requirements.

---

### 18. Bathroom Hardware and Accessories
**Status**: ❌ NOT UPDATED  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Type} {Size} {Material} {Category} {Finish} - {Model}`  
**Recommended Example**: `MOEN 24-Inch Towel Bar Stainless Steel Bathroom Hardware - Chrome - Y2624CH`

**Notes**: Broad category. May need subcategory-specific schemas (Towel Bar, Robe Hook, TP Holder, etc.).

---

### 19. Bathroom Lighting
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: `{Brand} {Type} {Category} {Finish}`  
**Current Example**: `Brand Vanity Bathroom Lighting Finish - Model`

**Recommended Schema**: `{Brand} {Width (Inches)} {Light Count} {Type} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `PROGRESS LIGHTING 24-Inch 3-Light Vanity Bathroom Lighting with LED - Chrome - P300418-015`

**Missing Elements**:
- ❌ Width/length
- ❌ Light count (2-Light/3-Light/4-Light)
- ❌ Bulb type (LED/Incandescent/Halogen)
- ❌ Features (Dimmable, Wet Rated)

**Notes**: Light count and width are key specs for vanity lighting.

---

### 20. Bathroom Mirror
**Status**: ❌ NOT UPDATED  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Width x Height (Inches)} {Shape} {Features} {Category} {Finish} - {Model}`  
**Recommended Example**: `KOHLER 24 x 36-Inch Rectangular LED Lighted Bathroom Mirror with Defogger - Brushed Nickel - K-99573-TLC-BN`

**Missing Elements**:
- ❌ Dimensions (width x height)
- ❌ Shape (Rectangular/Round/Oval)
- ❌ Features (LED Lit/Magnification/Defogger/Smart)

**Notes**: Dimensions critical for fit. LED lighting and smart features trending.

---

### 21. Bathroom Sink
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: `{Brand} {Type} {Category} {Material} {Finish}`  
**Current Example**: `Brand Undermount Bathroom Sink Vitreous China White - Model`

**Recommended Schema**: `{Brand} {Width (Inches)} {Installation Type} {Bowl Count} {Faucet Holes} {Category} {Material} {Finish} - {Model}`  
**Recommended Example**: `KOHLER 24-Inch Undermount Single Bowl 1-Hole Bathroom Sink - Vitreous China White - K-2215-0`

**Missing Elements**:
- ❌ Width
- ❌ Installation type (Undermount/Drop-In/Vessel/Wall Mount)
- ❌ Bowl count (Single/Double)
- ❌ Faucet hole count (0/1/3/8-Inch Widespread)
- ❌ Shape (Rectangular/Round/Oval)

**Notes**: Installation type and faucet holes are CRITICAL for compatibility.

---

### 22. Bathroom Vanity
**Status**: ❌ NOT UPDATED  
**Priority**: P1  
**Current Schema**: `{Brand} {Width} {Configuration} {Category} {Finish}`  
**Current Example**: `Brand 60-Inch Double Bathroom Vanity Finish - Model`

**Recommended Schema**: `{Brand} {Width (Inches)} {Configuration} {Door/Drawer Count} {Top Included} {Category} {Finish} - {Model}`  
**Recommended Example**: `WYNDHAM 60-Inch Double Vanity with 4 Doors and 2 Drawers with Marble Top Bathroom Vanity - White - WCS202060DWHCMUNOM58`

**Missing Elements**:
- ❌ Configuration (Single/Double sink)
- ❌ Door/drawer configuration
- ❌ Top included (Yes/No) and material
- ❌ Sink included (Yes/No)
- ❌ Style (Freestanding/Wall-Mounted)

**Competitor Pattern**:
- **Ferguson**: "60\" Double Vanity with 4 Doors and 2 Drawers with Marble Top and Undermount Sinks - White"
- **Web Retailer**: "60 Inch Wide Double Bowl Bathroom Vanity with 4 Doors 2 Drawers and Marble Countertop - White"

**Notes**: Width and single/double configuration are most important. Top/sink included affects price significantly.

---

### 23. Bathtub
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: `{Brand} {Installation Type} {Category} {Material} {Finish}`  
**Current Example**: `Brand Freestanding Bathtub Acrylic White - Model`

**Recommended Schema**: `{Brand} {Length (Inches)} {Width (Inches)} {Capacity (Gallons)} {Installation Type} {Features} {Category} {Material} {Finish} - {Model}`  
**Recommended Example**: `KOHLER 60-Inch 32-Inch 47 Gallon Freestanding Soaking Bathtub with Overflow - Acrylic White - K-1121-0`

**Missing Elements**:
- ❌ Length (60\"/66\"/72\" common)
- ❌ Width
- ❌ Capacity (gallons)
- ❌ Installation type (Freestanding/Drop-In/Alcove)
- ❌ Features (Soaking/Whirlpool/Air Bath/Heated)
- ❌ Drain location (Left/Right/Center)

**Competitor Pattern**:
- **Ferguson**: "60\" x 32\" Freestanding Soaking Bathtub with 47 Gallon Capacity - Acrylic White"
- **Web Retailer**: "60 Inch Free Standing Soaking Bathtub with 47 Gallon Capacity and Center Drain - Acrylic White"

**Notes**: Dimensions critical for fit. Freestanding vs Drop-In is major differentiator.

---

### 24. Commercial Restroom
**Status**: 🔍 NEEDS REVIEW  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Limited data in audit

**Notes**: Broad category. May need subcategory-specific schemas. Low volume in consumer data.

---

### 25. Drainage & Waste
**Status**: ❌ NOT UPDATED  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Type} {Size (Inches)} {Material} {Features} {Category} {Finish} - {Model}`  
**Recommended Example**: `KOHLER 1.5-Inch Grid Strainer Drain with Overflow - Polished Chrome - K-7165-CP`

**Notes**: Technical/plumbing category. Type and size critical. Low volume.

---

### 26. Kitchen Faucet
**Status**: ❌ NOT UPDATED  
**Priority**: P1  
**Current Schema**: `{Brand} {Type} {Category} {Finish}`  
**Current Example**: `Brand Pull-Down Kitchen Faucet Finish - Model`

**Recommended Schema**: `{Brand} {Spout Type} {GPM} {Handle Count} {Installation Type} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `DELTA Pull-Down 1.8 GPM Single Handle Deck Mount Kitchen Faucet with Touch2O and ShieldSpray Technology - Chrome - 9113T-AR-DST`

**Missing Elements**:
- ❌ Spout type (Pull-Down/Pull-Out/Commercial/Standard)
- ❌ GPM flow rate (1.5/1.8/2.2)
- ❌ Handle count (Single/Two Handle)
- ❌ Installation type (Deck Mount/Wall Mount)
- ❌ Spout reach/height
- ❌ Key features (Touch/Touch2O/Touchless/ShieldSpray/MagnaTite)

**Competitor Pattern**:
- **Ferguson**: "Pull-Down Kitchen Faucet with 1.8 GPM and Touch2O Technology - Chrome"
- **Web Retailer**: "Single Handle Pull Down Kitchen Faucet with 1.8 GPM Touch2O Technology and ShieldSpray - Chrome"

**Notes**: Kitchen faucets are high-consideration items. GPM, touch tech, and spray modes are key differentiators.

---

### 27. Kitchen Sink
**Status**: ❌ NOT UPDATED  
**Priority**: P1  
**Current Schema**: `{Brand} {Installation Type} {Category} {Material} {Finish}`  
**Current Example**: `Brand Undermount Kitchen Sink Stainless Steel - Model`

**Recommended Schema**: `{Brand} {Width (Inches)} {Installation Type} {Bowl Configuration} {Depth (Inches)} {Gauge} {Category} {Material} {Finish} - {Model}`  
**Recommended Example**: `KOHLER 33-Inch Undermount 60/40 Double Bowl 9-Inch Deep 18-Gauge Kitchen Sink - Stainless Steel - K-3847-4-NA`

**Missing Elements**:
- ❌ Width (25\"/30\"/33\"/36\" common)
- ❌ Bowl configuration (Single/60-40/50-50/Triple)
- ❌ Depth (8\"/9\"/10\" common)
- ❌ Gauge (18/20/22 - lower = thicker)
- ❌ Faucet holes (0/1/3/4)
- ❌ Installation type (Undermount/Drop-In/Farmhouse)

**Competitor Pattern**:
- **Ferguson**: "33\" Undermount 60/40 Double Bowl Kitchen Sink with 9\" Depth and 18-Gauge Stainless"
- **Web Retailer**: "33 Inch Wide Undermount 60/40 Double Bowl Kitchen Sink with 9 Inch Basin Depth 18 Gauge Stainless Steel"

**Notes**: Bowl configuration (60/40, 50/50) and gauge are CRITICAL specs for comparison shopping.

---

### 28. Kitchen Storage & Organization
**Status**: 🔍 NEEDS REVIEW  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Limited data in audit

**Notes**: Broad accessory category. May need subcategory-specific schemas.

---

## HARDWARE (4 Categories)

### 29. Cabinet Lock
**Status**: ❌ NOT UPDATED  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Type} {Size} {Material} {Category} {Finish} - {Model}`  
**Recommended Example**: `AMEROCK Cam Lock 7/8-Inch Zinc Cabinet Lock - Polished Chrome - BP1950-26`

**Notes**: Small hardware item. Type (Cam Lock/Mortise/Surface Mount) and size are key.

---

### 30. Cabinet Pull
**Status**: ❌ NOT UPDATED  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Type} {Center-to-Center (Inches)} {Length (Inches)} {Material} {Category} {Finish} - {Model}`  
**Recommended Example**: `AMEROCK Bar Pull 3-Inch Center-to-Center 5.06-Inch Overall Length Zinc Cabinet Pull - Polished Chrome - BP55270-26`

**Missing Elements**:
- ❌ Center-to-Center measurement (hole spacing) - CRITICAL for compatibility
- ❌ Overall length
- ❌ Type (Bar Pull/Cup Pull/Bin Pull)
- ❌ Material

**Notes**: Center-to-center is THE most critical spec for cabinet hardware (must match existing holes).

---

### 31. Door Lever
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: Unknown  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Function} {Series/Collection} {Category} {Finish} - {Model}`  
**Recommended Example**: `SCHLAGE Passage Accent Series Door Lever - Satin Nickel - F10-ACC-619`

**Missing Elements**:
- ❌ Function (Passage/Privacy/Keyed Entry/Dummy)
- ❌ Series/Collection name
- ❌ Backset (2-3/8\" or 2-3/4\")
- ❌ Handing (if applicable)

**Competitor Pattern**:
- **Ferguson**: "Passage Function Accent Series Door Lever - Satin Nickel"
- **Web Retailer**: "Accent Series Passage Function Door Lever with Adjustable Backset - Satin Nickel"

**Notes**: Function (Passage/Privacy/Keyed) is CRITICAL - different applications entirely.

---

### 32. Handleset
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: Unknown  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Function} {Interior Lever/Knob} {Series/Collection} {Category} {Finish} - {Model}`  
**Recommended Example**: `SCHLAGE Keyed Entry with Accent Lever Series Handleset - Satin Nickel - F60-PLY-ACC-619`

**Missing Elements**:
- ❌ Function (Keyed Entry/Dummy/Single Cylinder/Double Cylinder)
- ❌ Interior lever/knob style
- ❌ Series/Collection
- ❌ Smart features (if applicable)

**Notes**: Handlesets are front door hardware - function and security level important.

---

## LIGHTING & ELECTRICAL (6 Categories)

### 33. Ceiling Fan
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: `{Brand} {Type} {Category} {Finish}`  
**Current Example**: `Brand Contemporary Ceiling Fan Finish - Model`

**Recommended Schema**: `{Brand} {Diameter (Inches)} {Blade Count} {Motor Type} {Control Type} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `HUNTER 52-Inch 5-Blade DC Motor with Remote Control Ceiling Fan with Light Kit - Brushed Nickel - 59472`

**Missing Elements**:
- ❌ Diameter (42\"/52\"/54\"/60\"/72\")
- ❌ Blade count (3/4/5 blades)
- ❌ Motor type (AC/DC)
- ❌ Control type (Pull Chain/Remote/Smart/Wall Control)
- ❌ Light kit (Included/Optional/No Light)
- ❌ CFM rating (airflow)
- ❌ Energy Star
- ❌ Wet/Damp rating (for outdoor)

**Competitor Pattern**:
- **Ferguson**: "52\" 5-Blade DC Motor Ceiling Fan with LED Light Kit and Remote - Brushed Nickel"
- **Web Retailer**: "52 Inch 5 Blade DC Motor Ceiling Fan with Integrated LED Light Kit and Remote Control - Brushed Nickel"

**Notes**: Diameter is #1 spec (must fit room size). DC motor and smart controls are trending.

---

### 34. Chandelier
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: `{Brand} {Type} {Category} {Finish}`  
**Current Example**: `Brand Contemporary Chandelier Finish - Model`

**Recommended Schema**: `{Brand} {Width/Diameter (Inches)} {Height (Inches)} {Light Count} {Type} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `PROGRESS LIGHTING 24-Inch Diameter 27-Inch Height 5-Light Drum Chandelier with Fabric Shade - Brushed Nickel - P400099-009`

**Missing Elements**:
- ❌ Diameter/width (critical for space)
- ❌ Height (adjustable or fixed)
- ❌ Light count (3/5/6/9/12-Light)
- ❌ Type (Drum/Tiered/Crystal/Linear/Candle)
- ❌ Shade material (if applicable)
- ❌ Bulb type (LED/Incandescent)
- ❌ Dimmable (Yes/No)

**Competitor Pattern**:
- **Ferguson**: "24\" Diameter 5-Light Drum Chandelier with White Fabric Shade - Brushed Nickel"
- **Web Retailer**: "24 Inch Wide 5 Light Drum Style Chandelier with White Linen Fabric Shade - Brushed Nickel"

**Notes**: Diameter and light count are key specs. Type (Drum/Tiered/etc.) affects aesthetic.

---

### 35. Lighting Accessory
**Status**: 🔍 NEEDS REVIEW  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Limited data (Downrods mentioned)

**Recommended Schema**: `{Brand} {Type} {Size/Length} {Category} {Finish} - {Model}`  
**Recommended Example**: `HUNTER 12-Inch Downrod for Ceiling Fans - Brushed Nickel - 23856`

**Notes**: Broad category. Type (Downrod/Chain/Canopy/etc.) and size are key.

---

### 36. Pendant
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: `{Brand} {Type} {Category} {Finish}`  
**Current Example**: `Brand Mini Pendant Finish - Model`

**Recommended Schema**: `{Brand} {Width/Diameter (Inches)} {Height (Inches)} {Light Count} {Type} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `PROGRESS LIGHTING 6-Inch Diameter 9-Inch Height Mini Pendant with Glass Shade - Brushed Nickel - P5181-09`

**Missing Elements**:
- ❌ Diameter (for single pendants: 5\"/6\"/8\"/12\")
- ❌ Height/drop
- ❌ Light count (Mini/Multi-Light Linear)
- ❌ Type (Mini/Island/Linear/Bowl)
- ❌ Shade material (Glass/Metal/Fabric)
- ❌ Adjustable height (Yes/No)

**Competitor Pattern**:
- **Ferguson**: "6\" Diameter Mini Pendant with Clear Glass Shade - Brushed Nickel"
- **Web Retailer**: "6 Inch Wide Mini Pendant Light with Clear Seeded Glass Shade - Brushed Nickel"

**Notes**: Diameter and type (Mini vs Island) are key. Shade style affects light quality.

---

### 37. Recessed Lighting
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: Unknown  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Diameter (Inches)} {Type} {Wattage Equivalent} {Color Temp} {Category} {Features} {Finish} - {Model}`  
**Recommended Example**: `HALO 6-Inch Canless LED 90W Equivalent 3000K Recessed Lighting with Selectable CCT - White - RL560WH6930R`

**Missing Elements**:
- ❌ Diameter (4\"/5\"/6\")
- ❌ Type (Canless/Retrofit/New Construction/Remodel)
- ❌ Wattage equivalent (60W/90W/120W)
- ❌ Color temperature (2700K/3000K/4000K/5000K or Selectable)
- ❌ Lumens
- ❌ Dimmable (Yes/No)
- ❌ IC rated (insulation contact)
- ❌ Wet/damp rated

**Notes**: Diameter and type (Canless is trending) are critical. Color temp affects ambiance.

---

## OTHER (6 Categories)

### 38. Garbage Disposal
**Status**: ❌ NOT UPDATED  
**Priority**: P2  
**Current Schema**: Unknown  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Horsepower} {Category} {Feed Type} {Features} - {Model}`  
**Recommended Example**: `INSINKERATOR 3/4 HP Garbage Disposal with Continuous Feed and SoundSeal Technology - Evolution Excel 76035`

**Missing Elements**:
- ❌ Horsepower (1/3 HP / 1/2 HP / 3/4 HP / 1 HP)
- ❌ Feed type (Continuous/Batch)
- ❌ Sound insulation features
- ❌ Grinding stages/chamber stages

**Competitor Pattern**:
- **Ferguson**: "3/4 HP Continuous Feed Garbage Disposal with SoundSeal Technology"
- **Web Retailer**: "3/4 HP Continuous Feed Garbage Disposal with MultiGrind Technology and SoundSeal Insulation"

**Notes**: Horsepower is THE critical spec (power level). Sound insulation is key differentiator.

---

### 39. Heating
**Status**: 🔍 NEEDS REVIEW  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Very broad category in audit

**Notes**: Extremely broad category (Space Heaters, Baseboard, Radiant, etc.). May need subcategory-specific schemas.

---

### 40. Medicine Cabinet
**Status**: ❌ NOT UPDATED  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Width x Height (Inches)} {Mount Type} {Mirror Type} {Shelves Count} {Category} {Finish} - {Model}`  
**Recommended Example**: `KOHLER 20 x 26-Inch Surface Mount 3-Shelf Medicine Cabinet with Mirrored Door - Aluminum - K-CB-CLC2026FS`

**Missing Elements**:
- ❌ Dimensions (width x height)
- ❌ Mount type (Surface/Recessed)
- ❌ Mirror type (Single/Tri-View)
- ❌ Shelf count
- ❌ Features (LED Light/Defogger/Outlets)

**Notes**: Dimensions and mount type (surface vs recessed) are critical for installation.

---

### 41. Mirror
**Status**: ❌ NOT UPDATED  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Width x Height (Inches)} {Shape} {Features} {Category} {Frame Finish} - {Model}`  
**Recommended Example**: `KOHLER 24 x 36-Inch Rectangular LED Lighted Mirror with Defogger - Brushed Nickel Frame - K-99573-TLC-BN`

**Missing Elements**:
- ❌ Dimensions (width x height)
- ❌ Shape (Rectangular/Round/Oval/Arched)
- ❌ Frame (Framed/Frameless)
- ❌ Features (LED Lit/Magnification/Defogger/Smart/Touchless)

**Notes**: Similar to Bathroom Mirror. Dimensions critical. LED and smart features trending.

---

### 42. Outdoor Kitchen
**Status**: 🔍 NEEDS REVIEW  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Limited data in audit

**Notes**: Broad category (Grills, Cabinets, Sinks, Pizza Ovens). May need subcategory-specific schemas.

---

### 43. Pipe Fitting
**Status**: ❌ NOT UPDATED  
**Priority**: P3  
**Current Schema**: Unknown  
**Current Example**: Not available in audit data

**Recommended Schema**: `{Brand} {Type} {Size (Inches)} {Material} {Connection Type} {Category} {Finish} - {Model}`  
**Recommended Example**: `MUELLER 1/2-Inch Copper Tee Fitting with Sweat Connection - Copper - W01346`

**Missing Elements**:
- ❌ Type (Tee/Elbow/Coupling/Adapter/etc.)
- ❌ Size (pipe diameter)
- ❌ Material (Copper/PVC/Brass/Stainless)
- ❌ Connection type (Sweat/Threaded/Push-to-Connect/Compression)
- ❌ Angle (if applicable: 90°/45°)

**Notes**: Technical plumbing category. Type, size, and connection method are critical for compatibility.

---

## SUMMARY STATISTICS

### Overall Progress
| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Updated (with model# issue) | 3 | 7.0% |
| ⚠️ Partial Updates | 1 | 2.3% |
| ❌ Not Updated | 36 | 83.7% |
| 🔍 Needs Review | 3 | 7.0% |
| **TOTAL** | **43** | **100%** |

### Priority Breakdown
| Priority | Count | Status |
|----------|-------|--------|
| **P0 - CRITICAL** | 3 | 3 Updated (need model# added back) |
| **P1 - HIGH** | 12 | 0 Updated, 12 Pending |
| **P2 - MEDIUM** | 20 | 0 Updated, 20 Pending |
| **P3 - LOW** | 8 | 0 Updated, 8 Pending |

### By Department
| Department | Total | Updated | Not Updated | Completion % |
|------------|-------|---------|-------------|--------------|
| Appliances | 13 | 3 | 10 | 23% |
| Plumbing & Bath | 15 | 0 | 15 | 0% |
| Hardware | 4 | 0 | 4 | 0% |
| Lighting | 6 | 0 | 6 | 0% |
| Other | 5 | 0 | 5 | 0% |

---

## IMMEDIATE ACTION ITEMS

### 🔴 CRITICAL (This Session)
1. ✅ **ADD MODEL NUMBER** to all 3 updated P0 schemas:
   - Range Hood: Add model at end
   - Dishwasher: Add model at end
   - Cooktop: Add model at end

### 🟡 HIGH PRIORITY (Next Session)
2. **P1 Appliances** (4 categories):
   - Dryer (add Fuel Type - CRITICAL)
   - Microwave (add Wattage, Capacity)
   - Oven (add Convection Type)
   - Range (add Burner Count)
   - Refrigerator (complete - add Width, finalize Configuration)

3. **P1 Plumbing** (3 categories):
   - Kitchen Faucet (add GPM, Spout Type, Features)
   - Bathroom Faucet (add GPM, Mount Type, Handle Count)
   - Kitchen Sink (add Bowl Config, Gauge, Depth)
   - Bathroom Vanity (add Configuration, Top Included)

### 🟢 MEDIUM PRIORITY (Next 2 Weeks)
4. **P2 Categories** (20 total):
   - Lighting (Ceiling Fan, Chandelier, Pendant, Recessed) - add dimensions, light counts
   - Bath (Bathtub, Bathroom Lighting, Bath Fan, Bathroom Sink) - add dimensions, features
   - Hardware (Door Lever, Handleset) - add functions
   - Appliances (Freezer, Icemaker, Drawer, All-in-One) - add configurations, capacities

---

## TESTING & VALIDATION CHECKLIST

Before deploying schema updates:
- [ ] TypeScript compiles (`npm run build`)
- [ ] **MODEL NUMBER** appears at end of all titles
- [ ] Title length within 60-150 character range
- [ ] Format strings work correctly (`{value} CFM`, `{value}-Inch`)
- [ ] Test with 10-15 real products per updated category
- [ ] Compare against Ferguson/web retailer titles
- [ ] Verify all critical specs included
- [ ] Check for missing data (if attribute not available, does title degrade gracefully?)
- [ ] Salesforce integration test (full verification flow)

---

## NOTES & OBSERVATIONS

### Pattern Recognition
1. **Dimensions are #1 spec** across most categories (width/diameter/length)
2. **Capacity specs critical** for appliances (cu. ft., gallons, place settings, GPM)
3. **Configuration/Type** needed for differentiation (French Door, Pull-Down, Undermount)
4. **Installation Type** missing from most categories (Built-In, Freestanding, Wall Mount)
5. **Features/Technology** trending (WiFi, Touch, Energy Star, LED, Smart)
6. **Model numbers were removed** from P0 updates - need to restore at end of ALL titles

### Competitor Strategies
- **Ferguson**: Spec-focused, technical details, features in title
- **Web Retailer**: Maximum density, all specs + features + certifications + materials
- **AI Current**: Minimalist, brand + basic spec + category + finish

### Data Availability Concerns
Some recommended specs may not be currently extracted by AI:
- Place Settings (Dishwasher) - VERIFY
- Burner Count (Cooktop/Range) - VERIFY
- Control Type (Dishwasher) - VERIFY
- GPM (Faucets) - VERIFY
- Gauge (Sinks) - VERIFY
- Light Count (Chandeliers/Pendants) - VERIFY
- CFM (Bath Fans) - VERIFY

**Action**: Test each updated schema with real Salesforce data to confirm AI extracts these attributes.

---

**Last Updated**: February 25, 2026  
**Next Review**: After P0 model number fix + P1 schema updates deployed  
**Owner**: GitHub Copilot (Claude Sonnet 4.5)
