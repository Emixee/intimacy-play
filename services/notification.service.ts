/**
 * Service de notifications push
 * 
 * Utilise @react-native-firebase/messaging pour recevoir les tokens FCM
 * et expo-notifications pour afficher les notifications
 */

import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { userService } from "./user.service";

// ============================================================
// CONFIGURATION EXPO NOTIFICATIONS
// ============================================================

// Configurer comment les notifications sont affichées en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

      // 1. Créer le canal Android
      await this.createNotificationChannel();

      // 2. Demander les permissions
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log("[NotificationService] Permission denied");
        return;
      }

      // 3. Récupérer et enregistrer le token FCM
      const token = await this.getToken();
      if (token) {
        await userService.updateFcmToken(userId, token);
        console.log("[NotificationService] Token registered");
      }

      // 4. Configurer le listener de refresh du token
      this.setupTokenRefreshListener(userId);

      // 5. Configurer les handlers de notifications
      this.setupNotificationHandlers();

      console.log("[NotificationService] Initialization complete");
    } catch (error) {
      console.error("[NotificationService] Initialization error:", error);
    }
  },

  /**
   * Crée le canal de notification Android
   */
  async createNotificationChannel(): Promise<void> {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("game_notifications", {
        name: "Notifications de jeu",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#EC4899",
        sound: "default",
      });
      console.log("[NotificationService] Android channel created");
    }
  },

  /**
   * Demande la permission d'envoyer des notifications
   */
  async requestPermission(): Promise<boolean> {
    try {
      // Permission Firebase Messaging
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log("[NotificationService] Firebase permission denied");
        return false;
      }

      // Permission Expo Notifications (Android 13+)
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("[NotificationService] Expo permission denied");
        return false;
      }

      console.log("[NotificationService] Permissions granted");
      return true;
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
    // Firebase Messaging reçoit le message, on l'affiche avec Expo
    messaging().onMessage(async (remoteMessage) => {
      console.log("[NotificationService] Foreground message:", remoteMessage);

      const { notification, data } = remoteMessage;

      if (notification) {
        // Afficher la notification avec Expo Notifications
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title || "Intimacy Play",
            body: notification.body || "",
            data: data as NotificationData,
            sound: "default",
          },
          trigger: null, // Afficher immédiatement
        });
      }
    });

    // Handler pour les notifications cliquées en BACKGROUND
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("[NotificationService] Notification opened from background:", remoteMessage);
      const data = remoteMessage.data as NotificationData;
      this.handleNotificationNavigation(data);
    });

    // Handler pour les notifications qui ont lancé l'app (KILLED state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log("[NotificationService] App opened from killed state:", remoteMessage);
          const data = remoteMessage.data as NotificationData;
          this.handleNotificationNavigation(data);
        }
      });

    // Handler Expo pour les notifications cliquées
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("[NotificationService] Expo notification response:", response);
      const data = response.notification.request.content.data as NotificationData;
      this.handleNotificationNavigation(data);
    });
  },

  /**
   * Gère la navigation depuis une notification
   */
  handleNotificationNavigation(data: NotificationData): void {
    if (!data) return;

    console.log("[NotificationService] Navigation data:", data);

    // TODO: Implémenter la navigation vers la session
    // Par exemple avec un event emitter ou un store Zustand
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

  /**
   * Envoie une notification locale (pour tests)
   */
  async sendLocalNotification(title: string, body: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
      },
      trigger: null,
    });
  },
};

export default notificationService;