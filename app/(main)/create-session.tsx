/**
 * Écran de création de session
 *
 * PROMPT 1.3-v3 : Préférences séparées par joueur
 * - Le créateur utilise SES préférences (user.preferences)
 * - Le partenaire aura ses défis régénérés quand il rejoint
 *
 * Permet de configurer :
 * - Niveau d'intensité de départ (1-4)
 * - Nombre de défis PAR JOUEUR (5-50)
 *
 * MODIFICATION :
 * - Le nombre de défis sélectionné = défis PAR JOUEUR
 * - Total de défis = count * 2 (un pour chaque joueur)
 * - Durée estimée basée sur le total réel
 *
 * GAME-MECHANICS:
 * - Gratuit : niveaux 1-3, max 15 défis par joueur (INCLUS)
 * - Premium : niveau 4, max 50 défis par joueur
 * 
 * FIX: 15 défis est maintenant correctement gratuit
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
import { 
  selectChallenges, 
  SelectionConfig,
  PlayerPreferences,
  DEFAULT_PLAYER_PREFERENCES,
} from "../../utils/challengeSelector";
import {
  IntensityLevel,
  INTENSITY_LEVELS,
  MAX_CHALLENGE_CHANGES,
  CHALLENGE_COUNT_FREE,
  CHALLENGE_COUNT_PREMIUM,
} from "../../types";

// ============================================================
// CONSTANTES
// ============================================================

/** 
 * Options de nombre de défis PAR JOUEUR
 * Utilise les constantes de types/index.ts pour cohérence
 */
const CHALLENGE_COUNT_OPTIONS = {
  // Options gratuites : 5, 10, 15 (15 = max gratuit INCLUS)
  free: [5, 10, CHALLENGE_COUNT_FREE.max],
  // Options premium : toutes les options jusqu'à 50
  premium: [5, 10, 15, 20, 25, 30, 40, CHALLENGE_COUNT_PREMIUM.max],
};

/** 
 * Maximum de défis gratuits PAR JOUEUR
 * FIX: 15 est INCLUS dans les options gratuites
 */
const MAX_FREE_CHALLENGE_COUNT = CHALLENGE_COUNT_FREE.max; // 15

/** Minutes estimées par défi */
const MINUTES_PER_CHALLENGE = 2;

/** Couleurs des niveaux d'intensité */
interface LevelColorConfig {
  bg: string;
  text: string;
  border: string;
  icon: string;
}

const LEVEL_COLORS: Record<IntensityLevel, LevelColorConfig> = {
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
      {/* Emoji */}
      <View className="w-12 h-12 rounded-full bg-white items-center justify-center mr-3">
        <Text className="text-2xl">{emoji}</Text>
      </View>

      {/* Texte */}
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

      {/* Indicateur sélection ou lock */}
      {isLocked ? (
        <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
      ) : isSelected ? (
        <View className={`w-6 h-6 rounded-full items-center justify-center ${colors.bg}`}>
          <Ionicons name="checkmark" size={16} color={colors.icon} />
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Sélecteur de nombre de défis PAR JOUEUR
 * 
 * FIX: La logique de verrouillage utilise maintenant > (strictement supérieur)
 * Donc 15 n'est PAS verrouillé car 15 > 15 = false
 */
function ChallengeCountSelector({
  counts,
  selected,
  maxFree,
  isPremium,
  onSelect,
}: {
  counts: number[];
  selected: number;
  maxFree: number;
  isPremium: boolean;
  onSelect: (count: number) => void;
}) {
  return (
    <View className="flex-row flex-wrap">
      {counts.map((count) => {
        const isSelected = count === selected;
        // FIX: > (strictement supérieur) signifie que maxFree (15) est INCLUS dans gratuit
        // 15 > 15 = false, donc 15 n'est pas verrouillé
        // 20 > 15 = true, donc 20 est verrouillé pour les non-premium
        const isLocked = count > maxFree && !isPremium;

        return (
          <Pressable
            key={count}
            onPress={() => !isLocked && onSelect(count)}
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
      })}
    </View>
  );
}

/**
 * Carte d'info sur les règles
 */
function RulesInfo({ isPremium }: { isPremium: boolean }) {
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
}

/**
 * Affiche les thèmes sélectionnés du créateur
 */
function SelectedThemesInfo({ themes }: { themes: string[] }) {
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
            <Pressable 
              onPress={() => router.push("/preferences")}
              className="mt-2"
            >
              <Text className="text-pink-500 text-sm underline">
                Modifier mes préférences →
              </Text>
            </Pressable>
          </View>
        </View>
      </Card.Content>
    </Card>
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

  /** Options de défis disponibles (affiche toutes les options, verrouille les premium) */
  const availableCounts = CHALLENGE_COUNT_OPTIONS.premium;

  /** 
   * Total de défis dans la partie 
   * = défis par joueur × 2
   */
  const totalChallenges = selectedChallengeCount * 2;

  /** 
   * Durée estimée en minutes 
   * Basée sur le TOTAL de défis (count * 2)
   */
  const estimatedDuration = useMemo(() => {
    return totalChallenges * MINUTES_PER_CHALLENGE;
  }, [totalChallenges]);

  /** Formatage de la durée */
  const formattedDuration = useMemo(() => {
    if (estimatedDuration < 60) {
      return `~${estimatedDuration} min`;
    }
    const hours = Math.floor(estimatedDuration / 60);
    const mins = estimatedDuration % 60;
    return mins > 0 ? `~${hours}h ${mins}min` : `~${hours}h`;
  }, [estimatedDuration]);

  /** Info du niveau sélectionné */
  const selectedLevelInfo = useMemo(() => {
    return INTENSITY_LEVELS.find((l) => l.level === selectedIntensity);
  }, [selectedIntensity]);

  /** 
   * Préférences du créateur (depuis son profil)
   * PROMPT 1.3-v3 : Utilise les préférences réelles du créateur
   */
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

  /** Vérifie si la configuration actuelle est valide */
  const isConfigValid = useMemo(() => {
    // Vérifier le niveau d'intensité
    const levelInfo = INTENSITY_LEVELS.find((l) => l.level === selectedIntensity);
    if (levelInfo?.isPremium && !isPremium) return false;

    // Vérifier le nombre de défis
    // FIX: > (strictement supérieur) donc 15 est valide pour gratuit
    if (selectedChallengeCount > MAX_FREE_CHALLENGE_COUNT && !isPremium) return false;

    return true;
  }, [selectedIntensity, selectedChallengeCount, isPremium]);

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
   * Sélectionne un nombre de défis PAR JOUEUR
   * 
   * FIX: Utilise > (strictement supérieur) donc 15 est accepté pour gratuit
   */
  const handleSelectChallengeCount = (count: number) => {
    // Si le count est SUPÉRIEUR au max gratuit et l'utilisateur non premium
    // FIX: count > MAX (pas >=) donc 15 passe pour gratuit
    if (count > MAX_FREE_CHALLENGE_COUNT && !isPremium) {
      Alert.alert(
        "Option Premium 👑",
        `Les parties de plus de ${MAX_FREE_CHALLENGE_COUNT} défis par joueur sont réservées aux membres Premium.`,
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

    setSelectedChallengeCount(count);
  };

  /**
   * Crée la session
   * 
   * PROMPT 1.3-v3 : Utilise les préférences du créateur
   * Les défis du partenaire seront régénérés quand il rejoint
   */
  const handleCreateSession = async () => {
    if (!userData) {
      Alert.alert("Erreur", "Vous devez être connecté pour créer une session.");
      return;
    }

    if (!isConfigValid) {
      Alert.alert(
        "Configuration invalide",
        "Veuillez vérifier vos options ou passer Premium."
      );
      return;
    }

    setIsCreating(true);

    try {
      // Genre du partenaire (par défaut opposé, sera mis à jour quand il rejoint)
      const partnerGender = userData.gender === "homme" ? "femme" : "homme";

      // ============================================================
      // PROMPT 1.3-v3 : Configuration avec préférences séparées
      // ============================================================
      const selectionConfig: SelectionConfig = {
        creatorGender: userData.gender,
        partnerGender: partnerGender,
        count: totalChallenges, // Total de défis (count * 2)
        startIntensity: selectedIntensity,
        isPremium: isPremium,
        // Préférences du créateur (depuis son profil)
        creatorPreferences: creatorPreferences,
        // Préférences par défaut pour le partenaire (sera mis à jour quand il rejoint)
        partnerPreferences: DEFAULT_PLAYER_PREFERENCES,
      };

      // Générer les défis avec le nouvel algorithme
      const selectionResult = selectChallenges(selectionConfig);

      // Log des avertissements s'il y en a
      if (selectionResult.warnings.length > 0) {
        console.warn("[CreateSession] Warnings:", selectionResult.warnings);
      }

      // Log des statistiques
      console.log("[CreateSession] Stats:", selectionResult.stats);
      console.log("[CreateSession] Creator themes:", creatorPreferences.selectedThemes);

      // Créer la session avec les défis sélectionnés
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

        {/* Info sur les règles */}
        <RulesInfo isPremium={isPremium} />

        {/* Thèmes sélectionnés du créateur */}
        <SelectedThemesInfo themes={creatorPreferences.selectedThemes} />

        {/* Section Intensité */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            🔥 Intensité de départ
          </Text>
          <Text className="text-gray-500 mb-4">
            Choisissez le niveau de départ. Les défis progresseront naturellement
            vers les niveaux supérieurs.
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
            Chaque joueur aura ce nombre de défis à réaliser.
            {!isPremium && ` (max ${MAX_FREE_CHALLENGE_COUNT} en gratuit)`}
          </Text>

          <ChallengeCountSelector
            counts={availableCounts}
            selected={selectedChallengeCount}
            maxFree={MAX_FREE_CHALLENGE_COUNT}
            isPremium={isPremium}
            onSelect={handleSelectChallengeCount}
          />
        </View>

        {/* Résumé */}
        <Card className="mb-6">
          <Card.Content>
            <Text className="text-lg font-semibold text-gray-800 mb-3">
              📋 Résumé
            </Text>

            <View className="space-y-2">
              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-600">Défis par joueur</Text>
                <Text className="font-medium text-gray-800">
                  {selectedChallengeCount} chacun
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-600">Total de défis</Text>
                <Text className="font-medium text-pink-600">
                  {totalChallenges} défis
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-600">Intensité de départ</Text>
                <Text className="font-medium text-gray-800">
                  {selectedLevelInfo?.emoji} {selectedLevelInfo?.name}
                </Text>
              </View>

              <View className="flex-row justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-600">Changements de défi</Text>
                <Text className="font-medium text-gray-800">
                  {isPremium ? "Illimités 👑" : `${MAX_CHALLENGE_CHANGES} par joueur`}
                </Text>
              </View>

              <View className="flex-row justify-between py-2">
                <Text className="text-gray-600">Durée estimée</Text>
                <Text className="font-medium text-gray-800">{formattedDuration}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Info pub pour gratuits */}
        {!isPremium && (
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
        )}

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

        {/* Espace en bas */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}