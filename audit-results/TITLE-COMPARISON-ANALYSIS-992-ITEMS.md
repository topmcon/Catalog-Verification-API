# Title Comparison Analysis: Ferguson vs Web Retailer vs AI
## 992-Item Dataset Analysis - February 25, 2026

**Purpose**: Compare actual Ferguson titles, Web Retailer titles, and AI-generated titles to identify improvement opportunities for each category.

---

## Executive Summary

- **Total Items Analyzed**: 992
- **Unique Categories**: 65
- **Data Sources**: Ferguson, Web Retailer, Dual (both)
- **AI Success Rate**: Varied by category (requires enhancement)

---

## Category-by-Category Title Analysis

### 1. ALL IN ONE WASHER / DRYER (2 items)

#### Example 1 - LG WKGX201HBA
- **Ferguson**: `27 Inch Wide Energy Star Certified Laundry Center with 4.5 Cu. Ft. Washer and 7.4 Cu. Ft. Gas Dryer with Center Control™ - Black Steel`
- **AI**: `LG Contemporary All in One Washer / Dryer Black Steel`
- **Analysis**: 
  - ❌ AI missing: Width, capacity specs, fuel type, features
  - ✅ Ferguson pattern: [Width] [Features] [Category] with [Washer Cap] and [Dryer Cap] [Fuel] - [Finish]

#### Example 2 - LG WM6998HBA
- **Ferguson**: `27 Inch Wide 5 Cu. Ft. Combination Washer and Dryer with TurboWash 360° and Allergiene Wash Cycle`
- **AI**: `LG Contemporary All in One Washer / Dryer Black Steel`
- **Analysis**: 
  - ❌ AI missing: Width, capacity, key features (TurboWash 360°)
  
**AI ENHANCEMENT NEEDED**: 
```
Format: [Brand] [Width]-Inch [Capacity] Cu. Ft. [Type] All in One Washer/Dryer with [Key Feature] - [Finish]
Example: LG 27-Inch 5 Cu. Ft. Combination Washer and Dryer with TurboWash 360° - Black Steel
```

---

### 2. BAR & PREP SINK (1 item)

#### Example - NATIVE TRAILS CPS516
- **Ferguson**: `Mojito 13" Drop-In Single Basin Copper Bar Sink - Brushed Nickel`
- **AI**: `NATIVE TRAILS Contemporary Bar & Prep Sink Brushed Nickel`
- **Analysis**: 
  - ❌ AI missing: Collection name, size, installation type, basin count, material
  
**AI ENHANCEMENT NEEDED**: 
```
Format: [Collection Name] [Size]-Inch [Installation Type] [Basin Count] [Material] [Category] - [Finish]
Example: Mojito 13" Drop-In Single Basin Copper Bar Sink - Brushed Nickel
```

---

### 3. BAR FAUCET (2 items)

#### Example 1 - KOHLER K-22034-CP
- **Ferguson**: `Simplice 1.5 GPM Single Hole Bar Faucet`
- **AI**: `KOHLER Transitional Bar Faucet Polished Chrome`
- **Analysis**: 
  - ❌ AI missing: Collection name, GPM, installation type

#### Example 2 - GRAFF G-5130-LM67K-PN
- **Ferguson**: `Segovia 1.8 GPM Single Hole Pull Down Bar Faucet - Polished Nickel`
- **AI**: `GRAFF Contemporary Kitchen Faucet Polished Nickel` (Misclassified!)
- **Analysis**: 
  - ❌ Category wrong (Kitchen Faucet vs Bar Faucet)
  
**AI ENHANCEMENT NEEDED**: 
```
Format: [Collection] [GPM] GPM [Installation] [Type] Bar Faucet - [Finish]
Example: Simplice 1.5 GPM Single Hole Bar Faucet - Polished Chrome
```

---

### 4. BATHROOM FAUCET (50 items)

#### Widespread Examples

**DXV D35109800.243**
- **Ferguson**: `Equility 1.2 GPM Widespread Bathroom Faucet - Matte Black`
- **AI**: `DXV Contemporary Bathroom Faucet Matte Black`
- **Gap**: Missing collection, GPM, installation type

**GRAFF G-6111N-LM69B-BOX/MBK**
- **Ferguson**: `Cameo 1.2 GPM Widespread Bathroom Faucet - Brushed Onyx PVD / Matte Black`
- **AI**: `GRAFF Contemporary Bathroom Faucet Matte Black`
- **Gap**: Missing collection, GPM, dual finish notation

#### Single Hole Examples

**GRAFF G-1800-LM36-AU**
- **Ferguson**: `Sade 1.2 GPM Bathroom Faucet - 24k Gold Plated`
- **AI**: `GRAFF Contemporary Bathroom Faucet Polished Gold`
- **Gap**: Missing collection, GPM, specific finish (24k vs generic)

**GRAFF G-6305-LM42V-PN**
- **Ferguson**: `Sento 1.2 GPM Single Hole Bathroom Faucet - Polished Nickel`
- **AI**: `GRAFF Contemporary Bathroom Faucet Polished Nickel`

#### Wall Mount Examples

**GRAFF G-11435-LM57B-PC-T**
- **Ferguson**: `Harley 1.2 GPM Wall Mounted Bathroom Faucet`
- **AI**: `GRAFF Contemporary Bathroom Faucet Polished Chrome`
- **Gap**: Missing collection, GPM, installation type (wall mounted)

**AI ENHANCEMENT NEEDED**: 
```
Widespread Format: [Collection] [GPM] GPM Widespread Bathroom Faucet - [Finish]
Single Hole Format: [Collection] [GPM] GPM Single Hole Bathroom Faucet - [Finish]
Wall Mount Format: [Collection] [GPM] GPM Wall Mounted Bathroom Faucet - [Finish]
Vessel Format: [Collection] [GPM] GPM Vessel Bathroom Faucet - [Finish]

Examples:
- Cameo 1.2 GPM Widespread Bathroom Faucet - Brushed Onyx PVD / Matte Black
- Sade 1.2 GPM Single Hole Bathroom Faucet - 24k Gold Plated
- Harley 1.2 GPM Wall Mounted Bathroom Faucet - Polished Chrome
```

---

### 5. BATHROOM LIGHTING / VANITY LIGHTING (25 items)

#### Vanity Light Examples

**VISUAL COMFORT KSV1013PNGW**
- **Ferguson**: `Monroe 3 Light 23" Wide Bathroom Vanity Light - Polished Nickel`
- **AI**: `VISUAL COMFORT Transitional Bathroom Lighting Polished Nickel`
- **Gap**: Missing collection, light count, width

**MAXIM 21234MRNAB**
- **Ferguson**: `Scoop 4 Light 30" Wide Vanity Light - Natural Aged Brass`
- **AI**: `MAXIM Modern Bathroom Lighting Natural Aged Brass`

**HINKLEY 52094CM**
- **Ferguson**: `Lucent 30" Wide ADA Integrated LED Bath Bar with Lava Glass Shade - Chrome`
- **AI**: `HINKLEY Modern Bathroom Lighting Chrome`
- **Gap**: Missing collection, width, ADA compliance, LED notation, glass type

**AI ENHANCEMENT NEEDED**: 
```
Format: [Collection] [Light Count] Light [Width]" Wide [Type] Vanity Light - [Finish]
LED Format: [Collection] [Width]" Wide [ADA if applicable] Integrated LED Bath Bar - [Finish]

Examples:
- Monroe 3 Light 23" Wide Bathroom Vanity Light - Polished Nickel
- Lucent 30" Wide ADA Integrated LED Bath Bar - Chrome
- Scoop 4 Light 30" Wide Vanity Light - Natural Aged Brass
```

---

### 6. BATHROOM SINK (10 items)

#### Examples

**MTI MTCS771-WH-GL**
- **Ferguson**: `Boutique 41" Rectangular Sculpture Stone Undermount Bathroom Ramp Sink - White Gloss`
- **AI**: `MTI Modern Bathroom Sink Gloss`
- **Gap**: Missing collection, size, shape, material, installation type

**KOHLER K-2211-G-96**
- **Ferguson**: `Caxton 19" Undermount Bathroom Sink with Glazed Underside - Biscuit`
- **AI**: `KOHLER Transitional Bathroom Sink Biscuit`
- **Gap**: Missing collection, size, installation, feature (glazed underside)

**STERLING 446124-0**
- **Ferguson**: `Sacramento 21-1/4" Pedestal Bathroom Sink With Three Holes Drilled And Overflow - White`
- **AI**: `STERLING Modern Bathroom Sink Vitreous China`
- **Gap**: Missing collection, size, installation type, hole count, overflow notation

**AI ENHANCEMENT NEEDED**: 
```
Undermount Format: [Collection] [Size]" [Shape] [Material] Undermount Bathroom Sink - [Finish]
Pedestal Format: [Collection] [Size]" Pedestal Bathroom Sink with [Hole Count] Holes Drilled and Overflow - [Finish]
Vessel Format: [Collection] [Size]" [Shape] Vessel Bathroom Sink - [Finish]

Examples:
- Boutique 41" Rectangular Sculpture Stone Undermount Bathroom Ramp Sink - White Gloss
- Caxton 19" Undermount Bathroom Sink with Glazed Underside - Biscuit
- Sacramento 21-1/4" Pedestal Bathroom Sink With Three Holes Drilled And Overflow - White
```

---

### 7. BATHROOM VANITY (9 items)

#### Examples

**KOHLER 35023-SWK**
- **Ferguson**: `Malin by Studio McGee 72" Free Standing Vanity Set with Cabinet and Quartz Vanity Top2`
- **AI**: `KOHLER Modern Bathroom Vanity`
- **Gap**: Missing collection, width, installation type, components (cabinet, top type)

**WYNDHAM COLLECTION SP-WCF292930SWGWC**
- **Ferguson**: `Miranda 30" Free Standing Single Basin Vanity Set with Cabinet and Cultured Marble Vanity Top - White / White Cultured Marble Top / Brushed Gold Hardware`
- **AI**: `WYNDHAM COLLECTION Modern Bathroom Vanity Dark Gray`
- **Gap**: Missing collection, width, basin count, components, detailed finishes

**SIGNATURE HARDWARE SH489302**
- **Ferguson**: `Elmdale 72" Freestanding Mahogany Double Basin Vanity Set with Cabinet, Vanity Top, and Rectangular Undermount Sink - Single Faucet Holes`
- **AI**: `SIGNATURE HARDWARE Traditional Bathroom Vanity Painted Dark Olive Green`

**AI ENHANCEMENT NEEDED**: 
```
Single Sink Format: [Collection] [Width]" [Installation Type] Single Basin Vanity Set with [Components] - [Finish] / [Top Finish]
Double Sink Format: [Collection] [Width]" [Installation Type] [Material] Double Basin Vanity Set with [Components] - [Finish] / [Top Finish]

Examples:
- Malin by Studio McGee 72APPLIANCES
### 8. COOKTOP (59 items - HIGHEST VOLUME)

#### Gas Cooktop Examples

**GE JGP3036SLSS**
- **Ferguson**: `36 Inch Wide Built-In Gas Cooktop with 15,000 BTU Power Boil Burner - Stainless Steel`
- **AI**: `GE 36-Inch Cooktop - JGP3036SLSS`
- **Gap**: Missing width format, fuel type, burner count, key feature, finish

**DACOR DTT48M976LS**
- **Web Retailer**: `48" Rangetop, Silver Stainless Steel, Natural Gas`
- **AI**: `DACOR 48-Inch Cooktop Stainless Steel - DTT48M976LS`
- **Gap**: Missing "Rangetop" terminology (vs Cooktop), gas type specification

**WHIRLPOOL WCGK5036PS00**
- **Ferguson**: `36 Inch Wide 5 Burner Gas Cooktop with EZ-2-Lift Hinged Cast-Iron Grates - Stainless Steel`
- **AI**: `WHIRLPOOL 36-Inch Cooktop Stainless Steel - WCGK5036PS`
- **Gap**: Missing burner count, fuel type, key feature

#### Induction Cooktop Examples

**KITCHENAID KCIG556JSS**
- **Ferguson**: `36 Inch Wide 5 Burner Induction Cooktop with Sensor Induction Technology - Stainless Steel`
- **AI**: `KITCHENAID 36-Inch Cooktop Stainless Steel Trim - KCIG556JSS`
- **Gap**: Missing fuel type (Induction), burner count, key technology

**SAMSUNG NZ36K7880US/AA**
- **Ferguson**: `36 Inch Wide Built In Induction Cooktop with WiFi / Bluetooth Connectivity and Virtual Flame - Stainless Steel`
- **AI**: `SAMSUNG 36-Inch Cooktop Fingerprint Resistant Black - NZ36K7880US/AA`
- **Gap**: Missing fuel type, smart features, key differentiators

#### Electric Cooktop Examples

**GE PEP7030DT1BB**
- **Ferguson**: `30 Inch Wide 4 Burner Electric Cooktop with Precision Temperature Control - Black`
- **AI**: `GE 30-Inch Cooktop Ceramic Glass - PEP7030DTBB`
- **Gap**: Missing fuel type, burner count, key feature

**AI ENHANCEMENT NEEDED**: 
```
Gas Format: [Brand] [Width]-Inch [Burner Count]-Burner Gas [Installation] Cooktop with [Key Feature] - [Finish]
Induction Format: [Brand] [Width]-Inch [Burner Count]-Burner Induction Cooktop with [Key Technology] - [Finish]
Electric Format: [Brand] [Width]-Inch [Burner Count]-Burner Electric Cooktop with [Key Feature] - [Finish]

Examples:
- GE 36-Inch 5-Burner Gas Built-In Cooktop with Power Boil Burner - Stainless Steel
- KITCHENAID 36-Inch 5-Burner Induction Cooktop with Sensor Technology - Stainless Steel
- GE 30-Inch 4-Burner Electric Cooktop with Precision Temperature Control - Black
```

---

### 9. DISHWASHER (78 items - HIGHEST VOLUME)

#### Top Control Examples

**BERTAZZONI DW24T3IXV**
- **Ferguson**: `24 Inch Wide 15 Place Setting Built-In Fingerprint Resistant Top Control Dishwasher - Stainless Steel`
- **AI**: `BERTAZZONI Modern Dishwasher Stainless Steel`
- **Gap**: Missing width, place settings, control type, finish details

**GE GDT635HSRSS**
- **Ferguson**: `24 Inch Wide 16 Place Setting Built-In Top Control Dishwasher with WiFi and Dry Boost - Stainless Steel`
- **AI**: `GE Dishwasher Stainless Steel`
- **Gap**: Missing width, capacity, control type, smart features

**ZLINE DWMTZ-SN-24**
- **Ferguson**: `Monument 24 Inch Wide 16 Place Setting Built-In Top Control Dishwasher with Adjustable Racks - Durasnow / Champagne Bronze`
- **AI**: `ZLINE Contemporary Dishwasher Champagne Bronze (Accents)`
- **Gap**: Missing collection, width, capacity, control type

#### Front Control Examples

**WHIRLPOOL WDF332PAMS**
- **Ferguson**: `24 Inch Wide 12 Place Setting Built-In Fingerprint Resistant Front Touch Control Dishwasher - Stainless Steel`
- **AI**: `WHIRLPOOL Contemporary Dishwasher Stainless Steel`
- **Gap**: Missing width, capacity, control type (Front vs Top)

**KITCHENAID KDTM404KPS**
- **Ferguson**: `24 Inch Wide 16 Place Setting Energy Star Rated Built-In Top Control Dishwasher with FreeFlex™ Third Rack - Stainless Steel with PrintShield`
- **AI**: `KITCHENAID Modern Dishwasher PrintShield™ Stainless`
- **Gap**: Missing width, capacity, control type, key rack feature

**AI ENHANCEMENT NEEDED**: 
```
Top Control Format: [Brand/Collection] [Width]-Inch [Place Settings] Place Setting Built-In [Fingerprint Resistant if applicable] Top Control Dishwasher with [Key Feature] - [Finish]
Front Control Format: [Brand] [Width]-Inch [Place Settings] Place Setting Built-In Front Control Dishwasher [with Key Feature] - [Finish]

Examples:
- BERTAZZONI 24-Inch 15 Place Setting Built-In Fingerprint Resistant Top Control Dishwasher - Stainless Steel
- GE 24-Inch 16 Place Setting Built-In Top Control Dishwasher with WiFi and Dry Boost - Stainless Steel
- WHIRLPOOL 24-Inch 12 Place Setting Built-In Fingerprint Resistant Front Control Dishwasher - Stainless Steel
```

---

### 10. DRYER (48 items)

#### Electric Dryer Examples

**WHIRLPOOL WED8620HW2**
- **Ferguson**: `27 Inch Wide 7.4 Cu Ft. Energy Star Rated Electric Dryer`
- **AI**: `WHIRLPOOL 7.4 Cu. Ft. Dryer Painted - WED8620HW`
- **Gap**: Missing width, fuel type, Energy Star notation, finish

**GE PFD87ESPV0RS**
- **Ferguson**: `28 Inch Wide 7.8 Cu. Ft. Energy Star Certified Electric Dryer with Built-In WiFi and Steam Sanitize Cycle - Sapphire Blue`
- **AI**: `GE 7.8 Cu. Ft. Dryer Gloss - PFD87ESPVRS`
- **Gap**: Missing width, fuel type, smart features, specific finish name

**SAMSUNG DVE41A3000W**
- **Ferguson**: `27 Inch Wide 7.2 Cu. Ft. Electric Dryer - White`
- **AI**: `SAMSUNG 7.2 Cu. Ft. Dryer - DVE41A3000W`
- **Gap**: Missing width, fuel type, finish

#### Gas Dryer Examples

**SAMSUNG DVG52A5500V**
- **Ferguson**: `27 Inch Wide 7.4 Cu. Ft. Gas Dryer with Steam Sanitize+ - Brushed Black`
- **AI**: `SAMSUNG 7.4 Cu. Ft. Dryer Brushed - DVG52A5500V`
- **Gap**: Missing width, fuel type (GAS!), key feature

**LG DLGX8901B**
- **Ferguson**: `29" Wide 9 Cu. Ft. Energy Star Certified Gas Dryer with Built-In Intelligence and TurboSteam`
- **AI**: `LG 9 Cu. Ft. Dryer Black Steel - DLGX8901B`
- **Gap**: Missing width, fuel type, smart features

**WHIRLPOOL WGD4850HW2**
- **Ferguson**: `29 Inch Wide 7.0 Cu. Ft. Gas Dryer with AutoDry and 12 Dry Cycles - White`
- **AI**: `WHIRLPOOL 7 Cu. Ft. Dryer - WGD4850HW2`
- **Gap**: Missing width, fuel type, features

#### Heat Pump Dryer Example

**LG DLHC1455W**
- **Ferguson**: `24" Wide 4.2 Cu. Ft. Energy Star Certified Ventless Electric Dryer with Dual Inverter HeatPump Technology`
- **AI**: `LG 4.2 Cu. Ft. Dryer White - DLHC1455W`
- **Gap**: Missing width, fuel type, ventless notation, heat pump technology

**AI ENHANCEMENT NEEDED**: 
```
Electric Format: [Brand] [Width]-Inch Wide [Capacity] Cu. Ft. [Energy Star if applicable] Electric Dryer [with Key Feature] - [Finish]
Gas Format: [Brand] [Width]-Inch Wide [Capacity] Cu. Ft. Gas Dryer with [Key Feature] - [Finish]
Heat Pump Format: [Brand] [Width]-Inch Wide [Capacity] Cu. Ft. Ventless Electric Dryer with [Technology] - [Finish]

Examples:
- SAMSUNG 27-Inch Wide 7.4 Cu. Ft. Gas Dryer with Steam Sanitize+ - Brushed Black
- GE 28-Inch Wide 7.8 Cu. Ft. Energy Star Certified Electric Dryer with WiFi and Steam Sanitize - Sapphire Blue
- LG 24-Inch Wide 4.2 Cu. Ft. Energy Star Certified Ventless Electric Dryer with Dual Inverter HeatPump - White
```

---

### 11. KITCHEN FAUCET (28 items)

#### Pull-Down Examples

**GRAFF G-4881-LM52-PN**
- **Ferguson**: `Conical 1.8 GPM Single Hole Kitchen Faucet - Polished Nickel`
- **AI**: `GRAFF Contemporary Kitchen Faucet Polished Nickel`
- **Gap**: Missing collection, GPM, installation type

**GRAFF G-4615-LM41J-PC**
- **Ferguson**: `M.E. 25 1.8 GPM Single Hole Pull Down Kitchen Faucet - Polished Chrome`
- **AI**: `GRAFF Contemporary Kitchen Faucet Polished Chrome`
- **Gap**: Missing collection, GPM, installation, pull-down feature

**Kraus KSF-1610SFSMB**
- **Ferguson**: `Bolden 1.8 GPM Single Hole Pre-Rinse Pull Down Kitchen Faucet - Spot Free Stainless Steel/Matte Black`
- **AI**: `Kraus Modern Kitchen Faucet Matte Black/Stainless Steel`
- **Gap**: Missing collection, GPM, pre-rinse designation, dual finish notation

#### Bridge Examples

**PERRIN & ROWE U.4764L-ULB-2**
- **Ferguson**: `Edwardian 1.5 GPM Widespread Bridge Kitchen Faucet with Side Spray - Unlacquered Brass (Living Finish)`
- **AI**: `PERRIN & ROWE Traditional Kitchen Faucet Unlacquered Brass`
- **Gap**: Missing collection, GPM, installation type (bridge), side spray notation

**KALLISTA P25001-00-ULB**
- **Ferguson**: `Quincy 1.8 GPM Widespread Bridge Kitchen Faucet - Unlacquered Brass`
- **AI**: `KALLISTA Traditional Kitchen Faucet Unlacquered Brass`
- **Gap**: Missing collection, GPM, bridge designation

#### Wall Mount Examples

**DORNBRACHT 32805680-000010**
- **Ferguson**: `Lot 1.5 GPM Widespread Bar Faucet with Swivel Spout and Mounting Hardware - Chrome`
- **AI**: `DORNBRACHT Modern Kitchen Faucet Chrome`
- **Gap**: Missing collection, GPM, installation, features

**AI ENHANCEMENT NEEDED**: 
```
Pull-Down Format: [Collection] [GPM] GPM Single Hole Pull Down Kitchen Faucet - [Finish]
Bridge Format: [Collection] [GPM] GPM Widespread Bridge Kitchen Faucet [with Side Spray if applicable] - [Finish]
Wall Mount Format: [Collection] [GPM] GPM Wall Mounted [Type] Kitchen Faucet - [Finish]
Pre-Rinse Format: [Collection] [GPM] GPM Single Hole Pre-Rinse Pull Down Kitchen Faucet - [Finish]

Examples:
- Bolden 1.8 GPM Single Hole Pre-Rinse Pull Down Kitchen Faucet - Spot Free Stainless Steel/Matte Black
- Edwardian 1.5 GPM Widespread Bridge Kitchen Faucet with Side Spray - Unlacquered Brass
- Lot 1.5 GPM Wall Mounted Bar Faucet with Swivel Spout - Chrome
```

---

### 12. KITCHEN SINK (14 items)

#### Examples

**HOME REFINEMENTS BY JULIEN 005510**
- **Ferguson**: `Smart Station 61-1/2" Undermount Single Basin Stainless Steel Kitchen Sink with Basin Rack, Colander, Cutting Board and Drain Board - Stainless Steel`
- **AI**: `HOME REFINEMENTS BY JULIEN Modern Kitchen Sink Brushed Stainless Steel`
- **Gap**: Missing collection, size, installation, basin count, accessories

**FRANKE PKX11028-WKC**
- **Ferguson**: `Peak 28-3/4" Undermount Single Basin Stainless Steel Kitchen Sink with Basin Rack - Diamond`
- **AI**: `FRANKE Transitional Kitchen Sink Polished`
- **Gap**: Missing collection, size, installation, basin count, material, accessories

**NATIVE TRAILS CPK279**
- **Ferguson**: `Cocina 24" Undermount Single Basin Copper Kitchen Sink`
- **AI**: `NATIVE TRAILS Vintage Kitchen Sink Antique Copper`
- **Gap**: Missing collection, size, installation, basin count, material

**AI ENHANCEMENT NEEDED**: 
```
Format: [Collection] [Size]" Undermount [Basin Count] Basin [Material] Kitchen Sink [with Accessories if applicable] - [Finish]

Examples:
- Smart Station 61-1/2" Undermount Single Basin Stainless Steel Kitchen Sink with Accessories - Stainless Steel
- Peak 28-3/4" Undermount Single Basin Stainless Steel Kitchen Sink with Basin Rack - Diamond
- Cocina 24" Undermount Single Basin Copper Kitchen Sink - Antique Copper
```

---

### 13. MICROWAVE (28 items)

#### Over-the-Range Examples

**SAMSUNG ME21B706B12**
- **Web Retailer**: `30" Over-the-Range Microwave with 2.1 Cu. Ft. Capacity`
- **AI**: `SAMSUNG 2.1 Cu. Ft. Microwave Glass - ME21B706B12`
- **Gap**: Missing width, installation type (OTR)

**GE JVM3160DFCC**
- **Ferguson**: `30 Inch Wide 1.6 Cu. Ft. 1000 Watt Over the Range Microwave with Two-Speed 300 CFM Venting System and Auto and Time Defrost - Bisque`
- **AI**: `GE 1.6 Cu. Ft. Microwave Bisque - JVM3160DFCC`
- **Gap**: Missing width, wattage, installation type, CFM, features

**LG MVEL2033D**
- **Ferguson**: `30 Inch Wide 2 Cu. Ft. 1050 Watt Fingerprint Resistant Over the Range Microwave with EasyClean and ThinQ Technology - Black Stainless Steel`
- **AI**: `LG 2 Cu. Ft. Microwave PrintProof™ - MVEL2033D`
- **Gap**: Missing width, wattage, installation type, smart features

#### Countertop Examples

**WHIRLPOOL WMCS7022RS**
- **Web Retailer**: `22" 1.6 cu. ft. Sensor Cooking Countertop Microwave`
- **AI**: `WHIRLPOOL 1.6 Cu. Ft. Microwave Stainless Steel with Matching Hardware - WMCS7022RS`
- **Gap**: Missing width format, installation type (countertop)

**GE GCST16S1WSS**
- **Ferguson**: `22 Inch Wide 1.6 Cu. Ft. 1,150 Watt Countertop Microwave with Instant On Controls - Stainless Steel`
- **AI**: `GE 1.6 Cu. Ft. Microwave Stainless Steel - GCST16S1WSS`
- **Gap**: Missing width, wattage, installation type

**AI ENHANCEMENT NEEDED**: 
```
OTR Format: [Brand] [Width]-Inch Wide [Capacity] Cu. Ft. [Wattage] Watt Over the Range Microwave with [Key Feature] - [Finish]
Countertop Format: [Brand] [Width]-Inch Wide [Capacity] Cu. Ft. [Wattage] Watt Countertop Microwave [with Feature] - [Finish]
Built-In Format: [Brand] [Width]-Inch Wide [Capacity] Cu. Ft. Built In Microwave with [Feature] - [Finish]

Examples:
- GE 30-Inch Wide 1.6 Cu. Ft. 1000 Watt Over the Range Microwave with Two-Speed 300 CFM Venting - Bisque
- LG 30-Inch Wide 2 Cu. Ft. 1050 Watt Over the Range Microwave with ThinQ Technology - Black Stainless Steel
- WHIRLPOOL 22-Inch Wide 1.6 Cu. Ft. Countertop Microwave with Sensor Cooking - Stainless Steel
```

---

### 14. OVEN (55 items)

#### Single Wall Oven Examples

**LG WSES4728F/00**
- **Ferguson**: `30 Inch Wide 4.7 Cu. Ft. Electric Single Oven with Convection Bake and Auto Shut Off - Stainless Steel`
- **AI**: `LG 30-Inch Oven PrintProof™ Stainless Steel - WSES4728F/00`
- **Gap**: Missing width format, capacity, features

**GE JTS5000EVES**
- **Ferguson**: `30 Inch Wide 5 Cu. Ft. Fingerprint Resistant Electric Single Oven with Meat Thermometer and Convection - Fingerprint Resistant Slate`
- **AI**: `GE 30-Inch Oven Slate - JTS5000EVES`
- **Gap**: Missing capacity, features, detailed finish

**KITCHENAID KOES530PSS00**
- **Ferguson**: `30 Inch Wide 5 Cu. Ft. Electric Single Oven with Air Fry - Stainless Steel`
- **AI**: `KITCHENAID 30-Inch Oven Stainless Steel - KOES530PSS`
- **Gap**: Missing capacity, air fry feature

#### Double Wall Oven Examples

**GE PKD7000SN6SS**
- **Ferguson**: `Profile 27 Inch Wide 8.6 Cu. Ft. Double Electric Oven with True European Convection and Precise Temperature Probe - Stainless Steel`
- **AI**: `GE 27-Inch Oven Stainless Steel - PKD7000SNSS`
- **Gap**: Missing width format, capacity, features

**LG WDEP9427F/00**
- **Ferguson**: `30 Inch Wide 9.4 Cu. Ft. Fingerprint Resistant Electric Double Oven with Broil and Self-Clean - Stainless Steel`
- **AI**: `LG 30-Inch Oven - WDEP9427F/00`
- **Gap**: Missing capacity, double designation, features

**AI ENHANCEMENT NEEDED**: 
```
Single Format: [Brand/Collection] [Width]-Inch Wide [Capacity] Cu. Ft. Electric Single Oven with [Key Feature] - [Finish]
Double Format: [Brand/Collection] [Width]-Inch Wide [Total Capacity] Cu. Ft. Double Electric Oven with [Key Features] - [Finish]
Steam Format: [Brand] [Width]-Inch Wide [Type] Oven with Steam [and Features] - [Finish]

Examples:
- KITCHENAID 30-Inch Wide 5 Cu. Ft. Electric Single Oven with Air Fry - Stainless Steel
- Profile 27-Inch Wide 8.6 Cu. Ft. Double Electric Oven with True European Convection - Stainless Steel
- LG 30-Inch Wide 9.4 Cu. Ft. Electric Double Oven with Self-Clean - Stainless Steel
```

---

### 15. RANGE HOOD (175 items - HIGHEST VOLUME!)

#### Wall Mount Examples

**THERMADOR PH48HWS**
- **AI**: `THERMADOR Contemporary Range Hood Stainless Steel`
- **Ferguson**: `Pro Harmony® 48 Inch Wide Wall Mounted Range Hood - Stainless Steel`
- **Gap**: Missing collection, width, CFM, installation type

**THERMADOR HMWB30WS**
- **Ferguson**: `600 CFM 30 Inch Wide Wall Mounted Low-Profile Range Hood - Stainless Steel`
- **AI**: `THERMADOR Contemporary Range Hood Stainless Steel`
- **Gap**: Missing CFM, width, installation type, profile notation

**SAMSUNG NK30R5000WG**
- **Ferguson**: `390 CFM 30 Inch Wide Wall Mounted Range Hood - Fingerprint Resistant Black Stainless Steel`
- **AI**: `SAMSUNG Contemporary Range Hood Fingerprint Resistant Black Stainless Steel`
- **Gap**: Missing CFM, width, installation type

#### Under Cabinet Examples

**GE PVX7300SJSS**
- **Ferguson**: `400 CFM 30 Inch Wide Under Cabinet Range Hood with Glass Touch Controls - Stainless Steel`
- **AI**: `GE Contemporary Range Hood Stainless Steel`
- **Gap**: Missing CFM, width, installation type (under cabinet)

**WHIRLPOOL UXT4236ADS**
- **Ferguson**: `225 CFM 36 Inch Wide Under Cabinet Range Hood with Incandescent Lighting - Stainless Steel`
- **AI**: `WHIRLPOOL Contemporary Range Hood Stainless Steel`
- **Gap**: Missing CFM, width, installation type

#### Island Mount Examples

**DACOR DHI482**
- **Web Retailer**: `48" Island Mount Range Hood with 1200 CFM Internal Blower`
- **AI**: `DACOR Modern Range Hood Stainless Steel`
- **Gap**: Missing width, CFM, installation type (island)

**AI ENHANCEMENT NEEDED**: 
```
Wall Mount Format: [Collection/Brand] [CFM Range] CFM [Width]-Inch Wide Wall Mounted [Profile if Low/Pro] Range Hood - [Finish]
Under Cabinet Format: [Brand] [CFM] CFM [Width]-Inch Wide Under Cabinet Range Hood [with Feature] - [Finish]
Island Mount Format: [Brand/Collection] [CFM] CFM [Width]-Inch Wide Island Mount Range Hood - [Finish]
Insert Format: [Brand] [CFM] CFM [Width]-Inch Wide Range Hood Insert - [Finish]

Examples:
- THERMADOR 600 CFM 30-Inch Wide Wall Mounted Low-Profile Range Hood - Stainless Steel
- GE 400 CFM 30-Inch Wide Under Cabinet Range Hood with Glass Touch Controls - Stainless Steel
- DACOR 1200 CFM 48-Inch Wide Island Mount Range Hood - Stainless Steel
```

---

### 16. REFRIGERATOR (91 items)

#### French Door Examples

**GE PYE22KYNFS**
- **Ferguson**: `36 Inch Wide 22.2 Cu. Ft. Counter Depth French Door Refrigerator with Hands-Free Autofill and TwinChill Evaporators - Stainless Steel`
- **AI**: `GE 22.1 Cu. Ft. Refrigerator Fingerprint Resistant Stainless Steel - PYE22KYNFS`
- **Gap**: Missing width, door type, counter depth notation, key features

**BOSCH B36CT80SNS**
- **Ferguson**: `800 Series 36 Inch Wide 20.8 Cu. Ft. Energy Star Certified French Door Refrigerator with MultiAirFlow and VitaFreshPro`
- **AI**: `BOSCH 20.8 Cu. Ft. Refrigerator Stainless Steel - B36CT80SNS`
- **Gap**: Missing series, width, door type, features

**LG LFXS26973D/00**
- **Ferguson**: `36 Inch Wide 26.2 Cu. Ft. Energy Star Rated French Door Refrigerator with SmartThinQ Technology - Black Stainless Steel`
- **AI**: `LG 26.2 Cu. Ft. Refrigerator Matte - LFXS26973D/00`
- **Gap**: Missing width, door type, smart features

#### Side-by-Side Examples

**GE GSE25GYPFS**
- **Ferguson**: `36 Inch Wide 25.3 Cu. Ft. Energy Star Rated Fingerprint Resistant Side By Side Refrigerator with External Ice and Water Dispenser - Fingerprint Resistant Stainless`
- **AI**: `GE 25.3 Cu. Ft. Refrigerator Fingerprint Resistant Stainless - GSE25GYPFS`
- **Gap**: Missing width, door type, dispenser notation

**WHIRLPOOL WRS588FIHZ**
- **Ferguson**: `36 Inch Wide 28.49 Cu. Ft. Side by Side Refrigerator - Fingerprint Resistant Stainless Steel`
- **AI**: `WHIRLPOOL 28.5 Cu. Ft. Refrigerator Smooth - WRS588FIHZ`
- **Gap**: Missing width, door type

#### Column/Built-In Examples

**VIKING FRI7240WL22**
- **Web Retailer**: `24" Refrigerator Column with 12.9 Cu. Ft. Capacity`
- **AI**: `VIKING 12.9 Cu. Ft. Refrigerator Stainless Steel - FRI7240WL`
- **Gap**: Missing width, column/built-in designation

**MONOGRAM ZIR241NBRII**
- **Ferguson**: `24 Inch Wide 13.3 Cu. Ft. Smart Column Refrigerator with Temperature Controlled Drawer - Panel Ready`
- **AI**: `MONOGRAM 13 Cu. Ft. Refrigerator Integrated/Flush - ZIR241NBRII`
- **Gap**: Missing width, column designation, smart features

#### Wine Cooler/Beverage Center Examples

**U-LINE UACP115-IS01A**
- **Ferguson**: `ADA Collection 15 Inch Wide 23 Lbs. Capacity Panel Ready Built-In / Free Standing Ice Maker with 39 Lbs. Daily Ice Production and Clear Ice Cubes`
- **AI**: `U-LINE Icemaker Solid - UACP115-IS01A`
- **Gap**: Wrong category (Ice Maker vs Refrigerator), missing collection, width

**AI ENHANCEMENT NEEDED**: 
```
French Door Format: [Collection/Brand] [Width]-Inch Wide [Capacity] Cu. Ft. [Counter Depth if applicable] French Door Refrigerator [with Key Features] - [Finish]
Side-by-Side Format: [Brand] [Width]-Inch Wide [Capacity] Cu. Ft. Side by Side Refrigerator [with Dispenser if applicable] - [Finish]
Column Format: [Brand] [Width]-Inch Wide [Capacity] Cu. Ft. [Column/Built-In] Refrigerator [Smart if applicable] - [Panel Ready/Finish]
Wine Cooler Format: [Brand] [Width]-Inch Wide [Bottle Capacity] Bottle [Dual Zone if applicable] Wine Cooler - [Finish]

Examples:
- GE 36-Inch Wide 22.2 Cu. Ft. Counter Depth French Door Refrigerator with Hands-Free Autofill - Stainless Steel
- WHIRLPOOL 36-Inch Wide 28.49 Cu. Ft. Side by Side Refrigerator - Fingerprint Resistant Stainless Steel
- MONOGRAM 24-Inch Wide 13.3 Cu. Ft. Smart Column Refrigerator with Temperature Controlled Drawer - Panel Ready
```

---

### 17. SHOWER/SHOWER FAUCET (60+ items)

#### Pressure Balance Valve Examples

**ROHL TAC23W1LMAPC**
- **Ferguson**: `Arcana Two Independent and One Shared Function Thermostatic Valve Trim Only with Single Cross / Lever Handle, Integrated Diverter, and Volume Control - Less Rough In - Polished Chrome`
- **AI**: `ROHL Contemporary Shower Faucet Polished Chrome`
- **Gap**: Missing collection, valve type, functions, handle detail

**GRAFF G-7030-LM45S-T**
- **Ferguson**: `Phase Pressure Balanced Valve Trim Only - Less Rough In - Brushed Nickel`
- **AI**: `GRAFF Contemporary Shower Accessory Brushed Nickel`
- **Gap**: Wrong subcategory, missing collection, valve type

#### Shower Head Examples

**GRAFF G-8476-SP**
- **Ferguson**: `Aqua-Sense Shower Heads - Stainless Polished`
- **AI**: `GRAFF Contemporary Shower Stainless Polished`
- **Gap**: Missing collection, shower head designation

**KALLISTA P21514-00-SN**
- **Ferguson**: `2.5 Gallon Single Function Rain Shower Head - Polished Nickel`
- **AI**: `KALLISTA Modern Shower Polished Nickel`
- **Gap**: Missing GPM, function type, rain designation

#### Hand Shower Examples

**GRAFF G-6156-C19B-BK-T**
- **Ferguson**: `Harley 1.5 GPM Single Function Hand Shower - Architectural Black`
- **AI**: `GRAFF Contemporary Shower Faucet Architectural Black`
- **Gap**: Missing collection, GPM, hand shower designation

**AI ENHANCEMENT NEEDED**: 
```
Pressure Balance Format: [Collection] Pressure Balanced Valve Trim Only [with Handle Type] - Less Rough In - [Finish]
Thermostatic Format: [Collection] Thermostatic Valve Trim with [Functions] and [Controls] - Less Rough In - [Finish]
Shower Head Format: [Collection] [GPM] GPM [Function Type] [Rain/Standard] Shower Head - [Finish]
Hand Shower Format: [Collection] [GPM] GPM [Function] Hand Shower [Includes Hose if applicable] - [Finish]

Examples:
- Phase Pressure Balanced Valve Trim Only with Single Lever Handle - Less Rough In - Brushed Nickel
- Arcana Thermostatic Valve Trim with Integrated Diverter and Volume Control - Less Rough In - Polished Chrome
- Aqua-Sense 1.8 GPM Multi Function Rain Shower Head - Stainless Polished
- Harley 1.5 GPM Single Function Hand Shower - Architectural Black
```

---

### 18. TUB FAUCET (15 items)

#### Floor Mounted Examples

**AXOR 48441001**
- **Ferguson**: `ONE Floor Mounted Tub Filler with 1.75 GPM Handshower Less Rough In - Engineered in Germany, Limited Lifetime Warranty - Chrome`
- **AI**: `AXOR Modern Tub Faucet Chrome`
- **Gap**: Missing collection, installation type, GPM, hand shower notation

**KALLISTA P24418-00-AD**
- **Ferguson**: `One Floor Mounted Tub Filler with Built-In Diverter - Nickel Silver`
- **AI**: `KALLISTA Contemporary Tub Faucet Nickel Silver`
- **Gap**: Missing collection, installation type, diverter notation

**GRAFF G-6854-LM47N-PN-T**
- **Ferguson**: `Finezza UNO Floor Mounted Tub Filler with Built-In Diverter - Includes Hand Shower - Polished Nickel`
- **AI**: `GRAFF Modern Tub Faucet Polished Nickel`
- **Gap**: Missing collection, installation type, components

#### Deck Mount Examples

**GRAFF G-2356-LM40B-SN**
- **Ferguson**: `Immersion Deck Mounted Roman Tub Filler with Built-In Diverter - Includes Hand Shower - Steelnox`
- **AI**: `GRAFF Contemporary Tub Faucet Satin Nickel`
- **Gap**: Missing collection, installation type, diverter, hand shower

**AI ENHANCEMENT NEEDED**: 
```
Floor Mount Format: [Collection] Floor Mounted Tub Filler with [Built-In Diverter/GPM] [Includes Hand Shower if applicable] - [Finish]
Deck Mount Format: [Collection] Deck Mounted Roman Tub Filler with [Built-In Diverter if applicable] [Includes Hand Shower if applicable] - [Finish]
Wall Mount Format: [Collection] Wall Mounted [Clawfoot if applicable] Tub Filler with [Features] - [Finish]

Examples:
- ONE Floor Mounted Tub Filler with 1.75 GPM Hand Shower Less Rough In - Chrome
- Immersion Deck Mounted Roman Tub Filler with Built-In Diverter - Includes Hand Shower - Steelnox
- Finezza UNO Floor Mounted Tub Filler with Built-In Diverter - Includes Hand Shower - Polished Nickel
```

---

### 19. TOILET (4 items)

#### Smart Toilet Examples

**KOHLER K-5401-DA-0**
- **Ferguson**: `Landshapes by Daniel Arsham 0.8 / 1.28 GPF Dual Flush One Piece Elongated Smart Toilet with Actuator Plate Flush - Bidet Seat Included - White`
- **AI**: `KOHLER Toilet Not specified in available sources - K-5401-DA-0`
- **Gap**: Missing collection, GPF, flush type, smart features, bidet notation

**DURAVIT 620000011401320**
- **Ferguson**: `SensoWash I by Philippe Starck 0.8 / 1.06 GPF Dual Flush Elongated Toilet - White`
- **AI**: `DURAVIT Toilet - 620000011401320`
- **Gap**: Missing collection, GPF, smart bidet features

**AI ENHANCEMENT NEEDED**: 
```
Smart Toilet Format: [Collection by Designer if applicable] [GPF1]/[GPF2] GPF Dual Flush [One/Two Piece] [Elongated/Round] Smart Toilet [with Bidet if applicable] - [Finish]
Standard Toilet Format: [Collection] [GPF] GPF [Flush Type] [One/Two Piece] [Elongated/Round] Toilet [with Features] - [Finish]

Examples:
- Landshapes by Daniel Arsham 0.8/1.28 GPF Dual Flush One Piece Elongated Smart Toilet with Bidet Seat - White
- SensoWash I by Philippe Starck 0.8/1.06 GPF Dual Flush Elongated Smart Toilet - White
```

---

### 20. WASHER (13 items)

#### Front Load Examples

**LG WM3400CW**
- **Ferguson**: `27 Inch Wide 4.5 Cu Ft. Energy Star Rated Front Loading Washer with 8 Wash Programs`
- **AI**: `LG Contemporary Washer White`
- **Gap**: Missing width, capacity, load type, cycle count

**LG WM6500HBA**
- **Ferguson**: `27 Inch Wide 5 Cu. Ft. Energy Star Certified Front Loading Washing Machine with AI DD and TurboWash 360° - Black Steel`
- **AI**: `LG Contemporary Washer`
- **Gap**: Missing width, capacity, load type, smart features

#### Top Load Examples

**LG WT8400CB**
- **Ferguson**: `27 Inch Wide 5.5 Cu. Ft. Energy Star Certified Top Loading Washing Machine with Knob and Touch Controls - Matte Black`
- **AI**: `LG Contemporary Washer Matte`
- **Gap**: Missing width, capacity, load type, controls

**WHIRLPOOL WTW6157PW**
- **Ferguson**: `28 Inch Wide 5.2-5.3 Cu. Ft. Energy Star Certified Top Loading Washing Machine with Removable Agitator`
- **AI**: `WHIRLPOOL Contemporary Washer White`
- **Gap**: Missing width, capacity, load type, key feature (agitator)

**AI ENHANCEMENT NEEDED**: 
```
Front Load Format: [Brand] [Width]-Inch Wide [Capacity] Cu. Ft. [Energy Star if applicable] Front Loading Washer [with Key Feature] - [Finish]
Top Load Format: [Brand] [Width]-Inch Wide [Capacity] Cu. Ft. [Energy Star if applicable] Top Loading Washer [with Feature] - [Finish]

Examples:
- LG 27-Inch Wide 5 Cu. Ft. Energy Star Certified Front Loading Washer with AI DD and TurboWash 360° - Black Steel
- WHIRLPOOL 28-Inch Wide 5.3 Cu. Ft. Energy Star Certified Top Loading Washer with Removable Agitator - White
```

---

## SUMMARY OF CRITICAL AI TITLE IMPROVEMENTS NEEDED

### Top Priority Categories (By Volume & Impact)

1. **RANGE HOOD (175 items)** - Add: CFM, Width, Installation Type (Wall/Under Cabinet/Island/Insert)
2. **REFRIGERATOR (91 items)** - Add: Width, Door Type, Counter Depth notation, Key Features
3. **DISHWASHER (78 items)** - Add: Width, Place Settings, Control Type (Top/Front), Key Features
4. **COOKTOP (59 items)** - Add: Burner Count, Fuel Type (Gas/Induction/Electric), Key Feature
5. **OVEN (55 items)** - Add: Capacity, Single/Double designation, Key Technology
6. **BATHROOM FAUCET (50 items)** - Add: Collection Name, GPM, Installation Type (Widespread/Single Hole/Wall Mount/Vessel)
7. **DRYER (48 items)** - Add: Width, Fuel Type (Electric/Gas/Heat Pump), Key Feature

### Universal AI Title Enhancement Patterns

**Current AI Pattern (TOO BRIEF)**:
```
[Brand] [Style] [Category] [Finish]
Example: "GE Contemporary Refrigerator Stainless Steel"
```

**Ferguson/Web Retailer Pattern (TARGET)**:
```
[Brand/Collection] [Critical Spec 1] [Critical Spec 2] [Type/Installation] [Category] with [Key Feature] - [Finish]
Example: "GE 36-Inch Wide 25.3 Cu. Ft. Side by Side Refrigerator with External Dispenser - Stainless Steel"
```

### Critical Missing Elements Across All Categories

1. **SIZE/DIMENSIONS** - Width for appliances, length for faucets, diameter for lighting
2. **CAPACITY/VOLUME** - Cu. Ft. for appliances, GPM for faucets, place settings for dishwashers
3. **INSTALLATION TYPE** - Undermount, Wall Mount, Freestanding, Built-In, etc.
4. **FUEL/POWER TYPE** - Gas, Electric, Induction (critical for cooktops/ranges/dryers!)
5. **KEY FEATURES** - Smart features, Energy Star, special technologies
6. **COLLECTION NAMES** - Especially important for luxury brands (GRAFF, KALLISTA, AXOR)
7. **CONFIGURATION DETAILS** - Single/Double, Top/Front Control, Burner Count, Basin Count

---

## NEXT STEPS FOR IMPLEMENTATION

1. **Update Title Generation Service** to include these enhanced patterns per category
2. **Create Category-Specific Title Templates** using the formats above
3. **Add Attribute Extraction Logic** to pull missing specs from source data
4. **Implement Ferguson Pattern Matching** as the primary template source
5. **Test on High-Volume Categories First** (Range Hood, Refrigerator, Dishwasher, Cooktop)
6. **Run Validation Report** comparing old AI titles vs new enhanced titles
7. **Deploy and Monitor** title quality improvements in production

---

**Document Generated**: February 25, 2026
**Analyst**: GitHub Copilot
**Dataset**: 992 items from Salesforce Verification API
**Next Review**: After implementation of enhancement patterns
