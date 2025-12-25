/**
 * NetworkStatusBanner - Bannière d'état de connexion
 * 
 * Affiche une bannière en haut de l'écran quand :
 * - L'utilisateur est hors ligne
 * - Tentative de reconnexion en cours
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

// ============================================================
// COMPOSANT
// ============================================================

export const NetworkStatusBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isConnected, isReconnecting, checkConnection } = useNetworkStatus();

  // Animation
  const translateY = useSharedValue(-100);
  const pulseOpacity = useSharedValue(1);

  // Afficher/masquer la bannière
  useEffect(() => {
    if (!isConnected) {
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      
      // Animation de pulsation
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    } else {
      translateY.value = withTiming(-100, { duration: 300 });
    }
  }, [isConnected]);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Ne rien afficher si connecté
  if (isConnected) return null;

  return (
    <Animated.View
      style={[
        bannerStyle,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: insets.top,
        },
      ]}
    >
      <View className="bg-red-500 px-4 py-3">
        <View className="flex-row items-center justify-between">
          {/* Icône et message */}
          <View className="flex-row items-center flex-1">
            <Animated.View style={pulseStyle}>
              <Ionicons name="cloud-offline" size={20} color="white" />
            </Animated.View>
            <Text className="text-white font-medium ml-3 flex-1">
              {isReconnecting 
                ? 'Reconnexion en cours...' 
                : 'Vous êtes hors ligne'
              }
            </Text>
          </View>

          {/* Bouton réessayer */}
          {!isReconnecting && (
            <TouchableOpacity
              onPress={checkConnection}
              className="bg-white/20 px-3 py-1.5 rounded-full"
            >
              <Text className="text-white font-medium text-sm">
                Réessayer
              </Text>
            </TouchableOpacity>
          )}

          {/* Indicateur de chargement */}
          {isReconnecting && (
            <View className="w-5 h-5">
              <Animated.View
                style={[
                  pulseStyle,
                  {
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: 'white',
                    borderTopColor: 'transparent',
                  },
                ]}
              />
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export default NetworkStatusBanner;