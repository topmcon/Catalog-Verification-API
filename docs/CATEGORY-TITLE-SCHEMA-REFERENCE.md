# Complete Category Title Schema Reference

> Generated: 2026-03-02
> Total Categories: 162
> Total Schemas: 162

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

## Appliances

### Kitchen

#### Barbeque

**Template:** `{Brand} {Width (Inches)} {BTU} {Fuel Type} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | BTU | ❌ | `-` |
| 4 | Fuel Type | ❌ | `-` |
| 5 | Type | ❌ | `-` |
| 6 | Category | ✅ | `-` |
| 7 | Finish | ❌ | `-` |
| 8 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch 50,000 BTU Barbeque Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Barbeque Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Barbeque Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Barbeque White - PRO-550`

> **SEO Notes:** Width for space, BTU for power. Fuel = Gas, Charcoal, Electric, Pellet.

---

#### Coffee Maker

**Template:** `{Brand} {Type} {Category} {Finish} {Capacity (Cups)} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Capacity (Cups) | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand Countertop Coffee Maker Finish 12-Cup - Model`

**Sample Titles:**
1. `GE Standard Coffee Maker Stainless Steel - ABC-100`
2. `Delta Professional Coffee Maker Matte Black - XYZ-300`
3. `Bosch Premium Coffee Maker White - PRO-550`

> **SEO Notes:** Type = Built-In, Countertop, Espresso, Pod. Capacity at end.

---

#### Cooktop

**Template:** `{Brand} {Width (Inches)} {Burner Count} {Fuel Type} {Category} {Finish} - {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `{value}-Inch` |
| 3 | Burner Count | ❌ | `{value}-Burner` |
| 4 | Fuel Type | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `GE 36-Inch 5-Burner Gas Cooktop Stainless Steel - PGP966SETSS`

**Sample Titles:**
1. `GE 24-Inch Cooktop Stainless Steel - ABC-100`
2. `Delta 30-Inch Cooktop Matte Black - XYZ-300`
3. `Bosch 36-Inch Cooktop White - PRO-550`

> **SEO Notes:** UPDATED v2.4: Removed Installation Type (all cooktops are built-in). Brand, width (30"/36" common), burner count (4/5/6), fuel type (Gas/Electric/Induction) CRITICAL. Model number at END per requirements.

---

#### Dishwasher

**Template:** `{Brand} {Width (Inches)} {Type} {Panel Ready} {Category} {Finish} - {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `{value}-Inch` |
| 3 | Type | ❌ | `-` |
| 4 | Panel Ready | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `BOSCH 24-Inch Top Control Panel Ready Dishwasher - SHV9PT63UC`

**Sample Titles:**
1. `GE 24-Inch Standard Dishwasher Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Dishwasher Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Dishwasher White - PRO-550`

> **SEO Notes:** UPDATED v2.7: Added Panel Ready slot before Category. For panel-ready/integrated/fully integrated dishwashers. Brand, width, type, panel ready (if applicable), category, finish, model.

---

#### Drawer

**Template:** `{Brand} {Width (Inches)} {Type} {Category} {Finish} - {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `GAGGENAU 24-Inch Warming Drawer Stainless Steel - WS261710`

**Sample Titles:**
1. `GE 24-Inch Standard Drawer Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Drawer Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Drawer White - PRO-550`

> **SEO Notes:** Type = Warming, Storage. Width for fit.

---

#### Freezer

**Template:** `{Brand} {Width (Inches)} {Type} {Category} {Finish} {Capacity (Cu. Ft.)} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ✅ | `{value}-Inch` |
| 3 | Type | ✅ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ✅ | `-` |
| 6 | Capacity (Cu. Ft.) | ✅ | `-` |
| 7 | Model Number | ✅ | `-` |

**Schema Example:** `GE 36-Inch Upright Freezer Stainless Steel 28 Cu. Ft. - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Freezer Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Freezer Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Freezer White - PRO-550`

> **SEO Notes:** Type = Upright, Chest, Column, Undercounter, Compact. Capacity at end.

---

#### Icemaker

**Template:** `{Brand} {Width} {Type} {Category} {Finish} - {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width | ❌ | `{value}-Inch` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `U-LINE 15-Inch Undercounter Icemaker Stainless Steel - UACP115-IS01A`

**Sample Titles:**
1. `GE 24-Inch Standard Icemaker Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Icemaker Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Icemaker White - PRO-550`

> **SEO Notes:** Width is key sizing spec for undercounter icemakers. Type = Built-In, Undercounter, Freestanding, Portable.

---

#### Microwave

**Template:** `{Brand} {Width (Inches)} {Type} {Category} {Finish} {Capacity (Cu. Ft.)} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `{value}-Inch` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Capacity (Cu. Ft.) | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Over-the-Range Microwave Finish 2.0 Cu. Ft. - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Microwave Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Microwave Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Microwave White - PRO-550`

> **SEO Notes:** Width for fit (30" or 36" for OTR models to match range). Type = Over-the-Range, Countertop, Built-In, Drawer. Capacity at end.

---

#### Oven

**Template:** `{Brand} {Width (Inches)} {Fuel Type} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ✅ | `-` |
| 3 | Fuel Type | ✅ | `-` |
| 4 | Type | ✅ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ✅ | `-` |
| 7 | Model Number | ✅ | `-` |

**Schema Example:** `GE 30-Inch Electric Double Wall Oven Stainless Steel - JTS3000SNSS`

**Sample Titles:**
1. `GE 24-Inch Standard Oven Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Oven Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Oven White - PRO-550`

> **SEO Notes:** Type = Single, Double Wall, Microwave Combo, Steam, Convection, Speed Oven. Fuel Type = Gas, Electric.

---

#### Pizza Oven

**Template:** `{Brand} {Type} {Fuel Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Fuel Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Pizza Oven Finish - Model`

**Sample Titles:**
1. `GE Standard Pizza Oven Stainless Steel - ABC-100`
2. `Delta Professional Pizza Oven Matte Black - XYZ-300`
3. `Bosch Premium Pizza Oven White - PRO-550`

> **SEO Notes:** Type = Built-In, Countertop, Outdoor. Fuel = Gas, Wood, Electric.

---

#### Range

**Template:** `{Brand} {Width (Inches)} {Type} {Fuel Type} {Installation Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Fuel Type | ❌ | `-` |
| 5 | Installation Type | ❌ | `-` |
| 6 | Category | ✅ | `-` |
| 7 | Finish | ❌ | `-` |
| 8 | Model Number | ❌ | `-` |

**Schema Example:** `Wolf 48-Inch Pro-Style Dual Fuel Slide-In Range Stainless Steel - DF48450G`

**Sample Titles:**
1. `GE 24-Inch Standard Range Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Range Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Range White - PRO-550`

> **SEO Notes:** Type = Pro-Style, Front Control, Rear Control. Fuel Type = Gas, Electric, Dual Fuel, Induction. Installation Type = Slide-In, Freestanding, Drop-In.

---

#### Range Hood

**Template:** `{Brand} {CFM} {Width (Inches)} {Type} {Category} {Finish} - {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | CFM | ❌ | `{value} CFM` |
| 3 | Width (Inches) | ❌ | `{value}-Inch` |
| 4 | Type | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `THERMADOR 600 CFM 36-Inch Wall Mount Range Hood - Stainless Steel - VTI1190B`

**Sample Titles:**
1. `GE 24-Inch Standard Range Hood Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Range Hood Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Range Hood White - PRO-550`

> **SEO Notes:** UPDATED v2.4: Brand first for consistency with other appliances, then CFM (critical spec), width, mount type (Under-Cabinet/Wall Mount/Island/Insert). Model number at END per requirements.

---

#### Refrigerator

**Template:** `{Brand} {Width (Inches)} {Installation Type} {Depth Type} {Panel Ready} {Configuration} {Category} {Finish} {Capacity (Cu. Ft.)} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `{value}-Inch` |
| 3 | Installation Type | ❌ | `-` |
| 4 | Depth Type | ❌ | `-` |
| 5 | Panel Ready | ❌ | `-` |
| 6 | Configuration | ❌ | `-` |
| 7 | Category | ✅ | `-` |
| 8 | Finish | ❌ | `-` |
| 9 | Capacity (Cu. Ft.) | ❌ | `-` |
| 10 | Model Number | ❌ | `-` |

**Schema Example:** `SUBZERO 36-Inch Built-In Panel Ready French Door Refrigerator - BI36UFD`

**Sample Titles:**
1. `GE 24-Inch Refrigerator Stainless Steel - ABC-100`
2. `Delta 30-Inch Refrigerator Matte Black - XYZ-300`
3. `Bosch 36-Inch Refrigerator White - PRO-550`

> **SEO Notes:** UPDATED v2.8: Removed Type slot. Installation Type = Built-In only (omit Freestanding - implied). Depth Type = Counter-Depth only if freestanding (omit for Built-In - always counter-depth, omit for standard depth - implied). Panel Ready if applicable. Configuration = door style.

---

### Laundry

#### All in One Washer / Dryer

**Template:** `{Brand} {Width (Inches)} {Type} {Fuel Type} {Category} {Capacity (Cu. Ft.)} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `{value}-Inch` |
| 3 | Type | ❌ | `-` |
| 4 | Fuel Type | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Capacity (Cu. Ft.) | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 27-Inch Unitized Electric All in One Washer / Dryer 4.5 Cu. Ft. - Model`

**Sample Titles:**
1. `GE 24-Inch Standard All in One Washer / Dryer Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional All in One Washer / Dryer Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium All in One Washer / Dryer White - PRO-550`

> **SEO Notes:** Width for space planning. Type = Unitized, Front Load, Top Load. Fuel Type = Gas, Electric. Capacity at end.

---

#### Dryer

**Template:** `{Brand} {Width (Inches)} {Type} {Fuel Type} {Category} {Capacity (Cu. Ft.)} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `{value}-Inch` |
| 3 | Type | ❌ | `-` |
| 4 | Fuel Type | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Capacity (Cu. Ft.) | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `GE 27-Inch Front Load Electric Dryer 7.5 Cu. Ft. - GTD75ECSLWS`

**Sample Titles:**
1. `GE 24-Inch Standard Dryer Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Dryer Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Dryer White - PRO-550`

> **SEO Notes:** Width for space planning. Type = Front Load, Top Load, Unitized. Fuel Type = Electric, Gas. Capacity at end.

---

#### Standalone Pedestal

**Template:** `{Brand} {Type} {Height (Inches)} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Height (Inches) | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Standalone Pedestal Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Standalone Pedestal Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Standalone Pedestal Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Standalone Pedestal White - PRO-550`

> **SEO Notes:** Type = Sink Pedestal, Pedestal Leg. Height for sink.

---

#### Washer

**Template:** `{Brand} {Width (Inches)} {Type} {Category} {Capacity (Cu. Ft.)} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `{value}-Inch` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Capacity (Cu. Ft.) | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 27-Inch Front Load Washer 5.0 Cu. Ft. - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Washer Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Washer Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Washer White - PRO-550`

> **SEO Notes:** Width for space planning. Type = Front Load, Top Load, Unitized. Capacity at end.

---

## Flooring

### General

#### Carpet

**Template:** `{Brand} {Type} {Width (Feet)} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Width (Feet) | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Carpet Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Carpet Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Carpet Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Carpet White - PRO-550`

> **SEO Notes:** Type = Berber, Plush, Frieze, Looped. Width = roll width or tile size.

---

#### Hardwood Flooring

**Template:** `{Brand} {Plank Width (Inches)} {Species/Look} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Plank Width (Inches) | ❌ | `-` |
| 3 | Species/Look | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Hardwood Flooring Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Hardwood Flooring Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Hardwood Flooring Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Hardwood Flooring White - PRO-550`

> **SEO Notes:** Width = 3", 5", 7"+. Species = Oak, Maple, Hickory, etc.

---

#### Laminate Flooring

**Template:** `{Brand} {Plank Width (Inches)} {Species/Look} {AC Rating} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Plank Width (Inches) | ❌ | `-` |
| 3 | Species/Look | ❌ | `-` |
| 4 | AC Rating | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Laminate Flooring Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Laminate Flooring Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Laminate Flooring Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Laminate Flooring White - PRO-550`

> **SEO Notes:** AC Rating for durability. Species look for aesthetics.

---

#### Luxury Vinyl Flooring

**Template:** `{Brand} {Plank Width (Inches)} {Type} {Wear Layer (mil)} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Plank Width (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Wear Layer (mil) | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Luxury Vinyl Flooring Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Luxury Vinyl Flooring Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Luxury Vinyl Flooring Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Luxury Vinyl Flooring White - PRO-550`

> **SEO Notes:** Type = Plank, Tile. Wear Layer determines durability.

---

#### Tile

**Template:** `{Brand} {Tile Size} {Material} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Tile Size | ❌ | `-` |
| 3 | Material | ❌ | `-` |
| 4 | Type | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Tile Finish - Model`

**Sample Titles:**
1. `GE Standard Tile Stainless Steel - ABC-100`
2. `Delta Professional Tile Matte Black - XYZ-300`
3. `Bosch Premium Tile White - PRO-550`

> **SEO Notes:** Tile Size = 12×24, 6×36, etc. Material = Porcelain, Ceramic, Stone.

---

#### Waterproof Flooring

**Template:** `{Brand} {Plank Width (Inches)} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Plank Width (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Waterproof Flooring Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Waterproof Flooring Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Waterproof Flooring Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Waterproof Flooring White - PRO-550`

> **SEO Notes:** Type = LVP, WPC, SPC. Width for aesthetics.

---

### Kitchen

#### Kitchen Tile

**Template:** `{Brand} {Tile Size} {Material} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Tile Size | ❌ | `-` |
| 3 | Material | ❌ | `-` |
| 4 | Type | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Kitchen Tile Finish - Model`

**Sample Titles:**
1. `GE Standard Kitchen Tile Stainless Steel - ABC-100`
2. `Delta Professional Kitchen Tile Matte Black - XYZ-300`
3. `Bosch Premium Kitchen Tile White - PRO-550`

> **SEO Notes:** Same as Tile, kitchen-specific.

---

## Hardware

### Bath

#### Bathroom Cabinet Hardware

**Template:** `{Brand} {Type} {Length/Diameter} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Length/Diameter | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Bathroom Cabinet Hardware Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Bathroom Cabinet Hardware Stainless Steel - ABC-100`
2. `Delta 30-Inch Bathroom Cabinet Hardware Matte Black - XYZ-300`
3. `Bosch 36-Inch Bathroom Cabinet Hardware White - PRO-550`

> **SEO Notes:** Same as cabinet hardware, bath finishes.

---

### Home Improvement

#### Appliance Pull

**Template:** `{Brand} {Length (Inches)} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Length (Inches) | ❌ | `-` |
| 3 | Style | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Appliance Pull Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Appliance Pull Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Appliance Pull Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Appliance Pull White - PRO-550`

> **SEO Notes:** Longer pulls (12"+) for appliances.

---

#### Backplate

**Template:** `{Brand} {Width (Inches)} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Style | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Backplate Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Backplate Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Backplate Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Backplate White - PRO-550`

> **SEO Notes:** Decorative plate behind knob/lever.

---

#### Barn Door Hardware

**Template:** `{Brand} {Track Length (Feet)} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Track Length (Feet) | ❌ | `-` |
| 3 | Style | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Barn Door Hardware Finish - Model`

**Sample Titles:**
1. `GE Barn Door Hardware Stainless Steel - ABC-100`
2. `Delta Barn Door Hardware Matte Black - XYZ-300`
3. `Bosch Barn Door Hardware White - PRO-550`

> **SEO Notes:** Track length for door width. Style = Modern, Rustic, Industrial.

---

#### Cabinet Catch and Latch

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Cabinet Catch and Latch Finish - Model`

**Sample Titles:**
1. `GE Standard Cabinet Catch and Latch Stainless Steel - ABC-100`
2. `Delta Professional Cabinet Catch and Latch Matte Black - XYZ-300`
3. `Bosch Premium Cabinet Catch and Latch White - PRO-550`

> **SEO Notes:** Type = Magnetic, Roller, Touch, Bullet.

---

#### Cabinet Finishing

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Cabinet Finishing Finish - Model`

**Sample Titles:**
1. `GE Standard Cabinet Finishing Stainless Steel - ABC-100`
2. `Delta Professional Cabinet Finishing Matte Black - XYZ-300`
3. `Bosch Premium Cabinet Finishing White - PRO-550`

> **SEO Notes:** Type = Bumpers, Felt Pads, Plugs, Covers.

---

#### Cabinet Hardware

**Template:** `{Brand} {Type} {Length/Diameter} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Length/Diameter | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Cabinet Hardware Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Cabinet Hardware Stainless Steel - ABC-100`
2. `Delta 30-Inch Cabinet Hardware Matte Black - XYZ-300`
3. `Bosch 36-Inch Cabinet Hardware White - PRO-550`

> **SEO Notes:** Type = Knob, Pull, Bin Pull, Cup Pull, Drop Pull.

---

#### Cabinet Hardware Bulk Pack

**Template:** `{Brand} {Type} {Piece Count} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Piece Count | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Cabinet Hardware Bulk Pack Finish - Model`

**Sample Titles:**
1. `GE Cabinet Hardware Bulk Pack Stainless Steel - ABC-100`
2. `Delta Cabinet Hardware Bulk Pack Matte Black - XYZ-300`
3. `Bosch Cabinet Hardware Bulk Pack White - PRO-550`

> **SEO Notes:** Type + quantity. Usually 10-pack or 25-pack.

---

#### Cabinet Hardware Mounting Template

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Cabinet Hardware Mounting Template Finish - Model`

**Sample Titles:**
1. `GE Cabinet Hardware Mounting Template Stainless Steel - ABC-100`
2. `Delta Cabinet Hardware Mounting Template Matte Black - XYZ-300`
3. `Bosch Cabinet Hardware Mounting Template White - PRO-550`

> **SEO Notes:** Type = Universal, Specific Spacing.

---

#### Cabinet Hinge

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Cabinet Hinge Finish - Model`

**Sample Titles:**
1. `GE Standard Cabinet Hinge Stainless Steel - ABC-100`
2. `Delta Professional Cabinet Hinge Matte Black - XYZ-300`
3. `Bosch Premium Cabinet Hinge White - PRO-550`

> **SEO Notes:** Type = Concealed, Surface-Mount, Overlay, Inset.

---

#### Cabinet Knob

**Template:** `{Brand} {Diameter (Inches)} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Diameter (Inches) | ❌ | `-` |
| 3 | Style | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Cabinet Knob Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Cabinet Knob Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Cabinet Knob Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Cabinet Knob White - PRO-550`

> **SEO Notes:** Diameter typically 1.25" to 1.5". Style drives selection.

---

#### Cabinet Lock

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Cabinet Lock Finish - Model`

**Sample Titles:**
1. `GE Standard Cabinet Lock Stainless Steel - ABC-100`
2. `Delta Professional Cabinet Lock Matte Black - XYZ-300`
3. `Bosch Premium Cabinet Lock White - PRO-550`

> **SEO Notes:** Type = Cam Lock, Drawer Lock, Magnetic, Keyed.

---

#### Cabinet Organization and Storage

**Template:** `{Brand} {Type} {Dimensions} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Dimensions | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Cabinet Organization and Storage Finish - Model`

**Sample Titles:**
1. `GE Standard Cabinet Organization and Storage Stainless Steel - ABC-100`
2. `Delta Professional Cabinet Organization and Storage Matte Black - XYZ-300`
3. `Bosch Premium Cabinet Organization and Storage White - PRO-550`

> **SEO Notes:** Type = Pull-Out Shelf, Lazy Susan, Drawer Organizer, Trash Can.

---

#### Cabinet Pull

**Template:** `{Brand} {Length (Inches)} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Length (Inches) | ❌ | `-` |
| 3 | Style | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Cabinet Pull Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Cabinet Pull Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Cabinet Pull Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Cabinet Pull White - PRO-550`

> **SEO Notes:** Length = center-to-center spacing. Common: 3", 4", 5", 6".

---

#### Closet and Pocket Door Hardware

**Template:** `{Brand} {Type} {Track Length (Feet)} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Track Length (Feet) | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Closet and Pocket Door Hardware Finish - Model`

**Sample Titles:**
1. `GE Closet and Pocket Door Hardware Stainless Steel - ABC-100`
2. `Delta Closet and Pocket Door Hardware Matte Black - XYZ-300`
3. `Bosch Closet and Pocket Door Hardware White - PRO-550`

> **SEO Notes:** Type = Pocket, Bifold, Bypass. Track length for fit.

---

#### Commercial Door Hardware

**Template:** `{Brand} {Type} {Function} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Function | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Commercial Door Hardware Finish - Model`

**Sample Titles:**
1. `GE Commercial Door Hardware Stainless Steel - ABC-100`
2. `Delta Commercial Door Hardware Matte Black - XYZ-300`
3. `Bosch Commercial Door Hardware White - PRO-550`

> **SEO Notes:** Type = Exit Device, Panic Bar, Closer, Mortise Lock.

---

#### Deadbolt

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Deadbolt Finish - Model`

**Sample Titles:**
1. `GE Standard Deadbolt Stainless Steel - ABC-100`
2. `Delta Professional Deadbolt Matte Black - XYZ-300`
3. `Bosch Premium Deadbolt White - PRO-550`

> **SEO Notes:** Type = Single Cylinder, Double Cylinder, Keyless, Smart.

---

#### Designer Cabinet Hardware

**Template:** `{Brand} {Type} {Collection} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Collection | ❌ | `-` |
| 4 | Style | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Designer Cabinet Hardware Finish - Model`

**Sample Titles:**
1. `GE Designer Cabinet Hardware Stainless Steel - ABC-100`
2. `Delta Designer Cabinet Hardware Matte Black - XYZ-300`
3. `Bosch Designer Cabinet Hardware White - PRO-550`

> **SEO Notes:** Premium segment. Collection-driven.

---

#### Door

**Template:** `{Brand} {Width (Inches)} {Height (Inches)} {Type} {Material} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Height (Inches) | ❌ | `-` |
| 4 | Type | ❌ | `-` |
| 5 | Material | ❌ | `-` |
| 6 | Category | ✅ | `-` |
| 7 | Finish | ❌ | `-` |
| 8 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch 30-Inch Door Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Door Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Door Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Door White - PRO-550`

> **SEO Notes:** Width × Height for opening. Type = Interior, Exterior, Bifold, Sliding.

---

#### Door Entry Set

**Template:** `{Brand} {Type} {Function} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Function | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Door Entry Set Finish - Model`

**Sample Titles:**
1. `GE Standard Door Entry Set Stainless Steel - ABC-100`
2. `Delta Professional Door Entry Set Matte Black - XYZ-300`
3. `Bosch Premium Door Entry Set White - PRO-550`

> **SEO Notes:** Same as Entry Set.

---

#### Door Hardware Part

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Door Hardware Part Finish - Model`

**Sample Titles:**
1. `GE Door Hardware Part Stainless Steel - ABC-100`
2. `Delta Door Hardware Part Matte Black - XYZ-300`
3. `Bosch Door Hardware Part White - PRO-550`

> **SEO Notes:** Type = Strike Plate, Latchbolt, Spindle, Rosette.

---

#### Door Hardware: Knob and Lever

**Template:** `{Brand} {Type} {Function} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Function | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Door Hardware: Knob and Lever Finish - Model`

**Sample Titles:**
1. `GE Door Hardware: Knob and Lever Stainless Steel - ABC-100`
2. `Delta Door Hardware: Knob and Lever Matte Black - XYZ-300`
3. `Bosch Door Hardware: Knob and Lever White - PRO-550`

> **SEO Notes:** Combined category. Type + function.

---

#### Door Hinge

**Template:** `{Brand} {Size (Inches)} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Size (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Door Hinge Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Door Hinge Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Door Hinge Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Door Hinge White - PRO-550`

> **SEO Notes:** Size = 3.5", 4", 4.5". Type = Full Mortise, Half Mortise, Surface.

---

#### Door Knob

**Template:** `{Brand} {Type} {Function} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Function | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Door Knob Finish - Model`

**Sample Titles:**
1. `GE Standard Door Knob Stainless Steel - ABC-100`
2. `Delta Professional Door Knob Matte Black - XYZ-300`
3. `Bosch Premium Door Knob White - PRO-550`

> **SEO Notes:** Type = Passage, Privacy, Dummy, Keyed. Function critical.

---

#### Door Lever

**Template:** `{Brand} {Type} {Function} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Function | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Door Lever Finish - Model`

**Sample Titles:**
1. `GE Standard Door Lever Stainless Steel - ABC-100`
2. `Delta Professional Door Lever Matte Black - XYZ-300`
3. `Bosch Premium Door Lever White - PRO-550`

> **SEO Notes:** Type = Passage, Privacy, Dummy, Keyed. Function critical.

---

#### Drawer Slide and Accessory

**Template:** `{Brand} {Length (Inches)} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Length (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Drawer Slide and Accessory Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Drawer Slide and Accessory Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Drawer Slide and Accessory Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Drawer Slide and Accessory White - PRO-550`

> **SEO Notes:** Length determines extension. Type = Side-Mount, Under-Mount, Center-Mount.

---

#### Handleset

**Template:** `{Brand} {Type} {Function} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Function | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Handleset Finish - Model`

**Sample Titles:**
1. `GE Standard Handleset Stainless Steel - ABC-100`
2. `Delta Professional Handleset Matte Black - XYZ-300`
3. `Bosch Premium Handleset White - PRO-550`

> **SEO Notes:** Type = Entry, Dummy. Includes exterior grip + interior lever/knob.

---

#### Keyed Hardware

**Template:** `{Brand} {Type} {Function} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Function | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Keyed Hardware Finish - Model`

**Sample Titles:**
1. `GE Keyed Hardware Stainless Steel - ABC-100`
2. `Delta Keyed Hardware Matte Black - XYZ-300`
3. `Bosch Keyed Hardware White - PRO-550`

> **SEO Notes:** Type = Keyed Entry, Keyed Knob, Keyed Lever.

---

#### Keyless Entry

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Keyless Entry Finish - Model`

**Sample Titles:**
1. `GE Standard Keyless Entry Stainless Steel - ABC-100`
2. `Delta Professional Keyless Entry Matte Black - XYZ-300`
3. `Bosch Premium Keyless Entry White - PRO-550`

> **SEO Notes:** Type = Keypad, Smart Lock, Biometric, RFID.

---

#### Lock Combo Pack

**Template:** `{Brand} {Type} {Piece Count} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Piece Count | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Lock Combo Pack Finish - Model`

**Sample Titles:**
1. `GE Standard Lock Combo Pack Stainless Steel - ABC-100`
2. `Delta Professional Lock Combo Pack Matte Black - XYZ-300`
3. `Bosch Premium Lock Combo Pack White - PRO-550`

> **SEO Notes:** Multiple locks in package. Type + count.

---

#### Mortise Lock

**Template:** `{Brand} {Type} {Function} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Function | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Mortise Lock Finish - Model`

**Sample Titles:**
1. `GE Standard Mortise Lock Stainless Steel - ABC-100`
2. `Delta Professional Mortise Lock Matte Black - XYZ-300`
3. `Bosch Premium Mortise Lock White - PRO-550`

> **SEO Notes:** Commercial-grade. Type = Entry, Privacy, Passage.

---

#### Multi Point Door Hardware

**Template:** `{Brand} {Type} {Length (Inches)} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Length (Inches) | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Multi Point Door Hardware Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Multi Point Door Hardware Stainless Steel - ABC-100`
2. `Delta 30-Inch Multi Point Door Hardware Matte Black - XYZ-300`
3. `Bosch 36-Inch Multi Point Door Hardware White - PRO-550`

> **SEO Notes:** Type = Active, Passive, Multipoint Lock. Height for tall doors.

---

#### Safe, Lock and Lock Box

**Template:** `{Brand} {Type} {Size (L×W×D)} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Size (L×W×D) | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Safe, Lock and Lock Box Finish - Model`

**Sample Titles:**
1. `GE Standard Safe, Lock and Lock Box Stainless Steel - ABC-100`
2. `Delta Professional Safe, Lock and Lock Box Matte Black - XYZ-300`
3. `Bosch Premium Safe, Lock and Lock Box White - PRO-550`

> **SEO Notes:** Type = Floor Safe, Wall Safe, Lock Box, Gun Safe.

---

#### Safety & Security

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Safety & Security Finish - Model`

**Sample Titles:**
1. `GE Standard Safety & Security Stainless Steel - ABC-100`
2. `Delta Professional Safety & Security Matte Black - XYZ-300`
3. `Bosch Premium Safety & Security White - PRO-550`

> **SEO Notes:** Type = Alarm, Camera, Lock, Safe, Fire Extinguisher.

---

#### Screen and Storm Door Hardware

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Screen and Storm Door Hardware Finish - Model`

**Sample Titles:**
1. `GE Screen and Storm Door Hardware Stainless Steel - ABC-100`
2. `Delta Screen and Storm Door Hardware Matte Black - XYZ-300`
3. `Bosch Screen and Storm Door Hardware White - PRO-550`

> **SEO Notes:** Type = Closer, Latch, Handle, Hinge.

---

#### Sliding Door Hardware

**Template:** `{Brand} {Track Length (Feet)} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Track Length (Feet) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Sliding Door Hardware Finish - Model`

**Sample Titles:**
1. `GE Sliding Door Hardware Stainless Steel - ABC-100`
2. `Delta Sliding Door Hardware Matte Black - XYZ-300`
3. `Bosch Sliding Door Hardware White - PRO-550`

> **SEO Notes:** Type = Barn, Pocket, Bypass, Telescoping.

---

#### Storage and Organization

**Template:** `{Brand} {Type} {Dimensions} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Dimensions | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Storage and Organization Finish - Model`

**Sample Titles:**
1. `GE Standard Storage and Organization Stainless Steel - ABC-100`
2. `Delta Professional Storage and Organization Matte Black - XYZ-300`
3. `Bosch Premium Storage and Organization White - PRO-550`

> **SEO Notes:** Type = Shelf, Bin, Basket, Rack, Organizer.

---

#### Vanity Cabinet Hardware

**Template:** `{Brand} {Type} {Length/Diameter} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Length/Diameter | ❌ | `-` |
| 4 | Style | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Vanity Cabinet Hardware Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Vanity Cabinet Hardware Stainless Steel - ABC-100`
2. `Delta 30-Inch Vanity Cabinet Hardware Matte Black - XYZ-300`
3. `Bosch 36-Inch Vanity Cabinet Hardware White - PRO-550`

> **SEO Notes:** Type = Knob, Pull. Bath finishes common.

---

## Heating & Cooling

### General

#### Tankless Water Heater

**Template:** `{Brand} {GPM/BTU} {Fuel Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | GPM/BTU | ❌ | `-` |
| 3 | Fuel Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 50,000 BTU Tankless Water Heater Finish - Model`

**Sample Titles:**
1. `GE Standard Tankless Water Heater Stainless Steel - ABC-100`
2. `Delta Professional Tankless Water Heater Matte Black - XYZ-300`
3. `Bosch Premium Tankless Water Heater White - PRO-550`

> **SEO Notes:** GPM determines flow rate. Fuel = Gas, Electric.

---

#### Water Heater

**Template:** `{Brand} {Fuel Type} {Category} {Finish} {Capacity (Gallons)} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Fuel Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Capacity (Gallons) | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand Gas Water Heater Finish 50-Gallon - Model`

**Sample Titles:**
1. `GE Standard Water Heater Stainless Steel - ABC-100`
2. `Delta Professional Water Heater Matte Black - XYZ-300`
3. `Bosch Premium Water Heater White - PRO-550`

> **SEO Notes:** Fuel type primary. Capacity at end.

---

### HVAC

#### Air Conditioner

**Template:** `{Brand} {Tonnage/BTU} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Tonnage/BTU | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 50,000 BTU Air Conditioner Finish - Model`

**Sample Titles:**
1. `GE Standard Air Conditioner Stainless Steel - ABC-100`
2. `Delta Professional Air Conditioner Matte Black - XYZ-300`
3. `Bosch Premium Air Conditioner White - PRO-550`

> **SEO Notes:** BTU/Tonnage for room size. Type = Window, Portable, Mini Split, Central.

---

#### Air Filter

**Template:** `{Brand} {MERV Rating} {Size (W×H)} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | MERV Rating | ❌ | `-` |
| 3 | Size (W×H) | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Air Filter Finish - Model`

**Sample Titles:**
1. `GE Standard Air Filter Stainless Steel - ABC-100`
2. `Delta Professional Air Filter Matte Black - XYZ-300`
3. `Bosch Premium Air Filter White - PRO-550`

> **SEO Notes:** MERV rating determines filtration level. Size must match system.

---

#### Commercial HVAC

**Template:** `{Brand} {Tonnage/BTU} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Tonnage/BTU | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 50,000 BTU Commercial HVAC Finish - Model`

**Sample Titles:**
1. `GE Standard Commercial HVAC Stainless Steel - ABC-100`
2. `Delta Professional Commercial HVAC Matte Black - XYZ-300`
3. `Bosch Premium Commercial HVAC White - PRO-550`

> **SEO Notes:** Type = Rooftop Unit, Split System, VRF, Chiller.

---

#### Dehumidifier

**Template:** `{Brand} {Type} {Category} {Finish} {Capacity (Pints)} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Capacity (Pints) | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand Portable Dehumidifier Finish 50-Pint - Model`

**Sample Titles:**
1. `GE Standard Dehumidifier Stainless Steel - ABC-100`
2. `Delta Professional Dehumidifier Matte Black - XYZ-300`
3. `Bosch Premium Dehumidifier White - PRO-550`

> **SEO Notes:** Type = Portable, Whole-House. Capacity (pints/day) at end.

---

#### Ducting

**Template:** `{Brand} {Diameter (Inches)} {Type} {Length (Feet)} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Diameter (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Length (Feet) | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Ducting Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Ducting Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Ducting Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Ducting White - PRO-550`

> **SEO Notes:** Diameter matches system. Type = Rigid, Flexible, Insulated.

---

#### Evaporative Cooler

**Template:** `{Brand} {CFM} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | CFM | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 400 CFM Evaporative Cooler Finish - Model`

**Sample Titles:**
1. `GE Standard Evaporative Cooler Stainless Steel - ABC-100`
2. `Delta Professional Evaporative Cooler Matte Black - XYZ-300`
3. `Bosch Premium Evaporative Cooler White - PRO-550`

> **SEO Notes:** CFM for area coverage. Type = Portable, Window, Ducted.

---

#### Exhaust Fan

**Template:** `{Brand} {CFM} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | CFM | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 400 CFM Exhaust Fan Finish - Model`

**Sample Titles:**
1. `GE Standard Exhaust Fan Stainless Steel - ABC-100`
2. `Delta Professional Exhaust Fan Matte Black - XYZ-300`
3. `Bosch Premium Exhaust Fan White - PRO-550`

> **SEO Notes:** CFM determines air movement. Type = Wall, Ceiling, Inline.

---

#### HVAC Accessory

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue HVAC Accessory Finish - Model`

**Sample Titles:**
1. `GE Standard HVAC Accessory Stainless Steel - ABC-100`
2. `Delta Professional HVAC Accessory Matte Black - XYZ-300`
3. `Bosch Premium HVAC Accessory White - PRO-550`

> **SEO Notes:** Type = Grille, Register, Diffuser, Humidistat, Control.

---

#### Mini Split Air Conditioner

**Template:** `{Brand} {Tonnage/BTU} {Zone Config} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Tonnage/BTU | ❌ | `-` |
| 3 | Zone Config | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 50,000 BTU Mini Split Air Conditioner Finish - Model`

**Sample Titles:**
1. `GE Standard Mini Split Air Conditioner Stainless Steel - ABC-100`
2. `Delta Professional Mini Split Air Conditioner Matte Black - XYZ-300`
3. `Bosch Premium Mini Split Air Conditioner White - PRO-550`

> **SEO Notes:** BTU for capacity. Zone = Single, Multi (2-zone, 3-zone, etc.).

---

#### Room Heater

**Template:** `{Brand} {BTU/Watts} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | BTU/Watts | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 50,000 BTU Room Heater Finish - Model`

**Sample Titles:**
1. `GE Standard Room Heater Stainless Steel - ABC-100`
2. `Delta Professional Room Heater Matte Black - XYZ-300`
3. `Bosch Premium Room Heater White - PRO-550`

> **SEO Notes:** Type = Electric, Gas, Propane, Kerosene. Portable or fixed.

---

#### Skylight

**Template:** `{Brand} {Dimensions (W×H)} {Type} {Glazing} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Dimensions (W×H) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Glazing | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Skylight Finish - Model`

**Sample Titles:**
1. `GE Standard Skylight Stainless Steel - ABC-100`
2. `Delta Professional Skylight Matte Black - XYZ-300`
3. `Bosch Premium Skylight White - PRO-550`

> **SEO Notes:** Dimensions for fit. Type = Fixed, Venting, Tubular.

---

#### Stove and Chimney Pipe

**Template:** `{Brand} {Diameter (Inches)} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Diameter (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Stove and Chimney Pipe Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Stove and Chimney Pipe Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Stove and Chimney Pipe Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Stove and Chimney Pipe White - PRO-550`

> **SEO Notes:** Type = Single Wall, Double Wall, Insulated. Diameter for stove.

---

#### Stove and Fireplace

**Template:** `{Brand} {BTU} {Fuel Type} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | BTU | ❌ | `-` |
| 3 | Fuel Type | ❌ | `-` |
| 4 | Type | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 50,000 BTU Stove and Fireplace Finish - Model`

**Sample Titles:**
1. `GE Standard Stove and Fireplace Stainless Steel - ABC-100`
2. `Delta Professional Stove and Fireplace Matte Black - XYZ-300`
3. `Bosch Premium Stove and Fireplace White - PRO-550`

> **SEO Notes:** Type = Wood Stove, Pellet Stove, Gas Fireplace, Electric Fireplace.

---

#### Thermostat

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Thermostat Finish - Model`

**Sample Titles:**
1. `GE Standard Thermostat Stainless Steel - ABC-100`
2. `Delta Professional Thermostat Matte Black - XYZ-300`
3. `Bosch Premium Thermostat White - PRO-550`

> **SEO Notes:** Type = Programmable, Smart, Non-Programmable, Manual.

---

### Outdoor

#### Patio Heater

**Template:** `{Brand} {BTU} {Fuel Type} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | BTU | ❌ | `-` |
| 3 | Fuel Type | ❌ | `-` |
| 4 | Type | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 50,000 BTU Patio Heater Finish - Model`

**Sample Titles:**
1. `GE Standard Patio Heater Stainless Steel - ABC-100`
2. `Delta Professional Patio Heater Matte Black - XYZ-300`
3. `Bosch Premium Patio Heater White - PRO-550`

> **SEO Notes:** BTU for heat output. Type = Freestanding, Tabletop, Wall-Mount, Ceiling-Mount.

---

## Home Décor & Furniture

### Furniture

#### Chair

**Template:** `{Brand} {Type} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Style | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Chair Finish - Model`

**Sample Titles:**
1. `GE Standard Chair Stainless Steel - ABC-100`
2. `Delta Professional Chair Matte Black - XYZ-300`
3. `Bosch Premium Chair White - PRO-550`

> **SEO Notes:** Type = Dining, Accent, Office, Bar Stool, Rocking.

---

### Home Improvement

#### Mirror

**Template:** `{Brand} {Width×Height} {Type} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width×Height | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Style | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Mirror Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Mirror Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Mirror Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Mirror White - PRO-550`

> **SEO Notes:** Dimensions for space. Type = Wall, Floor, Vanity.

---

#### Rug

**Template:** `{Brand} {Size (W×L)} {Style} {Material} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Size (W×L) | ❌ | `-` |
| 3 | Style | ❌ | `-` |
| 4 | Material | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Rug Finish - Model`

**Sample Titles:**
1. `GE Standard Rug Stainless Steel - ABC-100`
2. `Delta Professional Rug Matte Black - XYZ-300`
3. `Bosch Premium Rug White - PRO-550`

> **SEO Notes:** Size critical for room fit. Common: 5×7, 8×10, 9×12.

---

#### Wall Decor

**Template:** `{Brand} {Type} {Dimensions} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Dimensions | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Wall Decor Finish - Model`

**Sample Titles:**
1. `GE Standard Wall Decor Stainless Steel - ABC-100`
2. `Delta Professional Wall Decor Matte Black - XYZ-300`
3. `Bosch Premium Wall Decor White - PRO-550`

> **SEO Notes:** Type = Art, Mirror, Shelf, Clock.

---

## Industrial & Commercial

### General

#### Chemicals & Compounds

**Template:** `{Brand} {Type} {Size/Volume} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Size/Volume | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Chemicals & Compounds Finish - Model`

**Sample Titles:**
1. `GE Standard Chemicals & Compounds Stainless Steel - ABC-100`
2. `Delta Professional Chemicals & Compounds Matte Black - XYZ-300`
3. `Bosch Premium Chemicals & Compounds White - PRO-550`

> **SEO Notes:** Type = Cleaner, Adhesive, Sealant, Paint.

---

#### Commercial Restroom

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Commercial Restroom Finish - Model`

**Sample Titles:**
1. `GE Standard Commercial Restroom Stainless Steel - ABC-100`
2. `Delta Professional Commercial Restroom Matte Black - XYZ-300`
3. `Bosch Premium Commercial Restroom White - PRO-550`

> **SEO Notes:** Type = Toilet, Urinal, Sink, Faucet, Partition, Dispenser.

---

#### Hydronic Expansion Tank

**Template:** `{Brand} {AC Rating} {Category} {Finish} {Capacity (Gallons)} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | AC Rating | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Capacity (Gallons) | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand Hydronic Expansion Tank Finish 10-Gallon - Model`

**Sample Titles:**
1. `GE Standard Hydronic Expansion Tank Stainless Steel - ABC-100`
2. `Delta Professional Hydronic Expansion Tank Matte Black - XYZ-300`
3. `Bosch Premium Hydronic Expansion Tank White - PRO-550`

> **SEO Notes:** AC rating for compatibility. Capacity at end.

---

#### Industrial Strainer

**Template:** `{Brand} {Type} {Connection Size} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Connection Size | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Industrial Strainer Finish - Model`

**Sample Titles:**
1. `GE Standard Industrial Strainer Stainless Steel - ABC-100`
2. `Delta Professional Industrial Strainer Matte Black - XYZ-300`
3. `Bosch Premium Industrial Strainer White - PRO-550`

> **SEO Notes:** Type = Floor, Sink, Basket. Connection matches drain.

---

#### Water Fountain

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Water Fountain Finish - Model`

**Sample Titles:**
1. `GE Standard Water Fountain Stainless Steel - ABC-100`
2. `Delta Professional Water Fountain Matte Black - XYZ-300`
3. `Bosch Premium Water Fountain White - PRO-550`

> **SEO Notes:** Type = Wall-Mount, Floor-Standing, Bottle-Filler.

---

## Lighting & Electrical

### Bath

#### Bathroom Lighting

**Template:** `{Brand} {Width (Inches)} {Light Count} {Type} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Light Count | ❌ | `-` |
| 4 | Type | ❌ | `-` |
| 5 | Style | ❌ | `-` |
| 6 | Category | ✅ | `-` |
| 7 | Finish | ❌ | `-` |
| 8 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch SpecValue Bathroom Lighting Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Bathroom Lighting Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Bathroom Lighting Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Bathroom Lighting White - PRO-550`

> **SEO Notes:** Type = Vanity, Sconce, Ceiling. Width for vanity lights.

---

#### Vanity Lighting

**Template:** `{Brand} {Width (Inches)} {Light Count} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Light Count | ❌ | `-` |
| 4 | Style | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch SpecValue Vanity Lighting Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Vanity Lighting Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Vanity Lighting Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Vanity Lighting White - PRO-550`

> **SEO Notes:** Width matches vanity. Light count for coverage.

---

### General

#### Air Circulator

**Template:** `{Brand} {CFM} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | CFM | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 400 CFM Air Circulator Finish - Model`

**Sample Titles:**
1. `GE Standard Air Circulator Stainless Steel - ABC-100`
2. `Delta Professional Air Circulator Matte Black - XYZ-300`
3. `Bosch Premium Air Circulator White - PRO-550`

> **SEO Notes:** CFM determines air movement. Type = Pedestal, Tower, Box.

---

#### Attic Fan

**Template:** `{Brand} {CFM} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | CFM | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 400 CFM Attic Fan Finish - Model`

**Sample Titles:**
1. `GE Standard Attic Fan Stainless Steel - ABC-100`
2. `Delta Professional Attic Fan Matte Black - XYZ-300`
3. `Bosch Premium Attic Fan White - PRO-550`

> **SEO Notes:** CFM for attic ventilation. Type = Powered, Solar, Wind-Driven.

---

#### Ceiling Fan

**Template:** `{Brand} {Blade Span (Inches)} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Blade Span (Inches) | ❌ | `-` |
| 3 | Style | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Ceiling Fan Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Ceiling Fan Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Ceiling Fan Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Ceiling Fan White - PRO-550`

> **SEO Notes:** Blade span determines room size coverage. 52" most common.

---

#### Chandelier

**Template:** `{Brand} {Diameter (Inches)} {Light Count} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Diameter (Inches) | ❌ | `-` |
| 3 | Light Count | ❌ | `-` |
| 4 | Style | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch SpecValue Chandelier Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Chandelier Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Chandelier Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Chandelier White - PRO-550`

> **SEO Notes:** Diameter + light count are top filters. Style = Modern, Traditional, Transitional.

---

#### Commercial Lighting

**Template:** `{Brand} {Type} {Wattage} {Light Count} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Wattage | ❌ | `-` |
| 4 | Light Count | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Commercial Lighting Finish - Model`

**Sample Titles:**
1. `GE Standard Commercial Lighting Stainless Steel - ABC-100`
2. `Delta Professional Commercial Lighting Matte Black - XYZ-300`
3. `Bosch Premium Commercial Lighting White - PRO-550`

> **SEO Notes:** Type = High Bay, Troffer, Panel, Strip. Wattage for brightness.

---

#### LED Lighting

**Template:** `{Brand} {Type} {Wattage} {Color Temp} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Wattage | ❌ | `-` |
| 4 | Color Temp | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue LED Lighting Finish - Model`

**Sample Titles:**
1. `GE Standard LED Lighting Stainless Steel - ABC-100`
2. `Delta Professional LED Lighting Matte Black - XYZ-300`
3. `Bosch Premium LED Lighting White - PRO-550`

> **SEO Notes:** Type determines application. Color Temp = 2700K, 3000K, 4000K, 5000K.

---

#### Light Bulbs

**Template:** `{Brand} {Type} {Wattage Equivalent} {Bulb Type} {Color Temp} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Wattage Equivalent | ❌ | `-` |
| 4 | Bulb Type | ❌ | `-` |
| 5 | Color Temp | ❌ | `-` |
| 6 | Category | ✅ | `-` |
| 7 | Finish | ❌ | `-` |
| 8 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue SpecValue Light Bulbs Finish - Model`

**Sample Titles:**
1. `GE Standard Light Bulbs Stainless Steel - ABC-100`
2. `Delta Professional Light Bulbs Matte Black - XYZ-300`
3. `Bosch Premium Light Bulbs White - PRO-550`

> **SEO Notes:** Type = LED, CFL, Incandescent, Halogen. Wattage Equivalent for brightness.

---

#### Light Switches & Dimmers

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Light Switches & Dimmers Finish - Model`

**Sample Titles:**
1. `GE Standard Light Switches & Dimmers Stainless Steel - ABC-100`
2. `Delta Professional Light Switches & Dimmers Matte Black - XYZ-300`
3. `Bosch Premium Light Switches & Dimmers White - PRO-550`

> **SEO Notes:** Type = Standard, Dimmer, Smart, Motion-Sensor, Timer.

---

#### Lighting Accessory

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Lighting Accessory Finish - Model`

**Sample Titles:**
1. `GE Standard Lighting Accessory Stainless Steel - ABC-100`
2. `Delta Professional Lighting Accessory Matte Black - XYZ-300`
3. `Bosch Premium Lighting Accessory White - PRO-550`

> **SEO Notes:** Type = Shade, Bulb, Dimmer, Transformer, Mounting Hardware.

---

#### Post Light

**Template:** `{Brand} {Height (Inches)} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Height (Inches) | ❌ | `-` |
| 3 | Style | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Post Light Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Post Light Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Post Light Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Post Light White - PRO-550`

> **SEO Notes:** Height determines visibility. Style for matching.

---

#### Recessed Lighting

**Template:** `{Brand} {Aperture (Inches)} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Aperture (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Recessed Lighting Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Recessed Lighting Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Recessed Lighting Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Recessed Lighting White - PRO-550`

> **SEO Notes:** Aperture = 4", 6", 8". Type = New Construction, Remodel.

---

#### Step Lighting

**Template:** `{Brand} {Type} {Width (Inches)} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Width (Inches) | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Step Lighting Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Step Lighting Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Step Lighting Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Step Lighting White - PRO-550`

> **SEO Notes:** Type = Wall-Mount, Recessed. For stairs/walkways.

---

#### Track and Rail Lighting

**Template:** `{Brand} {Track Length (Feet)} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Track Length (Feet) | ❌ | `-` |
| 3 | Style | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Track and Rail Lighting Finish - Model`

**Sample Titles:**
1. `GE Standard Track and Rail Lighting Stainless Steel - ABC-100`
2. `Delta Professional Track and Rail Lighting Matte Black - XYZ-300`
3. `Bosch Premium Track and Rail Lighting White - PRO-550`

> **SEO Notes:** Track length determines coverage.

---

#### Under Cabinet Light

**Template:** `{Brand} {Length (Inches)} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Length (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Under Cabinet Light Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Under Cabinet Light Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Under Cabinet Light Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Under Cabinet Light White - PRO-550`

> **SEO Notes:** Length matches cabinet. Type = LED Strip, Puck, Bar.

---

#### Wall Sconce

**Template:** `{Brand} {Style} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Style | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Wall Sconce Finish - Model`

**Sample Titles:**
1. `GE Standard Wall Sconce Stainless Steel - ABC-100`
2. `Delta Professional Wall Sconce Matte Black - XYZ-300`
3. `Bosch Premium Wall Sconce White - PRO-550`

> **SEO Notes:** Type = Fixed, Swing-Arm, Up/Down. Style + type key.

---

### Home Improvement

#### Lamp

**Template:** `{Brand} {Type} {Height (Inches)} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Height (Inches) | ❌ | `-` |
| 4 | Style | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Lamp Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Lamp Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Lamp Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Lamp White - PRO-550`

> **SEO Notes:** Type = Table, Floor, Desk, Buffet.

---

### Indoor Lighting

#### Ceiling Light

**Template:** `{Brand} {Diameter (Inches)} {Type} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Diameter (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Style | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Ceiling Light Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Ceiling Light Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Ceiling Light Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Ceiling Light White - PRO-550`

> **SEO Notes:** Type = Flush Mount, Semi-Flush. Style key differentiator.

---

#### Flush and Semi-Flush

**Template:** `{Brand} {Diameter (Inches)} {Type} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Diameter (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Style | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Flush and Semi-Flush Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Flush and Semi-Flush Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Flush and Semi-Flush Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Flush and Semi-Flush White - PRO-550`

> **SEO Notes:** Type = Flush, Semi-Flush. Diameter for room size.

---

#### Island Lighting

**Template:** `{Brand} {Width (Inches)} {Light Count} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Light Count | ❌ | `-` |
| 4 | Style | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch SpecValue Island Lighting Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Island Lighting Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Island Lighting Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Island Lighting White - PRO-550`

> **SEO Notes:** Width/length must fit island. Multi-light or linear common.

---

#### Pendant

**Template:** `{Brand} {Diameter (Inches)} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Diameter (Inches) | ❌ | `-` |
| 3 | Style | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Pendant Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Pendant Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Pendant Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Pendant White - PRO-550`

> **SEO Notes:** Diameter + style drive search. Mini-pendants common.

---

### Kitchen

#### Kitchen Lighting

**Template:** `{Brand} {Type} {Width (Inches)} {Light Count} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Width (Inches) | ❌ | `-` |
| 4 | Light Count | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Kitchen Lighting Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Kitchen Lighting Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Kitchen Lighting Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Kitchen Lighting White - PRO-550`

> **SEO Notes:** Type = Island, Pendant, Under Cabinet, Ceiling.

---

### Outdoor

#### Landscape Lighting

**Template:** `{Brand} {Type} {Wattage} {Light Count} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Wattage | ❌ | `-` |
| 4 | Light Count | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Landscape Lighting Finish - Model`

**Sample Titles:**
1. `GE Standard Landscape Lighting Stainless Steel - ABC-100`
2. `Delta Professional Landscape Lighting Matte Black - XYZ-300`
3. `Bosch Premium Landscape Lighting White - PRO-550`

> **SEO Notes:** Type = Path, Spot, Flood, Bollard, Well.

---

## Outdoor

### General

#### Storage Drawer/Door

**Template:** `{Brand} {Width (Inches)} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Storage Drawer/Door Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Storage Drawer/Door Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Storage Drawer/Door Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Storage Drawer/Door White - PRO-550`

> **SEO Notes:** Type = Drawer, Door, Panel. Width for fit.

---

### Outdoor

#### Entry Set

**Template:** `{Brand} {Type} {Function} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Function | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Entry Set Finish - Model`

**Sample Titles:**
1. `GE Standard Entry Set Stainless Steel - ABC-100`
2. `Delta Professional Entry Set Matte Black - XYZ-300`
3. `Bosch Premium Entry Set White - PRO-550`

> **SEO Notes:** Type = Grip Set, Thumblatch Set, Lever Set. Complete entry hardware.

---

#### Exterior Door

**Template:** `{Brand} {Width (Inches)} {Height (Inches)} {Type} {Material} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Height (Inches) | ❌ | `-` |
| 4 | Type | ❌ | `-` |
| 5 | Material | ❌ | `-` |
| 6 | Category | ✅ | `-` |
| 7 | Finish | ❌ | `-` |
| 8 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch 30-Inch Exterior Door Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Exterior Door Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Exterior Door Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Exterior Door White - PRO-550`

> **SEO Notes:** Type = Entry, Patio, Storm, Screen. Material = Wood, Fiberglass, Steel.

---

#### Fire Pit

**Template:** `{Brand} {Diameter (Inches)} {BTU} {Fuel Type} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Diameter (Inches) | ❌ | `-` |
| 3 | BTU | ❌ | `-` |
| 4 | Fuel Type | ❌ | `-` |
| 5 | Type | ❌ | `-` |
| 6 | Category | ✅ | `-` |
| 7 | Finish | ❌ | `-` |
| 8 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch 50,000 BTU Fire Pit Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Fire Pit Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Fire Pit Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Fire Pit White - PRO-550`

> **SEO Notes:** Diameter for size. BTU for heat. Fuel = Gas, Propane, Wood.

---

#### Fire Pit Accessory

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Fire Pit Accessory Finish - Model`

**Sample Titles:**
1. `GE Standard Fire Pit Accessory Stainless Steel - ABC-100`
2. `Delta Professional Fire Pit Accessory Matte Black - XYZ-300`
3. `Bosch Premium Fire Pit Accessory White - PRO-550`

> **SEO Notes:** Type = Cover, Screen, Tool Set, Log Holder.

---

#### Garden Decor

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Garden Decor Finish - Model`

**Sample Titles:**
1. `GE Standard Garden Decor Stainless Steel - ABC-100`
2. `Delta Professional Garden Decor Matte Black - XYZ-300`
3. `Bosch Premium Garden Decor White - PRO-550`

> **SEO Notes:** Type = Statue, Fountain, Planter, Birdbath, Wind Chime.

---

#### Generator

**Template:** `{Brand} {Power (kW)} {Fuel Type} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Power (kW) | ❌ | `-` |
| 3 | Fuel Type | ❌ | `-` |
| 4 | Type | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Generator Finish - Model`

**Sample Titles:**
1. `GE Standard Generator Stainless Steel - ABC-100`
2. `Delta Professional Generator Matte Black - XYZ-300`
3. `Bosch Premium Generator White - PRO-550`

> **SEO Notes:** kW for capacity. Fuel = Gas, Diesel, Propane. Type = Portable, Standby.

---

#### Hardscaping

**Template:** `{Brand} {Type} {Dimensions} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Dimensions | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Hardscaping Finish - Model`

**Sample Titles:**
1. `GE Standard Hardscaping Stainless Steel - ABC-100`
2. `Delta Professional Hardscaping Matte Black - XYZ-300`
3. `Bosch Premium Hardscaping White - PRO-550`

> **SEO Notes:** Type = Paver, Retaining Wall, Edging, Stepping Stone.

---

#### Mail Box

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Mail Box Finish - Model`

**Sample Titles:**
1. `GE Standard Mail Box Stainless Steel - ABC-100`
2. `Delta Professional Mail Box Matte Black - XYZ-300`
3. `Bosch Premium Mail Box White - PRO-550`

> **SEO Notes:** Type = Wall-Mount, Post-Mount, Recessed, Locking.

---

#### Outdoor Fireplace

**Template:** `{Brand} {BTU} {Fuel Type} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | BTU | ❌ | `-` |
| 3 | Fuel Type | ❌ | `-` |
| 4 | Type | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 50,000 BTU Outdoor Fireplace Finish - Model`

**Sample Titles:**
1. `GE Standard Outdoor Fireplace Stainless Steel - ABC-100`
2. `Delta Professional Outdoor Fireplace Matte Black - XYZ-300`
3. `Bosch Premium Outdoor Fireplace White - PRO-550`

> **SEO Notes:** Type = Built-In, Freestanding, Chiminea. Fuel = Gas, Wood.

---

#### Outdoor Kitchen

**Template:** `{Brand} {Type} {Width (Inches)} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Width (Inches) | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Outdoor Kitchen Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Outdoor Kitchen Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Outdoor Kitchen Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Outdoor Kitchen White - PRO-550`

> **SEO Notes:** Type = Island, Cabinet, Cart, Grill Station.

---

#### Outdoor Lighting

**Template:** `{Brand} {Type} {Height (Inches)} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Height (Inches) | ❌ | `-` |
| 4 | Style | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Outdoor Lighting Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Outdoor Lighting Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Outdoor Lighting Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Outdoor Lighting White - PRO-550`

> **SEO Notes:** Type = Wall, Post, Hanging, Flood, Spot.

---

#### Outdoor Shower Faucet

**Template:** `{Brand} {Type} {Mount} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Mount | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Outdoor Shower Faucet Finish - Model`

**Sample Titles:**
1. `GE Standard Outdoor Shower Faucet Stainless Steel - ABC-100`
2. `Delta Professional Outdoor Shower Faucet Matte Black - XYZ-300`
3. `Bosch Premium Outdoor Shower Faucet White - PRO-550`

> **SEO Notes:** Type = Wall-Mount, Post-Mount, Freestanding.

---

## Plumbing & Bath

### Bath

#### Bath Fan

**Template:** `{Brand} {CFM} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | CFM | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 400 CFM Bath Fan Finish - Model`

**Sample Titles:**
1. `GE Standard Bath Fan Stainless Steel - ABC-100`
2. `Delta Professional Bath Fan Matte Black - XYZ-300`
3. `Bosch Premium Bath Fan White - PRO-550`

> **SEO Notes:** CFM for room size ventilation. Sones (noise) also important.

---

#### Bathroom Faucet

**Template:** `{Brand} {Type} {Hole Config} {Mount} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | GPM | ❌ | `{value} GPM` |
| 3 | Type | ❌ | `-` |
| 4 | Hole Config | ❌ | `-` |
| 5 | Mount | ❌ | `-` |
| 6 | Category | ✅ | `-` |
| 7 | Finish | ❌ | `-` |
| 8 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Bathroom Faucet Finish - Model`

**Sample Titles:**
1. `GE Standard Bathroom Faucet Stainless Steel - ABC-100`
2. `Delta Professional Bathroom Faucet Matte Black - XYZ-300`
3. `Bosch Premium Bathroom Faucet White - PRO-550`

> **SEO Notes:** Type = Single-Handle, Widespread, Centerset, Wall-Mount. Hole = Single, 3-Hole, 4-Hole.

---

#### Bathroom Hardware and Accessories

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Bathroom Hardware and Accessories Finish - Model`

**Sample Titles:**
1. `GE Bathroom Hardware and Accessories Stainless Steel - ABC-100`
2. `Delta Bathroom Hardware and Accessories Matte Black - XYZ-300`
3. `Bosch Bathroom Hardware and Accessories White - PRO-550`

> **SEO Notes:** Type = Towel Bar, Robe Hook, Paper Holder, Grab Bar, Shelf.

---

#### Bathroom Lighting (Bathroom)

**Template:** `{Brand} {Width (Inches)} {Light Count} {Type} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Light Count | ❌ | `-` |
| 4 | Type | ❌ | `-` |
| 5 | Style | ❌ | `-` |
| 6 | Category | ✅ | `-` |
| 7 | Finish | ❌ | `-` |
| 8 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch SpecValue Bathroom Lighting (Bathroom) Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Bathroom Lighting (Bathroom) Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Bathroom Lighting (Bathroom) Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Bathroom Lighting (Bathroom) White - PRO-550`

> **SEO Notes:** Duplicate of Bathroom Lighting.

---

#### Bathroom Mirror

**Template:** `{Brand} {Width×Height} {Type} {Style} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width×Height | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Style | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Bathroom Mirror Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Bathroom Mirror Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Bathroom Mirror Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Bathroom Mirror White - PRO-550`

> **SEO Notes:** Dimensions for fit. Type = Framed, Frameless, Medicine Cabinet.

---

#### Bathroom Sink

**Template:** `{Brand} {Width (Inches)} {Type} {Bowl Config} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Bowl Config | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Bathroom Sink Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Bathroom Sink Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Bathroom Sink Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Bathroom Sink White - PRO-550`

> **SEO Notes:** Type = Undermount, Vessel, Drop-In, Wall-Mount, Pedestal.

---

#### Bathroom Vanity

**Template:** `{Brand} {Width (Inches)} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Bathroom Vanity Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Bathroom Vanity Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Bathroom Vanity Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Bathroom Vanity White - PRO-550`

> **SEO Notes:** Width for bathroom fit. Type = Single Sink, Double Sink, Freestanding, Wall-Mount.

---

#### Bathtub

**Template:** `{Brand} {Length (Inches)} {Type} {Material} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Length (Inches) | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Material | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Bathtub Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Bathtub Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Bathtub Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Bathtub White - PRO-550`

> **SEO Notes:** Length is primary dimension. Type = Freestanding, Alcove, Drop-In, Corner, Walk-In.

---

#### Bathtub Waste & Overflow

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Bathtub Waste & Overflow Finish - Model`

**Sample Titles:**
1. `GE Standard Bathtub Waste & Overflow Stainless Steel - ABC-100`
2. `Delta Professional Bathtub Waste & Overflow Matte Black - XYZ-300`
3. `Bosch Premium Bathtub Waste & Overflow White - PRO-550`

> **SEO Notes:** Type = Standard, Cable-Operated, Push-Button.

---

#### Bidet

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Bidet Finish - Model`

**Sample Titles:**
1. `GE Standard Bidet Stainless Steel - ABC-100`
2. `Delta Professional Bidet Matte Black - XYZ-300`
3. `Bosch Premium Bidet White - PRO-550`

> **SEO Notes:** Type = Floor-Mount, Wall-Hung.

---

#### Bidet Faucet

**Template:** `{Brand} {Type} {Hole Config} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Hole Config | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Bidet Faucet Finish - Model`

**Sample Titles:**
1. `GE Standard Bidet Faucet Stainless Steel - ABC-100`
2. `Delta Professional Bidet Faucet Matte Black - XYZ-300`
3. `Bosch Premium Bidet Faucet White - PRO-550`

> **SEO Notes:** Type = Wall-Mount, Deck-Mount. Hole = Single, Widespread.

---

#### Bidet Seat

**Template:** `{Brand} {Shape} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Shape | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Bidet Seat Finish - Model`

**Sample Titles:**
1. `GE Standard Bidet Seat Stainless Steel - ABC-100`
2. `Delta Professional Bidet Seat Matte Black - XYZ-300`
3. `Bosch Premium Bidet Seat White - PRO-550`

> **SEO Notes:** Shape must match toilet. Type = Electric, Non-Electric.

---

#### Medicine Cabinet

**Template:** `{Brand} {Width×Height} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Width×Height | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Medicine Cabinet Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Medicine Cabinet Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Medicine Cabinet Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Medicine Cabinet White - PRO-550`

> **SEO Notes:** Type = Recessed, Surface-Mount. Dimensions for bathroom fit.

---

#### Rough-In Valve

**Template:** `{Brand} {Type} {Connection Size} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Connection Size | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Rough-In Valve Finish - Model`

**Sample Titles:**
1. `GE Standard Rough-In Valve Stainless Steel - ABC-100`
2. `Delta Professional Rough-In Valve Matte Black - XYZ-300`
3. `Bosch Premium Rough-In Valve White - PRO-550`

> **SEO Notes:** Type = Shower, Tub/Shower, Thermostatic. Connection = 1/2", 3/4".

---

#### Shower

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Shower Finish - Model`

**Sample Titles:**
1. `GE Standard Shower Stainless Steel - ABC-100`
2. `Delta Professional Shower Matte Black - XYZ-300`
3. `Bosch Premium Shower White - PRO-550`

> **SEO Notes:** Type = Shower System, Shower Head, Shower Panel, Hand Shower, Shower Column, Body Spray.

---

#### Shower Faucet

**Template:** `{Brand} {Type} {Function} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | GPM | ❌ | `{value} GPM` |
| 3 | Type | ❌ | `-` |
| 4 | Function | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Shower Faucet Finish - Model`

**Sample Titles:**
1. `GE Standard Shower Faucet Stainless Steel - ABC-100`
2. `Delta Professional Shower Faucet Matte Black - XYZ-300`
3. `Bosch Premium Shower Faucet White - PRO-550`

> **SEO Notes:** Type = Valve, Trim Kit, Complete System. Function = Thermostatic, Pressure-Balance, Diverter.

---

#### Steam Shower

**Template:** `{Brand} {Power (kW)} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Power (kW) | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Steam Shower Finish - Model`

**Sample Titles:**
1. `GE Standard Steam Shower Stainless Steel - ABC-100`
2. `Delta Professional Steam Shower Matte Black - XYZ-300`
3. `Bosch Premium Steam Shower White - PRO-550`

> **SEO Notes:** Power determines room size coverage.

---

#### Toilet

**Template:** `{Brand} {Type} {Bowl Shape} {Flush Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Bowl Shape | ❌ | `-` |
| 4 | Flush Type | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue SpecValue Toilet Finish - Model`

**Sample Titles:**
1. `GE Standard Toilet Stainless Steel - ABC-100`
2. `Delta Professional Toilet Matte Black - XYZ-300`
3. `Bosch Premium Toilet White - PRO-550`

> **SEO Notes:** Type = One-Piece, Two-Piece, Wall-Hung. Bowl = Elongated, Round. Flush = Dual, Single.

---

#### Toilet Seat

**Template:** `{Brand} {Shape} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Shape | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue TypeValue Toilet Seat Finish - Model`

**Sample Titles:**
1. `GE Standard Toilet Seat Stainless Steel - ABC-100`
2. `Delta Professional Toilet Seat Matte Black - XYZ-300`
3. `Bosch Premium Toilet Seat White - PRO-550`

> **SEO Notes:** Shape = Elongated, Round. Type = Standard, Slow-Close, Heated, Bidet.

---

#### Tub Faucet

**Template:** `{Brand} {Type} {Mount} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | GPM | ❌ | `{value} GPM` |
| 3 | Type | ❌ | `-` |
| 4 | Mount | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Tub Faucet Finish - Model`

**Sample Titles:**
1. `GE Standard Tub Faucet Stainless Steel - ABC-100`
2. `Delta Professional Tub Faucet Matte Black - XYZ-300`
3. `Bosch Premium Tub Faucet White - PRO-550`

> **SEO Notes:** Type = Roman Tub, Deck-Mount, Floor-Mount, Wall-Mount.

---

#### Urinal

**Template:** `{Brand} {Type} {Flush Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Flush Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Urinal Finish - Model`

**Sample Titles:**
1. `GE Standard Urinal Stainless Steel - ABC-100`
2. `Delta Professional Urinal Matte Black - XYZ-300`
3. `Bosch Premium Urinal White - PRO-550`

> **SEO Notes:** Type = Wall-Mount, Floor-Mount. Flush = Waterless, Manual, Touchless.

---

### General

#### Drainage & Waste

**Template:** `{Brand} {Type} {Connection Size} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Connection Size | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Drainage & Waste Finish - Model`

**Sample Titles:**
1. `GE Standard Drainage & Waste Stainless Steel - ABC-100`
2. `Delta Professional Drainage & Waste Matte Black - XYZ-300`
3. `Bosch Premium Drainage & Waste White - PRO-550`

> **SEO Notes:** Type = P-Trap, S-Trap, Drain Assembly, Strainer.

---

#### Pipe Fitting

**Template:** `{Brand} {Type} {Connection Size} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Connection Size | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Pipe Fitting Finish - Model`

**Sample Titles:**
1. `GE Standard Pipe Fitting Stainless Steel - ABC-100`
2. `Delta Professional Pipe Fitting Matte Black - XYZ-300`
3. `Bosch Premium Pipe Fitting White - PRO-550`

> **SEO Notes:** Type = Elbow, Tee, Coupling, Adapter. Connection = 1/2", 3/4", 1".

---

### Kitchen

#### Backsplash Kitchen Tile

**Template:** `{Brand} {Tile Size} {Material} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Tile Size | ❌ | `-` |
| 3 | Material | ❌ | `-` |
| 4 | Type | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Backsplash Kitchen Tile Finish - Model`

**Sample Titles:**
1. `GE Standard Backsplash Kitchen Tile Stainless Steel - ABC-100`
2. `Delta Professional Backsplash Kitchen Tile Matte Black - XYZ-300`
3. `Bosch Premium Backsplash Kitchen Tile White - PRO-550`

> **SEO Notes:** Smaller format tiles common. Material = Glass, Ceramic, Stone.

---

#### Bar & Prep Sink

**Template:** `{Brand} {Type} {Width (Inches)} {Bowl Config} {Material} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Width (Inches) | ❌ | `-` |
| 4 | Bowl Config | ❌ | `-` |
| 5 | Material | ❌ | `-` |
| 6 | Category | ✅ | `-` |
| 7 | Finish | ❌ | `-` |
| 8 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Bar & Prep Sink Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Bar & Prep Sink Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Bar & Prep Sink Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Bar & Prep Sink White - PRO-550`

> **SEO Notes:** Smaller than kitchen sink. Bowl = Single, Double.

---

#### Bar Faucet

**Template:** `{Brand} {Type} {Hole Config} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | GPM | ❌ | `{value} GPM` |
| 3 | Type | ❌ | `-` |
| 4 | Hole Config | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Bar Faucet Finish - Model`

**Sample Titles:**
1. `GE Standard Bar Faucet Stainless Steel - ABC-100`
2. `Delta Professional Bar Faucet Matte Black - XYZ-300`
3. `Bosch Premium Bar Faucet White - PRO-550`

> **SEO Notes:** Type = Single-Handle, Pull-Down. Usually single-hole.

---

#### Food Service Faucet

**Template:** `{Brand} {Type} {Mount} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | GPM | ❌ | `{value} GPM` |
| 3 | Type | ❌ | `-` |
| 4 | Mount | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Food Service Faucet Finish - Model`

**Sample Titles:**
1. `GE Standard Food Service Faucet Stainless Steel - ABC-100`
2. `Delta Professional Food Service Faucet Matte Black - XYZ-300`
3. `Bosch Premium Food Service Faucet White - PRO-550`

> **SEO Notes:** Type = Pot Filler, Pre-Rinse, Commercial. Mount = Deck, Wall.

---

#### Garbage Disposal

**Template:** `{Brand} {Horsepower} {Feed Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Horsepower | ❌ | `-` |
| 3 | Feed Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Garbage Disposal Finish - Model`

**Sample Titles:**
1. `GE Standard Garbage Disposal Stainless Steel - ABC-100`
2. `Delta Professional Garbage Disposal Matte Black - XYZ-300`
3. `Bosch Premium Garbage Disposal White - PRO-550`

> **SEO Notes:** HP determines grinding power. Feed Type = Continuous, Batch.

---

#### Hot & Cold Water Dispenser

**Template:** `{Brand} {Type} {Category} {Finish} {Capacity (Gallons)} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Capacity (Gallons) | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand Countertop Hot & Cold Water Dispenser Finish 5-Gallon - Model`

**Sample Titles:**
1. `GE Standard Hot & Cold Water Dispenser Stainless Steel - ABC-100`
2. `Delta Professional Hot & Cold Water Dispenser Matte Black - XYZ-300`
3. `Bosch Premium Hot & Cold Water Dispenser White - PRO-550`

> **SEO Notes:** Type = Countertop, Under-Sink, Built-In. Capacity at end.

---

#### Kitchen Accessory

**Template:** `{Brand} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Category | ✅ | `-` |
| 4 | Finish | ❌ | `-` |
| 5 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Kitchen Accessory Finish - Model`

**Sample Titles:**
1. `GE Standard Kitchen Accessory Stainless Steel - ABC-100`
2. `Delta Professional Kitchen Accessory Matte Black - XYZ-300`
3. `Bosch Premium Kitchen Accessory White - PRO-550`

> **SEO Notes:** Type = Sink Grid, Cutting Board, Colander, Soap Dispenser.

---

#### Kitchen Faucet

**Template:** `{Brand} {Type} {Hole Config} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | GPM | ❌ | `{value} GPM` |
| 3 | Type | ❌ | `-` |
| 4 | Hole Config | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Kitchen Faucet Finish - Model`

**Sample Titles:**
1. `GE Standard Kitchen Faucet Stainless Steel - ABC-100`
2. `Delta Professional Kitchen Faucet Matte Black - XYZ-300`
3. `Bosch Premium Kitchen Faucet White - PRO-550`

> **SEO Notes:** Type = Pull-Down, Pull-Out, High-Arc, Commercial, Bridge. Hole = Single, 3-Hole, Widespread.

---

#### Kitchen Furniture and Decor

**Template:** `{Brand} {Type} {Dimensions} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Dimensions | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Kitchen Furniture and Decor Finish - Model`

**Sample Titles:**
1. `GE Standard Kitchen Furniture and Decor Stainless Steel - ABC-100`
2. `Delta Professional Kitchen Furniture and Decor Matte Black - XYZ-300`
3. `Bosch Premium Kitchen Furniture and Decor White - PRO-550`

> **SEO Notes:** Type = Island, Cart, Table, Bar Stool.

---

#### Kitchen Sink

**Template:** `{Brand} {Width (Inches)} {Bowl Config} {Material} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Bowl Config | ❌ | `-` |
| 4 | Material | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Kitchen Sink Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Kitchen Sink Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Kitchen Sink Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Kitchen Sink White - PRO-550`

> **SEO Notes:** Width for fit. Bowl = Single, Double, Triple. Material = Stainless, Cast Iron, Composite.

---

#### Kitchen Sink Combo

**Template:** `{Brand} {Width (Inches)} {Bowl Config} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 2 | Width (Inches) | ❌ | `-` |
| 3 | Bowl Config | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand 30-Inch Kitchen Sink Combo Finish - Model`

**Sample Titles:**
1. `GE 24-Inch Standard Kitchen Sink Combo Stainless Steel - ABC-100`
2. `Delta 30-Inch Professional Kitchen Sink Combo Matte Black - XYZ-300`
3. `Bosch 36-Inch Premium Kitchen Sink Combo White - PRO-550`

> **SEO Notes:** Sink + faucet combo. Width and bowl config critical.

---

#### Kitchen Storage & Organization

**Template:** `{Brand} {Type} {Dimensions} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Type | ❌ | `-` |
| 3 | Dimensions | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Kitchen Storage & Organization Finish - Model`

**Sample Titles:**
1. `GE Standard Kitchen Storage & Organization Stainless Steel - ABC-100`
2. `Delta Professional Kitchen Storage & Organization Matte Black - XYZ-300`
3. `Bosch Premium Kitchen Storage & Organization White - PRO-550`

> **SEO Notes:** Type = Pot Rack, Spice Rack, Utensil Holder, Drawer Organizer.

---

#### Pot Filler Faucet

**Template:** `{Brand} {Type} {Mount} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | GPM | ❌ | `{value} GPM` |
| 3 | Type | ❌ | `-` |
| 4 | Mount | ❌ | `-` |
| 5 | Category | ✅ | `-` |
| 6 | Finish | ❌ | `-` |
| 7 | Model Number | ❌ | `-` |

**Schema Example:** `Brand TypeValue Pot Filler Faucet Finish - Model`

**Sample Titles:**
1. `GE Standard Pot Filler Faucet Stainless Steel - ABC-100`
2. `Delta Professional Pot Filler Faucet Matte Black - XYZ-300`
3. `Bosch Premium Pot Filler Faucet White - PRO-550`

> **SEO Notes:** Type = Deck-Mount, Wall-Mount. Always near range.

---

#### Water Filtration

**Template:** `{Brand} {Filtration Level} {Type} {Category} {Finish} {Model Number}`

| Pos | Attribute | Required | Format |
|-----|-----------|----------|--------|
| 1 | Brand | ✅ | `-` |
| 2 | Filtration Level | ❌ | `-` |
| 3 | Type | ❌ | `-` |
| 4 | Category | ✅ | `-` |
| 5 | Finish | ❌ | `-` |
| 6 | Model Number | ❌ | `-` |

**Schema Example:** `Brand SpecValue Water Filtration Finish - Model`

**Sample Titles:**
1. `GE Standard Water Filtration Stainless Steel - ABC-100`
2. `Delta Professional Water Filtration Matte Black - XYZ-300`
3. `Bosch Premium Water Filtration White - PRO-550`

> **SEO Notes:** Filtration = Micron rating. Type = Under-Sink, Faucet-Mount, Whole-House, RO.

---

## Summary

| Metric | Count |
|--------|-------|
| Total Categories | 162 |
| Schemas Found | 162 |
| Schemas Missing | 0 |
| Coverage | 100.0% |
