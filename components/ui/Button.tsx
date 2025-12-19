/**
 * Composant Button réutilisable
 */

import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from "react-native";

// ============================================================
// TYPES
// ============================================================

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

// ============================================================
// STYLES
// ============================================================

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: "bg-pink-500 active:bg-pink-600",
    text: "text-white font-semibold",
  },
  secondary: {
    container: "bg-gray-200 active:bg-gray-300",
    text: "text-gray-800 font-semibold",
  },
  outline: {
    container: "bg-transparent border-2 border-pink-500 active:bg-pink-50",
    text: "text-pink-500 font-semibold",
  },
  ghost: {
    container: "bg-transparent active:bg-gray-100",
    text: "text-pink-500 font-semibold",
  },
  danger: {
    container: "bg-red-500 active:bg-red-600",
    text: "text-white font-semibold",
  },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: {
    container: "px-4 py-2 rounded-lg",
    text: "text-sm",
  },
  md: {
    container: "px-6 py-3 rounded-xl",
    text: "text-base",
  },
  lg: {
    container: "px-8 py-4 rounded-2xl",
    text: "text-lg",
  },
};

const disabledStyles = {
  container: "opacity-50",
};

// ============================================================
// COMPOSANT
// ============================================================

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  
  const containerClasses = [
    "flex-row items-center justify-center",
    variantStyles[variant].container,
    sizeStyles[size].container,
    isDisabled && disabledStyles.container,
    fullWidth && "w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  
  const textClasses = [
    variantStyles[variant].text,
    sizeStyles[size].text,
  ].join(" ");
  
  const loaderColor = variant === "primary" || variant === "danger" ? "#FFFFFF" : "#EC4899";
  
  return (
    <TouchableOpacity
      className={containerClasses}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={loaderColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <View className="mr-2">{icon}</View>
          )}
          <Text className={textClasses}>{title}</Text>
          {icon && iconPosition === "right" && (
            <View className="ml-2">{icon}</View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

export default Button;