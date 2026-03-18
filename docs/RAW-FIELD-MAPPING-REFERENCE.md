# Raw-to-Verified Field Mapping Reference

> **Purpose**: Single source of truth mapping every raw Salesforce/Ferguson/Web Retailer field to its verified output field. Use this to trace any field's journey from raw data to Salesforce export.
>
> **Source files**: `smart-field-inference.service.ts` (FIELD_ALIASES), `picklist-matcher.service.ts` (ATTRIBUTE_ALIASES), `dual-ai-verification.service.ts` (sanitizedPrimaryAttributes, extractors), `ai-prompt-builder.service.ts` (AI field labels)
>
> **Last updated**: 2026-03-18

---

## Table of Contents

1. [Data Flow Overview](#1-data-flow-overview)
2. [Source Priority by Department](#2-source-priority-by-department)
3. [Output Fields → Raw Source Priority Chains](#3-output-fields--raw-source-priority-chains)
4. [Raw Field Inventory](#4-raw-field-inventory)
5. [AI Prompt Field Labels](#5-ai-prompt-field-labels)
6. [FIELD_ALIASES — Complete Mapping](#6-field_aliases--complete-mapping)
7. [ATTRIBUTE_ALIASES — Normalization Map](#7-attribute_aliases--normalization-map)
8. [Known-Value Extraction Lists](#8-known-value-extraction-lists)
9. [Value Extraction Patterns (Regex)](#9-value-extraction-patterns-regex)
10. [Ambiguity Points & Known Issues](#10-ambiguity-points--known-issues)
11. [How to Add a New Field](#11-how-to-add-a-new-field)

---

## 1. Data Flow Overview

```
Raw Salesforce Data (3 sources)
    │
    ├── Web Retailer fields (Brand_Web_Retailer, Width_Web_Retailer, etc.)
    ├── Ferguson flat fields (Ferguson_Brand, Ferguson_Width, etc.)
    └── Ferguson_Raw_Data (nested JSON: specifications, feature_groups)
    │
    ▼
┌───────────────────────────────────────────────────────────────┐
│  STAGE 1: Field Normalization                                  │
│  • getFieldByPriority() — picks source by department           │
│  • findTop15AttributeValue() — 4-stage fallback, 3-pass match  │
│  • findAttributeInRawData() — legacy fuzzy search              │
│  • FIELD_ALIASES — 130+ alias mappings resolve ambiguity       │
│  • ATTRIBUTE_ALIASES — normalizes attribute names              │
└───────────────────────────────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────────────────────────────┐
│  STAGE 2: AI Verification (OpenAI + xAI)                       │
│  • buildVerificationPrompt() — explicitly-labeled fields       │
│  • AI receives disambiguated field names                       │
│  • Two AIs verify independently → consensus                   │
└───────────────────────────────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────────────────────────────┐
│  STAGE 3: Post-Processing & Extraction                         │
│  • preferAIValue() — picks best AI answer                      │
│  • extractKnownValueFromTexts() — longest-match-first          │
│  • Category-specific override chains (Shower, Bathtub, etc.)   │
│  • Picklist matching (brand, category, type, style)            │
└───────────────────────────────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────────────────────────────┐
│  STAGE 4: sanitizedPrimaryAttributes (EXPORT)                  │
│  • Final verified values sent back to Salesforce               │
│  • Picklist IDs attached (_Lookup fields)                      │
│  • Unit suffixes stripped (lbs, inches, etc.)                  │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Source Priority by Department

**Function**: `getFieldByPriority()` — [dual-ai-verification.service.ts:237-253](src/services/dual-ai-verification.service.ts#L237-L253)

| Department | Primary Source | Secondary Source | Fallback |
|-----------|---------------|-----------------|----------|
| **Appliances** (Dishwasher, Refrigerator, Range, Cooktop, Washer, Dryer, Range Hood, Microwave, Freezer, Garbage Disposal, Trash Compactor) | Web Retailer | Ferguson | Default value |
| **Everything Else** (Plumbing, Lighting, Hardware, Bath) | Ferguson | Web Retailer | Default value |

**Logic**: Appliance data tends to be richer from web retailers (Home Depot, Lowe's). Plumbing/lighting data tends to be richer from Ferguson's manufacturer API.

---

## 3. Output Fields → Raw Source Priority Chains

Each output field follows this resolution order:
1. **AI Consensus** (both AIs agree)
2. **OpenAI value** (higher confidence)
3. **xAI value** (lower confidence)
4. **Structured extraction** (regex/known-value matching)
5. **Raw field fallback** (direct from source data)

### Core Identification

| Output Field | Priority Chain | Notes |
|-------------|---------------|-------|
| **AI_Brand** | Picklist match → AI consensus → OpenAI → xAI → `cleanedText.brand` | Must match `brands.json` exactly |
| **AI_Brand_Lookup** | Picklist match `brand_id` or `null` | Salesforce record ID |
| **AI_Product_Category** | Picklist match → AI consensus → `cleanedText.category` | Must match `categories.json` (singular) |
| **AI_Product_Category_Lookup** | Picklist match `category_id` or `null` | Salesforce record ID |
| **AI_Product_Family** | Picklist `family` field → AI consensus | From categories.json family column |
| **AI_Product_Department** | Hierarchical determination (Stage 1) | 11 departments |
| **AI_Type** | Picklist match → AI consensus → `aiProductType` → "Not Applicable" | Must match category-type mapping |
| **AI_Type_Id** | Picklist match `type_id` or `null` | Salesforce record ID |
| **AI_Style** | Picklist match → AI-derived style | Can be non-picklist value |
| **AI_Style_Lookup** | Picklist match `style_id` or `null` | Salesforce record ID |

### Appearance

| Output Field | Priority Chain | Notes |
|-------------|---------------|-------|
| **AI_Color** | AI consensus → OpenAI → xAI → `Ferguson_Color` → `Color_Finish_Web_Retailer` → `findAttributeInRawData('Color')` → `findAttributeInRawData('Finish Color')` → image analysis → `extractColorFinish()` from title/description | Hex codes replaced with finish name or cleared |
| **AI_Finish** | AI consensus → OpenAI → xAI → `Ferguson_Finish` → `findAttributeInRawData('Finish')` → `findAttributeInRawData('Surface Finish')` → image analysis → `extractColorFinish()` | |
| **AI_Material** | AI consensus → OpenAI → xAI → `findAttributeInRawData('Material')` → `extractMaterialFromTexts()` | |

### Dimensions

| Output Field | Priority Chain | Notes |
|-------------|---------------|-------|
| **AI_Width** | AI consensus → OpenAI → xAI → `getFieldByPriority(Width_Web_Retailer, Ferguson_Width)` → `findAttributeInRawData('Width')` → `findAttributeInRawData('Overall Width')` → text extraction → **category overrides** (Sink: Ferguson nominal spec → name regex; Vanity: Ferguson nominal_width → name regex) | |
| **AI_Height** | AI consensus → OpenAI → xAI → `getFieldByPriority(Height_Web_Retailer, Ferguson_Height)` → `findAttributeInRawData('Height')` → `findAttributeInRawData('Overall Height')` | |
| **AI_Depth** | AI consensus → OpenAI → xAI → `getFieldByPriority(Depth_Web_Retailer, Ferguson_Depth)` → `findAttributeInRawData('Depth')` → `findAttributeInRawData('Overall Depth')` | |
| **AI_Length** | Special: Bathtub override chain (Ferguson `nominal_length` → product name regex, range 30-84") | Only populated for Bathtubs via post-processing |

### Weight & Pricing

| Output Field | Priority Chain | Notes |
|-------------|---------------|-------|
| **AI_Weight** | AI consensus → OpenAI → xAI → `Weight_Web_Retailer` → `findAttributeInRawData('Weight')` → `findAttributeInRawData('Product Weight')` → `findAttributeInRawData('Shipping Weight')` | Unit suffixes (lbs, kg, oz) stripped automatically |
| **AI_MSRP** | AI consensus → OpenAI → xAI → `MSRP_Web_Retailer` → `Ferguson_Price` → `findAttributeInRawData('MSRP')` → `findAttributeInRawData('List Price')` | |

### Model Information

| Output Field | Priority Chain | Notes |
|-------------|---------------|-------|
| **AI_Model_Number** | AI consensus (if not "Not Found") → `Ferguson_Model_Number` → `Model_Number_Web_Retailer` → `SF_Catalog_Name` | AI value rejected if contains "Not Found" or "FIELD_NOT_FOUND" |
| **AI_Model_Alias** | AI consensus → OpenAI → xAI | Alternative model identifiers |
| **AI_Model_Parent** | AI consensus → OpenAI → xAI → `Ferguson_Raw_Data.product.parent_model_number` | Parent model family |
| **AI_Model_Variant_Number** | AI consensus → OpenAI → xAI | Specific variant within model family |
| **AI_Total_Model_Variants** | AI consensus → OpenAI → xAI | Count of variants in model family |

### Content & Presentation

| Output Field | Priority Chain | Notes |
|-------------|---------------|-------|
| **AI_Product_Title** | Title schema generation → post-processing chains → `preliminarySeoTitle` | Regenerated after Final Review |
| **AI_Description** | `cleanedText.description` | Cleaned from raw descriptions |
| **AI_Features** | `cleanedText.featuresHtml` | HTML-formatted feature list |
| **AI_UPC_GTIN** | AI consensus → OpenAI → xAI → `findAttributeInRawData('UPC')` → placeholder "741360976603" | Placeholder means "lookup required" |
| **AI_Product_Filter_Class** | Derived from primary dimension → size bucketing (e.g., "48-Inch") | Used for website filtering |
| **AI_Recommended_Primary** | Image analysis → filename heuristics (front view, lifestyle) | Recommended primary product image |

### Review & Confidence

| Output Field | Priority Chain | Notes |
|-------------|---------------|-------|
| **AI_Review** | Composite object with confidence scores, consensus metrics, issues detected | Not sent to Salesforce directly — used for quality tracking |

### Category-Specific Fields (populated via extractors)

| Output Field | Extractor Function | Known Values | Categories |
|-------------|-------------------|-------------|-----------|
| **AI_Installation_Type** | `extractInstallationFromTexts()` | From `getValidInstallationTypes()` picklist | Bathtub, Dishwasher, Sink, etc. |
| **AI_Configuration** | `extractConfigurationFromTexts()` | French Door, Side-by-Side, Top Freezer, Bottom Freezer, Single/Double/Triple/Quad Door, Single/Double Oven, Combination, Convertible | Refrigerator, Range |
| **AI_Fuel_Type** | `extractFuelTypeFromTexts()` | Dual Fuel, Natural Gas, Liquid Propane, LP Gas, Gas, Electric, Induction, Propane | Range, Cooktop |
| **AI_Capacity** | `extractCapacityFromTexts()` | Regex: `\d+\.\d+ cu. ft.` pattern | Refrigerator, Washer, Dryer, Microwave |
| **AI_Shape** | `extractShapeFromTexts()` | Rectangular, Oval, Round, Square, D-Shape, D-Shaped, Octagonal, Hexagonal, Arch, Arched | Mirror, Bathtub |
| **AI_Bowl_Shape** | `extractBowlShapeFromTexts()` | Elongated, Round-Front, Round Front, Round | Toilet, Toilet Seat |
| **AI_Flush_Type** | `extractFlushTypeFromTexts()` | Dual Flush, Single Flush, Pressure-Assisted, Gravity | Toilet |
| **AI_Finish** (extractor fallback) | `extractFinishFromTexts()` | Black Stainless, Stainless Steel, Oil Rubbed Bronze, Champagne Bronze, Brushed Nickel, Chrome, Matte Black, etc. (25 values) | All categories |
| **AI_Toilet_Seat_Type** | `extractToiletSeatTypeFromTexts()` | Soft Close, Slow Close, Heated, Bidet, Quick Release | Toilet Seat |

---

## 4. Raw Field Inventory

### Salesforce Metadata
| Field | Example | Used For |
|-------|---------|----------|
| `SF_Catalog_Id` | UUID | Catalog tracking, prompt input |
| `SF_Catalog_Name` | "AGSR36WH" | Fallback model number |

### Web Retailer Fields (Primary for Appliances)
| Field | Example | Maps To |
|-------|---------|---------|
| `Brand_Web_Retailer` | "GE", "Whirlpool" | AI_Brand (appliances) |
| `Product_Title_Web_Retailer` | "36\" SS French Door Refrigerator" | Title generation + text extraction |
| `Product_Description_Web_Retailer` | Long HTML | Feature extraction |
| `Web_Retailer_Category` | "Refrigerators" | Category matching input |
| `Web_Retailer_SubCategory` | "French Door" | Type hint |
| `Model_Number_Web_Retailer` | "GFE28HSNSS" | AI_Model_Number fallback |
| `Width_Web_Retailer` | "35.875" | AI_Width (appliances primary) |
| `Height_Web_Retailer` | "69.875" | AI_Height (appliances primary) |
| `Depth_Web_Retailer` | "33.75" | AI_Depth (appliances primary) |
| `Weight_Web_Retailer` | "735 lbs" | AI_Weight (strip unit) |
| `Capacity_Web_Retailer` | "27.8 cu ft" | AI_Capacity source |
| `Color_Finish_Web_Retailer` | "Stainless Steel" | AI_Color fallback |
| `MSRP_Web_Retailer` | "3499.99" | AI_MSRP primary |
| `Web_Retailer_Specs[]` | `[{name, value}]` | `findTop15AttributeValue` Stage 2 |
| `Specification_Table` | Structured spec data | Formatted in AI prompt for verification |

### Ferguson Flat Fields (Primary for Non-Appliances)
| Field | Example | Maps To |
|-------|---------|---------|
| `Ferguson_Brand` | "Kohler", "Moen" | AI_Brand (non-appliances) |
| `Ferguson_Title` | "Sundial Chrome 1.8 GPM Showerhead" | Title generation + text extraction |
| `Ferguson_Description` | Product description | Feature extraction |
| `Ferguson_Product_Type` | "Showerheads" | Type hint |
| `Ferguson_Base_Category` | "Plumbing" | Department classification |
| `Ferguson_Business_Category` | "Faucets & Shower Fixtures" | Business category |
| `Ferguson_Model_Number` | "K-8014-CP" | AI_Model_Number (non-appliance primary) |
| `Ferguson_Width` | "3" | AI_Width (non-appliance primary) |
| `Ferguson_Height` | "8.25" | AI_Height (non-appliance primary) |
| `Ferguson_Depth` | "2.5" | AI_Depth (non-appliance primary) |
| `Ferguson_Finish` | "Chrome" | AI_Finish primary source |
| `Ferguson_Color` | "Chrome" | AI_Color fallback |
| `Ferguson_Price` | "245.00" | AI_MSRP fallback |
| `Ferguson_Min_Price` | "200.00" | Price range context |
| `Ferguson_Max_Price` | "300.00" | Price range context |
| `Ferguson_Manufacturer_Warranty` | "Lifetime Limited" | Warranty info |
| `Ferguson_URL` | "https://..." | AI research source |
| `Ferguson_Attributes[]` | `[{name, value}]` | `findTop15AttributeValue` Stage 1 |

### Ferguson_Raw_Data (Nested JSON — Phase 0.1A)
| Path | Example | Used For |
|------|---------|----------|
| `.product.name` | "Kohler K-8014-CP" | Dimension extraction via regex (sinks) |
| `.product.specifications` | `{nominal_width: {value: "24"}}` | `findTop15AttributeValue` Stage 3 |
| `.product.feature_groups[]` | Groups with features array | `findTop15AttributeValue` Stage 4 |
| `.product.variants[]` | Model variants | Model variant tracking |
| `.product.parent_model_number` | "K-8014" | Parent model reference |
| `.search_meta_data.business_category` | Category | Classification hint |

### Supporting Fields
| Field | Example | Used For |
|-------|---------|----------|
| `Stock_Images[]` | `[{filename, url}]` | Image analysis (color/finish from filenames) |
| `Documents[]` | Spec sheets, manuals | AI research source |
| `Reference_URL` | Third-party retailer URL | Web search/verification |
| `Brand_Legacy` | Approximate brand | Tie-breaking only (never exported) |
| `Category_Legacy` | Broader category | Tie-breaking only (never exported) |

---

## 5. AI Prompt Field Labels

**File**: [ai-prompt-builder.service.ts:14-100](src/services/ai-prompt-builder.service.ts#L14-L100)

These are the exact labels the AI sees. Ambiguous raw field names are replaced with explicit labels:

| Prompt Label | Raw Source Field | Why It's Labeled This Way |
|-------------|-----------------|--------------------------|
| `Catalog ID` | `SF_Catalog_Id` | Direct |
| `Model Number (Web Retailer)` | `Model_Number_Web_Retailer` | Disambiguates from Ferguson model |
| `Model Number (Ferguson)` | `Ferguson_Model_Number` | Disambiguates from Web Retailer model |
| `Brand (Web Retailer)` | `Brand_Web_Retailer` | Source-tagged |
| `Brand (Ferguson)` | `Ferguson_Brand` | Source-tagged |
| `Web Retailer Title` | `Product_Title_Web_Retailer` | Source-tagged |
| `Ferguson Title` | `Ferguson_Title` | Source-tagged |
| `Web Retailer Description` | `Product_Description_Web_Retailer` | Truncated to 2000 chars |
| `Ferguson Description` | `Ferguson_Description` | Truncated to 2000 chars |
| `Web Retailer Category` | `Web_Retailer_Category` | Category input |
| `Web Retailer SubCategory` | `Web_Retailer_SubCategory` | Type hint |
| `Ferguson Base Category` | `Ferguson_Base_Category` | Category input |
| `Ferguson Product Type` | `Ferguson_Product_Type` | Type hint |
| `Ferguson Business Category` | `Ferguson_Business_Category` | Classification |
| `MSRP (Web Retailer)` | `MSRP_Web_Retailer` | Source-tagged |
| `Ferguson Price` | `Ferguson_Price` | Source-tagged |
| `Width: Web=X, Ferguson=Y` | Both width fields | Side-by-side comparison |
| `Height: Web=X, Ferguson=Y` | Both height fields | Side-by-side comparison |
| `Depth: Web=X, Ferguson=Y` | Both depth fields | Side-by-side comparison |
| `Weight` | `Weight_Web_Retailer` | Single source |
| `Capacity` | `Capacity_Web_Retailer` | Single source |
| `Color/Finish (Web Retailer)` | `Color_Finish_Web_Retailer` | Disambiguates from Ferguson finish |
| `Finish (Ferguson)` | `Ferguson_Finish` | Disambiguates from Web Retailer color |
| `Ferguson Warranty` | `Ferguson_Manufacturer_Warranty` | Direct |

**Key insight**: The AI never sees ambiguous field names. "product color", "item color", and "color" are all resolved to explicit labels before the AI prompt is built.

---

## 6. FIELD_ALIASES — Complete Mapping

**File**: [smart-field-inference.service.ts:26-900](src/services/smart-field-inference.service.ts#L26-L900)

These aliases resolve ambiguous raw attribute names. When the system searches for "installation_type", it checks ALL listed aliases.

### Universal Fields

| Salesforce Field Key | Aliases (searches ALL of these) |
|---------------------|-------------------------------|
| `capacity_gallons` | capacity (gallons), gallon capacity, water capacity, tub capacity, tank capacity, total capacity, volume, gallons, gal capacity, water volume, fill capacity, bath capacity |
| `capacity` | oven capacity, cu ft, cubic feet, interior capacity, drum capacity, total capacity, storage capacity, freezer capacity, refrigerator capacity |
| `weight` | product weight, shipping weight, net weight, gross weight, item weight, unit weight, weight lbs, weight (lbs), lbs, pounds |
| `weight_capacity` | max weight, maximum weight, load capacity, weight limit, supported weight, capacity lbs |
| `nominal_length` | length, overall length, tub length, product length, total length, exterior length, inside length, interior length |
| `nominal_width` | width, overall width, tub width, product width, total width, exterior width, inside width, interior width |
| `water_depth` | soaking depth, water depth, fill depth, interior depth, bathing depth, soak depth, maximum water depth |
| `height` | overall height, product height, total height, rim height, exterior height, tub height |
| `flow_rate` | gpm, gallons per minute, flow, water flow, flow rate gpm, max flow rate, maximum flow |
| `btu_output` | btu, btus, btu rating, heating capacity, burner output, max btu, total btu |
| `cfm` | airflow, air flow, cfm rating, ventilation, exhaust rate, cubic feet per minute |
| `installation_type` | tub type, mounting type, installation, install type, freestanding, alcove, drop-in, undermount, installation type, built-in, built in, portable, countertop, drawer, how installed, installation method, mounting style, type of installation, install method |
| `drain_placement` | drain location, drain position, drain side, outlet position, waste location, reversible drain, center drain, left drain, right drain |
| `material` | construction, made of, constructed of, body material, tub material, basin material, shell material |
| `finish` | surface finish, exterior finish, coating, surface, polish, texture |
| `color` | finish color, color finish, hue, shade, tone |
| `color_family` | color group, color category, color type |
| `ada` | ada compliant, ada approved, accessible, handicap accessible, wheelchair accessible, ada, accessibility, ada height, ada certified, ada compliance, americans with disabilities, disability compliant, accessibility compliant |
| `fuel_type` | power source, energy source, gas, electric, dual fuel |
| `configuration` | style, type, format, freestanding, slide-in, drop-in |
| `smart_home` | wifi, smart, connected, app control, voice control, alexa, google home, home connect, smart features, wifi enabled, smart home, app compatibility, connected appliances |
| `energy_star` | energy star certified, energy efficient, energy rating, energy star, energystar |
| `style` | design style, aesthetic, look, modern, traditional, contemporary, transitional |
| `collection` | product line, series, family, product family, model line |

### Bathtub Fields

| Field Key | Aliases |
|-----------|---------|
| `tub_shape` | shape, bathtub shape, oval, rectangular, corner, round |
| `number_of_jets` | jets, jet count, whirlpool jets, air jets, massage jets, total jets, hydro jets |
| `number_of_bathers` | bather capacity, person capacity, seating, seats, how many bathers, occupancy |
| `overflow` | has overflow, overflow included, overflow drain, overflow feature |
| `drain_assembly_included` | drain included, includes drain, drain assembly, comes with drain |
| `soaking` | soaking tub, deep soak, soaker, soaking bath |
| `whirlpool` | whirlpool tub, jetted, hydromassage, hydrotherapy |
| `air_bath` | air jets, air massage, air tub, bubbler |
| `accepts_deck_mount` | deck mount compatible, faucet holes, rim mount, deck faucet, accepts deck mount faucet |

### Dishwasher Fields

| Field Key | Aliases |
|-----------|---------|
| `number_of_racks` | racks, rack count, total racks, loading racks, dish racks, number racks |
| `dishwasher_type` | type, dishwasher style, style, form factor, built in, portable, drawer, countertop, top controls, front controls |
| `adjustable_racks` | adjustable rack, rackmatic, flexible racks, movable racks, adjustable upper rack, rack adjustment, adjustable feet |
| `noise_level` | db rating, db, decibel, decibel level, decibel rating, decibel sound rating, noise level db, sound level, sound rating, operating noise, noise dba, dba rating, silence level, noise level dba re 1pw, quietness |
| `place_setting_capacity` | place settings, place setting capacity, number of place settings, settings, capacity place settings, dish capacity, load capacity, maximum number of place settings |
| `stainless_steel_interior` | tub material, interior material, tub, interior, inner tub, wash tub material, basin material, stainless steel tub, stainless interior, interior construction |
| `number_of_wash_cycles` | wash cycles, cycles, number of cycles, cycle count, wash programs, programs, number of programs, cleaning cycles, wash options, number of wash programs |
| `drying_system` | dry system, drying type, dry type, drying method, heated dry, air dry, condensation dry, puredry, autodry, dry technology, drying feature |
| `control_type` | control location, controls, control panel, control style, type of control, control panel location, button type, front control, top control, hidden control, touch control, location of control panel |
| `cutlery_tray` | third rack, 3rd rack, cutlery basket, utensil rack, flatware tray, silverware rack, third level rack, standard 3rd rack, cutlery drawer, number of racks, third rack included, has third rack, flexible third rack |
| `panel_ready` | custom panel, panel ready, accepts custom panel, integrated, fully integrated, panel front, overlay |
| `fingerprint_resistant` | smudge proof, fingerprint free, anti fingerprint, smudge resistant, fingerprint resistance, easy clean finish |
| `hard_food_disposer` | food disposer, built in food disposer, garbage disposer, food grinder, hard food grinder, disposer, built-in food disposer |
| `soil_sensor` | auto sensor, automatic sensor, dirt sensor, load sensor, precision wash, smart sensor, auto wash |

### Refrigerator Fields

| Field Key | Aliases |
|-----------|---------|
| `internal_ice_maker` | interior ice maker, inside ice maker, internal ice, built in ice, integrated ice maker |
| `glass_doors` | see-through doors, transparent doors, glass front, window doors, display doors |
| `total_capacity` | total cu ft, total cubic feet, overall capacity, combined capacity, total volume, capacity cu ft, total capacity cu ft |
| `refrigerator_capacity` | fridge capacity, fresh food capacity, refrigerator cu ft, fridge cu ft, refrigerator volume, fresh food compartment |
| `freezer_capacity` | freezer cu ft, freezer volume, frozen food capacity, freezer compartment, freezer size |
| `counter_depth` | counter-depth, counterdepth, built-in depth, flush mount, cabinet depth, standard depth, full depth |
| `ice_maker` | ice maker included, built-in ice maker, automatic ice maker, ice machine, makes ice, ice production |
| `number_of_doors` | door count, doors, door style, door configuration, french door, side by side, top freezer, bottom freezer |
| `dispenser_features` | water dispenser, ice dispenser, water and ice, dispenser type, through-the-door, external dispenser, in-door dispenser |
| `number_of_zones` | temperature zones, cooling zones, climate zones, multi-zone, dual zone |

### Range / Oven Fields

| Field Key | Aliases |
|-----------|---------|
| `continuous_grates` | continuous cast iron, seamless grates, connected grates, edge-to-edge grates, full-width grates |
| `griddle` | built-in griddle, integrated griddle, flat top, griddle burner, pancake griddle |
| `steam_cooking` | steam oven, steam cook, steam assist, steam bake, combi steam, steam function |
| `combination_oven` | combi oven, combo oven, microwave combo, convection combo, multi-function oven |
| `door_type` | oven door, door style, french door oven, side swing, drop down door, side opening |
| `oven_capacity` | oven cu ft, oven volume, oven size, cooking capacity, cavity size, interior volume, oven interior |
| `number_of_burners` | burners, burner count, cooking zones, elements |
| `double_oven` | dual oven, twin oven, two ovens, double cavity, dual cavity, upper and lower oven |
| `convection` | convection oven, true convection, fan assisted, convect |
| `self_cleaning` | cleaning type, pyrolytic, steam clean, self clean |
| `air_fry` | air fryer, air frying, air crisp, air fry mode, built-in air fryer, airfry |
| `sabbath_mode` | sabbath, shabbat mode, star-k certified, kosher mode, holiday mode |
| `meat_thermometer` | temperature probe, meat probe, food probe, cooking probe, internal thermometer, probe included |

### Cooktop Fields

| Field Key | Aliases |
|-----------|---------|
| `bridge_element` | bridge burner, bridge zone, flexible cooking zone, extended burner, dual element |
| `hot_surface_indicator` | hot surface light, residual heat indicator, hot indicator, surface hot warning, hot surface indicator lights |
| `ignition_type` | ignition, spark ignition, automatic ignition, electronic ignition, standing pilot, hot surface ignition |
| `induction` | induction cooking, induction cooktop, induction burners, magnetic induction, induction elements |
| `downdraft_ventilated` | downdraft, built-in ventilation, integrated ventilation, downdraft vent, pop-up ventilation |
| `power_burner` | high power burner, power boil, rapid burner, super burner, high output burner, power element |
| `lp_conversion` | propane conversion, lp kit, propane ready, lp gas, liquid propane, propane compatible |

### Washer Fields

| Field Key | Aliases |
|-----------|---------|
| `pedestal_included` | pedestal, riser, laundry pedestal, storage pedestal, washer pedestal, drawer pedestal |
| `sanitary_rinse` | sanitize cycle, sanitary cycle, allergen cycle, steam sanitize, antibacterial, hygiene cycle |
| `drive_type` | motor drive, direct drive, belt drive, motor type, inverter drive |
| `detergent_dispenser` | soap dispenser, auto dispenser, detergent drawer, dispenser type, auto dose |
| `washer_capacity` | wash capacity, drum capacity, load capacity, tub capacity, washer cu ft, laundry capacity |
| `top_loading` | top load, top loader, top-load, vertical load |
| `front_loading` | front load, front loader, front-load, horizontal axis |
| `washer_rpm` | spin speed, rpm, spin rpm, max spin speed, spin cycle speed, centrifuge speed |
| `stackable` | stackable unit, can be stacked, stack kit compatible, stackable washer, stacking capable |
| `agitator` | agitator type, has agitator, pole agitator, impeller, dual action agitator |
| `steam_technology` | steam wash, steam clean, steam cycle, steam feature, steam option, true steam |

### Dryer Fields

| Field Key | Aliases |
|-----------|---------|
| `number_of_dry_cycles` | dry cycles, drying programs, cycle count, dry options, drying cycles |
| `interior_light` | drum light, inside light, interior lighting, drum illumination |
| `dryer_capacity` | drying capacity, drum capacity, dryer cu ft, load capacity, tumble capacity |
| `vent_type` | venting, ventless, vented, vent required, exhaust type, heat pump, condenser |
| `sensor_dry` | moisture sensor, auto dry, sensor drying, smart dry, moisture sensing, auto sensor dry |
| `drum_material` | drum type, drum interior, stainless drum, porcelain drum, drum construction |
| `door_swing` | door direction, reversible door, door hinge, left swing, right swing, door opening |

### Range Hood Fields

| Field Key | Aliases |
|-----------|---------|
| `filter_type` | filter, baffle filter, mesh filter, charcoal filter, aluminum filter, grease filter |
| `light_included` | has light, lighting, includes light, built-in light, hood lighting |
| `includes_remote` | remote control, remote included, wireless remote, has remote, remote operated |
| `duct_size` | duct diameter, duct connection, exhaust size, vent size, duct opening |
| `sones` | sound level, noise rating, sone rating, sone level, noise sones, sound rating |
| `cfm_high` | max cfm, high speed cfm, maximum airflow, peak cfm, boost cfm |
| `fan_speeds` | speed settings, blower speeds, number of speeds, speed levels, fan settings |
| `ductless` | recirculating, non-ducted, filterless, no duct required, ductless option |
| `convertible_to_ductless` | convertible, duct or ductless, dual mode, can be ductless, recirculation kit |

### Microwave Fields

| Field Key | Aliases |
|-----------|---------|
| `turntable_diameter` | turntable size, plate diameter, tray size, carousel size |
| `auto_shut_off` | automatic shutoff, auto off, safety shutoff, auto power off |
| `automatic_defrost` | auto defrost, defrost function, quick defrost, smart defrost |
| `microwave_capacity` | microwave cu ft, cavity size, interior capacity, microwave size, cooking capacity |
| `sensor_cooking` | auto cook, sensor cook, automatic cooking, smart cook, sensor reheat |
| `turntable` | rotating plate, carousel, turntable included, glass tray, rotating tray |

### Faucet Fields

| Field Key | Aliases |
|-----------|---------|
| `faucet_type` | faucet style, type of faucet, faucet category, fixture type |
| `voice_activated` | voice control, alexa compatible, google assistant, smart faucet, voice command |
| `spray_settings` | spray modes, spray options, spray patterns, stream settings, spray types |
| `faucet_holes` | hole configuration, mounting holes, number of holes, hole spacing, hole count |
| `soap_dispenser_included` | soap dispenser, includes dispenser, dispenser included, has soap dispenser |
| `pre_rinse` | pre-rinse, commercial style, restaurant style, spring spout, coil faucet |
| `spout_style` | spout type, spout design, gooseneck, high arc, low arc, pull down, pull out |
| `handle_style` | handle type, handle design, lever handle, cross handle, knob handle |
| `vessel_faucet` | vessel sink faucet, tall faucet, above counter faucet, raised faucet |
| `valve_type` | cartridge type, valve cartridge, ceramic disc, ball valve, compression valve |
| `faucet_mounting_type` | mount type, mounting style, deck mount, wall mount, centerset, widespread, single hole |
| `number_of_handles` | handle count, handles, single handle, double handle, two handle, one handle |
| `spout_height` | faucet height, spout reach height, arc height, overall height |
| `spout_reach` | reach, projection, spout projection, faucet reach |
| `touchless_faucet` | touchless, motion sensor, hands free, no touch, sensor activated, motion activated |
| `flow_rate_gpm` | gpm, gallons per minute, flow rate, water flow, max flow |
| `watersense_certified` | watersense, water efficient, water saving, epa watersense, low flow |
| `magnetic_docking` | magnet dock, magnetic spray head, docking system, secure dock, reflex |

### Toilet Fields

| Field Key | Aliases |
|-----------|---------|
| `bidet_seat_included` | bidet function, integrated bidet, bidet toilet, washlet, bidet seat |
| `flush_technology` | flush system, flushing technology, power flush, tornado flush, aquapiston |
| `night_light` | toilet light, bowl light, led night light, illuminated |
| `mounting_type` | floor mount, wall mount, wall hung, floor standing |
| `soft_close_hinges` | soft close, slow close, quiet close, gentle close |
| `bowl_shape` | bowl type, toilet bowl, elongated, round, compact elongated |
| `flush_type` | flush mechanism, flushing system, gravity flush, pressure assist, dual flush, single flush |
| `gallons_per_flush` | gpf, flush volume, water per flush, flush rate, water usage |
| `bowl_height` | seat height, rim height, toilet height, comfort height, chair height, standard height |
| `rough_in` | rough-in, drain offset, outlet offset, waste outlet, 10/12/14 inch rough |
| `seat_included` | includes seat, seat and lid, comes with seat, seat provided |
| `trapway` | trap, trapway size, fully glazed trapway, concealed trapway, skirted trapway |

### Lighting Fields

| Field Key | Aliases |
|-----------|---------|
| `chandelier_type` | chandelier style, fixture type, light style, design type |
| `maximum_adjustable_height` | max height, adjustable height, hanging height, drop length, overall height range |
| `bulb_included` | bulbs included, includes bulbs, lamps included, comes with bulbs |
| `chain_length` | chain, hanging chain, chain included, suspension length |
| `number_of_tiers` | tiers, tier count, levels, multi-tier, single tier |
| `number_of_lights` | light count, bulb count, number of bulbs, lamp count, how many lights |
| `bulb_type` | lamp type, light source, bulb style, incandescent, led bulb, halogen, cfl |
| `dimmable` | dimmer compatible, can dim, dimming, dimmable fixture, works with dimmer |
| `location_rating` | wet rated, damp rated, dry rated, outdoor rated, ul listing, indoor outdoor |
| `sloped_ceiling_compatible` | sloped ceiling, vaulted ceiling, angled ceiling, cathedral ceiling |
| `shade_material` | shade, shade type, glass shade, fabric shade, metal shade |
| `crystal_type` | crystal, crystal material, crystal style, swarovski, k9 crystal |

### Ceiling Fan Fields

| Field Key | Aliases |
|-----------|---------|
| `reversible_motor` | reversible, reverse function, winter mode, summer winter, direction change |
| `fan_blade_material` | blade material, blade construction, wood blades, plastic blades, metal blades |
| `downrod_included` | downrod, mounting rod, extension rod, rod included, downrod length |
| `light_kit_compatible` | accepts light kit, light adaptable, can add light, light kit ready |
| `blade_span` | fan size, blade size, sweep, diameter, blade diameter, fan diameter, blade sweep |
| `number_of_blades` | blade count, blades, how many blades, fan blades |
| `light_kit_included` | has light, light included, includes light kit, with light, integrated light |
| `motor_type` | motor, dc motor, ac motor, reversible motor, motor style |
| `low_ceiling_adaptable` | hugger, flush mount fan, low profile, close to ceiling, low ceiling |

### Sink Fields

| Field Key | Aliases |
|-----------|---------|
| `sink_type` | sink style, basin type, sink configuration, mount type |
| `sink_material` | basin material, sink construction, stainless steel, cast iron, fireclay, composite, porcelain |
| `sound_dampening` | sound absorbing, noise reduction, quiet sink, sound deadening, soundproofing |
| `number_of_basins` | basins, bowls, single bowl, double bowl, basin count, compartments |
| `sink_depth` | bowl depth, basin depth, sink bowl depth, depth |
| `undermount` | undermount sink, under mount, below counter, undermounted |
| `drop_in` | drop-in, top mount, self-rimming, above counter |
| `farmhouse` | farmhouse sink, apron front, apron sink, farm sink, apron-front |

### Electrical Fields

| Field Key | Aliases |
|-----------|---------|
| `voltage` | volts, electrical, power requirements, v, vac, voltage v |
| `amperage` | amps, amp rating, current, ampere, fuse protection |
| `wattage` | watts, power consumption, w, watt, connection rating |

### Dimension & Size Fields

| Field Key | Aliases |
|-----------|---------|
| `overall_dimensions` | dimensions, size, product dimensions, total dimensions |
| `cutout_dimensions` | cut out size, installation cutout, rough opening, cutout size |

---

## 7. ATTRIBUTE_ALIASES — Normalization Map

**File**: [picklist-matcher.service.ts:130-260](src/services/picklist-matcher.service.ts#L130-L260)

These normalize attribute names to canonical forms for picklist matching. Unlike FIELD_ALIASES (which search for values), these rename the attribute key itself.

| Raw Attribute Name | Normalizes To |
|-------------------|--------------|
| drain position, drain location | `drain placement` |
| overall width, nominal width, width/diameter, width / diameter | `width` |
| overall depth, nominal depth | `depth` |
| nominal length | `length` |
| overall height, fixture height, height (fixture), total height, hanging height | `height` |
| installation type, mounting type, mount style | `mount type` |
| number of basins, basin count | `number of bowls` |
| sink material, faucet material, construction material, body material, frame material | `material` |
| minimum cabinet size, cabinet width | `cabinet size` |
| light count, lights, bulb count, number of bulbs | `number of lights` |
| lamp type, light type, bulb base, base type | `bulb type` |
| color temperature | `adjustable color temperature` |
| max wattage, wattage, total wattage | `maximum wattage` |
| chain length, cord length, cable length, wire length | `cord/chain length` |
| adjustable, height adjustable, adjustable hanging | `adjustable height` |
| sloped ceiling, angled ceiling, vaulted ceiling | `sloped ceiling compatible` |
| bulbs included, lamp included | `bulb(s) included` |
| dry rated, damp rated, wet rated, location rating | `dry/damp rated` |
| certification | `certifications` |
| color, finish color, finish/color | `finish` |
| shade, glass type, diffuser material, shade type, globe material | `shade material` |
| crystal style, crystal cut | `crystal type` |
| canopy diameter, canopy dimensions, ceiling plate | `canopy size` |
| warranty, warranty period | `manufacturer warranty` |

---

## 8. Known-Value Extraction Lists

**Function**: `extractKnownValueFromTexts()` — [dual-ai-verification.service.ts:8686-8698](src/services/dual-ai-verification.service.ts#L8686-L8698)

Algorithm: **Longest-match-first** — sorts values by length descending, so "Black Stainless Steel" matches before "Black".

### Finish Values
`Black Stainless`, `Stainless Steel`, `Oil Rubbed Bronze`, `Venetian Bronze`, `Champagne Bronze`, `Brushed Nickel`, `Polished Nickel`, `Satin Nickel`, `Brushed Gold`, `Polished Brass`, `Matte Black`, `Matte White`, `Panel Ready`, `Chrome`, `Slate`, `Bisque`, `Copper`, `Pewter`, `Silver`, `Bronze`, `Gold`, `Graphite`, `Platinum`, `Black`, `White`

### Material Values
`Stainless Steel`, `Cast Iron`, `Fireclay`, `Vitreous China`, `Porcelain`, `Ceramic`, `Composite`, `Granite Composite`, `Acrylic`, `Solid Surface`, `Natural Stone`, `Marble`, `Quartz`, `Copper`, `Brass`, `Glass`, `Wood`, `Bamboo`, `Zinc`, `Aluminum`, `Iron`, `Steel`, `Plastic`, `Resin`, `Crystal`

### Shape Values
`Rectangular`, `Oval`, `Round`, `Square`, `D-Shape`, `D-Shaped`, `Octagonal`, `Hexagonal`, `Arch`, `Arched`

### Configuration Values
`French Door`, `Side-by-Side`, `Side by Side`, `Top Freezer`, `Bottom Freezer`, `Single Door`, `Double Door`, `Triple Door`, `Quad Door`, `Single Oven`, `Double Oven`, `Combination`, `Convertible`

### Fuel Type Values
`Dual Fuel`, `Natural Gas`, `Liquid Propane`, `LP Gas`, `Gas`, `Electric`, `Induction`, `Propane`

### Bowl Shape Values
`Elongated`, `Round-Front`, `Round Front`, `Round`

### Flush Type Values
`Dual Flush`, `Dual-Flush`, `Single Flush`, `Pressure-Assisted`, `Pressure Assisted`, `Gravity`

### Toilet Seat Type Values
`Soft Close`, `Soft-Close`, `Slow Close`, `Slow-Close`, `SoftClose`, `Heated`, `Bidet`, `Quick Release`

### Color/Finish Material Patterns (from `extractColorFinish`)
| Pattern | Extracted Color | Extracted Finish |
|---------|----------------|-----------------|
| `black stainless steel` | Black Stainless Steel | Stainless Steel |
| `stainless steel` | Stainless Steel | Stainless Steel |
| `brushed stainless` | Stainless Steel | Brushed Stainless |
| `fingerprint resistant stainless` | Stainless Steel | Fingerprint Resistant |
| `white glass` / `black glass` | White Glass / Black Glass | White Glass / Black Glass |
| `frosted glass` / `smoked glass` / `clear glass` | Frosted/Smoked/Clear Glass | Same |
| `matte white` / `matte black` | Matte White / Matte Black | Same |
| `panel ready` / `custom panel` | Panel Ready | Panel Ready |
| `white` / `black` / `bisque` / `slate` | Direct | Direct |

---

## 9. Value Extraction Patterns (Regex)

**File**: [smart-field-inference.service.ts:910-960](src/services/smart-field-inference.service.ts#L910-L960)

| Value Type | Regex Pattern | Extracts |
|-----------|--------------|---------|
| Gallons | `(\d+(?:\.\d+)?)\s*(?:gallons?|gal\.?)` | 38 from "38-gallon capacity" |
| Weight (lbs) | `(\d+(?:\.\d+)?)\s*(?:lbs?\.?|pounds?)` | 146 from "Weight: 146 lb" |
| Inches | `(\d+(?:\.\d+)?)\s*(?:"|in\.?|inch(?:es)?)` | 60 from "60\" bathtub" |
| BTU | `(\d{1,3}(?:,\d{3})*)\s*(?:btu|btus)` | 12000 from "12,000 BTU" |
| CFM | `(\d+(?:\.\d+)?)\s*(?:cfm)` | 400 from "400 CFM" |
| GPM | `(\d+(?:\.\d+)?)\s*(?:gpm)` | 1.8 from "1.8 GPM" |
| Cubic Feet | `(\d+(?:\.\d+)?)\s*(?:cu\.?\s*ft\.?)` | 27.8 from "27.8 cu. ft." |
| Count | `(\d+)\s*(?:jets?|burners?)` | 6 from "6 jets" |
| Voltage | `(\d+)\s*(?:v|volts?)` | 240 from "240V" |
| Capacity (cu ft) | `(\d+(?:\.\d+)?)\s*(?:cu\.?\s*ft\.?|cubic\s*feet?)` | 5.0 from "5.0 cu. ft." |

---

## 10. Ambiguity Points & Known Issues

| Issue | Effect | Current Handling | Risk |
|-------|--------|------------------|------|
| **Color vs Finish overlap** | Same value from both fields | Different extraction logic; can duplicate | ⚠️ Low |
| **Web Retailer brand mismatch** | WR fields may be for a different product | Heuristic: <3 consecutive char overlap = different product, marks WR unreliable | ⚠️ Medium |
| **FIELD_ALIASES are hardcoded** | If Salesforce/Ferguson renames fields, aliases break silently | Manual sync required — no automated validation | 🔴 High |
| **Ferguson_Raw_Data partial extraction** | Phase 0.1A extracts attributes + feature_groups but NOT all nested fields | Some nested data still inaccessible | ⚠️ Medium |
| **Legacy data invisible in output** | `Brand_Legacy`/`Category_Legacy` used for tie-breaking but never exported | Can cause confusion in logs | ⚠️ Low |
| **UPC placeholder** | When UPC not found, uses "741360976603" | Signals "lookup required" to Salesforce | ⚠️ Low |
| **Dimension source for sinks** | Multiple sources (AI, title regex, spec field, product name) can disagree | Special logic: Ferguson nominal > name regex > AI | ⚠️ Medium |

---

## 11. How to Add a New Field

When a new raw field needs to be mapped to a new output field:

1. **Add alias entries** in [smart-field-inference.service.ts](src/services/smart-field-inference.service.ts) → `FIELD_ALIASES`
   - Key = canonical Salesforce field name (snake_case)
   - Value = array of all known aliases Ferguson/Web Retailer might use

2. **Add attribute alias** (if needed) in [picklist-matcher.service.ts](src/services/picklist-matcher.service.ts) → `ATTRIBUTE_ALIASES`
   - Maps variant names to a single canonical name for picklist matching

3. **Add to AI prompt** in [ai-prompt-builder.service.ts](src/services/ai-prompt-builder.service.ts)
   - Add labeled field line so AI can verify the value

4. **Add to sanitizedPrimaryAttributes** in [dual-ai-verification.service.ts](src/services/dual-ai-verification.service.ts) (~line 9300+)
   - Define the priority chain: AI consensus → fallbacks → extraction

5. **Add extraction function** (if values come from a known set):
   - Create `extractXxxFromTexts()` using `extractKnownValueFromTexts()` base function
   - Add known-value list

6. **Add to title schema** (if field appears in product titles):
   - Update [title-schema-by-category.ts](src/config/title-schema-by-category.ts) with the new slot

7. **Update this document** with the new field mapping entry.

8. **Run validation**:
   ```bash
   # Full pre-deploy (includes field mapping sync as Check #8)
   bash scripts/pre-deploy-validate-all.sh
   
   # Or just the field mapping reference check
   node scripts/audit-field-mapping-reference.js --check
   ```

---

## 12. Automated Sync Enforcement

This document is **automatically validated** by `scripts/audit-field-mapping-reference.js`, which runs as Check #8 in the pre-deployment pipeline (`scripts/pre-deploy-validate-all.sh`).

**What it checks (5 scans):**

| Check | Source File | What It Scans |
|-------|-----------|---------------|
| FIELD_ALIASES keys | `smart-field-inference.service.ts` | Every alias key must appear in this doc |
| ATTRIBUTE_ALIASES keys | `picklist-matcher.service.ts` | Every normalization entry must appear |
| Extractor functions | `dual-ai-verification.service.ts` | Every `extract*FromTexts()` must appear |
| AI prompt fields | `ai-prompt-builder.service.ts` | Every `rawProduct.*` field must appear |
| Output fields | `dual-ai-verification.service.ts` | Every `AI_*` output field must appear |

**When it runs:**
- Every "Save Everything" procedure (pre-deploy validation)
- Can be run standalone: `node scripts/audit-field-mapping-reference.js`
- With `--check` flag: exits with code 1 if out of sync (for CI/CD)

**If it fails**: Add the missing entries to this document, then re-run.
