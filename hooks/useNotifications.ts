/**
 * Hook pour initialiser les notifications
 * À utiliser dans le layout principal après connexion
 */

import { useEffect, useRef } from "react";
import { notificationService } from "../services/notification.service";
import { useUserStore } from "../stores/userStore";

export function useNotifications() {
  const user = useUserStore((state) => state.user);
  const initialized = useRef(false);

  useEffect(() => {
    // Initialiser uniquement si l'utilisateur est connecté
    if (user?.id && !initialized.current) {
      initialized.current = true;

      notificationService.initialize(user.id).then((result) => {
        if (!result.success) {
          console.warn("[useNotifications] Init failed:", result.error);
        }
      });
    }

    // Reset si l'utilisateur se déconnecte
    if (!user?.id) {
      initialized.current = false;
    }
  }, [user?.id]);
}