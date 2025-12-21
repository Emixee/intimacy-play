/**
 * Service de gestion des notifications push
 *
 * Gère :
 * - Demande de permission
 * - Récupération et enregistrement du token FCM
 * - Écoute des notifications (foreground/background)
 * - Canaux de notification Android
 */

import { Platform, PermissionsAndroid, Alert } from "react-native";
import messaging from "@react-native-firebase/messaging";
import notifee, { AndroidImportance } from "@notifee/react-native";

import { userService } from "./user.service";
import { ApiResponse } from "../types";

// ============================================================
// CONSTANTES
// ============================================================

const CHANNEL_ID = "game_notifications";
const CHANNEL_NAME = "Notifications de jeu";
const CHANNEL_DESCRIPTION = "Notifications pour les sessions de jeu";

// ============================================================
// SERVICE
// ============================================================

export const notificationService = {
  // ----------------------------------------------------------
  // INITIALISATION
  // ----------------------------------------------------------

  /**
   * Initialise le service de notifications
   * À appeler au démarrage de l'app (après login)
   */
  async initialize(userId: string): Promise<ApiResponse> {
    try {
      // 1. Créer le canal de notification Android
      await this.createNotificationChannel();

      // 2. Demander la permission
      const hasPermission = await this.requestPermission();

      if (!hasPermission) {
        console.log("[NotificationService] Permission denied");
        return {
          success: false,
          error: "Permission de notification refusée",
        };
      }

      // 3. Récupérer et enregistrer le token FCM
      const token = await this.getToken();

      if (token) {
        await userService.updateFcmToken(userId, token);
        console.log("[NotificationService] Token registered");
      }

      // 4. Configurer le listener pour le refresh du token
      this.setupTokenRefreshListener(userId);

      // 5. Configurer les handlers de notifications
      this.setupNotificationHandlers();

      console.log("[NotificationService] Initialized successfully");

      return { success: true };
    } catch (error: any) {
      console.error("[NotificationService] Initialize error:", error);
      return {
        success: false,
        error: "Erreur d'initialisation des notifications",
      };
    }
  },

  // ----------------------------------------------------------
  // CANAL DE NOTIFICATION (Android)
  // ----------------------------------------------------------

  /**
   * Crée le canal de notification pour Android
   * Requis pour Android 8.0+
   */
  async createNotificationChannel(): Promise<void> {
    if (Platform.OS !== "android") return;

    await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      description: CHANNEL_DESCRIPTION,
      importance: AndroidImportance.HIGH,
      sound: "default",
      vibration: true,
    });

    console.log("[NotificationService] Channel created:", CHANNEL_ID);
  },

  // ----------------------------------------------------------
  // PERMISSIONS
  // ----------------------------------------------------------

  /**
   * Demande la permission pour les notifications
   */
  async requestPermission(): Promise<boolean> {
    try {
      // Android 13+ requiert une permission explicite
      if (Platform.OS === "android" && Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }

      // Permission Firebase Messaging
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      return enabled;
    } catch (error) {
      console.error("[NotificationService] Permission error:", error);
      return false;
    }
  },

  /**
   * Vérifie si les notifications sont autorisées
   */
  async checkPermission(): Promise<boolean> {
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  },

  // ----------------------------------------------------------
  // TOKEN FCM
  // ----------------------------------------------------------

  /**
   * Récupère le token FCM de l'appareil
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log("[NotificationService] FCM Token:", token?.substring(0, 20) + "...");
      return token;
    } catch (error) {
      console.error("[NotificationService] Get token error:", error);
      return null;
    }
  },

  /**
   * Configure le listener pour le refresh du token
   */
  setupTokenRefreshListener(userId: string): void {
    messaging().onTokenRefresh(async (newToken) => {
      console.log("[NotificationService] Token refreshed");
      await userService.updateFcmToken(userId, newToken);
    });
  },

  /**
   * Supprime le token FCM (à appeler lors de la déconnexion)
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

  // ----------------------------------------------------------
  // HANDLERS DE NOTIFICATIONS
  // ----------------------------------------------------------

  /**
   * Configure les handlers pour les notifications
   */
  setupNotificationHandlers(): void {
    // Notification reçue en foreground
    messaging().onMessage(async (remoteMessage) => {
      console.log("[NotificationService] Foreground message:", remoteMessage);

      // Afficher la notification avec notifee (sinon elle n'apparaît pas en foreground)
      if (remoteMessage.notification) {
        await notifee.displayNotification({
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          android: {
            channelId: CHANNEL_ID,
            smallIcon: "ic_notification", // Doit exister dans android/app/src/main/res/
            pressAction: {
              id: "default",
            },
          },
        });
      }
    });

    // Notification ouverte depuis l'état background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(
        "[NotificationService] Notification opened from background:",
        remoteMessage
      );
      this.handleNotificationNavigation(remoteMessage.data);
    });

    // Vérifier si l'app a été ouverte depuis une notification (killed state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log(
            "[NotificationService] App opened from notification:",
            remoteMessage
          );
          this.handleNotificationNavigation(remoteMessage.data);
        }
      });
  },

  /**
   * Gère la navigation après clic sur notification
   */
  handleNotificationNavigation(data: { [key: string]: string } | undefined): void {
    if (!data) return;

    // Si c'est une notification "partner_joined", naviguer vers le jeu
    if (data.type === "partner_joined" && data.sessionId) {
      // Note: La navigation sera gérée via le router
      // On peut utiliser un event emitter ou le store Zustand
      console.log("[NotificationService] Navigate to game:", data.sessionId);

      // Exemple avec un global event (à implémenter selon ton architecture)
      // eventEmitter.emit('NAVIGATE_TO_GAME', data.sessionId);
    }
  },

  // ----------------------------------------------------------
  // UTILS
  // ----------------------------------------------------------

  /**
   * Affiche une alerte pour demander d'activer les notifications
   */
  showEnableNotificationsAlert(): void {
    Alert.alert(
      "Notifications désactivées",
      "Activez les notifications pour être prévenu(e) quand votre partenaire rejoint la partie !",
      [
        { text: "Plus tard", style: "cancel" },
        {
          text: "Activer",
          onPress: () => this.requestPermission(),
        },
      ]
    );
  },
};

export default notificationService;