# Picklist Update - Complete Style System

**Instructions**: Copy this entire document and paste it to Copilot with the command: "Update picklists with this data"

**Date**: February 11, 2026  
**Version**: Complete Style System (Aesthetic + Functional)  
**Total Styles**: 149 (15 existing, 134 new)  
**Total Mappings**: 79 categories

---

## 📋 OVERVIEW

### **What This Updates:**

1. **Styles** (149 total)
   - 15 existing styles (keeping production IDs)
   - 134 new styles (need Salesforce IDs)
   - Mix of aesthetic styles (Modern, Traditional, etc.) and functional styles (capacity, features, etc.)

2. **Category-Style Mappings** (79 categories)
   - 65 decorative categories → aesthetic styles
   - 14 functional categories → performance/feature styles

### **The Unified Approach:**

Every category has a "Style" filter, but what appears depends on the category:
- **Bathroom Faucet**: Modern, Traditional, Victorian, Farmhouse...
- **Generator**: Portable (≤5,000W), Whole House (≥15,000W)...
- **Thermostat**: Smart WiFi, Programmable, Non-Programmable...

**Result**: No categories without relevant filtering!

---

## STYLES

**Action**: `REPLACE_ALL`

**Note**: 149 total styles. 15 have existing Salesforce IDs from production. 134 are new and will receive Salesforce IDs when created.


```json
{
  "action": "REPLACE_ALL",
  "styles": [
    {
      "style_name": "1/4\" Radius",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "1000-1500 sq ft",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "2-Way",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "3-Way",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "30 Gallon",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "4-Way",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "40 Gallon",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "5/8\" Radius",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "50 Gallon",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "500-1000 sq ft",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "65 Gallon",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "80+ Gallon",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Adjustable Heads",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Adjustable Trim",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Airtight",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Antique Brass",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Art Deco",
      "style_id": "a1IaZ000001TYybUAG",
      "description": "Glamorous 1920s-30s aesthetic with geometric patterns and luxe materials"
    },
    {
      "style_name": "Baffle Trim",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Ball Bearing",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Battery Operated",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Battery Powered",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Black",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Bohemian",
      "style_id": "a1IaZ000001V9EXUA0",
      "description": "Eclectic, free-spirited mix of patterns, textures, and global influences"
    },
    {
      "style_name": "C-Wire Required",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Coastal",
      "style_id": "a1IaZ000001VAAbUAO",
      "description": "Relaxed, beach-inspired aesthetic with light woods and natural textures"
    },
    {
      "style_name": "Colonial",
      "style_id": "New - Create Salesforce ID",
      "description": "Early American aesthetic with traditional craftsmanship and symmetry"
    },
    {
      "style_name": "Color Changing",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Commercial-Style",
      "style_id": "New - Create Salesforce ID",
      "description": "Professional-grade appearance with industrial-quality finishes"
    },
    {
      "style_name": "Compact (\u22644.0 cu ft)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Compact (\u22646.5 cu ft)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Concealed Bearing",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Contemporary",
      "style_id": "a1IaZ000001TVZJUA4",
      "description": "Current, of-the-moment designs with evolving trends and clean lines"
    },
    {
      "style_name": "Dimmable",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Diverter Valve",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Dual Fuel",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Eclectic",
      "style_id": "New - Create Salesforce ID",
      "description": "Mix-and-match aesthetic combining diverse styles and eras"
    },
    {
      "style_name": "Electric",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Electric Start",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Energy Star",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Energy Star Certified",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "European",
      "style_id": "New - Create Salesforce ID",
      "description": "Refined Continental aesthetic with sophisticated details"
    },
    {
      "style_name": "Extra Large (5.0+ cu ft)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Extra Large (7.5+ cu ft)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Extra Large Room (\u226518,000 BTU)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Farmhouse",
      "style_id": "a1IaZ000001S93RUAS",
      "description": "Casual, rustic aesthetic with practical functionality and natural materials"
    },
    {
      "style_name": "Fixed Heads",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Flexible Track",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "GU10 Bulb",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Gasoline",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Geometric",
      "style_id": "a1IaZ000001VCQvUAO",
      "description": "Pattern-focused designs with shapes, angles, and bold contrasts"
    },
    {
      "style_name": "Graphite/Slate",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "H-Type Track",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Hardwired",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Heat Pump",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Heat Pump Compatible",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "High Airflow (\u226580 CFM)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Humidity Sensor",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "IC Rated",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Indoor",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Industrial",
      "style_id": "a1IaZ000001Sjb7UAC",
      "description": "Urban, raw aesthetic with exposed materials and metal finishes"
    },
    {
      "style_name": "Inverter",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Inverter Technology",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "J-Type Track",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "L-Type Track",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "LED Bar",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "LED Compatible",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "LED Light Included",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "LED Puck",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "LED Strip",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Large (10,000-15,000W)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Large (4.5-5.0 cu ft)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Large (7.0-7.5 cu ft)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Large Home (7-9 GPM)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Large Room (12,000-18,000 BTU)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Linkable",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Luxury",
      "style_id": "New - Create Salesforce ID",
      "description": "High-end aesthetic with premium materials and refined details"
    },
    {
      "style_name": "MR16 Bulb",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Matte Black",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Mediterranean",
      "style_id": "New - Create Salesforce ID",
      "description": "Warm, sun-drenched aesthetic inspired by coastal Southern Europe"
    },
    {
      "style_name": "Medium (4.0-4.5 cu ft)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Medium (6.5-7.0 cu ft)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Medium Home (5-7 GPM)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Medium Room (8,000-12,000 BTU)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Mid-Century Modern",
      "style_id": "New - Create Salesforce ID",
      "description": "1950s-60s aesthetic with clean lines and organic forms"
    },
    {
      "style_name": "Mid-Size (5,000-10,000W)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Minimalist",
      "style_id": "New - Create Salesforce ID",
      "description": "Pared-down aesthetic emphasizing simplicity and function"
    },
    {
      "style_name": "Modern",
      "style_id": "a1IaZ000001TWAPUA4",
      "description": "Sleek, minimalist designs with clean lines and geometric shapes"
    },
    {
      "style_name": "Moroccan",
      "style_id": "New - Create Salesforce ID",
      "description": "Exotic North African aesthetic with intricate patterns and rich colors"
    },
    {
      "style_name": "Motion Sensor",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Multi-Stage Heat/Cool",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Multi-Zone (2 Zones)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Multi-Zone (3 Zones)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Multi-Zone (4+ Zones)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Natural Gas",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "New Construction Housing",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Non-Programmable",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Oil Rubbed Bronze",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Outdoor",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Plug-In",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Point of Use (\u22643 GPM)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Polished Chrome",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Portable",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Portable (\u22645,000W)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Pressure Balance",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Programmable 5-2 Day",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Programmable 7-Day",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Propane",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Quiet Operation (\u22641.0 Sones)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Reflector Trim",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Remodel Housing",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Rustic",
      "style_id": "a1IaZ000001TVcXUAW",
      "description": "Natural, rugged aesthetic celebrating raw materials and earthy tones"
    },
    {
      "style_name": "Satin Nickel",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Scandinavian",
      "style_id": "New - Create Salesforce ID",
      "description": "Nordic aesthetic with light woods, neutrals, and functional design"
    },
    {
      "style_name": "Sensor Dry",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Shaker",
      "style_id": "New - Create Salesforce ID",
      "description": "Simple, functional American aesthetic with clean lines and craftsmanship"
    },
    {
      "style_name": "Shower Trim",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Single Zone",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Sleek",
      "style_id": "New - Create Salesforce ID",
      "description": "Smooth, streamlined aesthetic with polished finishes"
    },
    {
      "style_name": "Small Home (3-5 GPM)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Small Room (\u22648,000 BTU)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Smart WiFi",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Smart/WiFi",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Smart/WiFi Enabled",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Spa-Like",
      "style_id": "New - Create Salesforce ID",
      "description": "Serene, wellness-inspired aesthetic with natural materials"
    },
    {
      "style_name": "Square Corner",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Stainless Look",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Standard Airflow (50-80 CFM)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Standard Noise (1.0-3.0 Sones)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Steam Clean",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Steam Refresh",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Striped",
      "style_id": "a1IaZ000001VGuLUAW",
      "description": "Linear pattern style with parallel lines and directional design"
    },
    {
      "style_name": "Thermostatic",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Through-Wall",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Touchscreen",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Traditional",
      "style_id": "a1IaZ000001TLjdUAG",
      "description": "Classic, timeless designs with ornate details and formal elements"
    },
    {
      "style_name": "Transfer Valve",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Transitional",
      "style_id": "a1IaZ000001TVXhUAO",
      "description": "Balanced blend of traditional warmth and contemporary clean lines"
    },
    {
      "style_name": "Trim Included",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Tropical",
      "style_id": "a1IaZ000001TekfUAC",
      "description": "Island-inspired designs with natural materials and vibrant elements"
    },
    {
      "style_name": "Valve Only",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Victorian",
      "style_id": "a1IaZ000001TVuHUAW",
      "description": "Ornate, romantic 19th-century aesthetic with elaborate detailing"
    },
    {
      "style_name": "Vintage",
      "style_id": "a1IaZ000001TW2LUAW",
      "description": "Retro designs inspired by past eras with nostalgic elements"
    },
    {
      "style_name": "Voice Control",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "White",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Whole House (\u226515,000W)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Whole House (\u22659 GPM)",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "Window Unit",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "\u2264500 sq ft",
      "style_id": "New - Create Salesforce ID"
    },
    {
      "style_name": "\u22651500 sq ft",
      "style_id": "New - Create Salesforce ID"
    }
  ]
}
```

---

## CATEGORY-STYLE MAPPING

**Action**: `ADD`

**Note**: Defines which styles apply to each category. All 79 categories are mapped.

```json
{
  "action": "ADD",
  "category_style_mappings": [
    {
      "category_name": "Air Conditioner",
      "category_id": "a01aZ00000dCek0QAC",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "Energy Star",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Extra Large Room (\u226518,000 BTU)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Large Room (12,000-18,000 BTU)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Medium Room (8,000-12,000 BTU)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Portable",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Small Room (\u22648,000 BTU)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Smart/WiFi",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Through-Wall",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Window Unit",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Bar & Prep Sink",
      "category_id": "a01aZ00000dC5E2QAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Bar Faucet",
      "category_id": "a01aZ00000dC5E3QAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Bath Fan",
      "category_id": "a01aZ00000dC5DcQAK",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "Energy Star Certified",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "High Airflow (\u226580 CFM)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Humidity Sensor",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "LED Light Included",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Motion Sensor",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Quiet Operation (\u22641.0 Sones)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Standard Airflow (50-80 CFM)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Standard Noise (1.0-3.0 Sones)",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Bathroom Cabinet Hardware",
      "category_id": "a01aZ00000dC5DdQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Bathroom Faucet",
      "category_id": "a01aZ00000dC5DeQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Art Deco",
          "style_id": "a1IaZ000001TYybUAG"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Minimalist",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Bathroom Hardware and Accessories",
      "category_id": "a01aZ00000dC5DfQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Minimalist",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Bathroom Lighting",
      "category_id": "a01aZ00000dC5DgQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Minimalist",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Bathroom Mirror",
      "category_id": "a01aZ00000dC5DhQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Art Deco",
          "style_id": "a1IaZ000001TYybUAG"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Bathroom Sink",
      "category_id": "a01aZ00000dC5DiQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Art Deco",
          "style_id": "a1IaZ000001TYybUAG"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Bathroom Vanity",
      "category_id": "a01aZ00000dC5DjQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Mid-Century Modern",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Shaker",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Bathtub",
      "category_id": "a01aZ00000dC5DlQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Spa-Like",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Bidet",
      "category_id": "a01aZ00000dC5DoQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Bidet Faucet",
      "category_id": "a01aZ00000dC5DmQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Bidet Seat",
      "category_id": "a01aZ00000dC5DnQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Minimalist",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        }
      ]
    },
    {
      "category_name": "Cabinet Hardware",
      "category_id": "a01aZ00000dC5F2QAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Art Deco",
          "style_id": "a1IaZ000001TYybUAG"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Shaker",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        },
        {
          "style_name": "Vintage",
          "style_id": "a1IaZ000001TW2LUAW"
        }
      ]
    },
    {
      "category_name": "Cabinet Knob",
      "category_id": "a01aZ00000dCejZQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        },
        {
          "style_name": "Vintage",
          "style_id": "a1IaZ000001TW2LUAW"
        }
      ]
    },
    {
      "category_name": "Cabinet Pull",
      "category_id": "a01aZ00000dCejcQAC",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Vintage",
          "style_id": "a1IaZ000001TW2LUAW"
        }
      ]
    },
    {
      "category_name": "Ceiling Fan",
      "category_id": "a01aZ00000dC5EjQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Coastal",
          "style_id": "a1IaZ000001VAAbUAO"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Tropical",
          "style_id": "a1IaZ000001TekfUAC"
        }
      ]
    },
    {
      "category_name": "Ceiling Fan with Light",
      "category_id": "a01aZ00000dC5EkQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Coastal",
          "style_id": "a1IaZ000001VAAbUAO"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Tropical",
          "style_id": "a1IaZ000001TekfUAC"
        }
      ]
    },
    {
      "category_name": "Ceiling Light",
      "category_id": "a01aZ00000dC5EKQA0",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Art Deco",
          "style_id": "a1IaZ000001TYybUAG"
        },
        {
          "style_name": "Coastal",
          "style_id": "a1IaZ000001VAAbUAO"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Mid-Century Modern",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Chair",
      "category_id": "a01aZ00000XYWwyQAH",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Mid-Century Modern",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Chandelier",
      "category_id": "a01aZ00000dC5ELQA0",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Art Deco",
          "style_id": "a1IaZ000001TYybUAG"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Coffee Maker",
      "category_id": "a01Hu000011kmDGIAY",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Minimalist",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Cooktop",
      "category_id": "a01Hu000010Q5EhIAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Minimalist",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        }
      ]
    },
    {
      "category_name": "Deadbolt",
      "category_id": "a01aZ00000dC5F5QAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Dishwasher",
      "category_id": "a01Hu000010Q5EiIAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Door Hinge",
      "category_id": "a01aZ00000dC5FAQA0",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "1/4\" Radius",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "5/8\" Radius",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Antique Brass",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Ball Bearing",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Concealed Bearing",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Matte Black",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Oil Rubbed Bronze",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Polished Chrome",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Satin Nickel",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Square Corner",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Door Knob",
      "category_id": "a01aZ00000dCejBQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Colonial",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        },
        {
          "style_name": "Vintage",
          "style_id": "a1IaZ000001TW2LUAW"
        }
      ]
    },
    {
      "category_name": "Door Lever",
      "category_id": "a01aZ00000dCejCQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "European",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Minimalist",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Dryer",
      "category_id": "a01Hu000010Q5EjIAK",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "Black",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Compact (\u22646.5 cu ft)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Extra Large (7.5+ cu ft)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Graphite/Slate",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Large (7.0-7.5 cu ft)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Medium (6.5-7.0 cu ft)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Sensor Dry",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Stainless Look",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Steam Refresh",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "White",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Flush and Semi-Flush",
      "category_id": "a01aZ00000dC5ENQA0",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Art Deco",
          "style_id": "a1IaZ000001TYybUAG"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Mid-Century Modern",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Furniture",
      "category_id": "a01aZ00000dCekIQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Bohemian",
          "style_id": "a1IaZ000001V9EXUA0"
        },
        {
          "style_name": "Coastal",
          "style_id": "a1IaZ000001VAAbUAO"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Mid-Century Modern",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Scandinavian",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Generator",
      "category_id": "a01aZ00000dCek8QAC",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "Dual Fuel",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Electric Start",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Gasoline",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Inverter",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Large (10,000-15,000W)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Mid-Size (5,000-10,000W)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Natural Gas",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Portable (\u22645,000W)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Propane",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Whole House (\u226515,000W)",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Handleset",
      "category_id": "a01aZ00000dCejEQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Hardwood Flooring",
      "category_id": "a01aZ00000dCekSQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Home Accents",
      "category_id": "a01aZ00000dCekMQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Bohemian",
          "style_id": "a1IaZ000001V9EXUA0"
        },
        {
          "style_name": "Coastal",
          "style_id": "a1IaZ000001VAAbUAO"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Eclectic",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Kitchen Faucet",
      "category_id": "a01aZ00000dC5E9QAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Kitchen Sink",
      "category_id": "a01aZ00000dC5EDQA0",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Laminate Flooring",
      "category_id": "a01aZ00000dCekTQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Lamp",
      "category_id": "a01aZ00000dCekOQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Art Deco",
          "style_id": "a1IaZ000001TYybUAG"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Mid-Century Modern",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Luxury Vinyl Flooring",
      "category_id": "a01aZ00000dCekRQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        }
      ]
    },
    {
      "category_name": "Mail Box",
      "category_id": "a01aZ00000dCejqQAC",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Medicine Cabinet",
      "category_id": "a01aZ00000dC5DqQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Microwave",
      "category_id": "a01Hu000010Q5ElIAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        }
      ]
    },
    {
      "category_name": "Mini Split Air Conditioner",
      "category_id": "a01aZ00000dCekBQAS",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "1000-1500 sq ft",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "500-1000 sq ft",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Heat Pump",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Inverter Technology",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Multi-Zone (2 Zones)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Multi-Zone (3 Zones)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Multi-Zone (4+ Zones)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Single Zone",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "\u2264500 sq ft",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "\u22651500 sq ft",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Mirror",
      "category_id": "a01aZ00000dCekJQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Art Deco",
          "style_id": "a1IaZ000001TYybUAG"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Outdoor Ceiling Fan",
      "category_id": "a01aZ00000dCejrQAC",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Coastal",
          "style_id": "a1IaZ000001VAAbUAO"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Tropical",
          "style_id": "a1IaZ000001TekfUAC"
        }
      ]
    },
    {
      "category_name": "Outdoor Lighting",
      "category_id": "a01aZ00000dCejvQAC",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Coastal",
          "style_id": "a1IaZ000001VAAbUAO"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Outdoor and Patio Furniture",
      "category_id": "a01aZ00000dCekPQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Coastal",
          "style_id": "a1IaZ000001VAAbUAO"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Tropical",
          "style_id": "a1IaZ000001TekfUAC"
        }
      ]
    },
    {
      "category_name": "Oven",
      "category_id": "a01Hu000010Q5EmIAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Patio Heater",
      "category_id": "a01aZ00000dCekCQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Pot Filler Faucet",
      "category_id": "a01aZ00000dC5EHQA0",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Range",
      "category_id": "a01Hu000010Q5EnIAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Commercial-Style",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Range Hood",
      "category_id": "a01Hu000010Q5EoIAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Recessed Lighting",
      "category_id": "a01aZ00000dC5EZQA0",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "Adjustable Trim",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Airtight",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Baffle Trim",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Dimmable",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "IC Rated",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "New Construction Housing",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Reflector Trim",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Remodel Housing",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Shower Trim",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Refrigerator",
      "category_id": "a01Hu000010Q5EpIAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Rough-In Valve",
      "category_id": "a01aZ00000dC5DrQAK",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "2-Way",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "3-Way",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "4-Way",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Diverter Valve",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Pressure Balance",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Thermostatic",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Transfer Valve",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Trim Included",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Valve Only",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Rug",
      "category_id": "a01aZ00000dCekNQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Bohemian",
          "style_id": "a1IaZ000001V9EXUA0"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Geometric",
          "style_id": "a1IaZ000001VCQvUAO"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Moroccan",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Striped",
          "style_id": "a1IaZ000001VGuLUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Shower",
      "category_id": "a01aZ00000dC5DuQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Minimalist",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Spa-Like",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Shower Accessory",
      "category_id": "a01aZ00000dC5DsQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Shower Faucet",
      "category_id": "a01aZ00000dC5DtQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Minimalist",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Steam Shower",
      "category_id": "a01aZ00000dC5DvQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Luxury",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Spa-Like",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Stove and Fireplace",
      "category_id": "a01aZ00000dCekFQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Tankless Water Heater",
      "category_id": "a01aZ00000dC5EIQA0",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "Electric",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Indoor",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Large Home (7-9 GPM)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Medium Home (5-7 GPM)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Natural Gas",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Outdoor",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Point of Use (\u22643 GPM)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Propane",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Small Home (3-5 GPM)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Whole House (\u22659 GPM)",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Thermostat",
      "category_id": "a01aZ00000dCekGQAS",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "Battery Powered",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "C-Wire Required",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Heat Pump Compatible",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Multi-Stage Heat/Cool",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Non-Programmable",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Programmable 5-2 Day",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Programmable 7-Day",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Smart WiFi",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Touchscreen",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Voice Control",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Tile",
      "category_id": "a01aZ00000dCekQQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Geometric",
          "style_id": "a1IaZ000001VCQvUAO"
        },
        {
          "style_name": "Mediterranean",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Moroccan",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Toilet",
      "category_id": "a01aZ00000dC5DyQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Minimalist",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Sleek",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        }
      ]
    },
    {
      "category_name": "Toilet Seat",
      "category_id": "a01aZ00000dC5DxQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Minimalist",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Track and Rail Lighting",
      "category_id": "a01aZ00000dC5EbQAK",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "Adjustable Heads",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Fixed Heads",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Flexible Track",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "GU10 Bulb",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "H-Type Track",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "J-Type Track",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "L-Type Track",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "LED Compatible",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "MR16 Bulb",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Tub Faucet",
      "category_id": "a01aZ00000dC5DzQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Tub and Shower Accessory",
      "category_id": "a01aZ00000dDnKlQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Under Cabinet Light",
      "category_id": "a01aZ00000dC5EcQAK",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "Battery Operated",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Color Changing",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Dimmable",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Hardwired",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "LED Bar",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "LED Puck",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "LED Strip",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Linkable",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Plug-In",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Urinal",
      "category_id": "a01aZ00000dC5E0QAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        }
      ]
    },
    {
      "category_name": "Vanity Lighting",
      "category_id": "a01aZ00000dC5EdQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Wall Decor",
      "category_id": "a01aZ00000dCekKQAS",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Bohemian",
          "style_id": "a1IaZ000001V9EXUA0"
        },
        {
          "style_name": "Coastal",
          "style_id": "a1IaZ000001VAAbUAO"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        }
      ]
    },
    {
      "category_name": "Wall Sconce",
      "category_id": "a01aZ00000dC5EeQAK",
      "style_type": "aesthetic",
      "styles": [
        {
          "style_name": "Art Deco",
          "style_id": "a1IaZ000001TYybUAG"
        },
        {
          "style_name": "Contemporary",
          "style_id": "a1IaZ000001TVZJUA4"
        },
        {
          "style_name": "Farmhouse",
          "style_id": "a1IaZ000001S93RUAS"
        },
        {
          "style_name": "Industrial",
          "style_id": "a1IaZ000001Sjb7UAC"
        },
        {
          "style_name": "Mid-Century Modern",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Modern",
          "style_id": "a1IaZ000001TWAPUA4"
        },
        {
          "style_name": "Rustic",
          "style_id": "a1IaZ000001TVcXUAW"
        },
        {
          "style_name": "Traditional",
          "style_id": "a1IaZ000001TLjdUAG"
        },
        {
          "style_name": "Transitional",
          "style_id": "a1IaZ000001TVXhUAO"
        },
        {
          "style_name": "Victorian",
          "style_id": "a1IaZ000001TVuHUAW"
        }
      ]
    },
    {
      "category_name": "Washer",
      "category_id": "a01Hu000010Q5EsIAK",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "Black",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Compact (\u22644.0 cu ft)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Extra Large (5.0+ cu ft)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Graphite/Slate",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Large (4.5-5.0 cu ft)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Medium (4.0-4.5 cu ft)",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Smart/WiFi Enabled",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Stainless Look",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Steam Clean",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "White",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    },
    {
      "category_name": "Water Heater",
      "category_id": "a01aZ00000bI2srQAC",
      "style_type": "functional",
      "styles": [
        {
          "style_name": "30 Gallon",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "40 Gallon",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "50 Gallon",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "65 Gallon",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "80+ Gallon",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Electric",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Energy Star",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Heat Pump",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Natural Gas",
          "style_id": "New - Create Salesforce ID"
        },
        {
          "style_name": "Propane",
          "style_id": "New - Create Salesforce ID"
        }
      ]
    }
  ]
}
```

---

## DATABASE SCHEMA

```sql
-- Style definitions table
CREATE TABLE styles (
  style_id VARCHAR(18) PRIMARY KEY,
  style_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  style_type ENUM('aesthetic', 'performance', 'capacity', 'feature') DEFAULT 'aesthetic'
);

-- Category-Style relationships
CREATE TABLE category_styles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id VARCHAR(18) NOT NULL,
  style_id VARCHAR(18) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(category_id),
  FOREIGN KEY (style_id) REFERENCES styles(style_id),
  UNIQUE KEY (category_id, style_id)
);

-- Indexes for performance
CREATE INDEX idx_category_styles_category ON category_styles(category_id);
CREATE INDEX idx_category_styles_style ON category_styles(style_id);
```

---

## VERIFICATION CHECKLIST

After applying this update:

- [ ] 149 styles created (15 existing IDs preserved, 134 new IDs created)
- [ ] All new styles have Salesforce IDs (not "New - Create Salesforce ID")
- [ ] 79 categories have style mappings
- [ ] 65 decorative categories mapped to aesthetic styles
- [ ] 14 functional categories mapped to performance/feature styles
- [ ] No duplicate style names
- [ ] All category IDs are valid

---

## EXAMPLE QUERIES

### Get styles for a category
```sql
-- Get all styles for Bathroom Faucet
SELECT s.style_name, s.style_id
FROM category_styles cs
JOIN styles s ON cs.style_id = s.style_id
WHERE cs.category_id = 'a01aZ00000dC5DeQAK'
ORDER BY s.style_name;
```

### Get all products with a style
```sql
-- Get all Modern products
SELECT p.product_name, c.category_name
FROM products p
JOIN product_styles ps ON p.product_id = ps.product_id
JOIN styles s ON ps.style_id = s.style_id
JOIN categories c ON p.category_id = c.category_id
WHERE s.style_name = 'Modern';
```

---

## SUMMARY STATISTICS

| Metric | Count |
|--------|-------|
| Total styles | 149 |
| Existing styles (preserved IDs) | 15 |
| New styles (need IDs) | 134 |
| Total category mappings | 79 |
| Decorative categories | 65 |
| Functional categories | 14 |

### Existing Styles from Production

- Art Deco
- Bohemian
- Coastal
- Contemporary
- Farmhouse
- Geometric
- Industrial
- Modern
- Rustic
- Striped
- Traditional
- Transitional
- Tropical
- Victorian
- Vintage

### Sample New Styles

**Aesthetic:**
- Colonial, Commercial-Style, Eclectic, European, Luxury
- Mediterranean, Mid-Century Modern, Minimalist, Moroccan
- Scandinavian, Shaker, Sleek, Spa-Like

**Functional:**
- Capacity: Small Room, Medium Room, Large Room, Whole House
- Performance: Quiet Operation, High Airflow, Smart WiFi
- Features: Programmable, Energy Star, LED Light Included
- Configuration: Single Zone, Multi-Zone, Pressure Balance

---

*Generated: February 11, 2026 - Complete unified style system*
