/**
 * Title Generator Service
 * Generates standardized product titles following the format:
 * Brand + Size Class + Configuration + Installation Type + Category + Finish/Color + Special Features
 *
 * IMPORTANT DISTINCTIONS:
 * - Configuration/Style: French Door, Side-by-Side, Top Freezer, Bottom Freezer (door arrangement)
 * - Installation Type: Built-In, Freestanding, Counter-Depth, Under-Counter (how it's installed)
 */
export declare const REFRIGERATOR_CONFIGURATIONS: string[];
export declare const INSTALLATION_TYPES: string[];
export interface TitleInput {
    brand?: string;
    modelNumber?: string;
    category: string;
    width?: string | number;
    height?: string | number;
    depth?: string | number;
    style?: string;
    type?: string;
    configuration?: string;
    installationType?: string;
    finish?: string;
    color?: string;
    material?: string;
    fuelType?: string;
    features?: string[];
    totalCapacity?: string | number;
    numberOfBurners?: string | number;
}
/**
 * Generate a standardized product title
 * Format: Brand + Size + Configuration/FuelType + Installation Type + Category + Finish + (Features)
 */
export declare function generateTitle(input: TitleInput): string;
/**
 * Get style or type descriptor (LEGACY - for non-refrigerator categories)
 * Exported for external use
 */
export declare function getStyleType(input: TitleInput): string | null;
/**
 * Check if brand is premium tier
 */
export declare function isPremiumBrand(brand: string): boolean;
declare const _default: {
    generateTitle: typeof generateTitle;
    isPremiumBrand: typeof isPremiumBrand;
};
export default _default;
//# sourceMappingURL=title-generator.service.d.ts.map