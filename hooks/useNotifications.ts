/**
 * Hook pour gérer les notifications
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { notificationService } from '../services/notification.service';
import { userService } from '../services/user.service';
import { useAuth } from './useAuth';

interface UseNotificationsReturn {
  isSupported: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  token: string | null;
  error: string | null;
  initialize: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { firebaseUser, userData } = useAuth();
  const [isSupported] = useState(() => notificationService.isSupported());
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
    if (initializedRef.current || !isSupported || !firebaseUser) {
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
  }, [isSupported, firebaseUser]);

  // Auto-init quand l'utilisateur est connecté et que les notifs sont activées
  useEffect(() => {
    if (isSupported && firebaseUser && userData?.notificationsEnabled !== false) {
      initialize();
    }
  }, [isSupported, firebaseUser, userData?.notificationsEnabled, initialize]);

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
    initialize,
  };
};

export default useNotifications;