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

export const verifiedFieldsSchema: VerifiedFieldDefinition[] = [
  {
    name: 'ProductName',
    type: 'string',
    required: true,
    description: 'The official name of the product',
    validation: {
      minLength: 1,
      maxLength: 255,
    },
  },
  {
    name: 'SKU',
    type: 'string',
    required: true,
    description: 'Stock Keeping Unit - unique identifier for the product',
    validation: {
      minLength: 1,
      maxLength: 50,
      pattern: '^[A-Za-z0-9-_]+$',
    },
  },
  {
    name: 'Price',
    type: 'number',
    required: true,
    description: 'The retail price of the product',
    validation: {
      min: 0,
    },
  },
  {
    name: 'Description',
    type: 'string',
    required: true,
    description: 'Detailed description of the product',
    validation: {
      minLength: 10,
      maxLength: 5000,
    },
  },
  {
    name: 'PrimaryCategory',
    type: 'string',
    required: true,
    description: 'Main category the product belongs to',
    validation: {
      minLength: 1,
      maxLength: 100,
    },
  },
  {
    name: 'Brand',
    type: 'string',
    required: false,
    description: 'Brand or manufacturer name',
    validation: {
      maxLength: 100,
    },
  },
  {
    name: 'Quantity',
    type: 'number',
    required: false,
    description: 'Available quantity in stock',
    validation: {
      min: 0,
    },
  },
  {
    name: 'Status',
    type: 'string',
    required: true,
    description: 'Product availability status',
    validation: {
      enum: ['active', 'inactive', 'discontinued', 'out_of_stock'],
    },
  },
  {
    name: 'ImageURL',
    type: 'string',
    required: false,
    description: 'URL to the primary product image',
    validation: {
      pattern: '^https?://.+',
    },
  },
  {
    name: 'Weight',
    type: 'number',
    required: false,
    description: 'Product weight in kilograms',
    validation: {
      min: 0,
    },
  },
];

export const verifiedFieldNames = verifiedFieldsSchema.map(field => field.name);

export default verifiedFieldsSchema;
