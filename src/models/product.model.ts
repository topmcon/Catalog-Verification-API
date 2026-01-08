import mongoose, { Schema, Document } from 'mongoose';
import { RawProduct, CleanedProduct, VerifiedProduct } from '../types/product.types';

/**
 * Product Document Interface
 */
export interface IProduct extends Document {
  sessionId: string;
  originalId: string;
  rawData: RawProduct;
  cleanedData?: CleanedProduct;
  verifiedData?: VerifiedProduct;
  status: 'pending' | 'processing' | 'verified' | 'failed' | 'flagged';
  productErrors: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Schema
 */
const ProductSchema = new Schema<IProduct>(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    originalId: {
      type: String,
      required: true,
    },
    rawData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    cleanedData: {
      type: Schema.Types.Mixed,
    },
    verifiedData: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'verified', 'failed', 'flagged'],
      default: 'pending',
      index: true,
    },
    productErrors: [{
      type: String,
    }],
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

// Compound index for efficient queries
ProductSchema.index({ sessionId: 1, originalId: 1 }, { unique: true });
ProductSchema.index({ sessionId: 1, status: 1 });
ProductSchema.index({ createdAt: -1 });

/**
 * Product Model
 */
export const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
