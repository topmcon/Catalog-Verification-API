import mongoose, { Document, Schema } from 'mongoose';

/**
 * Pending Creation Request Model
 * 
 * Tracks outbound requests sent to Salesforce for creating new picklist items
 * (brands, categories, styles, types, attributes).
 * 
 * Purpose:
 * 1. Prevent duplicate requests - if we already requested "Triangle" style, don't request again
 * 2. Track which jobs needed the item - for audit/reporting
 * 3. Auto-fulfill when SF sends the item back with an ID
 * 4. Provide visibility into pending creation requests
 */

export type RequestType = 'brand' | 'category' | 'style' | 'type' | 'attribute';
export type RequestStatus = 'pending' | 'fulfilled' | 'rejected' | 'expired';

export interface IJobReference {
  job_id: string;
  sf_catalog_id: string;
  model_number?: string;
  requested_at: Date;
}

export interface IRequestContext {
  suggested_for_category?: string;
  source: string;
  reason?: string;
  additional_data?: Record<string, any>;
}

export interface IPendingCreationRequest extends Document {
  request_id: string;
  request_type: RequestType;
  requested_value: string;
  requested_value_normalized: string;  // Lowercase, trimmed for matching
  
  // Status tracking
  status: RequestStatus;
  created_at: Date;
  updated_at: Date;
  fulfilled_at?: Date;
  expires_at: Date;
  
  // SF response (when fulfilled)
  sf_id_received?: string;
  
  // Jobs that needed this item
  requested_by_jobs: IJobReference[];
  first_requested_by: IJobReference;
  request_count: number;  // How many times this was requested (before dedup kicked in)
  
  // Context
  context: IRequestContext;
  
  // Webhook tracking
  sent_to_sf_count: number;  // How many times we actually sent this to SF (should be 1)
  last_sent_at?: Date;
}

const JobReferenceSchema = new Schema({
  job_id: { type: String, required: true },
  sf_catalog_id: { type: String, required: true },
  model_number: { type: String },
  requested_at: { type: Date, default: Date.now }
}, { _id: false });

const RequestContextSchema = new Schema({
  suggested_for_category: { type: String },
  source: { type: String, required: true },
  reason: { type: String },
  additional_data: { type: Schema.Types.Mixed }
}, { _id: false });

const PendingCreationRequestSchema = new Schema<IPendingCreationRequest>({
  request_id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  request_type: { 
    type: String, 
    required: true, 
    enum: ['brand', 'category', 'style', 'type', 'attribute'],
    index: true
  },
  requested_value: { 
    type: String, 
    required: true 
  },
  requested_value_normalized: { 
    type: String, 
    required: true,
    index: true
  },
  
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'fulfilled', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  created_at: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  },
  fulfilled_at: { type: Date },
  expires_at: { 
    type: Date, 
    required: true,
    index: true
  },
  
  sf_id_received: { type: String },
  
  requested_by_jobs: [JobReferenceSchema],
  first_requested_by: { 
    type: JobReferenceSchema, 
    required: true 
  },
  request_count: { 
    type: Number, 
    default: 1 
  },
  
  context: { 
    type: RequestContextSchema, 
    required: true 
  },
  
  sent_to_sf_count: { 
    type: Number, 
    default: 1 
  },
  last_sent_at: { type: Date }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'pending_creation_requests'
});

// Compound index for efficient lookup: type + normalized value + status
PendingCreationRequestSchema.index(
  { request_type: 1, requested_value_normalized: 1, status: 1 },
  { name: 'type_value_status_lookup' }
);

// Index for finding pending requests that can be fulfilled
PendingCreationRequestSchema.index(
  { status: 1, request_type: 1 },
  { name: 'status_type_lookup' }
);

// TTL index for auto-expiring old pending requests after 90 days
PendingCreationRequestSchema.index(
  { expires_at: 1 },
  { expireAfterSeconds: 0, name: 'auto_expire_requests' }
);

export const PendingCreationRequest = mongoose.model<IPendingCreationRequest>(
  'PendingCreationRequest',
  PendingCreationRequestSchema
);
