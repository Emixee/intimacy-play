/**
 * Hook principal de gestion d'erreurs
 * 
 * Fournit :
 * - Accès au store d'erreurs
 * - Méthodes pour afficher/gérer les erreurs
 * - Intégration avec Toast
 */

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useErrorStore, AppError } from '../stores/errorStore';
import { useToast } from '../components/ui/Toast';
import { 
  ErrorCode, 
  getErrorInfo, 
  extractErrorCode, 
  ErrorInfo 
} from '../utils/errorMessages';

// ============================================================
// TYPES
// ============================================================

interface UseErrorReturn {
  // State
  currentError: AppError | null;
  errors: AppError[];
  isOffline: boolean;
  hasErrors: boolean;
  
  // Actions
  handleError: (error: any, context?: string) => AppError;
  handleErrorWithToast: (error: any, context?: string) => void;
  dismissError: (id?: string) => void;
  clearAllErrors: () => void;
  
  // Session-specific handlers
  handleSessionError: (error: any) => void;
  handleMediaError: (error: any) => void;
  handleNetworkError: (error: any) => void;
  
  // Navigation helpers
  navigateOnError: (error: AppError) => void;
}

// ============================================================
// HOOK
// ============================================================

export const useError = (): UseErrorReturn => {
  const router = useRouter();
  const toast = useToast();
  
  // Store
  const {
    currentError,
    errors,
    isOffline,
    addError,
    dismissError: dismissErrorFromStore,
    clearErrors,
    markAsHandled,
  } = useErrorStore();

  // ----------------------------------------------------------
  // GESTION D'ERREUR DE BASE
  // ----------------------------------------------------------

  /**
   * Gère une erreur et l'ajoute au store
   */
  const handleError = useCallback((error: any, context?: string): AppError => {
    return addError(error, context);
  }, [addError]);

  /**
   * Gère une erreur et affiche un toast
   */
  const handleErrorWithToast = useCallback((error: any, context?: string): void => {
    const appError = addError(error, context);
    
    // Afficher le toast approprié
    const toastDuration = appError.info.retryable ? 5000 : 4000;
    
    toast.error(
      appError.info.title,
      appError.info.message,
      toastDuration
    );
    
    // Marquer comme handled puisqu'on a affiché le toast
    markAsHandled(appError.id);
  }, [addError, toast, markAsHandled]);

  /**
   * Dismiss une erreur spécifique ou la courante
   */
  const dismissError = useCallback((id?: string): void => {
    const errorId = id || currentError?.id;
    if (errorId) {
      dismissErrorFromStore(errorId);
    }
  }, [currentError, dismissErrorFromStore]);

  /**
   * Efface toutes les erreurs
   */
  const clearAllErrors = useCallback((): void => {
    clearErrors();
  }, [clearErrors]);

  // ----------------------------------------------------------
  // GESTIONNAIRES SPÉCIFIQUES
  // ----------------------------------------------------------

  /**
   * Gère les erreurs de session (partenaire parti, session expirée, etc.)
   */
  const handleSessionError = useCallback((error: any): void => {
    const code = extractErrorCode(error);
    const appError = addError(error, 'session');
    
    switch (code) {
      case 'session/partner-left':
        toast.warning(
          appError.info.title,
          appError.info.message,
          6000
        );
        // Rediriger après un délai
        setTimeout(() => {
          router.replace('/(main)/home');
        }, 2000);
        break;
        
      case 'session/expired':
      case 'session/not-found':
        toast.error(appError.info.title, appError.info.message);
        router.replace('/(main)/home');
        break;
        
      case 'session/already-started':
      case 'session/full':
        toast.warning(appError.info.title, appError.info.message);
        break;
        
      default:
        toast.error(appError.info.title, appError.info.message);
    }
    
    markAsHandled(appError.id);
  }, [addError, toast, router, markAsHandled]);

  /**
   * Gère les erreurs de média (expiré, upload/download failed)
   */
  const handleMediaError = useCallback((error: any): void => {
    const code = extractErrorCode(error);
    const appError = addError(error, 'media');
    
    switch (code) {
      case 'media/expired':
        toast.warning(
          appError.info.title,
          'Le contenu a expiré. Demandez à votre partenaire de le renvoyer.',
          5000
        );
        break;
        
      case 'media/upload-failed':
      case 'media/download-failed':
        toast.error(
          appError.info.title,
          appError.info.message,
          5000
        );
        break;
        
      default:
        toast.error(appError.info.title, appError.info.message);
    }
    
    markAsHandled(appError.id);
  }, [addError, toast, markAsHandled]);

  /**
   * Gère les erreurs réseau
   */
  const handleNetworkError = useCallback((error: any): void => {
    const appError = addError(error, 'network');
    
    toast.warning(
      appError.info.title,
      appError.info.message,
      6000
    );
    
    markAsHandled(appError.id);
  }, [addError, toast, markAsHandled]);

  // ----------------------------------------------------------
  // NAVIGATION HELPERS
  // ----------------------------------------------------------

  /**
   * Navigation automatique basée sur le type d'erreur
   */
  const navigateOnError = useCallback((error: AppError): void => {
    const { code } = error;
    
    // Erreurs qui nécessitent un retour à l'accueil
    const homeErrors: ErrorCode[] = [
      'session/not-found',
      'session/expired',
      'session/partner-left',
    ];
    
    // Erreurs qui nécessitent une reconnexion
    const authErrors: ErrorCode[] = [
      'auth/requires-recent-login',
      'auth/user-disabled',
    ];
    
    if (homeErrors.includes(code)) {
      router.replace('/(main)/home');
    } else if (authErrors.includes(code)) {
      router.replace('/(auth)/login');
    }
  }, [router]);

  // ----------------------------------------------------------
  // RETURN
  // ----------------------------------------------------------

  return {
    // State
    currentError,
    errors,
    isOffline,
    hasErrors: errors.length > 0,
    
    // Actions
    handleError,
    handleErrorWithToast,
    dismissError,
    clearAllErrors,
    
    // Specific handlers
    handleSessionError,
    handleMediaError,
    handleNetworkError,
    
    // Navigation
    navigateOnError,
  };
};

export default useError;