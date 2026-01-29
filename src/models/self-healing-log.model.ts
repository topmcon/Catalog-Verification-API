import mongoose, { Schema, Document } from 'mongoose';

export interface ISelfHealingLog extends Document {
  jobId: string;
  issueType: string;
  detectedAt: Date;
  diagnosisTimestamp?: Date;
  consensusAchieved: boolean;
  openaiDiagnosis?: any;
  xaiDiagnosis?: any;
  selectedFix?: any;
  systemWideFixes?: any[];
  attemptsTaken: number;
  attempts: Array<{
    attemptNumber: number;
    openaiApproval: boolean;
    xaiApproval: boolean;
    timestamp: Date;
  }>;
  finalOutcome: 'success' | 'failed' | 'escalated';
  sfCorrectionSent: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const selfHealingLogSchema = new Schema({
  jobId: {
    type: String,
    required: true,
    index: true
  },
  issueType: {
    type: String,
    enum: ['missing_data', 'mapping_failure', 'logic_error', 'picklist_mismatch']
  },
  detectedAt: {
    type: Date,
    default: Date.now
  },
  diagnosisTimestamp: Date,
  consensusAchieved: {
    type: Boolean,
    default: false
  },
  openaiDiagnosis: Schema.Types.Mixed,
  xaiDiagnosis: Schema.Types.Mixed,
  selectedFix: Schema.Types.Mixed,
  systemWideFixes: [Schema.Types.Mixed],
  attemptsTaken: {
    type: Number,
    default: 0
  },
  attempts: [{
    attemptNumber: Number,
    openaiApproval: Boolean,
    xaiApproval: Boolean,
    timestamp: Date
  }],
  finalOutcome: {
    type: String,
    enum: ['success', 'failed', 'escalated'],
    required: true
  },
  sfCorrectionSent: {
    type: Boolean,
    default: false
  },
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
selfHealingLogSchema.index({ jobId: 1, createdAt: -1 });
selfHealingLogSchema.index({ finalOutcome: 1 });
selfHealingLogSchema.index({ consensusAchieved: 1 });

export const SelfHealingLog = mongoose.model<ISelfHealingLog>('SelfHealingLog', selfHealingLogSchema);
