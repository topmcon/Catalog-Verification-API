/**
 * Pending Picklist Sync Model
 * 
 * Holds incoming Salesforce picklist sync requests for manual review.
 * Syncs are NOT applied automatically - they require explicit approval.
 * 
 * This prevents accidental overwrites of custom fields (subcategory, styles_apply, etc.)
 * that exist in our system but not in Salesforce.
 */

import mongoose, { Document, Schema } from 'mongoose';

// What would change if this sync is applied
export interface IPendingChange {
  type: 'attributes' | 'brands' | 'categories' | 'styles' | 'types' | 'departments' | 'families';
  current_count: number;
  incoming_count: number;
  items_to_add: string[];      // Names of items that would be added
  items_to_remove: string[];   // Names of items that would be removed
  custom_fields_at_risk: string[];  // Custom fields that would be lost (e.g., subcategory, styles_apply)
}

// Impact assessment for review
export interface IImpactAssessment {
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  total_additions: number;
  total_removals: number;
  custom_fields_at_risk: number;
  warnings: string[];
}

// Main pending sync document
export interface IPendingPicklistSync extends Document {
  pending_id: string;
  created_at: Date;
  expires_at: Date;
  
  // Source info
  source_ip: string;
  user_agent?: string;
  api_key_hint?: string;
  
  // Original request
  incoming_data: {
    attributes?: any[];
    brands?: any[];
    categories?: any[];
    styles?: any[];
    types?: any[];
    departments?: any[];
    families?: any[];
    category_filter_attributes?: Record<string, any>;
    replace_mode?: boolean;
  };
  
  // Analysis of what would change
  pending_changes: IPendingChange[];
  impact_assessment: IImpactAssessment;
  
  // Current state snapshot (for comparison)
  current_state_snapshot: {
    attributes_count: number;
    brands_count: number;
    categories_count: number;
    styles_count: number;
    types_count: number;
    departments_count: number;
    families_count: number;
  };
  
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reviewed_at?: Date;
  reviewed_by?: string;  // Could be 'copilot-session' or user identifier
  review_notes?: string;
  
  // If approved, the sync log ID from when it was applied
  applied_sync_id?: string;
}

const PendingChangeSchema = new Schema<IPendingChange>({
  type: { 
    type: String, 
    enum: ['attributes', 'brands', 'categories', 'styles', 'types', 'departments', 'families'],
    required: true 
  },
  current_count: { type: Number, required: true },
  incoming_count: { type: Number, required: true },
  items_to_add: [{ type: String }],
  items_to_remove: [{ type: String }],
  custom_fields_at_risk: [{ type: String }]
}, { _id: false });

const ImpactAssessmentSchema = new Schema<IImpactAssessment>({
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    required: true 
  },
  reason: { type: String, required: true },
  total_additions: { type: Number, required: true },
  total_removals: { type: Number, required: true },
  custom_fields_at_risk: { type: Number, required: true },
  warnings: [{ type: String }]
}, { _id: false });

const PendingPicklistSyncSchema = new Schema<IPendingPicklistSync>({
  pending_id: { type: String, required: true, unique: true, index: true },
  created_at: { type: Date, required: true, default: Date.now, index: true },
  expires_at: { type: Date, required: true, index: true },
  
  source_ip: { type: String, required: true },
  user_agent: { type: String },
  api_key_hint: { type: String },
  
  incoming_data: {
    attributes: [{ type: Schema.Types.Mixed }],
    brands: [{ type: Schema.Types.Mixed }],
    categories: [{ type: Schema.Types.Mixed }],
    styles: [{ type: Schema.Types.Mixed }],
    types: [{ type: Schema.Types.Mixed }],
    departments: [{ type: Schema.Types.Mixed }],
    families: [{ type: Schema.Types.Mixed }],
    category_filter_attributes: { type: Schema.Types.Mixed },
    replace_mode: { type: Boolean }
  },
  
  pending_changes: [PendingChangeSchema],
  impact_assessment: ImpactAssessmentSchema,
  
  current_state_snapshot: {
    attributes_count: { type: Number },
    brands_count: { type: Number },
    categories_count: { type: Number },
    styles_count: { type: Number },
    types_count: { type: Number },
    departments_count: { type: Number },
    families_count: { type: Number }
  },
  
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'expired'],
    required: true,
    default: 'pending',
    index: true
  },
  reviewed_at: { type: Date },
  reviewed_by: { type: String },
  review_notes: { type: String },
  
  applied_sync_id: { type: String }
}, {
  timestamps: true,
  collection: 'pending_picklist_syncs'
});

// Index for finding pending syncs
PendingPicklistSyncSchema.index({ status: 1, created_at: -1 });

// TTL index - auto-expire pending syncs after 30 days (mark as expired, don't delete)
// Note: We'll handle expiration manually to preserve history

export const PendingPicklistSync = mongoose.model<IPendingPicklistSync>('PendingPicklistSync', PendingPicklistSyncSchema);
export default PendingPicklistSync;
