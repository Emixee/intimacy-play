/**
 * Composant Badge réutilisable
 *
 * Affiche des labels, statuts, niveaux, etc.
 * Plusieurs variantes : default, success, warning, danger, premium, level.
 */

import React from "react";
import { View, Text, ViewProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IntensityLevel } from "../../types";

// ============================================================
// TYPES
// ============================================================

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "premium"
  | "outline";

type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends ViewProps {
  /** Texte du badge */
  label: string;
  /** Variante visuelle */
  variant?: BadgeVariant;
  /** Taille du badge */
  size?: BadgeSize;
  /** Icône à gauche */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Emoji à gauche (priorité sur icon) */
  emoji?: string;
  /** Classes supplémentaires */
  className?: string;
}

interface LevelBadgeProps {
  /** Niveau d'intensité (1-4) */
  level: IntensityLevel;
  /** Afficher le nom complet du niveau */
  showLabel?: boolean;
  /** Taille */
  size?: BadgeSize;
  /** Classes supplémentaires */
  className?: string;
}

interface PremiumBadgeProps {
  /** Texte personnalisé */
  label?: string;
  /** Taille */
  size?: BadgeSize;
  /** Classes supplémentaires */
  className?: string;
}

// ============================================================
// STYLES
// ============================================================

const variantStyles: Record<BadgeVariant, { container: string; text: string; iconColor: string }> = {
  default: {
    container: "bg-gray-100",
    text: "text-gray-600",
    iconColor: "#6B7280",
  },
  primary: {
    container: "bg-pink-100",
    text: "text-pink-600",
    iconColor: "#EC4899",
  },
  success: {
    container: "bg-green-100",
    text: "text-green-600",
    iconColor: "#10B981",
  },
  warning: {
    container: "bg-amber-100",
    text: "text-amber-600",
    iconColor: "#F59E0B",
  },
  danger: {
    container: "bg-red-100",
    text: "text-red-600",
    iconColor: "#EF4444",
  },
  premium: {
    container: "bg-amber-100",
    text: "text-amber-600",
    iconColor: "#F59E0B",
  },
  outline: {
    container: "bg-transparent border border-gray-300",
    text: "text-gray-600",
    iconColor: "#6B7280",
  },
};

const sizeStyles: Record<BadgeSize, { container: string; text: string; icon: number }> = {
  sm: {
    container: "px-2 py-0.5 rounded-md",
    text: "text-xs",
    icon: 12,
  },
  md: {
    container: "px-3 py-1 rounded-lg",
    text: "text-sm",
    icon: 14,
  },
  lg: {
    container: "px-4 py-1.5 rounded-xl",
    text: "text-base",
    icon: 16,
  },
};

// Données des niveaux d'intensité
const LEVEL_DATA: Record<IntensityLevel, { name: string; emoji: string; color: string; bgColor: string }> = {
  1: {
    name: "Romantique",
    emoji: "😇",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  2: {
    name: "Sensuel",
    emoji: "😊",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  3: {
    name: "Érotique",
    emoji: "😏",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  4: {
    name: "Explicite",
    emoji: "🔥",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
};

// ============================================================
// COMPOSANTS
// ============================================================

/**
 * Badge générique
 */
export function Badge({
  label,
  variant = "default",
  size = "md",
  icon,
  emoji,
  className = "",
  ...props
}: BadgeProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  return (
    <View
      className={`
        flex-row items-center self-start
        ${styles.container}
        ${sizes.container}
        ${className}
      `}
      {...props}
    >
      {/* Emoji ou Icône */}
      {emoji ? (
        <Text className={`mr-1 ${sizes.text}`}>{emoji}</Text>
      ) : icon ? (
        <Ionicons
          name={icon}
          size={sizes.icon}
          color={styles.iconColor}
          style={{ marginRight: 4 }}
        />
      ) : null}

      {/* Label */}
      <Text className={`font-medium ${styles.text} ${sizes.text}`}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Badge de niveau d'intensité
 */
export function LevelBadge({
  level,
  showLabel = true,
  size = "md",
  className = "",
}: LevelBadgeProps) {
  const data = LEVEL_DATA[level];
  const sizes = sizeStyles[size];

  return (
    <View
      className={`
        flex-row items-center self-start
        ${data.bgColor}
        ${sizes.container}
        ${className}
      `}
    >
      <Text className={sizes.text}>{data.emoji}</Text>
      {showLabel && (
        <Text className={`font-medium ${data.color} ${sizes.text} ml-1`}>
          {data.name}
        </Text>
      )}
    </View>
  );
}

/**
 * Badge Premium
 */
export function PremiumBadge({
  label = "Premium",
  size = "md",
  className = "",
}: PremiumBadgeProps) {
  const sizes = sizeStyles[size];

  return (
    <View
      className={`
        flex-row items-center self-start
        bg-gradient-to-r from-amber-100 to-yellow-100
        bg-amber-100
        ${sizes.container}
        ${className}
      `}
    >
      <Text className={sizes.text}>👑</Text>
      <Text className={`font-semibold text-amber-600 ${sizes.text} ml-1`}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Badge de statut de session
 */
export function StatusBadge({
  status,
  size = "md",
  className = "",
}: {
  status: "waiting" | "active" | "completed" | "abandoned";
  size?: BadgeSize;
  className?: string;
}) {
  const statusConfig: Record<string, { label: string; variant: BadgeVariant; icon: keyof typeof Ionicons.glyphMap }> = {
    waiting: { label: "En attente", variant: "warning", icon: "time-outline" },
    active: { label: "En cours", variant: "success", icon: "play-outline" },
    completed: { label: "Terminée", variant: "primary", icon: "checkmark-circle-outline" },
    abandoned: { label: "Abandonnée", variant: "danger", icon: "close-circle-outline" },
  };

  const config = statusConfig[status];

  return (
    <Badge
      label={config.label}
      variant={config.variant}
      icon={config.icon}
      size={size}
      className={className}
    />
  );
}

/**
 * Badge de type de défi
 */
export function ChallengeTypeBadge({
  type,
  size = "sm",
  className = "",
}: {
  type: "audio" | "video" | "photo" | "texte";
  size?: BadgeSize;
  className?: string;
}) {
  const typeConfig: Record<string, { label: string; emoji: string; bgColor: string; textColor: string }> = {
    audio: { label: "Audio", emoji: "🎤", bgColor: "bg-blue-100", textColor: "text-blue-600" },
    video: { label: "Vidéo", emoji: "🎬", bgColor: "bg-purple-100", textColor: "text-purple-600" },
    photo: { label: "Photo", emoji: "📸", bgColor: "bg-green-100", textColor: "text-green-600" },
    texte: { label: "Texte", emoji: "✍️", bgColor: "bg-orange-100", textColor: "text-orange-600" },
  };

  const config = typeConfig[type];
  const sizes = sizeStyles[size];

  return (
    <View
      className={`
        flex-row items-center self-start
        ${config.bgColor}
        ${sizes.container}
        ${className}
      `}
    >
      <Text className={sizes.text}>{config.emoji}</Text>
      <Text className={`font-medium ${config.textColor} ${sizes.text} ml-1`}>
        {config.label}
      </Text>
    </View>
  );
}

// ============================================================
// EXPORTS
// ============================================================

export default Badge;