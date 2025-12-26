/**
 * Ligne d'information du profil
 * 
 * Extrait de profile.tsx pour optimisation
 */

import React, { memo, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProfileInfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  editable?: boolean;
  onEdit?: () => void;
}

/**
 * Ligne d'information du profil avec option d'édition
 */
export const ProfileInfoRow = memo<ProfileInfoRowProps>(({
  icon,
  label,
  value,
  editable = false,
  onEdit,
}) => {
  const handleEdit = useCallback(() => {
    onEdit?.();
  }, [onEdit]);

  return (
    <View className="flex-row items-center py-4 border-b border-gray-100">
      <View className="bg-pink-100 p-2 rounded-xl">
        <Ionicons name={icon} size={20} color="#EC4899" />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-xs text-gray-400 uppercase">{label}</Text>
        <Text className="text-base text-gray-800 mt-1">{value}</Text>
      </View>
      {editable && (
        <TouchableOpacity onPress={handleEdit} className="p-2">
          <Ionicons name="pencil" size={20} color="#EC4899" />
        </TouchableOpacity>
      )}
    </View>
  );
});

ProfileInfoRow.displayName = "ProfileInfoRow";
