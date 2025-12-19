/**
 * Composant LoadingSpinner
 */

import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { COLORS } from "../../utils/constants";

// ============================================================
// TYPES
// ============================================================

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

// ============================================================
// COMPOSANT
// ============================================================

export function LoadingSpinner({
  size = "large",
  color = COLORS.primary,
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const content = (
    <>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="text-gray-600 mt-4 text-center">{message}</Text>
      )}
    </>
  );
  
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-pink-50">
        {content}
      </View>
    );
  }
  
  return (
    <View className="items-center justify-center py-8">
      {content}
    </View>
  );
}

// ============================================================
// VARIANTE PLEIN ÉCRAN
// ============================================================

export function LoadingScreen({ message = "Chargement..." }: { message?: string }) {
  return <LoadingSpinner fullScreen size="large" message={message} />;
}

export default LoadingSpinner;