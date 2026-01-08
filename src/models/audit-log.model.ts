import mongoose, { Schema, Document } from 'mongoose';

/**
 * Audit Log Types
 */
export type AuditAction =
  | 'session_created'
  | 'session_started'
  | 'session_completed'
  | 'session_failed'
  | 'product_cleaned'
  | 'ai_validation_openai'
  | 'ai_validation_xai'
  | 'consensus_reached'
  | 'consensus_retry'
  | 'consensus_failed'
  | 'product_verified'
  | 'product_flagged'
  | 'salesforce_export'
  | 'error';

/**
 * Audit Log Document Interface
 */
export interface IAuditLog extends Document {
  sessionId: string;
  productId?: string;
  action: AuditAction;
  details: Record<string, unknown>;
  metadata?: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  timestamp: Date;
}

/**
 * Audit Log Schema
 */
const AuditLogSchema = new Schema<IAuditLog>(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    productId: {
      type: String,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'session_created',
        'session_started',
        'session_completed',
        'session_failed',
        'product_cleaned',
        'ai_validation_openai',
        'ai_validation_xai',
        'consensus_reached',
        'consensus_retry',
        'consensus_failed',
        'product_verified',
        'product_flagged',
        'salesforce_export',
        'error',
      ],
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      userId: String,
      ipAddress: String,
      userAgent: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'audit_logs',
  }
);

// Compound indexes for efficient querying
AuditLogSchema.index({ sessionId: 1, action: 1 });
AuditLogSchema.index({ sessionId: 1, timestamp: -1 });
AuditLogSchema.index({ productId: 1, timestamp: -1 });

// TTL index to automatically delete old logs (90 days)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

/**
 * Audit Log Model
 */
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
