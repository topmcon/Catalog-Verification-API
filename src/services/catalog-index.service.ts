import logger from '../utils/logger';
import {
  CategoryIndex,
  StyleIndex,
  HierarchyIndex,
  AttributeIndex,
  BrandCategoryIndex,
  VerificationHistory,
  ICategoryIndex,
  IStyleIndex
} from '../models/catalog-index.model';

/**
 * CATALOG INDEX SERVICE
 * 
 * Records and tracks all verification data to build a comprehensive
 * internal index of:
 * - Department → Family → Category → Style relationships
 * - Attribute patterns per category
 * - Brand specializations
 * - Historical trends
 */

interface VerificationData {
  sf_catalog_id: string;
  model_number: string;
  brand: string;
  brand_id: string | null;
  category: string;
  category_id: string | null;
  department: string;
  family: string;
  subcategory: string;
  style: string;
  style_id: string | null;
  attributes: Record<string, any>;
  confidence_score: number;
  openai_category?: string;
  openai_style?: string;
  xai_category?: string;
  xai_style?: string;
}

class CatalogIndexService {
  
  /**
   * Record a verification result - updates all indexes
   */
  async recordVerification(data: VerificationData): Promise<void> {
    try {
      const now = new Date();
      
      // Run all index updates in parallel
      await Promise.all([
        this.updateCategoryIndex(data, now),
        this.updateStyleIndex(data, now),
        this.updateHierarchyIndex(data, now),
        this.updateAttributeIndex(data, now),
        this.updateBrandCategoryIndex(data, now),
        this.recordHistory(data, now)
      ]);
      
      logger.info('Catalog index updated for verification', {
        sf_catalog_id: data.sf_catalog_id,
        category: data.category,
        style: data.style,
        brand: data.brand
      });
    } catch (error) {
      // Don't fail the main verification if indexing fails
      logger.error('Failed to update catalog index', { error, data: data.sf_catalog_id });
    }
  }
  
  /**
   * Update Category Index - tracks all data for each category
   */
  private async updateCategoryIndex(data: VerificationData, now: Date): Promise<void> {
    if (!data.category) return;
    
    const update: any = {
      $setOnInsert: {
        category_name: data.category,
        first_seen: now,
        created_at: now
      },
      $set: {
        category_id: data.category_id,
        department: data.department || '',
        family: data.family || '',
        last_seen: now,
        updated_at: now
      },
      $inc: {
        total_products_verified: 1
      }
    };
    
    // Upsert the category
    const categoryDoc = await CategoryIndex.findOneAndUpdate(
      { category_name: data.category },
      update,
      { upsert: true, new: true }
    );
    
    // Update style association
    if (data.style && categoryDoc) {
      const existingStyle = categoryDoc.styles.find(s => s.style_name === data.style);
      if (existingStyle) {
        await CategoryIndex.updateOne(
          { category_name: data.category, 'styles.style_name': data.style },
          {
            $inc: { 'styles.$.occurrence_count': 1 },
            $set: { 
              'styles.$.last_seen': now,
              'styles.$.style_id': data.style_id || existingStyle.style_id
            },
            $addToSet: { 'styles.$.sample_products': { $each: [data.model_number].slice(0, 1) } }
          }
        );
        // Limit sample_products to 10
        await CategoryIndex.updateOne(
          { category_name: data.category, 'styles.style_name': data.style },
          { $push: { 'styles.$.sample_products': { $each: [], $slice: -10 } } }
        );
      } else {
        await CategoryIndex.updateOne(
          { category_name: data.category },
          {
            $push: {
              styles: {
                style_name: data.style,
                style_id: data.style_id,
                occurrence_count: 1,
                first_seen: now,
                last_seen: now,
                sample_products: [data.model_number]
              }
            }
          }
        );
      }
    }
    
    // Update brand association
    if (data.brand) {
      const existingBrand = categoryDoc?.brands.find(b => b.brand_name === data.brand);
      if (existingBrand) {
        await CategoryIndex.updateOne(
          { category_name: data.category, 'brands.brand_name': data.brand },
          {
            $inc: { 'brands.$.product_count': 1 },
            $set: { 'brands.$.brand_id': data.brand_id || existingBrand.brand_id }
          }
        );
      } else {
        await CategoryIndex.updateOne(
          { category_name: data.category },
          {
            $push: {
              brands: {
                brand_name: data.brand,
                brand_id: data.brand_id,
                product_count: 1
              }
            }
          }
        );
      }
    }
    
    // Update subcategory
    if (data.subcategory) {
      const existingSub = categoryDoc?.subcategories.find(s => s.name === data.subcategory);
      if (existingSub) {
        await CategoryIndex.updateOne(
          { category_name: data.category, 'subcategories.name': data.subcategory },
          { $inc: { 'subcategories.$.count': 1 } }
        );
      } else {
        await CategoryIndex.updateOne(
          { category_name: data.category },
          { $push: { subcategories: { name: data.subcategory, count: 1 } } }
        );
      }
    }
    
    // Update attributes
    for (const [attrName, attrValue] of Object.entries(data.attributes)) {
      if (attrValue === null || attrValue === undefined || attrValue === '') continue;
      
      const valueStr = String(attrValue);
      const existingAttr = categoryDoc?.attributes.find(a => a.attribute_name === attrName);
      
      if (existingAttr) {
        const existingValue = existingAttr.common_values.find(v => v.value === valueStr);
        if (existingValue) {
          await CategoryIndex.updateOne(
            { 
              category_name: data.category, 
              'attributes.attribute_name': attrName,
              'attributes.common_values.value': valueStr
            },
            {
              $inc: { 
                'attributes.$.occurrence_count': 1,
                'attributes.$.common_values.$[val].count': 1
              }
            },
            { arrayFilters: [{ 'val.value': valueStr }] }
          );
        } else {
          await CategoryIndex.updateOne(
            { category_name: data.category, 'attributes.attribute_name': attrName },
            {
              $inc: { 'attributes.$.occurrence_count': 1 },
              $push: { 'attributes.$.common_values': { value: valueStr, count: 1 } }
            }
          );
        }
      } else {
        await CategoryIndex.updateOne(
          { category_name: data.category },
          {
            $push: {
              attributes: {
                attribute_name: attrName,
                occurrence_count: 1,
                common_values: [{ value: valueStr, count: 1 }]
              }
            }
          }
        );
      }
    }
  }
  
  /**
   * Update Style Index - tracks all categories/brands for each style
   */
  private async updateStyleIndex(data: VerificationData, now: Date): Promise<void> {
    if (!data.style) return;
    
    const update: any = {
      $setOnInsert: {
        style_name: data.style,
        first_seen: now,
        created_at: now
      },
      $set: {
        style_id: data.style_id,
        in_salesforce_picklist: !!data.style_id,
        last_seen: now,
        updated_at: now
      },
      $inc: {
        total_occurrences: 1
      }
    };
    
    const styleDoc = await StyleIndex.findOneAndUpdate(
      { style_name: data.style },
      update,
      { upsert: true, new: true }
    );
    
    // Update category association
    if (data.category) {
      const existingCat = styleDoc?.categories.find(c => c.category_name === data.category);
      if (existingCat) {
        await StyleIndex.updateOne(
          { style_name: data.style, 'categories.category_name': data.category },
          {
            $inc: { 'categories.$.occurrence_count': 1 },
            $set: {
              'categories.$.last_seen': now,
              'categories.$.category_id': data.category_id || existingCat.category_id,
              'categories.$.department': data.department || existingCat.department,
              'categories.$.family': data.family || existingCat.family
            }
          }
        );
      } else {
        await StyleIndex.updateOne(
          { style_name: data.style },
          {
            $push: {
              categories: {
                category_name: data.category,
                category_id: data.category_id,
                department: data.department,
                family: data.family,
                occurrence_count: 1,
                first_seen: now,
                last_seen: now
              }
            }
          }
        );
      }
    }
    
    // Update brand association
    if (data.brand) {
      const existingBrand = styleDoc?.brands.find(b => b.brand_name === data.brand);
      if (existingBrand) {
        await StyleIndex.updateOne(
          { style_name: data.style, 'brands.brand_name': data.brand },
          { $inc: { 'brands.$.product_count': 1 } }
        );
      } else {
        await StyleIndex.updateOne(
          { style_name: data.style },
          { $push: { brands: { brand_name: data.brand, product_count: 1 } } }
        );
      }
    }
  }
  
  /**
   * Update Hierarchy Index - Department → Family → Category tree
   */
  private async updateHierarchyIndex(data: VerificationData, now: Date): Promise<void> {
    if (!data.department) return;
    
    // Ensure department exists
    await HierarchyIndex.updateOne(
      { department: data.department },
      {
        $setOnInsert: { department: data.department, families: [] },
        $set: { updated_at: now },
        $inc: { total_products: 1 }
      },
      { upsert: true }
    );
    
    // Update family
    if (data.family) {
      const deptDoc = await HierarchyIndex.findOne({ department: data.department });
      const existingFamily = deptDoc?.families.find(f => f.family_name === data.family);
      
      if (existingFamily) {
        await HierarchyIndex.updateOne(
          { department: data.department, 'families.family_name': data.family },
          { $inc: { 'families.$.product_count': 1 } }
        );
        
        // Update category within family
        if (data.category) {
          const existingCat = existingFamily.categories.find(c => c.category_name === data.category);
          if (existingCat) {
            await HierarchyIndex.updateOne(
              { 
                department: data.department, 
                'families.family_name': data.family,
                'families.categories.category_name': data.category
              },
              {
                $inc: { 'families.$[fam].categories.$[cat].product_count': 1 },
                $addToSet: { 'families.$[fam].categories.$[cat].styles': data.style }
              },
              { 
                arrayFilters: [
                  { 'fam.family_name': data.family },
                  { 'cat.category_name': data.category }
                ]
              }
            );
          } else {
            await HierarchyIndex.updateOne(
              { department: data.department, 'families.family_name': data.family },
              {
                $push: {
                  'families.$.categories': {
                    category_name: data.category,
                    category_id: data.category_id,
                    product_count: 1,
                    styles: data.style ? [data.style] : []
                  }
                }
              }
            );
          }
        }
      } else {
        await HierarchyIndex.updateOne(
          { department: data.department },
          {
            $push: {
              families: {
                family_name: data.family,
                categories: data.category ? [{
                  category_name: data.category,
                  category_id: data.category_id,
                  product_count: 1,
                  styles: data.style ? [data.style] : []
                }] : [],
                product_count: 1
              }
            }
          }
        );
      }
    }
  }
  
  /**
   * Update Attribute Index - track attribute patterns
   */
  private async updateAttributeIndex(data: VerificationData, now: Date): Promise<void> {
    for (const [attrKey, attrValue] of Object.entries(data.attributes)) {
      if (attrValue === null || attrValue === undefined || attrValue === '') continue;
      
      const valueStr = String(attrValue);
      const attrName = attrKey.replace(/_Verified$/, '').replace(/_/g, ' ');
      
      // Determine value type
      let valueType: 'string' | 'number' | 'boolean' = 'string';
      if (typeof attrValue === 'number' || !isNaN(Number(attrValue))) {
        valueType = 'number';
      } else if (typeof attrValue === 'boolean' || attrValue === 'true' || attrValue === 'false') {
        valueType = 'boolean';
      }
      
      await AttributeIndex.updateOne(
        { attribute_key: attrKey },
        {
          $setOnInsert: {
            attribute_key: attrKey,
            attribute_name: attrName,
            created_at: now
          },
          $set: {
            value_type: valueType,
            updated_at: now
          },
          $inc: { total_occurrences: 1 }
        },
        { upsert: true }
      );
      
      // Update category association for this attribute
      if (data.category) {
        const attrDoc = await AttributeIndex.findOne({ attribute_key: attrKey });
        const existingCat = attrDoc?.categories.find(c => c.category_name === data.category);
        
        if (existingCat) {
          const existingValue = existingCat.common_values.find(v => v.value === valueStr);
          if (existingValue) {
            await AttributeIndex.updateOne(
              { 
                attribute_key: attrKey,
                'categories.category_name': data.category,
                'categories.common_values.value': valueStr
              },
              {
                $inc: { 
                  'categories.$.occurrence_count': 1,
                  'categories.$.common_values.$[val].count': 1
                }
              },
              { arrayFilters: [{ 'val.value': valueStr }] }
            );
          } else {
            await AttributeIndex.updateOne(
              { attribute_key: attrKey, 'categories.category_name': data.category },
              {
                $inc: { 'categories.$.occurrence_count': 1 },
                $push: { 'categories.$.common_values': { value: valueStr, count: 1 } }
              }
            );
          }
        } else {
          await AttributeIndex.updateOne(
            { attribute_key: attrKey },
            {
              $push: {
                categories: {
                  category_name: data.category,
                  occurrence_count: 1,
                  is_required: false,
                  common_values: [{ value: valueStr, count: 1 }]
                }
              }
            }
          );
        }
      }
    }
  }
  
  /**
   * Update Brand-Category Index
   */
  private async updateBrandCategoryIndex(data: VerificationData, now: Date): Promise<void> {
    if (!data.brand) return;
    
    await BrandCategoryIndex.updateOne(
      { brand_name: data.brand },
      {
        $setOnInsert: {
          brand_name: data.brand,
          created_at: now
        },
        $set: {
          brand_id: data.brand_id,
          updated_at: now
        },
        $inc: { total_products: 1 }
      },
      { upsert: true }
    );
    
    if (data.category) {
      const brandDoc = await BrandCategoryIndex.findOne({ brand_name: data.brand });
      const existingCat = brandDoc?.categories.find(c => c.category_name === data.category);
      
      if (existingCat) {
        await BrandCategoryIndex.updateOne(
          { brand_name: data.brand, 'categories.category_name': data.category },
          {
            $inc: { 'categories.$.product_count': 1 },
            $set: { 'categories.$.last_seen': now },
            $addToSet: { 'categories.$.styles': data.style }
          }
        );
      } else {
        await BrandCategoryIndex.updateOne(
          { brand_name: data.brand },
          {
            $push: {
              categories: {
                category_name: data.category,
                department: data.department,
                family: data.family,
                product_count: 1,
                styles: data.style ? [data.style] : [],
                first_seen: now,
                last_seen: now
              }
            }
          }
        );
      }
      
      // Update primary categories (top 5 by product count)
      const updated = await BrandCategoryIndex.findOne({ brand_name: data.brand });
      if (updated) {
        const sortedCategories = [...updated.categories].sort((a, b) => b.product_count - a.product_count);
        const primaryCategories = sortedCategories.slice(0, 5).map(c => c.category_name);
        await BrandCategoryIndex.updateOne(
          { brand_name: data.brand },
          { $set: { primary_categories: primaryCategories } }
        );
      }
    }
  }
  
  /**
   * Record individual verification for history/analysis
   */
  private async recordHistory(data: VerificationData, now: Date): Promise<void> {
    await VerificationHistory.create({
      sf_catalog_id: data.sf_catalog_id,
      model_number: data.model_number,
      brand: data.brand,
      category: data.category,
      category_id: data.category_id,
      department: data.department,
      family: data.family,
      subcategory: data.subcategory,
      style: data.style,
      style_id: data.style_id,
      openai_category: data.openai_category,
      openai_style: data.openai_style,
      xai_category: data.xai_category,
      xai_style: data.xai_style,
      ai_agreed: data.openai_category === data.xai_category,
      attributes: data.attributes,
      confidence_score: data.confidence_score,
      verification_timestamp: now
    });
  }
  
  // ===========================================================================
  // QUERY METHODS - For retrieving index data
  // ===========================================================================
  
  /**
   * Get full category profile with all associations
   */
  async getCategoryProfile(categoryName: string): Promise<ICategoryIndex | null> {
    return CategoryIndex.findOne({ category_name: categoryName });
  }
  
  /**
   * Get all styles for a category with occurrence counts
   */
  async getStylesForCategory(categoryName: string): Promise<{ style_name: string; count: number; in_sf: boolean }[]> {
    const category = await CategoryIndex.findOne({ category_name: categoryName });
    if (!category) return [];
    
    return category.styles.map(s => ({
      style_name: s.style_name,
      count: s.occurrence_count,
      in_sf: !!s.style_id
    })).sort((a, b) => b.count - a.count);
  }
  
  /**
   * Get full style profile
   */
  async getStyleProfile(styleName: string): Promise<IStyleIndex | null> {
    return StyleIndex.findOne({ style_name: styleName });
  }
  
  /**
   * Get full hierarchy tree
   */
  async getHierarchyTree(): Promise<any[]> {
    return HierarchyIndex.find({}).sort({ department: 1 });
  }
  
  /**
   * Get categories for a department/family
   */
  async getCategoriesInFamily(department: string, family: string): Promise<string[]> {
    const dept = await HierarchyIndex.findOne({ department });
    if (!dept) return [];
    
    const fam = dept.families.find(f => f.family_name === family);
    return fam?.categories.map(c => c.category_name) || [];
  }
  
  /**
   * Get brand specializations
   */
  async getBrandProfile(brandName: string): Promise<any> {
    return BrandCategoryIndex.findOne({ brand_name: brandName });
  }
  
  /**
   * Get trending styles (most recent/frequent)
   */
  async getTrendingStyles(limit: number = 20): Promise<any[]> {
    return StyleIndex.find({})
      .sort({ total_occurrences: -1, last_seen: -1 })
      .limit(limit)
      .select('style_name total_occurrences in_salesforce_picklist categories');
  }
  
  /**
   * Get styles NOT in Salesforce (candidates for creation)
   */
  async getStylesNotInSalesforce(): Promise<any[]> {
    return StyleIndex.find({ in_salesforce_picklist: false })
      .sort({ total_occurrences: -1 })
      .select('style_name total_occurrences categories');
  }
  
  /**
   * Get category-style matrix for analysis
   */
  async getCategoryStyleMatrix(): Promise<any[]> {
    return CategoryIndex.aggregate([
      { $unwind: '$styles' },
      {
        $group: {
          _id: '$category_name',
          department: { $first: '$department' },
          family: { $first: '$family' },
          total_products: { $first: '$total_products_verified' },
          styles: {
            $push: {
              name: '$styles.style_name',
              count: '$styles.occurrence_count',
              in_sf: { $cond: [{ $ne: ['$styles.style_id', null] }, true, false] }
            }
          }
        }
      },
      { $sort: { total_products: -1 } }
    ]);
  }
  
  /**
   * Get attribute distribution for a category
   */
  async getAttributeDistribution(categoryName: string): Promise<any[]> {
    const category = await CategoryIndex.findOne({ category_name: categoryName });
    if (!category) return [];
    
    return category.attributes.map(attr => ({
      attribute: attr.attribute_name,
      total_count: attr.occurrence_count,
      top_values: attr.common_values
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    }));
  }
  
  /**
   * Get verification history for analysis
   */
  async getVerificationHistory(filters: {
    category?: string;
    brand?: string;
    style?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    const query: any = {};
    
    if (filters.category) query.category = filters.category;
    if (filters.brand) query.brand = filters.brand;
    if (filters.style) query.style = filters.style;
    if (filters.startDate || filters.endDate) {
      query.verification_timestamp = {};
      if (filters.startDate) query.verification_timestamp.$gte = filters.startDate;
      if (filters.endDate) query.verification_timestamp.$lte = filters.endDate;
    }
    
    return VerificationHistory.find(query)
      .sort({ verification_timestamp: -1 })
      .limit(filters.limit || 100);
  }
  
  /**
   * Get summary statistics
   */
  async getIndexSummary(): Promise<any> {
    const [
      categoryCount,
      styleCount,
      brandCount,
      verificationCount,
      stylesNotInSf
    ] = await Promise.all([
      CategoryIndex.countDocuments(),
      StyleIndex.countDocuments(),
      BrandCategoryIndex.countDocuments(),
      VerificationHistory.countDocuments(),
      StyleIndex.countDocuments({ in_salesforce_picklist: false })
    ]);
    
    return {
      total_categories_indexed: categoryCount,
      total_styles_indexed: styleCount,
      total_brands_indexed: brandCount,
      total_verifications_recorded: verificationCount,
      styles_pending_sf_creation: stylesNotInSf,
      last_updated: new Date()
    };
  }
  
  /**
   * Backfill index from existing API tracker records
   * Useful for populating the index with historical data
   */
  async backfillFromApiTrackers(limit: number = 10): Promise<any> {
    const { APITracker } = await import('../models/api-tracker.model');
    
    // Get recent successful verifications
    const trackers = await APITracker.find({
      'response.success': true
    })
    .sort({ requestTimestamp: -1 })
    .limit(limit);
    
    let processed = 0;
    let errors = 0;
    const results: any[] = [];
    
    for (const tracker of trackers) {
      try {
        const request = tracker.request || {} as any;
        const response = tracker.response || {} as any;
        const responsePayload = response.responsePayload || {} as any;
        const primary = responsePayload.Primary_Attributes || {};
        const top15 = responsePayload.Top_Filter_Attributes || {};
        const verification = responsePayload.Verification || {};
        
        // Skip if no category (incomplete data)
        if (!primary.Category_Verified && !response.Category_Verified) {
          continue;
        }
        
        await this.recordVerification({
          sf_catalog_id: request.SF_Catalog_Id || '',
          model_number: request.Model_Number_Web_Retailer || request.SF_Catalog_Name || '',
          brand: primary.Brand_Verified || response.Brand_Verified || '',
          brand_id: primary.Brand_Id || null,
          category: primary.Category_Verified || response.Category_Verified || '',
          category_id: primary.Category_Id || null,
          department: primary.Department_Verified || '',
          family: primary.Product_Family_Verified || '',
          subcategory: primary.SubCategory_Verified || response.SubCategory_Verified || '',
          style: primary.Product_Style_Verified || '',
          style_id: primary.Style_Id || null,
          attributes: {
            ...top15,
            color: primary.Color_Verified,
            width: primary.Width_Verified,
            height: primary.Height_Verified,
            depth: primary.Depth_Verified
          },
          confidence_score: verification.confidence_scores?.consensus || 0.8,
          openai_category: tracker.openaiResult?.determinedCategory || '',
          openai_style: '',
          xai_category: tracker.xaiResult?.determinedCategory || '',
          xai_style: ''
        });
        
        processed++;
        results.push({
          sf_catalog_id: request.SF_Catalog_Id,
          brand: primary.Brand_Verified || response.Brand_Verified,
          category: primary.Category_Verified || response.Category_Verified,
          style: primary.Product_Style_Verified || '',
          timestamp: tracker.requestTimestamp
        });
      } catch (err) {
        errors++;
        logger.error('Failed to backfill record', { 
          error: err, 
          trackingId: tracker.trackingId 
        });
      }
    }
    
    return {
      total_found: trackers.length,
      processed,
      errors,
      records: results
    };
  }

  /**
   * SALESFORCE SYNC INTEGRATION
   * Updates the catalog index when SF syncs new picklist values
   * This is called from the picklist sync endpoint
   */
  
  /**
   * Mark styles as existing in Salesforce picklist
   * Called when SF sends updated style picklists via /api/picklists/sync
   */
  async syncSalesforceStyles(styles: Array<{ style_id: string; style_name: string }>): Promise<{
    updated: number;
    new_in_sf: string[];
    already_in_sf: string[];
    not_in_index: string[];
  }> {
    const result = {
      updated: 0,
      new_in_sf: [] as string[],
      already_in_sf: [] as string[],
      not_in_index: [] as string[]
    };

    for (const sfStyle of styles) {
      const styleName = sfStyle.style_name;
      
      // Check if this style exists in our index
      const existingStyle = await StyleIndex.findOne({ style_name: styleName });
      
      if (existingStyle) {
        if (existingStyle.in_salesforce_picklist) {
          result.already_in_sf.push(styleName);
        } else {
          // Update - this style is now in SF!
          await StyleIndex.updateOne(
            { style_name: styleName },
            {
              $set: {
                in_salesforce_picklist: true,
                style_id: sfStyle.style_id,
                updated_at: new Date()
              }
            }
          );
          result.new_in_sf.push(styleName);
          result.updated++;
          
          logger.info('Style now in Salesforce picklist', {
            style_name: styleName,
            style_id: sfStyle.style_id
          });
        }
      } else {
        // Style is in SF but not in our index (no products verified with it yet)
        result.not_in_index.push(styleName);
      }
    }

    logger.info('Catalog index updated from SF style sync', {
      total_sf_styles: styles.length,
      updated: result.updated,
      new_in_sf: result.new_in_sf.length,
      already_in_sf: result.already_in_sf.length,
      not_in_index: result.not_in_index.length
    });

    return result;
  }

  /**
   * Mark categories as existing in Salesforce picklist
   */
  async syncSalesforceCategories(categories: Array<{ 
    category_id: string; 
    category_name: string;
    department: string;
    family: string;
  }>): Promise<{
    updated: number;
    categories_updated: string[];
  }> {
    let updated = 0;
    const categoriesUpdated: string[] = [];

    for (const sfCat of categories) {
      const result = await CategoryIndex.updateOne(
        { category_name: sfCat.category_name },
        {
          $set: {
            category_id: sfCat.category_id,
            department: sfCat.department,
            family: sfCat.family,
            in_salesforce_picklist: true,
            updated_at: new Date()
          }
        }
      );

      if (result.modifiedCount > 0) {
        updated++;
        categoriesUpdated.push(sfCat.category_name);
      }
    }

    logger.info('Catalog index updated from SF category sync', {
      total_sf_categories: categories.length,
      categories_updated: updated
    });

    return { updated, categories_updated: categoriesUpdated };
  }

  /**
   * Get pending styles that need to be added to SF
   * Returns styles that exist in our index but are not in SF picklist
   */
  async getPendingStylesForSalesforce(): Promise<Array<{
    style_name: string;
    occurrence_count: number;
    categories: string[];
    first_seen: Date;
    last_seen: Date;
  }>> {
    const pendingStyles = await StyleIndex.find({ 
      in_salesforce_picklist: { $ne: true }
    })
    .sort({ total_occurrences: -1 })
    .limit(100);

    return pendingStyles.map(s => ({
      style_name: s.style_name,
      occurrence_count: s.total_occurrences,
      categories: s.categories.map(c => c.category_name),
      first_seen: s.first_seen,
      last_seen: s.last_seen
    }));
  }

  /**
   * Get sync status - compare our index with SF picklists
   */
  async getSyncStatus(): Promise<{
    styles_in_index: number;
    styles_in_sf: number;
    styles_pending_sf: number;
    categories_in_index: number;
    recent_sf_syncs: Array<{ style_name: string; synced_at: Date }>;
  }> {
    const [totalStyles, stylesInSF, totalCategories] = await Promise.all([
      StyleIndex.countDocuments(),
      StyleIndex.countDocuments({ in_salesforce_picklist: true }),
      CategoryIndex.countDocuments()
    ]);

    // Get recently synced styles (last 7 days)
    const recentSyncs = await StyleIndex.find({
      in_salesforce_picklist: true,
      updated_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ updated_at: -1 })
    .limit(20)
    .select('style_name updated_at');

    return {
      styles_in_index: totalStyles,
      styles_in_sf: stylesInSF,
      styles_pending_sf: totalStyles - stylesInSF,
      categories_in_index: totalCategories,
      recent_sf_syncs: recentSyncs.map(s => ({
        style_name: s.style_name,
        synced_at: s.updated_at
      }))
    };
  }
}

export const catalogIndexService = new CatalogIndexService();
