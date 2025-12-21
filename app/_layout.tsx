/**
 * Layout racine de l'application
 *
 * Gère :
 * - L'initialisation de l'authentification
 * - L'affichage du loading initial
 * - La configuration globale de la navigation
 */

import React, { useEffect } from "react";
import { Stack, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { LoadingScreen } from "../components/ui/LoadingSpinner";

import "../global.css";

// Empêcher le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isInitialized, isLoading } = useAuth();

  // Cacher le splash screen quand l'auth est initialisée
  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  // Afficher le loading pendant l'initialisation
  if (!isInitialized || isLoading) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 bg-pink-50">
          <StatusBar style="dark" />
          <LoadingScreen message="Chargement..." />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
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