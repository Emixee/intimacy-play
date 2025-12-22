/**
 * Écran de jeu principal
 *
 * Affiche le défi actuel et gère la progression de la partie.
 * Utilise useSession pour le temps réel et les actions.
 *
 * LOGIQUE (FIX BUG couples même genre) :
 * - isChallengeForMe : Basé sur forPlayer (rôle) → j'envoie la preuve
 * - isMyTurn : C'est mon tour de VALIDER → je valide après réception de la preuve
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  Button,
  Card,
  LevelBadge,
  ChallengeTypeBadge,
  LoadingScreen,
} from "../../components/ui";
import { useSession } from "../../hooks/useSession";
import { useAuth } from "../../hooks/useAuth";
import {
  CHALLENGES_N1_HOMME,
  CHALLENGES_N1_FEMME,
  CHALLENGES_N2_HOMME,
  CHALLENGES_N2_FEMME,
  CHALLENGES_N3_HOMME,
  CHALLENGES_N3_FEMME,
  CHALLENGES_N4_HOMME,
  CHALLENGES_N4_FEMME,
  ChallengeData,
} from "../../data/challenges";
import {
  SessionChallenge,
  ChallengeType,
  IntensityLevel,
  Gender,
  PlayerRole,
  INTENSITY_LEVELS,
} from "../../types";

// ============================================================
// TYPES LOCAUX
// ============================================================

interface AlternativeChallenge {
  id: string;
  challenge: SessionChallenge;
}

// ============================================================
// MAP DES DÉFIS PAR NIVEAU ET GENRE
// ============================================================

const CHALLENGES_MAP: Record<string, ChallengeData[]> = {
  "1_HOMME": CHALLENGES_N1_HOMME,
  "1_FEMME": CHALLENGES_N1_FEMME,
  "2_HOMME": CHALLENGES_N2_HOMME,
  "2_FEMME": CHALLENGES_N2_FEMME,
  "3_HOMME": CHALLENGES_N3_HOMME,
  "3_FEMME": CHALLENGES_N3_FEMME,
  "4_HOMME": CHALLENGES_N4_HOMME,
  "4_FEMME": CHALLENGES_N4_FEMME,
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Retourne l'icône emoji selon le type de défi
 */
const getChallengeTypeEmoji = (type: ChallengeType): string => {
  const emojis: Record<ChallengeType, string> = {
    audio: "🎤",
    video: "🎬",
    photo: "📸",
    texte: "✍️",
  };
  return emojis[type] || "🎯";
};

/**
 * Mélange un tableau (Fisher-Yates)
 */
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Génère des défis alternatifs RÉELS depuis la base de données
 *
 * FIX BUG COUPLES MÊME GENRE :
 * Préserve forPlayer du défi original pour que le nouveau défi
 * soit toujours attribué au même joueur (même rôle)
 */
const generateAlternatives = (
  currentChallenge: SessionChallenge,
  usedTexts: string[],
  count: number = 2
): AlternativeChallenge[] => {
  // Vérification de sécurité des propriétés requises
  if (!currentChallenge) {
    console.warn("[generateAlternatives] currentChallenge is undefined");
    return [];
  }

  const { level, forGender, forPlayer } = currentChallenge;

  // Vérifier que forGender existe et est valide
  if (!forGender || (forGender !== "homme" && forGender !== "femme")) {
    console.warn("[generateAlternatives] forGender is invalid:", forGender);
    return [];
  }

  // Vérifier que level existe et est valide
  if (!level || level < 1 || level > 4) {
    console.warn("[generateAlternatives] level is invalid:", level);
    return [];
  }

  // Construire la clé pour accéder aux défis
  const genderKey = forGender.toUpperCase() as "HOMME" | "FEMME";
  const mapKey = `${level}_${genderKey}`;

  // Récupérer le tableau de défis correspondant
  const challengeArray = CHALLENGES_MAP[mapKey];

  if (!challengeArray || !Array.isArray(challengeArray)) {
    console.warn(`[generateAlternatives] No challenges found for ${mapKey}`);
    return [];
  }

  // Filtrer les défis déjà utilisés (y compris le défi actuel)
  const allUsedTexts = [...(usedTexts || []), currentChallenge.text];
  const availableChallenges = challengeArray.filter(
    (c: ChallengeData) => !allUsedTexts.includes(c.text)
  );

  // Mélanger et prendre le nombre demandé
  const shuffled = shuffleArray(availableChallenges);
  const selected = shuffled.slice(0, count);

  // Convertir en SessionChallenge
  // FIX: Préserver forPlayer du défi original !
  return selected.map((c: ChallengeData, index: number) => ({
    id: `alt-${index}-${Date.now()}`,
    challenge: {
      text: c.text,
      level,
      type: c.type,
      forGender,
      forPlayer, // FIX BUG: Préserver le rôle du joueur !
      completed: false,
      completedBy: null,
      completedAt: null,
    },
  }));
};

// ============================================================
// COMPOSANTS INTERNES
// ============================================================

/**
 * Header du jeu avec progression
 */
function GameHeader({
  currentIndex,
  totalCount,
  currentLevel,
  onQuit,
}: {
  currentIndex: number;
  totalCount: number;
  currentLevel: IntensityLevel;
  onQuit: () => void;
}) {
  const progressPercent = Math.round((currentIndex / totalCount) * 100);

  return (
    <View className="px-5 pt-4 pb-2">
      {/* Ligne supérieure */}
      <View className="flex-row items-center justify-between mb-4">
        {/* Bouton quitter */}
        <Pressable
          onPress={onQuit}
          className="w-10 h-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>

        {/* Compteur de défis */}
        <View className="flex-row items-center">
          <Text className="text-gray-600 font-medium">Défi </Text>
          <Text className="text-pink-500 font-bold text-lg">
            {currentIndex + 1}
          </Text>
          <Text className="text-gray-600 font-medium"> / {totalCount}</Text>
        </View>

        {/* Badge niveau */}
        <LevelBadge level={currentLevel} showLabel={false} size="md" />
      </View>

      {/* Barre de progression */}
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full bg-pink-500 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </View>
    </View>
  );
}

/**
 * Indicateur de tour amélioré
 * Distingue clairement : faire le défi vs valider le défi
 */
function TurnIndicator({
  isChallengeForMe,
  isMyTurn,
  partnerName,
}: {
  isChallengeForMe: boolean;
  isMyTurn: boolean;
  partnerName: string;
}) {
  // Cas 1 : Le défi est pour MOI → J'envoie la preuve
  if (isChallengeForMe) {
    return (
      <View className="flex-row items-center justify-center bg-pink-100 py-3 px-4 rounded-xl mb-4">
        <Ionicons name="flash" size={20} color="#EC4899" />
        <Text className="text-pink-700 font-semibold ml-2">
          C'est ton défi ! Envoie la preuve à {partnerName}
        </Text>
      </View>
    );
  }

  // Cas 2 : Le défi est pour le partenaire, c'est MOI qui valide
  if (isMyTurn) {
    return (
      <View className="flex-row items-center justify-center bg-green-100 py-3 px-4 rounded-xl mb-4">
        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        <Text className="text-green-700 font-semibold ml-2">
          Valide quand {partnerName} a accompli le défi !
        </Text>
      </View>
    );
  }

  // Cas 3 : Le défi n'est pas pour moi et ce n'est pas mon tour de valider
  return (
    <View className="flex-row items-center justify-center bg-amber-100 py-3 px-4 rounded-xl mb-4">
      <Ionicons name="time-outline" size={20} color="#F59E0B" />
      <Text className="text-amber-700 font-semibold ml-2">
        En attente de {partnerName}...
      </Text>
    </View>
  );
}

/**
 * Carte du défi actuel
 */
function ChallengeCard({
  challenge,
  isChallengeForMe,
}: {
  challenge: SessionChallenge;
  isChallengeForMe: boolean;
}) {
  const typeEmoji = getChallengeTypeEmoji(challenge.type);

  return (
    <Card
      variant="elevated"
      className={`mb-6 ${!isChallengeForMe ? "opacity-80" : ""}`}
    >
      <Card.Content className="py-6">
        {/* Icône type */}
        <View className="items-center mb-4">
          <View className="w-16 h-16 rounded-full bg-pink-100 items-center justify-center">
            <Text className="text-3xl">{typeEmoji}</Text>
          </View>
        </View>

        {/* Badges */}
        <View className="flex-row justify-center gap-2 mb-4">
          <LevelBadge level={challenge.level} size="sm" />
          <ChallengeTypeBadge type={challenge.type} size="sm" />
        </View>

        {/* Texte du défi */}
        <Text className="text-gray-800 text-lg text-center leading-7 px-2">
          {challenge.text}
        </Text>

        {/* Indicateur pour qui */}
        <View className="items-center mt-4">
          <View
            className={`px-3 py-1 rounded-full ${
              isChallengeForMe ? "bg-pink-100" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                isChallengeForMe ? "text-pink-600" : "text-gray-500"
              }`}
            >
              {isChallengeForMe
                ? "🎯 Pour toi"
                : `👤 Pour ${challenge.forGender === "homme" ? "lui" : "elle"}`}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

/**
 * Boutons d'action
 */
function ActionButtons({
  isChallengeForMe,
  isMyTurn,
  isLoading,
  changesRemaining,
  onComplete,
  onSkip,
}: {
  isChallengeForMe: boolean;
  isMyTurn: boolean;
  isLoading: boolean;
  changesRemaining: number;
  onComplete: () => void;
  onSkip: () => void;
}) {
  // Le bouton principal est actif uniquement si c'est mon tour de VALIDER
  const canValidate = isMyTurn && !isChallengeForMe;

  // Le bouton de changement est actif si le défi est pour moi et j'ai des changements
  const canChange = isChallengeForMe && changesRemaining > 0;

  return (
    <View className="gap-3">
      {/* Bouton principal */}
      <Button
        title={
          isChallengeForMe
            ? "En attente de validation..."
            : "Défi accompli ✓"
        }
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canValidate || isLoading}
        loading={isLoading}
        onPress={onComplete}
      />

      {/* Bouton secondaire - Changer de défi */}
      {isChallengeForMe && (
        <Button
          title={`Changer de défi (${changesRemaining} restant${changesRemaining > 1 ? "s" : ""})`}
          variant="outline"
          size="md"
          fullWidth
          disabled={!canChange || isLoading}
          onPress={onSkip}
          icon={
            <Ionicons
              name="shuffle-outline"
              size={20}
              color={canChange ? "#EC4899" : "#9CA3AF"}
            />
          }
        />
      )}
    </View>
  );
}

/**
 * Modal de sélection d'alternatives
 */
function AlternativesModal({
  visible,
  alternatives,
  onSelect,
  onClose,
}: {
  visible: boolean;
  alternatives: AlternativeChallenge[];
  onSelect: (challenge: SessionChallenge) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl">
          <SafeAreaView edges={["bottom"]}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-800">
                Choisir un autre défi
              </Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={20} color="#374151" />
              </Pressable>
            </View>

            {/* Liste des alternatives */}
            <ScrollView className="max-h-96 px-5 py-4">
              {alternatives.length === 0 ? (
                <View className="items-center py-8">
                  <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color="#9CA3AF"
                  />
                  <Text className="text-gray-500 mt-2 text-center">
                    Aucune alternative disponible pour ce niveau.
                  </Text>
                </View>
              ) : (
                alternatives.map((alt) => (
                  <Pressable
                    key={alt.id}
                    onPress={() => onSelect(alt.challenge)}
                    className="bg-pink-50 rounded-xl p-4 mb-3 active:bg-pink-100"
                  >
                    <View className="flex-row items-start">
                      <Text className="text-2xl mr-3">
                        {getChallengeTypeEmoji(alt.challenge.type)}
                      </Text>
                      <View className="flex-1">
                        <View className="flex-row gap-2 mb-2">
                          <LevelBadge
                            level={alt.challenge.level}
                            size="sm"
                            showLabel={false}
                          />
                          <ChallengeTypeBadge
                            type={alt.challenge.type}
                            size="sm"
                          />
                        </View>
                        <Text className="text-gray-700 leading-5">
                          {alt.challenge.text}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>

            {/* Bouton annuler */}
            <View className="px-5 pb-4">
              <Button
                title="Annuler"
                variant="ghost"
                fullWidth
                onPress={onClose}
              />
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Écran de fin de partie
 */
function GameOverScreen({
  completedCount,
  totalCount,
  onPlayAgain,
  onGoHome,
}: {
  completedCount: number;
  totalCount: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}) {
  // Message selon le taux de complétion
  const completionRate = completedCount / totalCount;
  let message = "";
  let emoji = "🎉";

  if (completionRate === 1) {
    message = "Parfait ! Vous avez relevé tous les défis !";
    emoji = "🏆";
  } else if (completionRate >= 0.8) {
    message = "Excellent ! Quelle complicité !";
    emoji = "🔥";
  } else if (completionRate >= 0.5) {
    message = "Beau début ! À quand la revanche ?";
    emoji = "💕";
  } else {
    message = "L'important c'est de s'amuser !";
    emoji = "😊";
  }

  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <View className="flex-1 px-6 justify-center">
        {/* Icône de célébration */}
        <View className="items-center mb-8">
          <Text className="text-7xl">{emoji}</Text>
        </View>

        {/* Titre */}
        <Text className="text-3xl font-bold text-gray-800 text-center mb-2">
          Félicitations !
        </Text>
        <Text className="text-gray-500 text-center text-lg mb-8">
          {message}
        </Text>

        {/* Stats */}
        <Card variant="elevated" className="mb-8">
          <Card.Content className="py-6">
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-4xl font-bold text-pink-500">
                  {completedCount}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Défis accomplis
                </Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="items-center">
                <Text className="text-4xl font-bold text-gray-400">
                  {totalCount - completedCount}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Défis passés
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Message romantique */}
        <View className="bg-pink-100 rounded-xl p-4 mb-8">
          <Text className="text-pink-700 text-center italic">
            "La distance n'est qu'un test pour voir jusqu'où l'amour peut
            voyager" 💕
          </Text>
        </View>

        {/* Boutons */}
        <View className="gap-3">
          <Button
            title="Nouvelle partie"
            variant="primary"
            size="lg"
            fullWidth
            onPress={onPlayAgain}
          />
          <Button
            title="Retour à l'accueil"
            variant="outline"
            size="md"
            fullWidth
            onPress={onGoHome}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * Écran d'erreur
 */
function ErrorScreen({
  message,
  onRetry,
  onGoHome,
}: {
  message: string;
  onRetry?: () => void;
  onGoHome: () => void;
}) {
  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <View className="flex-1 px-6 justify-center items-center">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-xl font-bold text-gray-800 mt-4">Oups !</Text>
        <Text className="text-gray-500 text-center mt-2">{message}</Text>
        <View className="mt-6 gap-3 w-full">
          {onRetry && (
            <Button
              title="Réessayer"
              variant="primary"
              fullWidth
              onPress={onRetry}
            />
          )}
          <Button
            title="Retour à l'accueil"
            variant="outline"
            fullWidth
            onPress={onGoHome}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function GameScreen() {
  // ----------------------------------------------------------
  // PARAMS & HOOKS
  // ----------------------------------------------------------

  const { code } = useLocalSearchParams<{ code: string }>();
  const { userData } = useAuth();

  const {
    session,
    isLoading,
    error,
    isMyTurn,
    isChallengeForMe,
    myRole,
    currentChallenge,
    progress,
    completedCount,
    changesRemaining,
    isSessionCompleted,
    isSessionAbandoned,
    completeChallenge,
    skipChallenge,
    abandonSession,
    refreshSession,
  } = useSession({
    sessionCode: code || null,
    userId: userData?.id || null,
  });

  // ----------------------------------------------------------
  // STATE LOCAL
  // ----------------------------------------------------------

  const [isCompleting, setIsCompleting] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<AlternativeChallenge[]>([]);

  // ----------------------------------------------------------
  // COMPUTED VALUES
  // ----------------------------------------------------------

  /**
   * Nom du partenaire
   */
  const partnerName = useMemo(() => {
    if (!session) return "partenaire";
    // TODO: Récupérer le vrai nom depuis Firestore
    return myRole === "creator" ? "ton/ta partenaire" : "ton/ta partenaire";
  }, [session, myRole]);

  /**
   * Niveau actuel du défi
   */
  const currentLevel = currentChallenge?.level || 1;

  /**
   * Liste des textes déjà utilisés dans la session
   */
  const usedChallengeTexts = useMemo(() => {
    if (!session) return [];
    return session.challenges.map((c) => c.text);
  }, [session]);

  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------

  /**
   * Complète le défi actuel
   */
  const handleComplete = useCallback(async () => {
    setIsCompleting(true);

    const result = await completeChallenge();

    if (!result.success) {
      Alert.alert("Erreur", result.error || "Impossible de valider le défi.");
    }

    setIsCompleting(false);
  }, [completeChallenge]);

  /**
   * Ouvre la modal de changement de défi
   */
  const handleOpenAlternatives = useCallback(() => {
    if (!currentChallenge) {
      console.warn("[handleOpenAlternatives] No current challenge");
      return;
    }

    // Générer des alternatives depuis la vraie base de données
    const alts = generateAlternatives(currentChallenge, usedChallengeTexts, 2);
    setAlternatives(alts);
    setShowAlternatives(true);
  }, [currentChallenge, usedChallengeTexts]);

  /**
   * Sélectionne un défi alternatif
   */
  const handleSelectAlternative = useCallback(
    async (challenge: SessionChallenge) => {
      setShowAlternatives(false);

      const result = await skipChallenge(challenge);

      if (!result.success) {
        Alert.alert(
          "Erreur",
          result.error || "Impossible de changer le défi."
        );
      }
    },
    [skipChallenge]
  );

  /**
   * Quitte la partie
   */
  const handleQuit = useCallback(() => {
    Alert.alert(
      "Quitter la partie ?",
      "Voulez-vous vraiment abandonner cette partie ? Votre partenaire sera notifié.",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, quitter",
          style: "destructive",
          onPress: async () => {
            await abandonSession();
            router.replace("/(main)");
          },
        },
      ]
    );
  }, [abandonSession]);

  /**
   * Nouvelle partie
   */
  const handlePlayAgain = useCallback(() => {
    router.replace("/(main)/create-session");
  }, []);

  /**
   * Retour à l'accueil
   */
  const handleGoHome = useCallback(() => {
    router.replace("/(main)");
  }, []);

  // ----------------------------------------------------------
  // RENDER : LOADING
  // ----------------------------------------------------------

  if (isLoading) {
    return <LoadingScreen message="Chargement de la partie..." />;
  }

  // ----------------------------------------------------------
  // RENDER : ERREUR
  // ----------------------------------------------------------

  if (error || !code) {
    return (
      <ErrorScreen
        message={error || "Code de session manquant."}
        onRetry={error ? refreshSession : undefined}
        onGoHome={handleGoHome}
      />
    );
  }

  // ----------------------------------------------------------
  // RENDER : SESSION ABANDONNÉE
  // ----------------------------------------------------------

  if (isSessionAbandoned) {
    return (
      <ErrorScreen
        message="Cette partie a été abandonnée."
        onGoHome={handleGoHome}
      />
    );
  }

  // ----------------------------------------------------------
  // RENDER : GAME OVER
  // ----------------------------------------------------------

  if (isSessionCompleted || !currentChallenge) {
    return (
      <GameOverScreen
        completedCount={completedCount}
        totalCount={session?.challengeCount || 0}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
      />
    );
  }

  // ----------------------------------------------------------
  // RENDER : JEU EN COURS
  // ----------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-pink-50" edges={["top"]}>
      {/* Header */}
      <GameHeader
        currentIndex={session?.currentChallengeIndex || 0}
        totalCount={session?.challengeCount || 0}
        currentLevel={currentLevel as IntensityLevel}
        onQuit={handleQuit}
      />

      {/* Contenu principal */}
      <View className="flex-1 px-5 pt-4">
        {/* Indicateur de tour amélioré */}
        <TurnIndicator
          isChallengeForMe={isChallengeForMe}
          isMyTurn={isMyTurn}
          partnerName={partnerName}
        />

        {/* Carte du défi */}
        <ChallengeCard
          challenge={currentChallenge}
          isChallengeForMe={isChallengeForMe}
        />

        {/* Spacer */}
        <View className="flex-1" />

        {/* Boutons d'action */}
        <ActionButtons
          isChallengeForMe={isChallengeForMe}
          isMyTurn={isMyTurn}
          isLoading={isCompleting}
          changesRemaining={changesRemaining}
          onComplete={handleComplete}
          onSkip={handleOpenAlternatives}
        />

        {/* Espacement bas */}
        <SafeAreaView edges={["bottom"]}>
          <View className="h-4" />
        </SafeAreaView>
      </View>

      {/* Modal alternatives */}
      <AlternativesModal
        visible={showAlternatives}
        alternatives={alternatives}
        onSelect={handleSelectAlternative}
        onClose={() => setShowAlternatives(false)}
      />
    </SafeAreaView>
  );
}