/**
 * Picklist Sync Log Model
 * Tracks all picklist sync operations for audit trail
 * Logs old vs new data, timestamps, and changes
 */

import mongoose, { Document, Schema } from 'mongoose';

// Individual picklist item change
export interface IPicklistChange {
  type: 'added' | 'removed' | 'modified';
  item_id: string;
  item_name: string;
  old_value?: any;
  new_value?: any;
}

// Summary of changes for one picklist type
export interface IPicklistTypeSummary {
  type: 'attributes' | 'brands' | 'categories' | 'styles' | 'category_filter_attributes';
  previous_count: number;
  new_count: number;
  items_added: number;
  items_removed: number;
  added_items: string[];    // Names of added items
  removed_items: string[];  // Names of removed items
}

// Main sync log document
export interface IPicklistSyncLog extends Document {
  sync_id: string;
  timestamp: Date;
  source_ip: string;
  user_agent?: string;
  api_key_hint?: string;  // Last 4 chars of API key for identification
  
  // Request details
  request_body_size: number;
  picklist_types_included: string[];
  
  // Results
  success: boolean;
  sync_errors: string[];  // Renamed to avoid conflict with mongoose Document.errors
  
  // Change summaries by type
  summaries: IPicklistTypeSummary[];
  
  // Detailed changes (optional, for debugging)
  detailed_changes?: {
    attributes?: IPicklistChange[];
    brands?: IPicklistChange[];
    categories?: IPicklistChange[];
    styles?: IPicklistChange[];
  };
  
  // Timing
  processing_time_ms: number;
  
  // Snapshots (for rollback capability)
  snapshots?: {
    attributes_before?: any[];
    brands_before?: any[];
    categories_before?: any[];
    styles_before?: any[];
  };
}

const PicklistChangeSchema = new Schema<IPicklistChange>({
  type: { type: String, enum: ['added', 'removed', 'modified'], required: true },
  item_id: { type: String, required: true },
  item_name: { type: String, required: true },
  old_value: { type: Schema.Types.Mixed },
  new_value: { type: Schema.Types.Mixed }
}, { _id: false });

const PicklistTypeSummarySchema = new Schema<IPicklistTypeSummary>({
  type: { type: String, enum: ['attributes', 'brands', 'categories', 'styles', 'category_filter_attributes'], required: true },
  previous_count: { type: Number, required: true },
  new_count: { type: Number, required: true },
  items_added: { type: Number, required: true },
  items_removed: { type: Number, required: true },
  added_items: [{ type: String }],
  removed_items: [{ type: String }]
}, { _id: false });

const PicklistSyncLogSchema = new Schema<IPicklistSyncLog>({
  sync_id: { type: String, required: true, unique: true, index: true },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  source_ip: { type: String, required: true },
  user_agent: { type: String },
  api_key_hint: { type: String },
  
  request_body_size: { type: Number, required: true },
  picklist_types_included: [{ type: String }],
  
  success: { type: Boolean, required: true, index: true },
  sync_errors: [{ type: String }],
  
  summaries: [PicklistTypeSummarySchema],
  
  detailed_changes: {
    attributes: [PicklistChangeSchema],
    brands: [PicklistChangeSchema],
    categories: [PicklistChangeSchema],
    styles: [PicklistChangeSchema]
  },
  
  processing_time_ms: { type: Number, required: true },
  
  snapshots: {
    attributes_before: [{ type: Schema.Types.Mixed }],
    brands_before: [{ type: Schema.Types.Mixed }],
    categories_before: [{ type: Schema.Types.Mixed }],
    styles_before: [{ type: Schema.Types.Mixed }]
  }
}, {
  timestamps: true,
  collection: 'picklist_sync_logs'
});

// Index for querying recent syncs
PicklistSyncLogSchema.index({ timestamp: -1 });

// Index for finding failed syncs
PicklistSyncLogSchema.index({ success: 1, timestamp: -1 });

// TTL index - keep logs for 90 days
PicklistSyncLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const PicklistSyncLog = mongoose.model<IPicklistSyncLog>('PicklistSyncLog', PicklistSyncLogSchema);
export default PicklistSyncLog;
