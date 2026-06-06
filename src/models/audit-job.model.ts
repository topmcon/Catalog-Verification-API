import mongoose, { Schema, Document } from 'mongoose';
import { AuditReport, AuditEvidenceSource } from '../types/audit.types';

export interface IAuditJob extends Document {
  auditId: string;
  sfCatalogId: string;
  sfCatalogName: string;
  mode: 'detect' | 'confirm';
  routed: boolean;                 // true when an inbound /salesforce verification call was rerouted here
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found';
  rawRequest: any;                 // original request body (for routed jobs, the full SF verification payload = evidence)
  report?: AuditReport;            // identification-only audit report
  evidenceSource?: AuditEvidenceSource;
  // confirm-mode only:
  confirmPushed?: boolean;         // did the confirmed correction get pushed to SF (Phase 4)?
  confirmPushJobId?: string;       // the VerificationJob id used for the Phase-4 push
  error?: string;
  webhookUrl?: string;
  webhookAttempts: number;
  webhookLastAttempt?: Date;
  webhookSuccess?: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  processingTimeMs?: number;
}

const AuditJobSchema = new Schema<IAuditJob>(
  {
    auditId: { type: String, required: true, unique: true, index: true },
    sfCatalogId: { type: String, required: true, index: true },
    sfCatalogName: { type: String, required: true },
    mode: { type: String, enum: ['detect', 'confirm'], default: 'detect', index: true },
    routed: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'not_found'],
      default: 'pending',
      index: true,
    },
    rawRequest: { type: Schema.Types.Mixed },
    report: { type: Schema.Types.Mixed },
    evidenceSource: { type: String },
    confirmPushed: { type: Boolean },
    confirmPushJobId: { type: String },
    error: { type: String },
    webhookUrl: { type: String },
    webhookAttempts: { type: Number, default: 0 },
    webhookLastAttempt: { type: Date },
    webhookSuccess: { type: Boolean },
    completedAt: { type: Date },
    processingTimeMs: { type: Number },
  },
  {
    timestamps: true,
    collection: 'audit_jobs',
  }
);

AuditJobSchema.index({ sfCatalogId: 1, createdAt: -1 });

export const AuditJob = mongoose.model<IAuditJob>('AuditJob', AuditJobSchema);
