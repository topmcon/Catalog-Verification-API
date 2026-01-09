/**
 * Product Types and Interfaces
 */
export interface RawProductAttribute {
    [key: string]: string | number | boolean | null | undefined;
}
export interface RawProduct {
    id: string;
    name: string;
    description?: string;
    attributes?: RawProductAttribute;
    category?: string;
    price?: number;
    sku?: string;
    brand?: string;
    quantity?: number;
    status?: string;
    imageUrl?: string;
    weight?: number;
    [key: string]: unknown;
}
export interface CleanedProduct {
    originalId: string;
    ProductName: string;
    SKU: string;
    Price: number;
    Description: string;
    PrimaryCategory: string;
    Brand?: string;
    Quantity?: number;
    Status: string;
    ImageURL?: string;
    Weight?: number;
    additionalAttributes: RawProductAttribute;
    rawData: RawProduct;
}
export interface VerifiedProduct {
    originalId: string;
    ProductName: string;
    SKU: string;
    Price: number;
    Description: string;
    PrimaryCategory: string;
    Brand?: string;
    Quantity?: number;
    Status: string;
    ImageURL?: string;
    Weight?: number;
    verificationScore: number;
    corrections: ProductCorrection[];
    additionalAttributesHtml: string;
    verifiedAt: Date;
    verifiedBy: string[];
}
export interface ProductCorrection {
    field: string;
    originalValue: unknown;
    correctedValue: unknown;
    reason: string;
    suggestedBy: 'openai' | 'xai' | 'consensus';
}
export interface UnmatchedAttribute {
    name: string;
    value: string | number | boolean;
    originalKey: string;
}
//# sourceMappingURL=product.types.d.ts.map