/**
 * Écran de test des publicités
 * À SUPPRIMER avant la mise en production
 */

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAdsStore, useFreeGamesStatus, useAdChangesStatus } from "../../stores/adsStore";
import { useSubscriptionStore } from "../../stores/subscriptionStore";

export default function TestAdsScreen() {
  const [logs, setLogs] = useState<string[]>([]);
  
  // Stores
  const { 
    initAds, 
    showInterstitial, 
    showRewardedForGame,
    showRewardedForChange,
    resetSessionChanges,
    isInitializing,
    isShowingAd,
    error 
  } = useAdsStore();
  
  const { isPremium } = useSubscriptionStore();
  const freeGamesStatus = useFreeGamesStatus();
  const adChangesStatus = useAdChangesStatus();

  // Logger
  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    console.log(`[TestAds] ${message}`);
  };

  // Initialiser au montage
  useEffect(() => {
    handleInit();
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleInit = async () => {
    log("🔄 Initialisation AdMob...");
    await initAds();
    log("✅ AdMob initialisé");
  };

  const handleShowInterstitial = async () => {
    log("🔄 Affichage interstitiel...");
    const shown = await showInterstitial(isPremium);
    log(shown ? "✅ Interstitiel affiché" : "⚠️ Interstitiel non affiché (premium ou erreur)");
  };

  const handleShowRewardedForGame = async () => {
    log("🔄 Affichage rewarded (partie gratuite)...");
    const result = await showRewardedForGame();
    if (result?.rewarded) {
      log(`✅ Partie gratuite obtenue ! Total: ${freeGamesStatus.used + 1}/${freeGamesStatus.max}`);
      Alert.alert("🎉 Succès", "Vous avez gagné une partie gratuite !");
    } else {
      log("❌ Pub non complétée ou erreur");
    }
  };

  const handleShowRewardedForChange = async () => {
    // Simule un sessionCode et userId pour le test
    const mockSessionCode = "TEST123";
    const mockUserId = "test-user-id";
    
    log("🔄 Affichage rewarded (changement bonus)...");
    const result = await showRewardedForChange(mockSessionCode, mockUserId);
    if (result?.rewarded) {
      log(`✅ Changement bonus obtenu ! Total: ${adChangesStatus.used + 1}/${adChangesStatus.max}`);
      Alert.alert("🎉 Succès", "Vous avez gagné un changement bonus !");
    } else {
      log("❌ Pub non complétée ou erreur");
    }
  };

  const handleResetSession = () => {
    resetSessionChanges();
    log("🔄 Compteur de session réinitialisé");
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <Text className="text-2xl font-bold text-gray-800 mb-4">
          🧪 Test Publicités
        </Text>

        {/* Status */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="font-bold text-gray-800 mb-2">📊 Status</Text>
          
          <View className="flex-row justify-between py-1">
            <Text className="text-gray-600">Premium:</Text>
            <Text className={isPremium ? "text-green-600" : "text-red-600"}>
              {isPremium ? "Oui ✅" : "Non ❌"}
            </Text>
          </View>
          
          <View className="flex-row justify-between py-1">
            <Text className="text-gray-600">Initialisation:</Text>
            <Text className={isInitializing ? "text-orange-600" : "text-green-600"}>
              {isInitializing ? "En cours..." : "OK ✅"}
            </Text>
          </View>
          
          <View className="flex-row justify-between py-1">
            <Text className="text-gray-600">Pub en cours:</Text>
            <Text className={isShowingAd ? "text-orange-600" : "text-gray-600"}>
              {isShowingAd ? "Oui 📺" : "Non"}
            </Text>
          </View>
          
          <View className="flex-row justify-between py-1">
            <Text className="text-gray-600">Parties gratuites:</Text>
            <Text className="text-blue-600">
              {freeGamesStatus.used}/{freeGamesStatus.max}
            </Text>
          </View>
          
          <View className="flex-row justify-between py-1">
            <Text className="text-gray-600">Changements bonus:</Text>
            <Text className="text-blue-600">
              {adChangesStatus.used}/{adChangesStatus.max}
            </Text>
          </View>

          {error && (
            <View className="mt-2 p-2 bg-red-50 rounded">
              <Text className="text-red-600 text-sm">❌ {error}</Text>
            </View>
          )}
        </View>

        {/* Boutons de test */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="font-bold text-gray-800 mb-3">🎮 Actions</Text>

          {/* Init */}
          <TouchableOpacity
            onPress={handleInit}
            disabled={isInitializing}
            className={`py-3 rounded-lg mb-2 ${isInitializing ? "bg-gray-300" : "bg-blue-500"}`}
          >
            <Text className="text-white text-center font-semibold">
              🔄 Réinitialiser AdMob
            </Text>
          </TouchableOpacity>

          {/* Interstitial */}
          <TouchableOpacity
            onPress={handleShowInterstitial}
            disabled={isShowingAd}
            className={`py-3 rounded-lg mb-2 ${isShowingAd ? "bg-gray-300" : "bg-orange-500"}`}
          >
            <Text className="text-white text-center font-semibold">
              📺 Test Interstitiel (début de partie)
            </Text>
          </TouchableOpacity>

          {/* Rewarded Game */}
          <TouchableOpacity
            onPress={handleShowRewardedForGame}
            disabled={isShowingAd || !freeGamesStatus.canWatch}
            className={`py-3 rounded-lg mb-2 ${
              isShowingAd || !freeGamesStatus.canWatch ? "bg-gray-300" : "bg-green-500"
            }`}
          >
            <Text className="text-white text-center font-semibold">
              🎁 Test Rewarded (+1 partie)
              {!freeGamesStatus.canWatch && " - MAX ATTEINT"}
            </Text>
          </TouchableOpacity>

          {/* Rewarded Change */}
          <TouchableOpacity
            onPress={handleShowRewardedForChange}
            disabled={isShowingAd || !adChangesStatus.canWatch}
            className={`py-3 rounded-lg mb-2 ${
              isShowingAd || !adChangesStatus.canWatch ? "bg-gray-300" : "bg-purple-500"
            }`}
          >
            <Text className="text-white text-center font-semibold">
              🔄 Test Rewarded (+1 changement)
              {!adChangesStatus.canWatch && " - MAX ATTEINT"}
            </Text>
          </TouchableOpacity>

          {/* Reset Session */}
          <TouchableOpacity
            onPress={handleResetSession}
            className="py-3 rounded-lg bg-gray-500"
          >
            <Text className="text-white text-center font-semibold">
              🗑️ Reset compteur session
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logs */}
        <View className="bg-gray-800 rounded-xl p-4 mb-4">
          <Text className="font-bold text-white mb-2">📋 Logs</Text>
          {logs.length === 0 ? (
            <Text className="text-gray-400 text-sm">Aucun log...</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} className="text-green-400 text-xs font-mono mb-1">
                {log}
              </Text>
            ))
          )}
        </View>

        {/* Instructions */}
        <View className="bg-yellow-50 rounded-xl p-4 mb-8">
          <Text className="font-bold text-yellow-800 mb-2">📝 Instructions</Text>
          <Text className="text-yellow-700 text-sm mb-1">
            1. Les IDs de test affichent des pubs fictives
          </Text>
          <Text className="text-yellow-700 text-sm mb-1">
            2. Interstitiel : s'affiche au début de partie (gratuit)
          </Text>
          <Text className="text-yellow-700 text-sm mb-1">
            3. Rewarded partie : max 3/jour
          </Text>
          <Text className="text-yellow-700 text-sm mb-1">
            4. Rewarded changement : max 3/session
          </Text>
          <Text className="text-yellow-700 text-sm">
            5. Supprimer cet écran avant la production !
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}