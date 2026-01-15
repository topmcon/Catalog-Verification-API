import { UnmatchedAttribute } from '../types/product.types';
import { sanitizeHtml } from './data-cleaner';

/**
 * HTML Table Generator
 * Creates HTML tables for unmatched/additional attributes
 */

export interface HtmlTableOptions {
  includeStyles?: boolean;
  tableClass?: string;
  headerClass?: string;
  cellClass?: string;
  alternateRowClass?: string;
  emptyMessage?: string;
}

const defaultOptions: HtmlTableOptions = {
  includeStyles: true,
  tableClass: 'additional-attributes-table',
  headerClass: 'attr-header',
  cellClass: 'attr-cell',
  alternateRowClass: 'attr-row-alt',
  emptyMessage: 'No additional attributes',
};

/**
 * Generate HTML table from additional attributes
 */
export function generateAttributeTable(
  attributes: Record<string, unknown>,
  options: HtmlTableOptions = {}
): string {
  const opts = { ...defaultOptions, ...options };
  
  const entries = Object.entries(attributes).filter(
    ([_, value]) => value !== null && value !== undefined && value !== ''
  );

  if (entries.length === 0) {
    return `<p style="color: #666; font-style: italic; padding: 10px;">${opts.emptyMessage}</p>`;
  }

  let html = '';

  // Use inline styles instead of <style> tag for better compatibility with Salesforce
  const tableStyle = 'border-collapse: collapse; width: 100%; margin: 10px 0; font-family: Arial, sans-serif; font-size: 14px;';
  const headerStyle = 'padding: 10px 15px; text-align: left; border: 1px solid #ddd; background-color: #4a90d9; color: white; font-weight: bold;';
  const cellStyle = 'padding: 10px 15px; text-align: left; border: 1px solid #ddd; background-color: #fff;';
  const cellAltStyle = 'padding: 10px 15px; text-align: left; border: 1px solid #ddd; background-color: #f9f9f9;';

  html += `<table style="${tableStyle}" border="1">\n`;
  html += `  <thead>\n`;
  html += `    <tr>\n`;
  html += `      <th style="${headerStyle}">Attribute</th>\n`;
  html += `      <th style="${headerStyle}">Value</th>\n`;
  html += `    </tr>\n`;
  html += `  </thead>\n`;
  html += `  <tbody>\n`;

  entries.forEach(([key, value], index) => {
    const formattedKey = formatAttributeName(key);
    const formattedValue = formatAttributeValue(value);
    const tdStyle = index % 2 === 1 ? cellAltStyle : cellStyle;

    html += `    <tr>\n`;
    html += `      <td style="${tdStyle}">${sanitizeHtml(formattedKey)}</td>\n`;
    html += `      <td style="${tdStyle}">${sanitizeHtml(formattedValue)}</td>\n`;
    html += `    </tr>\n`;
  });

  html += `  </tbody>\n`;
  html += `</table>`;

  return html;
}

/**
 * Generate HTML table from array of unmatched attributes
 */
export function generateUnmatchedAttributeTable(
  attributes: UnmatchedAttribute[],
  options: HtmlTableOptions = {}
): string {
  const attributeMap: Record<string, unknown> = {};
  
  for (const attr of attributes) {
    attributeMap[attr.name] = attr.value;
  }

  return generateAttributeTable(attributeMap, options);
}

/**
 * Format attribute name for display (camelCase/snake_case to Title Case)
 */
export function formatAttributeName(name: string): string {
  return name
    // Handle camelCase
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Handle snake_case
    .replace(/_/g, ' ')
    // Handle kebab-case
    .replace(/-/g, ' ')
    // Capitalize first letter of each word
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim();
}

/**
 * Format attribute value for display
 */
export function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    // Format numbers with commas for thousands
    return value.toLocaleString('en-US');
  }

  if (Array.isArray(value)) {
    return value.map(v => formatAttributeValue(v)).join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Generate a complete HTML document with the attribute table
 */
export function generateAttributeTableDocument(
  productName: string,
  attributes: Record<string, unknown>
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Additional Attributes - ${sanitizeHtml(productName)}</title>
</head>
<body>
  <h2>Additional Attributes for ${sanitizeHtml(productName)}</h2>
  ${generateAttributeTable(attributes)}
</body>
</html>
`;
}

export default {
  generateAttributeTable,
  generateUnmatchedAttributeTable,
  generateAttributeTableDocument,
  formatAttributeName,
  formatAttributeValue,
};
