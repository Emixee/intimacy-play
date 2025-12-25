/**
 * PendingPartnerChallengeIndicator - Indicateur de demande de défi partenaire
 */

import React, { memo, useEffect, useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";

interface PendingPartnerChallengeIndicatorProps {
  isRequestedByMe: boolean;
  onCancel: () => void;
}

export const PendingPartnerChallengeIndicator = memo<PendingPartnerChallengeIndicatorProps>(({ isRequestedByMe, onCancel }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => {
      animation.stop();
      pulseAnim.stopAnimation();
    };
  }, [pulseAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <View className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center">
            <Text className="text-xl">✨</Text>
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-purple-800 font-semibold">
              {isRequestedByMe ? "Demande envoyée !" : "Ton partenaire te demande de créer un défi !"}
            </Text>
            <Text className="text-purple-600 text-sm mt-0.5">
              {isRequestedByMe ? "En attente que ton partenaire crée le défi..." : "Appuie sur le bouton ci-dessous pour créer"}
            </Text>
          </View>
        </View>
        {isRequestedByMe && (
          <Pressable onPress={onCancel} className="mt-3 py-2 items-center border border-purple-300 rounded-lg active:bg-purple-100">
            <Text className="text-purple-600 font-medium">Annuler la demande</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
});

PendingPartnerChallengeIndicator.displayName = "PendingPartnerChallengeIndicator";
export default PendingPartnerChallengeIndicator;
