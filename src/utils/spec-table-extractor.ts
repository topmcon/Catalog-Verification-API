/**
 * Search the HTML Specification_Table field for a named attribute.
 *
 * Extracted from dual-ai-verification.service.ts (CON-06: extract + test pure functions
 * opportunistically) so it can be unit-tested against real stored payloads without loading
 * the pipeline module (which constructs AI clients at import time).
 *
 * Retailer spec tables come in several distinct HTML formats — we handle all of them:
 *
 *   Format A (<table><td> pairs — Ferguson/Bosch style):
 *     <tr><td class="...">Color</td><td class="...">Stainless Steel</td></tr>
 *
 *   Format B (<li>Key - Value</li> — Best Buy / Insignia single-item style):
 *     <ul><li>Color Finish - Stainless steel look</li><li>Product Height - 56 1/8 inches</li></ul>
 *
 *   Format C (<li>Key</li><li>Value</li> — Best Buy alternating list style):
 *     <ul><li>Color Finish</li><li>White</li><li>Product Height</li><li>33.5 inches</li></ul>
 *
 *   Format D (<p>Key: Value</p> — Best Buy paragraph style):
 *     <p>Color: White</p><p>Color Finish: White</p>
 *
 * The CRITICAL property of each approach: we extract the value from the HTML structure
 * BEFORE stripping tags, so adjacent fields never bleed into each other. The flat-text
 * approach (strip everything then regex) failed because it merged all field-value pairs
 * into one long string with no usable delimiters (Finding #078 Bug A).
 */
export function findInSpecificationTable(specTableHtml: string | undefined | null, attributeNames: string[]): string | null {
  if (!specTableHtml) return null;

  for (const attrName of attributeNames) {
    const escaped = attrName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // --- Format A: <th/td>KEY</th/td> ... <td>VALUE</td> (Ferguson / inline_sd_table) ---
    // Non-greedy [\s\S]*? lands on the nearest value cell after the key cell.
    const cellRegex = new RegExp(
      '<(?:th|td)[^>]*>\\s*' + escaped + '\\s*</(?:th|td)>[\\s\\S]*?<(?:td|dd)[^>]*>([\\s\\S]*?)</(?:td|dd)>',
      'i'
    );
    const cellMatch = specTableHtml.match(cellRegex);
    if (cellMatch) {
      const val = cellMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\s+/g, ' ')
        .trim();
      if (val && val.length >= 2 && val.length <= 80) return val;
    }

    // --- Format B: <li>KEY - VALUE</li> (key and value in the SAME list item, dash-separated) ---
    const liDashRegex = new RegExp(
      '<li[^>]*>\\s*' + escaped + '\\s*-\\s*([^<]{2,80})</li>',
      'i'
    );
    const liDashMatch = specTableHtml.match(liDashRegex);
    if (liDashMatch) {
      const val = liDashMatch[1].replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
      if (val && val.length >= 2 && val.length <= 80) return val;
    }

    // --- Format C: <li>KEY</li><li>VALUE</li> (key and value in ALTERNATING list items) ---
    const liAltRegex = new RegExp(
      '<li[^>]*>\\s*' + escaped + '\\s*</li>\\s*<li[^>]*>([^<]{2,80})</li>',
      'i'
    );
    const liAltMatch = specTableHtml.match(liAltRegex);
    if (liAltMatch) {
      const val = liAltMatch[1].replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
      if (val && val.length >= 2 && val.length <= 80) return val;
    }

    // --- Format D: <p>KEY: VALUE</p> or <p>KEY - VALUE</p> (paragraph with colon/dash separator) ---
    const paraRegex = new RegExp(
      '<p[^>]*>\\s*' + escaped + '\\s*[-:]\\s*([^<]{2,80})</p>',
      'i'
    );
    const paraMatch = specTableHtml.match(paraRegex);
    if (paraMatch) {
      const val = paraMatch[1].replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
      if (val && val.length >= 2 && val.length <= 80) return val;
    }
  }
  return null;
}
