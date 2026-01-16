/**
 * Research Service
 * 
 * Provides real capabilities for:
 * - Fetching and parsing web pages (product pages, manufacturer sites)
 * - Downloading and extracting text from PDF documents
 * - Analyzing images using vision AI (grok-2-vision or gpt-4o)
 * - Web search using search-enabled models
 * 
 * This enables the AI to work with ACTUAL data from external sources,
 * not just the text we pass in the prompt.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import config from '../config';
import logger from '../utils/logger';
import aiUsageTracker from './ai-usage-tracking.service';

// PDF parsing - we'll use pdf-parse for extracting text
let pdfParse: ((buffer: Buffer) => Promise<{ text: string; numpages: number }>) | null = null;
try {
  // pdf-parse exports default function
  const pdfModule = require('pdf-parse');
  pdfParse = pdfModule.default || pdfModule;
  logger.info('PDF parsing enabled');
} catch (err) {
  logger.warn('pdf-parse not installed - PDF extraction disabled', { error: err });
}

// User agent to avoid being blocked
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface WebPageContent {
  url: string;
  title: string;
  description: string;
  specifications: Record<string, string>;
  features: string[];
  rawText: string;
  success: boolean;
  error?: string;
}

interface PDFContent {
  url: string;
  filename: string;
  text: string;
  pageCount: number;
  specifications: Record<string, string>;
  success: boolean;
  error?: string;
}

interface ImageAnalysis {
  url: string;
  description: string;
  detectedColor: string | null;
  detectedFinish: string | null;
  detectedFeatures: string[];
  productType: string | null;
  confidence: number;
  success: boolean;
  error?: string;
}

export interface ResearchResult {
  webPages: WebPageContent[];
  documents: PDFContent[];
  images: ImageAnalysis[];
  combinedSpecifications: Record<string, string>;
  combinedFeatures: string[];
  researchSummary: string;
}

// Timeout for requests
const REQUEST_TIMEOUT = config.research?.requestTimeout || 15000;

/**
 * Fetch and parse a web page to extract product information
 */
export async function fetchWebPage(url: string): Promise<WebPageContent> {
  const startTime = Date.now();
  
  try {
    if (!url || url === '(not provided)' || !url.startsWith('http')) {
      return {
        url,
        title: '',
        description: '',
        specifications: {},
        features: [],
        rawText: '',
        success: false,
        error: 'Invalid or missing URL'
      };
    }

    logger.info('Fetching web page', { url });

    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);

    // Extract title
    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  $('meta[property="og:title"]').attr('content') || '';

    // Extract description
    const description = $('meta[name="description"]').attr('content') ||
                        $('meta[property="og:description"]').attr('content') ||
                        $('[class*="description"]').first().text().trim().slice(0, 1000) || '';

    // Extract specifications from common patterns
    const specifications: Record<string, string> = {};
    
    // Pattern 1: Table rows with th/td or label/value
    $('table tr').each((_, row) => {
      const $row = $(row);
      const label = $row.find('th, td:first-child, .spec-label, .label').first().text().trim();
      const value = $row.find('td:last-child, .spec-value, .value').last().text().trim();
      if (label && value && label !== value) {
        specifications[label] = value;
      }
    });

    // Pattern 2: Definition lists
    $('dl').each((_, dl) => {
      $(dl).find('dt').each((_, dt) => {
        const label = $(dt).text().trim();
        const value = $(dt).next('dd').text().trim();
        if (label && value) {
          specifications[label] = value;
        }
      });
    });

    // Pattern 3: Div pairs with class patterns
    $('[class*="spec"], [class*="attribute"], [class*="detail"]').each((_, el) => {
      const $el = $(el);
      const label = $el.find('[class*="label"], [class*="name"], [class*="key"]').first().text().trim();
      const value = $el.find('[class*="value"], [class*="data"]').first().text().trim();
      if (label && value && label !== value) {
        specifications[label] = value;
      }
    });

    // Pattern 4: JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, script) => {
      try {
        const jsonLd = JSON.parse($(script).html() || '{}');
        if (jsonLd['@type'] === 'Product') {
          if (jsonLd.name) specifications['Product Name'] = jsonLd.name;
          if (jsonLd.brand?.name) specifications['Brand'] = jsonLd.brand.name;
          if (jsonLd.sku) specifications['SKU'] = jsonLd.sku;
          if (jsonLd.gtin) specifications['GTIN'] = jsonLd.gtin;
          if (jsonLd.mpn) specifications['Model Number'] = jsonLd.mpn;
          if (jsonLd.color) specifications['Color'] = jsonLd.color;
          if (jsonLd.material) specifications['Material'] = jsonLd.material;
          if (jsonLd.weight?.value) specifications['Weight'] = `${jsonLd.weight.value} ${jsonLd.weight.unitCode || ''}`;
          if (jsonLd.offers?.price) specifications['Price'] = `$${jsonLd.offers.price}`;
          if (jsonLd.description) specifications['Description'] = jsonLd.description.slice(0, 500);
        }
      } catch {
        // Ignore JSON parse errors
      }
    });

    // Extract features from lists
    const features: string[] = [];
    $('ul li, [class*="feature"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10 && text.length < 200 && !text.includes('\n')) {
        features.push(text);
      }
    });

    // Get raw text for AI context (limited)
    const rawText = $('body').text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000);

    const processingTime = Date.now() - startTime;
    logger.info('Web page fetched successfully', { 
      url, 
      specsFound: Object.keys(specifications).length,
      featuresFound: features.length,
      processingTime 
    });

    return {
      url,
      title,
      description,
      specifications,
      features: features.slice(0, 20), // Limit to 20 features
      rawText,
      success: true
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to fetch web page', { url, error: errorMessage });
    
    return {
      url,
      title: '',
      description: '',
      specifications: {},
      features: [],
      rawText: '',
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Download and extract text from a PDF document
 */
export async function fetchPDF(url: string): Promise<PDFContent> {
  const startTime = Date.now();
  
  try {
    if (!url || !url.startsWith('http')) {
      return {
        url,
        filename: '',
        text: '',
        pageCount: 0,
        specifications: {},
        success: false,
        error: 'Invalid or missing URL'
      };
    }

    if (!pdfParse) {
      return {
        url,
        filename: url.split('/').pop() || 'unknown.pdf',
        text: '',
        pageCount: 0,
        specifications: {},
        success: false,
        error: 'PDF parsing library not available'
      };
    }

    logger.info('Fetching PDF document', { url });

    // Download PDF with retry logic
    const maxRetries = 3;
    let lastError: any = null;
    let response: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        response = await axios.get(url, {
          timeout: REQUEST_TIMEOUT * 3, // Longer timeout for PDFs (30 seconds)
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/pdf,*/*',
          },
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 400,
        });
        
        // Check if we actually got a PDF
        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('pdf') && !url.toLowerCase().endsWith('.pdf')) {
          throw new Error(`Response is not a PDF (content-type: ${contentType})`);
        }
        
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        logger.warn(`PDF fetch attempt ${attempt}/${maxRetries} failed`, { 
          url, 
          error: error.message,
          statusCode: error.response?.status
        });
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to fetch PDF after retries');
    }

    // Parse PDF
    const pdfData = await pdfParse(Buffer.from(response.data));
    const text = pdfData.text || '';
    const pageCount = pdfData.numpages || 0;
    const filename = url.split('/').pop() || 'document.pdf';

    // Extract specifications from PDF text using patterns
    const specifications: Record<string, string> = {};
    
    // Pattern: "Label: Value" or "Label - Value"
    const specPatterns = [
      /([A-Z][a-zA-Z\s]+):\s*([^\n:]+)/g,
      /([A-Z][a-zA-Z\s]+)\s*[-–]\s*([^\n-]+)/g,
    ];

    for (const pattern of specPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const label = match[1].trim();
        const value = match[2].trim();
        if (label.length > 2 && label.length < 50 && value.length > 0 && value.length < 200) {
          specifications[label] = value;
        }
      }
    }

    // Look for dimension patterns
    const dimensionPatterns = [
      /(?:width|w)[:\s]*(\d+\.?\d*)\s*(?:"|in|inch)/gi,
      /(?:height|h)[:\s]*(\d+\.?\d*)\s*(?:"|in|inch)/gi,
      /(?:depth|d)[:\s]*(\d+\.?\d*)\s*(?:"|in|inch)/gi,
      /(\d+\.?\d*)\s*["']?\s*[xX]\s*(\d+\.?\d*)\s*["']?\s*[xX]\s*(\d+\.?\d*)\s*["']?/g,
    ];

    for (const pattern of dimensionPatterns) {
      const match = pattern.exec(text);
      if (match) {
        if (match[3]) {
          // WxHxD format
          specifications['Dimensions'] = `${match[1]}" x ${match[2]}" x ${match[3]}"`;
        }
      }
    }

    const processingTime = Date.now() - startTime;
    logger.info('PDF document parsed successfully', { 
      url, 
      filename,
      pageCount,
      textLength: text.length,
      specsFound: Object.keys(specifications).length,
      processingTime 
    });

    return {
      url,
      filename,
      text: text.slice(0, 10000), // Limit text to 10k chars
      pageCount,
      specifications,
      success: true
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to fetch PDF', { url, error: errorMessage });
    
    return {
      url,
      filename: url.split('/').pop() || 'unknown.pdf',
      text: '',
      pageCount: 0,
      specifications: {},
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Analyze an image using Vision AI
 * Prefers xAI's grok-2-vision (fastest: ~870ms) over GPT-4o (~2.5s)
 */
export async function analyzeImage(imageUrl: string, sessionId?: string): Promise<ImageAnalysis> {
  const startTime = Date.now();
  
  try {
    if (!imageUrl || !imageUrl.startsWith('http')) {
      return {
        url: imageUrl,
        description: '',
        detectedColor: null,
        detectedFinish: null,
        detectedFeatures: [],
        productType: null,
        confidence: 0,
        success: false,
        error: 'Invalid or missing image URL'
      };
    }

    // Validate image URL is accessible before sending to AI
    try {
      const headResponse = await axios.head(imageUrl, {
        timeout: 5000,
        headers: { 'User-Agent': USER_AGENT },
        validateStatus: (status) => status >= 200 && status < 400
      });
      
      const contentType = headResponse.headers['content-type'] || '';
      if (!contentType.includes('image')) {
        logger.warn('URL does not appear to be an image', { imageUrl, contentType });
      }
    } catch (error: any) {
      logger.warn('Image URL accessibility check failed', { 
        imageUrl, 
        error: error.message,
        statusCode: error.response?.status
      });
      
      // If image is not accessible, return early
      if (error.response?.status === 404 || error.response?.status === 403) {
        return {
          url: imageUrl,
          description: '',
          detectedColor: null,
          detectedFinish: null,
          detectedFeatures: [],
          productType: null,
          confidence: 0,
          success: false,
          error: `Image not accessible (HTTP ${error.response.status})`
        };
      }
    }

    // Determine which vision model to use (prefer grok-2-vision for speed)
    const useGrokVision = config.xai?.apiKey && config.xai?.visionModel;
    const provider = useGrokVision ? 'xai' : 'openai';
    const model = useGrokVision 
      ? (config.xai?.visionModel || 'grok-2-vision-1212')
      : (config.openai?.visionModel || 'gpt-4o');

    if (!useGrokVision && !config.openai?.apiKey) {
      return {
        url: imageUrl,
        description: '',
        detectedColor: null,
        detectedFinish: null,
        detectedFeatures: [],
        productType: null,
        confidence: 0,
        success: false,
        error: 'No vision API key configured'
      };
    }

    logger.info('Analyzing image with vision AI', { imageUrl, provider, model });

    const client = useGrokVision
      ? new OpenAI({ apiKey: config.xai!.apiKey, baseURL: 'https://api.x.ai/v1' })
      : new OpenAI({ apiKey: config.openai!.apiKey });

    const prompt = `You are a product image analyst. Analyze the product image and extract:
1. Product type/category
2. Color (exact shade: "Stainless Steel", "Matte Black", "White", etc.)
3. Finish (e.g., "Brushed", "Polished", "Matte", "Glossy")
4. Visible features and details
5. Brief description

Respond in JSON format:
{
  "description": "Brief product description",
  "productType": "Category name",
  "color": "Detected color",
  "finish": "Detected finish",
  "features": ["feature1", "feature2"],
  "confidence": 0.0-1.0
}`;

    // Start AI usage tracking
    const usageId = aiUsageTracker.startAICall({
      sessionId: sessionId || 'research',
      provider: provider as 'openai' | 'xai',
      model,
      taskType: 'image-analysis',
      prompt,
      imageUrls: [imageUrl],
    });

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            },
            {
              type: 'text',
              text: 'Analyze this product image and extract color, finish, features, and product type.'
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    let parsed: any;
    let jsonValid = false;
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      jsonValid = true;
    } catch {
      parsed = { description: content, confidence: 0.5 };
    }

    // Complete AI usage tracking
    await aiUsageTracker.completeAICall(usageId, {
      response: content,
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      outcome: 'success',
      jsonValid,
      confidenceScore: (parsed.confidence || 0.7) * 100,
    });

    const processingTime = Date.now() - startTime;
    logger.info('Image analysis completed', { 
      imageUrl, 
      productType: parsed.productType,
      color: parsed.color,
      processingTime,
      provider,
      model
    });

    return {
      url: imageUrl,
      description: parsed.description || '',
      detectedColor: parsed.color || null,
      detectedFinish: parsed.finish || null,
      detectedFeatures: parsed.features || [],
      productType: parsed.productType || null,
      confidence: parsed.confidence || 0.7,
      success: true
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to analyze image', { imageUrl, error: errorMessage });
    
    return {
      url: imageUrl,
      description: '',
      detectedColor: null,
      detectedFinish: null,
      detectedFeatures: [],
      productType: null,
      confidence: 0,
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Perform comprehensive research on a product
 * Fetches web pages, PDFs, and analyzes images
 */
export async function performProductResearch(
  fergusonUrl: string | null,
  referenceUrl: string | null,
  documentUrls: string[],
  imageUrls: string[],
  options: {
    maxDocuments?: number;
    maxImages?: number;
    skipImages?: boolean;
  } = {}
): Promise<ResearchResult> {
  const startTime = Date.now();
  const maxDocuments = options.maxDocuments || 3;
  const maxImages = options.maxImages || 2; // Limit image analysis to save costs
  const skipImages = options.skipImages || false;

  logger.info('Starting product research', { 
    fergusonUrl, 
    referenceUrl, 
    documentCount: documentUrls.length,
    imageCount: imageUrls.length 
  });

  // Fetch web pages in parallel
  const webPagePromises: Promise<WebPageContent>[] = [];
  if (fergusonUrl) webPagePromises.push(fetchWebPage(fergusonUrl));
  if (referenceUrl) webPagePromises.push(fetchWebPage(referenceUrl));

  // Fetch PDFs (limit to maxDocuments)
  const pdfPromises = documentUrls
    .filter(url => url && url.toLowerCase().endsWith('.pdf'))
    .slice(0, maxDocuments)
    .map(url => fetchPDF(url));

  // Fetch non-PDF document pages
  const docPagePromises = documentUrls
    .filter(url => url && !url.toLowerCase().endsWith('.pdf'))
    .slice(0, maxDocuments)
    .map(url => fetchWebPage(url));

  // Analyze images (if enabled, limit to maxImages)
  const imagePromises = skipImages ? [] : 
    imageUrls.slice(0, maxImages).map(url => analyzeImage(url));

  // Execute all requests in parallel
  const [webPages, pdfs, docPages, images] = await Promise.all([
    Promise.all(webPagePromises),
    Promise.all(pdfPromises),
    Promise.all(docPagePromises),
    Promise.all(imagePromises)
  ]);

  // Combine all web page results
  const allWebPages = [...webPages, ...docPages];

  // Combine specifications from all sources
  const combinedSpecifications: Record<string, string> = {};
  
  // Priority: Ferguson > Reference URL > Documents
  for (const page of allWebPages.reverse()) {
    if (page.success) {
      Object.assign(combinedSpecifications, page.specifications);
    }
  }
  
  for (const pdf of pdfs) {
    if (pdf.success) {
      Object.assign(combinedSpecifications, pdf.specifications);
    }
  }

  // Add image-detected attributes
  for (const image of images) {
    if (image.success) {
      if (image.detectedColor && !combinedSpecifications['Color']) {
        combinedSpecifications['Color (from image)'] = image.detectedColor;
      }
      if (image.detectedFinish && !combinedSpecifications['Finish']) {
        combinedSpecifications['Finish (from image)'] = image.detectedFinish;
      }
      if (image.productType && !combinedSpecifications['Product Type']) {
        combinedSpecifications['Product Type (from image)'] = image.productType;
      }
    }
  }

  // Combine features
  const combinedFeatures: string[] = [];
  for (const page of allWebPages) {
    if (page.success) {
      combinedFeatures.push(...page.features);
    }
  }
  for (const image of images) {
    if (image.success) {
      combinedFeatures.push(...image.detectedFeatures);
    }
  }
  // Dedupe features
  const uniqueFeatures = [...new Set(combinedFeatures)].slice(0, 30);

  // Build research summary
  const successfulSources: string[] = [];
  if (webPages.some(p => p.success)) successfulSources.push('product pages');
  if (pdfs.some(p => p.success)) successfulSources.push('PDF documents');
  if (images.some(i => i.success)) successfulSources.push('image analysis');

  const researchSummary = successfulSources.length > 0
    ? `Research completed using: ${successfulSources.join(', ')}. Found ${Object.keys(combinedSpecifications).length} specifications and ${uniqueFeatures.length} features.`
    : 'No external data could be retrieved.';

  const processingTime = Date.now() - startTime;
  logger.info('Product research completed', {
    processingTime,
    webPagesSuccess: webPages.filter(p => p.success).length,
    pdfsSuccess: pdfs.filter(p => p.success).length,
    imagesSuccess: images.filter(i => i.success).length,
    totalSpecs: Object.keys(combinedSpecifications).length
  });

  return {
    webPages: allWebPages,
    documents: pdfs,
    images,
    combinedSpecifications,
    combinedFeatures: uniqueFeatures,
    researchSummary
  };
}

/**
 * Web Search Result interface
 */
export interface WebSearchResult {
  query: string;
  results: string;
  specifications: Record<string, string>;
  success: boolean;
  error?: string;
}

/**
 * Perform a real web search using GPT-4o-search-preview
 * This model can actually search the internet and return real results
 */
export async function performWebSearch(
  brand: string,
  modelNumber: string,
  productName?: string,
  sessionId?: string
): Promise<WebSearchResult> {
  const startTime = Date.now();
  
  try {
    if (!config.openai?.apiKey) {
      return {
        query: '',
        results: '',
        specifications: {},
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    // Build search query
    const searchQuery = [brand, modelNumber, productName, 'specifications']
      .filter(Boolean)
      .join(' ');

    logger.info('Performing web search', { searchQuery });

    const openai = new OpenAI({ apiKey: config.openai.apiKey });
    const model = config.openai.searchModel || 'gpt-4o-mini-search-preview';

    // Start AI usage tracking
    const usageId = aiUsageTracker.startAICall({
      sessionId: sessionId || 'research',
      provider: 'openai',
      model,
      taskType: 'research',
      prompt: searchQuery,
      searchQuery,
    });

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a product researcher. Search the web for detailed product specifications.
Return the results in JSON format:
{
  "brand": "Brand name",
  "modelNumber": "Model number",
  "productType": "Product category",
  "specifications": {
    "key1": "value1",
    "key2": "value2"
  },
  "features": ["feature1", "feature2"],
  "dimensions": {
    "width": "value",
    "height": "value",
    "depth": "value"
  },
  "sources": ["url1", "url2"]
}`
        },
        {
          role: 'user',
          content: `Search for specifications and details for: ${searchQuery}`
        }
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    let parsed: any = {};
    let jsonValid = false;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
      jsonValid = true;
    } catch {
      // Not JSON, use raw content
      parsed = { rawResults: content };
    }

    // Complete AI usage tracking
    await aiUsageTracker.completeAICall(usageId, {
      response: content,
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      outcome: 'success',
      jsonValid,
    });

    const processingTime = Date.now() - startTime;
    logger.info('Web search completed', { 
      searchQuery, 
      processingTime,
      specsFound: Object.keys(parsed.specifications || {}).length
    });

    return {
      query: searchQuery,
      results: content,
      specifications: parsed.specifications || {},
      success: true,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Web search failed', { error: errorMessage });
    
    return {
      query: '',
      results: '',
      specifications: {},
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Format research results as context for AI prompt
 */
export function formatResearchForPrompt(research: ResearchResult): string {
  const sections: string[] = [];

  // Web page data
  const successfulPages = research.webPages.filter(p => p.success);
  if (successfulPages.length > 0) {
    sections.push('## RESEARCHED WEB PAGE DATA (Verified External Sources)\n');
    for (const page of successfulPages) {
      sections.push(`### From: ${page.url}`);
      if (page.title) sections.push(`Title: ${page.title}`);
      if (page.description) sections.push(`Description: ${page.description.slice(0, 500)}`);
      if (Object.keys(page.specifications).length > 0) {
        sections.push('Specifications:');
        for (const [key, value] of Object.entries(page.specifications).slice(0, 30)) {
          sections.push(`- ${key}: ${value}`);
        }
      }
      sections.push('');
    }
  }

  // PDF document data
  const successfulPdfs = research.documents.filter(d => d.success);
  if (successfulPdfs.length > 0) {
    sections.push('## RESEARCHED DOCUMENT DATA (From PDFs/Spec Sheets)\n');
    for (const pdf of successfulPdfs) {
      sections.push(`### From: ${pdf.filename} (${pdf.pageCount} pages)`);
      if (Object.keys(pdf.specifications).length > 0) {
        sections.push('Extracted Specifications:');
        for (const [key, value] of Object.entries(pdf.specifications).slice(0, 20)) {
          sections.push(`- ${key}: ${value}`);
        }
      }
      if (pdf.text) {
        sections.push(`\nRelevant Text Excerpt:\n${pdf.text.slice(0, 2000)}...`);
      }
      sections.push('');
    }
  }

  // Image analysis data
  const successfulImages = research.images.filter(i => i.success);
  if (successfulImages.length > 0) {
    sections.push('## IMAGE ANALYSIS RESULTS (AI Vision Analysis)\n');
    for (const image of successfulImages) {
      sections.push(`### Image: ${image.url.split('/').pop()}`);
      sections.push(`Description: ${image.description}`);
      if (image.productType) sections.push(`Product Type: ${image.productType}`);
      if (image.detectedColor) sections.push(`Detected Color: ${image.detectedColor}`);
      if (image.detectedFinish) sections.push(`Detected Finish: ${image.detectedFinish}`);
      if (image.detectedFeatures.length > 0) {
        sections.push(`Visible Features: ${image.detectedFeatures.join(', ')}`);
      }
      sections.push(`Confidence: ${Math.round(image.confidence * 100)}%`);
      sections.push('');
    }
  }

  // Combined specifications summary
  if (Object.keys(research.combinedSpecifications).length > 0) {
    sections.push('## COMBINED SPECIFICATIONS FROM ALL SOURCES\n');
    for (const [key, value] of Object.entries(research.combinedSpecifications)) {
      sections.push(`- ${key}: ${value}`);
    }
    sections.push('');
  }

  if (sections.length === 0) {
    return '## EXTERNAL RESEARCH\nNo external data could be retrieved from URLs or documents.';
  }

  return sections.join('\n');
}

export default {
  fetchWebPage,
  fetchPDF,
  analyzeImage,
  performProductResearch,
  formatResearchForPrompt
};
