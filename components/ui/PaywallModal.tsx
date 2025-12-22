/**
 * PaywallModal - Modal d'upgrade vers Premium
 *
 * Modal réutilisable pour bloquer les features premium :
 * - Affiche l'avantage de la feature bloquée
 * - Propose l'upgrade vers Premium
 * - Intégré avec le subscription service
 *
 * PROMPT 7.2 : PaywallModal amélioré
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { Modal } from "./Modal";
import { PremiumFeature } from "../../services/subscription.service";
import { PRICING, PREMIUM_FEATURES } from "../../utils/constants";

// ============================================================
// TYPES
// ============================================================

interface PaywallModalProps {
  /** Visibilité de la modal */
  visible: boolean;
  /** Callback de fermeture */
  onClose: () => void;
  /** Callback d'achat (optionnel, sinon redirige vers /premium) */
  onPurchase?: (planId: string) => Promise<void>;
  /** Feature qui a déclenché le paywall (pour personnalisation) */
  feature?: PremiumFeature;
  /** Message personnalisé à afficher */
  customMessage?: string;
  /** Raison de l'affichage (pour le tracking) */
  triggerReason?: string;
}

// ============================================================
// CONFIGURATION DES FEATURES
// ============================================================

/** Configuration visuelle pour chaque feature */
const FEATURE_DISPLAY: Record<
  PremiumFeature,
  {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    benefit: string;
  }
> = {
  level4: {
    icon: "flame",
    title: "Niveaux Explicites",
    description: "Accédez aux défis les plus audacieux",
    benefit: "Débloquez les niveaux 3 et 4 pour une expérience sans limites",
  },
  unlimitedChanges: {
    icon: "refresh",
    title: "Changements illimités",
    description: "Ne soyez plus limité à 3 changements",
    benefit: "Changez de défi autant de fois que vous le souhaitez",
  },
  premiumReactions: {
    icon: "heart",
    title: "Réactions exclusives",
    description: "Exprimez-vous avec plus d'emojis",
    benefit: "6 réactions supplémentaires : 🥵💦👅🍑😈💋",
  },
  mediaPreferences: {
    icon: "camera",
    title: "Préférences médias",
    description: "Personnalisez les types de médias",
    benefit: "Choisissez exactement ce que vous voulez recevoir",
  },
  partnerNickname: {
    icon: "heart-circle",
    title: "Surnom personnalisé",
    description: "Donnez un petit nom à votre partenaire",
    benefit: "Personnalisez l'expérience avec un surnom unique",
  },
  premiumThemes: {
    icon: "color-palette",
    title: "Thèmes exclusifs",
    description: "22 thèmes pour varier les plaisirs",
    benefit: "BDSM, Fantasmes, Roleplay, Kamasutra et plus...",
  },
  downloadMedia: {
    icon: "download",
    title: "Téléchargement",
    description: "Gardez vos souvenirs",
    benefit: "Téléchargez les photos et vidéos reçues",
  },
  partnerChallenge: {
    icon: "create",
    title: "Défis personnalisés",
    description: "Créez vos propres défis",
    benefit: "Inventez des défis sur mesure pour votre partenaire",
  },
  extendedChallenges: {
    icon: "infinite",
    title: "Sessions étendues",
    description: "Jusqu'à 50 défis par session",
    benefit: "Des parties plus longues et plus intenses",
  },
  unlimitedGames: {
    icon: "game-controller",
    title: "Parties illimitées",
    description: "Jouez sans restriction",
    benefit: "Fini la limite de 3 parties par jour",
  },
  noAds: {
    icon: "ban",
    title: "Sans publicité",
    description: "Une expérience fluide",
    benefit: "Profitez sans interruption ni distraction",
  },
  allToys: {
    icon: "sparkles",
    title: "Défis avec jouets",
    description: "Pimentez vos sessions",
    benefit: "10 accessoires pour des défis encore plus excitants",
  },
};

/** Avantages à afficher dans la liste */
const QUICK_BENEFITS = [
  { icon: "flame", text: "Tous les niveaux débloqués" },
  { icon: "color-palette", text: "22 thèmes exclusifs" },
  { icon: "infinite", text: "Parties illimitées" },
  { icon: "ban", text: "Sans publicité" },
];

// ============================================================
// COMPOSANT
// ============================================================

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onPurchase,
  feature,
  customMessage,
  triggerReason,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les infos de la feature si spécifiée
  const featureInfo = feature ? FEATURE_DISPLAY[feature] : null;

  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------

  const handlePurchase = async () => {
    if (onPurchase) {
      // Utiliser le callback fourni
      setIsLoading(true);
      setError(null);

      try {
        const planId =
          selectedPlan === "monthly"
            ? PRICING.MONTHLY.googlePlayId
            : PRICING.YEARLY.googlePlayId;

        await onPurchase(planId);
        onClose();
      } catch (err: any) {
        setError(err.message || "Erreur lors de l'achat");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Rediriger vers la page premium
      onClose();
      router.push("/(main)/premium");
    }
  };

  const handleViewPlans = () => {
    onClose();
    router.push("/(main)/premium");
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      size="large"
      showCloseButton={true}
      closeOnOverlayPress={!isLoading}
    >
      <ScrollView
        className="max-h-[85vh]"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header avec gradient */}
        <LinearGradient
          colors={["#EC4899", "#DB2777"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-6 items-center rounded-t-2xl"
        >
          <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-3">
            {featureInfo ? (
              <Ionicons name={featureInfo.icon} size={32} color="white" />
            ) : (
              <Ionicons name="diamond" size={32} color="white" />
            )}
          </View>

          <Text className="text-xl font-bold text-white text-center">
            {featureInfo?.title || "Passez Premium"}
          </Text>

          <Text className="text-white/80 text-center mt-2 px-4">
            {customMessage ||
              featureInfo?.description ||
              "Débloquez toutes les fonctionnalités"}
          </Text>
        </LinearGradient>

        {/* Message spécifique à la feature */}
        {featureInfo && (
          <View className="mx-4 mt-4 p-4 bg-pink-50 rounded-xl border border-pink-200">
            <Text className="text-pink-700 text-center font-medium">
              {featureInfo.benefit}
            </Text>
          </View>
        )}

        {/* Liste des avantages rapides */}
        <View className="px-4 mt-4">
          <Text className="text-sm font-semibold text-gray-500 mb-3">
            Avec Premium, vous obtenez :
          </Text>

          {QUICK_BENEFITS.map((benefit, index) => (
            <View key={index} className="flex-row items-center py-2">
              <View className="w-8 h-8 bg-pink-100 rounded-full items-center justify-center mr-3">
                <Ionicons
                  name={benefit.icon as any}
                  size={16}
                  color="#EC4899"
                />
              </View>
              <Text className="flex-1 text-gray-700">{benefit.text}</Text>
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            </View>
          ))}
        </View>

        {/* Sélection du plan (si onPurchase fourni) */}
        {onPurchase && (
          <View className="px-4 mt-4">
            <Text className="text-sm font-semibold text-gray-500 mb-3">
              Choisissez votre formule :
            </Text>

            {/* Plan annuel */}
            <TouchableOpacity
              onPress={() => setSelectedPlan("yearly")}
              className={`p-4 rounded-xl border-2 mb-2 relative ${
                selectedPlan === "yearly"
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <View className="absolute -top-2 right-3 bg-green-500 px-2 py-0.5 rounded-full">
                <Text className="text-white text-xs font-bold">
                  -{PRICING.YEARLY.savingsPercent}%
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      selectedPlan === "yearly"
                        ? "border-pink-500 bg-pink-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedPlan === "yearly" && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                  <View>
                    <Text className="font-semibold text-gray-800">Annuel</Text>
                    <Text className="text-gray-500 text-xs">
                      {PRICING.YEARLY.monthlyEquivalentFormatted}
                    </Text>
                  </View>
                </View>
                <Text className="text-lg font-bold text-gray-800">
                  {PRICING.YEARLY.priceFormatted}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Plan mensuel */}
            <TouchableOpacity
              onPress={() => setSelectedPlan("monthly")}
              className={`p-4 rounded-xl border-2 ${
                selectedPlan === "monthly"
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      selectedPlan === "monthly"
                        ? "border-pink-500 bg-pink-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedPlan === "monthly" && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                  <Text className="font-semibold text-gray-800">Mensuel</Text>
                </View>
                <Text className="text-lg font-bold text-gray-800">
                  {PRICING.MONTHLY.priceFormatted}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Message d'erreur */}
        {error && (
          <View className="mx-4 mt-3 p-3 bg-red-50 rounded-lg">
            <Text className="text-red-600 text-center text-sm">{error}</Text>
          </View>
        )}

        {/* Boutons */}
        <View className="px-4 pt-4 pb-6">
          {/* Bouton principal */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={isLoading}
            className={`py-4 rounded-xl items-center ${
              isLoading ? "bg-gray-300" : "bg-pink-500 active:bg-pink-600"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {onPurchase ? "Débloquer avec Premium" : "Voir les offres"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Bouton secondaire si pas de onPurchase */}
          {!onPurchase && (
            <TouchableOpacity
              onPress={onClose}
              className="py-3 mt-2"
            >
              <Text className="text-gray-500 text-center">Plus tard</Text>
            </TouchableOpacity>
          )}

          {/* Infos légales si achat direct */}
          {onPurchase && (
            <Text className="text-gray-400 text-xs text-center mt-3">
              Paiement via Google Play. Annulable à tout moment.
            </Text>
          )}
        </View>
      </ScrollView>
    </Modal>
  );
};

// ============================================================
// EXPORT
// ============================================================

export default PaywallModal;