/**
 * Layout pour les écrans principaux
 *
 * - Redirige vers (auth)/login si l'utilisateur n'est pas connecté
 * - Initialise les notifications push
 */

import { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { useNotifications } from "../../hooks/useNotifications";

export default function MainLayout() {
  // Sélectionner uniquement les valeurs primitives nécessaires
  const firebaseUserId = useAuthStore((state) => state.firebaseUser?.uid ?? null);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  
  // Ref pour éviter les redirections multiples
  const hasRedirectedRef = useRef(false);

  // Initialiser les notifications push
  useNotifications();

  useEffect(() => {
    // Rediriger si non connecté (une seule fois)
    if (isInitialized && !firebaseUserId && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      router.replace("/(auth)/login");
    }
    
    // Reset le flag si l'utilisateur se connecte
    if (firebaseUserId) {
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
      <Stack.Screen
        name="index"
        options={{
          title: "Accueil",
        }}
      />
      <Stack.Screen
        name="create-session"
        options={{
          title: "Créer une session",
        }}
      />
      <Stack.Screen
        name="join-session"
        options={{
          title: "Rejoindre",
        }}
      />
      <Stack.Screen
        name="waiting-room"
        options={{
          title: "En attente...",
        }}
      />
      <Stack.Screen
        name="game"
        options={{
          title: "Jeu",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: "Profil",
        }}
      />
      <Stack.Screen
        name="premium"
        options={{
          title: "Premium",
        }}
      />
    </Stack>
  );
}