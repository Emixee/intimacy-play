/**
 * Écran d'accueil principal - Home Screen
 * 
 * FIX BUGS :
 * 1. Paramètre "code" au lieu de "sessionCode" pour navigation
 * 2. Code brut sans espace pour Firebase (affichage avec espace)
 */

import React, { useEffect, useState } from "react";
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
import { Button, LoadingSpinner } from "../../components/ui";
import { sessionService } from "../../services/session.service";

// ============================================================
// TYPES
// ============================================================

interface HowToStep {
  number: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ActiveSessionData {
  code: string;           // Code brut pour Firebase (sans espace)
  displayCode: string;    // Code formaté pour affichage (avec espace)
  status: "waiting" | "active";
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

function AppLogo() {
  return (
    <View className="items-center mb-2">
      <View className="flex-row items-center justify-center">
        <Text className="text-5xl">💕</Text>
      </View>
      
      <Text className="text-3xl font-bold text-gray-800 mt-3">
        Couple Challenge
      </Text>
      
      <Text className="text-base text-gray-500 text-center mt-2 px-8">
        Pimentez votre relation avec des défis sensuels
      </Text>
    </View>
  );
}

function ActiveSessionCard({ 
  displayCode,
  status,
  onResume,
}: { 
  displayCode: string;
  status: "waiting" | "active";
  onResume: () => void;
}) {
  const isWaiting = status === "waiting";
  
  return (
    <View className="bg-white rounded-3xl p-6 shadow-sm mx-4 mt-6 border-2 border-pink-200">
      <View className="flex-row items-center mb-4">
        <View className={`${isWaiting ? "bg-yellow-100" : "bg-green-100"} p-3 rounded-2xl`}>
          <Ionicons 
            name={isWaiting ? "hourglass-outline" : "play-circle"} 
            size={24} 
            color={isWaiting ? "#EAB308" : "#22C55E"} 
          />
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-xl font-bold text-gray-800">
            {isWaiting ? "En attente du partenaire" : "Session en cours"}
          </Text>
          <Text className="text-sm text-gray-500">
            Code : {displayCode}
          </Text>
        </View>
      </View>
      
      <Button
        title={isWaiting ? "Voir la session" : "Reprendre la partie"}
        variant="primary"
        size="lg"
        fullWidth
        icon={<Ionicons name={isWaiting ? "eye" : "play"} size={22} color="#FFF" />}
        onPress={onResume}
      />
    </View>
  );
}

function NewGameCard() {
  return (
    <View className="bg-white rounded-3xl p-6 shadow-sm mx-4 mt-6">
      <View className="flex-row items-center mb-5">
        <View className="bg-pink-100 p-3 rounded-2xl">
          <Ionicons name="game-controller-outline" size={24} color="#EC4899" />
        </View>
        <Text className="text-xl font-bold text-gray-800 ml-4">
          Nouvelle partie
        </Text>
      </View>
      
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

function HowToStepItem({ step }: { step: HowToStep }) {
  return (
    <View className="flex-row items-start mb-4">
      <View className="bg-pink-500 w-8 h-8 rounded-full items-center justify-center mr-4">
        <Text className="text-white font-bold text-sm">{step.number}</Text>
      </View>
      
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

function HowToSection() {
  return (
    <View className="bg-white rounded-3xl p-6 mx-4 mt-6 shadow-sm">
      <View className="flex-row items-center mb-5">
        <View className="bg-pink-100 p-3 rounded-2xl">
          <Ionicons name="help-circle-outline" size={24} color="#EC4899" />
        </View>
        <Text className="text-xl font-bold text-gray-800 ml-4">
          Comment ça marche ?
        </Text>
      </View>
      
      {HOW_TO_STEPS.map((step) => (
        <HowToStepItem key={step.number} step={step} />
      ))}
    </View>
  );
}

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
          
          <View className="bg-white/20 p-2 rounded-full">
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function DevToolsSection({ onLogout }: { onLogout: () => void }) {
  return (
    <View className="mx-4 mt-6 mb-4 p-4 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
      <View className="flex-row items-center mb-3">
        <Ionicons name="construct-outline" size={20} color="#6B7280" />
        <Text className="text-gray-600 font-bold ml-2">
          🛠️ Outils Développeur
        </Text>
      </View>
      
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
  
  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  const firstName = userData?.displayName?.split(" ")[0] || "Joueur";

  // ============================================================
  // VÉRIFIER LES SESSIONS ACTIVES AU DÉMARRAGE
  // ============================================================
  useEffect(() => {
    const checkActiveSessions = async () => {
      if (!userData?.id) {
        setIsCheckingSession(false);
        return;
      }

      try {
        console.log("[HomeScreen] Checking for active sessions...");
        const result = await sessionService.getActiveSessions(userData.id);
        
        if (result.success && result.data && result.data.length > 0) {
          const activeSessionData = result.data.find(s => s.status === "active");
          const waitingSessionData = result.data.find(s => s.status === "waiting");
          
          const sessionToShow = activeSessionData || waitingSessionData;
          
          if (sessionToShow) {
            console.log("[HomeScreen] Found session:", sessionToShow.id, "status:", sessionToShow.status);
            
            // FIX: Stocker le code BRUT (sans espace) et le code AFFICHÉ (avec espace)
            const rawCode = sessionToShow.id;
            const displayCode = rawCode.length === 6 
              ? `${rawCode.slice(0, 3)} ${rawCode.slice(3)}`
              : rawCode;
            
            setActiveSession({
              code: rawCode,
              displayCode: displayCode,
              status: sessionToShow.status as "waiting" | "active",
            });
          }
        } else {
          console.log("[HomeScreen] No active sessions found");
        }
      } catch (error) {
        console.error("[HomeScreen] Error checking sessions:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkActiveSessions();
  }, [userData?.id]);

  // ============================================================
  // HANDLERS
  // ============================================================
  
  const handleResumeSession = () => {
    if (!activeSession) return;
    
    // FIX: Utiliser le code BRUT et le paramètre "code"
    console.log("[HomeScreen] Resuming session with code:", activeSession.code);
    
    if (activeSession.status === "active") {
      router.push({
        pathname: "/(main)/game",
        params: { code: activeSession.code },
      });
    } else {
      router.push({
        pathname: "/(main)/waiting-room",
        params: { code: activeSession.code },
      });
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (isCheckingSession) {
    return (
      <SafeAreaView className="flex-1 bg-pink-50 items-center justify-center">
        <LoadingSpinner size="large" color="#EC4899" />
        <Text className="text-gray-500 mt-4">Vérification en cours...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-pink-50" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
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

        <View className="mt-4">
          <AppLogo />
        </View>

        {activeSession && (
          <ActiveSessionCard 
            displayCode={activeSession.displayCode}
            status={activeSession.status}
            onResume={handleResumeSession}
          />
        )}

        {!activeSession && <NewGameCard />}

        <HowToSection />

        {!isPremium && <PremiumBanner />}

        {__DEV__ && <DevToolsSection onLogout={logout} />}
      </ScrollView>
    </SafeAreaView>
  );
}