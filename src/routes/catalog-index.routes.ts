import { Router, Request, Response } from 'express';
import { catalogIndexService } from '../services/catalog-index.service';
import logger from '../utils/logger';

const router = Router();

/**
 * CATALOG INDEX API ROUTES
 * 
 * Internal endpoints to query the catalog intelligence index
 */

// GET /api/catalog-index/summary
// Get overall index statistics
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const summary = await catalogIndexService.getIndexSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Failed to get index summary', { error });
    res.status(500).json({ success: false, error: 'Failed to get summary' });
  }
});

// GET /api/catalog-index/hierarchy
// Get full Department → Family → Category tree
router.get('/hierarchy', async (_req: Request, res: Response) => {
  try {
    const hierarchy = await catalogIndexService.getHierarchyTree();
    res.json({ success: true, data: hierarchy });
  } catch (error) {
    logger.error('Failed to get hierarchy', { error });
    res.status(500).json({ success: false, error: 'Failed to get hierarchy' });
  }
});

// GET /api/catalog-index/category/:name
// Get full profile for a specific category
router.get('/category/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const profile = await catalogIndexService.getCategoryProfile(decodeURIComponent(name));
    
    if (!profile) {
      res.status(404).json({ success: false, error: 'Category not found in index' });
      return;
    }
    
    res.json({ success: true, data: profile });
  } catch (error) {
    logger.error('Failed to get category profile', { error });
    res.status(500).json({ success: false, error: 'Failed to get category profile' });
  }
});

// GET /api/catalog-index/category/:name/styles
// Get all styles seen with a category
router.get('/category/:name/styles', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const styles = await catalogIndexService.getStylesForCategory(decodeURIComponent(name));
    res.json({ success: true, data: styles });
  } catch (error) {
    logger.error('Failed to get category styles', { error });
    res.status(500).json({ success: false, error: 'Failed to get styles' });
  }
});

// GET /api/catalog-index/category/:name/attributes
// Get attribute distribution for a category
router.get('/category/:name/attributes', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const attributes = await catalogIndexService.getAttributeDistribution(decodeURIComponent(name));
    res.json({ success: true, data: attributes });
  } catch (error) {
    logger.error('Failed to get category attributes', { error });
    res.status(500).json({ success: false, error: 'Failed to get attributes' });
  }
});

// GET /api/catalog-index/style/:name
// Get full profile for a specific style
router.get('/style/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const profile = await catalogIndexService.getStyleProfile(decodeURIComponent(name));
    
    if (!profile) {
      res.status(404).json({ success: false, error: 'Style not found in index' });
      return;
    }
    
    res.json({ success: true, data: profile });
  } catch (error) {
    logger.error('Failed to get style profile', { error });
    res.status(500).json({ success: false, error: 'Failed to get style profile' });
  }
});

// GET /api/catalog-index/styles/trending
// Get trending styles by occurrence
router.get('/styles/trending', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const styles = await catalogIndexService.getTrendingStyles(limit);
    res.json({ success: true, data: styles });
  } catch (error) {
    logger.error('Failed to get trending styles', { error });
    res.status(500).json({ success: false, error: 'Failed to get trending styles' });
  }
});

// GET /api/catalog-index/styles/pending
// Get styles NOT in Salesforce picklist (candidates for creation)
router.get('/styles/pending', async (_req: Request, res: Response) => {
  try {
    const styles = await catalogIndexService.getStylesNotInSalesforce();
    res.json({ 
      success: true, 
      data: styles,
      message: 'Styles seen in verifications but not yet in Salesforce picklist'
    });
  } catch (error) {
    logger.error('Failed to get pending styles', { error });
    res.status(500).json({ success: false, error: 'Failed to get pending styles' });
  }
});

// GET /api/catalog-index/matrix/category-style
// Get category-style association matrix
router.get('/matrix/category-style', async (_req: Request, res: Response) => {
  try {
    const matrix = await catalogIndexService.getCategoryStyleMatrix();
    res.json({ success: true, data: matrix });
  } catch (error) {
    logger.error('Failed to get category-style matrix', { error });
    res.status(500).json({ success: false, error: 'Failed to get matrix' });
  }
});

// GET /api/catalog-index/brand/:name
// Get brand profile with category specializations
router.get('/brand/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const profile = await catalogIndexService.getBrandProfile(decodeURIComponent(name));
    
    if (!profile) {
      res.status(404).json({ success: false, error: 'Brand not found in index' });
      return;
    }
    
    res.json({ success: true, data: profile });
  } catch (error) {
    logger.error('Failed to get brand profile', { error });
    res.status(500).json({ success: false, error: 'Failed to get brand profile' });
  }
});

// GET /api/catalog-index/history
// Get verification history with filters
router.get('/history', async (req: Request, res: Response) => {
  try {
    const filters = {
      category: req.query.category as string,
      brand: req.query.brand as string,
      style: req.query.style as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      limit: parseInt(req.query.limit as string) || 100
    };
    
    const history = await catalogIndexService.getVerificationHistory(filters);
    res.json({ success: true, data: history, count: history.length });
  } catch (error) {
    logger.error('Failed to get verification history', { error });
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

// GET /api/catalog-index/family/:department/:family
// Get categories within a specific family
router.get('/family/:department/:family', async (req: Request, res: Response) => {
  try {
    const { department, family } = req.params;
    const categories = await catalogIndexService.getCategoriesInFamily(
      decodeURIComponent(department),
      decodeURIComponent(family)
    );
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Failed to get family categories', { error });
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
});

// POST /api/catalog-index/backfill
// Backfill index from recent API tracker records
router.post('/backfill', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await catalogIndexService.backfillFromApiTrackers(limit);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to backfill catalog index', { error });
    res.status(500).json({ success: false, error: 'Failed to backfill' });
  }
});

export default router;
