/**
 * Messages d'erreur user-friendly en français
 * 
 * Transforme les codes d'erreur techniques en messages compréhensibles
 */

// ============================================================
// TYPES
// ============================================================

export type ErrorCode = 
  // Auth
  | 'auth/invalid-email'
  | 'auth/user-disabled'
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/email-already-in-use'
  | 'auth/weak-password'
  | 'auth/network-request-failed'
  | 'auth/too-many-requests'
  | 'auth/requires-recent-login'
  // Firestore
  | 'firestore/permission-denied'
  | 'firestore/unavailable'
  | 'firestore/not-found'
  | 'firestore/already-exists'
  | 'firestore/deadline-exceeded'
  | 'firestore/cancelled'
  // Session
  | 'session/not-found'
  | 'session/expired'
  | 'session/partner-left'
  | 'session/already-started'
  | 'session/full'
  | 'session/invalid-code'
  // Media
  | 'media/expired'
  | 'media/upload-failed'
  | 'media/download-failed'
  | 'media/not-found'
  // Network
  | 'network/offline'
  | 'network/timeout'
  | 'network/server-error'
  // Premium
  | 'premium/required'
  | 'premium/purchase-failed'
  | 'premium/restore-failed'
  // General
  | 'unknown'
  | 'cancelled';

export interface ErrorInfo {
  code: ErrorCode;
  title: string;
  message: string;
  action?: string;
  recoverable: boolean;
  retryable: boolean;
}

// ============================================================
// MESSAGES D'ERREUR
// ============================================================

export const ERROR_MESSAGES: Record<ErrorCode, Omit<ErrorInfo, 'code'>> = {
  // Auth Errors
  'auth/invalid-email': {
    title: 'Email invalide',
    message: 'Veuillez entrer une adresse email valide.',
    recoverable: true,
    retryable: false,
  },
  'auth/user-disabled': {
    title: 'Compte désactivé',
    message: 'Votre compte a été désactivé. Contactez le support pour plus d\'informations.',
    recoverable: false,
    retryable: false,
  },
  'auth/user-not-found': {
    title: 'Compte introuvable',
    message: 'Aucun compte n\'existe avec cette adresse email.',
    action: 'Créer un compte',
    recoverable: true,
    retryable: false,
  },
  'auth/wrong-password': {
    title: 'Mot de passe incorrect',
    message: 'Le mot de passe saisi est incorrect. Veuillez réessayer.',
    action: 'Mot de passe oublié ?',
    recoverable: true,
    retryable: false,
  },
  'auth/email-already-in-use': {
    title: 'Email déjà utilisé',
    message: 'Cette adresse email est déjà associée à un compte.',
    action: 'Se connecter',
    recoverable: true,
    retryable: false,
  },
  'auth/weak-password': {
    title: 'Mot de passe trop faible',
    message: 'Votre mot de passe doit contenir au moins 6 caractères.',
    recoverable: true,
    retryable: false,
  },
  'auth/network-request-failed': {
    title: 'Erreur de connexion',
    message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
    action: 'Réessayer',
    recoverable: true,
    retryable: true,
  },
  'auth/too-many-requests': {
    title: 'Trop de tentatives',
    message: 'Trop de tentatives de connexion. Veuillez patienter quelques minutes.',
    recoverable: true,
    retryable: false,
  },
  'auth/requires-recent-login': {
    title: 'Reconnexion requise',
    message: 'Pour des raisons de sécurité, veuillez vous reconnecter.',
    action: 'Se reconnecter',
    recoverable: true,
    retryable: false,
  },

  // Firestore Errors
  'firestore/permission-denied': {
    title: 'Accès refusé',
    message: 'Vous n\'avez pas les permissions nécessaires pour cette action.',
    recoverable: false,
    retryable: false,
  },
  'firestore/unavailable': {
    title: 'Service indisponible',
    message: 'Le service est temporairement indisponible. Réessayez dans quelques instants.',
    action: 'Réessayer',
    recoverable: true,
    retryable: true,
  },
  'firestore/not-found': {
    title: 'Données introuvables',
    message: 'Les données demandées n\'existent plus ou ont été supprimées.',
    recoverable: false,
    retryable: false,
  },
  'firestore/already-exists': {
    title: 'Déjà existant',
    message: 'Cette ressource existe déjà.',
    recoverable: true,
    retryable: false,
  },
  'firestore/deadline-exceeded': {
    title: 'Délai dépassé',
    message: 'La requête a pris trop de temps. Vérifiez votre connexion.',
    action: 'Réessayer',
    recoverable: true,
    retryable: true,
  },
  'firestore/cancelled': {
    title: 'Opération annulée',
    message: 'L\'opération a été annulée.',
    recoverable: true,
    retryable: true,
  },

  // Session Errors
  'session/not-found': {
    title: 'Session introuvable',
    message: 'Cette session n\'existe pas ou a été supprimée.',
    action: 'Retour à l\'accueil',
    recoverable: false,
    retryable: false,
  },
  'session/expired': {
    title: 'Session expirée',
    message: 'Cette session a expiré. Créez-en une nouvelle pour jouer.',
    action: 'Nouvelle partie',
    recoverable: false,
    retryable: false,
  },
  'session/partner-left': {
    title: 'Partenaire déconnecté',
    message: 'Votre partenaire a quitté la partie. La session est terminée.',
    action: 'Retour à l\'accueil',
    recoverable: false,
    retryable: false,
  },
  'session/already-started': {
    title: 'Partie déjà commencée',
    message: 'Cette partie a déjà commencé et ne peut plus accueillir de joueur.',
    recoverable: false,
    retryable: false,
  },
  'session/full': {
    title: 'Session complète',
    message: 'Cette session est déjà complète avec deux joueurs.',
    recoverable: false,
    retryable: false,
  },
  'session/invalid-code': {
    title: 'Code invalide',
    message: 'Ce code de session n\'est pas valide. Vérifiez et réessayez.',
    recoverable: true,
    retryable: false,
  },

  // Media Errors
  'media/expired': {
    title: 'Média expiré',
    message: 'Ce contenu a expiré et n\'est plus disponible.',
    recoverable: false,
    retryable: false,
  },
  'media/upload-failed': {
    title: 'Échec d\'envoi',
    message: 'Impossible d\'envoyer le fichier. Vérifiez votre connexion.',
    action: 'Réessayer',
    recoverable: true,
    retryable: true,
  },
  'media/download-failed': {
    title: 'Échec de téléchargement',
    message: 'Impossible de télécharger le fichier. Réessayez.',
    action: 'Réessayer',
    recoverable: true,
    retryable: true,
  },
  'media/not-found': {
    title: 'Fichier introuvable',
    message: 'Ce fichier n\'existe plus ou a été supprimé.',
    recoverable: false,
    retryable: false,
  },

  // Network Errors
  'network/offline': {
    title: 'Hors connexion',
    message: 'Vous êtes actuellement hors ligne. Reconnectez-vous à internet.',
    action: 'Réessayer',
    recoverable: true,
    retryable: true,
  },
  'network/timeout': {
    title: 'Délai d\'attente dépassé',
    message: 'La connexion au serveur a pris trop de temps.',
    action: 'Réessayer',
    recoverable: true,
    retryable: true,
  },
  'network/server-error': {
    title: 'Erreur serveur',
    message: 'Une erreur est survenue sur nos serveurs. Réessayez plus tard.',
    action: 'Réessayer',
    recoverable: true,
    retryable: true,
  },

  // Premium Errors
  'premium/required': {
    title: 'Fonctionnalité Premium',
    message: 'Cette fonctionnalité nécessite un abonnement Premium.',
    action: 'Voir les offres',
    recoverable: true,
    retryable: false,
  },
  'premium/purchase-failed': {
    title: 'Échec de l\'achat',
    message: 'L\'achat n\'a pas pu être finalisé. Aucun montant n\'a été débité.',
    action: 'Réessayer',
    recoverable: true,
    retryable: true,
  },
  'premium/restore-failed': {
    title: 'Échec de restauration',
    message: 'Impossible de restaurer vos achats. Vérifiez votre compte.',
    action: 'Réessayer',
    recoverable: true,
    retryable: true,
  },

  // General Errors
  'unknown': {
    title: 'Erreur inattendue',
    message: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
    action: 'Réessayer',
    recoverable: true,
    retryable: true,
  },
  'cancelled': {
    title: 'Opération annulée',
    message: 'L\'opération a été annulée.',
    recoverable: true,
    retryable: false,
  },
};

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Récupère les informations d'erreur à partir d'un code
 */
export const getErrorInfo = (code: ErrorCode | string): ErrorInfo => {
  const normalizedCode = normalizeErrorCode(code);
  const errorData = ERROR_MESSAGES[normalizedCode] || ERROR_MESSAGES['unknown'];
  
  return {
    code: normalizedCode,
    ...errorData,
  };
};

/**
 * Normalise un code d'erreur Firebase ou custom
 */
export const normalizeErrorCode = (code: string): ErrorCode => {
  // Retirer le préfixe Firebase si présent
  const cleanCode = code.replace(/^(firestore|auth)\//, '');
  
  // Mapping des codes Firebase vers nos codes
  const codeMap: Record<string, ErrorCode> = {
    // Auth
    'invalid-email': 'auth/invalid-email',
    'user-disabled': 'auth/user-disabled',
    'user-not-found': 'auth/user-not-found',
    'wrong-password': 'auth/wrong-password',
    'email-already-in-use': 'auth/email-already-in-use',
    'weak-password': 'auth/weak-password',
    'network-request-failed': 'auth/network-request-failed',
    'too-many-requests': 'auth/too-many-requests',
    'requires-recent-login': 'auth/requires-recent-login',
    
    // Firestore
    'permission-denied': 'firestore/permission-denied',
    'unavailable': 'firestore/unavailable',
    'not-found': 'firestore/not-found',
    'already-exists': 'firestore/already-exists',
    'deadline-exceeded': 'firestore/deadline-exceeded',
    'cancelled': 'firestore/cancelled',
  };

  // Vérifier si c'est déjà un code valide
  if (code in ERROR_MESSAGES) {
    return code as ErrorCode;
  }

  // Sinon, essayer de mapper
  return codeMap[cleanCode] || 'unknown';
};

/**
 * Extrait le code d'erreur d'une erreur Firebase
 */
export const extractErrorCode = (error: any): ErrorCode => {
  if (!error) return 'unknown';
  
  // Firebase Error
  if (error.code) {
    return normalizeErrorCode(error.code);
  }
  
  // Custom error avec code
  if (typeof error === 'object' && 'errorCode' in error) {
    return normalizeErrorCode(error.errorCode);
  }
  
  // String error
  if (typeof error === 'string') {
    // Chercher des patterns connus
    if (error.includes('network') || error.includes('offline')) {
      return 'network/offline';
    }
    if (error.includes('timeout')) {
      return 'network/timeout';
    }
    if (error.includes('permission')) {
      return 'firestore/permission-denied';
    }
  }
  
  return 'unknown';
};

/**
 * Crée un message d'erreur formaté pour l'utilisateur
 */
export const formatErrorForUser = (error: any): { title: string; message: string } => {
  const code = extractErrorCode(error);
  const info = getErrorInfo(code);
  
  return {
    title: info.title,
    message: info.message,
  };
};

export default ERROR_MESSAGES;