/**
 * Écran de profil utilisateur
 *
 * PROMPT PROFILE-EDIT : Ajout modification email et genre
 *
 * Fonctionnalités :
 * - Avatar avec initiale
 * - Modification du nom d'affichage
 * - Modification de l'email (avec réauthentification si nécessaire)
 * - Modification du genre (affecte les défis)
 * - Badge Premium ou bouton upgrade
 * - Bouton Préférences
 * - Déconnexion
 * - Suppression de compte avec confirmation
 * - Version de l'app
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/user.service";
import { authService } from "../../services/auth.service";
import { Button } from "../../components/ui";
import { Gender } from "../../types";

// ============================================================
// COMPOSANTS
// ============================================================

/**
 * Avatar avec initiale de l'utilisateur
 */
function UserAvatar({ name, size = 96 }: { name: string; size?: number }) {
  // Extraire l'initiale (première lettre du prénom)
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  return (
    <LinearGradient
      colors={["#EC4899", "#F472B6"]}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{ fontSize: size * 0.4 }}
        className="text-white font-bold"
      >
        {initial}
      </Text>
    </LinearGradient>
  );
}

/**
 * Badge Premium
 */
function PremiumBadge({ isPremium }: { isPremium: boolean }) {
  if (isPremium) {
    return (
      <View className="flex-row items-center bg-amber-100 px-4 py-2 rounded-full mt-3">
        <Text className="text-lg mr-1">👑</Text>
        <Text className="text-amber-600 font-semibold">Premium</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => router.push("/(main)/premium")}
      activeOpacity={0.8}
      className="flex-row items-center bg-gray-100 px-4 py-2 rounded-full mt-3"
    >
      <Ionicons name="star-outline" size={18} color="#9CA3AF" />
      <Text className="text-gray-500 ml-1">Gratuit</Text>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" className="ml-1" />
    </TouchableOpacity>
  );
}

/**
 * Ligne d'information du profil
 */
function ProfileInfoRow({
  icon,
  label,
  value,
  editable = false,
  onEdit,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  editable?: boolean;
  onEdit?: () => void;
}) {
  return (
    <View className="flex-row items-center py-4 border-b border-gray-100">
      <View className="bg-pink-100 p-2 rounded-xl">
        <Ionicons name={icon} size={20} color="#EC4899" />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-xs text-gray-400 uppercase">{label}</Text>
        <Text className="text-base text-gray-800 mt-1">{value}</Text>
      </View>
      {editable && (
        <TouchableOpacity onPress={onEdit} className="p-2">
          <Ionicons name="pencil" size={20} color="#EC4899" />
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Option de menu
 */
function MenuOption({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center py-4 border-b border-gray-100"
    >
      <View className={`p-2 rounded-xl ${danger ? "bg-red-100" : "bg-gray-100"}`}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? "#EF4444" : "#6B7280"}
        />
      </View>
      <Text
        className={`flex-1 ml-4 text-base ${
          danger ? "text-red-500" : "text-gray-800"
        }`}
      >
        {label}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={danger ? "#EF4444" : "#9CA3AF"}
      />
    </TouchableOpacity>
  );
}

/**
 * Modal de modification du nom
 */
function EditNameModal({
  visible,
  currentName,
  onSave,
  onCancel,
  loading,
}: {
  visible: boolean;
  currentName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(currentName);

  // Reset le state quand le modal s'ouvre
  React.useEffect(() => {
    if (visible) {
      setName(currentName);
    }
  }, [visible, currentName]);

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
              onPress={() => onSave(name.trim())}
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
}

/**
 * Modal de modification de l'email
 */
function EditEmailModal({
  visible,
  currentEmail,
  onSave,
  onCancel,
  loading,
}: {
  visible: boolean;
  currentEmail: string;
  onSave: (email: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState<string | null>(null);

  // Reset le state quand le modal s'ouvre
  React.useEffect(() => {
    if (visible) {
      setEmail(currentEmail);
      setError(null);
    }
  }, [visible, currentEmail]);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSave = () => {
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
  };

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
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
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
}

/**
 * Modal de modification du genre
 */
function EditGenderModal({
  visible,
  currentGender,
  onSave,
  onCancel,
  loading,
}: {
  visible: boolean;
  currentGender: Gender;
  onSave: (gender: Gender) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [selectedGender, setSelectedGender] = useState<Gender>(currentGender);

  // Reset le state quand le modal s'ouvre
  React.useEffect(() => {
    if (visible) {
      setSelectedGender(currentGender);
    }
  }, [visible, currentGender]);

  if (!visible) return null;

  const genderOptions: { value: Gender; label: string; icon: string }[] = [
    { value: "homme", label: "Homme", icon: "male" },
    { value: "femme", label: "Femme", icon: "female" },
  ];

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
            {genderOptions.map((option) => (
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
              onPress={() => onSave(selectedGender)}
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
}

// ============================================================
// ÉCRAN PRINCIPAL
// ============================================================

export default function ProfileScreen() {
  const { userData, firebaseUser, isPremium, logout } = useAuth();

  // States
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Version de l'app
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------

  /**
   * Enregistrer le nouveau nom
   */
  const handleSaveName = async (newName: string) => {
    if (!firebaseUser || !newName) return;

    setIsSaving(true);
    try {
      const result = await userService.updateUserDocument(firebaseUser.uid, {
        displayName: newName,
      });

      if (result.success) {
        setIsEditingName(false);
        Alert.alert("✅ Succès", "Nom modifié avec succès !");
      } else {
        Alert.alert("Erreur", result.error || "Impossible de modifier le nom");
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Enregistrer le nouvel email
   */
  const handleSaveEmail = async (newEmail: string) => {
    if (!firebaseUser || !newEmail) return;

    setIsSaving(true);
    try {
      const result = await userService.updateEmail(firebaseUser.uid, newEmail);

      if (result.success) {
        setIsEditingEmail(false);
        Alert.alert(
          "✅ Email modifié",
          "Un email de vérification a été envoyé à votre nouvelle adresse."
        );
      } else {
        // Si erreur de réauthentification nécessaire
        if (result.code === "auth/requires-recent-login") {
          Alert.alert(
            "Reconnexion requise",
            "Pour des raisons de sécurité, veuillez vous reconnecter avant de modifier votre email.",
            [
              { text: "Annuler", style: "cancel" },
              {
                text: "Se reconnecter",
                onPress: async () => {
                  setIsEditingEmail(false);
                  await logout();
                  router.replace("/(auth)/login");
                },
              },
            ]
          );
        } else {
          Alert.alert("Erreur", result.error || "Impossible de modifier l'email");
        }
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Enregistrer le nouveau genre
   */
  const handleSaveGender = async (newGender: Gender) => {
    if (!firebaseUser) return;

    setIsSaving(true);
    try {
      const result = await userService.updateGender(firebaseUser.uid, newGender);

      if (result.success) {
        setIsEditingGender(false);
        Alert.alert(
          "✅ Genre modifié",
          "Vos futurs défis seront adaptés à votre nouveau profil."
        );
      } else {
        Alert.alert("Erreur", result.error || "Impossible de modifier le genre");
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Déconnexion
   */
  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            const result = await logout();
            if (result.success) {
              router.replace("/(auth)/login");
            } else {
              setIsLoggingOut(false);
              Alert.alert("Erreur", result.error || "Erreur de déconnexion");
            }
          },
        },
      ]
    );
  };

  /**
   * Suppression du compte
   */
  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes vos données seront supprimées définitivement.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  /**
   * Confirmation finale de suppression
   */
  const confirmDeleteAccount = () => {
    Alert.alert(
      "Confirmation finale",
      "Êtes-vous vraiment sûr de vouloir supprimer votre compte ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Je confirme",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await authService.deleteAccount();
              if (result.success) {
                router.replace("/(auth)/login");
              } else {
                Alert.alert(
                  "Erreur",
                  result.error || "Impossible de supprimer le compte"
                );
              }
            } catch (error) {
              Alert.alert("Erreur", "Une erreur est survenue");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-pink-50" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-800 ml-2">
            Mon Profil
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ========== SECTION AVATAR ========== */}
          <View className="items-center py-8 bg-white">
            <UserAvatar name={userData?.displayName || ""} size={100} />

            <Text className="text-2xl font-bold text-gray-800 mt-4">
              {userData?.displayName || "Utilisateur"}
            </Text>

            <Text className="text-gray-500 mt-1">
              {userData?.email}
            </Text>

            <PremiumBadge isPremium={isPremium} />
          </View>

          {/* ========== INFORMATIONS DU PROFIL ========== */}
          <View className="bg-white mt-4 mx-4 rounded-2xl px-4 shadow-sm">
            <ProfileInfoRow
              icon="person-outline"
              label="Nom d'affichage"
              value={userData?.displayName || "Non défini"}
              editable
              onEdit={() => setIsEditingName(true)}
            />

            <ProfileInfoRow
              icon="mail-outline"
              label="Email"
              value={userData?.email || "Non défini"}
              editable
              onEdit={() => setIsEditingEmail(true)}
            />

            <ProfileInfoRow
              icon="male-female-outline"
              label="Genre"
              value={userData?.gender === "homme" ? "Homme" : "Femme"}
              editable
              onEdit={() => setIsEditingGender(true)}
            />
          </View>

          {/* ========== PREMIUM ========== */}
          {!isPremium && (
            <TouchableOpacity
              onPress={() => router.push("/(main)/premium")}
              activeOpacity={0.9}
              className="mx-4 mt-4"
            >
              <LinearGradient
                colors={["#EC4899", "#F472B6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-2xl p-4"
              >
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">👑</Text>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg">
                      Passez Premium
                    </Text>
                    <Text className="text-white/80 text-sm">
                      Débloquez tous les défis
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={24} color="#FFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ========== ACTIONS ========== */}
          <View className="bg-white mt-4 mx-4 rounded-2xl px-4 shadow-sm">
            {/* Préférences */}
            <MenuOption
              icon="settings-outline"
              label="Préférences"
              onPress={() => router.push("/(main)/preferences")}
            />

            {/* Déconnexion */}
            <MenuOption
              icon="log-out-outline"
              label="Se déconnecter"
              onPress={handleLogout}
            />

            {/* Suppression */}
            <MenuOption
              icon="trash-outline"
              label="Supprimer mon compte"
              onPress={handleDeleteAccount}
              danger
            />
          </View>

          {/* ========== VERSION ========== */}
          <View className="items-center mt-8">
            <Text className="text-gray-400 text-sm">
              Intimacy Play v{appVersion}
            </Text>
            <Text className="text-gray-300 text-xs mt-1">
              Made with 💕
            </Text>
          </View>
        </ScrollView>

        {/* ========== MODALS ========== */}
        
        {/* Modal Edit Name */}
        <EditNameModal
          visible={isEditingName}
          currentName={userData?.displayName || ""}
          onSave={handleSaveName}
          onCancel={() => setIsEditingName(false)}
          loading={isSaving}
        />

        {/* Modal Edit Email */}
        <EditEmailModal
          visible={isEditingEmail}
          currentEmail={userData?.email || ""}
          onSave={handleSaveEmail}
          onCancel={() => setIsEditingEmail(false)}
          loading={isSaving}
        />

        {/* Modal Edit Gender */}
        <EditGenderModal
          visible={isEditingGender}
          currentGender={userData?.gender || "homme"}
          onSave={handleSaveGender}
          onCancel={() => setIsEditingGender(false)}
          loading={isSaving}
        />

        {/* ========== LOADING OVERLAY ========== */}
        {(isLoggingOut || isDeleting) && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center">
            <View className="bg-white rounded-2xl p-6 items-center">
              <ActivityIndicator size="large" color="#EC4899" />
              <Text className="text-gray-600 mt-4">
                {isDeleting ? "Suppression en cours..." : "Déconnexion..."}
              </Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}