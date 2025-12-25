/**
 * Écran d'accueil principal - Home Screen
 * 
 * Affiche :
 * - Header avec prénom et bouton profil
 * - Logo et titre de l'app
 * - Card "Nouvelle partie" avec actions
 * - Section "Comment ça marche"
 * - Banner Premium (si non premium)
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui";

// ============================================================
// TYPES
// ============================================================

interface HowToStep {
  number: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// ============================================================
// CONSTANTS
// ============================================================

const HOW_TO_STEPS: HowToStep[] = [
  {
    number: 1,
    title: "Créez une session",
    description: "Choisissez le nombre de défis et l'intensité de départ",
    icon: "add-circle-outline",
  },
  {
    number: 2,
    title: "Partagez le code",
    description: "Envoyez le code à 6 caractères à votre partenaire",
    icon: "share-outline",
  },
  {
    number: 3,
    title: "Jouez ensemble",
    description: "Relevez les défis à tour de rôle et pimentez votre relation",
    icon: "heart-outline",
  },
];

// ============================================================
// COMPOSANTS
// ============================================================

/**
 * Logo de l'application avec cœurs
 */
function AppLogo() {
  return (
    <View className="items-center mb-2">
      {/* Cœurs */}
      <View className="flex-row items-center justify-center">
        <Text className="text-5xl">💕</Text>
      </View>
      
      {/* Titre */}
      <Text className="text-3xl font-bold text-gray-800 mt-3">
        Couple Challenge
      </Text>
      
      {/* Sous-titre */}
      <Text className="text-base text-gray-500 text-center mt-2 px-8">
        Pimentez votre relation avec des défis sensuels
      </Text>
    </View>
  );
}

/**
 * Card "Nouvelle partie"
 */
function NewGameCard() {
  return (
    <View className="bg-white rounded-3xl p-6 shadow-sm mx-4 mt-6">
      {/* Header de la card */}
      <View className="flex-row items-center mb-5">
        <View className="bg-pink-100 p-3 rounded-2xl">
          <Ionicons name="game-controller-outline" size={24} color="#EC4899" />
        </View>
        <Text className="text-xl font-bold text-gray-800 ml-4">
          Nouvelle partie
        </Text>
      </View>
      
      {/* Boutons */}
      <Link href="/(main)/create-session" asChild>
        <Button
          title="Créer une session"
          variant="primary"
          size="lg"
          fullWidth
          icon={<Ionicons name="add-circle-outline" size={22} color="#FFF" />}
        />
      </Link>
      
      <View className="h-3" />
      
      <Link href="/(main)/join-session" asChild>
        <Button
          title="Rejoindre une session"
          variant="outline"
          size="lg"
          fullWidth
          icon={<Ionicons name="enter-outline" size={22} color="#EC4899" />}
        />
      </Link>
    </View>
  );
}

/**
 * Étape "Comment ça marche"
 */
function HowToStepItem({ step }: { step: HowToStep }) {
  return (
    <View className="flex-row items-start mb-4">
      {/* Numéro */}
      <View className="bg-pink-500 w-8 h-8 rounded-full items-center justify-center mr-4">
        <Text className="text-white font-bold text-sm">{step.number}</Text>
      </View>
      
      {/* Contenu */}
      <View className="flex-1">
        <View className="flex-row items-center">
          <Ionicons name={step.icon} size={18} color="#EC4899" />
          <Text className="text-base font-semibold text-gray-800 ml-2">
            {step.title}
          </Text>
        </View>
        <Text className="text-sm text-gray-500 mt-1">
          {step.description}
        </Text>
      </View>
    </View>
  );
}

/**
 * Section "Comment ça marche"
 */
function HowToSection() {
  return (
    <View className="bg-white rounded-3xl p-6 mx-4 mt-6 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center mb-5">
        <View className="bg-pink-100 p-3 rounded-2xl">
          <Ionicons name="help-circle-outline" size={24} color="#EC4899" />
        </View>
        <Text className="text-xl font-bold text-gray-800 ml-4">
          Comment ça marche ?
        </Text>
      </View>
      
      {/* Étapes */}
      {HOW_TO_STEPS.map((step) => (
        <HowToStepItem key={step.number} step={step} />
      ))}
    </View>
  );
}

/**
 * Banner Premium
 */
function PremiumBanner() {
  return (
    <TouchableOpacity
      onPress={() => router.push("/(main)/premium")}
      activeOpacity={0.9}
      className="mx-4 mt-6 mb-4"
    >
      <LinearGradient
        colors={["#EC4899", "#F472B6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="rounded-3xl p-5"
      >
        <View className="flex-row items-center justify-between">
          {/* Contenu */}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-xl">👑</Text>
              <Text className="text-lg font-bold text-white ml-2">
                Passez Premium
              </Text>
            </View>
            <Text className="text-sm text-white/90 mt-1">
              Débloquez tous les défis et fonctionnalités
            </Text>
          </View>
          
          {/* Flèche */}
          <View className="bg-white/20 p-2 rounded-full">
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * Section Dev Tools (mode développement uniquement)
 */
function DevToolsSection({ onLogout }: { onLogout: () => void }) {
  return (
    <View className="mx-4 mt-6 mb-4 p-4 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
      <View className="flex-row items-center mb-3">
        <Ionicons name="construct-outline" size={20} color="#6B7280" />
        <Text className="text-gray-600 font-bold ml-2">
          🛠️ Outils Développeur
        </Text>
      </View>
      
      {/* Bouton Déconnexion */}
      <TouchableOpacity
        onPress={onLogout}
        className="bg-gray-400 py-2 px-4 rounded-xl flex-row items-center justify-center"
      >
        <Ionicons name="log-out-outline" size={18} color="#FFF" />
        <Text className="text-white font-medium ml-2 text-sm">
          Se déconnecter
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// ÉCRAN PRINCIPAL
// ============================================================

export default function HomeScreen() {
  const { userData, isPremium, logout } = useAuth();
  
  // Extraire le prénom (premier mot du displayName)
  const firstName = userData?.displayName?.split(" ")[0] || "Joueur";

  return (
    <SafeAreaView className="flex-1 bg-pink-50" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* ========== HEADER ========== */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View>
            <Text className="text-gray-500 text-sm">Bonjour</Text>
            <Text className="text-xl font-bold text-gray-800">
              {firstName} 👋
            </Text>
          </View>
          
          <Link href="/(main)/profile" asChild>
            <TouchableOpacity 
              className="bg-white p-3 rounded-full shadow-sm"
              activeOpacity={0.8}
            >
              <Ionicons name="person-outline" size={24} color="#EC4899" />
            </TouchableOpacity>
          </Link>
        </View>

        {/* ========== LOGO & TITRE ========== */}
        <View className="mt-4">
          <AppLogo />
        </View>

        {/* ========== CARD NOUVELLE PARTIE ========== */}
        <NewGameCard />

        {/* ========== COMMENT ÇA MARCHE ========== */}
        <HowToSection />

        {/* ========== PREMIUM BANNER ========== */}
        {!isPremium && <PremiumBanner />}

        {/* ========== DEV TOOLS (Dev only) ========== */}
        {__DEV__ && <DevToolsSection onLogout={logout} />}
      </ScrollView>
    </SafeAreaView>
  );
}