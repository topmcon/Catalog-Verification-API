/**
 * APPLIANCE DEPARTMENT PIPELINE
 * 
 * Isolated post-processing for Appliances department products.
 * Based on last known-good appliance logic (commit 926ad6b, March 2 2026)
 * with the installation type normalization fix applied.
 * 
 * This pipeline receives the base finalSeoTitleInput (already constructed by the
 * main service) and applies appliance-specific modifications:
 * - Refrigerator depth/installation type logic
 * - Cooktop/Range fuel type correction
 * - Appliance Features building (built_in, panel_ready, counter_depth, voltage, fuel)
 * 
 * IMPORTANT: Changes to non-appliance post-processing (shower, toilet, bathtub, mirror)
 * do NOT affect this file. That's the whole point of the separation.
 */

import logger from '../../utils/logger';
import { ApplianceFeatures, SalesforceIncomingProduct, PrimaryDisplayAttributes, TopFilterAttributes } from '../../types/salesforce.types';
import { PipelineContext, PipelineResult } from './shared-pipeline-types';

/**
 * Apply appliance-specific post-processing pipeline.
 * 
 * Receives the base finalSeoTitleInput (already constructed by the main service),
 * applies refrigerator depth logic, cooktop fuel type fixes, and builds appliance features.
 */
export function applyAppliancePipeline(ctx: PipelineContext): PipelineResult {
  const {
    finalSeoTitleInput,
    sanitizedPrimaryAttributes,
    sanitizedTopFilterAttributes,
    rawProduct,
    agreedCategory,
    sessionId,
  } = ctx;

  // ═══════════════════════════════════════════
  // REFRIGERATOR DEPTH/INSTALLATION LOGIC
  // Based on 926ad6b — the last known-good appliance logic
  // Built-In: show "Built-In" only, no depth (always counter-depth - implied)
  // Freestanding + Counter-Depth: show "Counter-Depth" only (Freestanding implied)
  // Freestanding + Standard: show nothing (both implied)
  // ═══════════════════════════════════════════
  const categoryLower = (agreedCategory || '').toLowerCase();
  const isRefrigeratorCategory = categoryLower.includes('refrigerator') || categoryLower.includes('freezer');

  if (isRefrigeratorCategory) {
    const installationTypeLower = (finalSeoTitleInput.installationType || '').toLowerCase();

    const combinedTextForPanelReady = [
      rawProduct.Product_Description_Web_Retailer || '',
      rawProduct.Ferguson_Description || '',
      rawProduct.Product_Title_Web_Retailer || '',
      rawProduct.Ferguson_Title || '',
      rawProduct.Features_Web_Retailer || ''
    ].join(' ').toLowerCase();

    const isBuiltIn =
      installationTypeLower.includes('built-in') ||
      installationTypeLower.includes('built in') ||
      combinedTextForPanelReady.includes('built-in refrigerator') ||
      combinedTextForPanelReady.includes('built in refrigerator');

    const isCounterDepth =
      installationTypeLower.includes('counter-depth') ||
      installationTypeLower.includes('counter depth') ||
      combinedTextForPanelReady.includes('counter-depth') ||
      combinedTextForPanelReady.includes('counter depth');

    if (isBuiltIn) {
      finalSeoTitleInput.installationType = 'Built-In';
      finalSeoTitleInput.depthType = ''; // Built-ins are always counter-depth — implied
      logger.info('Refrigerator detected as Built-In (depth omitted - implied counter-depth)', {
        sessionId, category: agreedCategory
      });
    } else if (isCounterDepth) {
      finalSeoTitleInput.installationType = ''; // Freestanding implied
      finalSeoTitleInput.depthType = 'Counter-Depth';
      logger.info('Refrigerator detected as Freestanding Counter-Depth', {
        sessionId, category: agreedCategory
      });
    } else {
      finalSeoTitleInput.installationType = ''; // Both implied
      finalSeoTitleInput.depthType = '';
      logger.info('Refrigerator detected as Freestanding Standard Depth (both omitted - implied)', {
        sessionId, category: agreedCategory
      });
    }
  }

  // ═══════════════════════════════════════════
  // COOKTOP/RANGE FIX: Fuel type in fuelType, not type
  // For cooking appliances, Gas/Electric/Induction are fuel types, not product types
  // ═══════════════════════════════════════════
  const FUEL_TYPE_VALUES = ['gas', 'electric', 'induction', 'dual fuel', 'propane', 'natural gas', 'lp'];
  const FUEL_TYPE_CATEGORIES = ['cooktop', 'range', 'rangetop', 'oven', 'wall oven'];

  const currentCategoryLower = (finalSeoTitleInput.category || '').toLowerCase();
  const currentTypeLower = (finalSeoTitleInput.type || '').toLowerCase().trim();

  if (FUEL_TYPE_CATEGORIES.some(c => currentCategoryLower.includes(c)) &&
      FUEL_TYPE_VALUES.some(f => currentTypeLower.includes(f))) {
    if (!finalSeoTitleInput.fuelType) {
      finalSeoTitleInput.fuelType = finalSeoTitleInput.type;
    }
    finalSeoTitleInput.type = '';
    logger.info('Cooktop/Range fuel type correction applied', {
      sessionId,
      category: finalSeoTitleInput.category,
      movedFuelType: finalSeoTitleInput.fuelType,
      installationType: finalSeoTitleInput.installationType
    });
  }

  // ═══════════════════════════════════════════
  // BUILD APPLIANCE FEATURES
  // ═══════════════════════════════════════════
  const applianceFeatures = buildApplianceFeatures(
    sanitizedPrimaryAttributes.AI_Product_Department,
    agreedCategory,
    String(sanitizedTopFilterAttributes['installation_type'] || sanitizedTopFilterAttributes['Installation_Type'] || ''),
    String(sanitizedTopFilterAttributes['fuel_type'] || sanitizedTopFilterAttributes['Fuel_Type'] || ''),
    rawProduct,
    sanitizedTopFilterAttributes,
    sanitizedPrimaryAttributes
  );

  return {
    finalSeoTitleInput,
    sanitizedPrimaryAttributes,
    applianceFeatures,
  };
}

/**
 * Build Appliance Features section.
 * Determines standard appliance features based on product data and category.
 * Returns all-false for non-Appliances (shouldn't happen via pipeline routing, but defensive).
 */
function buildApplianceFeatures(
  department: string | undefined,
  category: string | null | undefined,
  installationType: string | undefined,
  fuelType: string | undefined,
  rawProduct: SalesforceIncomingProduct,
  topFilterAttributes: TopFilterAttributes,
  primaryAttributes: PrimaryDisplayAttributes
): ApplianceFeatures {
  if (!department || department.toLowerCase() !== 'appliances') {
    return {
      built_in: false, panel_ready: false, counter_depth: false, standard_depth: false,
      voltage_120v: false, voltage_240v: false, fuel_gas: false, fuel_electric: false
    };
  }

  const categoryLower = category?.toLowerCase() || '';
  const installLower = installationType?.toLowerCase() || '';
  const fuelLower = fuelType?.toLowerCase() || '';

  const combinedText = (
    (primaryAttributes.AI_Product_Title || '') + ' ' +
    (rawProduct.Product_Title_Web_Retailer || '') + ' ' +
    (rawProduct.Product_Description_Web_Retailer || '') + ' ' +
    (rawProduct.Ferguson_Description || '')
  ).toLowerCase();

  // built_in (ONLY for Oven and Refrigerator)
  let built_in = false;
  if (categoryLower === 'oven') {
    built_in = (
      installLower.includes('built-in') || installLower.includes('built in') ||
      installLower.includes('wall') ||
      combinedText.includes('built-in') || combinedText.includes('built in oven') ||
      combinedText.includes('wall oven')
    );
  } else if (categoryLower === 'refrigerator') {
    built_in = (
      installLower.includes('built-in') || installLower.includes('built in') ||
      combinedText.includes('built-in refrigerator') || combinedText.includes('built in refrigerator')
    );
  }

  // panel_ready
  const panel_ready = (
    installLower.includes('panel ready') || installLower.includes('panel-ready') ||
    combinedText.includes('panel ready') || combinedText.includes('panel-ready') ||
    combinedText.includes('custom panel')
  );

  // counter_depth / standard_depth (REFRIGERATOR & FREEZER ONLY)
  let counter_depth = false;
  let standard_depth = false;
  const isRefrigerator = categoryLower.includes('refrigerator') || categoryLower.includes('freezer');

  if (isRefrigerator) {
    const hasCounterDepthKeywords = (
      installLower.includes('counter-depth') || installLower.includes('counter depth') ||
      combinedText.includes('counter-depth') || combinedText.includes('counter depth')
    );

    const depthStr = String(primaryAttributes.AI_Depth || rawProduct.Depth_Web_Retailer || '').toLowerCase();
    const depthMatch = depthStr.match(/([\d.]+)/);
    const depthInches = depthMatch ? parseFloat(depthMatch[1]) : null;

    if (hasCounterDepthKeywords || (depthInches !== null && depthInches <= 26)) {
      counter_depth = true;
    } else {
      standard_depth = true;
    }
  }

  // voltage
  let voltage_120v = false;
  let voltage_240v = false;

  const voltageAttr = String(topFilterAttributes['voltage'] || topFilterAttributes['volts'] || '').toLowerCase();
  if (voltageAttr.includes('120') || voltageAttr.includes('115')) voltage_120v = true;
  if (voltageAttr.includes('240') || voltageAttr.includes('220') || voltageAttr.includes('230')) voltage_240v = true;
  if (combinedText.includes('120v') || combinedText.includes('120 v') || combinedText.includes('115v')) voltage_120v = true;
  if (combinedText.includes('240v') || combinedText.includes('240 v') || combinedText.includes('220v') || combinedText.includes('230v')) voltage_240v = true;

  if (!voltage_120v && !voltage_240v) {
    if (['range', 'oven', 'cooktop', 'dryer', 'water heater'].includes(categoryLower)) {
      voltage_240v = true;
    } else if (['dishwasher', 'microwave', 'freezer', 'refrigerator', 'washer'].includes(categoryLower)) {
      voltage_120v = true;
    }
  }

  // fuel type
  let fuel_gas = false;
  let fuel_electric = false;

  if (fuelLower.includes('gas') || fuelLower.includes('natural gas') || fuelLower.includes('propane')) fuel_gas = true;
  if (fuelLower.includes('electric') || fuelLower.includes('induction')) fuel_electric = true;
  if (fuelLower.includes('dual fuel') || fuelLower.includes('dual-fuel')) { fuel_gas = true; fuel_electric = true; }

  if (!fuel_gas && !fuel_electric) {
    if (combinedText.includes('gas range') || combinedText.includes('gas cooktop') || combinedText.includes('gas oven')) fuel_gas = true;
    if (combinedText.includes('electric range') || combinedText.includes('electric cooktop') || combinedText.includes('electric oven') || combinedText.includes('induction')) fuel_electric = true;
  }

  return { built_in, panel_ready, counter_depth, standard_depth, voltage_120v, voltage_240v, fuel_gas, fuel_electric };
}
