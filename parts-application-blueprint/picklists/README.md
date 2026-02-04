# Parts Picklist Files

This folder contains **Parts Verification API** specific picklist data for Salesforce integration.

## Files in this Folder

| File | Records | Purpose |
|------|---------|---------|
| `brands.json` | 85 | OEM and aftermarket parts manufacturers |
| `categories.json` | 90 | Parts categories organized by department/family |
| `attributes.json` | 150 | All possible part attributes |
| `styles.json` | 10 | Part types (OEM, Aftermarket, Universal, etc.) |
| `category-filter-attributes.json` | 135 | Top 15 filter attributes per category (9 categories mapped) |

---

## Structure Overview

### Department → Family → Category Hierarchy

```
Appliance Parts
├── Refrigerator Parts
│   ├── Compressor
│   ├── Evaporator Fan Motor
│   └── Ice Maker Assembly
├── Dishwasher Parts
│   ├── Drain Pump
│   └── Wash Motor
└── Range/Oven Parts
    ├── Bake Element
    └── Oven Igniter

HVAC Parts
├── Heating Parts
│   ├── Furnace Blower Motor
│   └── Gas Valve
├── Cooling Parts
│   ├── AC Compressor
│   └── Condenser Coil
└── Ventilation Parts
    └── Air Filter

Electronics Parts
├── Control Boards
│   ├── Main Control Board
│   └── Display Board
├── Motors & Drives
│   └── Electric Motor
└── Sensors & Switches
    └── Temperature Sensor

Plumbing Parts
└── Water Supply Parts
    └── Fill Valve
```

---

## Top 15 Attributes by Category (Sample)

### Compressor (PARTS_CAT_001)
1. Compatible Brand
2. Compatible Model
3. Compressor Type
4. Refrigerant Type
5. Cooling Capacity (BTU)
6. Voltage
7. Amperage
8. Mounting Type
9. Connection Type
10. Oil Type
11. OEM or Aftermarket
12. Warranty Period
13. Condition
14. Part Number
15. Replaces Part Numbers

### Air Filter (PARTS_CAT_057)
1. Filter Size
2. MERV Rating
3. Filter Type
4. Filter Material
5. Frame Material
6. Nominal Thickness
7. Nominal Width
8. Nominal Height
9. Replacement Interval
10. Airflow Resistance
11. Particle Capture Rate
12. Filter Application
13. Compatible Systems
14. Pack Quantity
15. Part Number

### Main Control Board (PARTS_CAT_062)
1. Compatible Brand
2. Compatible Model
3. Board Type
4. Voltage
5. Number of Connectors
6. Firmware Version
7. Length
8. Width
9. OEM or Aftermarket
10. Condition
11. Part Number
12. Replaces Part Numbers
13. Installation Difficulty
14. Warranty Period
15. Tools Required

---

## Categories with Top 15 Mapped

The following 9 categories have Top 15 attributes defined:

1. **Compressor** (PARTS_CAT_001) - Refrigerator compressor parts
2. **Drain Pump** (PARTS_CAT_010) - Dishwasher drain pumps
3. **Bake Element** (PARTS_CAT_017) - Oven heating elements
4. **Air Filter** (PARTS_CAT_057) - HVAC air filters
5. **Main Control Board** (PARTS_CAT_062) - Electronic control boards
6. **Electric Motor** (PARTS_CAT_067) - General electric motors
7. **Temperature Sensor** (PARTS_CAT_070) - Temperature sensors
8. **Fill Valve** (PARTS_CAT_077) - Water fill valves

**Note**: The remaining 81 categories need their Top 15 attributes defined based on actual parts data analysis.

---

## Usage in Parts Verification API

These picklists are used by:

1. **PicklistMatcher Service** - Matches incoming part data to categories, brands, attributes
2. **DualAIVerification Service** - Uses categories/attributes to validate part classification
3. **Salesforce Sync** - Receives picklist updates from Salesforce
4. **API Endpoints** - Provides picklist data to external systems

---

## Salesforce ID Format

**IMPORTANT**: In production, replace placeholder IDs with actual Salesforce record IDs:

- `PARTS_BRAND_001` → `a0M8c00000XAbCDEFG` (actual Salesforce Brand ID)
- `PARTS_CAT_001` → `a018c00000YBcDEFGH` (actual Salesforce Category ID)
- `ATTR_001` → `a028c00000ZCdEFGHI` (actual Salesforce Attribute ID)
- `PARTS_STYLE_001` → `a038c00000ACdEFGHJ` (actual Salesforce Style ID)

Get real IDs from:
- Salesforce UI → Setup → Object Manager → Brand/Category/Attribute
- SOQL query: `SELECT Id, Name FROM Brand__c`
- Initial sync from Salesforce via `POST /api/picklists/sync`

---

## Expanding Categories

To add more categories with Top 15 attributes:

1. Analyze actual parts data to determine most common attributes
2. Rank attributes by importance for filtering/searching
3. Add 15 entries per category to `category-filter-attributes.json`
4. Format: `{"category_id": "ID", "category_name": "Name", "attribute_id": "ID", "attribute_name": "Name", "rank": "1-15"}`

Example research sources:
- Parts marketplace sites (marcone.com, encompass.com, reliableparts.net)
- OEM parts catalogs (Whirlpool, GE, Samsung)
- Industry standards (AHAM, ASHRAE)

---

## Next Steps

1. ✅ Created base taxonomy (85 brands, 90 categories, 150 attributes, 10 styles)
2. ✅ Mapped 9 key categories to Top 15 attributes
3. ⏳ Obtain real Salesforce IDs and replace placeholders
4. ⏳ Complete Top 15 mappings for remaining 81 categories
5. ⏳ Test with actual parts data from inventory
6. ⏳ Set up Salesforce sync to maintain picklists

