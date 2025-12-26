/**
 * Layout racine de l'application - VERSION CORRIGÉE
 *
 * FIX: Ne bloque plus sur isLoading, uniquement sur isInitialized
 * Cela évite le chargement infini après login
 */

import React, { useEffect } from "react";
import { Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
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
 */
const setupImmersiveMode = async (): Promise<void> => {
  if (Platform.OS !== "android") return;

  try {
    await NavigationBar.setVisibilityAsync("hidden");
    await NavigationBar.setBehaviorAsync("overlay-swipe");
    await NavigationBar.setBackgroundColorAsync("#00000000");
    await NavigationBar.setPositionAsync("absolute");
  } catch (error) {
    // Ignorer silencieusement
  }
};

export default function RootLayout() {
  // Sélectionner uniquement isInitialized
  // FIX: On ne bloque plus sur isLoading pour éviter le chargement infini
  const isInitialized = useAuthStore((state) => state.isInitialized);

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

  // FIX: Afficher le loading UNIQUEMENT pendant l'initialisation
  // Avant: if (!isInitialized || isLoading) - causait le blocage
  // Après: if (!isInitialized) - ne bloque que le temps nécessaire
  if (!isInitialized) {
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
