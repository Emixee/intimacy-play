/**
 * Composant Badge réutilisable
 *
 * Affiche des badges/étiquettes avec différentes variantes de couleur.
 * Utilisé pour les statuts, niveaux d'intensité, types de défis, etc.
 */

import React, { ReactNode } from "react";
import { View, Text, StyleProp, ViewStyle } from "react-native";
import { IntensityLevel } from "../../types";

// ============================================================
// TYPES
// ============================================================

type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info";

type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

interface IntensityBadgeProps {
  level: IntensityLevel;
  showLabel?: boolean;
  size?: BadgeSize;
  className?: string;
}

interface StatusBadgeProps {
  status: "waiting" | "active" | "completed" | "abandoned";
  size?: BadgeSize;
  className?: string;
}

interface ChallengeTypeBadgeProps {
  type: "audio" | "video" | "photo" | "texte";
  size?: BadgeSize;
  className?: string;
}

// ============================================================
// STYLES
// ============================================================

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: "bg-gray-100", text: "text-gray-800" },
  primary: { bg: "bg-pink-100", text: "text-pink-800" },
  secondary: { bg: "bg-gray-200", text: "text-gray-700" },
  success: { bg: "bg-green-100", text: "text-green-800" },
  warning: { bg: "bg-yellow-100", text: "text-yellow-800" },
  error: { bg: "bg-red-100", text: "text-red-800" },
  info: { bg: "bg-blue-100", text: "text-blue-800" },
};

const sizeStyles: Record<BadgeSize, { container: string; text: string }> = {
  sm: { container: "px-2 py-0.5 rounded", text: "text-xs" },
  md: { container: "px-2.5 py-1 rounded-md", text: "text-sm" },
  lg: { container: "px-3 py-1.5 rounded-lg", text: "text-base" },
};

const intensityConfig: Record<
  IntensityLevel,
  { emoji: string; label: string; bg: string; text: string }
> = {
  1: {
    emoji: "😇",
    label: "Romantique",
    bg: "bg-pink-100",
    text: "text-pink-800",
  },
  2: {
    emoji: "😊",
    label: "Sensuel",
    bg: "bg-orange-100",
    text: "text-orange-800",
  },
  3: {
    emoji: "😏",
    label: "Érotique",
    bg: "bg-purple-100",
    text: "text-purple-800",
  },
  4: {
    emoji: "🔥",
    label: "Explicite",
    bg: "bg-red-100",
    text: "text-red-800",
  },
};

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  waiting: { label: "En attente", bg: "bg-yellow-100", text: "text-yellow-800" },
  active: { label: "En cours", bg: "bg-green-100", text: "text-green-800" },
  completed: { label: "Terminée", bg: "bg-blue-100", text: "text-blue-800" },
  abandoned: { label: "Abandonnée", bg: "bg-gray-100", text: "text-gray-800" },
};

const challengeTypeConfig: Record<
  string,
  { emoji: string; label: string; bg: string; text: string }
> = {
  audio: { emoji: "🎤", label: "Audio", bg: "bg-purple-100", text: "text-purple-800" },
  video: { emoji: "🎬", label: "Vidéo", bg: "bg-red-100", text: "text-red-800" },
  photo: { emoji: "📸", label: "Photo", bg: "bg-blue-100", text: "text-blue-800" },
  texte: { emoji: "✍️", label: "Texte", bg: "bg-green-100", text: "text-green-800" },
};

// ============================================================
// COMPOSANTS
// ============================================================

/**
 * Badge générique
 */
export const Badge = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  style,
}: BadgeProps) => {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      className={`${variantStyle.bg} ${sizeStyle.container} self-start ${className}`.trim()}
      style={style}
    >
      <Text className={`${variantStyle.text} ${sizeStyle.text} font-medium`}>
        {children}
      </Text>
    </View>
  );
};

/**
 * Badge pour les niveaux d'intensité
 */
export const IntensityBadge = ({
  level,
  showLabel = true,
  size = "md",
  className = "",
}: IntensityBadgeProps) => {
  const config = intensityConfig[level];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      className={`${config.bg} ${sizeStyle.container} flex-row items-center self-start ${className}`.trim()}
    >
      <Text className={sizeStyle.text}>{config.emoji}</Text>
      {showLabel && (
        <Text className={`${config.text} ${sizeStyle.text} font-medium ml-1`}>
          {config.label}
        </Text>
      )}
    </View>
  );
};

/**
 * Badge pour les statuts de session
 */
export const StatusBadge = ({
  status,
  size = "md",
  className = "",
}: StatusBadgeProps) => {
  const config = statusConfig[status];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      className={`${config.bg} ${sizeStyle.container} self-start ${className}`.trim()}
    >
      <Text className={`${config.text} ${sizeStyle.text} font-medium`}>
        {config.label}
      </Text>
    </View>
  );
};

/**
 * Badge pour les types de défis
 */
export const ChallengeTypeBadge = ({
  type,
  size = "md",
  className = "",
}: ChallengeTypeBadgeProps) => {
  const config = challengeTypeConfig[type];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      className={`${config.bg} ${sizeStyle.container} flex-row items-center self-start ${className}`.trim()}
    >
      <Text className={sizeStyle.text}>{config.emoji}</Text>
      <Text className={`${config.text} ${sizeStyle.text} font-medium ml-1`}>
        {config.label}
      </Text>
    </View>
  );
};

/**
 * Badge Premium
 */
export const PremiumBadge = ({
  size = "md",
  className = "",
}: {
  size?: BadgeSize;
  className?: string;
}) => {
  const sizeStyle = sizeStyles[size];

  return (
    <View
      className={`bg-gradient-to-r from-yellow-400 to-yellow-500 ${sizeStyle.container} flex-row items-center self-start ${className}`.trim()}
    >
      <Text className={sizeStyle.text}>👑</Text>
      <Text className={`text-white ${sizeStyle.text} font-bold ml-1`}>
        Premium
      </Text>
    </View>
  );
};

export default Badge;
