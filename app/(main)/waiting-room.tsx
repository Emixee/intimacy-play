/**
 * Écran salle d'attente
 *
 * Affiche le code de session et attend que le partenaire rejoigne.
 * Écoute en temps réel les changements de la session.
 * Navigue automatiquement vers le jeu quand le partenaire rejoint.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  Share,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

import { Button, Card } from "../../components/ui";
import { sessionService } from "../../services/session.service";
import { Session, INTENSITY_LEVELS } from "../../types";

// ============================================================
// COMPOSANTS INTERNES
// ============================================================

/**
 * Icône de cœurs animée
 */
function HeartsIcon() {
  return (
    <View className="items-center justify-center mb-6">
      <View className="relative">
        {/* Cœur principal */}
        <Text className="text-6xl">💕</Text>
        {/* Petits cœurs autour */}
        <Text className="absolute -top-2 -right-4 text-2xl opacity-70">💗</Text>
        <Text className="absolute -top-1 -left-4 text-xl opacity-60">💖</Text>
      </View>
    </View>
  );
}

/**
 * Affichage du code de session
 */
function SessionCodeDisplay({
  code,
  onCopy,
  onShare,
  isCopied,
}: {
  code: string;
  onCopy: () => void;
  onShare: () => void;
  isCopied: boolean;
}) {
  return (
    <Card className="mb-6">
      <Card.Content className="items-center py-6">
        {/* Label */}
        <Text className="text-gray-500 text-sm font-medium mb-3">
          CODE DE SESSION
        </Text>

        {/* Code */}
        <Text className="text-4xl font-bold text-pink-500 tracking-[8px] mb-6">
          {code}
        </Text>

        {/* Boutons */}
        <View className="flex-row w-full">
          {/* Bouton Copier */}
          <Pressable
            onPress={onCopy}
            className={`
              flex-1 flex-row items-center justify-center py-3 rounded-xl mr-2
              ${isCopied ? "bg-green-100" : "bg-gray-100"}
            `}
          >
            <Ionicons
              name={isCopied ? "checkmark-circle" : "copy-outline"}
              size={20}
              color={isCopied ? "#10B981" : "#6B7280"}
            />
            <Text
              className={`
                ml-2 font-semibold
                ${isCopied ? "text-green-600" : "text-gray-600"}
              `}
            >
              {isCopied ? "Copié !" : "Copier"}
            </Text>
          </Pressable>

          {/* Bouton Partager */}
          <Pressable
            onPress={onShare}
            className="flex-1 flex-row items-center justify-center py-3 rounded-xl ml-2 bg-pink-100"
          >
            <Ionicons name="share-outline" size={20} color="#EC4899" />
            <Text className="ml-2 font-semibold text-pink-600">Partager</Text>
          </Pressable>
        </View>
      </Card.Content>
    </Card>
  );
}

/**
 * Indicateur d'attente
 */
function WaitingIndicator({ challengeCount }: { challengeCount: number }) {
  return (
    <View className="items-center mb-6">
      {/* Animation de chargement */}
      <View className="flex-row items-center mb-2">
        <ActivityIndicator size="small" color="#EC4899" />
        <Text className="text-gray-600 ml-3">
          En attente de votre partenaire
        </Text>
      </View>

      {/* Info défis */}
      <Text className="text-gray-500 text-sm">
        {challengeCount} défis prêts à jouer
      </Text>
    </View>
  );
}

/**
 * Note explicative
 */
function ExplanatoryNote() {
  return (
    <View className="bg-pink-50 border border-pink-100 rounded-xl p-4">
      <View className="flex-row items-start">
        <Ionicons
          name="information-circle-outline"
          size={20}
          color="#EC4899"
          style={{ marginTop: 2 }}
        />
        <View className="flex-1 ml-3">
          <Text className="text-gray-700 text-sm leading-5">
            Partagez ce code avec votre partenaire. Une fois qu'il/elle aura
            rejoint, la partie commencera automatiquement.
          </Text>
          <Text className="text-gray-500 text-xs mt-2">
            Le code expire dans 24 heures.
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function WaitingRoomScreen() {
  // ----------------------------------------------------------
  // PARAMS & STATE
  // ----------------------------------------------------------

  const { code } = useLocalSearchParams<{ code: string }>();
  
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------------
  // ÉCOUTE TEMPS RÉEL
  // ----------------------------------------------------------

  useEffect(() => {
    if (!code) {
      setError("Code de session manquant");
      setIsLoading(false);
      return;
    }

    console.log("[WaitingRoom] Subscribing to session:", code);

    // S'abonner aux changements de la session
    const unsubscribe = sessionService.subscribeToSession(
      code,
      (updatedSession) => {
        console.log("[WaitingRoom] Session updated:", updatedSession.status);
        setSession(updatedSession);
        setIsLoading(false);

        // Si le partenaire a rejoint, naviguer vers le jeu
        if (updatedSession.partnerId !== null && updatedSession.status === "active") {
          console.log("[WaitingRoom] Partner joined! Navigating to game...");
          router.replace({
            pathname: "/game",
            params: { code: updatedSession.id },
          });
        }

        // Si la session est abandonnée/terminée, retourner à l'accueil
        if (updatedSession.status === "abandoned" || updatedSession.status === "completed") {
          Alert.alert(
            "Session terminée",
            "Cette session n'est plus disponible.",
            [{ text: "OK", onPress: () => router.replace("/(main)") }]
          );
        }
      },
      (errorMessage) => {
        console.error("[WaitingRoom] Session error:", errorMessage);
        setError(errorMessage);
        setIsLoading(false);
      }
    );

    // Cleanup
    return () => {
      console.log("[WaitingRoom] Unsubscribing from session");
      unsubscribe();
    };
  }, [code]);

  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------

  /**
   * Copie le code dans le presse-papier
   */
  const handleCopyCode = useCallback(async () => {
    if (!code) return;

    try {
      await Clipboard.setStringAsync(code);
      setIsCopied(true);

      // Reset après 2 secondes
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("[WaitingRoom] Copy error:", error);
      Alert.alert("Erreur", "Impossible de copier le code.");
    }
  }, [code]);

  /**
   * Partage le code via le système natif
   */
  const handleShare = useCallback(async () => {
    if (!code) return;

    try {
      const message = `Rejoins-moi sur Intimacy Play ! 💕\n\nCode de session : ${code}\n\nTélécharge l'app et entre ce code pour jouer avec moi !`;

      await Share.share({
        message,
        title: "Invitation Intimacy Play",
      });
    } catch (error) {
      console.error("[WaitingRoom] Share error:", error);
      // L'utilisateur a peut-être annulé, pas besoin d'afficher une erreur
    }
  }, [code]);

  /**
   * Annule la session et retourne à l'accueil
   */
  const handleCancel = useCallback(() => {
    Alert.alert(
      "Annuler la session ?",
      "Voulez-vous vraiment annuler cette session ? Le code ne sera plus valide.",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            if (session) {
              await sessionService.updateSessionStatus(code!, "abandoned");
            }
            router.replace("/(main)");
          },
        },
      ]
    );
  }, [code, session]);

  // ----------------------------------------------------------
  // RENDER : LOADING
  // ----------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-pink-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Chargement de la session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------------
  // RENDER : ERREUR
  // ----------------------------------------------------------

  if (error || !code) {
    return (
      <SafeAreaView className="flex-1 bg-pink-50">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-xl font-bold text-gray-800 mt-4">
            Oups !
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            {error || "Code de session manquant."}
          </Text>
          <Button
            title="Retour à l'accueil"
            variant="outline"
            onPress={() => router.replace("/(main)")}
            className="mt-6"
          />
        </View>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------------
  // RENDER : ATTENTE
  // ----------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-pink-50" edges={["bottom"]}>
      <View className="flex-1 px-5">
        {/* Header avec bouton retour */}
        <View className="flex-row items-center py-4">
          <Pressable
            onPress={handleCancel}
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="close" size={24} color="#374151" />
          </Pressable>
        </View>

        {/* Contenu centré */}
        <View className="flex-1 justify-center">
          {/* Icône cœurs */}
          <HeartsIcon />

          {/* Titre */}
          <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
            Partagez ce code
          </Text>
          <Text className="text-gray-500 text-center mb-8">
            avec votre partenaire
          </Text>

          {/* Card avec le code */}
          <SessionCodeDisplay
            code={code}
            onCopy={handleCopyCode}
            onShare={handleShare}
            isCopied={isCopied}
          />

          {/* Indicateur d'attente */}
          <WaitingIndicator
            challengeCount={session?.challengeCount || 0}
          />

          {/* Note explicative */}
          <ExplanatoryNote />
        </View>

        {/* Bouton Annuler en bas */}
        <View className="pb-4">
          <Button
            title="Annuler la session"
            variant="outline"
            fullWidth
            onPress={handleCancel}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}