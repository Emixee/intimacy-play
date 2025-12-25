/**
 * Service centralisé de gestion des erreurs
 * 
 * Fournit :
 * - Wrapper try-catch standardisé
 * - Retry automatique pour Firebase
 * - Logging unifié
 * - Conversion en messages user-friendly
 */

import { ApiResponse } from '../types';
import { 
  ErrorCode, 
  extractErrorCode, 
  getErrorInfo, 
  formatErrorForUser 
} from '../utils/errorMessages';

// ============================================================
// TYPES
// ============================================================

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  retryableErrors: ErrorCode[];
}

interface ErrorLogEntry {
  timestamp: number;
  code: ErrorCode;
  context: string;
  error: any;
  stack?: string;
}

// ============================================================
// CONFIGURATION
// ============================================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  retryableErrors: [
    'network/offline',
    'network/timeout',
    'network/server-error',
    'firestore/unavailable',
    'firestore/deadline-exceeded',
    'auth/network-request-failed',
  ],
};

// ============================================================
// SERVICE
// ============================================================

class ErrorService {
  private errorLog: ErrorLogEntry[] = [];
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  /**
   * Configure les options de retry
   */
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Exécute une fonction avec retry automatique
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    context: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<ApiResponse<T>> {
    const config = { ...this.retryConfig, ...customConfig };
    let lastError: any = null;
    let delay = config.delayMs;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await fn();
        return { success: true, data: result };
      } catch (error: any) {
        lastError = error;
        const errorCode = extractErrorCode(error);

        // Log l'erreur
        this.logError(errorCode, context, error);

        // Vérifier si l'erreur est retryable
        const isRetryable = config.retryableErrors.includes(errorCode);
        const hasMoreAttempts = attempt < config.maxAttempts;

        if (isRetryable && hasMoreAttempts) {
          console.log(
            `[ErrorService] Retry ${attempt}/${config.maxAttempts} for ${context} in ${delay}ms`
          );
          await this.sleep(delay);
          delay *= config.backoffMultiplier;
        } else {
          // Ne pas retry
          break;
        }
      }
    }

    // Toutes les tentatives ont échoué
    const errorInfo = getErrorInfo(extractErrorCode(lastError));
    return {
      success: false,
      error: errorInfo.message,
      code: errorInfo.code,
    };
  }

  /**
   * Exécute une fonction avec gestion d'erreur simple (sans retry)
   */
  async withErrorHandling<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<ApiResponse<T>> {
    try {
      const result = await fn();
      return { success: true, data: result };
    } catch (error: any) {
      const errorCode = extractErrorCode(error);
      this.logError(errorCode, context, error);

      const errorInfo = getErrorInfo(errorCode);
      return {
        success: false,
        error: errorInfo.message,
        code: errorCode,
      };
    }
  }

  /**
   * Crée une réponse d'erreur standardisée
   */
  createErrorResponse(error: any, context?: string): ApiResponse {
    const errorCode = extractErrorCode(error);
    
    if (context) {
      this.logError(errorCode, context, error);
    }

    const { message } = formatErrorForUser(error);
    return {
      success: false,
      error: message,
      code: errorCode,
    };
  }

  /**
   * Vérifie si une erreur est de type réseau
   */
  isNetworkError(error: any): boolean {
    const code = extractErrorCode(error);
    return code.startsWith('network/') || 
           code === 'auth/network-request-failed' ||
           code === 'firestore/unavailable';
  }

  /**
   * Vérifie si une erreur est retryable
   */
  isRetryable(error: any): boolean {
    const code = extractErrorCode(error);
    return this.retryConfig.retryableErrors.includes(code);
  }

  /**
   * Log une erreur
   */
  logError(code: ErrorCode, context: string, error: any): void {
    const entry: ErrorLogEntry = {
      timestamp: Date.now(),
      code,
      context,
      error: error?.message || error,
      stack: error?.stack,
    };

    this.errorLog.push(entry);

    // Garder les 100 dernières erreurs
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Log en dev
    if (__DEV__) {
      console.error(`[${context}] Error:`, code, error?.message || error);
    }
  }

  /**
   * Récupère le log d'erreurs
   */
  getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog];
  }

  /**
   * Efface le log d'erreurs
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Utilitaire pour attendre
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton
export const errorService = new ErrorService();
export default errorService;