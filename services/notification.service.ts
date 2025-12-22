/**
 * Service de notifications - Version safe pour Expo Go
 * 
 * Gère gracieusement le cas où Firebase Messaging n'est pas disponible
 * (notamment dans Expo Go qui ne supporte pas les modules natifs)
 * 
 * CORRECTIF : Détection Expo Go avant tentative de chargement du module
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { ApiResponse } from '../types';

// ============================================================
// TYPES
// ============================================================

interface NotificationInitResult {
  success: boolean;
  token?: string | null;
  error?: string;
}

// ============================================================
// VÉRIFICATION DE DISPONIBILITÉ
// ============================================================

let messagingModule: any = null;
let isMessagingAvailable = false;
let isMessagingChecked = false;

/**
 * Vérifie si on est dans Expo Go (pas de modules natifs)
 */
const isExpoGo = (): boolean => {
  return Constants.appOwnership === 'expo';
};

/**
 * Vérifie si Firebase Messaging est disponible
 * Ne tente même pas de charger le module si on est dans Expo Go
 */
const checkMessagingAvailable = (): boolean => {
  // Déjà vérifié
  if (isMessagingChecked) {
    return isMessagingAvailable;
  }

  isMessagingChecked = true;

  // Web pas supporté
  if (Platform.OS === 'web') {
    console.log('[NotificationService] Web platform - notifications disabled');
    isMessagingAvailable = false;
    return false;
  }

  // Expo Go pas supporté (modules natifs non disponibles)
  if (isExpoGo()) {
    console.log('[NotificationService] Expo Go detected - notifications disabled');
    console.log('[NotificationService] Build with EAS to enable notifications');
    isMessagingAvailable = false;
    return false;
  }

  // Tenter de charger le module (build EAS uniquement)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    messagingModule = require('@react-native-firebase/messaging').default;
    
    // Vérifie que c'est bien une fonction
    if (typeof messagingModule !== 'function') {
      console.warn('[NotificationService] messaging is not a function');
      messagingModule = null;
      isMessagingAvailable = false;
      return false;
    }
    
    console.log('[NotificationService] Firebase Messaging available');
    isMessagingAvailable = true;
    return true;
  } catch (error: any) {
    console.log('[NotificationService] Firebase Messaging not available:', error.message);
    messagingModule = null;
    isMessagingAvailable = false;
    return false;
  }
};

// ============================================================
// SERVICE
// ============================================================

export const notificationService = {
  /**
   * Vérifie si les notifications sont supportées sur cet appareil
   */
  isSupported(): boolean {
    return checkMessagingAvailable();
  },

  /**
   * Vérifie si on est dans Expo Go
   */
  isExpoGo(): boolean {
    return isExpoGo();
  },

  /**
   * Initialise les notifications (demande permission + récupère token)
   */
  async initialize(): Promise<NotificationInitResult> {
    // Vérifier la disponibilité
    if (!checkMessagingAvailable()) {
      const reason = isExpoGo() 
        ? 'Notifications désactivées dans Expo Go. Faites un build EAS pour les activer.'
        : 'Notifications non disponibles sur cet appareil';
      
      console.log('[NotificationService] Skipping init -', reason);
      return {
        success: false,
        error: reason,
      };
    }

    try {
      const messaging = messagingModule;

      // Demander la permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('[NotificationService] Permission denied');
        return {
          success: false,
          error: 'Permission notifications refusée',
        };
      }

      // Récupérer le token FCM
      const token = await messaging().getToken();
      console.log('[NotificationService] Token obtained:', token?.substring(0, 20) + '...');

      return {
        success: true,
        token,
      };
    } catch (error: any) {
      console.error('[NotificationService] Initialize error:', error);
      return {
        success: false,
        error: error.message || 'Erreur initialisation notifications',
      };
    }
  },

  /**
   * Demande la permission pour les notifications
   */
  async requestPermission(): Promise<ApiResponse<boolean>> {
    if (!checkMessagingAvailable()) {
      return {
        success: false,
        error: 'Notifications non disponibles',
      };
    }

    try {
      const messaging = messagingModule;
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      return {
        success: true,
        data: enabled,
      };
    } catch (error: any) {
      console.error('[NotificationService] Permission error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Récupère le token FCM actuel
   */
  async getToken(): Promise<string | null> {
    if (!checkMessagingAvailable()) {
      return null;
    }

    try {
      const messaging = messagingModule;
      return await messaging().getToken();
    } catch (error) {
      console.error('[NotificationService] Get token error:', error);
      return null;
    }
  },

  /**
   * S'abonne à un topic FCM
   */
  async subscribeToTopic(topic: string): Promise<boolean> {
    if (!checkMessagingAvailable()) {
      return false;
    }

    try {
      const messaging = messagingModule;
      await messaging().subscribeToTopic(topic);
      console.log('[NotificationService] Subscribed to:', topic);
      return true;
    } catch (error) {
      console.error('[NotificationService] Subscribe error:', error);
      return false;
    }
  },

  /**
   * Se désabonne d'un topic FCM
   */
  async unsubscribeFromTopic(topic: string): Promise<boolean> {
    if (!checkMessagingAvailable()) {
      return false;
    }

    try {
      const messaging = messagingModule;
      await messaging().unsubscribeFromTopic(topic);
      console.log('[NotificationService] Unsubscribed from:', topic);
      return true;
    } catch (error) {
      console.error('[NotificationService] Unsubscribe error:', error);
      return false;
    }
  },

  /**
   * Configure le handler pour les messages en foreground
   */
  onMessage(callback: (message: any) => void): (() => void) | null {
    if (!checkMessagingAvailable()) {
      return null;
    }

    try {
      const messaging = messagingModule;
      return messaging().onMessage(callback);
    } catch (error) {
      console.error('[NotificationService] onMessage error:', error);
      return null;
    }
  },

  /**
   * Configure le handler pour les messages en background
   */
  setBackgroundMessageHandler(handler: (message: any) => Promise<void>): void {
    if (!checkMessagingAvailable()) {
      return;
    }

    try {
      const messaging = messagingModule;
      messaging().setBackgroundMessageHandler(handler);
    } catch (error) {
      console.error('[NotificationService] setBackgroundMessageHandler error:', error);
    }
  },
};

export default notificationService;