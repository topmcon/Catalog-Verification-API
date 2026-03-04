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
        // New item to add
        toAdd.push(sfAttr);
        
        if (pending) {
          result.pending_added++;
        } else {
          result.new_added++;
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
      new_added: result.new_added
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

// Similar functions for brands, styles, types would go here...
// For now, focusing on attributes (the main issue) and categories

export const picklistReconciliation = {
  reconcileAttributes,
  reconcileCategories
};
