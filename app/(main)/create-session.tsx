/**
 * Écran de création de session
 * TODO: Implémenter le formulaire complet
 */

import React from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui";

export default function CreateSessionScreen() {
  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-10">
          <Text className="text-5xl">🎮</Text>
          <Text className="text-2xl font-bold text-gray-800 mt-4">
            Créer une session
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-center text-gray-600 mb-6">
            Configuration de session à implémenter
          </Text>
          
          <Button
            title="Retour"
            variant="outline"
            fullWidth
            onPress={() => router.back()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}