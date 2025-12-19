/**
 * Écran d'inscription
 * TODO: Implémenter le formulaire complet
 */

import React from "react";
import { View, Text } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui";

export default function RegisterScreen() {
  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <View className="flex-1 px-6 justify-center">
        {/* Titre */}
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-gray-800">
            Créer un compte
          </Text>
          <Text className="text-gray-500 mt-2">
            Rejoignez l'aventure
          </Text>
        </View>

        {/* Placeholder */}
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-center text-gray-600 mb-6">
            Formulaire d'inscription à implémenter
          </Text>
          
          <Link href="/(auth)/login" asChild>
            <Button title="Retour à la connexion" variant="outline" fullWidth />
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}