/**
 * CATEGORY-STYLE MAPPING
 * ======================
 * Defines valid Style values for each Category
 * 
 * STYLE TYPES (Hybrid Approach):
 * 1. PRODUCT TYPES - What the product actually IS (for design products: faucets, lighting, hardware)
 *    Examples: "Showerhead", "Rain Head", "Pendant", "Single Hole Faucet"
 * 2. FUNCTIONAL STYLES - Installation/configuration type (for appliances)
 *    Examples: "Gas", "French Door", "Front Load", "Built-In"
 * 3. DESIGN STYLES - Aesthetic/visual theme (fallback for all categories)
 *    Examples: "Modern", "Contemporary", "Traditional", "Industrial"
 * 
 * CATEGORY STRATEGY:
 * - APPLIANCES (Refrigerator, Range, etc.): Use functional styles (Gas, French Door, etc.)
 * - DESIGN PRODUCTS (Showers, Faucets, Lighting): Use product types FIRST, design styles as fallback
 * - AI should prefer product types over design styles when both match
 * - "Theme" attribute captures design aesthetic separately in Additional_Attributes
 * 
 * HOW IT WORKS:
 * - When AI returns a style, we check if it's valid for the category
 * - If valid AND in SF picklist → use it
 * - If valid but NOT in SF picklist → add to Style_Requests (SF creates it)
 * - If not valid for category → log warning, don't use
 * 
 * TO ADD NEW STYLES:
 * 1. Add the style to the appropriate category array below
 * 2. Deploy to production
 * 3. Next API call with that style will include it in Style_Requests
 * 4. SF adds it to their picklist and syncs back
 * 
 * Updated: 2026-02-04 - Added product types for Showers category
 */

// ============================================
// UNIVERSAL DESIGN STYLES
// These aesthetic styles apply to most non-appliance categories
// ============================================
const UNIVERSAL_DESIGN_STYLES = [
  'Modern',
  'Contemporary', 
  'Traditional',
  'Transitional',
  'Industrial',
  'Farmhouse',
  'Rustic',
  'Coastal',
  'Mid-Century Modern',
  'Art Deco',
  'Minimalist',
  'Vintage',
  'Classic'
];

// ============================================
// CATEGORY-SPECIFIC STYLE MAPPINGS
// ============================================

export const CATEGORY_STYLE_MAPPING: Record<string, string[]> = {
  
  // ==========================================
  // APPLIANCES (Functional Styles)
  // ==========================================
  'All in One Washer / Dryer': [
    'Unitized',
    'Front Load'
  ],
  
  'Barbeques': [
    'Accessory',
    'Electric',
    'Gas',
    'Charcoal',
    'Pellet',
    'Built-In',
    'Freestanding',
    'Portable'
  ],
  
  'Cooktop': [
    'Gas',
    'Induction',
    'Electric',
    'Downdraft'
  ],
  
  'Dishwasher': [
    'Undercounter',
    'Accessory',
    'Built-In',
    'Drawer',
    'Portable',
    'Top Control',
    'Front Control',
    'Built-In Top Control'
  ],
  
  'Drawer': [
    'Warming'
  ],
  
  'Dryer': [
    'Front Load',
    'Gas',
    'Electric'
  ],
  
  'Freezer': [
    'Undercounter',
    'Column',
    'Chest',
    'Upright',
    'Bottom-Freezer',
    'Built-In'
  ],
  
  'Icemaker': [
    'Undercounter',
    'Built-In',
    'Freestanding',
    'Portable'
  ],
  
  'Microwave': [
    'Over-the-Range',
    'Countertop',
    'Accessory',
    'Single',
    'Built-In',
    'Drawer'
  ],
  
  'Oven': [
    'Single',
    'Double Wall',
    'Accessory',
    'Microwave Combo',
    'Convection',
    'Steam',
    'Speed'
  ],
  
  'Range': [
    'Electric',
    'Accessory',
    'Gas',
    'Induction',
    'Dual Fuel',
    'Slide-In',
    'Freestanding'
  ],
  
  'Range Hood': [
    'Accessory',
    'Wall-Mounted',
    'Insert',
    'Under Cabinet',
    'Island Mount',
    'Downdraft',
    'Chimney'
  ],
  
  'Refrigerator': [
    'Beverage Center',
    'Column',
    'Wine Cooler',
    'Drawer',
    'French Door',
    'Side-by-Side',
    'Bottom-Freezer',
    'Top-Freezer',
    'Accessory',
    'Kegerator',
    'Upright',
    'Undercounter',
    'Built-In',
    'Counter-Depth'
  ],
  
  'Standalone Pedestal': [
    'Standalone'
  ],
  
  'Washer': [
    'Front Load',
    'Top Load'
  ],
  
  // ==========================================
  // LIGHTING (Design + Functional Styles)
  // ==========================================
  'Bathroom Lighting': [
    // FIXTURE TYPES (Primary)
    'Vanity Light',        // Vanity/bath bar
    'Bath Bar',            // Bath bar (multi-light)
    'Sconce',              // Wall sconce
    'Flush Mount',         // Ceiling flush mount
    'Semi-Flush',          // Semi-flush ceiling
    'Pendant',             // Pendant light
    'Recessed',            // Recessed lighting
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Kitchen Lighting': [
    // FIXTURE TYPES (Primary)
    'Pendant',             // Pendant light
    'Island Pendant',      // Island pendant
    'Under Cabinet',       // Under cabinet lighting
    'Track',               // Track lighting
    'Recessed',            // Recessed lighting
    'Flush Mount',         // Flush mount ceiling
    'Linear',              // Linear fixture
    'Chandelier',          // Kitchen chandelier
    'Semi-Flush',          // Semi-flush ceiling
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Outdoor Lighting': [
    // FIXTURE TYPES (Primary)
    'Wall Lantern',        // Wall-mounted lantern
    'Post Light',          // Post/pole light
    'Path Light',          // Path/walkway light
    'Flood Light',         // Flood/spot light
    'Landscape',           // Landscape lighting
    'Security',            // Security light
    'Deck',                // Deck/step light
    'String Lights',       // String/bistro lights
    'Bollard',             // Bollard light
    'Well Light',          // In-ground well light
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Ceiling Lights': [
    // FIXTURE TYPES (Primary)
    'Flush Mount',         // Flush mount ceiling
    'Semi-Flush',          // Semi-flush ceiling
    'Recessed',            // Recessed lighting
    'Track',               // Track lighting
    'Linear',              // Linear fixture
    'Chandelier',          // Ceiling chandelier
    'Pendant',             // Ceiling pendant
    'Fan Light',           // Ceiling fan with light
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Wall Sconces': [
    // SCONCE TYPES (Primary)
    'Up Light',            // Uplight sconce
    'Down Light',          // Downlight sconce
    'Up/Down Light',       // Up/down sconce
    'Swing Arm',           // Swing arm sconce
    'Picture Light',       // Picture light
    'Torch',               // Torch sconce
    'Candle',              // Candle sconce
    'Vanity Sconce',       // Vanity sconce
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Chandeliers': [
    // CHANDELIER TYPES (Primary)
    'Crystal',             // Crystal chandelier
    'Candle',              // Candle-style chandelier
    'Drum',                // Drum chandelier
    'Globe',               // Globe chandelier
    'Sputnik',             // Sputnik/starburst
    'Tiered',              // Multi-tier chandelier
    'Linear',              // Linear/island chandelier
    'Empire',              // Empire chandelier
    'Wagon Wheel',         // Wagon wheel chandelier
    'Beaded',              // Beaded chandelier
    'Lantern',             // Lantern chandelier
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Pendants': [
    // PENDANT TYPES (Primary)
    'Mini Pendant',        // Mini pendant (single)
    'Multi-Light',         // Multi-light pendant
    'Drum',                // Drum pendant
    'Globe',               // Globe pendant
    'Cone',                // Cone/tapered pendant
    'Linear',              // Linear/island pendant
    'Cluster',             // Cluster pendant
    'Schoolhouse',         // Schoolhouse pendant
    'Lantern',             // Lantern pendant
    'Dome',                // Dome pendant
    'Bowl',                // Bowl pendant
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // BATHROOM FIXTURES (Functional + Design)
  // ==========================================
  'Bathroom Faucets': [
    // PRODUCT TYPES (Primary - installation/mounting type)
    'Single Hole',         // Single-hole deck mount
    'Widespread',          // 3-hole widespread mount
    'Centerset',           // 4" centerset mount
    'Wall Mounted',        // Wall mount
    'Vessel',              // Vessel sink faucet
    'Waterfall',           // Waterfall spout style
    'Mini Widespread',     // Compact widespread
    'Single Handle',       // Single-handle control
    'Two Handle',          // Two-handle control
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Kitchen Faucets': [
    // PRODUCT TYPES (Primary - functional type)
    'Pull-Down',           // Pull-down spray head
    'Pull-Out',            // Pull-out spray head
    'Single Handle',       // Single-handle control
    'Two Handle',          // Two-handle control
    'Bridge',              // Bridge-style faucet
    'Pot Filler',          // Pot filler faucet
    'Commercial',          // Commercial-style (spring spout)
    'Touchless',           // Touchless/sensor activated
    'Bar/Prep',            // Bar or prep sink faucet
    'Wall Mount',          // Wall-mounted faucet
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Tub Faucets': [
    // PRODUCT TYPES (Primary - mounting type)
    'Freestanding',        // Floor-mounted tub filler
    'Deck Mounted',        // Deck-mounted (on tub rim)
    'Wall Mounted',        // Wall-mounted
    'Roman Tub',           // Roman tub (wide-spread deck mount)
    'Waterfall',           // Waterfall spout
    'Tub Filler',          // Generic tub filler
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Shower Faucets': [
    // PRODUCT TYPES (Primary - valve/control type)
    'Thermostatic',        // Thermostatic valve
    'Pressure Balance',    // Pressure balance valve
    'Manual',              // Manual valve (no temp control)
    'Diverter',            // Diverter valve
    'Transfer',            // Transfer valve
    'Volume Control',      // Volume control only
    'Trim Kit',            // Trim kit (no valve)
    'Complete System',     // Complete valve + trim
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Bathtubs': [
    // INSTALLATION TYPES (Primary)
    'Freestanding',        // Freestanding tub
    'Alcove',              // 3-wall alcove
    'Drop-In',             // Drop-in installation
    'Undermount',          // Undermount installation
    'Corner',              // Corner installation
    'Walk-In',             // Walk-in tub
    
    // SPECIAL FEATURES (Secondary)
    'Clawfoot',            // Clawfoot tub
    'Soaking',             // Deep soaking tub
    'Whirlpool',           // Whirlpool/jetted
    'Air Bath',            // Air bath
    'Japanese Soaking',    // Japanese soaking tub
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Showers': [
    // PRODUCT TYPES (Primary - AI should prefer these)
    'Showerhead',          // Generic standalone showerhead
    'Rain Head',           // Large overhead rain showerheads
    'Handheld',            // Handheld showerheads
    'Shower System',       // Complete systems (valve + trim + head)
    'Body Spray',          // Body spray jets
    'Shower Panel',        // Tower/panel systems
    'Dual Shower',         // Combo (fixed + handheld)
    
    // INSTALLATION TYPES (Secondary)
    'Alcove',
    'Corner',
    'Walk-In',
    'Neo-Angle',
    'Doorless',
    'Barrier-Free',
    
    // SPECIAL FEATURES (Tertiary)
    'Steam',
    
    // DESIGN STYLES (Fallback - only use if no product type matches)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Shower Accessories': [
    // ACCESSORY TYPES (Primary)
    'Rain Head',           // Rain showerhead
    'Handheld',            // Handheld showerhead
    'Body Spray',          // Body spray jet
    'Shower System',       // Complete shower system
    'Shelf',               // Shower shelf/caddy
    'Seat',                // Shower seat/bench
    'Grab Bar',            // Shower grab bar
    'Soap Dish',           // Shower soap dish
    'Hook',                // Robe/towel hook
    'Niche',               // Built-in shower niche
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Bathroom Sinks': [
    // INSTALLATION TYPES (Primary)
    'Undermount',          // Undermount sink
    'Drop-In',             // Drop-in/self-rimming
    'Vessel',              // Vessel/above-counter
    'Pedestal',            // Pedestal sink
    'Wall Mounted',        // Wall-mounted/wall-hung
    'Console',             // Console sink
    'Semi-Recessed',       // Semi-recessed
    'Integrated',          // Integrated sink/counter
    'Farmhouse',           // Farmhouse/apron front
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Bathroom Vanities': [
    // CONFIGURATION TYPES (Primary)
    'Single Sink',         // Single sink vanity
    'Double Sink',         // Double sink vanity
    'Floating',            // Wall-mounted/floating
    'Freestanding',        // Freestanding floor mount
    'Wall Mounted',        // Wall-mounted
    'Corner',              // Corner vanity
    'Modular',             // Modular vanity system
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Bathroom Mirrors': [
    // PRODUCT TYPES (Primary)
    'Framed',              // Framed mirror
    'Frameless',           // Frameless mirror
    'Medicine Cabinet',    // Medicine cabinet with mirror
    'Lighted',             // LED lighted mirror
    'Magnifying',          // Magnifying mirror
    'Pivot',               // Pivot/tilt mirror
    'Wall Mirror',         // Standard wall mirror
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Bathroom Hardware and Accessories': [
    // PRODUCT TYPES (Primary)
    'Towel Bar',           // Towel bar
    'Towel Ring',          // Towel ring
    'Robe Hook',           // Robe hook
    'Toilet Paper Holder', // TP holder
    'Shelf',               // Bathroom shelf
    'Grab Bar',            // Safety grab bar
    'Soap Dish',           // Soap dish
    'Towel Rack',          // Towel rack
    'Hardware Set',        // Complete accessory set
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // PLUMBING (Functional Styles)
  // ==========================================
  'Rough-In Valves': [
    'Thermostatic',
    'Pressure Balance',
    'Diverter',
    'Volume Control',
    'Transfer'
  ],
  
  'Toilets': [
    // CONFIGURATION TYPES (Primary)
    'One-Piece',           // One-piece toilet
    'Two-Piece',           // Two-piece toilet
    'Wall Mounted',        // Wall-hung toilet
    'Smart',               // Smart/bidet toilet
    'Comfort Height',      // Comfort height/ADA
    
    // BOWL TYPES (Secondary)
    'Elongated',           // Elongated bowl
    'Round',               // Round bowl
    'Compact Elongated',   // Compact elongated
    
    // SPECIAL FEATURES (Tertiary)
    'Dual Flush',          // Dual flush
    'Touchless',           // Touchless flush
    'Bidet Toilet',        // Integrated bidet
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Bidets': [
    // PRODUCT TYPES (Primary)
    'Bidet Seat',          // Bidet toilet seat
    'Standalone',          // Standalone bidet fixture
    'Bidet Attachment',    // Bidet attachment
    'Handheld Bidet',      // Handheld bidet sprayer
    'Electronic Bidet',    // Electronic bidet seat
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // KITCHEN (Functional + Design)
  // ==========================================
  'Kitchen Sinks': [
    // INSTALLATION TYPES (Primary)
    'Undermount',          // Undermount sink
    'Drop-In',             // Drop-in/self-rimming
    'Farmhouse',           // Farmhouse/apron front
    'Apron Front',         // Apron front (alias for farmhouse)
    'Top Mount',           // Top mount
    
    // CONFIGURATION TYPES (Secondary)
    'Single Bowl',         // Single basin
    'Double Bowl',         // Double basin
    'Triple Bowl',         // Triple basin
    'Bar/Prep',            // Bar or prep sink
    'Workstation',         // Workstation sink
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // OUTDOOR / BBQ (Functional Styles)
  // ==========================================
  'Storage Drawers/Doors': [
    'Outdoor Kitchen Components',
    'Outdoor Kitchen Storage',
    'BBQ Accessories',
    'Built-In',
    'Stainless Steel'
  ],
  
  'Outdoor Kitchen': [
    'Built-In',
    'Modular',
    'Island',
    'Cart'
  ],
  
  // ==========================================
  // DOOR HARDWARE (Design + Functional)
  // ==========================================
  'Door Hardware': [
    // FUNCTION TYPES (Primary)
    'Keyed Entry',         // Keyed entry lockset
    'Privacy',             // Privacy lockset
    'Passage',             // Passage (no lock)
    'Dummy',               // Dummy (non-functional)
    'Deadbolt',            // Deadbolt lock
    'Handleset',           // Entry handleset
    'Smart Lock',          // Smart/electronic lock
    'Keyless Entry',       // Keyless entry
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  
  'Door Hardware Parts': [
    // PART TYPES (Primary)
    'Lever',               // Door lever
    'Knob',                // Door knob
    'Handle Set',          // Complete handle set
    'Hinge',               // Door hinge
    'Strike Plate',        // Strike plate
    'Deadbolt',            // Deadbolt component
    'Escutcheon',          // Decorative plate
    'Rosette',             // Rosette trim
    'Backplate',           // Backplate
    'Cylinder',            // Lock cylinder
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // FURNITURE (Design Styles)
  // ==========================================
  'Furniture': [
    // FURNITURE TYPES (Primary)
    'Accent',              // Accent furniture
    'Storage',             // Storage furniture
    'Seating',             // Seating furniture
    'Table',               // Table
    'Decorative',          // Decorative furniture
    'Cabinet',             // Cabinet
    'Shelving',            // Shelving unit
    'Dresser',             // Dresser/chest
    'Desk',                // Desk
    'Console',             // Console table
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Bath Furniture': [
    // FURNITURE TYPES (Primary)
    'Linen Cabinet',       // Linen storage cabinet
    'Storage Tower',       // Tall storage tower
    'Bench',               // Bathroom bench
    'Hamper',              // Laundry hamper
    'Vanity Stool',        // Vanity stool/chair
    'Shelving',            // Bathroom shelving
    'Cabinet',             // Storage cabinet
    'Etagere',             // Open shelving unit
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // SESSION 3: PLUMBING FAUCETS & FIXTURES
  // ==========================================
  'Bar Faucets': [
    // PRODUCT TYPES (Primary)
    'Pull-Down',           // Pull-down spray
    'Pull-Out',            // Pull-out spray
    'Single Handle',       // Single-handle control
    'Two Handle',          // Two-handle control
    'Gooseneck',           // High-arc gooseneck
    'Pot Filler',          // Pot filler for bar
    'Prep Faucet',         // Prep sink faucet
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Bidet Faucets': [
    // PRODUCT TYPES (Primary)
    'Single Hole',         // Single-hole mount
    'Wall Mounted',        // Wall mount
    'Deck Mounted',        // Deck mount
    'Two Handle',          // Two-handle control
    'Single Handle',       // Single-handle control
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Food Service Faucets': [
    // PRODUCT TYPES (Primary)
    'Pre-Rinse',           // Pre-rinse spray faucet
    'Wall Mount',          // Wall-mounted
    'Deck Mount',          // Deck-mounted
    'Pot Filler',          // Pot filler faucet
    'Utility',             // Utility faucet
    'Single Hole',         // Single-hole mount
    'Add-On Faucet',       // Add-on faucet
    
    // DESIGN STYLES (Fallback)
    'Commercial',
    'Industrial',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Outdoor Shower Faucets': [
    // PRODUCT TYPES (Primary)
    'Wall Mounted',        // Wall-mounted control
    'Post Mounted',        // Post/pole mounted
    'Thermostatic',        // Thermostatic valve
    'Single Handle',       // Single-handle control
    'Handheld',            // Handheld shower
    'Fixed Head',          // Fixed showerhead
    
    // DESIGN STYLES (Fallback)
    'Coastal',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Pot Filler Faucets': [
    // PRODUCT TYPES (Primary)
    'Wall Mounted',        // Wall-mounted
    'Deck Mounted',        // Deck-mounted
    'Articulating',        // Articulating arm
    'Single Handle',       // Single-handle control
    'Dual Handle',         // Dual-handle control
    'Folding',             // Folding/swing arm
    
    // DESIGN STYLES (Fallback)
    'Commercial',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Bar & Prep Sinks': [
    // INSTALLATION TYPES (Primary)
    'Undermount',          // Undermount installation
    'Drop-In',             // Drop-in/self-rimming
    'Vessel',              // Vessel/above-counter
    'Single Bowl',         // Single basin
    'Corner',              // Corner sink
    'Bar Sink',            // Bar sink
    'Prep Sink',           // Prep sink
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Kitchen Sink Combos': [
    // COMBO TYPES (Primary)
    'Undermount Combo',    // Undermount sink + faucet
    'Drop-In Combo',       // Drop-in sink + faucet
    'Farmhouse Combo',     // Farmhouse sink + faucet
    'Single Bowl Combo',   // Single bowl combo
    'Double Bowl Combo',   // Double bowl combo
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Bidet Seats': [
    // PRODUCT TYPES (Primary)
    'Electronic Bidet',    // Electronic bidet seat
    'Non-Electric',        // Non-electric bidet seat
    'Heated',              // Heated bidet seat
    'Remote Control',      // Remote-controlled
    'Elongated',           // Elongated bowl fit
    'Round',               // Round bowl fit
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Toilet Seats': [
    // PRODUCT TYPES (Primary)
    'Elongated',           // Elongated bowl
    'Round',               // Round bowl
    'Soft Close',          // Soft-close lid
    'Quick Release',       // Quick-release hinges
    'Heated',              // Heated seat
    'Bidet Seat',          // Bidet toilet seat
    'Standard',            // Standard seat
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Medicine Cabinets': [
    // PRODUCT TYPES (Primary)
    'Surface Mount',       // Surface-mounted
    'Recessed',            // Recessed/in-wall
    'Lighted',             // LED lighted
    'Frameless',           // Frameless mirror
    'Framed',              // Framed mirror
    'Tri-View',            // Tri-view (3 doors)
    'Single Door',         // Single door
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // SESSION 3: FURNITURE & DÉCOR
  // ==========================================
  'Chairs': [
    // CHAIR TYPES (Primary)
    'Dining Chair',        // Dining chair
    'Accent Chair',        // Accent/side chair
    'Office Chair',        // Office/desk chair
    'Lounge Chair',        // Lounge/armchair
    'Rocking Chair',       // Rocking chair
    'Bar Stool',           // Bar/counter stool
    'Vanity Stool',        // Vanity/dressing stool
    'Bench',               // Bench seating
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Mid-Century',
    'Scandinavian'
  ],
  
  'Home Accents': [
    // ACCENT TYPES (Primary)
    'Vase',                // Decorative vase
    'Sculpture',           // Sculpture/statue
    'Picture Frame',       // Picture frame
    'Candle Holder',       // Candle holder
    'Decorative Bowl',     // Decorative bowl
    'Decorative Tray',     // Decorative tray
    'Figurine',            // Decorative figurine
    'Clock',               // Wall/table clock
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Eclectic',
    'Bohemian'
  ],
  
  'Kitchen Accessories': [
    // ACCESSORY TYPES (Primary)
    'Utensil Holder',      // Utensil holder/crock
    'Soap Dispenser',      // Sink soap dispenser
    'Cutting Board',       // Cutting board
    'Sink Grid',           // Sink bottom grid
    'Drain Board',         // Drain board
    'Colander',            // Sink colander
    'Dish Rack',           // Dish drying rack
    'Towel Holder',        // Towel bar/ring
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Kitchen Furniture and Decor': [
    // FURNITURE TYPES (Primary)
    'Kitchen Island',      // Kitchen island
    'Kitchen Cart',        // Rolling cart
    'Bakers Rack',         // Bakers rack/shelf
    'Bar Stool',           // Bar/counter stool
    'Wine Rack',           // Wine storage rack
    'Pot Rack',            // Hanging pot rack
    'Microwave Cart',      // Microwave stand/cart
    'Buffet',              // Kitchen buffet/sideboard
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Wall Decor': [
    // DECOR TYPES (Primary)
    'Wall Art',            // Framed art/canvas
    'Mirror',              // Decorative mirror
    'Wall Clock',          // Wall clock
    'Wall Shelf',          // Decorative shelf
    'Wall Sconce',         // Decorative sconce
    'Wall Hanging',        // Tapestry/macrame
    'Photo Frame',         // Picture frame
    'Wall Sculpture',      // 3D wall art
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Bohemian',
    'Eclectic'
  ],
  
  // ==========================================
  // SESSION 2: CEILING FANS (20 categories)
  // ==========================================
  'Ceiling Fans': [
    // FAN TYPES (Primary)
    'Standard',            // Standard ceiling fan
    'Low Profile',         // Low-profile/hugger fan
    'Outdoor',             // Outdoor-rated fan
    'Indoor',              // Indoor-only fan
    'With Light',          // Fan with light kit
    'Without Light',       // Fan without light
    'Remote Control',      // Remote-controlled
    'Smart Fan',           // WiFi/app controlled
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Coastal',
    'Tropical'
  ],
  
  'Ceiling Fans with Light': [
    // FAN TYPES (Primary)
    'Standard with Light', // Standard fan + light
    'Low Profile',         // Hugger with light
    'Outdoor',             // Outdoor with light
    'LED',                 // LED light kit
    'Fandelier',           // Chandelier + fan
    'Remote Control',      // Remote with light
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Coastal',
    'Tropical'
  ],
  
  'Ceiling Fans with Remotes': [
    // FAN TYPES (Primary)
    'Remote Standard',     // Standard with remote
    'Remote Low Profile',  // Hugger with remote
    'Remote Outdoor',      // Outdoor with remote
    'Smart Remote',        // Smart/WiFi remote
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Ceiling Fans without Light': [
    // FAN TYPES (Primary)
    'Standard No Light',   // Standard fan only
    'Low Profile',         // Hugger without light
    'Outdoor',             // Outdoor without light
    'Minimalist',          // Minimalist design
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'DC Motor Ceiling Fans': [
    // FAN TYPES (Primary)
    'DC Motor',            // Energy-efficient DC
    'DC with Light',       // DC motor + light
    'DC Outdoor',          // DC outdoor-rated
    'DC Smart',            // DC smart/WiFi
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Designer Ceiling Fans': [
    // FAN TYPES (Primary)
    'Statement',           // Statement piece fan
    'Sculptural',          // Sculptural design
    'Art Piece',           // Artistic fan
    'Designer Collection', // Designer brand
    'Luxury',              // Luxury design
    
    // DESIGN STYLES (Fallback)
    'Luxury',
    ...UNIVERSAL_DESIGN_STYLES,
    'Art Deco'
  ],
  
  'Dual Ceiling Fans': [
    // FAN TYPES (Primary)
    'Dual Head',           // Dual fan heads
    'Twin Motor',          // Twin motor system
    'Double',              // Double fan
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Fandelier Ceiling Fans': [
    // FANDELIER TYPES (Primary)
    'Crystal Fandelier',   // Crystal chandelier fan
    'Drum Fandelier',      // Drum chandelier fan
    'Candelabra',          // Candelabra fan
    'Chandelier Fan',      // Chandelier + fan
    'Glam Fandelier',      // Glam/luxury fan
    
    // DESIGN STYLES (Fallback)
    'Glam',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Hugger Fans': [
    // FAN TYPES (Primary)
    'Low Profile',         // Low-profile mount
    'Flush Mount',         // Flush ceiling mount
    'Hugger',              // Hugger-style
    'Compact',             // Compact hugger
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Indoor Ceiling Fans': [
    // FAN TYPES (Primary)
    'Standard Indoor',     // Standard indoor fan
    'Living Room',         // Living room fan
    'Bedroom',             // Bedroom fan
    'Dining Room',         // Dining room fan
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Large Ceiling Fans': [
    // FAN TYPES (Primary)
    'Large Standard',      // 60"+ standard
    'Large Industrial',    // Large industrial fan
    'Large Outdoor',       // Large outdoor fan
    'Great Room',          // Great room fan
    'Commercial',          // Commercial large fan
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Industrial'
  ],
  
  'LED Ceiling Fans': [
    // FAN TYPES (Primary)
    'LED Integrated',      // Integrated LED
    'LED Kit',             // LED light kit
    'LED Outdoor',         // LED outdoor fan
    'LED Smart',           // LED smart fan
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Lighted Ceiling Fans': [
    // FAN TYPES (Primary)
    'Standard Lighted',    // Standard with light
    'Multi-Light',         // Multiple lights
    'Uplighting',          // Uplight design
    'Downlighting',        // Downlight design
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Small Ceiling Fans': [
    // FAN TYPES (Primary)
    'Mini',                // Under 36" mini fan
    'Compact',             // 36-44" compact
    'Small Outdoor',       // Small outdoor fan
    'Small Indoor',        // Small indoor fan
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Smart Home Fans': [
    // FAN TYPES (Primary)
    'WiFi Enabled',        // WiFi connected
    'Voice Control',       // Alexa/Google compatible
    'App Control',         // Smartphone app
    'Automated',           // Automated/scheduled
    'Smart Hub',           // Smart home hub
    
    // DESIGN STYLES (Fallback)
    'Smart Home',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Trending Ceiling Fans': [
    // FAN TYPES (Primary - based on current trends)
    'Bladeless',           // Bladeless design
    'Caged',               // Industrial caged
    'Propeller',           // Propeller style
    'Geometric',           // Geometric design
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Utility Fans': [
    // FAN TYPES (Primary)
    'Barn Fan',            // Agricultural barn fan
    'Warehouse Fan',       // Warehouse/industrial
    'Garage Fan',          // Garage ceiling fan
    'Commercial',          // Commercial-grade
    'High Velocity',       // High-velocity fan
    
    // DESIGN STYLES (Fallback)
    'Industrial',
    'Commercial'
  ],
  
  'Wall Mounted Fans': [
    // FAN TYPES (Primary)
    'Oscillating',         // Oscillating wall fan
    'Fixed',               // Fixed position
    'Directional',         // Adjustable direction
    'Outdoor Wall Fan',    // Outdoor wall mount
    'Misting Fan',         // Misting wall fan
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Industrial'
  ],
  
  // ==========================================
  // SESSION 2: ADDITIONAL LIGHTING (9 categories)
  // ==========================================
  'Flush and Semi-Flush': [
    // FIXTURE TYPES (Primary)
    'Flush Mount',         // Flush ceiling mount
    'Semi-Flush',          // Semi-flush mount
    'Drum',                // Drum-style flush
    'Bowl',                // Bowl-style flush
    'Dome',                // Dome-style flush
    'Low Profile',         // Low-profile flush
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Island Lighting': [
    // FIXTURE TYPES (Primary)
    'Linear Island',       // Linear island pendant
    'Multi-Pendant',       // Multiple pendants
    'Island Chandelier',   // Island chandelier
    'Track Island',        // Track lighting
    'Billiard',            // Billiard/pool table
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Landscape Lighting': [
    // FIXTURE TYPES (Primary)
    'Path Light',          // Path/walkway light
    'Spotlight',           // Landscape spotlight
    'Well Light',          // In-ground well light
    'Deck Light',          // Deck/step light
    'Bollard',             // Bollard light
    'Flood Light',         // Landscape flood
    'Tree Light',          // Tree uplighting
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Post Lights': [
    // FIXTURE TYPES (Primary)
    'Lamp Post',           // Traditional lamp post
    'Pier Mount',          // Pier/column mount
    'Deck Post',           // Deck post light
    'Driveway Post',       // Driveway post
    'Solar Post',          // Solar-powered post
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Colonial',
    'Lantern'
  ],
  
  'Recessed Lighting': [
    // FIXTURE TYPES (Primary)
    'New Construction',    // New construction housing
    'Remodel',             // Remodel/retrofit housing
    'IC Rated',            // Insulation contact rated
    'LED Module',          // Integrated LED module
    'Gimbal',              // Adjustable gimbal
    'Shower Trim',         // Wet location trim
    'Baffle Trim',         // Baffle trim
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Step Lighting': [
    // FIXTURE TYPES (Primary)
    'Recessed Step',       // Recessed step light
    'Surface Step',        // Surface-mount step
    'LED Strip',           // LED strip lighting
    'Bollard',             // Step bollard
    'Deck Step',           // Deck step light
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Track and Rail Lighting': [
    // FIXTURE TYPES (Primary)
    'H Track',             // H-type track
    'J Track',             // J-type track
    'L Track',             // L-type track
    'Monorail',            // Flexible monorail
    'Flexible Track',      // Flexible track system
    'Linear Track',        // Linear track
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Under Cabinet Lights': [
    // FIXTURE TYPES (Primary)
    'LED Strip',           // LED strip/tape
    'Puck Light',          // Puck lights
    'Linear Bar',          // Linear light bar
    'Tape Light',          // Flexible tape light
    'Link Light',          // Linkable under-cabinet
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Lamps': [
    // LAMP TYPES (Primary)
    'Table Lamp',          // Table/desk lamp
    'Floor Lamp',          // Floor lamp
    'Desk Lamp',           // Desk/task lamp
    'Buffet Lamp',         // Buffet/console lamp
    'Accent Lamp',         // Accent/decorative lamp
    'Arc Lamp',            // Arc floor lamp
    'Torchiere',           // Torchiere floor lamp
    'Swing Arm',           // Swing arm lamp
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Mid-Century'
  ],
  
  // ==========================================
  // SESSION 1: CABINET HARDWARE (21 categories)
  // ==========================================
  'Cabinet Hardware': [
    // HARDWARE TYPES (Primary)
    'Knob',                // Cabinet knob
    'Pull',                // Cabinet pull/handle
    'Handle',              // Cabinet handle
    'Hinge',               // Cabinet hinge
    'Catch',               // Cabinet catch
    'Slide',               // Drawer slide
    'Bin Pull',            // Bin pull
    'Cup Pull',            // Cup pull
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Vintage'
  ],
  
  'Affordable Cabinet Knobs': [
    // KNOB TYPES (Primary)
    'Round Knob',          // Round/ball knob
    'Square Knob',         // Square knob
    'Oval Knob',           // Oval knob
    'Mushroom Knob',       // Mushroom knob
    'T-Knob',              // T-shaped knob
    'Euro Knob',           // Euro-style knob
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Affordable Cabinet Pulls': [
    // PULL TYPES (Primary)
    'Bar Pull',            // Bar/edge pull
    'Cup Pull',            // Cup/bin pull
    'Bin Pull',            // Bin pull
    'Wire Pull',           // Wire pull
    'Arch Pull',           // Arch pull
    'Bow Pull',            // Bow pull
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Luxury Cabinet Knobs': [
    // KNOB TYPES (Primary)
    'Crystal Knob',        // Crystal/glass knob
    'Glass Knob',          // Glass knob
    'Ceramic Knob',        // Ceramic knob
    'Metal Knob',          // Designer metal knob
    'Jeweled Knob',        // Jeweled/gem knob
    'Decorative Knob',     // Ornate decorative
    
    // DESIGN STYLES (Fallback)
    'Luxury',
    'Art Deco',
    ...UNIVERSAL_DESIGN_STYLES,
    'Vintage',
    'Victorian'
  ],
  
  'Luxury Cabinet Pulls': [
    // PULL TYPES (Primary)
    'Appliance Pull',      // Large appliance pull
    'Designer Pull',       // Designer bar pull
    'Decorative Pull',     // Ornate decorative
    'Crystal Pull',        // Crystal/glass pull
    'Art Pull',            // Artistic pull
    'Luxury Handle',       // Luxury handle
    
    // DESIGN STYLES (Fallback)
    'Luxury',
    'Art Deco',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Appliance Pulls': [
    // PULL TYPES (Primary)
    'Refrigerator Pull',   // Refrigerator handle
    'Oven Pull',           // Oven/range handle
    'Dishwasher Pull',     // Dishwasher handle
    'Appliance Handle',    // General appliance
    'Professional Pull',   // Professional-style
    
    // DESIGN STYLES (Fallback)
    'Professional',
    'Commercial',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Designer Cabinet Hardware': [
    // HARDWARE TYPES (Primary)
    'Designer Knob',       // Designer knob
    'Designer Pull',       // Designer pull
    'Designer Handle',     // Designer handle
    'Signature Hardware',  // Signature collection
    'Art Hardware',        // Artistic hardware
    
    // DESIGN STYLES (Fallback)
    'Art Deco',
    'Mid-Century Modern',
    'Luxury',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Cabinet Knobs': [
    // KNOB TYPES (Primary)
    'Round',               // Round/ball knob
    'Square',              // Square knob
    'Oval',                // Oval knob
    'Mushroom',            // Mushroom knob
    'Decorative',          // Decorative knob
    'Crystal',             // Crystal/glass knob
    'Ceramic',             // Ceramic knob
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Vintage'
  ],
  
  'Cabinet Pulls': [
    // PULL TYPES (Primary)
    'Bar Pull',            // Bar/edge pull
    'Cup Pull',            // Cup/bin pull
    'Bin Pull',            // Bin pull
    'Wire Pull',           // Wire pull
    'Appliance Pull',      // Large appliance pull
    'Arch Pull',           // Arch pull
    'Bow Pull',            // Bow pull
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Cabinet Hinges': [
    // HINGE TYPES (Primary)
    'Concealed',           // Concealed/hidden hinge
    'Semi-Concealed',      // Semi-concealed hinge
    'Exposed',             // Exposed/visible hinge
    'Soft Close',          // Soft-close hinge
    'Overlay',             // Overlay hinge
    'Inset',               // Inset hinge
    'Euro Hinge',          // European-style hinge
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Cabinet Catches and Latches': [
    // CATCH TYPES (Primary)
    'Magnetic Catch',      // Magnetic catch
    'Roller Catch',        // Roller ball catch
    'Touch Latch',         // Push-to-open latch
    'Push to Open',        // Push-open mechanism
    'Elbow Catch',         // Elbow catch
    'Ball Catch',          // Ball catch
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Cabinet Locks': [
    // LOCK TYPES (Primary)
    'Cam Lock',            // Cam lock
    'Drawer Lock',         // Drawer lock
    'Glass Door Lock',     // Glass door lock
    'Push Lock',           // Push-button lock
    'Keyed Lock',          // Keyed cabinet lock
    'Disc Lock',           // Disc tumbler lock
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Cabinet Finishing': [
    // FINISHING TYPES (Primary)
    'Edge Banding',        // Edge banding/tape
    'Molding',             // Cabinet molding
    'Toe Kick',            // Toe kick board
    'End Panel',           // Cabinet end panel
    'Crown Molding',       // Crown molding
    'Light Rail',          // Light rail molding
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Cabinet Hardware Bulk Packs': [
    // BULK PACK TYPES (Primary)
    'Bulk Knobs',          // Multi-pack knobs
    'Bulk Pulls',          // Multi-pack pulls
    'Bulk Hinges',         // Multi-pack hinges
    'Value Pack',          // Value pack hardware
    'Contractor Pack',     // Contractor multi-pack
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Cabinet Hardware Mounting Templates': [
    // TEMPLATE TYPES (Primary)
    'Knob Template',       // Knob drilling template
    'Pull Template',       // Pull drilling template
    'Hinge Template',      // Hinge template
    'Universal Template',  // Universal jig
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Cabinet Organization and Storage': [
    // ORGANIZATION TYPES (Primary)
    'Pull-Out Shelf',      // Pull-out shelf
    'Lazy Susan',          // Lazy Susan/turntable
    'Drawer Insert',       // Drawer organizer insert
    'Spice Rack',          // Spice rack/organizer
    'Tray Divider',        // Tray divider
    'Trash Pull-Out',      // Pull-out trash bin
    'Pot Rack',            // Pot/pan organizer
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Drawer Slides and Accessories': [
    // SLIDE TYPES (Primary)
    'Side Mount',          // Side-mount slide
    'Undermount',          // Undermount slide
    'Center Mount',        // Center-mount slide
    'Soft Close',          // Soft-close slide
    'Full Extension',      // Full-extension slide
    'Ball Bearing',        // Ball-bearing slide
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Backplates': [
    // BACKPLATE TYPES (Primary)
    'Oval Backplate',      // Oval backplate
    'Rectangular',         // Rectangular backplate
    'Decorative',          // Decorative backplate
    'Escutcheon',          // Decorative escutcheon
    'Rosette',             // Rosette backplate
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Victorian',
    'Art Deco'
  ],
  
  'Vanity Cabinet Hardware': [
    // HARDWARE TYPES (Primary)
    'Vanity Knob',         // Vanity cabinet knob
    'Vanity Pull',         // Vanity cabinet pull
    'Vanity Handle',       // Vanity handle
    'Bin Pull',            // Bin pull
    'Cup Pull',            // Cup pull
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // SESSION 1: DOOR HARDWARE (18 categories)
  // ==========================================
  'Commercial Door Hardware': [
    // HARDWARE TYPES (Primary)
    'Heavy Duty Lever',    // Heavy-duty lever
    'Panic Bar',           // Panic exit bar
    'Exit Device',         // Exit device
    'ADA Compliant',       // ADA-compliant hardware
    'Commercial Lockset',  // Commercial lockset
    'Grade 1 Lock',        // Grade 1 security
    
    // DESIGN STYLES (Fallback)
    'Commercial',
    'Industrial',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Closet and Pocket Door Hardware': [
    // HARDWARE TYPES (Primary)
    'Bi-Fold',             // Bi-fold door hardware
    'Sliding',             // Sliding closet door
    'Pocket Door',         // Pocket door hardware
    'Bypass Door',         // Bypass door hardware
    'Folding Door',        // Folding door hardware
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Deadbolts': [
    // DEADBOLT TYPES (Primary)
    'Single Cylinder',     // Single-cylinder deadbolt
    'Double Cylinder',     // Double-cylinder deadbolt
    'Keyless',             // Keyless deadbolt
    'Smart Deadbolt',      // Smart/electronic deadbolt
    'Thumbturn',           // Thumbturn deadbolt
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Door Entry Sets': [
    // ENTRY SET TYPES (Primary)
    'Handleset',           // Handleset with deadbolt
    'Keyed Entry',         // Keyed entry set
    'Double Cylinder',     // Double-cylinder entry
    'Smart Entry',         // Smart lock entry set
    'Entry Combo',         // Entry + deadbolt combo
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Craftsman',
    'Tuscan'
  ],
  
  'Door Hardware: Knobs and Levers': [
    // HARDWARE TYPES (Primary)
    'Keyed Entry Knob',    // Keyed entry knob
    'Privacy Knob',        // Privacy knob
    'Passage Knob',        // Passage knob
    'Dummy Knob',          // Dummy/non-functional
    'Entry Lever',         // Keyed entry lever
    'Privacy Lever',       // Privacy lever
    'Passage Lever',       // Passage lever
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Door Hinges': [
    // HINGE TYPES (Primary)
    'Butt Hinge',          // Standard butt hinge
    'Continuous Hinge',    // Piano/continuous hinge
    'Pivot Hinge',         // Pivot hinge
    'Spring Hinge',        // Self-closing spring
    'Barrel Hinge',        // Barrel hinge
    'Strap Hinge',         // Decorative strap hinge
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Door Knobs': [
    // KNOB TYPES (Primary)
    'Keyed Entry',         // Keyed entry knob
    'Privacy',             // Privacy lockset
    'Passage',             // Passage (no lock)
    'Dummy',               // Dummy/decorative
    'Crystal Knob',        // Crystal door knob
    'Vintage Knob',        // Vintage-style knob
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Crystal',
    'Vintage'
  ],
  
  'Door Levers': [
    // LEVER TYPES (Primary)
    'Keyed Entry',         // Keyed entry lever
    'Privacy',             // Privacy lever
    'Passage',             // Passage lever
    'Dummy',               // Dummy lever
    'ADA Compliant',       // ADA-compliant lever
    'Curved Lever',        // Curved lever design
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Handlesets': [
    // HANDLESET TYPES (Primary)
    'Single Cylinder',     // Single-cylinder handleset
    'Double Cylinder',     // Double-cylinder handleset
    'Keyless',             // Keyless entry handleset
    'Smart Lock',          // Smart handleset
    'Grip Handle',         // Grip-style handleset
    'Thumblatch',          // Thumblatch handleset
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Craftsman',
    'Tuscan'
  ],
  
  'Entry Sets': [
    // ENTRY SET TYPES (Primary)
    'Entry + Deadbolt',    // Entry with deadbolt
    'Handleset Entry',     // Handleset entry
    'Smart Entry Set',     // Smart lock entry
    'Keyed Entry',         // Keyed entry set
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Keyed Hardware': [
    // HARDWARE TYPES (Primary)
    'Keyed Knob',          // Keyed knob
    'Keyed Lever',         // Keyed lever
    'Keyed Handleset',     // Keyed handleset
    'Keyed Deadbolt',      // Keyed deadbolt
    'Master Key',          // Master key system
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Keyless Entry': [
    // ENTRY TYPES (Primary)
    'Keypad',              // Keypad entry
    'Fingerprint',         // Fingerprint reader
    'Smart Lock',          // Smart lock (WiFi/app)
    'Card Reader',         // Key card reader
    'Keyless Deadbolt',    // Keyless deadbolt
    'Touchscreen',         // Touchscreen entry
    
    // DESIGN STYLES (Fallback)
    'Smart Home',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Lock Combo Packs': [
    // COMBO PACK TYPES (Primary)
    'Entry + Deadbolt',    // Entry lockset + deadbolt
    'Multiple Passage',    // Multiple passage sets
    'Privacy + Passage',   // Privacy + passage combo
    'Keyed Alike',         // Multiple locks keyed alike
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Mortise Locks': [
    // MORTISE TYPES (Primary)
    'Entry Mortise',       // Entry mortise lock
    'Privacy Mortise',     // Privacy mortise
    'Passage Mortise',     // Passage mortise
    'Commercial Mortise',  // Commercial-grade
    'Heavy Duty',          // Heavy-duty mortise
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Commercial',
    'Vintage'
  ],
  
  'Multi Point Door Hardware': [
    // HARDWARE TYPES (Primary)
    '3-Point Lock',        // 3-point locking
    '5-Point Lock',        // 5-point locking
    'Multi-Point Handle',  // Multi-point handleset
    'Security Lock',       // Multi-point security
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Screen and Storm Door Hardware': [
    // HARDWARE TYPES (Primary)
    'Closer',              // Door closer
    'Handle',              // Screen door handle
    'Latch',               // Screen door latch
    'Hinge',               // Screen door hinge
    'Push Bar',            // Push bar
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Sliding Door Hardware': [
    // HARDWARE TYPES (Primary)
    'Barn Door',           // Barn door hardware
    'Bypass',              // Bypass sliding
    'Pocket Door',         // Pocket door hardware
    'Patio Door',          // Patio sliding door
    'Closet Sliding',      // Closet sliding door
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Barn Door Hardware': [
    // HARDWARE TYPES (Primary)
    'Single Door',         // Single barn door
    'Double Door',         // Double barn door
    'Bypass',              // Bypass barn door
    'Box Rail',            // Box rail track
    'Flat Track',          // Flat track
    'Decorative Rail',     // Decorative track
    
    // DESIGN STYLES (Fallback)
    'Industrial',
    'Farmhouse',
    'Rustic',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // SESSION 4: FLOORING (8 categories)
  // ==========================================
  'Backsplash Kitchen Tile': [
    // TILE TYPES (Primary)
    'Subway',              // Subway tile
    'Mosaic',              // Mosaic tile
    'Glass',               // Glass tile
    'Ceramic',             // Ceramic tile
    'Porcelain',           // Porcelain tile
    'Natural Stone',       // Stone backsplash
    'Marble',              // Marble tile
    'Metal',               // Metal tile
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Mediterranean'
  ],
  
  'Carpet Tile': [
    // TILE TYPES (Primary)
    'Commercial',          // Commercial carpet tile
    'Residential',         // Residential carpet tile
    'Peel-and-Stick',      // Peel-and-stick carpet
    'Interlocking',        // Interlocking carpet
    'Modular',             // Modular carpet tile
    
    // DESIGN STYLES (Fallback)
    'Commercial',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Hardwood Flooring': [
    // FLOORING TYPES (Primary)
    'Solid',               // Solid hardwood
    'Engineered',          // Engineered hardwood
    'Prefinished',         // Prefinished hardwood
    'Unfinished',          // Unfinished hardwood
    'Wide Plank',          // Wide plank hardwood
    'Hand Scraped',        // Hand-scraped finish
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Rustic'
  ],
  
  'Kitchen Tile': [
    // TILE TYPES (Primary)
    'Ceramic',             // Ceramic floor tile
    'Porcelain',           // Porcelain floor tile
    'Natural Stone',       // Stone tile
    'Mosaic',              // Mosaic floor tile
    'Plank',               // Plank tile (wood-look)
    'Marble',              // Marble floor tile
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Mediterranean'
  ],
  
  'Laminate Flooring': [
    // FLOORING TYPES (Primary)
    'Wood Look',           // Wood-look laminate
    'Tile Look',           // Tile-look laminate
    'Stone Look',          // Stone-look laminate
    'Click Lock',          // Click-lock installation
    'Glue Down',           // Glue-down laminate
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Luxury Vinyl Flooring': [
    // FLOORING TYPES (Primary)
    'Plank (LVP)',         // Luxury vinyl plank
    'Tile (LVT)',          // Luxury vinyl tile
    'Click Lock',          // Click-lock LVP/LVT
    'Glue Down',           // Glue-down vinyl
    'Loose Lay',           // Loose-lay vinyl
    'Rigid Core',          // Rigid core (SPC/WPC)
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Tile': [
    // TILE TYPES (Primary)
    'Ceramic',             // Ceramic tile
    'Porcelain',           // Porcelain tile
    'Glass',               // Glass tile
    'Natural Stone',       // Natural stone tile
    'Mosaic',              // Mosaic tile
    'Marble',              // Marble tile
    'Subway',              // Subway tile
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Mediterranean'
  ],
  
  'Waterproof Flooring': [
    // FLOORING TYPES (Primary)
    'Waterproof LVP',      // Waterproof vinyl plank
    'Waterproof Laminate', // Waterproof laminate
    'Waterproof Tile',     // Waterproof tile
    'WPC',                 // Wood-plastic composite
    'SPC',                 // Stone-plastic composite
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // SESSION 4: OUTDOOR (10 categories)
  // ==========================================
  'Fire Pit Accessories': [
    // ACCESSORY TYPES (Primary)
    'Cover',               // Fire pit cover
    'Grate',               // Fire grate
    'Screen',              // Fire pit screen
    'Tool Set',            // Fire tool set
    'Log Holder',          // Log holder/rack
    'Spark Screen',        // Spark screen
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Fire Pits': [
    // FIRE PIT TYPES (Primary)
    'Wood Burning',        // Wood-burning fire pit
    'Gas',                 // Gas fire pit
    'Propane',             // Propane fire pit
    'Fire Table',          // Fire pit table
    'Bowl',                // Bowl-style fire pit
    'Square',              // Square fire pit
    'Chiminea',            // Chiminea fire pit
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Rustic'
  ],
  
  'Garden Decor': [
    // DECOR TYPES (Primary)
    'Statue',              // Garden statue
    'Planter',             // Garden planter
    'Fountain',            // Garden fountain
    'Wind Chime',          // Wind chime
    'Garden Art',          // Garden art sculpture
    'Birdbath',            // Birdbath
    'Sundial',             // Garden sundial
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Whimsical'
  ],
  
  'Generators': [
    // GENERATOR TYPES (Primary)
    'Portable',            // Portable generator
    'Standby',             // Standby/whole house
    'Inverter',            // Inverter generator
    'Dual Fuel',           // Dual fuel generator
    'Gas',                 // Gas generator
    'Diesel',              // Diesel generator
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Hardscaping': [
    // HARDSCAPING TYPES (Primary)
    'Paver',               // Paving stones
    'Stone',               // Natural stone
    'Block',               // Retaining blocks
    'Edging',              // Landscape edging
    'Gravel',              // Decorative gravel
    'Flagstone',           // Flagstone
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Outdoor Fireplaces': [
    // FIREPLACE TYPES (Primary)
    'Wood Burning',        // Wood-burning fireplace
    'Gas',                 // Gas fireplace
    'Chiminea',            // Chiminea fireplace
    'Freestanding',        // Freestanding fireplace
    'Built-In',            // Built-in fireplace
    'Pizza Oven',          // Pizza oven fireplace
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Mediterranean',
    'Rustic'
  ],
  
  'Outdoor and Patio Furniture': [
    // FURNITURE TYPES (Primary)
    'Seating',             // Outdoor seating
    'Dining Set',          // Outdoor dining set
    'Lounge',              // Lounge/chaise
    'Swing',               // Porch swing
    'Hammock',             // Hammock
    'Umbrella',            // Patio umbrella
    'Sectional',           // Outdoor sectional
    'Adirondack',          // Adirondack chair
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Coastal',
    'Tropical',
    'Wicker'
  ],
  
  'Patio Heaters': [
    // HEATER TYPES (Primary)
    'Propane',             // Propane patio heater
    'Natural Gas',         // Natural gas heater
    'Electric',            // Electric patio heater
    'Infrared',            // Infrared heater
    'Tabletop',            // Tabletop heater
    'Freestanding',        // Freestanding heater
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Stoves and Fireplaces': [
    // STOVE/FIREPLACE TYPES (Primary)
    'Wood Stove',          // Wood-burning stove
    'Pellet Stove',        // Pellet stove
    'Gas Fireplace',       // Gas fireplace
    'Electric Fireplace',  // Electric fireplace
    'Fireplace Insert',    // Fireplace insert
    'Cast Iron Stove',     // Cast iron stove
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Rustic'
  ],
  
  // ==========================================
  // SESSION 4: MISCELLANEOUS (7 categories)
  // ==========================================
  'Doors': [
    // DOOR TYPES (Primary)
    'Interior',            // Interior door
    'Exterior',            // Exterior door
    'Sliding',             // Sliding door
    'Bifold',              // Bifold door
    'French',              // French door
    'Barn',                // Barn door
    'Entry',               // Entry door
    'Patio',               // Patio door
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Craftsman'
  ],
  
  'Exterior Doors': [
    // DOOR TYPES (Primary)
    'Single',              // Single entry door
    'Double',              // Double entry door
    'Sidelights',          // Door with sidelights
    'Transom',             // Door with transom
    'Fiberglass',          // Fiberglass door
    'Wood',                // Wood door
    'Steel',               // Steel door
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Craftsman'
  ],
  
  'Mail Boxes': [
    // MAILBOX TYPES (Primary)
    'Post Mount',          // Post-mounted mailbox
    'Wall Mount',          // Wall-mounted mailbox
    'Locking',             // Locking mailbox
    'Cluster',             // Cluster mailbox unit
    'Column',              // Column mailbox
    'Decorative',          // Decorative mailbox
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Colonial'
  ],
  
  'Rugs': [
    // RUG TYPES (Primary)
    'Area Rug',            // Standard area rug
    'Runner',              // Runner rug
    'Door Mat',            // Entry/door mat
    'Round',               // Round rug
    'Outdoor Rug',         // Outdoor rug
    'Kitchen Rug',         // Kitchen mat/rug
    'Bath Rug',            // Bathroom rug
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Bohemian',
    'Persian',
    'Oriental'
  ],
  
  'Designer Hardware': [
    // HARDWARE TYPES (Primary)
    'Designer Lever',      // Designer door lever
    'Designer Knob',       // Designer door knob
    'Designer Handleset',  // Designer handleset
    'Designer Deadbolt',   // Designer deadbolt
    'Signature Collection',// Signature hardware
    
    // DESIGN STYLES (Fallback)
    'Luxury',
    'Art Deco',
    'Mid-Century',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Home Hardware': [
    // HARDWARE TYPES (Primary)
    'Hook',                // Wall hook
    'Bracket',             // Shelf bracket
    'Shelf Support',       // Shelf support
    'Rail',                // Closet/towel rail
    'Hardware Kit',        // Misc hardware kit
    'Hinge',               // General hinge
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Mirrors': [
    // MIRROR TYPES (Primary)
    'Framed',              // Framed mirror
    'Frameless',           // Frameless mirror
    'Lighted',             // LED lighted mirror
    'Full Length',         // Full-length mirror
    'Accent',              // Decorative accent
    'Floor Mirror',        // Freestanding floor mirror
    'Vanity Mirror',       // Vanity/makeup mirror
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // ADDITIONAL PLUMBING & BATH CATEGORIES
  // ==========================================
  'Bath Fans': [
    // FAN TYPES (Primary)
    'Ceiling Mount',       // Ceiling-mounted exhaust
    'Inline',              // Inline fan
    'Wall Mount',          // Wall-mounted fan
    'Heater Combo',        // Fan + heater combo
    'Light Combo',         // Fan + light combo
    'Humidity Sensor',     // Fan with humidity sensor
    'Quiet',               // Ultra-quiet fan
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Bathroom Cabinet Hardware': [
    // HARDWARE TYPES (Primary)
    'Knob',                // Bathroom cabinet knob
    'Pull',                // Bathroom cabinet pull
    'Handle',              // Cabinet handle
    'Bin Pull',            // Bin pull
    'Cup Pull',            // Cup pull
    'Hinge',               // Cabinet hinge
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Tub and Shower Accessories': [
    // ACCESSORY TYPES (Primary)
    'Caddy',               // Shower caddy/organizer
    'Shelf',               // Shower shelf
    'Seat',                // Shower seat/bench
    'Grab Bar',            // Safety grab bar
    'Shower Rod',          // Shower curtain rod
    'Curtain',             // Shower curtain
    'Mat',                 // Bath/shower mat
    'Soap Dish',           // Soap dish/holder
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Vanity Lighting': [
    // FIXTURE TYPES (Primary)
    'Bath Bar',            // Vanity bath bar
    'Sconce',              // Vanity sconce
    'Overhead',            // Overhead vanity light
    'Backlit Mirror',      // Backlit mirror light
    'LED Strip',           // LED strip lighting
    'Multi-Light',         // Multi-light fixture
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Art Deco'
  ],
  
  'Steam Showers': [
    // STEAM SHOWER TYPES (Primary)
    'Alcove',              // Alcove steam shower
    'Corner',              // Corner steam unit
    'Walk-In',             // Walk-in steam shower
    'Custom',              // Custom steam shower
    'Prefab Unit',         // Prefabricated unit
    'Steam Generator',     // Steam generator only
    
    // DESIGN STYLES (Fallback)
    'Luxury',
    ...UNIVERSAL_DESIGN_STYLES,
    'Minimalist'
  ],
  
  // ==========================================
  // ADDITIONAL LIGHTING CATEGORIES
  // ==========================================
  'Commercial Lighting': [
    // FIXTURE TYPES (Primary)
    'High Bay',            // High bay fixture
    'Troffer',             // Troffer/panel light
    'Wraparound',          // Wraparound fixture
    'Exit Sign',           // Exit sign
    'Emergency Light',     // Emergency lighting
    'Warehouse',           // Warehouse lighting
    'Parking Lot',         // Parking lot light
    
    // DESIGN STYLES (Fallback)
    'Commercial',
    'Industrial',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // ADDITIONAL OUTDOOR CATEGORIES
  // ==========================================
  'Outdoor Heating': [
    // HEATER TYPES (Primary)
    'Patio Heater',        // Patio heater (duplicate mapping)
    'Fire Pit',            // Fire pit (duplicate mapping)
    'Outdoor Fireplace',   // Outdoor fireplace (duplicate)
    'Infrared Heater',     // Infrared heater
    'Propane Heater',      // Propane heater
    'Electric Heater',     // Electric outdoor heater
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Outdoor Kitchens': [
    // KITCHEN TYPES (Primary)
    'Built-In Grill',      // Built-in grill
    'Island',              // Outdoor kitchen island
    'Modular',             // Modular outdoor kitchen
    'Cart',                // Outdoor kitchen cart
    'Components',          // Individual components
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // ADDITIONAL APPLIANCES & KITCHEN
  // ==========================================
  'Coffee Maker': [
    // PRODUCT TYPES (Primary)
    'Drip',                // Drip coffee maker
    'Espresso',            // Espresso machine
    'Single Serve',        // Single-serve/pod
    'French Press',        // French press
    'Pour Over',           // Pour-over brewer
    'Cold Brew',           // Cold brew maker
    'Programmable',        // Programmable drip
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Pizza Oven': [
    // OVEN TYPES (Primary)
    'Wood Fired',          // Wood-fired pizza oven
    'Gas',                 // Gas pizza oven
    'Electric',            // Electric pizza oven
    'Countertop',          // Countertop pizza oven
    'Built-In',            // Built-in pizza oven
    'Outdoor',             // Outdoor pizza oven
    'Portable',            // Portable pizza oven
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES,
    'Commercial'
  ],
  
  'Garbage Disposals': [
    // DISPOSAL TYPES (Primary)
    'Continuous Feed',     // Continuous feed disposal
    'Batch Feed',          // Batch feed disposal
    '1/2 HP',              // 1/2 horsepower
    '3/4 HP',              // 3/4 horsepower
    '1 HP',                // 1 horsepower
    'Commercial',          // Commercial disposal
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Hot & Cold Water Dispensers': [
    // DISPENSER TYPES (Primary)
    'Hot Only',            // Hot water only
    'Cold Only',           // Cold water only
    'Hot/Cold Combo',      // Hot and cold
    'Filtered',            // Filtered water
    'Instant Hot',         // Instant hot water
    'Countertop',          // Countertop dispenser
    'Under Sink',          // Under-sink unit
    
    // DESIGN STYLES (Fallback)
    'Commercial',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Urinals': [
    // URINAL TYPES (Primary)
    'Wall Hung',           // Wall-hung urinal
    'Floor Mount',         // Floor-mounted urinal
    'Waterless',           // Waterless urinal
    'Trough',              // Trough urinal
    'Stall',               // Stall urinal
    
    // DESIGN STYLES (Fallback)
    'Commercial',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Water Fountain': [
    // FOUNTAIN TYPES (Primary)
    'Wall Mount',          // Wall-mounted fountain
    'Floor Mount',         // Floor-mounted fountain
    'Pedestal',            // Pedestal fountain
    'Bottle Filler',       // Bottle filling station
    'Bi-Level',            // Bi-level fountain
    'Outdoor',             // Outdoor fountain
    'ADA Compliant',       // ADA-compliant fountain
    
    // DESIGN STYLES (Fallback)
    'Commercial',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Water Filtration': [
    // FILTRATION TYPES (Primary)
    'Under Sink',          // Under-sink filter
    'Whole House',         // Whole house system
    'Reverse Osmosis',     // RO system
    'Countertop',          // Countertop filter
    'Pitcher',             // Filter pitcher
    'Faucet Mount',        // Faucet-mounted filter
    'Refrigerator',        // Refrigerator filter
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // HEATING & COOLING (Selective)
  // ==========================================
  'Indoor Heating': [
    // HEATER TYPES (Primary)
    'Forced Air',          // Forced air furnace
    'Radiant',             // Radiant heating
    'Baseboard',           // Baseboard heater
    'Wall Heater',         // Wall-mounted heater
    'Space Heater',        // Portable space heater
    'Fireplace',           // Gas/electric fireplace
    'Hydronic',            // Hydronic heating
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Air Conditioners': [
    // AC TYPES (Primary)
    'Window',              // Window AC unit
    'Portable',            // Portable AC
    'Through-Wall',        // Through-wall AC
    'Mini Split',          // Mini-split system
    'Central',             // Central AC system
    'Ductless',            // Ductless system
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Mini Split Air Conditioners': [
    // MINI SPLIT TYPES (Primary)
    'Single Zone',         // Single zone system
    'Multi Zone',          // Multi-zone system
    'Wall Mount',          // Wall-mounted unit
    'Ceiling Cassette',    // Ceiling cassette unit
    'Floor Mount',         // Floor-mounted unit
    'Ducted',              // Ducted mini-split
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Dehumidifiers': [
    // DEHUMIDIFIER TYPES (Primary)
    'Portable',            // Portable dehumidifier
    'Whole House',         // Whole house system
    'Basement',            // Basement dehumidifier
    'Commercial',          // Commercial unit
    'Desiccant',           // Desiccant dehumidifier
    'Refrigerant',         // Refrigerant dehumidifier
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Room Heater': [
    // HEATER TYPES (Primary)
    'Ceramic',             // Ceramic heater
    'Infrared',            // Infrared heater
    'Oil Filled',          // Oil-filled radiator
    'Fan Forced',          // Fan-forced heater
    'Radiant',             // Radiant heater
    'Convection',          // Convection heater
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Thermostats': [
    // THERMOSTAT TYPES (Primary)
    'Programmable',        // Programmable thermostat
    'Smart',               // Smart/WiFi thermostat
    'WiFi',                // WiFi-enabled
    'Manual',              // Manual thermostat
    'Touchscreen',         // Touchscreen control
    'Learning',            // Learning thermostat
    'Multi-Zone',          // Multi-zone control
    
    // DESIGN STYLES (Fallback)
    'Smart Home',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Evaporative Coolers': [
    // COOLER TYPES (Primary)
    'Portable',            // Portable swamp cooler
    'Window',              // Window-mounted
    'Roof Mount',          // Roof-mounted
    'Side Draft',          // Side-draft cooler
    'Down Draft',          // Down-draft cooler
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Exhaust Fans': [
    // FAN TYPES (Primary)
    'Bathroom',            // Bathroom exhaust
    'Kitchen',             // Kitchen exhaust
    'Inline',              // Inline duct fan
    'Wall Mount',          // Wall-mounted fan
    'Ceiling Mount',       // Ceiling-mounted fan
    'Through-Wall',        // Through-wall fan
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // HOME ORGANIZATION & STORAGE
  // ==========================================
  'Home Organization': [
    // ORGANIZATION TYPES (Primary)
    'Shelf',               // Storage shelf
    'Basket',              // Storage basket
    'Bin',                 // Storage bin/container
    'Rack',                // Storage rack
    'Closet System',       // Closet organization
    'Wall Organizer',      // Wall-mounted organizer
    'Drawer Organizer',    // Drawer organizer
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Kitchen Storage & Organization': [
    // STORAGE TYPES (Primary)
    'Pull-Out Shelf',      // Pull-out shelf
    'Lazy Susan',          // Lazy Susan
    'Drawer Insert',       // Drawer insert
    'Pantry System',       // Pantry organization
    'Spice Rack',          // Spice rack
    'Pot Rack',            // Pot/pan rack
    'Cabinet Organizer',   // Cabinet organizer
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Storage and Organization': [
    // STORAGE TYPES (Primary)
    'Shelf',               // Storage shelf
    'Cabinet',             // Storage cabinet
    'Rack',                // Storage rack
    'Bin',                 // Storage bin
    'Basket',              // Storage basket
    'Closet System',       // Closet system
    'Wall Storage',        // Wall-mounted storage
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // OUTDOOR & CHIMNEY
  // ==========================================
  'Stove and Chimney Pipe': [
    // PRODUCT TYPES (Primary)
    'Wood Stove',          // Wood-burning stove
    'Pellet Stove',        // Pellet stove
    'Chimney Pipe',        // Chimney pipe/flue
    'Stove Pipe',          // Stove pipe connector
    'Flue',                // Flue liner
    'Chimney Cap',         // Chimney cap
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // ELECTRICAL & LIGHTING ACCESSORIES
  // ==========================================
  'Ceiling Fan Accessories': [
    // ACCESSORY TYPES (Primary)
    'Downrod',             // Extension downrod
    'Remote',              // Remote control
    'Light Kit',           // Light kit add-on
    'Blade',               // Replacement blades
    'Motor',               // Replacement motor
    'Canopy',              // Ceiling canopy
    'Switch',              // Wall switch/control
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'LED Lighting': [
    // PRODUCT TYPES (Primary)
    'LED Bulb',            // LED light bulb
    'LED Strip',           // LED strip/tape
    'LED Panel',           // LED panel light
    'LED Retrofit',        // LED retrofit kit
    'LED Tube',            // LED tube light
    'LED Can',             // LED can light
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Light Bulbs': [
    // BULB TYPES (Primary)
    'LED',                 // LED bulb
    'Incandescent',        // Incandescent bulb
    'CFL',                 // Compact fluorescent
    'Halogen',             // Halogen bulb
    'Smart Bulb',          // Smart/WiFi bulb
    'Vintage',             // Vintage Edison bulb
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Light Switches & Dimmers': [
    // SWITCH TYPES (Primary)
    'Standard Switch',     // Standard toggle
    'Dimmer',              // Dimmer switch
    'Smart Switch',        // Smart/WiFi switch
    'Motion Sensor',       // Motion sensor switch
    'Timer',               // Timer switch
    'Touchscreen',         // Touchscreen switch
    '3-Way',               // 3-way switch
    
    // DESIGN STYLES (Fallback)
    'Smart Home',
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  'Lighting Accessories': [
    // ACCESSORY TYPES (Primary)
    'Shade',               // Lamp shade
    'Finial',              // Decorative finial
    'Chain',               // Hanging chain
    'Canopy',              // Ceiling canopy
    'Glass',               // Replacement glass
    'Socket',              // Light socket
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ],
  
  // ==========================================
  // SKYLIGHTS & DOORS
  // ==========================================
  'Skylights': [
    // SKYLIGHT TYPES (Primary)
    'Fixed',               // Fixed skylight
    'Vented',              // Vented/operable
    'Tubular',             // Tubular/solar tube
    'Skylight Window',     // Skylight window
    'Curb Mount',          // Curb-mounted
    'Deck Mount',          // Deck-mounted
    
    // DESIGN STYLES (Fallback)
    ...UNIVERSAL_DESIGN_STYLES
  ]
};

/**
 * Get valid styles for a given category
 */
export function getValidStylesForCategory(category: string): string[] {
  // Try exact match
  if (CATEGORY_STYLE_MAPPING[category]) {
    return CATEGORY_STYLE_MAPPING[category];
  }
  
  // Try case-insensitive match
  const categoryLower = category.toLowerCase();
  for (const [key, styles] of Object.entries(CATEGORY_STYLE_MAPPING)) {
    if (key.toLowerCase() === categoryLower) {
      return styles;
    }
  }
  
  // For unknown categories, return universal design styles as fallback
  // This ensures we can still suggest common styles
  return UNIVERSAL_DESIGN_STYLES;
}

/**
 * Check if a style is valid for a given category
 */
export function isValidStyleForCategory(category: string, style: string): boolean {
  const validStyles = getValidStylesForCategory(category);
  return validStyles.some(s => s.toLowerCase() === style.toLowerCase());
}

/**
 * Find the best matching style for a category given a potential style value
 */
export function matchStyleToCategory(category: string, potentialStyle: string): string | null {
  const validStyles = getValidStylesForCategory(category);
  
  if (validStyles.length === 0) {
    return null;
  }
  
  const normalized = potentialStyle.toLowerCase().trim();
  
  // Exact match
  const exactMatch = validStyles.find(s => s.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;
  
  // Partial match (contains)
  const partialMatch = validStyles.find(s => 
    s.toLowerCase().includes(normalized) || normalized.includes(s.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  // Special case: extract style from subcategory
  // e.g., "ELECTRIC OVEN AND MICROWAVE COMBO" → "Microwave Combo" for Oven category
  if (category.toLowerCase() === 'oven' && normalized.includes('microwave')) {
    return 'Microwave Combo';
  }
  
  if (category.toLowerCase() === 'oven' && (normalized.includes('double') || normalized.includes('dual'))) {
    return 'Double Wall';
  }
  
  if (category.toLowerCase() === 'oven' && normalized.includes('single')) {
    return 'Single';
  }
  
  return null;
}

export default {
  CATEGORY_STYLE_MAPPING,
  UNIVERSAL_DESIGN_STYLES,
  getValidStylesForCategory,
  isValidStyleForCategory,
  matchStyleToCategory
};
