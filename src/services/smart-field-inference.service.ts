/**
 * SMART FIELD INFERENCE SERVICE
 * =============================
 * 
 * Uses common sense reasoning to map extracted data to Salesforce fields
 * even when the field names don't exactly match.
 * 
 * Examples:
 * - "38-gallon capacity" → capacity_gallons: 38
 * - "Weight: 146 lb" → Weight__c: 146
 * - "Soaking Depth: 15 inches" → water_depth: 15
 * - "BTU Rating: 12,000" → btu_output: 12000
 */

import logger from '../utils/logger';

// ============================================
// FIELD ALIAS MAPPINGS
// ============================================

/**
 * Maps various natural language terms to their Salesforce field names
 * Key: Salesforce field key (snake_case)
 * Value: Array of aliases that should map to this field
 */
export const FIELD_ALIASES: Record<string, string[]> = {
  // Capacity fields
  'capacity_gallons': [
    'capacity (gallons)', 'gallon capacity', 'water capacity', 'tub capacity',
    'tank capacity', 'total capacity', 'volume', 'gallons', 'gal capacity',
    'water volume', 'fill capacity', 'bath capacity'
  ],
  'capacity': [
    'oven capacity', 'cu ft', 'cubic feet', 'interior capacity', 'drum capacity',
    'total capacity', 'storage capacity', 'freezer capacity', 'refrigerator capacity'
  ],
  
  // Weight fields
  'weight': [
    'product weight', 'shipping weight', 'net weight', 'gross weight',
    'item weight', 'unit weight', 'weight lbs', 'weight (lbs)', 'lbs', 'pounds'
  ],
  'weight_capacity': [
    'max weight', 'maximum weight', 'load capacity', 'weight limit',
    'supported weight', 'capacity lbs'
  ],
  
  // Dimension fields
  'nominal_length': [
    'length', 'overall length', 'tub length', 'product length', 'total length',
    'exterior length', 'inside length', 'interior length'
  ],
  'nominal_width': [
    'width', 'overall width', 'tub width', 'product width', 'total width',
    'exterior width', 'inside width', 'interior width'
  ],
  'water_depth': [
    'soaking depth', 'water depth', 'fill depth', 'interior depth',
    'bathing depth', 'soak depth', 'maximum water depth'
  ],
  'height': [
    'overall height', 'product height', 'total height', 'rim height',
    'exterior height', 'tub height'
  ],
  
  // Flow/Rate fields
  'flow_rate': [
    'gpm', 'gallons per minute', 'flow', 'water flow', 'flow rate gpm',
    'max flow rate', 'maximum flow'
  ],
  'btu_output': [
    'btu', 'btus', 'btu rating', 'heating capacity', 'burner output',
    'max btu', 'total btu'
  ],
  'cfm': [
    'airflow', 'air flow', 'cfm rating', 'ventilation', 'exhaust rate',
    'cubic feet per minute'
  ],
  
  // Installation type - covers bathtubs, dishwashers, and other appliances
  'installation_type': [
    'tub type', 'mounting type', 'installation', 'install type',
    'freestanding', 'alcove', 'drop-in', 'undermount',
    'installation type', 'built-in', 'built in', 'portable', 'countertop',
    'drawer', 'how installed', 'installation method', 'mounting style',
    'type of installation', 'install method'
  ],
  'drain_placement': [
    'drain location', 'drain position', 'drain side', 'outlet position',
    'waste location', 'reversible drain', 'center drain', 'left drain', 'right drain'
  ],
  'tub_shape': [
    'shape', 'bathtub shape', 'oval', 'rectangular', 'corner', 'round'
  ],
  'number_of_jets': [
    'jets', 'jet count', 'whirlpool jets', 'air jets', 'massage jets',
    'total jets', 'hydro jets'
  ],
  'number_of_bathers': [
    'bather capacity', 'person capacity', 'seating', 'seats',
    'how many bathers', 'occupancy'
  ],
  
  // Material/Finish
  'material': [
    'construction', 'made of', 'constructed of', 'body material',
    'tub material', 'basin material', 'shell material'
  ],
  'finish': [
    'surface finish', 'exterior finish', 'coating', 'surface',
    'polish', 'texture'
  ],
  
  // Boolean features
  'overflow': [
    'has overflow', 'overflow included', 'overflow drain', 'overflow feature'
  ],
  'drain_assembly_included': [
    'drain included', 'includes drain', 'drain assembly', 'comes with drain'
  ],
  'ada': [
    'ada compliant', 'ada approved', 'accessible', 'handicap accessible',
    'wheelchair accessible', 'ada', 'accessibility', 'ada height',
    'ada certified', 'ada compliance', 'americans with disabilities',
    'disability compliant', 'accessibility compliant'
  ],
  'soaking': [
    'soaking tub', 'deep soak', 'soaker', 'soaking bath'
  ],
  'whirlpool': [
    'whirlpool tub', 'jetted', 'hydromassage', 'hydrotherapy'
  ],
  'air_bath': [
    'air jets', 'air massage', 'air tub', 'bubbler'
  ],
  
  // Appliance specific
  'fuel_type': [
    'power source', 'energy source', 'gas', 'electric', 'dual fuel'
  ],
  'configuration': [
    'style', 'type', 'format', 'freestanding', 'slide-in', 'drop-in'
  ],
  'number_of_burners': [
    'burners', 'burner count', 'cooking zones', 'elements'
  ],
  'convection': [
    'convection oven', 'true convection', 'fan assisted', 'convect'
  ],
  'self_cleaning': [
    'cleaning type', 'pyrolytic', 'steam clean', 'self clean'
  ],
  'smart_home': [
    'wifi', 'smart', 'connected', 'app control', 'voice control',
    'alexa', 'google home', 'home connect', 'smart features', 'wifi enabled',
    'smart home', 'app compatibility', 'connected appliances'
  ],
  'energy_star': [
    'energy star certified', 'energy efficient', 'energy rating',
    'energy star', 'energystar'
  ],
  
  // =============================================
  // DISHWASHER SPECIFIC ATTRIBUTES - Comprehensive aliases
  // =============================================
  
  // Noise Level - CRITICAL: Maps dB Rating, Decibel, Noise to single field
  'noise_level': [
    'db rating', 'db', 'decibel', 'decibel level', 'decibel rating',
    'decibel sound rating', 'noise level db', 'sound level', 'sound rating',
    'operating noise', 'noise dba', 'dba rating', 'silence level',
    'noise level dba re 1pw', 'quietness'
  ],
  
  // Place Settings / Capacity
  'place_setting_capacity': [
    'place settings', 'place setting capacity', 'number of place settings',
    'settings', 'capacity place settings', 'dish capacity', 'load capacity',
    'maximum number of place settings'
  ],
  
  // Tub/Interior Material
  'stainless_steel_interior': [
    'tub material', 'interior material', 'tub', 'interior', 'inner tub',
    'wash tub material', 'basin material', 'stainless steel tub',
    'stainless interior', 'interior construction'
  ],
  
  // Number of Wash Cycles
  'number_of_wash_cycles': [
    'wash cycles', 'cycles', 'number of cycles', 'cycle count',
    'wash programs', 'programs', 'number of programs', 'cleaning cycles',
    'wash options', 'number of wash programs'
  ],
  
  // Drying System
  'drying_system': [
    'dry system', 'drying type', 'dry type', 'drying method',
    'heated dry', 'air dry', 'condensation dry', 'puredry', 'autodry',
    'dry technology', 'drying feature'
  ],
  
  // Control Type / Location
  'control_type': [
    'control location', 'controls', 'control panel', 'control style',
    'type of control', 'control panel location', 'button type',
    'front control', 'top control', 'hidden control', 'touch control',
    'location of control panel'
  ],
  
  // Third Rack / Cutlery Tray (same concept in different names)
  'cutlery_tray': [
    'third rack', '3rd rack', 'cutlery basket', 'utensil rack',
    'flatware tray', 'silverware rack', 'third level rack',
    'standard 3rd rack', 'cutlery drawer', 'number of racks',
    'third rack included', 'has third rack', 'flexible third rack'
  ],
  
  // Number of Racks
  'number_of_racks': [
    'racks', 'rack count', 'total racks', 'loading racks',
    'dish racks', 'number racks'
  ],
  
  // Panel Ready
  'panel_ready': [
    'custom panel', 'panel ready', 'accepts custom panel',
    'integrated', 'fully integrated', 'panel front', 'overlay'
  ],
  
  // Fingerprint Resistant
  'fingerprint_resistant': [
    'smudge proof', 'fingerprint free', 'anti fingerprint',
    'smudge resistant', 'fingerprint resistance', 'easy clean finish'
  ],
  
  // Dishwasher Type
  'dishwasher_type': [
    'type', 'dishwasher style', 'style', 'form factor',
    'built in', 'portable', 'drawer', 'countertop', 'top controls',
    'front controls'
  ],
  
  // Hard Food Disposer
  'hard_food_disposer': [
    'food disposer', 'built in food disposer', 'garbage disposer',
    'food grinder', 'hard food grinder', 'disposer', 'built-in food disposer'
  ],
  
  // Adjustable Racks
  'adjustable_racks': [
    'adjustable rack', 'rackmatic', 'flexible racks', 'movable racks',
    'adjustable upper rack', 'rack adjustment', 'adjustable feet'
  ],
  
  // Soil Sensor
  'soil_sensor': [
    'auto sensor', 'automatic sensor', 'dirt sensor', 'load sensor',
    'precision wash', 'smart sensor', 'auto wash'
  ],
  
  // Electrical
  'voltage': [
    'volts', 'electrical', 'power requirements', 'v', 'vac',
    'voltage v'
  ],
  'amperage': [
    'amps', 'amp rating', 'current', 'ampere', 'fuse protection'
  ],
  'wattage': [
    'watts', 'power consumption', 'w', 'watt', 'connection rating'
  ],

  // =============================================
  // REFRIGERATOR SPECIFIC ATTRIBUTES
  // =============================================
  'total_capacity': [
    'total cu ft', 'total cubic feet', 'overall capacity', 'combined capacity',
    'total volume', 'capacity cu ft', 'total capacity cu ft'
  ],
  'refrigerator_capacity': [
    'fridge capacity', 'fresh food capacity', 'refrigerator cu ft',
    'fridge cu ft', 'refrigerator volume', 'fresh food compartment'
  ],
  'freezer_capacity': [
    'freezer cu ft', 'freezer volume', 'frozen food capacity',
    'freezer compartment', 'freezer size'
  ],
  'counter_depth': [
    'counter-depth', 'counterdepth', 'built-in depth', 'flush mount',
    'cabinet depth', 'standard depth', 'full depth'
  ],
  'ice_maker': [
    'ice maker included', 'built-in ice maker', 'automatic ice maker',
    'ice machine', 'makes ice', 'ice production'
  ],
  'internal_ice_maker': [
    'interior ice maker', 'inside ice maker', 'internal ice',
    'built in ice', 'integrated ice maker'
  ],
  'number_of_doors': [
    'door count', 'doors', 'door style', 'door configuration',
    'french door', 'side by side', 'top freezer', 'bottom freezer'
  ],
  'dispenser_features': [
    'water dispenser', 'ice dispenser', 'water and ice', 'dispenser type',
    'through-the-door', 'external dispenser', 'in-door dispenser'
  ],
  'glass_doors': [
    'see-through doors', 'transparent doors', 'glass front',
    'window doors', 'display doors'
  ],
  'number_of_zones': [
    'temperature zones', 'cooling zones', 'climate zones',
    'multi-zone', 'dual zone'
  ],

  // =============================================
  // RANGE / OVEN SPECIFIC ATTRIBUTES
  // =============================================
  'oven_capacity': [
    'oven cu ft', 'oven volume', 'oven size', 'cooking capacity',
    'cavity size', 'interior volume', 'oven interior'
  ],
  'double_oven': [
    'dual oven', 'twin oven', 'two ovens', 'double cavity',
    'dual cavity', 'upper and lower oven'
  ],
  'air_fry': [
    'air fryer', 'air frying', 'air crisp', 'air fry mode',
    'built-in air fryer', 'airfry'
  ],
  'induction': [
    'induction cooking', 'induction cooktop', 'induction burners',
    'magnetic induction', 'induction elements'
  ],
  'continuous_grates': [
    'continuous cast iron', 'seamless grates', 'connected grates',
    'edge-to-edge grates', 'full-width grates'
  ],
  'griddle': [
    'built-in griddle', 'integrated griddle', 'flat top',
    'griddle burner', 'pancake griddle'
  ],
  'sabbath_mode': [
    'sabbath', 'shabbat mode', 'star-k certified', 'kosher mode',
    'holiday mode'
  ],
  'steam_cooking': [
    'steam oven', 'steam cook', 'steam assist', 'steam bake',
    'combi steam', 'steam function'
  ],
  'combination_oven': [
    'combi oven', 'combo oven', 'microwave combo', 'convection combo',
    'multi-function oven'
  ],
  'door_type': [
    'oven door', 'door style', 'french door oven', 'side swing',
    'drop down door', 'side opening'
  ],
  'meat_thermometer': [
    'temperature probe', 'meat probe', 'food probe', 'cooking probe',
    'internal thermometer', 'probe included'
  ],

  // =============================================
  // COOKTOP SPECIFIC ATTRIBUTES
  // =============================================
  'downdraft_ventilated': [
    'downdraft', 'built-in ventilation', 'integrated ventilation',
    'downdraft vent', 'pop-up ventilation'
  ],
  'bridge_element': [
    'bridge burner', 'bridge zone', 'flexible cooking zone',
    'extended burner', 'dual element'
  ],
  'hot_surface_indicator': [
    'hot surface light', 'residual heat indicator', 'hot indicator',
    'surface hot warning', 'hot surface indicator lights'
  ],
  'power_burner': [
    'high power burner', 'power boil', 'rapid burner', 'super burner',
    'high output burner', 'power element'
  ],
  'ignition_type': [
    'ignition', 'spark ignition', 'automatic ignition', 'electronic ignition',
    'standing pilot', 'hot surface ignition'
  ],
  'lp_conversion': [
    'propane conversion', 'lp kit', 'propane ready', 'lp gas',
    'liquid propane', 'propane compatible'
  ],

  // =============================================
  // WASHER SPECIFIC ATTRIBUTES
  // =============================================
  'washer_capacity': [
    'wash capacity', 'drum capacity', 'load capacity', 'tub capacity',
    'washer cu ft', 'laundry capacity'
  ],
  'top_loading': [
    'top load', 'top loader', 'top-load', 'vertical load'
  ],
  'front_loading': [
    'front load', 'front loader', 'front-load', 'horizontal axis'
  ],
  'steam_technology': [
    'steam wash', 'steam clean', 'steam cycle', 'steam feature',
    'steam option', 'true steam'
  ],
  'agitator': [
    'agitator type', 'has agitator', 'pole agitator', 'impeller',
    'dual action agitator'
  ],
  'stackable': [
    'stackable unit', 'can be stacked', 'stack kit compatible',
    'stackable washer', 'stacking capable'
  ],
  'pedestal_included': [
    'pedestal', 'riser', 'laundry pedestal', 'storage pedestal',
    'washer pedestal', 'drawer pedestal'
  ],
  'washer_rpm': [
    'spin speed', 'rpm', 'spin rpm', 'max spin speed',
    'spin cycle speed', 'centrifuge speed'
  ],
  'sanitary_rinse': [
    'sanitize cycle', 'sanitary cycle', 'allergen cycle', 'steam sanitize',
    'antibacterial', 'hygiene cycle'
  ],
  'drive_type': [
    'motor drive', 'direct drive', 'belt drive', 'motor type',
    'inverter drive'
  ],
  'detergent_dispenser': [
    'soap dispenser', 'auto dispenser', 'detergent drawer',
    'dispenser type', 'auto dose'
  ],

  // =============================================
  // DRYER SPECIFIC ATTRIBUTES
  // =============================================
  'dryer_capacity': [
    'drying capacity', 'drum capacity', 'dryer cu ft', 'load capacity',
    'tumble capacity'
  ],
  'vent_type': [
    'venting', 'ventless', 'vented', 'vent required', 'exhaust type',
    'heat pump', 'condenser'
  ],
  'sensor_dry': [
    'moisture sensor', 'auto dry', 'sensor drying', 'smart dry',
    'moisture sensing', 'auto sensor dry'
  ],
  'number_of_dry_cycles': [
    'dry cycles', 'drying programs', 'cycle count', 'dry options',
    'drying cycles'
  ],
  'drum_material': [
    'drum type', 'drum interior', 'stainless drum', 'porcelain drum',
    'drum construction'
  ],
  'door_swing': [
    'door direction', 'reversible door', 'door hinge', 'left swing',
    'right swing', 'door opening'
  ],
  'interior_light': [
    'drum light', 'inside light', 'interior lighting', 'drum illumination'
  ],

  // =============================================
  // RANGE HOOD SPECIFIC ATTRIBUTES
  // =============================================
  'sones': [
    'sound level', 'noise rating', 'sone rating', 'sone level',
    'noise sones', 'sound rating'
  ],
  'ductless': [
    'recirculating', 'non-ducted', 'filterless', 'no duct required',
    'ductless option'
  ],
  'fan_speeds': [
    'speed settings', 'blower speeds', 'number of speeds', 'speed levels',
    'fan settings'
  ],
  'filter_type': [
    'filter', 'baffle filter', 'mesh filter', 'charcoal filter',
    'aluminum filter', 'grease filter'
  ],
  'light_included': [
    'has light', 'lighting', 'includes light', 'built-in light',
    'hood lighting'
  ],
  'led': [
    'led lighting', 'led lights', 'led bulbs', 'energy efficient lighting'
  ],
  'convertible_to_ductless': [
    'convertible', 'duct or ductless', 'dual mode', 'can be ductless',
    'recirculation kit'
  ],
  'blower': [
    'blower type', 'fan type', 'exhaust blower', 'internal blower',
    'external blower', 'inline blower'
  ],
  'includes_remote': [
    'remote control', 'remote included', 'wireless remote', 'has remote',
    'remote operated'
  ],
  'duct_size': [
    'duct diameter', 'duct connection', 'exhaust size', 'vent size',
    'duct opening'
  ],
  'cfm_high': [
    'max cfm', 'high speed cfm', 'maximum airflow', 'peak cfm',
    'boost cfm'
  ],

  // =============================================
  // MICROWAVE SPECIFIC ATTRIBUTES
  // =============================================
  'microwave_capacity': [
    'microwave cu ft', 'cavity size', 'interior capacity', 'microwave size',
    'cooking capacity'
  ],
  'sensor_cooking': [
    'auto cook', 'sensor cook', 'automatic cooking', 'smart cook',
    'sensor reheat'
  ],
  'turntable': [
    'rotating plate', 'carousel', 'turntable included', 'glass tray',
    'rotating tray'
  ],
  'turntable_diameter': [
    'turntable size', 'plate diameter', 'tray size', 'carousel size'
  ],
  'auto_shut_off': [
    'automatic shutoff', 'auto off', 'safety shutoff', 'auto power off'
  ],
  'automatic_defrost': [
    'auto defrost', 'defrost function', 'quick defrost', 'smart defrost'
  ],

  // =============================================
  // FAUCET SPECIFIC ATTRIBUTES
  // =============================================
  'faucet_type': [
    'faucet style', 'type of faucet', 'faucet category', 'fixture type'
  ],
  'faucet_mounting_type': [
    'mount type', 'mounting style', 'deck mount', 'wall mount',
    'centerset', 'widespread', 'single hole'
  ],
  'number_of_handles': [
    'handle count', 'handles', 'single handle', 'double handle',
    'two handle', 'one handle'
  ],
  'spout_height': [
    'faucet height', 'spout reach height', 'arc height', 'overall height'
  ],
  'spout_reach': [
    'reach', 'projection', 'spout projection', 'faucet reach'
  ],
  'touchless_faucet': [
    'touchless', 'motion sensor', 'hands free', 'no touch',
    'sensor activated', 'motion activated'
  ],
  'voice_activated': [
    'voice control', 'alexa compatible', 'google assistant', 'smart faucet',
    'voice command'
  ],
  'spray_settings': [
    'spray modes', 'spray options', 'spray patterns', 'stream settings',
    'spray types'
  ],
  'faucet_holes': [
    'hole configuration', 'mounting holes', 'number of holes', 'hole spacing',
    'hole count'
  ],
  'flow_rate_gpm': [
    'gpm', 'gallons per minute', 'flow rate', 'water flow', 'max flow'
  ],
  'watersense_certified': [
    'watersense', 'water efficient', 'water saving', 'epa watersense',
    'low flow'
  ],
  'soap_dispenser_included': [
    'soap dispenser', 'includes dispenser', 'dispenser included',
    'has soap dispenser'
  ],
  'magnetic_docking': [
    'magnet dock', 'magnetic spray head', 'docking system', 'secure dock',
    'reflex'
  ],
  'pre_rinse': [
    'pre-rinse', 'commercial style', 'restaurant style', 'spring spout',
    'coil faucet'
  ],
  'spout_style': [
    'spout type', 'spout design', 'gooseneck', 'high arc', 'low arc',
    'pull down', 'pull out'
  ],
  'handle_style': [
    'handle type', 'handle design', 'lever handle', 'cross handle',
    'knob handle'
  ],
  'vessel_faucet': [
    'vessel sink faucet', 'tall faucet', 'above counter faucet',
    'raised faucet'
  ],
  'valve_type': [
    'cartridge type', 'valve cartridge', 'ceramic disc', 'ball valve',
    'compression valve'
  ],

  // =============================================
  // TOILET SPECIFIC ATTRIBUTES
  // =============================================
  'bowl_shape': [
    'bowl type', 'toilet bowl', 'elongated', 'round', 'compact elongated'
  ],
  'flush_type': [
    'flush mechanism', 'flushing system', 'gravity flush', 'pressure assist',
    'dual flush', 'single flush'
  ],
  'gallons_per_flush': [
    'gpf', 'flush volume', 'water per flush', 'flush rate', 'water usage'
  ],
  'bowl_height': [
    'seat height', 'rim height', 'toilet height', 'comfort height',
    'chair height', 'standard height'
  ],
  'rough_in': [
    'rough-in', 'drain offset', 'outlet offset', 'waste outlet',
    '10 inch rough', '12 inch rough', '14 inch rough'
  ],
  'seat_included': [
    'includes seat', 'seat and lid', 'comes with seat', 'seat provided'
  ],
  'trapway': [
    'trap', 'trapway size', 'fully glazed trapway', 'concealed trapway',
    'skirted trapway'
  ],
  'bidet_seat_included': [
    'bidet function', 'integrated bidet', 'bidet toilet', 'washlet',
    'bidet seat'
  ],
  'flush_technology': [
    'flush system', 'flushing technology', 'power flush', 'tornado flush',
    'aquapiston'
  ],
  'night_light': [
    'toilet light', 'bowl light', 'led night light', 'illuminated'
  ],
  'mounting_type': [
    'floor mount', 'wall mount', 'wall hung', 'floor standing'
  ],
  'soft_close_hinges': [
    'soft close', 'slow close', 'quiet close', 'gentle close'
  ],

  // =============================================
  // BATHTUB SPECIFIC ATTRIBUTES
  // =============================================
  'accepts_deck_mount': [
    'deck mount compatible', 'faucet holes', 'rim mount', 'deck faucet',
    'accepts deck mount faucet'
  ],

  // =============================================
  // LIGHTING SPECIFIC ATTRIBUTES
  // =============================================
  'number_of_lights': [
    'light count', 'bulb count', 'number of bulbs', 'lamp count',
    'how many lights'
  ],
  'chandelier_type': [
    'chandelier style', 'fixture type', 'light style', 'design type'
  ],
  'bulb_type': [
    'lamp type', 'light source', 'bulb style', 'incandescent', 'led bulb',
    'halogen', 'cfl'
  ],
  'dimmable': [
    'dimmer compatible', 'can dim', 'dimming', 'dimmable fixture',
    'works with dimmer'
  ],
  'maximum_adjustable_height': [
    'max height', 'adjustable height', 'hanging height', 'drop length',
    'overall height range'
  ],
  'bulb_included': [
    'bulbs included', 'includes bulbs', 'lamps included', 'comes with bulbs'
  ],
  'location_rating': [
    'wet rated', 'damp rated', 'dry rated', 'outdoor rated', 'ul listing',
    'indoor outdoor'
  ],
  'sloped_ceiling_compatible': [
    'sloped ceiling', 'vaulted ceiling', 'angled ceiling', 'cathedral ceiling'
  ],
  'crystal_type': [
    'crystal', 'crystal material', 'crystal style', 'swarovski', 'k9 crystal'
  ],
  'chain_length': [
    'chain', 'hanging chain', 'chain included', 'suspension length'
  ],
  'shade_material': [
    'shade', 'shade type', 'glass shade', 'fabric shade', 'metal shade'
  ],
  'number_of_tiers': [
    'tiers', 'tier count', 'levels', 'multi-tier', 'single tier'
  ],
  'shape': [
    'fixture shape', 'light shape', 'round', 'rectangular', 'linear', 'drum'
  ],

  // =============================================
  // CEILING FAN SPECIFIC ATTRIBUTES
  // =============================================
  'blade_span': [
    'fan size', 'blade size', 'sweep', 'diameter', 'blade diameter',
    'fan diameter', 'blade sweep'
  ],
  'number_of_blades': [
    'blade count', 'blades', 'how many blades', 'fan blades'
  ],
  'light_kit_included': [
    'has light', 'light included', 'includes light kit', 'with light',
    'integrated light'
  ],
  'motor_type': [
    'motor', 'dc motor', 'ac motor', 'reversible motor', 'motor style'
  ],
  'reversible_motor': [
    'reversible', 'reverse function', 'winter mode', 'summer winter',
    'direction change'
  ],
  'fan_blade_material': [
    'blade material', 'blade construction', 'wood blades', 'plastic blades',
    'metal blades'
  ],
  'downrod_included': [
    'downrod', 'mounting rod', 'extension rod', 'rod included',
    'downrod length'
  ],
  'light_kit_compatible': [
    'accepts light kit', 'light adaptable', 'can add light',
    'light kit ready'
  ],
  'low_ceiling_adaptable': [
    'hugger', 'flush mount fan', 'low profile', 'close to ceiling',
    'low ceiling'
  ],

  // =============================================
  // SINK SPECIFIC ATTRIBUTES
  // =============================================
  'sink_type': [
    'sink style', 'basin type', 'sink configuration', 'mount type'
  ],
  'number_of_basins': [
    'basins', 'bowls', 'single bowl', 'double bowl', 'basin count',
    'compartments'
  ],
  'sink_depth': [
    'bowl depth', 'basin depth', 'sink bowl depth', 'depth'
  ],
  'sink_material': [
    'basin material', 'sink construction', 'stainless steel', 'cast iron',
    'fireclay', 'composite', 'porcelain'
  ],
  'undermount': [
    'undermount sink', 'under mount', 'below counter', 'undermounted'
  ],
  'drop_in': [
    'drop-in', 'top mount', 'self-rimming', 'above counter'
  ],
  'farmhouse': [
    'farmhouse sink', 'apron front', 'apron sink', 'farm sink',
    'apron-front'
  ],
  'sound_dampening': [
    'sound absorbing', 'noise reduction', 'quiet sink', 'sound deadening',
    'soundproofing'
  ],

  // =============================================
  // COMMON DIMENSION ATTRIBUTES
  // =============================================
  'overall_dimensions': [
    'dimensions', 'size', 'product dimensions', 'total dimensions'
  ],
  'cutout_dimensions': [
    'cut out size', 'installation cutout', 'rough opening', 'cutout size'
  ],

  // =============================================
  // COLLECTION / STYLE ATTRIBUTES
  // =============================================
  'collection': [
    'product line', 'series', 'family', 'product family', 'model line'
  ],
  'style': [
    'design style', 'aesthetic', 'look', 'modern', 'traditional',
    'contemporary', 'transitional'
  ],
  'color': [
    'finish color', 'color finish', 'hue', 'shade', 'tone'
  ],
  'color_family': [
    'color group', 'color category', 'color type'
  ]
};

// ============================================
// VALUE EXTRACTION PATTERNS
// ============================================

interface ExtractedValue {
  value: string | number | boolean;
  unit?: string;
  confidence: number;
  source: string;
}

/**
 * Patterns for extracting numeric values with units
 */
const VALUE_PATTERNS: Record<string, RegExp[]> = {
  gallons: [
    /(\d+(?:\.\d+)?)\s*(?:gallons?|gal\.?)\s*(?:capacity)?/i,
    /capacity[:\s]*(\d+(?:\.\d+)?)\s*(?:gallons?|gal\.?)/i,
    /(\d+(?:\.\d+)?)\s*-?\s*gallon/i
  ],
  weight_lbs: [
    /(\d+(?:\.\d+)?)\s*(?:lbs?\.?|pounds?)/i,
    /weight[:\s]*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:lb|lbs)/i
  ],
  inches: [
    /(\d+(?:\.\d+)?)\s*(?:"|in\.?|inch(?:es)?)/i,
    /(\d+(?:\.\d+)?)\s*['"]?\s*(?:x|by)/i  // Dimensions like 60" x 30"
  ],
  btu: [
    /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:btu|btus)/i,
    /btu[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i
  ],
  cfm: [
    /(\d+(?:\.\d+)?)\s*(?:cfm|cubic feet per minute)/i,
    /cfm[:\s]*(\d+(?:\.\d+)?)/i
  ],
  gpm: [
    /(\d+(?:\.\d+)?)\s*(?:gpm|gallons? per minute)/i,
    /gpm[:\s]*(\d+(?:\.\d+)?)/i,
    /flow[:\s]*(\d+(?:\.\d+)?)/i
  ],
  cubic_feet: [
    /(\d+(?:\.\d+)?)\s*(?:cu\.?\s*ft\.?|cubic feet)/i,
    /capacity[:\s]*(\d+(?:\.\d+)?)\s*(?:cu\.?\s*ft\.?)/i
  ],
  count: [
    /(\d+)\s*(?:jets?|burners?|elements?)/i,
    /(?:jets?|burners?)[:\s]*(\d+)/i
  ],
  voltage: [
    /(\d+)\s*(?:v|volts?|vac)/i,
    /(\d+)\/(\d+)\s*(?:v|vac)/i  // 240/208V
  ]
};

// ============================================
// INFERENCE FUNCTIONS
// ============================================

/**
 * Extract a numeric value from text using the appropriate pattern
 */
function extractNumericValue(text: string, valueType: string): number | null {
  const patterns = VALUE_PATTERNS[valueType];
  if (!patterns) return null;
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Remove commas and parse
      const numStr = match[1].replace(/,/g, '');
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        return num;
      }
    }
  }
  return null;
}

/**
 * Normalize a field name for comparison
 */
function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find the best matching Salesforce field for a given attribute name
 */
export function findFieldMatch(attributeName: string): { fieldKey: string; confidence: number } | null {
  const normalized = normalizeFieldName(attributeName);
  
  // Direct match check
  for (const [fieldKey, aliases] of Object.entries(FIELD_ALIASES)) {
    // Check if the attribute name exactly matches a known alias
    for (const alias of aliases) {
      const normalizedAlias = normalizeFieldName(alias);
      
      // Exact match
      if (normalized === normalizedAlias) {
        return { fieldKey, confidence: 1.0 };
      }
      
      // Strong partial match (one contains the other significantly)
      if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
        const shorter = Math.min(normalized.length, normalizedAlias.length);
        const longer = Math.max(normalized.length, normalizedAlias.length);
        const ratio = shorter / longer;
        
        if (ratio > 0.6) {
          return { fieldKey, confidence: ratio };
        }
      }
    }
    
    // Also check if field key matches directly
    const normalizedKey = normalizeFieldName(fieldKey.replace(/_/g, ' '));
    if (normalized === normalizedKey || normalized.includes(normalizedKey)) {
      return { fieldKey, confidence: 0.9 };
    }
  }
  
  return null;
}

/**
 * Infer field values from features list or description text
 */
export function inferFieldsFromText(
  text: string,
  targetFields: string[]
): Record<string, ExtractedValue> {
  const results: Record<string, ExtractedValue> = {};
  
  if (!text) return results;
  
  const normalizedText = text.toLowerCase();
  
  for (const fieldKey of targetFields) {
    // Get the appropriate extraction pattern based on field type
    let extractedValue: number | string | boolean | null = null;
    let unit: string | undefined;
    
    // Capacity (gallons) - for bathtubs, water heaters
    if (fieldKey === 'capacity_gallons' || fieldKey.includes('gallon')) {
      extractedValue = extractNumericValue(text, 'gallons');
      unit = 'gallons';
    }
    // Capacity (cubic feet) - for appliances
    else if (fieldKey === 'capacity' || fieldKey.includes('cu_ft')) {
      extractedValue = extractNumericValue(text, 'cubic_feet');
      unit = 'cu. ft.';
    }
    // Weight
    else if (fieldKey === 'weight' || fieldKey.includes('weight')) {
      extractedValue = extractNumericValue(text, 'weight_lbs');
      unit = 'lbs';
    }
    // BTU
    else if (fieldKey === 'btu_output' || fieldKey.includes('btu')) {
      extractedValue = extractNumericValue(text, 'btu');
      unit = 'BTU';
    }
    // CFM
    else if (fieldKey === 'cfm') {
      extractedValue = extractNumericValue(text, 'cfm');
      unit = 'CFM';
    }
    // GPM / Flow Rate
    else if (fieldKey === 'flow_rate' || fieldKey.includes('gpm')) {
      extractedValue = extractNumericValue(text, 'gpm');
      unit = 'GPM';
    }
    // Dimensions
    else if (fieldKey.includes('length') || fieldKey.includes('width') || 
             fieldKey.includes('height') || fieldKey.includes('depth')) {
      extractedValue = extractNumericValue(text, 'inches');
      unit = 'inches';
    }
    // Count fields (jets, burners)
    else if (fieldKey.includes('number_of') || fieldKey.includes('count')) {
      extractedValue = extractNumericValue(text, 'count');
    }
    // Boolean fields - check for presence
    else if (['overflow', 'ada', 'soaking', 'whirlpool', 'air_bath', 'convection', 
              'smart_home', 'energy_star', 'drain_assembly_included'].includes(fieldKey)) {
      const aliases = FIELD_ALIASES[fieldKey] || [];
      for (const alias of aliases) {
        if (normalizedText.includes(normalizeFieldName(alias))) {
          // Check for negation
          const negationPattern = new RegExp(`no\\s+${alias}|without\\s+${alias}|${alias}\\s*:\\s*no`, 'i');
          extractedValue = !negationPattern.test(text);
          break;
        }
      }
    }
    
    if (extractedValue !== null) {
      results[fieldKey] = {
        value: extractedValue,
        unit,
        confidence: 0.8,
        source: 'text_inference'
      };
    }
  }
  
  return results;
}

/**
 * Main inference function - analyzes all available data sources
 * and maps values to Salesforce fields using common sense
 */
export function inferMissingFields(
  rawSpecs: Array<{ name: string; value: string }>,
  featuresText: string,
  descriptionText: string,
  targetFields: string[],
  category?: string
): Record<string, ExtractedValue> {
  const results: Record<string, ExtractedValue> = {};
  
  logger.info('Smart field inference starting', {
    specsCount: rawSpecs?.length || 0,
    featuresLength: featuresText?.length || 0,
    descriptionLength: descriptionText?.length || 0,
    targetFieldsCount: targetFields.length,
    category
  });
  
  // Step 1: Try to match raw specs to target fields using aliases
  if (rawSpecs && Array.isArray(rawSpecs)) {
    for (const spec of rawSpecs) {
      if (!spec.name || spec.value === undefined || spec.value === null || spec.value === '') continue;
      
      const fieldMatch = findFieldMatch(spec.name);
      
      if (fieldMatch && targetFields.includes(fieldMatch.fieldKey)) {
        // Don't overwrite if we already have a higher confidence match
        if (!results[fieldMatch.fieldKey] || results[fieldMatch.fieldKey].confidence < fieldMatch.confidence) {
          results[fieldMatch.fieldKey] = {
            value: spec.value,
            confidence: fieldMatch.confidence,
            source: `spec_alias_match:${spec.name}`
          };
          
          logger.info('Field inferred from spec alias', {
            specName: spec.name,
            fieldKey: fieldMatch.fieldKey,
            value: spec.value,
            confidence: fieldMatch.confidence
          });
        }
      }
    }
  }
  
  // Step 2: Extract values from features text
  const missingFields = targetFields.filter(f => !results[f]);
  if (missingFields.length > 0 && featuresText) {
    const featuresInferred = inferFieldsFromText(featuresText, missingFields);
    
    for (const [fieldKey, extracted] of Object.entries(featuresInferred)) {
      if (!results[fieldKey]) {
        results[fieldKey] = extracted;
        logger.info('Field inferred from features text', {
          fieldKey,
          value: extracted.value,
          source: 'features_text'
        });
      }
    }
  }
  
  // Step 3: Extract values from description text
  const stillMissing = targetFields.filter(f => !results[f]);
  if (stillMissing.length > 0 && descriptionText) {
    const descInferred = inferFieldsFromText(descriptionText, stillMissing);
    
    for (const [fieldKey, extracted] of Object.entries(descInferred)) {
      if (!results[fieldKey]) {
        results[fieldKey] = {
          ...extracted,
          confidence: extracted.confidence * 0.9 // Slightly lower confidence for description
        };
        logger.info('Field inferred from description', {
          fieldKey,
          value: extracted.value,
          source: 'description_text'
        });
      }
    }
  }
  
  logger.info('Smart field inference complete', {
    targetFields: targetFields.length,
    fieldsInferred: Object.keys(results).length,
    inferredFields: Object.keys(results)
  });
  
  return results;
}

/**
 * Category-specific field mapping overrides
 * Some categories have unique field names that need special handling
 */
export const CATEGORY_FIELD_OVERRIDES: Record<string, Record<string, string>> = {
  'Bathtubs': {
    'capacity_gallons': 'capacity_gallons',  // Maps to "Capacity (Gallons)" SF field
    'water_depth': 'water_depth',            // Maps to "Water Depth" SF field
    'tub_shape': 'tub_shape',
    'number_of_bathers': 'number_of_bathers'
  },
  'Water Heaters': {
    'capacity_gallons': 'total_capacity',    // Different field name in SF
    'first_hour_rating': 'first_hour_delivery'
  },
  'Refrigerators': {
    'refrigerator_capacity': 'refrigerator_capacity',
    'freezer_capacity': 'freezer_capacity',
    'total_capacity': 'total_capacity'
  },
  'Dishwashers': {
    'place_settings': 'place_setting_capacity'
  }
};

/**
 * Get the correct Salesforce field key for a category
 */
export function getCategoryFieldKey(category: string, genericFieldKey: string): string {
  const overrides = CATEGORY_FIELD_OVERRIDES[category];
  if (overrides && overrides[genericFieldKey]) {
    return overrides[genericFieldKey];
  }
  return genericFieldKey;
}

/**
 * FINAL SWEEP FOR MISSING VALUES
 * ==============================
 * Performs an exhaustive search across ALL data sources to find values
 * for fields that were marked as "Not Found" by AI.
 * 
 * This function is called AFTER AI processing to catch anything the AI missed
 * that exists in the raw data.
 * 
 * @param fieldKey - The field key to search for (e.g., 'ada', 'cutlery_tray')
 * @param rawProduct - The raw product data from Salesforce
 * @param category - Optional category for context-aware searching
 * @returns The found value or null if truly not found
 */
export function finalSweepForValue(
  fieldKey: string,
  rawProduct: any,
  _category?: string  // Reserved for future category-specific logic
): string | null {
  const normalizeKey = (key: string): string => 
    key.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  
  const normalizeName = (name: string): string =>
    name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  
  const normalizedFieldKey = normalizeKey(fieldKey);
  
  // Get all possible aliases for this field
  const aliases = FIELD_ALIASES[fieldKey] || FIELD_ALIASES[normalizedFieldKey] || [];
  const searchTerms = [
    fieldKey,
    fieldKey.replace(/_/g, ' '),
    ...aliases
  ].map(s => normalizeName(s));
  
  // Add the readable field name (e.g., "ada" -> "ADA Compliant")
  const readableName = fieldKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  searchTerms.push(normalizeName(readableName));
  
  // Helper to search an array of attributes
  const searchInArray = (attrs: Array<{ name: string; value: string }> | undefined): string | null => {
    if (!attrs || !Array.isArray(attrs)) return null;
    
    for (const attr of attrs) {
      if (!attr.name || attr.value === undefined || attr.value === null) continue;
      
      const normalizedAttrName = normalizeName(attr.name);
      
      // Check each search term
      for (const term of searchTerms) {
        if (
          normalizedAttrName === term ||
          normalizedAttrName.includes(term) ||
          term.includes(normalizedAttrName)
        ) {
          // Verify it's a meaningful match (not just "a" matching "capacity")
          const matchRatio = Math.min(normalizedAttrName.length, term.length) / 
                            Math.max(normalizedAttrName.length, term.length);
          if (matchRatio > 0.4) {
            // Found a match - clean and return the value
            const value = String(attr.value).trim();
            if (value && value !== '' && value.toLowerCase() !== 'n/a') {
              logger.info('Final sweep found value', {
                fieldKey,
                matchedAttr: attr.name,
                matchedTerm: term,
                value,
                source: 'attribute_array'
              });
              return value;
            }
          }
        }
      }
    }
    return null;
  };
  
  // Helper to search in specifications object
  const searchInSpecs = (specs: Record<string, any> | undefined): string | null => {
    if (!specs || typeof specs !== 'object') return null;
    
    for (const [key, spec] of Object.entries(specs)) {
      if (!spec) continue;
      
      const normalizedSpecKey = normalizeName(key);
      const specValue = typeof spec === 'object' ? spec.value : spec;
      
      if (!specValue) continue;
      
      for (const term of searchTerms) {
        if (
          normalizedSpecKey === term ||
          normalizedSpecKey.includes(term) ||
          term.includes(normalizedSpecKey)
        ) {
          const matchRatio = Math.min(normalizedSpecKey.length, term.length) / 
                            Math.max(normalizedSpecKey.length, term.length);
          if (matchRatio > 0.4) {
            const value = String(specValue).trim();
            if (value && value !== '' && value.toLowerCase() !== 'n/a') {
              logger.info('Final sweep found value in specs', {
                fieldKey,
                matchedSpec: key,
                matchedTerm: term,
                value,
                source: 'specifications'
              });
              return value;
            }
          }
        }
      }
    }
    return null;
  };
  
  // Search order (most reliable first):
  // 1. Ferguson Attributes
  let found = searchInArray(rawProduct.Ferguson_Attributes);
  if (found) return found;
  
  // 2. Web Retailer Specs
  found = searchInArray(rawProduct.Web_Retailer_Specs);
  if (found) return found;
  
  // 3. Ferguson Raw Data specifications
  if (rawProduct.Ferguson_Raw_Data?.product?.specifications) {
    found = searchInSpecs(rawProduct.Ferguson_Raw_Data.product.specifications);
    if (found) return found;
  }
  
  // 4. Ferguson Raw Data feature_groups
  if (rawProduct.Ferguson_Raw_Data?.product?.feature_groups) {
    for (const group of rawProduct.Ferguson_Raw_Data.product.feature_groups) {
      if (group.features && Array.isArray(group.features)) {
        const converted = group.features.map((f: any) => ({ name: f.name, value: f.value }));
        found = searchInArray(converted);
        if (found) return found;
      }
    }
  }
  
  // 5. Search in description for boolean fields
  const booleanFields = ['ada', 'energy_star', 'panel_ready', 'smart_home', 'fingerprint_resistant'];
  if (booleanFields.includes(normalizedFieldKey)) {
    const descriptions = [
      rawProduct.Product_Description_Web_Retailer,
      rawProduct.Ferguson_Description,
      rawProduct.Ferguson_Raw_Data?.product?.description
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Check for explicit mentions
    for (const term of searchTerms) {
      if (descriptions.includes(term)) {
        // Check context for Yes/No
        if (descriptions.includes(`${term}: no`) || 
            descriptions.includes(`${term} no`) ||
            descriptions.includes(`not ${term}`)) {
          logger.info('Final sweep found boolean No in description', {
            fieldKey,
            term,
            source: 'description'
          });
          return 'No';
        }
        if (descriptions.includes(`${term}: yes`) || 
            descriptions.includes(`${term} yes`) ||
            descriptions.includes(`is ${term}`)) {
          logger.info('Final sweep found boolean Yes in description', {
            fieldKey,
            term,
            source: 'description'
          });
          return 'Yes';
        }
      }
    }
  }
  
  // Special handling for specific fields
  // ADA - check for "Ada Compliant" in Web_Retailer_Specs specifically
  if (normalizedFieldKey === 'ada' || fieldKey === 'ada') {
    const adaAttr = rawProduct.Web_Retailer_Specs?.find((s: any) => 
      s.name?.toLowerCase().includes('ada')
    );
    if (adaAttr?.value) {
      logger.info('Final sweep found ADA via special check', {
        fieldKey,
        value: adaAttr.value,
        source: 'ada_special_check'
      });
      return adaAttr.value;
    }
  }
  
  // Cutlery Tray / 3rd Rack - derive from number_of_racks
  if (normalizedFieldKey === 'cutlerytray' || fieldKey === 'cutlery_tray') {
    const racksAttr = rawProduct.Ferguson_Attributes?.find((a: any) =>
      a.name?.toLowerCase().includes('rack') && a.name?.toLowerCase().includes('number')
    );
    if (racksAttr?.value) {
      const numRacks = parseInt(racksAttr.value, 10);
      if (numRacks >= 3) {
        logger.info('Final sweep inferred cutlery tray from number of racks', {
          fieldKey,
          numRacks,
          source: 'derived_from_racks'
        });
        return 'Yes';
      }
    }
    
    // Also check for "3rd rack" or "third rack" mentions
    const descriptions = [
      rawProduct.Product_Description_Web_Retailer,
      rawProduct.Ferguson_Description,
      rawProduct.Ferguson_Raw_Data?.product?.description
    ].filter(Boolean).join(' ').toLowerCase();
    
    if (descriptions.includes('3rd rack') || descriptions.includes('third rack') ||
        descriptions.includes('standard 3rd rack') || descriptions.includes('cutlery tray')) {
      logger.info('Final sweep found 3rd rack mention in description', {
        fieldKey,
        source: 'description_mention'
      });
      return 'Yes';
    }
  }
  
  return null;
}

/**
 * Perform final sweep on ALL "Not Found" values in Top Filter Attributes
 * This ensures we extract everything possible from the raw data
 */
export function finalSweepTopFilterAttributes(
  topFilterAttrs: Record<string, any>,
  rawProduct: any,
  category?: string
): Record<string, any> {
  const updated = { ...topFilterAttrs };
  const notFoundMarkers = ['not found', 'n/a', 'unavailable', '', null, undefined];
  
  for (const [key, value] of Object.entries(updated)) {
    const isNotFound = value === null || 
                       value === undefined || 
                       notFoundMarkers.includes(String(value).toLowerCase().trim());
    
    if (isNotFound) {
      const foundValue = finalSweepForValue(key, rawProduct, category);
      if (foundValue) {
        updated[key] = foundValue;
        logger.info('Final sweep replaced Not Found', {
          fieldKey: key,
          oldValue: value,
          newValue: foundValue
        });
      }
    }
  }
  
  return updated;
}

export default {
  FIELD_ALIASES,
  findFieldMatch,
  inferFieldsFromText,
  inferMissingFields,
  getCategoryFieldKey,
  finalSweepForValue,
  finalSweepTopFilterAttributes,
  CATEGORY_FIELD_OVERRIDES
};
