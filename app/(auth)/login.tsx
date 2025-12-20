/**
 * Écran de connexion
 * TODO: Implémenter le formulaire complet
 */

import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui";
import { testFirebaseConnection } from "../../config/firebase-test";

export default function LoginScreen() {

  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <View className="flex-1 px-6 justify-center">
        {/* Logo / Titre */}
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-pink-500">💕</Text>
          <Text className="text-3xl font-bold text-gray-800 mt-2">
            Intimacy Play
          </Text>
          <Text className="text-gray-500 mt-2">
            Ravivez la flamme à distance
          </Text>
        </View>

        {/* Placeholder */}
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-center text-gray-600 mb-6">
            Écran de connexion à implémenter
          </Text>
          
          <Link href="/(auth)/register" asChild>
            <Button title="Créer un compte" variant="primary" fullWidth />
          </Link>
          
          <Link href="/(auth)/forgot-password" asChild>
            <Button
              title="Mot de passe oublié"
              variant="ghost"
              fullWidth
              className="mt-4"
            />
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}