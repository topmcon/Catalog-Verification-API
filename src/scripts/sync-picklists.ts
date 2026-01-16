#!/usr/bin/env node
/**
 * Salesforce Picklist Sync Script
 * ================================
 * Fetches latest picklist values from Salesforce and updates local configuration files
 * Run this script weekly via cron or manually when picklist updates are detected
 * 
 * Usage:
 *   ts-node src/scripts/sync-picklists.ts
 *   npm run sync-picklists
 */

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import logger from '../utils/logger';

interface SalesforcePicklistValue {
  label: string;
  value: string;
  active: boolean;
}

interface SalesforceFieldDescribe {
  name: string;
  type: string;
  picklistValues?: SalesforcePicklistValue[];
}

interface SalesforceDescribeResult {
  fields: SalesforceFieldDescribe[];
}

class PicklistSyncService {
  private salesforceBaseUrl: string;
  private salesforceToken: string;
  private picklistDir: string;

  constructor() {
    this.salesforceBaseUrl = process.env.SALESFORCE_BASE_URL || '';
    this.salesforceToken = process.env.SALESFORCE_ACCESS_TOKEN || '';
    this.picklistDir = path.join(__dirname, '..', 'config', 'salesforce-picklists');
  }

  /**
   * Main sync function
   */
  async syncAll(): Promise<void> {
    logger.info('[PicklistSync] Starting picklist synchronization...');

    try {
      // Fetch Product2 object describe
      const productDescribe = await this.fetchObjectDescribe('Product2');
      
      // Extract and save picklists
      await this.saveCategories(productDescribe);
      await this.saveBrands(productDescribe);
      await this.saveAttributes(productDescribe);
      await this.saveStyles(productDescribe);
      
      // Update version tracking
      await this.updateVersion();
      
      logger.info('[PicklistSync] ✅ Picklist synchronization completed successfully');
    } catch (error) {
      logger.error('[PicklistSync] ❌ Sync failed:', error);
      throw error;
    }
  }

  /**
   * Fetch Salesforce object describe
   */
  private async fetchObjectDescribe(objectName: string): Promise<SalesforceDescribeResult> {
    const url = `${this.salesforceBaseUrl}/services/data/v58.0/sobjects/${objectName}/describe`;
    
    logger.info(`[PicklistSync] Fetching ${objectName} describe from Salesforce...`);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${this.salesforceToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  /**
   * Save categories picklist
   */
  private async saveCategories(describe: SalesforceDescribeResult): Promise<void> {
    const categoryField = describe.fields.find(f => f.name === 'Product_Category__c');
    if (!categoryField?.picklistValues) {
      logger.warn('[PicklistSync] No category picklist found');
      return;
    }

    const categories = categoryField.picklistValues
      .filter(pv => pv.active)
      .map(pv => ({
        label: pv.label,
        value: pv.value,
        id: pv.value // Salesforce uses value as ID
      }));

    const filePath = path.join(this.picklistDir, 'categories.json');
    await fs.writeFile(filePath, JSON.stringify(categories, null, 2));
    logger.info(`[PicklistSync] ✓ Saved ${categories.length} categories to ${filePath}`);
  }

  /**
   * Save brands picklist
   */
  private async saveBrands(describe: SalesforceDescribeResult): Promise<void> {
    const brandField = describe.fields.find(f => f.name === 'Brand__c');
    if (!brandField?.picklistValues) {
      logger.warn('[PicklistSync] No brand picklist found');
      return;
    }

    const brands = brandField.picklistValues
      .filter(pv => pv.active)
      .map(pv => ({
        label: pv.label,
        value: pv.value,
        id: pv.value
      }));

    const filePath = path.join(this.picklistDir, 'brands.json');
    await fs.writeFile(filePath, JSON.stringify(brands, null, 2));
    logger.info(`[PicklistSync] ✓ Saved ${brands.length} brands to ${filePath}`);
  }

  /**
   * Save attributes picklist (dynamic attributes)
   */
  private async saveAttributes(describe: SalesforceDescribeResult): Promise<void> {
    // Find all custom attribute fields (e.g., Attribute_1__c, Attribute_2__c, etc.)
    const attributeFields = describe.fields.filter(f => 
      f.name.startsWith('Attribute_') && f.name.endsWith('__c') && f.picklistValues
    );

    if (attributeFields.length === 0) {
      logger.warn('[PicklistSync] No attribute picklists found');
      return;
    }

    // Collect all unique attribute values across all attribute fields
    const allAttributes = new Set<string>();
    attributeFields.forEach(field => {
      field.picklistValues?.forEach(pv => {
        if (pv.active) {
          allAttributes.add(pv.value);
        }
      });
    });

    const attributes = Array.from(allAttributes).sort().map(attr => ({
      label: attr,
      value: attr,
      id: attr
    }));

    const filePath = path.join(this.picklistDir, 'attributes.json');
    await fs.writeFile(filePath, JSON.stringify(attributes, null, 2));
    logger.info(`[PicklistSync] ✓ Saved ${attributes.length} unique attributes to ${filePath}`);
  }

  /**
   * Save styles picklist
   */
  private async saveStyles(describe: SalesforceDescribeResult): Promise<void> {
    const styleField = describe.fields.find(f => f.name === 'Product_Style__c');
    if (!styleField?.picklistValues) {
      logger.warn('[PicklistSync] No style picklist found');
      return;
    }

    const styles = styleField.picklistValues
      .filter(pv => pv.active)
      .map(pv => ({
        label: pv.label,
        value: pv.value,
        id: pv.value
      }));

    const filePath = path.join(this.picklistDir, 'styles.json');
    await fs.writeFile(filePath, JSON.stringify(styles, null, 2));
    logger.info(`[PicklistSync] ✓ Saved ${styles.length} styles to ${filePath}`);
  }

  /**
   * Update version tracking file
   */
  private async updateVersion(): Promise<void> {
    const version = {
      lastSync: new Date().toISOString(),
      salesforceApiVersion: 'v58.0',
      syncedBy: process.env.USER || 'system'
    };

    const filePath = path.join(this.picklistDir, 'version.json');
    await fs.writeFile(filePath, JSON.stringify(version, null, 2));
    logger.info(`[PicklistSync] ✓ Updated version tracking`);
  }

  /**
   * Compare with existing picklists and report changes
   */
  async detectChanges(): Promise<void> {
    // TODO: Implement change detection
    // - Load existing files
    // - Compare with new data from Salesforce
    // - Report new values, removed values, renamed values
    logger.info('[PicklistSync] Change detection not yet implemented');
  }
}

/**
 * CLI execution
 */
async function main() {
  const syncService = new PicklistSyncService();
  
  try {
    await syncService.syncAll();
    process.exit(0);
  } catch (error) {
    logger.error('[PicklistSync] Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export default PicklistSyncService;
