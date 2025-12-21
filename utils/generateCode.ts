/**
 * Génère un code de session unique à 6 caractères
 * Format : Lettres majuscules + chiffres (sans caractères ambigus)
 * Caractères exclus : 0, O, I, 1, L pour éviter la confusion
 */

// Caractères autorisés (sans ambiguïté visuelle)
const ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Génère un code de session aléatoire
 * @param length Longueur du code (défaut: 6)
 * @returns Code de session unique
 */
export const generateSessionCode = (length: number = 6): string => {
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    code += ALLOWED_CHARS[randomIndex];
  }
  
  return code;
};

/**
 * Valide le format d'un code de session
 * @param code Code à valider
 * @returns true si le code est valide
 */
export const isValidSessionCode = (code: string): boolean => {
  if (!code || code.length !== 6) {
    return false;
  }
  
  // Vérifier que tous les caractères sont autorisés
  const upperCode = code.toUpperCase();
  for (const char of upperCode) {
    if (!ALLOWED_CHARS.includes(char)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Normalise un code de session (majuscules, sans espaces)
 * @param code Code à normaliser
 * @returns Code normalisé
 */
export const normalizeSessionCode = (code: string): string => {
  return code.toUpperCase().replace(/\s/g, '').trim();
};

/**
 * Formate un code de session pour l'affichage (avec tiret au milieu)
 * Exemple : "ABC123" -> "ABC-123"
 * @param code Code à formater
 * @returns Code formaté pour l'affichage
 */
export const formatSessionCodeForDisplay = (code: string): string => {
  const normalized = normalizeSessionCode(code);
  if (normalized.length !== 6) {
    return normalized;
  }
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
};

/**
 * Génère un code d'invitation pour les couples
 * Format : 8 caractères pour plus de sécurité
 * @returns Code d'invitation unique
 */
export const generateInviteCode = (): string => {
  return generateSessionCode(8);
};

/**
 * Valide le format d'un code d'invitation couple
 * @param code Code à valider
 * @returns true si le code est valide
 */
export const isValidInviteCode = (code: string): boolean => {
  if (!code || code.length !== 8) {
    return false;
  }
  
  const upperCode = code.toUpperCase();
  for (const char of upperCode) {
    if (!ALLOWED_CHARS.includes(char)) {
      return false;
    }
  }
  
  return true;
};
