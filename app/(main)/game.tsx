/**
 * Écran de jeu principal - VERSION OPTIMISÉE PRODUCTION
 *
 * Refactorisé pour :
 * - Composants extraits vers components/game/
 * - Meilleure performance avec React.memo et useMemo
 * - Code plus léger (~300 lignes vs 1500)
 *
 * FONCTIONNALITÉS :
 * 1. Header avec progression
 * 2. Indicateur de tour
 * 3. Carte du défi
 * 4. Boutons d'action
 * 5. Zone réactions
 * 6. Zone chat
 * 7. Game Over avec confettis
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, ScrollView, Alert, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

// Composants UI
import { LoadingScreen, Card, LevelBadge, ChallengeTypeBadge } from "../../components/ui";
import { ErrorScreen } from "../../components/ui/ErrorScreen";

// Composants Game extraits
import {
  GameHeader,
  TurnIndicator,
  ActionButtons,
  AlternativesModal,
  GameOverScreen,
  ChatZone,
  ReactionsZone,
  PendingPartnerChallengeIndicator,
} from "../../components/game";

// Modal
import { CreatePartnerChallengeModal } from "../../components/modals";

// Hooks
import { useSession } from "../../hooks/useSession";
import { useAuth } from "../../hooks/useAuth";

// Services
import { gameService } from "../../services/game.service";
import { chatService } from "../../services/chat.service";

// Data
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

// Types
import type {
  SessionChallenge,
  ChallengeType,
  IntensityLevel,
} from "../../types";

// ============================================================
// MAP DES DÉFIS
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

const getChallengeTypeEmoji = (type: ChallengeType): string => {
  const emojis: Record<ChallengeType, string> = {
    audio: "🎤",
    video: "🎬",
    photo: "📸",
    texte: "✍️",
  };
  return emojis[type] || "🎯";
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

interface AlternativeChallenge {
  id: string;
  challenge: SessionChallenge;
}

const generateAlternatives = (
  currentChallenge: SessionChallenge,
  usedTexts: string[],
  count: number = 2
): AlternativeChallenge[] => {
  if (!currentChallenge) return [];

  const { level, forGender, forPlayer } = currentChallenge;
  if (!forGender || !level) return [];

  const genderKey = forGender.toUpperCase() as "HOMME" | "FEMME";
  const mapKey = `${level}_${genderKey}`;
  const challengeArray = CHALLENGES_MAP[mapKey];

  if (!challengeArray) return [];

  const allUsedTexts = [...(usedTexts || []), currentChallenge.text];
  const availableChallenges = challengeArray.filter(
    (c: ChallengeData) => !allUsedTexts.includes(c.text)
  );

  const shuffled = shuffleArray(availableChallenges);
  const selected = shuffled.slice(0, count);

  return selected.map((c: ChallengeData, index: number) => ({
    id: `alt-${index}-${Date.now()}`,
    challenge: {
      text: c.text,
      level,
      type: c.type,
      forGender,
      forPlayer,
      completed: false,
      completedBy: null,
      completedAt: null,
    },
  }));
};

// ============================================================
// COMPOSANT CARTE DÉFI (inline car spécifique)
// ============================================================

interface ChallengeCardDisplayProps {
  challenge: SessionChallenge;
  isChallengeForMe: boolean;
}

const ChallengeCardDisplay = React.memo<ChallengeCardDisplayProps>(({
  challenge,
  isChallengeForMe,
}) => {
  const typeEmoji = getChallengeTypeEmoji(challenge.type);

  return (
    <Card variant="elevated" className={`mb-4 ${!isChallengeForMe ? "opacity-80" : ""}`}>
      <Card.Content className="py-6">
        <View className="items-center mb-4">
          <View className="w-16 h-16 rounded-full bg-pink-100 items-center justify-center">
            <Text className="text-3xl">{typeEmoji}</Text>
          </View>
        </View>

        <View className="flex-row justify-center gap-2 mb-4">
          <LevelBadge level={challenge.level} size="sm" />
          <ChallengeTypeBadge type={challenge.type} size="sm" />
          {challenge.createdByPartner && (
            <View className="bg-purple-100 px-2 py-1 rounded-full">
              <Text className="text-purple-600 text-xs font-medium">
                👑 Créé par partenaire
              </Text>
            </View>
          )}
        </View>

        <Text className="text-gray-800 text-lg text-center leading-7 px-2">
          {challenge.text}
        </Text>

        <View className="items-center mt-4">
          <View className={`px-3 py-1 rounded-full ${isChallengeForMe ? "bg-pink-100" : "bg-gray-100"}`}>
            <Text className={`text-sm font-medium ${isChallengeForMe ? "text-pink-600" : "text-gray-500"}`}>
              {isChallengeForMe
                ? "🎯 Pour toi"
                : `👤 Pour ${challenge.forGender === "homme" ? "lui" : "elle"}`}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
});

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function GameScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { userData, isPremium } = useAuth();

  const {
    session,
    isLoading,
    error,
    isMyTurn,
    isChallengeForMe,
    myRole,
    currentChallenge,
    completedCount,
    changesRemaining,
    isSessionCompleted,
    isSessionAbandoned,
    pendingPartnerChallenge,
    isPartnerChallengeRequestedByMe,
    isPartnerChallengeForMeToCreate,
    completeChallenge,
    skipChallenge,
    abandonSession,
    refreshSession,
  } = useSession({
    sessionCode: code || null,
    userId: userData?.id || null,
    isPremium,
  });

  const [isCompleting, setIsCompleting] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<AlternativeChallenge[]>([]);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [showCreateChallengeModal, setShowCreateChallengeModal] = useState(false);
  const [isRequestingPartner, setIsRequestingPartner] = useState(false);

  const partnerName = useMemo(() => "ton/ta partenaire", []);
  const currentLevel = currentChallenge?.level || 1;
  const usedChallengeTexts = useMemo(() => session?.challenges.map((c) => c.text) || [], [session]);
  const bonusUsed = useMemo(() => {
    if (!session || !myRole) return 0;
    return myRole === "creator" ? session.creatorBonusChanges || 0 : session.partnerBonusChanges || 0;
  }, [session, myRole]);
  const canRequestPartner = useMemo(() => isPremium, [isPremium]);

  useEffect(() => {
    if (!code || !userData?.id) return;
    const fetchUnread = async () => {
      const result = await chatService.getUnreadCount(code, userData.id);
      if (result.success && result.data !== undefined) {
        setUnreadCount(result.data);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [code, userData?.id]);

  const handleComplete = useCallback(async () => {
    setIsCompleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const result = await completeChallenge();
    if (!result.success) {
      Alert.alert("Erreur", result.error || "Impossible de valider le défi.");
    }
    setIsCompleting(false);
  }, [completeChallenge]);

  const handleOpenAlternatives = useCallback(() => {
    if (!currentChallenge) return;
    const alts = generateAlternatives(currentChallenge, usedChallengeTexts, 2);
    setAlternatives(alts);
    setShowAlternatives(true);
  }, [currentChallenge, usedChallengeTexts]);

  const handleSelectAlternative = useCallback(async (challenge: SessionChallenge) => {
    setShowAlternatives(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await skipChallenge(challenge);
    if (!result.success) {
      Alert.alert("Erreur", result.error || "Impossible de changer le défi.");
    }
  }, [skipChallenge]);

  const handleWatchAd = useCallback(async () => {
    if (!code || !userData?.id) return;
    setIsWatchingAd(true);
    const result = await gameService.watchAdForChange(code, userData.id);
    if (result.success) {
      Alert.alert("🎉 Bonus obtenu !", "Tu as gagné +1 changement de défi !");
    } else {
      Alert.alert("Oups", result.error || "La pub n'a pas pu être affichée.");
    }
    setIsWatchingAd(false);
  }, [code, userData?.id]);

  const handleRequestPartner = useCallback(async () => {
    if (!code || !userData?.id) return;
    Alert.alert(
      "Demander un défi personnalisé 👑",
      "Ton partenaire va créer un défi sur mesure pour toi !\n\nNote : Cette fonctionnalité nécessite que vous soyez tous les deux Premium.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Demander",
          onPress: async () => {
            setIsRequestingPartner(true);
            const result = await gameService.requestPartnerChallenge(code, userData.id, isPremium, true);
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Alert.alert("Erreur", result.error || "Impossible d'envoyer la demande.");
            }
            setIsRequestingPartner(false);
          },
        },
      ]
    );
  }, [code, userData?.id, isPremium]);

  const handleCancelPartnerRequest = useCallback(async () => {
    if (!code || !userData?.id) return;
    const result = await gameService.cancelPartnerChallengeRequest(code, userData.id);
    if (!result.success) {
      Alert.alert("Erreur", result.error || "Impossible d'annuler la demande.");
    }
  }, [code, userData?.id]);

  const handleSubmitPartnerChallenge = useCallback(async (text: string, level: IntensityLevel, type: ChallengeType) => {
    if (!code || !userData?.id) return;
    const result = await gameService.submitPartnerChallenge(code, userData.id, text, level, type);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreateChallengeModal(false);
      Alert.alert("🎉 Défi envoyé !", "Ton partenaire va découvrir ton défi personnalisé !");
    } else {
      Alert.alert("Erreur", result.error || "Impossible d'envoyer le défi.");
    }
  }, [code, userData?.id]);

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

  const handlePlayAgain = useCallback(() => router.replace("/(main)/create-session"), []);
  const handleGoHome = useCallback(() => router.replace("/(main)"), []);

  if (isLoading) {
    return <LoadingScreen message="Chargement de la partie..." />;
  }

  if (error || !code) {
    return (
      <ErrorScreen
        message={error || "Code de session manquant."}
        onRetry={error ? refreshSession : undefined}
        onGoHome={handleGoHome}
      />
    );
  }

  if (isSessionAbandoned) {
    return <ErrorScreen message="Cette partie a été abandonnée." onGoHome={handleGoHome} />;
  }

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

  return (
    <SafeAreaView className="flex-1 bg-pink-50" edges={["top"]}>
      <GameHeader
        currentIndex={session?.currentChallengeIndex || 0}
        totalCount={session?.challengeCount || 0}
        currentLevel={currentLevel as IntensityLevel}
        onQuit={handleQuit}
      />

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {pendingPartnerChallenge && (
          <PendingPartnerChallengeIndicator
            isRequestedByMe={isPartnerChallengeRequestedByMe}
            onCancel={handleCancelPartnerRequest}
          />
        )}

        <TurnIndicator isChallengeForMe={isChallengeForMe} isMyTurn={isMyTurn} partnerName={partnerName} />

        <ChallengeCardDisplay challenge={currentChallenge} isChallengeForMe={isChallengeForMe} />

        <ActionButtons
          isChallengeForMe={isChallengeForMe}
          isMyTurn={isMyTurn}
          isLoading={isCompleting || isWatchingAd || isRequestingPartner}
          changesRemaining={changesRemaining}
          bonusUsed={bonusUsed}
          isPremium={isPremium}
          canRequestPartner={canRequestPartner}
          hasPendingRequest={!!pendingPartnerChallenge}
          isForMeToCreate={isPartnerChallengeForMeToCreate}
          onComplete={handleComplete}
          onSkip={handleOpenAlternatives}
          onWatchAd={handleWatchAd}
          onRequestPartner={handleRequestPartner}
          onCreatePartnerChallenge={() => setShowCreateChallengeModal(true)}
        />
      </ScrollView>

      {code && userData?.id && (
        <ReactionsZone
          sessionCode={code}
          userId={userData.id}
          isPremium={isPremium}
          onShowPaywall={() => router.push("/(main)/premium")}
        />
      )}

      {code && userData && (
        <ChatZone
          sessionCode={code}
          userId={userData.id}
          userGender={userData.gender}
          expanded={chatExpanded}
          onToggle={() => setChatExpanded(!chatExpanded)}
          unreadCount={unreadCount}
        />
      )}

      <AlternativesModal
        visible={showAlternatives}
        alternatives={alternatives}
        onSelect={handleSelectAlternative}
        onClose={() => setShowAlternatives(false)}
      />

      <CreatePartnerChallengeModal
        visible={showCreateChallengeModal}
        onSubmit={handleSubmitPartnerChallenge}
        onClose={() => setShowCreateChallengeModal(false)}
      />
    </SafeAreaView>
  );
}
