/**
 * Écran Premium - Placeholder
 * 
 * TODO: Implémenter l'écran complet avec les offres d'abonnement
 */

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function PremiumScreen() {
  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-800 ml-2">
          Premium
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center px-6">
        <LinearGradient
          colors={["#EC4899", "#F472B6"]}
          className="w-24 h-24 rounded-full items-center justify-center mb-6"
        >
          <Text className="text-5xl">👑</Text>
        </LinearGradient>

        <Text className="text-2xl font-bold text-gray-800 text-center">
          Passez Premium
        </Text>

        <Text className="text-base text-gray-500 text-center mt-3 px-4">
          Débloquez tous les défis de niveau 3 et 4, et profitez d'une expérience sans limites.
        </Text>

        {/* Prix */}
        <View className="bg-white rounded-2xl p-6 mt-8 w-full shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-800">Mensuel</Text>
            <Text className="text-xl font-bold text-pink-500">6,99€/mois</Text>
          </View>
          
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-semibold text-gray-800">Annuel</Text>
              <Text className="text-sm text-green-500">Économisez 33%</Text>
            </View>
            <Text className="text-xl font-bold text-pink-500">39,99€/an</Text>
          </View>
        </View>

        {/* Placeholder */}
        <Text className="text-sm text-gray-400 mt-8 text-center">
          Les achats in-app seront implémentés prochainement
        </Text>
      </View>
    </SafeAreaView>
  );
}