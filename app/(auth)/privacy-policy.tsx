/**
 * Écran Politique de Confidentialité
 *
 * Affiche la politique de confidentialité de l'application
 * Accessible depuis l'écran d'inscription
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  PRIVACY_POLICY,
  COMPANY_INFO,
  LEGAL_CONFIG,
  LegalSection,
} from "../../data/legal";

// ============================================================
// COMPOSANT SECTION
// ============================================================

interface SectionProps {
  section: LegalSection;
}

const Section: React.FC<SectionProps> = ({ section }) => {
  return (
    <View className="mb-6">
      <Text className="text-lg font-bold text-gray-800 mb-3">
        {section.title}
      </Text>
      {section.content.map((paragraph, index) => {
        // Détection des avertissements
        const isWarning = paragraph.startsWith("⚠️");
        // Détection des puces
        const isBullet = paragraph.startsWith("•");
        // Détection des lignes vides (pour l'espacement)
        const isEmpty = paragraph.trim() === "";

        if (isEmpty) {
          return <View key={index} className="h-2" />;
        }

        if (isWarning) {
          return (
            <View
              key={index}
              className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2"
            >
              <Text className="text-amber-800 font-medium">{paragraph}</Text>
            </View>
          );
        }

        return (
          <Text
            key={index}
            className={`text-gray-600 leading-6 ${
              isBullet ? "ml-2 mb-1" : "mb-2"
            }`}
          >
            {paragraph}
          </Text>
        );
      })}
    </View>
  );
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-pink-100 bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-xl font-bold text-gray-800 ml-2">
          Politique de Confidentialité
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6"
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête du document */}
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <View className="items-center mb-4">
            <Text className="text-4xl mb-2">🔒</Text>
            <Text className="text-2xl font-bold text-pink-500 text-center">
              Politique de Confidentialité
            </Text>
          </View>

          <View className="space-y-1">
            <Text className="text-gray-600 text-center">
              Application : <Text className="font-medium">Couple Challenge</Text>
            </Text>
            <Text className="text-gray-600 text-center">
              Éditeur : <Text className="font-medium">{COMPANY_INFO.name}</Text>
            </Text>
            <Text className="text-gray-600 text-center">
              Version : <Text className="font-medium">{LEGAL_CONFIG.version}</Text>
            </Text>
            <Text className="text-gray-500 text-center text-sm mt-2">
              Dernière mise à jour : {LEGAL_CONFIG.lastUpdate}
            </Text>
          </View>
        </View>

        {/* Avertissement principal */}
        <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center mb-2">
            <Ionicons name="warning" size={24} color="#DC2626" />
            <Text className="text-red-700 font-bold ml-2 text-lg">
              Application 18+
            </Text>
          </View>
          <Text className="text-red-600">
            Cette application contient du contenu à caractère adulte et érotique.
            En l'utilisant, vous confirmez avoir au moins {LEGAL_CONFIG.minAge} ans.
          </Text>
        </View>

        {/* Sections de la politique */}
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          {PRIVACY_POLICY.map((section) => (
            <Section key={section.id} section={section} />
          ))}

          {/* Pied de document */}
          <View className="border-t border-gray-200 pt-4 mt-4">
            <Text className="text-gray-500 text-sm text-center italic">
              Document rédigé conformément au RGPD (Règlement UE 2016/679)
              et à la loi Informatique et Libertés
            </Text>
          </View>
        </View>

        {/* Bouton retour */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-pink-500 rounded-2xl py-4 mt-6 mb-4"
        >
          <Text className="text-white text-center font-bold text-lg">
            J'ai compris
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}