/**
 * Écran d'accueil principal
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/authStore";
import { auth } from "../../config/firebase";
import { Button } from "../../components/ui";

export default function HomeScreen() {
  const userData = useAuthStore((state) => state.userData);

  const handleLogout = async () => {
    try {
      await auth().signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-gray-500 text-sm">Bienvenue</Text>
          <Text className="text-xl font-bold text-gray-800">
            {userData?.displayName || "Joueur"} 👋
          </Text>
        </View>
        
        <Link href="/(main)/profile" asChild>
          <TouchableOpacity className="bg-white p-3 rounded-full shadow-sm">
            <Ionicons name="person-outline" size={24} color="#EC4899" />
          </TouchableOpacity>
        </Link>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 justify-center">
        {/* Logo */}
        <View className="items-center mb-10">
          <Text className="text-6xl">💕</Text>
          <Text className="text-2xl font-bold text-gray-800 mt-4">
            Intimacy Play
          </Text>
        </View>

        {/* Actions principales */}
        <View>
          <Link href="/(main)/create-session" asChild>
            <Button
              title="Créer une session"
              variant="primary"
              size="lg"
              fullWidth
              icon={<Ionicons name="add-circle-outline" size={24} color="#FFF" />}
            />
          </Link>

          <Link href="/(main)/join-session" asChild>
            <Button
              title="Rejoindre une session"
              variant="outline"
              size="lg"
              fullWidth
              icon={<Ionicons name="enter-outline" size={24} color="#EC4899" />}
              className="mt-4"
            />
          </Link>
        </View>

        {/* Bouton déconnexion (temporaire pour test) */}
        <TouchableOpacity
          onPress={handleLogout}
          className="mt-8 items-center"
        >
          <Text className="text-gray-500">Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}