/**
 * Badge Premium pour profil
 * 
 * Extrait de profile.tsx pour optimisation
 */

import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface PremiumBadgeProps {
  isPremium: boolean;
}

/**
 * Badge Premium ou bouton upgrade
 */
export const PremiumBadge = memo<PremiumBadgeProps>(({ isPremium }) => {
  if (isPremium) {
    return (
      <View className="flex-row items-center bg-amber-100 px-4 py-2 rounded-full mt-3">
        <Text className="text-lg mr-1">👑</Text>
        <Text className="text-amber-600 font-semibold">Premium</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => router.push("/(main)/premium")}
      activeOpacity={0.8}
      className="flex-row items-center bg-gray-100 px-4 py-2 rounded-full mt-3"
    >
      <Ionicons name="star-outline" size={18} color="#9CA3AF" />
      <Text className="text-gray-500 ml-1">Gratuit</Text>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" className="ml-1" />
    </TouchableOpacity>
  );
});

PremiumBadge.displayName = "PremiumBadge";
