/**
 * Picklist Reconciliation Service
 * Handles intelligent reconciliation of SF picklist syncs with our master lists
 * and pending creation requests
 */

import * as fs from 'fs';
import * as path from 'path';
import { PendingCreationRequest } from '../models/pending-creation-request.model';
import logger from '../utils/logger';

interface ReconciliationResult {
  success: boolean;
  type: string;
  existing_updated: number;
  pending_added: number;
  new_added: number;
  duplicates_rejected: number;
  unrequested_rejected: number;  // NEW: Items SF sent that we didn't request
  requests_fulfilled: number;
  errors: string[];
}

interface AttributeItem {
  attribute_id: string;
  attribute_name: string;
}

interface CategoryItem {
  category_id: string;
  category_name: string;
  department: string;
  family: string;
  subcategory?: string;
  styles_apply?: boolean;
}

interface BrandItem {
  brand_id: string;
  brand_name: string;
}

interface StyleItem {
  style_id: string;
  style_name: string;
  description?: string;
}

/**
 * Reconcile attributes from SF sync with our existing list and pending requests
 */
export async function reconcileAttributes(
  incomingAttributes: AttributeItem[]
): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    success: false,
    type: 'attributes',
    existing_updated: 0,
    pending_added: 0,
    new_added: 0,
    duplicates_rejected: 0,
    unrequested_rejected: 0,
    requests_fulfilled: 0,
    errors: []
  };

  try {
    // Load existing attributes.json
    const attributesPath = path.join(process.cwd(), 'src/config/salesforce-picklists/attributes.json');
    const existingAttributes: AttributeItem[] = JSON.parse(fs.readFileSync(attributesPath, 'utf8'));

    // De-duplicate SF data (keep first occurrence per unique name)
    const uniqueSfAttributes = new Map<string, AttributeItem>();
    const seenIds = new Set<string>();
    
    for (const attr of incomingAttributes) {
      const nameLower = attr.attribute_name.toLowerCase().trim();
      const id = attr.attribute_id;
      
      // Skip if duplicate name or duplicate ID
      if (uniqueSfAttributes.has(nameLower) || seenIds.has(id)) {
        result.duplicates_rejected++;
        continue;
      }
      
      uniqueSfAttributes.set(nameLower, attr);
      seenIds.add(id);
    }

    logger.info(`De-duplicated ${incomingAttributes.length} SF attributes → ${uniqueSfAttributes.size} unique`, {
      duplicates_rejected: result.duplicates_rejected
    });

    // Load pending creation requests
    const pendingRequests = await PendingCreationRequest.find({
      status: 'pending',
      request_type: 'attribute'
    }).exec();

    const pendingMap = new Map<string, typeof pendingRequests[0]>();
    pendingRequests.forEach(req => {
      pendingMap.set(req.requested_value.toLowerCase().trim(), req);
    });

    logger.info(`Found ${pendingRequests.length} pending attribute requests`);

    // Build map of existing attributes
    const existingMap = new Map<string, AttributeItem>();
    existingAttributes.forEach(attr => {
      existingMap.set(attr.attribute_name.toLowerCase().trim(), attr);
    });

    // Categorize SF data
    const toUpdate: AttributeItem[] = [];  // Existing items to update IDs
    const toAdd: AttributeItem[] = [];     // New items to add

    for (const [nameLower, sfAttr] of uniqueSfAttributes) {
      const existing = existingMap.get(nameLower);
      const pending = pendingMap.get(nameLower);

      if (existing) {
        // Update existing item (preserve our name, update ID if changed)
        if (existing.attribute_id !== sfAttr.attribute_id) {
          toUpdate.push({
            attribute_id: sfAttr.attribute_id,
            attribute_name: existing.attribute_name  // Keep our capitalization
          });
          result.existing_updated++;
        }
      } else {
        // REQUEST-ONLY MODE: Only add items that match our pending requests
        if (pending) {
          toAdd.push(sfAttr);
          result.pending_added++;
        } else {
          // Track unrequested items that were rejected
          result.unrequested_rejected++;
        }
      }
    }

    // Build final list: updated existing + new items
    const finalAttributes: AttributeItem[] = [];
    const processedNames = new Set<string>();

    // Add/update existing items
    for (const existing of existingAttributes) {
      const nameLower = existing.attribute_name.toLowerCase().trim();
      const updated = toUpdate.find(u => u.attribute_name.toLowerCase().trim() === nameLower);
      
      if (updated) {
        finalAttributes.push(updated);
      } else {
        finalAttributes.push(existing);
      }
      
      processedNames.add(nameLower);
    }

    // Add new items
    for (const newAttr of toAdd) {
      const nameLower = newAttr.attribute_name.toLowerCase().trim();
      if (!processedNames.has(nameLower)) {
        finalAttributes.push(newAttr);
        processedNames.add(nameLower);
      }
    }

    // Sort alphabetically
    finalAttributes.sort((a, b) => a.attribute_name.localeCompare(b.attribute_name));

    // Write back to file
    fs.writeFileSync(attributesPath, JSON.stringify(finalAttributes, null, 2), 'utf8');

    logger.info(`Updated attributes.json: ${existingAttributes.length} → ${finalAttributes.length}`, {
      existing_updated: result.existing_updated,
      pending_added: result.pending_added,
      unrequested_rejected: result.unrequested_rejected
    });

    // Mark pending requests as fulfilled
    for (const [nameLower, pending] of pendingMap) {
      const sfAttr = uniqueSfAttributes.get(nameLower);
      if (sfAttr) {
        pending.status = 'fulfilled';
        pending.fulfilled_at = new Date();
        pending.sf_id_received = sfAttr.attribute_id;
        await pending.save();
        result.requests_fulfilled++;
      }
    }

    logger.info(`Marked ${result.requests_fulfilled} pending requests as fulfilled`);

    result.success = true;
    return result;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    logger.error('Attribute reconciliation failed', { error });
    return result;
  }
}

/**
 * Reconcile categories from SF sync (strict - only updates existing, no new additions)
 * Categories have custom fields (subcategory, styles_apply) so we're cautious
 */
export async function reconcileCategories(
  incomingCategories: CategoryItem[]
): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    success: false,
    type: 'categories',
    existing_updated: 0,
    pending_added: 0,
    new_added: 0,
    duplicates_rejected: 0,
    unrequested_rejected: 0,
    requests_fulfilled: 0,
    errors: []
  };

  try {
    const categoriesPath = path.join(process.cwd(), 'src/config/salesforce-picklists/categories.json');
    const existingCategories: CategoryItem[] = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

    // De-duplicate SF data
    const uniqueSfCategories = new Map<string, CategoryItem>();
    const seenIds = new Set<string>();
    
    for (const cat of incomingCategories) {
      const nameLower = cat.category_name.toLowerCase().trim();
      if (uniqueSfCategories.has(nameLower) || seenIds.has(cat.category_id)) {
        result.duplicates_rejected++;
        continue;
      }
      uniqueSfCategories.set(nameLower, cat);
      seenIds.add(cat.category_id);
    }

    // Build map of existing
    const existingMap = new Map<string, CategoryItem>();
    existingCategories.forEach(cat => {
      existingMap.set(cat.category_name.toLowerCase().trim(), cat);
    });

    // Update existing categories ONLY (preserve custom fields)
    const finalCategories: CategoryItem[] = existingCategories.map(existing => {
      const nameLower = existing.category_name.toLowerCase().trim();
      const sfCat = uniqueSfCategories.get(nameLower);
      
      if (sfCat && sfCat.category_id !== existing.category_id) {
        result.existing_updated++;
        return {
          ...existing,
          category_id: sfCat.category_id  // Update ID only, preserve everything else
        };
      }
      
      return existing;
    });

    // Sort
    finalCategories.sort((a, b) => a.category_name.localeCompare(b.category_name));

    // Write back
    fs.writeFileSync(categoriesPath, JSON.stringify(finalCategories, null, 2), 'utf8');

    logger.info(`Updated categories.json: ${result.existing_updated} IDs updated`);

    result.success = true;
    return result;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    logger.error('Category reconciliation failed', { error });
    return result;
  }
}

/**
 * Reconcile brands from SF sync with our existing list and pending requests
 * REQUEST-ONLY MODE: Only adds brands that match pending requests
 */
export async function reconcileBrands(
  incomingBrands: BrandItem[]
): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    success: false,
    type: 'brands',
    existing_updated: 0,
    pending_added: 0,
    new_added: 0,
    duplicates_rejected: 0,
    unrequested_rejected: 0,
    requests_fulfilled: 0,
    errors: []
  };

  try {
    // Load existing brands.json
    const brandsPath = path.join(process.cwd(), 'src/config/salesforce-picklists/brands.json');
    const existingBrands: BrandItem[] = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));

    // De-duplicate SF data (keep first occurrence per unique name)
    const uniqueSfBrands = new Map<string, BrandItem>();
    const seenIds = new Set<string>();
    
    for (const brand of incomingBrands) {
      const nameLower = brand.brand_name.toLowerCase().trim();
      const id = brand.brand_id;
      
      // Skip if duplicate name or duplicate ID
      if (uniqueSfBrands.has(nameLower) || seenIds.has(id)) {
        result.duplicates_rejected++;
        continue;
      }
      
      uniqueSfBrands.set(nameLower, brand);
      seenIds.add(id);
    }

    logger.info(`De-duplicated ${incomingBrands.length} SF brands → ${uniqueSfBrands.size} unique`, {
      duplicates_rejected: result.duplicates_rejected
    });

    // Load pending brand requests
    const pendingRequests = await PendingCreationRequest.find({
      request_type: 'brand',
      status: 'pending'
    });

    const pendingMap = new Map<string, any>();
    for (const req of pendingRequests) {
      pendingMap.set(req.requested_value_normalized, req);
    }

    logger.info(`Found ${pendingMap.size} pending brand requests`);

    // Build existing brand map
    const existingMap = new Map<string, BrandItem>();
    existingBrands.forEach(brand => {
      existingMap.set(brand.brand_name.toLowerCase().trim(), brand);
    });

    // Categorize SF data
    const toUpdate: BrandItem[] = [];  // Existing items to update IDs
    const toAdd: BrandItem[] = [];     // New items to add

    for (const [nameLower, sfBrand] of uniqueSfBrands) {
      const existing = existingMap.get(nameLower);
      const pending = pendingMap.get(nameLower);

      if (existing) {
        // Update existing item (preserve our name, update ID if changed)
        if (existing.brand_id !== sfBrand.brand_id) {
          toUpdate.push({
            brand_id: sfBrand.brand_id,
            brand_name: existing.brand_name  // Keep our capitalization
          });
          result.existing_updated++;
        }
      } else {
        // REQUEST-ONLY MODE: Only add items that match our pending requests
        if (pending) {
          toAdd.push(sfBrand);
          result.pending_added++;
        } else {
          // Track unrequested items that were rejected
          result.unrequested_rejected++;
        }
      }
    }

    // Build final list: updated existing + new items
    const finalBrands: BrandItem[] = [];
    const processedNames = new Set<string>();

    // Add/update existing items
    for (const existing of existingBrands) {
      const nameLower = existing.brand_name.toLowerCase().trim();
      const updated = toUpdate.find(u => u.brand_name.toLowerCase().trim() === nameLower);
      
      if (updated) {
        finalBrands.push(updated);
      } else {
        finalBrands.push(existing);
      }
      processedNames.add(nameLower);
    }

    // Add truly new items (only matched requests)
    for (const newBrand of toAdd) {
      const nameLower = newBrand.brand_name.toLowerCase().trim();
      if (!processedNames.has(nameLower)) {
        finalBrands.push(newBrand);
        processedNames.add(nameLower);
      }
    }

    // Sort alphabetically
    finalBrands.sort((a, b) => a.brand_name.localeCompare(b.brand_name));

    // Write back to file
    fs.writeFileSync(brandsPath, JSON.stringify(finalBrands, null, 2), 'utf8');

    logger.info(`Updated brands.json: ${existingBrands.length} → ${finalBrands.length}`, {
      existing_updated: result.existing_updated,
      pending_added: result.pending_added,
      unrequested_rejected: result.unrequested_rejected
    });

    // Mark pending requests as fulfilled
    for (const [nameLower, pending] of pendingMap) {
      const sfBrand = uniqueSfBrands.get(nameLower);
      if (sfBrand) {
        pending.status = 'fulfilled';
        pending.fulfilled_at = new Date();
        pending.sf_id_received = sfBrand.brand_id;
        await pending.save();
        result.requests_fulfilled++;
      }
    }

    logger.info(`Marked ${result.requests_fulfilled} pending brand requests as fulfilled`);

    result.success = true;
    return result;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    logger.error('Brand reconciliation failed', { error });
    return result;
  }
}

/**
 * Reconcile styles from SF sync with our existing list and pending requests
 * REQUEST-ONLY MODE: Only adds styles that match pending requests
 */
export async function reconcileStyles(
  incomingStyles: StyleItem[]
): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    success: false,
    type: 'styles',
    existing_updated: 0,
    pending_added: 0,
    new_added: 0,
    duplicates_rejected: 0,
    unrequested_rejected: 0,
    requests_fulfilled: 0,
    errors: []
  };

  try {
    // Load existing styles.json
    const stylesPath = path.join(process.cwd(), 'src/config/salesforce-picklists/styles.json');
    const existingStyles: StyleItem[] = JSON.parse(fs.readFileSync(stylesPath, 'utf8'));

    // De-duplicate SF data (keep first occurrence per unique name)
    const uniqueSfStyles = new Map<string, StyleItem>();
    const seenIds = new Set<string>();
    
    for (const style of incomingStyles) {
      const nameLower = style.style_name.toLowerCase().trim();
      const id = style.style_id;
      
      // Skip if duplicate name or duplicate ID
      if (uniqueSfStyles.has(nameLower) || seenIds.has(id)) {
        result.duplicates_rejected++;
        continue;
      }
      
      uniqueSfStyles.set(nameLower, style);
      seenIds.add(id);
    }

    logger.info(`De-duplicated ${incomingStyles.length} SF styles → ${uniqueSfStyles.size} unique`, {
      duplicates_rejected: result.duplicates_rejected
    });

    // Load pending style requests
    const pendingRequests = await PendingCreationRequest.find({
      request_type: 'style',
      status: 'pending'
    });

    const pendingMap = new Map<string, any>();
    for (const req of pendingRequests) {
      pendingMap.set(req.requested_value_normalized, req);
    }

    logger.info(`Found ${pendingMap.size} pending style requests`);

    // Build existing style map
    const existingMap = new Map<string, StyleItem>();
    existingStyles.forEach(style => {
      existingMap.set(style.style_name.toLowerCase().trim(), style);
    });

    // Categorize SF data
    const toUpdate: StyleItem[] = [];  // Existing items to update IDs
    const toAdd: StyleItem[] = [];     // New items to add

    for (const [nameLower, sfStyle] of uniqueSfStyles) {
      const existing = existingMap.get(nameLower);
      const pending = pendingMap.get(nameLower);

      if (existing) {
        // Update existing item (preserve our name and description, update ID if changed)
        if (existing.style_id !== sfStyle.style_id) {
          toUpdate.push({
            style_id: sfStyle.style_id,
            style_name: existing.style_name,  // Keep our capitalization
            description: existing.description  // Preserve our description
          });
          result.existing_updated++;
        }
      } else {
        // REQUEST-ONLY MODE: Only add items that match our pending requests
        if (pending) {
          toAdd.push(sfStyle);
          result.pending_added++;
        } else {
          // Track unrequested items that were rejected
          result.unrequested_rejected++;
        }
      }
    }

    // Build final list: updated existing + new items
    const finalStyles: StyleItem[] = [];
    const processedNames = new Set<string>();

    // Add/update existing items
    for (const existing of existingStyles) {
      const nameLower = existing.style_name.toLowerCase().trim();
      const updated = toUpdate.find(u => u.style_name.toLowerCase().trim() === nameLower);
      
      if (updated) {
        finalStyles.push(updated);
      } else {
        finalStyles.push(existing);
      }
      processedNames.add(nameLower);
    }

    // Add truly new items (only matched requests)
    for (const newStyle of toAdd) {
      const nameLower = newStyle.style_name.toLowerCase().trim();
      if (!processedNames.has(nameLower)) {
        finalStyles.push(newStyle);
        processedNames.add(nameLower);
      }
    }

    // Sort alphabetically
    finalStyles.sort((a, b) => a.style_name.localeCompare(b.style_name));

    // Write back to file
    fs.writeFileSync(stylesPath, JSON.stringify(finalStyles, null, 2), 'utf8');

    logger.info(`Updated styles.json: ${existingStyles.length} → ${finalStyles.length}`, {
      existing_updated: result.existing_updated,
      pending_added: result.pending_added,
      unrequested_rejected: result.unrequested_rejected
    });

    // Mark pending requests as fulfilled
    for (const [nameLower, pending] of pendingMap) {
      const sfStyle = uniqueSfStyles.get(nameLower);
      if (sfStyle) {
        pending.status = 'fulfilled';
        pending.fulfilled_at = new Date();
        pending.sf_id_received = sfStyle.style_id;
        await pending.save();
        result.requests_fulfilled++;
      }
    }

    logger.info(`Marked ${result.requests_fulfilled} pending style requests as fulfilled`);

    result.success = true;
    return result;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    logger.error('Style reconciliation failed', { error });
    return result;
  }
}

// Similar function for types would go here...
// For now, focusing on attributes (the main issue) and categories

// Placeholder constant
const NEEDS_SF_ID = 'NEEDS_SF_ID';

/**
 * Analyze incoming SF attributes against our NEEDS_SF_ID entries
 * Returns match analysis without making any changes
 */
export function analyzeAttributeMatches(
  incomingAttributes: AttributeItem[]
): {
  totalIncoming: number;
  matchesPending: Array<{ name: string; incomingId: string }>;
  newAttributes: Array<{ name: string; incomingId: string }>;
  alreadyHasId: number;
} {
  try {
    const attributesPath = path.join(process.cwd(), 'src/config/salesforce-picklists/attributes.json');
    const existingAttributes: AttributeItem[] = JSON.parse(fs.readFileSync(attributesPath, 'utf8'));

    // Build maps
    const existingByName = new Map<string, AttributeItem>();
    const needsSfIdByName = new Map<string, AttributeItem>();
    
    for (const attr of existingAttributes) {
      const nameLower = attr.attribute_name.toLowerCase().trim();
      existingByName.set(nameLower, attr);
      if (attr.attribute_id === NEEDS_SF_ID) {
        needsSfIdByName.set(nameLower, attr);
      }
    }

    const matchesPending: Array<{ name: string; incomingId: string }> = [];
    const newAttributes: Array<{ name: string; incomingId: string }> = [];
    let alreadyHasId = 0;

    // De-duplicate incoming
    const seenNames = new Set<string>();
    for (const attr of incomingAttributes) {
      const nameLower = attr.attribute_name.toLowerCase().trim();
      if (seenNames.has(nameLower)) continue;
      seenNames.add(nameLower);

      const existing = existingByName.get(nameLower);
      
      if (needsSfIdByName.has(nameLower)) {
        // Matches a NEEDS_SF_ID entry - this is what we want!
        matchesPending.push({
          name: attr.attribute_name,
          incomingId: attr.attribute_id
        });
      } else if (existing) {
        // Already exists with an ID
        alreadyHasId++;
      } else {
        // Completely new attribute
        newAttributes.push({
          name: attr.attribute_name,
          incomingId: attr.attribute_id
        });
      }
    }

    return {
      totalIncoming: seenNames.size,
      matchesPending,
      newAttributes,
      alreadyHasId
    };

  } catch (error) {
    logger.error('Failed to analyze attribute matches', { error });
    return {
      totalIncoming: 0,
      matchesPending: [],
      newAttributes: [],
      alreadyHasId: 0
    };
  }
}

/**
 * Update ONLY the NEEDS_SF_ID entries with real SF IDs
 * Does NOT add any new entries - only updates existing placeholders
 * Used when user confirms the attribute ID updates
 */
export async function updatePendingAttributeIds(
  incomingAttributes: AttributeItem[]
): Promise<{
  success: boolean;
  updated: number;
  updatedNames: string[];
  errors: string[];
}> {
  const result = {
    success: false,
    updated: 0,
    updatedNames: [] as string[],
    errors: [] as string[]
  };

  try {
    const attributesPath = path.join(process.cwd(), 'src/config/salesforce-picklists/attributes.json');
    const existingAttributes: AttributeItem[] = JSON.parse(fs.readFileSync(attributesPath, 'utf8'));

    // Build map of incoming SF IDs by name
    const incomingByName = new Map<string, string>();
    for (const attr of incomingAttributes) {
      incomingByName.set(attr.attribute_name.toLowerCase().trim(), attr.attribute_id);
    }

    // Update ONLY entries with NEEDS_SF_ID
    const updatedAttributes = existingAttributes.map(attr => {
      if (attr.attribute_id !== NEEDS_SF_ID) {
        return attr;
      }

      const nameLower = attr.attribute_name.toLowerCase().trim();
      const newId = incomingByName.get(nameLower);

      if (newId) {
        result.updated++;
        result.updatedNames.push(attr.attribute_name);
        
        // Mark corresponding pending request as fulfilled
        PendingCreationRequest.findOneAndUpdate(
          {
            request_type: 'attribute',
            requested_value_normalized: nameLower,
            status: 'pending'
          },
          {
            $set: {
              status: 'fulfilled',
              fulfilled_at: new Date(),
              sf_id_received: newId,
              updated_at: new Date()
            }
          }
        ).exec().catch(err => {
          logger.error('Failed to mark request as fulfilled', { name: attr.attribute_name, err });
        });

        return {
          ...attr,
          attribute_id: newId
        };
      }

      return attr;
    });

    // Write back
    fs.writeFileSync(attributesPath, JSON.stringify(updatedAttributes, null, 2), 'utf8');

    logger.info(`Updated ${result.updated} attribute IDs from NEEDS_SF_ID to real SF IDs`, {
      updatedNames: result.updatedNames
    });

    result.success = true;
    return result;

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    logger.error('Failed to update pending attribute IDs', { error });
    return result;
  }
}

export const picklistReconciliation = {
  reconcileAttributes,
  reconcileBrands,
  reconcileCategories,
  reconcileStyles,
  analyzeAttributeMatches,
  updatePendingAttributeIds
};
