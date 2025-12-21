/**
 * Écran pour rejoindre une session
 *
 * Permet au partenaire de saisir le code à 6 caractères
 * et de rejoindre la session de jeu.
 */

import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";
import { sessionService } from "../../services/session.service";

// ============================================================
// CONSTANTES
// ============================================================

const CODE_LENGTH = 6;
const VALID_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// ============================================================
// COMPOSANTS INTERNES
// ============================================================

interface CodeInputProps {
  code: string;
  onCodeChange: (code: string) => void;
  isError: boolean;
}

/**
 * Input visuel pour le code à 6 caractères
 */
function CodeInput({ code, onCodeChange, isError }: CodeInputProps) {
  const inputRef = useRef<TextInput>(null);

  /**
   * Focus sur l'input caché
   */
  const handlePress = () => {
    inputRef.current?.focus();
  };

  /**
   * Gestion de la saisie
   */
  const handleChangeText = (text: string) => {
    // Filtrer et normaliser : majuscules, caractères valides uniquement
    const filtered = text
      .toUpperCase()
      .split("")
      .filter((char) => VALID_CHARACTERS.includes(char))
      .join("")
      .slice(0, CODE_LENGTH);

    onCodeChange(filtered);
  };

  return (
    <Pressable onPress={handlePress}>
      {/* Input caché */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={handleChangeText}
        maxLength={CODE_LENGTH}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        keyboardType="default"
        className="absolute opacity-0 h-0 w-0"
      />

      {/* Cases visuelles */}
      <View className="flex-row justify-center">
        {Array.from({ length: CODE_LENGTH }).map((_, index) => {
          const char = code[index] || "";
          const isFilled = char !== "";
          const isCurrentPosition = index === code.length;

          return (
            <View
              key={index}
              className={`
                w-12 h-14 mx-1.5 rounded-xl items-center justify-center
                border-2
                ${isError 
                  ? "border-red-400 bg-red-50" 
                  : isFilled 
                    ? "border-pink-500 bg-pink-50" 
                    : isCurrentPosition
                      ? "border-pink-400 bg-white"
                      : "border-gray-200 bg-white"
                }
              `}
            >
              {isFilled ? (
                <Text className={`text-2xl font-bold ${isError ? "text-red-600" : "text-pink-600"}`}>
                  {char}
                </Text>
              ) : isCurrentPosition ? (
                <View className="w-0.5 h-6 bg-pink-400 animate-pulse" />
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Indicateur de progression */}
      <Text className={`text-center mt-4 text-sm ${isError ? "text-red-500" : "text-gray-500"}`}>
        {isError ? "Code invalide" : `${code.length}/${CODE_LENGTH} caractères`}
      </Text>
    </Pressable>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function JoinSessionScreen() {
  // ----------------------------------------------------------
  // HOOKS
  // ----------------------------------------------------------

  const { userData } = useAuth();

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // ----------------------------------------------------------
  // COMPUTED
  // ----------------------------------------------------------

  const isCodeComplete = code.length === CODE_LENGTH;

  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------

  /**
   * Mise à jour du code
   */
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    setIsError(false);
  }, []);

  /**
   * Effacer le code
   */
  const handleClear = useCallback(() => {
    setCode("");
    setIsError(false);
  }, []);

  /**
   * Rejoindre la session
   */
  const handleJoinSession = useCallback(async () => {
    if (!isCodeComplete || !userData) return;

    Keyboard.dismiss();
    setIsLoading(true);
    setIsError(false);

    try {
      // Formater le code pour l'affichage (ABC DEF)
      const formattedCode = `${code.slice(0, 3)} ${code.slice(3)}`;

      // Appeler le service pour rejoindre
      const result = await sessionService.joinSession(
        formattedCode,
        userData.id,
        userData.gender
      );

      if (result.success && result.data) {
        console.log("[JoinSession] Successfully joined session");
        
        // Naviguer vers l'écran de jeu
        router.replace({
          pathname: "/game",
          params: { code: result.data.id },
        });
      } else {
        console.log("[JoinSession] Failed to join:", result.error);
        setIsError(true);
        
        // Afficher l'erreur spécifique
        Alert.alert(
          "Impossible de rejoindre",
          result.error || "Vérifiez le code et réessayez.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("[JoinSession] Error:", error);
      setIsError(true);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue. Veuillez réessayer.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [code, isCodeComplete, userData]);

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-pink-50" edges={["bottom"]}>
      <View className="flex-1 px-5">
        {/* Header */}
        <View className="flex-row items-center py-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </Pressable>
        </View>

        {/* Contenu */}
        <View className="flex-1 justify-center">
          {/* Icône */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-pink-100 rounded-full items-center justify-center">
              <Text className="text-4xl">🔗</Text>
            </View>
          </View>

          {/* Titre */}
          <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
            Rejoindre une session
          </Text>
          <Text className="text-gray-500 text-center mb-8 px-4">
            Entrez le code à 6 caractères partagé par votre partenaire
          </Text>

          {/* Input du code */}
          <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <CodeInput
              code={code}
              onCodeChange={handleCodeChange}
              isError={isError}
            />

            {/* Bouton effacer */}
            {code.length > 0 && (
              <Pressable
                onPress={handleClear}
                className="flex-row items-center justify-center mt-4"
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                <Text className="text-gray-400 ml-1 text-sm">Effacer</Text>
              </Pressable>
            )}
          </View>

          {/* Bouton Rejoindre */}
          <Button
            title={isLoading ? "Connexion..." : "Rejoindre la partie 🎮"}
            onPress={handleJoinSession}
            disabled={!isCodeComplete || isLoading}
            fullWidth
            size="lg"
          />

          {isLoading && (
            <View className="flex-row items-center justify-center mt-4">
              <ActivityIndicator size="small" color="#EC4899" />
              <Text className="text-gray-500 ml-2">Recherche de la session...</Text>
            </View>
          )}

          {/* Note */}
          <View className="mt-8 px-4">
            <View className="flex-row items-start">
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#9CA3AF"
                style={{ marginTop: 2 }}
              />
              <Text className="text-gray-400 text-sm ml-2 flex-1">
                Le code est composé de 6 lettres et chiffres (sans O, 0, I, 1, L pour éviter les confusions).
              </Text>
            </View>
          </View>
        </View>

        {/* Espace en bas pour le clavier */}
        <View className="h-4" />
      </View>
    </SafeAreaView>
  );
}