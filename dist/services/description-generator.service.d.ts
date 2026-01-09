/**
 * Description Generator Service
 * Generates professional, luxurious product descriptions
 * Highlights premium features: Built-in, Panel Ready, special features
 */
export interface DescriptionInput {
    brand?: string;
    category: string;
    modelNumber?: string;
    title?: string;
    width?: string | number;
    height?: string | number;
    depth?: string | number;
    totalCapacity?: string | number;
    style?: string;
    type?: string;
    installationType?: string;
    finish?: string;
    color?: string;
    material?: string;
    fuelType?: string;
    features?: string[];
    specifications?: Record<string, any>;
    existingDescription?: string;
}
/**
 * Generate a professional product description
 */
export declare function generateDescription(input: DescriptionInput): string;
/**
 * Enhance an existing description with premium language
 */
export declare function enhanceDescription(existing: string, input: DescriptionInput): string;
declare const _default: {
    generateDescription: typeof generateDescription;
    enhanceDescription: typeof enhanceDescription;
};
export default _default;
//# sourceMappingURL=description-generator.service.d.ts.map