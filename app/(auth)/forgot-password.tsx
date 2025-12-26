/**
 * Écran de réinitialisation du mot de passe
 *
 * PROMPT FORGOT-PASSWORD : Implémentation complète
 *
 * Fonctionnalités :
 * - Formulaire email
 * - Validation de l'email
 * - Envoi de l'email de réinitialisation via Firebase
 * - Écran de confirmation après envoi
 * - Possibilité de renvoyer l'email
 * - Gestion des erreurs
 * - Loading state
 * - Retour vers connexion
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input } from "../../components/ui";
import { authService } from "../../services/auth.service";

// ============================================================
// VALIDATION
// ============================================================

interface FormErrors {
  email?: string;
  general?: string;
}

const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) {
    return "L'email est requis";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Format d'email invalide";
  }
  return undefined;
};

// ============================================================
// COMPOSANT ÉCRAN DE SUCCÈS
// ============================================================

interface SuccessScreenProps {
  email: string;
  onResend: () => void;
  onBackToLogin: () => void;
  isResending: boolean;
  resendCooldown: number;
}

function SuccessScreen({
  email,
  onResend,
  onBackToLogin,
  isResending,
  resendCooldown,
}: SuccessScreenProps) {
  return (
    <View className="flex-1 justify-center px-6">
      {/* Icône de succès */}
      <View className="items-center mb-8">
        <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-4">
          <Ionicons name="mail-outline" size={48} color="#22C55E" />
        </View>
        <Text className="text-2xl font-bold text-gray-800 text-center">
          Email envoyé !
        </Text>
      </View>

      {/* Message de confirmation */}
      <View className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <Text className="text-gray-600 text-center leading-6">
          Un email de réinitialisation a été envoyé à{" "}
          <Text className="font-semibold text-gray-800">{email}</Text>
        </Text>

        <View className="bg-amber-50 rounded-xl p-4 mt-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={20} color="#D97706" />
            <Text className="text-amber-700 text-sm ml-2 flex-1">
              Vérifiez également vos spams si vous ne trouvez pas l'email.
              Le lien expire après 1 heure.
            </Text>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <Text className="text-gray-800 font-semibold mb-3">
          Étapes suivantes :
        </Text>
        
        <View className="flex-row items-center mb-3">
          <View className="w-6 h-6 rounded-full bg-pink-100 items-center justify-center mr-3">
            <Text className="text-pink-600 font-bold text-sm">1</Text>
          </View>
          <Text className="text-gray-600 flex-1">Ouvrez votre boîte email</Text>
        </View>
        
        <View className="flex-row items-center mb-3">
          <View className="w-6 h-6 rounded-full bg-pink-100 items-center justify-center mr-3">
            <Text className="text-pink-600 font-bold text-sm">2</Text>
          </View>
          <Text className="text-gray-600 flex-1">Cliquez sur le lien de réinitialisation</Text>
        </View>
        
        <View className="flex-row items-center">
          <View className="w-6 h-6 rounded-full bg-pink-100 items-center justify-center mr-3">
            <Text className="text-pink-600 font-bold text-sm">3</Text>
          </View>
          <Text className="text-gray-600 flex-1">Créez votre nouveau mot de passe</Text>
        </View>
      </View>

      {/* Boutons */}
      <Button
        title="Retour à la connexion"
        variant="primary"
        size="lg"
        fullWidth
        onPress={onBackToLogin}
        className="mb-4"
      />

      <TouchableOpacity
        onPress={onResend}
        disabled={isResending || resendCooldown > 0}
        className="py-3"
      >
        <Text
          className={`text-center font-medium ${
            isResending || resendCooldown > 0 ? "text-gray-400" : "text-pink-500"
          }`}
        >
          {isResending
            ? "Envoi en cours..."
            : resendCooldown > 0
            ? `Renvoyer dans ${resendCooldown}s`
            : "Renvoyer l'email"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function ForgotPasswordScreen() {
  // States
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email]);

  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------

  /**
   * Envoyer l'email de réinitialisation
   */
  const handleSubmit = useCallback(async () => {
    // Valider le formulaire
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await authService.resetPassword(email.trim().toLowerCase());

      if (result.success) {
        console.log("[ForgotPasswordScreen] Reset email sent successfully");
        setIsSuccess(true);
        startResendCooldown();
      } else {
        // On affiche un message générique pour des raisons de sécurité
        // (ne pas révéler si l'email existe ou non)
        if (result.code === "auth/user-not-found") {
          // Pour la sécurité, on montre quand même le succès
          // L'utilisateur ne saura pas si l'email existe
          setIsSuccess(true);
          startResendCooldown();
        } else {
          setErrors({ general: result.error || "Erreur lors de l'envoi" });
        }
      }
    } catch (error: any) {
      console.error("[ForgotPasswordScreen] Error:", error);
      setErrors({ general: "Une erreur est survenue. Réessayez." });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, validateForm]);

  /**
   * Renvoyer l'email
   */
  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;

    setIsSubmitting(true);

    try {
      const result = await authService.resetPassword(email.trim().toLowerCase());

      if (result.success) {
        console.log("[ForgotPasswordScreen] Resend successful");
        startResendCooldown();
      }
    } catch (error) {
      console.error("[ForgotPasswordScreen] Resend error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, resendCooldown]);

  /**
   * Démarrer le cooldown pour le renvoi
   */
  const startResendCooldown = useCallback(() => {
    setResendCooldown(60); // 60 secondes

    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /**
   * Retour à la connexion
   */
  const handleBackToLogin = useCallback(() => {
    router.replace("/(auth)/login");
  }, []);

  /**
   * Changement de l'email
   */
  const handleEmailChange = useCallback(
    (text: string) => {
      setEmail(text);
      // Clear error on change
      if (errors.email) {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
    },
    [errors.email]
  );

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  // Écran de succès
  if (isSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-pink-50">
        <StatusBar style="dark" />
        <SuccessScreen
          email={email}
          onResend={handleResend}
          onBackToLogin={handleBackToLogin}
          isResending={isSubmitting}
          resendCooldown={resendCooldown}
        />
      </SafeAreaView>
    );
  }

  // Formulaire
  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec bouton retour */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-4 left-0 p-2 z-10"
            disabled={isSubmitting}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          {/* Icône et Titre */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-full bg-pink-100 items-center justify-center mb-4">
              <Ionicons name="key-outline" size={40} color="#EC4899" />
            </View>
            <Text className="text-3xl font-bold text-gray-800">
              Mot de passe oublié ?
            </Text>
            <Text className="text-gray-500 mt-2 text-center px-4">
              Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe
            </Text>
          </View>

          {/* Formulaire */}
          <View className="bg-white rounded-3xl p-6 shadow-sm">
            {/* Erreur générale */}
            {errors.general && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <Text className="text-red-600 text-center">{errors.general}</Text>
              </View>
            )}

            {/* Email */}
            <Input
              label="Adresse email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={handleEmailChange}
              error={errors.email}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={!isSubmitting}
              containerClassName="mb-6"
            />

            {/* Bouton Envoyer */}
            <Button
              title="Envoyer le lien"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              onPress={handleSubmit}
            />
          </View>

          {/* Lien retour connexion */}
          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-gray-600">Vous vous souvenez ? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity disabled={isSubmitting}>
                <Text className="text-pink-500 font-bold">Se connecter</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}