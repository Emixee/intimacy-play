/**
 * GameHeader - En-tête du jeu avec progression
 */

import React, { memo, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LevelBadge } from "../ui";
import type { IntensityLevel } from "../../types";

interface GameHeaderProps {
  currentIndex: number;
  totalCount: number;
  currentLevel: IntensityLevel;
  onQuit: () => void;
}

export const GameHeader = memo<GameHeaderProps>(({ currentIndex, totalCount, currentLevel, onQuit }) => {
  const progressPercent = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((currentIndex / totalCount) * 100);
  }, [currentIndex, totalCount]);

  return (
    <View className="px-5 pt-4 pb-2">
      <View className="flex-row items-center justify-between mb-4">
        <Pressable onPress={onQuit} className="w-10 h-10 items-center justify-center rounded-full bg-white active:bg-gray-100">
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>
        <View className="flex-row items-center">
          <Text className="text-gray-600 font-medium">Défi </Text>
          <Text className="text-pink-500 font-bold text-lg">{currentIndex + 1}</Text>
          <Text className="text-gray-600 font-medium"> / {totalCount}</Text>
        </View>
        <LevelBadge level={currentLevel} showLabel={false} size="md" />
      </View>
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <View className="h-full bg-pink-500 rounded-full" style={{ width: `${progressPercent}%` }} />
      </View>
    </View>
  );
});

GameHeader.displayName = "GameHeader";
export default GameHeader;
