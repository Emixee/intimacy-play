/**
 * Layout pour les écrans principaux
 * Redirige vers (auth) si non connecté
 */

import { Stack, Redirect } from "expo-router";
import { useAuthStore } from "../../stores/authStore";

export default function MainLayout() {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);

  if (!firebaseUser) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FDF2F8" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Accueil" }} />
      <Stack.Screen name="create-session" options={{ title: "Créer une session" }} />
      <Stack.Screen name="join-session" options={{ title: "Rejoindre" }} />
      <Stack.Screen name="waiting-room" options={{ title: "En attente..." }} />
      <Stack.Screen name="game" options={{ title: "Jeu" }} />
      <Stack.Screen name="profile" options={{ title: "Profil" }} />
    </Stack>
  );
}