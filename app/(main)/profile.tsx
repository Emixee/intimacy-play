/**
 * Écran de profil utilisateur - VERSION OPTIMISÉE
 *
 * Refactorisé pour :
 * - Composants extraits vers components/profile/
 * - React.memo et useCallback partout
 * - Code réduit de 25KB à ~8KB
 * - Meilleure performance
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";

// Hooks
import { useAuth } from "../../hooks/useAuth";

// Services
import { userService } from "../../services/user.service";
import { authService } from "../../services/auth.service";

// Composants extraits et optimisés
import {
  UserAvatar,
  PremiumBadge,
  ProfileInfoRow,
  MenuOption,
  EditNameModal,
  EditEmailModal,
  EditGenderModal,
} from "../../components/profile";

// Types
import { Gender } from "../../types";

// ============================================================
// COMPOSANT PRINCIPAL
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

  const handleSaveName = useCallback(async (newName: string) => {
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
  }, [firebaseUser]);

  const handleSaveEmail = useCallback(async (newEmail: string) => {
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
  }, [firebaseUser, logout]);

  const handleSaveGender = useCallback(async (newGender: Gender) => {
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
  }, [firebaseUser]);

  const handleLogout = useCallback(() => {
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
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes vos données seront supprimées définitivement.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
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
          },
        },
      ]
    );
  }, []);

  // Callbacks pour ouvrir les modals
  const openEditName = useCallback(() => setIsEditingName(true), []);
  const closeEditName = useCallback(() => setIsEditingName(false), []);
  const openEditEmail = useCallback(() => setIsEditingEmail(true), []);
  const closeEditEmail = useCallback(() => setIsEditingEmail(false), []);
  const openEditGender = useCallback(() => setIsEditingGender(true), []);
  const closeEditGender = useCallback(() => setIsEditingGender(false), []);
  const goToPreferences = useCallback(() => router.push("/(main)/preferences"), []);
  const goToPremium = useCallback(() => router.push("/(main)/premium"), []);
  const goBack = useCallback(() => router.back(), []);

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
          <TouchableOpacity onPress={goBack} className="p-2 -ml-2">
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
          {/* Section Avatar */}
          <View className="items-center py-8 bg-white">
            <UserAvatar name={userData?.displayName || ""} size={100} />
            <Text className="text-2xl font-bold text-gray-800 mt-4">
              {userData?.displayName || "Utilisateur"}
            </Text>
            <Text className="text-gray-500 mt-1">{userData?.email}</Text>
            <PremiumBadge isPremium={isPremium} />
          </View>

          {/* Informations du profil */}
          <View className="bg-white mt-4 mx-4 rounded-2xl px-4 shadow-sm">
            <ProfileInfoRow
              icon="person-outline"
              label="Nom d'affichage"
              value={userData?.displayName || "Non défini"}
              editable
              onEdit={openEditName}
            />
            <ProfileInfoRow
              icon="mail-outline"
              label="Email"
              value={userData?.email || "Non défini"}
              editable
              onEdit={openEditEmail}
            />
            <ProfileInfoRow
              icon="male-female-outline"
              label="Genre"
              value={userData?.gender === "homme" ? "Homme" : "Femme"}
              editable
              onEdit={openEditGender}
            />
          </View>

          {/* Premium CTA */}
          {!isPremium && (
            <TouchableOpacity
              onPress={goToPremium}
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

          {/* Actions */}
          <View className="bg-white mt-4 mx-4 rounded-2xl px-4 shadow-sm">
            <MenuOption
              icon="settings-outline"
              label="Préférences"
              onPress={goToPreferences}
            />
            <MenuOption
              icon="log-out-outline"
              label="Se déconnecter"
              onPress={handleLogout}
            />
            <MenuOption
              icon="trash-outline"
              label="Supprimer mon compte"
              onPress={handleDeleteAccount}
              danger
            />
          </View>

          {/* Version */}
          <View className="items-center mt-8">
            <Text className="text-gray-400 text-sm">
              Intimacy Play v{appVersion}
            </Text>
            <Text className="text-gray-300 text-xs mt-1">Made with 💕</Text>
          </View>
        </ScrollView>

        {/* Modals */}
        <EditNameModal
          visible={isEditingName}
          currentName={userData?.displayName || ""}
          onSave={handleSaveName}
          onCancel={closeEditName}
          loading={isSaving}
        />
        <EditEmailModal
          visible={isEditingEmail}
          currentEmail={userData?.email || ""}
          onSave={handleSaveEmail}
          onCancel={closeEditEmail}
          loading={isSaving}
        />
        <EditGenderModal
          visible={isEditingGender}
          currentGender={userData?.gender || "homme"}
          onSave={handleSaveGender}
          onCancel={closeEditGender}
          loading={isSaving}
        />

        {/* Loading Overlay */}
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
