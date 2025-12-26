/**
 * Option de menu pour profil
 * 
 * Extrait de profile.tsx pour optimisation
 */

import React, { memo, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MenuOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

/**
 * Option de menu avec icône
 */
export const MenuOption = memo<MenuOptionProps>(({
  icon,
  label,
  onPress,
  danger = false,
}) => {
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="flex-row items-center py-4 border-b border-gray-100"
    >
      <View className={`p-2 rounded-xl ${danger ? "bg-red-100" : "bg-gray-100"}`}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? "#EF4444" : "#6B7280"}
        />
      </View>
      <Text
        className={`flex-1 ml-4 text-base ${
          danger ? "text-red-500" : "text-gray-800"
        }`}
      >
        {label}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={danger ? "#EF4444" : "#9CA3AF"}
      />
    </TouchableOpacity>
  );
});

MenuOption.displayName = "MenuOption";
