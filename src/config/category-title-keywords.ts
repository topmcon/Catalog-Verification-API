/**
 * CATEGORY TITLE KEYWORDS — Used for title-based tiebreaker when AIs disagree
 * ============================================================================
 * Maps non-appliance category names → distinctive keywords that appear in
 * Ferguson or Web Retailer product titles for that category.
 * 
 * RULES:
 * 1. Keywords must be DISTINCTIVE — they should strongly indicate THIS category
 *    and NOT be common across many categories
 * 2. Use lowercase — matching is case-insensitive
 * 3. Multi-word phrases are preferred (more distinctive than single words)
 * 4. Appliance categories are EXCLUDED (handled separately)
 * 5. When adding keywords, ensure they don't create false positives for
 *    commonly confused categories
 * 
 * USED BY: resolveCategoryDisagreementByTitle() in category-config.ts
 * ONLY FIRES: When two AIs disagree on category (tiebreaker)
 */

export const NON_APPLIANCE_CATEGORY_TITLE_KEYWORDS: Record<string, string[]> = {

  // ============================================
  // LIGHTING & ELECTRICAL
  // ============================================
  'Wall Sconce': ['wall sconce', 'sconce', 'wall light', 'wall lamp', 'wall fixture'],
  'Chandelier': ['chandelier', 'candelabra', 'crystal chandelier'],
  'Pendant': ['pendant', 'pendant light', 'hanging light', 'mini pendant', 'island light'],
  'Ceiling Light': ['ceiling light', 'ceiling fixture', 'ceiling mount'],
  'Flush and Semi-Flush': ['flush mount', 'semi-flush', 'semi flush', 'close to ceiling'],
  'Ceiling Fan': ['ceiling fan', 'fan with light', 'blade span'],
  'Vanity Lighting': ['vanity light', 'bath bar', 'bath light', 'vanity bar'],
  'Bathroom Lighting': ['bathroom light', 'bath vanity', 'bath sconce'],
  'Recessed Lighting': ['recessed', 'can light', 'downlight', 'recessed trim', 'recessed kit'],
  'Track and Rail Lighting': ['track light', 'track head', 'rail light', 'monorail', 'track kit'],
  'Under Cabinet Light': ['under cabinet', 'undercabinet', 'cabinet light', 'task light'],
  'Landscape Lighting': ['landscape light', 'path light', 'garden light', 'spot light', 'flood light', 'well light'],
  'Post Light': ['post light', 'post lantern', 'lamp post', 'post mount', 'pier mount'],
  'LED Lighting': ['led strip', 'led tape', 'led panel', 'led driver'],
  'Island Lighting': ['island light', 'kitchen island', 'linear chandelier', 'island pendant'],
  'Kitchen Lighting': ['kitchen light', 'kitchen fixture'],
  'Commercial Lighting': ['commercial light', 'high bay', 'troffer', 'vapor tight'],
  'Lamp': ['table lamp', 'floor lamp', 'desk lamp', 'buffet lamp', 'accent lamp'],
  'Light Bulbs': ['light bulb', 'led bulb', 'halogen bulb', 'incandescent', 'filament bulb'],
  'Light Switches & Dimmers': ['dimmer', 'light switch', 'toggle switch', 'rocker switch', 'dimmer switch'],
  'Lighting Accessory': ['lighting accessory', 'canopy', 'chain', 'mounting bracket'],
  'Step Lighting': ['step light', 'stair light', 'deck light'],
  'Air Circulator': ['air circulator', 'room fan', 'tower fan'],
  'Attic Fan': ['attic fan', 'whole house fan', 'attic ventilator'],

  // ============================================
  // PLUMBING & BATH
  // ============================================
  'Medicine Cabinet': ['medicine cabinet', 'mirrored cabinet', 'recessed cabinet', 'surface mount cabinet', 'medicine cab'],
  'Kitchen Faucet': ['kitchen faucet', 'pull-down faucet', 'pull-out faucet', 'kitchen pull-down', 'kitchen pull-out'],
  'Bathroom Faucet': ['bathroom faucet', 'lavatory faucet', 'widespread faucet', 'centerset faucet', 'lav faucet', 'widespread bathroom', 'centerset bathroom', 'single hole bathroom faucet', 'vessel bathroom faucet'],
  'Bar Faucet': ['bar faucet', 'prep faucet', 'bar sink faucet', 'bar prep faucet'],
  'Pot Filler Faucet': ['pot filler', 'pot filler faucet'],
  'Tub Filler': ['tub filler', 'tub faucet', 'roman tub', 'bathtub faucet', 'deck mount tub', 'deck mounted roman', 'floor mount tub', 'freestanding tub faucet', 'bath faucet'],
  'Showerheads & Accessories': ['shower faucet', 'shower trim', 'shower valve', 'shower system', 'shower head', 'showerhead', 'rain shower', 'hand shower', 'shower combo', 'shower accessory', 'thermostatic valve', 'thermostatic trim', 'pressure balance valve', 'pressure balance trim'],
  'Shower Accessory': ['shower door', 'shower curtain rod', 'shower shelf', 'shower bench', 'shower seat', 'shower caddy'],
  'Toilet': ['toilet', 'elongated toilet', 'round toilet', 'one piece toilet', 'two piece toilet', 'commode', 'water closet'],
  'Toilet Seat': ['toilet seat', 'bidet seat', 'slow close seat'],
  'Bidet': ['bidet', 'bidet sprayer'],
  'Bidet Seat': ['bidet seat', 'electronic bidet', 'washlet'],
  'Bathtub': ['bathtub', 'soaking tub', 'freestanding tub', 'clawfoot tub', 'alcove tub', 'drop-in tub', 'whirlpool tub'],
  'Bathtub Waste & Overflow': ['waste and overflow', 'drain assembly', 'tub drain', 'overflow drain'],
  'Shower': ['shower enclosure', 'shower base', 'shower pan', 'shower stall', 'shower kit'],
  'Steam Shower': ['steam shower', 'steam generator', 'steam bath'],
  'Kitchen Sink': ['kitchen sink', 'farmhouse sink', 'apron front sink', 'undermount sink', 'workstation sink'],
  'Bathroom Sink': ['bathroom sink', 'vessel sink', 'pedestal sink', 'wall hung sink', 'lavatory sink', 'console sink'],
  'Bar & Prep Sink': ['bar sink', 'prep sink', 'bar basin'],
  'Bathroom Vanity': ['bathroom vanity', 'vanity cabinet', 'vanity set', 'vanity combo', 'bath vanity'],
  'Bathroom Mirror': ['bathroom mirror', 'vanity mirror', 'lighted mirror', 'led mirror'],
  'Bathroom Hardware and Accessories': ['towel bar', 'towel ring', 'robe hook', 'toilet paper holder', 'towel rack', 'bath accessory', 'towel warmer'],
  'Bath Fan': ['bath fan', 'bathroom fan', 'exhaust fan', 'ventilation fan', 'bath exhaust'],
  'Rough-In Valve': ['rough-in valve', 'rough in valve', 'shower rough', 'valve body'],
  'Pressure Valve': ['pressure valve', 'pressure balance', 'thermostatic valve'],
  'Garbage Disposal': ['garbage disposal', 'disposer', 'waste disposal', 'food waste'],
  'Water Filtration': ['water filter', 'water filtration', 'reverse osmosis', 'water purifier'],
  'Pipe Fitting': ['pipe fitting', 'coupling', 'elbow fitting', 'tee fitting', 'pipe connector'],
  'Tub and Shower Accessory': ['tub spout', 'shower arm', 'flange', 'shower rod', 'shower hose'],
  'Kitchen Accessory': ['kitchen accessory', 'soap dispenser', 'cutting board', 'dish rack'],
  'Kitchen Storage & Organization': ['kitchen storage', 'kitchen organizer', 'pull out shelf', 'lazy susan'],
  'Kitchen Furniture and Decor': ['kitchen cart', 'kitchen island cart', 'baker rack'],

  // ============================================
  // HARDWARE
  // ============================================
  'Cabinet Pull': ['cabinet pull', 'drawer pull', 'pull handle'],
  'Cabinet Knob': ['cabinet knob', 'drawer knob', 'knob handle'],
  'Cabinet Hinge': ['cabinet hinge', 'concealed hinge', 'overlay hinge', 'inset hinge'],
  'Drawer Slide and Accessory': ['drawer slide', 'drawer glide', 'soft close slide'],
  'Door Hardware: Knob and Lever': ['door knob', 'door lever', 'passage knob', 'privacy lever', 'dummy knob'],
  'Door Entry Set': ['entry set', 'door lock set', 'front door hardware', 'entry door'],
  'Handleset': ['handleset', 'handle set', 'front door handleset'],
  'Deadbolt': ['deadbolt', 'dead bolt', 'single cylinder', 'double cylinder'],
  'Door Hinge': ['door hinge', 'butt hinge', 'spring hinge'],
  'Door Knob': ['door knob', 'interior knob', 'passage knob', 'privacy knob'],
  'Door Lever': ['door lever', 'interior lever', 'passage lever', 'privacy lever'],
  'Keyless Entry': ['keyless entry', 'smart lock', 'electronic lock', 'keypad lock', 'touchscreen lock'],
  'Lock Combo Pack': ['lock combo', 'combo pack', 'knob and deadbolt'],
  'Mortise Lock': ['mortise lock', 'mortise hardware', 'mortise set'],
  'Appliance Pull': ['appliance pull', 'appliance handle'],
  'Refrigerator Pull': ['refrigerator pull', 'refrigerator handle'],
  'Dishwasher Pull': ['dishwasher pull', 'dishwasher handle'],
  'Backplate': ['backplate', 'back plate', 'escutcheon plate'],
  'Cabinet Catch and Latch': ['cabinet catch', 'cabinet latch', 'magnetic catch', 'roller catch'],
  'Cabinet Lock': ['cabinet lock', 'drawer lock', 'cam lock'],
  'Cabinet Organization and Storage': ['cabinet organizer', 'shelf insert', 'cabinet shelf'],
  'Cabinet Hardware Bulk Pack': ['bulk pack', 'contractor pack', 'multi pack'],
  'Designer Cabinet Hardware': ['designer hardware', 'luxury hardware', 'designer pull', 'designer knob'],
  'Barn Door Hardware': ['barn door', 'sliding barn', 'barn door kit', 'barn door track'],
  'Sliding Door Hardware': ['sliding door', 'pocket door', 'sliding hardware'],
  'Closet and Pocket Door Hardware': ['closet door', 'pocket door', 'bifold door'],
  'Door Hardware Part': ['door part', 'strike plate', 'door stop', 'door closer', 'door bumper'],
  'Commercial Door Hardware': ['commercial door', 'panic bar', 'exit device', 'door closer commercial'],
  'Screen and Storm Door Hardware': ['screen door', 'storm door', 'screen hardware'],
  'Vanity Cabinet Hardware': ['vanity hardware', 'vanity pull', 'vanity knob'],
  'Safe, Lock and Lock Box': ['safe', 'lock box', 'lockbox', 'gun safe', 'fire safe'],
  'Safety & Security': ['door viewer', 'peephole', 'door chain', 'security bar'],
  'Storage and Organization': ['storage rack', 'shelving unit', 'garage storage', 'wall mount shelf'],
  'Keyed Hardware': ['keyed alike', 'keyed entry', 'master key'],
  'Multi Point Door Hardware': ['multipoint', 'multi-point', 'multi point lock'],
  'Door': ['interior door', 'prehung door', 'slab door'],
  'Cabinet Finishing': ['cabinet finish', 'cabinet paint', 'refinishing'],
  'Cabinet Hardware Mounting Template': ['mounting template', 'drill template', 'jig template'],

  // ============================================
  // HOME DÉCOR & FURNITURE
  // ============================================
  'Mirror': ['wall mirror', 'decorative mirror', 'accent mirror', 'full length mirror', 'floor mirror'],
  'Wall Decor': ['wall art', 'wall decor', 'canvas print', 'wall hanging', 'decorative panel', 'picture frame'],
  'Chair': ['accent chair', 'dining chair', 'arm chair', 'lounge chair', 'office chair'],
  'Rug': ['area rug', 'accent rug', 'runner rug', 'outdoor rug', 'indoor rug'],

  // ============================================
  // HEATING & COOLING
  // ============================================
  'Exhaust Fan': ['exhaust fan', 'ventilation fan', 'inline fan'],
  'Thermostat': ['thermostat', 'smart thermostat', 'programmable thermostat'],
  'Water Heater': ['water heater', 'hot water heater', 'tank water heater'],
  'Tankless Water Heater': ['tankless water heater', 'on demand water', 'instant hot water', 'tankless'],
  'Stove and Fireplace': ['fireplace', 'wood stove', 'pellet stove', 'gas fireplace', 'electric fireplace', 'fireplace insert'],
  'Patio Heater': ['patio heater', 'outdoor heater', 'infrared heater', 'propane heater'],
  'Room Heater': ['room heater', 'space heater', 'baseboard heater', 'wall heater', 'radiator heater'],
  'Air Conditioner': ['air conditioner', 'window ac', 'portable ac', 'air conditioning'],
  'Mini Split Air Conditioner': ['mini split', 'ductless', 'split system ac'],
  'Dehumidifier': ['dehumidifier', 'moisture removal'],
  'Stove and Chimney Pipe': ['chimney pipe', 'stove pipe', 'flue pipe', 'chimney cap'],
  'Air Filter': ['air filter', 'furnace filter', 'hvac filter', 'merv filter'],
  'Skylight': ['skylight', 'roof window', 'sun tunnel'],
  'HVAC Accessory': ['hvac accessory', 'duct connector', 'register', 'grille', 'vent cover'],
  'Evaporative Cooler': ['evaporative cooler', 'swamp cooler'],

  // ============================================
  // OUTDOOR
  // ============================================
  'Fire Pit': ['fire pit', 'fire bowl', 'fire ring', 'fire table'],
  'Fire Pit Accessory': ['fire pit cover', 'fire glass', 'fire pit grate', 'fire pit screen'],
  'Outdoor Fireplace': ['outdoor fireplace', 'patio fireplace'],
  'Garden Decor': ['garden decor', 'garden statue', 'bird bath', 'garden fountain', 'planter'],
  'Mail Box': ['mailbox', 'mail box', 'post mount mailbox', 'wall mount mailbox'],
  'Generator': ['generator', 'portable generator', 'inverter generator', 'standby generator'],
  'Hardscaping': ['paver', 'retaining wall', 'landscape block', 'stepping stone'],
  'Exterior Door': ['exterior door', 'front door', 'entry door', 'patio door'],
  'Entry Set': ['entry set', 'exterior handle', 'entry handle'],
  'Outdoor Shower Faucet': ['outdoor shower', 'garden shower', 'pool shower'],
  'Storage Drawer/Door': ['outdoor drawer', 'access door', 'storage door'],

  // ============================================
  // FLOORING
  // ============================================
  'Tile': ['porcelain tile', 'ceramic tile', 'floor tile', 'wall tile', 'mosaic tile'],
  'Kitchen Tile': ['backsplash', 'kitchen tile', 'subway tile', 'backsplash tile'],
  'Hardwood Flooring': ['hardwood floor', 'oak floor', 'engineered hardwood', 'solid hardwood'],
  'Luxury Vinyl Flooring': ['luxury vinyl', 'lvp', 'vinyl plank', 'vinyl flooring'],
  'Laminate Flooring': ['laminate floor', 'laminate plank'],
  'Waterproof Flooring': ['waterproof floor', 'waterproof plank', 'waterproof vinyl'],

  // ============================================
  // INDUSTRIAL & COMMERCIAL
  // ============================================
  'Water Fountain': ['water fountain', 'drinking fountain', 'water cooler', 'bottle filler'],
  'Commercial Restroom': ['commercial toilet', 'flush valve', 'urinal', 'commercial faucet'],
  'Hydronic Expansion Tank': ['expansion tank', 'hydronic tank', 'thermal expansion'],
  'Industrial Strainer': ['strainer', 'industrial strainer', 'y-strainer', 'basket strainer'],
  'Chemicals & Compounds': ['sealant', 'adhesive', 'caulk', 'thread seal', 'pipe dope'],
};
