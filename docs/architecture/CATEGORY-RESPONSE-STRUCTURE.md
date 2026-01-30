# Category-Specific API Response Structure

**Version:** 2.3.0  
**Generated:** January 15, 2026

This document details the exact API response structure for the `/api/verify/salesforce` endpoint, showing how responses vary by product category.

---

## Table of Contents

1. [Response Overview](#response-overview)
2. [Universal Primary Attributes](#universal-primary-attributes)
3. [Category-Specific Top 15 Filter Attributes](#category-specific-top-15-filter-attributes)
4. [Additional Attributes (HTML Table)](#additional-attributes-html-table)
5. [Full Response Example](#full-response-example)

---

## Response Overview

Every API response follows this structure:

```
┌─────────────────────────────────────────────────────────────┐
│  SF_Catalog_Id, SF_Catalog_Name                             │
├─────────────────────────────────────────────────────────────┤
│  PRIMARY ATTRIBUTES (20 fields - SAME for ALL categories)   │
├─────────────────────────────────────────────────────────────┤
│  TOP 15 FILTER ATTRIBUTES (VARIES by category)              │
├─────────────────────────────────────────────────────────────┤
│  ADDITIONAL ATTRIBUTES HTML (Everything else as HTML table) │
├─────────────────────────────────────────────────────────────┤
│  Media, Reference_Links, Documents, Price_Analysis          │
├─────────────────────────────────────────────────────────────┤
│  Field_AI_Reviews, AI_Review, Verification                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Universal Primary Attributes

**These 20 fields are returned for EVERY product, regardless of category:**

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 1 | `Brand_Verified` | string | ✅ | Manufacturer brand name |
| 2 | `Brand_Id` | string | | Salesforce picklist ID for brand |
| 3 | `Category_Verified` | string | ✅ | Product category |
| 4 | `Category_Id` | string | | Salesforce picklist ID for category |
| 5 | `SubCategory_Verified` | string | ✅ | Product subcategory |
| 6 | `Product_Family_Verified` | string | ✅ | Product family/collection |
| 7 | `Product_Style_Verified` | string | | Style (category-specific) |
| 8 | `Style_Id` | string | | Salesforce picklist ID for style |
| 9 | `Color_Verified` | string | | Extracted/verified color |
| 10 | `Finish_Verified` | string | | Extracted/verified finish |
| 11 | `Depth_Verified` | string | | Product depth in inches |
| 12 | `Width_Verified` | string | | Product width in inches |
| 13 | `Height_Verified` | string | | Product height in inches |
| 14 | `Weight_Verified` | string | | Product weight in lbs |
| 15 | `MSRP_Verified` | string | ✅ | Manufacturer suggested retail price |
| 16 | `Market_Value` | number | | Current market value (Ferguson price) |
| 17 | `Market_Value_Min` | number | | Minimum market value |
| 18 | `Market_Value_Max` | number | | Maximum market value |
| 19 | `Description_Verified` | string | ✅ | Product description |
| 20 | `Product_Title_Verified` | string | ✅ | Standardized product title |
| 21 | `Features_List_HTML` | string | | HTML formatted feature list |
| 22 | `UPC_GTIN_Verified` | string | | Universal Product Code |
| 23 | `Model_Number_Verified` | string | ✅ | Manufacturer model number |
| 24 | `Model_Number_Alias` | string | | Model number (symbols removed) |
| 25 | `Model_Parent` | string | | Parent model for variants |
| 26 | `Model_Variant_Number` | string | | Specific variant identifier |
| 27 | `Total_Model_Variants` | string | | All variant models (comma-separated) |

---

## Category-Specific Top 15 Filter Attributes

The `Top_Filter_Attributes` object varies by category. Below are the exact fields returned for each supported category.

---

### 🍳 APPLIANCES DEPARTMENT

#### Range (Gas, Electric, Dual Fuel)

```json
"Top_Filter_Attributes": {
  "fuel_type": "Gas | Electric | Dual Fuel | Induction",
  "configuration": "Freestanding | Slide-In | Drop-In",
  "range_width": "30 | 36 | 48 (inches)",
  "number_of_burners": 4,
  "oven_capacity": 5.8,
  "convection": true,
  "self_cleaning": "Steam Clean | Self-Clean | Manual | Both",
  "max_burner_btu": 22000,
  "griddle_included": true,
  "double_oven": false,
  "warming_drawer": true,
  "air_fry": true,
  "smart_wifi": true,
  "continuous_grates": true,
  "color_finish": "Stainless Steel"
}
```

#### Refrigerator

```json
"Top_Filter_Attributes": {
  "door_configuration": "French Door | Side-by-Side | Top Freezer | Bottom Freezer | Single Door | Column",
  "total_capacity": 28.5,
  "refrigerator_width": "36 (inches)",
  "counter_depth": true,
  "ice_maker": "None | Standard | Craft Ice | Dual",
  "water_dispenser": true,
  "freezer_capacity": 8.5,
  "refrigerator_capacity": 20.0,
  "smart_wifi": true,
  "fingerprint_resistant": true,
  "door_in_door": true,
  "dual_cooling": true,
  "interior_water_dispenser": false,
  "energy_star": true,
  "color_finish": "Stainless Steel"
}
```

#### Dishwasher

```json
"Top_Filter_Attributes": {
  "installation_type": "Built-In | Portable | Drawer | Countertop",
  "tub_material": "Stainless Steel | Plastic | Hybrid",
  "noise_level_db": 42,
  "place_settings": 16,
  "third_rack": true,
  "wash_cycles": 7,
  "drying_system": "Heated Dry | Fan Dry | Condensation | AutoAir",
  "soil_sensor": true,
  "hard_food_disposer": true,
  "adjustable_racks": true,
  "bottle_jets": true,
  "steam_prewash": false,
  "smart_wifi": true,
  "energy_star": true,
  "color_finish": "Stainless Steel"
}
```

#### Wall Oven

```json
"Top_Filter_Attributes": {
  "oven_type": "Single | Double | Combination | Microwave Combo",
  "fuel_type": "Electric | Gas",
  "oven_width": "30 (inches)",
  "total_capacity": 10.6,
  "convection_type": "None | Single Fan | True/European | Dual Fan",
  "self_cleaning": "Steam Clean | Self-Clean | Manual | Both",
  "air_fry": true,
  "steam_cooking": true,
  "smart_wifi": true,
  "temperature_probe": true,
  "sabbath_mode": true,
  "door_style": "Drop Down | Side Swing | French Door",
  "gliding_rack": true,
  "warming_drawer": false,
  "color_finish": "Stainless Steel"
}
```

#### Cooktop

```json
"Top_Filter_Attributes": {
  "fuel_type": "Gas | Electric | Induction",
  "cooktop_width": "36 (inches)",
  "number_of_burners": 5,
  "max_output": "22000 (BTU/Watts)",
  "installation_type": "Drop-In | Rangetop",
  "continuous_grates": true,
  "griddle": true,
  "downdraft": false,
  "bridge_element": true,
  "hot_surface_indicator": true,
  "simmer_burner": true,
  "wok_ring": true,
  "control_type": "Knobs | Touch | Combination",
  "auto_reignition": true,
  "color_finish": "Black Stainless"
}
```

#### Microwave

```json
"Top_Filter_Attributes": {
  "installation_type": "Over-the-Range | Countertop | Built-In | Drawer",
  "capacity": 2.1,
  "wattage": 1100,
  "microwave_width": "30 (inches)",
  "ventilation_cfm": 400,
  "convection": true,
  "sensor_cooking": true,
  "turntable": true,
  "smart_wifi": true,
  "steam_cooking": false,
  "air_fry": true,
  "charcoal_filter": true,
  "auto_defrost": true,
  "preset_options": 10,
  "color_finish": "Stainless Steel"
}
```

#### Range Hood

```json
"Top_Filter_Attributes": {
  "hood_type": "Under Cabinet | Wall Mount | Island | Downdraft | Insert/Liner",
  "hood_width": "36 (inches)",
  "cfm": 600,
  "noise_level_sones": 3.5,
  "venting_type": "Ducted | Ductless | Convertible",
  "fan_speeds": 4,
  "lighting_type": "LED | Halogen | Incandescent | None",
  "heat_sensor": true,
  "delay_off": true,
  "filter_type": "Baffle | Mesh | Charcoal | Combination",
  "dishwasher_safe_filters": true,
  "remote_control": true,
  "touch_controls": true,
  "perimeter_suction": false,
  "color_finish": "Stainless Steel"
}
```

#### Washer

```json
"Top_Filter_Attributes": {
  "load_type": "Front Load | Top Load",
  "capacity": 5.5,
  "washer_width": "27 (inches)",
  "steam": true,
  "energy_star": true,
  "max_spin_speed": 1300,
  "agitator": false,
  "smart_wifi": true,
  "number_of_cycles": 12,
  "vibration_reduction": true,
  "sanitize_cycle": true,
  "allergen_cycle": true,
  "auto_dispenser": true,
  "stackable": true,
  "color_finish": "White"
}
```

#### Dryer

```json
"Top_Filter_Attributes": {
  "fuel_type": "Electric | Gas | Heat Pump",
  "capacity": 7.4,
  "venting_type": "Vented | Ventless",
  "dryer_width": "27 (inches)",
  "steam": true,
  "sensor_dry": true,
  "smart_wifi": true,
  "energy_star": true,
  "number_of_cycles": 14,
  "sanitize_cycle": true,
  "reversible_door": true,
  "drum_light": true,
  "lint_filter_indicator": true,
  "wrinkle_prevent": true,
  "color_finish": "Graphite Steel"
}
```

#### Freezer

```json
"Top_Filter_Attributes": {
  "freezer_type": "Upright | Chest | Drawer | Column",
  "capacity": 20.0,
  "freezer_width": "33 (inches)",
  "defrost_type": "Frost-Free | Manual",
  "garage_ready": true,
  "temperature_alarm": true,
  "door_alarm": true,
  "led_lighting": true,
  "power_indicator": true,
  "defrost_drain": true,
  "lock": true,
  "adjustable_shelves": 5,
  "storage_baskets": 3,
  "energy_star": true,
  "color_finish": "White"
}
```

#### Wine Cooler

```json
"Top_Filter_Attributes": {
  "installation_type": "Built-In | Freestanding | Under Counter",
  "bottle_capacity": 46,
  "temperature_zones": "Single | Dual | Triple",
  "wine_cooler_width": "24 (inches)",
  "cooling_type": "Compressor | Thermoelectric",
  "uv_protected": true,
  "digital_controls": true,
  "led_lighting": true,
  "vibration_dampening": true,
  "security_lock": true,
  "reversible_door": true,
  "shelf_material": "Wood | Wire | Chrome",
  "temp_range_min": 40,
  "temp_range_max": 65,
  "color_finish": "Black"
}
```

#### Ice Maker

```json
"Top_Filter_Attributes": {
  "installation_type": "Built-In | Freestanding | Portable | Outdoor",
  "ice_production": 50,
  "ice_storage": 25,
  "ice_type": "Cube | Nugget | Crescent | Gourmet | Bullet",
  "ice_maker_width": "15 (inches)",
  "drain_required": true,
  "water_line_required": true,
  "clear_ice": true,
  "self_cleaning": true,
  "filter_indicator": true,
  "pump_out_drain": false,
  "led_lighting": true,
  "door_alarm": true,
  "ada_compliant": true,
  "color_finish": "Stainless Steel"
}
```

---

### 🚿 PLUMBING & BATH DEPARTMENT

#### Bathtubs

```json
"Top_Filter_Attributes": {
  "installation_type": "Freestanding | Alcove | Drop-In | Corner | Walk-In",
  "material": "Acrylic | Cast Iron | Fiberglass | Stone Resin",
  "drain_placement": "Left | Right | Center | Reversible",
  "nominal_length": "60 (inches)",
  "nominal_width": "32 (inches)",
  "number_of_bathers": 1,
  "product_weight": "75 lbs",
  "tub_shape": "Rectangular | Oval | Freeform",
  "capacity_gallons": 55,
  "overflow": true,
  "drain_assembly_included": true,
  "overflow_height": "14 (inches)",
  "water_depth": "15 (inches)",
  "accepts_deck_mount_faucet": true,
  "collection": "Archer"
}
```

#### Toilets

```json
"Top_Filter_Attributes": {
  "configuration": "One-Piece | Two-Piece | Wall-Hung",
  "bowl_shape": "Elongated | Round | Compact Elongated",
  "flush_type": "Single Flush | Dual Flush | Touchless",
  "gallons_per_flush": 1.28,
  "rough_in_size": "12 (inches)",
  "height": "Standard | Comfort/ADA",
  "finish_color": "White",
  "seat_included": true,
  "bidet_features": false,
  "heated_seat": false,
  "water_sense_certified": true,
  "ada_compliant": true,
  "trapway": "Concealed | Exposed",
  "soft_close_seat": true,
  "map_score": 1000
}
```

#### Kitchen Faucets

```json
"Top_Filter_Attributes": {
  "style": "Pull-Down | Pull-Out | Bridge | Pot Filler | Standard",
  "finish": "Chrome | Brushed Nickel | Matte Black | Polished Brass",
  "number_of_handles": "Single | Double",
  "spout_height": "16.5 (inches)",
  "spout_reach": "9.5 (inches)",
  "spray_function": "Stream | Spray | Pause",
  "touchless_motion_sensor": true,
  "material": "Solid Brass",
  "deck_plate_included": true,
  "installation_type": "Single Hole | 3-Hole",
  "ceramic_disc_valve": true,
  "water_sense_certified": true,
  "soap_dispenser_included": false,
  "side_sprayer_included": false,
  "flow_rate_gpm": 1.8
}
```

#### Bathroom Faucets

```json
"Top_Filter_Attributes": {
  "style": "Widespread | Centerset | Single Hole | Wall Mount",
  "finish": "Chrome | Brushed Nickel | Matte Black | Oil Rubbed Bronze",
  "number_of_handles": 2,
  "spout_height": "5.5 (inches)",
  "spout_reach": "5.25 (inches)",
  "drain_assembly_included": true,
  "material": "Solid Brass",
  "hole_spacing": "8 (inches)",
  "touchless_motion_sensor": false,
  "water_sense_certified": true,
  "ada_compliant": true,
  "commercial_grade": false,
  "ceramic_disc_valve": true,
  "lead_free": true,
  "flow_rate_gpm": 1.2
}
```

#### Kitchen Sinks

```json
"Top_Filter_Attributes": {
  "material": "Stainless Steel | Fireclay | Granite Composite | Cast Iron",
  "configuration": "Single Bowl | Double Bowl | Triple Bowl",
  "mount_type": "Undermount | Drop-In | Farmhouse/Apron",
  "width": "33 (inches)",
  "depth": "22 (inches)",
  "number_of_faucet_holes": 4,
  "bowl_depth": "10 (inches)",
  "drain_location": "Center | Rear",
  "finish_color": "Stainless Steel",
  "sound_dampening": true,
  "accessories_included": true,
  "gauge_stainless": 16,
  "grid_included": true,
  "ada_compliant": true,
  "drain_size": "3.5 (inches)"
}
```

#### Bathroom Sinks

```json
"Top_Filter_Attributes": {
  "sink_type": "Undermount | Drop-In | Vessel | Pedestal | Wall Mount",
  "material": "Vitreous China | Fireclay | Cast Iron | Tempered Glass",
  "shape": "Rectangular | Oval | Round | Square",
  "width": "21 (inches)",
  "depth": "18 (inches)",
  "number_of_faucet_holes": 3,
  "bowl_depth": "6 (inches)",
  "overflow": true,
  "finish_color": "White",
  "ada_compliant": true,
  "pre_drilled_faucet_holes": true,
  "hole_spacing": "4 (inches)",
  "drain_assembly_included": false,
  "mounting_hardware_included": true,
  "collection": "Memoirs"
}
```

---

### 💡 LIGHTING DEPARTMENT

#### Chandeliers

```json
"Top_Filter_Attributes": {
  "style": "Traditional | Modern | Transitional | Rustic | Crystal",
  "width_diameter": "28 (inches)",
  "height_fixture": "32 (inches)",
  "adjustable_height": true,
  "number_of_lights": 8,
  "bulb_type": "LED | Incandescent | Candelabra",
  "finish_color": "Brushed Nickel",
  "material": "Crystal | Glass | Metal | Wood",
  "dimmable": true,
  "chain_cord_length": "72 (inches)",
  "max_wattage": 480,
  "bulbs_included": true,
  "dry_damp_wet_rated": "Dry",
  "etl_ul_listed": true,
  "energy_star": false
}
```

#### Pendant Lights

```json
"Top_Filter_Attributes": {
  "style": "Modern | Industrial | Farmhouse | Globe | Drum",
  "width_diameter": "12 (inches)",
  "height_fixture": "18 (inches)",
  "adjustable_height": true,
  "number_of_lights": 1,
  "bulb_type": "LED | Edison | Incandescent",
  "finish_color": "Matte Black",
  "shade_material": "Glass | Metal | Fabric",
  "dimmable": true,
  "cord_chain_length": "60 (inches)",
  "sloped_ceiling_compatible": true,
  "bulbs_included": false,
  "dry_damp_rated": "Dry | Damp",
  "etl_ul_listed": true,
  "max_wattage": 100
}
```

#### Ceiling Fans

```json
"Top_Filter_Attributes": {
  "blade_span": "52 (inches)",
  "number_of_blades": 5,
  "light_kit_included": true,
  "style": "Modern | Traditional | Tropical",
  "finish_color": "Brushed Nickel",
  "blade_material": "Wood | ABS | Metal",
  "motor_type": "DC | AC",
  "number_of_speeds": 6,
  "reversible_motor": true,
  "remote_control_included": true,
  "smart_wifi_enabled": true,
  "damp_wet_rated": "Damp | Wet | Indoor Only",
  "cfm": 5500,
  "noise_level": "Quiet",
  "energy_star": true
}
```

---

## Additional Attributes (HTML Table)

Any attributes NOT included in Primary Attributes or Top 15 Filter Attributes are rendered as an HTML table in the `Additional_Attributes_HTML` field.

**Example Output:**

```html
<table class="sf-additional-attributes">
  <tr class="sf-attr-header">
    <th>Attribute</th>
    <th>Value</th>
  </tr>
  <tr>
    <td class="sf-attr-cell">Country Of Origin</td>
    <td class="sf-attr-cell">USA</td>
  </tr>
  <tr class="sf-attr-alt">
    <td class="sf-attr-cell">Manufacturer Warranty</td>
    <td class="sf-attr-cell">Limited Lifetime</td>
  </tr>
  <tr>
    <td class="sf-attr-cell">Voltage</td>
    <td class="sf-attr-cell">120V</td>
  </tr>
  <!-- More attributes... -->
</table>
```

---

## Full Response Example

### Range Product - Complete Response

```json
{
  "success": true,
  "data": {
    "SF_Catalog_Id": "a03aZ00000EXAMPLE",
    "SF_Catalog_Name": "KSGB900ESS",
    
    "Primary_Attributes": {
      "Brand_Verified": "KITCHENAID",
      "Brand_Id": "a0MaZ000000KitchenAid",
      "Category_Verified": "Range",
      "Category_Id": "a01aZ00000dRangeXYZ",
      "SubCategory_Verified": "Gas Ranges",
      "Product_Family_Verified": "Commercial-Style",
      "Product_Style_Verified": "Professional",
      "Style_Id": "a02aZ00000StylePro",
      "Color_Verified": "Stainless Steel",
      "Finish_Verified": "Stainless Steel",
      "Depth_Verified": "28.375",
      "Width_Verified": "30",
      "Height_Verified": "36.5",
      "Weight_Verified": "240 lbs",
      "MSRP_Verified": "4299.00",
      "Market_Value": 3899,
      "Market_Value_Min": 3599,
      "Market_Value_Max": 4299,
      "Description_Verified": "KitchenAid 30-inch 5 Burner Gas Range with Even-Heat True Convection...",
      "Product_Title_Verified": "KitchenAid 30\" 5.8 Cu. Ft. Gas Range with Even-Heat True Convection in Stainless Steel",
      "Features_List_HTML": "<ul><li>Even-Heat True Convection</li><li>Professional Dual Ring Burner</li>...</ul>",
      "UPC_GTIN_Verified": "883049409139",
      "Model_Number_Verified": "KSGB900ESS",
      "Model_Number_Alias": "KSGB900ESS",
      "Model_Parent": "KSGB900",
      "Model_Variant_Number": "ESS",
      "Total_Model_Variants": "KSGB900EBL, KSGB900ESS, KSGB900EWH"
    },
    
    "Top_Filter_Attributes": {
      "fuel_type": "Gas",
      "configuration": "Slide-In",
      "range_width": 30,
      "number_of_burners": 5,
      "oven_capacity": 5.8,
      "convection": true,
      "self_cleaning": "Steam Clean",
      "max_burner_btu": 20000,
      "griddle_included": true,
      "double_oven": false,
      "warming_drawer": true,
      "air_fry": true,
      "smart_wifi": true,
      "continuous_grates": true,
      "color_finish": "Stainless Steel"
    },
    
    "Top_Filter_Attribute_Ids": {
      "fuel_type": "a1aaZ000008FuelGas",
      "configuration": "a1aaZ000008ConfigSlide",
      "range_width": "a1aaZ000008Width30",
      "number_of_burners": "a1aaZ000008Burner5",
      "oven_capacity": null,
      "convection": "a1aaZ000008ConvYes",
      "self_cleaning": "a1aaZ000008SteamClean",
      "max_burner_btu": null,
      "griddle_included": "a1aaZ000008GridYes",
      "double_oven": null,
      "warming_drawer": "a1aaZ000008WarmYes",
      "air_fry": "a1aaZ000008AirFryYes",
      "smart_wifi": "a1aaZ000008SmartYes",
      "continuous_grates": "a1aaZ000008GrateYes",
      "color_finish": "a1aaZ000008FinishSS"
    },
    
    "Additional_Attributes_HTML": "<table class=\"sf-additional-attributes\">...</table>",
    
    "Media": {
      "Primary_Image_URL": "https://images.kitchenaid.com/KSGB900ESS/main.jpg",
      "All_Image_URLs": [
        "https://images.kitchenaid.com/KSGB900ESS/main.jpg",
        "https://images.kitchenaid.com/KSGB900ESS/angle.jpg",
        "https://images.kitchenaid.com/KSGB900ESS/interior.jpg"
      ],
      "Image_Count": 3
    },
    
    "Reference_Links": {
      "Ferguson_URL": "https://www.ferguson.com/product/kitchenaid-ksgb900ess",
      "Web_Retailer_URL": "https://example.com/range/KSGB900ESS",
      "Manufacturer_URL": "https://www.kitchenaid.com/ranges/KSGB900ESS"
    },
    
    "Documents": {
      "total_count": 3,
      "recommended_count": 2,
      "documents": [
        {
          "url": "https://docs.example.com/spec-sheet.pdf",
          "name": "Specification Sheet",
          "type": "spec_sheet",
          "ai_recommendation": "use",
          "relevance_score": 95,
          "reason": "Contains detailed product specifications"
        },
        {
          "url": "https://docs.example.com/install-guide.pdf",
          "name": "Installation Guide",
          "type": "installation",
          "ai_recommendation": "use",
          "relevance_score": 88,
          "reason": "Important installation requirements"
        },
        {
          "url": "https://docs.example.com/warranty.pdf",
          "name": "Warranty Information",
          "type": "warranty",
          "ai_recommendation": "skip",
          "relevance_score": 30,
          "reason": "Standard warranty document"
        }
      ]
    },
    
    "Price_Analysis": {
      "msrp_web_retailer": 4299,
      "msrp_ferguson": 3899
    },
    
    "Field_AI_Reviews": {
      "brand": {
        "openai": {"value": "KITCHENAID", "agreed": true, "confidence": 98},
        "xai": {"value": "KITCHENAID", "agreed": true, "confidence": 97},
        "consensus": "agreed",
        "source": "both_agreed",
        "final_value": "KITCHENAID"
      },
      "category": {
        "openai": {"value": "Range", "agreed": true, "confidence": 95},
        "xai": {"value": "Range", "agreed": true, "confidence": 96},
        "consensus": "agreed",
        "source": "both_agreed",
        "final_value": "Range"
      },
      "fuel_type": {
        "openai": {"value": "Gas", "agreed": true, "confidence": 99},
        "xai": {"value": "Gas", "agreed": true, "confidence": 99},
        "consensus": "agreed",
        "source": "both_agreed",
        "final_value": "Gas"
      }
    },
    
    "AI_Review": {
      "openai": {
        "reviewed": true,
        "result": "agreed",
        "confidence": 94,
        "fields_verified": 27,
        "fields_corrected": 1
      },
      "xai": {
        "reviewed": true,
        "result": "agreed",
        "confidence": 93,
        "fields_verified": 27,
        "fields_corrected": 1
      },
      "consensus": {
        "both_reviewed": true,
        "agreement_status": "full_agreement",
        "agreement_percentage": 96,
        "final_arbiter": "consensus"
      }
    },
    
    "Verification": {
      "verification_timestamp": "2026-01-15T14:30:00.000Z",
      "verification_session_id": "sess-abc123-def456",
      "verification_score": 94,
      "verification_status": "verified",
      "data_sources_used": ["OpenAI", "xAI", "Ferguson", "Web_Retailer"],
      "corrections_made": [
        {
          "field": "product_title",
          "original_value": "KitchenAid Range KSGB900ESS",
          "corrected_value": "KitchenAid 30\" 5.8 Cu. Ft. Gas Range with Even-Heat True Convection in Stainless Steel",
          "source": "Consensus",
          "confidence": 95,
          "reason": "Enhanced with dimensions and key features"
        }
      ],
      "missing_fields": [],
      "confidence_scores": {
        "openai": 0.94,
        "xai": 0.93,
        "consensus": 0.935,
        "category": 0.98
      },
      "score_breakdown": {
        "ai_confidence_component": 47,
        "agreement_component": 38,
        "category_bonus": 10,
        "fields_agreed": 26,
        "fields_disagreed": 1,
        "total_fields": 27,
        "agreement_percentage": 96,
        "text_fields_excluded": 3,
        "disagreement_details": [
          {
            "field": "oven_capacity",
            "openai": "5.8",
            "xai": "5.7"
          }
        ]
      }
    },
    
    "Status": "success"
  },
  "sessionId": "sess-abc123-def456",
  "processingTimeMs": 14523
}
```

---

## Verification Score Breakdown

The verification score (0-100) is calculated from:

| Component | Max Points | Description |
|-----------|------------|-------------|
| AI Confidence | 50 | Average of OpenAI and xAI confidence scores |
| Field Agreement | 40 | Percentage of fields where both AIs agreed |
| Category Bonus | 10 | Awarded if both AIs agree on category |

**Note:** Text fields (description, title, features) are excluded from agreement scoring since they're generated content, not factual data.

---

## Category ID Reference

| Category | Category ID Pattern |
|----------|---------------------|
| Range | `range`, `gas_ranges`, `electric_ranges` |
| Refrigerator | `refrigerator`, `french_door_refrigerator` |
| Dishwasher | `dishwasher` |
| Wall Oven | `wall_oven`, `oven` |
| Cooktop | `cooktop`, `gas_cooktop`, `induction_cooktop` |
| Microwave | `microwave`, `over_the_range_microwave` |
| Range Hood | `range_hood`, `vent_hood` |
| Washer | `washer`, `washing_machine` |
| Dryer | `dryer`, `clothes_dryer` |
| Bathtubs | `bathtubs`, `bathtub` |
| Toilets | `toilets`, `toilet` |
| Kitchen Faucets | `kitchen_faucets` |
| Bathroom Faucets | `bathroom_faucets` |
| Kitchen Sinks | `kitchen_sinks` |
| Chandeliers | `chandeliers` |
| Pendant Lights | `pendants`, `pendant_lights` |
| Ceiling Fans | `ceiling_fans` |

---

*© 2026 CXC AI - Catalog Verification API*
