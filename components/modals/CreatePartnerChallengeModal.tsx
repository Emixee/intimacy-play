/**
 * CreatePartnerChallengeModal - Modal pour créer un défi personnalisé
 */

import React, { memo, useState, useCallback } from "react";
import { View, Text, Pressable, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../ui";
import { INTENSITY_LEVELS, MIN_CHALLENGE_TEXT_LENGTH, MAX_CHALLENGE_TEXT_LENGTH, type IntensityLevel, type ChallengeType } from "../../types";

interface CreatePartnerChallengeModalProps {
  visible: boolean;
  onSubmit: (text: string, level: IntensityLevel, type: ChallengeType) => void;
  onClose: () => void;
}

const CHALLENGE_TYPES: { type: ChallengeType; emoji: string; label: string }[] = [
  { type: "texte", emoji: "✍️", label: "Texte" },
  { type: "photo", emoji: "📸", label: "Photo" },
  { type: "audio", emoji: "🎤", label: "Audio" },
  { type: "video", emoji: "🎬", label: "Vidéo" },
];

export const CreatePartnerChallengeModal = memo<CreatePartnerChallengeModalProps>(({ visible, onSubmit, onClose }) => {
  const [challengeText, setChallengeText] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<IntensityLevel>(2);
  const [selectedType, setSelectedType] = useState<ChallengeType>("texte");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charCount = challengeText.trim().length;
  const isValid = charCount >= MIN_CHALLENGE_TEXT_LENGTH;

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(challengeText.trim(), selectedLevel, selectedType);
    } finally {
      setIsSubmitting(false);
      setChallengeText("");
    }
  }, [isValid, isSubmitting, challengeText, selectedLevel, selectedType, onSubmit]);

  const handleClose = useCallback(() => {
    setChallengeText("");
    setSelectedLevel(2);
    setSelectedType("texte");
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl">
          <SafeAreaView edges={["bottom"]}>
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-800">✨ Créer un défi</Text>
              <Pressable onPress={handleClose} className="w-8 h-8 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200">
                <Ionicons name="close" size={20} color="#374151" />
              </Pressable>
            </View>

            <ScrollView className="max-h-[70vh] px-5 py-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View className="bg-purple-50 rounded-xl p-4 mb-4">
                <Text className="text-purple-700 text-sm">Crée un défi personnalisé pour ton partenaire ! Sois créatif(ve) et assure-toi que le défi est réalisable et respectueux. 💕</Text>
              </View>

              <Text className="text-gray-700 font-medium mb-2">Texte du défi</Text>
              <TextInput
                value={challengeText}
                onChangeText={setChallengeText}
                placeholder="Ex: Envoie-moi un message vocal où tu me dis ce que tu aimes chez moi..."
                multiline
                numberOfLines={4}
                maxLength={MAX_CHALLENGE_TEXT_LENGTH}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 mb-1"
                style={{ minHeight: 100, textAlignVertical: "top" }}
                placeholderTextColor="#9CA3AF"
              />
              <Text className={`text-xs mb-4 ${charCount < MIN_CHALLENGE_TEXT_LENGTH ? "text-red-500" : "text-gray-400"}`}>
                {charCount}/{MAX_CHALLENGE_TEXT_LENGTH} caractères (min {MIN_CHALLENGE_TEXT_LENGTH})
              </Text>

              <Text className="text-gray-700 font-medium mb-2">Niveau d'intensité</Text>
              <View className="flex-row flex-wrap mb-4">
                {INTENSITY_LEVELS.map((level) => (
                  <Pressable
                    key={level.level}
                    onPress={() => setSelectedLevel(level.level)}
                    className={`px-4 py-2 rounded-xl mr-2 mb-2 ${selectedLevel === level.level ? "bg-pink-500" : "bg-gray-100"}`}
                  >
                    <Text className={`font-medium ${selectedLevel === level.level ? "text-white" : "text-gray-700"}`}>
                      {level.emoji} {level.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-gray-700 font-medium mb-2">Type de preuve demandée</Text>
              <View className="flex-row flex-wrap mb-6">
                {CHALLENGE_TYPES.map((item) => (
                  <Pressable
                    key={item.type}
                    onPress={() => setSelectedType(item.type)}
                    className={`px-4 py-2 rounded-xl mr-2 mb-2 ${selectedType === item.type ? "bg-pink-500" : "bg-gray-100"}`}
                  >
                    <Text className={`font-medium ${selectedType === item.type ? "text-white" : "text-gray-700"}`}>
                      {item.emoji} {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View className="px-5 pb-4 pt-2 border-t border-gray-100">
              <Button title={isSubmitting ? "Envoi en cours..." : "Envoyer le défi 🚀"} variant="primary" size="lg" fullWidth disabled={!isValid || isSubmitting} loading={isSubmitting} onPress={handleSubmit} />
              <Button title="Annuler" variant="ghost" size="md" fullWidth onPress={handleClose} />
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

CreatePartnerChallengeModal.displayName = "CreatePartnerChallengeModal";
export default CreatePartnerChallengeModal;
