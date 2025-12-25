/**
 * Hook de surveillance de l'état du réseau
 * 
 * Détecte :
 * - Perte/retour de connexion
 * - Type de connexion (wifi, cellular)
 * - Qualité de connexion
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { useErrorStore } from '../stores/errorStore';
import { useToast } from '../components/ui/Toast';
import { AppState, AppStateStatus } from 'react-native';

// ============================================================
// TYPES
// ============================================================

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
  isWifi: boolean;
  isCellular: boolean;
  isReconnecting: boolean;
}

interface UseNetworkStatusReturn extends NetworkStatus {
  checkConnection: () => Promise<boolean>;
  waitForConnection: (timeoutMs?: number) => Promise<boolean>;
}

// ============================================================
// HOOK
// ============================================================

export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const toast = useToast();
  const setOffline = useErrorStore((state) => state.setOffline);
  
  // State
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown' as NetInfoStateType,
    isWifi: false,
    isCellular: false,
    isReconnecting: false,
  });

  // Refs
  const wasConnectedRef = useRef<boolean>(true);
  const reconnectToastShownRef = useRef<boolean>(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ----------------------------------------------------------
  // GESTION DES CHANGEMENTS DE CONNEXION
  // ----------------------------------------------------------

  const handleNetworkChange = useCallback((state: NetInfoState) => {
    const isConnected = state.isConnected ?? false;
    const isInternetReachable = state.isInternetReachable;
    
    const newStatus: NetworkStatus = {
      isConnected,
      isInternetReachable,
      type: state.type,
      isWifi: state.type === 'wifi',
      isCellular: state.type === 'cellular',
      isReconnecting: false,
    };

    setStatus(newStatus);
    setOffline(!isConnected);

    // Détecter perte de connexion
    if (wasConnectedRef.current && !isConnected) {
      console.log('[Network] Connection lost');
      toast.warning(
        'Connexion perdue',
        'Vérifiez votre connexion internet',
        0 // Ne pas auto-dismiss
      );
      reconnectToastShownRef.current = false;
    }

    // Détecter retour de connexion
    if (!wasConnectedRef.current && isConnected && !reconnectToastShownRef.current) {
      console.log('[Network] Connection restored');
      toast.success('Connexion rétablie', 'Vous êtes de nouveau en ligne');
      reconnectToastShownRef.current = true;
    }

    wasConnectedRef.current = isConnected;
  }, [setOffline, toast]);

  // ----------------------------------------------------------
  // SUBSCRIPTION
  // ----------------------------------------------------------

  useEffect(() => {
    // S'abonner aux changements de réseau
    unsubscribeRef.current = NetInfo.addEventListener(handleNetworkChange);

    // Vérifier l'état initial
    NetInfo.fetch().then(handleNetworkChange);

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [handleNetworkChange]);

  // ----------------------------------------------------------
  // RE-VÉRIFICATION AU RETOUR DE L'APP
  // ----------------------------------------------------------

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Re-vérifier la connexion quand l'app revient au premier plan
        NetInfo.fetch().then(handleNetworkChange);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [handleNetworkChange]);

  // ----------------------------------------------------------
  // MÉTHODES PUBLIQUES
  // ----------------------------------------------------------

  /**
   * Vérifie la connexion manuellement
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      handleNetworkChange(state);
      return state.isConnected ?? false;
    } catch (error) {
      console.error('[Network] Check failed:', error);
      return false;
    }
  }, [handleNetworkChange]);

  /**
   * Attend le retour de la connexion avec timeout
   */
  const waitForConnection = useCallback(async (timeoutMs: number = 30000): Promise<boolean> => {
    // Si déjà connecté, retourner immédiatement
    const currentState = await NetInfo.fetch();
    if (currentState.isConnected) {
      return true;
    }

    setStatus((prev) => ({ ...prev, isReconnecting: true }));

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;
      let unsubscribe: (() => void) | null = null;

      // Timeout
      timeoutId = setTimeout(() => {
        if (unsubscribe) unsubscribe();
        setStatus((prev) => ({ ...prev, isReconnecting: false }));
        resolve(false);
      }, timeoutMs);

      // Écouter les changements
      unsubscribe = NetInfo.addEventListener((state) => {
        if (state.isConnected) {
          clearTimeout(timeoutId);
          if (unsubscribe) unsubscribe();
          setStatus((prev) => ({ ...prev, isReconnecting: false }));
          resolve(true);
        }
      });
    });
  }, []);

  // ----------------------------------------------------------
  // RETURN
  // ----------------------------------------------------------

  return {
    ...status,
    checkConnection,
    waitForConnection,
  };
};

export default useNetworkStatus;