/**
 * Hook de protection contre les captures d'écran
 *
 * PROMPT SCREEN-PROTECTION : Protection du contenu sensible
 *
 * Fonctionnalités :
 * - Android : Bloque les captures d'écran et enregistrements
 * - iOS : Détecte les captures et affiche un avertissement
 *
 * Usage :
 * ```tsx
 * import { useScreenProtection } from '../../hooks';
 *
 * export default function GameScreen() {
 *   useScreenProtection(); // Active la protection
 *   // ...
 * }
 * ```
 */

import { useEffect, useRef, useCallback } from "react";
import { Platform, Alert, AppState, AppStateStatus } from "react-native";
import {
  preventScreenCaptureAsync,
  allowScreenCaptureAsync,
  addScreenshotListener,
} from "expo-screen-capture";

// ============================================================
// TYPES
// ============================================================

interface ScreenProtectionOptions {
  /**
   * Afficher une alerte quand une capture est détectée (iOS uniquement)
   * @default true
   */
  showAlertOnCapture?: boolean;

  /**
   * Message personnalisé pour l'alerte de capture
   */
  captureAlertMessage?: string;

  /**
   * Titre personnalisé pour l'alerte de capture
   */
  captureAlertTitle?: string;

  /**
   * Callback appelé quand une capture est détectée (iOS)
   */
  onScreenshotDetected?: () => void;

  /**
   * Désactiver la protection (utile pour le debug)
   * @default false
   */
  disabled?: boolean;
}

// ============================================================
// CONSTANTES
// ============================================================

const DEFAULT_ALERT_TITLE = "⚠️ Capture détectée";
const DEFAULT_ALERT_MESSAGE =
  "Par respect pour votre partenaire, les captures d'écran sont déconseillées. Le contenu partagé est éphémère et privé.";

// ============================================================
// HOOK
// ============================================================

/**
 * Hook pour protéger l'écran contre les captures
 *
 * @param options - Options de configuration
 *
 * @example
 * // Usage basique
 * useScreenProtection();
 *
 * @example
 * // Usage avec options
 * useScreenProtection({
 *   showAlertOnCapture: true,
 *   captureAlertTitle: "Attention !",
 *   captureAlertMessage: "Les captures sont interdites.",
 *   onScreenshotDetected: () => console.log("Screenshot!"),
 * });
 */
export function useScreenProtection(options: ScreenProtectionOptions = {}) {
  const {
    showAlertOnCapture = true,
    captureAlertTitle = DEFAULT_ALERT_TITLE,
    captureAlertMessage = DEFAULT_ALERT_MESSAGE,
    onScreenshotDetected,
    disabled = false,
  } = options;

  // Ref pour éviter les alertes multiples
  const isAlertShowing = useRef(false);
  const isProtectionActive = useRef(false);

  // ----------------------------------------------------------
  // ACTIVATION DE LA PROTECTION (Android)
  // ----------------------------------------------------------

  const activateProtection = useCallback(async () => {
    if (disabled || isProtectionActive.current) return;

    try {
      await preventScreenCaptureAsync();
      isProtectionActive.current = true;
      console.log("[ScreenProtection] Protection activée");
    } catch (error) {
      console.error("[ScreenProtection] Erreur activation:", error);
    }
  }, [disabled]);

  // ----------------------------------------------------------
  // DÉSACTIVATION DE LA PROTECTION
  // ----------------------------------------------------------

  const deactivateProtection = useCallback(async () => {
    if (!isProtectionActive.current) return;

    try {
      await allowScreenCaptureAsync();
      isProtectionActive.current = false;
      console.log("[ScreenProtection] Protection désactivée");
    } catch (error) {
      console.error("[ScreenProtection] Erreur désactivation:", error);
    }
  }, []);

  // ----------------------------------------------------------
  // GESTION DE LA CAPTURE DÉTECTÉE (iOS)
  // ----------------------------------------------------------

  const handleScreenshotDetected = useCallback(() => {
    console.log("[ScreenProtection] Capture d'écran détectée!");

    // Appeler le callback personnalisé si fourni
    onScreenshotDetected?.();

    // Afficher l'alerte (éviter les doublons)
    if (showAlertOnCapture && !isAlertShowing.current) {
      isAlertShowing.current = true;

      Alert.alert(captureAlertTitle, captureAlertMessage, [
        {
          text: "J'ai compris",
          onPress: () => {
            isAlertShowing.current = false;
          },
        },
      ]);
    }
  }, [showAlertOnCapture, captureAlertTitle, captureAlertMessage, onScreenshotDetected]);

  // ----------------------------------------------------------
  // GESTION DE L'ÉTAT DE L'APP (background/foreground)
  // ----------------------------------------------------------

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (disabled) return;

      if (nextAppState === "active") {
        // L'app revient au premier plan → réactiver la protection
        activateProtection();
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        // L'app passe en arrière-plan → on peut désactiver si nécessaire
        // Note: On garde la protection active même en background pour Android
      }
    },
    [disabled, activateProtection]
  );

  // ----------------------------------------------------------
  // EFFET PRINCIPAL
  // ----------------------------------------------------------

  useEffect(() => {
    if (disabled) {
      console.log("[ScreenProtection] Protection désactivée (mode debug)");
      return;
    }

    // 1. Activer la protection Android au montage
    activateProtection();

    // 2. Écouter les captures d'écran (iOS principalement)
    const screenshotSubscription = addScreenshotListener(handleScreenshotDetected);

    // 3. Écouter les changements d'état de l'app
    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // 4. Cleanup au démontage
    return () => {
      deactivateProtection();
      screenshotSubscription.remove();
      appStateSubscription.remove();
    };
  }, [
    disabled,
    activateProtection,
    deactivateProtection,
    handleScreenshotDetected,
    handleAppStateChange,
  ]);

  // ----------------------------------------------------------
  // RETOUR (pour usage avancé)
  // ----------------------------------------------------------

  return {
    /**
     * Indique si la protection est actuellement active
     */
    isProtected: isProtectionActive.current,

    /**
     * Plateforme courante
     */
    platform: Platform.OS,

    /**
     * Indique si le blocage complet est supporté (Android uniquement)
     */
    isBlockingSupported: Platform.OS === "android",

    /**
     * Activer manuellement la protection
     */
    activate: activateProtection,

    /**
     * Désactiver manuellement la protection
     */
    deactivate: deactivateProtection,
  };
}

// ============================================================
// HOOK SIMPLIFIÉ (version courte)
// ============================================================

/**
 * Hook simplifié - active juste la protection sans options
 *
 * @example
 * usePreventCapture();
 */
export function usePreventCapture() {
  useScreenProtection();
}

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default useScreenProtection;