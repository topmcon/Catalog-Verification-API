/**
 * Verified Fields Schema Configuration
 * These are the required fields that must be validated and present in the final output
 */
export interface VerifiedFieldDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required: boolean;
    description: string;
    validation?: {
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        pattern?: string;
        enum?: string[];
    };
}
export declare const verifiedFieldsSchema: VerifiedFieldDefinition[];
export declare const verifiedFieldNames: string[];
export default verifiedFieldsSchema;
//# sourceMappingURL=verified-fields.d.ts.map