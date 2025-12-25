/**
 * Layout racine de l'application - OPTIMISÉ PRODUCTION
 *
 * Gère :
 * - L'initialisation de l'authentification (UNE SEULE FOIS)
 * - L'affichage du loading initial
 * - La configuration globale de la navigation
 */

import React, { useEffect } from "react";
import { Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
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

export default function RootLayout() {
  // Sélectionner uniquement les valeurs nécessaires (pas de fonctions)
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Initialiser les listeners Firebase UNE SEULE FOIS
  useEffect(() => {
    const cleanup = initializeAuthListeners();
    return () => cleanup();
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