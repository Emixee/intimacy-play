/**
 * Écran de création de session - VERSION OPTIMISÉE
 *
 * Refactorisé pour :
 * - Composants extraits vers components/session/
 * - React.memo et useCallback partout
 * - Code réduit de 22KB à ~10KB
 * - Meilleure performance
 */

import React, { useState, useMemo, useCallback } from "react";
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

// Components
import { Button } from "../../components/ui";
import {
  IntensityOption,
  ChallengeCountSelector,
  RulesInfo,
  SelectedThemesInfo,
  SessionSummary,
  AdWarning,
} from "../../components/session";

// Hooks
import { useAuth } from "../../hooks/useAuth";

// Services
import { sessionService } from "../../services/session.service";

// Utils
import {
  selectChallenges,
  SelectionConfig,
  PlayerPreferences,
  DEFAULT_PLAYER_PREFERENCES,
} from "../../utils/challengeSelector";

// Types
import {
  IntensityLevel,
  INTENSITY_LEVELS,
  CHALLENGE_COUNT_FREE,
  CHALLENGE_COUNT_PREMIUM,
} from "../../types";

// ============================================================
// CONSTANTES
// ============================================================

const CHALLENGE_COUNT_OPTIONS = [5, 10, 15, 20, 25, 30, 40, CHALLENGE_COUNT_PREMIUM.max];
const MAX_FREE_CHALLENGE_COUNT = CHALLENGE_COUNT_FREE.max;
const MINUTES_PER_CHALLENGE = 2;

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function CreateSessionScreen() {
  const { userData, isPremium } = useAuth();

  // State
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel>(1);
  const [selectedChallengeCount, setSelectedChallengeCount] = useState<number>(10);
  const [isCreating, setIsCreating] = useState(false);

  // Computed values (mémorisés)
  const totalChallenges = useMemo(() => selectedChallengeCount * 2, [selectedChallengeCount]);

  const estimatedDuration = useMemo(() => {
    return totalChallenges * MINUTES_PER_CHALLENGE;
  }, [totalChallenges]);

  const formattedDuration = useMemo(() => {
    if (estimatedDuration < 60) {
      return `~${estimatedDuration} min`;
    }
    const hours = Math.floor(estimatedDuration / 60);
    const mins = estimatedDuration % 60;
    return mins > 0 ? `~${hours}h ${mins}min` : `~${hours}h`;
  }, [estimatedDuration]);

  const selectedLevelInfo = useMemo(() => {
    return INTENSITY_LEVELS.find((l) => l.level === selectedIntensity);
  }, [selectedIntensity]);

  const creatorPreferences: PlayerPreferences = useMemo(() => {
    if (!userData?.preferences) {
      return DEFAULT_PLAYER_PREFERENCES;
    }
    return {
      selectedThemes: userData.preferences.themes || ["classique"],
      includeToys: (userData.preferences.toys?.length || 0) > 0 && isPremium,
      availableToys: userData.preferences.toys || [],
      mediaPreferences: userData.preferences.mediaPreferences || {
        photo: true,
        audio: true,
        video: true,
      },
    };
  }, [userData?.preferences, isPremium]);

  const isConfigValid = useMemo(() => {
    const levelInfo = INTENSITY_LEVELS.find((l) => l.level === selectedIntensity);
    if (levelInfo?.isPremium && !isPremium) return false;
    if (selectedChallengeCount > MAX_FREE_CHALLENGE_COUNT && !isPremium) return false;
    return true;
  }, [selectedIntensity, selectedChallengeCount, isPremium]);

  // Handlers
  const handleSelectIntensity = useCallback((level: IntensityLevel) => {
    const levelInfo = INTENSITY_LEVELS.find((l) => l.level === level);
    if (levelInfo?.isPremium && !isPremium) {
      Alert.alert(
        "Niveau Premium 👑",
        "Ce niveau d'intensité est réservé aux membres Premium.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Voir Premium", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    setSelectedIntensity(level);
  }, [isPremium]);

  const handleSelectChallengeCount = useCallback((count: number) => {
    if (count > MAX_FREE_CHALLENGE_COUNT && !isPremium) {
      Alert.alert(
        "Option Premium 👑",
        `Les parties de plus de ${MAX_FREE_CHALLENGE_COUNT} défis par joueur sont réservées aux membres Premium.`,
        [
          { text: "Annuler", style: "cancel" },
          { text: "Voir Premium", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    setSelectedChallengeCount(count);
  }, [isPremium]);

  const handleCreateSession = useCallback(async () => {
    if (!userData) {
      Alert.alert("Erreur", "Vous devez être connecté pour créer une session.");
      return;
    }

    if (!isConfigValid) {
      Alert.alert("Configuration invalide", "Veuillez vérifier vos options.");
      return;
    }

    setIsCreating(true);

    try {
      const partnerGender = userData.gender === "homme" ? "femme" : "homme";

      const selectionConfig: SelectionConfig = {
        creatorGender: userData.gender,
        partnerGender: partnerGender,
        count: totalChallenges,
        startIntensity: selectedIntensity,
        isPremium: isPremium,
        creatorPreferences: creatorPreferences,
        partnerPreferences: DEFAULT_PLAYER_PREFERENCES,
      };

      const selectionResult = selectChallenges(selectionConfig);

      if (selectionResult.warnings.length > 0) {
        console.warn("[CreateSession] Warnings:", selectionResult.warnings);
      }

      const result = await sessionService.createSession(
        userData.id,
        userData.gender,
        {
          challengeCount: selectionResult.challenges.length,
          startIntensity: selectedIntensity,
          creatorPreferences: creatorPreferences,
          partnerPreferences: DEFAULT_PLAYER_PREFERENCES,
        },
        selectionResult.challenges,
        isPremium
      );

      if (result.success && result.data) {
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
  }, [userData, isConfigValid, totalChallenges, selectedIntensity, isPremium, creatorPreferences]);

  const goBack = useCallback(() => router.back(), []);

  // Render
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
            onPress={goBack}
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </Pressable>
          <Text className="text-2xl font-bold text-gray-800 ml-4">
            Nouvelle partie
          </Text>
        </View>

        <RulesInfo isPremium={isPremium} />
        <SelectedThemesInfo themes={creatorPreferences.selectedThemes} />

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
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            🎯 Défis par joueur
          </Text>
          <Text className="text-gray-500 mb-4">
            Chaque joueur aura ce nombre de défis.
            {!isPremium && ` (max ${MAX_FREE_CHALLENGE_COUNT} en gratuit)`}
          </Text>

          <ChallengeCountSelector
            counts={CHALLENGE_COUNT_OPTIONS}
            selected={selectedChallengeCount}
            maxFree={MAX_FREE_CHALLENGE_COUNT}
            isPremium={isPremium}
            onSelect={handleSelectChallengeCount}
          />
        </View>

        {/* Résumé */}
        <SessionSummary
          challengeCountPerPlayer={selectedChallengeCount}
          totalChallenges={totalChallenges}
          levelEmoji={selectedLevelInfo?.emoji || "😇"}
          levelName={selectedLevelInfo?.name || "Romantique"}
          isPremium={isPremium}
          formattedDuration={formattedDuration}
        />

        <AdWarning visible={!isPremium} />

        {/* Bouton Créer */}
        <Button
          title={isCreating ? "Création en cours..." : "Créer la session 🚀"}
          onPress={handleCreateSession}
          disabled={isCreating || !isConfigValid}
          fullWidth
          size="lg"
        />

        {isCreating && (
          <View className="flex-row items-center justify-center mt-4">
            <ActivityIndicator size="small" color="#EC4899" />
            <Text className="text-gray-500 ml-2">Génération des défis...</Text>
          </View>
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
