/**
 * NON-APPLIANCE DEPARTMENT PIPELINE
 * 
 * Isolated post-processing for all non-Appliances departments:
 * - Plumbing & Bath (shower, toilet, bathtub, vanity, faucet, sink, etc.)
 * - Lighting
 * - Furniture
 * - Home Décor
 * 
 * This pipeline receives the base finalSeoTitleInput (already constructed by the
 * main service) and applies non-appliance-specific modifications:
 * - Shower reclassification chain (steam, tub faucet, rough-in valve, accessories, showerheads)
 * - Bathtub dimension override from Ferguson specs
 * - Vanity dimension override from Ferguson specs
 * - Medicine cabinet lighted detection
 * - Toilet → Toilet Seat reclassification
 * - Toilet/Toilet Seat slot correction (bowl shape, flush type, construction type)
 * - Bathroom hardware category corrections
 * - Tub Faucet type/mount splitting
 * 
 * IMPORTANT: Changes to appliance post-processing (refrigerator depth, fuel type, features)
 * do NOT affect this file. That's the whole point of the separation.
 */

import logger from '../../utils/logger';
import { PipelineContext, PipelineResult, defaultApplianceFeatures } from './shared-pipeline-types';

// ── Text extraction helpers (self-contained for pipeline isolation) ────────

function extractKnownValueFromTexts(texts: string[], knownValues: string[]): string {
  const sorted = [...knownValues].sort((a, b) => b.length - a.length);
  for (const text of texts) {
    if (!text) continue;
    const lower = text.toLowerCase();
    for (const val of sorted) {
      if (lower.includes(val.toLowerCase())) {
        return val;
      }
    }
  }
  return '';
}

function extractBowlShapeFromTexts(texts: string[]): string {
  return extractKnownValueFromTexts(texts, ['Elongated', 'Round-Front', 'Round Front', 'Round']);
}

function extractFlushTypeFromTexts(texts: string[]): string {
  return extractKnownValueFromTexts(texts, [
    'Dual Flush', 'Dual-Flush', 'Single Flush', 'Pressure-Assisted',
    'Pressure Assisted', 'Gravity',
  ]);
}

function extractToiletSeatTypeFromTexts(texts: string[]): string {
  return extractKnownValueFromTexts(texts, [
    'Soft Close', 'Soft-Close', 'Slow Close', 'Slow-Close', 'SoftClose',
    'Heated', 'Bidet', 'Quick Release',
  ]);
}

/**
 * Apply non-appliance-specific post-processing pipeline.
 * 
 * Receives the base finalSeoTitleInput, applies all non-appliance reclassification
 * and dimension overrides, returns the modified input + default appliance features.
 */
export function applyNonAppliancePipeline(ctx: PipelineContext): PipelineResult {
  const {
    finalSeoTitleInput,
    sanitizedPrimaryAttributes,
    rawProduct,
    sessionId,
    fergusonProductName,
  } = ctx;

  // ── SHARED SOURCE TEXTS ─────────────────────────────────────────────────────
  const showerSourceTexts = [
    fergusonProductName,
    (rawProduct.Ferguson_Title as string) || '',
    (rawProduct.Product_Title_Web_Retailer as string) || '',
    ((rawProduct as any).Ferguson_Description as string) || '',
    (rawProduct.Product_Title_Legacy as string) || '',
  ].join(' ');
  const showerSourceLower = showerSourceTexts.toLowerCase();

  // ═══════════════════════════════════════════════════════════════════════════
  // SHOWER TITLE POST-PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. SHOWERHEADS & ACCESSORIES — separate Function value from Type value.
  const SHOWER_FUNCTION_VALUES = ['Thermostatic', 'Pressure Balance', 'Pressure-Balance',
    'Pressure Balanced', 'Diverter', 'Volume Control', 'Transfer'];
  if (finalSeoTitleInput.category === 'Showerheads & Accessories' &&
      SHOWER_FUNCTION_VALUES.some(fn => finalSeoTitleInput.type === fn ||
        finalSeoTitleInput.type?.toLowerCase() === fn.toLowerCase())) {
    const detectedFunction = finalSeoTitleInput.type || '';
    const fNameLower = fergusonProductName.toLowerCase();
    let structuralType = 'Trim Kit';
    if (/complete system|shower system|shower only trim package/i.test(fNameLower)) {
      structuralType = 'Complete System';
    } else if (/rough.in valve|rough in valve|\bvalve only\b/i.test(fNameLower)) {
      structuralType = 'Valve';
    }
    finalSeoTitleInput.type = structuralType;
    finalSeoTitleInput.function = detectedFunction;
    logger.info('Showerheads & Accessories: moved function value from type slot to function slot', {
      sessionId, detectedFunction, structuralType, fergusonName: fergusonProductName.substring(0, 70)
    });
  }

  // 1b. SHOWERHEADS & ACCESSORIES → ROUGH-IN VALVE reclassification
  if (finalSeoTitleInput.category === 'Showerheads & Accessories' &&
      (/\brough[\s-]?in\s+valve\b/i.test(showerSourceLower) ||
       /\bmixing\s+rough[\s-]?in\b/i.test(showerSourceLower) ||
       /\buniversal\s+mixing\s+rough/i.test(showerSourceLower)) &&
      !/\btrim\b/i.test(showerSourceLower)) {
    finalSeoTitleInput.category = 'Rough-In Valve';
    sanitizedPrimaryAttributes.AI_Product_Category = 'Rough-In Valve';
    if (/\bthermostatic\b/i.test(showerSourceLower)) {
      finalSeoTitleInput.type = 'Thermostatic';
    } else if (/\bpressure\s+balanc/i.test(showerSourceLower)) {
      finalSeoTitleInput.type = 'Pressure Balance';
    } else if (/\bdiverter\b/i.test(showerSourceLower)) {
      finalSeoTitleInput.type = 'Diverter';
    } else {
      finalSeoTitleInput.type = 'Thermostatic';
    }
    logger.warn('🚿 CATEGORY RECLASSIFICATION: "Showerheads & Accessories" → "Rough-In Valve"', {
      sessionId, type: finalSeoTitleInput.type,
      reason: 'Source data describes a rough-in valve body, not a showerhead/hand shower'
    });
  }

  // 1c. SHOWER ACCESSORY reclassification
  if (finalSeoTitleInput.category === 'Shower' || finalSeoTitleInput.category === 'Showerheads & Accessories') {
    const fNameLower = fergusonProductName.toLowerCase();
    const isMultiComponentProduct =
      /\bshower\s+system\b/i.test(fNameLower) ||
      /\bexposed\s+(?:thermostatic\s+)?shower\b/i.test(fNameLower) ||
      /\btrim\s+package\b/i.test(fNameLower) ||
      /\bhand\s*shower\s+(?:package|kit|set)\b/i.test(fNameLower) ||
      /\bhandshower\s+(?:set|kit)\b/i.test(fNameLower) ||
      /\b(?:includes|with)\s+hand\s*shower\b/i.test(fNameLower) ||
      /\bslide\s*bar\s*(?:and|&|,|with)\s+/i.test(fNameLower) && /\bhand\s*shower\b/i.test(fNameLower) ||
      /\bhand\s*shower.*\bslide\s*bar\b/i.test(fNameLower) ||
      /\bslide\s*bar.*\bhand\s*shower\b/i.test(fNameLower) ||
      /\b(?:includes|with)\s+(?:shower\s+)?(?:arm|hose|slide\s*bar)\b/i.test(fNameLower);

    let accessoryType = '';
    if (!isMultiComponentProduct) {
      if (/\bceiling[\s-]*(?:mounted\s+)?(?:shower\s+)?arm\b/i.test(fNameLower) ||
          /\bceiling\s+shower\s+arm\b/i.test(fNameLower)) {
        accessoryType = 'Ceiling Shower Arm';
      } else if (/\bwall[\s-]*(?:mounted\s+)?(?:shower\s+)?arm\b/i.test(fNameLower)) {
        accessoryType = 'Wall Shower Arm';
      } else if (/\bshower\s*arm\b/i.test(fNameLower)) {
        accessoryType = 'Shower Arm';
      } else if (/\blinear\s*drain\b/i.test(fNameLower) || /\bshower\s*drain\b/i.test(fNameLower) ||
                 /\btrench\s*drain\b/i.test(fNameLower)) {
        accessoryType = 'Trench Drain';
      } else if (/\bshower\s+door\s+handle\b/i.test(fNameLower) || /\bdoor\s+handle\b/i.test(fNameLower)) {
        accessoryType = 'Shower Door';
      } else if (/\bslide\s*bar\b/i.test(fNameLower) && !/\bhand\s*shower\b/i.test(fNameLower)) {
        accessoryType = 'Shower Rod';
      } else if (/\btransfer\s+(?:valve\s+)?handle\b/i.test(fNameLower) || /\bshower\s+transfer\s+handle\b/i.test(fNameLower)) {
        accessoryType = 'Handle';
      } else if (/\bhand\s*shower\s+(?:holder|outlet|bracket)\b/i.test(fNameLower) ||
                 (/\bhandshower\s+outlet\b/i.test(fNameLower) && /\bvolume\s+control\b/i.test(fNameLower))) {
        accessoryType = 'Hand Shower Holder';
      } else if (/\bvalve\s+extension\s+kit\b/i.test(fNameLower) || /\bextension\s+kit\b.*\bvalve\b/i.test(fNameLower)) {
        accessoryType = 'Valve Extension Kit';
      }
    }

    if (accessoryType) {
      const oldCategory = finalSeoTitleInput.category;
      finalSeoTitleInput.category = 'Shower Accessory';
      sanitizedPrimaryAttributes.AI_Product_Category = 'Shower Accessory';
      finalSeoTitleInput.type = accessoryType;
      sanitizedPrimaryAttributes.AI_Type = accessoryType;
      logger.warn(`🚿 CATEGORY RECLASSIFICATION: "${oldCategory}" → "Shower Accessory"`, {
        sessionId, type: accessoryType,
        reason: 'Source data describes a shower accessory component',
        fergusonName: fergusonProductName.substring(0, 80)
      });
    }
  }

  // 1d. SHOWERHEADS & ACCESSORIES TYPE REFINEMENT
  if (finalSeoTitleInput.category === 'Showerheads & Accessories') {
    const fNameLower = fergusonProductName.toLowerCase();
    const currentType = (finalSeoTitleInput.type || '').toLowerCase();

    if (currentType === 'showerhead' && (/\brain\b/i.test(fNameLower) || /\brain\s+shower\b/i.test(showerSourceLower))) {
      finalSeoTitleInput.type = 'Rain Head';
      sanitizedPrimaryAttributes.AI_Type = 'Rain Head';
      logger.info('🚿 Showerheads & Accessories: refined Showerhead → Rain Head from Ferguson data', { sessionId });
    } else if (currentType === 'showerhead' && (/\bhand\s*shower\b/i.test(fNameLower) || /\bhandshower\b/i.test(fNameLower))) {
      finalSeoTitleInput.type = 'Handheld';
      sanitizedPrimaryAttributes.AI_Type = 'Handheld';
      logger.info('🚿 Showerheads & Accessories: refined Showerhead → Handheld from Ferguson data', { sessionId });
    } else if (currentType === 'thermostatic' && /\bvalve\s+trim\b/i.test(fNameLower)) {
      finalSeoTitleInput.type = 'Thermostatic Valve Trim';
      sanitizedPrimaryAttributes.AI_Type = 'Thermostatic Valve Trim';
      logger.info('🚿 Showerheads & Accessories: refined Thermostatic → Thermostatic Valve Trim', { sessionId });
    } else if (!currentType || currentType === 'not found' || currentType === 'n/a') {
      let derivedShowerType = '';
      if (/\brain[\s-]*(fall\s+)?shower\s*head\b/i.test(fNameLower) || /\brain[\s-]*head\b/i.test(fNameLower) || /\brain\s+shower\b/i.test(fNameLower)) {
        derivedShowerType = 'Rain Head';
      } else if (/\bhand\s*shower\b/i.test(fNameLower) || /\bhandshower\b/i.test(fNameLower)) {
        derivedShowerType = 'Handheld';
      } else if (/\bbody\s*spray\b/i.test(fNameLower)) {
        derivedShowerType = 'Body Spray';
      } else if (/\bshower\s*head\b/i.test(fNameLower) || /\bshowerhead\b/i.test(fNameLower)) {
        derivedShowerType = 'Showerhead';
      } else {
        derivedShowerType = 'Showerhead';
      }
      finalSeoTitleInput.type = derivedShowerType;
      sanitizedPrimaryAttributes.AI_Type = derivedShowerType;
      logger.info('🚿 Showerheads & Accessories: derived missing Type from Ferguson data', {
        sessionId, derivedType: derivedShowerType, fergusonName: fergusonProductName.substring(0, 80)
      });
    }
  }

  // ── SHOWER RECLASSIFICATION CHAIN ──────────────────────────────────────────
  if (finalSeoTitleInput.category === 'Shower') {
    // 2a. STEAM SHOWER reclassification
    const isSteam = /\bsteam\s*(shower\s+)?generator\b/i.test(showerSourceLower) ||
      /\bsteam\s+shower\b/i.test(showerSourceLower) ||
      (/\bsteam\b/i.test(showerSourceLower) && /\b\d+\s*kw\b/i.test(showerSourceLower));
    if (isSteam) {
      finalSeoTitleInput.category = 'Steam Shower';
      sanitizedPrimaryAttributes.AI_Product_Category = 'Steam Shower';
      if (/\bgenerator\b/i.test(showerSourceLower)) {
        finalSeoTitleInput.type = 'Steam Generator';
      } else if (/\bcontrol/i.test(showerSourceLower)) {
        finalSeoTitleInput.type = 'Control Panel';
      } else if (/\bsteam\s+head\b/i.test(showerSourceLower)) {
        finalSeoTitleInput.type = 'Steam Head';
      } else {
        finalSeoTitleInput.type = 'Complete System';
      }
      const kwMatch = showerSourceTexts.match(/(\d+)\s*kW/i);
      if (kwMatch) { finalSeoTitleInput.powerKw = kwMatch[1]; }
      logger.warn('🚿 CATEGORY RECLASSIFICATION: "Shower" → "Steam Shower"', {
        sessionId, type: finalSeoTitleInput.type, powerKw: finalSeoTitleInput.powerKw || 'none',
        reason: 'Source data describes a steam shower product'
      });
    }

    // 2b. TUB FILLER reclassification
    else if (/\btub\s+filler\b/i.test(showerSourceLower) ||
             /\btub\s+faucet\b/i.test(showerSourceLower) ||
             /\bfloor\s+mounted\s+tub\b/i.test(showerSourceLower) ||
             /\bwall\s+mounted\s+tub\b/i.test(showerSourceLower) ||
             /\bdeck\s+mounted\s+tub\b/i.test(showerSourceLower)) {
      finalSeoTitleInput.category = 'Tub Filler';
      sanitizedPrimaryAttributes.AI_Product_Category = 'Tub Filler';
      // Derive type from source data instead of defaulting to "Tub Filler"
      if (/\bfloor\s+mounted\b/i.test(showerSourceLower)) {
        finalSeoTitleInput.type = 'Floor Mounted';
        finalSeoTitleInput.style = 'Floor Mounted';
      } else if (/\bwall\s+mounted\b/i.test(showerSourceLower)) {
        finalSeoTitleInput.type = 'Wall Mounted';
        finalSeoTitleInput.style = 'Wall Mounted';
      } else if (/\bdeck\s+mounted\b/i.test(showerSourceLower)) {
        finalSeoTitleInput.type = 'Deck Mount';
      } else if (/\bfreestanding\b/i.test(showerSourceLower)) {
        finalSeoTitleInput.type = 'Freestanding';
        finalSeoTitleInput.style = 'Floor Mounted';
      }
      logger.warn('🚿 CATEGORY RECLASSIFICATION: "Shower" → "Tub Filler"', {
        sessionId, type: finalSeoTitleInput.type,
        reason: 'Source data describes a tub filler/faucet'
      });
    }

    // 2c. ROUGH-IN VALVE reclassification
    else if ((/\brough[\s-]?in\s+valve\b/i.test(showerSourceLower) ||
              /\bmixing\s+(?:rough[\s-]?in\s+)?valve\b/i.test(showerSourceLower)) &&
             !/\btrim\b/i.test(showerSourceLower)) {
      finalSeoTitleInput.category = 'Rough-In Valve';
      sanitizedPrimaryAttributes.AI_Product_Category = 'Rough-In Valve';
      if (/\bthermostatic\b/i.test(showerSourceLower)) {
        finalSeoTitleInput.type = 'Thermostatic';
      } else if (/\btub\b/i.test(showerSourceLower)) {
        finalSeoTitleInput.type = 'Tub/Shower';
      } else {
        finalSeoTitleInput.type = 'Shower';
      }
      const connMatch = showerSourceTexts.match(/(\d\/\d)["″'']\s*/);
      if (connMatch) { finalSeoTitleInput.connectionSize = connMatch[1] + '"'; }
      logger.warn('🚿 CATEGORY RECLASSIFICATION: "Shower" → "Rough-In Valve"', {
        sessionId, type: finalSeoTitleInput.type,
        reason: 'Source data describes a rough-in valve'
      });
    }

    // 2d. SHOWER COMPONENT TYPE DERIVATION
    else {
      const typeLower = (finalSeoTitleInput.type || '').toLowerCase();
      const needsTypeDerivation = typeLower === 'walk-in' || typeLower === 'accessory' ||
        typeLower === '' || typeLower === 'frameless' || typeLower === 'framed';

      if (needsTypeDerivation) {
        const fNameLower = fergusonProductName.toLowerCase();
        let derivedType = '';

        if (/\bshower\s+door\s+handle\b/i.test(fNameLower) || /\bdoor\s+(?:handle|knob)\b/i.test(fNameLower)) {
          finalSeoTitleInput.category = 'Shower Accessory';
          sanitizedPrimaryAttributes.AI_Product_Category = 'Shower Accessory';
          derivedType = 'Shower Door';
        } else if (/\bshower\s+door\b/i.test(fNameLower) || /\bshower\s+enclosure\b/i.test(fNameLower)) {
          if (typeLower === 'frameless' || /\bframeless\b/i.test(fNameLower)) derivedType = 'Frameless';
          else if (typeLower === 'framed' || /\bframed\b/i.test(fNameLower)) derivedType = 'Framed';
          else if (/\bneo[\s-]?angle\b/i.test(fNameLower)) derivedType = 'Neo-Angle';
          else derivedType = 'Shower Door';
        } else if (/\bshower\s+base\b/i.test(fNameLower) || /\bshower\s+pan\b/i.test(fNameLower) ||
                   /\bshower\s+receptor\b/i.test(fNameLower)) {
          derivedType = 'Alcove';
        } else if (/\bshower\s+system\b/i.test(fNameLower) || /\bexposed\s+(?:thermostatic\s+)?shower\b/i.test(fNameLower)) {
          derivedType = 'Shower System';
        } else if (/\bshower\s+panel\b/i.test(fNameLower) || /\bjet\s+(?:shower|retrofit)\b/i.test(fNameLower)) {
          derivedType = 'Shower Panel';
        } else if (/\bshower\s+column\b/i.test(fNameLower)) {
          derivedType = 'Shower Column';
        } else if (/\blinear\s*drain\b/i.test(fNameLower) || /\bshower\s*drain\b/i.test(fNameLower)) {
          finalSeoTitleInput.category = 'Shower Accessory';
          sanitizedPrimaryAttributes.AI_Product_Category = 'Shower Accessory';
          derivedType = 'Trench Drain';
        } else if (/\brain[\s-]*(fall\s+)?shower\s*head\b/i.test(fNameLower) || /\brain[\s-]*head\b/i.test(fNameLower) ||
                   (/\brainfall\b/i.test(fNameLower) && /\bhead\b/i.test(fNameLower)) ||
                   /\brain\s+shower\b/i.test(fNameLower)) {
          finalSeoTitleInput.category = 'Showerheads & Accessories';
          sanitizedPrimaryAttributes.AI_Product_Category = 'Showerheads & Accessories';
          derivedType = 'Rain Head';
        } else if (/\bbody\s*spray\b/i.test(fNameLower) || /\bbodyspray\b/i.test(fNameLower)) {
          finalSeoTitleInput.category = 'Showerheads & Accessories';
          sanitizedPrimaryAttributes.AI_Product_Category = 'Showerheads & Accessories';
          derivedType = 'Body Spray';
        } else if (/\bhand\s*shower\b/i.test(fNameLower) || /\bhandshower\b/i.test(fNameLower)) {
          finalSeoTitleInput.category = 'Showerheads & Accessories';
          sanitizedPrimaryAttributes.AI_Product_Category = 'Showerheads & Accessories';
          derivedType = 'Handheld';
        } else if (/\bslide\s*bar\b/i.test(fNameLower)) {
          finalSeoTitleInput.category = 'Shower Accessory';
          sanitizedPrimaryAttributes.AI_Product_Category = 'Shower Accessory';
          derivedType = 'Shower Rod';
        } else if (/\bceiling[\s-]*(?:mounted\s+)?(?:shower\s+)?arm\b/i.test(fNameLower) ||
                   /\bceiling\s+shower\s+arm\b/i.test(fNameLower)) {
          finalSeoTitleInput.category = 'Shower Accessory';
          sanitizedPrimaryAttributes.AI_Product_Category = 'Shower Accessory';
          derivedType = 'Ceiling Shower Arm';
        } else if (/\bwall[\s-]*(?:mounted\s+)?(?:shower\s+)?arm\b/i.test(fNameLower)) {
          finalSeoTitleInput.category = 'Shower Accessory';
          sanitizedPrimaryAttributes.AI_Product_Category = 'Shower Accessory';
          derivedType = 'Wall Shower Arm';
        } else if (/\bshower\s*arm\b/i.test(fNameLower)) {
          finalSeoTitleInput.category = 'Shower Accessory';
          sanitizedPrimaryAttributes.AI_Product_Category = 'Shower Accessory';
          derivedType = 'Shower Arm';
        } else if (/\bshower\s*head\b/i.test(fNameLower) || /\bshowerhead\b/i.test(fNameLower)) {
          finalSeoTitleInput.category = 'Showerheads & Accessories';
          sanitizedPrimaryAttributes.AI_Product_Category = 'Showerheads & Accessories';
          derivedType = 'Showerhead';
        } else if (/\bslide\s*bar\b/i.test(showerSourceLower) && /\bkit\b/i.test(showerSourceLower) &&
                   !/\bhand\s*shower\b/i.test(fNameLower) && !/\bhandshower\b/i.test(fNameLower) &&
                   !/\bshower\s+system\b/i.test(fNameLower)) {
          finalSeoTitleInput.category = 'Shower Accessory';
          sanitizedPrimaryAttributes.AI_Product_Category = 'Shower Accessory';
          derivedType = 'Shower Rod';
        } else {
          // Fallback: broader source text analysis
          const isMultiComp2d = /\bshower\s+system\b/i.test(fNameLower) ||
            /\bexposed\s+(?:thermostatic\s+)?shower\b/i.test(fNameLower) ||
            /\btrim\s+package\b/i.test(fNameLower) ||
            /\bhand\s*shower\b/i.test(fNameLower) || /\bhandshower\b/i.test(fNameLower);

          if (!isMultiComp2d && (/\bshower\s*arm\b/i.test(showerSourceLower) || /\bceiling\s*(mounted\s+)?arm\b/i.test(showerSourceLower))) {
            finalSeoTitleInput.category = 'Shower Accessory';
            sanitizedPrimaryAttributes.AI_Product_Category = 'Shower Accessory';
            if (/\bceiling/i.test(showerSourceLower)) derivedType = 'Ceiling Shower Arm';
            else if (/\bwall/i.test(showerSourceLower)) derivedType = 'Wall Shower Arm';
            else derivedType = 'Shower Arm';
          } else if (/\bhand\s*shower\b/i.test(showerSourceLower) || /\bhandshower\b/i.test(showerSourceLower)) {
            finalSeoTitleInput.category = 'Showerheads & Accessories';
            sanitizedPrimaryAttributes.AI_Product_Category = 'Showerheads & Accessories';
            derivedType = 'Handheld';
          } else if (/\bshower\s*head\b/i.test(showerSourceLower) || /\bshowerhead\b/i.test(showerSourceLower)) {
            finalSeoTitleInput.category = 'Showerheads & Accessories';
            sanitizedPrimaryAttributes.AI_Product_Category = 'Showerheads & Accessories';
            derivedType = 'Showerhead';
          } else if (/\brain\b/i.test(showerSourceLower) && /\bhead\b/i.test(showerSourceLower)) {
            finalSeoTitleInput.category = 'Showerheads & Accessories';
            sanitizedPrimaryAttributes.AI_Product_Category = 'Showerheads & Accessories';
            derivedType = 'Rain Head';
          } else if (/\blinear\s*drain\b/i.test(showerSourceLower)) {
            finalSeoTitleInput.category = 'Shower Accessory';
            sanitizedPrimaryAttributes.AI_Product_Category = 'Shower Accessory';
            derivedType = 'Trench Drain';
          } else if (!isMultiComp2d && /\bslide\s*bar\b/i.test(showerSourceLower)) {
            finalSeoTitleInput.category = 'Shower Accessory';
            sanitizedPrimaryAttributes.AI_Product_Category = 'Shower Accessory';
            derivedType = 'Shower Rod';
          } else if (/\bshower\s+system\b/i.test(showerSourceLower)) {
            derivedType = 'Shower System';
          }
        }

        if (derivedType) {
          finalSeoTitleInput.type = derivedType;
          sanitizedPrimaryAttributes.AI_Type = derivedType;
          logger.info('🚿 Shower: derived component type from source data', {
            sessionId, derivedType, fergusonName: fergusonProductName.substring(0, 80)
          });
        } else {
          finalSeoTitleInput.type = 'Accessory';
          sanitizedPrimaryAttributes.AI_Type = 'Accessory';
          logger.info('🚿 Shower: no component type derived, set to Accessory for fallback', { sessionId });
        }
      }

      // 2e. SHOWER DIMENSION EXTRACTION — ALWAYS OVERRIDE AI WIDTH
      {
        let fergusonDim: number | null = null;
        let fergusonDimSource = '';
        const dimRegex = /\b(\d+(?:\.\d+)?)\s*(?:["″'']\s*|[- ]?(?:inch|in\.?\b))/gi;
        let match: RegExpExecArray | null;
        let bestDim = 0;
        let bestMatch = '';
        while ((match = dimRegex.exec(fergusonProductName)) !== null) {
          const dim = parseFloat(match[1]);
          if (dim >= 3 && dim <= 60 && dim > bestDim) { bestDim = dim; bestMatch = match[0].trim(); }
        }
        if (bestDim > 0) { fergusonDim = bestDim; fergusonDimSource = `Ferguson product name: "${bestMatch}"`; }

        if (!fergusonDim) {
          const frdSpecs = (rawProduct as any).Ferguson_Raw_Data?.product?.specifications;
          const extensionVal = frdSpecs?.extension?.value;
          if (extensionVal) {
            const ext = parseFloat(String(extensionVal));
            if (ext >= 3 && ext <= 60) { fergusonDim = ext; fergusonDimSource = `Ferguson Extension attribute: ${extensionVal}`; }
          }
        }

        if (!fergusonDim) {
          const srcDimRegex = /\b(\d+(?:\.\d+)?)\s*(?:["″'']\s*|[- ]?(?:inch|in\.?\b))/gi;
          let srcMatch: RegExpExecArray | null;
          let srcBestDim = 0;
          let srcBestMatch = '';
          while ((srcMatch = srcDimRegex.exec(showerSourceTexts)) !== null) {
            const dim = parseFloat(srcMatch[1]);
            if (dim >= 3 && dim <= 60 && dim > srcBestDim) { srcBestDim = dim; srcBestMatch = srcMatch[0].trim(); }
          }
          if (srcBestDim > 0) { fergusonDim = srcBestDim; fergusonDimSource = `source texts: "${srcBestMatch}"`; }
        }

        if (fergusonDim) {
          const oldWidth = finalSeoTitleInput.width || '(empty)';
          finalSeoTitleInput.width = String(fergusonDim);
          sanitizedPrimaryAttributes.AI_Width = String(fergusonDim);
          if (oldWidth !== String(fergusonDim)) {
            logger.info('🚿 Shower: overriding width with Ferguson dimension', {
              sessionId, oldWidth, newWidth: fergusonDim, source: fergusonDimSource
            });
          }
        }
      }

      // 2f. SHOWER GPM EXTRACTION
      const gpmTypes = ['showerhead', 'shower head', 'rain head', 'handheld', 'hand shower', 'body spray', 'shower system', 'shower panel'];
      if (gpmTypes.includes((finalSeoTitleInput.type || '').toLowerCase()) &&
          (!finalSeoTitleInput.gpm || finalSeoTitleInput.gpm === '' || finalSeoTitleInput.gpm === '0')) {
        const gpmMatch = showerSourceTexts.match(/(\d+(?:\.\d+)?)\s*GPM/i);
        if (gpmMatch) {
          finalSeoTitleInput.gpm = gpmMatch[1];
          logger.info('🚿 Shower: extracted GPM from source data', { sessionId, gpm: gpmMatch[1] });
        }
      }
    }
  }

  // 2g. STEAM SHOWER POST-PROCESSING (for items already correctly categorized)
  if (finalSeoTitleInput.category === 'Steam Shower') {
    if (!finalSeoTitleInput.powerKw || finalSeoTitleInput.powerKw === '' || finalSeoTitleInput.powerKw === '0') {
      const kwMatch = showerSourceTexts.match(/(\d+)\s*kW/i);
      if (kwMatch) { finalSeoTitleInput.powerKw = kwMatch[1]; }
    }
    const steamTypeLower = (finalSeoTitleInput.type || '').toLowerCase();
    if (steamTypeLower === 'walk-in' || steamTypeLower === '' || steamTypeLower === 'accessory' || steamTypeLower === 'controller') {
      if (/\bgenerator\b/i.test(showerSourceLower)) finalSeoTitleInput.type = 'Steam Generator';
      else if (/\bcontrol/i.test(showerSourceLower)) finalSeoTitleInput.type = 'Control Panel';
      else if (/\bsteam\s+head\b/i.test(showerSourceLower)) finalSeoTitleInput.type = 'Steam Head';
      else finalSeoTitleInput.type = 'Complete System';
      logger.info('🚿 Steam Shower: derived type from source data', { sessionId, type: finalSeoTitleInput.type });
    }
  }

  // 2h. SHOWER ACCESSORY DIMENSION + GPM EXTRACTION
  if (finalSeoTitleInput.category === 'Shower Accessory') {
    let accessoryDim: number | null = null;
    const dimMatch = fergusonProductName.match(/\b(\d+(?:\.\d+)?)\s*(?:["″'']\s*|[- ]?(?:inch|in\.?\b))/i);
    if (dimMatch) {
      const dim = parseFloat(dimMatch[1]);
      if (dim >= 1 && dim <= 60) accessoryDim = dim;
    }
    if (!accessoryDim) {
      const srcMatch = showerSourceTexts.match(/\b(\d+(?:\.\d+)?)\s*(?:["″'']\s*|[- ]?(?:inch|in\.?\b))/i);
      if (srcMatch) {
        const dim = parseFloat(srcMatch[1]);
        if (dim >= 1 && dim <= 60) accessoryDim = dim;
      }
    }
    if (accessoryDim) {
      finalSeoTitleInput.width = String(accessoryDim);
      sanitizedPrimaryAttributes.AI_Width = String(accessoryDim);
    }
    const accessoryGpmTypes = ['handheld', 'shower rod', 'accessory'];
    if (accessoryGpmTypes.includes((finalSeoTitleInput.type || '').toLowerCase()) &&
        (!finalSeoTitleInput.gpm || finalSeoTitleInput.gpm === '' || finalSeoTitleInput.gpm === '0')) {
      const gpmMatch = showerSourceTexts.match(/(\d+(?:\.\d+)?)\s*GPM/i);
      if (gpmMatch) finalSeoTitleInput.gpm = gpmMatch[1];
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATHTUB DIMENSION OVERRIDE
  // ═══════════════════════════════════════════════════════════════════════════
  if (finalSeoTitleInput.category === 'Bathtub') {
    const frd = (rawProduct as any).Ferguson_Raw_Data;
    const fergusonSpecs = frd?.product?.specifications;
    let bathtubLength: number | null = null;
    let bathtubLengthSource = '';

    if (fergusonSpecs) {
      const nomLen = fergusonSpecs.nominal_length?.value || fergusonSpecs.tub_length?.value;
      if (nomLen) {
        const nomStr = String(nomLen).trim();
        const fracMatch = nomStr.match(/^(\d+)-(\d+)\/(\d+)$/);
        const numMatch = nomStr.match(/^(\d+(?:\.\d+)?)$/);
        let val: number | null = null;
        if (fracMatch) val = parseInt(fracMatch[1]) + parseInt(fracMatch[2]) / parseInt(fracMatch[3]);
        else if (numMatch) val = parseFloat(numMatch[1]);
        if (val !== null && val >= 30 && val <= 84) {
          bathtubLength = Math.round(val);
          bathtubLengthSource = `Ferguson spec nominal_length: ${nomLen}`;
        }
      }
    }

    if (!bathtubLength) {
      const dimMatch = fergusonProductName.match(/(\d+)(?:-(\d+)\/(\d+))?\s*"/);
      if (dimMatch) {
        const whole = parseInt(dimMatch[1]);
        const fracNum = dimMatch[2] ? parseInt(dimMatch[2]) : 0;
        const fracDen = dimMatch[3] ? parseInt(dimMatch[3]) : 1;
        const val = whole + fracNum / fracDen;
        if (val >= 30 && val <= 84) {
          bathtubLength = Math.round(val);
          bathtubLengthSource = `Ferguson product name: "${dimMatch[0].trim()}"`;
        }
      }
    }

    if (bathtubLength) {
      const oldLength = finalSeoTitleInput.length || '(empty)';
      finalSeoTitleInput.length = String(bathtubLength);
      sanitizedPrimaryAttributes.AI_Depth = String(bathtubLength);
      if (oldLength !== String(bathtubLength)) {
        logger.info('🛁 Bathtub: overriding length with Ferguson dimension', {
          sessionId, oldLength, newLength: bathtubLength, source: bathtubLengthSource
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VANITY DIMENSION OVERRIDE
  // ═══════════════════════════════════════════════════════════════════════════
  if (finalSeoTitleInput.category === 'Bathroom Vanity') {
    const frd = (rawProduct as any).Ferguson_Raw_Data;
    const fergusonSpecs = frd?.product?.specifications;
    let vanityWidth: number | null = null;
    let vanityWidthSource = '';

    if (fergusonSpecs) {
      const nomWidth = fergusonSpecs.nominal_width?.value || fergusonSpecs.vanity_width?.value
        || fergusonSpecs.cabinet_width?.value;
      if (nomWidth) {
        const nomStr = String(nomWidth).trim();
        const fracMatch = nomStr.match(/^(\d+)-(\d+)\/(\d+)$/);
        const numMatch = nomStr.match(/^(\d+(?:\.\d+)?)$/);
        let val: number | null = null;
        if (fracMatch) val = parseInt(fracMatch[1]) + parseInt(fracMatch[2]) / parseInt(fracMatch[3]);
        else if (numMatch) val = parseFloat(numMatch[1]);
        if (val !== null && val >= 12 && val <= 96) {
          vanityWidth = Math.round(val);
          vanityWidthSource = `Ferguson spec nominal_width: ${nomWidth}`;
        }
      }
    }

    if (!vanityWidth) {
      const dimMatch = fergusonProductName.match(/(\d+)(?:-(\d+)\/(\d+))?\s*"/);
      if (dimMatch) {
        const whole = parseInt(dimMatch[1]);
        const fracNum = dimMatch[2] ? parseInt(dimMatch[2]) : 0;
        const fracDen = dimMatch[3] ? parseInt(dimMatch[3]) : 1;
        const val = whole + fracNum / fracDen;
        if (val >= 12 && val <= 96) {
          vanityWidth = Math.round(val);
          vanityWidthSource = `Ferguson product name: "${dimMatch[0].trim()}"`;
        }
      }
    }

    if (vanityWidth) {
      const oldWidth = finalSeoTitleInput.width || '(empty)';
      finalSeoTitleInput.width = String(vanityWidth);
      sanitizedPrimaryAttributes.AI_Width = String(vanityWidth);
      if (oldWidth !== String(vanityWidth)) {
        logger.info('🪞 Vanity: overriding width with Ferguson dimension', {
          sessionId, oldWidth, newWidth: vanityWidth, source: vanityWidthSource
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDICINE CABINET TITLE POST-PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════
  if (finalSeoTitleInput.category === 'Medicine Cabinet') {
    const rawInstall = (finalSeoTitleInput.installationType || '').trim();
    if (rawInstall) {
      const primaryInstall = rawInstall.split(/[,;]/)[0].trim();
      finalSeoTitleInput.installationType = primaryInstall.toLowerCase() === 'surface'
        ? 'Surface Mount' : primaryInstall;
    }

    const lightedSources = [
      (rawProduct as any).Product_Title_Legacy || '',
      (rawProduct as any).Product_Title_Web_Retailer || '',
      (rawProduct as any).Ferguson_Raw_Data?.product?.name || '',
      (rawProduct as any).Ferguson_Title || '',
    ].join(' ').toLowerCase();
    const hasLighted = /\b(lighted|interior light|led light|nightlight|light.*defogger|illuminat)/i.test(lightedSources);
    if (hasLighted) {
      const currentType = (finalSeoTitleInput.type || '').trim();
      if (currentType && !currentType.toLowerCase().includes('lighted')) {
        finalSeoTitleInput.type = `Lighted ${currentType}`;
      } else if (!currentType) {
        finalSeoTitleInput.type = 'Lighted';
      }
      logger.info('Medicine Cabinet: detected lighted features, updated type for title', {
        sessionId, type: finalSeoTitleInput.type, installationType: finalSeoTitleInput.installationType
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOILET → TOILET SEAT RECLASSIFICATION
  // ═══════════════════════════════════════════════════════════════════════════
  const TOILET_BOWL_SHAPES = ['elongated', 'round', 'round-front', 'round front'];
  const TOILET_FLUSH_TYPES = ['dual flush', 'dual-flush', 'single flush', 'pressure-assisted', 'pressure assisted', 'gravity'];

  if (finalSeoTitleInput.category === 'Toilet' &&
      (finalSeoTitleInput.type || '').toLowerCase() === 'accessory') {
    const toiletSourceTexts = [
      fergusonProductName,
      (rawProduct.Ferguson_Title as string) || '',
      (rawProduct.Product_Title_Web_Retailer as string) || '',
      ((rawProduct as any).Ferguson_Description as string) || '',
    ].join(' ').toLowerCase();

    const hasDispenserKeyword = /\bdispenser\b/i.test(toiletSourceTexts);
    const isToiletSeat = !hasDispenserKeyword && (
      /\btoilet\s+seat\b/i.test(toiletSourceTexts) ||
      /\bseat\s+(?:cover|lid|only)\b/i.test(toiletSourceTexts) ||
      /\bclosed[- ]front\b/i.test(toiletSourceTexts) ||
      /\bsoft\s*close\b/i.test(toiletSourceTexts) ||
      /\bslow[- ]close\b/i.test(toiletSourceTexts)
    );

    if (isToiletSeat) {
      logger.warn('🚽 CATEGORY RECLASSIFICATION: "Toilet" (Accessory) → "Toilet Seat"', {
        sessionId, reason: 'Source data describes a toilet seat product, not a full toilet'
      });
      finalSeoTitleInput.category = 'Toilet Seat';
      finalSeoTitleInput.type = '';
      const extracted = extractBowlShapeFromTexts([
        fergusonProductName,
        (rawProduct.Ferguson_Title as string) || '',
        (rawProduct.Product_Title_Web_Retailer as string) || '',
        ((rawProduct as any).Ferguson_Description as string) || '',
      ]);
      if (extracted) finalSeoTitleInput.shape = extracted;
      sanitizedPrimaryAttributes.AI_Product_Category = 'Toilet Seat';
      sanitizedPrimaryAttributes.AI_Type = '';
    }
  }

  // TOILET SEAT → TOILET REVERSE CHECK (Dispenser Detection)
  if (finalSeoTitleInput.category === 'Toilet Seat') {
    const toiletSeatSourceTexts = [
      fergusonProductName,
      (rawProduct.Ferguson_Title as string) || '',
      (rawProduct.Product_Title_Web_Retailer as string) || '',
      ((rawProduct as any).Ferguson_Description as string) || '',
      (rawProduct.Product_Title_Legacy as string) || '',
    ].join(' ').toLowerCase();

    if (/\bdispenser\b/i.test(toiletSeatSourceTexts)) {
      logger.warn('🔧 CATEGORY REVERSE CORRECTION: "Toilet Seat" → "Toilet" (Dispenser detected)', { sessionId });
      finalSeoTitleInput.category = 'Toilet';
      finalSeoTitleInput.type = 'Accessory';
      sanitizedPrimaryAttributes.AI_Product_Category = 'Toilet';
      sanitizedPrimaryAttributes.AI_Type = 'Accessory';
    }
  }

  // BATHROOM HARDWARE CATEGORY CORRECTIONS
  if (finalSeoTitleInput.category === 'Bathroom Cabinet Hardware') {
    const hardwareSourceTexts = [
      fergusonProductName,
      (rawProduct.Ferguson_Title as string) || '',
      (rawProduct.Product_Title_Web_Retailer as string) || '',
      ((rawProduct as any).Ferguson_Description as string) || '',
      (rawProduct.Product_Title_Legacy as string) || '',
    ].join(' ').toLowerCase();

    if (/\btoilet\s+paper\s+holder\b/i.test(hardwareSourceTexts) ||
        /\btp\s+holder\b/i.test(hardwareSourceTexts)) {
      logger.warn('🔧 CATEGORY CORRECTION: "Bathroom Cabinet Hardware" → "Bathroom Hardware and Accessories"', { sessionId });
      finalSeoTitleInput.category = 'Bathroom Hardware and Accessories';
      sanitizedPrimaryAttributes.AI_Product_Category = 'Bathroom Hardware and Accessories';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOILET TITLE POST-PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════
  if (finalSeoTitleInput.category === 'Toilet') {
    const currentType = (finalSeoTitleInput.type || '').trim();
    const typeLower = currentType.toLowerCase();

    if (TOILET_BOWL_SHAPES.includes(typeLower)) {
      if (!finalSeoTitleInput.bowlShape) finalSeoTitleInput.bowlShape = currentType;
      finalSeoTitleInput.type = '';
      logger.info('Toilet: moved bowl shape from type slot to bowlShape', { sessionId, bowlShape: currentType });
    }

    if (TOILET_FLUSH_TYPES.includes(typeLower)) {
      if (!finalSeoTitleInput.flushType) finalSeoTitleInput.flushType = currentType;
      finalSeoTitleInput.type = '';
      logger.info('Toilet: moved flush type from type slot to flushType', { sessionId, flushType: currentType });
    }

    if (!finalSeoTitleInput.bowlShape) {
      const extracted = extractBowlShapeFromTexts([
        fergusonProductName, (rawProduct.Ferguson_Title as string) || '',
        (rawProduct.Product_Title_Web_Retailer as string) || '',
        ((rawProduct as any).Ferguson_Description as string) || '',
      ]);
      if (extracted) {
        finalSeoTitleInput.bowlShape = extracted;
        logger.info('Toilet: extracted bowl shape from source data', { sessionId, bowlShape: extracted });
      }
    }

    if (!finalSeoTitleInput.flushType) {
      const extracted = extractFlushTypeFromTexts([
        fergusonProductName, (rawProduct.Ferguson_Title as string) || '',
        (rawProduct.Product_Title_Web_Retailer as string) || '',
        ((rawProduct as any).Ferguson_Description as string) || '',
      ]);
      if (extracted) {
        finalSeoTitleInput.flushType = extracted.replace(/-/g, ' ');
        logger.info('Toilet: extracted flush type from source data', { sessionId, flushType: finalSeoTitleInput.flushType });
      }
    }

    if (!finalSeoTitleInput.type) {
      const sourceTexts = [
        fergusonProductName, (rawProduct.Ferguson_Title as string) || '',
        (rawProduct.Product_Title_Web_Retailer as string) || '',
      ].join(' ').toLowerCase();
      if (/\bone[- ]piece\b/i.test(sourceTexts)) finalSeoTitleInput.type = 'One-Piece';
      else if (/\btwo[- ]piece\b/i.test(sourceTexts)) finalSeoTitleInput.type = 'Two-Piece';
      else if (/\bwall[- ](?:hung|mount)\b/i.test(sourceTexts)) finalSeoTitleInput.type = 'Wall-Mounted';
      else if (/\b(?:smart|electronic|intelligent|bidet seat included)\b/i.test(sourceTexts)) finalSeoTitleInput.type = 'Smart';
      if (finalSeoTitleInput.type) {
        logger.info('Toilet: detected construction type from source data', { sessionId, type: finalSeoTitleInput.type });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOILET SEAT TITLE POST-PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════
  if (finalSeoTitleInput.category === 'Toilet Seat') {
    const currentType = (finalSeoTitleInput.type || '').trim();
    const typeLower = currentType.toLowerCase();

    if (TOILET_BOWL_SHAPES.includes(typeLower)) {
      if (!finalSeoTitleInput.shape) finalSeoTitleInput.shape = currentType;
      finalSeoTitleInput.type = '';
      logger.info('Toilet Seat: moved bowl shape from type slot to shape', { sessionId, shape: currentType });
    }

    if (!finalSeoTitleInput.shape) {
      const extracted = extractBowlShapeFromTexts([
        fergusonProductName, (rawProduct.Ferguson_Title as string) || '',
        (rawProduct.Product_Title_Web_Retailer as string) || '',
        ((rawProduct as any).Ferguson_Description as string) || '',
      ]);
      if (extracted) {
        finalSeoTitleInput.shape = extracted;
        logger.info('Toilet Seat: extracted shape from source data', { sessionId, shape: extracted });
      }
    }

    if (!finalSeoTitleInput.type) {
      const extracted = extractToiletSeatTypeFromTexts([
        fergusonProductName, (rawProduct.Ferguson_Title as string) || '',
        (rawProduct.Product_Title_Web_Retailer as string) || '',
        ((rawProduct as any).Ferguson_Description as string) || '',
        (rawProduct.Product_Title_Legacy as string) || '',
      ]);
      if (extracted) {
        finalSeoTitleInput.type = extracted.replace(/SoftClose/i, 'Soft Close').replace(/-/g, ' ');
        logger.info('Toilet Seat: extracted feature type from source data', { sessionId, type: finalSeoTitleInput.type });
      }
    }
  }

  // Sync Toilet Seat type back to sanitized attributes
  if (sanitizedPrimaryAttributes.AI_Product_Category === 'Toilet Seat' && finalSeoTitleInput.type && !sanitizedPrimaryAttributes.AI_Type) {
    sanitizedPrimaryAttributes.AI_Type = finalSeoTitleInput.type;
  }

  // Sync Shower/Steam/Tub/Rough-In post-processing changes back to sanitized attributes
  const showerSyncCategories = ['Shower', 'Shower Accessory', 'Steam Shower', 'Tub Filler', 'Tub Faucet', 'Rough-In Valve'];
  if (showerSyncCategories.includes(finalSeoTitleInput.category || '')) {
    if (finalSeoTitleInput.type) sanitizedPrimaryAttributes.AI_Type = finalSeoTitleInput.type;
    if (finalSeoTitleInput.category !== sanitizedPrimaryAttributes.AI_Product_Category) {
      sanitizedPrimaryAttributes.AI_Product_Category = finalSeoTitleInput.category || '';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TUB FILLER TYPE → STYLE AUTO-MAPPING
  // Keep AI-determined type as-is, derive configuration style from type
  // ═══════════════════════════════════════════════════════════════════════════
  if (finalSeoTitleInput.category === 'Tub Filler' || finalSeoTitleInput.category === 'Tub Faucet') {
    const tubType = (finalSeoTitleInput.type || '').toLowerCase().trim();
    let derivedStyle = '';

    // Extract mount type from compound AI type values like "Floor Mounted Tub Filler"
    if (/floor\s+mounted/i.test(tubType)) {
      derivedStyle = 'Floor Mounted';
      // If AI returned compound type like "Floor Mounted Tub Filler", normalize to "Floor Mounted"
      if (tubType !== 'floor mounted') {
        finalSeoTitleInput.type = 'Floor Mounted';
        sanitizedPrimaryAttributes.AI_Type = 'Floor Mounted';
      }
    } else if (/wall\s+mounted/i.test(tubType)) {
      derivedStyle = 'Wall Mounted';
      if (tubType !== 'wall mounted') {
        finalSeoTitleInput.type = 'Wall Mounted';
        sanitizedPrimaryAttributes.AI_Type = 'Wall Mounted';
      }
    } else if (/deck\s+mount/i.test(tubType)) {
      // Deck mount — style comes from hole count, not mount type
      if (tubType !== 'deck mount') {
        finalSeoTitleInput.type = 'Deck Mount';
        sanitizedPrimaryAttributes.AI_Type = 'Deck Mount';
      }
    } else if (tubType === 'freestanding') {
      derivedStyle = 'Floor Mounted';
    }

    // Set AI_Style from derived style if we have one and style isn't already set
    if (derivedStyle && !sanitizedPrimaryAttributes.AI_Style) {
      sanitizedPrimaryAttributes.AI_Style = derivedStyle;
      finalSeoTitleInput.style = derivedStyle;
    }
  }

  return {
    finalSeoTitleInput,
    sanitizedPrimaryAttributes,
    applianceFeatures: defaultApplianceFeatures(),
  };
}
