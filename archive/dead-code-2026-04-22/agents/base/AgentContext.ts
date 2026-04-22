/**
 * AgentContext - Manages verification context with explicit dependency injection
 * 
 * Each agent declares what it needs via inputSchema, and context.pick() returns
 * only those fields. Prevents context bloat as pipeline progresses.
 */

import type { AgentDebugLogger } from '../debug/AgentDebugLogger';

export class AgentContext {
  private data: Map<string, any>;
  private debugLogger?: AgentDebugLogger;
  
  constructor(initialData?: Record<string, any>) {
    this.data = new Map();
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        this.data.set(key, value);
      });
    }
  }

  setDebugLogger(logger: AgentDebugLogger): void {
    this.debugLogger = logger;
  }

  getDebugLogger(): AgentDebugLogger | undefined {
    return this.debugLogger;
  }
  
  /**
   * Set a value in context
   */
  set(key: string, value: any): void {
    this.data.set(key, value);
  }
  
  /**
   * Get a value from context
   */
  get(key: string): any {
    return this.data.get(key);
  }
  
  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.data.has(key);
  }
  
  /**
   * Pick only specified fields from context
   * 
   * Supports dot notation for nested fields:
   * - 'rawProduct.ferguson.category' → { rawProduct: { ferguson: { category: value } } }
   * - 'category' → { category: value }
   * 
   * @param schema Array of field paths to extract
   * @returns Object with only requested fields
   */
  pick(schema: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const path of schema) {
      const value = this.getNestedValue(path);
      if (value !== undefined) {
        this.setNestedValue(result, path, value);
      }
    }
    
    return result;
  }
  
  /**
   * Get nested value using dot notation
   * 'rawProduct.ferguson.category' → this.data.get('rawProduct').ferguson.category
   */
  private getNestedValue(path: string): any {
    const parts = path.split('.');
    let current = this.data.get(parts[0]);
    
    for (let i = 1; i < parts.length; i++) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[parts[i]];
    }
    
    return current;
  }
  
  /**
   * Set nested value in result object using dot notation
   * Sets 'rawProduct.ferguson.category' → result.rawProduct.ferguson.category = value
   */
  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  /**
   * Get all context data (for debugging)
   */
  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    this.data.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  
  /**
   * Clear all context data
   */
  clear(): void {
    this.data.clear();
  }
  
  /**
   * Clone context (for parallel agent execution)
   */
  clone(): AgentContext {
    const cloned = new AgentContext();
    this.data.forEach((value, key) => {
      // Deep clone objects to prevent mutation
      cloned.set(key, JSON.parse(JSON.stringify(value)));
    });
    return cloned;
  }
}
