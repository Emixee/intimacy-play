/**
 * Écran d'accueil / Welcome Screen
 *
 * Premier écran visible par les utilisateurs non connectés.
 * Présente l'application avec :
 * - Logo et branding
 * - Description des fonctionnalités
 * - Boutons de connexion et inscription
 */

import React from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button } from "../../components/ui";

// Dimensions de l'écran
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============================================================
// FEATURES DATA
// ============================================================

interface Feature {
  emoji: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    emoji: "💕",
    title: "Défis intimes",
    description: "648 défis pour raviver la flamme",
  },
  {
    emoji: "🌍",
    title: "À distance",
    description: "Restez connectés où que vous soyez",
  },
  {
    emoji: "🔒",
    title: "Privé & sécurisé",
    description: "Vos données restent confidentielles",
  },
];

// ============================================================
// COMPOSANT FEATURE ITEM
// ============================================================

interface FeatureItemProps {
  feature: Feature;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ feature }) => (
  <View className="flex-row items-center mb-4">
    <View className="w-12 h-12 bg-pink-100 rounded-full items-center justify-center mr-4">
      <Text className="text-2xl">{feature.emoji}</Text>
    </View>
    <View className="flex-1">
      <Text className="text-gray-800 font-semibold text-base">
        {feature.title}
      </Text>
      <Text className="text-gray-500 text-sm">
        {feature.description}
      </Text>
    </View>
  </View>
);

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function WelcomeScreen() {
  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  const handleRegister = () => {
    router.push("/(auth)/register");
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-pink-50" edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <ScrollView 
        className="flex-1"
        contentContainerClassName="px-6 py-8 flex-grow"
        showsVerticalScrollIndicator={false}
      >
        {/* Section supérieure : Logo et titre */}
        <View className="flex-1 items-center justify-center min-h-[280px]">
          {/* Logo animé */}
          <View className="mb-6">
            <View className="w-32 h-32 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full items-center justify-center shadow-lg">
              <Text className="text-7xl">🔥</Text>
            </View>
          </View>

          {/* Titre */}
          <Text className="text-4xl font-bold text-pink-500 text-center mb-2">
            Intimacy Play
          </Text>
          
          {/* Sous-titre */}
          <Text className="text-gray-500 text-lg text-center mb-8">
            Le jeu de défis pour couples à distance
          </Text>

          {/* Badge 18+ */}
          <View className="bg-pink-100 px-4 py-2 rounded-full mb-8">
            <Text className="text-pink-600 font-semibold text-sm">
              🔞 Réservé aux adultes (18+)
            </Text>
          </View>
        </View>

        {/* Section centrale : Features */}
        <View className="bg-white rounded-3xl p-6 shadow-sm mb-8">
          {FEATURES.map((feature, index) => (
            <FeatureItem key={index} feature={feature} />
          ))}
        </View>

        {/* Section inférieure : Boutons d'action */}
        <View className="space-y-3">
          {/* Bouton Créer un compte */}
          <Button
            title="Créer un compte"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleRegister}
          />

          {/* Bouton Se connecter */}
          <View className="mt-3">
            <Button
              title="J'ai déjà un compte"
              variant="outline"
              size="lg"
              fullWidth
              onPress={handleLogin}
            />
          </View>
        </View>

        {/* Footer : Mentions légales */}
        <View className="mt-6">
          <Text className="text-center text-gray-400 text-xs">
            En continuant, vous acceptez nos{" "}
            <Text className="text-pink-500">CGU</Text> et notre{" "}
            <Text className="text-pink-500">Politique de confidentialité</Text>
          </Text>
        </View>

        {/* Version */}
        <Text className="text-center text-gray-400 text-xs mt-4 mb-4">
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}