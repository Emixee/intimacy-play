/**
 * Écran de jeu principal
 *
 * Affiche le défi actuel et gère la progression de la partie.
 * Utilise useSession pour le temps réel et les actions.
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
  SessionChallenge,
  ChallengeType,
  IntensityLevel,
  Gender,
} from "../../types";
import challengesData from "../../data/challenges";

// ============================================================
// TYPES LOCAUX
// ============================================================

interface AlternativeChallenge {
  id: string;
  challenge: SessionChallenge;
}

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
 * Génère des défis alternatifs depuis la base de données
 */
const generateAlternatives = (
  currentChallenge: SessionChallenge,
  count: number = 2
): AlternativeChallenge[] => {
  // Récupérer les défis du même niveau et genre
  const levelKey = `CHALLENGES_N${currentChallenge.level}_${currentChallenge.forGender === "homme" ? "HOMME" : "FEMME"}` as keyof typeof challengesData;
  
  const availableChallenges = challengesData[levelKey] as Array<{
    text: string;
    type: ChallengeType;
    theme: string;
  }>;

  if (!availableChallenges || availableChallenges.length === 0) {
    return [];
  }

  // Filtrer pour exclure le défi actuel
  const filtered = availableChallenges.filter(
    (c) => c.text !== currentChallenge.text
  );

  // Mélanger et prendre les premiers
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map((c, index) => ({
    id: `alt-${index}-${Date.now()}`,
    challenge: {
      text: c.text,
      level: currentChallenge.level,
      type: c.type,
      forGender: currentChallenge.forGender,
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
  const progressPercent = Math.round(((currentIndex) / totalCount) * 100);

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
 * Indicateur de tour - indique qui doit faire le défi et qui valide
 */
function TurnIndicator({
  isMyTurnToValidate,
  isChallengeForMe,
  partnerName,
}: {
  isMyTurnToValidate: boolean;
  isChallengeForMe: boolean;
  partnerName: string;
}) {
  if (isChallengeForMe) {
    // C'est MOI qui dois faire le défi
    return (
      <View className="flex-row items-center justify-center bg-purple-100 py-3 px-4 rounded-xl mb-4">
        <Ionicons name="arrow-up-circle" size={20} color="#9333EA" />
        <Text className="text-purple-700 font-semibold ml-2">
          C'est ton défi ! Envoie la preuve à {partnerName}
        </Text>
      </View>
    );
  }

  // C'est mon partenaire qui doit faire le défi
  if (isMyTurnToValidate) {
    return (
      <View className="flex-row items-center justify-center bg-green-100 py-3 px-4 rounded-xl mb-4">
        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        <Text className="text-green-700 font-semibold ml-2">
          Valide quand {partnerName} a accompli le défi !
        </Text>
      </View>
    );
  }

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
      className={`mb-6 ${isChallengeForMe ? "border-2 border-purple-300" : ""}`}
    >
      <Card.Content className="py-6">
        {/* Icône type */}
        <View className="items-center mb-4">
          <View className={`w-16 h-16 rounded-full items-center justify-center ${
            isChallengeForMe ? "bg-purple-100" : "bg-pink-100"
          }`}>
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
          <View className={`px-3 py-1 rounded-full ${
            isChallengeForMe ? "bg-purple-100" : "bg-pink-100"
          }`}>
            <Text className={`text-sm font-medium ${
              isChallengeForMe ? "text-purple-700" : "text-pink-700"
            }`}>
              {isChallengeForMe ? "👉 Ton défi" : `👤 Défi pour ${challenge.forGender === "homme" ? "lui" : "elle"}`}
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
  isMyTurnToValidate,
  isChallengeForMe,
  isLoading,
  onComplete,
  onSkip,
}: {
  isMyTurnToValidate: boolean;
  isChallengeForMe: boolean;
  isLoading: boolean;
  onComplete: () => void;
  onSkip: () => void;
}) {
  return (
    <View className="gap-3">
      {/* Bouton principal - visible seulement si c'est à moi de valider */}
      <Button
        title={isChallengeForMe ? "En attente de validation..." : "Défi accompli ✓"}
        variant={isMyTurnToValidate ? "primary" : "secondary"}
        size="lg"
        fullWidth
        disabled={!isMyTurnToValidate || isChallengeForMe}
        loading={isLoading}
        onPress={onComplete}
      />

      {/* Bouton secondaire - changer de défi */}
      <Button
        title="Changer de défi"
        variant="outline"
        size="md"
        fullWidth
        disabled={isLoading}
        onPress={onSkip}
        icon={<Ionicons name="shuffle-outline" size={20} color="#EC4899" />}
      />
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
                <Text className="text-gray-500 text-center py-4">
                  Aucune alternative disponible pour ce niveau.
                </Text>
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
  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <View className="flex-1 px-6 justify-center">
        {/* Icône de célébration */}
        <View className="items-center mb-8">
          <Text className="text-7xl">🎉</Text>
        </View>

        {/* Titre */}
        <Text className="text-3xl font-bold text-gray-800 text-center mb-2">
          Félicitations !
        </Text>
        <Text className="text-gray-500 text-center text-lg mb-8">
          Vous avez terminé la partie
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
    myRole,
    currentChallenge,
    progress,
    completedCount,
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
    return "ton partenaire";
  }, []);

  /**
   * Niveau actuel du défi
   */
  const currentLevel = currentChallenge?.level || 1;

  /**
   * Est-ce que le défi actuel est pour moi ?
   */
  const isChallengeForMe = useMemo((): boolean => {
    if (!currentChallenge || !userData || !session) return false;
    
    // Mon genre
    const myGender = userData.gender;
    
    // Le défi est pour moi si mon genre correspond au forGender du défi
    return currentChallenge.forGender === myGender;
  }, [currentChallenge, userData, session]);

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
    if (!currentChallenge) return;

    // Générer des alternatives depuis la vraie base de données
    const alts = generateAlternatives(currentChallenge, 2);
    setAlternatives(alts);
    setShowAlternatives(true);
  }, [currentChallenge]);

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
        {/* Indicateur de tour */}
        <TurnIndicator 
          isMyTurnToValidate={isMyTurn} 
          isChallengeForMe={isChallengeForMe}
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
          isMyTurnToValidate={isMyTurn}
          isChallengeForMe={isChallengeForMe}
          isLoading={isCompleting}
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