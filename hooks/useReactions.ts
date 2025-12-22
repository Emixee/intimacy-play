/**
 * Hook useReactions - Intimacy Play
 *
 * Gère la synchronisation des réactions avec Firestore et déclenche
 * les animations lorsqu'une nouvelle réaction du partenaire arrive.
 *
 * @example
 * ```tsx
 * const { sendReaction, partnerReactions, isLoading } = useSessionReactions({
 *   sessionCode: 'ABC123',
 *   userId: 'user_xyz',
 *   isPremium: false,
 *   onPartnerReaction: (reaction) => {
 *     // Déclencher l'animation
 *     triggerReaction(reaction.emoji, true);
 *   }
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from "react";
import * as Haptics from "expo-haptics";
import {
  type Reaction,
  type SessionReaction,
  REACTIONS_FREE,
  REACTIONS_PREMIUM,
} from "../types";
import { reactionService } from "../services/reaction.service";

// ============================================================
// TYPES
// ============================================================

export interface UseSessionReactionsProps {
  /** Code de la session */
  sessionCode: string;
  /** UID de l'utilisateur courant */
  userId: string;
  /** L'utilisateur est-il premium ? */
  isPremium: boolean;
  /** Callback quand le partenaire envoie une réaction */
  onPartnerReaction?: (reaction: SessionReaction) => void;
  /** Activer le retour haptique (défaut: true) */
  enableHaptics?: boolean;
}

export interface UseSessionReactionsReturn {
  /** Envoyer une réaction */
  sendReaction: (emoji: Reaction) => Promise<boolean>;
  /** Réactions du partenaire (nouvelles seulement) */
  partnerReactions: SessionReaction[];
  /** Toutes les réactions actives */
  allReactions: SessionReaction[];
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Réactions gratuites disponibles */
  freeReactions: readonly Reaction[];
  /** Réactions premium disponibles */
  premiumReactions: readonly Reaction[];
  /** Vérifier si une réaction est accessible */
  canUseReaction: (emoji: Reaction) => boolean;
  /** Dernière réaction envoyée */
  lastSentReaction: Reaction | null;
}

// ============================================================
// HOOK
// ============================================================

export function useSessionReactions({
  sessionCode,
  userId,
  isPremium,
  onPartnerReaction,
  enableHaptics = true,
}: UseSessionReactionsProps): UseSessionReactionsReturn {
  // State
  const [allReactions, setAllReactions] = useState<SessionReaction[]>([]);
  const [partnerReactions, setPartnerReactions] = useState<SessionReaction[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSentReaction, setLastSentReaction] = useState<Reaction | null>(
    null
  );

  // Refs pour tracker les réactions déjà vues
  const seenReactionIds = useRef<Set<string>>(new Set());
  const onPartnerReactionRef = useRef(onPartnerReaction);

  // Mettre à jour la ref du callback
  useEffect(() => {
    onPartnerReactionRef.current = onPartnerReaction;
  }, [onPartnerReaction]);

  // ============================================================
  // ÉCOUTE DES RÉACTIONS
  // ============================================================

  useEffect(() => {
    if (!sessionCode) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // S'abonner aux réactions
    const unsubscribe = reactionService.subscribeToReactions(
      sessionCode,
      (reactions) => {
        setAllReactions(reactions);

        // Filtrer les réactions du partenaire (pas les nôtres)
        const fromPartner = reactions.filter((r) => r.sentBy !== userId);
        setPartnerReactions(fromPartner);

        // Détecter les NOUVELLES réactions du partenaire
        fromPartner.forEach((reaction) => {
          const reactionId = `${reaction.sentBy}-${reaction.sentAt.toMillis()}`;

          if (!seenReactionIds.current.has(reactionId)) {
            seenReactionIds.current.add(reactionId);

            // Feedback haptique
            if (enableHaptics) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }

            // Callback
            onPartnerReactionRef.current?.(reaction);
          }
        });

        setIsLoading(false);
      }
    );

    // Cleanup des réactions expirées au montage
    reactionService.cleanupExpiredReactions(sessionCode);

    return () => {
      unsubscribe();
    };
  }, [sessionCode, userId, enableHaptics]);

  // ============================================================
  // ENVOI DE RÉACTION
  // ============================================================

  const sendReaction = useCallback(
    async (emoji: Reaction): Promise<boolean> => {
      if (!sessionCode || !userId) {
        setError("Session ou utilisateur non défini");
        return false;
      }

      // Vérifier l'accès
      if (!reactionService.canUseReaction(emoji, isPremium)) {
        setError("Réaction premium requise");
        return false;
      }

      setError(null);

      // Feedback haptique immédiat
      if (enableHaptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const result = await reactionService.sendReaction(
        sessionCode,
        emoji,
        userId,
        isPremium
      );

      if (result.success) {
        setLastSentReaction(emoji);
        return true;
      } else {
        setError(result.error || "Erreur lors de l'envoi");
        return false;
      }
    },
    [sessionCode, userId, isPremium, enableHaptics]
  );

  // ============================================================
  // VÉRIFICATION D'ACCÈS
  // ============================================================

  const canUseReaction = useCallback(
    (emoji: Reaction): boolean => {
      return reactionService.canUseReaction(emoji, isPremium);
    },
    [isPremium]
  );

  // ============================================================
  // RÉACTIONS DISPONIBLES
  // ============================================================

  const freeReactions = REACTIONS_FREE;
  const premiumReactions = REACTIONS_PREMIUM;

  // ============================================================
  // RETOUR
  // ============================================================

  return {
    sendReaction,
    partnerReactions,
    allReactions,
    isLoading,
    error,
    freeReactions,
    premiumReactions,
    canUseReaction,
    lastSentReaction,
  };
}

// ============================================================
// HOOK SIMPLIFIÉ POUR LE PICKER
// ============================================================

export interface UseReactionPickerProps {
  isPremium: boolean;
  onSelect: (emoji: Reaction) => void;
  onPremiumRequired?: () => void;
}

export function useReactionPicker({
  isPremium,
  onSelect,
  onPremiumRequired,
}: UseReactionPickerProps) {
  const handleSelect = useCallback(
    (emoji: Reaction, isPremiumReaction: boolean) => {
      if (isPremiumReaction && !isPremium) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        onPremiumRequired?.();
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelect(emoji);
    },
    [isPremium, onSelect, onPremiumRequired]
  );

  return {
    freeReactions: REACTIONS_FREE,
    premiumReactions: REACTIONS_PREMIUM,
    handleSelect,
    isPremiumReaction: (emoji: Reaction) =>
      (REACTIONS_PREMIUM as readonly string[]).includes(emoji),
  };
}

// ============================================================
// EXPORTS
// ============================================================

export default useSessionReactions;