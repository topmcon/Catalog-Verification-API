import { AttributeCatalog } from '../models/attribute-catalog.model';
import logger from '../utils/logger';

/**
 * Metadata attributes that should never be surfaced as top 15 candidates.
 * These belong in HTML additional attributes only.
 */
const METADATA_ATTRIBUTES = new Set([
  'warranty', 'manufacturer warranty', 'commercial warranty', 'limited warranty',
  'energy star', 'energy star certified', 'energystar',
  'ada compliant', 'ada', 'ada compliance',
  'certifications', 'certified', 'ul listed', 'etl listed', 'ul', 'etl',
  'country of origin', 'made in america', 'made in usa',
  'upc', 'gtin', 'ean',
  'collection', 'theme',
  'location rating', 'wet rated', 'damp rated', 'dry rated',
  'approved for commercial use',
  'prop 65 warning', 'california prop 65',
  'nsf certified', 'water sense', 'watersense certified'
]);

/**
 * Check if an attribute name is metadata (should never be top 15)
 */
function isMetadataAttribute(name: string): boolean {
  const normalized = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (METADATA_ATTRIBUTES.has(normalized)) return true;
  // Keyword-based checks
  if (normalized.includes('warranty')) return true;
  if (normalized.includes('certified') || normalized.includes('certification')) return true;
  if (normalized.includes('complian')) return true;  // compliant, compliance
  if (normalized.includes('prop 65')) return true;
  return false;
}

/**
 * Describes which sources had data and which attributes each source provided.
 */
export interface AttributeSourceMap {
  /** Which data sources had ANY data at all for this product */
  availableSources: {
    ferguson: boolean;
    webRetailer: boolean;
    specTable: boolean;
    nestedFerguson: boolean;
    ai: boolean;
  };
  /** Attributes found per source. Key = normalized attribute name, value = raw value */
  fergusonAttrs: Record<string, string>;
  webRetailerAttrs: Record<string, string>;
  specTableAttrs: Record<string, string>;
  nestedFergusonAttrs: Record<string, string>;
  aiAttrs: Record<string, string>;
}

/**
 * Log all attributes from a verification run into the attribute catalog.
 * Fire-and-forget — errors are logged but never block verification.
 *
 * @param category - Verified category (e.g., "Toilet")
 * @param type - Verified type within category (e.g., "Two-Piece")
 * @param top15SchemaAttrs - The top 15 attribute names defined by the category schema
 * @param primaryAttrNames - Primary attribute field names
 * @param allFoundAttributes - Merged map of ALL attribute names → values (from all sources)
 * @param sourceMap - Which sources provided which attributes
 */
export async function logAttributeCatalog(
  category: string,
  type: string,
  top15SchemaAttrs: string[],
  primaryAttrNames: string[],
  allFoundAttributes: Record<string, string>,
  sourceMap: AttributeSourceMap
): Promise<void> {
  try {
    const now = new Date();
    const normalizedCategory = category.trim();
    const normalizedType = (type || '').trim();
    
    // Collect ALL unique attribute names across all sources + schema
    const allAttrNames = new Set<string>();
    
    // Add top 15 schema attributes (even if not found — to track fill rate)
    for (const attr of top15SchemaAttrs) {
      allAttrNames.add(attr);
    }
    
    // Add all actually-found attributes
    for (const name of Object.keys(allFoundAttributes)) {
      allAttrNames.add(name);
    }
    
    // Build bulk operations
    const bulkOps: any[] = [];
    
    for (const attrName of allAttrNames) {
      const value = allFoundAttributes[attrName] || '';
      const hasValue = value !== '' && value !== 'Not Found' && value !== 'N/A';
      
      // Determine current location
      let currentLocation: 'top15' | 'primary' | 'html' | 'discovered' = 'discovered';
      const attrNameLower = attrName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      
      if (primaryAttrNames.some(p => p.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() === attrNameLower)) {
        currentLocation = 'primary';
      } else if (top15SchemaAttrs.some(t => t.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() === attrNameLower ||
                                              t.toLowerCase().includes(attrNameLower) || attrNameLower.includes(t.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()))) {
        currentLocation = 'top15';
      } else if (allFoundAttributes[attrName] !== undefined) {
        currentLocation = 'html';
      }
      
      // Determine source increments — only count source if it had data for this product
      const sourceIncrements: Record<string, { found: number; available: number }> = {};
      
      if (sourceMap.availableSources.ferguson) {
        sourceIncrements['sources.ferguson.available'] = { found: 0, available: 1 };
        if (sourceMap.fergusonAttrs[attrName]) {
          sourceIncrements['sources.ferguson.found'] = { found: 1, available: 0 };
        }
      }
      if (sourceMap.availableSources.webRetailer) {
        sourceIncrements['sources.webRetailer.available'] = { found: 0, available: 1 };
        if (sourceMap.webRetailerAttrs[attrName]) {
          sourceIncrements['sources.webRetailer.found'] = { found: 1, available: 0 };
        }
      }
      if (sourceMap.availableSources.specTable) {
        sourceIncrements['sources.specTable.available'] = { found: 0, available: 1 };
        if (sourceMap.specTableAttrs[attrName]) {
          sourceIncrements['sources.specTable.found'] = { found: 1, available: 0 };
        }
      }
      if (sourceMap.availableSources.nestedFerguson) {
        sourceIncrements['sources.nestedFerguson.available'] = { found: 0, available: 1 };
        if (sourceMap.nestedFergusonAttrs[attrName]) {
          sourceIncrements['sources.nestedFerguson.found'] = { found: 1, available: 0 };
        }
      }
      if (sourceMap.availableSources.ai) {
        sourceIncrements['sources.ai.available'] = { found: 0, available: 1 };
        if (sourceMap.aiAttrs[attrName]) {
          sourceIncrements['sources.ai.found'] = { found: 1, available: 0 };
        }
      }
      
      // Build $inc object for source fields
      const incObj: Record<string, number> = {
        totalVerifications: 1,
        foundCount: hasValue ? 1 : 0
      };
      
      for (const [path, vals] of Object.entries(sourceIncrements)) {
        if (vals.available) incObj[path] = (incObj[path] || 0) + vals.available;
        if (vals.found) incObj[path] = (incObj[path] || 0) + vals.found;
      }
      
      bulkOps.push({
        updateOne: {
          filter: {
            category: normalizedCategory,
            type: normalizedType,
            attributeName: attrName
          },
          update: {
            $inc: incObj,
            $set: {
              lastSeen: now,
              currentLocation,
              isMetadata: isMetadataAttribute(attrName),
              ...(hasValue ? { lastValue: String(value).substring(0, 200) } : {})
            },
            $setOnInsert: {
              firstSeen: now
            }
          },
          upsert: true
        }
      });
    }
    
    if (bulkOps.length > 0) {
      const result = await AttributeCatalog.bulkWrite(bulkOps, { ordered: false });
      
      // Update fill rates for all affected documents
      // We do this separately since $inc and computed fields don't mix in bulkWrite
      await AttributeCatalog.updateMany(
        { category: normalizedCategory, type: normalizedType },
        [{ $set: { fillRate: { $cond: { if: { $gt: ['$totalVerifications', 0] }, then: { $divide: ['$foundCount', '$totalVerifications'] }, else: 0 } } } }]
      );
      
      logger.debug('Attribute catalog updated', {
        category: normalizedCategory,
        type: normalizedType,
        attributesLogged: allAttrNames.size,
        upserted: result.upsertedCount,
        modified: result.modifiedCount
      });
    }
  } catch (error) {
    // Fire-and-forget — never let catalog logging break verification
    logger.warn('Attribute catalog logging failed (non-blocking)', {
      error: error instanceof Error ? error.message : String(error),
      category,
      type
    });
  }
}
