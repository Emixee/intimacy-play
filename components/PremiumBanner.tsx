/**
 * PremiumBanner - Banner d'upgrade Premium réutilisable
 *
 * Utilisé sur :
 * - Home screen
 * - Profile screen
 * - Preferences screen
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// ============================================================
// TYPES
// ============================================================

interface PremiumBannerProps {
  /** Variante visuelle */
  variant?: "default" | "compact" | "card";
  /** Titre personnalisé */
  title?: string;
  /** Description personnalisée */
  description?: string;
  /** Callback au lieu de navigation */
  onPress?: () => void;
  /** Classes Tailwind additionnelles */
  className?: string;
}

// ============================================================
// COMPOSANT
// ============================================================

export function PremiumBanner({
  variant = "default",
  title = "Passez Premium",
  description = "Débloquez tous les défis et fonctionnalités",
  onPress,
  className = "",
}: PremiumBannerProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/(main)/premium");
    }
  };

  // Variante compact (petite)
  if (variant === "compact") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className={className}
      >
        <LinearGradient
          colors={["#EC4899", "#F472B6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-xl px-4 py-3 flex-row items-center"
        >
          <Text className="text-lg mr-2">👑</Text>
          <Text className="text-white font-semibold flex-1">{title}</Text>
          <Ionicons name="arrow-forward" size={18} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Variante card (dans une card blanche)
  if (variant === "card") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className={`bg-white rounded-2xl p-4 shadow-sm ${className}`}
      >
        <View className="flex-row items-center">
          <LinearGradient
            colors={["#EC4899", "#F472B6"]}
            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
          >
            <Text className="text-xl">👑</Text>
          </LinearGradient>

          <View className="flex-1">
            <Text className="text-gray-800 font-bold">{title}</Text>
            <Text className="text-gray-500 text-sm">{description}</Text>
          </View>

          <View className="bg-pink-500 px-3 py-1.5 rounded-full">
            <Text className="text-white text-xs font-semibold">Upgrade</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Variante default (full width gradient)
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      className={className}
    >
      <LinearGradient
        colors={["#EC4899", "#F472B6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="rounded-3xl p-5"
      >
        <View className="flex-row items-center justify-between">
          {/* Contenu */}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-xl mr-2">👑</Text>
              <Text className="text-lg font-bold text-white">{title}</Text>
            </View>
            <Text className="text-sm text-white/90 mt-1">{description}</Text>
          </View>

          {/* Flèche */}
          <View className="bg-white/20 p-2 rounded-full">
            <Ionicons name="arrow-forward" size={20} color="white" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ============================================================
// EXPORT
// ============================================================

export default PremiumBanner;