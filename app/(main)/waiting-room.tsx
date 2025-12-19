/**
 * Écran salle d'attente
 * TODO: Implémenter l'écoute temps réel
 */

import React from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui";

export default function WaitingRoomScreen() {
  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-10">
          <Text className="text-5xl">⏳</Text>
          <Text className="text-2xl font-bold text-gray-800 mt-4">
            En attente...
          </Text>
          <Text className="text-gray-500 mt-2">
            En attente de votre partenaire
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm items-center">
          <Text className="text-gray-500 mb-2">Code de session</Text>
          <Text className="text-3xl font-bold text-pink-500 tracking-widest">
            ABC 123
          </Text>
          
          <Button
            title="Annuler"
            variant="outline"
            fullWidth
            onPress={() => router.replace("/(main)")}
            className="mt-6"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}