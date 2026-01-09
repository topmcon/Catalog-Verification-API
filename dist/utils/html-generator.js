"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAttributeTable = generateAttributeTable;
exports.generateUnmatchedAttributeTable = generateUnmatchedAttributeTable;
exports.formatAttributeName = formatAttributeName;
exports.formatAttributeValue = formatAttributeValue;
exports.generateAttributeTableDocument = generateAttributeTableDocument;
const data_cleaner_1 = require("./data-cleaner");
const defaultOptions = {
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
function generateAttributeTable(attributes, options = {}) {
    const opts = { ...defaultOptions, ...options };
    const entries = Object.entries(attributes).filter(([_, value]) => value !== null && value !== undefined && value !== '');
    if (entries.length === 0) {
        return `<p class="no-attributes">${opts.emptyMessage}</p>`;
    }
    let html = '';
    // Add inline styles if requested
    if (opts.includeStyles) {
        html += generateTableStyles(opts);
    }
    html += `<table class="${opts.tableClass}" border="1">\n`;
    html += `  <thead>\n`;
    html += `    <tr>\n`;
    html += `      <th class="${opts.headerClass}">Attribute</th>\n`;
    html += `      <th class="${opts.headerClass}">Value</th>\n`;
    html += `    </tr>\n`;
    html += `  </thead>\n`;
    html += `  <tbody>\n`;
    entries.forEach(([key, value], index) => {
        const rowClass = index % 2 === 1 ? opts.alternateRowClass : '';
        const formattedKey = formatAttributeName(key);
        const formattedValue = formatAttributeValue(value);
        html += `    <tr class="${rowClass}">\n`;
        html += `      <td class="${opts.cellClass}">${(0, data_cleaner_1.sanitizeHtml)(formattedKey)}</td>\n`;
        html += `      <td class="${opts.cellClass}">${(0, data_cleaner_1.sanitizeHtml)(formattedValue)}</td>\n`;
        html += `    </tr>\n`;
    });
    html += `  </tbody>\n`;
    html += `</table>`;
    return html;
}
/**
 * Generate HTML table from array of unmatched attributes
 */
function generateUnmatchedAttributeTable(attributes, options = {}) {
    const attributeMap = {};
    for (const attr of attributes) {
        attributeMap[attr.name] = attr.value;
    }
    return generateAttributeTable(attributeMap, options);
}
/**
 * Generate inline CSS styles for the table
 */
function generateTableStyles(opts) {
    return `
<style>
  .${opts.tableClass} {
    border-collapse: collapse;
    width: 100%;
    margin: 10px 0;
    font-family: Arial, sans-serif;
    font-size: 14px;
  }
  .${opts.tableClass} th,
  .${opts.tableClass} td {
    padding: 10px 15px;
    text-align: left;
    border: 1px solid #ddd;
  }
  .${opts.headerClass} {
    background-color: #4a90d9;
    color: white;
    font-weight: bold;
  }
  .${opts.cellClass} {
    background-color: #fff;
  }
  .${opts.alternateRowClass} td {
    background-color: #f9f9f9;
  }
  .${opts.tableClass} tr:hover td {
    background-color: #e8f4fc;
  }
  .no-attributes {
    color: #666;
    font-style: italic;
    padding: 10px;
  }
</style>
`;
}
/**
 * Format attribute name for display (camelCase/snake_case to Title Case)
 */
function formatAttributeName(name) {
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
function formatAttributeValue(value) {
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
function generateAttributeTableDocument(productName, attributes) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Additional Attributes - ${(0, data_cleaner_1.sanitizeHtml)(productName)}</title>
</head>
<body>
  <h2>Additional Attributes for ${(0, data_cleaner_1.sanitizeHtml)(productName)}</h2>
  ${generateAttributeTable(attributes)}
</body>
</html>
`;
}
exports.default = {
    generateAttributeTable,
    generateUnmatchedAttributeTable,
    generateAttributeTableDocument,
    formatAttributeName,
    formatAttributeValue,
};
//# sourceMappingURL=html-generator.js.map