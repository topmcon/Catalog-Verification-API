# Dual AI Verification System - Workflow & Attribute Mapping

## 📊 Process Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    RAW SALESFORCE DATA COMES IN                          │
│                    (Brand, Model, Specs from Web Retailer + Ferguson)    │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
            ┌──────────────┐               ┌──────────────┐
            │   OPENAI     │               │     xAI      │
            │ gpt-4-turbo  │               │  grok-beta   │
            └──────────────┘               └──────────────┘
                    │                               │
                    │  Each AI independently:       │
                    │  1. Determines category       │
                    │  2. Fills 20 Primary fields   │
                    │  3. Fills 15 Filter fields    │
                    │  4. Extracts Additional       │
                    │  5. Researches missing data   │
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │      COMPARE RESULTS          │
                    │                               │
                    │  AGREE? ──► Verified ✓        │
                    │  DISAGREE? ──► Re-analyze     │
                    │  MISSING? ──► Research        │
                    └───────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │     FINAL VERIFIED OUTPUT     │
                    │                               │
                    │  • Primary Attributes (20)    │
                    │  • Top 15 Filter Attributes   │
                    │  • Additional (HTML Table)    │
                    └───────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │     RETURN TO SALESFORCE      │
                    └───────────────────────────────┘
```

---

## 📋 WHAT AI FILLS IN

### Three Output Sections:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. PRIMARY ATTRIBUTES (20 fields) - Same for ALL products     │
│  2. TOP 15 FILTER ATTRIBUTES - Different per category          │
│  3. ADDITIONAL ATTRIBUTES - Everything else → HTML table       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔵 PRIMARY ATTRIBUTES (20 fields - ALL products)

These are filled for **every single product** regardless of category:

| # | Field Name | What AI Fills | Example |
|---|------------|---------------|---------|
| 1 | Brand (Verified) | Manufacturer name | "Café", "GE", "Sub-Zero" |
| 2 | Category / Subcategory (Verified) | Category path | "Range / Slide-In Gas Range" |
| 3 | Product Family (Verified) | Product grouping | "Cooking Appliances" |
| 4 | Product Style (Verified) | Style type | "Slide-In", "French Door" |
| 5 | Depth / Length (Verified) | Decimal inches | "29.875" |
| 6 | Width (Verified) | Decimal inches | "30" |
| 7 | Height (Verified) | Decimal inches | "36.25" |
| 8 | Weight (Verified) | Weight | "256 lbs" |
| 9 | MSRP (Verified) | Price | "3299.00" |
| 10 | Market Value | Ferguson price | "3149.00" |
| 11 | Description | Clean description | Product description text |
| 12 | Product Title (Verified) | Standardized title | "Café 30" Slide-In Gas Range" |
| 13 | Details | Key highlights | "Convection, WiFi, Self-Clean" |
| 14 | Features List | HTML list | `<ul><li>...</li></ul>` |
| 15 | UPC / GTIN (Verified) | Barcode | "084691848523" |
| 16 | Model Number (Verified) | Model | "CGS700P4MW2" |
| 17 | Model Number Alias | Symbols removed | "CGS700P4MW2" |
| 18 | Model Parent | Base model | "CGS700P" |
| 19 | Model Variant Number | Variant suffix | "4MW2" |
| 20 | Total Model Variants | All variants | "CGS700P2M1, CGS700P3M1, CGS700P4MW2" |

---

## 🟢 TOP 15 FILTER ATTRIBUTES (Category-specific)

AI determines the category first, then fills the **15 filter fields for that category**.

### 🔥 RANGE (Gas/Electric/Dual Fuel)

| # | Attribute | Type | Values/Unit | Description |
|---|-----------|------|-------------|-------------|
| 1 | Fuel Type | enum | Gas, Electric, Dual Fuel, Induction | Primary fuel source |
| 2 | Configuration | enum | Freestanding, Slide-In, Drop-In | Installation type |
| 3 | Range Width | number | inches | Range width |
| 4 | Number of Burners | number | - | Total burner count |
| 5 | Oven Capacity | number | cu. ft. | Oven interior capacity |
| 6 | Convection | boolean | - | Has convection cooking |
| 7 | Self-Cleaning | enum | Steam, Self-Clean, Manual, Both | Cleaning method |
| 8 | Max Burner BTU | number | BTU | Highest burner output |
| 9 | Griddle Included | boolean | - | Includes griddle |
| 10 | Double Oven | boolean | - | Has two oven cavities |
| 11 | Warming Drawer | boolean | - | Includes warming drawer |
| 12 | Air Fry | boolean | - | Has air fry capability |
| 13 | Smart/WiFi Connected | boolean | - | WiFi connectivity |
| 14 | Continuous Grates | boolean | - | Cast iron grates |
| 15 | Color/Finish | string | - | Exterior color/finish |

---

### ❄️ REFRIGERATOR

| # | Attribute | Type | Values/Unit | Description |
|---|-----------|------|-------------|-------------|
| 1 | Door Configuration | enum | French Door, Side-by-Side, Top/Bottom Freezer, Column | Door style |
| 2 | Total Capacity | number | cu. ft. | Total interior capacity |
| 3 | Refrigerator Width | number | inches | Unit width |
| 4 | Counter Depth | boolean | - | Is counter depth |
| 5 | Ice Maker | enum | None, Standard, Craft Ice, Dual | Ice maker type |
| 6 | Water Dispenser | boolean | - | Has water dispenser |
| 7 | Freezer Capacity | number | cu. ft. | Freezer capacity |
| 8 | Refrigerator Capacity | number | cu. ft. | Fresh food capacity |
| 9 | Smart/WiFi Connected | boolean | - | WiFi connectivity |
| 10 | Fingerprint Resistant | boolean | - | Fingerprint resistant |
| 11 | Door-in-Door | boolean | - | Door-in-door feature |
| 12 | Dual Cooling System | boolean | - | Separate cooling systems |
| 13 | Interior Water Dispenser | boolean | - | Internal dispenser |
| 14 | ENERGY STAR | boolean | - | ENERGY STAR certified |
| 15 | Color/Finish | string | - | Exterior color/finish |

---

### 🍽️ DISHWASHER

| # | Attribute | Type | Values/Unit | Description |
|---|-----------|------|-------------|-------------|
| 1 | Installation Type | enum | Built-In, Portable, Drawer, Countertop | Installation style |
| 2 | Tub Material | enum | Stainless Steel, Plastic, Hybrid | Interior material |
| 3 | Noise Level (dB) | number | dB | Operating noise |
| 4 | Place Settings | number | - | Capacity |
| 5 | Third Rack | boolean | - | Has third rack |
| 6 | Number of Wash Cycles | number | - | Cycle options |
| 7 | Drying System | enum | Heated, Fan, Condensation, AutoAir | Drying method |
| 8 | Soil Sensor | boolean | - | Auto soil sensing |
| 9 | Hard Food Disposer | boolean | - | Built-in disposer |
| 10 | Adjustable Racks | boolean | - | Adjustable positions |
| 11 | Bottle Jets | boolean | - | Bottle washing |
| 12 | Steam PreWash | boolean | - | Steam cleaning |
| 13 | Smart/WiFi Connected | boolean | - | WiFi connectivity |
| 14 | ENERGY STAR | boolean | - | ENERGY STAR certified |
| 15 | Color/Finish | string | - | Exterior color/finish |

---

### 🔲 WALL OVEN

| # | Attribute | Type | Values/Unit | Description |
|---|-----------|------|-------------|-------------|
| 1 | Oven Type | enum | Single, Double, Combination, Microwave Combo | Configuration |
| 2 | Fuel Type | enum | Electric, Gas | Power source |
| 3 | Oven Width | number | inches | Wall cutout width |
| 4 | Total Capacity | number | cu. ft. | Combined capacity |
| 5 | Convection Type | enum | None, Single Fan, True/European, Dual Fan | Convection type |
| 6 | Self-Cleaning | enum | Steam, Self-Clean, Manual, Both | Cleaning method |
| 7 | Air Fry | boolean | - | Air fry mode |
| 8 | Steam Cooking | boolean | - | Steam cooking |
| 9 | Smart/WiFi Connected | boolean | - | WiFi connectivity |
| 10 | Temperature Probe | boolean | - | Includes meat probe |
| 11 | Sabbath Mode | boolean | - | Sabbath mode |
| 12 | Door Style | enum | Drop Down, Side Swing, French Door | Door opening |
| 13 | Gliding Rack | boolean | - | Smooth glide rack |
| 14 | Warming Drawer | boolean | - | Warming drawer |
| 15 | Color/Finish | string | - | Exterior color/finish |

---

### 🔥 COOKTOP

| # | Attribute | Type | Values/Unit | Description |
|---|-----------|------|-------------|-------------|
| 1 | Fuel Type | enum | Gas, Electric, Induction | Cooking fuel |
| 2 | Cooktop Width | number | inches | Width |
| 3 | Number of Burners/Elements | number | - | Cooking zones |
| 4 | Max Output (BTU/Watts) | number | - | Highest output |
| 5 | Installation Type | enum | Drop-In, Rangetop | Installation |
| 6 | Continuous Grates | boolean | - | Cast iron grates |
| 7 | Griddle | boolean | - | Integrated griddle |
| 8 | Downdraft Ventilation | boolean | - | Built-in downdraft |
| 9 | Bridge Element | boolean | - | Bridge zone |
| 10 | Hot Surface Indicator | boolean | - | Indicator lights |
| 11 | Simmer Burner | boolean | - | Dedicated simmer |
| 12 | Wok Ring/Grate | boolean | - | Wok support |
| 13 | Control Type | enum | Knobs, Touch, Combination | Control interface |
| 14 | Auto Re-ignition | boolean | - | Auto relight |
| 15 | Color/Finish | string | - | Surface color/finish |

---

### 📡 MICROWAVE

| # | Attribute | Type | Values/Unit | Description |
|---|-----------|------|-------------|-------------|
| 1 | Installation Type | enum | Over-the-Range, Countertop, Built-In, Drawer | Installation |
| 2 | Capacity | number | cu. ft. | Interior capacity |
| 3 | Wattage | number | watts | Cooking power |
| 4 | Microwave Width | number | inches | Unit width |
| 5 | Ventilation CFM | number | CFM | Exhaust fan (OTR) |
| 6 | Convection | boolean | - | Convection cooking |
| 7 | Sensor Cooking | boolean | - | Sensor modes |
| 8 | Turntable | boolean | - | Rotating turntable |
| 9 | Smart/WiFi Connected | boolean | - | WiFi connectivity |
| 10 | Steam Cooking | boolean | - | Steam function |
| 11 | Air Fry | boolean | - | Air fry mode |
| 12 | Charcoal Filter | boolean | - | Odor filter |
| 13 | Auto Defrost | boolean | - | Auto defrost |
| 14 | Preset Cook Options | number | - | Preset programs |
| 15 | Color/Finish | string | - | Exterior color/finish |

---

### 🌀 RANGE HOOD

| # | Attribute | Type | Values/Unit | Description |
|---|-----------|------|-------------|-------------|
| 1 | Hood Type | enum | Under Cabinet, Wall Mount, Island, Downdraft, Insert | Installation |
| 2 | Hood Width | number | inches | Hood width |
| 3 | CFM | number | CFM | Air movement |
| 4 | Noise Level (sones) | number | sones | Operating noise |
| 5 | Venting Type | enum | Ducted, Ductless, Convertible | Ventilation |
| 6 | Fan Speeds | number | - | Speed settings |
| 7 | Lighting Type | enum | LED, Halogen, Incandescent, None | Light type |
| 8 | Heat Sensor | boolean | - | Auto heat adjust |
| 9 | Delay Off | boolean | - | Auto-off timer |
| 10 | Filter Type | enum | Baffle, Mesh, Charcoal, Combination | Filter style |
| 11 | Dishwasher Safe Filters | boolean | - | Washable filters |
| 12 | Remote Control | boolean | - | Includes remote |
| 13 | Touch Controls | boolean | - | Touch panel |
| 14 | Perimeter Suction | boolean | - | Perimeter extraction |
| 15 | Color/Finish | string | - | Exterior color/finish |

---

### 👕 WASHER

| # | Attribute | Type | Values/Unit | Description |
|---|-----------|------|-------------|-------------|
| 1 | Load Type | enum | Front Load, Top Load | Loading style |
| 2 | Capacity | number | cu. ft. | Drum capacity |
| 3 | Washer Width | number | inches | Unit width |
| 4 | Steam | boolean | - | Steam cleaning |
| 5 | ENERGY STAR | boolean | - | ENERGY STAR |
| 6 | Max Spin Speed (RPM) | number | RPM | Spin speed |
| 7 | Agitator | boolean | - | Center agitator |
| 8 | Smart/WiFi Connected | boolean | - | WiFi connectivity |
| 9 | Number of Cycles | number | - | Wash cycles |
| 10 | Vibration Reduction | boolean | - | Anti-vibration |
| 11 | Sanitize Cycle | boolean | - | Sanitize option |
| 12 | Allergen Cycle | boolean | - | Allergen removal |
| 13 | Auto Detergent Dispenser | boolean | - | Auto dosing |
| 14 | Stackable | boolean | - | Can stack |
| 15 | Color/Finish | string | - | Exterior color/finish |

---

### 👔 DRYER

| # | Attribute | Type | Values/Unit | Description |
|---|-----------|------|-------------|-------------|
| 1 | Fuel Type | enum | Electric, Gas, Heat Pump | Power source |
| 2 | Capacity | number | cu. ft. | Drum capacity |
| 3 | Venting Type | enum | Vented, Ventless | Vent requirement |
| 4 | Dryer Width | number | inches | Unit width |
| 5 | Steam | boolean | - | Steam refresh |
| 6 | Sensor Dry | boolean | - | Moisture sensor |
| 7 | Smart/WiFi Connected | boolean | - | WiFi connectivity |
| 8 | ENERGY STAR | boolean | - | ENERGY STAR |
| 9 | Number of Cycles | number | - | Dry cycles |
| 10 | Sanitize Cycle | boolean | - | Sanitize option |
| 11 | Reversible Door | boolean | - | Door swing change |
| 12 | Drum Light | boolean | - | Interior light |
| 13 | Lint Filter Indicator | boolean | - | Filter alert |
| 14 | Wrinkle Prevent | boolean | - | Anti-wrinkle tumble |
| 15 | Color/Finish | string | - | Exterior color/finish |

---

### 🧊 FREEZER

| # | Attribute | Type | Values/Unit | Description |
|---|-----------|------|-------------|-------------|
| 1 | Freezer Type | enum | Upright, Chest, Drawer, Column | Style |
| 2 | Capacity | number | cu. ft. | Total capacity |
| 3 | Freezer Width | number | inches | Unit width |
| 4 | Defrost Type | enum | Frost-Free, Manual | Defrost method |
| 5 | Garage Ready | boolean | - | Extreme temp capable |
| 6 | Temperature Alarm | boolean | - | High temp alert |
| 7 | Door Alarm | boolean | - | Door ajar alarm |
| 8 | LED Lighting | boolean | - | Interior lights |
| 9 | Power Indicator | boolean | - | Running indicator |
| 10 | Defrost Drain | boolean | - | Has drain |
| 11 | Lock | boolean | - | Keyed lock |
| 12 | Adjustable Shelves | number | - | Adjustable shelf count |
| 13 | Storage Baskets | number | - | Wire basket count |
| 14 | ENERGY STAR | boolean | - | ENERGY STAR |
| 15 | Color/Finish | string | - | Exterior color/finish |

---

### 🍷 WINE COOLER

| # | Attribute | Type | Values/Unit | Description |
|---|-----------|------|-------------|-------------|
| 1 | Installation Type | enum | Built-In, Freestanding, Under Counter | Installation |
| 2 | Bottle Capacity | number | - | Bottle count |
| 3 | Temperature Zones | enum | Single, Dual, Triple | Cooling zones |
| 4 | Wine Cooler Width | number | inches | Unit width |
| 5 | Cooling Type | enum | Compressor, Thermoelectric | Technology |
| 6 | UV Protected Glass | boolean | - | UV protection |
| 7 | Digital Controls | boolean | - | Digital temp control |
| 8 | Interior LED Lighting | boolean | - | LED lights |
| 9 | Vibration Dampening | boolean | - | Anti-vibration |
| 10 | Security Lock | boolean | - | Keyed lock |
| 11 | Reversible Door | boolean | - | Door swing change |
| 12 | Shelf Material | enum | Wood, Wire, Chrome | Rack material |
| 13 | Temperature Range Min | number | °F | Min temp |
| 14 | Temperature Range Max | number | °F | Max temp |
| 15 | Color/Finish | string | - | Exterior color/finish |

---

### 🧊 ICE MAKER

| # | Attribute | Type | Values/Unit | Description |
|---|-----------|------|-------------|-------------|
| 1 | Installation Type | enum | Built-In, Freestanding, Portable, Outdoor | Installation |
| 2 | Ice Production (lbs/day) | number | lbs/day | Daily production |
| 3 | Ice Storage Capacity | number | lbs | Bin capacity |
| 4 | Ice Type | enum | Cube, Nugget, Crescent, Gourmet, Bullet | Ice shape |
| 5 | Ice Maker Width | number | inches | Unit width |
| 6 | Drain Required | boolean | - | Needs drain |
| 7 | Water Line Required | boolean | - | Needs water line |
| 8 | Clear Ice | boolean | - | Gourmet clear ice |
| 9 | Self-Cleaning | boolean | - | Auto cleaning |
| 10 | Filter Indicator | boolean | - | Filter alert |
| 11 | Pump Out Drain | boolean | - | Drain pump |
| 12 | LED Lighting | boolean | - | Interior light |
| 13 | Door Alarm | boolean | - | Door ajar alarm |
| 14 | ADA Compliant | boolean | - | ADA compliant |
| 15 | Color/Finish | string | - | Exterior color/finish |

---

## 🟡 ADDITIONAL ATTRIBUTES (Everything Else → HTML Table)

All remaining attributes not covered in Primary or Top 15 are compiled into an HTML specification table:

```html
<table class="sf-additional-attributes">
  <thead>
    <tr>
      <th class="sf-attr-header">Specification</th>
      <th class="sf-attr-header">Value</th>
    </tr>
  </thead>
  <tbody>
    <tr class="sf-attr-row">
      <td class="sf-attr-cell">Sabbath Mode</td>
      <td class="sf-attr-cell">Yes</td>
    </tr>
    <tr class="sf-attr-alt">
      <td class="sf-attr-cell">Door Lock</td>
      <td class="sf-attr-cell">Electronic</td>
    </tr>
    <!-- ... more attributes ... -->
  </tbody>
</table>
```

---

## 🗺️ Field Mapping: Salesforce → Verified Output

### Input → Output Mapping

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           FIELD MAPPING                                         │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  SALESFORCE INPUT                    →    VERIFIED OUTPUT                       │
│  ═══════════════════                      ══════════════════                    │
│                                                                                 │
│  Brand_Web_Retailer ─────────┐                                                  │
│                              ├──► Brand_Verified                               │
│  Ferguson_Brand ─────────────┘                                                  │
│                                                                                 │
│  Web_Retailer_Category ──────┐                                                  │
│  Web_Retailer_SubCategory ───┼──► Category_Verified + SubCategory_Verified     │
│  Ferguson_Base_Category ─────┤                                                  │
│  Ferguson_Product_Type ──────┘                                                  │
│                                                                                 │
│  Model_Number_Web_Retailer ──┬──► Model_Number_Verified                        │
│  Ferguson_Model_Number ──────┘    Model_Number_Alias (symbols removed)         │
│                                   Model_Parent (extracted)                      │
│                                   Model_Variant_Number (extracted)              │
│                                                                                 │
│  MSRP_Web_Retailer ──────────────► MSRP_Verified                               │
│                                                                                 │
│  Ferguson_Price ─────────────┬──► Market_Value                                 │
│  Ferguson_Min_Price ─────────┼──► Market_Value_Min                             │
│  Ferguson_Max_Price ─────────┴──► Market_Value_Max                             │
│                                                                                 │
│  Width_Web_Retailer ─────────┐                                                  │
│                              ├──► Width_Verified (decimal inches)              │
│  Ferguson_Width ─────────────┘                                                  │
│                                                                                 │
│  Height_Web_Retailer ────────┐                                                  │
│                              ├──► Height_Verified (decimal inches)             │
│  Ferguson_Height ────────────┘                                                  │
│                                                                                 │
│  Depth_Web_Retailer ─────────┐                                                  │
│                              ├──► Depth_Verified (decimal inches)              │
│  Ferguson_Depth ─────────────┘                                                  │
│                                                                                 │
│  Product_Title_Web_Retailer ─┐                                                  │
│                              ├──► Product_Title_Verified (standardized)        │
│  Ferguson_Title ─────────────┘                                                  │
│                                                                                 │
│  Product_Description_Web ────┐                                                  │
│                              ├──► Description_Verified (cleaned)               │
│  Ferguson_Description ───────┘                                                  │
│                                                                                 │
│  Web_Retailer_Specs[] ───────┐                                                  │
│                              ├──► Top_Filter_Attributes {}                     │
│  Ferguson_Attributes[] ──────┤    Additional_Attributes_HTML                   │
│                              │                                                  │
│  (Deduplicated, cleaned,     │                                                  │
│   category-mapped)           │                                                  │
│                              │                                                  │
│  Features_Web_Retailer ──────┴──► Features_List_HTML                           │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
src/
├── config/
│   └── master-category-attributes.ts    # Category definitions & schemas
│
├── services/
│   ├── dual-ai-verification.service.ts  # Main orchestrator
│   ├── ai-prompt-builder.service.ts     # Prompt construction
│   ├── salesforce-verification.service.ts
│   └── response-builder.service.ts
│
├── types/
│   └── salesforce.types.ts              # TypeScript interfaces
│
├── controllers/
│   └── verification.controller.ts       # API endpoints
│
└── routes/
    └── verification.routes.ts           # Route definitions
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/verify/salesforce` | Verify single product |
| `POST` | `/api/verify/salesforce/batch` | Verify multiple products |

### Request Example

```json
POST /api/verify/salesforce
{
  "SF_Catalog_Id": "a]12345",
  "SF_Catalog_Name": "CGS700P4MW2",
  "Brand_Web_Retailer": "Cafe",
  "Model_Number_Web_Retailer": "CGS700P4MW2",
  "MSRP_Web_Retailer": "$3299.00",
  ...
}
```

### Response Example

```json
{
  "success": true,
  "data": {
    "SF_Catalog_Id": "a]12345",
    "Primary_Attributes": {
      "Brand_Verified": "Café",
      "Category_Verified": "Range",
      "Model_Number_Verified": "CGS700P4MW2",
      ...
    },
    "Top_Filter_Attributes": {
      "Fuel_Type": "Gas",
      "Configuration": "Slide-In",
      "Number_of_Burners": 6,
      ...
    },
    "Additional_Attributes_HTML": "<table>...</table>",
    "Price_Analysis": {
      "msrp_web_retailer": 3299,
      "market_value_ferguson": 3149,
      ...
    },
    "Verification": {
      "verification_score": 95,
      "verification_status": "verified",
      ...
    },
    "Status": "success"
  }
}
```

---

## ⚙️ Environment Variables Required

```bash
OPENAI_API_KEY=sk-...          # OpenAI API key
XAI_API_KEY=xai-...            # xAI (Grok) API key
```

---

*Last updated: January 9, 2026*
