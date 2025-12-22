/**
 * Service Réactions - Intimacy Play
 *
 * Gère l'envoi et le nettoyage des réactions dans Firestore.
 * Les réactions sont stockées dans session.activeReactions[] et
 * automatiquement supprimées après 5 secondes.
 *
 * @see FIRESTORE-SCHEMA.md pour la structure SessionReaction
 */

import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import {
  type Reaction,
  type SessionReaction,
  REACTIONS_FREE,
  REACTIONS_PREMIUM,
  REACTION_EXPIRATION_SECONDS,
} from "../types";

// Alias pour simplifier
type Timestamp = FirebaseFirestoreTypes.Timestamp;

// ============================================================
// CONSTANTES
// ============================================================

/** Durée d'affichage des réactions en ms (5 secondes) */
const REACTION_DISPLAY_DURATION = REACTION_EXPIRATION_SECONDS * 1000;

/** Messages d'erreur */
const ERROR_MESSAGES = {
  PREMIUM_REQUIRED: "Cette réaction nécessite un abonnement Premium",
  SESSION_NOT_FOUND: "Session introuvable",
  UNKNOWN: "Une erreur est survenue",
};

// ============================================================
// TYPES
// ============================================================

export interface SendReactionResult {
  success: boolean;
  error?: string;
  code?: string;
}

export interface ReactionServiceConfig {
  /** Durée d'affichage en ms (défaut: 5000) */
  displayDuration?: number;
  /** Activer le nettoyage auto (défaut: true) */
  autoCleanup?: boolean;
}

// ============================================================
// SERVICE
// ============================================================

class ReactionService {
  private config: Required<ReactionServiceConfig>;
  // Fix: Utiliser ReturnType<typeof setTimeout> au lieu de NodeJS.Timeout
  private cleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(config?: ReactionServiceConfig) {
    this.config = {
      displayDuration: config?.displayDuration ?? REACTION_DISPLAY_DURATION,
      autoCleanup: config?.autoCleanup ?? true,
    };
  }

  // ============================================================
  // VÉRIFICATIONS
  // ============================================================

  /**
   * Vérifie si une réaction est premium
   */
  isPremiumReaction(emoji: Reaction): boolean {
    return (REACTIONS_PREMIUM as readonly string[]).includes(emoji);
  }

  /**
   * Vérifie si une réaction est gratuite
   */
  isFreeReaction(emoji: Reaction): boolean {
    return (REACTIONS_FREE as readonly string[]).includes(emoji);
  }

  /**
   * Vérifie si l'utilisateur peut utiliser cette réaction
   */
  canUseReaction(emoji: Reaction, isPremium: boolean): boolean {
    if (this.isFreeReaction(emoji)) {
      return true;
    }
    return isPremium && this.isPremiumReaction(emoji);
  }

  // ============================================================
  // ENVOI DE RÉACTION
  // ============================================================

  /**
   * Envoie une réaction dans une session
   *
   * @param sessionCode - Code de la session
   * @param emoji - Emoji de réaction
   * @param userId - UID de l'expéditeur
   * @param isPremium - L'utilisateur est-il premium ?
   * @returns Résultat de l'opération
   */
  async sendReaction(
    sessionCode: string,
    emoji: Reaction,
    userId: string,
    isPremium: boolean
  ): Promise<SendReactionResult> {
    try {
      // Vérifier l'accès à la réaction
      if (!this.canUseReaction(emoji, isPremium)) {
        return {
          success: false,
          error: ERROR_MESSAGES.PREMIUM_REQUIRED,
          code: "PREMIUM_REQUIRED",
        };
      }

      const sessionRef = firestore().collection("sessions").doc(sessionCode);

      // Vérifier que la session existe
      const sessionDoc = await sessionRef.get();
      if (!sessionDoc.exists) {
        return {
          success: false,
          error: ERROR_MESSAGES.SESSION_NOT_FOUND,
          code: "SESSION_NOT_FOUND",
        };
      }

      // Créer l'objet réaction
      const reaction: SessionReaction = {
        emoji,
        sentBy: userId,
        sentAt: firestore.Timestamp.now(),
      };

      // Ajouter la réaction au tableau
      await sessionRef.update({
        activeReactions: firestore.FieldValue.arrayUnion(reaction),
      });

      // Programmer le nettoyage automatique
      if (this.config.autoCleanup) {
        this.scheduleCleanup(sessionCode, reaction);
      }

      return { success: true };
    } catch (error: any) {
      console.error("[ReactionService] sendReaction error:", error);
      return {
        success: false,
        error: error.message || ERROR_MESSAGES.UNKNOWN,
        code: error.code || "UNKNOWN",
      };
    }
  }

  // ============================================================
  // NETTOYAGE
  // ============================================================

  /**
   * Programme le nettoyage d'une réaction après le délai configuré
   */
  private scheduleCleanup(
    sessionCode: string,
    reaction: SessionReaction
  ): void {
    const timerId = setTimeout(async () => {
      await this.removeReaction(sessionCode, reaction);
    }, this.config.displayDuration);

    // Stocker le timer pour pouvoir l'annuler si nécessaire
    const key = `${sessionCode}-${reaction.sentBy}-${reaction.sentAt.toMillis()}`;
    this.cleanupTimers.set(key, timerId);
  }

  /**
   * Supprime une réaction spécifique
   */
  async removeReaction(
    sessionCode: string,
    reaction: SessionReaction
  ): Promise<void> {
    try {
      const sessionRef = firestore().collection("sessions").doc(sessionCode);

      await sessionRef.update({
        activeReactions: firestore.FieldValue.arrayRemove(reaction),
      });

      // Nettoyer le timer
      const key = `${sessionCode}-${reaction.sentBy}-${reaction.sentAt.toMillis()}`;
      const timer = this.cleanupTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.cleanupTimers.delete(key);
      }
    } catch (error) {
      console.error("[ReactionService] removeReaction error:", error);
    }
  }

  /**
   * Nettoie toutes les réactions expirées d'une session
   * Utile pour le nettoyage périodique ou à la reconnexion
   */
  async cleanupExpiredReactions(sessionCode: string): Promise<void> {
    try {
      const sessionRef = firestore().collection("sessions").doc(sessionCode);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists) return;

      const data = sessionDoc.data();
      const reactions: SessionReaction[] = data?.activeReactions || [];
      const now = Date.now();
      const expirationThreshold = now - this.config.displayDuration;

      // Filtrer les réactions non expirées
      const validReactions = reactions.filter(
        (r) => r.sentAt.toMillis() > expirationThreshold
      );

      // Mettre à jour seulement si nécessaire
      if (validReactions.length !== reactions.length) {
        await sessionRef.update({
          activeReactions: validReactions,
        });
        console.log(
          `[ReactionService] Cleaned ${
            reactions.length - validReactions.length
          } expired reactions`
        );
      }
    } catch (error) {
      console.error("[ReactionService] cleanupExpiredReactions error:", error);
    }
  }

  /**
   * Supprime toutes les réactions d'une session
   * Utilisé à la fin d'une partie
   */
  async clearAllReactions(sessionCode: string): Promise<void> {
    try {
      const sessionRef = firestore().collection("sessions").doc(sessionCode);
      await sessionRef.update({
        activeReactions: [],
      });

      // Annuler tous les timers pour cette session
      this.cleanupTimers.forEach((timer, key) => {
        if (key.startsWith(sessionCode)) {
          clearTimeout(timer);
          this.cleanupTimers.delete(key);
        }
      });
    } catch (error) {
      console.error("[ReactionService] clearAllReactions error:", error);
    }
  }

  // ============================================================
  // ÉCOUTE TEMPS RÉEL
  // ============================================================

  /**
   * S'abonne aux réactions d'une session
   *
   * @param sessionCode - Code de la session
   * @param onReactions - Callback avec les réactions actives
   * @returns Fonction de désabonnement
   */
  subscribeToReactions(
    sessionCode: string,
    onReactions: (reactions: SessionReaction[]) => void
  ): () => void {
    const sessionRef = firestore().collection("sessions").doc(sessionCode);

    const unsubscribe = sessionRef.onSnapshot(
      (snapshot) => {
        if (snapshot.exists) {
          const data = snapshot.data();
          const reactions: SessionReaction[] = data?.activeReactions || [];

          // Filtrer les réactions encore valides
          const now = Date.now();
          const validReactions = reactions.filter(
            (r) => now - r.sentAt.toMillis() < this.config.displayDuration
          );

          onReactions(validReactions);
        } else {
          onReactions([]);
        }
      },
      (error) => {
        console.error("[ReactionService] subscribeToReactions error:", error);
        onReactions([]);
      }
    );

    return unsubscribe;
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  /**
   * Obtient les réactions disponibles pour un utilisateur
   */
  getAvailableReactions(isPremium: boolean): Reaction[] {
    if (isPremium) {
      return [...REACTIONS_FREE, ...REACTIONS_PREMIUM] as Reaction[];
    }
    return [...REACTIONS_FREE] as Reaction[];
  }

  /**
   * Nettoie tous les timers (à appeler lors du démontage)
   */
  cleanup(): void {
    this.cleanupTimers.forEach((timer) => clearTimeout(timer));
    this.cleanupTimers.clear();
  }
}

// ============================================================
// INSTANCE SINGLETON
// ============================================================

export const reactionService = new ReactionService();

// Export du type pour les tests
export type { ReactionService };
export default reactionService;