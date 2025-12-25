/**
 * Store global de gestion des erreurs
 * 
 * Centralise toutes les erreurs de l'application pour :
 * - Afficher des modals/toasts appropriés
 * - Logger pour le debugging
 * - Gérer les erreurs critiques
 */

import { create } from 'zustand';
import { ErrorCode, ErrorInfo, getErrorInfo, extractErrorCode } from '../utils/errorMessages';

// ============================================================
// TYPES
// ============================================================

export interface AppError {
  id: string;
  code: ErrorCode;
  info: ErrorInfo;
  timestamp: number;
  context?: string;
  originalError?: any;
  handled: boolean;
}

interface ErrorState {
  // State
  errors: AppError[];
  currentError: AppError | null;
  isOffline: boolean;
  
  // Actions
  addError: (error: any, context?: string) => AppError;
  dismissError: (id: string) => void;
  clearErrors: () => void;
  setCurrentError: (error: AppError | null) => void;
  setOffline: (offline: boolean) => void;
  markAsHandled: (id: string) => void;
  
  // Getters
  getUnhandledErrors: () => AppError[];
  hasUnhandledErrors: () => boolean;
}

// ============================================================
// STORE
// ============================================================

export const useErrorStore = create<ErrorState>((set, get) => ({
  // Initial State
  errors: [],
  currentError: null,
  isOffline: false,

  // Actions
  addError: (error: any, context?: string) => {
    const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const code = extractErrorCode(error);
    const info = getErrorInfo(code);

    const appError: AppError = {
      id,
      code,
      info,
      timestamp: Date.now(),
      context,
      originalError: error,
      handled: false,
    };

    // Logger en dev
    if (__DEV__) {
      console.error(`[ErrorStore] New error:`, {
        code,
        context,
        error,
      });
    }

    set((state) => ({
      errors: [...state.errors.slice(-19), appError], // Garde les 20 dernières erreurs
      currentError: state.currentError || appError,
    }));

    return appError;
  },

  dismissError: (id: string) => {
    set((state) => {
      const newErrors = state.errors.filter((e) => e.id !== id);
      const currentDismissed = state.currentError?.id === id;
      
      return {
        errors: newErrors,
        currentError: currentDismissed 
          ? newErrors.find((e) => !e.handled) || null 
          : state.currentError,
      };
    });
  },

  clearErrors: () => {
    set({ errors: [], currentError: null });
  },

  setCurrentError: (error: AppError | null) => {
    set({ currentError: error });
  },

  setOffline: (offline: boolean) => {
    set({ isOffline: offline });
  },

  markAsHandled: (id: string) => {
    set((state) => ({
      errors: state.errors.map((e) =>
        e.id === id ? { ...e, handled: true } : e
      ),
      currentError:
        state.currentError?.id === id
          ? null
          : state.currentError,
    }));
  },

  // Getters
  getUnhandledErrors: () => {
    return get().errors.filter((e) => !e.handled);
  },

  hasUnhandledErrors: () => {
    return get().errors.some((e) => !e.handled);
  },
}));

export default useErrorStore;