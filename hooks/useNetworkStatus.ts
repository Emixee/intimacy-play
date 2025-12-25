/**
 * Hook de surveillance de l'état du réseau
 * 
 * Détecte :
 * - Perte/retour de connexion
 * - Type de connexion (wifi, cellular)
 * - Qualité de connexion
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useErrorStore } from '../stores/errorStore';
import { useToast } from '../components/ui/Toast';

// ============================================================
// TYPES
// ============================================================

type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'unknown' | 'none';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: ConnectionType;
  isWifi: boolean;
  isCellular: boolean;
  isReconnecting: boolean;
}

interface UseNetworkStatusReturn extends NetworkStatus {
  checkConnection: () => Promise<boolean>;
  waitForConnection: (timeoutMs?: number) => Promise<boolean>;
}

// ============================================================
// SIMPLE NETWORK CHECK (sans NetInfo)
// ============================================================

const checkNetworkConnectivity = async (): Promise<{ isConnected: boolean; type: ConnectionType }> => {
  try {
    // Essayer de faire une requête simple pour vérifier la connectivité
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return {
      isConnected: response.ok || response.status === 204,
      type: 'unknown',
    };
  } catch (error) {
    return {
      isConnected: false,
      type: 'none',
    };
  }
};

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
    type: 'unknown',
    isWifi: false,
    isCellular: false,
    isReconnecting: false,
  });

  // Refs
  const wasConnectedRef = useRef<boolean>(true);
  const reconnectToastShownRef = useRef<boolean>(false);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----------------------------------------------------------
  // GESTION DES CHANGEMENTS DE CONNEXION
  // ----------------------------------------------------------

  const handleNetworkChange = useCallback((isConnected: boolean, type: ConnectionType = 'unknown') => {
    const newStatus: NetworkStatus = {
      isConnected,
      isInternetReachable: isConnected,
      type,
      isWifi: type === 'wifi',
      isCellular: type === 'cellular',
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
  // VÉRIFICATION PÉRIODIQUE
  // ----------------------------------------------------------

  useEffect(() => {
    // Vérifier l'état initial
    checkNetworkConnectivity().then(({ isConnected, type }) => {
      handleNetworkChange(isConnected, type);
    });

    // Vérification périodique toutes les 30 secondes
    checkIntervalRef.current = setInterval(async () => {
      const { isConnected, type } = await checkNetworkConnectivity();
      // Ne mettre à jour que si le statut change
      if (isConnected !== wasConnectedRef.current) {
        handleNetworkChange(isConnected, type);
      }
    }, 30000);

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [handleNetworkChange]);

  // ----------------------------------------------------------
  // RE-VÉRIFICATION AU RETOUR DE L'APP
  // ----------------------------------------------------------

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Re-vérifier la connexion quand l'app revient au premier plan
        const { isConnected, type } = await checkNetworkConnectivity();
        handleNetworkChange(isConnected, type);
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
      const { isConnected, type } = await checkNetworkConnectivity();
      handleNetworkChange(isConnected, type);
      return isConnected;
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
    const { isConnected } = await checkNetworkConnectivity();
    if (isConnected) {
      return true;
    }

    setStatus((prev) => ({ ...prev, isReconnecting: true }));

    return new Promise((resolve) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      let intervalId: ReturnType<typeof setInterval>;

      // Timeout
      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        setStatus((prev) => ({ ...prev, isReconnecting: false }));
        resolve(false);
      }, timeoutMs);

      // Vérifier toutes les 2 secondes
      intervalId = setInterval(async () => {
        const { isConnected: connected } = await checkNetworkConnectivity();
        if (connected) {
          clearTimeout(timeoutId);
          clearInterval(intervalId);
          setStatus((prev) => ({ ...prev, isReconnecting: false }));
          handleNetworkChange(true, 'unknown');
          resolve(true);
        }
      }, 2000);
    });
  }, [handleNetworkChange]);

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