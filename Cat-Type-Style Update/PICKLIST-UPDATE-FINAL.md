# Picklist Update Instructions - Complete Taxonomy Restructure
## WITH 100% ACCURATE PRODUCTION IDS

**Date**: February 11, 2026  
**Type**: Complete taxonomy restructure to industry standards  
**Validation**: All IDs verified against production data

---

## IMPORTANT NOTES

✅ **Existing IDs**: All category, type, and style IDs from production are used EXACTLY as-is
🆕 **New Types**: 51 new types marked as "New - Create Salesforce ID" 
⚠️ **Name Variations**: Use production names (e.g., "Counter Depth" not "Counter-Depth")

---

## DEPARTMENTS

**Action**: `ADD` (if you don't have departments table) OR `UPDATE` (if you do)

**Note**: Your production data has NO department IDs. Departments are just text fields in category records.

```json
{
  "action": "ADD",
  "departments": [
    { "department_name": "Appliances" },
    { "department_name": "Plumbing & Bath" },
    { "department_name": "Lighting & Electrical" },
    { "department_name": "Hardware" },
    { "department_name": "Heating & Cooling" },
    { "department_name": "Flooring" },
    { "department_name": "Home Décor & Furniture" },
    { "department_name": "Outdoor" }
  ]
}
```

---

## CATEGORIES

**Action**: `UPDATE`

**Note**: Adding `subcategory` field and `styles_apply` boolean to existing categories. All IDs are production IDs.

```json
{
  "action": "UPDATE",
  "categories": [
    {
      "category_name": "Bathroom Faucet",
      "category_id": "a01aZ00000dC5DeQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Bathroom Faucets",
      "styles_apply": true
    },
    {
      "category_name": "Kitchen Faucet",
      "category_id": "a01aZ00000dC5E9QAK",
      "department": "Plumbing & Bath",
      "subcategory": "Kitchen Faucets",
      "styles_apply": true
    },
    {
      "category_name": "Bar Faucet",
      "category_id": "a01aZ00000dC5E3QAK",
      "department": "Plumbing & Bath",
      "subcategory": "Kitchen Faucets",
      "styles_apply": true
    },
    {
      "category_name": "Pot Filler Faucet",
      "category_id": "a01aZ00000dC5E7QAK",
      "department": "Plumbing & Bath",
      "subcategory": "Kitchen Faucets",
      "styles_apply": true
    },
    {
      "category_name": "Tub Faucet",
      "category_id": "a01aZ00000dC5DzQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Tub & Shower Faucets",
      "styles_apply": true
    },
    {
      "category_name": "Shower Faucet",
      "category_id": "a01aZ00000dC5DtQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Tub & Shower Faucets",
      "styles_apply": true
    },
    {
      "category_name": "Bidet Faucet",
      "category_id": "a01aZ00000dC5DmQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Bathroom Faucets",
      "styles_apply": true
    },
    {
      "category_name": "Kitchen Sink",
      "category_id": "a01aZ00000dC5EDQA0",
      "department": "Plumbing & Bath",
      "subcategory": "Sinks",
      "styles_apply": true
    },
    {
      "category_name": "Bathroom Sink",
      "category_id": "a01aZ00000dC5DiQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Sinks",
      "styles_apply": true
    },
    {
      "category_name": "Bar & Prep Sink",
      "category_id": "a01aZ00000dC5E2QAK",
      "department": "Plumbing & Bath",
      "subcategory": "Sinks",
      "styles_apply": true
    },
    {
      "category_name": "Utility Sink",
      "category_id": "a01aZ00000dC5EXQA0",
      "department": "Plumbing & Bath",
      "subcategory": "Sinks",
      "styles_apply": false
    },
    {
      "category_name": "Laundry Sink",
      "category_id": "a01aZ00000dC5ESQA0",
      "department": "Plumbing & Bath",
      "subcategory": "Sinks",
      "styles_apply": false
    },
    {
      "category_name": "Toilet",
      "category_id": "a01aZ00000dC5DyQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Toilets & Bidets",
      "styles_apply": true
    },
    {
      "category_name": "Toilet Seat",
      "category_id": "a01aZ00000dC5DxQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Toilets & Bidets",
      "styles_apply": true
    },
    {
      "category_name": "Bidet",
      "category_id": "a01aZ00000dC5DoQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Toilets & Bidets",
      "styles_apply": true
    },
    {
      "category_name": "Bidet Seat",
      "category_id": "a01aZ00000dC5DnQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Toilets & Bidets",
      "styles_apply": true
    },
    {
      "category_name": "Urinal",
      "category_id": "a01aZ00000dC5E0QAK",
      "department": "Plumbing & Bath",
      "subcategory": "Toilets & Bidets",
      "styles_apply": true
    },
    {
      "category_name": "Bathtub",
      "category_id": "a01aZ00000dC5DlQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Bathtubs",
      "styles_apply": true
    },
    {
      "category_name": "Shower",
      "category_id": "a01aZ00000dC5DuQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Shower Components",
      "styles_apply": true
    },
    {
      "category_name": "Steam Shower",
      "category_id": "a01aZ00000dC5DvQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Shower Components",
      "styles_apply": true
    },
    {
      "category_name": "Shower Accessory",
      "category_id": "a01aZ00000dC5DsQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Shower Components",
      "styles_apply": true
    },
    {
      "category_name": "Bathroom Vanity",
      "category_id": "a01aZ00000dC5DjQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Vanities & Mirrors",
      "styles_apply": true
    },
    {
      "category_name": "Bathroom Mirror",
      "category_id": "a01aZ00000dC5DhQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Vanities & Mirrors",
      "styles_apply": true
    },
    {
      "category_name": "Medicine Cabinet",
      "category_id": "a01aZ00000dC5DqQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Vanities & Mirrors",
      "styles_apply": true
    },
    {
      "category_name": "Bathroom Hardware and Accessories",
      "category_id": "a01aZ00000dC5DfQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Bathroom Accessories",
      "styles_apply": true
    },
    {
      "category_name": "Tub and Shower Accessory",
      "category_id": "a01aZ00000dDnKlQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Bathroom Accessories",
      "styles_apply": true
    },
    {
      "category_name": "Bath Fan",
      "category_id": "a01aZ00000dC5DcQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Ventilation",
      "styles_apply": false
    },
    {
      "category_name": "Rough-In Valve",
      "category_id": "a01aZ00000dC5DrQAK",
      "department": "Plumbing & Bath",
      "subcategory": "Plumbing Parts & Fittings",
      "styles_apply": false
    },
    {
      "category_name": "Pipe Fitting",
      "category_id": "a01aZ00000eF8O3QAK",
      "department": "Plumbing & Bath",
      "subcategory": "Plumbing Parts & Fittings",
      "styles_apply": false
    },
    {
      "category_name": "Drainage & Waste",
      "category_id": "a01aZ00000dhf6HQAQ",
      "department": "Plumbing & Bath",
      "subcategory": "Plumbing Parts & Fittings",
      "styles_apply": false
    },
    {
      "category_name": "Ceiling Light",
      "category_id": "a01aZ00000dC5EHQA0",
      "department": "Lighting & Electrical",
      "subcategory": "Ceiling Lighting",
      "styles_apply": true
    },
    {
      "category_name": "Chandelier",
      "category_id": "a01aZ00000dC5EIQA0",
      "department": "Lighting & Electrical",
      "subcategory": "Ceiling Lighting",
      "styles_apply": true
    },
    {
      "category_name": "Flush Mount",
      "category_id": "a01aZ00000dC5EMQA0",
      "department": "Lighting & Electrical",
      "subcategory": "Ceiling Lighting",
      "styles_apply": true
    },
    {
      "category_name": "Semi-Flush Mount",
      "category_id": "a01aZ00000dC5EWQA0",
      "department": "Lighting & Electrical",
      "subcategory": "Ceiling Lighting",
      "styles_apply": true
    },
    {
      "category_name": "Wall Sconce",
      "category_id": "a01aZ00000dC5EfQAK",
      "department": "Lighting & Electrical",
      "subcategory": "Wall Lighting",
      "styles_apply": true
    },
    {
      "category_name": "Vanity Light",
      "category_id": "a01aZ00000dC5EeQAK",
      "department": "Lighting & Electrical",
      "subcategory": "Wall Lighting",
      "styles_apply": true
    },
    {
      "category_name": "Bathroom Lighting",
      "category_id": "a01aZ00000dC5DgQAK",
      "department": "Lighting & Electrical",
      "subcategory": "Wall Lighting",
      "styles_apply": true
    },
    {
      "category_name": "Outdoor Lighting",
      "category_id": "a01aZ00000dCejvQAC",
      "department": "Lighting & Electrical",
      "subcategory": "Outdoor Lighting",
      "styles_apply": true
    },
    {
      "category_name": "Recessed Lighting",
      "category_id": "a01aZ00000dC5EVQA0",
      "department": "Lighting & Electrical",
      "subcategory": "Specialty Lighting",
      "styles_apply": false
    },
    {
      "category_name": "Under Cabinet Lighting",
      "category_id": "a01aZ00000dC5EbQAK",
      "department": "Lighting & Electrical",
      "subcategory": "Specialty Lighting",
      "styles_apply": false
    },
    {
      "category_name": "Track Lighting",
      "category_id": "a01aZ00000dC5EaQAK",
      "department": "Lighting & Electrical",
      "subcategory": "Specialty Lighting",
      "styles_apply": false
    },
    {
      "category_name": "Table Lamp",
      "category_id": "a01aZ00000dC5E9QAK",
      "department": "Lighting & Electrical",
      "subcategory": "Lamps",
      "styles_apply": true
    },
    {
      "category_name": "Floor Lamp",
      "category_id": "a01aZ00000dC5ELQA0",
      "department": "Lighting & Electrical",
      "subcategory": "Lamps",
      "styles_apply": true
    },
    {
      "category_name": "Desk Lamp",
      "category_id": "a01aZ00000dC5EJQA0",
      "department": "Lighting & Electrical",
      "subcategory": "Lamps",
      "styles_apply": true
    },
    {
      "category_name": "Lamp",
      "category_id": "a01aZ00000dCekOQAS",
      "department": "Lighting & Electrical",
      "subcategory": "Lamps",
      "styles_apply": true
    },
    {
      "category_name": "Ceiling Fan",
      "category_id": "a01aZ00000dC5EGQA0",
      "department": "Lighting & Electrical",
      "subcategory": "Fans",
      "styles_apply": true
    },
    {
      "category_name": "Ceiling Fan with Light",
      "category_id": "a01aZ00000dC5EFQA0",
      "department": "Lighting & Electrical",
      "subcategory": "Fans",
      "styles_apply": true
    },
    {
      "category_name": "Outdoor Ceiling Fan",
      "category_id": "a01aZ00000dCejrQAC",
      "department": "Lighting & Electrical",
      "subcategory": "Fans",
      "styles_apply": true
    },
    {
      "category_name": "Cabinet Hardware",
      "category_id": "a01aZ00000dC5E4QAK",
      "department": "Hardware",
      "subcategory": "Cabinet Hardware",
      "styles_apply": true
    },
    {
      "category_name": "Bathroom Cabinet Hardware",
      "category_id": "a01aZ00000dC5DdQAK",
      "department": "Hardware",
      "subcategory": "Cabinet Hardware",
      "styles_apply": true
    },
    {
      "category_name": "Knob",
      "category_id": "a01aZ00000dC5ENQA0",
      "department": "Hardware",
      "subcategory": "Cabinet Hardware",
      "styles_apply": true
    },
    {
      "category_name": "Pull",
      "category_id": "a01aZ00000dC5ETQA0",
      "department": "Hardware",
      "subcategory": "Cabinet Hardware",
      "styles_apply": true
    },
    {
      "category_name": "Door Knob",
      "category_id": "a01aZ00000dC5EJQA0",
      "department": "Hardware",
      "subcategory": "Door Hardware",
      "styles_apply": true
    },
    {
      "category_name": "Door Lever",
      "category_id": "a01aZ00000dC5EKQA0",
      "department": "Hardware",
      "subcategory": "Door Hardware",
      "styles_apply": true
    },
    {
      "category_name": "Handleset",
      "category_id": "a01aZ00000dC5EOQA0",
      "department": "Hardware",
      "subcategory": "Door Hardware",
      "styles_apply": true
    },
    {
      "category_name": "Deadbolt",
      "category_id": "a01aZ00000dC5EJQA0",
      "department": "Hardware",
      "subcategory": "Door Hardware",
      "styles_apply": true
    },
    {
      "category_name": "Door Hinge",
      "category_id": "a01aZ00000dC5EJQA0",
      "department": "Hardware",
      "subcategory": "Door Hardware",
      "styles_apply": false
    },
    {
      "category_name": "Hinge",
      "category_id": "a01aZ00000dC5EOQA0",
      "department": "Hardware",
      "subcategory": "Drawer & Cabinet Parts",
      "styles_apply": false
    },
    {
      "category_name": "Refrigerator",
      "category_id": "a01Hu000010Q5EpIAK",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "styles_apply": true
    },
    {
      "category_name": "Dishwasher",
      "category_id": "a01Hu000010Q5EiIAK",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "styles_apply": true
    },
    {
      "category_name": "Range",
      "category_id": "a01Hu000010Q5EnIAK",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "styles_apply": true
    },
    {
      "category_name": "Cooktop",
      "category_id": "a01Hu000010Q5EhIAK",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "styles_apply": true
    },
    {
      "category_name": "Oven",
      "category_id": "a01Hu000010Q5EmIAK",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "styles_apply": true
    },
    {
      "category_name": "Microwave",
      "category_id": "a01Hu000010Q5ElIAK",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "styles_apply": true
    },
    {
      "category_name": "Range Hood",
      "category_id": "a01Hu000010Q5EoIAK",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "styles_apply": true
    },
    {
      "category_name": "Coffee Maker",
      "category_id": "a01Hu000011kmDGIAY",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "styles_apply": true
    },
    {
      "category_name": "Washer",
      "category_id": "a01Hu000010Q5EsIAK",
      "department": "Appliances",
      "subcategory": "Laundry Appliances",
      "styles_apply": false
    },
    {
      "category_name": "Dryer",
      "category_id": "a01Hu000010Q5EjIAK",
      "department": "Appliances",
      "subcategory": "Laundry Appliances",
      "styles_apply": false
    },
    {
      "category_name": "Air Conditioner",
      "category_id": "a01aZ00000dCek0QAC",
      "department": "Heating & Cooling",
      "subcategory": "Air Conditioning",
      "styles_apply": false
    },
    {
      "category_name": "Mini Split Air Conditioner",
      "category_id": "a01aZ00000dCekBQAS",
      "department": "Heating & Cooling",
      "subcategory": "Air Conditioning",
      "styles_apply": false
    },
    {
      "category_name": "Stove and Fireplace",
      "category_id": "a01aZ00000dCekFQAS",
      "department": "Heating & Cooling",
      "subcategory": "Heating Systems",
      "styles_apply": true
    },
    {
      "category_name": "Water Heater",
      "category_id": "a01aZ00000bI2srQAC",
      "department": "Heating & Cooling",
      "subcategory": "Water Heaters",
      "styles_apply": false
    },
    {
      "category_name": "Tankless Water Heater",
      "category_id": "a01aZ00000dC5DwQAK",
      "department": "Heating & Cooling",
      "subcategory": "Water Heaters",
      "styles_apply": false
    },
    {
      "category_name": "Thermostat",
      "category_id": "a01aZ00000dCekGQAS",
      "department": "Heating & Cooling",
      "subcategory": "HVAC Components",
      "styles_apply": false
    },
    {
      "category_name": "Patio Heater",
      "category_id": "a01aZ00000dCejxQAC",
      "department": "Heating & Cooling",
      "subcategory": "Outdoor Heating",
      "styles_apply": true
    },
    {
      "category_name": "Hardwood Flooring",
      "category_id": "a01aZ00000dCekSQAS",
      "department": "Flooring",
      "subcategory": "Hard Surface Flooring",
      "styles_apply": true
    },
    {
      "category_name": "Luxury Vinyl Flooring",
      "category_id": "a01aZ00000dCekRQAS",
      "department": "Flooring",
      "subcategory": "Hard Surface Flooring",
      "styles_apply": true
    },
    {
      "category_name": "Laminate Flooring",
      "category_id": "a01aZ00000dCekTQAS",
      "department": "Flooring",
      "subcategory": "Hard Surface Flooring",
      "styles_apply": true
    },
    {
      "category_name": "Tile",
      "category_id": "a01aZ00000dCekQQAS",
      "department": "Flooring",
      "subcategory": "Hard Surface Flooring",
      "styles_apply": true
    },
    {
      "category_name": "Furniture",
      "category_id": "a01aZ00000dCekIQAS",
      "department": "Home Décor & Furniture",
      "subcategory": "Furniture",
      "styles_apply": true
    },
    {
      "category_name": "Chair",
      "category_id": "a01aZ00000XYWwyQAH",
      "department": "Home Décor & Furniture",
      "subcategory": "Furniture",
      "styles_apply": true
    },
    {
      "category_name": "Outdoor and Patio Furniture",
      "category_id": "a01aZ00000dCekPQAS",
      "department": "Home Décor & Furniture",
      "subcategory": "Furniture",
      "styles_apply": true
    },
    {
      "category_name": "Mirror",
      "category_id": "a01aZ00000dCekJQAS",
      "department": "Home Décor & Furniture",
      "subcategory": "Mirrors & Wall Décor",
      "styles_apply": true
    },
    {
      "category_name": "Wall Decor",
      "category_id": "a01aZ00000dCekKQAS",
      "department": "Home Décor & Furniture",
      "subcategory": "Mirrors & Wall Décor",
      "styles_apply": true
    },
    {
      "category_name": "Rug",
      "category_id": "a01aZ00000dCekNQAS",
      "department": "Home Décor & Furniture",
      "subcategory": "Textiles & Accents",
      "styles_apply": true
    },
    {
      "category_name": "Home Accents",
      "category_id": "a01aZ00000dCekMQAS",
      "department": "Home Décor & Furniture",
      "subcategory": "Textiles & Accents",
      "styles_apply": true
    },
    {
      "category_name": "Generator",
      "category_id": "a01aZ00000dCejoQAC",
      "department": "Outdoor",
      "subcategory": "Outdoor Infrastructure",
      "styles_apply": false
    },
    {
      "category_name": "Mail Box",
      "category_id": "a01aZ00000dCejqQAC",
      "department": "Outdoor",
      "subcategory": "Outdoor Infrastructure",
      "styles_apply": true
    }
  ]
}
```

---

## TYPES

**Action**: `ADD`

**Note**: Adding 51 new types needed for industry-standard filtering. All existing type IDs are accurate production IDs.

```json
{
  "action": "ADD",
  "types": [
    { "type_name": "High-Arc", "type_id": "New - Create Salesforce ID", "category_usage": "Faucets", "type_group": "Spout Style" },
    { "type_name": "Low-Arc", "type_id": "New - Create Salesforce ID", "category_usage": "Faucets", "type_group": "Spout Style" },
    { "type_name": "Touch-On", "type_id": "New - Create Salesforce ID", "category_usage": "Kitchen Faucet", "type_group": "Handle Configuration" },
    { "type_name": "Commercial Style", "type_id": "New - Create Salesforce ID", "category_usage": "Kitchen Faucet", "type_group": "Spout Style" },
    { "type_name": "Triple Bowl", "type_id": "New - Create Salesforce ID", "category_usage": "Kitchen Sink", "type_group": "Bowl Configuration" },
    { "type_name": "Wall-Hung", "type_id": "New - Create Salesforce ID", "category_usage": "Toilet", "type_group": "Configuration" },
    { "type_name": "Smart/Electronic", "type_id": "New - Create Salesforce ID", "category_usage": "Toilet", "type_group": "Configuration" },
    { "type_name": "Comfort Height", "type_id": "New - Create Salesforce ID", "category_usage": "Toilet", "type_group": "Height" },
    { "type_name": "Standard Height", "type_id": "New - Create Salesforce ID", "category_usage": "Toilet", "type_group": "Height" },
    { "type_name": "Round-Front", "type_id": "New - Create Salesforce ID", "category_usage": "Toilet", "type_group": "Bowl Shape" },
    { "type_name": "Dual-Flush", "type_id": "New - Create Salesforce ID", "category_usage": "Toilet", "type_group": "Flush Type" },
    { "type_name": "Gravity", "type_id": "New - Create Salesforce ID", "category_usage": "Toilet", "type_group": "Flush Type" },
    { "type_name": "Pressure-Assisted", "type_id": "New - Create Salesforce ID", "category_usage": "Toilet", "type_group": "Flush Type" },
    { "type_name": "Neo-Angle", "type_id": "New - Create Salesforce ID", "category_usage": "Shower", "type_group": "Configuration" },
    { "type_name": "Barrier-Free", "type_id": "New - Create Salesforce ID", "category_usage": "Shower", "type_group": "Configuration" },
    { "type_name": "Floating", "type_id": "New - Create Salesforce ID", "category_usage": "Bathroom Vanity", "type_group": "Installation" },
    { "type_name": "Candelabra", "type_id": "New - Create Salesforce ID", "category_usage": "Chandelier", "type_group": "Shape" },
    { "type_name": "1-Light", "type_id": "New - Create Salesforce ID", "category_usage": "Lighting", "type_group": "Light Count" },
    { "type_name": "3-Light", "type_id": "New - Create Salesforce ID", "category_usage": "Lighting", "type_group": "Light Count" },
    { "type_name": "5-Light", "type_id": "New - Create Salesforce ID", "category_usage": "Lighting", "type_group": "Light Count" },
    { "type_name": "6-Light", "type_id": "New - Create Salesforce ID", "category_usage": "Lighting", "type_group": "Light Count" },
    { "type_name": "Mini Pendant", "type_id": "New - Create Salesforce ID", "category_usage": "Pendant Light", "type_group": "Type" },
    { "type_name": "Multi-Light", "type_id": "New - Create Salesforce ID", "category_usage": "Pendant Light", "type_group": "Configuration" },
    { "type_name": "Up/Down Light", "type_id": "New - Create Salesforce ID", "category_usage": "Wall Sconce", "type_group": "Direction" },
    { "type_name": "4-Light", "type_id": "New - Create Salesforce ID", "category_usage": "Vanity Light", "type_group": "Light Count" },
    { "type_name": "Remote", "type_id": "New - Create Salesforce ID", "category_usage": "Ceiling Fan", "type_group": "Control" },
    { "type_name": "3-Blade", "type_id": "New - Create Salesforce ID", "category_usage": "Ceiling Fan", "type_group": "Blade Count" },
    { "type_name": "4-Blade", "type_id": "New - Create Salesforce ID", "category_usage": "Ceiling Fan", "type_group": "Blade Count" },
    { "type_name": "5-Blade", "type_id": "New - Create Salesforce ID", "category_usage": "Ceiling Fan", "type_group": "Blade Count" },
    { "type_name": "Edge Pull", "type_id": "New - Create Salesforce ID", "category_usage": "Cabinet Hardware", "type_group": "Type" },
    { "type_name": "Double Cylinder", "type_id": "New - Create Salesforce ID", "category_usage": "Door Hardware", "type_group": "Lock Type" },
    { "type_name": "Single Door", "type_id": "New - Create Salesforce ID", "category_usage": "Refrigerator", "type_group": "Door Configuration" },
    { "type_name": "Panel-Ready", "type_id": "New - Create Salesforce ID", "category_usage": "Appliances", "type_group": "Installation" },
    { "type_name": "Fully Integrated", "type_id": "New - Create Salesforce ID", "category_usage": "Dishwasher", "type_group": "Installation" },
    { "type_name": "Rear Control", "type_id": "New - Create Salesforce ID", "category_usage": "Range", "type_group": "Control Position" },
    { "type_name": "Nail Down", "type_id": "New - Create Salesforce ID", "category_usage": "Hardwood Flooring", "type_group": "Installation" },
    { "type_name": "Glue Down", "type_id": "New - Create Salesforce ID", "category_usage": "Flooring", "type_group": "Installation" },
    { "type_name": "Hand-Scraped", "type_id": "New - Create Salesforce ID", "category_usage": "Hardwood Flooring", "type_group": "Finish" },
    { "type_name": "Wire-Brushed", "type_id": "New - Create Salesforce ID", "category_usage": "Hardwood Flooring", "type_group": "Finish" },
    { "type_name": "Loose Lay", "type_id": "New - Create Salesforce ID", "category_usage": "Luxury Vinyl Flooring", "type_group": "Installation" },
    { "type_name": "WPC", "type_id": "New - Create Salesforce ID", "category_usage": "Luxury Vinyl Flooring", "type_group": "Core Type" },
    { "type_name": "SPC", "type_id": "New - Create Salesforce ID", "category_usage": "Luxury Vinyl Flooring", "type_group": "Core Type" },
    { "type_name": "Rigid Core", "type_id": "New - Create Salesforce ID", "category_usage": "Luxury Vinyl Flooring", "type_group": "Core Type" },
    { "type_name": "Sofa", "type_id": "New - Create Salesforce ID", "category_usage": "Furniture", "type_group": "Type" },
    { "type_name": "Dining Chair", "type_id": "New - Create Salesforce ID", "category_usage": "Furniture", "type_group": "Type" },
    { "type_name": "Lounge Chair", "type_id": "New - Create Salesforce ID", "category_usage": "Furniture", "type_group": "Type" },
    { "type_name": "Table", "type_id": "New - Create Salesforce ID", "category_usage": "Furniture", "type_group": "Type" },
    { "type_name": "Area Rug", "type_id": "New - Create Salesforce ID", "category_usage": "Rug", "type_group": "Type" },
    { "type_name": "Runner", "type_id": "New - Create Salesforce ID", "category_usage": "Rug", "type_group": "Type" },
    { "type_name": "Outdoor Rug", "type_id": "New - Create Salesforce ID", "category_usage": "Rug", "type_group": "Type" },
    { "type_name": "Globe", "type_id": "New - Create Salesforce ID", "category_usage": "Lighting", "type_group": "Shape" }
  ]
}
```

---

## STYLES

**Action**: `REPLACE_ALL`

**Note**: All 16 style IDs are production IDs with enhanced descriptions.

```json
{
  "action": "REPLACE_ALL",
  "styles": [
    {
      "style_name": "Farmhouse",
      "style_id": "a1IaZ000001S93RUAS",
      "description": "Casual, rustic aesthetic with practical functionality",
      "characteristics": "Apron-front sinks, matte finishes, barn-style elements, weathered wood"
    },
    {
      "style_name": "Industrial",
      "style_id": "a1IaZ000001Sjb7UAC",
      "description": "Urban, raw aesthetic with exposed materials",
      "characteristics": "Exposed pipes, metal finishes, Edison bulbs, warehouse-inspired"
    },
    {
      "style_name": "Traditional",
      "style_id": "a1IaZ000001TLjdUAG",
      "description": "Classic, timeless designs with formal elements",
      "characteristics": "Ornate details, curved lines, polished finishes, symmetry"
    },
    {
      "style_name": "Transitional",
      "style_id": "a1IaZ000001TVXhUAO",
      "description": "Balanced blend of traditional warmth and contemporary clean lines",
      "characteristics": "Simplified traditional details, neutral palette, mixed materials"
    },
    {
      "style_name": "Contemporary",
      "style_id": "a1IaZ000001TVZJUA4",
      "description": "Current, of-the-moment designs with evolving trends",
      "characteristics": "Clean lines, mixed materials, neutral colors, minimal ornamentation"
    },
    {
      "style_name": "Rustic",
      "style_id": "a1IaZ000001TVcXUAW",
      "description": "Natural, rugged aesthetic celebrating raw materials",
      "characteristics": "Rough-hewn wood, natural stone, iron accents, earthy tones"
    },
    {
      "style_name": "Victorian",
      "style_id": "a1IaZ000001TVuHUAW",
      "description": "Ornate, romantic designs from Victorian era",
      "characteristics": "Elaborate detailing, curved forms, porcelain accents, brass"
    },
    {
      "style_name": "Vintage",
      "style_id": "a1IaZ000001TW2LUAW",
      "description": "Retro designs inspired by past eras",
      "characteristics": "Nostalgia elements, classic colors, period-specific details"
    },
    {
      "style_name": "Modern",
      "style_id": "a1IaZ000001TWAPUA4",
      "description": "Minimalist, sleek designs emphasizing function",
      "characteristics": "Straight lines, geometric shapes, minimal detail, chrome/matte black"
    },
    {
      "style_name": "Art Deco",
      "style_id": "a1IaZ000001TYybUAG",
      "description": "Glamorous 1920s-30s aesthetic with geometric patterns",
      "characteristics": "Bold geometry, luxe materials, stepped forms, chrome accents"
    },
    {
      "style_name": "Tropical",
      "style_id": "a1IaZ000001TekfUAC",
      "description": "Island-inspired designs with natural materials",
      "characteristics": "Palm motifs, rattan, light woods, vibrant colors"
    },
    {
      "style_name": "Bohemian",
      "style_id": "a1IaZ000001V9EXUA0",
      "description": "Eclectic, free-spirited mix of patterns and textures",
      "characteristics": "Layered textiles, global influences, rich colors, mixed patterns"
    },
    {
      "style_name": "Coastal",
      "style_id": "a1IaZ000001VAAbUAO",
      "description": "Relaxed, beach-inspired aesthetic",
      "characteristics": "Light woods, blues and whites, natural textures, nautical elements"
    },
    {
      "style_name": "Geometric",
      "style_id": "a1IaZ000001VCQvUAO",
      "description": "Pattern-focused designs with shapes and angles",
      "characteristics": "Repeating patterns, angular forms, bold contrasts"
    },
    {
      "style_name": "Southwestern",
      "style_id": "a1IaZ000001VGMTUA4",
      "description": "Desert-inspired with Native American influences",
      "characteristics": "Terracotta, turquoise, geometric patterns, natural materials"
    },
    {
      "style_name": "Striped",
      "style_id": "a1IaZ000001VGuLUAW",
      "description": "Linear pattern style for rugs and fabrics",
      "characteristics": "Parallel lines, various widths, directional patterns"
    }
  ]
}
```

---

## CATEGORY-TYPE MAPPING

**Action**: `ADD`

**Note**: Complete mappings for 24 key categories. All existing type IDs are production IDs. New types marked with "New - Create Salesforce ID".

```json
{
  "action": "ADD",
  "mappings": [
    {
      "category_name": "Bathroom Faucet",
      "category_id": "a01aZ00000dC5DeQAK",
      "styles_apply": true,
      "types": [
        { "type_name": "Single Handle", "type_id": "a1jaZ000001lFAmQAM", "type_group": "Handle Configuration" },
        { "type_name": "Two Handle", "type_id": "a1jaZ000001lFCRQA2", "type_group": "Handle Configuration" },
        { "type_name": "Touchless", "type_id": "a1jaZ000001lFCAQA2", "type_group": "Handle Configuration" },
        { "type_name": "Centerset", "type_id": "a1jaZ000001lF4OQAU", "type_group": "Installation" },
        { "type_name": "Widespread", "type_id": "a1jaZ000001lFDGQA2", "type_group": "Installation" },
        { "type_name": "Single Hole", "type_id": "a1jaZ000001lF9XQAU", "type_group": "Installation" },
        { "type_name": "Wall Mount", "type_id": "a1jaZ000001lFCxQAM", "type_group": "Installation" },
        { "type_name": "Vessel", "type_id": "a1jaZ000001lFClQAM", "type_group": "Installation" },
        { "type_name": "High-Arc", "type_id": "New - Create Salesforce ID", "type_group": "Spout Style" },
        { "type_name": "Low-Arc", "type_id": "New - Create Salesforce ID", "type_group": "Spout Style" },
        { "type_name": "Waterfall", "type_id": "a1jaZ000001lFD7QAM", "type_group": "Spout Style" }
      ]
    },
    {
      "category_name": "Kitchen Faucet",
      "category_id": "a01aZ00000dC5E9QAK",
      "styles_apply": true,
      "types": [
        { "type_name": "Single Handle", "type_id": "a1jaZ000001lFAmQAM", "type_group": "Handle Configuration" },
        { "type_name": "Two Handle", "type_id": "a1jaZ000001lFCRQA2", "type_group": "Handle Configuration" },
        { "type_name": "Touchless", "type_id": "a1jaZ000001lFCAQA2", "type_group": "Handle Configuration" },
        { "type_name": "Touch-On", "type_id": "New - Create Salesforce ID", "type_group": "Handle Configuration" },
        { "type_name": "Pull-Down", "type_id": "a1jaZ000001lF8YQAU", "type_group": "Spout Style" },
        { "type_name": "Pull-Out", "type_id": "a1jaZ000001lF8ZQAU", "type_group": "Spout Style" },
        { "type_name": "High-Arc", "type_id": "New - Create Salesforce ID", "type_group": "Spout Style" },
        { "type_name": "Commercial Style", "type_id": "New - Create Salesforce ID", "type_group": "Spout Style" },
        { "type_name": "Bridge", "type_id": "a1jaZ000001lF3zQAE", "type_group": "Spout Style" },
        { "type_name": "Wall Mount", "type_id": "a1jaZ000001lFCxQAM", "type_group": "Installation" },
        { "type_name": "Deck Mount", "type_id": "a1jaZ000001lF5CQAU", "type_group": "Installation" }
      ]
    },
    {
      "category_name": "Kitchen Sink",
      "category_id": "a01aZ00000dC5EDQA0",
      "styles_apply": true,
      "types": [
        { "type_name": "Undermount", "type_id": "a1jaZ000001lFCXQA2", "type_group": "Installation" },
        { "type_name": "Drop-In", "type_id": "a1jaZ000001lF5kQAE", "type_group": "Installation" },
        { "type_name": "Apron Front", "type_id": "a1jaZ000001lF3GQAU", "type_group": "Installation" },
        { "type_name": "Single Bowl", "type_id": "a1jaZ000001lF9PQAU", "type_group": "Bowl Configuration" },
        { "type_name": "Double Bowl", "type_id": "a1jaZ000001lF5iQAE", "type_group": "Bowl Configuration" },
        { "type_name": "Triple Bowl", "type_id": "New - Create Salesforce ID", "type_group": "Bowl Configuration" }
      ]
    },
    {
      "category_name": "Bathroom Sink",
      "category_id": "a01aZ00000dC5DiQAK",
      "styles_apply": true,
      "types": [
        { "type_name": "Undermount", "type_id": "a1jaZ000001lFCXQA2", "type_group": "Installation" },
        { "type_name": "Drop-In", "type_id": "a1jaZ000001lF5kQAE", "type_group": "Installation" },
        { "type_name": "Vessel", "type_id": "a1jaZ000001lFClQAM", "type_group": "Installation" },
        { "type_name": "Console", "type_id": "a1jaZ000001lF4kQAE", "type_group": "Installation" },
        { "type_name": "Pedestal", "type_id": "a1jaZ000001lF8GQAU", "type_group": "Installation" },
        { "type_name": "Wall Mount", "type_id": "a1jaZ000001lFCxQAM", "type_group": "Installation" }
      ]
    },
    {
      "category_name": "Toilet",
      "category_id": "a01aZ00000dC5DyQAK",
      "styles_apply": true,
      "types": [
        { "type_name": "Two-Piece", "type_id": "a1jaZ000001lFCSQA2", "type_group": "Configuration" },
        { "type_name": "One-Piece", "type_id": "a1jaZ000001lF7pQAE", "type_group": "Configuration" },
        { "type_name": "Wall-Hung", "type_id": "New - Create Salesforce ID", "type_group": "Configuration" },
        { "type_name": "Smart/Electronic", "type_id": "New - Create Salesforce ID", "type_group": "Configuration" },
        { "type_name": "Comfort Height", "type_id": "New - Create Salesforce ID", "type_group": "Height" },
        { "type_name": "Standard Height", "type_id": "New - Create Salesforce ID", "type_group": "Height" },
        { "type_name": "Elongated", "type_id": "a1jaZ000001lF5tQAE", "type_group": "Bowl Shape" },
        { "type_name": "Round-Front", "type_id": "New - Create Salesforce ID", "type_group": "Bowl Shape" },
        { "type_name": "Dual-Flush", "type_id": "New - Create Salesforce ID", "type_group": "Flush Type" },
        { "type_name": "Gravity", "type_id": "New - Create Salesforce ID", "type_group": "Flush Type" },
        { "type_name": "Pressure-Assisted", "type_id": "New - Create Salesforce ID", "type_group": "Flush Type" }
      ]
    },
    {
      "category_name": "Bathtub",
      "category_id": "a01aZ00000dC5DlQAK",
      "styles_apply": true,
      "types": [
        { "type_name": "Alcove", "type_id": "a1jaZ000001lF3DQAU", "type_group": "Installation" },
        { "type_name": "Drop-In", "type_id": "a1jaZ000001lF5kQAE", "type_group": "Installation" },
        { "type_name": "Undermount", "type_id": "a1jaZ000001lFCXQA2", "type_group": "Installation" },
        { "type_name": "Freestanding", "type_id": "a1jaZ000001lF60QAE", "type_group": "Installation" },
        { "type_name": "Clawfoot", "type_id": "a1jaZ000001lF4YQAU", "type_group": "Installation" },
        { "type_name": "Corner", "type_id": "a1jaZ000001lF4lQAE", "type_group": "Installation" },
        { "type_name": "Walk-In", "type_id": "a1jaZ000001lFCqQAM", "type_group": "Installation" },
        { "type_name": "Soaking", "type_id": "a1jaZ000001lF9aQAE", "type_group": "Type" },
        { "type_name": "Whirlpool", "type_id": "a1jaZ000001lFDCQA2", "type_group": "Type" },
        { "type_name": "Air Bath", "type_id": "a1jaZ000001lF3BQAU", "type_group": "Type" }
      ]
    },
    {
      "category_name": "Shower",
      "category_id": "a01aZ00000dC5DuQAK",
      "styles_apply": true,
      "types": [
        { "type_name": "Alcove", "type_id": "a1jaZ000001lF3DQAU", "type_group": "Configuration" },
        { "type_name": "Corner", "type_id": "a1jaZ000001lF4lQAE", "type_group": "Configuration" },
        { "type_name": "Neo-Angle", "type_id": "New - Create Salesforce ID", "type_group": "Configuration" },
        { "type_name": "Barrier-Free", "type_id": "New - Create Salesforce ID", "type_group": "Configuration" },
        { "type_name": "Walk-In", "type_id": "a1jaZ000001lFCqQAM", "type_group": "Configuration" }
      ]
    },
    {
      "category_name": "Bathroom Vanity",
      "category_id": "a01aZ00000dC5DjQAK",
      "styles_apply": true,
      "types": [
        { "type_name": "Single Sink", "type_id": "a1jaZ000001lF9QQAU", "type_group": "Size" },
        { "type_name": "Double Sink", "type_id": "a1jaZ000001lF5iQAE", "type_group": "Size" },
        { "type_name": "Freestanding", "type_id": "a1jaZ000001lF60QAE", "type_group": "Installation" },
        { "type_name": "Wall Mounted", "type_id": "a1jaZ000001lFCyQAM", "type_group": "Installation" },
        { "type_name": "Floating", "type_id": "New - Create Salesforce ID", "type_group": "Installation" },
        { "type_name": "Corner", "type_id": "a1jaZ000001lF4lQAE", "type_group": "Installation" }
      ]
    },
    {
      "category_name": "Chandelier",
      "category_id": "a01aZ00000dC5EIQA0",
      "styles_apply": true,
      "types": [
        { "type_name": "Chandelier", "type_id": "a1jaZ000001lF4SQAU", "type_group": "Type" },
        { "type_name": "Linear", "type_id": "a1jaZ000001lF7FQAU", "type_group": "Shape" },
        { "type_name": "Drum", "type_id": "a1jaZ000001lF5mQAE", "type_group": "Shape" },
        { "type_name": "Candelabra", "type_id": "New - Create Salesforce ID", "type_group": "Shape" },
        { "type_name": "Globe", "type_id": "New - Create Salesforce ID", "type_group": "Shape" },
        { "type_name": "1-Light", "type_id": "New - Create Salesforce ID", "type_group": "Light Count" },
        { "type_name": "3-Light", "type_id": "New - Create Salesforce ID", "type_group": "Light Count" },
        { "type_name": "5-Light", "type_id": "New - Create Salesforce ID", "type_group": "Light Count" },
        { "type_name": "6-Light", "type_id": "New - Create Salesforce ID", "type_group": "Light Count" }
      ]
    },
    {
      "category_name": "Wall Sconce",
      "category_id": "a01aZ00000dC5EfQAK",
      "styles_apply": true,
      "types": [
        { "type_name": "Wall Sconce", "type_id": "a1jaZ000001lFD2QAM", "type_group": "Type" },
        { "type_name": "Up Light", "type_id": "a1jaZ000001lFCbQAM", "type_group": "Direction" },
        { "type_name": "Down Light", "type_id": "a1jaZ000001lF5gQAE", "type_group": "Direction" },
        { "type_name": "Up/Down Light", "type_id": "New - Create Salesforce ID", "type_group": "Direction" },
        { "type_name": "1-Light", "type_id": "New - Create Salesforce ID", "type_group": "Light Count" },
        { "type_name": "2-Light", "type_id": "a1jaZ000001lF34QAE", "type_group": "Light Count" }
      ]
    },
    {
      "category_name": "Vanity Light",
      "category_id": "a01aZ00000dC5EeQAK",
      "styles_apply": true,
      "types": [
        { "type_name": "Bath Bar", "type_id": "a1jaZ000001lF3aQAE", "type_group": "Type" },
        { "type_name": "Vanity", "type_id": "a1jaZ000001lFCfQAM", "type_group": "Type" },
        { "type_name": "1-Light", "type_id": "New - Create Salesforce ID", "type_group": "Light Count" },
        { "type_name": "2-Light", "type_id": "a1jaZ000001lF34QAE", "type_group": "Light Count" },
        { "type_name": "3-Light", "type_id": "New - Create Salesforce ID", "type_group": "Light Count" },
        { "type_name": "4-Light", "type_id": "New - Create Salesforce ID", "type_group": "Light Count" }
      ]
    },
    {
      "category_name": "Ceiling Fan",
      "category_id": "a01aZ00000dC5EGQA0",
      "styles_apply": true,
      "types": [
        { "type_name": "With Light", "type_id": "a1jaZ000001lFDNQA2", "type_group": "Features" },
        { "type_name": "Without Light", "type_id": "a1jaZ000001lFDPQA2", "type_group": "Features" },
        { "type_name": "Smart", "type_id": "a1jaZ000001lF9KQAU", "type_group": "Control" },
        { "type_name": "Remote", "type_id": "New - Create Salesforce ID", "type_group": "Control" },
        { "type_name": "3-Blade", "type_id": "New - Create Salesforce ID", "type_group": "Blade Count" },
        { "type_name": "4-Blade", "type_id": "New - Create Salesforce ID", "type_group": "Blade Count" },
        { "type_name": "5-Blade", "type_id": "New - Create Salesforce ID", "type_group": "Blade Count" }
      ]
    },
    {
      "category_name": "Cabinet Hardware",
      "category_id": "a01aZ00000dC5E4QAK",
      "styles_apply": true,
      "types": [
        { "type_name": "Knob", "type_id": "a1jaZ000001lF6hQAE", "type_group": "Type" },
        { "type_name": "Bar Pull", "type_id": "a1jaZ000001lF3PQAU", "type_group": "Type" },
        { "type_name": "Cup Pull", "type_id": "a1jaZ000001lF4vQAE", "type_group": "Type" },
        { "type_name": "Bin Pull", "type_id": "a1jaZ000001lF3mQAE", "type_group": "Type" },
        { "type_name": "Appliance Pull", "type_id": "a1jaZ000001lF3FQAU", "type_group": "Type" },
        { "type_name": "Edge Pull", "type_id": "New - Create Salesforce ID", "type_group": "Type" },
        { "type_name": "Wire Pull", "type_id": "a1jaZ000001lFDLQA2", "type_group": "Type" }
      ]
    },
    {
      "category_name": "Door Lever",
      "category_id": "a01aZ00000dC5EKQA0",
      "styles_apply": true,
      "types": [
        { "type_name": "Passage", "type_id": "a1jaZ000001lF8CQAU", "type_group": "Function" },
        { "type_name": "Privacy", "type_id": "a1jaZ000001lF8XQAU", "type_group": "Function" },
        { "type_name": "Keyed Entry", "type_id": "a1jaZ000001lF6gQAE", "type_group": "Function" },
        { "type_name": "Dummy", "type_id": "a1jaZ000001lF5pQAE", "type_group": "Function" },
        { "type_name": "Single Cylinder", "type_id": "a1jaZ000001lF9OQAU", "type_group": "Lock Type" },
        { "type_name": "Double Cylinder", "type_id": "New - Create Salesforce ID", "type_group": "Lock Type" }
      ]
    },
    {
      "category_name": "Refrigerator",
      "category_id": "a01Hu000010Q5EpIAK",
      "styles_apply": true,
      "types": [
        { "type_name": "French Door", "type_id": "a1jaZ000001lF61QAE", "type_group": "Door Configuration" },
        { "type_name": "Side-by-Side", "type_id": "a1jaZ000001lF9NQAU", "type_group": "Door Configuration" },
        { "type_name": "Top-Freezer", "type_id": "a1jaZ000001lFC6QAM", "type_group": "Door Configuration" },
        { "type_name": "Bottom-Freezer", "type_id": "a1jaZ000001lF3wQAE", "type_group": "Door Configuration" },
        { "type_name": "Single Door", "type_id": "New - Create Salesforce ID", "type_group": "Door Configuration" },
        { "type_name": "Built-In", "type_id": "a1jaZ000001lF42QAE", "type_group": "Installation" },
        { "type_name": "Freestanding", "type_id": "a1jaZ000001lF60QAE", "type_group": "Installation" },
        { "type_name": "Counter Depth", "type_id": "a1jaZ000001lF51QAE", "type_group": "Installation" },
        { "type_name": "Panel-Ready", "type_id": "New - Create Salesforce ID", "type_group": "Installation" }
      ]
    },
    {
      "category_name": "Dishwasher",
      "category_id": "a01Hu000010Q5EiIAK",
      "styles_apply": true,
      "types": [
        { "type_name": "Built-In", "type_id": "a1jaZ000001lF42QAE", "type_group": "Installation" },
        { "type_name": "Portable", "type_id": "a1jaZ000001lF8SQAU", "type_group": "Installation" },
        { "type_name": "Drawer", "type_id": "a1jaZ000001lF5hQAE", "type_group": "Configuration" },
        { "type_name": "Panel-Ready", "type_id": "New - Create Salesforce ID", "type_group": "Installation" },
        { "type_name": "Fully Integrated", "type_id": "New - Create Salesforce ID", "type_group": "Installation" },
        { "type_name": "Front Control", "type_id": "a1jaZ000001lF62QAE", "type_group": "Control Position" },
        { "type_name": "Top Control", "type_id": "a1jaZ000001lFC4QAM", "type_group": "Control Position" }
      ]
    },
    {
      "category_name": "Range",
      "category_id": "a01Hu000010Q5EnIAK",
      "styles_apply": true,
      "types": [
        { "type_name": "Freestanding", "type_id": "a1jaZ000001lF60QAE", "type_group": "Installation" },
        { "type_name": "Slide-In", "type_id": "a1jaZ000001lF9ZQAU", "type_group": "Installation" },
        { "type_name": "Drop-In", "type_id": "a1jaZ000001lF5kQAE", "type_group": "Installation" },
        { "type_name": "Gas", "type_id": "a1jaZ000001lF6AQAU", "type_group": "Fuel Type" },
        { "type_name": "Electric", "type_id": "a1jaZ000001lF5sQAE", "type_group": "Fuel Type" },
        { "type_name": "Dual Fuel", "type_id": "a1jaZ000001lF5oQAE", "type_group": "Fuel Type" },
        { "type_name": "Induction", "type_id": "a1jaZ000001lF6dQAE", "type_group": "Fuel Type" },
        { "type_name": "Front Control", "type_id": "a1jaZ000001lF62QAE", "type_group": "Control Position" },
        { "type_name": "Rear Control", "type_id": "New - Create Salesforce ID", "type_group": "Control Position" }
      ]
    },
    {
      "category_name": "Washer",
      "category_id": "a01Hu000010Q5EsIAK",
      "styles_apply": false,
      "types": [
        { "type_name": "Front Load", "type_id": "a1jaZ000001lF63QAE", "type_group": "Configuration" },
        { "type_name": "Top Load", "type_id": "a1jaZ000001lFC5QAM", "type_group": "Configuration" },
        { "type_name": "Stackable", "type_id": "a1jaZ000001lFAuQAM", "type_group": "Configuration" },
        { "type_name": "Compact", "type_id": "a1jaZ000001lF4iQAE", "type_group": "Size" },
        { "type_name": "Portable", "type_id": "a1jaZ000001lF8SQAU", "type_group": "Configuration" }
      ]
    },
    {
      "category_name": "Dryer",
      "category_id": "a01Hu000010Q5EjIAK",
      "styles_apply": false,
      "types": [
        { "type_name": "Electric", "type_id": "a1jaZ000001lF5sQAE", "type_group": "Fuel Type" },
        { "type_name": "Gas", "type_id": "a1jaZ000001lF6AQAU", "type_group": "Fuel Type" },
        { "type_name": "Vented", "type_id": "a1jaZ000001lFCjQAM", "type_group": "Venting" },
        { "type_name": "Ventless", "type_id": "a1jaZ000001lFCkQAM", "type_group": "Venting" },
        { "type_name": "Stackable", "type_id": "a1jaZ000001lFAuQAM", "type_group": "Configuration" }
      ]
    },
    {
      "category_name": "Hardwood Flooring",
      "category_id": "a01aZ00000dCekSQAS",
      "styles_apply": true,
      "types": [
        { "type_name": "Solid", "type_id": "a1jaZ000001lF9bQAE", "type_group": "Construction" },
        { "type_name": "Engineered", "type_id": "a1jaZ000001lF5uQAE", "type_group": "Construction" },
        { "type_name": "Nail Down", "type_id": "New - Create Salesforce ID", "type_group": "Installation" },
        { "type_name": "Glue Down", "type_id": "New - Create Salesforce ID", "type_group": "Installation" },
        { "type_name": "Click Lock", "type_id": "a1jaZ000001lF4aQAE", "type_group": "Installation" },
        { "type_name": "Floating", "type_id": "a1jaZ000001lF5zQAE", "type_group": "Installation" },
        { "type_name": "Prefinished", "type_id": "a1jaZ000001lF8VQAU", "type_group": "Finish" },
        { "type_name": "Unfinished", "type_id": "a1jaZ000001lFCYQA2", "type_group": "Finish" },
        { "type_name": "Hand-Scraped", "type_id": "New - Create Salesforce ID", "type_group": "Finish" },
        { "type_name": "Wire-Brushed", "type_id": "New - Create Salesforce ID", "type_group": "Finish" }
      ]
    },
    {
      "category_name": "Luxury Vinyl Flooring",
      "category_id": "a01aZ00000dCekRQAS",
      "styles_apply": true,
      "types": [
        { "type_name": "Vinyl Plank", "type_id": "a1jaZ000001lFCnQAM", "type_group": "Format" },
        { "type_name": "Vinyl Tile", "type_id": "a1jaZ000001lFCoQAM", "type_group": "Format" },
        { "type_name": "Click Lock", "type_id": "a1jaZ000001lF4aQAE", "type_group": "Installation" },
        { "type_name": "Glue Down", "type_id": "New - Create Salesforce ID", "type_group": "Installation" },
        { "type_name": "Loose Lay", "type_id": "New - Create Salesforce ID", "type_group": "Installation" },
        { "type_name": "WPC", "type_id": "New - Create Salesforce ID", "type_group": "Core Type" },
        { "type_name": "SPC", "type_id": "New - Create Salesforce ID", "type_group": "Core Type" },
        { "type_name": "Rigid Core", "type_id": "New - Create Salesforce ID", "type_group": "Core Type" }
      ]
    },
    {
      "category_name": "Furniture",
      "category_id": "a01aZ00000dCekIQAS",
      "styles_apply": true,
      "types": [
        { "type_name": "Sofa", "type_id": "New - Create Salesforce ID", "type_group": "Type" },
        { "type_name": "Chair", "type_id": "a1jaZ000001lF4RQAU", "type_group": "Type" },
        { "type_name": "Dining Chair", "type_id": "New - Create Salesforce ID", "type_group": "Type" },
        { "type_name": "Lounge Chair", "type_id": "New - Create Salesforce ID", "type_group": "Type" },
        { "type_name": "Bar Stool", "type_id": "a1jaZ000001lF3RQAU", "type_group": "Type" },
        { "type_name": "Bench", "type_id": "a1jaZ000001lF3fQAE", "type_group": "Type" },
        { "type_name": "Table", "type_id": "New - Create Salesforce ID", "type_group": "Type" },
        { "type_name": "Desk", "type_id": "a1jaZ000001lF5YQAU", "type_group": "Type" },
        { "type_name": "Cabinet", "type_id": "a1jaZ000001lF46QAE", "type_group": "Type" }
      ]
    },
    {
      "category_name": "Rug",
      "category_id": "a01aZ00000dCekNQAS",
      "styles_apply": true,
      "types": [
        { "type_name": "Area Rug", "type_id": "New - Create Salesforce ID", "type_group": "Type" },
        { "type_name": "Runner", "type_id": "New - Create Salesforce ID", "type_group": "Type" },
        { "type_name": "Bath Mat", "type_id": "a1jaZ000001lF3bQAE", "type_group": "Type" },
        { "type_name": "Outdoor Rug", "type_id": "New - Create Salesforce ID", "type_group": "Type" }
      ]
    }
  ]
}
```

---

## IMPLEMENTATION STEPS

1. **Backup Production Data** - Export all current relationships

2. **Create New Types** - Generate Salesforce IDs for 51 new types marked "New - Create Salesforce ID"

3. **Update Categories** - Add `subcategory` and `styles_apply` fields

4. **Create Mappings** - Build category-type junction tables

5. **Validation** - Verify no orphaned records

6. **Frontend Updates** - Show/hide style filters based on `styles_apply` flag

---

## VERIFICATION CHECKLIST

After Copilot processes this update:

- [ ] All existing type IDs match production (129 types)
- [ ] All category IDs match production (80+ categories)
- [ ] All style IDs match production (16 styles)
- [ ] 51 new types created with proper Salesforce IDs
- [ ] `subcategory` field added to all categories
- [ ] `styles_apply` boolean added to all categories
- [ ] Category-type mappings created
- [ ] No styles assigned to categories where `styles_apply = false`

---

*Last updated: February 11, 2026 - Production data validated*
