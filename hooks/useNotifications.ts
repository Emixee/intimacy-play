/**
 * Hook pour gérer les notifications
 * 
 * CORRECTIF : Gestion gracieuse du cas Expo Go (pas de crash)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { notificationService } from '../services/notification.service';
import { userService } from '../services/user.service';
import { useAuth } from './useAuth';

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

export const useNotifications = (): UseNotificationsReturn => {
  const { firebaseUser, userData } = useAuth();
  
  // Vérifier Expo Go au montage
  const [isExpoGo] = useState(() => checkIsExpoGo());
  
  // Si Expo Go, les notifications ne sont pas supportées
  const [isSupported] = useState(() => {
    if (isExpoGo) {
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

  /**
   * Initialise les notifications
   */
  const initialize = useCallback(async () => {
    // Éviter les appels multiples
    if (initializedRef.current) {
      return;
    }
    
    // Ne pas initialiser dans Expo Go
    if (isExpoGo) {
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
    if (!firebaseUser) {
      console.log('[useNotifications] Skipping init - no user');
      return;
    }

    initializedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await notificationService.initialize();

      if (result.success && result.token) {
        setToken(result.token);
        setIsEnabled(true);

        // Sauvegarder le token dans Firestore
        await userService.updateFcmToken(firebaseUser.uid, result.token);
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
    }
  }, [isSupported, isExpoGo, firebaseUser]);

  // Auto-init quand l'utilisateur est connecté et que les notifs sont activées
  useEffect(() => {
    // Ne pas auto-init dans Expo Go
    if (isExpoGo) {
      return;
    }
    
    if (isSupported && firebaseUser && userData?.notificationsEnabled !== false) {
      initialize();
    }
  }, [isSupported, isExpoGo, firebaseUser, userData?.notificationsEnabled, initialize]);

  // Reset si l'utilisateur se déconnecte
  useEffect(() => {
    if (!firebaseUser) {
      initializedRef.current = false;
      setToken(null);
      setIsEnabled(false);
      setError(null);
    }
  }, [firebaseUser]);

  return {
    isSupported,
    isEnabled,
    isLoading,
    token,
    error,
    isExpoGo,
    initialize,
  };
};

export default useNotifications;