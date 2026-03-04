# Website Filter Reference Guide
**Generated**: 2026-03-04  
**Purpose**: Reference for implementing category/type filters on website  
**Source**: Catalog Verification API v1.0

---

## Table of Contents

- [Appliances](#appliances)
- [Flooring](#flooring)
- [Hardware](#hardware)
- [Heating & Cooling](#heating-cooling)
- [Home Décor & Furniture](#home-d-cor-furniture)
- [Industrial & Commercial](#industrial-commercial)
- [Lighting & Electrical](#lighting-electrical)
- [Outdoor](#outdoor)
- [Plumbing & Bath](#plumbing-bath)

---

## Summary Statistics

- **Total Categories**: 161
- **Total Types**: 688
- **Total Styles**: 30
- **Total Brands**: 385
- **Total Attributes**: 945
- **Categories with Size Classes**: 32

---

## Global Filters (Apply to ALL Products)

These attributes are available across all categories:

| Filter | Field Name | Values | Notes |
|--------|------------|--------|-------|
| **Brand** | `AI_Brand` | 385 brands | See full list in appendix |
| **Department** | `department` | 9 departments | Appliances, Flooring, Hardware, Heating & Cooling, Home Décor & Furniture, Industrial & Commercial, Lighting & Electrical, Outdoor, Plumbing & Bath |
| **Family** | `AI_Product_Family` | Appliances, Bath, Kitchen, HVAC, Lighting, etc. | Product grouping |
| **Width** | `AI_Width` | Numeric (inches) | Exact measurement |
| **Height** | `AI_Height` | Numeric (inches) | Exact measurement |
| **Depth** | `AI_Depth` | Numeric (inches) | Exact measurement |
| **Color** | `AI_Color` | Text | Primary color |
| **Finish** | `AI_Finish` | Text | Surface finish |
| **Style** | `AI_Style` | 30 styles | See style list below |

### Style Values (Global - 30 total)

Styles apply to specific categories (see `styles_apply` field):

```
Art Deco, Bohemian, Built-In, Coastal, Colonial, Commercial-Style, Contemporary, Eclectic, European, Farmhouse, Geometric, Industrial, Luxury, Mediterranean, Mid-Century Modern, Minimalist, Modern, Moroccan, Rustic, Scandinavian, Shaker, Sleek, Southwestern, Spa-Like, Striped, Traditional, Transitional, Tropical, Victorian, Vintage...
```

<details>
<summary>View all 30 styles</summary>

- Art Deco (ID: a1IaZ000001TYybUAG)
- Bohemian (ID: a1IaZ000001V9EXUA0)
- Built-In (ID: NEEDS_NEW_ID)
- Coastal (ID: a1IaZ000001VAAbUAO)
- Colonial (ID: pending_salesforce_id)
- Commercial-Style (ID: pending_salesforce_id)
- Contemporary (ID: a1IaZ000001TVZJUA4)
- Eclectic (ID: pending_salesforce_id)
- European (ID: pending_salesforce_id)
- Farmhouse (ID: a1IaZ000001S93RUAS)
- Geometric (ID: a1IaZ000001VCQvUAO)
- Industrial (ID: a1IaZ000001Sjb7UAC)
- Luxury (ID: pending_salesforce_id)
- Mediterranean (ID: pending_salesforce_id)
- Mid-Century Modern (ID: pending_salesforce_id)
- Minimalist (ID: pending_salesforce_id)
- Modern (ID: a1IaZ000001TWAPUA4)
- Moroccan (ID: pending_salesforce_id)
- Rustic (ID: a1IaZ000001TVcXUAW)
- Scandinavian (ID: pending_salesforce_id)
- Shaker (ID: pending_salesforce_id)
- Sleek (ID: pending_salesforce_id)
- Southwestern (ID: a1IaZ000001VGMTUA4)
- Spa-Like (ID: pending_salesforce_id)
- Striped (ID: a1IaZ000001VGuLUAW)
- Traditional (ID: a1IaZ000001TLjdUAG)
- Transitional (ID: a1IaZ000001TVXhUAO)
- Tropical (ID: a1IaZ000001TekfUAC)
- Victorian (ID: a1IaZ000001TVuHUAW)
- Vintage (ID: a1IaZ000001TW2LUAW)

</details>

---

## Appliances

**17 categories**

### All in One Washer / Dryer

**Category ID**: `a01Hu000010Q5EqIAK`  
**Family**: Laundry  
**Subcategory**: Laundry  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 24, 27
- **Format**: "24-Inch"
- **Example**: 27-Inch
- **Rounding**: NEAREST
- **Notes**: 24" compact/ventless, 27" standard

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Configuration (Front Load) | Picklist | |
| 4 | Washer Capacity (Cu. Ft.) | Numeric | |
| 5 | Dryer Capacity (Cu. Ft.) | Numeric | |
| 6 | Ventless/Vented | Text | |
| 7 | Number of Wash Cycles | Text | |
| 8 | Number of Dry Cycles | Text | |
| 9 | Finish/Color | Text | |
| 10 | Steam Function | Text | |
| 11 | Smart Features | Text | |
| 12 | WiFi Enabled | Text | |
| 13 | Energy Star Certified | Text | |
| 14 | Stackable | Text | |
| 15 | Voltage (120V/240V) | Text | |

---

### Barbeque

**Category ID**: `a01Hu000011kgEqIAI`  
**Family**: Kitchen  
**Subcategory**: Kitchen  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 24, 30, 36, 42, 48, 54
- **Format**: "24-Inch"
- **Example**: 30-Inch
- **Rounding**: NEAREST
- **Notes**: Grill body width; industry standard for built-in and freestanding

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Fuel Type (Gas, Charcoal, Electric, Pellet) | Picklist | |
| 3 | Width | Numeric | |
| 4 | Total BTU | Numeric | |
| 5 | Primary Cooking Area (sq in) | Text | |
| 6 | Number of Burners | Text | |
| 7 | Installation Type (Built-In, Freestanding, Portable) | Picklist | |
| 8 | Material (Stainless Steel, Cast Iron) | Text | |
| 9 | Side Burner | Text | |
| 10 | Rotisserie | Text | |
| 11 | Sear Station | Text | |
| 12 | Infrared Burner | Text | |
| 13 | Warming Rack | Text | |
| 14 | Smart Features | Text | |
| 15 | Cover Included | Text | |

---

### Coffee Maker

**Category ID**: `a01Hu000011kmDGIAY`  
**Family**: Kitchen  
**Subcategory**: Kitchen Appliances  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Cup Capacity (cups)
- **Standard Sizes**: 4, 6, 8, 10, 12, 14
- **Format**: "4-cups"
- **Example**: 6-cups
- **Rounding**: NEAREST
- **Notes**: Standard carafe sizes; also consider single-serve as its own class

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Espresso Machine, Drip, Single Serve, French Press) | Picklist | |
| 3 | Width | Numeric | |
| 4 | Installation Type (Built-In, Countertop) | Picklist | |
| 5 | Water Reservoir Capacity | Numeric | |
| 6 | Brew Sizes | Text | |
| 7 | Grinder (Built-In, None) | Text | |
| 8 | Milk Frother | Text | |
| 9 | Finish/Color | Text | |
| 10 | Programmable | Text | |
| 11 | Auto Shut-Off | Text | |
| 12 | Water Line Connection | Text | |
| 13 | Cups Per Hour | Text | |
| 14 | Commercial Grade | Text | |
| 15 | Pod Compatible | Text | |

---

### Cooktop

**Category ID**: `a01Hu000010Q5EhIAK`  
**Family**: Kitchen  
**Subcategory**: Kitchen Appliances  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 12, 15, 24, 30, 36, 42, 48
- **Format**: "12-Inch"
- **Example**: 15-Inch
- **Rounding**: NEAREST
- **Notes**: Cutout/counter width; 30 and 36 are the most common residential

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Fuel Type (Gas, Electric, Induction) | Picklist | |
| 4 | Number of Burners/Elements | Text | |
| 5 | Installation Type (Drop-In, Slide-In) | Picklist | |
| 6 | Control Location (Top, Front, Knobs) | Text | |
| 7 | BTU Output (Highest Burner) | Numeric | |
| 8 | Finish/Color | Text | |
| 9 | Continuous Grates | Text | |
| 10 | Downdraft | Text | |
| 11 | Griddle | Text | |
| 12 | Bridge Element | Text | |
| 13 | Power Boost | Text | |
| 14 | Simmer Burner | Text | |
| 15 | Child Lock | Text | |

---

### Dishwasher

**Category ID**: `a01Hu000010Q5EiIAK`  
**Family**: Kitchen  
**Subcategory**: Kitchen Appliances  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 18, 24
- **Format**: "18-Inch"
- **Example**: 24-Inch
- **Rounding**: NEAREST
- **Notes**: 18" compact, 24" standard; nearly all residential are 24"

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Installation Type (Built-In, Portable, Drawer) | Picklist | |
| 4 | Control Location (Top, Front) | Text | |
| 5 | Tub Material (Stainless Steel, Plastic) | Text | |
| 6 | Decibel Level (dB) | Text | |
| 7 | Number of Place Settings | Text | |
| 8 | Number of Wash Cycles | Text | |
| 9 | Finish/Color | Text | |
| 10 | Panel Ready | Text | |
| 11 | Third Rack | Text | |
| 12 | Adjustable Upper Rack | Text | |
| 13 | Soil Sensor | Text | |
| 14 | Energy Star Certified | Text | |
| 15 | ADA Compliant | Text | |

---

### Drawer

**Category ID**: `a01Hu000011kpC2IAI`  
**Family**: Kitchen  
**Subcategory**: Kitchen  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 24, 30, 36
- **Format**: "24-Inch"
- **Example**: 30-Inch
- **Rounding**: NEAREST
- **Notes**: Undercounter drawer width; matches cabinetry openings

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Refrigerator Drawer, Freezer Drawer, Microwave Drawer) | Picklist | |
| 3 | Width | Numeric | |
| 4 | Installation Type (Built-In, Under Counter) | Picklist | |
| 5 | Capacity | Numeric | |
| 6 | Temperature Range | Text | |
| 7 | Panel Ready | Text | |
| 8 | Finish/Color | Text | |
| 9 | Soft-Close | Text | |
| 10 | Touch Controls | Text | |
| 11 | Interior Lighting | Text | |
| 12 | Auto Open | Text | |
| 13 | Lock | Text | |
| 14 | Smart Features | Text | |
| 15 | ADA Compliant | Text | |

---

### Dryer

**Category ID**: `a01Hu000010Q5EjIAK`  
**Family**: Laundry  
**Subcategory**: Laundry Appliances  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 24, 27, 29
- **Format**: "24-Inch"
- **Example**: 27-Inch
- **Rounding**: NEAREST
- **Notes**: 24" compact, 27" standard, 29" large capacity

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Fuel Type (Gas, Electric) | Picklist | |
| 4 | Configuration (Front Load, Top Load) | Picklist | |
| 5 | Capacity (Cu. Ft.) | Numeric | |
| 6 | Number of Dry Cycles | Text | |
| 7 | Finish/Color | Text | |
| 8 | Steam Function | Text | |
| 9 | Stackable | Text | |
| 10 | Pedestal Compatible | Text | |
| 11 | Moisture Sensor | Text | |
| 12 | Smart Features | Text | |
| 13 | WiFi Enabled | Text | |
| 14 | Energy Star Certified | Text | |
| 15 | Reversible Door | Text | |

---

### Freezer

**Category ID**: `a01Hu000010Q5EkIAK`  
**Family**: Kitchen  
**Subcategory**: Kitchen  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 18, 24, 30, 36
- **Format**: "18-Inch"
- **Example**: 24-Inch
- **Rounding**: NEAREST
- **Notes**: Standalone/column freezer width

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Configuration (Upright, Chest) | Picklist | |
| 4 | Installation Type (Built-In, Freestanding) | Picklist | |
| 5 | Capacity (Cu. Ft.) | Numeric | |
| 6 | Finish/Color | Text | |
| 7 | Defrost Type (Manual, Frost-Free) | Picklist | |
| 8 | Interior Lighting | Text | |
| 9 | Door Alarm | Text | |
| 10 | Temperature Alarm | Text | |
| 11 | Adjustable Shelves | Text | |
| 12 | Lock | Text | |
| 13 | Energy Star Certified | Text | |
| 14 | Garage Ready | Text | |
| 15 | Convertible (Freezer to Refrigerator) | Text | |

---

### Icemaker

**Category ID**: `a01Hu000011kFRfIAM`  
**Family**: Kitchen  
**Subcategory**: Kitchen  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 15, 18, 24
- **Format**: "15-Inch"
- **Example**: 18-Inch
- **Rounding**: NEAREST
- **Notes**: Undercounter ice maker width

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Installation Type (Built-In, Freestanding, Undercounter, Portable) | Picklist | |
| 4 | Ice Production (lbs/day) | Text | |
| 5 | Ice Storage Capacity | Numeric | |
| 6 | Ice Type (Cube, Nugget, Gourmet, Clear) | Picklist | |
| 7 | Finish/Color | Text | |
| 8 | Drain Type (Gravity, Pump) | Picklist | |
| 9 | Water Connection (Direct, Reservoir) | Text | |
| 10 | Self-Cleaning | Text | |
| 11 | Digital Controls | Text | |
| 12 | Interior Lighting | Text | |
| 13 | Door Style | Picklist | |
| 14 | ADA Compliant | Text | |
| 15 | Outdoor Rated | Text | |

---

### Microwave

**Category ID**: `a01Hu000010Q5ElIAK`  
**Family**: Kitchen  
**Subcategory**: Kitchen Appliances  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 24, 27, 30
- **Format**: "24-Inch"
- **Example**: 27-Inch
- **Rounding**: NEAREST
- **Notes**: Over-the-range and built-in width; 30" is most common

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Installation Type (Over-the-Range, Built-In, Countertop, Drawer) | Picklist | |
| 4 | Capacity (Cu. Ft.) | Numeric | |
| 5 | Wattage | Numeric | |
| 6 | Finish/Color | Text | |
| 7 | Convection | Text | |
| 8 | Sensor Cooking | Text | |
| 9 | Ventilation CFM | Numeric | |
| 10 | Turntable | Text | |
| 11 | Interior Light | Text | |
| 12 | Child Lock | Text | |
| 13 | Smart Features | Text | |
| 14 | WiFi Enabled | Text | |
| 15 | ADA Compliant | Text | |

---

### Oven

**Category ID**: `a01Hu000010Q5EmIAK`  
**Family**: Kitchen  
**Subcategory**: Kitchen Appliances  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 24, 27, 30, 36, 48
- **Format**: "24-Inch"
- **Example**: 27-Inch
- **Rounding**: NEAREST
- **Notes**: Wall oven cutout width; single and double configurations

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Fuel Type (Gas, Electric) | Picklist | |
| 4 | Installation Type (Single Wall, Double Wall, Combination) | Picklist | |
| 5 | Oven Configuration (Single, Double, Microwave Combo) | Picklist | |
| 6 | Oven Capacity (Cu. Ft.) | Numeric | |
| 7 | Convection | Text | |
| 8 | Self-Cleaning | Text | |
| 9 | Finish/Color | Text | |
| 10 | Steam Cooking | Text | |
| 11 | Air Fry | Text | |
| 12 | Sabbath Mode | Text | |
| 13 | Touch Controls | Text | |
| 14 | Smart Features | Text | |
| 15 | WiFi Enabled | Text | |

---

### Pizza Oven

**Category ID**: `a01aZ00000KJFrCQAX`  
**Family**: Kitchen  
**Subcategory**: Kitchen  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Cooking Surface (inches)
- **Standard Sizes**: 12, 16, 20, 24
- **Format**: "12-Inch"
- **Example**: 16-Inch
- **Rounding**: NEAREST
- **Notes**: Interior cooking surface diameter/width

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Fuel Type (Gas, Wood, Electric) | Picklist | |
| 3 | Installation Type (Countertop, Built-In, Freestanding) | Picklist | |
| 4 | Pizza Capacity (Size/Quantity) | Numeric | |
| 5 | Max Temperature | Text | |
| 6 | Interior Size | Text | |
| 7 | Finish/Color | Text | |
| 8 | Material (Stainless Steel, Ceramic) | Text | |
| 9 | Stone/Deck Material | Text | |
| 10 | Rotatable Stone | Text | |
| 11 | Temperature Control | Text | |
| 12 | Timer | Text | |
| 13 | Indoor/Outdoor Use | Text | |
| 14 | Portable | Text | |
| 15 | BTU (Gas) | Numeric | |

---

### Range

**Category ID**: `a01Hu000010Q5EnIAK`  
**Family**: Kitchen  
**Subcategory**: Kitchen Appliances  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 20, 24, 30, 36, 48, 60
- **Format**: "20-Inch"
- **Example**: 24-Inch
- **Rounding**: NEAREST
- **Notes**: Freestanding/slide-in total width; 30" is standard residential

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Fuel Type (Gas, Electric, Dual Fuel, Induction) | Picklist | |
| 4 | Installation Type (Freestanding, Slide-In, Drop-In) | Picklist | |
| 5 | Number of Burners | Text | |
| 6 | Oven Capacity (Cu. Ft.) | Numeric | |
| 7 | Convection | Text | |
| 8 | Self-Cleaning | Text | |
| 9 | Finish/Color | Text | |
| 10 | Continuous Grates | Text | |
| 11 | Double Oven | Text | |
| 12 | Griddle | Text | |
| 13 | Warming Drawer | Text | |
| 14 | BTU Output (Highest Burner) | Numeric | |
| 15 | Smart Features | Text | |

---

### Range Hood

**Category ID**: `a01Hu000010Q5EoIAK`  
**Family**: Kitchen  
**Subcategory**: Kitchen Appliances  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: CFM (CFM)
- **Standard Sizes**: 300, 400, 600, 900, 1200
- **Format**: "300-CFM"
- **Example**: 400-CFM
- **Rounding**: EXACT
- **Notes**: Airflow capacity; USE EXACT manufacturer rating

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Hood Type (Wall Mount, Island, Under Cabinet, Insert/Liner) | Picklist | |
| 4 | CFM (Airflow) | Numeric | |
| 5 | Ducted/Ductless | Text | |
| 6 | Number of Speeds | Text | |
| 7 | Finish/Color | Text | |
| 8 | Material | Text | |
| 9 | Noise Level (Sones) | Text | |
| 10 | Lighting Type | Picklist | |
| 11 | Heat Lamp | Text | |
| 12 | Baffle Filters | Text | |
| 13 | Dishwasher Safe Filters | Text | |
| 14 | Remote Control | Text | |
| 15 | Auto Shutoff | Text | |

---

### Refrigerator

**Category ID**: `a01Hu000010Q5EpIAK`  
**Family**: Kitchen  
**Subcategory**: Kitchen Appliances  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 24, 28, 30, 33, 36, 42, 48
- **Format**: "24-Inch"
- **Example**: 28-Inch
- **Rounding**: NEAREST
- **Notes**: Overall width; 36" is standard full-size, 42/48 are built-in/pro

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Configuration (French Door, Side-by-Side, Wine Cooler, Beverage Center, Kegerator) | Picklist | |
| 4 | Installation Type (Built-In, Freestanding, Counter-Depth) | Numeric | |
| 5 | Total Capacity (Cu. Ft.) | Numeric | |
| 6 | Refrigerator Capacity (Cu. Ft.) | Numeric | |
| 7 | Freezer Capacity (Cu. Ft.) | Numeric | |
| 8 | Finish/Color | Text | |
| 9 | Ice Maker | Text | |
| 10 | Water Dispenser | Text | |
| 11 | Panel Ready | Text | |
| 12 | Depth (inches) | Numeric | |
| 13 | Height (inches) | Numeric | |
| 14 | Number of Doors | Text | |
| 15 | Energy Star Certified | Text | |

---

### Standalone Pedestal

**Category ID**: `a01Hu000010Q5ErIAK`  
**Family**: Laundry  
**Subcategory**: Laundry  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 27, 29
- **Format**: "27-Inch"
- **Example**: 29-Inch
- **Rounding**: NEAREST
- **Notes**: Must match washer/dryer width

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Compatible Models | Text | |
| 3 | Width | Numeric | |
| 4 | Height | Numeric | |
| 5 | Finish/Color | Text | |
| 6 | Storage Drawer | Text | |
| 7 | Load Capacity | Numeric | |
| 8 | Vibration Reduction | Text | |
| 9 | Leveling Legs | Text | |
| 10 | Hardware Included | Text | |
| 11 | Material | Text | |
| 12 | Style | Picklist | |
| 13 | Anti-Tip | Text | |
| 14 | Stackable | Text | |
| 15 | Universal Fit | Text | |

---

### Washer

**Category ID**: `a01Hu000010Q5EsIAK`  
**Family**: Laundry  
**Subcategory**: Laundry Appliances  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 24, 27, 29
- **Format**: "24-Inch"
- **Example**: 27-Inch
- **Rounding**: NEAREST
- **Notes**: 24" compact, 27" standard, 29" large capacity

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Configuration (Front Load, Top Load) | Picklist | |
| 4 | Capacity (Cu. Ft.) | Numeric | |
| 5 | Number of Wash Cycles | Text | |
| 6 | Finish/Color | Text | |
| 7 | Steam Function | Text | |
| 8 | Stackable | Text | |
| 9 | Pedestal Compatible | Text | |
| 10 | Smart Features | Text | |
| 11 | WiFi Enabled | Text | |
| 12 | Energy Star Certified | Text | |
| 13 | ADA Compliant | Text | |
| 14 | Vibration Reduction | Text | |
| 15 | Internal Heater | Text | |

---

## Flooring

**7 categories**

### Carpet

**Category ID**: `NEEDS_SF_ID`  
**Family**: General  
**Subcategory**: Soft Surface Flooring  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Roll Width (feet)
- **Standard Sizes**: 12, 13.5, 15
- **Format**: "12-feet"
- **Example**: 13.5-feet
- **Rounding**: NEAREST
- **Notes**: Standard broadloom roll widths; also consider carpet tile (18x18, 24x24)

**Top Filter Attributes**: Not configured

---

### Hardwood Flooring

**Category ID**: `a01aZ00000dCekSQAS`  
**Family**: General  
**Subcategory**: Hard Surface Flooring  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Plank Width (inches)
- **Standard Sizes**: 2-1/4, 3-1/4, 4, 5, 6, 7, 8
- **Format**: "2-1/4-Inch"
- **Example**: 3-1/4-Inch
- **Rounding**: NEAREST
- **Notes**: Strip (≤3") vs plank (>3"); wide plank is trending

**Top Filter Attributes**: Not configured

---

### Kitchen Tile

**Category ID**: `a01aZ00000dC5EFQA0`  
**Family**: Kitchen  
**Subcategory**: Tile  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Tile Size (inches)
- **Standard Sizes**: 1x1, 2x2, 3x6, 4x4, 4x12, 6x6, 6x24, 8x8, 12x12, 12x24, 16x16, 18x18, 24x24
- **Format**: "1x1-Inch"
- **Example**: 2x2-Inch
- **Rounding**: NEAREST
- **Notes**: Same tile size classes; kitchen floors trend toward larger formats

**Top Filter Attributes**: Not configured

---

### Laminate Flooring

**Category ID**: `a01aZ00000dCekTQAS`  
**Family**: General  
**Subcategory**: Hard Surface Flooring  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Plank Width (inches)
- **Standard Sizes**: 5, 6, 7, 8, 10, 12
- **Format**: "5-Inch"
- **Example**: 6-Inch
- **Rounding**: NEAREST
- **Notes**: Modern laminate trends wider; also comes in tile-look dimensions

**Top Filter Attributes**: Not configured

---

### Luxury Vinyl Flooring

**Category ID**: `a01aZ00000dCekRQAS`  
**Family**: General  
**Subcategory**: Hard Surface Flooring  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Plank Width (inches)
- **Standard Sizes**: 6, 7, 8, 9, 12
- **Format**: "6-Inch"
- **Example**: 7-Inch
- **Rounding**: NEAREST
- **Notes**: LVP plank width; LVT tiles use separate tile size classes

**Top Filter Attributes**: Not configured

---

### Tile

**Category ID**: `a01aZ00000dCekQQAS`  
**Family**: General  
**Subcategory**: Hard Surface Flooring  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Tile Size (inches)
- **Standard Sizes**: 1x1, 2x2, 3x6, 4x4, 4x12, 6x6, 6x24, 6x36, 8x8, 12x12, 12x24, 16x16, 18x18, 24x24, 24x48
- **Format**: "1x1-Inch"
- **Example**: 2x2-Inch
- **Rounding**: NEAREST
- **Notes**: Format is WxL; mosaics (≤2x2), subway, standard, large format (≥24x24)

**Top Filter Attributes**: Not configured

---

### Waterproof Flooring

**Category ID**: `a01aZ00000dCekWQAS`  
**Family**: General  
**Subcategory**: General  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Plank Width (inches)
- **Standard Sizes**: 6, 7, 8, 9, 12
- **Format**: "6-Inch"
- **Example**: 7-Inch
- **Rounding**: NEAREST
- **Notes**: Typically SPC/WPC; similar classes to LVP

**Top Filter Attributes**: Not configured

---

## Hardware

**38 categories**

### Appliance Pull

**Category ID**: `a01aZ00000dCejSQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Backplate

**Category ID**: `a01aZ00000dCejTQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Barn Door Hardware

**Category ID**: `a01aZ00000dC5F1QAK`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Bathroom Cabinet Hardware

**Category ID**: `a01aZ00000dC5DdQAK`  
**Family**: Bath  
**Subcategory**: Cabinet Hardware  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Knob, Pull, Handle, Cup Pull) | Picklist | |
| 3 | Style (Modern, Traditional, Transitional, Farmhouse) | Picklist | |
| 4 | Finish (Brass, Nickel, Chrome, Bronze, Black) | Text | |
| 5 | Material (Zinc, Steel, Brass, Aluminum) | Text | |
| 6 | Length/Diameter | Text | |
| 7 | Center-to-Center (for Pulls) | Text | |
| 8 | Projection | Text | |
| 9 | Width | Numeric | |
| 10 | Mounting Hardware Included | Text | |
| 11 | For Cabinet Type (Kitchen, Bath, Furniture) | Picklist | |
| 12 | Set Quantity | Text | |
| 13 | Soft-Close Compatible | Text | |
| 14 | Weight Capacity | Numeric | |
| 15 | ADA Compliant | Text | |

---

### Cabinet Catch and Latch

**Category ID**: `a01aZ00000dCejUQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Cabinet Finishing

**Category ID**: `a01aZ00000dCejVQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Cabinet Hardware

**Category ID**: `a01aZ00000dC5E4QAK`  
**Family**: Home Improvement  
**Subcategory**: Hardware  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Knob, Pull, Handle, Cup Pull) | Picklist | |
| 3 | Style (Modern, Traditional, Transitional, Farmhouse) | Picklist | |
| 4 | Finish (Brass, Nickel, Chrome, Bronze, Black) | Text | |
| 5 | Material (Zinc, Steel, Brass, Aluminum) | Text | |
| 6 | Length/Diameter | Text | |
| 7 | Center-to-Center (for Pulls) | Text | |
| 8 | Projection | Text | |
| 9 | Width | Numeric | |
| 10 | Mounting Hardware Included | Text | |
| 11 | For Cabinet Type (Kitchen, Bath, Furniture) | Picklist | |
| 12 | Set Quantity | Text | |
| 13 | Soft-Close Compatible | Text | |
| 14 | Weight Capacity | Numeric | |
| 15 | ADA Compliant | Text | |

---

### Cabinet Hardware Bulk Pack

**Category ID**: `a01aZ00000dCejWQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Knob, Pull, Handle, Cup Pull) | Picklist | |
| 3 | Style (Modern, Traditional, Transitional, Farmhouse) | Picklist | |
| 4 | Finish (Brass, Nickel, Chrome, Bronze, Black) | Text | |
| 5 | Material (Zinc, Steel, Brass, Aluminum) | Text | |
| 6 | Length/Diameter | Text | |
| 7 | Center-to-Center (for Pulls) | Text | |
| 8 | Projection | Text | |
| 9 | Width | Numeric | |
| 10 | Mounting Hardware Included | Text | |
| 11 | For Cabinet Type (Kitchen, Bath, Furniture) | Picklist | |
| 12 | Set Quantity | Text | |
| 13 | Soft-Close Compatible | Text | |
| 14 | Weight Capacity | Numeric | |
| 15 | ADA Compliant | Text | |

---

### Cabinet Hardware Mounting Template

**Category ID**: `a01aZ00000dCejXQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Knob, Pull, Handle, Cup Pull) | Picklist | |
| 3 | Style (Modern, Traditional, Transitional, Farmhouse) | Picklist | |
| 4 | Finish (Brass, Nickel, Chrome, Bronze, Black) | Text | |
| 5 | Material (Zinc, Steel, Brass, Aluminum) | Text | |
| 6 | Length/Diameter | Text | |
| 7 | Center-to-Center (for Pulls) | Text | |
| 8 | Projection | Text | |
| 9 | Width | Numeric | |
| 10 | Mounting Hardware Included | Text | |
| 11 | For Cabinet Type (Kitchen, Bath, Furniture) | Picklist | |
| 12 | Set Quantity | Text | |
| 13 | Soft-Close Compatible | Text | |
| 14 | Weight Capacity | Numeric | |
| 15 | ADA Compliant | Text | |

---

### Cabinet Hinge

**Category ID**: `a01aZ00000dCejYQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Cabinet Knob

**Category ID**: `a01aZ00000dCejZQAS`  
**Family**: Home Improvement  
**Subcategory**: Cabinet Hardware  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Knob, Pull, Handle, Cup Pull) | Picklist | |
| 3 | Style (Modern, Traditional, Transitional, Farmhouse) | Picklist | |
| 4 | Finish (Brass, Nickel, Chrome, Bronze, Black) | Text | |
| 5 | Material (Zinc, Steel, Brass, Aluminum) | Text | |
| 6 | Length/Diameter | Text | |
| 7 | Center-to-Center (for Pulls) | Text | |
| 8 | Projection | Text | |
| 9 | Width | Numeric | |
| 10 | Mounting Hardware Included | Text | |
| 11 | For Cabinet Type (Kitchen, Bath, Furniture) | Picklist | |
| 12 | Set Quantity | Text | |
| 13 | Soft-Close Compatible | Text | |
| 14 | Weight Capacity | Numeric | |
| 15 | ADA Compliant | Text | |

---

### Cabinet Lock

**Category ID**: `a01aZ00000dCejaQAC`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Cabinet Organization and Storage

**Category ID**: `a01aZ00000dCejbQAC`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Lazy Susan, Pull-Out, Tray Divider, Spice Rack) | Picklist | |
| 3 | Cabinet Size/Width | Numeric | |
| 4 | Material (Wire, Wood, Plastic) | Text | |
| 5 | Finish/Color | Text | |
| 6 | Adjustable | Text | |
| 7 | Load Capacity | Numeric | |
| 8 | Number of Tiers/Shelves | Text | |
| 9 | Soft-Close | Text | |
| 10 | Full Extension | Text | |
| 11 | Door Mount/Base Mount | Text | |
| 12 | Installation Type | Picklist | |
| 13 | Hardware Included | Text | |
| 14 | D-Shape/Kidney Shape | Text | |
| 15 | Dimensions | Text | |

---

### Cabinet Pull

**Category ID**: `a01aZ00000dCejcQAC`  
**Family**: Home Improvement  
**Subcategory**: Cabinet Hardware  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Knob, Pull, Handle, Cup Pull) | Picklist | |
| 3 | Style (Modern, Traditional, Transitional, Farmhouse) | Picklist | |
| 4 | Finish (Brass, Nickel, Chrome, Bronze, Black) | Text | |
| 5 | Material (Zinc, Steel, Brass, Aluminum) | Text | |
| 6 | Length/Diameter | Text | |
| 7 | Center-to-Center (for Pulls) | Text | |
| 8 | Projection | Text | |
| 9 | Width | Numeric | |
| 10 | Mounting Hardware Included | Text | |
| 11 | For Cabinet Type (Kitchen, Bath, Furniture) | Picklist | |
| 12 | Set Quantity | Text | |
| 13 | Soft-Close Compatible | Text | |
| 14 | Weight Capacity | Numeric | |
| 15 | ADA Compliant | Text | |

---

### Closet and Pocket Door Hardware

**Category ID**: `a01aZ00000dC5F3QAK`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Commercial Door Hardware

**Category ID**: `a01aZ00000dC5F4QAK`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Deadbolt

**Category ID**: `a01aZ00000dC5F5QAK`  
**Family**: Home Improvement  
**Subcategory**: Door Hardware  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Designer Cabinet Hardware

**Category ID**: `a01aZ00000dCejdQAC`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Knob, Pull, Handle, Cup Pull) | Picklist | |
| 3 | Style (Modern, Traditional, Transitional, Farmhouse) | Picklist | |
| 4 | Finish (Brass, Nickel, Chrome, Bronze, Black) | Text | |
| 5 | Material (Zinc, Steel, Brass, Aluminum) | Text | |
| 6 | Length/Diameter | Text | |
| 7 | Center-to-Center (for Pulls) | Text | |
| 8 | Projection | Text | |
| 9 | Width | Numeric | |
| 10 | Mounting Hardware Included | Text | |
| 11 | For Cabinet Type (Kitchen, Bath, Furniture) | Picklist | |
| 12 | Set Quantity | Text | |
| 13 | Soft-Close Compatible | Text | |
| 14 | Weight Capacity | Numeric | |
| 15 | ADA Compliant | Text | |

---

### Door

**Category ID**: `a01aZ00000dCejDQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Configuration (French Door, Side-by-Side, Wine Cooler, Beverage Center, Kegerator) | Picklist | |
| 4 | Installation Type (Built-In, Freestanding, Counter-Depth) | Numeric | |
| 5 | Total Capacity (Cu. Ft.) | Numeric | |
| 6 | Refrigerator Capacity (Cu. Ft.) | Numeric | |
| 7 | Freezer Capacity (Cu. Ft.) | Numeric | |
| 8 | Finish/Color | Text | |
| 9 | Ice Maker | Text | |
| 10 | Water Dispenser | Text | |
| 11 | Panel Ready | Text | |
| 12 | Depth (inches) | Numeric | |
| 13 | Height (inches) | Numeric | |
| 14 | Number of Doors | Text | |
| 15 | Energy Star Certified | Text | |

---

### Door Entry Set

**Category ID**: `a01aZ00000dC5F7QAK`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Door Hardware Part

**Category ID**: `a01aZ00000dC5F8QAK`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Hinge, Strike Plate, Latch, Deadbolt) | Picklist | |
| 3 | Style | Picklist | |
| 4 | Finish (Brass, Nickel, Chrome, Bronze, Black) | Text | |
| 5 | Material (Steel, Brass, Stainless) | Text | |
| 6 | Size | Text | |
| 7 | Handing (Left, Right, Universal) | Text | |
| 8 | Fire Rated | Text | |
| 9 | For Door Type (Interior, Exterior, Commercial) | Picklist | |
| 10 | For Door Thickness | Text | |
| 11 | Security Grade (1, 2, 3) | Text | |
| 12 | Ball Bearing | Text | |
| 13 | Self-Closing | Text | |
| 14 | Quantity in Pack | Text | |
| 15 | Screw Pattern | Text | |

---

### Door Hardware: Knob and Lever

**Category ID**: `a01aZ00000dC5F9QAK`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Door Hinge

**Category ID**: `a01aZ00000dC5FAQA0`  
**Family**: Home Improvement  
**Subcategory**: Door Hardware  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Hinge, Strike Plate, Latch, Deadbolt) | Picklist | |
| 3 | Style | Picklist | |
| 4 | Finish (Brass, Nickel, Chrome, Bronze, Black) | Text | |
| 5 | Material (Steel, Brass, Stainless) | Text | |
| 6 | Size | Text | |
| 7 | Handing (Left, Right, Universal) | Text | |
| 8 | Fire Rated | Text | |
| 9 | For Door Type (Interior, Exterior, Commercial) | Picklist | |
| 10 | For Door Thickness | Text | |
| 11 | Security Grade (1, 2, 3) | Text | |
| 12 | Ball Bearing | Text | |
| 13 | Self-Closing | Text | |
| 14 | Quantity in Pack | Text | |
| 15 | Screw Pattern | Text | |

---

### Door Knob

**Category ID**: `a01aZ00000dCejBQAS`  
**Family**: Home Improvement  
**Subcategory**: Door Hardware  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Door Lever

**Category ID**: `a01aZ00000dCejCQAS`  
**Family**: Home Improvement  
**Subcategory**: Door Hardware  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Drawer Slide and Accessory

**Category ID**: `a01aZ00000dCejeQAC`  
**Family**: Home Improvement  
**Subcategory**: Cabinet Hardware  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Refrigerator Drawer, Freezer Drawer, Microwave Drawer) | Picklist | |
| 3 | Width | Numeric | |
| 4 | Installation Type (Built-In, Under Counter) | Picklist | |
| 5 | Capacity | Numeric | |
| 6 | Temperature Range | Text | |
| 7 | Panel Ready | Text | |
| 8 | Finish/Color | Text | |
| 9 | Soft-Close | Text | |
| 10 | Touch Controls | Text | |
| 11 | Interior Lighting | Text | |
| 12 | Auto Open | Text | |
| 13 | Lock | Text | |
| 14 | Smart Features | Text | |
| 15 | ADA Compliant | Text | |

---

### Handleset

**Category ID**: `a01aZ00000dCejEQAS`  
**Family**: Home Improvement  
**Subcategory**: Door Hardware  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Keyed Hardware

**Category ID**: `a01aZ00000dCejGQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Keyless Entry

**Category ID**: `a01aZ00000dCejHQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Lock Combo Pack

**Category ID**: `a01aZ00000dCejIQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Mortise Lock

**Category ID**: `a01aZ00000dCejJQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Multi Point Door Hardware

**Category ID**: `a01aZ00000dCejKQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Safe, Lock and Lock Box

**Category ID**: `a01aZ00000dCejLQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Safety & Security

**Category ID**: `a01aZ00000dCejMQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Screen and Storm Door Hardware

**Category ID**: `a01aZ00000dCejNQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Sliding Door Hardware

**Category ID**: `a01aZ00000dCejOQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Storage and Organization

**Category ID**: `a01aZ00000dCejPQAS`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Vanity Cabinet Hardware

**Category ID**: `a01aZ00000dCejhQAC`  
**Family**: Home Improvement  
**Subcategory**: Home Improvement  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Style (Modern, Traditional, Transitional, Farmhouse) | Picklist | |
| 4 | Configuration (Single Sink, Double Sink) | Picklist | |
| 5 | Cabinet Material (Wood, MDF, Plywood) | Text | |
| 6 | Countertop Material (Marble, Quartz, Granite, Cultured Marble) | Text | |
| 7 | Sink Included | Text | |
| 8 | Faucet Included | Text | |
| 9 | Number of Drawers | Text | |
| 10 | Number of Doors | Text | |
| 11 | Soft-Close Hardware | Text | |
| 12 | Finish/Color | Text | |
| 13 | Mirror Included | Text | |
| 14 | Backsplash Included | Text | |
| 15 | Assembly Required | Text | |

---

## Heating & Cooling

**17 categories**

### Air Conditioner

**Category ID**: `a01aZ00000dCek0QAC`  
**Family**: HVAC  
**Subcategory**: Air Conditioning  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Window, Portable, Mini Split, Central) | Picklist | |
| 3 | BTU | Numeric | |
| 4 | Cooling Area (sq ft) | Text | |
| 5 | SEER Rating | Text | |
| 6 | Energy Star Certified | Text | |
| 7 | WiFi/Smart Features | Text | |
| 8 | Dehumidifier Function | Text | |
| 9 | Heating Function | Text | |
| 10 | Number of Speeds | Text | |
| 11 | Noise Level (dB) | Text | |
| 12 | Finish/Color | Text | |
| 13 | Remote Control | Text | |
| 14 | Timer | Text | |
| 15 | Voltage (115V/230V) | Text | |

---

### Air Filter

**Category ID**: `a01aZ00000dCek1QAC`  
**Family**: HVAC  
**Subcategory**: HVAC  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Commercial HVAC

**Category ID**: `a01aZ00000dCek2QAC`  
**Family**: HVAC  
**Subcategory**: HVAC  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Dehumidifier

**Category ID**: `a01aZ00000dCek3QAC`  
**Family**: HVAC  
**Subcategory**: HVAC  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Ducting

**Category ID**: `a01aZ00000dCek4QAC`  
**Family**: HVAC  
**Subcategory**: HVAC  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Evaporative Cooler

**Category ID**: `a01aZ00000dCek5QAC`  
**Family**: HVAC  
**Subcategory**: HVAC  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Exhaust Fan

**Category ID**: `a01aZ00000dCek6QAC`  
**Family**: HVAC  
**Subcategory**: HVAC  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: CFM (CFM)
- **Standard Sizes**: 50, 80, 100, 110, 150, 200, 250, 300
- **Format**: "50-CFM"
- **Example**: 80-CFM
- **Rounding**: EXACT
- **Notes**: Ventilation capacity; USE EXACT manufacturer rating

**Top Filter Attributes**: Not configured

---

### HVAC Accessory

**Category ID**: `a01aZ00000fKN2RQAW`  
**Family**: HVAC  
**Subcategory**: HVAC Components  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Mini Split Air Conditioner

**Category ID**: `a01aZ00000dCekBQAS`  
**Family**: HVAC  
**Subcategory**: Air Conditioning  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Window, Portable, Mini Split, Central) | Picklist | |
| 3 | BTU | Numeric | |
| 4 | Cooling Area (sq ft) | Text | |
| 5 | SEER Rating | Text | |
| 6 | Energy Star Certified | Text | |
| 7 | WiFi/Smart Features | Text | |
| 8 | Dehumidifier Function | Text | |
| 9 | Heating Function | Text | |
| 10 | Number of Speeds | Text | |
| 11 | Noise Level (dB) | Text | |
| 12 | Finish/Color | Text | |
| 13 | Remote Control | Text | |
| 14 | Timer | Text | |
| 15 | Voltage (115V/230V) | Text | |

---

### Patio Heater

**Category ID**: `a01aZ00000dCejxQAC`  
**Family**: Outdoor  
**Subcategory**: Outdoor Heating  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Room Heater

**Category ID**: `a01aZ00000eEFl0QAG`  
**Family**: HVAC  
**Subcategory**: HVAC  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Skylight

**Category ID**: `a01aZ00000dCekDQAS`  
**Family**: HVAC  
**Subcategory**: HVAC  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Stove and Chimney Pipe

**Category ID**: `a01aZ00000dCekEQAS`  
**Family**: HVAC  
**Subcategory**: HVAC  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Stove and Fireplace

**Category ID**: `a01aZ00000dCekFQAS`  
**Family**: HVAC  
**Subcategory**: Heating Systems  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Tankless Water Heater

**Category ID**: `a01aZ00000dC5DwQAK`  
**Family**: General  
**Subcategory**: Water Heaters  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Flow Rate (GPM)
- **Standard Sizes**: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
- **Format**: "2-GPM"
- **Example**: 3-GPM
- **Rounding**: EXACT
- **Notes**: Gallons per minute at specified temp rise; USE EXACT manufacturer rating

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Tank, Tankless, Heat Pump, Solar) | Picklist | |
| 3 | Fuel Type (Electric, Gas, Propane) | Picklist | |
| 4 | Tank Capacity (Gallons) | Numeric | |
| 5 | First Hour Rating (FHR) | Text | |
| 6 | Energy Factor (UEF) | Text | |
| 7 | GPM (for Tankless) | Numeric | |
| 8 | BTU Input | Numeric | |
| 9 | Recovery Rate (GPH) | Text | |
| 10 | Dimensions (H x W x D) | Text | |
| 11 | Venting Type (Direct, Power, Atmospheric) | Picklist | |
| 12 | Wi-Fi/Smart Enabled | Text | |
| 13 | Warranty (Tank/Parts) | Text | |
| 14 | Energy Star Certified | Text | |
| 15 | Installation Type (Residential, Commercial) | Picklist | |

---

### Thermostat

**Category ID**: `a01aZ00000dCekGQAS`  
**Family**: HVAC  
**Subcategory**: HVAC Components  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Valve Type (Pressure Balance, Thermostatic, Transfer) | Picklist | |
| 3 | Number of Functions | Text | |
| 4 | Inlet Size | Text | |
| 5 | Outlet Size | Text | |
| 6 | Connection Type (Threaded, Sweat, PEX, CPVC) | Picklist | |
| 7 | Integral Stops | Text | |
| 8 | Check Valves Included | Text | |
| 9 | Volume Control | Text | |
| 10 | Max Flow Rate (GPM) | Numeric | |
| 11 | For Use With (Shower, Tub, Tub/Shower) | Text | |
| 12 | Cold Expansion PEX Compatible | Text | |
| 13 | Universal Fit | Text | |
| 14 | Code Compliant | Text | |
| 15 | Lead-Free | Text | |

---

### Water Heater

**Category ID**: `a01aZ00000bI2srQAC`  
**Family**: General  
**Subcategory**: Water Heaters  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Tank Capacity (gallons)
- **Standard Sizes**: 20, 30, 38, 40, 50, 55, 65, 75, 80, 100
- **Format**: "20-gallons"
- **Example**: 30-gallons
- **Rounding**: NEAREST
- **Notes**: Standard tank sizes; 40 and 50 gal are most common residential

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Tank, Tankless, Heat Pump, Solar) | Picklist | |
| 3 | Fuel Type (Electric, Gas, Propane) | Picklist | |
| 4 | Tank Capacity (Gallons) | Numeric | |
| 5 | First Hour Rating (FHR) | Text | |
| 6 | Energy Factor (UEF) | Text | |
| 7 | GPM (for Tankless) | Numeric | |
| 8 | BTU Input | Numeric | |
| 9 | Recovery Rate (GPH) | Text | |
| 10 | Dimensions (H x W x D) | Text | |
| 11 | Venting Type (Direct, Power, Atmospheric) | Picklist | |
| 12 | Wi-Fi/Smart Enabled | Text | |
| 13 | Warranty (Tank/Parts) | Text | |
| 14 | Energy Star Certified | Text | |
| 15 | Installation Type (Residential, Commercial) | Picklist | |

---

## Home Décor & Furniture

**4 categories**

### Chair

**Category ID**: `a01aZ00000XYWwyQAH`  
**Family**: Furniture  
**Subcategory**: Furniture  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Mirror

**Category ID**: `a01aZ00000dCekJQAS`  
**Family**: Home Improvement  
**Subcategory**: Mirrors & Wall Décor  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Wall, Floor, Vanity, Medicine Cabinet) | Picklist | |
| 3 | Shape (Rectangular, Round, Oval, Arch) | Text | |
| 4 | Style (Modern, Traditional, Farmhouse, Industrial) | Picklist | |
| 5 | Width | Numeric | |
| 6 | Height | Numeric | |
| 7 | Frame Material (Wood, Metal, Resin, Frameless) | Text | |
| 8 | Frame Finish | Text | |
| 9 | Mirror Type (Standard, Beveled, Antiqued) | Picklist | |
| 10 | Lighted | Text | |
| 11 | Magnification | Text | |
| 12 | Mounting Hardware Included | Text | |
| 13 | Orientation (Horizontal, Vertical, Both) | Text | |
| 14 | Fog-Free | Text | |
| 15 | Smart Features | Text | |

---

### Rug

**Category ID**: `a01aZ00000dCekNQAS`  
**Family**: Home Improvement  
**Subcategory**: Textiles & Accents  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Wall Decor

**Category ID**: `a01aZ00000dCekKQAS`  
**Family**: Home Improvement  
**Subcategory**: Mirrors & Wall Décor  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

## Industrial & Commercial

**5 categories**

### Chemicals & Compounds

**Category ID**: `a01aZ00000dF7KTQA0`  
**Family**: General  
**Subcategory**: General  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Commercial Restroom

**Category ID**: `a01aZ00000dC5DpQAK`  
**Family**: General  
**Subcategory**: General  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Hydronic Expansion Tank

**Category ID**: `a01aZ00000dFPfcQAG`  
**Family**: General  
**Subcategory**: General  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Diaphragm, Bladder) | Picklist | |
| 3 | Tank Capacity (Gallons) | Numeric | |
| 4 | System Type (Potable Water, Hydronic Heating) | Picklist | |
| 5 | Max Working Pressure (PSI) | Text | |
| 6 | Pre-Charge Pressure (PSI) | Text | |
| 7 | Connection Size | Text | |
| 8 | Connection Type (NPT, Threaded) | Picklist | |
| 9 | Material (Steel, Stainless) | Text | |
| 10 | Max Temperature (°F) | Text | |
| 11 | Mounting Position (Vertical, Horizontal) | Text | |
| 12 | Dimensions (H x D) | Text | |
| 13 | NSF/ANSI Certified | Text | |
| 14 | Lead-Free | Text | |
| 15 | Warranty (Years) | Text | |

---

### Industrial Strainer

**Category ID**: `a01aZ00000dDRGuQAO`  
**Family**: General  
**Subcategory**: General  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Water Fountain

**Category ID**: `a01aZ00000dBtNpQAK`  
**Family**: General  
**Subcategory**: General  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

## Lighting & Electrical

**24 categories**

### Air Circulator

**Category ID**: `a01aZ00000dC5EfQAK`  
**Family**: General  
**Subcategory**: Wall Lighting  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Attic Fan

**Category ID**: `a01aZ00000dC5EgQAK`  
**Family**: General  
**Subcategory**: General  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Bathroom Lighting

**Category ID**: `a01aZ00000dC5DgQAK`  
**Family**: Bath  
**Subcategory**: Wall Lighting  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Vanity Light, Bath Bar, Sconce) | Picklist | |
| 3 | Style (Modern, Traditional, Transitional) | Picklist | |
| 4 | Width | Numeric | |
| 5 | Height | Numeric | |
| 6 | Extension from Wall | Text | |
| 7 | Number of Lights | Text | |
| 8 | Bulb Type (LED, Incandescent, Halogen) | Picklist | |
| 9 | Max Wattage | Numeric | |
| 10 | Finish (Chrome, Nickel, Bronze, Brass) | Text | |
| 11 | Shade Material (Glass, Acrylic, Opal) | Text | |
| 12 | Shade Direction (Up, Down, Up/Down) | Text | |
| 13 | Dimmable | Text | |
| 14 | Damp/Wet Rated | Text | |
| 15 | ADA Compliant | Text | |

---

### Ceiling Fan

**Category ID**: `a01aZ00000dC5EjQAK`  
**Family**: General  
**Subcategory**: Fans  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Blade Span | Text | |
| 3 | Number of Blades | Text | |
| 4 | Light Kit Included | Text | |
| 5 | Style (Modern, Traditional, Tropical) | Picklist | |
| 6 | Finish/Color | Text | |
| 7 | Blade Material | Text | |
| 8 | Motor Type (DC, AC) | Picklist | |
| 9 | Number of Speeds | Text | |
| 10 | Reversible Motor | Text | |
| 11 | Remote Control Included | Text | |
| 12 | Smart/WiFi Enabled | Text | |
| 13 | Damp/Wet Rated | Text | |
| 14 | CFM | Numeric | |
| 15 | Noise Level | Text | |

---

### Ceiling Light

**Category ID**: `a01aZ00000dC5EKQA0`  
**Family**: Indoor Lighting  
**Subcategory**: Ceiling Lighting  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Style (Flush Mount, Semi-Flush, Linear) | Picklist | |
| 3 | Width/Diameter | Numeric | |
| 4 | Height | Numeric | |
| 5 | Number of Lights | Text | |
| 6 | Bulb Type (LED, Incandescent, Fluorescent) | Picklist | |
| 7 | Max Wattage | Numeric | |
| 8 | Finish/Color | Text | |
| 9 | Material (Glass, Metal, Crystal, Fabric) | Text | |
| 10 | Dimmable | Text | |
| 11 | Integrated LED | Text | |
| 12 | Color Temperature (K) | Text | |
| 13 | Lumens | Text | |
| 14 | Dry/Damp/Wet Rated | Text | |
| 15 | ETL/UL Listed | Text | |

---

### Chandelier

**Category ID**: `a01aZ00000dC5ELQA0`  
**Family**: General  
**Subcategory**: Ceiling Lighting  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Style (Traditional, Modern, Transitional, Rustic, Crystal) | Picklist | |
| 3 | Width/Diameter | Numeric | |
| 4 | Height (Fixture) | Numeric | |
| 5 | Adjustable Height | Numeric | |
| 6 | Number of Lights | Text | |
| 7 | Bulb Type (LED, Incandescent, Candelabra) | Picklist | |
| 8 | Finish/Color | Text | |
| 9 | Material (Crystal, Glass, Metal, Wood) | Text | |
| 10 | Dimmable | Text | |
| 11 | Chain/Cord Length | Text | |
| 12 | Max Wattage | Numeric | |
| 13 | Bulbs Included | Text | |
| 14 | Dry/Damp/Wet Rated | Text | |
| 15 | ETL/UL Listed | Text | |

---

### Commercial Lighting

**Category ID**: `a01aZ00000dC5EMQA0`  
**Family**: General  
**Subcategory**: Ceiling Lighting  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Troffer, Panel, High Bay, Strip) | Picklist | |
| 3 | Size (2x2, 2x4, 1x4) | Text | |
| 4 | Wattage | Numeric | |
| 5 | Lumens | Text | |
| 6 | Color Temperature (K) | Text | |
| 7 | CRI (Color Rendering Index) | Text | |
| 8 | Voltage | Text | |
| 9 | Mounting Type (Recessed, Surface, Pendant) | Picklist | |
| 10 | Lens Type (Prismatic, Flat, Parabolic) | Picklist | |
| 11 | DLC Listed | Text | |
| 12 | Dimmable (0-10V) | Text | |
| 13 | Emergency Battery Backup | Text | |
| 14 | Motion Sensor Compatible | Text | |
| 15 | Warranty (Years) | Text | |

---

### Flush and Semi-Flush

**Category ID**: `a01aZ00000dC5ENQA0`  
**Family**: Indoor Lighting  
**Subcategory**: Ceiling Lighting  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Style (Flush Mount, Semi-Flush, Linear) | Picklist | |
| 3 | Width/Diameter | Numeric | |
| 4 | Height | Numeric | |
| 5 | Number of Lights | Text | |
| 6 | Bulb Type (LED, Incandescent, Fluorescent) | Picklist | |
| 7 | Max Wattage | Numeric | |
| 8 | Finish/Color | Text | |
| 9 | Material (Glass, Metal, Crystal, Fabric) | Text | |
| 10 | Dimmable | Text | |
| 11 | Integrated LED | Text | |
| 12 | Color Temperature (K) | Text | |
| 13 | Lumens | Text | |
| 14 | Dry/Damp/Wet Rated | Text | |
| 15 | ETL/UL Listed | Text | |

---

### Island Lighting

**Category ID**: `a01aZ00000dC5EOQA0`  
**Family**: Indoor Lighting  
**Subcategory**: Ceiling Lighting  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Style (Modern, Industrial, Farmhouse, Globe, Drum) | Picklist | |
| 3 | Width/Diameter | Numeric | |
| 4 | Height (Fixture) | Numeric | |
| 5 | Adjustable Height | Numeric | |
| 6 | Number of Lights | Text | |
| 7 | Bulb Type | Picklist | |
| 8 | Finish/Color | Text | |
| 9 | Shade Material (Glass, Metal, Fabric) | Text | |
| 10 | Dimmable | Text | |
| 11 | Cord/Chain Length | Text | |
| 12 | Sloped Ceiling Compatible | Text | |
| 13 | Bulbs Included | Text | |
| 14 | Dry/Damp Rated | Text | |
| 15 | ETL/UL Listed | Text | |

---

### Kitchen Lighting

**Category ID**: `a01aZ00000dC5EBQA0`  
**Family**: Kitchen  
**Subcategory**: Kitchen  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Island Pendant, Under Cabinet, Chandelier, Flush) | Picklist | |
| 3 | Style (Modern, Traditional, Farmhouse, Industrial) | Picklist | |
| 4 | Width/Length | Numeric | |
| 5 | Height | Numeric | |
| 6 | Number of Lights | Text | |
| 7 | Bulb Type (LED, Incandescent) | Picklist | |
| 8 | Max Wattage | Numeric | |
| 9 | Finish | Text | |
| 10 | Material (Glass, Metal, Wood) | Text | |
| 11 | Adjustable Height | Numeric | |
| 12 | Dimmable | Text | |
| 13 | Integrated LED | Text | |
| 14 | Color Temperature | Text | |
| 15 | Lumens | Text | |

---

### Lamp

**Category ID**: `a01aZ00000dCekOQAS`  
**Family**: Home Improvement  
**Subcategory**: Lamps  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Table, Floor, Desk, Buffet, Torchiere) | Picklist | |
| 3 | Style (Modern, Traditional, Transitional, Industrial) | Picklist | |
| 4 | Height | Numeric | |
| 5 | Width/Diameter | Numeric | |
| 6 | Base Material (Metal, Ceramic, Glass, Wood) | Text | |
| 7 | Shade Material (Fabric, Glass, Metal) | Text | |
| 8 | Shade Color | Text | |
| 9 | Number of Lights | Text | |
| 10 | Bulb Type | Picklist | |
| 11 | Max Wattage | Numeric | |
| 12 | Switch Type (On/Off, 3-Way, Touch, Dimmer) | Picklist | |
| 13 | Cord Length | Text | |
| 14 | USB Port/Outlet | Text | |
| 15 | Adjustable | Text | |

---

### Landscape Lighting

**Category ID**: `a01aZ00000dC5EQQA0`  
**Family**: Outdoor  
**Subcategory**: Outdoor  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### LED Lighting

**Category ID**: `a01aZ00000dC5ERQA0`  
**Family**: General  
**Subcategory**: General  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Light Bulbs

**Category ID**: `a01aZ00000dC5ESQA0`  
**Family**: General  
**Subcategory**: Bulbs & Accessories  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Shade, Bulb, Dimmer, Canopy, Chain) | Picklist | |
| 3 | For Fixture Type | Picklist | |
| 4 | Material | Text | |
| 5 | Size/Dimensions | Text | |
| 6 | Color/Finish | Text | |
| 7 | Compatibility | Text | |
| 8 | Bulb Base Type (E26, E12, GU10, etc.) | Picklist | |
| 9 | Wattage | Numeric | |
| 10 | Voltage | Text | |
| 11 | Dimmable | Text | |
| 12 | Smart Home Compatible | Text | |
| 13 | Chain Length | Text | |
| 14 | Universal Fit | Text | |
| 15 | Energy Star | Text | |

---

### Light Switches & Dimmers

**Category ID**: `a01aZ00000dC5ETQA0`  
**Family**: General  
**Subcategory**: Switches & Dimmers  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Lighting Accessory

**Category ID**: `a01aZ00000dC5EVQA0`  
**Family**: General  
**Subcategory**: Specialty Lighting  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Shade, Bulb, Dimmer, Canopy, Chain) | Picklist | |
| 3 | For Fixture Type | Picklist | |
| 4 | Material | Text | |
| 5 | Size/Dimensions | Text | |
| 6 | Color/Finish | Text | |
| 7 | Compatibility | Text | |
| 8 | Bulb Base Type (E26, E12, GU10, etc.) | Picklist | |
| 9 | Wattage | Numeric | |
| 10 | Voltage | Text | |
| 11 | Dimmable | Text | |
| 12 | Smart Home Compatible | Text | |
| 13 | Chain Length | Text | |
| 14 | Universal Fit | Text | |
| 15 | Energy Star | Text | |

---

### Pendant

**Category ID**: `a01aZ00000dC5EXQA0`  
**Family**: Indoor Lighting  
**Subcategory**: Ceiling Lighting  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Style (Modern, Industrial, Farmhouse, Globe, Drum) | Picklist | |
| 3 | Width/Diameter | Numeric | |
| 4 | Height (Fixture) | Numeric | |
| 5 | Adjustable Height | Numeric | |
| 6 | Number of Lights | Text | |
| 7 | Bulb Type | Picklist | |
| 8 | Finish/Color | Text | |
| 9 | Shade Material (Glass, Metal, Fabric) | Text | |
| 10 | Dimmable | Text | |
| 11 | Cord/Chain Length | Text | |
| 12 | Sloped Ceiling Compatible | Text | |
| 13 | Bulbs Included | Text | |
| 14 | Dry/Damp Rated | Text | |
| 15 | ETL/UL Listed | Text | |

---

### Post Light

**Category ID**: `a01aZ00000dC5EYQA0`  
**Family**: General  
**Subcategory**: General  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Wall Lantern, Post Light, Pathway, Flood, String) | Picklist | |
| 3 | Style (Traditional, Modern, Farmhouse, Coastal) | Picklist | |
| 4 | Width | Numeric | |
| 5 | Height | Numeric | |
| 6 | Number of Lights | Text | |
| 7 | Bulb Type | Picklist | |
| 8 | Max Wattage | Numeric | |
| 9 | Finish/Color | Text | |
| 10 | Material (Aluminum, Steel, Brass) | Text | |
| 11 | Weather Rating (Wet, Damp) | Text | |
| 12 | Motion Sensor | Text | |
| 13 | Dusk to Dawn | Text | |
| 14 | Solar Powered | Text | |
| 15 | Dark Sky Compliant | Text | |

---

### Recessed Lighting

**Category ID**: `a01aZ00000dC5EZQA0`  
**Family**: General  
**Subcategory**: Specialty Lighting  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Housing, Trim, Kit) | Picklist | |
| 3 | Size (4", 5", 6") | Text | |
| 4 | Housing Type (New Construction, Remodel, IC Rated) | Picklist | |
| 5 | Trim Style (Baffle, Reflector, Gimbal, Eyeball) | Picklist | |
| 6 | Bulb Type (LED, Incandescent, PAR) | Picklist | |
| 7 | Wattage | Numeric | |
| 8 | Finish/Color | Text | |
| 9 | Dimmable | Text | |
| 10 | Color Temperature | Text | |
| 11 | Lumens | Text | |
| 12 | Beam Angle | Text | |
| 13 | Airtight | Text | |
| 14 | Wet/Damp Rated | Text | |
| 15 | Title 24 Compliant | Text | |

---

### Step Lighting

**Category ID**: `a01aZ00000dC5EaQAK`  
**Family**: General  
**Subcategory**: Specialty Lighting  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Track and Rail Lighting

**Category ID**: `a01aZ00000dC5EbQAK`  
**Family**: General  
**Subcategory**: Specialty Lighting  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Track Kit, Track Head, Rail System, Monorail) | Picklist | |
| 3 | Track System (H, J, L, Proprietary) | Text | |
| 4 | Track Length | Text | |
| 5 | Number of Heads | Text | |
| 6 | Style (Modern, Industrial, Contemporary) | Picklist | |
| 7 | Bulb Type (LED, Halogen, PAR) | Picklist | |
| 8 | Max Wattage per Head | Numeric | |
| 9 | Finish | Text | |
| 10 | Adjustable/Pivoting | Text | |
| 11 | Dimmable | Text | |
| 12 | Connector Type | Picklist | |
| 13 | Ceiling Mount Type | Picklist | |
| 14 | Voltage (120V, 12V) | Text | |
| 15 | Flexible/Rigid | Text | |

---

### Under Cabinet Light

**Category ID**: `a01aZ00000dC5EcQAK`  
**Family**: General  
**Subcategory**: Specialty Lighting  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Island Pendant, Under Cabinet, Chandelier, Flush) | Picklist | |
| 3 | Style (Modern, Traditional, Farmhouse, Industrial) | Picklist | |
| 4 | Width/Length | Numeric | |
| 5 | Height | Numeric | |
| 6 | Number of Lights | Text | |
| 7 | Bulb Type (LED, Incandescent) | Picklist | |
| 8 | Max Wattage | Numeric | |
| 9 | Finish | Text | |
| 10 | Material (Glass, Metal, Wood) | Text | |
| 11 | Adjustable Height | Numeric | |
| 12 | Dimmable | Text | |
| 13 | Integrated LED | Text | |
| 14 | Color Temperature | Text | |
| 15 | Lumens | Text | |

---

### Vanity Lighting

**Category ID**: `a01aZ00000dC5EdQAK`  
**Family**: Bath  
**Subcategory**: Wall Lighting  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Style (Modern, Traditional, Transitional, Farmhouse) | Picklist | |
| 4 | Configuration (Single Sink, Double Sink) | Picklist | |
| 5 | Cabinet Material (Wood, MDF, Plywood) | Text | |
| 6 | Countertop Material (Marble, Quartz, Granite, Cultured Marble) | Text | |
| 7 | Sink Included | Text | |
| 8 | Faucet Included | Text | |
| 9 | Number of Drawers | Text | |
| 10 | Number of Doors | Text | |
| 11 | Soft-Close Hardware | Text | |
| 12 | Finish/Color | Text | |
| 13 | Mirror Included | Text | |
| 14 | Backsplash Included | Text | |
| 15 | Assembly Required | Text | |

---

### Wall Sconce

**Category ID**: `a01aZ00000dC5EeQAK`  
**Family**: General  
**Subcategory**: Wall Lighting  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Style (Modern, Traditional, Industrial, Art Deco) | Picklist | |
| 3 | Width | Numeric | |
| 4 | Height | Numeric | |
| 5 | Extension from Wall | Text | |
| 6 | Number of Lights | Text | |
| 7 | Bulb Type | Picklist | |
| 8 | Max Wattage | Numeric | |
| 9 | Finish/Color | Text | |
| 10 | Shade Material (Glass, Fabric, Metal) | Text | |
| 11 | Direction (Up, Down, Up/Down) | Text | |
| 12 | Dimmable | Text | |
| 13 | Hardwired/Plug-In | Text | |
| 14 | Dry/Damp/Wet Rated | Text | |
| 15 | ADA Compliant | Text | |

---

## Outdoor

**13 categories**

### Entry Set

**Category ID**: `a01aZ00000dCejjQAC`  
**Family**: Outdoor  
**Subcategory**: Outdoor  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Exterior Door

**Category ID**: `a01aZ00000dCejkQAC`  
**Family**: Outdoor  
**Subcategory**: Outdoor  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Fire Pit

**Category ID**: `a01aZ00000dCejmQAC`  
**Family**: Outdoor  
**Subcategory**: Outdoor  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Fire Pit, Fire Table, Outdoor Fireplace, Chiminea) | Picklist | |
| 3 | Fuel Type (Propane, Natural Gas, Wood, Gel) | Picklist | |
| 4 | Style (Modern, Traditional, Rustic) | Picklist | |
| 5 | Shape (Round, Square, Rectangular, Bowl) | Text | |
| 6 | Material (Steel, Stone, Concrete, Cast Iron) | Text | |
| 7 | Width/Diameter | Numeric | |
| 8 | Height | Numeric | |
| 9 | BTU Output | Numeric | |
| 10 | Ignition Type (Match-Lit, Electronic) | Picklist | |
| 11 | Includes Cover | Text | |
| 12 | Includes Glass Beads/Lava Rocks | Text | |
| 13 | CSA Certified | Text | |
| 14 | Wind Guard Included | Text | |
| 15 | Table Height | Numeric | |

---

### Fire Pit Accessory

**Category ID**: `a01aZ00000dCejlQAC`  
**Family**: Outdoor  
**Subcategory**: Outdoor  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Fire Pit, Fire Table, Outdoor Fireplace, Chiminea) | Picklist | |
| 3 | Fuel Type (Propane, Natural Gas, Wood, Gel) | Picklist | |
| 4 | Style (Modern, Traditional, Rustic) | Picklist | |
| 5 | Shape (Round, Square, Rectangular, Bowl) | Text | |
| 6 | Material (Steel, Stone, Concrete, Cast Iron) | Text | |
| 7 | Width/Diameter | Numeric | |
| 8 | Height | Numeric | |
| 9 | BTU Output | Numeric | |
| 10 | Ignition Type (Match-Lit, Electronic) | Picklist | |
| 11 | Includes Cover | Text | |
| 12 | Includes Glass Beads/Lava Rocks | Text | |
| 13 | CSA Certified | Text | |
| 14 | Wind Guard Included | Text | |
| 15 | Table Height | Numeric | |

---

### Garden Decor

**Category ID**: `a01aZ00000dCejnQAC`  
**Family**: Outdoor  
**Subcategory**: Outdoor  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Generator

**Category ID**: `a01aZ00000dCejoQAC`  
**Family**: Outdoor  
**Subcategory**: Outdoor Infrastructure  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Hardscaping

**Category ID**: `a01aZ00000dCejpQAC`  
**Family**: Outdoor  
**Subcategory**: Outdoor  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Mail Box

**Category ID**: `a01aZ00000dCejqQAC`  
**Family**: Outdoor  
**Subcategory**: Outdoor Infrastructure  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Outdoor Fireplace

**Category ID**: `a01aZ00000dCejsQAC`  
**Family**: Outdoor  
**Subcategory**: Outdoor  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Fire Pit, Fire Table, Outdoor Fireplace, Chiminea) | Picklist | |
| 3 | Fuel Type (Propane, Natural Gas, Wood, Gel) | Picklist | |
| 4 | Style (Modern, Traditional, Rustic) | Picklist | |
| 5 | Shape (Round, Square, Rectangular, Bowl) | Text | |
| 6 | Material (Steel, Stone, Concrete, Cast Iron) | Text | |
| 7 | Width/Diameter | Numeric | |
| 8 | Height | Numeric | |
| 9 | BTU Output | Numeric | |
| 10 | Ignition Type (Match-Lit, Electronic) | Picklist | |
| 11 | Includes Cover | Text | |
| 12 | Includes Glass Beads/Lava Rocks | Text | |
| 13 | CSA Certified | Text | |
| 14 | Wind Guard Included | Text | |
| 15 | Table Height | Numeric | |

---

### Outdoor Kitchen

**Category ID**: `a01aZ00000dCejuQAC`  
**Family**: Outdoor  
**Subcategory**: Outdoor  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Outdoor Lighting

**Category ID**: `NEEDS_SF_ID`  
**Family**: Outdoor  
**Subcategory**: Outdoor Lighting  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Wall Lantern, Post Light, Pathway, Flood, String) | Picklist | |
| 3 | Style (Traditional, Modern, Farmhouse, Coastal) | Picklist | |
| 4 | Width | Numeric | |
| 5 | Height | Numeric | |
| 6 | Number of Lights | Text | |
| 7 | Bulb Type | Picklist | |
| 8 | Max Wattage | Numeric | |
| 9 | Finish/Color | Text | |
| 10 | Material (Aluminum, Steel, Brass) | Text | |
| 11 | Weather Rating (Wet, Damp) | Text | |
| 12 | Motion Sensor | Text | |
| 13 | Dusk to Dawn | Text | |
| 14 | Solar Powered | Text | |
| 15 | Dark Sky Compliant | Text | |

---

### Outdoor Shower Faucet

**Category ID**: `a01aZ00000dCejwQAC`  
**Family**: Outdoor  
**Subcategory**: Outdoor  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Shower System, Shower Head, Hand Shower, Body Sprays) | Picklist | |
| 3 | Style (Rain, Waterfall, Multi-Function) | Picklist | |
| 4 | Finish | Text | |
| 5 | Material (Stainless Steel, Brass, Plastic) | Text | |
| 6 | Spray Patterns | Text | |
| 7 | Flow Rate (GPM) | Numeric | |
| 8 | Shower Head Size | Text | |
| 9 | Wall Mount / Ceiling Mount | Text | |
| 10 | Thermostatic | Text | |
| 11 | Pressure Balance | Text | |
| 12 | Diverter Included | Text | |
| 13 | Valve Included | Text | |
| 14 | Water Sense Certified | Text | |
| 15 | ADA Compliant | Text | |

---

### Storage Drawer/Door

**Category ID**: `a01aZ00000dEXvOQAW`  
**Family**: General  
**Subcategory**: General  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Refrigerator Drawer, Freezer Drawer, Microwave Drawer) | Picklist | |
| 3 | Width | Numeric | |
| 4 | Installation Type (Built-In, Under Counter) | Picklist | |
| 5 | Capacity | Numeric | |
| 6 | Temperature Range | Text | |
| 7 | Panel Ready | Text | |
| 8 | Finish/Color | Text | |
| 9 | Soft-Close | Text | |
| 10 | Touch Controls | Text | |
| 11 | Interior Lighting | Text | |
| 12 | Auto Open | Text | |
| 13 | Lock | Text | |
| 14 | Smart Features | Text | |
| 15 | ADA Compliant | Text | |

---

## Plumbing & Bath

**36 categories**

### Bar & Prep Sink

**Category ID**: `a01aZ00000dC5E2QAK`  
**Family**: Kitchen  
**Subcategory**: Sinks  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Depth | Numeric | |
| 4 | Material (Stainless Steel, Copper, Fireclay) | Text | |
| 5 | Mount Type (Undermount, Drop-In) | Picklist | |
| 6 | Number of Bowls | Text | |
| 7 | Bowl Depth | Numeric | |
| 8 | Faucet Holes | Text | |
| 9 | Drain Location | Text | |
| 10 | Finish/Color | Text | |
| 11 | Gauge (Stainless) | Text | |
| 12 | Sound Dampening | Text | |
| 13 | Grid Included | Text | |
| 14 | Accessories Included | Text | |
| 15 | Commercial Grade | Text | |

---

### Bar Faucet

**Category ID**: `a01aZ00000dC5E3QAK`  
**Family**: Kitchen  
**Subcategory**: Kitchen Faucets  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Style (Pull-Down, Standard, Prep) | Picklist | |
| 3 | Finish | Text | |
| 4 | Number of Handles | Text | |
| 5 | Spout Height | Numeric | |
| 6 | Spout Reach | Text | |
| 7 | Spray Function | Text | |
| 8 | Material | Text | |
| 9 | Installation Type (Single Hole) | Picklist | |
| 10 | Ceramic Disc Valve | Text | |
| 11 | Swivel Spout | Text | |
| 12 | Water Sense Certified | Text | |
| 13 | Deck Plate Included | Text | |
| 14 | Lead-Free | Text | |
| 15 | Commercial Grade | Text | |

---

### Bath Fan

**Category ID**: `a01aZ00000dC5DcQAK`  
**Family**: Bath  
**Subcategory**: Ventilation  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: CFM (CFM)
- **Standard Sizes**: 50, 80, 100, 110, 150, 200, 250, 300
- **Format**: "50-CFM"
- **Example**: 80-CFM
- **Rounding**: EXACT
- **Notes**: Code minimum ~1 CFM per sq ft of bathroom; USE EXACT manufacturer rating

**Top Filter Attributes**: Not configured

---

### Bathroom Faucet

**Category ID**: `a01aZ00000dC5DeQAK`  
**Family**: Bath  
**Subcategory**: Bathroom Faucets  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: GPM (GPM)
- **Standard Sizes**: 1.2, 1.5, 2.2
- **Format**: "1.2-GPM"
- **Example**: 1.5-GPM
- **Rounding**: EXACT
- **Notes**: Flow rate; WaterSense regulated; USE EXACT manufacturer rating

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Style (Widespread, Centerset, Single Hole, Wall Mount) | Picklist | |
| 3 | Finish | Text | |
| 4 | Number of Handles | Text | |
| 5 | Spout Height | Numeric | |
| 6 | Spout Reach | Text | |
| 7 | Drain Assembly Included | Text | |
| 8 | Material | Text | |
| 9 | Hole Spacing | Text | |
| 10 | Touchless/Motion Sensor | Text | |
| 11 | Water Sense Certified | Text | |
| 12 | ADA Compliant | Text | |
| 13 | Commercial Grade | Text | |
| 14 | Ceramic Disc Valve | Text | |
| 15 | Lead-Free | Text | |

---

### Bathroom Hardware and Accessories

**Category ID**: `a01aZ00000dC5DfQAK`  
**Family**: Bath  
**Subcategory**: Bathroom Accessories  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Towel Bar, Towel Ring, Robe Hook, TP Holder, Shelf) | Picklist | |
| 3 | Finish | Text | |
| 4 | Material (Brass, Stainless Steel, Zinc) | Text | |
| 5 | Length/Size | Text | |
| 6 | Mounting Type (Wall Mount, Surface Mount) | Picklist | |
| 7 | Style (Modern, Traditional, Transitional) | Picklist | |
| 8 | Hardware Included | Text | |
| 9 | Collection Name | Text | |
| 10 | ADA Compliant | Text | |
| 11 | Rust Resistant | Text | |
| 12 | Weight Capacity | Numeric | |
| 13 | Number of Hooks | Text | |
| 14 | Set Pieces | Text | |
| 15 | Concealed Mounting | Text | |

---

### Bathroom Lighting

**Category ID**: `a01aZ00000dC5DgQAK`  
**Family**: Bath  
**Subcategory**: Wall Lighting  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Vanity Light, Bath Bar, Sconce) | Picklist | |
| 3 | Style (Modern, Traditional, Transitional) | Picklist | |
| 4 | Width | Numeric | |
| 5 | Height | Numeric | |
| 6 | Extension from Wall | Text | |
| 7 | Number of Lights | Text | |
| 8 | Bulb Type (LED, Incandescent, Halogen) | Picklist | |
| 9 | Max Wattage | Numeric | |
| 10 | Finish (Chrome, Nickel, Bronze, Brass) | Text | |
| 11 | Shade Material (Glass, Acrylic, Opal) | Text | |
| 12 | Shade Direction (Up, Down, Up/Down) | Text | |
| 13 | Dimmable | Text | |
| 14 | Damp/Wet Rated | Text | |
| 15 | ADA Compliant | Text | |

---

### Bathroom Mirror

**Category ID**: `a01aZ00000dC5DhQAK`  
**Family**: Bath  
**Subcategory**: Vanities & Mirrors  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Vanity Mirror, Medicine Cabinet, Lighted Mirror) | Picklist | |
| 3 | Shape (Rectangular, Round, Oval, Arch) | Text | |
| 4 | Style (Modern, Traditional, Transitional) | Picklist | |
| 5 | Width | Numeric | |
| 6 | Height | Numeric | |
| 7 | Frame Material | Text | |
| 8 | Frame Finish | Text | |
| 9 | Lighted (LED, Backlit, Front-Lit) | Text | |
| 10 | Color Temperature | Text | |
| 11 | Dimmable | Text | |
| 12 | Anti-Fog/Defogger | Text | |
| 13 | Magnification Section | Text | |
| 14 | Touch Controls | Text | |
| 15 | Outlet/USB Included | Text | |

---

### Bathroom Sink

**Category ID**: `a01aZ00000dC5DiQAK`  
**Family**: Bath  
**Subcategory**: Sinks  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Depth | Numeric | |
| 4 | Style (Pedestal, Vessel, Undermount, Drop-In, Wall-Mount) | Picklist | |
| 5 | Material (Vitreous China, Porcelain, Stone, Glass) | Text | |
| 6 | Shape (Rectangular, Oval, Round, Square) | Text | |
| 7 | Faucet Holes (Single, Widespread, None) | Text | |
| 8 | Overflow | Text | |
| 9 | Finish/Color | Text | |
| 10 | ADA Compliant | Text | |
| 11 | Commercial Grade | Text | |
| 12 | Drain Included | Text | |
| 13 | Console Legs Included | Text | |
| 14 | Semi-Recessed | Text | |
| 15 | Integrated Countertop | Text | |

---

### Bathroom Vanity

**Category ID**: `a01aZ00000dC5DjQAK`  
**Family**: Bath  
**Subcategory**: Vanities & Mirrors  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Width (inches)
- **Standard Sizes**: 18, 20, 24, 30, 36, 42, 48, 60, 72, 80, 84, 96
- **Format**: "18-Inch"
- **Example**: 20-Inch
- **Rounding**: NEAREST
- **Notes**: Cabinet width; single sink ≤48", double sink 60"+

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Style (Modern, Traditional, Transitional, Farmhouse) | Picklist | |
| 4 | Configuration (Single Sink, Double Sink) | Picklist | |
| 5 | Cabinet Material (Wood, MDF, Plywood) | Text | |
| 6 | Countertop Material (Marble, Quartz, Granite, Cultured Marble) | Text | |
| 7 | Sink Included | Text | |
| 8 | Faucet Included | Text | |
| 9 | Number of Drawers | Text | |
| 10 | Number of Doors | Text | |
| 11 | Soft-Close Hardware | Text | |
| 12 | Finish/Color | Text | |
| 13 | Mirror Included | Text | |
| 14 | Backsplash Included | Text | |
| 15 | Assembly Required | Text | |

---

### Bathtub

**Category ID**: `a01aZ00000dC5DlQAK`  
**Family**: Bath  
**Subcategory**: Bathtubs  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Length (inches)
- **Standard Sizes**: 48, 54, 60, 66, 67, 72
- **Format**: "48-Inch"
- **Example**: 54-Inch
- **Rounding**: NEAREST
- **Notes**: Alcove standard is 60"; freestanding ranges 54-72"

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Style (Freestanding, Alcove, Drop-In, Corner, Walk-In) | Picklist | |
| 3 | Material (Acrylic, Cast Iron, Fiberglass, Stone Resin) | Text | |
| 4 | Length | Text | |
| 5 | Width | Numeric | |
| 6 | Depth | Numeric | |
| 7 | Soaking Depth | Numeric | |
| 8 | Finish/Color | Text | |
| 9 | Drain Location (Left, Right, Center) | Text | |
| 10 | Whirlpool Jets | Text | |
| 11 | Air Jets | Text | |
| 12 | Heated Surface | Text | |
| 13 | Chromatherapy | Text | |
| 14 | Overflow | Text | |
| 15 | ADA Compliant | Text | |

---

### Bathtub Waste & Overflow

**Category ID**: `a01aZ00000dC5DkQAK`  
**Family**: Bath  
**Subcategory**: Bath  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Cable Driven, Lift & Turn, Push-Pull, Toe-Tap) | Picklist | |
| 3 | Finish | Text | |
| 4 | Material (Brass, PVC, ABS) | Text | |
| 5 | Drain Size | Text | |
| 6 | Drain Length | Text | |
| 7 | Overflow Style (Traditional, Contemporary) | Picklist | |
| 8 | Adjustable | Text | |
| 9 | For Bathtub Type (Alcove, Freestanding, Drop-In) | Picklist | |
| 10 | Test Kit Included | Text | |
| 11 | Hair Catcher | Text | |
| 12 | Lead-Free | Text | |
| 13 | Code Compliant | Text | |
| 14 | Easy Install | Text | |
| 15 | Universal Fit | Text | |

---

### Bidet

**Category ID**: `a01aZ00000dC5DoQAK`  
**Family**: Bath  
**Subcategory**: Toilets & Bidets  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Standalone, Bidet Seat, Bidet Attachment) | Picklist | |
| 3 | Style (Floor Mount, Wall Mount) | Picklist | |
| 4 | Material (Vitreous China, Porcelain) | Text | |
| 5 | Heated Seat | Text | |
| 6 | Water Temperature Control | Text | |
| 7 | Spray Adjustability | Text | |
| 8 | Air Dryer | Text | |
| 9 | Night Light | Text | |
| 10 | Remote Control | Text | |
| 11 | Self-Cleaning Nozzle | Text | |
| 12 | Soft Close Seat | Text | |
| 13 | Width | Numeric | |
| 14 | Depth | Numeric | |
| 15 | ADA Compliant | Text | |

---

### Bidet Seat

**Category ID**: `a01aZ00000dC5DnQAK`  
**Family**: Bath  
**Subcategory**: Toilets & Bidets  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Standalone, Bidet Seat, Bidet Attachment) | Picklist | |
| 3 | Style (Floor Mount, Wall Mount) | Picklist | |
| 4 | Material (Vitreous China, Porcelain) | Text | |
| 5 | Heated Seat | Text | |
| 6 | Water Temperature Control | Text | |
| 7 | Spray Adjustability | Text | |
| 8 | Air Dryer | Text | |
| 9 | Night Light | Text | |
| 10 | Remote Control | Text | |
| 11 | Self-Cleaning Nozzle | Text | |
| 12 | Soft Close Seat | Text | |
| 13 | Width | Numeric | |
| 14 | Depth | Numeric | |
| 15 | ADA Compliant | Text | |

---

### Cabinet Hardware

**Category ID**: `a01aZ00000dC5E4QAK`  
**Family**: Home Improvement  
**Subcategory**: Hardware  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Knob, Pull, Handle, Cup Pull) | Picklist | |
| 3 | Style (Modern, Traditional, Transitional, Farmhouse) | Picklist | |
| 4 | Finish (Brass, Nickel, Chrome, Bronze, Black) | Text | |
| 5 | Material (Zinc, Steel, Brass, Aluminum) | Text | |
| 6 | Length/Diameter | Text | |
| 7 | Center-to-Center (for Pulls) | Text | |
| 8 | Projection | Text | |
| 9 | Width | Numeric | |
| 10 | Mounting Hardware Included | Text | |
| 11 | For Cabinet Type (Kitchen, Bath, Furniture) | Picklist | |
| 12 | Set Quantity | Text | |
| 13 | Soft-Close Compatible | Text | |
| 14 | Weight Capacity | Numeric | |
| 15 | ADA Compliant | Text | |

---

### Garbage Disposal

**Category ID**: `a01aZ00000dC5E6QAK`  
**Family**: Kitchen  
**Subcategory**: Kitchen  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Horsepower (HP) | Text | |
| 3 | Feed Type (Continuous, Batch) | Picklist | |
| 4 | Motor Type (Induction, Permanent Magnet) | Picklist | |
| 5 | Grinding System (Stainless Steel, Galvanized) | Text | |
| 6 | Noise Level (dB) | Text | |
| 7 | Sound Insulation | Text | |
| 8 | Auto-Reverse/Jam-Sensor | Text | |
| 9 | Dishwasher Connection | Text | |
| 10 | Power Cord Included | Text | |
| 11 | Mounting Type | Picklist | |
| 12 | Warranty (Years) | Text | |
| 13 | Septic Safe | Text | |
| 14 | Reset Button | Text | |
| 15 | Splash Guard Included | Text | |

---

### Kitchen Accessory

**Category ID**: `a01aZ00000dC5E8QAK`  
**Family**: Kitchen  
**Subcategory**: Kitchen  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Soap Dispenser, Paper Towel Holder, Utensil Holder) | Picklist | |
| 3 | Material (Stainless Steel, Ceramic, Plastic) | Text | |
| 4 | Finish | Text | |
| 5 | Color | Text | |
| 6 | Style (Modern, Traditional, Farmhouse) | Picklist | |
| 7 | Dimensions | Text | |
| 8 | Capacity | Numeric | |
| 9 | Mounting Type (Countertop, Wall, Under Cabinet) | Picklist | |
| 10 | Dishwasher Safe | Text | |
| 11 | BPA Free | Text | |
| 12 | Matching Set Available | Text | |
| 13 | Refillable | Text | |
| 14 | Rust Resistant | Text | |
| 15 | Non-Slip Base | Text | |

---

### Kitchen Faucet

**Category ID**: `a01aZ00000dC5E9QAK`  
**Family**: Kitchen  
**Subcategory**: Kitchen Faucets  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: GPM (GPM)
- **Standard Sizes**: 1.5, 1.8, 2.2
- **Format**: "1.5-GPM"
- **Example**: 1.8-GPM
- **Rounding**: EXACT
- **Notes**: Flow rate; WaterSense regulated; USE EXACT manufacturer rating

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Style (Pull-Down, Pull-Out, Bridge, Pot Filler, Standard) | Picklist | |
| 3 | Finish | Text | |
| 4 | Number of Handles (Single, Double) | Text | |
| 5 | Spout Height | Numeric | |
| 6 | Spout Reach | Text | |
| 7 | Spray Function (Stream, Spray, Pause) | Text | |
| 8 | Touchless/Motion Sensor | Text | |
| 9 | Material | Text | |
| 10 | Deck Plate Included | Text | |
| 11 | Installation Type (Single Hole, 3-Hole) | Picklist | |
| 12 | Ceramic Disc Valve | Text | |
| 13 | Water Sense Certified | Text | |
| 14 | Soap Dispenser Included | Text | |
| 15 | Side Sprayer Included | Text | |

---

### Kitchen Furniture and Decor

**Category ID**: `a01aZ00000dC5EAQA0`  
**Family**: Kitchen  
**Subcategory**: Kitchen  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Table, Chair, Sofa, Cabinet, Shelf) | Picklist | |
| 3 | Style (Modern, Traditional, Mid-Century, Farmhouse) | Picklist | |
| 4 | Room (Living, Bedroom, Dining, Office) | Text | |
| 5 | Material (Wood, Metal, Upholstered, Glass) | Text | |
| 6 | Width | Numeric | |
| 7 | Height | Numeric | |
| 8 | Depth | Numeric | |
| 9 | Color/Finish | Text | |
| 10 | Number of Pieces | Text | |
| 11 | Assembly Required | Text | |
| 12 | Weight Capacity | Numeric | |
| 13 | Storage Features | Text | |
| 14 | Indoor/Outdoor | Text | |
| 15 | Warranty | Text | |

---

### Kitchen Sink

**Category ID**: `a01aZ00000dC5EDQA0`  
**Family**: Kitchen  
**Subcategory**: Sinks  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Width | Numeric | |
| 3 | Depth | Numeric | |
| 4 | Material (Stainless Steel, Fireclay, Granite Composite, Cast Iron) | Text | |
| 5 | Configuration (Single Bowl, Double Bowl, Triple Bowl) | Picklist | |
| 6 | Mount Type (Undermount, Drop-In, Farmhouse/Apron) | Picklist | |
| 7 | Number of Faucet Holes | Text | |
| 8 | Bowl Depth | Numeric | |
| 9 | Drain Location | Text | |
| 10 | Finish/Color | Text | |
| 11 | Sound Dampening | Text | |
| 12 | Accessories Included | Text | |
| 13 | Gauge (Stainless) | Text | |
| 14 | Grid Included | Text | |
| 15 | ADA Compliant | Text | |

---

### Kitchen Storage & Organization

**Category ID**: `a01aZ00000dC5EEQA0`  
**Family**: Kitchen  
**Subcategory**: Kitchen  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Soap Dispenser, Paper Towel Holder, Utensil Holder) | Picklist | |
| 3 | Material (Stainless Steel, Ceramic, Plastic) | Text | |
| 4 | Finish | Text | |
| 5 | Color | Text | |
| 6 | Style (Modern, Traditional, Farmhouse) | Picklist | |
| 7 | Dimensions | Text | |
| 8 | Capacity | Numeric | |
| 9 | Mounting Type (Countertop, Wall, Under Cabinet) | Picklist | |
| 10 | Dishwasher Safe | Text | |
| 11 | BPA Free | Text | |
| 12 | Matching Set Available | Text | |
| 13 | Refillable | Text | |
| 14 | Rust Resistant | Text | |
| 15 | Non-Slip Base | Text | |

---

### Medicine Cabinet

**Category ID**: `a01aZ00000dC5DqQAK`  
**Family**: Bath  
**Subcategory**: Vanities & Mirrors  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Vanity Mirror, Medicine Cabinet, Lighted Mirror) | Picklist | |
| 3 | Shape (Rectangular, Round, Oval, Arch) | Text | |
| 4 | Style (Modern, Traditional, Transitional) | Picklist | |
| 5 | Width | Numeric | |
| 6 | Height | Numeric | |
| 7 | Frame Material | Text | |
| 8 | Frame Finish | Text | |
| 9 | Lighted (LED, Backlit, Front-Lit) | Text | |
| 10 | Color Temperature | Text | |
| 11 | Dimmable | Text | |
| 12 | Anti-Fog/Defogger | Text | |
| 13 | Magnification Section | Text | |
| 14 | Touch Controls | Text | |
| 15 | Outlet/USB Included | Text | |

---

### Pipe Fitting

**Category ID**: `a01aZ00000eF8O3QAK`  
**Family**: General  
**Subcategory**: Plumbing Parts & Fittings  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Pot Filler Faucet

**Category ID**: `a01aZ00000dC5EHQA0`  
**Family**: Kitchen  
**Subcategory**: Kitchen Faucets  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Style (Pull-Down, Pull-Out, Bridge, Pot Filler, Standard) | Picklist | |
| 3 | Finish | Text | |
| 4 | Number of Handles (Single, Double) | Text | |
| 5 | Spout Height | Numeric | |
| 6 | Spout Reach | Text | |
| 7 | Spray Function (Stream, Spray, Pause) | Text | |
| 8 | Touchless/Motion Sensor | Text | |
| 9 | Material | Text | |
| 10 | Deck Plate Included | Text | |
| 11 | Installation Type (Single Hole, 3-Hole) | Picklist | |
| 12 | Ceramic Disc Valve | Text | |
| 13 | Water Sense Certified | Text | |
| 14 | Soap Dispenser Included | Text | |
| 15 | Side Sprayer Included | Text | |

---

### Pressure Valve

**Category ID**: `a01aZ00000jncNIQAY`  
**Family**: Plumbing & Bath  
**Subcategory**: N/A  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Rough-In Valve

**Category ID**: `a01aZ00000dC5DrQAK`  
**Family**: Bath  
**Subcategory**: Plumbing Parts & Fittings  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Valve Type (Pressure Balance, Thermostatic, Transfer) | Picklist | |
| 3 | Number of Functions | Text | |
| 4 | Inlet Size | Text | |
| 5 | Outlet Size | Text | |
| 6 | Connection Type (Threaded, Sweat, PEX, CPVC) | Picklist | |
| 7 | Integral Stops | Text | |
| 8 | Check Valves Included | Text | |
| 9 | Volume Control | Text | |
| 10 | Max Flow Rate (GPM) | Numeric | |
| 11 | For Use With (Shower, Tub, Tub/Shower) | Text | |
| 12 | Cold Expansion PEX Compatible | Text | |
| 13 | Universal Fit | Text | |
| 14 | Code Compliant | Text | |
| 15 | Lead-Free | Text | |

---

### Shower

**Category ID**: `a01aZ00000dC5DuQAK`  
**Family**: Bath  
**Subcategory**: Shower Components  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Shower System, Shower Head, Hand Shower, Body Sprays) | Picklist | |
| 3 | Style (Rain, Waterfall, Multi-Function) | Picklist | |
| 4 | Finish | Text | |
| 5 | Material (Stainless Steel, Brass, Plastic) | Text | |
| 6 | Spray Patterns | Text | |
| 7 | Flow Rate (GPM) | Numeric | |
| 8 | Shower Head Size | Text | |
| 9 | Wall Mount / Ceiling Mount | Text | |
| 10 | Thermostatic | Text | |
| 11 | Pressure Balance | Text | |
| 12 | Diverter Included | Text | |
| 13 | Valve Included | Text | |
| 14 | Water Sense Certified | Text | |
| 15 | ADA Compliant | Text | |

---

### Shower Accessory

**Category ID**: `a01aZ00000dC5DsQAK`  
**Family**: Plumbing & Bath  
**Subcategory**: N/A  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Shower System, Shower Head, Hand Shower, Body Sprays) | Picklist | |
| 3 | Style (Rain, Waterfall, Multi-Function) | Picklist | |
| 4 | Finish | Text | |
| 5 | Material (Stainless Steel, Brass, Plastic) | Text | |
| 6 | Spray Patterns | Text | |
| 7 | Flow Rate (GPM) | Numeric | |
| 8 | Shower Head Size | Text | |
| 9 | Wall Mount / Ceiling Mount | Text | |
| 10 | Thermostatic | Text | |
| 11 | Pressure Balance | Text | |
| 12 | Diverter Included | Text | |
| 13 | Valve Included | Text | |
| 14 | Water Sense Certified | Text | |
| 15 | ADA Compliant | Text | |

---

### Shower Faucet

**Category ID**: `a01aZ00000dC5DtQAK`  
**Family**: Bath  
**Subcategory**: Tub & Shower Faucets  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Shower System, Shower Head, Hand Shower, Body Sprays) | Picklist | |
| 3 | Style (Rain, Waterfall, Multi-Function) | Picklist | |
| 4 | Finish | Text | |
| 5 | Material (Stainless Steel, Brass, Plastic) | Text | |
| 6 | Spray Patterns | Text | |
| 7 | Flow Rate (GPM) | Numeric | |
| 8 | Shower Head Size | Text | |
| 9 | Wall Mount / Ceiling Mount | Text | |
| 10 | Thermostatic | Text | |
| 11 | Pressure Balance | Text | |
| 12 | Diverter Included | Text | |
| 13 | Valve Included | Text | |
| 14 | Water Sense Certified | Text | |
| 15 | ADA Compliant | Text | |

---

### Steam Shower

**Category ID**: `a01aZ00000dC5DvQAK`  
**Family**: Bath  
**Subcategory**: Shower Components  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Shower System, Shower Head, Hand Shower, Body Sprays) | Picklist | |
| 3 | Style (Rain, Waterfall, Multi-Function) | Picklist | |
| 4 | Finish | Text | |
| 5 | Material (Stainless Steel, Brass, Plastic) | Text | |
| 6 | Spray Patterns | Text | |
| 7 | Flow Rate (GPM) | Numeric | |
| 8 | Shower Head Size | Text | |
| 9 | Wall Mount / Ceiling Mount | Text | |
| 10 | Thermostatic | Text | |
| 11 | Pressure Balance | Text | |
| 12 | Diverter Included | Text | |
| 13 | Valve Included | Text | |
| 14 | Water Sense Certified | Text | |
| 15 | ADA Compliant | Text | |

---

### Tankless Water Heater

**Category ID**: `a01aZ00000dC5DwQAK`  
**Family**: General  
**Subcategory**: Water Heaters  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ✅ Yes
- **Field**: `AI_Product_Filter_Class`
- **Dimension**: Flow Rate (GPM)
- **Standard Sizes**: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
- **Format**: "2-GPM"
- **Example**: 3-GPM
- **Rounding**: EXACT
- **Notes**: Gallons per minute at specified temp rise; USE EXACT manufacturer rating

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Tank, Tankless, Heat Pump, Solar) | Picklist | |
| 3 | Fuel Type (Electric, Gas, Propane) | Picklist | |
| 4 | Tank Capacity (Gallons) | Numeric | |
| 5 | First Hour Rating (FHR) | Text | |
| 6 | Energy Factor (UEF) | Text | |
| 7 | GPM (for Tankless) | Numeric | |
| 8 | BTU Input | Numeric | |
| 9 | Recovery Rate (GPH) | Text | |
| 10 | Dimensions (H x W x D) | Text | |
| 11 | Venting Type (Direct, Power, Atmospheric) | Picklist | |
| 12 | Wi-Fi/Smart Enabled | Text | |
| 13 | Warranty (Tank/Parts) | Text | |
| 14 | Energy Star Certified | Text | |
| 15 | Installation Type (Residential, Commercial) | Picklist | |

---

### Toilet

**Category ID**: `a01aZ00000dC5DyQAK`  
**Family**: Bath  
**Subcategory**: Toilets & Bidets  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Configuration (One-Piece, Two-Piece, Wall-Hung) | Picklist | |
| 3 | Bowl Shape (Elongated, Round, Compact Elongated) | Text | |
| 4 | Flush Type (Single Flush, Dual Flush, Touchless) | Picklist | |
| 5 | Gallons Per Flush | Text | |
| 6 | Rough-In Size | Text | |
| 7 | Height (Standard, Comfort/ADA) | Numeric | |
| 8 | Finish/Color | Text | |
| 9 | Seat Included | Text | |
| 10 | Bidet Features | Text | |
| 11 | Heated Seat | Text | |
| 12 | Water Sense Certified | Text | |
| 13 | ADA Compliant | Text | |
| 14 | Trapway (Concealed, Exposed) | Text | |
| 15 | Soft Close Seat | Text | |

---

### Toilet Seat

**Category ID**: `a01aZ00000dC5DxQAK`  
**Family**: Bath  
**Subcategory**: Toilets & Bidets  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Configuration (One-Piece, Two-Piece, Wall-Hung) | Picklist | |
| 3 | Bowl Shape (Elongated, Round, Compact Elongated) | Text | |
| 4 | Flush Type (Single Flush, Dual Flush, Touchless) | Picklist | |
| 5 | Gallons Per Flush | Text | |
| 6 | Rough-In Size | Text | |
| 7 | Height (Standard, Comfort/ADA) | Numeric | |
| 8 | Finish/Color | Text | |
| 9 | Seat Included | Text | |
| 10 | Bidet Features | Text | |
| 11 | Heated Seat | Text | |
| 12 | Water Sense Certified | Text | |
| 13 | ADA Compliant | Text | |
| 14 | Trapway (Concealed, Exposed) | Text | |
| 15 | Soft Close Seat | Text | |

---

### Tub and Shower Accessory

**Category ID**: `a01aZ00000dDnKlQAK`  
**Family**: Plumbing & Bath  
**Subcategory**: N/A  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Style (Freestanding, Alcove, Drop-In, Corner, Walk-In) | Picklist | |
| 3 | Material (Acrylic, Cast Iron, Fiberglass, Stone Resin) | Text | |
| 4 | Length | Text | |
| 5 | Width | Numeric | |
| 6 | Depth | Numeric | |
| 7 | Soaking Depth | Numeric | |
| 8 | Finish/Color | Text | |
| 9 | Drain Location (Left, Right, Center) | Text | |
| 10 | Whirlpool Jets | Text | |
| 11 | Air Jets | Text | |
| 12 | Heated Surface | Text | |
| 13 | Chromatherapy | Text | |
| 14 | Overflow | Text | |
| 15 | ADA Compliant | Text | |

---

### Tub Faucet

**Category ID**: `a01aZ00000dC5DzQAK`  
**Family**: Bath  
**Subcategory**: Tub & Shower Faucets  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Style (Freestanding, Wall Mount, Deck Mount, Roman) | Picklist | |
| 3 | Finish | Text | |
| 4 | Number of Handles | Text | |
| 5 | Hand Shower Included | Text | |
| 6 | Material | Text | |
| 7 | Spout Reach | Text | |
| 8 | Spout Height | Numeric | |
| 9 | Flow Rate (GPM) | Numeric | |
| 10 | Ceramic Disc Valve | Text | |
| 11 | Diverter | Text | |
| 12 | Supply Lines Included | Text | |
| 13 | Rough-In Valve Included | Text | |
| 14 | ADA Compliant | Text | |
| 15 | Commercial Grade | Text | |

---

### Urinal

**Category ID**: `a01aZ00000dC5E0QAK`  
**Family**: Bath  
**Subcategory**: Toilets & Bidets  
**Styles Apply**: ✅ Yes  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes**: Not configured

---

### Water Filtration

**Category ID**: `a01aZ00000dC5EJQA0`  
**Family**: Kitchen  
**Subcategory**: Water Treatment  
**Styles Apply**: ❌ No  

**Types**: None specified

**Size Class Filter**: ❌ No standard size classes

**Top Filter Attributes (15)**:

| Rank | Attribute Name | Type | Notes |
|------|----------------|------|-------|
| 1 | Brand | Text | |
| 2 | Type (Under Sink, Whole House, Countertop, Pitcher) | Picklist | |
| 3 | Filtration Method (Carbon, RO, UV, Sediment) | Text | |
| 4 | Stages | Text | |
| 5 | Capacity (Gallons) | Numeric | |
| 6 | Filter Life (Months/Gallons) | Text | |
| 7 | Flow Rate (GPM) | Numeric | |
| 8 | Contaminants Removed | Text | |
| 9 | NSF Certification | Text | |
| 10 | Installation Type | Picklist | |
| 11 | Faucet Included | Text | |
| 12 | Tank Size | Text | |
| 13 | Dimensions | Text | |
| 14 | Replacement Filter Model | Text | |
| 15 | Warranty | Text | |

---

## Appendix A: Complete Brand List

**385 brands available**

### A

- A AMERICA
- A and E Bath and Shower
- ABS
- ACO
- AERIN
- ALFA
- ALFRESCO
- ALLEGRI
- ALORA LIGHTING
- AMANA
- AMERICAN STANDARD
- ANZZI
- AO Smith
- AQUABRASS
- AQUARIUS BATHWARE
- AQUATICA
- AQUEON
- ARIEL
- ARTCRAFT
- ARTISAN
- ASI
- ASKO
- ATLAS
- AVALLON
- AVANTI
- AXOR
- AZURE
- Alamont Furniture
- Alno
- American Lighting
- Anthony California

### B

- BALDWIN
- BEAUTIFUL
- BEKO
- BELWITH KEELER
- BERTAZZONI
- BEST
- BEST RANGE HOODS
- BLAZE
- BLUESTAR
- BOBRICK
- BOSCH
- BRAMEC
- BREEZARY
- BRIGADE
- BRIZO
- BROAN
- BULBRITE
- BUTLER SPECIALTY COMPANY
- Bassett Furniture
- Blanco
- Bradford White

### C

- CAFE
- CALIFORNIA FAUCETS
- CAPITAL
- CAPITAL LIGHTING FIXTURE COMPANY
- CASABLANCA
- CELLARPRO
- CHARLOTTE PIPE AND FOUNDRY CO
- CHEF
- CHEVIOT
- COHEN
- COMMERCIAL ELECTRIC
- CORBETT LIGHTING
- CORNING
- COVE
- COYOTE
- CRAFT + MAIN
- CRYSTORAMA
- Carrier
- Celadon Art
- Century Furniture
- Chaddock
- Craftmade
- Crouse-Hinds
- Cyan Design

### D

- DACOR
- DALS Lighting
- DANBY
- DCS Appliances
- DCS by FISHER &amp; PAYKEL
- DEFINITIVE TECHNOLOGY
- DELTA
- DESIGNERS FOUNTAIN
- DEWENWILS
- DORNBRACHT
- DURAVIT
- DXV
- Delacora
- Dynamic Rugs

### E

- ECHELON
- EDGESTAR
- EGLO
- ELECTROLUX
- ELEGANT LIGHTING
- ELICA
- ELK
- ELKAY
- EMTEK
- ET2
- EUROFASE LIGHTING
- EVO
- EZ-FLO
- Ebbe America
- Elan

### F

- FABER
- FALMEC
- FANIMATION
- FANTINI
- FEIT ELECTRIC
- FISHER & PAYKEL
- FRANKE
- FRIGIDAIRE
- FULGOR MILANO
- FUTURO FUTURO
- First Supply
- First Watch
- Fortis
- Fredrick Ramond
- Fresca Bath

### G

- GAGGENAU
- GALANZ
- GE
- GEBERIT
- GENERATION LIGHTING
- GEORGE KOVACS
- GERBER
- GOLDEN LIGHTING
- GOOGLE
- GRAFF
- Gatco
- General Wire
- Gessi
- Grandeur

### H

- HAIER
- HALO
- HAMILTON BEACH
- HAMPTON BAY
- HEAT GRILLS
- HEATH ZENITH
- HERCULESS
- HESTAN
- HICKORY HARDWARE
- HINKLEY
- HISENSE
- HOME DECORATORS COLLECTION
- HOME REFINEMENTS BY JULIEN
- HOMEROOTS
- HOSHIZAKI
- HOTPOINT
- HUBBARDTON FORGE
- HUDSON VALLEY
- HUNTER
- HYDROSYSTEMS
- Hancock and Moore
- Hooker Furniture
- hansgrohe

### I

- ICE-O-MATIC
- ICO Bath
- IMPERIAL
- IMPERIAL HOODS
- INSIGNIA
- INSINKERATOR
- Infinity Drain
- Innovations Lighting
- Interiors by Premier
- Isenberg

### J

- JACLO
- JACUZZI
- JAMES
- JAMES MARTIN VANITIES
- JAZAVA
- JEFFREY ALEXANDER
- JENNAIR
- JENSEN
- JONATHAN Y
- JONES STEPHENS CORP
- JUSHENG
- Jay R. Smith
- Joerger
- Justice Design Group

### K

- KAD
- KAISITE
- KALAMAZOO
- KALCO
- KALLISTA
- KARTNERS
- KENMORE
- KIAN
- KICHLER
- KINDRED
- KINGSTON
- KITCHENAID
- KOHLER
- KUZCO
- Kenyon
- Kraus
- Kwikset

### L

- LA CORNUE
- LANBO
- LANDMARK
- LANDSHAPES
- LEFROY BROOKS
- LG
- LIEBHERR
- LINKASINK
- LIVEX LIGHTING
- LIVING DISTRICT
- LYNX
- Lite Source
- Lochinvar

### M

- MAAX
- MAINSTAYS
- MALCO
- MANITOWOC
- MARQUIS
- MARVEL
- MATRIX
- MAXIM
- MAYTAG
- METROPOLITAN LIGHTING FIXTURE
- MIDEA
- MIDWEST FASTENER
- MIELE
- MIFAB
- MILANO
- MINKA LAVERY
- MISENO
- MODERN AIRE
- MODERN FORMS
- MODERN HABITAT
- MONOGRAM
- MONTE CARLO
- MOOG
- MR. STEAM
- MTI
- Madeli
- Mars
- Melissa & Doug
- Meridian
- Meyda Custom Lighting
- Meyda Tiffany
- Miami Tech
- Millennium Lighting
- Minka-Aire
- Moen
- Mountain Plumbing Products
- Mueller

### N

- NAMEEKS
- NAPOLEON
- NATIVE TRAILS
- NDS
- NEOREST
- NEWPORT BRASS
- NORDICTRACK
- NUVO LIGHTING
- Nest Home Collections

### O

- OAKS AURA
- OPTIMYST
- Oasis International

### P

- PALLISER
- PERLICK
- PERRIN & ROWE
- PHILLIPS COLLECTION
- PHYLRICH
- PITT
- PROFLO
- PROFORM
- PROGRESS LIGHTING
- Peerless
- PfISTER
- Preferred Bath Accessories
- Pulse

### Q

- QM Drain
- QUOIZEL
- QuARTz

### R

- REGINA ANDREW
- RENWIL
- REV-A-SHELF
- REZNOR
- RIOBEL
- ROBERN
- ROHL
- RRTYO
- Rangaire
- Rectorseal
- Rheem
- Royal Cabinets
- Rubbermaid
- Rug Factory Plus

### S

- SALTER LABS
- SAMSUNG
- SATCO
- SAVOY HOUSE
- SCARABEO
- SCOTSMAN
- SEDONA BY LyNX
- SHARP
- SIGNATURE HARDWARE
- SIGNATURE KITCHEN SUITE
- SILHOUETTE
- SKS
- SMEG
- SONANCE
- SONNEMAN
- SPEAKMAN
- SPEED QUEEN
- STERLING
- STRIEM
- STUDIO M
- SUB-ZERO
- SUMMIT
- SVOPES
- Safety Zone Water Systems
- Schluter Systems
- Sioux Chief
- Sloan
- Smith-Blair
- Snappy
- State Water Heaters
- Stern-Williams
- Strasser Woodenworks
- Swiss Madison
- Symmons

### T

- TCL
- TECH LIGHTING
- THE ROYAL STANDARD
- THERMADOR
- THERMASOL
- THG PARIS
- THOR KITCHEN
- TOSHIBA
- TOTO
- TRADE-WIND
- TRAEGER GRILLS
- TROY LIGHTING
- TRUE RESIDENTIAL
- TURBO AIR
- TapRite
- Tayse Rugs
- Terry Redlin
- Theodore Alexander
- Top Knobs
- Trans Ocean
- Troy Bilt
- Troy-Bilt

### U

- U-LINE
- UOLFIN
- US Motors
- United Weavers
- Uttermost

### V

- VARALUZ
- VAXCEL
- VCA
- VENT-A-HOOD
- VICTAULIC
- VICTORIA + ALBERT
- VIGO
- VIKING
- VISUAL COMFORT
- VOLA
- Viega
- Villeroy & Boch
- Visual Comfort Modern

### W

- WAC LIGHTING
- WATERMARK
- WATERSTONE
- WATERWORKS
- WATTS MUELLER STEAM SPECIALTY
- WHIRLPOOL
- WINIA
- WOLF
- WS BATH COLLECTIONS
- WYNDHAM COLLECTION
- Weld-On
- Westinghouse
- Wholesale Interiors
- Williams

### Y

- YHD
- Yardreeze
- Yosemite Home Decor

### Z

- Z-LITE
- ZEPHYR
- ZLINE
- Zurn

## Appendix B: Common Attribute Names

**945 total attributes**

Sample of frequently used attributes:

- Adjustable Color Temperature (`a1aaZ000008lz3YQAQ`)
- Back Left Burner BTU (`a1aaZ000008lz45QAA`)
- Back Middle Burner BTU (`a1aaZ000008lz47QAA`)
- Back Right Burner BTU (`a1aaZ000008lz49QAA`)
- Backplate Depth (`a1aaZ000008lz4BQAQ`)
- Backplate Height (`a1aaZ000008lz4DQAQ`)
- Backplate Width (`a1aaZ000008lz4FQAQ`)
- Backsplash Height (`a1aaZ000008lz4HQAQ`)
- Base Color (`a1aaZ000008lz4KQAQ`)
- Base Material (`a1aaZ000008lz4MQAQ`)
- Base Width (`a1aaZ000008lz4OQAQ`)
- Basin Depth (`a1aaZ000008lz4PQAQ`)
- Basin Depth (Center) (`a1aaZ000008lz4QQAQ`)
- Basin Depth (Left) (`a1aaZ000008lz4RQAQ`)
- Basin Depth (Right) (`a1aaZ000008lz4SQAQ`)
- Basin Width (`a1aaZ000008lz4ZQAQ`)
- Basin Width (Center) (`a1aaZ000008lz4aQAA`)
- Basin Width (Left) (`a1aaZ000008lz4bQAA`)
- Basin Width (Right) (`a1aaZ000008lz4cQAA`)
- Blade Finish (`a1aaZ000008lz4mQAA`)
- Bodyspray Flow Rate (GPM) (`a1aaZ000008lz4uQAA`)
- Bottle Capacity (12 oz.) (`a1aaZ000008lz4xQAA`)
- Bowl Height (`a1aaZ000008lz4zQAA`)
- BTU Cooling (`a1aaZ000008mBnqQAE`)
- BTU Output (`a1aaZ000008mBnrQAE`)
- Bulb Color (`a1aaZ000008mBnvQAE`)
- Cabinet Depth (`a1aaZ000008mBo3QAE`)
- Cabinet Height (`a1aaZ000008mBo6QAE`)
- Cabinet Material (`a1aaZ000008mBo7QAE`)
- Cabinet Width (`a1aaZ000008mBo8QAE`)
- Can Capacity (12 oz.) (`a1aaZ000008mBo9QAE`)
- Canopy Depth (`a1aaZ000008mBoAQAU`)
- Canopy Height (`a1aaZ000008mBoBQAU`)
- Canopy Width (`a1aaZ000008mBoCQAU`)
- Capacity (Gallons) (`a1aaZ000008mBoDQAU`)
- Capacity (oz.) (`a1aaZ000008mBoEQAU`)
- Capacity (Quantity) (`a1aaZ000008mBoFQAU`)
- Ceiling Height (Max) (`a1aaZ000008mBoIQAU`)
- Ceiling Height (Min) (`a1aaZ000008mBoJQAU`)
- CFM (High) (`a1aaZ000008mBoOQAU`)
- CFM (Low) (`a1aaZ000008mBoPQAU`)
- Color Rendering Index (CRI) (`a1aaZ000008mBoaQAE`)
- Color Temperature (`a1aaZ000008mBobQAE`)
- Control Panel Material (`a1aaZ000008mBomQAE`)
- Cooling Capacity (`a1aaZ000008mBosQAE`)
- Cord Color (`a1aaZ000008mBovQAE`)
- Counter Depth (`a1aaZ000008mBoyQAE`)
- Countertop Height (`a1aaZ000008mBozQAE`)
- Crystal Color (`a1aaZ000008mBp2QAE`)
- Cutout Depth (`a1aaZ000008mBp8QAE`)

<details>
<summary>View all 945 attributes</summary>

- 120 Degree F Inlet Water Capability
- 28 Degree Latch
- Accepts Deck Mount Faucet
- Accessory Type
- ADA
- Adjustable Color Temperature
- Adjustable Shelves
- Adjustable Thermostat
- Agitator
- AHRI Production
- Air Filter
- Air Filter Type
- Air Fry
- All Hardware and Components Included
- Annual Energy Consumption (kWh)
- Annual Operation Cost
- ANSI Certification
- Antimicrobial
- Aperture Size
- App Compatibility
- Application
- Apron Front
- Arm Rests Included
- Art Subject
- ASME Code
- ASSE Code
- Assembly Required
- Attic Size
- Auto Shut Off
- Auto Shut Off Time
- AutoFlush Included
- Automatic Defrost
- Automatic Door Closer
- Available Without Blower
- Average Hours
- Back Left Burner BTU
- Back Left Burner Watts
- Back Middle Burner BTU
- Back Middle Burner Watts
- Back Right Burner BTU
- Back Right Burner Watts
- Backplate Depth
- Backplate Diameter
- Backplate Height
- Backplate Included
- Backplate Width
- Backset
- Backsplash Height
- Backsplash Included
- Baking Element
- Base Color
- Base Diameter
- Base Material
- Base Style
- Base Width
- Basin Depth
- Basin Depth (Center)
- Basin Depth (Left)
- Basin Depth (Right)
- Basin Length
- Basin Length (Center)
- Basin Length (Left)
- Basin Length (Right)
- Basin Rack Included
- Basin Split
- Basin Width
- Basin Width (Center)
- Basin Width (Left)
- Basin Width (Right)
- Basket Strainer Included
- Battery Included
- Battery Operated
- Battery Quantity
- Battery Size
- Beam Spread
- Beer Line Included
- Bidet Seat Included
- Bi-Level
- Blade Finish
- Blade Length
- Blade Pitch
- Blade Span
- Blades Included
- Blades Sold Separately
- Blower
- Blower Type
- Bodyspray Flow Rate (GPM)
- Bodysprays Included
- Botanical Type
- Bottle Capacity (12 oz.)
- Bottle Filler Included
- Bowl Height
- Bowl Shape
- Bracket Included
- Breaker Needs
- Bridge Drawer Included
- Bridge Element
- Bridge Faucet
- Brizo Bathroom Technologies
- Broil Element
- BTU Cooling
- BTU Output
- Built-in Food Disposer
- Built-In Speakers
- Bulb Color
- Bulb Included
- Bulb Shape
- Bulb Visible
- Bulk Pack
- Burner Style
- CA Drought Compliant
- Cabinet Depth
- Cabinet Fit Size
- Cabinet Hardware Included
- Cabinet Height
- Cabinet Material
- Cabinet Width
- Can Capacity (12 oz.)
- Canopy Depth
- Canopy Height
- Canopy Width
- Capacity (Gallons)
- Capacity (oz.)
- Capacity (Quantity)
- CE Listed
- CEER Rating
- Ceiling Height (Max)
- Ceiling Height (Min)
- Center to Center
- Center to Center mm
- CFM (High)
- CFM (Low)
- Chain Length
- Chandelier Type
- Characteristics
- Chromatherapy
- Clawfoot Tub Filler
- Clear Ice
- Clock
- CO2 Tank Included
- Colander Included
- Color Rendering Index (CRI)
- Color Temperature
- Combination Oven
- Comes in Set
- Commercial Warranty
- Compaction Ratio
- Concealed Screws
- Concrete Slab Compatible
- Condenser Type
- Contains PFAS Chemicals
- Continuous Grates
- Control Panel Material
- Control Type
- Controller Included
- Convection
- Convertible to Ductless / Recirculating
- Cooling Area
- Cooling Capacity
- Cooling Type
- Cooling Unit
- Cord Color
- Cord Length
- Corner Sink
- Counter Depth
- Countertop Height
- Cross Bore
- Crystal Color
- Crystal Type
- CSA Code
- Cube Style
- Curb Location
- Cutlery Tray
- Cutout Depth
- Cutout Height
- Cutout Size
- Cutout Width
- Cutting Board Included
- Cylinder
- Cylinder Included
- Cylinder Type
- Daily Ice Production
- dB Rating
- Deadbolt Throw
- Decibel Rating
- Decor Location
- Decor Style
- Defrost Type
- Delta Monitor
- Delta Shower Series
- Delta Smart Solutions
- Depth (Dryer)
- Depth (Washer)
- Depth with Door
- Depth with Door Open
- Depth with Door Open (Washer)
- Depth with Handles
- Depth without Door
- Depth without Handles
- Design Features
- Detergent and Rinse-Aid Dispenser
- Device Compatibility
- Diameter
- Dishwasher Type
- Dispense Gas
- Dispense Liquid
- Dispenser Features
- Dispenser Type
- Display Type
- Diverter Included
- Diverter Location
- Door Features
- Door Swing
- Door Thickness
- Door Type
- Downdraft Ventilated
- Downrod Size(s)
- Downrod(s) Included
- Drain Assembly Included
- Drain Connection
- Drain Placement
- Drain Required
- Drain Type
- Drainboard
- Drawer Type
- Drive Type
- Drop Ell Included
- Drum Material
- Dryer Capacity
- Drying System
- Duct Discharge
- Duct Size
- Ductless
- Eco Friendly
- Edge Bore
- Electrical Outlet
- Electrical Phases
- Electronic
- End of Cycle Indicator
- Energy Efficiency (CFM / Watt)
- Energy Efficient
- Escutcheon Height
- Escutcheon Included
- Escutcheon Shape
- Escutcheon Width
- Exhaust Duct
- Experience
- Exposed Installation
- Exterior Height
- Exterior Width
- Fabric Features
- Fan Blade Material
- Fan Speeds
- Farmhouse
- Faucet Centers
- Faucet Hole Size
- Faucet Holes
- Faucet Included
- Faucet Mounting Type
- Faucet Type
- Faucet Width
- Feed Type
- Field Cuttable
- Filter Type
- Filtered
- Filtering
- Fingerprint Resistant
- Finished Back
- Fire Rated
- Fixture Shape
- Flow Rate
- Flow Rate (GPM)
- Flow Rate/GPM (at Max PSI)
- Flush Technology
- Flush Type
- Flushometer Included
- Forced Air System
- Frame Color
- Frame Material
- Frame Type
- Freeze Resistant
- Freezer Capacity
- Frequency
- Front Left Burner BTU
- Front Left Burner Watts
- Front Loading
- Front Middle Burner BTU
- Front Middle Burner Watts
- Front Right Burner BTU
- Front Right Burner Watts
- Frost Free
- Fuel Type
- Full Backplate
- Function
- Gallons Per Flush
- Gas Lantern
- Gas Line Included
- Gas Type
- Glass Doors
- Glass Features
- Griddle
- Griddle BTU
- Grill
- Grille Finish
- Grille Length
- Grille Shape
- Grille Width
- H2Okinetic
- Handcrafted
- Handing
- Handle Design
- Handle Height
- Handle Length
- Handle Material
- Handle Projection
- Handle Style
- Handle Width
- Handles Included
- Hands Free
- Handshower
- Handshower Flow Rate
- Handshower Hose Included
- Handshower Included
- Hanging Options
- Hardscape Light Type
- HCO
- Heater Included
- Height (Dryer)
- Height (Washer)
- Height Above Cooktop
- Height Above Cooktop (Max)
- Height Above Cooktop (Min)
- Height to Top of Case
- Height to Top of Cook Top
- Height to Top of Door Hinge
- Hidden Drawers
- Hinge Center to Center
- Hole Size
- Horsepower
- Hose Included
- Hose Length
- Hot Surface Indicator Lights
- Housing Depth
- Housing Length
- Housing Shape
- Housing Type
- Housing Width
- Humidity Control
- Humidity Sensing
- IC Rating
- Ice Bin Included
- Ice Maker
- Ignition Type
- Illumatherapy
- Impeller
- Includes Drip Pan
- Includes Exposed Pipe Riser
- Includes Freezer
- Includes Glass Guard
- Includes Grinder
- Includes Receiver
- Includes Remote
- Includes Scoop
- Includes Supply Lines
- Includes Timer
- Includes Wine Rack
- Independently Rotating
- Induction
- Inlet Area
- Inlet Diameter
- Installation Hardware Included
- Integrated Diverter
- Integrated Volume Control
- Interchangeable Core
- Interior Depth
- Interior Height
- Interior Light
- Interior Material
- Interior Width
- Internal Ice Maker
- Jet Type
- Keg Style(s)
- Keyway
- Kilowatts
- Knob Shape
- Kohler Technologies
- kWh/100lbs Ice
- Lamp Base Material
- Lamp Style
- Latch Faceplate
- Lead Leaching Certified NSF/ANSI 61
- Length (Inside)
- Length mm
- Leveling Legs
- Lever Shape
- Light Direction
- Light Included
- Light Kit Compatible
- Light Kit Included
- Location Rating
- Lockable
- Locking Mechanism
- Low Ceiling Adaptable
- Low Lead Compliant
- LP Conversion
- Luxury Whirlpool
- Made of Solid Wood
- Magnetic Docking
- Manufacturer Warranty
- Marine Grade
- Max Capacity (Pounds)
- Max Deck Thickness
- Max Room Volume
- Max RPM
- Max Ventilation Area
- Maximum Adjustable Height
- Maximum Sones
- Meat Thermometer
- Medicine Cabinet Included
- Microwave Capacity
- Middle Burner BTU
- Middle Burner Watts
- Minimum Adjustable Height
- Minimum Cabinet Size
- Minimum Height
- Minimum Opening Depth
- Minimum Opening Height
- Minimum Opening Width
- Minimum Sones
- Mirror Features
- Mirror Front
- Mirror Included
- Mirror Shape
- Mirror Type
- Moen Technologies
- Motor Size
- Motor Type
- Mount Type
- Night Light
- No Load RPM
- Nominal Center to Center
- Nominal Depth
- Nominal Height
- Nominal Length
- Nominal Tub Length / Width
- Nominal Width
- Number of Bars
- Number Of Basins
- Number Of Bathers
- Number of Blades
- Number Of Bodysprays
- Number Of Burners
- Number of Circuits
- Number Of Doors
- Number of Draft Towers
- Number Of Drawers
- Number of Dry Cycles
- Number of Functions
- Number Of Handles
- Number Of Hidden Drawers
- Number of Jets
- Number of Kegs
- Number of Keys
- Number of Light Source(s)
- Number Of Lights
- Number of Options
- Number of pins
- Number of Racks
- Number of Rolls
- Number Of Shelves
- Number of Stations
- Number of Taps
- Number of Thresholds
- Number of Tiers
- Number of Tile Flanges
- Number of Wash Cycles
- Number of Zones
- Operating Temperature (Max)
- Optional Trim Kit
- Orientation
- Outdoor Approved
- Outlet Diameter
- Oven
- Oven Capacity
- Oven Capacity (Bottom)
- Oven Capacity (Top)
- Overall Height
- Overall Width
- Overflow Detector
- Overflow Height
- Panel Ready
- Panic Proof
- Pause Control
- Pedestal Included
- Pendant Size
- Pendant Type
- Pet Friendly
- Place Setting Capacity
- Plug Type
- Pop-Up Included
- Potable Water Usage
- Power Burner
- Power Feed Type
- Power Source
- Pre Rinse
- Product Variation
- Product Weight
- Programmable
- Projection mm
- Pullout Direction
- Pullout Spray
- Pump Included
- Pump Placement
- Pure Air
- Quantity
- Quick Ship
- Rebate Offered
- Refrigerant
- Refrigerator Capacity
- Regulator Included
- Removable Core
- Removable Ice Bucket
- Removable Shelves
- Replaceable LED Module
- Retrofit
- Reversible Blades
- Reversible Motor
- Reversible Mounting
- RGB
- Rosette Shape
- Rotisserie
- Rough In
- RPM
- RPM (High)
- RPM (Low)
- Sabbath Mode
- Safety Lock
- Salon Spa
- Sanitary Rinse
- Scald Guard
- Sconce Type
- Screw Size
- Seat Front
- Seat Included
- Self Cleaning
- Self Leveling Base
- Self-Contained
- Sensor Cooking
- Sensor Dry
- Service Stops Included
- Settings
- Shade
- Shade Bottom Width
- Shade Depth
- Shade Diameter
- Shade Height
- Shade Top Width
- Shade Width
- Shallow Ceiling Compatible
- Shelf Included
- Shelf Material
- Shelf Type (Freezer)
- Shelf Type (Refrigerator)
- Shower Arm Included
- Shower Arm Reach
- Shower Head Included
- Showerhead
- Showerhead Flow Rate (GPM)
- Showerhead Height
- Showerhead Material
- Showerhead Shape
- Showerhead Width
- Shroud Included
- Side Cabinet Included
- Sidesplash Included
- Sidespray
- Sidespray Height
- Sink Cutout Length
- Sink Cutout Width
- Sink Included
- Sink Length
- Sink Material
- Sink Shape
- Sink Width
- Sleep Mode
- Slide Bar Height
- Slide Bar Included
- Slip Resistant
- Smart Home
- SmartKey
- Soaking
- Soap Dispenser Included
- Soft Close Hinges
- Soft Close Slides
- Solid Construction
- Sones
- Sound Dampening
- Speeds
- Spout Height
- Spout Reach
- Spout Style
- Spout Swivel
- Spout Type
- Spray Arms
- Spray Nozzles
- Spray Pattern
- Spray Settings
- Stackable
- Stainless Steel Grade
- Stainless Steel Interior
- Steam Cooking
- Steam Technology
- Storage Features
- Sustainability
- Swing Arm
- Switch Location
- Switch Type
- Swivel
- System Type
- Tech Features
- TempAssure
- Temperature (Max)
- Temperature (Min)
- Temperature Display
- Temperature Settings
- Tile Flange
- Title 20 Compliant
- Title 24
- Toilet Seat Lid Included
- Top Loading
- Total BTUs
- Total Capacity
- Total Cooking Area
- Touch Faucet
- Touchless Faucet
- Tower Included
- Track Accessory Type
- Trapway
- Trim Design
- Trim Height
- Trim Size
- Trim Style
- Trim Width
- Trip Lever Placement
- Tub Shape
- Tub Spout Included
- Tub Spout Material
- Turntable
- Turntable Diameter
- Turntable Type
- Turtle Friendly
- TX Drought Compliant
- Undercoating
- USB Port
- User Interface
- Valve Included
- Valve Technology
- Valve Trim Height
- Valve Trim Included
- Valve Trim Material
- Valve Trim Width
- Valve Type
- Vandal Resistant
- Vanity Legs Included
- Vanity Top Depth
- Vanity Top Included
- Vanity Top Material
- Vanity Top Thickness
- Vanity Top Width
- Vent Free
- Vent Type
- Vessel Faucet
- Vintage Edison Bulb
- Voice Activated
- Voltage Type
- Volume Control
- Walk-In Tub
- Wall Supply Included
- Warm Function
- Washer Capacity
- Washer RPM
- Water Capacity
- Water Connection
- Water Connection Type
- Water Consumption
- Water Depth
- Water Efficient
- Water Filtration
- Water Pressure (Max)
- Water Pressure (Min)
- Waterfall Faucet
- WaterSense Certified
- Watt Replacement
- Watts Per Bulb
- Width (Dryer)
- Width (Inside)
- Width (Washer)
- Width mm
- Wine Bottle Capacity (750 ml)
- Wireless Communication
- With Casters
- With Overflow
- Wood Species
- Workstation Sink
- Noise Level
- Dome Material
- Fan Type
- Amperage
- Dome Dimensions
- Housing Dimensions
- Country Of Origin
- Made in America
- Approved for Commercial Use
- Includes Thermostat
- dimming
- motor
- Number of Bulbs
- Sloped Ceiling Compatible
- Maximum Height
- Wire Length
- length
- Energy Star
- led
- airtight
- photocell
- solar
- theme
- Installation Type
- size
- watersense
- shape
- lighted
- magnification
- series
- designer
- cri
- Dimensions
- Mounting Type
- Dishwasher Safe
- BPA Free
- Matching Set
- Rust Resistant
- extension
- lumens
- Weather Rating
- Motion Sensor
- Dusk to Dawn
- Solar Powered
- Dark Sky
- direction
- cfm
- reversible
- weight
- wattage
- adjustable
- certifications
- Bulb Type
- Max Wattage
- Safety Rating
- Bulb Base
- Voltage
- Shade Material
- Shade Color
- Shade Shape
- Light Kit
- dimmable
- room
- storage
- upholstery
- projection
- unspsc
- configuration
- gauge
- Corner Radius
- Single Bowl
- height
- depth
- type
- style
- assembly
- warranty
- finish
- color
- material
- overflow
- collection
- description
- details
- Width
- Water Dispenser
- Door Alarm
- Warming Drawer
- Sanitize
- Delay Start
- Heat Selections
- Exhaust Options
- Wash/Rinse Temperatures
- Volts
- imef
- iwf
- Third Rack
- amps
- hz
- 3rd Rack
- medium
- Refillable
- Wall/Floor
- Lead-Free
- Easy Install
- Universal
- solubility
- Emergency Backup
- url
- Non-Slip
- SKU
- Pressure Balance
- Auto-Reverse
- Septic Safe
- Reset Button
- Batch Feed
- Switch On Fixture
- Ship from ZIP Code
- Ships Palletized
- Country of Manufacture
- ANSI Grade
- Keyed Alike
- Bore Hole
- Keyless Entry
- ASTM
- Schedule Class
- Electronics Type
- Hardscape Type
- Pedestal Type
- Sink Type
- Urinal Type
- Mini Split Type
- Bidet Seat Type
- Step Light Type
- Hinge Type
- Coffee Maker Type
- Cooler Type
- LVF Type
- Wall Decor Type
- Outdoor Rug Style
- Fountain Type
- Thermostat Type
- AC Type
- Accent Type
- Attic Fan Type
- Backplate Shape
- Waterproof Type
- Backsplash Type
- Bar Faucet Type
- Bath Fan Type
- Bathroom Light Type
- Bidet Faucet Type
- Bathtub Type
- Bidet Type
- Generator Type
- Cabinet Type
- Carpet Tile Type
- Catch Type
- Ceiling Fan Type
- Chair Type
- Strainer Type
- Ceiling Light Type
- Circulator Type
- Combo Type
- Commercial HVAC Type
- Cooktop Type
- Deadbolt Type
- Decor Type
- Oven Type
- Dehumidifier Type
- Disposal Type
- Drainage Type
- Dryer Type
- Entry Set Type
- Knob Type
- Duct Type
- Exhaust Fan Type
- Fandelier Type
- Finishing Type
- Fire Pit Type
- Fireplace Type
- Fitting Type
- Recessed Light Type
- Washer Type
- Freezer Type
- Furniture Type
- Grill Type
- Handleset Type
- Hardware Type
- Hardwood Type
- Icemaker Type
- Heating Type
- Island Light Type
- Keyless Type
- Heater Type
- Kitchen Light Type
- Laminate Type
- Lamp Type
- Landscape Light Type
- LED Light Type
- Light Type
- Lock Type
- Mailbox Type
- Microwave Type
- Mortise Type
- Organization Type
- Organizer Type
- Outdoor Furniture Type
- Outdoor Kitchen Type
- Outdoor Light Type
- Outdoor Shower Type
- Part Type
- Patio Heater Type
- Pipe Type
- Pizza Oven Type
- Post Light Type
- Pot Filler Type
- Product Type
- Pull Type
- Range Hood Type
- Range Type
- Refrigerator Type
- Rug Style
- Seat Type
- Shower Faucet Type
- Shower Type
- Skylight Type
- Slide Type
- Steam Shower Type
- Storage Type
- Tank Type
- Tankless Type
- Tile Type
- Toilet Type
- Track Light Type
- Tub Faucet Type
- Under Cabinet Light Type
- Vanity Light Type
- Vanity Type
- Water Heater Type
- Wi-Fi

</details>

---

## Implementation Guide

### 1. Category Page Filters

When a user visits a category page (e.g., /refrigerators), display:

**Required Filters**:
- Brand (dropdown/checkboxes)
- Price Range (slider)

**Dynamic Filters** (based on category):
- If category has Size Class: Show size filter (e.g., "30-Inch", "36-Inch", "48-Inch")
- If category has Types: Show type filter (e.g., "French Door", "Side-by-Side")
- If `styles_apply = true`: Show style filter
- Show Top 15 Filter Attributes for that category

**Example - Refrigerator Page**:
```
Filters:
☑️ Brand: [All Brands ▼]
☑️ Size: [○ 30-Inch ○ 36-Inch ○ 42-Inch ○ 48-Inch]
☑️ Type: [○ French Door ○ Side-by-Side ○ Top Freezer ○ Bottom Freezer]
☑️ Installation: [○ Built-In ○ Counter-Depth ○ Freestanding]
☑️ Finish: [Stainless Steel ▼]
☑️ Price: [$500 ────●──── $10,000]
☑️ Capacity: [10 cu ft ───●─── 30 cu ft]
☑️ Energy Star: [○ Yes]
☑️ Ice Maker: [○ Yes]
```

### 2. Search Results Filters

When users search across categories, show:
- Department filter (Appliances, Plumbing, Lighting, etc.)
- Brand filter
- Price range
- Size filter (if applicable to results)

### 3. API Fields to Use

| Filter Type | API Field | Data Type |
|-------------|-----------|-----------|
| Brand | `AI_Brand` | String |
| Category | `AI_Product_Category` | String |
| Type | `AI_Type` | String |
| Style | `AI_Style` | String |
| Size Class | `AI_Product_Filter_Class` | String (e.g., "48-Inch") |
| Width (exact) | `AI_Width` | Numeric (inches) |
| Height (exact) | `AI_Height` | Numeric (inches) |
| Depth (exact) | `AI_Depth` | Numeric (inches) |
| Color | `AI_Color` | String |
| Finish | `AI_Finish` | String |
| Top Filters | See category schema | Varies |

### 4. Query Examples

**Get all 30-inch ranges**:
```
GET /products?category=Range&filter_class=30-Inch
```

**Get all French Door refrigerators with ice makers**:
```
GET /products?category=Refrigerator&type=French-Door&ice_maker=Yes
```

**Get all stainless steel dishwashers under $1000**:
```
GET /products?category=Dishwasher&finish=Stainless-Steel&max_price=1000
```

---

## Update Frequency

This reference is based on Salesforce picklists that sync via API:

- **Categories**: Updated when SF syncs new categories
- **Types**: Updated when SF sends type changes
- **Brands**: Updated automatically (945+ brands)
- **Attributes**: Updated automatically (2,159+ attributes)
- **Size Classes**: Static configuration (rarely changes)

**Last Updated**: 2026-03-04  
**Next Review**: Update when major categories are added

