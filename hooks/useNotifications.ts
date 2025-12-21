/**
 * Hook pour initialiser les notifications push
 * 
 * À utiliser dans le layout principal (main) après connexion
 */

import { useEffect, useRef } from "react";
import { useAuthStore } from "../stores/authStore";
import { notificationService } from "../services/notification.service";

/**
 * Hook qui initialise les notifications pour l'utilisateur connecté
 * S'exécute une seule fois après la connexion
 */
export function useNotifications(): void {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const initialized = useRef(false);

  useEffect(() => {
    const initNotifications = async () => {
      if (firebaseUser?.uid && !initialized.current) {
        initialized.current = true;
        try {
          await notificationService.initialize(firebaseUser.uid);
          console.log("[useNotifications] Notifications initialized");
        } catch (error) {
          console.error("[useNotifications] Initialization error:", error);
        }
      }
    };

    initNotifications();

    // Reset si l'utilisateur se déconnecte
    if (!firebaseUser?.uid) {
      initialized.current = false;
    }
  }, [firebaseUser?.uid]);
}

export default useNotifications;