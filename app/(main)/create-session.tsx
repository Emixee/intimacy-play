/**
 * Écran de création de session
 *
 * Permet de configurer :
 * - Niveau d'intensité de départ (1-4)
 * - Nombre de défis (5-50)
 * 
 * Affiche un résumé avant création
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";
import { sessionService } from "../../services/session.service";
import { selectChallenges } from "../../data/challenges";
import { IntensityLevel, INTENSITY_LEVELS } from "../../types";

// ============================================================
// CONSTANTES
// ============================================================

/** Options de nombre de défis */
const CHALLENGE_COUNT_OPTIONS = {
  free: [5, 10, 15],
  premium: [5, 10, 15, 20, 30, 40, 50],
};

/** Minutes estimées par défi */
const MINUTES_PER_CHALLENGE = 2;

/** Couleurs des niveaux */
const LEVEL_COLORS: Record<IntensityLevel, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  2: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  3: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-300" },
  4: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
};

// ============================================================
// COMPOSANTS INTERNES
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

/**
 * Option de niveau d'intensité
 */
function IntensityOption({
  level,
  name,
  emoji,
  description,
  isPremiumLevel,
  isSelected,
  isLocked,
  onSelect,
}: IntensityOptionProps) {
  const colors = LEVEL_COLORS[level];

  return (
    <Pressable
      onPress={isLocked ? undefined : onSelect}
      className={`
        flex-row items-center p-4 rounded-xl mb-3 border-2
        ${isSelected ? colors.bg + " " + colors.border : "bg-white border-gray-200"}
        ${isLocked ? "opacity-60" : ""}
      `}
    >
      {/* Emoji / Lock */}
      <View
        className={`
          w-12 h-12 rounded-full items-center justify-center mr-4
          ${isLocked ? "bg-gray-200" : colors.bg}
        `}
      >
        {isLocked ? (
          <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
        ) : (
          <Text className="text-2xl">{emoji}</Text>
        )}
      </View>

      {/* Texte */}
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text
            className={`
              text-lg font-semibold
              ${isLocked ? "text-gray-400" : isSelected ? colors.text : "text-gray-800"}
            `}
          >
            {name}
          </Text>
          {isPremiumLevel && (
            <View className="ml-2 bg-amber-100 px-2 py-0.5 rounded-full flex-row items-center">
              <Text className="text-amber-600 text-xs font-medium">
                {isLocked ? "🔒" : "👑"} Premium
              </Text>
            </View>
          )}
        </View>
        <Text className={`text-sm ${isLocked ? "text-gray-400" : "text-gray-500"}`}>
          {description}
        </Text>
      </View>

      {/* Indicateur de sélection */}
      {isSelected && !isLocked && (
        <Ionicons name="checkmark-circle" size={24} color={colors.text.replace("text-", "#").replace("-700", "")} />
      )}
    </Pressable>
  );
}

interface ChallengeCountOptionProps {
  count: number;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Option de nombre de défis
 */
function ChallengeCountOption({
  count,
  isSelected,
  onSelect,
}: ChallengeCountOptionProps) {
  return (
    <Pressable
      onPress={onSelect}
      className={`
        px-5 py-3 rounded-xl mr-3 border-2
        ${isSelected ? "bg-pink-500 border-pink-500" : "bg-white border-gray-200"}
      `}
    >
      <Text
        className={`
          text-lg font-bold
          ${isSelected ? "text-white" : "text-gray-700"}
        `}
      >
        {count}
      </Text>
    </Pressable>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function CreateSessionScreen() {
  // ----------------------------------------------------------
  // HOOKS
  // ----------------------------------------------------------

  const { userData, isPremium } = useAuth();

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel>(1);
  const [selectedChallengeCount, setSelectedChallengeCount] = useState<number>(10);
  const [isCreating, setIsCreating] = useState(false);

  // ----------------------------------------------------------
  // COMPUTED
  // ----------------------------------------------------------

  /** Options de défis disponibles */
  const availableCounts = isPremium
    ? CHALLENGE_COUNT_OPTIONS.premium
    : CHALLENGE_COUNT_OPTIONS.free;

  /** Durée estimée en minutes */
  const estimatedDuration = useMemo(() => {
    return selectedChallengeCount * MINUTES_PER_CHALLENGE;
  }, [selectedChallengeCount]);

  /** Info du niveau sélectionné */
  const selectedLevelInfo = useMemo(() => {
    return INTENSITY_LEVELS.find((l) => l.level === selectedIntensity);
  }, [selectedIntensity]);

  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------

  /**
   * Sélectionne un niveau d'intensité
   */
  const handleSelectIntensity = (level: IntensityLevel) => {
    const levelInfo = INTENSITY_LEVELS.find((l) => l.level === level);
    
    // Si le niveau est premium et l'utilisateur non premium
    if (levelInfo?.isPremium && !isPremium) {
      Alert.alert(
        "Niveau Premium 👑",
        "Ce niveau d'intensité est réservé aux membres Premium. Débloquez tous les niveaux et plus de défis !",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Voir Premium",
            onPress: () => router.push("/premium"),
          },
        ]
      );
      return;
    }

    setSelectedIntensity(level);
  };

  /**
   * Crée la session
   */
  const handleCreateSession = async () => {
    if (!userData) {
      Alert.alert("Erreur", "Vous devez être connecté pour créer une session.");
      return;
    }

    setIsCreating(true);

    try {
      // Générer les défis
      // Note: On utilise "femme" comme partenaire par défaut car on ne connaît pas encore le genre du partenaire
      // Les défis seront régénérés quand le partenaire rejoindra
      const challenges = selectChallenges(
        userData.gender,
        userData.gender === "homme" ? "femme" : "homme", // Opposé par défaut
        selectedChallengeCount,
        selectedIntensity,
        isPremium
      );

      // Créer la session
      const result = await sessionService.createSession(
        userData.id,
        userData.gender,
        {
          challengeCount: selectedChallengeCount,
          startIntensity: selectedIntensity,
        },
        challenges
      );

      if (result.success && result.data) {
        // Naviguer vers la waiting room avec le code
        router.replace({
          pathname: "/waiting-room",
          params: { code: result.data },
        });
      } else {
        Alert.alert("Erreur", result.error || "Impossible de créer la session.");
      }
    } catch (error) {
      console.error("[CreateSession] Error:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la création.");
    } finally {
      setIsCreating(false);
    }
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-pink-50" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </Pressable>
          <Text className="text-2xl font-bold text-gray-800 ml-4">
            Nouvelle partie
          </Text>
        </View>

        {/* Section Intensité */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            🔥 Intensité de départ
          </Text>
          <Text className="text-gray-500 mb-4">
            Choisissez le niveau de départ. Les défis progresseront naturellement.
          </Text>

          {INTENSITY_LEVELS.map((level) => (
            <IntensityOption
              key={level.level}
              level={level.level}
              name={level.name}
              emoji={level.emoji}
              description={level.description}
              isPremiumLevel={level.isPremium}
              isSelected={selectedIntensity === level.level}
              isLocked={level.isPremium && !isPremium}
              onSelect={() => handleSelectIntensity(level.level)}
            />
          ))}
        </View>

        {/* Section Nombre de défis */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            🎯 Nombre de défis
          </Text>
          <Text className="text-gray-500 mb-4">
            {isPremium
              ? "Choisissez jusqu'à 50 défis par partie."
              : "Jusqu'à 15 défis en version gratuite."}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="pb-2"
          >
            {availableCounts.map((count) => (
              <ChallengeCountOption
                key={count}
                count={count}
                isSelected={selectedChallengeCount === count}
                onSelect={() => setSelectedChallengeCount(count)}
              />
            ))}
          </ScrollView>

          {!isPremium && (
            <Pressable
              onPress={() => router.push("/premium")}
              className="flex-row items-center mt-3"
            >
              <Text className="text-pink-500 text-sm">
                👑 Débloquer plus de défis avec Premium
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#EC4899" />
            </Pressable>
          )}
        </View>

        {/* Résumé */}
        <Card className="mb-6">
          <Card.Header>
            <Text className="text-lg font-semibold text-gray-800">
              📋 Résumé de la partie
            </Text>
          </Card.Header>
          <Card.Content>
            {/* Défis */}
            <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
              <Text className="text-gray-600">Défis</Text>
              <Text className="font-semibold text-gray-800">
                {selectedChallengeCount}
              </Text>
            </View>

            {/* Intensité */}
            <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
              <Text className="text-gray-600">Intensité</Text>
              <View className="flex-row items-center">
                <Text className="mr-1">{selectedLevelInfo?.emoji}</Text>
                <Text className="font-semibold text-gray-800">
                  {selectedLevelInfo?.name}
                </Text>
              </View>
            </View>

            {/* Durée */}
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-gray-600">Durée estimée</Text>
              <Text className="font-semibold text-gray-800">
                ~{estimatedDuration} min
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Bouton Créer */}
        <Button
          title={isCreating ? "Création..." : "Créer la session 🚀"}
          onPress={handleCreateSession}
          disabled={isCreating}
          fullWidth
          size="lg"
        />

        {isCreating && (
          <View className="flex-row items-center justify-center mt-4">
            <ActivityIndicator size="small" color="#EC4899" />
            <Text className="text-gray-500 ml-2">Génération des défis...</Text>
          </View>
        )}

        {/* Espace en bas */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}