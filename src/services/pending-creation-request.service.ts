import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { 
  PendingCreationRequest, 
  IPendingCreationRequest, 
  RequestType, 
  IJobReference, 
  IRequestContext 
} from '../models/pending-creation-request.model';
import logger from '../utils/logger';

// Placeholder constant for attributes awaiting SF ID
const NEEDS_SF_ID = 'NEEDS_SF_ID';

/**
 * Pending Creation Request Service
 * 
 * Manages outbound requests to Salesforce for creating new picklist items.
 * Prevents duplicate requests by tracking what has already been requested.
 * 
 * Flow:
 * 1. Job needs "Triangle" style → checkAndCreateRequest()
 *    - If pending request exists → return existing (don't create new)
 *    - If not exists → create new request, return it
 * 
 * 2. SF sends picklist sync with "Triangle" → fulfillRequest()
 *    - Match against pending requests
 *    - Update our picklist
 *    - Mark request as fulfilled
 */

export interface CreateRequestOptions {
  requestType: RequestType;
  requestedValue: string;
  jobReference: IJobReference;
  context: IRequestContext;
}

export interface CheckResult {
  exists: boolean;
  request?: IPendingCreationRequest;
  shouldSendToSF: boolean;
  message: string;
}

export interface PendingRequestStats {
  byType: Record<RequestType, number>;
  total: number;
  oldestPending: Date | null;
  recentlyFulfilled: number;
}

class PendingCreationRequestService {
  private static instance: PendingCreationRequestService;
  
  // Default expiry: 90 days
  private readonly DEFAULT_EXPIRY_DAYS = 90;
  
  private constructor() {}
  
  static getInstance(): PendingCreationRequestService {
    if (!PendingCreationRequestService.instance) {
      PendingCreationRequestService.instance = new PendingCreationRequestService();
    }
    return PendingCreationRequestService.instance;
  }
  
  /**
   * Normalize a value for consistent matching
   */
  private normalizeValue(value: string): string {
    return value.toLowerCase().trim().replace(/\s+/g, ' ');
  }
  
  /**
   * Check if a request already exists; if not, create it.
   * Returns whether we should send this request to SF.
   */
  async checkAndCreateRequest(options: CreateRequestOptions): Promise<CheckResult> {
    const { requestType, requestedValue, jobReference, context } = options;
    const normalizedValue = this.normalizeValue(requestedValue);
    
    try {
      // Check for existing pending request
      const existingRequest = await PendingCreationRequest.findOne({
        request_type: requestType,
        requested_value_normalized: normalizedValue,
        status: 'pending'
      });
      
      if (existingRequest) {
        // Request already exists - add this job to the list, don't send again
        existingRequest.requested_by_jobs.push(jobReference);
        existingRequest.request_count += 1;
        existingRequest.updated_at = new Date();
        await existingRequest.save();
        
        logger.info(`[PendingCreationRequest] Duplicate request prevented`, {
          requestType,
          requestedValue,
          existingRequestId: existingRequest.request_id,
          requestCount: existingRequest.request_count,
          jobId: jobReference.job_id
        });
        
        return {
          exists: true,
          request: existingRequest,
          shouldSendToSF: false,
          message: `Request for ${requestType} "${requestedValue}" already pending (ID: ${existingRequest.request_id})`
        };
      }
      
      // Check for recently fulfilled request (within last 24 hours)
      const recentlyFulfilled = await PendingCreationRequest.findOne({
        request_type: requestType,
        requested_value_normalized: normalizedValue,
        status: 'fulfilled',
        fulfilled_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      if (recentlyFulfilled) {
        logger.info(`[PendingCreationRequest] Request was recently fulfilled`, {
          requestType,
          requestedValue,
          fulfilledAt: recentlyFulfilled.fulfilled_at,
          sfId: recentlyFulfilled.sf_id_received
        });
        
        return {
          exists: true,
          request: recentlyFulfilled,
          shouldSendToSF: false,
          message: `Request for ${requestType} "${requestedValue}" was recently fulfilled with SF ID: ${recentlyFulfilled.sf_id_received}`
        };
      }
      
      // Create new request
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.DEFAULT_EXPIRY_DAYS);
      
      const newRequest = new PendingCreationRequest({
        request_id: uuidv4(),
        request_type: requestType,
        requested_value: requestedValue,
        requested_value_normalized: normalizedValue,
        status: 'pending',
        expires_at: expiresAt,
        first_requested_by: jobReference,
        requested_by_jobs: [jobReference],
        request_count: 1,
        context,
        sent_to_sf_count: 1,
        last_sent_at: new Date()
      });
      
      await newRequest.save();
      
      // For ATTRIBUTES: Also add to attributes.json with NEEDS_SF_ID placeholder
      // This allows the attribute to be used immediately while awaiting SF ID
      if (requestType === 'attribute') {
        await this.addAttributeWithPlaceholder(requestedValue);
      }
      
      logger.info(`[PendingCreationRequest] New request created`, {
        requestId: newRequest.request_id,
        requestType,
        requestedValue,
        jobId: jobReference.job_id,
        expiresAt,
        addedToJson: requestType === 'attribute'
      });
      
      return {
        exists: false,
        request: newRequest,
        shouldSendToSF: true,
        message: `New request created for ${requestType} "${requestedValue}"${requestType === 'attribute' ? ' (added to JSON with NEEDS_SF_ID)' : ''}`
      };
      
    } catch (error) {
      logger.error(`[PendingCreationRequest] Error checking/creating request`, {
        error: error instanceof Error ? error.message : String(error),
        requestType,
        requestedValue
      });
      
      // On error, allow the request to go through (fail open)
      return {
        exists: false,
        shouldSendToSF: true,
        message: `Error checking pending requests, allowing request to proceed`
      };
    }
  }
  
  /**
   * Check if a request is pending (without creating)
   */
  async isPending(requestType: RequestType, requestedValue: string): Promise<boolean> {
    const normalizedValue = this.normalizeValue(requestedValue);
    
    const count = await PendingCreationRequest.countDocuments({
      request_type: requestType,
      requested_value_normalized: normalizedValue,
      status: 'pending'
    });
    
    return count > 0;
  }
  
  /**
   * Fulfill a pending request when SF sends the item back
   */
  async fulfillRequest(
    requestType: RequestType, 
    requestedValue: string, 
    sfId: string
  ): Promise<IPendingCreationRequest | null> {
    const normalizedValue = this.normalizeValue(requestedValue);
    
    const request = await PendingCreationRequest.findOneAndUpdate(
      {
        request_type: requestType,
        requested_value_normalized: normalizedValue,
        status: 'pending'
      },
      {
        $set: {
          status: 'fulfilled',
          fulfilled_at: new Date(),
          sf_id_received: sfId,
          updated_at: new Date()
        }
      },
      { new: true }
    );
    
    if (request) {
      logger.info(`[PendingCreationRequest] Request fulfilled`, {
        requestId: request.request_id,
        requestType,
        requestedValue,
        sfId,
        jobsWaiting: request.requested_by_jobs.length
      });
    }
    
    return request;
  }
  
  /**
   * Reject a pending request
   */
  async rejectRequest(
    requestType: RequestType, 
    requestedValue: string, 
    reason: string
  ): Promise<IPendingCreationRequest | null> {
    const normalizedValue = this.normalizeValue(requestedValue);
    
    const request = await PendingCreationRequest.findOneAndUpdate(
      {
        request_type: requestType,
        requested_value_normalized: normalizedValue,
        status: 'pending'
      },
      {
        $set: {
          status: 'rejected',
          updated_at: new Date(),
          'context.rejection_reason': reason
        }
      },
      { new: true }
    );
    
    if (request) {
      logger.info(`[PendingCreationRequest] Request rejected`, {
        requestId: request.request_id,
        requestType,
        requestedValue,
        reason
      });
    }
    
    return request;
  }
  
  /**
   * Get all pending requests
   */
  async getPendingRequests(requestType?: RequestType): Promise<IPendingCreationRequest[]> {
    const query: any = { status: 'pending' };
    if (requestType) {
      query.request_type = requestType;
    }
    
    return PendingCreationRequest.find(query)
      .sort({ created_at: -1 })
      .exec();
  }
  
  /**
   * Get statistics about pending requests
   */
  async getStats(): Promise<PendingRequestStats> {
    const [pending, recentlyFulfilled] = await Promise.all([
      PendingCreationRequest.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: '$request_type', count: { $sum: 1 } } }
      ]),
      PendingCreationRequest.countDocuments({
        status: 'fulfilled',
        fulfilled_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);
    
    const byType: Record<RequestType, number> = {
      brand: 0,
      category: 0,
      style: 0,
      type: 0,
      attribute: 0
    };
    
    let total = 0;
    for (const item of pending) {
      byType[item._id as RequestType] = item.count;
      total += item.count;
    }
    
    const oldestPending = await PendingCreationRequest
      .findOne({ status: 'pending' })
      .sort({ created_at: 1 })
      .select('created_at')
      .exec();
    
    return {
      byType,
      total,
      oldestPending: oldestPending?.created_at || null,
      recentlyFulfilled
    };
  }
  
  /**
   * Get detailed report for Establish Connection
   */
  async getDetailedReport(): Promise<{
    stats: PendingRequestStats;
    pendingByType: Record<RequestType, Array<{
      value: string;
      requestCount: number;
      firstRequestedAt: Date;
      jobsWaiting: number;
      category?: string;
    }>>;
  }> {
    const stats = await this.getStats();
    
    const pendingRequests = await this.getPendingRequests();
    
    const pendingByType: Record<RequestType, Array<any>> = {
      brand: [],
      category: [],
      style: [],
      type: [],
      attribute: []
    };
    
    for (const req of pendingRequests) {
      pendingByType[req.request_type].push({
        value: req.requested_value,
        requestCount: req.request_count,
        firstRequestedAt: req.created_at,
        jobsWaiting: req.requested_by_jobs.length,
        category: req.context.suggested_for_category
      });
    }
    
    return { stats, pendingByType };
  }
  
  /**
   * Try to fulfill requests from incoming picklist sync data
   * Called when SF sends a picklist sync
   */
  async tryFulfillFromSync(
    requestType: RequestType,
    items: Array<{ name: string; id: string }>
  ): Promise<{ fulfilled: number; items: string[] }> {
    let fulfilled = 0;
    const fulfilledItems: string[] = [];
    
    for (const item of items) {
      const result = await this.fulfillRequest(requestType, item.name, item.id);
      if (result) {
        fulfilled++;
        fulfilledItems.push(item.name);
      }
    }
    
    if (fulfilled > 0) {
      logger.info(`[PendingCreationRequest] Fulfilled ${fulfilled} requests from sync`, {
        requestType,
        fulfilledItems
      });
    }
    
    return { fulfilled, items: fulfilledItems };
  }
  
  /**
   * Add an attribute to attributes.json with NEEDS_SF_ID placeholder
   * This allows the attribute to be used in verification while awaiting the real SF ID
   */
  private async addAttributeWithPlaceholder(attributeName: string): Promise<boolean> {
    try {
      const attributesPath = path.join(process.cwd(), 'src/config/salesforce-picklists/attributes.json');
      
      // Read existing attributes
      const existingAttributes: Array<{ attribute_id: string; attribute_name: string }> = 
        JSON.parse(fs.readFileSync(attributesPath, 'utf8'));
      
      // Check if already exists (case-insensitive)
      const normalizedName = attributeName.toLowerCase().trim();
      const exists = existingAttributes.some(
        attr => attr.attribute_name.toLowerCase().trim() === normalizedName
      );
      
      if (exists) {
        logger.info(`[PendingCreationRequest] Attribute already exists in JSON, skipping`, {
          attributeName
        });
        return false;
      }
      
      // Add new attribute with NEEDS_SF_ID placeholder
      existingAttributes.push({
        attribute_id: NEEDS_SF_ID,
        attribute_name: attributeName
      });
      
      // Sort alphabetically
      existingAttributes.sort((a, b) => a.attribute_name.localeCompare(b.attribute_name));
      
      // Write back
      fs.writeFileSync(attributesPath, JSON.stringify(existingAttributes, null, 2), 'utf8');
      
      logger.info(`[PendingCreationRequest] Added attribute to JSON with NEEDS_SF_ID`, {
        attributeName,
        totalAttributes: existingAttributes.length
      });
      
      return true;
      
    } catch (error) {
      logger.error(`[PendingCreationRequest] Failed to add attribute to JSON`, {
        attributeName,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
  
  /**
   * Get count of attributes with NEEDS_SF_ID placeholder
   */
  async getAttributesPendingSfId(): Promise<{ count: number; attributes: string[] }> {
    try {
      const attributesPath = path.join(process.cwd(), 'src/config/salesforce-picklists/attributes.json');
      const attributes: Array<{ attribute_id: string; attribute_name: string }> = 
        JSON.parse(fs.readFileSync(attributesPath, 'utf8'));
      
      const pending = attributes.filter(attr => attr.attribute_id === NEEDS_SF_ID);
      
      return {
        count: pending.length,
        attributes: pending.map(attr => attr.attribute_name)
      };
    } catch (error) {
      logger.error('Failed to get attributes pending SF ID', { error });
      return { count: 0, attributes: [] };
    }
  }
}

export const pendingCreationRequestService = PendingCreationRequestService.getInstance();
