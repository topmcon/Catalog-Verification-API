# Optimized Top 15 Filter Attributes

> **Document Version:** 2.0  
> **Date:** January 23, 2026  
> **Purpose:** Recommend optimal Top 15 filter attributes per category for e-commerce product list page filtering

---

## Overview

This document defines the recommended **Top 15 Filter Attributes** for each product category. These attributes are:

1. **NOT duplicates of Primary 20 Attributes** (no Width, Height, Depth, Weight, Style)
2. **Sorted by utilization** (most commonly filtered attributes first)
3. **Matched to Salesforce Attribute IDs** (for direct integration)
4. **Focused on purchase decision filters** (what helps customers narrow down products)

---

## Primary 20 Attributes (EXCLUDED from Top 15)

These attributes are already captured in the Primary Display Attributes and should **NOT** appear in Top 15:

| # | Attribute Name |
|---|----------------|
| 1 | Brand (Verified) |
| 2 | Category / Subcategory (Verified) |
| 3 | Product Family (Verified) |
| 4 | **Product Style (Verified)** |
| 5 | **Depth / Length (Verified)** |
| 6 | **Width (Verified)** |
| 7 | **Height (Verified)** |
| 8 | **Weight (Verified)** |
| 9 | MSRP (Verified) |
| 10 | Market Value |
| 11 | Description |
| 12 | Product Title (Verified) |
| 13 | Details |
| 14 | Features List |
| 15 | UPC / GTIN (Verified) |
| 16 | Model Number (Verified) |
| 17 | Model Number Alias |
| 18 | Model Parent |
| 19 | Model Variant Number |
| 20 | Total Model Variants |

---

## Table of Contents

1. [APPLIANCES DEPARTMENT](#appliances-department)
2. [PLUMBING & BATH DEPARTMENT](#plumbing--bath-department)
3. [LIGHTING DEPARTMENT](#lighting-department)
4. [HOME DECOR & FIXTURES DEPARTMENT](#home-decor--fixtures-department)
5. [HVAC DEPARTMENT](#hvac-department)
6. [OTHER CATEGORIES](#other-categories)

---

## APPLIANCES DEPARTMENT

### 🔥 Range - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Fuel Type | `a1aaZ000008mBsmQAE` | enum | **#1 filter** - Gas/Electric/Dual Fuel/Induction |
| 2 | Configuration | `a1aaZ000008mBojQAE` | enum | Freestanding/Slide-In/Drop-In |
| 3 | Number Of Burners | `a1aaZ000008mBvbQAE` | number | 4/5/6 burner configurations |
| 4 | Oven Capacity | `a1aaZ000008mBw7QAE` | number | Cubic feet capacity |
| 5 | Convection | `a1aaZ000008mBopQAE` | boolean | Convection cooking feature |
| 6 | Self Cleaning | `a1aaZ000008mBxAQAU` | enum | Steam/Pyrolytic/Manual |
| 7 | Double Oven | ❌ *Not in SF* | boolean | Single/Double oven configuration |
| 8 | Air Fry | `a1aaZ000008lz3fQAA` | boolean | Air fry mode - trending feature |
| 9 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | WiFi connectivity |
| 10 | Induction | `a1aaZ000008mBu3QAE` | boolean | Induction technology |
| 11 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 12 | Continuous Grates | `a1aaZ000008mBolQAE` | boolean | Cast iron continuous grates |
| 13 | BTU Output | `a1aaZ000008mBnrQAE` | number | Maximum burner BTU |
| 14 | Grattribute_iddle | `a1aaZ000008mBswQAE` | boolean | Griddle included |
| 15 | Sabbath Mode | `a1aaZ000008mBx1QAE` | boolean | Sabbath mode feature |

---

### 🧊 Refrigerator - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Configuration | `a1aaZ000008mBojQAE` | enum | **#1 filter** - French Door/Side-by-Side/Top Freezer/Bottom Freezer |
| 2 | Total Capacity | `a1aaZ000008mByiQAE` | number | Total cubic feet |
| 3 | Counter Depth | `a1aaZ000008mBoyQAE` | boolean | Counter depth vs standard |
| 4 | Ice Maker | `a1aaZ000008mBtmQAE` | enum | None/Standard/Craft Ice/Dual |
| 5 | Fingerprint Resistant | `a1aaZ000008mBsNQAU` | boolean | Smudge-proof finish |
| 6 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | WiFi connectivity |
| 7 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 8 | Number Of Doors | `a1aaZ000008mBvdQAE` | number | 2/3/4 door configurations |
| 9 | Refrigerator Capacity | `a1aaZ000008mBwjQAE` | number | Fridge section cu. ft. |
| 10 | Freezer Capacity | `a1aaZ000008mBscQAE` | number | Freezer section cu. ft. |
| 11 | Dispenser Features | `a1aaZ000008mBrKQAU` | enum | Water/Ice dispenser type |
| 12 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Built-In/Freestanding |
| 13 | Internal Ice Maker | `a1aaZ000008mBuGQAU` | boolean | Interior ice maker |
| 14 | Number of Zones | `a1aaZ000008mBw0QAE` | number | Temperature zones |
| 15 | Glass Doors | `a1aaZ000008mBsuQAE` | boolean | See-through doors |

---

### 🍽️ Dishwasher - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Noise Level | `a1aaZ000008mBvOQAU` | number | **#1 filter** - dB rating (lower = quieter) |
| 2 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Built-In/Portable/Drawer |
| 3 | Place Setting Capacity | `a1aaZ000008mBwNQAU` | number | 12/14/16 place settings |
| 4 | Stainless Steel Interior | `a1aaZ000008mByKQAU` | boolean | Tub material |
| 5 | Number of Wash Cycles | `a1aaZ000008mBvzQAE` | number | Cycle count |
| 6 | Drying System | `a1aaZ000008mBrjQAE` | enum | Heated/Fan/Condensation/AutoAir |
| 7 | Control Type | `a1aaZ000008mBonQAE` | enum | Top/Front control location |
| 8 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 9 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | WiFi connectivity |
| 10 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 11 | Fingerprint Resistant | `a1aaZ000008mBsNQAU` | boolean | Smudge-proof finish |
| 12 | Panel Ready | `a1aaZ000008mBwFQAU` | boolean | Custom panel capable |
| 13 | Number Of Racks | `a1aaZ000008mBvrQAE` | number | 2/3 rack configuration |
| 14 | Cutlery Tray | `a1aaZ000008mBp7QAE` | boolean | Third rack/cutlery tray |
| 15 | Dishwasher Type | `a1aaZ000008mBrHQAU` | enum | Standard/Compact/Drawer |

---

### 🔲 Wall Oven - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Configuration | `a1aaZ000008mBojQAE` | enum | Single/Double/Combo |
| 2 | Fuel Type | `a1aaZ000008mBsmQAE` | enum | Electric/Gas |
| 3 | Oven Capacity | `a1aaZ000008mBw7QAE` | number | Total cubic feet |
| 4 | Convection | `a1aaZ000008mBopQAE` | enum | None/Single Fan/True European/Dual |
| 5 | Self Cleaning | `a1aaZ000008mBxAQAU` | enum | Steam/Pyrolytic/Manual |
| 6 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | WiFi connectivity |
| 7 | Air Fry | `a1aaZ000008lz3fQAA` | boolean | Air fry mode |
| 8 | Steam Cooking | `a1aaZ000008mByLQAU` | boolean | Steam cooking feature |
| 9 | Combination Oven | `a1aaZ000008mBocQAE` | boolean | Microwave combo |
| 10 | Door Type | `a1aaZ000008mBrTQAU` | enum | Drop Down/Side Swing/French |
| 11 | Meat Thermometer | `a1aaZ000008mBuyQAE` | boolean | Temperature probe included |
| 12 | Sabbath Mode | `a1aaZ000008mBx1QAE` | boolean | Sabbath mode feature |
| 13 | Number Of Racks | `a1aaZ000008mBvrQAE` | number | Rack count |
| 14 | Microwave Capacity | `a1aaZ000008mBv0QAE` | number | Microwave section (combo units) |
| 15 | Control Type | `a1aaZ000008mBonQAE` | enum | Touch/Knob/Combination |

---

### 🔥 Cooktop - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Fuel Type | `a1aaZ000008mBsmQAE` | enum | **#1 filter** - Gas/Electric/Induction |
| 2 | Number Of Burners | `a1aaZ000008mBvbQAE` | number | 4/5/6 cooking elements |
| 3 | Induction | `a1aaZ000008mBu3QAE` | boolean | Induction technology |
| 4 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Drop-In/Rangetop |
| 5 | BTU Output | `a1aaZ000008mBnrQAE` | number | Maximum burner output |
| 6 | Continuous Grates | `a1aaZ000008mBolQAE` | boolean | Cast iron continuous grates |
| 7 | Control Type | `a1aaZ000008mBonQAE` | enum | Knobs/Touch/Combination |
| 8 | Grattribute_iddle | `a1aaZ000008mBswQAE` | boolean | Griddle included |
| 9 | Downdraft Ventilated | `a1aaZ000008mBrVQAU` | boolean | Built-in downdraft |
| 10 | Brattribute_idge Element | `a1aaZ000008mBnmQAE` | boolean | Bridge zone for griddles |
| 11 | Hot Surface Indicator Lights | `a1aaZ000008mBtcQAE` | boolean | Safety indicator |
| 12 | Power Burner | `a1aaZ000008mBwRQAU` | boolean | High-BTU burner |
| 13 | Ignition Type | `a1aaZ000008mBtnQAE` | enum | Electronic/Pilot |
| 14 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | WiFi connectivity |
| 15 | LP Conversion | `a1aaZ000008mBuhQAE` | boolean | LP gas conversion kit |

---

### 🌀 Range Hood - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Under Cabinet/Wall Mount/Island/Insert |
| 2 | CFM | `a1aaZ000008mBoNQAU` | number | Air movement capacity |
| 3 | Sones | `a1aaZ000008mBy6QAE` | number | Noise level |
| 4 | Ductless | `a1aaZ000008mBrmQAE` | boolean | Ductless/Recirculating |
| 5 | Fan Speeds | `a1aaZ000008mBs8QAE` | number | Speed settings |
| 6 | Filter Type | `a1aaZ000008mBsKQAU` | enum | Baffle/Mesh/Charcoal |
| 7 | Light Included | `a1aaZ000008mBuZQAU` | boolean | Built-in lighting |
| 8 | LED | `a1aaZ000008mBuSQAU` | boolean | LED lighting |
| 9 | Convertible to Ductless / Recirculating | `a1aaZ000008mBoqQAE` | boolean | Convertible venting |
| 10 | Blower | `a1aaZ000008lz4sQAA` | boolean | Blower included |
| 11 | Includes Remote | `a1aaZ000008mBtwQAE` | boolean | Remote control included |
| 12 | Material | `a1aaZ000008mBupQAE` | enum | Stainless/Glass/Copper |
| 13 | Duct Size | `a1aaZ000008mBrlQAE` | number | Duct diameter |
| 14 | Control Type | `a1aaZ000008mBonQAE` | enum | Touch/Button/Slide |
| 15 | CFM (High) | `a1aaZ000008mBoOQAU` | number | Maximum CFM |

---

### 🧺 Washer - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Top Loading | `a1aaZ000008mBygQAE` | boolean | **#1 filter** - Top load style |
| 2 | Front Loading | `a1aaZ000008mBsgQAE` | boolean | Front load style |
| 3 | Washer Capacity | `a1aaZ000008mBzWQAU` | number | Cubic feet |
| 4 | Steam Technology | `a1aaZ000008mByMQAU` | boolean | Steam wash feature |
| 5 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 6 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | WiFi connectivity |
| 7 | Agitator | `a1aaZ000008lz3bQAA` | boolean | Has agitator (top load) |
| 8 | Stackable | `a1aaZ000008mByIQAU` | boolean | Can be stacked |
| 9 | Pedestal Included | `a1aaZ000008mBwIQAU` | boolean | Pedestal compatible |
| 10 | Number of Wash Cycles | `a1aaZ000008mBvzQAE` | number | Cycle options |
| 11 | Washer RPM | `a1aaZ000008mBzXQAU` | number | Max spin speed |
| 12 | Sanitary Rinse | `a1aaZ000008mBx4QAE` | boolean | Sanitize cycle |
| 13 | Drive Type | `a1aaZ000008mBrfQAE` | enum | Direct drive type |
| 14 | Detergent and Rinse-Aattribute_id Dispenser | `a1aaZ000008mBrDQAU` | boolean | Auto dispenser |
| 15 | Noise Level | `a1aaZ000008mBvOQAU` | number | dB rating |

---

### 👔 Dryer - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Fuel Type | `a1aaZ000008mBsmQAE` | enum | **#1 filter** - Electric/Gas/Heat Pump |
| 2 | Vent Type | `a1aaZ000008mBzMQAU` | enum | Vented/Ventless |
| 3 | Dryer Capacity | `a1aaZ000008mBriQAE` | number | Cubic feet |
| 4 | Steam Technology | `a1aaZ000008mByMQAU` | boolean | Steam refresh feature |
| 5 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 6 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | WiFi connectivity |
| 7 | Sensor Dry | `a1aaZ000008mBxEQAU` | boolean | Moisture sensor |
| 8 | Stackable | `a1aaZ000008mByIQAU` | boolean | Can be stacked |
| 9 | Pedestal Included | `a1aaZ000008mBwIQAU` | boolean | Pedestal compatible |
| 10 | Number of Dry Cycles | `a1aaZ000008mBvgQAE` | number | Cycle options |
| 11 | Drum Material | `a1aaZ000008mBrhQAE` | enum | Stainless/Porcelain |
| 12 | Sanitary Rinse | `a1aaZ000008mBx4QAE` | boolean | Sanitize cycle |
| 13 | Door Swing | `a1aaZ000008mBrRQAU` | enum | Reversible door |
| 14 | Interior Light | `a1aaZ000008mBuDQAU` | boolean | Drum light |
| 15 | Noise Level | `a1aaZ000008mBvOQAU` | number | dB rating |

---

### ❄️ Freezer - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Configuration | `a1aaZ000008mBojQAE` | enum | Upright/Chest/Drawer |
| 2 | Freezer Capacity | `a1aaZ000008mBscQAE` | number | Cubic feet |
| 3 | Defrost Type | `a1aaZ000008mBpNQAU` | enum | Frost-Free/Manual |
| 4 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Freestanding/Built-In |
| 5 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 6 | Lockable | `a1aaZ000008mBudQAE` | boolean | Security lock |
| 7 | Interior Light | `a1aaZ000008mBuDQAU` | boolean | LED lighting |
| 8 | Adjustable Shelves | `a1aaZ000008lz3ZQAQ` | boolean | Adjustable shelf options |
| 9 | Temperature Display | `a1aaZ000008mByZQAU` | boolean | Digital display |
| 10 | Outdoor Approved | `a1aaZ000008mBw4QAE` | boolean | Garage ready |
| 11 | Number Of Drawers | `a1aaZ000008mBvfQAE` | number | Drawer count |
| 12 | Number Of Shelves | `a1aaZ000008mBvtQAE` | number | Shelf count |
| 13 | Door Type | `a1aaZ000008mBrTQAU` | enum | Door style |
| 14 | Frost Free | `a1aaZ000008mBslQAE` | boolean | Auto defrost |
| 15 | Adjustable Thermostat | `a1aaZ000008lz3aQAA` | boolean | Temperature control |

---

### 🍷 Wine Cooler / Beverage Center - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Wine Bottle Capacity (750 ml) | `a1aaZ000008mBzrQAE` | number | Bottle count |
| 2 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Built-In/Freestanding/Under Counter |
| 3 | Number of Zones | `a1aaZ000008mBw0QAE` | number | Single/Dual/Triple temp zones |
| 4 | Cooling Type | `a1aaZ000008mBotQAE` | enum | Compressor/Thermoelectric |
| 5 | Can Capacity (12 oz.) | `a1aaZ000008mBo9QAE` | number | Beverage can storage |
| 6 | Shelf Material | `a1aaZ000008mBxVQAU` | enum | Wood/Wire/Chrome |
| 7 | Interior Light | `a1aaZ000008mBuDQAU` | boolean | LED lighting |
| 8 | Lockable | `a1aaZ000008mBudQAE` | boolean | Security lock |
| 9 | Glass Doors | `a1aaZ000008mBsuQAE` | boolean | UV protected glass |
| 10 | Temperature Display | `a1aaZ000008mByZQAU` | boolean | Digital controls |
| 11 | Temperature (Min) | `a1aaZ000008mByYQAU` | number | Minimum temperature °F |
| 12 | Temperature (Max) | `a1aaZ000008mByXQAU` | number | Maximum temperature °F |
| 13 | Door Swing | `a1aaZ000008mBrRQAU` | enum | Reversible door |
| 14 | Number Of Shelves | `a1aaZ000008mBvtQAE` | number | Shelf count |
| 15 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |

---

### 📺 Microwave - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Over-the-Range/Countertop/Built-In/Drawer |
| 2 | Microwave Capacity | `a1aaZ000008mBv0QAE` | number | Cubic feet |
| 3 | Wattage | `a1aaZ000008mBzkQAE` | number | Cooking power |
| 4 | CFM | `a1aaZ000008mBoNQAU` | number | Ventilation power (OTR) |
| 5 | Convection | `a1aaZ000008mBopQAE` | boolean | Convection cooking |
| 6 | Sensor Cooking | `a1aaZ000008mBxDQAU` | boolean | Auto sensor cook |
| 7 | Turntable | `a1aaZ000008mByyQAE` | boolean | Has turntable |
| 8 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | WiFi connectivity |
| 9 | Steam Cooking | `a1aaZ000008mByLQAU` | boolean | Steam cook function |
| 10 | Air Fry | `a1aaZ000008lz3fQAA` | boolean | Air fry mode |
| 11 | Fingerprint Resistant | `a1aaZ000008mBsNQAU` | boolean | Smudge-proof finish |
| 12 | Control Type | `a1aaZ000008mBonQAE` | enum | Touch/Button |
| 13 | Auto Shut Off | `a1aaZ000008lz3yQAA` | boolean | Auto shutoff |
| 14 | Automatic Defrost | `a1aaZ000008lz41QAA` | boolean | Auto defrost |
| 15 | Turntable Diameter | `a1aaZ000008mByzQAE` | number | Turntable size |

---

## PLUMBING & BATH DEPARTMENT

### 🚽 Toilets - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Configuration | `a1aaZ000008mBojQAE` | enum | One-Piece/Two-Piece/Wall-Hung |
| 2 | Bowl Shape | `a1aaZ000008lz50QAA` | enum | Elongated/Round/Compact |
| 3 | Flush Type | `a1aaZ000008mBsVQAU` | enum | Single/Dual/Touchless/Pressure |
| 4 | Gallons Per Flush | `a1aaZ000008mBspQAE` | number | GPF rating (1.0/1.28/1.6) |
| 5 | Bowl Height | `a1aaZ000008lz4zQAA` | enum | Standard/Comfort/ADA height |
| 6 | Rough In | `a1aaZ000008mBwwQAE` | number | 10/12/14 inch rough-in |
| 7 | Seat Included | `a1aaZ000008mBx9QAE` | boolean | Seat included |
| 8 | WaterSense Certified | `a1aaZ000008mBziQAE` | boolean | WaterSense certification |
| 9 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 10 | Trapway | `a1aaZ000008mByoQAE` | enum | Concealed/Exposed/Skirted |
| 11 | Battribute_idet Seat Included | `a1aaZ000008lz4kQAA` | boolean | Bidet features |
| 12 | Flush Technology | `a1aaZ000008mBsUQAU` | enum | Flush system type |
| 13 | Night Light | `a1aaZ000008mBvMQAU` | boolean | Built-in night light |
| 14 | Mounting Type | `a1aaZ000008mBvLQAU` | enum | Floor/Wall mount |
| 15 | Soft Close Hinges | `a1aaZ000008mBy2QAE` | boolean | Soft close seat |

---

### 🪑 Toilet Seats - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Bowl Shape | `a1aaZ000008lz50QAA` | enum | Elongated/Round - must match toilet |
| 2 | Material | `a1aaZ000008mBupQAE` | enum | Plastic/Wood/Molded Wood |
| 3 | Soft Close Hinges | `a1aaZ000008mBy2QAE` | boolean | Slow-close feature |
| 4 | Battribute_idet Seat Included | `a1aaZ000008lz4kQAA` | boolean | Bidet functionality |
| 5 | Heater Included | `a1aaZ000008mBtMQAU` | boolean | Heated seat |
| 6 | Night Light | `a1aaZ000008mBvMQAU` | boolean | LED night light |
| 7 | Quick Release | ❌ *Not in SF* | boolean | Easy removal for cleaning |
| 8 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant height |
| 9 | Antimicrobial | `a1aaZ000008lz3mQAA` | boolean | Antimicrobial surface |
| 10 | Mounting Type | `a1aaZ000008mBvLQAU` | enum | Top/Bottom mount |
| 11 | Seat Front | `a1aaZ000008mBx8QAE` | enum | Open/Closed front |
| 12 | Adjustable | `a1aaZ000008lz3XQAQ` | boolean | Adjustable hinges |
| 13 | LED | `a1aaZ000008mBuSQAU` | boolean | LED features |
| 14 | Remote Control | ❌ *Not in SF* | boolean | Remote for bidet seats |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🚿 Kitchen Faucets - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Faucet Type | `a1aaZ000008mBsGQAU` | enum | Pull-Down/Pull-Out/Standard/Commercial |
| 2 | Number Of Handles | `a1aaZ000008mBviQAE` | number | 1 or 2 handle |
| 3 | Spout Height | `a1aaZ000008mBy9QAE` | number | Height specification |
| 4 | Spout Reach | `a1aaZ000008mByAQAU` | number | Reach specification |
| 5 | Touchless Faucet | `a1aaZ000008mBylQAE` | boolean | Motion sensor activation |
| 6 | Voice Activated | `a1aaZ000008mBzPQAU` | boolean | Voice control |
| 7 | Spray Settings | `a1aaZ000008mByHQAU` | number | Spray functions |
| 8 | Faucet Holes | `a1aaZ000008mBsDQAU` | number | Hole requirement (1/2/3/4) |
| 9 | Flow Rate (GPM) | `a1aaZ000008mBsSQAU` | number | Gallons per minute |
| 10 | WaterSense Certified | `a1aaZ000008mBziQAE` | boolean | WaterSense certification |
| 11 | Soap Dispenser Included | `a1aaZ000008mBy1QAE` | boolean | Soap dispenser included |
| 12 | Magnetic Docking | `a1aaZ000008mBumQAE` | boolean | Magnetic spray head docking |
| 13 | Pre Rinse | `a1aaZ000008mBwUQAU` | boolean | Commercial/pre-rinse style |
| 14 | Spout Style | `a1aaZ000008mByBQAU` | enum | Gooseneck/High-Arc/Low-Arc |
| 15 | Handle Style | `a1aaZ000008mBtBQAU` | enum | Lever/Knob/Blade |

---

### 🚰 Bathroom Faucets - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Faucet Mounting Type | `a1aaZ000008mBsFQAU` | enum | Centerset/Widespread/Single Hole/Wall Mount |
| 2 | Number Of Handles | `a1aaZ000008mBviQAE` | number | 1 or 2 handle |
| 3 | Spout Height | `a1aaZ000008mBy9QAE` | number | Height specification |
| 4 | Spout Reach | `a1aaZ000008mByAQAU` | number | Reach specification |
| 5 | Faucet Holes | `a1aaZ000008mBsDQAU` | number | Hole requirement |
| 6 | Drain Assembly Included | `a1aaZ000008mBrYQAU` | boolean | Pop-up drain included |
| 7 | Flow Rate (GPM) | `a1aaZ000008mBsSQAU` | number | Gallons per minute |
| 8 | WaterSense Certified | `a1aaZ000008mBziQAE` | boolean | WaterSense certification |
| 9 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 10 | Touchless Faucet | `a1aaZ000008mBylQAE` | boolean | Motion sensor |
| 11 | Handle Style | `a1aaZ000008mBtBQAU` | enum | Lever/Cross/Knob |
| 12 | Spout Style | `a1aaZ000008mByBQAU` | enum | Standard/Waterfall/High-Arc |
| 13 | Vessel Faucet | `a1aaZ000008mBzNQAU` | boolean | For vessel sinks |
| 14 | Valve Type | `a1aaZ000008mBzDQAU` | enum | Ceramic disc/Ball/Cartridge |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🍷 Bar Faucets - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Faucet Type | `a1aaZ000008mBsGQAU` | enum | Pull-Down/Pull-Out/Standard |
| 2 | Number Of Handles | `a1aaZ000008mBviQAE` | number | 1 or 2 handle |
| 3 | Spout Height | `a1aaZ000008mBy9QAE` | number | Height specification |
| 4 | Spout Reach | `a1aaZ000008mByAQAU` | number | Reach specification |
| 5 | Faucet Holes | `a1aaZ000008mBsDQAU` | number | Hole requirement |
| 6 | Flow Rate (GPM) | `a1aaZ000008mBsSQAU` | number | Gallons per minute |
| 7 | Touchless Faucet | `a1aaZ000008mBylQAE` | boolean | Motion sensor |
| 8 | Handle Style | `a1aaZ000008mBtBQAU` | enum | Lever/Cross/Knob |
| 9 | Spout Style | `a1aaZ000008mByBQAU` | enum | Gooseneck/Standard |
| 10 | Spout Swivel | `a1aaZ000008mByCQAU` | boolean | 360° swivel |
| 11 | WaterSense Certified | `a1aaZ000008mBziQAE` | boolean | WaterSense certification |
| 12 | Deck Plate Included | ❌ *Not in SF* | boolean | Deck plate included |
| 13 | Valve Type | `a1aaZ000008mBzDQAU` | enum | Ceramic disc/Cartridge |
| 14 | Material | `a1aaZ000008mBupQAE` | enum | Brass/Stainless |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🥘 Pot Filler Faucets - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Mounting Type | `a1aaZ000008mBvLQAU` | enum | Wall Mount/Deck Mount |
| 2 | Spout Reach | `a1aaZ000008mByAQAU` | number | Extended reach |
| 3 | Number Of Handles | `a1aaZ000008mBviQAE` | number | 1 or 2 handle |
| 4 | Spout Swivel | `a1aaZ000008mByCQAU` | boolean | Articulating joints |
| 5 | Flow Rate (GPM) | `a1aaZ000008mBsSQAU` | number | Gallons per minute |
| 6 | Handle Style | `a1aaZ000008mBtBQAU` | enum | Lever/Cross/Wheel |
| 7 | Valve Type | `a1aaZ000008mBzDQAU` | enum | Ceramic disc/Compression |
| 8 | Valve Included | `a1aaZ000008mBz7QAE` | boolean | Rough-in valve included |
| 9 | Material | `a1aaZ000008mBupQAE` | enum | Brass/Stainless |
| 10 | Lead Leaching Certified NSF/ANSI 61 | `a1aaZ000008mBuRQAU` | boolean | NSF certified |
| 11 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 12 | Low Lead Compliant | `a1aaZ000008mBugQAE` | boolean | Lead-free |
| 13 | Approved for Commercial Use | `a1aaZ000008lz3qQAA` | boolean | Commercial grade |
| 14 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |
| 15 | Country Of Origin | `a1aaZ000008mBp0QAE` | string | Manufacturing origin |

---

### 🛁 Bathtubs - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Freestanding/Alcove/Drop-In/Undermount |
| 2 | Material | `a1aaZ000008mBupQAE` | enum | Acrylic/Cast Iron/Fiberglass/Stone |
| 3 | Drain Placement | `a1aaZ000008mBraQAE` | enum | Left/Right/Center/Reversible |
| 4 | Nominal Length | `a1aaZ000008mBvSQAU` | number | Tub length |
| 5 | Nominal Width | `a1aaZ000008mBvUQAU` | number | Tub width |
| 6 | Number Of Bathers | `a1aaZ000008mBvXQAU` | number | Capacity |
| 7 | Tub Shape | `a1aaZ000008mByvQAE` | enum | Rectangle/Oval/Corner |
| 8 | Capacity (Gallons) | `a1aaZ000008mBoDQAU` | number | Water capacity |
| 9 | Overflow | `a1aaZ000008mBwCQAU` | boolean | Has overflow |
| 10 | Drain Assembly Included | `a1aaZ000008mBrYQAU` | boolean | Drain included |
| 11 | Water Depth | `a1aaZ000008mBzcQAE` | number | Soaking depth |
| 12 | Accepts Deck Mount Faucet | `a1aaZ000008lz3UQAQ` | boolean | Faucet mounting |
| 13 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 14 | Soaking | `a1aaZ000008mBy0QAE` | boolean | Soaking tub |
| 15 | Number of Jets | `a1aaZ000008mBvkQAE` | number | Whirlpool jets |

---

### 🚿 Tub Faucets - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Mounting Type | `a1aaZ000008mBvLQAU` | enum | Wall Mount/Deck Mount/Freestanding |
| 2 | Number Of Handles | `a1aaZ000008mBviQAE` | number | 1, 2, or 3 handle |
| 3 | Handshower Included | `a1aaZ000008mBtIQAU` | boolean | Hand shower included |
| 4 | Diverter Included | `a1aaZ000008mBrNQAU` | boolean | Tub/shower diverter |
| 5 | Spout Reach | `a1aaZ000008mByAQAU` | number | Spout reach |
| 6 | Flow Rate (GPM) | `a1aaZ000008mBsSQAU` | number | Gallons per minute |
| 7 | Valve Included | `a1aaZ000008mBz7QAE` | boolean | Rough-in valve included |
| 8 | Handle Style | `a1aaZ000008mBtBQAU` | enum | Lever/Cross/Knob |
| 9 | Tub Spout Included | `a1aaZ000008mBywQAE` | boolean | Spout included |
| 10 | Clawfoot Tub Filler | `a1aaZ000008mBoUQAU` | boolean | For clawfoot tubs |
| 11 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 12 | Valve Type | `a1aaZ000008mBzDQAU` | enum | Pressure balance/Thermostatic |
| 13 | Low Lead Compliant | `a1aaZ000008mBugQAE` | boolean | Lead-free |
| 14 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |
| 15 | Material | `a1aaZ000008mBupQAE` | enum | Brass/Stainless |

---

### 🚿 Showers - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Shower Head Included | `a1aaZ000008mBxaQAE` | boolean | Showerhead included |
| 2 | Handshower Included | `a1aaZ000008mBtIQAU` | boolean | Hand shower included |
| 3 | Number Of Functions | `a1aaZ000008mBvhQAE` | number | Spray patterns |
| 4 | Valve Included | `a1aaZ000008mBz7QAE` | boolean | Rough-in valve included |
| 5 | Showerhead Flow Rate (GPM) | `a1aaZ000008mBxcQAE` | number | Flow rate |
| 6 | Spray Pattern | `a1aaZ000008mByGQAU` | enum | Rain/Massage/Mist |
| 7 | Bodysprays Included | `a1aaZ000008lz4vQAA` | boolean | Body jets included |
| 8 | Number Of Bodysprays | `a1aaZ000008mBvZQAU` | number | Body spray count |
| 9 | Slattribute_ide Bar Included | `a1aaZ000008mBxvQAE` | boolean | Slide bar included |
| 10 | Showerhead Shape | `a1aaZ000008mBxfQAE` | enum | Round/Square/Rectangular |
| 11 | Valve Type | `a1aaZ000008mBzDQAU` | enum | Pressure balance/Thermostatic |
| 12 | Volume Control | `a1aaZ000008mBzSQAU` | boolean | Volume control |
| 13 | H2Okinetic | `a1aaZ000008mBt3QAE` | boolean | H2Okinetic technology |
| 14 | WaterSense Certified | `a1aaZ000008mBziQAE` | boolean | WaterSense certified |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🧴 Shower Accessories - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Accessory Type | `a1aaZ000008lz3VQAQ` | enum | Shelf/Caddy/Hook/Bar |
| 2 | Material | `a1aaZ000008mBupQAE` | enum | Stainless/Brass/Plastic |
| 3 | Mounting Type | `a1aaZ000008mBvLQAU` | enum | Wall/Tension/Suction |
| 4 | Rust Resistant | `a1aaZ000008mBx0QAE` | boolean | Rust-proof |
| 5 | Number Of Shelves | `a1aaZ000008mBvtQAE` | number | Shelf count |
| 6 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 7 | Installation Hardware Included | `a1aaZ000008mBu6QAE` | boolean | Hardware included |
| 8 | Concealed Screws | `a1aaZ000008mBogQAE` | boolean | Hidden mounting |
| 9 | Approved for Commercial Use | `a1aaZ000008lz3qQAA` | boolean | Commercial grade |
| 10 | Slip Resistant | `a1aaZ000008mBxwQAE` | boolean | Non-slip surface |
| 11 | Adjustable | `a1aaZ000008lz3XQAQ` | boolean | Adjustable position |
| 12 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |
| 13 | Vandal Resistant | `a1aaZ000008mBzEQAU` | boolean | Anti-vandal |
| 14 | Projection | `a1aaZ000008mBwYQAU` | number | Wall projection |
| 15 | Marine Grade | `a1aaZ000008mBuoQAE` | boolean | Marine grade |

---

### 🧼 Bathroom Hardware and Accessories - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Accessory Type | `a1aaZ000008lz3VQAQ` | enum | Towel Bar/Hook/Ring/TP Holder |
| 2 | Material | `a1aaZ000008mBupQAE` | enum | Brass/Stainless/Zinc |
| 3 | Mounting Type | `a1aaZ000008mBvLQAU` | enum | Wall Mount/Adhesive |
| 4 | Installation Hardware Included | `a1aaZ000008mBu6QAE` | boolean | Hardware included |
| 5 | Concealed Screws | `a1aaZ000008mBogQAE` | boolean | Hidden mounting |
| 6 | Rust Resistant | `a1aaZ000008mBx0QAE` | boolean | Corrosion resistant |
| 7 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 8 | Projection | `a1aaZ000008mBwYQAU` | number | Wall projection |
| 9 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |
| 10 | Comes in Set | `a1aaZ000008mBodQAE` | boolean | Part of a set |
| 11 | Number of Bars | `a1aaZ000008mBvVQAU` | number | Bar count (towel bars) |
| 12 | Number of Rolls | `a1aaZ000008mBvsQAE` | number | Roll capacity (TP holders) |
| 13 | Approved for Commercial Use | `a1aaZ000008lz3qQAA` | boolean | Commercial grade |
| 14 | Vandal Resistant | `a1aaZ000008mBzEQAU` | boolean | Anti-vandal |
| 15 | Marine Grade | `a1aaZ000008mBuoQAE` | boolean | Marine grade |

---

### 🪞 Bathroom Mirrors - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Mirror Type | `a1aaZ000008mBvEQAU` | enum | Wall/Vanity/Magnifying/Lighted |
| 2 | Mirror Shape | `a1aaZ000008mBvDQAU` | enum | Rectangle/Round/Oval/Arch |
| 3 | LED | `a1aaZ000008mBuSQAU` | boolean | LED lighting |
| 4 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable lights |
| 5 | Frame Material | `a1aaZ000008mBsZQAU` | enum | Metal/Wood/Frameless |
| 6 | Medicine Cabinet Included | `a1aaZ000008mBuzQAE` | boolean | Medicine cabinet |
| 7 | Mirror Features | `a1aaZ000008mBvAQAU` | enum | Fog-free/Magnification |
| 8 | Adjustable Color Temperature | `a1aaZ000008lz3YQAQ` | boolean | Color temp adjustment |
| 9 | Mounting Type | `a1aaZ000008mBvLQAU` | enum | Wall/Recessed |
| 10 | Touch Faucet | `a1aaZ000008mBykQAE` | boolean | Touch controls |
| 11 | USB Port | `a1aaZ000008mBz5QAE` | boolean | USB charging port |
| 12 | Electrical Outlet | `a1aaZ000008mBrpQAE` | boolean | Built-in outlet |
| 13 | Orientation | `a1aaZ000008mBw3QAE` | enum | Horizontal/Vertical |
| 14 | Beveled | ❌ *Not in SF* | boolean | Beveled edge |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🗄️ Bathroom Vanities - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Configuration | `a1aaZ000008mBojQAE` | enum | Single/Double sink |
| 2 | Vanity Top Included | `a1aaZ000008mBzHQAU` | boolean | Countertop included |
| 3 | Vanity Top Material | `a1aaZ000008mBzIQAU` | enum | Marble/Quartz/Granite |
| 4 | Sink Included | `a1aaZ000008mBxoQAE` | boolean | Sink included |
| 5 | Cabinet Material | `a1aaZ000008mBo7QAE` | enum | Solid Wood/Plywood/MDF |
| 6 | Number Of Drawers | `a1aaZ000008mBvfQAE` | number | Drawer count |
| 7 | Number Of Doors | `a1aaZ000008mBvdQAE` | number | Door count |
| 8 | Faucet Included | `a1aaZ000008mBsEQAU` | boolean | Faucet included |
| 9 | Mirror Included | `a1aaZ000008mBvCQAU` | boolean | Mirror included |
| 10 | Soft Close Hinges | `a1aaZ000008mBy2QAE` | boolean | Soft close |
| 11 | Soft Close Slattribute_ides | `a1aaZ000008mBy3QAE` | boolean | Soft close drawers |
| 12 | Assembly Required | `a1aaZ000008lz3wQAA` | boolean | Assembly needed |
| 13 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 14 | Faucet Holes | `a1aaZ000008mBsDQAU` | number | Pre-drilled holes |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🚿 Bathroom Sinks - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Undermount/Drop-In/Vessel/Pedestal |
| 2 | Sink Shape | `a1aaZ000008mBxrQAE` | enum | Rectangular/Oval/Round/Square |
| 3 | Sink Material | `a1aaZ000008mBxqQAE` | enum | Vitreous China/Fireclay/Glass |
| 4 | Number Of Basins | `a1aaZ000008mBvWQAU` | number | Single/Double |
| 5 | Faucet Holes | `a1aaZ000008mBsDQAU` | number | Pre-drilled holes |
| 6 | Overflow | `a1aaZ000008mBwCQAU` | boolean | Has overflow |
| 7 | Basin Depth | `a1aaZ000008lz4PQAQ` | number | Bowl depth |
| 8 | Drain Assembly Included | `a1aaZ000008mBrYQAU` | boolean | Drain included |
| 9 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 10 | Faucet Centers | `a1aaZ000008mBsBQAU` | number | Faucet spacing |
| 11 | Approved for Commercial Use | `a1aaZ000008lz3qQAA` | boolean | Commercial grade |
| 12 | Sound Dampening | `a1aaZ000008mBy7QAE` | boolean | Sound insulation |
| 13 | Pop-Up Included | `a1aaZ000008mBwPQAU` | boolean | Pop-up drain |
| 14 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |
| 15 | Certifications | `a1aaZ000008mBoMQAU` | string | Safety certifications |

---

### 🍸 Bar & Prep Sinks - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Undermount/Drop-In/Flush Mount |
| 2 | Sink Material | `a1aaZ000008mBxqQAE` | enum | Stainless/Copper/Fireclay |
| 3 | Sink Shape | `a1aaZ000008mBxrQAE` | enum | Round/Square/Rectangular |
| 4 | Number Of Basins | `a1aaZ000008mBvWQAU` | number | Single/Double |
| 5 | Basin Depth | `a1aaZ000008lz4PQAQ` | number | Bowl depth |
| 6 | Faucet Holes | `a1aaZ000008mBsDQAU` | number | Pre-drilled holes |
| 7 | Gauge | `a1aaZ000008mBstQAE` | number | Steel gauge (lower = thicker) |
| 8 | Sound Dampening | `a1aaZ000008mBy7QAE` | boolean | Sound pads |
| 9 | Drain Assembly Included | `a1aaZ000008mBrYQAU` | boolean | Drain included |
| 10 | Basin Rack Included | `a1aaZ000008lz4XQAQ` | boolean | Grid included |
| 11 | Corner Sink | `a1aaZ000008mBoxQAE` | boolean | Corner installation |
| 12 | Drainboard | `a1aaZ000008mBrdQAE` | boolean | Has drainboard |
| 13 | Stainless Steel Grade | `a1aaZ000008mByJQAU` | enum | 304/316 stainless |
| 14 | Workstation Sink | `a1aaZ000008mBzxQAE` | boolean | Workstation style |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🍳 Kitchen Sinks - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Undermount/Drop-In/Farmhouse |
| 2 | Sink Material | `a1aaZ000008mBxqQAE` | enum | Stainless/Granite/Fireclay |
| 3 | Configuration | `a1aaZ000008mBojQAE` | enum | Single/Double/Triple Bowl |
| 4 | Basin Depth | `a1aaZ000008lz4PQAQ` | number | Bowl depth |
| 5 | Number Of Basins | `a1aaZ000008mBvWQAU` | number | Bowl count |
| 6 | Gauge | `a1aaZ000008mBstQAE` | number | Steel gauge |
| 7 | Faucet Holes | `a1aaZ000008mBsDQAU` | number | Pre-drilled holes |
| 8 | Sound Dampening | `a1aaZ000008mBy7QAE` | boolean | Sound insulation |
| 9 | Farmhouse | `a1aaZ000008mBsAQAU` | boolean | Apron front |
| 10 | Drain Assembly Included | `a1aaZ000008mBrYQAU` | boolean | Drain included |
| 11 | Basin Rack Included | `a1aaZ000008lz4XQAQ` | boolean | Grid included |
| 12 | Workstation Sink | `a1aaZ000008mBzxQAE` | boolean | Workstation style |
| 13 | Cutting Board Included | `a1aaZ000008mBpCQAU` | boolean | Cutting board |
| 14 | Colander Included | `a1aaZ000008mBoYQAU` | boolean | Colander included |
| 15 | Stainless Steel Grade | `a1aaZ000008mByJQAU` | enum | Steel grade |

---

### 🗑️ Garbage Disposals - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Horsepower | `a1aaZ000008mBtZQAU` | number | Motor power |
| 2 | Feed Type | `a1aaZ000008mBsIQAU` | enum | Continuous/Batch |
| 3 | Noise Level | `a1aaZ000008mBvOQAU` | number | Sound level |
| 4 | Motor Type | `a1aaZ000008mBvJQAU` | enum | Induction/Permanent Magnet |
| 5 | Sound Dampening | `a1aaZ000008mBy7QAE` | boolean | Sound insulation |
| 6 | Auto Shut Off | `a1aaZ000008lz3yQAA` | boolean | Auto reverse/shutoff |
| 7 | Stainless Steel Interior | `a1aaZ000008mByKQAU` | boolean | SS grind components |
| 8 | Power Source | `a1aaZ000008mBwTQAU` | enum | Corded/Hardwired |
| 9 | Voltage | `a1aaZ000008mBzQQAU` | number | Voltage requirement |
| 10 | Amperage | `a1aaZ000008lz3iQAA` | number | Amp draw |
| 11 | RPM | `a1aaZ000008mBwxQAE` | number | Grinding speed |
| 12 | Mounting Type | `a1aaZ000008mBvLQAU` | enum | 3-bolt/EZ mount |
| 13 | Manufacturer Warranty | `a1aaZ000008mBunQAE` | string | Warranty period |
| 14 | Septic Safe | ❌ *Not in SF* | boolean | Septic approved |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🚰 Drains - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Drain Type | `a1aaZ000008mBrcQAE` | enum | Pop-Up/Push-Button/Grid |
| 2 | Drain Connection | `a1aaZ000008mBrZQAU` | number | Connection size |
| 3 | Material | `a1aaZ000008mBupQAE` | enum | Brass/Stainless/PVC |
| 4 | Overflow | `a1aaZ000008mBwCQAU` | boolean | With/Without overflow |
| 5 | Application | `a1aaZ000008lz3pQAA` | enum | Sink/Tub/Shower |
| 6 | Adjustable | `a1aaZ000008lz3XQAQ` | boolean | Adjustable height |
| 7 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Standard/Linear/Tile-In |
| 8 | Low Lead Compliant | `a1aaZ000008mBugQAE` | boolean | Lead-free |
| 9 | Installation Hardware Included | `a1aaZ000008mBu6QAE` | boolean | Hardware included |
| 10 | Rust Resistant | `a1aaZ000008mBx0QAE` | boolean | Corrosion resistant |
| 11 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 12 | Flow Rate (GPM) | `a1aaZ000008mBsSQAU` | number | Flow rate |
| 13 | Approved for Commercial Use | `a1aaZ000008lz3qQAA` | boolean | Commercial grade |
| 14 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |
| 15 | Certifications | `a1aaZ000008mBoMQAU` | string | Safety certs |

---

### 🔧 Rough-In Valves - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Valve Type | `a1aaZ000008mBzDQAU` | enum | Pressure Balance/Thermostatic |
| 2 | Number Of Functions | `a1aaZ000008mBvhQAE` | number | 1/2/3/4 function |
| 3 | Integrated Volume Control | `a1aaZ000008mBu9QAE` | boolean | Volume control built-in |
| 4 | Integrated Diverter | `a1aaZ000008mBu8QAE` | boolean | Diverter built-in |
| 5 | Inlet Area | `a1aaZ000008mBu4QAE` | string | Connection type |
| 6 | Service Stops Included | `a1aaZ000008mBxGQAU` | boolean | Shutoff stops |
| 7 | Valve Trim Included | `a1aaZ000008mBzAQAU` | boolean | Trim kit included |
| 8 | Flow Rate (GPM) | `a1aaZ000008mBsSQAU` | number | Maximum flow |
| 9 | ASSE Code | `a1aaZ000008lz3vQAA` | string | ASSE certification |
| 10 | For Use With | ❌ *Not in SF* | string | Compatible fixtures |
| 11 | Scald Guard | `a1aaZ000008mBx5QAE` | boolean | Anti-scald feature |
| 12 | Low Lead Compliant | `a1aaZ000008mBugQAE` | boolean | Lead-free |
| 13 | Approved for Commercial Use | `a1aaZ000008lz3qQAA` | boolean | Commercial grade |
| 14 | Valve Technology | `a1aaZ000008mBz8QAE` | enum | Cartridge type |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🌊 Bidets - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Floor Mount/Wall Mount |
| 2 | Material | `a1aaZ000008mBupQAE` | enum | Vitreous China/Porcelain |
| 3 | Faucet Holes | `a1aaZ000008mBsDQAU` | number | Pre-drilled holes |
| 4 | Spray Adjustability | ❌ *Not in SF* | boolean | Adjustable spray |
| 5 | Heater Included | `a1aaZ000008mBtMQAU` | boolean | Heated seat |
| 6 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 7 | Drain Assembly Included | `a1aaZ000008mBrYQAU` | boolean | Drain included |
| 8 | Overflow | `a1aaZ000008mBwCQAU` | boolean | Has overflow |
| 9 | Rough In | `a1aaZ000008mBwwQAE` | number | Rough-in size |
| 10 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |
| 11 | Night Light | `a1aaZ000008mBvMQAU` | boolean | LED light |
| 12 | Remote Control | ❌ *Not in SF* | boolean | Remote included |
| 13 | Air Dryer | ❌ *Not in SF* | boolean | Built-in dryer |
| 14 | Deodorizer | ❌ *Not in SF* | boolean | Deodorizer function |
| 15 | Certifications | `a1aaZ000008mBoMQAU` | string | Safety certs |

---

### 🚿 Steam Showers - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Kilowatts | `a1aaZ000008mBuKQAU` | number | Generator power |
| 2 | Max Room Volume | `a1aaZ000008mBusQAE` | number | Coverage area (cu ft) |
| 3 | Voltage | `a1aaZ000008mBzQQAU` | number | Electrical requirement |
| 4 | Control Type | `a1aaZ000008mBonQAE` | enum | Digital/Analog |
| 5 | Chromatherapy | `a1aaZ000008mBoTQAU` | boolean | Color light therapy |
| 6 | Built-In Speakers | `a1aaZ000008mBntQAE` | boolean | Audio system |
| 7 | Aromatherapy | ❌ *Not in SF* | boolean | Essential oil injection |
| 8 | Auto Drain | ❌ *Not in SF* | boolean | Auto drain feature |
| 9 | App Compatibility | `a1aaZ000008lz3oQAA` | boolean | Smartphone control |
| 10 | Includes Timer | `a1aaZ000008mBu0QAE` | boolean | Timer function |
| 11 | Temperature Display | `a1aaZ000008mByZQAU` | boolean | Digital display |
| 12 | Settings | `a1aaZ000008mBxHQAU` | number | Pre-set options |
| 13 | Manufacturer Warranty | `a1aaZ000008mBunQAE` | string | Warranty period |
| 14 | Electrical Phases | `a1aaZ000008mBrqQAE` | enum | Single/Three phase |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🔥 Water Heaters - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Fuel Type | `a1aaZ000008mBsmQAE` | enum | Gas/Electric/Heat Pump/Solar |
| 2 | Total Capacity | `a1aaZ000008mByiQAE` | number | Tank gallons |
| 3 | Configuration | `a1aaZ000008mBojQAE` | enum | Tank/Tankless |
| 4 | BTU Output | `a1aaZ000008mBnrQAE` | number | Heating power |
| 5 | Flow Rate (GPM) | `a1aaZ000008mBsSQAU` | number | Tankless flow rate |
| 6 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 7 | Energy Efficient | `a1aaZ000008mBruQAE` | boolean | High efficiency |
| 8 | Voltage | `a1aaZ000008mBzQQAU` | number | Electrical requirement |
| 9 | Vent Type | `a1aaZ000008mBzMQAU` | enum | Direct/Power/Atmospheric |
| 10 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Standard/Lowboy/Point-of-Use |
| 11 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | WiFi connectivity |
| 12 | Temperature Display | `a1aaZ000008mByZQAU` | boolean | Digital display |
| 13 | Manufacturer Warranty | `a1aaZ000008mBunQAE` | string | Warranty period |
| 14 | AHRI Production | `a1aaZ000008lz3cQAA` | number | First hour rating |
| 15 | Outdoor Approved | `a1aaZ000008mBw4QAE` | boolean | Outdoor rated |

---

## LIGHTING DEPARTMENT

### 💡 Chandeliers - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Number Of Lights | `a1aaZ000008mBvoQAE` | number | Light/bulb count |
| 2 | Chandelier Type | `a1aaZ000008mBoRQAU` | enum | Traditional/Modern/Crystal/Drum |
| 3 | Material | `a1aaZ000008mBupQAE` | enum | Crystal/Glass/Metal/Wood |
| 4 | Bulb Type | `a1aaZ000008mBnyQAE` | enum | LED/Incandescent/Candelabra |
| 5 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable compatible |
| 6 | Maximum Adjustable Height | `a1aaZ000008mBuvQAE` | number | Adjustable height range |
| 7 | Bulb Included | `a1aaZ000008mBnwQAE` | boolean | Bulbs included |
| 8 | Location Rating | `a1aaZ000008mBucQAE` | enum | Dry/Damp/Wet rated |
| 9 | Sloped Ceiling Compatible | `a1aaZ000008mBxxQAE` | boolean | Sloped ceiling mount |
| 10 | Crystal Type | `a1aaZ000008mBp3QAE` | enum | K9/Swarovski/Glass |
| 11 | Chain Length | `a1aaZ000008mBoQQAU` | number | Chain/cord length |
| 12 | Shade Material | `a1aaZ000008mBxOQAU` | enum | Glass/Fabric/Metal |
| 13 | Number of Tiers | `a1aaZ000008mBvxQAE` | number | Tier count |
| 14 | Shape | `a1aaZ000008mBxTQAU` | enum | Round/Linear/Rectangular |
| 15 | LED | `a1aaZ000008mBuSQAU` | boolean | Integrated LED |

---

### 🌀 Ceiling Fans - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Blade Span | `a1aaZ000008lz4pQAA` | number | **#1 filter** - 42/52/60/72 inches |
| 2 | Number of Blades | `a1aaZ000008mBvYQAU` | number | 3/4/5/6 blades |
| 3 | Light Kit Included | `a1aaZ000008mBubQAE` | boolean | Light included |
| 4 | Motor Type | `a1aaZ000008mBvJQAU` | enum | DC/AC motor |
| 5 | Location Rating | `a1aaZ000008mBucQAE` | enum | Indoor/Outdoor/Damp/Wet |
| 6 | Fan Speeds | `a1aaZ000008mBs8QAE` | number | Speed settings |
| 7 | Includes Remote | `a1aaZ000008mBtwQAE` | boolean | Remote included |
| 8 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | WiFi/Smart compatible |
| 9 | Reversible Motor | `a1aaZ000008mBwrQAE` | boolean | Reversible airflow |
| 10 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 11 | CFM | `a1aaZ000008mBoNQAU` | number | Airflow rating |
| 12 | Fan Blade Material | `a1aaZ000008mBs7QAE` | enum | Wood/ABS/Metal |
| 13 | Downrod(s) Included | `a1aaZ000008mBrXQAU` | boolean | Downrod included |
| 14 | Light Kit Compatible | `a1aaZ000008mBuaQAE` | boolean | Can add light kit |
| 15 | Low Ceiling Adaptable | `a1aaZ000008mBufQAE` | boolean | Flush/hugger mount |

---

### 🔦 Pendant Lights - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Number Of Lights | `a1aaZ000008mBvoQAE` | number | Light count |
| 2 | Pendant Type | `a1aaZ000008mBwKQAU` | enum | Mini/Standard/Multi-Light |
| 3 | Shade Material | `a1aaZ000008mBxOQAU` | enum | Glass/Metal/Fabric/Rattan |
| 4 | Bulb Type | `a1aaZ000008mBnyQAE` | enum | LED/Edison/Incandescent |
| 5 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable compatible |
| 6 | Maximum Adjustable Height | `a1aaZ000008mBuvQAE` | number | Adjustable height |
| 7 | Bulb Included | `a1aaZ000008mBnwQAE` | boolean | Bulbs included |
| 8 | Location Rating | `a1aaZ000008mBucQAE` | enum | Dry/Damp rated |
| 9 | Sloped Ceiling Compatible | `a1aaZ000008mBxxQAE` | boolean | Sloped ceiling |
| 10 | Cord Length | `a1aaZ000008mBowQAE` | number | Cord/chain length |
| 11 | Shape | `a1aaZ000008mBxTQAU` | enum | Globe/Dome/Cylinder/Bell |
| 12 | LED | `a1aaZ000008mBuSQAU` | boolean | Integrated LED |
| 13 | Wattage | `a1aaZ000008mBzkQAE` | number | Max wattage |
| 14 | Shade Diameter | `a1aaZ000008mBxMQAU` | number | Shade size |
| 15 | Pendant Size | `a1aaZ000008mBwJQAU` | enum | Small/Medium/Large |

---

### 💡 Ceiling Lights (Flush/Semi-Flush) - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Number Of Lights | `a1aaZ000008mBvoQAE` | number | Light/bulb count |
| 2 | Fixture Type | `a1aaZ000008mBsNQAU` | enum | Flush/Semi-Flush |
| 3 | Shape | `a1aaZ000008mBxTQAU` | enum | Round/Square/Rectangle |
| 4 | Shade Material | `a1aaZ000008mBxOQAU` | enum | Glass/Acrylic/Fabric |
| 5 | Bulb Type | `a1aaZ000008mBnyQAE` | enum | LED/Fluorescent/Incandescent |
| 6 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable compatible |
| 7 | Bulb Included | `a1aaZ000008mBnwQAE` | boolean | Bulbs included |
| 8 | LED | `a1aaZ000008mBuSQAU` | boolean | Integrated LED |
| 9 | Location Rating | `a1aaZ000008mBucQAE` | enum | Dry/Damp/Wet rated |
| 10 | Lumens | `a1aaZ000008mBuiQAE` | number | Light output |
| 11 | Color Temperature | `a1aaZ000008mBocQAE` | number | Kelvin rating |
| 12 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 13 | Sloped Ceiling Compatible | `a1aaZ000008mBxxQAE` | boolean | Sloped ceiling |
| 14 | Material | `a1aaZ000008mBupQAE` | enum | Metal/Glass/Crystal |
| 15 | Canopy Size | `a1aaZ000008mBoHQAU` | number | Ceiling plate size |

---

### 🪞 Bathroom/Vanity Lighting - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Number Of Lights | `a1aaZ000008mBvoQAE` | number | Light count |
| 2 | Light Direction | `a1aaZ000008mBuZQAU` | enum | Up/Down/Up & Down |
| 3 | Mounting Type | `a1aaZ000008mBvLQAU` | enum | Wall/Ceiling |
| 4 | Shade Material | `a1aaZ000008mBxOQAU` | enum | Glass/Opal/Frosted |
| 5 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable compatible |
| 6 | Bulb Type | `a1aaZ000008mBnyQAE` | enum | LED/G9/E26 |
| 7 | Location Rating | `a1aaZ000008mBucQAE` | enum | Damp/Wet rated |
| 8 | Bulb Included | `a1aaZ000008mBnwQAE` | boolean | Bulbs included |
| 9 | LED | `a1aaZ000008mBuSQAU` | boolean | Integrated LED |
| 10 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 11 | Backplate Shape | `a1aaZ000008lz4NQAQ` | enum | Rectangle/Round |
| 12 | Shade Shape | `a1aaZ000008mBxPQAU` | enum | Globe/Cylinder/Bell |
| 13 | Wattage | `a1aaZ000008mBzkQAE` | number | Max wattage |
| 14 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |
| 15 | Color Temperature | `a1aaZ000008mBocQAE` | number | Kelvin rating |

---

### 🏮 Wall Sconces - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Number Of Lights | `a1aaZ000008mBvoQAE` | number | Light count |
| 2 | Light Direction | `a1aaZ000008mBuZQAU` | enum | Up/Down/Up & Down |
| 3 | Shade Material | `a1aaZ000008mBxOQAU` | enum | Glass/Metal/Fabric |
| 4 | Bulb Type | `a1aaZ000008mBnyQAE` | enum | LED/Candelabra/E26 |
| 5 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable compatible |
| 6 | Location Rating | `a1aaZ000008mBucQAE` | enum | Dry/Damp/Wet rated |
| 7 | Bulb Included | `a1aaZ000008mBnwQAE` | boolean | Bulbs included |
| 8 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant (depth ≤4") |
| 9 | Backplate Shape | `a1aaZ000008lz4NQAQ` | enum | Rectangle/Round/Oval |
| 10 | LED | `a1aaZ000008mBuSQAU` | boolean | Integrated LED |
| 11 | Projection | `a1aaZ000008mBwYQAU` | number | Wall projection |
| 12 | Hardwired | `a1aaZ000008mBt5QAE` | boolean | Hardwired installation |
| 13 | Switch On Fixture | `a1aaZ000008mByPQAU` | boolean | Built-in switch |
| 14 | Wattage | `a1aaZ000008mBzkQAE` | number | Max wattage |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🔆 Recessed Lighting - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Housing Type | `a1aaZ000008mBtdQAE` | enum | IC/Non-IC/Remodel/New Construction |
| 2 | Aperture Size | `a1aaZ000008lz3nQAA` | number | 4"/5"/6" opening |
| 3 | Trim Type | `a1aaZ000008mByuQAE` | enum | Baffle/Reflector/Gimbal/Shower |
| 4 | LED | `a1aaZ000008mBuSQAU` | boolean | Integrated LED |
| 5 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable compatible |
| 6 | Lumens | `a1aaZ000008mBuiQAE` | number | Light output |
| 7 | Color Temperature | `a1aaZ000008mBocQAE` | number | Kelvin rating |
| 8 | Location Rating | `a1aaZ000008mBucQAE` | enum | Dry/Damp/Wet/Shower |
| 9 | Adjustable Color Temperature | `a1aaZ000008lz3YQAQ` | boolean | Tunable white |
| 10 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 11 | Air Tight | `a1aaZ000008lz3kQAA` | boolean | Air-tight rated |
| 12 | Fire Rated | `a1aaZ000008mBsLQAU` | boolean | Fire-rated housing |
| 13 | Wattage | `a1aaZ000008mBzkQAE` | number | Wattage |
| 14 | CRI | `a1aaZ000008mBoBQAU` | number | Color rendering index |
| 15 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | Smart compatible |

---

### 💡 Track Lighting - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Number Of Lights | `a1aaZ000008mBvoQAE` | number | Head count |
| 2 | Track Type | `a1aaZ000008mByqQAE` | enum | H/J/L compatible |
| 3 | Track Length | `a1aaZ000008mByrQAE` | number | Track length |
| 4 | Fixture Type | `a1aaZ000008mBsNQAU` | enum | Fixed/Gimbal/Pendant |
| 5 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable compatible |
| 6 | Bulb Type | `a1aaZ000008mBnyQAE` | enum | LED/GU10/PAR |
| 7 | LED | `a1aaZ000008mBuSQAU` | boolean | Integrated LED |
| 8 | Bulb Included | `a1aaZ000008mBnwQAE` | boolean | Bulbs included |
| 9 | Adjustable | `a1aaZ000008lz3XQAQ` | boolean | Adjustable heads |
| 10 | Shape | `a1aaZ000008mBxTQAU` | enum | Linear/L/U-shaped |
| 11 | Sloped Ceiling Compatible | `a1aaZ000008mBxxQAE` | boolean | Sloped ceiling |
| 12 | Voltage | `a1aaZ000008mBzQQAU` | number | Line/Low voltage |
| 13 | Wattage | `a1aaZ000008mBzkQAE` | number | Max wattage |
| 14 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🌳 Outdoor Lighting - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Light Type | `a1aaZ000008mBuYQAU` | enum | Wall/Post/Path/Flood/Landscape |
| 2 | Location Rating | `a1aaZ000008mBucQAE` | enum | Wet rated (required) |
| 3 | Motion Sensor | `a1aaZ000008mBvHQAU` | boolean | Motion activated |
| 4 | Dusk to Dawn | `a1aaZ000008mBriQAE` | boolean | Photocell sensor |
| 5 | LED | `a1aaZ000008mBuSQAU` | boolean | Integrated LED |
| 6 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable compatible |
| 7 | Solar | `a1aaZ000008mBy4QAE` | boolean | Solar powered |
| 8 | Number Of Lights | `a1aaZ000008mBvoQAE` | number | Light count |
| 9 | Bulb Type | `a1aaZ000008mBnyQAE` | enum | LED/Incandescent |
| 10 | Material | `a1aaZ000008mBupQAE` | enum | Aluminum/Brass/Stainless |
| 11 | Lumens | `a1aaZ000008mBuiQAE` | number | Light output |
| 12 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | Smart compatible |
| 13 | Dark Sky Compliant | `a1aaZ000008mBp9QAE` | boolean | Dark sky certified |
| 14 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 15 | Post Size | `a1aaZ000008mBwXQAU` | number | Post mount diameter |

---

### 🪔 Lamps - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Lamp Type | `a1aaZ000008mBuQQAU` | enum | Table/Floor/Desk/Torchiere |
| 2 | Shade Material | `a1aaZ000008mBxOQAU` | enum | Fabric/Glass/Metal/Paper |
| 3 | Number Of Lights | `a1aaZ000008mBvoQAE` | number | Light count |
| 4 | Bulb Type | `a1aaZ000008mBnyQAE` | enum | LED/E26/CFL |
| 5 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable compatible |
| 6 | Switch Type | `a1aaZ000008mByMQAU` | enum | 3-Way/On-Off/Touch/Pull Chain |
| 7 | Bulb Included | `a1aaZ000008mBnwQAE` | boolean | Bulbs included |
| 8 | USB Port | `a1aaZ000008mBz5QAE` | boolean | USB charging port |
| 9 | Electrical Outlet | `a1aaZ000008mBrpQAE` | boolean | Built-in outlet |
| 10 | Shade Shape | `a1aaZ000008mBxPQAU` | enum | Drum/Empire/Bell/Rectangular |
| 11 | Adjustable | `a1aaZ000008lz3XQAQ` | boolean | Adjustable arm/height |
| 12 | LED | `a1aaZ000008mBuSQAU` | boolean | Integrated LED |
| 13 | Material | `a1aaZ000008mBupQAE` | enum | Metal/Wood/Ceramic/Glass |
| 14 | Wattage | `a1aaZ000008mBzkQAE` | number | Max wattage |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🏢 Commercial Lighting - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Fixture Type | `a1aaZ000008mBsNQAU` | enum | Troffer/Linear/High Bay |
| 2 | Lumens | `a1aaZ000008mBuiQAE` | number | Light output |
| 3 | Wattage | `a1aaZ000008mBzkQAE` | number | Power consumption |
| 4 | LED | `a1aaZ000008mBuSQAU` | boolean | LED technology |
| 5 | Color Temperature | `a1aaZ000008mBocQAE` | number | 3500K/4000K/5000K |
| 6 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable |
| 7 | DLC | `a1aaZ000008mBpIQAU` | boolean | DLC qualified |
| 8 | CRI | `a1aaZ000008mBoBQAU` | number | Color rendering |
| 9 | Voltage | `a1aaZ000008mBzQQAU` | number | Voltage range |
| 10 | Location Rating | `a1aaZ000008mBucQAE` | enum | Dry/Damp/Wet |
| 11 | Grid Size | `a1aaZ000008mBsxQAE` | enum | 2x2/2x4 grid |
| 12 | Mounting Type | `a1aaZ000008mBvLQAU` | enum | Surface/Recessed/Pendant |
| 13 | Emergency Battery | `a1aaZ000008mBrnQAE` | boolean | Battery backup |
| 14 | Vandal Resistant | `a1aaZ000008mBzEQAU` | boolean | Vandal-proof |
| 15 | Sensor Compatible | `a1aaZ000008mBx6QAE` | boolean | Occupancy sensor |

---

### 🛋️ Under Cabinet Lighting - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | LED | `a1aaZ000008mBuSQAU` | boolean | Integrated LED |
| 2 | Fixture Length | `a1aaZ000008mBsPQAU` | number | Light bar length |
| 3 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable |
| 4 | Color Temperature | `a1aaZ000008mBocQAE` | number | Warm/Neutral/Cool |
| 5 | Lumens | `a1aaZ000008mBuiQAE` | number | Light output |
| 6 | Linkable | `a1aaZ000008mBueQAE` | boolean | Can link multiple |
| 7 | Plug In | `a1aaZ000008mBwSQAU` | boolean | Plug-in vs hardwired |
| 8 | Hardwired | `a1aaZ000008mBt5QAE` | boolean | Direct wire |
| 9 | Light Type | `a1aaZ000008mBuYQAU` | enum | Bar/Puck/Tape |
| 10 | Adjustable Color Temperature | `a1aaZ000008lz3YQAQ` | boolean | Tunable white |
| 11 | Motion Sensor | `a1aaZ000008mBvHQAU` | boolean | Motion activated |
| 12 | Switch On Fixture | `a1aaZ000008mByPQAU` | boolean | Built-in switch |
| 13 | CRI | `a1aaZ000008mBoBQAU` | number | Color rendering |
| 14 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR |
| 15 | Wattage | `a1aaZ000008mBzkQAE` | number | Power consumption |

---

### 🌟 Ceiling Fan Accessories - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Accessory Type | `a1aaZ000008lz3VQAQ` | enum | Light Kit/Blade Set/Downrod |
| 2 | Blade Span | `a1aaZ000008lz4pQAA` | number | Blade size |
| 3 | Number of Blades | `a1aaZ000008mBvYQAU` | number | Blade count |
| 4 | Fan Blade Material | `a1aaZ000008mBs7QAE` | enum | Wood/ABS/Metal |
| 5 | Number Of Lights | `a1aaZ000008mBvoQAE` | number | Light count (kits) |
| 6 | Bulb Type | `a1aaZ000008mBnyQAE` | enum | LED/E26/Candelabra |
| 7 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable kit |
| 8 | LED | `a1aaZ000008mBuSQAU` | boolean | Integrated LED |
| 9 | Bulb Included | `a1aaZ000008mBnwQAE` | boolean | Bulbs included |
| 10 | For Outdoor Use | `a1aaZ000008mBsmQAE` | boolean | Outdoor rated |
| 11 | Shade Material | `a1aaZ000008mBxOQAU` | enum | Glass/Opal/Metal |
| 12 | Reversible | `a1aaZ000008mBwrQAE` | boolean | Reversible blades |
| 13 | Universal Fit | ❌ *Not in SF* | boolean | Universal mount |
| 14 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |
| 15 | Downrod Length | `a1aaZ000008mBrWQAU` | number | Downrod size |

---

## HOME DECOR & FIXTURES DEPARTMENT

### 🚪 Cabinet Hardware - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Hardware Type | `a1aaZ000008mBt7QAE` | enum | Knob/Pull/Handle/Latch |
| 2 | Center To Center | `a1aaZ000008mBoLQAU` | number | Hole spacing (3"/4"/5") |
| 3 | Material | `a1aaZ000008mBupQAE` | enum | Brass/Zinc/Stainless/Crystal |
| 4 | Shape | `a1aaZ000008mBxTQAU` | enum | Round/Square/Bar/Cup |
| 5 | Projection | `a1aaZ000008mBwYQAU` | number | Projection from surface |
| 6 | Installation Hardware Included | `a1aaZ000008mBu6QAE` | boolean | Screws included |
| 7 | Overall Length | `a1aaZ000008mBw7QAE` | number | Total length |
| 8 | Antimicrobial | `a1aaZ000008lz3mQAA` | boolean | Antimicrobial finish |
| 9 | Approved for Commercial Use | `a1aaZ000008lz3qQAA` | boolean | Commercial grade |
| 10 | Backplate Included | `a1aaZ000008lz4OQAQ` | boolean | Backplate included |
| 11 | Adjustable | `a1aaZ000008lz3XQAQ` | boolean | Adjustable length |
| 12 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 13 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |
| 14 | Comes in Set | `a1aaZ000008mBodQAE` | boolean | Multi-pack |
| 15 | Country Of Origin | `a1aaZ000008mBp0QAE` | string | Manufacturing origin |

---

### 🗄️ Cabinet Organization - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Organizer Type | ❌ *Not in SF* | enum | Shelf/Drawer/Lazy Susan/Pull-Out |
| 2 | Material | `a1aaZ000008mBupQAE` | enum | Wire/Wood/Plastic/Stainless |
| 3 | Number Of Shelves | `a1aaZ000008mBvtQAE` | number | Shelf count |
| 4 | Adjustable | `a1aaZ000008lz3XQAQ` | boolean | Adjustable shelves |
| 5 | Soft Close Hinges | `a1aaZ000008mBy2QAE` | boolean | Soft close |
| 6 | Soft Close Slattribute_ides | `a1aaZ000008mBy3QAE` | boolean | Soft close slides |
| 7 | Full Extension | `a1aaZ000008mBssQAE` | boolean | Full extension slides |
| 8 | Installation Hardware Included | `a1aaZ000008mBu6QAE` | boolean | Hardware included |
| 9 | Assembly Required | `a1aaZ000008lz3wQAA` | boolean | Assembly needed |
| 10 | Pull Out | `a1aaZ000008mBwbQAE` | boolean | Pull-out mechanism |
| 11 | Lazy Susan | ❌ *Not in SF* | boolean | Rotating shelf |
| 12 | Rust Resistant | `a1aaZ000008mBx0QAE` | boolean | Corrosion resistant |
| 13 | Load Capacity | ❌ *Not in SF* | number | Weight capacity |
| 14 | Dividers Included | ❌ *Not in SF* | boolean | Dividers included |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🚪 Door Hardware - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Door Hardware Type | `a1aaZ000008mBrbQAE` | enum | Knob/Lever/Deadbolt/Handleset |
| 2 | Function | `a1aaZ000008mBsWQAU` | enum | Privacy/Passage/Entry/Dummy |
| 3 | Material | `a1aaZ000008mBupQAE` | enum | Brass/Zinc/Stainless |
| 4 | Smart Lock | `a1aaZ000008mBxzQAE` | boolean | Smart/Connected lock |
| 5 | Keyless Entry | `a1aaZ000008mBuLQAU` | boolean | Keypad/Biometric |
| 6 | ANSI Grade | `a1aaZ000008lz3lQAA` | enum | Grade 1/2/3 |
| 7 | Handedness | `a1aaZ000008mBt4QAE` | enum | Left/Right/Universal |
| 8 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 9 | App Compatibility | `a1aaZ000008lz3oQAA` | boolean | Smartphone app |
| 10 | Keyed Alike | `a1aaZ000008mBuJQAU` | boolean | Same key |
| 11 | Fire Rated | `a1aaZ000008mBsLQAU` | boolean | Fire-rated |
| 12 | Backset | `a1aaZ000008lz4QQAQ` | number | 2-3/8" or 2-3/4" |
| 13 | Door Thickness | `a1aaZ000008mBrhQAE` | number | Compatible thickness |
| 14 | Approved for Commercial Use | `a1aaZ000008lz3qQAA` | boolean | Commercial grade |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🪞 Mirrors - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Mirror Type | `a1aaZ000008mBvEQAU` | enum | Wall/Floor/Vanity/Decorative |
| 2 | Mirror Shape | `a1aaZ000008mBvDQAU` | enum | Rectangle/Round/Oval/Arch/Irregular |
| 3 | Frame Material | `a1aaZ000008mBsZQAU` | enum | Wood/Metal/Frameless/Rattan |
| 4 | Orientation | `a1aaZ000008mBw3QAE` | enum | Horizontal/Vertical/Both |
| 5 | LED | `a1aaZ000008mBuSQAU` | boolean | LED backlit |
| 6 | Dimmable | `a1aaZ000008mBrGQAU` | boolean | Dimmable light |
| 7 | Mounting Type | `a1aaZ000008mBvLQAU` | enum | Wall/Lean/Freestanding |
| 8 | Beveled | ❌ *Not in SF* | boolean | Beveled edge |
| 9 | Full Length | `a1aaZ000008mBsvQAE` | boolean | Full length |
| 10 | Magnification | `a1aaZ000008mBujQAE` | number | Magnification level |
| 11 | Adjustable Color Temperature | `a1aaZ000008lz3YQAQ` | boolean | Tunable light |
| 12 | Touch Faucet | `a1aaZ000008mBykQAE` | boolean | Touch controls |
| 13 | USB Port | `a1aaZ000008mBz5QAE` | boolean | USB charging |
| 14 | Electrical Outlet | `a1aaZ000008mBrpQAE` | boolean | Built-in outlet |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🛋️ Furniture - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Furniture Type | `a1aaZ000008mBszQAE` | enum | Sofa/Chair/Table/Bed/Desk |
| 2 | Material | `a1aaZ000008mBupQAE` | enum | Wood/Metal/Upholstered/Rattan |
| 3 | Assembly Required | `a1aaZ000008lz3wQAA` | boolean | Assembly needed |
| 4 | For Indoor or Outdoor Use | `a1aaZ000008mBsKQAU` | enum | Indoor/Outdoor/Both |
| 5 | Number Of Drawers | `a1aaZ000008mBvfQAE` | number | Drawer count |
| 6 | Number Of Shelves | `a1aaZ000008mBvtQAE` | number | Shelf count |
| 7 | Upholstery Material | `a1aaZ000008mBz3QAE` | enum | Leather/Fabric/Velvet |
| 8 | Seating Capacity | `a1aaZ000008mBx7QAE` | number | Seating count |
| 9 | Adjustable | `a1aaZ000008lz3XQAQ` | boolean | Adjustable height |
| 10 | Storage Included | `a1aaZ000008mByMQAU` | boolean | Built-in storage |
| 11 | Soft Close Hinges | `a1aaZ000008mBy2QAE` | boolean | Soft close |
| 12 | Stain Resistant | `a1aaZ000008mByMQAU` | boolean | Stain resistant |
| 13 | UV Resistant | `a1aaZ000008mBz4QAE` | boolean | UV resistant (outdoor) |
| 14 | Rust Resistant | `a1aaZ000008mBx0QAE` | boolean | Rust resistant |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🔥 Outdoor Fireplaces & Fire Pits - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Fuel Type | `a1aaZ000008mBsmQAE` | enum | Propane/Natural Gas/Wood/Electric |
| 2 | Fireplace Type | `a1aaZ000008mBsQQAU` | enum | Fire Pit/Fire Table/Fireplace |
| 3 | Material | `a1aaZ000008mBupQAE` | enum | Steel/Concrete/Stone/Cast Iron |
| 4 | Shape | `a1aaZ000008mBxTQAU` | enum | Round/Square/Rectangular |
| 5 | BTU Output | `a1aaZ000008mBnrQAE` | number | Heat output |
| 6 | Ignition Type | `a1aaZ000008mBtqQAE` | enum | Electronic/Match Lit/Manual |
| 7 | Fire Glass Included | `a1aaZ000008mBsJQAU` | boolean | Glass media included |
| 8 | Cover Included | `a1aaZ000008mBp1QAE` | boolean | Protective cover |
| 9 | Tank Enclosure | `a1aaZ000008mByaQAE` | boolean | Hides propane tank |
| 10 | Spark Screen Included | `a1aaZ000008mByFQAU` | boolean | Spark screen |
| 11 | Assembly Required | `a1aaZ000008lz3wQAA` | boolean | Assembly needed |
| 12 | Portable | `a1aaZ000008mBwVQAU` | boolean | Portable design |
| 13 | Rust Resistant | `a1aaZ000008mBx0QAE` | boolean | Weather resistant |
| 14 | CSA Certified | `a1aaZ000008mBp4QAE` | boolean | CSA certification |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 📦 Storage & Closet Systems - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Storage Type | ❌ *Not in SF* | enum | Shelf/Drawer/Cabinet/Rack |
| 2 | Material | `a1aaZ000008mBupQAE` | enum | Wire/Laminate/Wood/Metal |
| 3 | Number Of Shelves | `a1aaZ000008mBvtQAE` | number | Shelf count |
| 4 | Adjustable | `a1aaZ000008lz3XQAQ` | boolean | Adjustable shelves |
| 5 | Assembly Required | `a1aaZ000008lz3wQAA` | boolean | Assembly needed |
| 6 | Mounting Type | `a1aaZ000008mBvLQAU` | enum | Wall/Floor/Freestanding |
| 7 | Modular | ❌ *Not in SF* | boolean | Modular/expandable |
| 8 | Number Of Drawers | `a1aaZ000008mBvfQAE` | number | Drawer count |
| 9 | Number Of Doors | `a1aaZ000008mBvdQAE` | number | Door count |
| 10 | Soft Close Hinges | `a1aaZ000008mBy2QAE` | boolean | Soft close doors |
| 11 | Soft Close Slattribute_ides | `a1aaZ000008mBy3QAE` | boolean | Soft close drawers |
| 12 | Lockable | `a1aaZ000008mBuqQAE` | boolean | Locking mechanism |
| 13 | Rust Resistant | `a1aaZ000008mBx0QAE` | boolean | Rust resistant |
| 14 | Load Capacity | ❌ *Not in SF* | number | Weight capacity |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

## HVAC DEPARTMENT

### ❄️ Air Conditioners - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | AC Type | `a1aaZ000008lz3TQAQ` | enum | Window/Portable/Split/Central |
| 2 | BTU Capacity | `a1aaZ000008mBnsQAE` | number | Cooling capacity |
| 3 | Coverage Area | `a1aaZ000008mBp2QAE` | number | Square footage |
| 4 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 5 | SEER Rating | `a1aaZ000008mBxDQAU` | number | Efficiency rating |
| 6 | Voltage | `a1aaZ000008mBzQQAU` | number | 115V/230V |
| 7 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | WiFi enabled |
| 8 | Inverter Technology | `a1aaZ000008mBuCQAU` | boolean | Inverter compressor |
| 9 | Noise Level | `a1aaZ000008mBvOQAU` | number | Decibels |
| 10 | Heater Included | `a1aaZ000008mBtMQAU` | boolean | Heat pump |
| 11 | Dehumidifier | `a1aaZ000008mBrFQAU` | boolean | Dehumidify mode |
| 12 | Remote Control | ❌ *Not in SF* | boolean | Remote included |
| 13 | Includes Timer | `a1aaZ000008mBu0QAE` | boolean | Timer function |
| 14 | Fan Speeds | `a1aaZ000008mBs8QAE` | number | Speed settings |
| 15 | Filter Type | `a1aaZ000008mBsOQAU` | enum | Washable/HEPA |

---

### 🔥 Furnaces & Heaters - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Fuel Type | `a1aaZ000008mBsmQAE` | enum | Gas/Electric/Oil/Propane |
| 2 | BTU Output | `a1aaZ000008mBnrQAE` | number | Heat output |
| 3 | AFUE Rating | ❌ *Not in SF* | number | Efficiency rating |
| 4 | Coverage Area | `a1aaZ000008mBp2QAE` | number | Square footage |
| 5 | Configuration | `a1aaZ000008mBojQAE` | enum | Upflow/Downflow/Horizontal |
| 6 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 7 | Multi-Stage | ❌ *Not in SF* | boolean | Variable speed |
| 8 | Voltage | `a1aaZ000008mBzQQAU` | number | Electrical requirement |
| 9 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | Smart compatible |
| 10 | ECM Motor | ❌ *Not in SF* | boolean | ECM blower motor |
| 11 | Vent Type | `a1aaZ000008mBzMQAU` | enum | Direct/Power vent |
| 12 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Ducted/Ductless |
| 13 | Noise Level | `a1aaZ000008mBvOQAU` | number | Sound level |
| 14 | Manufacturer Warranty | `a1aaZ000008mBunQAE` | string | Warranty period |
| 15 | CSA Certified | `a1aaZ000008mBp4QAE` | boolean | Safety certification |

---

### 💧 Hydronic Expansion Tanks - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Total Capacity | `a1aaZ000008mByiQAE` | number | Tank gallons |
| 2 | Application | `a1aaZ000008lz3pQAA` | enum | Potable/Non-Potable/HVAC |
| 3 | Maximum Working Pressure | `a1aaZ000008mBuxQAE` | number | PSI rating |
| 4 | Connection Size | `a1aaZ000008mBokQAE` | number | Inlet/outlet size |
| 5 | Pre-Charge Pressure | ❌ *Not in SF* | number | Factory pressure |
| 6 | Material | `a1aaZ000008mBupQAE` | enum | Steel/Stainless |
| 7 | Mounting Type | `a1aaZ000008mBvLQAU` | enum | Floor/Wall/In-Line |
| 8 | Lead Leaching Certified NSF/ANSI 61 | `a1aaZ000008mBuRQAU` | boolean | NSF certified |
| 9 | Certifications | `a1aaZ000008mBoMQAU` | string | ASME/UL certifications |
| 10 | Orientation | `a1aaZ000008mBw3QAE` | enum | Vertical/Horizontal |
| 11 | Replaceable Bladder | ❌ *Not in SF* | boolean | Replaceable bladder |
| 12 | Temperature Range | ❌ *Not in SF* | number | Operating temp range |
| 13 | Manufacturer Warranty | `a1aaZ000008mBunQAE` | string | Warranty period |
| 14 | Approved for Commercial Use | `a1aaZ000008lz3qQAA` | boolean | Commercial grade |
| 15 | Country Of Origin | `a1aaZ000008mBp0QAE` | string | Manufacturing origin |

---

### 🌀 Ventilation - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | CFM | `a1aaZ000008mBoNQAU` | number | Airflow rating |
| 2 | Ventilation Type | ❌ *Not in SF* | enum | Exhaust/Supply/ERV/HRV |
| 3 | Noise Level | `a1aaZ000008mBvOQAU` | number | Sones rating |
| 4 | Duct Size | `a1aaZ000008mBrjQAE` | number | Duct diameter |
| 5 | Light Kit Included | `a1aaZ000008mBubQAE` | boolean | Light included |
| 6 | LED | `a1aaZ000008mBuSQAU` | boolean | LED light |
| 7 | Heater Included | `a1aaZ000008mBtMQAU` | boolean | Heat lamp |
| 8 | Humidity Sensor | `a1aaZ000008mBtiQAE` | boolean | Humidity sensing |
| 9 | Motion Sensor | `a1aaZ000008mBvHQAU` | boolean | Motion sensing |
| 10 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 11 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Ceiling/Wall/Inline |
| 12 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | Smart compatible |
| 13 | Coverage Area | `a1aaZ000008mBp2QAE` | number | Square footage |
| 14 | Voltage | `a1aaZ000008mBzQQAU` | number | Electrical requirement |
| 15 | Manufacturer Warranty | `a1aaZ000008mBunQAE` | string | Warranty period |

---

## OTHER CATEGORIES

### ☕ Coffee Makers - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Coffee Maker Type | `a1aaZ000008mBoXQAU` | enum | Drip/Espresso/Single-Serve/French Press |
| 2 | Capacity (Cups) | `a1aaZ000008mBoDQAU` | number | Cup capacity |
| 3 | Built-In Grinder | `a1aaZ000008mBnuQAE` | boolean | Grinder included |
| 4 | Single Serve | `a1aaZ000008mBxsQAE` | boolean | Pod compatible |
| 5 | Programmable | `a1aaZ000008mBwgQAE` | boolean | Timer/scheduling |
| 6 | Water Reservoir Size | `a1aaZ000008mBzeQAE` | number | Reservoir capacity |
| 7 | Thermal Carafe | `a1aaZ000008mBybQAE` | boolean | Insulated carafe |
| 8 | Milk Frother Included | `a1aaZ000008mBvBQAU` | boolean | Frother included |
| 9 | Auto Shut Off | `a1aaZ000008lz3yQAA` | boolean | Auto shutoff |
| 10 | Adjustable Brew Strength | ❌ *Not in SF* | boolean | Strength control |
| 11 | Keep Warm | ❌ *Not in SF* | boolean | Hot plate/warmer |
| 12 | Removable Water Reservoir | ❌ *Not in SF* | boolean | Removable tank |
| 13 | Pause and Pour | ❌ *Not in SF* | boolean | Mid-brew pause |
| 14 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | WiFi enabled |
| 15 | Collection | `a1aaZ000008mBoZQAU` | string | Product collection |

---

### 🧊 Ice Makers - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Ice Maker Type | `a1aaZ000008mBtnQAE` | enum | Portable/Built-In/Undercounter |
| 2 | Daily Ice Production (lbs) | `a1aaZ000008mBpAQAU` | number | Production capacity |
| 3 | Ice Storage Capacity (lbs) | `a1aaZ000008mBtoQAE` | number | Storage capacity |
| 4 | Ice Type | `a1aaZ000008mBtpQAE` | enum | Bullet/Cube/Nugget/Gourmet |
| 5 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Freestanding/Built-In |
| 6 | Water Connection Required | `a1aaZ000008mBzaQAE` | boolean | Plumbed/Manual fill |
| 7 | Self Cleaning | `a1aaZ000008mBxAQAU` | boolean | Self-clean function |
| 8 | Drain Required | `a1aaZ000008mBrgQAE` | boolean | Drain needed |
| 9 | Energy Star | `a1aaZ000008mBrvQAE` | boolean | ENERGY STAR certified |
| 10 | Reversible Door | `a1aaZ000008mBwtQAE` | boolean | Door swing |
| 11 | Noise Level | `a1aaZ000008mBvOQAU` | number | Sound level |
| 12 | Indicator Light | ❌ *Not in SF* | boolean | Status lights |
| 13 | ADA | `a1aaZ000008lz3WQAQ` | boolean | ADA compliant |
| 14 | Filter Included | `a1aaZ000008mBsRQAU` | boolean | Water filter |
| 15 | Manufacturer Warranty | `a1aaZ000008mBunQAE` | string | Warranty period |

---

### 🍕 Pizza Ovens - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Fuel Type | `a1aaZ000008mBsmQAE` | enum | Gas/Wood/Pellet/Electric |
| 2 | Oven Capacity | `a1aaZ000008mBw2QAE` | number | Pizza size (inches) |
| 3 | BTU Output | `a1aaZ000008mBnrQAE` | number | Heat output |
| 4 | Max Temperature | `a1aaZ000008mBuyQAE` | number | Max temp (°F) |
| 5 | Portable | `a1aaZ000008mBwVQAU` | boolean | Portable design |
| 6 | Installation Type | `a1aaZ000008mBu7QAE` | enum | Countertop/Built-In/Freestanding |
| 7 | Material | `a1aaZ000008mBupQAE` | enum | Stainless/Stone/Brick |
| 8 | Ignition Type | `a1aaZ000008mBtqQAE` | enum | Electronic/Manual |
| 9 | Pizza Stone Included | `a1aaZ000008mBwNQAU` | boolean | Stone included |
| 10 | Cover Included | `a1aaZ000008mBp1QAE` | boolean | Cover included |
| 11 | Thermometer Included | `a1aaZ000008mByeQAE` | boolean | Built-in thermometer |
| 12 | Wheels Included | `a1aaZ000008mBzmQAE` | boolean | Wheels for mobility |
| 13 | Assembly Required | `a1aaZ000008lz3wQAA` | boolean | Assembly needed |
| 14 | Outdoor Approved | `a1aaZ000008mBw4QAE` | boolean | Outdoor use |
| 15 | Manufacturer Warranty | `a1aaZ000008mBunQAE` | string | Warranty period |

---

### 🔥 Barbeques & Grills - Top 15

| Rank | Attribute Name | Salesforce ID | Filter Type | Utilization Rationale |
|------|---------------|---------------|-------------|----------------------|
| 1 | Grill Type | `a1aaZ000008mBsyQAE` | enum | Gas/Charcoal/Electric/Pellet/Kamado |
| 2 | Number Of Burners | `a1aaZ000008mBvcQAE` | number | Burner count |
| 3 | BTU Output | `a1aaZ000008mBnrQAE` | number | Total BTUs |
| 4 | Total Cooking Area | `a1aaZ000008mByjQAE` | number | Square inches |
| 5 | Primary Cooking Area | `a1aaZ000008mBwRQAU` | number | Main grate area |
| 6 | Side Burner | `a1aaZ000008mBxuQAE` | boolean | Side burner included |
| 7 | Sear Burner | `a1aaZ000008mBxBQAU` | boolean | Infrared sear zone |
| 8 | Rotisserie Included | `a1aaZ000008mBwyQAE` | boolean | Rotisserie kit |
| 9 | Built-In | `a1aaZ000008mBnvQAE` | boolean | Built-in design |
| 10 | Portable | `a1aaZ000008mBwVQAU` | boolean | Portable design |
| 11 | Smart Home | `a1aaZ000008mBxyQAE` | boolean | WiFi enabled |
| 12 | Ignition Type | `a1aaZ000008mBtqQAE` | enum | Electronic/Push button |
| 13 | Grate Material | `a1aaZ000008mBswQAE` | enum | Cast Iron/Stainless/Porcelain |
| 14 | Grattribute_iddle | `a1aaZ000008mBszQAE` | boolean | Griddle attachment |
| 15 | Assembly Required | `a1aaZ000008lz3wQAA` | boolean | Assembly needed |

---

## Implementation Notes

### Attributes NOT in Salesforce

The following attributes appear in recommendations but do not have matching Salesforce IDs:

| Category | Attribute | Recommendation |
|----------|-----------|----------------|
| Range | Double Oven | Request new attribute or use Configuration |
| Toilet Seats | Quick Release | Add to SF schema |
| Toilet Seats | Remote Control | Add to SF schema |
| Bar Faucets | Deck Plate Included | Add to SF schema |
| Bidets | Spray Adjustability | Add to SF schema |
| Bidets | Remote Control | Add to SF schema |
| Bidets | Air Dryer | Add to SF schema |
| Bidets | Deodorizer | Add to SF schema |
| Steam Showers | Aromatherapy | Add to SF schema |
| Steam Showers | Auto Drain | Add to SF schema |
| Garbage Disposals | Septic Safe | Add to SF schema |
| Cabinet Organization | Organizer Type | Add to SF schema |
| Cabinet Organization | Lazy Susan | Add to SF schema |
| Cabinet Organization | Load Capacity | Add to SF schema |
| Cabinet Organization | Dividers Included | Add to SF schema |
| Storage | Storage Type | Add to SF schema |
| Storage | Modular | Add to SF schema |
| Storage | Load Capacity | Add to SF schema |
| Air Conditioners | Remote Control | Add to SF schema |
| Furnaces | AFUE Rating | Add to SF schema |
| Furnaces | Multi-Stage | Add to SF schema |
| Furnaces | ECM Motor | Add to SF schema |
| Expansion Tanks | Pre-Charge Pressure | Add to SF schema |
| Expansion Tanks | Replaceable Bladder | Add to SF schema |
| Expansion Tanks | Temperature Range | Add to SF schema |
| Ventilation | Ventilation Type | Add to SF schema |
| Ceiling Fan Accessories | Universal Fit | Add to SF schema |
| Mirrors | Beveled | Add to SF schema |
| Coffee Makers | Adjustable Brew Strength | Add to SF schema |
| Coffee Makers | Keep Warm | Add to SF schema |
| Coffee Makers | Removable Water Reservoir | Add to SF schema |
| Coffee Makers | Pause and Pour | Add to SF schema |
| Ice Makers | Indicator Light | Add to SF schema |

### Attribute Name Variations

Some Salesforce attribute names contain typos (e.g., `Grattribute_iddle` instead of `Griddle`, `Battribute_idet` instead of `Bidet`). The system should handle these variations during matching.

### Filter Priority

Attributes are ranked 1-15 based on:
1. **Frequency of use** on major retailer sites (Home Depot, Lowe's, Best Buy, AJ Madison)
2. **Purchase decision impact** - attributes that significantly narrow choices
3. **Binary vs. multi-value** - enumerated filters ranked higher than boolean
4. **Certification relevance** - ENERGY STAR, WaterSense, ADA widely used

---

## Categories Covered

### Appliances (11 categories)
- Range, Refrigerator, Dishwasher, Wall Oven, Cooktop, Range Hood
- Washer, Dryer, Freezer, Wine Cooler, Microwave

### Plumbing & Bath (22 categories)
- Toilets, Toilet Seats, Kitchen Faucets, Bathroom Faucets, Bar Faucets, Pot Filler Faucets
- Bathtubs, Tub Faucets, Showers, Shower Accessories, Bathroom Hardware
- Bathroom Mirrors, Bathroom Vanities, Bathroom Sinks, Bar & Prep Sinks, Kitchen Sinks
- Garbage Disposals, Drains, Rough-In Valves, Bidets, Steam Showers, Water Heaters

### Lighting (12 categories)
- Chandeliers, Ceiling Fans, Pendant Lights, Ceiling Lights
- Bathroom/Vanity Lighting, Wall Sconces, Recessed Lighting
- Track Lighting, Outdoor Lighting, Lamps, Commercial Lighting
- Under Cabinet Lighting, Ceiling Fan Accessories

### Home Decor & Fixtures (7 categories)
- Cabinet Hardware, Cabinet Organization, Door Hardware
- Mirrors, Furniture, Outdoor Fireplaces & Fire Pits, Storage & Closet Systems

### HVAC (4 categories)
- Air Conditioners, Furnaces & Heaters, Hydronic Expansion Tanks, Ventilation

### Other (4 categories)
- Coffee Makers, Ice Makers, Pizza Ovens, Barbeques & Grills

**Total: 61 categories covered**

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-23 | 2.0 | Complete overhaul - Added all categories (57 total) across all departments |
| 2026-01-23 | 1.0 | Initial document - Appliances only (11 categories) |

---

*Document prepared for development team implementation*
