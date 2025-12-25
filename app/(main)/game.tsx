/**
 * Écran de jeu principal - PROMPT 8.4 COMPLET
 *
 * Affiche le défi actuel et gère la progression de la partie.
 * Utilise useSession pour le temps réel et les actions.
 *
 * FONCTIONNALITÉS :
 * 1. Header avec progression (Défi X/Y) et bouton quitter
 * 2. Badge niveau actuel avec couleur
 * 3. ChallengeCard avec thème et jouet
 * 4. Indicateur de tour (mon tour / attente)
 * 5. Boutons actions :
 *    - "Défi accompli ✓"
 *    - "Changer de défi" avec compteur + pub bonus
 *    - "Demander au partenaire de créer" (2 premium)
 * 6. Zone réactions (ReactionPicker + overlay)
 * 7. Zone chat (collapse/expand)
 * 8. Game Over avec confettis et stats
 *
 * LOGIQUE (FIX BUG couples même genre) :
 * - isChallengeForMe : Basé sur forPlayer (rôle) → j'envoie la preuve
 * - isMyTurn : C'est mon tour de VALIDER → je valide après réception de la preuve
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import {
  Button,
  Card,
  LevelBadge,
  ChallengeTypeBadge,
  LoadingScreen,
} from "../../components/ui";
import { ReactionPicker, QuickReactionsBar, ReactionOverlay, useReactionOverlay } from "../../components/reactions";
import { ChatBubble } from "../../components/chat";
import { useSession } from "../../hooks/useSession";
import { useSessionReactions } from "../../hooks/useReactions";
import { useAuth } from "../../hooks/useAuth";
import { gameService } from "../../services/game.service";
import { chatService } from "../../services/chat.service";
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
  PlayerRole,
  Message,
  Reaction,
  MAX_CHALLENGE_CHANGES,
  MAX_BONUS_CHANGES,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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
 */
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
      theme: c.theme,
      toy: c.toy,
    },
  }));
};

// ============================================================
// ANIMATION CONFETTIS
// ============================================================

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
}

function ConfettiAnimation({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const colors = ["#EC4899", "#F472B6", "#FFD700", "#FF6B6B", "#4ECDC4", "#A855F7"];
    const newPieces: ConfettiPiece[] = [];

    for (let i = 0; i < 50; i++) {
      newPieces.push({
        id: i,
        x: new Animated.Value(Math.random() * SCREEN_WIDTH),
        y: new Animated.Value(-20),
        rotate: new Animated.Value(0),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
      });
    }

    setPieces(newPieces);

    // Animer chaque confetti
    newPieces.forEach((piece, index) => {
      const duration = 3000 + Math.random() * 2000;
      const delay = index * 50;

      Animated.parallel([
        Animated.timing(piece.y, {
          toValue: SCREEN_HEIGHT + 50,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.x, {
          toValue: piece.x._value + (Math.random() - 0.5) * 200,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotate, {
          toValue: Math.random() * 10,
          duration,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
      }}
    >
      {pieces.map((piece) => (
        <Animated.View
          key={piece.id}
          style={{
            position: "absolute",
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.size / 4,
            transform: [
              { translateX: piece.x },
              { translateY: piece.y },
              {
                rotate: piece.rotate.interpolate({
                  inputRange: [0, 10],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

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
      <View className="flex-row items-center justify-between mb-4">
        <Pressable
          onPress={onQuit}
          className="w-10 h-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>

        <View className="flex-row items-center">
          <Text className="text-gray-600 font-medium">Défi </Text>
          <Text className="text-pink-500 font-bold text-lg">
            {currentIndex + 1}
          </Text>
          <Text className="text-gray-600 font-medium"> / {totalCount}</Text>
        </View>

        <LevelBadge level={currentLevel} showLabel={false} size="md" />
      </View>

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
 * Indicateur de tour amélioré avec animation pulsante
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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isChallengeForMe || isMyTurn) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    return () => pulseAnim.stopAnimation();
  }, [isChallengeForMe, isMyTurn]);

  if (isChallengeForMe) {
    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View className="flex-row items-center justify-center bg-pink-100 py-3 px-4 rounded-xl mb-4">
          <Ionicons name="flash" size={20} color="#EC4899" />
          <Text className="text-pink-700 font-semibold ml-2">
            C'est ton défi ! Envoie la preuve à {partnerName} 💕
          </Text>
        </View>
      </Animated.View>
    );
  }

  if (isMyTurn) {
    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <View className="flex-row items-center justify-center bg-green-100 py-3 px-4 rounded-xl mb-4">
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text className="text-green-700 font-semibold ml-2">
            Valide quand {partnerName} a accompli le défi ! ✓
          </Text>
        </View>
      </Animated.View>
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
 * Carte du défi actuel avec thème et jouet
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
      className={`mb-4 ${!isChallengeForMe ? "opacity-80" : ""}`}
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

        {/* Thème et jouet si applicable */}
        {(challenge.theme || challenge.toy) && (
          <View className="flex-row justify-center gap-2 mt-4">
            {challenge.theme && (
              <View className="bg-purple-100 px-3 py-1 rounded-full">
                <Text className="text-purple-600 text-xs font-medium">
                  🎭 {challenge.theme}
                </Text>
              </View>
            )}
            {challenge.toy && (
              <View className="bg-pink-100 px-3 py-1 rounded-full">
                <Text className="text-pink-600 text-xs font-medium">
                  🎀 {challenge.toy}
                </Text>
              </View>
            )}
          </View>
        )}

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
 * Boutons d'action avec pub bonus et demande partenaire
 */
function ActionButtons({
  isChallengeForMe,
  isMyTurn,
  isLoading,
  changesRemaining,
  bonusUsed,
  isPremium,
  canRequestPartner,
  onComplete,
  onSkip,
  onWatchAd,
  onRequestPartner,
}: {
  isChallengeForMe: boolean;
  isMyTurn: boolean;
  isLoading: boolean;
  changesRemaining: number;
  bonusUsed: number;
  isPremium: boolean;
  canRequestPartner: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onWatchAd: () => void;
  onRequestPartner: () => void;
}) {
  const canValidate = isMyTurn && !isChallengeForMe;
  const canChange = isChallengeForMe && changesRemaining > 0;
  const canWatchAdForBonus = !isPremium && bonusUsed < MAX_BONUS_CHANGES;

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

      {/* Bouton Changer de défi */}
      {isChallengeForMe && (
        <>
          <Button
            title={
              isPremium
                ? "Changer de défi ∞"
                : `Changer de défi (${changesRemaining}/${MAX_CHALLENGE_CHANGES + bonusUsed})`
            }
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

          {/* Bouton pub pour changement bonus */}
          {!isPremium && changesRemaining === 0 && canWatchAdForBonus && (
            <Pressable
              onPress={onWatchAd}
              className="flex-row items-center justify-center bg-amber-50 py-3 rounded-xl border border-amber-200"
            >
              <Ionicons name="play-circle" size={20} color="#F59E0B" />
              <Text className="text-amber-700 font-medium ml-2">
                Regarder une pub pour +1 changement ({bonusUsed}/{MAX_BONUS_CHANGES})
              </Text>
            </Pressable>
          )}
        </>
      )}

      {/* Bouton demander au partenaire (2 premium) */}
      {canRequestPartner && isChallengeForMe && (
        <Pressable
          onPress={onRequestPartner}
          className="flex-row items-center justify-center bg-purple-50 py-3 rounded-xl border border-purple-200"
        >
          <Text className="text-xl mr-2">👑</Text>
          <Text className="text-purple-700 font-medium">
            Demander un défi personnalisé
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Zone de réactions avec overlay
 */
function ReactionsZone({
  sessionCode,
  userId,
  isPremium,
  onShowPaywall,
}: {
  sessionCode: string;
  userId: string;
  isPremium: boolean;
  onShowPaywall?: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  // Hook pour l'overlay d'animations
  const { reactions, triggerReaction, removeReaction } = useReactionOverlay();

  // Hook pour la sync Firebase des réactions
  const { sendReaction } = useSessionReactions({
    sessionCode,
    userId,
    isPremium,
    onPartnerReaction: (reaction) => {
      // Animer la réaction du partenaire
      triggerReaction(reaction.emoji, true);
    },
  });

  const handleSelectReaction = async (emoji: Reaction) => {
    // Animer localement
    triggerReaction(emoji);
    // Envoyer à Firebase
    await sendReaction(emoji);
    setShowPicker(false);
  };

  return (
    <>
      {/* Overlay des animations */}
      <ReactionOverlay reactions={reactions} onReactionComplete={removeReaction} />

      {/* Barre de réactions rapides */}
      <View className="bg-white border-t border-gray-100 px-4 py-2">
        <View className="flex-row items-center justify-between">
          <QuickReactionsBar
            onSelect={handleSelectReaction}
            isPremium={isPremium}
            onShowMore={() => setShowPicker(true)}
          />
        </View>
      </View>

      {/* Modal Picker complet */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowPicker(false)}
        >
          <View className="mx-4">
            <ReactionPicker
              onSelect={handleSelectReaction}
              isPremium={isPremium}
              onShowPaywall={onShowPaywall}
              onClose={() => setShowPicker(false)}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/**
 * Zone de chat (collapse/expand)
 */
function ChatZone({
  sessionCode,
  userId,
  userGender,
  expanded,
  onToggle,
  unreadCount,
}: {
  sessionCode: string;
  userId: string;
  userGender: "homme" | "femme";
  expanded: boolean;
  onToggle: () => void;
  unreadCount: number;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Écouter les messages
  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(sessionCode, (msgs) => {
      setMessages(msgs);
      // Scroll en bas quand nouveaux messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [sessionCode]);

  // Marquer comme lu quand expanded
  useEffect(() => {
    if (expanded && messages.length > 0) {
      chatService.markAllAsRead(sessionCode, userId);
    }
  }, [expanded, messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    await chatService.sendMessage(sessionCode, userId, userGender, inputText.trim());
    setInputText("");
    setIsSending(false);
  };

  if (!expanded) {
    return (
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between bg-white px-4 py-3 border-t border-gray-100"
      >
        <View className="flex-row items-center">
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
          <Text className="text-gray-600 ml-2">Chat</Text>
        </View>
        <View className="flex-row items-center">
          {unreadCount > 0 && (
            <View className="bg-pink-500 rounded-full w-5 h-5 items-center justify-center mr-2">
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
          <Ionicons name="chevron-up" size={20} color="#9CA3AF" />
        </View>
      </Pressable>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="bg-white border-t border-gray-100"
      style={{ maxHeight: 300 }}
    >
      {/* Header chat */}
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between px-4 py-2 border-b border-gray-100"
      >
        <Text className="text-gray-800 font-medium">Chat</Text>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </Pressable>

      {/* Liste messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble
            content={item.content}
            isOwnMessage={item.senderId === userId}
            timestamp={item.createdAt}
            isRead={item.read}
          />
        )}
        contentContainerStyle={{ padding: 12 }}
        style={{ maxHeight: 180 }}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center py-4">
            Aucun message pour le moment
          </Text>
        }
      />

      {/* Input */}
      <View className="flex-row items-center px-3 py-2 border-t border-gray-100">
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Écris un message..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
          maxLength={500}
        />
        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            inputText.trim() ? "bg-pink-500" : "bg-gray-200"
          }`}
        >
          <Ionicons
            name="send"
            size={18}
            color={inputText.trim() ? "#FFF" : "#9CA3AF"}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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

            <ScrollView className="max-h-96 px-5 py-4">
              {alternatives.length === 0 ? (
                <View className="items-center py-8">
                  <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
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
                          <LevelBadge level={alt.challenge.level} size="sm" showLabel={false} />
                          <ChallengeTypeBadge type={alt.challenge.type} size="sm" />
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

            <View className="px-5 pb-4">
              <Button title="Annuler" variant="ghost" fullWidth onPress={onClose} />
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Écran de fin de partie avec confettis
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
  const [showConfetti, setShowConfetti] = useState(true);
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

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <ConfettiAnimation active={showConfetti} />

      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-8">
          <Text className="text-7xl">{emoji}</Text>
        </View>

        <Text className="text-3xl font-bold text-gray-800 text-center mb-2">
          Félicitations !
        </Text>
        <Text className="text-gray-500 text-center text-lg mb-8">{message}</Text>

        <Card variant="elevated" className="mb-8">
          <Card.Content className="py-6">
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-4xl font-bold text-pink-500">
                  {completedCount}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">Défis accomplis</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="items-center">
                <Text className="text-4xl font-bold text-gray-400">
                  {totalCount - completedCount}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">Défis passés</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View className="bg-pink-100 rounded-xl p-4 mb-8">
          <Text className="text-pink-700 text-center italic">
            "La distance n'est qu'un test pour voir jusqu'où l'amour peut
            voyager" 💕
          </Text>
        </View>

        <View className="gap-3">
          <Button
            title="Nouvelle partie 🚀"
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
            <Button title="Réessayer" variant="primary" fullWidth onPress={onRetry} />
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
  const { userData, isPremium } = useAuth();

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
  const [chatExpanded, setChatExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // ----------------------------------------------------------
  // COMPUTED VALUES
  // ----------------------------------------------------------

  const partnerName = useMemo(() => {
    return "ton/ta partenaire";
  }, []);

  const currentLevel = currentChallenge?.level || 1;

  const usedChallengeTexts = useMemo(() => {
    return session?.challenges.map((c) => c.text) || [];
  }, [session]);

  // Bonus déjà utilisés pour les changements
  const bonusUsed = useMemo(() => {
    if (!session || !myRole) return 0;
    return myRole === "creator"
      ? session.creatorBonusChanges || 0
      : session.partnerBonusChanges || 0;
  }, [session, myRole]);

  // Les 2 joueurs sont premium ? (pour demande partenaire)
  const canRequestPartner = useMemo(() => {
    // TODO: Vérifier si le partenaire est aussi premium
    // Pour l'instant, on désactive cette fonctionnalité
    return false;
  }, [isPremium]);

  // ----------------------------------------------------------
  // EFFECTS
  // ----------------------------------------------------------

  // Compter les messages non lus
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

  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------

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

  const handleSelectAlternative = useCallback(
    async (challenge: SessionChallenge) => {
      setShowAlternatives(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await skipChallenge(challenge);
      if (!result.success) {
        Alert.alert("Erreur", result.error || "Impossible de changer le défi.");
      }
    },
    [skipChallenge]
  );

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

  const handleRequestPartner = useCallback(() => {
    Alert.alert(
      "Fonctionnalité Premium 👑",
      "Demandez à votre partenaire de créer un défi personnalisé pour vous !",
      [{ text: "OK" }]
    );
  }, []);

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

  const handlePlayAgain = useCallback(() => {
    router.replace("/(main)/create-session");
  }, []);

  const handleGoHome = useCallback(() => {
    router.replace("/(main)");
  }, []);

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

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
    return (
      <ErrorScreen
        message="Cette partie a été abandonnée."
        onGoHome={handleGoHome}
      />
    );
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
      {/* Header */}
      <GameHeader
        currentIndex={session?.currentChallengeIndex || 0}
        totalCount={session?.challengeCount || 0}
        currentLevel={currentLevel as IntensityLevel}
        onQuit={handleQuit}
      />

      {/* Contenu principal */}
      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Indicateur de tour */}
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

        {/* Boutons d'action */}
        <ActionButtons
          isChallengeForMe={isChallengeForMe}
          isMyTurn={isMyTurn}
          isLoading={isCompleting || isWatchingAd}
          changesRemaining={changesRemaining}
          bonusUsed={bonusUsed}
          isPremium={isPremium}
          canRequestPartner={canRequestPartner}
          onComplete={handleComplete}
          onSkip={handleOpenAlternatives}
          onWatchAd={handleWatchAd}
          onRequestPartner={handleRequestPartner}
        />
      </ScrollView>

      {/* Zone Réactions */}
      {code && userData?.id && (
        <ReactionsZone
          sessionCode={code}
          userId={userData.id}
          isPremium={isPremium}
          onShowPaywall={() => router.push("/(main)/premium")}
        />
      )}

      {/* Zone Chat */}
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