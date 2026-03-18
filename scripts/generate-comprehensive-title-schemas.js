/**
 * COMPREHENSIVE TITLE SCHEMA GENERATOR
 * Generates schemas for all 177 categories following Option A pattern:
 * Brand - [PRIMARY_SPEC] - [SECONDARY_SPEC] - Category - Finish - Model
 */

const fs = require('fs');
const path = require('path');

// Load categories from picklist
const categoriesPath = path.join(__dirname, '../src/config/salesforce-picklists/categories.json');
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

// Category-specific spec definitions
const CATEGORY_SPECS = {
  // === APPLIANCES - KITCHEN ===
  'Refrigerator': { primary: 'Capacity (Cu. Ft.)', secondary: 'Configuration, Installation Type', seoNotes: 'Lead with capacity. Configuration = door style (French Door, Side-by-Side). Installation = Built-In, Counter-Depth, Freestanding.' },
  'Freezer': { primary: 'Capacity (Cu. Ft.)', secondary: 'Configuration', seoNotes: 'Configuration = Upright, Chest, Column. Capacity is the key differentiator.' },
  'Range': { primary: 'Width (Inches)', secondary: 'Fuel Type, Installation Type', seoNotes: 'Width + Fuel Type are top search modifiers. Fuel = Gas, Electric, Dual Fuel, Induction. Installation = Slide-In, Freestanding, Drop-In.' },
  'Oven': { primary: 'Width (Inches)', secondary: 'Configuration, Installation Type', seoNotes: 'Configuration = Single, Double, Combo. Installation = Wall, Built-In.' },
  'Cooktop': { primary: 'Width (Inches)', secondary: 'Fuel Type, Installation Type', seoNotes: 'Width + Fuel Type essential. Installation = Built-In, Drop-In.' },
  'Microwave': { primary: 'Capacity (Cu. Ft.)', secondary: 'Type', seoNotes: 'Type = Over-the-Range, Countertop, Built-In, Drawer.' },
  'Dishwasher': { primary: 'Width (Inches), dBA Level', secondary: 'Type', seoNotes: 'Width (only if 18"). dBA is top qualifier. Type = Built-In, Portable, Drawer.' },
  'Range Hood': { primary: 'Width (Inches), CFM', secondary: 'Type', seoNotes: 'Width matches range. CFM is key spec. Type = Under-Cabinet, Wall Mount, Island, Insert.' },
  'Icemaker': { primary: 'Production (lbs/day)', secondary: 'Type', seoNotes: 'Production rate is sizing spec. Type = Built-In, Freestanding, Portable.' },
  'Beverage Center': { primary: 'Width (Inches), Capacity (Bottles)', secondary: 'Type', seoNotes: 'Width for fit, bottle capacity for utility. Type = Built-In, Freestanding.' },
  'Wine Cooler': { primary: 'Width (Inches), Capacity (Bottles)', secondary: 'Type, Zone Config', seoNotes: 'Bottle capacity primary. Zone = Single, Dual, Multi.' },
  'Garbage Disposal': { primary: 'Horsepower', secondary: 'Feed Type', seoNotes: 'HP determines grinding power. Feed Type = Continuous, Batch.' },
  'Coffee Maker': { primary: 'Type', secondary: 'Capacity (Cups)', seoNotes: 'Type = Built-In, Countertop, Espresso, Pod.' },
  'Hot & Cold Water Dispenser': { primary: 'Type', secondary: 'Capacity (Gallons)', seoNotes: 'Type = Countertop, Under-Sink, Built-In.' },
  'Barbeque': { primary: 'Width (Inches), BTU', secondary: 'Fuel Type, Type', seoNotes: 'Width for space, BTU for power. Fuel = Gas, Charcoal, Electric, Pellet.' },
  'Pizza Oven': { primary: 'Type', secondary: 'Fuel Type', seoNotes: 'Type = Built-In, Countertop, Outdoor. Fuel = Gas, Wood, Electric.' },
  'Outdoor Kitchen': { primary: 'Type', secondary: 'Width (Inches)', seoNotes: 'Type = Island, Cabinet, Cart, Grill Station.' },
  
  // === APPLIANCES - LAUNDRY ===
  'Washer': { primary: 'Capacity (Cu. Ft.)', secondary: 'Configuration', seoNotes: 'Capacity determines load size. Configuration = Front Load, Top Load.' },
  'Dryer': { primary: 'Capacity (Cu. Ft.)', secondary: 'Fuel Type', seoNotes: 'Capacity matches washer. Fuel Type = Gas, Electric.' },
  'All in One Washer / Dryer': { primary: 'Capacity (Cu. Ft.)', secondary: 'Type', seoNotes: 'Combined capacity. Type = Ventless, Vented, Compact.' },
  
  // === PLUMBING - FIXTURES ===
  'Toilet': { primary: 'Type, Bowl Shape', secondary: 'Flush Type', seoNotes: 'Type = One-Piece, Two-Piece, Wall-Hung. Bowl = Elongated, Round. Flush = Dual, Single.' },
  'Toilet Seat': { primary: 'Shape, Type', secondary: '', seoNotes: 'Shape = Elongated, Round. Type = Standard, Slow-Close, Heated, Bidet.' },
  'Bidet': { primary: 'Type', secondary: '', seoNotes: 'Type = Floor-Mount, Wall-Hung.' },
  'Bidet Seat': { primary: 'Shape', secondary: 'Type', seoNotes: 'Shape must match toilet. Type = Electric, Non-Electric.' },
  'Bidet Faucet': { primary: 'Type', secondary: 'Hole Config', seoNotes: 'Type = Wall-Mount, Deck-Mount. Hole = Single, Widespread.' },
  'Urinal': { primary: 'Type', secondary: 'Flush Type', seoNotes: 'Type = Wall-Mount, Floor-Mount. Flush = Waterless, Manual, Touchless.' },
  'Bathtub': { primary: 'Length (Inches)', secondary: 'Type, Material', seoNotes: 'Length is primary dimension. Type = Freestanding, Alcove, Drop-In, Corner, Walk-In.' },
  'Bathtub Waste & Overflow': { primary: 'Type', secondary: '', seoNotes: 'Type = Standard, Cable-Operated, Push-Button.' },
  'Shower': { primary: 'Type', secondary: '', seoNotes: 'Type = Shower System, Shower Head, Shower Panel, Hand Shower, Shower Column, Body Spray.' },
  'Showerheads & Hand Showers': { primary: 'Type', secondary: 'Function', seoNotes: 'Type = Valve, Trim Kit, Complete System. Function = Thermostatic, Pressure-Balance, Diverter.' },
  'Outdoor Shower Faucet': { primary: 'Type', secondary: 'Mount', seoNotes: 'Type = Wall-Mount, Post-Mount, Freestanding.' },
  'Tub Faucet': { primary: 'Type', secondary: 'Mount', seoNotes: 'Type = Roman Tub, Deck-Mount, Floor-Mount, Wall-Mount.' },
  'Steam Shower': { primary: 'Power (kW)', secondary: '', seoNotes: 'Power determines room size coverage.' },
  'Rough-In Valve': { primary: 'Type', secondary: 'Connection Size', seoNotes: 'Type = Shower, Tub/Shower, Thermostatic. Connection = 1/2", 3/4".' },
  
  // === PLUMBING - SINKS & FAUCETS ===
  'Kitchen Sink': { primary: 'Width (Inches)', secondary: 'Bowl Config, Material', seoNotes: 'Width for fit. Bowl = Single, Double, Triple. Material = Stainless, Cast Iron, Composite.' },
  'Kitchen Sink Combo': { primary: 'Width (Inches)', secondary: 'Bowl Config', seoNotes: 'Sink + faucet combo. Width and bowl config critical.' },
  'Bathroom Sink': { primary: 'Width (Inches)', secondary: 'Type, Bowl Config', seoNotes: 'Type = Undermount, Vessel, Drop-In, Wall-Mount, Pedestal.' },
  'Bar & Prep Sink': { primary: 'Width (Inches)', secondary: 'Bowl Config, Material', seoNotes: 'Smaller than kitchen sink. Bowl = Single, Double.' },
  'Laundry Sink': { primary: 'Width (Inches)', secondary: 'Type, Bowl Config', seoNotes: 'Type = Drop-In, Undermount, Freestanding. Bowl = Single, Double.' },
  'Utility Sink': { primary: 'Width (Inches)', secondary: 'Type, Material', seoNotes: 'Type = Wall-Mount, Freestanding, Drop-In.' },
  'Kitchen Faucet': { primary: 'Type', secondary: 'Hole Config', seoNotes: 'Type = Pull-Down, Pull-Out, High-Arc, Commercial, Bridge. Hole = Single, 3-Hole, Widespread.' },
  'Bathroom Faucet': { primary: 'Type', secondary: 'Hole Config, Mount', seoNotes: 'Type = Single-Handle, Widespread, Centerset, Wall-Mount. Hole = Single, 3-Hole, 4-Hole.' },
  'Bar Faucet': { primary: 'Type', secondary: 'Hole Config', seoNotes: 'Type = Single-Handle, Pull-Down. Usually single-hole.' },
  'Food Service Faucet': { primary: 'Type', secondary: 'Mount', seoNotes: 'Type = Pot Filler, Pre-Rinse, Commercial. Mount = Deck, Wall.' },
  'Pot Filler Faucet': { primary: 'Type', secondary: 'Mount', seoNotes: 'Type = Deck-Mount, Wall-Mount. Always near range.' },
  
  // === PLUMBING - OTHER ===
  'Drainage & Waste': { primary: 'Type', secondary: 'Connection Size', seoNotes: 'Type = P-Trap, S-Trap, Drain Assembly, Strainer.' },
  'Industrial Strainer': { primary: 'Type', secondary: 'Connection Size', seoNotes: 'Type = Floor, Sink, Basket. Connection matches drain.' },
  'Water Filtration': { primary: 'Filtration Level', secondary: 'Type', seoNotes: 'Filtration = Micron rating. Type = Under-Sink, Faucet-Mount, Whole-House, RO.' },
  'Water Heater': { primary: 'Capacity (Gallons)', secondary: 'Fuel Type', seoNotes: 'Capacity for household size. Fuel = Gas, Electric, Hybrid.' },
  'Tankless Water Heater': { primary: 'GPM/BTU', secondary: 'Fuel Type', seoNotes: 'GPM determines flow rate. Fuel = Gas, Electric.' },
  'Hydronic Expansion Tank': { primary: 'Capacity (Gallons)', secondary: 'AC Rating', seoNotes: 'Capacity matches system size.' },
  'Water Fountain': { primary: 'Type', secondary: '', seoNotes: 'Type = Wall-Mount, Floor-Standing, Bottle-Filler.' },
  
  // === LIGHTING ===
  'Chandelier': { primary: 'Diameter (Inches), Light Count', secondary: 'Style', seoNotes: 'Diameter + light count are top filters. Style = Modern, Traditional, Transitional.' },
  'Pendant': { primary: 'Diameter (Inches)', secondary: 'Style', seoNotes: 'Diameter + style drive search. Mini-pendants common.' },
  'Island Lighting': { primary: 'Width (Inches), Light Count', secondary: 'Style', seoNotes: 'Width/length must fit island. Multi-light or linear common.' },
  'Vanity Lighting': { primary: 'Width (Inches), Light Count', secondary: 'Style', seoNotes: 'Width matches vanity. Light count for coverage.' },
  'Bathroom Lighting': { primary: 'Width (Inches), Light Count', secondary: 'Type, Style', seoNotes: 'Type = Vanity, Sconce, Ceiling. Width for vanity lights.' },
  'Bathroom Lighting (Bathroom)': { primary: 'Width (Inches), Light Count', secondary: 'Type, Style', seoNotes: 'Duplicate of Bathroom Lighting.' },
  'Kitchen Lighting': { primary: 'Type', secondary: 'Width (Inches), Light Count', seoNotes: 'Type = Island, Pendant, Under Cabinet, Ceiling.' },
  'Ceiling Light': { primary: 'Diameter (Inches)', secondary: 'Type, Style', seoNotes: 'Type = Flush Mount, Semi-Flush. Style key differentiator.' },
  'Flush and Semi-Flush': { primary: 'Diameter (Inches)', secondary: 'Type, Style', seoNotes: 'Type = Flush, Semi-Flush. Diameter for room size.' },
  'Wall Sconce': { primary: 'Style', secondary: 'Type', seoNotes: 'Type = Fixed, Swing-Arm, Up/Down. Style + type key.' },
  'Recessed Lighting': { primary: 'Aperture (Inches)', secondary: 'Type', seoNotes: 'Aperture = 4", 6", 8". Type = New Construction, Remodel.' },
  'Track and Rail Lighting': { primary: 'Track Length (Feet)', secondary: 'Style', seoNotes: 'Track length determines coverage.' },
  'Under Cabinet Light': { primary: 'Length (Inches)', secondary: 'Type', seoNotes: 'Length matches cabinet. Type = LED Strip, Puck, Bar.' },
  'Step Lighting': { primary: 'Type', secondary: 'Width (Inches)', seoNotes: 'Type = Wall-Mount, Recessed. For stairs/walkways.' },
  'Post Light': { primary: 'Height (Inches)', secondary: 'Style', seoNotes: 'Height determines visibility. Style for matching.' },
  'Landscape Lighting': { primary: 'Type', secondary: 'Wattage, Light Count', seoNotes: 'Type = Path, Spot, Flood, Bollard, Well.' },
  'Outdoor Lighting': { primary: 'Type', secondary: 'Height (Inches), Style', seoNotes: 'Type = Wall, Post, Hanging, Flood, Spot.' },
  'Commercial Lighting': { primary: 'Type', secondary: 'Wattage, Light Count', seoNotes: 'Type = High Bay, Troffer, Panel, Strip.' },
  'LED Lighting': { primary: 'Type', secondary: 'Wattage, Color Temp', seoNotes: 'Type determines application. Color Temp = 2700K, 3000K, 4000K, 5000K.' },
  'Light Bulbs': { primary: 'Type, Wattage Equivalent', secondary: 'Bulb Type, Color Temp', seoNotes: 'Type = LED, CFL, Incandescent, Halogen. Wattage Equivalent for brightness.' },
  'Lamp': { primary: 'Type', secondary: 'Height (Inches), Style', seoNotes: 'Type = Table, Floor, Desk, Buffet.' },
  'Ceiling Fan': { primary: 'Blade Span (Inches)', secondary: 'Style', seoNotes: 'Blade span determines room size coverage. 52" most common.' },
  'Lighting Accessory': { primary: 'Type', secondary: '', seoNotes: 'Type = Shade, Bulb, Dimmer, Transformer, Mounting Hardware.' },
  'Light Switches & Dimmers': { primary: 'Type', secondary: '', seoNotes: 'Type = Standard, Dimmer, Smart, Motion-Sensor, Timer.' },
  
  // === HVAC ===
  'Air Conditioner': { primary: 'Tonnage/BTU', secondary: 'Type', seoNotes: 'BTU/Tonnage for room size. Type = Window, Portable, Mini Split, Central.' },
  'Mini Split Air Conditioner': { primary: 'Tonnage/BTU', secondary: 'Zone Config', seoNotes: 'BTU for capacity. Zone = Single, Multi (2-zone, 3-zone, etc.).' },
  'Air Circulator': { primary: 'CFM', secondary: 'Type', seoNotes: 'CFM determines air movement. Type = Pedestal, Tower, Box.' },
  'Air Filter': { primary: 'MERV Rating', secondary: 'Size (W×H)', seoNotes: 'MERV rating determines filtration level. Size must match system.' },
  'Dehumidifier': { primary: 'Capacity (Pints)', secondary: 'Type', seoNotes: 'Pints per day for moisture removal. Type = Portable, Whole-House.' },
  'Evaporative Cooler': { primary: 'CFM', secondary: 'Type', seoNotes: 'CFM for area coverage. Type = Portable, Window, Ducted.' },
  'Heating': { primary: 'BTU', secondary: 'Fuel Type, Type', seoNotes: 'BTU for heat output. Fuel = Gas, Electric, Oil, Propane. Type = Furnace, Boiler, Heat Pump.' },
  'Indoor Heating': { primary: 'BTU/Watts', secondary: 'Type, Fuel Type', seoNotes: 'Type = Space Heater, Wall Heater, Baseboard, Radiant.' },
  'Room Heater': { primary: 'BTU/Watts', secondary: 'Type', seoNotes: 'Type = Electric, Gas, Propane, Kerosene. Portable or fixed.' },
  'Patio Heater': { primary: 'BTU', secondary: 'Fuel Type, Type', seoNotes: 'BTU for heat output. Type = Freestanding, Tabletop, Wall-Mount, Ceiling-Mount.' },
  'Thermostat': { primary: 'Type', secondary: '', seoNotes: 'Type = Programmable, Smart, Non-Programmable, Manual.' },
  'Bath Fan': { primary: 'CFM', secondary: '', seoNotes: 'CFM for room size ventilation. Sones (noise) also important.' },
  'Attic Fan': { primary: 'CFM', secondary: 'Type', seoNotes: 'CFM for attic ventilation. Type = Powered, Solar, Wind-Driven.' },
  'Exhaust Fan': { primary: 'CFM', secondary: 'Type', seoNotes: 'CFM determines air movement. Type = Wall, Ceiling, Inline.' },
  'Ducting': { primary: 'Diameter (Inches)', secondary: 'Type, Length (Feet)', seoNotes: 'Diameter matches system. Type = Rigid, Flexible, Insulated.' },
  'Skylight': { primary: 'Dimensions (W×H)', secondary: 'Type, Glazing', seoNotes: 'Dimensions for fit. Type = Fixed, Venting, Tubular.' },
  'HVAC Accessory': { primary: 'Type', secondary: '', seoNotes: 'Type = Grille, Register, Diffuser, Humidistat, Control.' },
  'Commercial HVAC': { primary: 'Tonnage/BTU', secondary: 'Type', seoNotes: 'Type = Rooftop Unit, Split System, VRF, Chiller.' },
  
  // === HARDWARE - CABINET ===
  'Cabinet Knob': { primary: 'Diameter (Inches)', secondary: 'Style', seoNotes: 'Diameter typically 1.25" to 1.5". Style drives selection.' },
  'Cabinet Pull': { primary: 'Length (Inches)', secondary: 'Style', seoNotes: 'Length = center-to-center spacing. Common: 3", 4", 5", 6".' },
  'Luxury Cabinet Knob': { primary: 'Diameter (Inches)', secondary: 'Collection, Style', seoNotes: 'Premium segment. Diameter + collection/style.' },
  'Luxury Cabinet Pull': { primary: 'Length (Inches)', secondary: 'Collection, Style', seoNotes: 'Premium segment. Length + collection/style.' },
  'Appliance Pull': { primary: 'Length (Inches)', secondary: 'Style', seoNotes: 'Longer pulls (12"+) for appliances.' },
  'Cabinet Hardware': { primary: 'Type', secondary: 'Length/Diameter', seoNotes: 'Type = Knob, Pull, Bin Pull, Cup Pull, Drop Pull.' },
  'Cabinet Hardware Bulk Pack': { primary: 'Type', secondary: 'Piece Count', seoNotes: 'Type + quantity. Usually 10-pack or 25-pack.' },
  'Cabinet Hardware Mounting Template': { primary: 'Type', secondary: '', seoNotes: 'Type = Universal, Specific Spacing.' },
  'Bathroom Cabinet Hardware': { primary: 'Type', secondary: 'Length/Diameter', seoNotes: 'Same as cabinet hardware, bath finishes.' },
  'Designer Cabinet Hardware': { primary: 'Type', secondary: 'Collection, Style', seoNotes: 'Premium segment. Collection-driven.' },
  'Vanity Cabinet Hardware': { primary: 'Type', secondary: 'Length/Diameter, Style', seoNotes: 'Type = Knob, Pull. Bath finishes common.' },
  'Cabinet Hinge': { primary: 'Type', secondary: '', seoNotes: 'Type = Concealed, Surface-Mount, Overlay, Inset.' },
  'Cabinet Lock': { primary: 'Type', secondary: '', seoNotes: 'Type = Cam Lock, Drawer Lock, Magnetic, Keyed.' },
  'Cabinet Catch and Latch': { primary: 'Type', secondary: '', seoNotes: 'Type = Magnetic, Roller, Touch, Bullet.' },
  'Cabinet Finishing': { primary: 'Type', secondary: '', seoNotes: 'Type = Bumpers, Felt Pads, Plugs, Covers.' },
  'Cabinet Organization and Storage': { primary: 'Type', secondary: 'Dimensions', seoNotes: 'Type = Pull-Out Shelf, Lazy Susan, Drawer Organizer, Trash Can.' },
  'Drawer': { primary: 'Width (Inches)', secondary: 'Type, Height (Inches)', seoNotes: 'Type = Drawer Box, Drawer Front. Width for fit.' },
  'Drawer Slide and Accessory': { primary: 'Length (Inches)', secondary: 'Type', seoNotes: 'Length determines extension. Type = Side-Mount, Under-Mount, Center-Mount.' },
  
  // === HARDWARE - DOOR ===
  'Door Knob': { primary: 'Type', secondary: 'Function', seoNotes: 'Type = Passage, Privacy, Dummy, Keyed. Function critical.' },
  'Door Lever': { primary: 'Type', secondary: 'Function', seoNotes: 'Type = Passage, Privacy, Dummy, Keyed. Function critical.' },
  'Door Hardware: Knob and Lever': { primary: 'Type', secondary: 'Function', seoNotes: 'Combined category. Type + function.' },
  'Handleset': { primary: 'Type', secondary: 'Function', seoNotes: 'Type = Entry, Dummy. Includes exterior grip + interior lever/knob.' },
  'Deadbolt': { primary: 'Type', secondary: '', seoNotes: 'Type = Single Cylinder, Double Cylinder, Keyless, Smart.' },
  'Entry Set': { primary: 'Type', secondary: 'Function', seoNotes: 'Type = Grip Set, Thumblatch Set, Lever Set. Complete entry hardware.' },
  'Door Entry Set': { primary: 'Type', secondary: 'Function', seoNotes: 'Same as Entry Set.' },
  'Keyless Entry': { primary: 'Type', secondary: '', seoNotes: 'Type = Keypad, Smart Lock, Biometric, RFID.' },
  'Keyed Hardware': { primary: 'Type', secondary: 'Function', seoNotes: 'Type = Keyed Entry, Keyed Knob, Keyed Lever.' },
  'Lock Combo Pack': { primary: 'Type', secondary: 'Piece Count', seoNotes: 'Multiple locks in package. Type + count.' },
  'Mortise Lock': { primary: 'Type', secondary: 'Function', seoNotes: 'Commercial-grade. Type = Entry, Privacy, Passage.' },
  'Backplate': { primary: 'Width (Inches)', secondary: 'Style', seoNotes: 'Decorative plate behind knob/lever.' },
  'Door Hardware Part': { primary: 'Type', secondary: '', seoNotes: 'Type = Strike Plate, Latchbolt, Spindle, Rosette.' },
  'Door Hinge': { primary: 'Size (Inches)', secondary: 'Type', seoNotes: 'Size = 3.5", 4", 4.5". Type = Full Mortise, Half Mortise, Surface.' },
  'Barn Door Hardware': { primary: 'Track Length (Feet)', secondary: 'Style', seoNotes: 'Track length for door width. Style = Modern, Rustic, Industrial.' },
  'Sliding Door Hardware': { primary: 'Track Length (Feet)', secondary: 'Type', seoNotes: 'Type = Barn, Pocket, Bypass, Telescoping.' },
  'Closet and Pocket Door Hardware': { primary: 'Type', secondary: 'Track Length (Feet)', seoNotes: 'Type = Pocket, Bifold, Bypass. Track length for fit.' },
  'Screen and Storm Door Hardware': { primary: 'Type', secondary: '', seoNotes: 'Type = Closer, Latch, Handle, Hinge.' },
  'Multi Point Door Hardware': { primary: 'Type', secondary: 'Length (Inches)', seoNotes: 'Type = Active, Passive, Multipoint Lock. Height for tall doors.' },
  'Commercial Door Hardware': { primary: 'Type', secondary: 'Function', seoNotes: 'Type = Exit Device, Panic Bar, Closer, Mortise Lock.' },
  
  // === HARDWARE - OTHER ===
  'Bathroom Hardware and Accessories': { primary: 'Type', secondary: '', seoNotes: 'Type = Towel Bar, Robe Hook, Paper Holder, Grab Bar, Shelf.' },
  'Designer Hardware': { primary: 'Type', secondary: 'Collection', seoNotes: 'Premium segment. Collection-driven.' },
  'Home Hardware': { primary: 'Type', secondary: '', seoNotes: 'Type = Utility Hook, Bracket, Fastener, Anchor.' },
  'Safe, Lock and Lock Box': { primary: 'Type', secondary: 'Size (L×W×D)', seoNotes: 'Type = Floor Safe, Wall Safe, Lock Box, Gun Safe.' },
  'Home Electronics': { primary: 'Type', secondary: '', seoNotes: 'Type = Doorbell, Camera, Smart Device, Security System.' },
  
  // === FLOORING ===
  'Tile': { primary: 'Tile Size', secondary: 'Material, Type', seoNotes: 'Tile Size = 12×24, 6×36, etc. Material = Porcelain, Ceramic, Stone.' },
  'Kitchen Tile': { primary: 'Tile Size', secondary: 'Material, Type', seoNotes: 'Same as Tile, kitchen-specific.' },
  'Backsplash Kitchen Tile': { primary: 'Tile Size', secondary: 'Material, Type', seoNotes: 'Smaller format tiles common. Material = Glass, Ceramic, Stone.' },
  'Hardwood Flooring': { primary: 'Plank Width (Inches)', secondary: 'Species/Look', seoNotes: 'Width = 3", 5", 7"+. Species = Oak, Maple, Hickory, etc.' },
  'Laminate Flooring': { primary: 'Plank Width (Inches)', secondary: 'Species/Look, AC Rating', seoNotes: 'AC Rating for durability. Species look for aesthetics.' },
  'Luxury Vinyl Flooring': { primary: 'Plank Width (Inches)', secondary: 'Type, Wear Layer (mil)', seoNotes: 'Type = Plank, Tile. Wear Layer determines durability.' },
  'Waterproof Flooring': { primary: 'Plank Width (Inches)', secondary: 'Type', seoNotes: 'Type = LVP, WPC, SPC. Width for aesthetics.' },
  'Carpet': { primary: 'Type', secondary: 'Width (Feet)', seoNotes: 'Type = Berber, Plush, Frieze, Looped. Width = roll width or tile size.' },
  
  // === FURNITURE & DECOR ===
  'Furniture': { primary: 'Type', secondary: 'Dimensions', seoNotes: 'Type = Table, Chair, Cabinet, Shelf, Bench.' },
  'Chair': { primary: 'Type', secondary: 'Style', seoNotes: 'Type = Dining, Accent, Office, Bar Stool, Rocking.' },
  'Outdoor and Patio Furniture': { primary: 'Type', secondary: 'Material', seoNotes: 'Type = Dining Set, Lounge, Chair, Table. Material = Metal, Wicker, Wood.' },
  'Bathroom Vanity': { primary: 'Width (Inches)', secondary: 'Type', seoNotes: 'Width for bathroom fit. Type = Single Sink, Double Sink, Freestanding, Wall-Mount.' },
  'Kitchen Furniture and Decor': { primary: 'Type', secondary: 'Dimensions', seoNotes: 'Type = Island, Cart, Table, Bar Stool.' },
  'Bathroom Mirror': { primary: 'Width×Height', secondary: 'Type, Style', seoNotes: 'Dimensions for fit. Type = Framed, Frameless, Medicine Cabinet.' },
  'Mirror': { primary: 'Width×Height', secondary: 'Type, Style', seoNotes: 'Dimensions for space. Type = Wall, Floor, Vanity.' },
  'Medicine Cabinet': { primary: 'Width×Height', secondary: 'Type', seoNotes: 'Type = Recessed, Surface-Mount. Dimensions for bathroom fit.' },
  'Rug': { primary: 'Size (W×L)', secondary: 'Style, Material', seoNotes: 'Size critical for room fit. Common: 5×7, 8×10, 9×12.' },
  'Wall Decor': { primary: 'Type', secondary: 'Dimensions', seoNotes: 'Type = Art, Mirror, Shelf, Clock.' },
  'Home Accents': { primary: 'Type', secondary: '', seoNotes: 'Type = Vase, Candle Holder, Decorative Bowl, Sculpture.' },
  'Kitchen Storage & Organization': { primary: 'Type', secondary: 'Dimensions', seoNotes: 'Type = Pot Rack, Spice Rack, Utensil Holder, Drawer Organizer.' },
  'Storage and Organization': { primary: 'Type', secondary: 'Dimensions', seoNotes: 'Type = Shelf, Bin, Basket, Rack, Organizer.' },
  'Storage Drawer/Door': { primary: 'Width (Inches)', secondary: 'Type', seoNotes: 'Type = Drawer, Door, Panel. Width for fit.' },
  'Home Organization': { primary: 'Type', secondary: 'Dimensions', seoNotes: 'Type = Closet Organizer, Shelf, Hook, Basket.' },
  'Standalone Pedestal': { primary: 'Type', secondary: 'Height (Inches)', seoNotes: 'Type = Sink Pedestal, Pedestal Leg. Height for sink.' },
  
  // === OUTDOOR ===
  'Hardscaping': { primary: 'Type', secondary: 'Dimensions', seoNotes: 'Type = Paver, Retaining Wall, Edging, Stepping Stone.' },
  'Garden Decor': { primary: 'Type', secondary: '', seoNotes: 'Type = Statue, Fountain, Planter, Birdbath, Wind Chime.' },
  'Fire Pit': { primary: 'Diameter (Inches), BTU', secondary: 'Fuel Type, Type', seoNotes: 'Diameter for size. BTU for heat. Fuel = Gas, Propane, Wood.' },
  'Fire Pit Accessory': { primary: 'Type', secondary: '', seoNotes: 'Type = Cover, Screen, Tool Set, Log Holder.' },
  'Outdoor Fireplace': { primary: 'BTU', secondary: 'Fuel Type, Type', seoNotes: 'Type = Built-In, Freestanding, Chiminea. Fuel = Gas, Wood.' },
  'Stove and Fireplace': { primary: 'BTU', secondary: 'Fuel Type, Type', seoNotes: 'Type = Wood Stove, Pellet Stove, Gas Fireplace, Electric Fireplace.' },
  'Stove and Chimney Pipe': { primary: 'Diameter (Inches)', secondary: 'Type', seoNotes: 'Type = Single Wall, Double Wall, Insulated. Diameter for stove.' },
  
  // === BUILDING MATERIALS ===
  'Door': { primary: 'Width (Inches), Height (Inches)', secondary: 'Type, Material', seoNotes: 'Width × Height for opening. Type = Interior, Exterior, Bifold, Sliding.' },
  'Exterior Door': { primary: 'Width (Inches), Height (Inches)', secondary: 'Type, Material', seoNotes: 'Type = Entry, Patio, Storm, Screen. Material = Wood, Fiberglass, Steel.' },
  'Window': { primary: 'Width×Height', secondary: 'Type, Glazing', seoNotes: 'Type = Double-Hung, Casement, Sliding, Awning.' },
  
  // === KITCHEN ACCESSORIES ===
  'Kitchen Accessory': { primary: 'Type', secondary: '', seoNotes: 'Type = Sink Grid, Cutting Board, Colander, Soap Dispenser.' },
  'Cooking': { primary: 'Type', secondary: '', seoNotes: 'Type = Cookware, Bakeware, Utensils, Gadgets.' },
  
  // === COMMERCIAL ===
  'Commercial Lighting': { primary: 'Type', secondary: 'Wattage, Light Count', seoNotes: 'Type = High Bay, Troffer, Panel, Strip. Wattage for brightness.' },
  'Commercial Restroom': { primary: 'Type', secondary: '', seoNotes: 'Type = Toilet, Urinal, Sink, Faucet, Partition, Dispenser.' },
  
  // === SAFETY & UTILITY ===
  'Generator': { primary: 'Power (kW)', secondary: 'Fuel Type, Type', seoNotes: 'kW for capacity. Fuel = Gas, Diesel, Propane. Type = Portable, Standby.' },
  'Safety & Security': { primary: 'Type', secondary: '', seoNotes: 'Type = Alarm, Camera, Lock, Safe, Fire Extinguisher.' },
  'Mail Box': { primary: 'Type', secondary: '', seoNotes: 'Type = Wall-Mount, Post-Mount, Recessed, Locking.' },
  'Pipe Fitting': { primary: 'Type', secondary: 'Connection Size', seoNotes: 'Type = Elbow, Tee, Coupling, Adapter. Connection = 1/2", 3/4", 1".' },
  'Chemicals & Compounds': { primary: 'Type', secondary: 'Size/Volume', seoNotes: 'Type = Cleaner, Adhesive, Sealant, Paint.' },
};

// Generate schema for a category
function generateSchema(category) {
  const normalizedName = category.category_name.toLowerCase().replace(/\s+/g, '_').replace(/[\/&]/g, '_').replace(/__+/g, '_');
  const specs = CATEGORY_SPECS[category.category_name] || { 
    primary: 'Type', 
    secondary: '', 
    seoNotes: 'Generic schema - needs category-specific refinement.' 
  };
  
  const slots = [];
  let position = 1;
  
  // Position 1: Brand (always)
  slots.push({ position: position++, attribute: 'Brand', required: true });
  
  // Position 2-3: PRIMARY_SPEC
  const primarySpecs = specs.primary.split(',').map(s => s.trim());
  primarySpecs.forEach(spec => {
    slots.push({ position: position++, attribute: spec, required: false });
  });
  
  // Position 4-5: SECONDARY_SPEC (if exists)
  if (specs.secondary) {
    const secondarySpecs = specs.secondary.split(',').map(s => s.trim());
    secondarySpecs.forEach(spec => {
      slots.push({ position: position++, attribute: spec, required: false });
    });
  }
  
  // Position N-1: Category (always)
  slots.push({ position: position++, attribute: 'Category', required: true });
  
  // Position N: Finish (always)
  slots.push({ position: position++, attribute: 'Finish', required: false });
  
  // Position N+1: Model Number (always last)
  slots.push({ position: position++, attribute: 'Model Number', required: false });
  
  // Generate template
  const templateParts = slots.map(s => `{${s.attribute}}`).join(' ');
  
  // Generate example title (simplified)
  const brand = 'Brand';
  const exampleSpecs = primarySpecs.map(s => {
    if (s.includes('Width') || s.includes('Height') || s.includes('Length') || s.includes('Diameter')) return '30-Inch';
    if (s.includes('Capacity')) return '28 Cu. Ft.';
    if (s.includes('BTU')) return '50,000 BTU';
    if (s.includes('CFM')) return '400 CFM';
    if (s.includes('Type')) return 'TypeValue';
    return 'SpecValue';
  });
  const exampleTitle = [brand, ...exampleSpecs, category.category_name.replace(/ #$/, ''), 'Finish'].filter(Boolean).join(' ');
  
  return {
    categoryId: category.category_id,
    categoryName: category.category_name,
    department: category.department,
    family: category.family,
    slots,
    template: templateParts,
    exampleTitle: exampleTitle + ' - Model',
    seoNotes: specs.seoNotes
  };
}

// Generate all schemas
const allSchemas = {};
categories.forEach(category => {
  const normalizedName = category.category_name.toLowerCase().replace(/\s+/g, '_').replace(/[\/&]/g, '_').replace(/__+/g, '_');
  allSchemas[normalizedName] = generateSchema(category);
});

// Output TypeScript file
const output = `/**
 * PRODUCT TITLE SCHEMA BY CATEGORY - COMPREHENSIVE
 * =================================
 * Generated: ${new Date().toISOString()}
 * 
 * Formula (Option A): Brand - [PRIMARY_SPEC] - [SECONDARY_SPEC] - Category - Finish - Model
 * 
 * Rules:
 * 1. Brand Always First - highest-value keyword for branded search
 * 2. PRIMARY_SPEC - Measurement (if exists) OR Type (if no measurement)
 * 3. SECONDARY_SPEC - Additional Type/Configuration/Installation (if applicable)
 * 4. Category Name - exact category for Google Shopping taxonomy
 * 5. Finish/Color - appearance descriptor (if applicable)
 * 6. Model Number - appended after dash
 * 
 * Max title length: 60-80 chars target, 150 max
 */

export interface TitleSlot {
  position: number;
  attribute: string;
  required: boolean;
}

export interface CategoryTitleSchema {
  categoryId: string;
  categoryName: string;
  department: string;
  family: string;
  slots: TitleSlot[];
  template: string;
  exampleTitle: string;
  seoNotes: string;
}

/**
 * Formatting rules for different spec types
 */
export const FORMATTING_RULES = {
  // Dimensions: Always use 'X-Inch' format with hyphen
  dimension: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${Math.round(num)}-Inch\`;
  },
  
  // Capacity: Use 'XX Cu. Ft.' with period after Cu
  capacity: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    const formatted = num % 1 === 0 ? num.toString() : num.toFixed(1);
    return \`\${formatted} Cu. Ft.\`;
  },
  
  // BTU: Use comma separator
  btu: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${num.toLocaleString()} BTU\`;
  },
  
  // CFM
  cfm: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${Math.round(num)} CFM\`;
  },
  
  // GPM
  gpm: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${num.toFixed(1)} GPM\`;
  },
  
  // dBA Level
  dba: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${Math.round(num)} dBA\`;
  },
  
  // kW
  kw: (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${num} kW\`;
  },
  
  // Light Count
  lightCount: (value: number | string): string => {
    const num = typeof value === 'string' ? parseInt(value) : value;
    if (isNaN(num) || num <= 0) return '';
    return \`\${num}-Light\`;
  },
  
  // Dimensions W×H format
  dimensionsWxH: (width: number | string, height: number | string): string => {
    const w = parseFloat(String(width));
    const h = parseFloat(String(height));
    if (isNaN(w) || isNaN(h)) return '';
    return \`\${Math.round(w)}×\${Math.round(h)}\`;
  },
  
  // Tile Size format
  tileSize: (value: string): string => {
    // Expected format: "12x24" or "12×24" -> "12"×24""
    const match = value.match(/(\d+)\s*[x×]\s*(\d+)/i);
    if (match) {
      return \`\${match[1]}"×\${match[2]}"\`;
    }
    return value;
  }
};

/**
 * Attribute-to-formatter mapping
 */
export const ATTRIBUTE_FORMATTERS: Record<string, keyof typeof FORMATTING_RULES> = {
  'Width (Inches)': 'dimension',
  'Width (Inches)*': 'dimension',
  'Height (Inches)': 'dimension',
  'Length (Inches)': 'dimension',
  'Diameter (Inches)': 'dimension',
  'Aperture (Inches)': 'dimension',
  'Blade Span (Inches)': 'dimension',
  'Plank Width (Inches)': 'dimension',
  'Capacity (Cu. Ft.)': 'capacity',
  'BTU': 'btu',
  'BTU/Watts': 'btu',
  'Tonnage/BTU': 'btu',
  'CFM': 'cfm',
  'GPM/BTU': 'gpm',
  'dBA Level': 'dba',
  'Power (kW)': 'kw',
  'Light Count': 'lightCount',
  'Dimensions (W×H)': 'dimensionsWxH',
  'Tile Size': 'tileSize'
};

/**
 * Category title schemas (all 177 categories)
 */
export const CATEGORY_TITLE_SCHEMAS: Record<string, CategoryTitleSchema> = ${JSON.stringify(allSchemas, null, 2)};

/**
 * Get title schema for a category (case-insensitive lookup)
 */
export function getCategoryTitleSchema(categoryName: string): CategoryTitleSchema | null {
  const normalized = categoryName.toLowerCase().replace(/\s+/g, '_').replace(/[\/&]/g, '_').replace(/__+/g, '_');
  return CATEGORY_TITLE_SCHEMAS[normalized] || null;
}

export default {
  CATEGORY_TITLE_SCHEMAS,
  getCategoryTitleSchema,
  FORMATTING_RULES,
  ATTRIBUTE_FORMATTERS
};
`;

// Write to file
const outputPath = path.join(__dirname, '../src/config/title-schema-by-category-v2.ts');
fs.writeFileSync(outputPath, output, 'utf8');

console.log(`✅ Generated comprehensive title schemas for all ${categories.length} categories`);
console.log(`📄 Output: ${outputPath}`);
console.log('\nNext steps:');
console.log('1. Review the generated schemas');
console.log('2. Replace src/config/title-schema-by-category.ts with the new file');
console.log('3. Update imports if needed');
