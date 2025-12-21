/**
 * Écran de création de session
 *
 * Permet de configurer :
 * - Niveau d'intensité de départ (1-4)
 * - Nombre de défis (5-50)
 *
 * Affiche un résumé avant création.
 *
 * GAME-MECHANICS:
 * - Gratuit : niveaux 1-2, max 15 défis
 * - Premium : niveaux 1-4, max 50 défis
 * - TODO: Pub interstitielle pour utilisateurs gratuits avant création
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
import {
  IntensityLevel,
  INTENSITY_LEVELS,
  MAX_CHALLENGE_CHANGES,
} from "../../types";

// ============================================================
// CONSTANTES
// ============================================================

/** Options de nombre de défis selon le statut premium */
const CHALLENGE_COUNT_OPTIONS = {
  free: [5, 10, 15],
  premium: [5, 10, 15, 20, 30, 40, 50],
};

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
        <Text
          className={`text-sm ${isLocked ? "text-gray-400" : "text-gray-500"}`}
        >
          {description}
        </Text>
      </View>

      {/* Indicateur de sélection */}
      {isSelected && !isLocked && (
        <Ionicons name="checkmark-circle" size={24} color={colors.icon} />
      )}
    </Pressable>
  );
}

interface ChallengeCountOptionProps {
  count: number;
  isSelected: boolean;
  isPremiumOption: boolean;
  isLocked: boolean;
  onSelect: () => void;
}

/**
 * Option de nombre de défis
 */
function ChallengeCountOption({
  count,
  isSelected,
  isPremiumOption,
  isLocked,
  onSelect,
}: ChallengeCountOptionProps) {
  return (
    <Pressable
      onPress={isLocked ? undefined : onSelect}
      className={`
        px-5 py-3 rounded-xl mr-3 border-2 relative
        ${isSelected ? "bg-pink-500 border-pink-500" : "bg-white border-gray-200"}
        ${isLocked ? "opacity-60" : ""}
      `}
    >
      <Text
        className={`
          text-lg font-bold
          ${isSelected ? "text-white" : isLocked ? "text-gray-400" : "text-gray-700"}
        `}
      >
        {count}
      </Text>
      {isPremiumOption && isLocked && (
        <View className="absolute -top-1 -right-1">
          <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
        </View>
      )}
    </Pressable>
  );
}

interface RulesInfoProps {
  isPremium: boolean;
}

/**
 * Section d'information sur les règles
 */
function RulesInfo({ isPremium }: RulesInfoProps) {
  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <Card.Content className="py-4">
        <View className="flex-row items-start">
          <Ionicons
            name="information-circle"
            size={24}
            color="#3B82F6"
            style={{ marginRight: 12, marginTop: 2 }}
          />
          <View className="flex-1">
            <Text className="text-blue-800 font-semibold mb-1">
              Comment ça marche ?
            </Text>
            <Text className="text-blue-700 text-sm leading-5">
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

  /** Options de défis disponibles (premium = plus d'options) */
  const availableCounts = CHALLENGE_COUNT_OPTIONS.premium; // Afficher toutes les options
  const maxFreeCount = Math.max(...CHALLENGE_COUNT_OPTIONS.free);

  /** Durée estimée en minutes */
  const estimatedDuration = useMemo(() => {
    return selectedChallengeCount * MINUTES_PER_CHALLENGE;
  }, [selectedChallengeCount]);

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

  /** Vérifie si la configuration actuelle est valide */
  const isConfigValid = useMemo(() => {
    // Vérifier le niveau d'intensité
    const levelInfo = INTENSITY_LEVELS.find((l) => l.level === selectedIntensity);
    if (levelInfo?.isPremium && !isPremium) return false;

    // Vérifier le nombre de défis
    if (selectedChallengeCount > maxFreeCount && !isPremium) return false;

    return true;
  }, [selectedIntensity, selectedChallengeCount, isPremium, maxFreeCount]);

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
   * Sélectionne un nombre de défis
   */
  const handleSelectChallengeCount = (count: number) => {
    // Si le count est premium et l'utilisateur non premium
    if (count > maxFreeCount && !isPremium) {
      Alert.alert(
        "Option Premium 👑",
        `Les parties de plus de ${maxFreeCount} défis sont réservées aux membres Premium.`,
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
      // TODO: Afficher une pub interstitielle pour les utilisateurs gratuits
      // if (!isPremium) {
      //   await showInterstitialAd();
      // }

      // Générer les défis
      // Note: On utilise le genre opposé par défaut car on ne connaît pas encore le partenaire
      // Les défis pour le partenaire seront du bon genre car selectChallenges prend les deux genres
      const partnerGender = userData.gender === "homme" ? "femme" : "homme";

      const challenges = selectChallenges(
        userData.gender,
        partnerGender,
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

        {/* Info sur les règles */}
        <RulesInfo isPremium={isPremium} />

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
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            🎯 Nombre de défis
          </Text>
          <Text className="text-gray-500 mb-4">
            {isPremium
              ? "Choisissez jusqu'à 50 défis par partie."
              : `Jusqu'à ${maxFreeCount} défis en version gratuite.`}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="pb-2"
          >
            {availableCounts.map((count) => {
              const isPremiumOption = count > maxFreeCount;
              const isLocked = isPremiumOption && !isPremium;

              return (
                <ChallengeCountOption
                  key={count}
                  count={count}
                  isSelected={selectedChallengeCount === count}
                  isPremiumOption={isPremiumOption}
                  isLocked={isLocked}
                  onSelect={() => handleSelectChallengeCount(count)}
                />
              );
            })}
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
              <Text className="text-gray-600">Nombre de défis</Text>
              <Text className="font-semibold text-gray-800">
                {selectedChallengeCount} ({Math.ceil(selectedChallengeCount / 2)} chacun)
              </Text>
            </View>

            {/* Intensité */}
            <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
              <Text className="text-gray-600">Intensité de départ</Text>
              <View className="flex-row items-center">
                <Text className="mr-1">{selectedLevelInfo?.emoji}</Text>
                <Text className="font-semibold text-gray-800">
                  {selectedLevelInfo?.name}
                </Text>
              </View>
            </View>

            {/* Changements */}
            <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
              <Text className="text-gray-600">Changements de défi</Text>
              <Text className="font-semibold text-gray-800">
                {MAX_CHALLENGE_CHANGES} par joueur
              </Text>
            </View>

            {/* Durée */}
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-gray-600">Durée estimée</Text>
              <Text className="font-semibold text-gray-800">
                {formattedDuration}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Message pour utilisateurs gratuits */}
        {!isPremium && (
          <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Text className="text-xl mr-2">💡</Text>
              <View className="flex-1">
                <Text className="text-amber-800 font-medium mb-1">
                  Version gratuite
                </Text>
                <Text className="text-amber-700 text-sm">
                  Une courte publicité sera affichée avant le début de la partie.
                  Passez Premium pour une expérience sans pub !
                </Text>
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