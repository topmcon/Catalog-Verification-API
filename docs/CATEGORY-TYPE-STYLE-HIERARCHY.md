# Category → Type → Style Hierarchy

> **Source of truth**: `src/config/salesforce-picklists/category-type-mapping.json` (types),
> `src/config/salesforce-picklists/category-style-mapping.json` (styles),
> `src/services/dual-ai-verification.service.ts` (selection logic).
> Last updated from codebase: 2026-06-15.

---

## 1. Overview

Every verified product carries three classification fields in Salesforce:

```
Department  →  Family  →  Category  →  Type  →  Style
```

| Field | What it is | Required? |
|-------|-----------|-----------|
| **Category** | The product's functional category (e.g. Range, Bathroom Faucet) | Always |
| **Type** | A specific configuration or sub-class within that category | Always — "Not Found" if no match |
| **Style** | Design aesthetic or mounting configuration | Only for categories with `styles_apply: true`; "Not Applicable" otherwise |

Type and Style are **category-constrained**: every category has its own explicit list of valid values.
A Type valid for one category is invalid for another (e.g. "Front Control" is a valid Range type but
would be wrong for a Refrigerator).

---

## 2. All Categories with Their Valid Types

Categories are listed by department. Each shows:
- **Logic**: the dimension the type captures (what question it answers)
- **Types**: valid values, with `★` marking `primary_filter: true` types (functionally specific) and plain text for generic/catch-all types (e.g. "Accessory")
- **Style**: ✅ if this category has a style field, — if not

### Appliances — Kitchen

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **Coffee Maker** | Brewing method | ★ Countertop, ★ Drip, ★ Espresso, ★ Single Serve, ★ Cold Brew · Accessory | — |
| **Cooktop** | Heat source | ★ Gas, ★ Electric, ★ Induction, ★ Radiant, ★ Downdraft, ★ Outdoor · Accessory | — |
| **Dishwasher** | Control location / installation | ★ Top Control, ★ Front Control, ★ Drawer, ★ Countertop, ★ Portable, ★ Panel-Ready, ★ Outdoor · Accessory | ✅ |
| **Drawer** | Function | ★ Warming, ★ Storage, ★ Refrigerated, ★ Outdoor · Accessory | — |
| **Freezer** | Form factor | ★ Upright, ★ Chest, ★ Column, ★ Undercounter, ★ Outdoor · Accessory | — |
| **Icemaker** | Installation type | ★ Undercounter, ★ Portable, ★ Outdoor · Accessory | — |
| **Microwave** | Installation location | ★ Over-the-Range, ★ Countertop, ★ Drawer, ★ Under Cabinet, ★ Built-In · Accessory | — |
| **Oven** | Configuration / cooking method | ★ Single, ★ Double Wall, ★ Microwave Combo · Accessory | — |
| **Pizza Oven** | Fuel type | ★ Gas, ★ Electric, ★ Wood-Fired, ★ Multi-Fuel, ★ Countertop, ★ Outdoor · Accessory | — |
| **Range** | Configuration and control style | ★ Pro-Style, ★ Slide-In, ★ Front Control, ★ Top Control, ★ Rear Control, ★ Outdoor · Accessory | ✅ |
| **Range Hood** | Mounting / installation type | ★ Wall-Mounted, ★ Under Cabinet, ★ Island Mount, ★ Insert, ★ Downdraft, ★ Pro-Style, ★ Outdoor · Accessory | — |
| **Refrigerator** | Door configuration / form factor | ★ French Door, ★ Side-by-Side, ★ Top-Freezer, ★ Bottom-Freezer, ★ Column, ★ Undercounter, ★ 4-Door Flex, ★ Freestanding, ★ Wine Cooler, ★ Beverage Center, ★ Kegerator, ★ Outdoor · Accessory | ✅ |

### Appliances — Laundry

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **All in One Washer / Dryer** | Configuration | ★ Unitized, ★ Front Load, ★ Top Load, ★ Ventless · Accessory | — |
| **Dryer** | Loading configuration | ★ Front Load, ★ Top Load, ★ Unitized · Accessory | — |
| **Laundry Pedestal** | Function | ★ Functional, ★ Riser, ★ Storage · Accessory | — |
| **Washer** | Loading configuration | ★ Front Load, ★ Top Load, ★ Unitized · Accessory | — |

> **Note on Dryer/Washer**: Type captures the physical structure only (Front Load, Top Load, Unitized). Fuel type (Gas/Electric/Heat Pump), vent type (Vented/Ventless), and size characteristics (Compact via Width) are all captured as **attributes**, not type.

### Plumbing & Bath — Faucets

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **Kitchen Faucet** | Spout function and installation config | ★ Pull-Down, ★ Pull-Out, ★ Single Hole, ★ Wall Mount, ★ Bridge, ★ Commercial, ★ Two Handle, ★ Pot Filler | ✅ |
| **Bathroom Faucet** | Mount configuration and hole spacing | ★ Centerset, ★ Widespread, ★ Single Hole, ★ Vessel, ★ Wall Mounted · Accessory | ✅ |
| **Bar Faucet** | Handle config and spout function | ★ Single Handle, ★ Pull-Down, ★ Pull-Out, ★ Touchless · Accessory | — |
| **Tub Filler** | Mount location and configuration | ★ Roman Tub, ★ Freestanding, ★ Wall Mounted, ★ Deck Mount, ★ Floor Mounted · Accessory | — |
| **Showerheads & Accessories** | Valve type and shower configuration | ★ Pressure Balance, ★ Thermostatic, ★ Thermostatic Valve Trim, ★ Volume Control, ★ Diverter, ★ Trim Only, ★ Single Function, ★ Rain Head, ★ Handheld, ★ Body Spray, ★ System, ★ Exposed, ★ Waterfall | — |
| **Pot Filler Faucet** | Mount location | ★ Wall Mount, ★ Deck Mount · Accessory | — |
| **Bidet Faucet** | Mount configuration | ★ Deck Mount, ★ Wall Mount, ★ Single Handle · Accessory | — |
| **Outdoor Shower Faucet** | Installation configuration | ★ Wall Mount, ★ Freestanding, ★ Handheld · Accessory | — |
| **Food Service Faucet** | Commercial application type | ★ Pre-Rinse, ★ Commercial, ★ Wall Mount · Accessory | — |

### Plumbing & Bath — Sinks

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **Kitchen Sink** | Mount style and bowl config | ★ Undermount, ★ Drop-In, ★ Apron Front, ★ Single Bowl, ★ Double Bowl, ★ Workstation, ★ Triple Bowl · Accessory | ✅ |
| **Bathroom Sink** | Mount style and installation type | ★ Undermount, ★ Drop-In, ★ Vessel, ★ Pedestal, ★ Console, ★ Wall Mount, ★ Semi-Recessed · Accessory | — |
| **Bar & Prep Sink** | Mount style | ★ Bar/Prep, ★ Undermount, ★ Drop-In · Accessory | — |
| **Kitchen Sink Combo** | Mount style and configuration | ★ Undermount, ★ Drop-In, ★ Apron Front, ★ Workstation · Accessory | — |

### Plumbing & Bath — Bath

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **Bathtub** | Installation style and features | ★ Alcove, ★ Freestanding, ★ Drop-In, ★ Undermount, ★ Corner, ★ Walk-In, ★ Clawfoot · Accessory | ✅ |
| **Bathroom Vanity** | Mount style and configuration | ★ Freestanding, ★ Wall Mounted, ★ Floating, ★ Single Sink, ★ Double Sink, ★ Corner · Accessory | ✅ |
| **Bathroom Hardware and Accessories** | Accessory type | ★ Towel Bar, ★ Towel Ring, ★ Robe Hook, ★ Toilet Paper Holder, ★ Shelf, ★ Grab Bar, ★ Set · Accessory | — |
| **Bathroom Cabinet Hardware** | Hardware shape | ★ Knob, ★ Pull, ★ Handle · Accessory | — |
| **Bathtub Waste & Overflow** | Drain operation type | ★ Toe-Touch, ★ Push-Pull, ★ Lift & Turn, ★ Trip Lever, ★ Cable Operated · Accessory | — |
| **Medicine Cabinet** | Mount style and features | ★ Recessed, ★ Surface Mount, ★ Framed, ★ Frameless, ★ Lighted · Accessory | — |
| **Storage Drawer/Door** | Storage component | ★ Storage Drawer, ★ Cabinet, ★ Access Door · Accessory | — |
| **Bathroom Mirror** | Style and features | ★ Wall Mirror, ★ Medicine Cabinet, ★ Lighted, ★ Magnifying · Accessory | — |

### Plumbing & Bath — Showers

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **Shower** | Enclosure style and configuration | ★ Alcove, ★ Corner, ★ Neo-Angle, ★ Walk-In, ★ Barrier-Free, ★ Freestanding, ★ Frameless, ★ Framed | ✅ |
| **Shower Accessory** | Component type (hardware, arms, drains) | ★ Shower Arm, ★ Ceiling Mount, ★ Slide Bar, ★ Escutcheon, ★ Hose, ★ Valve Extension, ★ Transfer, ★ Elbow, ★ Shelf, ★ Grab Bar, ★ Linear, ★ Floor Drain, ★ Niche, ★ Seat, ★ Riser | — |
| **Steam Shower** | System configuration | ★ Complete System, ★ Steam Generator, ★ Steam Head, ★ Control Panel · Accessory | — |

### Plumbing & Bath — Toilets & Bidets

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **Toilet** | Construction type | ★ One-Piece, ★ Two-Piece, ★ Wall-Mounted, ★ Smart · Accessory | ✅ |
| **Toilet Seat** | Seat feature type | ★ Soft Close, ★ Standard, ★ Heated, ★ Bidet, ★ Quick Release · Accessory | — |
| **Urinal** | Mount and flush type | ★ Wall Mount, ★ Waterless, ★ Standard, ★ Urinal · Accessory | — |
| **Bidet** | Installation type | ★ Bidet, ★ Integrated, ★ Wall Mount · Accessory | — |
| **Bidet Seat** | Power source | ★ Electric, ★ Non-Electric, ★ Bidet Seat · Accessory | — |

### Plumbing & Bath — Valves & Other

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **Rough-In Valve** | Valve function and configuration | ★ Thermostatic, ★ Pressure Balance, ★ Diverter, ★ Volume Control, ★ Transfer · Accessory | — |
| **Garbage Disposal** | Feed mechanism | ★ Continuous Feed, ★ Batch Feed · Accessory | — |
| **Hot & Cold Water Dispenser** | Temperature output | ★ Instant Hot Only, ★ Hot and Cold, ★ Filtered · Accessory | — |
| **Kitchen Accessory** | Product function | ★ Sink Grid, ★ Colander, ★ Cutting Board, ★ Accessory | — |
| **Water Filtration** | Installation type | ★ Under Sink, ★ Whole House, ★ Countertop, ★ Faucet Mount, ★ Reverse Osmosis, ★ Replacement Filter · Accessory | — |
| **Industrial Strainer** | Strainer configuration | ★ Simplex Strainer, ★ Duplex Strainer, ★ Basket Strainer, ★ Y Strainer · Accessory | — |
| **Pipe Fitting** | Fitting shape/function | ★ Elbow, ★ Tee, ★ Coupling, ★ Union, ★ Nipple, ★ Adapter, ★ Connector · Accessory | — |
| **Flush and Semi-Flush** | Mount type or shape | ★ Flush Mount, ★ Semi-Flush, ★ Drum, ★ Globe · Accessory | — |

### Lighting & Electrical

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **Ceiling Fan** | Installation location / motor | ★ Indoor, ★ Outdoor, ★ Hugger · Accessory | — |
| **Ceiling Light** | Mounting style and profile | ★ Flush Mount, ★ Semi-Flush, ★ Passage, ★ Privacy, ★ Keyed Entry, ★ Dummy, ★ Single Cylinder, ★ Double Cylinder · Accessory | ✅ |
| **Chandelier** | Style and form | ★ Chandelier, ★ Candle, ★ Crystal, ★ Drum, ★ Sputnik, ★ Tiered · Accessory | — |
| **Pendant** | Style and configuration | ★ Pendant, ★ Multi-Light, ★ Mini, ★ Drum, ★ Globe, ★ Lantern · Accessory | — |
| **Wall Sconce** | Light direction and style | ★ Wall Sconce, ★ Swing Arm, ★ Up Light, ★ Down Light, ★ Bath Bar, ★ Vanity, ★ 1-Light, ★ 3-Light, ★ 4-Light · Accessory | ✅ |
| **Vanity Lighting** | Fixture type | ★ Vanity, ★ Bath Bar, ★ Sconce, ★ Globe · Accessory | — |
| **Under Cabinet Light** | Form factor / light source | ★ LED Strip, ★ Puck Light, ★ Light Bar, ★ Tape Light · Accessory | — |
| **Lamp** | Form factor and placement | ★ Table Lamp, ★ Floor Lamp, ★ Desk Lamp, ★ Buffet Lamp, ★ Arc Lamp, ★ Torchiere · Accessory | — |
| **Recessed Lighting** | Installation type / component | ★ New Construction, ★ Remodel, ★ Canless, ★ LED, ★ Trim, ★ Housing · Accessory | — |
| **Track and Rail Lighting** | Component type | ★ Track, ★ Track Head, ★ Monorail, ★ Connector, ★ LED · Accessory | — |
| **Light Bulbs** | Bulb technology | ★ LED, ★ Incandescent, ★ CFL, ★ Halogen, ★ Smart Bulb · Accessory | — |
| **Light Switches & Dimmers** | Switch function | ★ Standard Switch, ★ Dimmer, ★ Smart Switch, ★ Motion Sensor, ★ Timer, ★ Fan Control · Accessory | — |
| **Outdoor Lighting** | Fixture type / application | ★ Wall Lantern, ★ Post Light, ★ Path Light, ★ Flood Light, ★ Landscape, ★ Security, ★ Deck, ★ Ceiling Mounted · Accessory | — |
| **Lighting Accessory** | Product function | ★ Shade, ★ Downrod, ★ Light Kit, ★ Blade, ★ Remote · Accessory | — |

### Heating & Cooling

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **Water Heater** | Heating method / fuel type | ★ Tankless, ★ Tank, ★ Electric, ★ Gas · Accessory | — |
| **Tankless Water Heater** | Fuel source and application | ★ Tankless, ★ Gas, ★ Electric, ★ Condensing, ★ Point of Use, ★ Whole House · Accessory | — |
| **Air Conditioner** | Installation and style | ★ Window, ★ Portable, ★ Central, ★ Through-Wall · Accessory | — |
| **Mini Split Air Conditioner** | Zone configuration | ★ Single Zone, ★ Multi Zone, ★ Ductless, ★ Heat Pump · Accessory | — |
| **Bath Fan** | Features and functions | ★ Standard, ★ Humidity Sensing, ★ With Light, ★ With Heater, ★ With Light and Heater · Accessory | — |
| **Room Heater** | Heating technology | ★ Ceramic, ★ Infrared, ★ Oil Filled, ★ Fan Forced, ★ Radiant, ★ Convection · Accessory | — |
| **Thermostat** | Control features | ★ Programmable, ★ Smart, ★ Standard, ★ WiFi · Accessory | — |
| **Dehumidifier** | Size and application | ★ Portable, ★ Whole House, ★ Compact · Accessory | — |
| **Stove and Fireplace** | Fuel source | ★ Wood Burning, ★ Gas, ★ Pellet, ★ Multi-Fuel · Accessory | — |
| **Patio Heater** | Fuel source and style | ★ Propane, ★ Electric, ★ Infrared, ★ Hanging · Accessory | — |

### Hardware — Door Hardware

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **Deadbolt** | Lock mechanism | ★ Single Cylinder, ★ Double Cylinder, ★ Electronic, ★ Smart Lock, ★ Keyless · Accessory | — |
| **Door Knob** | Lock function / use case | ★ Entry, ★ Privacy, ★ Passage, ★ Dummy · Accessory | — |
| **Door Lever** | Lock function / use case | ★ Entry, ★ Privacy, ★ Passage, ★ Dummy · Accessory | — |
| **Door Entry Set** | Handle style | ★ Handleset, ★ Knob Entry, ★ Lever Entry · Accessory | — |
| **Handleset** | Configuration style | ★ Handleset + Deadbolt, ★ Handleset · Accessory | — |
| **Mortise Lock** | Lock function / use case | ★ Mortise, ★ Entry, ★ Passage, ★ Privacy · Accessory | — |

### Hardware — Cabinet Hardware

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **Cabinet Knob** | Style and material | ★ Knob, ★ Designer Knob, ★ Crystal, ★ Jeweled · Accessory | — |
| **Cabinet Pull** | Pull style and shape | ★ Bar Pull, ★ Cup Pull, ★ Bin Pull, ★ Ring Pull, ★ Finger Pull, ★ Appliance Pull, ★ Arch Pull · Accessory | — |
| **Cabinet Hinge** | Mount style and features | ★ Overlay, ★ Inset, ★ Concealed, ★ Soft Close, ★ Ball Bearing · Accessory | — |
| **Cabinet Lock** | Lock mechanism | ★ Keyed Lock, ★ Cam Lock, ★ Drawer Lock, ★ Push Lock, ★ Glass Door Lock · Accessory | — |
| **Drawer Slide and Accessory** | Mount style and features | ★ Ball Bearing, ★ Side Mount, ★ Center Mount, ★ Soft Close, ★ Undermount · Accessory | — |

### Flooring

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **Hardwood Flooring** | Construction | ★ Solid, ★ Engineered, ★ Prefinished, ★ Unfinished, ★ Nail Down, ★ Glue Down, ★ Click Lock, ★ Floating, ★ Hand-Scraped, ★ Wire-Brushed · Accessory | ✅ |
| **Luxury Vinyl Flooring** | Format / installation | ★ Plank, ★ Tile, ★ Click Lock, ★ Glue Down, ★ Loose Lay, ★ Vinyl Plank, ★ Vinyl Tile, ★ WPC, ★ SPC, ★ Rigid Core · Accessory | ✅ |
| **Tile** | Material | ★ Ceramic, ★ Porcelain, ★ Stone, ★ Glass, ★ Mosaic, ★ Cement · Accessory | — |
| **Laminate Flooring** | Appearance | ★ Wood Look, ★ Tile Look, ★ Stone Look, ★ Waterproof · Accessory | — |
| **Carpet** | Application / installation | ★ Peel and Stick, ★ Modular, ★ Commercial, ★ Residential · Accessory | — |

### Outdoor

| Category | Logic | Types | Style |
|----------|-------|-------|-------|
| **Barbeque** | Fuel source and style | ★ Gas, ★ Electric, ★ Charcoal, ★ Pellet, ★ Kamado, ★ Wood-Fired, ★ Outdoor · Accessory | — |
| **Fire Pit** | Design and fuel source | ★ Fire Table, ★ Wood Burning, ★ Gas, ★ Propane · Accessory | — |
| **Outdoor Fireplace** | Fuel source | ★ Wood Burning, ★ Gas, ★ Ethanol · Accessory | — |
| **Patio Heater** | Fuel source and style | ★ Propane, ★ Electric, ★ Infrared, ★ Hanging · Accessory | — |

---

## 3. How Type is Selected — The Decision Flow

The pipeline determines type in three distinct stages. Here is the exact order of operations:

### Stage 1: AI Extraction (Stage 3 of the dual-AI pipeline)

Both OpenAI and xAI independently extract `product_type` from the product payload. They are given:
- The confirmed department and category
- The valid types list for that specific category
- The `logic` field as a hint (e.g. "Heat source" for Cooktop)
- Specification table data, Web Retailer data, Ferguson data

Result: two independent type values — one from each AI.

---

### Stage 2: Post-Stage-3 Validation (before consensus)

After AI extraction, the following checks run in order:

**Step 1 — Invalid type check**: Each AI's value is checked against the valid types list for the category.

| Scenario | Action |
|----------|--------|
| Both AIs agree (same type) | Use it directly |
| One valid, one invalid | Force both to the valid value |
| Both invalid | Fuzzy match (threshold 0.85) → if match found, both forced to that value → otherwise retry once → if still invalid → `"Not Found"` |
| Both valid but different | → Phase 2.5 (see below) |

**Step 2 — primary_filter preference (Phase 2.5)**: When both types are valid but different, check the `primary_filter` flag:

| Scenario | Action |
|----------|--------|
| One is `primary_filter: true`, other is `false` (e.g. Accessory) | Prefer the `primary_filter: true` type |
| Both are `primary_filter: true` | Apply spec-data tiebreaker (below) |
| Both are `primary_filter: false` | Carry both forward to consensus |

**Step 3 — Spec-data tiebreaker (Phase 2.5)**: Applied when both types are primary_filter and still disagree.
Checks product specification table for hard evidence:

| Spec field evidence | Action |
|---------------------|--------|
| `Range Configuration: Slide-In` | Override both AIs → `"Slide-In"` (Slide-In is the primary consumer differentiator for ranges) |
| `Control Location: Rear` or `Top` | Prefer whichever AI picked a rear/top-control type |
| `Control Location: Front` | Prefer whichever AI picked front control |
| No spec evidence | Carry both forward to Phase 2 consensus |

---

### Stage 3: Phase 2 Consensus Resolution (STEP 6)

If two different valid types still exist after Phase 2.5, consensus applies these rules in order:

**1. TYPE_PRIORITY hierarchy** (applies to specific categories only):

| Category | Priority order (highest → lowest) |
|----------|-----------------------------------|
| Range | Pro-Style → Slide-In → Outdoor → Top Control → Front Control → Rear Control |
| Bathroom Faucet | Wall Mounted → Vessel → Centerset → Widespread → Single Hole |
| Kitchen Faucet | Pull-Down → Pull-Out → Single Hole → Wall Mount → Bridge → Commercial → Two Handle → Pot Filler |
| Tub Filler | Roman Tub → Freestanding → Deck Mount → Wall Mounted → Floor Mounted |
| Bar Faucet | Pull-Down → Single Handle → Two Handle |

When both types are in the priority list, the higher-priority one wins. When only one is in the list, that one wins.

For all other categories not in this table, the general consensus logic applies (research data match, text length, etc.).

**2. Research data match**: If one AI's type matches data from a pre-scraped web source or Ferguson data, prefer that AI.

**3. General text tiebreaker**: Prefer more specific/longer value if difference is >30%.

---

### Post-Consensus: validateConsensusCategory()

After consensus, a cross-check validates the category+type combination against business rules:

**Rule 1 — Appliance-specific parts**: If a product has an appliance manufacturer brand (GE, Whirlpool, Bosch, etc.), an "accessory for / replacement for" text pattern, AND a model number — but the category is decorative hardware (Cabinet Pull, Cabinet Knob, Kitchen Accessory, etc.) — the category is overridden to the correct appliance category (Refrigerator, Range, Dishwasher, etc.).

**Rule 2 — Outdoor burner**: A product that is a standalone outdoor gas burner cannot be classified as "Fire Pit Accessory." The category is forced to a cooking-equipment category.

---

### Phase B: Claude Review (non-appliances only)

After all pipeline validation, Claude independently reviews the type classification and may propose a correction. If Claude proposes a different type that is valid for the category, the system can apply it. Appliance products **skip** Claude Phase B review entirely and use the pipeline result directly.

---

## 4. The Style System

Style captures the **design aesthetic** or **mounting configuration** depending on the category.

There are two kinds of styles:

### Aesthetic styles (design/visual)

These 15 styles apply broadly across decorative categories. They describe visual character:

| Style | Character |
|-------|-----------|
| Art Deco | Bold geometric patterns, metallic finishes |
| Bohemian | Eclectic, relaxed, mixed patterns |
| Coastal | Nautical, light blues/whites, relaxed |
| Contemporary | Clean lines, current design trends |
| Farmhouse | Rustic warmth, natural materials, country |
| Geometric | Pattern-driven, angular forms |
| Industrial | Raw materials, exposed metal, utilitarian |
| Modern | Minimal, sleek, function-forward |
| Rustic | Weathered, natural, organic textures |
| Striped | Linear pattern emphasis |
| Traditional | Classic, ornate, symmetrical |
| Transitional | Blend of traditional and contemporary |
| Tropical | Bold, nature-inspired, warm |
| Victorian | Elaborate, ornate, 19th-century inspired |
| Vintage | Retro, nostalgic, aged character |

**Note**: "Contemporary" and "Modern" together account for ~70% of all style outputs in the corpus because they are the default for products where design language is ambiguous. This is a known accuracy issue (ACC-12).

### Functional/configuration styles

Some categories use style for a functional configuration rather than aesthetics:

| Category | Style values used |
|----------|------------------|
| Bathroom Faucet | 1 Hole, 2 Hole, 3 Hole, 4 Hole, Wall Mounted |
| Kitchen Faucet | 1 Hole, 2 Hole, 3 Hole, 4 Hole, Wall Mounted |
| Tub Filler | 1 Hole, 2 Hole, 3 Hole, 4 Hole, Wall Mounted, Floor Mounted |

In these cases the AI is instructed to select the **mounting/hole configuration**, not an aesthetic.

### Which categories use style

Style is only applied when the category has `styles_apply: true` in the type mapping or has a defined category-specific style list. Categories without a style mapping receive `"Not Applicable"`.

**Categories with active style**:
Bathtub · Bathroom Faucet · Bathroom Vanity · Ceiling Light · Dishwasher · Hardwood Flooring · Kitchen Faucet · Kitchen Sink · Luxury Vinyl Flooring · Range · Refrigerator · Shower · Toilet · Tub Filler · Wall Sconce

**Plus all categories with a category-specific style list** (see full list below).

---

## 5. How Style is Selected — The Fallback Chain

Style is resolved in this exact sequence. Each step is tried only if the previous produced nothing.

```
1. AI consensus value (both AIs agreed on the same style)
   ↓ if empty
2. Lighting/shower/universal post-processing validation
   (correct invalid aesthetic styles in functional categories)
   ↓ if empty
3. AI disagreement value (prefer OpenAI's value, then xAI's)
   ↓ if empty
4. Ferguson "Application" field (e.g. "Shower Heads" → "Showerhead")
   ↓ if empty
5. Ferguson "Theme" attribute (design aesthetic: Contemporary, Modern, etc.)
   ↓ if empty
6. Ferguson "Installation Type" attribute (functional style: Wall Mounted, etc.)
   ↓ if empty
7. Web Retailer SubCategory field
   ↓ if empty
8. "Not Applicable" (no style available for this product)
```

### Post-processing validations (Step 2)

Three validators run on the style value to catch common errors before the fallback chain exhausts:

**Lighting validator**: Lighting categories (Ceiling Light, Wall Sconce, Chandelier, Pendant, Lamp, etc.) use functional types as their style (e.g. "Wall Sconce", "Up Light", "Down Light"), not aesthetic terms. If an aesthetic style like "Contemporary" lands in a lighting category, this validator maps it to the correct functional value or clears it for retry.

**Shower validator**: Shower categories (Shower, Showerheads & Accessories) use enclosure or valve types as style (Alcove, Corner, Walk-In, Pressure Balance, etc.). Aesthetic terms are rejected and replaced.

**Universal category validator**: Cross-checks the style against the explicit category-style mapping. If the style isn't in the valid list for that category, the validator either maps it to the closest valid style or clears it.

### Picklist matching

Once a `potentialStyle` string is determined, it goes through the 6-pass picklist matcher:
1. Exact match
2. Normalized match (case/whitespace)
3. Containment match
4. Levenshtein distance
5. Partial match
6. No match → `FailedMatchLog` + pending creation request sent to Salesforce

If the match score is below 0.7, the style is flagged as unmatched and a creation request is sent to SF. The job does not block on this.

---

## 6. Full Category → Style Reference

The table below shows which styles are valid for each category with a defined style mapping.

| Category | Valid styles |
|----------|-------------|
| Bar & Prep Sink | Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional |
| Bar Faucet | Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional |
| Bathroom Cabinet Hardware | Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional, Victorian |
| **Bathroom Faucet** | **1 Hole, 2 Hole, 3 Hole, 4 Hole, Wall Mounted** *(configuration, not aesthetic)* |
| Bathroom Hardware and Accessories | Contemporary, Farmhouse, Industrial, Minimalist, Modern, Traditional, Transitional, Victorian |
| Bathroom Lighting | Contemporary, Industrial, Minimalist, Modern, Traditional, Transitional |
| Bathroom Mirror | Art Deco, Contemporary, Farmhouse, Industrial, Modern, Rustic, Traditional, Transitional, Victorian |
| Bathroom Sink | Art Deco, Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional, Victorian |
| Bathroom Vanity | Contemporary, Farmhouse, Industrial, Mid-Century Modern, Modern, Rustic, Shaker, Traditional, Transitional, Victorian |
| Bathtub | Contemporary, Modern, Spa-Like, Traditional, Transitional, Victorian |
| Bidet | Contemporary, Modern, Traditional |
| Bidet Faucet | Contemporary, Modern, Traditional |
| Bidet Seat | Contemporary, Minimalist, Modern |
| Cabinet Hardware | Art Deco, Contemporary, Farmhouse, Industrial, Modern, Rustic, Shaker, Traditional, Transitional, Victorian, Vintage |
| Cabinet Knob | Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional, Victorian, Vintage |
| Cabinet Pull | Contemporary, Farmhouse, Industrial, Modern, Rustic, Traditional, Transitional, Vintage |
| Ceiling Fan | Coastal, Contemporary, Farmhouse, Industrial, Modern, Rustic, Traditional, Transitional, Tropical |
| Ceiling Light | Art Deco, Coastal, Contemporary, Farmhouse, Industrial, Mid-Century Modern, Modern, Rustic, Traditional, Transitional |
| Chair | Contemporary, Farmhouse, Industrial, Mid-Century Modern, Modern, Rustic, Traditional, Transitional |
| Chandelier | Art Deco, Contemporary, Farmhouse, Industrial, Modern, Rustic, Traditional, Transitional, Victorian |
| Coffee Maker | Contemporary, Minimalist, Modern, Traditional |
| Cooktop | Contemporary, Minimalist, Modern |
| Deadbolt | Contemporary, Modern, Traditional |
| Dishwasher | Contemporary, Modern, Traditional |
| Door Knob | Colonial, Contemporary, Modern, Traditional, Transitional, Victorian, Vintage |
| Door Lever | Contemporary, European, Industrial, Minimalist, Modern, Traditional, Transitional |
| Flush and Semi-Flush | Art Deco, Contemporary, Farmhouse, Industrial, Mid-Century Modern, Modern, Traditional, Transitional |
| Handleset | Contemporary, Modern, Rustic, Traditional, Transitional, Victorian |
| Hardwood Flooring | Contemporary, Modern, Rustic, Traditional |
| **Kitchen Faucet** | **1 Hole, 2 Hole, 3 Hole, 4 Hole, Wall Mounted** *(configuration, not aesthetic)* |
| Kitchen Sink | Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional |
| Laminate Flooring | Contemporary, Rustic, Traditional |
| Lamp | Art Deco, Contemporary, Farmhouse, Industrial, Mid-Century Modern, Modern, Rustic, Traditional, Transitional |
| Luxury Vinyl Flooring | Contemporary, Modern, Rustic |
| Mail Box | Contemporary, Farmhouse, Modern, Rustic, Traditional, Victorian |
| Medicine Cabinet | Contemporary, Modern, Traditional |
| Microwave | Contemporary, Modern |
| Mirror | Art Deco, Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional, Victorian |
| Outdoor Lighting | Coastal, Contemporary, Farmhouse, Industrial, Modern, Rustic, Traditional, Transitional |
| Oven | Contemporary, Modern, Traditional |
| Patio Heater | Contemporary, Industrial, Modern, Traditional |
| Pot Filler Faucet | Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional |
| Range | Commercial-Style, Contemporary, Modern, Traditional |
| Range Hood | Contemporary, Industrial, Modern, Traditional |
| Refrigerator | Contemporary, Modern, Traditional |
| Rug | Bohemian, Contemporary, Farmhouse, Geometric, Modern, Moroccan, Striped, Traditional, Transitional |
| Shower | Contemporary, Minimalist, Modern, Spa-Like, Traditional |
| Showerheads & Accessories | Contemporary, Industrial, Minimalist, Modern, Traditional, Transitional |
| Steam Shower | Contemporary, Luxury, Modern, Spa-Like |
| Stove and Fireplace | Contemporary, Modern, Rustic, Traditional |
| Tile | Contemporary, Geometric, Mediterranean, Modern, Moroccan, Traditional |
| Toilet | Contemporary, Minimalist, Modern, Sleek, Traditional, Transitional |
| Toilet Seat | Contemporary, Minimalist, Modern, Traditional |
| **Tub Filler** | **1 Hole, 2 Hole, 3 Hole, 4 Hole, Wall Mounted, Floor Mounted** *(configuration, not aesthetic)* |
| Urinal | Contemporary, Modern |
| Vanity Lighting | Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional, Victorian |
| Wall Decor | Bohemian, Coastal, Contemporary, Farmhouse, Industrial, Modern, Rustic, Traditional |
| Wall Sconce | Art Deco, Contemporary, Farmhouse, Industrial, Mid-Century Modern, Modern, Rustic, Traditional, Transitional, Victorian |

> **Bold/italic** entries use configuration-based styles (hole count / mount type), not design aesthetics.

---

## 7. Style Values in the SF Picklist

The full set of styles currently in the Salesforce picklist:

**Aesthetic**: Art Deco · Bohemian · Built-In · Coastal · Colonial · Commercial-Style · Contemporary · Eclectic · European · Farmhouse · Geometric · Industrial · Luxury · Mediterranean · Mid-Century Modern · Minimalist · Modern · Moroccan · Rustic · Scandinavian · Shaker · Sleek · Southwestern · Spa-Like · Striped · Traditional · Transitional · Tropical · Victorian · Vintage

**Configuration / functional**: 1 Hole · 2 Hole · 3 Hole · 4 Hole · Wall Mounted · Floor Mounted · Freestanding · Counter Depth · Showerhead · Not Applicable

**Pending SF creation** (requested but not yet in picklist): Freestanding (style) · Counter Depth — these have been awaiting SF creation for 70+ days.

---

## 8. Quick-Reference: Hierarchy in One View

```
Department
└── Family
    └── Category (e.g. "Range")
        ├── Type — selected by:
        │   1. Both AIs extract independently
        │   2. Invalid types → forced to valid or "Not Found"
        │   3. primary_filter wins over generic "Accessory"
        │   4. Spec-data tiebreaker (Slide-In, Control Location)
        │   5. TYPE_PRIORITY hierarchy (Range, Faucets only)
        │   6. General consensus resolution
        │   7. validateConsensusCategory() business rules
        │   8. Claude Phase B review (non-appliances only)
        └── Style — selected by:
            1. AI consensus
            2. Lighting / shower / universal validator
            3. AI disagreement value (prefer OpenAI)
            4. Ferguson Application field
            5. Ferguson Theme attribute
            6. Ferguson Installation Type attribute
            7. Web Retailer SubCategory
            8. "Not Applicable"
```
