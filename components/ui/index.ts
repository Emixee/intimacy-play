/**
 * Export barrel pour les composants UI - OPTIMISÉ
 */

// Composants existants
export { Button } from "./Button";
export { Card } from "./Card";
export { Input } from "./Input";
export { LoadingScreen, LoadingSpinner } from "./LoadingSpinner";
export { LevelBadge, ChallengeTypeBadge } from "./Badge";
export { Modal } from "./Modal";
export { PaywallModal } from "./PaywallModal";

// Toast - export corrigé (ToastContainer renommé en Toast)
export { ToastContainer as Toast, useToast } from "./Toast";

// Nouveau composant
export { ErrorScreen } from "./ErrorScreen";