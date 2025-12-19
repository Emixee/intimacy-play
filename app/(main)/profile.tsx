/**
 * Écran de profil utilisateur
 * TODO: Implémenter le profil complet
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/authStore";
import { auth } from "../../config/firebase";
import { Button } from "../../components/ui";

export default function ProfileScreen() {
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
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800 ml-4">Mon Profil</Text>
      </View>

      {/* Content */}
      <View className="flex-1 px-6">
        {/* Avatar et nom */}
        <View className="items-center py-8">
          <View className="w-24 h-24 bg-pink-200 rounded-full items-center justify-center">
            <Text className="text-4xl">
              {userData?.gender === "femme" ? "👩" : "👨"}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-gray-800 mt-4">
            {userData?.displayName || "Utilisateur"}
          </Text>
          <Text className="text-gray-500">{userData?.email}</Text>
          
          {/* Badge Premium */}
          <View className="flex-row items-center mt-2 bg-gray-100 px-3 py-1 rounded-full">
            <Ionicons
              name={userData?.premium ? "star" : "star-outline"}
              size={16}
              color={userData?.premium ? "#F59E0B" : "#9CA3AF"}
            />
            <Text
              className={`ml-1 ${
                userData?.premium ? "text-amber-500" : "text-gray-500"
              }`}
            >
              {userData?.premium ? "Premium" : "Gratuit"}
            </Text>
          </View>
        </View>

        {/* Options */}
        <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <Ionicons name="person-outline" size={24} color="#6B7280" />
            <Text className="flex-1 ml-4 text-gray-800">Modifier le profil</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <Ionicons name="diamond-outline" size={24} color="#6B7280" />
            <Text className="flex-1 ml-4 text-gray-800">Passer Premium</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4">
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
            <Text className="flex-1 ml-4 text-gray-800">Paramètres</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <View className="mt-6">
          <Button
            title="Se déconnecter"
            variant="danger"
            fullWidth
            onPress={handleLogout}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}