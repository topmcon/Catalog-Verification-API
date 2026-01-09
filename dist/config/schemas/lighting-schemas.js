"use strict";
/**
 * Lighting Category Schemas
 * Complete attribute definitions for lighting fixtures
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIGHTING_SCHEMAS = exports.CEILING_FAN_WITH_LIGHT_SCHEMA = exports.RECESSED_LIGHTING_SCHEMA = exports.OUTDOOR_LIGHTING_SCHEMA = exports.WALL_SCONCE_SCHEMA = exports.CEILING_LIGHT_SCHEMA = void 0;
exports.CEILING_LIGHT_SCHEMA = {
    categoryName: 'Ceiling Lights #',
    department: 'Lighting',
    top15FilterAttributes: [
        'Brand',
        'Style (Flush Mount, Semi-Flush, Linear)',
        'Width/Diameter',
        'Height',
        'Number of Lights',
        'Bulb Type (LED, Incandescent, Fluorescent)',
        'Max Wattage',
        'Finish/Color',
        'Material (Glass, Metal, Crystal, Fabric)',
        'Dimmable',
        'Integrated LED',
        'Color Temperature (K)',
        'Lumens',
        'Dry/Damp/Wet Rated',
        'ETL/UL Listed'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Style', 'Width', 'Height',
        'Number of Lights', 'Bulb Type', 'Max Wattage',
        'Finish', 'Material', 'Dimmable', 'Color Temperature',
        'Lumens', 'Rating', 'Energy Star', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Lighting',
        tier2: 'Indoor Lighting',
        tier3: 'Ceiling Lights'
    }
};
exports.WALL_SCONCE_SCHEMA = {
    categoryName: 'Wall Sconces #',
    department: 'Lighting',
    top15FilterAttributes: [
        'Brand',
        'Style (Modern, Traditional, Industrial, Art Deco)',
        'Width',
        'Height',
        'Extension from Wall',
        'Number of Lights',
        'Bulb Type',
        'Max Wattage',
        'Finish/Color',
        'Shade Material (Glass, Fabric, Metal)',
        'Direction (Up, Down, Up/Down)',
        'Dimmable',
        'Hardwired/Plug-In',
        'Dry/Damp/Wet Rated',
        'ADA Compliant'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Style', 'Width', 'Height',
        'Extension', 'Number of Lights', 'Bulb Type', 'Max Wattage',
        'Finish', 'Shade Material', 'Direction', 'Dimmable',
        'Rating', 'ADA', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Lighting',
        tier2: 'Indoor Lighting',
        tier3: 'Wall Sconces'
    }
};
exports.OUTDOOR_LIGHTING_SCHEMA = {
    categoryName: 'Outdoor Lighting #',
    department: 'Lighting',
    top15FilterAttributes: [
        'Brand',
        'Type (Wall Lantern, Post Light, Pathway, Flood, String)',
        'Style (Traditional, Modern, Farmhouse, Coastal)',
        'Width',
        'Height',
        'Number of Lights',
        'Bulb Type',
        'Max Wattage',
        'Finish/Color',
        'Material (Aluminum, Steel, Brass)',
        'Weather Rating (Wet, Damp)',
        'Motion Sensor',
        'Dusk to Dawn',
        'Solar Powered',
        'Dark Sky Compliant'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Type', 'Style', 'Width', 'Height',
        'Number of Lights', 'Bulb Type', 'Max Wattage',
        'Finish', 'Material', 'Rating', 'Motion Sensor',
        'Solar', 'Dark Sky', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Lighting',
        tier2: 'Outdoor Lighting',
        tier3: 'Outdoor Fixtures'
    }
};
exports.RECESSED_LIGHTING_SCHEMA = {
    categoryName: 'Recessed Lighting #',
    department: 'Lighting',
    top15FilterAttributes: [
        'Brand',
        'Type (Housing, Trim, Kit)',
        'Size (4", 5", 6")',
        'Housing Type (New Construction, Remodel, IC Rated)',
        'Trim Style (Baffle, Reflector, Gimbal, Eyeball)',
        'Bulb Type (LED, Incandescent, PAR)',
        'Wattage',
        'Finish/Color',
        'Dimmable',
        'Color Temperature',
        'Lumens',
        'Beam Angle',
        'Airtight',
        'Wet/Damp Rated',
        'Title 24 Compliant'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Type', 'Size', 'Housing Type',
        'Trim Style', 'Bulb Type', 'Wattage', 'Finish',
        'Dimmable', 'Color Temperature', 'Lumens',
        'Rating', 'Energy Star', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Lighting',
        tier2: 'Indoor Lighting',
        tier3: 'Recessed Lighting'
    }
};
exports.CEILING_FAN_WITH_LIGHT_SCHEMA = {
    categoryName: 'Ceiling Fans with Light #',
    department: 'Lighting',
    top15FilterAttributes: [
        'Brand',
        'Blade Span',
        'Number of Blades',
        'Light Kit Type (LED, Integrated, Bowl)',
        'Number of Lights',
        'Bulb Type',
        'Style (Modern, Traditional, Tropical, Industrial)',
        'Finish/Color',
        'Blade Material (Wood, MDF, ABS)',
        'Motor Type (DC, AC)',
        'Number of Speeds',
        'Remote Control Included',
        'Smart/WiFi Enabled',
        'Reversible Motor',
        'CFM/Airflow'
    ],
    htmlTableAttributes: [
        'Brand', 'Model Number', 'Blade Span', 'Blades',
        'Light Kit', 'Bulb Type', 'Style', 'Finish',
        'Blade Material', 'Motor Type', 'Speeds',
        'Remote', 'CFM', 'Rating', 'Energy Star', 'Warranty'
    ],
    taxonomyTiers: {
        tier1: 'Lighting',
        tier2: 'Ceiling Fans',
        tier3: 'Ceiling Fans with Light'
    }
};
exports.LIGHTING_SCHEMAS = {
    'Ceiling Lights #': exports.CEILING_LIGHT_SCHEMA,
    'Wall Sconces #': exports.WALL_SCONCE_SCHEMA,
    'Outdoor Lighting #': exports.OUTDOOR_LIGHTING_SCHEMA,
    'Recessed Lighting #': exports.RECESSED_LIGHTING_SCHEMA,
    'Ceiling Fans with Light #': exports.CEILING_FAN_WITH_LIGHT_SCHEMA,
};
//# sourceMappingURL=lighting-schemas.js.map