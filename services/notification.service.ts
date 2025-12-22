/**
 * Service de notifications - Version safe
 * 
 * Gère gracieusement le cas où Firebase Messaging n'est pas disponible
 */

import { Platform } from 'react-native';
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
let isMessagingChecked = false;

/**
 * Vérifie si Firebase Messaging est disponible
 */
const checkMessagingAvailable = (): boolean => {
  if (isMessagingChecked) {
    return messagingModule !== null;
  }

  isMessagingChecked = true;

  try {
    messagingModule = require('@react-native-firebase/messaging').default;
    // Vérifie que c'est bien une fonction
    if (typeof messagingModule !== 'function') {
      console.warn('[NotificationService] messaging is not a function');
      messagingModule = null;
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[NotificationService] Firebase Messaging not available:', error);
    messagingModule = null;
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
    if (Platform.OS === 'web') return false;
    return checkMessagingAvailable();
  },

  /**
   * Initialise les notifications (demande permission + récupère token)
   */
  async initialize(): Promise<NotificationInitResult> {
    if (!checkMessagingAvailable()) {
      console.log('[NotificationService] Skipping - messaging not available');
      return {
        success: false,
        error: 'Notifications non disponibles sur cet appareil',
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