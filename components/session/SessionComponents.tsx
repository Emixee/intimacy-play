/**
 * Composants pour l'écran de création de session
 * 
 * Extraits de create-session.tsx pour optimisation
 */

import React, { memo, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui";
import { IntensityLevel, MAX_CHALLENGE_CHANGES } from "../../types";

// ============================================================
// TYPES ET CONSTANTES
// ============================================================

interface LevelColorConfig {
  bg: string;
  text: string;
  border: string;
  icon: string;
}

export const LEVEL_COLORS: Record<IntensityLevel, LevelColorConfig> = {
  1: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    icon: "#15803D",
  },
  2: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-300",
    icon: "#C2410C",
  },
  3: {
    bg: "bg-pink-100",
    text: "text-pink-700",
    border: "border-pink-300",
    icon: "#BE185D",
  },
  4: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    icon: "#B91C1C",
  },
};

// ============================================================
// INTENSITY OPTION
// ============================================================

interface IntensityOptionProps {
  level: IntensityLevel;
  name: string;
  emoji: string;
  description: string;
  isPremiumLevel: boolean;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: () => void;
}

export const IntensityOption = memo<IntensityOptionProps>(({
  level,
  name,
  emoji,
  description,
  isPremiumLevel,
  isSelected,
  isLocked,
  onSelect,
}) => {
  const colors = LEVEL_COLORS[level];
  
  const handlePress = useCallback(() => {
    if (!isLocked) {
      onSelect();
    }
  }, [isLocked, onSelect]);

  return (
    <Pressable
      onPress={handlePress}
      className={`
        flex-row items-center p-4 rounded-xl mb-3 border-2
        ${isSelected ? colors.bg + " " + colors.border : "bg-white border-gray-200"}
        ${isLocked ? "opacity-60" : ""}
      `}
    >
      <View className="w-12 h-12 rounded-full bg-white items-center justify-center mr-3">
        <Text className="text-2xl">{emoji}</Text>
      </View>

      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className={`text-lg font-semibold ${isSelected ? colors.text : "text-gray-800"}`}>
            {name}
          </Text>
          {isPremiumLevel && (
            <View className="ml-2 bg-amber-100 px-2 py-0.5 rounded-full">
              <Text className="text-amber-600 text-xs font-medium">👑 Premium</Text>
            </View>
          )}
        </View>
        <Text className="text-gray-500 text-sm mt-0.5">{description}</Text>
      </View>

      {isLocked ? (
        <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
      ) : isSelected ? (
        <View className={`w-6 h-6 rounded-full items-center justify-center ${colors.bg}`}>
          <Ionicons name="checkmark" size={16} color={colors.icon} />
        </View>
      ) : null}
    </Pressable>
  );
});

IntensityOption.displayName = "IntensityOption";

// ============================================================
// CHALLENGE COUNT SELECTOR
// ============================================================

interface ChallengeCountSelectorProps {
  counts: number[];
  selected: number;
  maxFree: number;
  isPremium: boolean;
  onSelect: (count: number) => void;
}

export const ChallengeCountSelector = memo<ChallengeCountSelectorProps>(({
  counts,
  selected,
  maxFree,
  isPremium,
  onSelect,
}) => {
  return (
    <View className="flex-row flex-wrap">
      {counts.map((count) => {
        const isSelected = count === selected;
        const isLocked = count > maxFree && !isPremium;

        return (
          <CountButton
            key={count}
            count={count}
            isSelected={isSelected}
            isLocked={isLocked}
            onPress={() => !isLocked && onSelect(count)}
          />
        );
      })}
    </View>
  );
});

ChallengeCountSelector.displayName = "ChallengeCountSelector";

// Sous-composant pour éviter les re-renders
interface CountButtonProps {
  count: number;
  isSelected: boolean;
  isLocked: boolean;
  onPress: () => void;
}

const CountButton = memo<CountButtonProps>(({ count, isSelected, isLocked, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      className={`
        min-w-[60px] px-4 py-3 rounded-xl mr-2 mb-2 items-center
        ${isSelected ? "bg-pink-500" : isLocked ? "bg-gray-100" : "bg-white"}
        ${isLocked ? "opacity-60" : ""}
      `}
    >
      <Text
        className={`font-semibold ${isSelected ? "text-white" : isLocked ? "text-gray-400" : "text-gray-800"}`}
      >
        {count}
      </Text>
      {isLocked && (
        <Ionicons name="lock-closed" size={12} color="#9CA3AF" style={{ marginTop: 2 }} />
      )}
    </Pressable>
  );
});

CountButton.displayName = "CountButton";

// ============================================================
// RULES INFO
// ============================================================

interface RulesInfoProps {
  isPremium: boolean;
}

export const RulesInfo = memo<RulesInfoProps>(({ isPremium }) => {
  return (
    <Card className="mb-6">
      <Card.Content>
        <View className="flex-row items-start">
          <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <Text className="text-blue-800 font-semibold mb-1">
              Comment ça marche ?
            </Text>
            <Text className="text-blue-700 text-sm leading-5">
              • Chaque joueur a le même nombre de défis{"\n"}
              • Les défis sont adaptés à vos préférences{"\n"}
              • Les défis alternent entre vous et votre partenaire{"\n"}
              • Chacun réalise son défi et envoie une preuve{"\n"}
              • L'autre valide après avoir reçu la preuve{"\n"}
              • {MAX_CHALLENGE_CHANGES} changements de défi par partie
              {!isPremium && "\n• Passez Premium pour plus d'options !"}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
});

RulesInfo.displayName = "RulesInfo";

// ============================================================
// SELECTED THEMES INFO
// ============================================================

interface SelectedThemesInfoProps {
  themes: string[];
}

export const SelectedThemesInfo = memo<SelectedThemesInfoProps>(({ themes }) => {
  const goToPreferences = useCallback(() => {
    router.push("/preferences");
  }, []);

  if (themes.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <Card.Content>
        <View className="flex-row items-start">
          <View className="w-10 h-10 rounded-full bg-pink-100 items-center justify-center mr-3">
            <Ionicons name="heart" size={24} color="#EC4899" />
          </View>
          <View className="flex-1">
            <Text className="text-pink-800 font-semibold mb-1">
              Vos thèmes actifs
            </Text>
            <Text className="text-pink-700 text-sm">
              {themes.join(", ")}
            </Text>
            <Pressable onPress={goToPreferences} className="mt-2">
              <Text className="text-pink-500 text-sm underline">
                Modifier mes préférences →
              </Text>
            </Pressable>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
});

SelectedThemesInfo.displayName = "SelectedThemesInfo";

// ============================================================
// SESSION SUMMARY
// ============================================================

interface SessionSummaryProps {
  challengeCountPerPlayer: number;
  totalChallenges: number;
  levelEmoji: string;
  levelName: string;
  isPremium: boolean;
  formattedDuration: string;
}

export const SessionSummary = memo<SessionSummaryProps>(({
  challengeCountPerPlayer,
  totalChallenges,
  levelEmoji,
  levelName,
  isPremium,
  formattedDuration,
}) => {
  return (
    <Card className="mb-6">
      <Card.Content>
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          📋 Résumé
        </Text>

        <View className="space-y-2">
          <SummaryRow 
            label="Défis par joueur" 
            value={`${challengeCountPerPlayer} chacun`} 
          />
          <SummaryRow 
            label="Total de défis" 
            value={`${totalChallenges} défis`}
            highlight
          />
          <SummaryRow 
            label="Intensité de départ" 
            value={`${levelEmoji} ${levelName}`} 
          />
          <SummaryRow 
            label="Changements de défi" 
            value={isPremium ? "Illimités 👑" : `${MAX_CHALLENGE_CHANGES} par joueur`} 
          />
          <SummaryRow 
            label="Durée estimée" 
            value={formattedDuration}
            noBorder
          />
        </View>
      </Card.Content>
    </Card>
  );
});

SessionSummary.displayName = "SessionSummary";

// Sous-composant pour les lignes du résumé
interface SummaryRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  noBorder?: boolean;
}

const SummaryRow = memo<SummaryRowProps>(({ label, value, highlight, noBorder }) => {
  return (
    <View className={`flex-row justify-between py-2 ${noBorder ? "" : "border-b border-gray-100"}`}>
      <Text className="text-gray-600">{label}</Text>
      <Text className={`font-medium ${highlight ? "text-pink-600" : "text-gray-800"}`}>
        {value}
      </Text>
    </View>
  );
});

SummaryRow.displayName = "SummaryRow";

// ============================================================
// AD WARNING (pour utilisateurs gratuits)
// ============================================================

interface AdWarningProps {
  visible: boolean;
}

export const AdWarning = memo<AdWarningProps>(({ visible }) => {
  if (!visible) return null;

  return (
    <View className="mb-6">
      <View className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <View className="flex-row items-center">
          <Ionicons name="megaphone-outline" size={24} color="#D97706" />
          <View className="ml-3 flex-1">
            <Text className="text-amber-800 font-medium">
              Une publicité sera affichée
            </Text>
            <Text className="text-amber-600 text-sm mt-0.5">
              Passez Premium pour une expérience sans pub !
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

AdWarning.displayName = "AdWarning";
