import logger from '../utils/logger';

/**
 * Error Recovery Service
 * Provides retry logic, circuit breaker, and fallback mechanisms for AI calls
 */

interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
}

enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Too many failures, blocking calls
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;
  
  constructor(
    private serviceName: string,
    private config: CircuitBreakerConfig
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.config.resetTimeout) {
        logger.info(`[CircuitBreaker:${this.serviceName}] Transitioning to HALF_OPEN`);
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker OPEN for ${this.serviceName}`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        logger.info(`[CircuitBreaker:${this.serviceName}] Recovered - transitioning to CLOSED`);
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      logger.error(`[CircuitBreaker:${this.serviceName}] Failure threshold reached - opening circuit`);
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successCount = 0;
  }
}

export class ErrorRecoveryService {
  private static openAICircuitBreaker = new CircuitBreaker('OpenAI', {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringWindow: 300000 // 5 minutes
  });

  private static xAICircuitBreaker = new CircuitBreaker('xAI', {
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoringWindow: 300000
  });

  /**
   * Execute function with retry logic and exponential backoff
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    serviceName: string,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config: RetryOptions = {
      maxAttempts: options.maxAttempts ?? 3,
      initialDelay: options.initialDelay ?? 1000,
      maxDelay: options.maxDelay ?? 10000,
      backoffMultiplier: options.backoffMultiplier ?? 2
    };

    let lastError: Error | undefined;
    let delay = config.initialDelay;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        logger.debug(`[Retry:${serviceName}] Attempt ${attempt}/${config.maxAttempts}`);
        return await fn();
      } catch (error) {
        lastError = error as Error;
        logger.warn(`[Retry:${serviceName}] Attempt ${attempt} failed: ${error}`);

        if (attempt < config.maxAttempts) {
          logger.debug(`[Retry:${serviceName}] Waiting ${delay}ms before retry`);
          await this.sleep(delay);
          delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
        }
      }
    }

    logger.error(`[Retry:${serviceName}] All ${config.maxAttempts} attempts failed`);
    throw lastError || new Error(`Failed after ${config.maxAttempts} attempts`);
  }

  /**
   * Execute with circuit breaker protection
   */
  static async withCircuitBreaker<T>(
    fn: () => Promise<T>,
    provider: 'openai' | 'xai'
  ): Promise<T> {
    const breaker = provider === 'openai' 
      ? this.openAICircuitBreaker 
      : this.xAICircuitBreaker;

    return breaker.execute(fn);
  }

  /**
   * Execute with both retry and circuit breaker
   */
  static async executeWithProtection<T>(
    fn: () => Promise<T>,
    provider: 'openai' | 'xai',
    retryOptions?: Partial<RetryOptions>
  ): Promise<T> {
    return this.withCircuitBreaker(
      () => this.withRetry(fn, provider, retryOptions),
      provider
    );
  }

  /**
   * Get circuit breaker status
   */
  static getCircuitBreakerStatus(provider: 'openai' | 'xai'): CircuitState {
    const breaker = provider === 'openai' 
      ? this.openAICircuitBreaker 
      : this.xAICircuitBreaker;
    return breaker.getState();
  }

  /**
   * Reset circuit breaker (for testing or manual recovery)
   */
  static resetCircuitBreaker(provider: 'openai' | 'xai'): void {
    const breaker = provider === 'openai' 
      ? this.openAICircuitBreaker 
      : this.xAICircuitBreaker;
    breaker.reset();
    logger.info(`[CircuitBreaker:${provider}] Manually reset`);
  }

  /**
   * Sleep utility for delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get fallback analysis result when AI completely fails
   */
  static getFallbackAnalysis(
    productData: any,
    reason: string
  ): any {
    logger.warn(`[Fallback] Generating fallback analysis: ${reason}`);

    // Return basic analysis based on available data
    return {
      category: productData.Web_Retailer_Category || 'Uncategorized',
      primary_attributes: {
        brand: productData.Brand_Web_Retailer || productData.Ferguson_Brand || '',
        title: productData.Product_Title_Web_Retailer || productData.SF_Catalog_Name || '',
        description: productData.Product_Description_Web_Retailer || '',
        model_number: productData.Model_Number_Web_Retailer || '',
        msrp: productData.MSRP_Web_Retailer || productData.Ferguson_Price || ''
      },
      top_filter_attributes: {},
      additional_attributes: {},
      confidence_score: 40, // Low confidence for fallback
      analysis_notes: `Fallback analysis generated due to: ${reason}. Manual review recommended.`,
      is_fallback: true
    };
  }

  /**
   * Check if result is a fallback
   */
  static isFallbackResult(result: any): boolean {
    return result?.is_fallback === true;
  }
}

export default ErrorRecoveryService;
