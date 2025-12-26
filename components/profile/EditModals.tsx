/**
 * Modals d'édition du profil
 * 
 * Extraits de profile.tsx pour optimisation
 * - EditNameModal
 * - EditEmailModal
 * - EditGenderModal
 */

import React, { memo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Gender } from "../../../types";

// ============================================================
// EDIT NAME MODAL
// ============================================================

interface EditNameModalProps {
  visible: boolean;
  currentName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
  loading: boolean;
}

export const EditNameModal = memo<EditNameModalProps>(({
  visible,
  currentName,
  onSave,
  onCancel,
  loading,
}) => {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (visible) {
      setName(currentName);
    }
  }, [visible, currentName]);

  const handleSave = useCallback(() => {
    onSave(name.trim());
  }, [name, onSave]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Modifier le nom
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Votre nom"
            className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 bg-gray-50"
            autoFocus
            maxLength={50}
          />

          <View className="flex-row mt-6 gap-3">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gray-100"
            >
              <Text className="text-center text-gray-600 font-semibold">
                Annuler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={loading || !name.trim()}
              className={`flex-1 py-3 rounded-xl ${
                loading || !name.trim() ? "bg-pink-300" : "bg-pink-500"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text className="text-center text-white font-semibold">
                  Enregistrer
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

EditNameModal.displayName = "EditNameModal";

// ============================================================
// EDIT EMAIL MODAL
// ============================================================

interface EditEmailModalProps {
  visible: boolean;
  currentEmail: string;
  onSave: (email: string) => void;
  onCancel: () => void;
  loading: boolean;
}

export const EditEmailModal = memo<EditEmailModalProps>(({
  visible,
  currentEmail,
  onSave,
  onCancel,
  loading,
}) => {
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setEmail(currentEmail);
      setError(null);
    }
  }, [visible, currentEmail]);

  const validateEmail = useCallback((value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }, []);

  const handleSave = useCallback(() => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      setError("L'email est requis");
      return;
    }
    
    if (!validateEmail(trimmedEmail)) {
      setError("Format d'email invalide");
      return;
    }
    
    if (trimmedEmail === currentEmail.toLowerCase()) {
      setError("C'est déjà votre email actuel");
      return;
    }
    
    setError(null);
    onSave(trimmedEmail);
  }, [email, currentEmail, validateEmail, onSave]);

  const handleChangeText = useCallback((text: string) => {
    setEmail(text);
    setError(null);
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
          <Text className="text-xl font-bold text-gray-800 mb-2">
            Modifier l'email
          </Text>
          
          <Text className="text-sm text-gray-500 mb-4">
            Un email de vérification sera envoyé à la nouvelle adresse.
          </Text>

          <TextInput
            value={email}
            onChangeText={handleChangeText}
            placeholder="nouvel@email.com"
            className={`border rounded-xl px-4 py-3 text-base text-gray-800 bg-gray-50 ${
              error ? "border-red-500" : "border-gray-200"
            }`}
            autoFocus
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {error && (
            <Text className="text-red-500 text-sm mt-2">{error}</Text>
          )}

          <View className="bg-amber-50 rounded-xl p-3 mt-4">
            <View className="flex-row items-center">
              <Ionicons name="warning-outline" size={18} color="#D97706" />
              <Text className="text-amber-700 text-sm ml-2 flex-1">
                Si vous avez changé d'email récemment, vous devrez peut-être vous reconnecter.
              </Text>
            </View>
          </View>

          <View className="flex-row mt-6 gap-3">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gray-100"
            >
              <Text className="text-center text-gray-600 font-semibold">
                Annuler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              className={`flex-1 py-3 rounded-xl ${
                loading ? "bg-pink-300" : "bg-pink-500"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text className="text-center text-white font-semibold">
                  Modifier
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

EditEmailModal.displayName = "EditEmailModal";

// ============================================================
// EDIT GENDER MODAL
// ============================================================

interface EditGenderModalProps {
  visible: boolean;
  currentGender: Gender;
  onSave: (gender: Gender) => void;
  onCancel: () => void;
  loading: boolean;
}

const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: "homme", label: "Homme", icon: "male" },
  { value: "femme", label: "Femme", icon: "female" },
];

export const EditGenderModal = memo<EditGenderModalProps>(({
  visible,
  currentGender,
  onSave,
  onCancel,
  loading,
}) => {
  const [selectedGender, setSelectedGender] = useState<Gender>(currentGender);

  useEffect(() => {
    if (visible) {
      setSelectedGender(currentGender);
    }
  }, [visible, currentGender]);

  const handleSave = useCallback(() => {
    onSave(selectedGender);
  }, [selectedGender, onSave]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
          <Text className="text-xl font-bold text-gray-800 mb-2">
            Modifier le genre
          </Text>
          
          <Text className="text-sm text-gray-500 mb-4">
            Ce changement affectera les défis proposés dans vos futures parties.
          </Text>

          <View className="gap-3">
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelectedGender(option.value)}
                disabled={loading}
                className={`flex-row items-center justify-center py-4 px-4 rounded-xl border-2 ${
                  selectedGender === option.value
                    ? "border-pink-500 bg-pink-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={selectedGender === option.value ? "#EC4899" : "#9CA3AF"}
                />
                <Text
                  className={`ml-3 font-medium text-lg ${
                    selectedGender === option.value ? "text-pink-500" : "text-gray-600"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-blue-50 rounded-xl p-3 mt-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
              <Text className="text-blue-700 text-sm ml-2 flex-1">
                Les défis sont personnalisés selon votre genre. Les sessions en cours ne seront pas affectées.
              </Text>
            </View>
          </View>

          <View className="flex-row mt-6 gap-3">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gray-100"
            >
              <Text className="text-center text-gray-600 font-semibold">
                Annuler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={loading || selectedGender === currentGender}
              className={`flex-1 py-3 rounded-xl ${
                loading || selectedGender === currentGender ? "bg-pink-300" : "bg-pink-500"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text className="text-center text-white font-semibold">
                  Enregistrer
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

EditGenderModal.displayName = "EditGenderModal";
