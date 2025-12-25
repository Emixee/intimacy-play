/**
 * Hook de protection contre le double-tap
 * 
 * Empêche les clics multiples rapides sur les boutons
 * pour éviter les actions dupliquées
 */

import { useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';

// ============================================================
// TYPES
// ============================================================

interface UseDebouncePress {
  /** Fonction wrappée avec protection double-tap */
  debounce: <T extends (...args: any[]) => any>(
    fn: T,
    delay?: number
  ) => (...args: Parameters<T>) => void;
  
  /** Vérifie si on peut cliquer (pour affichage UI) */
  canPress: () => boolean;
  
  /** Reset manuel du debounce */
  reset: () => void;
  
  /** État actuel (pressed = en attente) */
  isPressed: boolean;
}

interface DebounceOptions {
  /** Délai par défaut en ms */
  defaultDelay?: number;
  /** Vibration haptic sur double-tap bloqué */
  hapticOnBlock?: boolean;
  /** Log en dev */
  debug?: boolean;
}

// ============================================================
// HOOK
// ============================================================

export const useDebouncePress = (options: DebounceOptions = {}): UseDebouncePress => {
  const {
    defaultDelay = 500,
    hapticOnBlock = true,
    debug = __DEV__,
  } = options;

  const lastPressRef = useRef<number>(0);
  const isPressedRef = useRef<boolean>(false);

  /**
   * Wrappe une fonction avec protection double-tap
   */
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = defaultDelay
  ) => {
    return (...args: Parameters<T>): void => {
      const now = Date.now();
      const timeSinceLastPress = now - lastPressRef.current;

      if (timeSinceLastPress < delay) {
        // Double-tap détecté, bloquer
        if (debug) {
          console.log(`[DebouncePress] Blocked - ${timeSinceLastPress}ms since last press`);
        }
        
        if (hapticOnBlock) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        return;
      }

      // Enregistrer le press
      lastPressRef.current = now;
      isPressedRef.current = true;

      // Exécuter la fonction
      try {
        fn(...args);
      } finally {
        // Reset après le délai
        setTimeout(() => {
          isPressedRef.current = false;
        }, delay);
      }
    };
  }, [defaultDelay, hapticOnBlock, debug]);

  /**
   * Vérifie si on peut presser
   */
  const canPress = useCallback((): boolean => {
    const now = Date.now();
    return now - lastPressRef.current >= defaultDelay;
  }, [defaultDelay]);

  /**
   * Reset manuel
   */
  const reset = useCallback((): void => {
    lastPressRef.current = 0;
    isPressedRef.current = false;
  }, []);

  return {
    debounce,
    canPress,
    reset,
    isPressed: isPressedRef.current,
  };
};

/**
 * Hook simplifié pour un seul bouton
 */
export const useSinglePress = (
  onPress: () => void | Promise<void>,
  delay: number = 500
) => {
  const { debounce } = useDebouncePress({ defaultDelay: delay });
  return debounce(onPress);
};

export default useDebouncePress;