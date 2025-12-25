/**
 * Layout racine de l'application - OPTIMISÉ PRODUCTION
 *
 * Gère :
 * - L'initialisation de l'authentification (UNE SEULE FOIS)
 * - L'affichage du loading initial
 * - La configuration globale de la navigation
 * - Le mode immersif Android (barre de navigation masquée)
 */

import React, { useEffect } from "react";
import { Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore, initializeAuthListeners } from "../stores/authStore";
import { LoadingScreen } from "../components/ui/LoadingSpinner";

import "../global.css";

// Empêcher le splash screen de se cacher automatiquement
try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  // Ignorer silencieusement en production
}

/**
 * Configure le mode immersif Android
 * Masque la barre de navigation pour une expérience plein écran
 * Import dynamique pour éviter le crash si le module natif n'est pas disponible
 */
const setupImmersiveMode = async (): Promise<void> => {
  if (Platform.OS !== "android") return;

  try {
    // Import dynamique pour éviter le crash au chargement
    const NavigationBar = await import("expo-navigation-bar");
    
    // Masquer la barre de navigation
    await NavigationBar.setVisibilityAsync("hidden");
    
    // Configurer le comportement : réapparaît avec un swipe depuis le bas
    await NavigationBar.setBehaviorAsync("overlay-swipe");
    
    // Rendre la barre transparente quand elle apparaît
    await NavigationBar.setBackgroundColorAsync("#00000000");
    
    // Position absolue pour overlay
    await NavigationBar.setPositionAsync("absolute");
  } catch (error) {
    // Ignorer silencieusement les erreurs de navigation bar
    // Le module natif peut ne pas être disponible
    console.log("NavigationBar non disponible:", error);
  }
};

export default function RootLayout() {
  // Sélectionner uniquement les valeurs nécessaires (pas de fonctions)
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Initialiser les listeners Firebase UNE SEULE FOIS
  useEffect(() => {
    const cleanup = initializeAuthListeners();
    return () => cleanup();
  }, []);

  // Configurer le mode immersif au démarrage
  useEffect(() => {
    setupImmersiveMode();
  }, []);

  // Cacher le splash screen quand l'auth est initialisée
  useEffect(() => {
    const hideSplash = async () => {
      if (isInitialized) {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // Ignorer silencieusement
        }
      }
    };
    
    hideSplash();
  }, [isInitialized]);

  // Afficher le loading pendant l'initialisation
  if (!isInitialized || isLoading) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 bg-pink-50">
          <StatusBar style="dark" translucent backgroundColor="transparent" />
          <LoadingScreen message="Chargement..." />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FDF2F8" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}