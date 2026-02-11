# Picklist Update - Taxonomy Restructure (CORRECTED)

**Instructions**: Copy this entire document and paste it to Copilot with the command: "Update picklists with this data"

**Date**: February 11, 2026  
**Version**: 2.0 - CORRECTED (No duplicate IDs)  
**Validation**: All IDs verified against production  

---

## ⚠️ CORRECTION APPLIED

This is the CORRECTED version. Issues fixed:
- ❌ Removed fictional categories ("Table Lamp", "Desk Lamp", standalone "Hinge")
- ✅ All 79 category IDs verified against production
- ✅ Zero duplicate IDs
- ✅ Only real categories from production

---

## CATEGORIES

**Action**: `UPDATE`

**Note**: Adding `subcategory` and `styles_apply` fields to 79 core categories. All category_id values are production IDs.


```json
{
  "action": "UPDATE",
  "categories": [
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Bathroom Faucets",
      "category_name": "Bathroom Faucet",
      "category_id": "a01aZ00000dC5DeQAK",
      "styles_apply": true
    },
    {
      "family": "Kitchen",
      "department": "Plumbing & Bath",
      "subcategory": "Kitchen Faucets",
      "category_name": "Kitchen Faucet",
      "category_id": "a01aZ00000dC5E9QAK",
      "styles_apply": true
    },
    {
      "family": "Kitchen",
      "department": "Plumbing & Bath",
      "subcategory": "Kitchen Faucets",
      "category_name": "Bar Faucet",
      "category_id": "a01aZ00000dC5E3QAK",
      "styles_apply": true
    },
    {
      "family": "Kitchen",
      "department": "Plumbing & Bath",
      "subcategory": "Kitchen Faucets",
      "category_name": "Pot Filler Faucet",
      "category_id": "a01aZ00000dC5EHQA0",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Tub & Shower Faucets",
      "category_name": "Tub Faucet",
      "category_id": "a01aZ00000dC5DzQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Tub & Shower Faucets",
      "category_name": "Shower Faucet",
      "category_id": "a01aZ00000dC5DtQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Bathroom Faucets",
      "category_name": "Bidet Faucet",
      "category_id": "a01aZ00000dC5DmQAK",
      "styles_apply": true
    },
    {
      "family": "Kitchen",
      "department": "Plumbing & Bath",
      "subcategory": "Sinks",
      "category_name": "Kitchen Sink",
      "category_id": "a01aZ00000dC5EDQA0",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Sinks",
      "category_name": "Bathroom Sink",
      "category_id": "a01aZ00000dC5DiQAK",
      "styles_apply": true
    },
    {
      "family": "Kitchen",
      "department": "Plumbing & Bath",
      "subcategory": "Sinks",
      "category_name": "Bar & Prep Sink",
      "category_id": "a01aZ00000dC5E2QAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Toilets & Bidets",
      "category_name": "Toilet",
      "category_id": "a01aZ00000dC5DyQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Toilets & Bidets",
      "category_name": "Toilet Seat",
      "category_id": "a01aZ00000dC5DxQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Toilets & Bidets",
      "category_name": "Bidet",
      "category_id": "a01aZ00000dC5DoQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Toilets & Bidets",
      "category_name": "Bidet Seat",
      "category_id": "a01aZ00000dC5DnQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Toilets & Bidets",
      "category_name": "Urinal",
      "category_id": "a01aZ00000dC5E0QAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Bathtubs",
      "category_name": "Bathtub",
      "category_id": "a01aZ00000dC5DlQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Shower Components",
      "category_name": "Shower",
      "category_id": "a01aZ00000dC5DuQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Shower Components",
      "category_name": "Steam Shower",
      "category_id": "a01aZ00000dC5DvQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Shower Components",
      "category_name": "Shower Accessory",
      "category_id": "a01aZ00000dC5DsQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Vanities & Mirrors",
      "category_name": "Bathroom Vanity",
      "category_id": "a01aZ00000dC5DjQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Vanities & Mirrors",
      "category_name": "Bathroom Mirror",
      "category_id": "a01aZ00000dC5DhQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Vanities & Mirrors",
      "category_name": "Medicine Cabinet",
      "category_id": "a01aZ00000dC5DqQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Bathroom Accessories",
      "category_name": "Bathroom Hardware and Accessories",
      "category_id": "a01aZ00000dC5DfQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Bathroom Accessories",
      "category_name": "Tub and Shower Accessory",
      "category_id": "a01aZ00000dDnKlQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Ventilation",
      "category_name": "Bath Fan",
      "category_id": "a01aZ00000dC5DcQAK",
      "styles_apply": false
    },
    {
      "family": "Bath",
      "department": "Plumbing & Bath",
      "subcategory": "Plumbing Parts & Fittings",
      "category_name": "Rough-In Valve",
      "category_id": "a01aZ00000dC5DrQAK",
      "styles_apply": false
    },
    {
      "family": "General",
      "department": "Lighting & Electrical",
      "subcategory": "Ceiling Lighting",
      "category_name": "Ceiling Light",
      "category_id": "a01aZ00000dC5EKQA0",
      "styles_apply": true
    },
    {
      "family": "General",
      "department": "Lighting & Electrical",
      "subcategory": "Ceiling Lighting",
      "category_name": "Chandelier",
      "category_id": "a01aZ00000dC5ELQA0",
      "styles_apply": true
    },
    {
      "family": "General",
      "department": "Lighting & Electrical",
      "subcategory": "Ceiling Lighting",
      "category_name": "Flush and Semi-Flush",
      "category_id": "a01aZ00000dC5ENQA0",
      "styles_apply": true
    },
    {
      "family": "General",
      "department": "Lighting & Electrical",
      "subcategory": "Wall Lighting",
      "category_name": "Wall Sconce",
      "category_id": "a01aZ00000dC5EeQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Lighting & Electrical",
      "subcategory": "Wall Lighting",
      "category_name": "Vanity Lighting",
      "category_id": "a01aZ00000dC5EdQAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Lighting & Electrical",
      "subcategory": "Wall Lighting",
      "category_name": "Bathroom Lighting",
      "category_id": "a01aZ00000dC5DgQAK",
      "styles_apply": true
    },
    {
      "family": "Outdoor",
      "department": "Lighting & Electrical",
      "subcategory": "Outdoor Lighting",
      "category_name": "Outdoor Lighting",
      "category_id": "a01aZ00000dCejvQAC",
      "styles_apply": true
    },
    {
      "family": "General",
      "department": "Lighting & Electrical",
      "subcategory": "Specialty Lighting",
      "category_name": "Recessed Lighting",
      "category_id": "a01aZ00000dC5EZQA0",
      "styles_apply": false
    },
    {
      "family": "General",
      "department": "Lighting & Electrical",
      "subcategory": "Specialty Lighting",
      "category_name": "Under Cabinet Light",
      "category_id": "a01aZ00000dC5EcQAK",
      "styles_apply": false
    },
    {
      "family": "General",
      "department": "Lighting & Electrical",
      "subcategory": "Specialty Lighting",
      "category_name": "Track and Rail Lighting",
      "category_id": "a01aZ00000dC5EbQAK",
      "styles_apply": false
    },
    {
      "family": "Home Improvement",
      "department": "Lighting & Electrical",
      "subcategory": "Lamps",
      "category_name": "Lamp",
      "category_id": "a01aZ00000dCekOQAS",
      "styles_apply": true
    },
    {
      "family": "General",
      "department": "Lighting & Electrical",
      "subcategory": "Fans",
      "category_name": "Ceiling Fan",
      "category_id": "a01aZ00000dC5EjQAK",
      "styles_apply": true
    },
    {
      "family": "General",
      "department": "Lighting & Electrical",
      "subcategory": "Fans",
      "category_name": "Ceiling Fan with Light",
      "category_id": "a01aZ00000dC5EkQAK",
      "styles_apply": true
    },
    {
      "family": "Outdoor",
      "department": "Lighting & Electrical",
      "subcategory": "Fans",
      "category_name": "Outdoor Ceiling Fan",
      "category_id": "a01aZ00000dCejrQAC",
      "styles_apply": true
    },
    {
      "family": "Home Improvement",
      "department": "Hardware",
      "subcategory": "Cabinet Hardware",
      "category_name": "Cabinet Hardware",
      "category_id": "a01aZ00000dC5F2QAK",
      "styles_apply": true
    },
    {
      "family": "Bath",
      "department": "Hardware",
      "subcategory": "Cabinet Hardware",
      "category_name": "Bathroom Cabinet Hardware",
      "category_id": "a01aZ00000dC5DdQAK",
      "styles_apply": true
    },
    {
      "family": "Home Improvement",
      "department": "Hardware",
      "subcategory": "Cabinet Hardware",
      "category_name": "Cabinet Knob",
      "category_id": "a01aZ00000dCejZQAS",
      "styles_apply": true
    },
    {
      "family": "Home Improvement",
      "department": "Hardware",
      "subcategory": "Cabinet Hardware",
      "category_name": "Cabinet Pull",
      "category_id": "a01aZ00000dCejcQAC",
      "styles_apply": true
    },
    {
      "family": "Home Improvement",
      "department": "Hardware",
      "subcategory": "Door Hardware",
      "category_name": "Door Knob",
      "category_id": "a01aZ00000dCejBQAS",
      "styles_apply": true
    },
    {
      "family": "Home Improvement",
      "department": "Hardware",
      "subcategory": "Door Hardware",
      "category_name": "Door Lever",
      "category_id": "a01aZ00000dCejCQAS",
      "styles_apply": true
    },
    {
      "family": "Home Improvement",
      "department": "Hardware",
      "subcategory": "Door Hardware",
      "category_name": "Handleset",
      "category_id": "a01aZ00000dCejEQAS",
      "styles_apply": true
    },
    {
      "family": "Home Improvement",
      "department": "Hardware",
      "subcategory": "Door Hardware",
      "category_name": "Deadbolt",
      "category_id": "a01aZ00000dC5F5QAK",
      "styles_apply": true
    },
    {
      "family": "Home Improvement",
      "department": "Hardware",
      "subcategory": "Door Hardware",
      "category_name": "Door Hinge",
      "category_id": "a01aZ00000dC5FAQA0",
      "styles_apply": false
    },
    {
      "family": "Kitchen",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "category_name": "Refrigerator",
      "category_id": "a01Hu000010Q5EpIAK",
      "styles_apply": true
    },
    {
      "family": "Kitchen",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "category_name": "Dishwasher",
      "category_id": "a01Hu000010Q5EiIAK",
      "styles_apply": true
    },
    {
      "family": "Kitchen",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "category_name": "Range",
      "category_id": "a01Hu000010Q5EnIAK",
      "styles_apply": true
    },
    {
      "family": "Kitchen",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "category_name": "Cooktop",
      "category_id": "a01Hu000010Q5EhIAK",
      "styles_apply": true
    },
    {
      "family": "Kitchen",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "category_name": "Oven",
      "category_id": "a01Hu000010Q5EmIAK",
      "styles_apply": true
    },
    {
      "family": "Kitchen",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "category_name": "Microwave",
      "category_id": "a01Hu000010Q5ElIAK",
      "styles_apply": true
    },
    {
      "family": "Kitchen",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "category_name": "Range Hood",
      "category_id": "a01Hu000010Q5EoIAK",
      "styles_apply": true
    },
    {
      "family": "Kitchen",
      "department": "Appliances",
      "subcategory": "Kitchen Appliances",
      "category_name": "Coffee Maker",
      "category_id": "a01Hu000011kmDGIAY",
      "styles_apply": true
    },
    {
      "family": "Laundry",
      "department": "Appliances",
      "subcategory": "Laundry Appliances",
      "category_name": "Washer",
      "category_id": "a01Hu000010Q5EsIAK",
      "styles_apply": false
    },
    {
      "family": "Laundry",
      "department": "Appliances",
      "subcategory": "Laundry Appliances",
      "category_name": "Dryer",
      "category_id": "a01Hu000010Q5EjIAK",
      "styles_apply": false
    },
    {
      "family": "HVAC",
      "department": "Heating & Cooling",
      "subcategory": "Air Conditioning",
      "category_name": "Air Conditioner",
      "category_id": "a01aZ00000dCek0QAC",
      "styles_apply": false
    },
    {
      "family": "HVAC",
      "department": "Heating & Cooling",
      "subcategory": "Air Conditioning",
      "category_name": "Mini Split Air Conditioner",
      "category_id": "a01aZ00000dCekBQAS",
      "styles_apply": false
    },
    {
      "family": "HVAC",
      "department": "Heating & Cooling",
      "subcategory": "Heating Systems",
      "category_name": "Stove and Fireplace",
      "category_id": "a01aZ00000dCekFQAS",
      "styles_apply": true
    },
    {
      "family": "General",
      "department": "Heating & Cooling",
      "subcategory": "Water Heaters",
      "category_name": "Water Heater",
      "category_id": "a01aZ00000bI2srQAC",
      "styles_apply": false
    },
    {
      "family": "Kitchen",
      "department": "Heating & Cooling",
      "subcategory": "Water Heaters",
      "category_name": "Tankless Water Heater",
      "category_id": "a01aZ00000dC5EIQA0",
      "styles_apply": false
    },
    {
      "family": "HVAC",
      "department": "Heating & Cooling",
      "subcategory": "HVAC Components",
      "category_name": "Thermostat",
      "category_id": "a01aZ00000dCekGQAS",
      "styles_apply": false
    },
    {
      "family": "HVAC",
      "department": "Heating & Cooling",
      "subcategory": "Outdoor Heating",
      "category_name": "Patio Heater",
      "category_id": "a01aZ00000dCekCQAS",
      "styles_apply": true
    },
    {
      "family": "General",
      "department": "Flooring",
      "subcategory": "Hard Surface Flooring",
      "category_name": "Hardwood Flooring",
      "category_id": "a01aZ00000dCekSQAS",
      "styles_apply": true
    },
    {
      "family": "General",
      "department": "Flooring",
      "subcategory": "Hard Surface Flooring",
      "category_name": "Luxury Vinyl Flooring",
      "category_id": "a01aZ00000dCekRQAS",
      "styles_apply": true
    },
    {
      "family": "General",
      "department": "Flooring",
      "subcategory": "Hard Surface Flooring",
      "category_name": "Laminate Flooring",
      "category_id": "a01aZ00000dCekTQAS",
      "styles_apply": true
    },
    {
      "family": "General",
      "department": "Flooring",
      "subcategory": "Hard Surface Flooring",
      "category_name": "Tile",
      "category_id": "a01aZ00000dCekQQAS",
      "styles_apply": true
    },
    {
      "family": "Home Improvement",
      "department": "Home D\u00e9cor & Furniture",
      "subcategory": "Furniture",
      "category_name": "Furniture",
      "category_id": "a01aZ00000dCekIQAS",
      "styles_apply": true
    },
    {
      "family": "Furniture",
      "department": "Home D\u00e9cor & Furniture",
      "subcategory": "Furniture",
      "category_name": "Chair",
      "category_id": "a01aZ00000XYWwyQAH",
      "styles_apply": true
    },
    {
      "family": "Furniture",
      "department": "Home D\u00e9cor & Furniture",
      "subcategory": "Furniture",
      "category_name": "Outdoor and Patio Furniture",
      "category_id": "a01aZ00000dCekPQAS",
      "styles_apply": true
    },
    {
      "family": "Home Improvement",
      "department": "Home D\u00e9cor & Furniture",
      "subcategory": "Mirrors & Wall D\u00e9cor",
      "category_name": "Mirror",
      "category_id": "a01aZ00000dCekJQAS",
      "styles_apply": true
    },
    {
      "family": "Home Improvement",
      "department": "Home D\u00e9cor & Furniture",
      "subcategory": "Mirrors & Wall D\u00e9cor",
      "category_name": "Wall Decor",
      "category_id": "a01aZ00000dCekKQAS",
      "styles_apply": true
    },
    {
      "family": "Home Improvement",
      "department": "Home D\u00e9cor & Furniture",
      "subcategory": "Textiles & Accents",
      "category_name": "Rug",
      "category_id": "a01aZ00000dCekNQAS",
      "styles_apply": true
    },
    {
      "family": "Home Improvement",
      "department": "Home D\u00e9cor & Furniture",
      "subcategory": "Textiles & Accents",
      "category_name": "Home Accents",
      "category_id": "a01aZ00000dCekMQAS",
      "styles_apply": true
    },
    {
      "family": "HVAC",
      "department": "Outdoor",
      "subcategory": "Outdoor Infrastructure",
      "category_name": "Generator",
      "category_id": "a01aZ00000dCek8QAC",
      "styles_apply": false
    },
    {
      "family": "Outdoor",
      "department": "Outdoor",
      "subcategory": "Outdoor Infrastructure",
      "category_name": "Mail Box",
      "category_id": "a01aZ00000dCejqQAC",
      "styles_apply": true
    }
  ]
}
```

---

## TYPES

**Action**: `ADD`

**Note**: Adding 51 new types. All will receive Salesforce IDs when created.

```json
{
  "action": "ADD",
  "types": [
    {
      "type_name": "High-Arc",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Low-Arc",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Touch-On",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Commercial Style",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Triple Bowl",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Wall-Hung",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Smart/Electronic",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Comfort Height",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Standard Height",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Round-Front",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Dual-Flush",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Gravity",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Pressure-Assisted",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Neo-Angle",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Barrier-Free",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Floating",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Candelabra",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "1-Light",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "3-Light",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "5-Light",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "6-Light",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Mini Pendant",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Multi-Light",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Up/Down Light",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "4-Light",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Remote",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "3-Blade",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "4-Blade",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "5-Blade",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Edge Pull",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Double Cylinder",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Single Door",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Panel-Ready",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Fully Integrated",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Rear Control",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Nail Down",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Glue Down",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Hand-Scraped",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Wire-Brushed",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Loose Lay",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "WPC",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "SPC",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Rigid Core",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Sofa",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Dining Chair",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Lounge Chair",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Table",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Area Rug",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Runner",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Outdoor Rug",
      "type_id": "New - Create Salesforce ID"
    },
    {
      "type_name": "Globe",
      "type_id": "New - Create Salesforce ID"
    }
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

**Note**: Detailed mappings for 24 key categories showing which types apply.

*(Mappings will be added in next update - focusing on core data first)*

---

## VERIFICATION CHECKLIST

After applying this update:

- [ ] 79 categories updated with subcategory + styles_apply fields
- [ ] 51 new types created with Salesforce IDs
- [ ] 16 styles updated with descriptions
- [ ] No duplicate category IDs
- [ ] All existing type IDs unchanged

---

*Generated: February 11, 2026 - All IDs verified against production*
