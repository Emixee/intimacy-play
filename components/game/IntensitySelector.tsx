/**
 * IntensitySelector - Sélecteur de niveau d'intensité
 * 
 * Permet de choisir le niveau de départ pour une partie
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { INTENSITY_LEVELS, type IntensityLevel } from '../../types';

interface IntensitySelectorProps {
  /** Niveau actuellement sélectionné */
  selectedLevel: IntensityLevel;
  /** Callback de changement */
  onSelect: (level: IntensityLevel) => void;
  /** Utilisateur premium ? */
  isPremium: boolean;
  /** Callback pour afficher le paywall */
  onShowPaywall?: () => void;
  /** Afficher la description détaillée */
  showDescription?: boolean;
  /** Désactiver la sélection */
  disabled?: boolean;
}

export const IntensitySelector: React.FC<IntensitySelectorProps> = ({
  selectedLevel,
  onSelect,
  isPremium,
  onShowPaywall,
  showDescription = true,
  disabled = false,
}) => {
  // Couleurs de gradient par niveau
  const levelColors: Record<IntensityLevel, readonly [string, string]> = {
    1: ['#10B981', '#059669'] as const,
    2: ['#F59E0B', '#D97706'] as const,
    3: ['#EC4899', '#DB2777'] as const,
    4: ['#EF4444', '#DC2626'] as const,
  };

  const handleSelect = (level: IntensityLevel) => {
    if (disabled) return;

    const info = INTENSITY_LEVELS.find((i) => i.level === level);
    
    // Vérifier si le niveau est premium
    if (info?.isPremium && !isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onShowPaywall?.();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(level);
  };

  // Info du niveau sélectionné
  const selectedInfo = INTENSITY_LEVELS.find((i) => i.level === selectedLevel);

  return (
    <View>
      {/* Grille des niveaux */}
      <View className="flex-row flex-wrap justify-between">
        {INTENSITY_LEVELS.map((intensity) => {
          const isSelected = intensity.level === selectedLevel;
          const isLocked = intensity.isPremium && !isPremium;

          return (
            <TouchableOpacity
              key={intensity.level}
              onPress={() => handleSelect(intensity.level)}
              disabled={disabled}
              className="w-[48%] mb-3"
            >
              <View
                className={`
                  relative rounded-xl overflow-hidden
                  ${isSelected ? 'ring-2 ring-offset-2' : ''}
                  ${disabled ? 'opacity-50' : ''}
                `}
                style={isSelected ? { 
                  shadowColor: levelColors[intensity.level][0],
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                } : undefined}
              >
                <LinearGradient
                  colors={isSelected ? levelColors[intensity.level] : ['#F3F4F6', '#E5E7EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-4"
                >
                  <View className="items-center">
                    {/* Emoji */}
                    <Text className="text-3xl mb-1">{intensity.emoji}</Text>
                    
                    {/* Nom */}
                    <Text 
                      className={`
                        font-semibold text-sm
                        ${isSelected ? 'text-white' : 'text-gray-700'}
                      `}
                    >
                      {intensity.name}
                    </Text>

                    {/* Badge niveau */}
                    <View 
                      className={`
                        mt-1 px-2 py-0.5 rounded-full
                        ${isSelected ? 'bg-white/20' : 'bg-white'}
                      `}
                    >
                      <Text 
                        className={`
                          text-xs font-medium
                          ${isSelected ? 'text-white' : 'text-gray-500'}
                        `}
                      >
                        Niveau {intensity.level}
                      </Text>
                    </View>
                  </View>

                  {/* Badge Premium verrouillé */}
                  {isLocked && (
                    <View className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5">
                      <Ionicons name="lock-closed" size={12} color="white" />
                    </View>
                  )}

                  {/* Checkmark si sélectionné */}
                  {isSelected && (
                    <View className="absolute top-2 right-2 bg-white rounded-full p-1">
                      <Ionicons 
                        name="checkmark" 
                        size={14} 
                        color={levelColors[intensity.level][0]} 
                      />
                    </View>
                  )}
                </LinearGradient>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Description du niveau sélectionné */}
      {showDescription && selectedInfo && (
        <View className="mt-4 p-4 bg-gray-50 rounded-xl">
          <View className="flex-row items-center mb-2">
            <Text className="text-2xl mr-2">{selectedInfo.emoji}</Text>
            <Text className="text-lg font-semibold text-gray-800">
              {selectedInfo.name}
            </Text>
          </View>
          <Text className="text-gray-600">{selectedInfo.description}</Text>
          
          {/* Info progression */}
          <View className="mt-3 flex-row items-center">
            <Ionicons name="trending-up" size={16} color="#EC4899" />
            <Text className="text-sm text-gray-500 ml-2">
              L'intensité augmentera progressivement pendant la partie
            </Text>
          </View>
        </View>
      )}

      {/* Message Premium */}
      {!isPremium && (
        <TouchableOpacity
          onPress={onShowPaywall}
          className="mt-4 py-3 bg-pink-50 rounded-xl flex-row items-center justify-center"
        >
          <Ionicons name="diamond" size={18} color="#EC4899" />
          <Text className="text-pink-600 font-medium ml-2">
            Débloquer le niveau Explicite 🔥
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Version compacte (barre horizontale)
 */
interface CompactIntensitySelectorProps {
  selectedLevel: IntensityLevel;
  onSelect: (level: IntensityLevel) => void;
  isPremium: boolean;
  onShowPaywall?: () => void;
}

export const CompactIntensitySelector: React.FC<CompactIntensitySelectorProps> = ({
  selectedLevel,
  onSelect,
  isPremium,
  onShowPaywall,
}) => {
  const handleSelect = (level: IntensityLevel) => {
    const info = INTENSITY_LEVELS.find((i) => i.level === level);
    
    if (info?.isPremium && !isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onShowPaywall?.();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(level);
  };

  return (
    <View className="flex-row bg-gray-100 rounded-xl p-1">
      {INTENSITY_LEVELS.map((intensity) => {
        const isSelected = intensity.level === selectedLevel;
        const isLocked = intensity.isPremium && !isPremium;

        return (
          <TouchableOpacity
            key={intensity.level}
            onPress={() => handleSelect(intensity.level)}
            className={`
              flex-1 py-2 px-1 rounded-lg items-center relative
              ${isSelected ? 'bg-white shadow-sm' : ''}
            `}
          >
            <Text className="text-lg">{intensity.emoji}</Text>
            {isLocked && (
              <View className="absolute -top-1 -right-1">
                <Ionicons name="lock-closed" size={10} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default IntensitySelector;
