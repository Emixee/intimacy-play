/**
 * Écran Premium - Page d'abonnement
 *
 * Affiche les offres d'abonnement Premium avec :
 * - Header accrocheur
 * - Tableau comparatif Gratuit vs Premium
 * - Cards des 2 offres (Mensuel / Annuel)
 * - Boutons d'achat
 * - Lien restauration et CGV
 *
 * PROMPT 7.2 : Écran Premium
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useAuthStore } from "../../stores/authStore";
import { useSubscriptionStore } from "../../stores/subscriptionStore";
import { iapService, IAPProduct, PRODUCT_IDS } from "../../services/iap.service";
import { PRICING, PREMIUM_FEATURES } from "../../utils/constants";

// ============================================================
// CONSTANTES
// ============================================================

/** URL des CGV */
const CGV_URL = "https://intimacy-play.com/terms";

/** Tableau comparatif */
const COMPARISON_TABLE = [
  { feature: "Niveaux 1-2", free: true, premium: true },
  { feature: "Niveaux 3-4 (Érotique & Explicite)", free: false, premium: true },
  { feature: "2 thèmes de base", free: true, premium: true },
  { feature: "22 thèmes exclusifs", free: false, premium: true },
  { feature: "Jusqu'à 10 défis par session", free: true, premium: true },
  { feature: "Jusqu'à 50 défis par session", free: false, premium: true },
  { feature: "3 parties par jour", free: true, premium: false },
  { feature: "Parties illimitées", free: false, premium: true },
  { feature: "4 réactions de base", free: true, premium: true },
  { feature: "6 réactions exclusives", free: false, premium: true },
  { feature: "Défis avec jouets", free: false, premium: true },
  { feature: "Sans publicité", free: false, premium: true },
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function PremiumScreen() {
  // State
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stores
  const { user } = useAuthStore();
  const { isPremium, loadSubscriptionStatus } = useSubscriptionStore();

  // ----------------------------------------------------------
  // CHARGEMENT DES PRODUITS
  // ----------------------------------------------------------

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    setError(null);

    try {
      // Initialiser IAP
      const initResult = await iapService.initIAP();
      if (!initResult.success) {
        setError(initResult.error || "Erreur d'initialisation");
        setIsLoadingProducts(false);
        return;
      }

      // Récupérer les produits
      const productsResult = await iapService.getProducts();
      if (productsResult.success && productsResult.data) {
        setProducts(productsResult.data);
      } else {
        setError(productsResult.error || "Impossible de charger les offres");
      }
    } catch (err: any) {
      setError("Erreur de connexion au store");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // ----------------------------------------------------------
  // ACHAT
  // ----------------------------------------------------------

  const handlePurchase = async () => {
    if (!user?.id) {
      Alert.alert("Erreur", "Vous devez être connecté pour vous abonner");
      return;
    }

    const productId = selectedPlan === "monthly" 
      ? PRODUCT_IDS.MONTHLY 
      : PRODUCT_IDS.YEARLY;

    setIsPurchasing(true);
    setError(null);

    try {
      const result = await iapService.purchaseSubscription(productId, user.id);

      if (result.success && result.data?.success) {
        // Rafraîchir le statut
        await loadSubscriptionStatus(user.id);

        Alert.alert(
          "Bienvenue ! 🎉",
          "Votre abonnement Premium est maintenant actif. Profitez de toutes les fonctionnalités !",
          [{ text: "Super !", onPress: () => router.back() }]
        );
      } else if (result.data?.error === "Achat annulé") {
        // L'utilisateur a annulé, ne rien faire
      } else {
        setError(result.data?.error || result.error || "Erreur lors de l'achat");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'achat");
    } finally {
      setIsPurchasing(false);
    }
  };

  // ----------------------------------------------------------
  // RESTAURATION
  // ----------------------------------------------------------

  const handleRestore = async () => {
    if (!user?.id) {
      Alert.alert("Erreur", "Vous devez être connecté");
      return;
    }

    setIsRestoring(true);
    setError(null);

    try {
      const result = await iapService.restorePurchases(user.id);

      if (result.success && result.data?.restored) {
        await loadSubscriptionStatus(user.id);

        Alert.alert(
          "Achats restaurés ! ✅",
          "Votre abonnement Premium a été restauré avec succès.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else if (result.success && !result.data?.restored) {
        Alert.alert(
          "Aucun achat trouvé",
          "Aucun abonnement Premium n'a été trouvé pour ce compte."
        );
      } else {
        setError(result.error || "Erreur lors de la restauration");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la restauration");
    } finally {
      setIsRestoring(false);
    }
  };

  // ----------------------------------------------------------
  // NAVIGATION CGV
  // ----------------------------------------------------------

  const handleOpenCGV = () => {
    Linking.openURL(CGV_URL).catch(() => {
      Alert.alert("Erreur", "Impossible d'ouvrir le lien");
    });
  };

  // ----------------------------------------------------------
  // RENDER - Si déjà Premium
  // ----------------------------------------------------------

  if (isPremium) {
    return (
      <SafeAreaView className="flex-1 bg-pink-50">
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <LinearGradient
            colors={["#FFD700", "#FFA500"]}
            className="w-24 h-24 rounded-full items-center justify-center mb-6"
          >
            <Text className="text-5xl">👑</Text>
          </LinearGradient>

          <Text className="text-2xl font-bold text-gray-800 text-center">
            Vous êtes Premium !
          </Text>

          <Text className="text-base text-gray-500 text-center mt-3">
            Vous bénéficiez de toutes les fonctionnalités exclusives.
          </Text>

          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-8 bg-pink-500 px-8 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------------
  // RENDER - Page d'abonnement
  // ----------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
      >
        {/* Hero Section */}
        <LinearGradient
          colors={["#EC4899", "#DB2777"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-4 rounded-2xl p-6 items-center"
        >
          <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl">👑</Text>
          </View>

          <Text className="text-2xl font-bold text-white text-center">
            Passez au niveau supérieur
          </Text>

          <Text className="text-white/80 text-center mt-2">
            Débloquez tout le potentiel d'Intimacy Play
          </Text>
        </LinearGradient>

        {/* Avantages Premium */}
        <View className="px-4 mt-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Avantages Premium
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm">
            {PREMIUM_FEATURES.slice(0, 6).map((feature, index) => (
              <View
                key={feature.id}
                className={`flex-row items-center py-3 ${
                  index < 5 ? "border-b border-gray-100" : ""
                }`}
              >
                <View className="w-10 h-10 bg-pink-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-xl">{feature.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">
                    {feature.title}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {feature.description}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              </View>
            ))}
          </View>
        </View>

        {/* Tableau comparatif */}
        <View className="px-4 mt-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Gratuit vs Premium
          </Text>

          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {/* Header du tableau */}
            <View className="flex-row bg-gray-50 py-3 px-4 border-b border-gray-200">
              <Text className="flex-1 font-semibold text-gray-800">
                Fonctionnalité
              </Text>
              <Text className="w-16 text-center font-semibold text-gray-500">
                Gratuit
              </Text>
              <Text className="w-16 text-center font-semibold text-pink-500">
                Premium
              </Text>
            </View>

            {/* Lignes du tableau */}
            {COMPARISON_TABLE.map((row, index) => (
              <View
                key={index}
                className={`flex-row py-3 px-4 ${
                  index < COMPARISON_TABLE.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <Text className="flex-1 text-gray-700 text-sm">
                  {row.feature}
                </Text>
                <View className="w-16 items-center">
                  {row.free ? (
                    <Ionicons name="checkmark" size={20} color="#22C55E" />
                  ) : (
                    <Ionicons name="close" size={20} color="#EF4444" />
                  )}
                </View>
                <View className="w-16 items-center">
                  {row.premium ? (
                    <Ionicons name="checkmark" size={20} color="#22C55E" />
                  ) : (
                    <Ionicons name="close" size={20} color="#EF4444" />
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Sélection du plan */}
        <View className="px-4 mt-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Choisissez votre formule
          </Text>

          {isLoadingProducts ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#EC4899" />
              <Text className="text-gray-500 mt-2">Chargement des offres...</Text>
            </View>
          ) : (
            <>
              {/* Plan Annuel (Recommandé) */}
              <TouchableOpacity
                onPress={() => setSelectedPlan("yearly")}
                className={`p-4 rounded-2xl border-2 mb-3 relative ${
                  selectedPlan === "yearly"
                    ? "border-pink-500 bg-pink-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* Badge économie */}
                <View className="absolute -top-3 right-4 bg-green-500 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">
                    -{PRICING.YEARLY.savingsPercent}%
                  </Text>
                </View>

                {/* Badge recommandé */}
                <View className="absolute -top-3 left-4 bg-pink-500 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">
                    Recommandé
                  </Text>
                </View>

                <View className="flex-row items-center justify-between mt-2">
                  <View className="flex-row items-center">
                    <View
                      className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                        selectedPlan === "yearly"
                          ? "border-pink-500 bg-pink-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedPlan === "yearly" && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <View>
                      <Text className="font-bold text-gray-800 text-lg">
                        Annuel
                      </Text>
                      <Text className="text-green-600 text-sm font-medium">
                        {PRICING.YEARLY.monthlyEquivalentFormatted}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-2xl font-bold text-gray-800">
                      {PRICING.YEARLY.priceFormatted}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {PRICING.YEARLY.periodLabel}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Plan Mensuel */}
              <TouchableOpacity
                onPress={() => setSelectedPlan("monthly")}
                className={`p-4 rounded-2xl border-2 ${
                  selectedPlan === "monthly"
                    ? "border-pink-500 bg-pink-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View
                      className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                        selectedPlan === "monthly"
                          ? "border-pink-500 bg-pink-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedPlan === "monthly" && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <Text className="font-bold text-gray-800 text-lg">
                      Mensuel
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-2xl font-bold text-gray-800">
                      {PRICING.MONTHLY.priceFormatted}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {PRICING.MONTHLY.periodLabel}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Message d'erreur */}
        {error && (
          <View className="mx-4 mt-4 p-3 bg-red-50 rounded-xl">
            <Text className="text-red-600 text-center text-sm">{error}</Text>
          </View>
        )}

        {/* Bouton d'achat */}
        <View className="px-4 mt-6">
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={isPurchasing || isLoadingProducts}
            className={`py-4 rounded-xl items-center ${
              isPurchasing || isLoadingProducts
                ? "bg-gray-300"
                : "bg-pink-500 active:bg-pink-600"
            }`}
          >
            {isPurchasing ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-bold text-lg ml-2">
                  Traitement...
                </Text>
              </View>
            ) : (
              <Text className="text-white font-bold text-lg">
                S'abonner maintenant
              </Text>
            )}
          </TouchableOpacity>

          {/* Infos légales */}
          <Text className="text-gray-400 text-xs text-center mt-3">
            Paiement via Google Play. Annulable à tout moment.{"\n"}
            L'abonnement se renouvelle automatiquement.
          </Text>
        </View>

        {/* Liens secondaires */}
        <View className="px-4 mt-6 space-y-3">
          {/* Restaurer achats */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={isRestoring}
            className="py-3"
          >
            {isRestoring ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="#EC4899" size="small" />
                <Text className="text-pink-500 text-center ml-2">
                  Restauration...
                </Text>
              </View>
            ) : (
              <Text className="text-pink-500 text-center font-medium">
                Restaurer mes achats
              </Text>
            )}
          </TouchableOpacity>

          {/* CGV */}
          <TouchableOpacity onPress={handleOpenCGV} className="py-3">
            <Text className="text-gray-400 text-center text-sm">
              Conditions Générales de Vente
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}