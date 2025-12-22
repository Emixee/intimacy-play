/**
 * Service de notifications push
 * 
 * Utilise uniquement @react-native-firebase/messaging
 * - Les notifications background/killed sont affichées automatiquement par Firebase
 * - Les notifications foreground sont loggées (Android les affiche pas automatiquement)
 */

import messaging from "@react-native-firebase/messaging";
import { userService } from "./user.service";

// ============================================================
// TYPES
// ============================================================

interface NotificationData {
  type?: string;
  sessionId?: string;
  [key: string]: string | undefined;
}

// ============================================================
// SERVICE DE NOTIFICATIONS
// ============================================================

export const notificationService = {
  /**
   * Initialise le service de notifications
   * - Demande les permissions
   * - Récupère le token FCM
   * - Configure les handlers
   */
  async initialize(userId: string): Promise<void> {
    try {
      console.log("[NotificationService] Initializing for user:", userId);

      // 1. Demander les permissions
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log("[NotificationService] Permission denied");
        return;
      }

      // 2. Récupérer et enregistrer le token FCM
      const token = await this.getToken();
      if (token) {
        await userService.updateFcmToken(userId, token);
        console.log("[NotificationService] Token registered");
      }

      // 3. Configurer le listener de refresh du token
      this.setupTokenRefreshListener(userId);

      // 4. Configurer les handlers de notifications
      this.setupNotificationHandlers();

      console.log("[NotificationService] Initialization complete");
    } catch (error) {
      console.error("[NotificationService] Initialization error:", error);
    }
  },

  /**
   * Demande la permission d'envoyer des notifications
   */
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log("[NotificationService] Permission:", enabled ? "granted" : "denied");
      return enabled;
    } catch (error) {
      console.error("[NotificationService] Permission error:", error);
      return false;
    }
  },

  /**
   * Récupère le token FCM
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log("[NotificationService] FCM Token obtained");
      return token;
    } catch (error) {
      console.error("[NotificationService] Get token error:", error);
      return null;
    }
  },

  /**
   * Configure le listener de refresh du token
   */
  setupTokenRefreshListener(userId: string): void {
    messaging().onTokenRefresh(async (newToken) => {
      console.log("[NotificationService] Token refreshed");
      await userService.updateFcmToken(userId, newToken);
    });
  },

  /**
   * Configure les handlers de notifications
   */
  setupNotificationHandlers(): void {
    // Handler pour les notifications reçues en FOREGROUND
    // Note: Sur Android, les notifications ne s'affichent pas automatiquement en foreground
    // Elles sont reçues ici et on peut les traiter
    messaging().onMessage(async (remoteMessage) => {
      console.log("[NotificationService] Foreground message received:");
      console.log("  Title:", remoteMessage.notification?.title);
      console.log("  Body:", remoteMessage.notification?.body);
      console.log("  Data:", remoteMessage.data);
      
      // TODO: Si tu veux afficher les notifications en foreground,
      // tu peux utiliser un Toast ou une UI custom
    });

    // Handler pour les notifications cliquées en BACKGROUND
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("[NotificationService] Notification opened from background:");
      console.log("  Data:", remoteMessage.data);
      const data = remoteMessage.data as NotificationData;
      this.handleNotificationNavigation(data);
    });

    // Handler pour les notifications qui ont lancé l'app (KILLED state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log("[NotificationService] App opened from killed state:");
          console.log("  Data:", remoteMessage.data);
          const data = remoteMessage.data as NotificationData;
          this.handleNotificationNavigation(data);
        }
      });

    console.log("[NotificationService] Handlers configured");
  },

  /**
   * Gère la navigation depuis une notification
   */
  handleNotificationNavigation(data: NotificationData): void {
    if (!data) return;

    console.log("[NotificationService] Navigation data:", data);

    // TODO: Implémenter la navigation vers la session
    if (data.type === "partner_joined" && data.sessionId) {
      console.log("[NotificationService] Should navigate to session:", data.sessionId);
      // router.push(`/(main)/game?sessionId=${data.sessionId}`);
    }
  },

  /**
   * Supprime le token FCM (déconnexion)
   */
  async deleteToken(userId: string): Promise<void> {
    try {
      await messaging().deleteToken();
      await userService.updateFcmToken(userId, null);
      console.log("[NotificationService] Token deleted");
    } catch (error) {
      console.error("[NotificationService] Delete token error:", error);
    }
  },
};

export default notificationService;