/**
 * Point d'entrée de l'application
 * Redirige vers (auth) ou (main) selon l'état de connexion
 */

import { Redirect } from "expo-router";
import { useAuthStore } from "../stores/authStore";

export default function Index() {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  
  if (firebaseUser) {
    return <Redirect href="/(main)" />;
  }
  
  return <Redirect href="/(auth)/login" />;
}