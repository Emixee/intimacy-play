/**
 * Layout pour les écrans d'authentification
 * Redirige vers (main) si déjà connecté
 */

import { Stack, Redirect } from "expo-router";
import { useAuthStore } from "../../stores/authStore";

export default function AuthLayout() {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);

  if (firebaseUser) {
    return <Redirect href="/(main)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FDF2F8" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}