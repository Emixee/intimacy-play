/**
 * ReactionPicker - Sélecteur d'emojis de réaction
 * 
 * Affiche les emojis disponibles (gratuits + premium si abonné)
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { REACTIONS_FREE, REACTIONS_PREMIUM, type Reaction } from '../../types';

interface ReactionPickerProps {
  /** Callback de sélection */
  onSelect: (reaction: Reaction) => void;
  /** Utilisateur premium ? */
  isPremium: boolean;
  /** Callback pour afficher le paywall */
  onShowPaywall?: () => void;
  /** Réaction actuellement sélectionnée */
  selectedReaction?: Reaction;
  /** Fermer le picker */
  onClose?: () => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onSelect,
  isPremium,
  onShowPaywall,
  selectedReaction,
  onClose,
}) => {
  // Toutes les réactions
  const freeReactions = [...REACTIONS_FREE];
  const premiumReactions = [...REACTIONS_PREMIUM];

  const handleReactionPress = (reaction: Reaction, isPremiumReaction: boolean) => {
    // Si c'est une réaction premium et l'utilisateur n'est pas premium
    if (isPremiumReaction && !isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onShowPaywall?.();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(reaction);
    onClose?.();
  };

  return (
    <View className="bg-white rounded-2xl shadow-lg p-4 min-w-[280px]">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-medium text-gray-600">
          Réagir au défi
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Réactions gratuites */}
      <View className="flex-row flex-wrap mb-2">
        {freeReactions.map((reaction) => (
          <TouchableOpacity
            key={reaction}
            onPress={() => handleReactionPress(reaction, false)}
            className={`
              w-12 h-12 rounded-full items-center justify-center m-1
              ${selectedReaction === reaction ? 'bg-pink-100' : 'bg-gray-50'}
            `}
          >
            <Text className="text-2xl">{reaction}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Séparateur Premium */}
      <View className="flex-row items-center my-2">
        <View className="flex-1 h-px bg-gray-200" />
        <View className="flex-row items-center mx-2">
          <Ionicons name="diamond" size={12} color="#EC4899" />
          <Text className="text-xs text-pink-500 ml-1 font-medium">
            Premium
          </Text>
        </View>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      {/* Réactions premium */}
      <View className="flex-row flex-wrap">
        {premiumReactions.map((reaction) => (
          <TouchableOpacity
            key={reaction}
            onPress={() => handleReactionPress(reaction, true)}
            className={`
              w-12 h-12 rounded-full items-center justify-center m-1 relative
              ${selectedReaction === reaction ? 'bg-pink-100' : 'bg-gray-50'}
              ${!isPremium ? 'opacity-60' : ''}
            `}
          >
            <Text className="text-2xl">{reaction}</Text>
            {!isPremium && (
              <View className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full items-center justify-center">
                <Ionicons name="lock-closed" size={8} color="white" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Message si non premium */}
      {!isPremium && (
        <TouchableOpacity
          onPress={onShowPaywall}
          className="mt-3 py-2 bg-pink-50 rounded-lg"
        >
          <Text className="text-center text-pink-600 text-sm">
            ✨ Débloquer toutes les réactions
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Version inline (barre de réactions rapides)
 */
interface QuickReactionsBarProps {
  onSelect: (reaction: Reaction) => void;
  isPremium: boolean;
  onShowMore?: () => void;
}

export const QuickReactionsBar: React.FC<QuickReactionsBarProps> = ({
  onSelect,
  isPremium,
  onShowMore,
}) => {
  // Afficher les 4 premières réactions gratuites + bouton "plus"
  const quickReactions = REACTIONS_FREE.slice(0, 4);

  const handlePress = (reaction: Reaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(reaction);
  };

  return (
    <View className="flex-row items-center bg-white rounded-full shadow-lg px-2 py-1">
      {quickReactions.map((reaction) => (
        <TouchableOpacity
          key={reaction}
          onPress={() => handlePress(reaction)}
          className="w-10 h-10 items-center justify-center"
        >
          <Text className="text-xl">{reaction}</Text>
        </TouchableOpacity>
      ))}

      {/* Bouton voir plus */}
      <TouchableOpacity
        onPress={onShowMore}
        className="w-10 h-10 items-center justify-center"
      >
        <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
          <Ionicons name="add" size={18} color="#6B7280" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ReactionPicker;
