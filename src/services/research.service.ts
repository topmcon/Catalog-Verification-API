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
 * 
 * LEARNING SYSTEM: Failures are tracked in MongoDB for continuous improvement.
 * 
 * HEADLESS BROWSER: For JavaScript-rendered sites (Signature Hardware, etc.)
 * we use Puppeteer to get the fully rendered page content.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import config from '../config';
import logger from '../utils/logger';
import aiUsageTracker from './ai-usage-tracking.service';
import { ScrapeFailure } from '../models/scrape-failure.model';

// Puppeteer for JavaScript-rendered sites
let puppeteer: typeof import('puppeteer-core') | null = null;
try {
  puppeteer = require('puppeteer-core');
  logger.info('Puppeteer headless browser enabled');
} catch (err) {
  logger.warn('puppeteer-core not installed - JS rendering disabled', { error: err });
}

// PDF parsing - we'll use pdf-parse for extracting text
let pdfParse: ((buffer: Buffer) => Promise<{ text: string; numpages: number }>) | null = null;
try {
  // pdf-parse exports default function - try multiple import patterns
  const pdfModule = require('pdf-parse');
  
  // Handle different export patterns
  if (typeof pdfModule === 'function') {
    pdfParse = pdfModule;
  } else if (typeof pdfModule.default === 'function') {
    pdfParse = pdfModule.default;
  } else if (typeof pdfModule.pdf === 'function') {
    pdfParse = pdfModule.pdf;
  }
  
  if (pdfParse) {
    logger.info('PDF parsing enabled');
  } else {
    logger.warn('PDF parse function not found in module', { moduleKeys: Object.keys(pdfModule) });
  }
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

// List of known anti-bot domains that require special handling or JS rendering
const ANTI_BOT_DOMAINS = [
  'signaturehardware.com',
  'build.com',
  'wayfair.com',
  'homedepot.com',
  'lowes.com'
];

// Domains that REQUIRE JavaScript rendering to get specs
const JS_REQUIRED_DOMAINS = [
  'signaturehardware.com',
  'build.com'
];

// Alternative user agents to try on retry
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

/**
 * Check if URL is from an anti-bot protected domain
 */
function isAntiBotDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return ANTI_BOT_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Check if URL requires JavaScript rendering
 */
function requiresJsRendering(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return JS_REQUIRED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Fetch page content using headless browser (for JavaScript-rendered sites)
 * This is slower but can capture dynamically loaded content
 * Includes logic to expand accordions/collapsible sections before scraping
 */
async function fetchWithHeadlessBrowser(url: string): Promise<{ html: string; success: boolean; error?: string }> {
  if (!puppeteer) {
    return { html: '', success: false, error: 'Puppeteer not available' };
  }

  let browser = null;
  try {
    logger.info('Using headless browser for JS-rendered site', { url });
    
    // Try to find Chrome/Chromium executable
    const executablePaths = [
      '/snap/bin/chromium',           // Ubuntu snap installation
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      process.env.CHROME_PATH
    ].filter(Boolean) as string[];
    
    let executablePath: string | undefined;
    const fs = require('fs');
    for (const path of executablePaths) {
      if (fs.existsSync(path)) {
        executablePath = path;
        break;
      }
    }
    
    if (!executablePath) {
      logger.warn('No Chrome/Chromium executable found for headless browsing');
      return { html: '', success: false, error: 'No browser executable found' };
    }

    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });

    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent(USER_AGENTS[0]);
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate with wait for network idle
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 20000  // 20 second timeout (reduced from 30s)
    });
    
    // Wait for page to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2000ms
    
    // Check if page was redirected or blocked
    const currentUrl = page.url();
    if (!currentUrl.includes('signaturehardware.com') && url.includes('signaturehardware.com')) {
      logger.warn('Page redirected, may be blocked', { originalUrl: url, redirectedTo: currentUrl });
    }
    
    // =========================================
    // EXPAND ALL COLLAPSIBLE SECTIONS
    // =========================================
    logger.info('Expanding collapsible sections', { url });
    
    let expandedCount = 0;
    let secondRoundClicks = 0;
    
    try {
    // Use string-based evaluate to avoid TypeScript DOM type issues
    expandedCount = await page.evaluate(`
      (function() {
        let clicked = 0;
        
        // Common selectors for expandable elements
        const expandSelectors = [
          '[data-toggle="collapse"]',
          '[aria-expanded="false"]',
          '.accordion-button.collapsed',
          '.accordion-header',
          '.accordion-trigger',
          '.collapse-toggle',
          '.expandable-header',
          'button[class*="expand"]',
          'button[class*="show"]',
          'button[class*="more"]',
          'button[class*="details"]',
          'button[class*="specs"]',
          'button[class*="feature"]',
          'a[class*="expand"]',
          'a[class*="show-more"]',
          '.product-specs-toggle',
          '.product-details-toggle',
          '.specifications-header',
          '.features-header',
          '.details-header'
        ];
        
        // Text patterns that indicate expandable sections
        const expandTextPatterns = [
          /^features$/i,
          /^specifications$/i,
          /^specs$/i,
          /^dimensions$/i,
          /^details$/i,
          /^resources$/i,
          /^show more$/i,
          /^view more$/i,
          /^expand$/i,
          /^see more$/i,
          /^all features$/i,
          /^all specifications$/i,
          /^show all$/i
        ];
        
        // First pass: Click elements matching selectors
        for (const selector of expandSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(function(el) {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                const ariaExpanded = el.getAttribute('aria-expanded');
                if (ariaExpanded === 'false' || !ariaExpanded) {
                  try { el.click(); clicked++; } catch (e) {}
                }
              }
            });
          } catch (e) {}
        }
        
        // Second pass: Find elements by text content
        const allClickable = document.querySelectorAll('button, a, [role="button"], [onclick], [class*="toggle"], [class*="accordion"]');
        allClickable.forEach(function(el) {
          const text = (el.textContent || '').trim();
          const ariaLabel = el.getAttribute('aria-label') || '';
          const checkText = text + ' ' + ariaLabel;
          
          for (const pattern of expandTextPatterns) {
            if (pattern.test(checkText)) {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                const ariaExpanded = el.getAttribute('aria-expanded');
                if (ariaExpanded !== 'true') {
                  try { el.click(); clicked++; } catch (e) {}
                }
              }
              break;
            }
          }
        });
        
        // Scroll to load lazy content
        window.scrollTo(0, document.body.scrollHeight / 2);
        
        return clicked;
      })()
    `) as number;
    
    logger.info('Expandable sections clicked', { url, expandedCount });
    
    // Wait for expanded content to load (reduced from 2000ms)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Scroll down to trigger any lazy-loaded content
    await page.evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms
    
    // Scroll back up
    await page.evaluate(`window.scrollTo(0, 0)`);
    await new Promise(resolve => setTimeout(resolve, 250)); // Reduced from 500ms
    
    // Second round of clicking (some accordions reveal more accordions)
    secondRoundClicks = await page.evaluate(`
      (function() {
        let clicked = 0;
        const expandable = document.querySelectorAll('[aria-expanded="false"], .collapsed, [class*="collapsed"]');
        expandable.forEach(function(el) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            try { el.click(); clicked++; } catch (e) {}
          }
        });
        return clicked;
      })()
    `) as number;
    
    if (secondRoundClicks > 0) {
      logger.info('Second round expandable sections clicked', { url, secondRoundClicks });
      await new Promise(resolve => setTimeout(resolve, 800)); // Reduced from 1500ms
    }
    
    } catch (expandError) {
      // Expansion failed but we can still try to get the HTML
      logger.warn('Accordion expansion failed, continuing with current content', { 
        url, 
        error: expandError instanceof Error ? expandError.message : 'Unknown error' 
      });
    }
    
    // Get the fully rendered HTML
    const html = await page.content();
    
    logger.info('Headless browser fetch complete', { 
      url, 
      contentLength: html.length,
      expandedSections: expandedCount + secondRoundClicks
    });
    
    return { html, success: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Headless browser fetch failed', { url, error: errorMessage });
    return { html: '', success: false, error: errorMessage };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * Track web scraping failures for learning/improvement
 * Stores in MongoDB for pattern analysis and continuous improvement
 */
async function trackScrapeFailure(url: string, error: string, contentLength: number, context?: {
  sf_catalog_id?: string;
  model_number?: string;
  brand?: string;
  session_id?: string;
}): Promise<void> {
  try {
    const hostname = new URL(url).hostname;
    const isAntiBot = isAntiBotDomain(url);
    
    // Categorize error type
    let errorType: 'ACCESS_DENIED' | 'TIMEOUT' | 'NETWORK_ERROR' | 'MINIMAL_CONTENT' | 'PARSE_ERROR' | 'UNKNOWN';
    if (error.includes('ACCESS_DENIED') || error.includes('denied') || error.includes('blocked')) {
      errorType = 'ACCESS_DENIED';
    } else if (error.includes('timeout') || error.includes('ETIMEDOUT')) {
      errorType = 'TIMEOUT';
    } else if (error.includes('ECONNRESET') || error.includes('ENOTFOUND') || error.includes('network')) {
      errorType = 'NETWORK_ERROR';
    } else if (error.includes('MINIMAL_CONTENT') || contentLength < 500) {
      errorType = 'MINIMAL_CONTENT';
    } else if (error.includes('parse') || error.includes('Parse')) {
      errorType = 'PARSE_ERROR';
    } else {
      errorType = 'UNKNOWN';
    }

    // Log for immediate visibility
    logger.warn('SCRAPE_FAILURE_TRACKED', {
      url,
      hostname,
      errorType,
      error,
      contentLength,
      isAntiBotDomain: isAntiBot,
      timestamp: new Date().toISOString()
    });

    // Store in MongoDB for long-term learning (don't await to avoid blocking)
    ScrapeFailure.logFailure(url, errorType, error, contentLength, isAntiBot, context)
      .catch((dbErr: Error) => logger.debug('Failed to persist scrape failure to DB', { dbErr: dbErr.message }));

  } catch (err) {
    // Ignore tracking errors - should never block main flow
    logger.debug('Error in trackScrapeFailure', { err });
  }
}

/**
 * Fetch and parse a web page to extract product information
 * Now with retry logic, headless browser support, and improved spec extraction
 */
export async function fetchWebPage(url: string, retryCount = 0, useHeadless = false): Promise<WebPageContent> {
  const startTime = Date.now();
  const MAX_RETRIES = 2;
  
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

    // Check if this site requires JavaScript rendering
    const needsJsRendering = requiresJsRendering(url);
    
    // Use headless browser for JS-rendered sites or if explicitly requested
    if ((needsJsRendering || useHeadless) && puppeteer && retryCount === 0) {
      logger.info('Site requires JavaScript rendering, using headless browser', { url });
      
      const headlessResult = await fetchWithHeadlessBrowser(url);
      
      if (headlessResult.success && headlessResult.html.length > 1000) {
        // Parse the rendered HTML
        const $ = cheerio.load(headlessResult.html);
        
        // Remove noise
        $('script, style, nav, header, footer, [class*="cookie"], [class*="popup"]').remove();
        
        // Extract specs and content
        return parseWebPageContent($, url, startTime);
      } else {
        logger.warn('Headless browser fetch failed or returned minimal content, falling back to axios', { 
          url, 
          contentLength: headlessResult.html?.length || 0,
          error: headlessResult.error 
        });
        // Fall through to regular fetch
      }
    }

    logger.info('Fetching web page', { url, attempt: retryCount + 1 });

    // Use different user agent on retry
    const userAgent = USER_AGENTS[retryCount % USER_AGENTS.length];

    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1',
        'Referer': 'https://www.google.com/'  // Some sites check referer
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 500 // Accept redirects and client errors to handle them ourselves
    });

    const $ = cheerio.load(response.data);
    const bodyText = $('body').text();

    // Check for blocked/access denied pages
    const isBlocked = bodyText.toLowerCase().includes('access denied') ||
                      bodyText.toLowerCase().includes('permission to access') ||
                      bodyText.toLowerCase().includes('blocked') ||
                      bodyText.length < 500;

    if (isBlocked && retryCount < MAX_RETRIES) {
      logger.warn('Page appears blocked, retrying with different user agent', { url, attempt: retryCount + 1 });
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return fetchWebPage(url, retryCount + 1, useHeadless);
    }

    // If blocked and it's a JS-required site, try headless as last resort
    if (isBlocked && needsJsRendering && puppeteer && !useHeadless) {
      logger.warn('Regular fetch blocked, attempting headless browser as fallback', { url });
      return fetchWebPage(url, 0, true);
    }

    if (isBlocked) {
      await trackScrapeFailure(url, 'ACCESS_DENIED', bodyText.length);
      return {
        url,
        title: '',
        description: '',
        specifications: {},
        features: [],
        rawText: '',
        success: false,
        error: `Page blocked or access denied (content length: ${bodyText.length})`
      };
    }

    // Remove noise that doesn't help with product analysis
    $('script, style, nav, header, footer, [class*="cookie"], [class*="popup"], [class*="advertisement"]').remove();
    
    // Use shared parsing function
    return parseWebPageContent($, url, startTime);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Retry on network errors
    if (retryCount < MAX_RETRIES && (errorMessage.includes('timeout') || errorMessage.includes('ECONNRESET'))) {
      logger.warn('Network error, retrying', { url, error: errorMessage, attempt: retryCount + 1 });
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return fetchWebPage(url, retryCount + 1, useHeadless);
    }
    
    await trackScrapeFailure(url, errorMessage, 0);
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
 * Parse web page content using cheerio
 * Extracted to a shared function for both axios and headless browser results
 */
function parseWebPageContent($: ReturnType<typeof cheerio.load>, url: string, startTime: number): WebPageContent {
  // Extract basic metadata
  const title = $('title').text().trim() || 
                $('h1').first().text().trim() || 
                $('meta[property="og:title"]').attr('content') || '';

  const description = $('meta[name="description"]').attr('content') ||
                      $('meta[property="og:description"]').attr('content') || '';

  // Extract specifications from multiple patterns
  const specifications: Record<string, string> = {};
  
  // Pattern 1: JSON-LD structured data (most reliable)
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
        if (jsonLd.weight) specifications['Weight'] = typeof jsonLd.weight === 'object' ? jsonLd.weight.value : jsonLd.weight;
        // Extract additional properties if present
        if (jsonLd.additionalProperty) {
          for (const prop of jsonLd.additionalProperty) {
            if (prop.name && prop.value) {
              specifications[prop.name] = String(prop.value);
            }
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  });

  // Pattern 2: <dt>/<dd> definition lists (common spec format)
  $('dl').each((_, dl) => {
    $(dl).find('dt').each((_, dt) => {
      const key = $(dt).text().replace(/:/g, '').trim();
      const dd = $(dt).next('dd');
      if (dd.length > 0) {
        const value = dd.text().trim();
        if (key && value && key.length < 50 && value.length < 500) {
          specifications[key] = value;
        }
      }
    });
  });

  // Pattern 3: Spec tables with th/td or label/value patterns
  $('table').each((_, table) => {
    $(table).find('tr').each((_, row) => {
      const cells = $(row).find('th, td');
      if (cells.length >= 2) {
        const key = $(cells[0]).text().replace(/:/g, '').trim();
        const value = $(cells[1]).text().trim();
        if (key && value && key.length < 50 && value.length < 500) {
          specifications[key] = value;
        }
      }
    });
  });

  // Pattern 4: Common spec list patterns (li with key: value or key - value)
  $('li, div.spec, div.specification, [class*="spec-item"], [class*="product-spec"]').each((_, el) => {
    const text = $(el).text().trim();
    // Match patterns like "Weight: 150 lbs" or "Capacity - 38 gallons"
    const match = text.match(/^([A-Za-z][A-Za-z\s]{2,30})[:–-]\s*(.{1,200})$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!specifications[key]) {
        specifications[key] = value;
      }
    }
  });
  
  // Pattern 5: Signature Hardware specific - features section with key/value pairs
  $('[class*="feature"], [class*="spec"], [data-testid*="spec"]').each((_, el) => {
    const labelEl = $(el).find('[class*="label"], [class*="name"], strong, b').first();
    const valueEl = $(el).find('[class*="value"], span:last-child').first();
    if (labelEl.length && valueEl.length) {
      const key = labelEl.text().replace(/:/g, '').trim();
      const value = valueEl.text().trim();
      if (key && value && key !== value && key.length < 50 && value.length < 200) {
        specifications[key] = value;
      }
    }
  });

  // Pattern 6: Generic text-based extraction for React components and any HTML
  // Look for adjacent elements where one has label-like text and next has value
  $('div, span, p, li, td').each((_, el) => {
    const $el = $(el);
    const text = $el.clone().children().remove().end().text().trim(); // Get direct text only
    
    // Look for "Label: Value" or "Label Value" patterns in compact elements
    if (text.length > 3 && text.length < 300) {
      // Pattern: "Water Capacity (Gallons): 64.72" or "Weight: 141 lbs"
      const colonMatch = text.match(/^([A-Za-z][A-Za-z0-9\s()\/\-]{2,40}):\s*(.{1,100})$/);
      if (colonMatch) {
        const key = colonMatch[1].trim();
        const value = colonMatch[2].trim();
        if (!specifications[key] && value.length > 0 && value.length < 100) {
          specifications[key] = value;
        }
      }
    }
  });

  // Pattern 7: Extract from structured row/cell patterns (React tables, divs acting as tables)
  $('[class*="row"], [class*="Row"], [role="row"]').each((_, row) => {
    const cells = $(row).find('[class*="cell"], [class*="Cell"], [role="cell"], > div, > span');
    if (cells.length >= 2) {
      const key = $(cells[0]).text().replace(/:/g, '').trim();
      const value = $(cells[1]).text().trim();
      if (key && value && key.length < 50 && value.length < 300 && key !== value) {
        if (!specifications[key]) {
          specifications[key] = value;
        }
      }
    }
  });

  // Pattern 8: Look for sibling elements with label/value classes
  $('[class*="label"], [class*="Label"], [class*="name"], [class*="Name"]').each((_, labelEl) => {
    const $label = $(labelEl);
    const key = $label.text().replace(/:/g, '').trim();
    
    // Check next sibling
    const $value = $label.next();
    if ($value.length && key.length > 2 && key.length < 50) {
      const value = $value.text().trim();
      if (value && value.length > 0 && value.length < 300 && key !== value) {
        if (!specifications[key]) {
          specifications[key] = value;
        }
      }
    }
  });

  // Pattern 9: AGGRESSIVE - Extract ALL "Key: Value" patterns from entire body text
  // This catches anything the DOM patterns miss
  const bodyText = $('body').text();
  const specPatterns = [
    // "Water Capacity (Gallons): 64.72" style
    /([A-Za-z][A-Za-z0-9\s()\/\-]{2,40}):\s*([\d,.]+(?:\s*(?:lbs?|kg|gallons?|gal|inches?|in|"|cm|mm|watts?|W|volts?|V|amps?|A))?)/gi,
    // "Dimensions: 70" x 32" x 24"" style  
    /([A-Za-z][A-Za-z\s]{2,25}):\s*([\d.,"\'\s×xX\-\/]+(?:\s*(?:inches?|in|cm|mm))?)/gi,
    // "Number of Jets: 12" style
    /(Number of [A-Za-z]+):\s*(\d+)/gi,
    // "Tub Style: Double Slipper" style
    /([A-Za-z\s]{3,25}Style):\s*([A-Za-z\s]{3,50})/gi,
    // "Material: Acrylic" style
    /(Material|Finish|Color):\s*([A-Za-z\s\-]{2,50})/gi,
  ];

  for (const pattern of specPatterns) {
    let match;
    while ((match = pattern.exec(bodyText)) !== null) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!specifications[key] && key.length > 2 && value.length > 0 && value.length < 100) {
        specifications[key] = value;
      }
    }
  }

  // Capture EVERYTHING from main content - let AI analyze
  // Be aggressive - capture full body text first, then try selectors
  let fullContent = $('body').text() || '';
  
  // If we got minimal content from selectors, use the FULL body text 
  if (fullContent.length < 1000) {
    // Try more inclusive selectors
    const mainContent = $('main, [role="main"], article, #root, #app, [class*="product"], [id*="product"], [class*="content"], .container, .page')
      .map((_, el) => $(el).text())
      .get()
      .join(' ');
    if (mainContent.length > fullContent.length) {
      fullContent = mainContent;
    }
  }

  const rawText = fullContent
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50000);

  // Capture all list items (features/specs often in lists)
  const features: string[] = [];
  $('li').each((_, li) => {
    const text = $(li).text().trim();
    if (text.length > 5 && text.length < 1000) {
      features.push(text);
    }
  });

  const processingTime = Date.now() - startTime;
  
  // Track if we got minimal content (potential future learning) - async, don't block
  if (rawText.length < 1000 && Object.keys(specifications).length === 0) {
    trackScrapeFailure(url, 'MINIMAL_CONTENT', rawText.length).catch(() => {});
  }

  // Debug logging for troubleshooting - log when minimal specs found from JS-rendered sites
  if (Object.keys(specifications).length < 3 && rawText.length < 1000) {
    logger.warn('Minimal content extracted from page', {
      url,
      rawTextLength: rawText.length,
      specsFound: Object.keys(specifications).length,
      hasColons: (rawText.match(/:/g) || []).length
    });
  }
  
  logger.info('Web page parsed successfully', { 
    url, 
    contentLength: rawText.length,
    specsFound: Object.keys(specifications).length,
    featuresFound: features.length,
    processingTime 
  });

  return {
    url,
    title,
    description,
    specifications,
    features,
    rawText,
    success: true
  };
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
 * Final Verification Search Result
 * Used for targeted web search AFTER AI analysis is complete
 */
export interface FinalVerificationSearchResult {
  query: string;
  verifiedData: {
    brand: string;
    modelNumber: string;
    category: string;
    productTitle: string;
  };
  missingFieldsSearched: string[];
  foundSpecifications: Record<string, string>;
  foundFeatures: string[];
  sources: string[];
  searchSummary: string;
  success: boolean;
  error?: string;
}

/**
 * FINAL VERIFICATION WEB SEARCH
 * ==============================
 * This is called AFTER AI analysis and consensus building, when we have:
 * - Verified category
 * - Verified brand name
 * - Verified model number
 * - List of fields still missing or unresolved
 * 
 * This allows for a much more targeted and effective web search.
 */
export async function performFinalVerificationSearch(
  verifiedBrand: string,
  verifiedModelNumber: string,
  verifiedCategory: string,
  verifiedProductTitle: string,
  missingFields: string[],
  unresolvedFields: string[],
  sessionId?: string
): Promise<FinalVerificationSearchResult> {
  const startTime = Date.now();
  
  // Combine missing and unresolved fields
  const fieldsToSearch = [...new Set([...missingFields, ...unresolvedFields])];
  
  // Skip if no fields need searching or if key data is missing
  if (fieldsToSearch.length === 0) {
    logger.info('Final verification search skipped - no missing fields', { sessionId });
    return {
      query: '',
      verifiedData: { brand: verifiedBrand, modelNumber: verifiedModelNumber, category: verifiedCategory, productTitle: verifiedProductTitle },
      missingFieldsSearched: [],
      foundSpecifications: {},
      foundFeatures: [],
      sources: [],
      searchSummary: 'No missing fields to search for',
      success: true
    };
  }
  
  if (!verifiedBrand && !verifiedModelNumber) {
    logger.warn('Final verification search skipped - no brand or model number', { sessionId });
    return {
      query: '',
      verifiedData: { brand: verifiedBrand, modelNumber: verifiedModelNumber, category: verifiedCategory, productTitle: verifiedProductTitle },
      missingFieldsSearched: fieldsToSearch,
      foundSpecifications: {},
      foundFeatures: [],
      sources: [],
      searchSummary: 'Cannot search without brand or model number',
      success: false,
      error: 'Insufficient verified data for web search'
    };
  }

  try {
    if (!config.openai?.apiKey) {
      return {
        query: '',
        verifiedData: { brand: verifiedBrand, modelNumber: verifiedModelNumber, category: verifiedCategory, productTitle: verifiedProductTitle },
        missingFieldsSearched: fieldsToSearch,
        foundSpecifications: {},
        foundFeatures: [],
        sources: [],
        searchSummary: 'OpenAI API key not configured',
        success: false,
        error: 'OpenAI API key not configured for web search'
      };
    }

    // Build a highly targeted search query using verified data
    const searchQuery = [
      verifiedBrand,
      verifiedModelNumber,
      verifiedCategory !== 'Unknown' ? verifiedCategory : '',
      'specifications',
      'spec sheet'
    ].filter(Boolean).join(' ');

    logger.info('FINAL PHASE: Performing targeted web search with verified data', {
      sessionId,
      searchQuery,
      verifiedBrand,
      verifiedModelNumber,
      verifiedCategory,
      missingFieldsCount: fieldsToSearch.length,
      missingFields: fieldsToSearch.slice(0, 10) // Log first 10
    });

    const openaiClient = new OpenAI({ apiKey: config.openai.apiKey });
    const model = config.openai.searchModel || 'gpt-4o-search-preview';

    // Start AI usage tracking
    const usageId = aiUsageTracker.startAICall({
      sessionId: sessionId || 'final-research',
      provider: 'openai',
      model,
      taskType: 'final-verification-search',
      prompt: searchQuery,
      searchQuery,
    });

    // Build a detailed prompt that focuses on the specific missing fields
    const fieldDescriptions = fieldsToSearch.map(f => `- ${f}`).join('\n');
    
    const systemPrompt = `You are a product specification researcher. Your task is to find SPECIFIC missing product data.

VERIFIED PRODUCT INFORMATION:
- Brand: ${verifiedBrand || 'Unknown'}
- Model Number: ${verifiedModelNumber || 'Unknown'}
- Category: ${verifiedCategory || 'Unknown'}
- Product: ${verifiedProductTitle || 'Unknown'}

FIELDS WE NEED TO FIND:
${fieldDescriptions}

INSTRUCTIONS:
1. Search manufacturer websites, retailer sites, and spec sheets for this EXACT product
2. Only return data that specifically matches this brand and model number
3. Do NOT guess or estimate - only return values you find in authoritative sources
4. Include the source URL for each piece of information found

Return JSON format:
{
  "specifications": {
    "field_name": "value found",
    ...
  },
  "features": ["feature1", "feature2"],
  "dimensions": {
    "width": "value with unit",
    "height": "value with unit", 
    "depth": "value with unit",
    "weight": "value with unit"
  },
  "sources": ["url1", "url2"],
  "confidence": 0.0-1.0,
  "notes": "Any important notes about the data found"
}`;

    const response = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Search for: ${searchQuery}\n\nFind these specific fields: ${fieldsToSearch.join(', ')}` }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    let parsed: any = {};
    let jsonValid = false;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
      jsonValid = true;
    } catch {
      parsed = { rawResults: content, specifications: {} };
    }

    // Complete AI usage tracking
    await aiUsageTracker.completeAICall(usageId, {
      response: content,
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      outcome: jsonValid ? 'success' : 'partial',
      jsonValid,
      confidenceScore: (parsed.confidence || 0.5) * 100,
    });

    // Extract specifications from parsed response
    const foundSpecs: Record<string, string> = {};
    
    // Add direct specifications
    if (parsed.specifications && typeof parsed.specifications === 'object') {
      for (const [key, value] of Object.entries(parsed.specifications)) {
        if (value && typeof value === 'string' && value.trim()) {
          foundSpecs[key] = value.trim();
        }
      }
    }
    
    // Add dimensions if found
    if (parsed.dimensions && typeof parsed.dimensions === 'object') {
      for (const [key, value] of Object.entries(parsed.dimensions)) {
        if (value && typeof value === 'string' && value.trim()) {
          foundSpecs[`Dimension_${key}`] = value.trim();
        }
      }
    }

    const foundFeatures = Array.isArray(parsed.features) ? parsed.features : [];
    const sources = Array.isArray(parsed.sources) ? parsed.sources : [];

    const processingTime = Date.now() - startTime;
    const specsFoundCount = Object.keys(foundSpecs).length;
    
    logger.info('Final verification web search completed', {
      sessionId,
      searchQuery,
      processingTime: `${processingTime}ms`,
      specsFound: specsFoundCount,
      featuresFound: foundFeatures.length,
      sourcesFound: sources.length,
      confidence: parsed.confidence || 'N/A'
    });

    return {
      query: searchQuery,
      verifiedData: { brand: verifiedBrand, modelNumber: verifiedModelNumber, category: verifiedCategory, productTitle: verifiedProductTitle },
      missingFieldsSearched: fieldsToSearch,
      foundSpecifications: foundSpecs,
      foundFeatures,
      sources,
      searchSummary: specsFoundCount > 0 
        ? `Found ${specsFoundCount} specifications and ${foundFeatures.length} features from ${sources.length} sources`
        : 'No additional specifications found in web search',
      success: true
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Final verification web search failed', { 
      sessionId,
      error: errorMessage,
      verifiedBrand,
      verifiedModelNumber
    });
    
    return {
      query: '',
      verifiedData: { brand: verifiedBrand, modelNumber: verifiedModelNumber, category: verifiedCategory, productTitle: verifiedProductTitle },
      missingFieldsSearched: fieldsToSearch,
      foundSpecifications: {},
      foundFeatures: [],
      sources: [],
      searchSummary: `Web search failed: ${errorMessage}`,
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
  performFinalVerificationSearch,
  performWebSearch,
  formatResearchForPrompt
};
