# Category × Type × Style Curation Template

Generated: 2026-04-22

## Purpose

For each `(category, type)` combination, fill in the **applicable styles** by copying
style names from `STYLES-MASTER-LIST.md`.

When you give this back, the system will use it to build a `(category, type) → styles`
mapping that narrows the AI prompt to only show styles valid for the chosen type.

## How to fill it in

- Replace the `_TODO_` placeholder under each Type with a comma-separated list of style names.
- Style names must match exactly what is in `STYLES-MASTER-LIST.md` (case-sensitive).
- If a category has **no types**, fill in styles under the single "(no types)" row.
- If `styles_apply: false` for a category, you can leave it as `_N/A_` or skip it.
- The "Current styles" line shows what the system uses today (for reference only).

## Legend

- **`styles_apply`**: whether style is a meaningful field for this category (per `categories.json`)
- **Current style_type**: `aesthetic` (Modern/Traditional/etc) vs `configuration` (Single Hole/Wall Mount/etc)
- **Current styles**: what the AI sees today as the valid style list for this category

---

## Table of Contents

- [Appliances](#appliances) (17 categories)
- [Flooring](#flooring) (7 categories)
- [Hardware](#hardware) (38 categories)
- [Heating & Cooling](#heating-cooling) (17 categories)
- [Home Décor & Furniture](#home-d-cor-furniture) (4 categories)
- [Industrial & Commercial](#industrial-commercial) (5 categories)
- [Lighting & Electrical](#lighting-electrical) (24 categories)
- [Outdoor](#outdoor) (12 categories)
- [Plumbing & Bath](#plumbing-bath) (36 categories)

---

## Appliances

### All in One Washer / Dryer

- **Department**: Appliances
- **Family**: Laundry
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000010Q5EqIAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Unitized | `_TODO_` |
| Front Load | `_TODO_` |
| Top Load | `_TODO_` |
| Ventless | `_TODO_` |
| Accessory | `_TODO_` |

---

### Barbeque

- **Department**: Appliances
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000011kgEqIAI`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (8):

| Type | Applicable Styles |
|------|-------------------|
| Gas | `_TODO_` |
| Electric | `_TODO_` |
| Charcoal | `_TODO_` |
| Pellet | `_TODO_` |
| Kamado | `_TODO_` |
| Wood-Fired | `_TODO_` |
| Outdoor | `_TODO_` |
| Accessory | `_TODO_` |

---

### Coffee Maker

- **Department**: Appliances
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000011kmDGIAY`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (4): Contemporary, Minimalist, Modern, Traditional

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Countertop | `_TODO_` |
| Drip | `_TODO_` |
| Espresso | `_TODO_` |
| Single Serve | `_TODO_` |
| Cold Brew | `_TODO_` |
| Accessory | `_TODO_` |

---

### Cooktop

- **Department**: Appliances
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000010Q5EhIAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (3): Contemporary, Minimalist, Modern

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Gas | `_TODO_` |
| Electric | `_TODO_` |
| Induction | `_TODO_` |
| Radiant | `_TODO_` |
| Downdraft | `_TODO_` |
| Outdoor | `_TODO_` |
| Accessory | `_TODO_` |

---

### Dishwasher

- **Department**: Appliances
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000010Q5EiIAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (3): Contemporary, Modern, Traditional

**Types** (8):

| Type | Applicable Styles |
|------|-------------------|
| Top Control | `_TODO_` |
| Front Control | `_TODO_` |
| Drawer | `_TODO_` |
| Countertop | `_TODO_` |
| Portable | `_TODO_` |
| Panel-Ready | `_TODO_` |
| Outdoor | `_TODO_` |
| Accessory | `_TODO_` |

---

### Drawer

- **Department**: Appliances
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000011kpC2IAI`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Warming | `_TODO_` |
| Storage | `_TODO_` |
| Refrigerated | `_TODO_` |
| Outdoor | `_TODO_` |
| Accessory | `_TODO_` |

---

### Dryer

- **Department**: Appliances
- **Family**: Laundry
- **styles_apply**: `false`
- **Category SF ID**: `a01Hu000010Q5EjIAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Front Load | `_TODO_` |
| Top Load | `_TODO_` |
| Unitized | `_TODO_` |
| Accessory | `_TODO_` |

---

### Freezer

- **Department**: Appliances
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000010Q5EkIAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Upright | `_TODO_` |
| Chest | `_TODO_` |
| Column | `_TODO_` |
| Undercounter | `_TODO_` |
| Outdoor | `_TODO_` |
| Accessory | `_TODO_` |

---

### Icemaker

- **Department**: Appliances
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000011kFRfIAM`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Undercounter | `_TODO_` |
| Portable | `_TODO_` |
| Outdoor | `_TODO_` |
| Accessory | `_TODO_` |

---

### Laundry Pedestal

- **Department**: Appliances
- **Family**: Laundry
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000010Q5ErIAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Accessory | `_TODO_` |
| Functional | `_TODO_` |
| Riser | `_TODO_` |
| Storage | `_TODO_` |

---

### Microwave

- **Department**: Appliances
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000010Q5ElIAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (2): Contemporary, Modern

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Over-the-Range | `_TODO_` |
| Countertop | `_TODO_` |
| Drawer | `_TODO_` |
| Under Cabinet | `_TODO_` |
| Built-In | `_TODO_` |
| Accessory | `_TODO_` |

---

### Oven

- **Department**: Appliances
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000010Q5EmIAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (3): Contemporary, Modern, Traditional

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Single | `_TODO_` |
| Double Wall | `_TODO_` |
| Microwave Combo | `_TODO_` |
| Accessory | `_TODO_` |

---

### Pizza Oven

- **Department**: Appliances
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000KJFrCQAX`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Gas | `_TODO_` |
| Electric | `_TODO_` |
| Wood-Fired | `_TODO_` |
| Multi-Fuel | `_TODO_` |
| Countertop | `_TODO_` |
| Outdoor | `_TODO_` |
| Accessory | `_TODO_` |

---

### Range

- **Department**: Appliances
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000010Q5EnIAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (4): Commercial-Style, Contemporary, Modern, Traditional

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Pro-Style | `_TODO_` |
| Front Control | `_TODO_` |
| Rear Control | `_TODO_` |
| Outdoor | `_TODO_` |
| Accessory | `_TODO_` |

---

### Range Hood

- **Department**: Appliances
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000010Q5EoIAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (4): Contemporary, Industrial, Modern, Traditional

**Types** (8):

| Type | Applicable Styles |
|------|-------------------|
| Wall-Mounted | `_TODO_` |
| Under Cabinet | `_TODO_` |
| Island Mount | `_TODO_` |
| Insert | `_TODO_` |
| Downdraft | `_TODO_` |
| Pro-Style | `_TODO_` |
| Outdoor | `_TODO_` |
| Accessory | `_TODO_` |

---

### Refrigerator

- **Department**: Appliances
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01Hu000010Q5EpIAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (3): Contemporary, Modern, Traditional

**Types** (13):

| Type | Applicable Styles |
|------|-------------------|
| French Door | `_TODO_` |
| Side-by-Side | `_TODO_` |
| Top-Freezer | `_TODO_` |
| Bottom-Freezer | `_TODO_` |
| Column | `_TODO_` |
| Undercounter | `_TODO_` |
| 4-Door Flex | `_TODO_` |
| Freestanding | `_TODO_` |
| Wine Cooler | `_TODO_` |
| Beverage Center | `_TODO_` |
| Kegerator | `_TODO_` |
| Outdoor | `_TODO_` |
| Accessory | `_TODO_` |

---

### Washer

- **Department**: Appliances
- **Family**: Laundry
- **styles_apply**: `false`
- **Category SF ID**: `a01Hu000010Q5EsIAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Front Load | `_TODO_` |
| Top Load | `_TODO_` |
| Unitized | `_TODO_` |
| Accessory | `_TODO_` |

---

## Flooring

### Carpet

- **Department**: Flooring
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `NEEDS_SF_ID`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Peel and Stick | `_TODO_` |
| Modular | `_TODO_` |
| Commercial | `_TODO_` |
| Residential | `_TODO_` |
| Accessory | `_TODO_` |

---

### Hardwood Flooring

- **Department**: Flooring
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCekSQAS`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (4): Contemporary, Modern, Rustic, Traditional

**Types** (11):

| Type | Applicable Styles |
|------|-------------------|
| Solid | `_TODO_` |
| Engineered | `_TODO_` |
| Prefinished | `_TODO_` |
| Unfinished | `_TODO_` |
| Nail Down | `_TODO_` |
| Glue Down | `_TODO_` |
| Click Lock | `_TODO_` |
| Floating | `_TODO_` |
| Hand-Scraped | `_TODO_` |
| Wire-Brushed | `_TODO_` |
| Accessory | `_TODO_` |

---

### Kitchen Tile

- **Department**: Flooring
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EFQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Ceramic | `_TODO_` |
| Porcelain | `_TODO_` |
| Glass | `_TODO_` |
| Stone | `_TODO_` |
| Mosaic | `_TODO_` |
| Subway | `_TODO_` |
| Accessory | `_TODO_` |

---

### Laminate Flooring

- **Department**: Flooring
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCekTQAS`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (3): Contemporary, Rustic, Traditional

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Wood Look | `_TODO_` |
| Tile Look | `_TODO_` |
| Stone Look | `_TODO_` |
| Waterproof | `_TODO_` |
| Accessory | `_TODO_` |

---

### Luxury Vinyl Flooring

- **Department**: Flooring
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCekRQAS`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (3): Contemporary, Modern, Rustic

**Types** (11):

| Type | Applicable Styles |
|------|-------------------|
| Plank | `_TODO_` |
| Tile | `_TODO_` |
| Click Lock | `_TODO_` |
| Glue Down | `_TODO_` |
| Loose Lay | `_TODO_` |
| Vinyl Plank | `_TODO_` |
| Vinyl Tile | `_TODO_` |
| WPC | `_TODO_` |
| SPC | `_TODO_` |
| Rigid Core | `_TODO_` |
| Accessory | `_TODO_` |

---

### Tile

- **Department**: Flooring
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCekQQAS`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (6): Contemporary, Geometric, Mediterranean, Modern, Moroccan, Traditional

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Ceramic | `_TODO_` |
| Porcelain | `_TODO_` |
| Stone | `_TODO_` |
| Glass | `_TODO_` |
| Mosaic | `_TODO_` |
| Cement | `_TODO_` |
| Accessory | `_TODO_` |

---

### Waterproof Flooring

- **Department**: Flooring
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCekWQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Vinyl Plank | `_TODO_` |
| Vinyl Tile | `_TODO_` |
| Laminate | `_TODO_` |
| Engineered | `_TODO_` |
| Accessory | `_TODO_` |

---

## Hardware

### Appliance Pull

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejSQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Appliance Pull | `_TODO_` |
| Refrigerator Pull | `_TODO_` |
| Dishwasher Pull | `_TODO_` |
| Oven Pull | `_TODO_` |
| Accessory | `_TODO_` |

---

### Backplate

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejTQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (2):

| Type | Applicable Styles |
|------|-------------------|
| Decorative | `_TODO_` |
| Accessory | `_TODO_` |

---

### Barn Door Hardware

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5F1QAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Track Kit | `_TODO_` |
| Hanger | `_TODO_` |
| Rail | `_TODO_` |
| Floor Guide | `_TODO_` |
| Handle | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bathroom Cabinet Hardware

- **Department**: Hardware
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DdQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (7): Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional, Victorian

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Knob | `_TODO_` |
| Pull | `_TODO_` |
| Handle | `_TODO_` |
| Accessory | `_TODO_` |

---

### Cabinet Catch and Latch

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejUQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Magnetic | `_TODO_` |
| Ball Catch | `_TODO_` |
| Roller | `_TODO_` |
| Touch Latch | `_TODO_` |
| Push to Open | `_TODO_` |
| Accessory | `_TODO_` |

---

### Cabinet Finishing

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejVQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Edge Banding | `_TODO_` |
| Molding | `_TODO_` |
| Toe Kick | `_TODO_` |
| End Panel | `_TODO_` |
| Crown Molding | `_TODO_` |
| Accessory | `_TODO_` |

---

### Cabinet Hardware

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5E4QAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (11): Art Deco, Contemporary, Farmhouse, Industrial, Modern, Rustic, Shaker, Traditional, Transitional, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Knob | `_TODO_` |
| Pull | `_TODO_` |
| Handle | `_TODO_` |
| Hinge | `_TODO_` |
| Catch | `_TODO_` |
| Accessory | `_TODO_` |

---

### Cabinet Hardware Bulk Pack

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejWQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Knob | `_TODO_` |
| Pull | `_TODO_` |
| Hinge | `_TODO_` |
| Accessory | `_TODO_` |

---

### Cabinet Hardware Mounting Template

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejXQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (3):

| Type | Applicable Styles |
|------|-------------------|
| Knob | `_TODO_` |
| Pull | `_TODO_` |
| Accessory | `_TODO_` |

---

### Cabinet Hinge

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejYQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Overlay | `_TODO_` |
| Inset | `_TODO_` |
| Concealed | `_TODO_` |
| Soft Close | `_TODO_` |
| Ball Bearing | `_TODO_` |
| Accessory | `_TODO_` |

---

### Cabinet Knob

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejZQAS`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (8): Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Knob | `_TODO_` |
| Designer Knob | `_TODO_` |
| Crystal | `_TODO_` |
| Jeweled | `_TODO_` |
| Accessory | `_TODO_` |

---

### Cabinet Lock

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejaQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Keyed Lock | `_TODO_` |
| Cam Lock | `_TODO_` |
| Drawer Lock | `_TODO_` |
| Push Lock | `_TODO_` |
| Glass Door Lock | `_TODO_` |
| Accessory | `_TODO_` |

---

### Cabinet Organization and Storage

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejbQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Pull-Out Shelf | `_TODO_` |
| Lazy Susan | `_TODO_` |
| Drawer Insert | `_TODO_` |
| Door Organizer | `_TODO_` |
| Trash Pull-Out | `_TODO_` |
| Accessory | `_TODO_` |

---

### Cabinet Pull

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejcQAC`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (8): Contemporary, Farmhouse, Industrial, Modern, Rustic, Traditional, Transitional, Vintage

**Types** (8):

| Type | Applicable Styles |
|------|-------------------|
| Bar Pull | `_TODO_` |
| Cup Pull | `_TODO_` |
| Bin Pull | `_TODO_` |
| Ring Pull | `_TODO_` |
| Finger Pull | `_TODO_` |
| Appliance Pull | `_TODO_` |
| Arch Pull | `_TODO_` |
| Accessory | `_TODO_` |

---

### Closet and Pocket Door Hardware

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5F3QAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Pocket Door Kit | `_TODO_` |
| Closet Rod | `_TODO_` |
| Track | `_TODO_` |
| Pull | `_TODO_` |
| Lock | `_TODO_` |
| Accessory | `_TODO_` |

---

### Commercial Door Hardware

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5F4QAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Exit Device | `_TODO_` |
| Door Closer | `_TODO_` |
| Push/Pull | `_TODO_` |
| Kick Plate | `_TODO_` |
| Mortise Lock | `_TODO_` |
| Accessory | `_TODO_` |

---

### Deadbolt

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5F5QAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (3): Contemporary, Modern, Traditional

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Single Cylinder | `_TODO_` |
| Double Cylinder | `_TODO_` |
| Electronic | `_TODO_` |
| Smart Lock | `_TODO_` |
| Keyless | `_TODO_` |
| Accessory | `_TODO_` |

---

### Designer Cabinet Hardware

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejdQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Designer Knob | `_TODO_` |
| Designer Pull | `_TODO_` |
| Designer Handle | `_TODO_` |
| Accessory | `_TODO_` |

---

### Door

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejDQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Interior | `_TODO_` |
| Exterior | `_TODO_` |
| French | `_TODO_` |
| Barn | `_TODO_` |
| Bi-Fold | `_TODO_` |
| Pocket | `_TODO_` |
| Accessory | `_TODO_` |

---

### Door Entry Set

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5F7QAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Handleset | `_TODO_` |
| Knob Entry | `_TODO_` |
| Lever Entry | `_TODO_` |
| Accessory | `_TODO_` |

---

### Door Hardware Part

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5F8QAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Handle | `_TODO_` |
| Strike Plate | `_TODO_` |
| Latch | `_TODO_` |
| Hinge | `_TODO_` |
| Accessory | `_TODO_` |

---

### Door Hardware: Knob and Lever

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5F9QAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Entry | `_TODO_` |
| Privacy | `_TODO_` |
| Passage | `_TODO_` |
| Dummy | `_TODO_` |
| Accessory | `_TODO_` |

---

### Door Hinge

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dC5FAQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Butt Hinge | `_TODO_` |
| Ball Bearing | `_TODO_` |
| Spring Hinge | `_TODO_` |
| Piano Hinge | `_TODO_` |
| Accessory | `_TODO_` |

---

### Door Knob

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejBQAS`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (7): Colonial, Contemporary, Modern, Traditional, Transitional, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Entry | `_TODO_` |
| Privacy | `_TODO_` |
| Passage | `_TODO_` |
| Dummy | `_TODO_` |
| Accessory | `_TODO_` |

---

### Door Lever

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejCQAS`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (7): Contemporary, European, Industrial, Minimalist, Modern, Traditional, Transitional

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Entry | `_TODO_` |
| Privacy | `_TODO_` |
| Passage | `_TODO_` |
| Dummy | `_TODO_` |
| Accessory | `_TODO_` |

---

### Drawer Slide and Accessory

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dCejeQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Ball Bearing | `_TODO_` |
| Side Mount | `_TODO_` |
| Center Mount | `_TODO_` |
| Soft Close | `_TODO_` |
| Undermount | `_TODO_` |
| Accessory | `_TODO_` |

---

### Handleset

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejEQAS`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (6): Contemporary, Modern, Rustic, Traditional, Transitional, Victorian

**Types** (3):

| Type | Applicable Styles |
|------|-------------------|
| Handleset + Deadbolt | `_TODO_` |
| Handleset | `_TODO_` |
| Accessory | `_TODO_` |

---

### Keyed Hardware

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejGQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Knob | `_TODO_` |
| Lever | `_TODO_` |
| Deadbolt | `_TODO_` |
| Handleset | `_TODO_` |
| Accessory | `_TODO_` |

---

### Keyless Entry

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejHQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Keypad | `_TODO_` |
| Touchscreen | `_TODO_` |
| Smart Lock | `_TODO_` |
| Biometric | `_TODO_` |
| Bluetooth | `_TODO_` |
| Accessory | `_TODO_` |

---

### Lock Combo Pack

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejIQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Deadbolt | `_TODO_` |
| Knob + Deadbolt | `_TODO_` |
| Lever + Deadbolt | `_TODO_` |
| Accessory | `_TODO_` |

---

### Mortise Lock

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejJQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Mortise | `_TODO_` |
| Entry | `_TODO_` |
| Passage | `_TODO_` |
| Privacy | `_TODO_` |
| Accessory | `_TODO_` |

---

### Multi Point Door Hardware

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejKQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Handleset | `_TODO_` |
| Lock | `_TODO_` |
| Strike | `_TODO_` |
| Gear | `_TODO_` |
| Accessory | `_TODO_` |

---

### Safe, Lock and Lock Box

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejLQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Safe | `_TODO_` |
| Lock Box | `_TODO_` |
| Padlock | `_TODO_` |
| Key Cabinet | `_TODO_` |
| Accessory | `_TODO_` |

---

### Safety & Security

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejMQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (8):

| Type | Applicable Styles |
|------|-------------------|
| Smoke Detector | `_TODO_` |
| CO Detector | `_TODO_` |
| Security Camera | `_TODO_` |
| Motion Sensor | `_TODO_` |
| Safe | `_TODO_` |
| Lock | `_TODO_` |
| Alarm | `_TODO_` |
| Accessory | `_TODO_` |

---

### Screen and Storm Door Hardware

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejNQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Handle Set | `_TODO_` |
| Closer | `_TODO_` |
| Hinge | `_TODO_` |
| Latch | `_TODO_` |
| Push Bar | `_TODO_` |
| Accessory | `_TODO_` |

---

### Sliding Door Hardware

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejOQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Track | `_TODO_` |
| Roller | `_TODO_` |
| Handle | `_TODO_` |
| Lock | `_TODO_` |
| Floor Guide | `_TODO_` |
| Accessory | `_TODO_` |

---

### Storage and Organization

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejPQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Shelf | `_TODO_` |
| Bin | `_TODO_` |
| Rack | `_TODO_` |
| Hook | `_TODO_` |
| Drawer Organizer | `_TODO_` |
| Closet System | `_TODO_` |
| Accessory | `_TODO_` |

---

### Vanity Cabinet Hardware

- **Department**: Hardware
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejhQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Knob | `_TODO_` |
| Pull | `_TODO_` |
| Handle | `_TODO_` |
| Accessory | `_TODO_` |

---

## Heating & Cooling

### Air Conditioner

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dCek0QAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Window | `_TODO_` |
| Portable | `_TODO_` |
| Central | `_TODO_` |
| Through-Wall | `_TODO_` |
| Accessory | `_TODO_` |

---

### Air Filter

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCek1QAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| HEPA | `_TODO_` |
| Electrostatic | `_TODO_` |
| Pleated | `_TODO_` |
| Carbon | `_TODO_` |
| Accessory | `_TODO_` |

---

### Commercial HVAC

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCek2QAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Rooftop Unit | `_TODO_` |
| Split System | `_TODO_` |
| Package Unit | `_TODO_` |
| Chiller | `_TODO_` |
| Boiler | `_TODO_` |
| Accessory | `_TODO_` |

---

### Dehumidifier

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCek3QAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Portable | `_TODO_` |
| Whole House | `_TODO_` |
| Compact | `_TODO_` |
| Accessory | `_TODO_` |

---

### Ducting

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCek4QAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Flexible | `_TODO_` |
| Rigid | `_TODO_` |
| Insulated | `_TODO_` |
| Connector | `_TODO_` |
| Vent | `_TODO_` |
| Accessory | `_TODO_` |

---

### Evaporative Cooler

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCek5QAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (3):

| Type | Applicable Styles |
|------|-------------------|
| Portable | `_TODO_` |
| Window | `_TODO_` |
| Accessory | `_TODO_` |

---

### Exhaust Fan

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCek6QAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Ceiling Mount | `_TODO_` |
| Wall Mount | `_TODO_` |
| Inline | `_TODO_` |
| Accessory | `_TODO_` |

---

### HVAC Accessory

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000fKN2RQAW`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Register | `_TODO_` |
| Grille | `_TODO_` |
| Vent Cover | `_TODO_` |
| Damper | `_TODO_` |
| Accessory | `_TODO_` |

---

### Mini Split Air Conditioner

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dCekBQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Single Zone | `_TODO_` |
| Multi Zone | `_TODO_` |
| Ductless | `_TODO_` |
| Heat Pump | `_TODO_` |
| Accessory | `_TODO_` |

---

### Patio Heater

- **Department**: Heating & Cooling
- **Family**: Outdoor
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejxQAC`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (4): Contemporary, Industrial, Modern, Traditional

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Propane | `_TODO_` |
| Electric | `_TODO_` |
| Infrared | `_TODO_` |
| Hanging | `_TODO_` |
| Accessory | `_TODO_` |

---

### Room Heater

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000eEFl0QAG`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Ceramic | `_TODO_` |
| Infrared | `_TODO_` |
| Oil Filled | `_TODO_` |
| Fan Forced | `_TODO_` |
| Radiant | `_TODO_` |
| Convection | `_TODO_` |
| Accessory | `_TODO_` |

---

### Skylight

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCekDQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Fixed | `_TODO_` |
| Vented | `_TODO_` |
| Curb Mount | `_TODO_` |
| Deck Mount | `_TODO_` |
| Tubular | `_TODO_` |
| Accessory | `_TODO_` |

---

### Stove and Chimney Pipe

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCekEQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Chimney Pipe | `_TODO_` |
| Stove Pipe | `_TODO_` |
| Connector | `_TODO_` |
| Cap | `_TODO_` |
| Flashing | `_TODO_` |
| Accessory | `_TODO_` |

---

### Stove and Fireplace

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCekFQAS`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (4): Contemporary, Modern, Rustic, Traditional

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Wood Burning | `_TODO_` |
| Gas | `_TODO_` |
| Pellet | `_TODO_` |
| Multi-Fuel | `_TODO_` |
| Accessory | `_TODO_` |

---

### Tankless Water Heater

- **Department**: Heating & Cooling
- **Family**: General
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dC5DwQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Tankless | `_TODO_` |
| Gas | `_TODO_` |
| Electric | `_TODO_` |
| Condensing | `_TODO_` |
| Point of Use | `_TODO_` |
| Whole House | `_TODO_` |
| Accessory | `_TODO_` |

---

### Thermostat

- **Department**: Heating & Cooling
- **Family**: HVAC
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dCekGQAS`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Programmable | `_TODO_` |
| Smart | `_TODO_` |
| Standard | `_TODO_` |
| WiFi | `_TODO_` |
| Accessory | `_TODO_` |

---

### Water Heater

- **Department**: Heating & Cooling
- **Family**: General
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000bI2srQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Tankless | `_TODO_` |
| Tank | `_TODO_` |
| Electric | `_TODO_` |
| Gas | `_TODO_` |
| Accessory | `_TODO_` |

---

## Home Décor & Furniture

### Chair

- **Department**: Home Décor & Furniture
- **Family**: Furniture
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000XYWwyQAH`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (8): Contemporary, Farmhouse, Industrial, Mid-Century Modern, Modern, Rustic, Traditional, Transitional

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Dining | `_TODO_` |
| Accent | `_TODO_` |
| Office | `_TODO_` |
| Lounge | `_TODO_` |
| Rocking | `_TODO_` |
| Bar Stool | `_TODO_` |
| Accessory | `_TODO_` |

---

### Mirror

- **Department**: Home Décor & Furniture
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCekJQAS`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (8): Art Deco, Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional, Victorian

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Wall Mirror | `_TODO_` |
| Floor Mirror | `_TODO_` |
| Full Length | `_TODO_` |
| Vanity | `_TODO_` |
| Accessory | `_TODO_` |

---

### Rug

- **Department**: Home Décor & Furniture
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCekNQAS`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (9): Bohemian, Contemporary, Farmhouse, Geometric, Modern, Moroccan, Striped, Traditional, Transitional

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Indoor | `_TODO_` |
| Outdoor | `_TODO_` |
| Accent | `_TODO_` |
| Accessory | `_TODO_` |

---

### Wall Decor

- **Department**: Home Décor & Furniture
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCekKQAS`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (8): Bohemian, Coastal, Contemporary, Farmhouse, Industrial, Modern, Rustic, Traditional

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Wall Art | `_TODO_` |
| Mirror | `_TODO_` |
| Clock | `_TODO_` |
| Shelf | `_TODO_` |
| Sconce | `_TODO_` |
| Tapestry | `_TODO_` |
| Accessory | `_TODO_` |

---

## Industrial & Commercial

### Chemicals & Compounds

- **Department**: Industrial & Commercial
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dF7KTQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Pipe Cement | `_TODO_` |
| Primer | `_TODO_` |
| Sealant | `_TODO_` |
| Flux | `_TODO_` |
| Thread Compound | `_TODO_` |
| Accessory | `_TODO_` |

---

### Commercial Restroom

- **Department**: Industrial & Commercial
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DpQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Toilet | `_TODO_` |
| Urinal | `_TODO_` |
| Sink | `_TODO_` |
| Hand Dryer | `_TODO_` |
| Dispenser | `_TODO_` |
| Partition | `_TODO_` |
| Accessory | `_TODO_` |

---

### Hydronic Expansion Tank

- **Department**: Industrial & Commercial
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dFPfcQAG`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (3):

| Type | Applicable Styles |
|------|-------------------|
| Bladder | `_TODO_` |
| Diaphragm | `_TODO_` |
| Accessory | `_TODO_` |

---

### Industrial Strainer

- **Department**: Industrial & Commercial
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dDRGuQAO`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Simplex Strainer | `_TODO_` |
| Duplex Strainer | `_TODO_` |
| Basket Strainer | `_TODO_` |
| Y Strainer | `_TODO_` |
| Accessory | `_TODO_` |

---

### Water Fountain

- **Department**: Industrial & Commercial
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dBtNpQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Wall Mount | `_TODO_` |
| Freestanding | `_TODO_` |
| Bottle Filler | `_TODO_` |
| Outdoor | `_TODO_` |
| Accessory | `_TODO_` |

---

## Lighting & Electrical

### Air Circulator

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EfQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (10):

| Type | Applicable Styles |
|------|-------------------|
| Oscillating | `_TODO_` |
| Pedestal | `_TODO_` |
| Table | `_TODO_` |
| Floor | `_TODO_` |
| Wall Sconce | `_TODO_` |
| Up Light | `_TODO_` |
| Down Light | `_TODO_` |
| Up/Down Light | `_TODO_` |
| 1-Light | `_TODO_` |
| Accessory | `_TODO_` |

---

### Attic Fan

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EgQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Gable Mount | `_TODO_` |
| Roof Mounted Powered Attic Fan | `_TODO_` |
| Solar | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bathroom Lighting

- **Department**: Lighting & Electrical
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DgQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (6): Contemporary, Industrial, Minimalist, Modern, Traditional, Transitional

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Vanity | `_TODO_` |
| Bath Bar | `_TODO_` |
| Sconce | `_TODO_` |
| Flush Mount | `_TODO_` |
| Pendant | `_TODO_` |
| Accessory | `_TODO_` |

---

### Ceiling Fan

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EjQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (9): Coastal, Contemporary, Farmhouse, Industrial, Modern, Rustic, Traditional, Transitional, Tropical

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Indoor | `_TODO_` |
| Outdoor | `_TODO_` |
| Hugger | `_TODO_` |
| Accessory | `_TODO_` |

---

### Ceiling Light

- **Department**: Lighting & Electrical
- **Family**: Indoor Lighting
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EKQA0`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (10): Art Deco, Coastal, Contemporary, Farmhouse, Industrial, Mid-Century Modern, Modern, Rustic, Traditional, Transitional

**Types** (9):

| Type | Applicable Styles |
|------|-------------------|
| Flush Mount | `_TODO_` |
| Semi-Flush | `_TODO_` |
| Passage | `_TODO_` |
| Privacy | `_TODO_` |
| Keyed Entry | `_TODO_` |
| Dummy | `_TODO_` |
| Single Cylinder | `_TODO_` |
| Double Cylinder | `_TODO_` |
| Accessory | `_TODO_` |

---

### Chandelier

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5ELQA0`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (9): Art Deco, Contemporary, Farmhouse, Industrial, Modern, Rustic, Traditional, Transitional, Victorian

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Chandelier | `_TODO_` |
| Candle | `_TODO_` |
| Crystal | `_TODO_` |
| Drum | `_TODO_` |
| Sputnik | `_TODO_` |
| Tiered | `_TODO_` |
| Accessory | `_TODO_` |

---

### Commercial Lighting

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EMQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Panel | `_TODO_` |
| Troffer | `_TODO_` |
| High Bay | `_TODO_` |
| Low Bay | `_TODO_` |
| Strip Light | `_TODO_` |
| Exit Sign | `_TODO_` |
| Accessory | `_TODO_` |

---

### Flush and Semi-Flush

- **Department**: Lighting & Electrical
- **Family**: Indoor Lighting
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5ENQA0`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (8): Art Deco, Contemporary, Farmhouse, Industrial, Mid-Century Modern, Modern, Traditional, Transitional

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Flush Mount | `_TODO_` |
| Semi-Flush | `_TODO_` |
| Drum | `_TODO_` |
| Globe | `_TODO_` |
| Accessory | `_TODO_` |

---

### Island Lighting

- **Department**: Lighting & Electrical
- **Family**: Indoor Lighting
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EOQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Linear | `_TODO_` |
| Multi-Light | `_TODO_` |
| Pendant | `_TODO_` |
| Chandelier | `_TODO_` |
| Accessory | `_TODO_` |

---

### Kitchen Lighting

- **Department**: Lighting & Electrical
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EBQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (8):

| Type | Applicable Styles |
|------|-------------------|
| Pendant | `_TODO_` |
| Island | `_TODO_` |
| Under Cabinet | `_TODO_` |
| Track | `_TODO_` |
| Flush Mount | `_TODO_` |
| Recessed | `_TODO_` |
| Linear | `_TODO_` |
| Accessory | `_TODO_` |

---

### Lamp

- **Department**: Lighting & Electrical
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCekOQAS`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (9): Art Deco, Contemporary, Farmhouse, Industrial, Mid-Century Modern, Modern, Rustic, Traditional, Transitional

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Table Lamp | `_TODO_` |
| Floor Lamp | `_TODO_` |
| Desk Lamp | `_TODO_` |
| Buffet Lamp | `_TODO_` |
| Arc Lamp | `_TODO_` |
| Torchiere | `_TODO_` |
| Accessory | `_TODO_` |

---

### Landscape Lighting

- **Department**: Lighting & Electrical
- **Family**: Outdoor
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EQQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Path Light | `_TODO_` |
| Spotlight | `_TODO_` |
| Flood Light | `_TODO_` |
| Well Light | `_TODO_` |
| Deck | `_TODO_` |
| Bollard | `_TODO_` |
| Accessory | `_TODO_` |

---

### LED Lighting

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5ERQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| LED Strip | `_TODO_` |
| LED Panel | `_TODO_` |
| LED Retrofit | `_TODO_` |
| LED Tube | `_TODO_` |
| Accessory | `_TODO_` |

---

### Light Bulbs

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dC5ESQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| LED | `_TODO_` |
| Incandescent | `_TODO_` |
| CFL | `_TODO_` |
| Halogen | `_TODO_` |
| Smart Bulb | `_TODO_` |
| Accessory | `_TODO_` |

---

### Light Switches & Dimmers

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5ETQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Standard Switch | `_TODO_` |
| Dimmer | `_TODO_` |
| Smart Switch | `_TODO_` |
| Motion Sensor | `_TODO_` |
| Timer | `_TODO_` |
| Fan Control | `_TODO_` |
| Accessory | `_TODO_` |

---

### Lighting Accessory

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dC5EVQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Shade | `_TODO_` |
| Downrod | `_TODO_` |
| Light Kit | `_TODO_` |
| Blade | `_TODO_` |
| Remote | `_TODO_` |
| Accessory | `_TODO_` |

---

### Pendant

- **Department**: Lighting & Electrical
- **Family**: Indoor Lighting
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EXQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Pendant | `_TODO_` |
| Multi-Light | `_TODO_` |
| Mini | `_TODO_` |
| Drum | `_TODO_` |
| Globe | `_TODO_` |
| Lantern | `_TODO_` |
| Accessory | `_TODO_` |

---

### Post Light

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EYQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Post Mount | `_TODO_` |
| Pier Mount | `_TODO_` |
| Column Mount | `_TODO_` |
| Lantern | `_TODO_` |
| Accessory | `_TODO_` |

---

### Recessed Lighting

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dC5EZQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| New Construction | `_TODO_` |
| Remodel | `_TODO_` |
| Canless | `_TODO_` |
| LED | `_TODO_` |
| Trim | `_TODO_` |
| Housing | `_TODO_` |
| Accessory | `_TODO_` |

---

### Step Lighting

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dC5EaQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Recessed | `_TODO_` |
| Surface Mount | `_TODO_` |
| Solar | `_TODO_` |
| LED | `_TODO_` |
| Accessory | `_TODO_` |

---

### Track and Rail Lighting

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dC5EbQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Track | `_TODO_` |
| Track Head | `_TODO_` |
| Monorail | `_TODO_` |
| Connector | `_TODO_` |
| LED | `_TODO_` |
| Accessory | `_TODO_` |

---

### Under Cabinet Light

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dC5EcQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| LED Strip | `_TODO_` |
| Puck Light | `_TODO_` |
| Light Bar | `_TODO_` |
| Tape Light | `_TODO_` |
| Accessory | `_TODO_` |

---

### Vanity Lighting

- **Department**: Lighting & Electrical
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EdQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (7): Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional, Victorian

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Vanity | `_TODO_` |
| Bath Bar | `_TODO_` |
| Sconce | `_TODO_` |
| Globe | `_TODO_` |
| Accessory | `_TODO_` |

---

### Wall Sconce

- **Department**: Lighting & Electrical
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EeQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (10): Art Deco, Contemporary, Farmhouse, Industrial, Mid-Century Modern, Modern, Rustic, Traditional, Transitional, Victorian

**Types** (10):

| Type | Applicable Styles |
|------|-------------------|
| Wall Sconce | `_TODO_` |
| Swing Arm | `_TODO_` |
| Up Light | `_TODO_` |
| Down Light | `_TODO_` |
| Bath Bar | `_TODO_` |
| Vanity | `_TODO_` |
| 1-Light | `_TODO_` |
| 3-Light | `_TODO_` |
| 4-Light | `_TODO_` |
| Accessory | `_TODO_` |

---

## Outdoor

### Entry Set

- **Department**: Outdoor
- **Family**: Outdoor
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejjQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Handleset | `_TODO_` |
| Keyed Entry | `_TODO_` |
| Electronic | `_TODO_` |
| Accessory | `_TODO_` |

---

### Exterior Door

- **Department**: Outdoor
- **Family**: Outdoor
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejkQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Entry | `_TODO_` |
| French | `_TODO_` |
| Storm | `_TODO_` |
| Screen | `_TODO_` |
| Accessory | `_TODO_` |

---

### Fire Pit

- **Department**: Outdoor
- **Family**: Outdoor
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejmQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Fire Table | `_TODO_` |
| Wood Burning | `_TODO_` |
| Gas | `_TODO_` |
| Propane | `_TODO_` |
| Accessory | `_TODO_` |

---

### Fire Pit Accessory

- **Department**: Outdoor
- **Family**: Outdoor
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dCejlQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Fire Glass | `_TODO_` |
| Log Set | `_TODO_` |
| Cover | `_TODO_` |
| Accessory | `_TODO_` |

---

### Garden Decor

- **Department**: Outdoor
- **Family**: Outdoor
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejnQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Planter | `_TODO_` |
| Statue | `_TODO_` |
| Fountain | `_TODO_` |
| Bird Bath | `_TODO_` |
| Wind Chime | `_TODO_` |
| Garden Stake | `_TODO_` |
| Accessory | `_TODO_` |

---

### Generator

- **Department**: Outdoor
- **Family**: Outdoor
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dCejoQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Portable | `_TODO_` |
| Standby | `_TODO_` |
| Inverter | `_TODO_` |
| Accessory | `_TODO_` |

---

### Hardscaping

- **Department**: Outdoor
- **Family**: Outdoor
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejpQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Paver | `_TODO_` |
| Flagstone | `_TODO_` |
| Brick | `_TODO_` |
| Gravel | `_TODO_` |
| Stepping Stone | `_TODO_` |
| Accessory | `_TODO_` |

---

### Mail Box

- **Department**: Outdoor
- **Family**: Outdoor
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejqQAC`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (6): Contemporary, Farmhouse, Modern, Rustic, Traditional, Victorian

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Post Mount | `_TODO_` |
| Wall Mount | `_TODO_` |
| Column Mount | `_TODO_` |
| Accessory | `_TODO_` |

---

### Outdoor Fireplace

- **Department**: Outdoor
- **Family**: Outdoor
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejsQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Wood Burning | `_TODO_` |
| Gas | `_TODO_` |
| Ethanol | `_TODO_` |
| Accessory | `_TODO_` |

---

### Outdoor Lighting

- **Department**: Outdoor
- **Family**: Outdoor
- **styles_apply**: `true`
- **Category SF ID**: `NEEDS_SF_ID`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (8): Coastal, Contemporary, Farmhouse, Industrial, Modern, Rustic, Traditional, Transitional

**Types** (9):

| Type | Applicable Styles |
|------|-------------------|
| Wall Lantern | `_TODO_` |
| Post Light | `_TODO_` |
| Path Light | `_TODO_` |
| Flood Light | `_TODO_` |
| Landscape | `_TODO_` |
| Security | `_TODO_` |
| Deck | `_TODO_` |
| Ceiling Mounted | `_TODO_` |
| Accessory | `_TODO_` |

---

### Outdoor Shower Faucet

- **Department**: Outdoor
- **Family**: Outdoor
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dCejwQAC`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Wall Mount | `_TODO_` |
| Freestanding | `_TODO_` |
| Handheld | `_TODO_` |
| Accessory | `_TODO_` |

---

### Storage Drawer/Door

- **Department**: Outdoor
- **Family**: General
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dEXvOQAW`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Storage Drawer | `_TODO_` |
| Cabinet | `_TODO_` |
| Access Door | `_TODO_` |
| Accessory | `_TODO_` |

---

## Plumbing & Bath

### Bar & Prep Sink

- **Department**: Plumbing & Bath
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5E2QAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (6): Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Bar/Prep | `_TODO_` |
| Undermount | `_TODO_` |
| Drop-In | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bar Faucet

- **Department**: Plumbing & Bath
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5E3QAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (6): Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Single Handle | `_TODO_` |
| Pull-Down | `_TODO_` |
| Pull-Out | `_TODO_` |
| Touchless | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bath Fan

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dC5DcQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Standard | `_TODO_` |
| Humidity Sensing | `_TODO_` |
| With Light | `_TODO_` |
| With Heater | `_TODO_` |
| With Light and Heater | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bathroom Faucet

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DeQAK`
- **Current style_type**: `configuration` (source: category_specific_mappings)
- **Current styles** (5): 1 Hole, 2 Hole, 3 Hole, 4 Hole, Wall Mounted

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Centerset | `_TODO_` |
| Widespread | `_TODO_` |
| Single Hole | `_TODO_` |
| Vessel | `_TODO_` |
| Wall Mounted | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bathroom Hardware and Accessories

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DfQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (8): Contemporary, Farmhouse, Industrial, Minimalist, Modern, Traditional, Transitional, Victorian

**Types** (8):

| Type | Applicable Styles |
|------|-------------------|
| Towel Bar | `_TODO_` |
| Towel Ring | `_TODO_` |
| Robe Hook | `_TODO_` |
| Toilet Paper Holder | `_TODO_` |
| Shelf | `_TODO_` |
| Grab Bar | `_TODO_` |
| Set | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bathroom Lighting

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DgQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (6): Contemporary, Industrial, Minimalist, Modern, Traditional, Transitional

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Vanity | `_TODO_` |
| Bath Bar | `_TODO_` |
| Sconce | `_TODO_` |
| Flush Mount | `_TODO_` |
| Pendant | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bathroom Mirror

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DhQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (9): Art Deco, Contemporary, Farmhouse, Industrial, Modern, Rustic, Traditional, Transitional, Victorian

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Wall Mirror | `_TODO_` |
| Medicine Cabinet | `_TODO_` |
| Lighted | `_TODO_` |
| Magnifying | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bathroom Sink

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DiQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (8): Art Deco, Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional, Victorian

**Types** (8):

| Type | Applicable Styles |
|------|-------------------|
| Undermount | `_TODO_` |
| Drop-In | `_TODO_` |
| Vessel | `_TODO_` |
| Pedestal | `_TODO_` |
| Console | `_TODO_` |
| Wall Mount | `_TODO_` |
| Semi-Recessed | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bathroom Vanity

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DjQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (10): Contemporary, Farmhouse, Industrial, Mid-Century Modern, Modern, Rustic, Shaker, Traditional, Transitional, Victorian

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Freestanding | `_TODO_` |
| Wall Mounted | `_TODO_` |
| Floating | `_TODO_` |
| Single Sink | `_TODO_` |
| Double Sink | `_TODO_` |
| Corner | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bathtub

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DlQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (6): Contemporary, Modern, Spa-Like, Traditional, Transitional, Victorian

**Types** (8):

| Type | Applicable Styles |
|------|-------------------|
| Alcove | `_TODO_` |
| Freestanding | `_TODO_` |
| Drop-In | `_TODO_` |
| Undermount | `_TODO_` |
| Corner | `_TODO_` |
| Walk-In | `_TODO_` |
| Clawfoot | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bathtub Waste & Overflow

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DkQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Toe-Touch | `_TODO_` |
| Push-Pull | `_TODO_` |
| Lift & Turn | `_TODO_` |
| Trip Lever | `_TODO_` |
| Cable Operated | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bidet

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DoQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (3): Contemporary, Modern, Traditional

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Bidet | `_TODO_` |
| Integrated | `_TODO_` |
| Wall Mount | `_TODO_` |
| Accessory | `_TODO_` |

---

### Bidet Seat

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DnQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (3): Contemporary, Minimalist, Modern

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Electric | `_TODO_` |
| Non-Electric | `_TODO_` |
| Bidet Seat | `_TODO_` |
| Accessory | `_TODO_` |

---

### Cabinet Hardware

- **Department**: Plumbing & Bath
- **Family**: Home Improvement
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5E4QAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (11): Art Deco, Contemporary, Farmhouse, Industrial, Modern, Rustic, Shaker, Traditional, Transitional, Victorian, Vintage

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Knob | `_TODO_` |
| Pull | `_TODO_` |
| Handle | `_TODO_` |
| Hinge | `_TODO_` |
| Catch | `_TODO_` |
| Accessory | `_TODO_` |

---

### Garbage Disposal

- **Department**: Plumbing & Bath
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5E6QAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (3):

| Type | Applicable Styles |
|------|-------------------|
| Continuous Feed | `_TODO_` |
| Batch Feed | `_TODO_` |
| Accessory | `_TODO_` |

---

### Kitchen Accessory

- **Department**: Plumbing & Bath
- **Family**: Kitchen
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dC5E8QAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (4):

| Type | Applicable Styles |
|------|-------------------|
| Sink Grid | `_TODO_` |
| Colander | `_TODO_` |
| Cutting Board | `_TODO_` |
| Accessory | `_TODO_` |

---

### Kitchen Faucet

- **Department**: Plumbing & Bath
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5E9QAK`
- **Current style_type**: `configuration` (source: category_specific_mappings)
- **Current styles** (5): 1 Hole, 2 Hole, 3 Hole, 4 Hole, Wall Mounted

**Types** (8):

| Type | Applicable Styles |
|------|-------------------|
| Pull-Down | `_TODO_` |
| Pull-Out | `_TODO_` |
| Single Hole | `_TODO_` |
| Wall Mount | `_TODO_` |
| Bridge | `_TODO_` |
| Commercial | `_TODO_` |
| Two Handle | `_TODO_` |
| Pot Filler | `_TODO_` |

---

### Kitchen Furniture and Decor

- **Department**: Plumbing & Bath
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EAQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Kitchen Island | `_TODO_` |
| Kitchen Cart | `_TODO_` |
| Bar Stool | `_TODO_` |
| Bakers Rack | `_TODO_` |
| Wine Rack | `_TODO_` |
| Buffet | `_TODO_` |
| Accessory | `_TODO_` |

---

### Kitchen Sink

- **Department**: Plumbing & Bath
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EDQA0`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (6): Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional

**Types** (8):

| Type | Applicable Styles |
|------|-------------------|
| Undermount | `_TODO_` |
| Drop-In | `_TODO_` |
| Apron Front | `_TODO_` |
| Single Bowl | `_TODO_` |
| Double Bowl | `_TODO_` |
| Workstation | `_TODO_` |
| Triple Bowl | `_TODO_` |
| Accessory | `_TODO_` |

---

### Kitchen Storage & Organization

- **Department**: Plumbing & Bath
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EEQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Pull-Out Shelf | `_TODO_` |
| Lazy Susan | `_TODO_` |
| Drawer Organizer | `_TODO_` |
| Spice Rack | `_TODO_` |
| Pot Rack | `_TODO_` |
| Trash Pull-Out | `_TODO_` |
| Accessory | `_TODO_` |

---

### Medicine Cabinet

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DqQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (3): Contemporary, Modern, Traditional

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Recessed | `_TODO_` |
| Surface Mount | `_TODO_` |
| Framed | `_TODO_` |
| Frameless | `_TODO_` |
| Lighted | `_TODO_` |
| Accessory | `_TODO_` |

---

### Pipe Fitting

- **Department**: Plumbing & Bath
- **Family**: General
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000eF8O3QAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (8):

| Type | Applicable Styles |
|------|-------------------|
| Elbow | `_TODO_` |
| Tee | `_TODO_` |
| Coupling | `_TODO_` |
| Union | `_TODO_` |
| Nipple | `_TODO_` |
| Adapter | `_TODO_` |
| Connector | `_TODO_` |
| Accessory | `_TODO_` |

---

### Pot Filler Faucet

- **Department**: Plumbing & Bath
- **Family**: Kitchen
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5EHQA0`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (6): Contemporary, Farmhouse, Industrial, Modern, Traditional, Transitional

**Types** (3):

| Type | Applicable Styles |
|------|-------------------|
| Wall Mount | `_TODO_` |
| Deck Mount | `_TODO_` |
| Accessory | `_TODO_` |

---

### Pressure Valve

- **Department**: Plumbing & Bath
- **Family**: Plumbing & Bath
- **styles_apply**: `undefined`
- **Category SF ID**: `a01aZ00000jncNIQAY`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types**: _none defined_

| Type | Applicable Styles |
|------|-------------------|
| _(no types)_ | `_TODO_` |

---

### Rough-In Valve

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dC5DrQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Thermostatic | `_TODO_` |
| Pressure Balance | `_TODO_` |
| Diverter | `_TODO_` |
| Volume Control | `_TODO_` |
| Transfer | `_TODO_` |
| Accessory | `_TODO_` |

---

### Shower

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DuQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (5): Contemporary, Minimalist, Modern, Spa-Like, Traditional

**Types** (8):

| Type | Applicable Styles |
|------|-------------------|
| Alcove | `_TODO_` |
| Corner | `_TODO_` |
| Neo-Angle | `_TODO_` |
| Walk-In | `_TODO_` |
| Barrier-Free | `_TODO_` |
| Freestanding | `_TODO_` |
| Frameless | `_TODO_` |
| Framed | `_TODO_` |

---

### Shower Accessory

- **Department**: Plumbing & Bath
- **Family**: Plumbing & Bath
- **styles_apply**: `undefined`
- **Category SF ID**: `a01aZ00000dC5DsQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types** (15):

| Type | Applicable Styles |
|------|-------------------|
| Shower Arm | `_TODO_` |
| Ceiling Mount | `_TODO_` |
| Slide Bar | `_TODO_` |
| Escutcheon | `_TODO_` |
| Hose | `_TODO_` |
| Valve Extension | `_TODO_` |
| Transfer | `_TODO_` |
| Elbow | `_TODO_` |
| Shelf | `_TODO_` |
| Grab Bar | `_TODO_` |
| Linear | `_TODO_` |
| Floor Drain | `_TODO_` |
| Niche | `_TODO_` |
| Seat | `_TODO_` |
| Riser | `_TODO_` |

---

### Showerheads & Accessories

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DtQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (6): Contemporary, Industrial, Minimalist, Modern, Traditional, Transitional

**Types** (13):

| Type | Applicable Styles |
|------|-------------------|
| Pressure Balance | `_TODO_` |
| Thermostatic | `_TODO_` |
| Thermostatic Valve Trim | `_TODO_` |
| Volume Control | `_TODO_` |
| Diverter | `_TODO_` |
| Trim Only | `_TODO_` |
| Single Function | `_TODO_` |
| Rain Head | `_TODO_` |
| Handheld | `_TODO_` |
| Body Spray | `_TODO_` |
| System | `_TODO_` |
| Exposed | `_TODO_` |
| Waterfall | `_TODO_` |

---

### Steam Shower

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DvQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (4): Contemporary, Luxury, Modern, Spa-Like

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Complete System | `_TODO_` |
| Steam Generator | `_TODO_` |
| Steam Head | `_TODO_` |
| Control Panel | `_TODO_` |
| Accessory | `_TODO_` |

---

### Tankless Water Heater

- **Department**: Plumbing & Bath
- **Family**: General
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dC5DwQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Tankless | `_TODO_` |
| Gas | `_TODO_` |
| Electric | `_TODO_` |
| Condensing | `_TODO_` |
| Point of Use | `_TODO_` |
| Whole House | `_TODO_` |
| Accessory | `_TODO_` |

---

### Toilet

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DyQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (6): Contemporary, Minimalist, Modern, Sleek, Traditional, Transitional

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| One-Piece | `_TODO_` |
| Two-Piece | `_TODO_` |
| Wall-Mounted | `_TODO_` |
| Smart | `_TODO_` |
| Accessory | `_TODO_` |

---

### Toilet Seat

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DxQAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (4): Contemporary, Minimalist, Modern, Traditional

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Soft Close | `_TODO_` |
| Standard | `_TODO_` |
| Heated | `_TODO_` |
| Bidet | `_TODO_` |
| Quick Release | `_TODO_` |
| Accessory | `_TODO_` |

---

### Tub and Shower Accessory

- **Department**: Plumbing & Bath
- **Family**: Plumbing & Bath
- **styles_apply**: `undefined`
- **Category SF ID**: `a01aZ00000dDnKlQAK`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

**Types**: _none defined_

| Type | Applicable Styles |
|------|-------------------|
| _(no types)_ | `_TODO_` |

---

### Tub Filler

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5DzQAK`
- **Current style_type**: `configuration` (source: category_specific_mappings)
- **Current styles** (6): 1 Hole, 2 Hole, 3 Hole, 4 Hole, Wall Mounted, Floor Mounted

**Types** (6):

| Type | Applicable Styles |
|------|-------------------|
| Roman Tub | `_TODO_` |
| Freestanding | `_TODO_` |
| Wall Mounted | `_TODO_` |
| Deck Mount | `_TODO_` |
| Floor Mounted | `_TODO_` |
| Accessory | `_TODO_` |

---

### Urinal

- **Department**: Plumbing & Bath
- **Family**: Bath
- **styles_apply**: `true`
- **Category SF ID**: `a01aZ00000dC5E0QAK`
- **Current style_type**: `aesthetic` (source: category_specific_mappings)
- **Current styles** (2): Contemporary, Modern

**Types** (5):

| Type | Applicable Styles |
|------|-------------------|
| Wall Mount | `_TODO_` |
| Waterless | `_TODO_` |
| Standard | `_TODO_` |
| Urinal | `_TODO_` |
| Accessory | `_TODO_` |

---

### Water Filtration

- **Department**: Plumbing & Bath
- **Family**: Kitchen
- **styles_apply**: `false`
- **Category SF ID**: `a01aZ00000dC5EJQA0`
- **Current style_type**: `aesthetic` (source: universal_styles (fallback))
- **Current styles** (15): Art Deco, Bohemian, Coastal, Contemporary, Farmhouse, Geometric, Industrial, Modern, Rustic, Striped, Traditional, Transitional, Tropical, Victorian, Vintage

> ⚠️ `styles_apply: false` — style does not apply to this category. You may skip.

**Types** (7):

| Type | Applicable Styles |
|------|-------------------|
| Under Sink | `_TODO_` |
| Whole House | `_TODO_` |
| Countertop | `_TODO_` |
| Faucet Mount | `_TODO_` |
| Reverse Osmosis | `_TODO_` |
| Replacement Filter | `_TODO_` |
| Accessory | `_TODO_` |

---
