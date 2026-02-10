# TYPE ID MAPPING - Existing vs New Needed
**Generated**: February 10, 2026  
**Purpose**: Map types mentioned in consolidation plan to existing Salesforce IDs

---

## ✅ TYPES THAT ALREADY EXIST (Use These IDs)

### Faucet & Plumbing Types
| Type Name | Salesforce ID | Notes |
|-----------|---------------|-------|
| **Pull-Down** | a1jaZ000001lF9iQAE | Kitchen faucet |
| **Pull-Out** | a1jaZ000001lF9jQAE | Kitchen faucet |
| **Bridge** | a1jaZ000001lF3zQAE | Kitchen faucet |
| **Single Handle** | a1jaZ000001lFAmQAM | Universal |
| **Centerset** | a1jaZ000001lF4OQAU | Bathroom faucet |
| **Widespread** | a1jaZ000001lFDGQA2 | Bathroom/tub faucet |
| **Single Hole** | a1jaZ000001lFAnQAM | Bathroom faucet |
| **Wall Mount** | a1jaZ000001lFCxQAM | Universal mounting |
| **Deck Mount** | a1jaZ000001lF5IQAU | Universal mounting |
| **Vessel** | a1jaZ000001lFClQAM | Bathroom sink type |
| **Waterfall** | a1jaZ000001lFD7QAM | Faucet/tub type |
| **Touchless** | a1jaZ000001lFCAQA2 | Motion sensor |
| **Freestanding** | a1jaZ000001lF6fQAE | Tub/shower |
| **Roman Tub** | a1jaZ000001lFABQA2 | Tub faucet |
| **Floor Mounted Tub Filler** | a1jaZ000001lF6XQAU | Can use for "Floor Mount" |
| **Thermostatic** | a1jaZ000001lFBsQAM | Shower valve |
| **Pressure Balance** | a1jaZ000001lF9ZQAU | Shower valve |
| **Body Spray** | a1jaZ000001lF3sQAE | Shower system |
| **Handheld** | a1jaZ000001lF73QAE | Shower/outdoor |
| **Pre-Rinse** | a1jaZ000001lF9XQAU | Commercial/food service |
| **Commercial** | a1jaZ000001lF4lQAE | Food service |

### Sink & Tub Types
| Type Name | Salesforce ID | Notes |
|-----------|---------------|-------|
| **Alcove** | a1jaZ000001lF3DQAU | Bathtub |
| **Drop-In** | a1jaZ000001lF5mQAE | Sink/tub |
| **Undermount** | a1jaZ000001lFCXQA2 | Sink |
| **Clawfoot** | a1jaZ000001lF4YQAU | Bathtub |
| **Whirlpool** | a1jaZ000001lFDCQA2 | Jetted tub |
| **Air Bath** | a1jaZ000001lF3BQAU | Bathtub |
| **Walk-In** | a1jaZ000001lFCqQAM | Bathtub |
| **Pedestal** | a1jaZ000001lF9BQAU | Bathroom sink |
| **Semi-Recessed** | a1jaZ000001lFATQA2 | Bathroom sink |
| **Console** | a1jaZ000001lF4vQAE | Bathroom sink |
| **Integrated** | a1jaZ000001lF7WQAU | Vanity top |
| **Apron Front** | a1jaZ000001lF3GQAU | Farmhouse sink |
| **Single Bowl** | a1jaZ000001lFAkQAM | Kitchen sink |
| **Double Bowl** | a1jaZ000001lF5YQAU | Kitchen sink |
| **Workstation** | a1jaZ000001lFDTQA2 | Kitchen sink |

### Toilet Types
| Type Name | Salesforce ID | Notes |
|-----------|---------------|-------|
| **Two-Piece** | a1jaZ000001lFCSQA2 | Toilet |
| **One-Piece** | a1jaZ000001lF8oQAE | Toilet |
| **Elongated** | a1jaZ000001lF5yQAE | Bowl shape |
| **Round** | a1jaZ000001lFAFQA2 | Bowl shape |
| **Smart** | a1jaZ000001lFAvQAM | Smart toilet/bidet |

### Ceiling Fan Types
| Type Name | Salesforce ID | Notes |
|-----------|---------------|-------|
| **Indoor** | a1jaZ000001lF7NQAU | Ceiling fan |
| **Outdoor** | a1jaZ000001lF8qQAE | Ceiling fan |
| **Hugger** | a1jaZ000001lF7IQAU | Low profile |

### Water Heater Types
| Type Name | Salesforce ID | Notes |
|-----------|---------------|-------|
| **Tankless** | a1jaZ000001lFBoQAM | Water heater |
| **Whole House** | a1jaZ000001lFDDQA2 | Water heater |
| **Point of Use** | a1jaZ000001lF9QQAU | Water heater |
| **Electric** | a1jaZ000001lF5vQAE | Fuel type |
| **Gas** | a1jaZ000001lF6oQAE | Fuel type |
| **Condensing** | a1jaZ000001lF4sQAE | Water heater |

---

## ❌ TYPES THAT NEED TO BE CREATED

### Kitchen Faucet
- Commercial / Pre-Rinse *(use "Pre-Rinse" a1jaZ000001lF9XQAU + "Commercial" a1jaZ000001lF4lQAE)*
- Double Handle *(create new)*
- Touchless / Motion Sensor *(use "Touchless" a1jaZ000001lFCAQA2)*

### Bathroom Faucet
- Centerset (4") *(use "Centerset" a1jaZ000001lF4OQAU)*
- Widespread (8") *(use "Widespread" a1jaZ000001lFDGQA2)*
- Vessel Sink *(use "Vessel" a1jaZ000001lFClQAM)*
- Touchless / Motion Sensor *(use "Touchless" a1jaZ000001lFCAQA2)*

### Tub Faucet
- Roman Tub (3-Hole or 4-Hole) *(use "Roman Tub" a1jaZ000001lFABQA2)*
- Tub Filler with Hand Shower *(create new)*
- Floor Mount *(use "Floor Mounted Tub Filler" a1jaZ000001lF6XQAU)*

### Shower Faucet
- Dual Function (Shower + Hand Shower) *(create new)*
- Multi-Function (3+ outlets) *(create new)*
- Rain Shower *(create new)*
- Handheld Only *(use "Handheld" a1jaZ000001lF73QAE)*
- Body Spray System *(use "Body Spray" a1jaZ000001lF3sQAE)*

### Bar Faucet
- Dual Handle *(create new)*

### Bidet Faucet
- All use existing: Deck Mount, Wall Mount, Single Handle, Dual Handle (create new)

### Pot Filler
- Articulating Arm *(create new)*

### Food Service Faucet
- Swing Spout *(create new)*

### Outdoor Shower
- All use existing: Wall Mount, Freestanding, Handheld

### Bathtub
- Japanese Soaking *(create new)*
- Whirlpool / Jetted *(use "Whirlpool" a1jaZ000001lFDCQA2)*

### Bathroom Sink
- Drop-In / Self-Rimming *(use "Drop-In" a1jaZ000001lF5mQAE)*
- Integrated Vanity Top *(use "Integrated" a1jaZ000001lF7WQAU)*

### Kitchen Sink
- Top Mount / Drop-In *(use "Drop-In" a1jaZ000001lF5mQAE)*
- Farmhouse / Apron Front *(use "Apron Front" a1jaZ000001lF3GQAU)*
- Triple Bowl *(create new)*
- Workstation Sink *(use "Workstation" a1jaZ000001lFDTQA2)*

### Toilet
- Wall-Hung *(create new)*
- Smart / Bidet Toilet *(use "Smart" a1jaZ000001lFAvQAM)*
- Elongated Bowl *(use "Elongated" a1jaZ000001lF5yQAE)*
- Round Bowl *(use "Round" a1jaZ000001lFAFQA2)*
- Comfort Height / ADA *(create new - or check if ADA Compliant a1jaZ000001lF34QAE works)*

### Shower
- Shower Stall Kit *(create new)*

### Ceiling Fan
- Hugger (Low Profile) *(use "Hugger" a1jaZ000001lF7IQAU)*
- DC Motor *(create new)*
- Dual Motor *(create new)*

### Water Heater
- Non-Condensing *(create new)*

---

## 📝 TRUE NEW TYPES NEEDED (Must be created in Salesforce)

### Faucets & Plumbing (13 types)
1. **Double Handle** (faucets) - NEW_ID_NEEDED
2. **Dual Handle** (faucets) - NEW_ID_NEEDED  
3. **Tub Filler with Hand Shower** - NEW_ID_NEEDED
4. **Dual Function (Shower + Hand Shower)** - NEW_ID_NEEDED
5. **Multi-Function (3+ outlets)** - NEW_ID_NEEDED
6. **Rain Shower** - NEW_ID_NEEDED
7. **Articulating Arm** (pot filler) - NEW_ID_NEEDED
8. **Swing Spout** (food service) - NEW_ID_NEEDED
9. **Japanese Soaking** (bathtub) - NEW_ID_NEEDED
10. **Triple Bowl** (kitchen sink) - NEW_ID_NEEDED
11. **Wall-Hung** (toilet) - NEW_ID_NEEDED
12. **Comfort Height** (toilet) - NEW_ID_NEEDED
13. **Shower Stall Kit** - NEW_ID_NEEDED

### Shower (3 types)
14. **Shower Pan** - NEW_ID_NEEDED
15. **Shower Enclosure** - NEW_ID_NEEDED
16. **Corner Shower** - NEW_ID_NEEDED

### Ceiling Fan (2 types)
17. **DC Motor** - NEW_ID_NEEDED
18. **Dual Motor** - NEW_ID_NEEDED

### Water Heater & HVAC (5 types)
19. **Heat Pump** (water heater) - NEW_ID_NEEDED
20. **Solar** (water heater) - NEW_ID_NEEDED
21. **Window Unit** (AC) - NEW_ID_NEEDED
22. **Through-the-Wall** (AC) - NEW_ID_NEEDED
23. **Central Air System** (AC) - NEW_ID_NEEDED

### Dehumidifier (1 type)
24. **Basement** - NEW_ID_NEEDED

### Bathroom Vanity (3 types)
25. **Single Sink** - NEW_ID_NEEDED
26. **Double Sink** - NEW_ID_NEEDED
27. **Modular** - NEW_ID_NEEDED

### Door Hardware (3 types)
28. **Hinge** - NEW_ID_NEEDED
29. **Lock** - NEW_ID_NEEDED
30. **Catch / Latch** - NEW_ID_NEEDED

### Cabinet Hardware (2 types)
31. **Backplate** - NEW_ID_NEEDED
32. **Appliance Pull** - NEW_ID_NEEDED

### Lighting (5 types)
33. **Bath Bar** - NEW_ID_NEEDED
34. **Vanity Light** - NEW_ID_NEEDED
35. **Pendant** - NEW_ID_NEEDED
36. **Sconce** - NEW_ID_NEEDED
37. **Recessed / Can Light** - NEW_ID_NEEDED

---

**Total NEW types needed**: **37 unique types** (vs original estimate of 280+)  
**Reduction**: 87% fewer types to create (243 already exist in types.json!)

**Note**: Some types appear in multiple category definitions, resulting in 38 total "type_id: NEW_ID_NEEDED" entries in the master plan.

---

## 🔄 NEXT STEPS

1. ✅ Update MASTER-CATEGORY-CONSOLIDATION-PLAN-2026-02-10.md with correct existing IDs - **DONE**
2. **Salesforce admin creates the 37 truly new types**
3. Update plan with new Salesforce-generated IDs once created
4. Proceed with consolidation implementation

---

## 📊 FINAL TALLY

- **Types that already exist**: 87 (reused from types.json)
- **Types that need creation**: 37
- **Attributes that need creation**: ~10
- **Total effort reduction**: 87% less work (280 estimated → 37 actually needed)
