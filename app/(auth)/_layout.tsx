/**
 * Layout pour les écrans d'authentification
 *
 * Redirige vers (main) si l'utilisateur est déjà connecté
 */

import { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import { useAuthStore } from "../../stores/authStore";

export default function AuthLayout() {
  // Sélectionner uniquement les valeurs primitives
  const firebaseUserId = useAuthStore((state) => state.firebaseUser?.uid ?? null);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  
  // Ref pour éviter les redirections multiples
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Rediriger si connecté (une seule fois)
    if (isInitialized && firebaseUserId && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      router.replace("/(main)");
    }
    
    // Reset le flag si l'utilisateur se déconnecte
    if (!firebaseUserId) {
      hasRedirectedRef.current = false;
    }
  }, [firebaseUserId, isInitialized]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FDF2F8" },
        animation: "slide_from_right",
      }}
    >
      {/* Écran d'accueil (premier écran visible) */}
      <Stack.Screen
        name="welcome"
        options={{
          title: "Bienvenue",
          animation: "fade",
        }}
      />
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