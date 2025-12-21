/**
 * ChallengeCard - Carte affichant le défi actuel
 * 
 * Affiche le texte du défi avec son niveau d'intensité
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { INTENSITY_LEVELS, type IntensityLevel, type ChallengeType } from '../../types';

interface ChallengeCardProps {
  /** Texte du défi */
  text: string;
  /** Niveau d'intensité */
  level: IntensityLevel;
  /** Type de défi */
  type: ChallengeType;
  /** Est-ce mon tour ? */
  isMyTurn: boolean;
  /** Callback pour valider le défi */
  onComplete?: () => void;
  /** Callback pour changer le défi */
  onChangeChallenge?: () => void;
  /** Nombre de changements restants */
  changesRemaining?: number;
  /** Afficher le bouton de changement */
  showChangeButton?: boolean;
  /** Chargement en cours */
  isLoading?: boolean;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  text,
  level,
  type,
  isMyTurn,
  onComplete,
  onChangeChallenge,
  changesRemaining = 0,
  showChangeButton = true,
  isLoading = false,
}) => {
  // Récupérer les infos du niveau
  const intensityInfo = INTENSITY_LEVELS.find((i) => i.level === level);
  
  // Couleurs selon le niveau
  const levelColors = {
    1: ['#10B981', '#059669'] as const, // Vert
    2: ['#F59E0B', '#D97706'] as const, // Orange
    3: ['#EC4899', '#DB2777'] as const, // Rose
    4: ['#EF4444', '#DC2626'] as const, // Rouge
  };

  const gradientColors = levelColors[level];

  // Icône selon le type
  const typeIcons: Record<ChallengeType, string> = {
    texte: 'chatbubble-outline',
    audio: 'mic-outline',
    photo: 'camera-outline',
    video: 'videocam-outline',
  };

  const handleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete?.();
  };

  const handleChange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeChallenge?.();
  };

  return (
    <View className="mx-4 my-2">
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-3xl p-1"
      >
        <View className="bg-white rounded-[22px] p-6">
          {/* Header avec niveau et type */}
          <View className="flex-row items-center justify-between mb-4">
            {/* Badge niveau */}
            <View 
              className="flex-row items-center px-3 py-1.5 rounded-full"
              style={{ backgroundColor: `${gradientColors[0]}20` }}
            >
              <Text className="text-lg mr-1">{intensityInfo?.emoji}</Text>
              <Text 
                className="font-semibold text-sm"
                style={{ color: gradientColors[0] }}
              >
                {intensityInfo?.name}
              </Text>
            </View>

            {/* Badge type */}
            <View className="flex-row items-center px-3 py-1.5 bg-gray-100 rounded-full">
              <Ionicons 
                name={typeIcons[type] as any} 
                size={16} 
                color="#6B7280" 
              />
              <Text className="text-gray-600 text-sm ml-1.5 capitalize">
                {type}
              </Text>
            </View>
          </View>

          {/* Texte du défi */}
          <View className="min-h-[120px] justify-center">
            <Text className="text-xl text-gray-800 text-center leading-7 font-medium">
              {text}
            </Text>
          </View>

          {/* Indicateur de tour */}
          {isMyTurn && (
            <View className="mt-4 py-2 bg-pink-50 rounded-xl">
              <Text className="text-center text-pink-600 font-medium">
                🎯 C'est ton tour !
              </Text>
            </View>
          )}

          {/* Boutons d'action */}
          <View className="mt-6 space-y-3">
            {/* Bouton Valider (uniquement si c'est mon tour) */}
            {isMyTurn && onComplete && (
              <TouchableOpacity
                onPress={handleComplete}
                disabled={isLoading}
                className={`
                  py-4 rounded-xl items-center
                  ${isLoading ? 'bg-gray-300' : 'bg-pink-500 active:bg-pink-600'}
                `}
              >
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={22} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Défi accompli !
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Bouton Changer le défi */}
            {showChangeButton && onChangeChallenge && changesRemaining > 0 && (
              <TouchableOpacity
                onPress={handleChange}
                disabled={isLoading}
                className={`
                  py-3 rounded-xl items-center border-2 border-gray-200
                  ${isLoading ? 'opacity-50' : 'active:bg-gray-50'}
                `}
              >
                <View className="flex-row items-center">
                  <Ionicons name="refresh-outline" size={18} color="#6B7280" />
                  <Text className="text-gray-600 font-medium ml-2">
                    Changer ({changesRemaining} restant{changesRemaining > 1 ? 's' : ''})
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Message si plus de changements */}
            {showChangeButton && changesRemaining === 0 && (
              <View className="py-2">
                <Text className="text-center text-gray-400 text-sm">
                  Plus de changements disponibles
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

/**
 * Version mini pour la liste des défis
 */
interface MiniChallengeCardProps {
  text: string;
  level: IntensityLevel;
  isCompleted: boolean;
  isCurrent: boolean;
}

export const MiniChallengeCard: React.FC<MiniChallengeCardProps> = ({
  text,
  level,
  isCompleted,
  isCurrent,
}) => {
  const intensityInfo = INTENSITY_LEVELS.find((i) => i.level === level);

  return (
    <View 
      className={`
        p-3 rounded-xl border-2 mb-2
        ${isCurrent ? 'border-pink-500 bg-pink-50' : 'border-gray-100 bg-white'}
        ${isCompleted ? 'opacity-60' : ''}
      `}
    >
      <View className="flex-row items-center">
        {/* Indicateur statut */}
        <View 
          className={`
            w-6 h-6 rounded-full items-center justify-center mr-3
            ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-pink-500' : 'bg-gray-200'}
          `}
        >
          {isCompleted ? (
            <Ionicons name="checkmark" size={14} color="white" />
          ) : isCurrent ? (
            <Ionicons name="play" size={12} color="white" />
          ) : null}
        </View>

        {/* Texte tronqué */}
        <Text 
          className={`flex-1 ${isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}
          numberOfLines={1}
        >
          {text}
        </Text>

        {/* Emoji niveau */}
        <Text className="text-lg ml-2">{intensityInfo?.emoji}</Text>
      </View>
    </View>
  );
};

export default ChallengeCard;
