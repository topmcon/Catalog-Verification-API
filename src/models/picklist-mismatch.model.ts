/**
 * Picklist Mismatch Model
 * Persists picklist mismatches to MongoDB for analytics and review
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IPicklistMismatch extends Document {
  type: 'brand' | 'category' | 'style' | 'attribute';
  originalValue: string;
  closestMatches: string[];
  similarity: number;
  productContext?: {
    sf_catalog_id?: string;
    sf_catalog_name?: string;
    session_id?: string;
  };
  resolved: boolean;
  resolution?: {
    action: 'added_to_picklist' | 'mapped_to_existing' | 'ignored';
    resolvedValue?: string;
    resolvedBy?: string;
    resolvedAt?: Date;
  };
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PicklistMismatchSchema = new Schema<IPicklistMismatch>(
  {
    type: {
      type: String,
      enum: ['brand', 'category', 'style', 'attribute'],
      required: true,
      index: true,
    },
    originalValue: {
      type: String,
      required: true,
      index: true,
    },
    closestMatches: [{
      type: String,
    }],
    similarity: {
      type: Number,
      default: 0,
    },
    productContext: {
      sf_catalog_id: String,
      sf_catalog_name: String,
      session_id: String,
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolution: {
      action: {
        type: String,
        enum: ['added_to_picklist', 'mapped_to_existing', 'ignored'],
      },
      resolvedValue: String,
      resolvedBy: String,
      resolvedAt: Date,
    },
    occurrenceCount: {
      type: Number,
      default: 1,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'picklist_mismatches',
  }
);

// Compound index for finding existing mismatches
PicklistMismatchSchema.index({ type: 1, originalValue: 1 }, { unique: true });

// Index for analytics queries
PicklistMismatchSchema.index({ resolved: 1, occurrenceCount: -1 });
PicklistMismatchSchema.index({ lastSeen: -1 });

export const PicklistMismatch = mongoose.model<IPicklistMismatch>('PicklistMismatch', PicklistMismatchSchema);
