/**
 * AlternativesModal - Modal de sélection de défis alternatifs
 */

import React, { memo, useCallback } from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LevelBadge, ChallengeTypeBadge, Button } from "../ui";
import type { SessionChallenge, ChallengeType } from "../../types";

interface AlternativeChallenge {
  id: string;
  challenge: SessionChallenge;
}

interface AlternativesModalProps {
  visible: boolean;
  alternatives: AlternativeChallenge[];
  onSelect: (challenge: SessionChallenge) => void;
  onClose: () => void;
}

const getChallengeTypeEmoji = (type: ChallengeType): string => {
  const emojis: Record<ChallengeType, string> = { audio: "🎤", video: "🎬", photo: "📸", texte: "✍️" };
  return emojis[type] || "🎯";
};

export const AlternativesModal = memo<AlternativesModalProps>(({ visible, alternatives, onSelect, onClose }) => {
  const handleSelect = useCallback((challenge: SessionChallenge) => onSelect(challenge), [onSelect]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl">
          <SafeAreaView edges={["bottom"]}>
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-800">Choisir un autre défi</Text>
              <Pressable onPress={onClose} className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200">
                <Ionicons name="close" size={20} color="#374151" />
              </Pressable>
            </View>

            <ScrollView className="max-h-96 px-5 py-4">
              {alternatives.length === 0 ? (
                <View className="items-center py-8">
                  <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2 text-center">Aucune alternative disponible.</Text>
                </View>
              ) : (
                alternatives.map((alt) => (
                  <Pressable key={alt.id} onPress={() => handleSelect(alt.challenge)} className="bg-pink-50 rounded-xl p-4 mb-3 active:bg-pink-100">
                    <View className="flex-row items-start">
                      <Text className="text-2xl mr-3">{getChallengeTypeEmoji(alt.challenge.type)}</Text>
                      <View className="flex-1">
                        <View className="flex-row gap-2 mb-2">
                          <LevelBadge level={alt.challenge.level} size="sm" showLabel={false} />
                          <ChallengeTypeBadge type={alt.challenge.type} size="sm" />
                        </View>
                        <Text className="text-gray-700 leading-5">{alt.challenge.text}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>

            <View className="px-5 pb-4">
              <Button title="Annuler" variant="ghost" fullWidth onPress={onClose} />
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
});

AlternativesModal.displayName = "AlternativesModal";
export default AlternativesModal;
