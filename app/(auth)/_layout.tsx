/**
 * Layout pour les écrans d'authentification
 *
 * Redirige vers (main) si l'utilisateur est déjà connecté
 */

import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { useAuthStore } from "../../stores/authStore";

export default function AuthLayout() {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    // Rediriger si connecté
    if (isInitialized && firebaseUser) {
      router.replace("/(main)");
    }
  }, [firebaseUser, isInitialized]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FDF2F8" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Connexion",
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Inscription",
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: "Mot de passe oublié",
        }}
      />
    </Stack>
  );
}