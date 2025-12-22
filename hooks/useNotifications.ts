/**
 * Hook pour gérer les notifications
 * 
 * CORRECTIF : Évite les boucles infinies avec des sélecteurs stables
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { notificationService } from '../services/notification.service';
import { userService } from '../services/user.service';
import { useAuthStore } from '../stores/authStore';

interface UseNotificationsReturn {
  /** Les notifications sont-elles supportées sur cet appareil */
  isSupported: boolean;
  /** Les notifications sont-elles activées */
  isEnabled: boolean;
  /** Chargement en cours */
  isLoading: boolean;
  /** Token FCM */
  token: string | null;
  /** Message d'erreur */
  error: string | null;
  /** Est-on dans Expo Go (pas de notifications) */
  isExpoGo: boolean;
  /** Initialiser les notifications */
  initialize: () => Promise<void>;
}

/**
 * Vérifie si on est dans Expo Go
 */
const checkIsExpoGo = (): boolean => {
  return Constants.appOwnership === 'expo';
};

// Vérifier Expo Go une seule fois au chargement du module
const IS_EXPO_GO = checkIsExpoGo();

export const useNotifications = (): UseNotificationsReturn => {
  // Sélectionner UNIQUEMENT les valeurs primitives nécessaires du store
  const firebaseUserId = useAuthStore((state) => state.firebaseUser?.uid ?? null);
  const notificationsEnabled = useAuthStore((state) => state.userData?.notificationsEnabled ?? true);
  
  // Si Expo Go, les notifications ne sont pas supportées
  const [isSupported] = useState(() => {
    if (IS_EXPO_GO) {
      console.log('[useNotifications] Expo Go detected - notifications disabled');
      return false;
    }
    if (Platform.OS === 'web') {
      return false;
    }
    // Vérifier via le service
    return notificationService.isSupported();
  });
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const initializingRef = useRef(false);

  /**
   * Initialise les notifications
   */
  const initialize = useCallback(async () => {
    // Éviter les appels multiples ou simultanés
    if (initializedRef.current || initializingRef.current) {
      return;
    }
    
    // Ne pas initialiser dans Expo Go
    if (IS_EXPO_GO) {
      console.log('[useNotifications] Skipping init - Expo Go');
      setError('Notifications désactivées dans Expo Go');
      return;
    }
    
    // Ne pas initialiser si pas supporté
    if (!isSupported) {
      console.log('[useNotifications] Skipping init - not supported');
      return;
    }
    
    // Ne pas initialiser si pas d'utilisateur
    if (!firebaseUserId) {
      console.log('[useNotifications] Skipping init - no user');
      return;
    }

    initializingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.initialize();

      if (result.success && result.token) {
        setToken(result.token);
        setIsEnabled(true);
        initializedRef.current = true;

        // Sauvegarder le token dans Firestore
        await userService.updateFcmToken(firebaseUserId, result.token);
        console.log('[useNotifications] Token saved to Firestore');
      } else {
        setError(result.error || null);
        setIsEnabled(false);
      }
    } catch (err: any) {
      console.error('[useNotifications] Error:', err);
      setError(err.message);
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
      initializingRef.current = false;
    }
  }, [isSupported, firebaseUserId]);

  // Auto-init quand l'utilisateur est connecté
  useEffect(() => {
    // Ne pas auto-init dans Expo Go
    if (IS_EXPO_GO) {
      return;
    }
    
    if (isSupported && firebaseUserId && notificationsEnabled) {
      initialize();
    }
  }, [isSupported, firebaseUserId, notificationsEnabled, initialize]);

  // Reset si l'utilisateur se déconnecte
  useEffect(() => {
    if (!firebaseUserId) {
      initializedRef.current = false;
      initializingRef.current = false;
      setToken(null);
      setIsEnabled(false);
      setError(null);
    }
  }, [firebaseUserId]);

  return {
    isSupported,
    isEnabled,
    isLoading,
    token,
    error,
    isExpoGo: IS_EXPO_GO,
    initialize,
  };
};

export default useNotifications;