/**
 * Configuration des optimisations de performance
 * 
 * Ce fichier centralise les paramètres d'optimisation
 * pour faciliter le tuning de l'application.
 */

// ============================================================
// CONFIGURATION DU CACHE
// ============================================================

export const CACHE_CONFIG = {
  /** Durée de vie du cache des défis (en ms) */
  CHALLENGES_TTL: 30 * 60 * 1000, // 30 minutes
  
  /** Nombre max de sessions en cache */
  MAX_CACHED_SESSIONS: 5,
  
  /** Durée de vie du cache des messages (en ms) */
  MESSAGES_TTL: 5 * 60 * 1000, // 5 minutes
};

// ============================================================
// CONFIGURATION DES DEBOUNCE/THROTTLE
// ============================================================

export const TIMING_CONFIG = {
  /** Délai de debounce pour la recherche */
  SEARCH_DEBOUNCE: 300,
  
  /** Délai de debounce pour les sauvegardes */
  SAVE_DEBOUNCE: 500,
  
  /** Intervalle de polling pour les messages non lus */
  UNREAD_POLL_INTERVAL: 5000,
  
  /** Délai avant de masquer un toast */
  TOAST_DURATION: 3000,
  
  /** Délai de protection contre le double-tap */
  DOUBLE_TAP_DELAY: 300,
};

// ============================================================
// CONFIGURATION DES LISTES
// ============================================================

export const LIST_CONFIG = {
  /** Nombre d'éléments par page */
  PAGE_SIZE: 20,
  
  /** Seuil de scroll pour charger plus */
  LOAD_MORE_THRESHOLD: 0.8,
  
  /** Nombre de messages à précharger */
  PRELOAD_MESSAGES: 50,
  
  /** Window size pour FlatList */
  WINDOW_SIZE: 10,
  
  /** Max to render per batch */
  MAX_TO_RENDER_PER_BATCH: 10,
  
  /** Update cell batch size */
  UPDATE_CELL_BATCH_SIZE: 10,
};

// ============================================================
// CONFIGURATION DES IMAGES
// ============================================================

export const IMAGE_CONFIG = {
  /** Qualité de compression JPEG (0-1) */
  JPEG_QUALITY: 0.8,
  
  /** Taille max des images uploadées */
  MAX_IMAGE_SIZE: 1024,
  
  /** Taille des thumbnails */
  THUMBNAIL_SIZE: 200,
  
  /** Format préféré */
  PREFERRED_FORMAT: "jpeg" as const,
};

// ============================================================
// CONFIGURATION DES ANIMATIONS
// ============================================================

export const ANIMATION_CONFIG = {
  /** Durée des animations courtes */
  FAST: 150,
  
  /** Durée des animations normales */
  NORMAL: 300,
  
  /** Durée des animations lentes */
  SLOW: 500,
  
  /** Activer les animations */
  ENABLED: true,
  
  /** Utiliser le native driver quand possible */
  USE_NATIVE_DRIVER: true,
};

// ============================================================
// CONFIGURATION FIREBASE
// ============================================================

export const FIREBASE_CONFIG = {
  /** Activer la persistance offline */
  OFFLINE_PERSISTENCE: true,
  
  /** Taille du cache Firestore (en bytes) */
  CACHE_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB
  
  /** Timeout des requêtes (en ms) */
  REQUEST_TIMEOUT: 10000,
  
  /** Nombre max de retry */
  MAX_RETRIES: 3,
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Crée un debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Crée un throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Mémoïse une fonction avec un cache LRU simple
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  maxSize: number = 100
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      // Déplacer en fin (LRU)
      const value = cache.get(key)!;
      cache.delete(key);
      cache.set(key, value);
      return value;
    }

    const result = func(...args);

    // Éviction si nécessaire
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(key, result);
    return result;
  }) as T;
}
