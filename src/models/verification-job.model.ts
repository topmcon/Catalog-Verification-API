import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationJob extends Document {
  jobId: string;
  sfCatalogId: string; // SF_Catalog_Id from Salesforce
  sfCatalogName: string; // SF_Catalog_Name (model number)
  status: 'pending' | 'processing' | 'completed' | 'failed';
  rawPayload: any; // Original request from Salesforce
  result?: any; // Final verification result
  error?: string;
  webhookUrl?: string; // Salesforce callback URL
  webhookAttempts: number;
  webhookLastAttempt?: Date;
  webhookSuccess?: boolean;
  // Salesforce confirmation fields
  salesforceAcknowledged?: boolean; // Did SF confirm they received webhook?
  salesforceProcessed?: boolean; // Did SF successfully process the data?
  salesforceError?: string; // Any error SF reported when processing
  salesforceAcknowledgedAt?: Date; // When SF confirmed receipt
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  processingTimeMs?: number;
}

const VerificationJobSchema = new Schema<IVerificationJob>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    sfCatalogId: { type: String, required: true, index: true },
    sfCatalogName: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    rawPayload: { type: Schema.Types.Mixed, required: true },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
    webhookUrl: { type: String },
    webhookAttempts: { type: Number, default: 0 },
    webhookLastAttempt: { type: Date },
    webhookSuccess: { type: Boolean },
    salesforceAcknowledged: { type: Boolean },
    salesforceProcessed: { type: Boolean },
    salesforceError: { type: String },
    salesforceAcknowledgedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    processingTimeMs: { type: Number }
  },
  {
    timestamps: true,
    collection: 'verification_jobs'
  }
);

// Indexes for efficient querying
VerificationJobSchema.index({ status: 1, createdAt: -1 });
VerificationJobSchema.index({ sfCatalogId: 1, createdAt: -1 });
VerificationJobSchema.index({ jobId: 1 });

export const VerificationJob = mongoose.model<IVerificationJob>(
  'VerificationJob',
  VerificationJobSchema
);
