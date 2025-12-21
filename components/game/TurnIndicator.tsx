/**
 * TurnIndicator - Indicateur de tour de jeu
 * 
 * Affiche à qui c'est le tour de jouer
 */

import React from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Gender } from '../../types';

interface TurnIndicatorProps {
  /** C'est mon tour ? */
  isMyTurn: boolean;
  /** Nom du partenaire */
  partnerName?: string;
  /** Genre du joueur actuel */
  currentPlayerGender?: Gender;
  /** Variante d'affichage */
  variant?: 'default' | 'compact' | 'banner';
  /** Animation pulsante */
  animated?: boolean;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  isMyTurn,
  partnerName = 'Partenaire',
  currentPlayerGender,
  variant = 'default',
  animated = true,
}) => {
  // Animation de pulse
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (animated && isMyTurn) {
      const pulse = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]);

      const loop = Animated.loop(pulse);
      loop.start();

      return () => loop.stop();
    }
  }, [isMyTurn, animated]);

  // Emoji selon le genre
  const genderEmoji = currentPlayerGender === 'femme' ? '👩' : '👨';

  // Rendu selon la variante
  if (variant === 'compact') {
    return (
      <View 
        className={`
          px-3 py-1.5 rounded-full flex-row items-center
          ${isMyTurn ? 'bg-pink-500' : 'bg-gray-200'}
        `}
      >
        <Text className={`text-sm font-medium ${isMyTurn ? 'text-white' : 'text-gray-600'}`}>
          {isMyTurn ? '🎯 Ton tour' : `⏳ ${partnerName}`}
        </Text>
      </View>
    );
  }

  if (variant === 'banner') {
    return (
      <Animated.View 
        style={isMyTurn ? { transform: [{ scale: pulseAnim }] } : undefined}
      >
        <LinearGradient
          colors={isMyTurn ? ['#EC4899', '#DB2777'] : ['#9CA3AF', '#6B7280']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="py-3 px-6 rounded-xl"
        >
          <View className="flex-row items-center justify-center">
            {isMyTurn ? (
              <>
                <Ionicons name="game-controller" size={24} color="white" />
                <Text className="text-white font-bold text-lg ml-3">
                  C'est à toi de jouer !
                </Text>
              </>
            ) : (
              <>
                <View className="w-6 h-6 bg-white/20 rounded-full items-center justify-center">
                  <Text className="text-base">{genderEmoji}</Text>
                </View>
                <Text className="text-white font-medium text-base ml-3">
                  {partnerName} joue...
                </Text>
              </>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  // Variante par défaut
  return (
    <View className="items-center">
      <Animated.View 
        style={isMyTurn ? { transform: [{ scale: pulseAnim }] } : undefined}
        className={`
          flex-row items-center px-4 py-2 rounded-full
          ${isMyTurn ? 'bg-pink-100' : 'bg-gray-100'}
        `}
      >
        {/* Avatar/Icon */}
        <View 
          className={`
            w-8 h-8 rounded-full items-center justify-center
            ${isMyTurn ? 'bg-pink-500' : 'bg-gray-300'}
          `}
        >
          {isMyTurn ? (
            <Ionicons name="person" size={16} color="white" />
          ) : (
            <Text className="text-base">{genderEmoji}</Text>
          )}
        </View>

        {/* Texte */}
        <Text 
          className={`
            ml-2 font-medium
            ${isMyTurn ? 'text-pink-600' : 'text-gray-600'}
          `}
        >
          {isMyTurn ? 'Ton tour' : `Tour de ${partnerName}`}
        </Text>

        {/* Indicateur */}
        {isMyTurn && (
          <View className="ml-2 w-2 h-2 bg-pink-500 rounded-full" />
        )}
      </Animated.View>

      {/* Message additionnel */}
      {!isMyTurn && (
        <Text className="text-gray-400 text-sm mt-2">
          Patiente pendant que {partnerName} accomplit son défi...
        </Text>
      )}
    </View>
  );
};

/**
 * Indicateur avec les deux joueurs
 */
interface DualTurnIndicatorProps {
  isMyTurn: boolean;
  myName?: string;
  partnerName?: string;
  myGender?: Gender;
  partnerGender?: Gender;
}

export const DualTurnIndicator: React.FC<DualTurnIndicatorProps> = ({
  isMyTurn,
  myName = 'Moi',
  partnerName = 'Partenaire',
  myGender = 'homme',
  partnerGender = 'femme',
}) => {
  const myEmoji = myGender === 'femme' ? '👩' : '👨';
  const partnerEmoji = partnerGender === 'femme' ? '👩' : '👨';

  return (
    <View className="flex-row items-center justify-center space-x-4">
      {/* Mon avatar */}
      <View className="items-center">
        <View 
          className={`
            w-12 h-12 rounded-full items-center justify-center
            ${isMyTurn ? 'bg-pink-500' : 'bg-gray-200'}
          `}
        >
          <Text className="text-2xl">{myEmoji}</Text>
        </View>
        <Text 
          className={`mt-1 text-sm font-medium ${isMyTurn ? 'text-pink-600' : 'text-gray-400'}`}
        >
          {myName}
        </Text>
        {isMyTurn && (
          <View className="absolute -bottom-1 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </View>

      {/* Indicateur central */}
      <View className="px-4">
        <Ionicons 
          name={isMyTurn ? 'arrow-back' : 'arrow-forward'} 
          size={24} 
          color="#EC4899" 
        />
      </View>

      {/* Avatar partenaire */}
      <View className="items-center">
        <View 
          className={`
            w-12 h-12 rounded-full items-center justify-center
            ${!isMyTurn ? 'bg-pink-500' : 'bg-gray-200'}
          `}
        >
          <Text className="text-2xl">{partnerEmoji}</Text>
        </View>
        <Text 
          className={`mt-1 text-sm font-medium ${!isMyTurn ? 'text-pink-600' : 'text-gray-400'}`}
        >
          {partnerName}
        </Text>
        {!isMyTurn && (
          <View className="absolute -bottom-1 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </View>
    </View>
  );
};

export default TurnIndicator;
