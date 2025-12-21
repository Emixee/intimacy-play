/**
 * Point d'entrée de l'application
 *
 * Redirige vers :
 * - (auth)/login si non connecté
 * - (main) si connecté
 */

import { useEffect } from "react";
import { router } from "expo-router";
import { View } from "react-native";
import { useAuthStore } from "../stores/authStore";
import { LoadingScreen } from "../components/ui/LoadingSpinner";

export default function Index() {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;

    // Utiliser setTimeout pour éviter les problèmes de navigation
    const timer = setTimeout(() => {
      if (firebaseUser) {
        router.replace("/(main)");
      } else {
        router.replace("/(auth)/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [firebaseUser, isInitialized]);

  // Afficher un écran de chargement pendant la redirection
  return (
    <View className="flex-1 bg-pink-50">
      <LoadingScreen message="Chargement..." />
    </View>
  );
}