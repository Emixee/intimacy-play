/**
 * Layout de navigation pour le groupe (auth)
 *
 * Gère la navigation entre les écrans d'authentification :
 * - welcome (écran d'accueil)
 * - login (connexion)
 * - register (inscription)
 * - forgot-password (réinitialisation)
 * - terms-of-use (CGU)
 * - privacy-policy (politique de confidentialité)
 *
 * Redirige vers (main) si l'utilisateur est déjà connecté
 */

import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import { useAuthStore, selectIsAuthenticated } from "../../stores/authStore";

export default function AuthLayout() {
  // Vérifier si l'utilisateur est connecté (via selector)
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  // Rediriger vers main si déjà connecté
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace("/(main)");
    }
  }, [isInitialized, isAuthenticated]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FDF2F8" },
        animation: "slide_from_right",
      }}
    >
      {/* Écran d'accueil */}
      <Stack.Screen
        name="welcome"
        options={{
          headerShown: false,
        }}
      />

      {/* Connexion */}
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />

      {/* Inscription */}
      <Stack.Screen
        name="register"
        options={{
          headerShown: false,
        }}
      />

      {/* Mot de passe oublié */}
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />

      {/* CGU - Accessible via lien dans register */}
      <Stack.Screen
        name="terms-of-use"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />

      {/* Politique de confidentialité - Accessible via lien dans register */}
      <Stack.Screen
        name="privacy-policy"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
    </Stack>
  );
}