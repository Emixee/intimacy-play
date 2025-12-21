/**
 * Écran de connexion
 *
 * Fonctionnalités :
 * - Formulaire email/mot de passe
 * - Validation des champs
 * - Gestion des erreurs
 * - Loading state
 * - Navigation vers inscription et mot de passe oublié
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button, Input } from "../../components/ui";
import { useAuth } from "../../hooks/useAuth";

// ============================================================
// VALIDATION
// ============================================================

interface FormErrors {
  email?: string;
  password?: string;
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

const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return "Le mot de passe est requis";
  }
  if (password.length < 6) {
    return "Minimum 6 caractères";
  }
  return undefined;
};

// ============================================================
// COMPOSANT
// ============================================================

export default function LoginScreen() {
  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth hook
  const { login, isLoading } = useAuth();

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------

  const handleLogin = useCallback(async () => {
    // Valider le formulaire
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await login({ email: email.trim(), password });

      if (result.success) {
        // La navigation est gérée automatiquement par le layout auth
        // via le listener onAuthStateChanged
        console.log("[LoginScreen] Login successful");
      } else {
        setErrors({ general: result.error || "Erreur de connexion" });
      }
    } catch (error: any) {
      console.error("[LoginScreen] Login error:", error);
      setErrors({ general: error.message || "Une erreur est survenue" });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, login, validateForm]);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    // Clear error on change
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  }, [errors.email]);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    // Clear error on change
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  }, [errors.password]);

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  const isButtonDisabled = isSubmitting || isLoading;

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
          {/* Logo / Titre */}
          <View className="items-center mb-10">
            <Text className="text-6xl mb-2">🔥</Text>
            <Text className="text-3xl font-bold text-pink-500 mt-2">
              Couple Game
            </Text>
            <Text className="text-gray-500 mt-2 text-center">
              Reconnectez-vous pour continuer
            </Text>
          </View>

          {/* Formulaire */}
          <View className="bg-white rounded-3xl p-6 shadow-sm">
            {/* Erreur générale */}
            {errors.general && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <Text className="text-red-600 text-center">
                  {errors.general}
                </Text>
              </View>
            )}

            {/* Email */}
            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={handleEmailChange}
              error={errors.email}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
              editable={!isButtonDisabled}
              containerClassName="mb-4"
            />

            {/* Mot de passe */}
            <Input
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChangeText={handlePasswordChange}
              error={errors.password}
              leftIcon="lock-closed-outline"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!isButtonDisabled}
              containerClassName="mb-2"
            />

            {/* Mot de passe oublié */}
            <View className="items-end mb-6">
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity disabled={isButtonDisabled}>
                  <Text className="text-pink-500 font-medium">
                    Mot de passe oublié ?
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Bouton Se connecter */}
            <Button
              title="Se connecter"
              variant="primary"
              size="lg"
              fullWidth
              loading={isButtonDisabled}
              onPress={handleLogin}
            />
          </View>

          {/* Lien vers inscription */}
          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-gray-600">Pas encore de compte ? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity disabled={isButtonDisabled}>
                <Text className="text-pink-500 font-bold">S'inscrire</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Version info */}
          <Text className="text-center text-gray-400 text-xs mt-8">
            Version 1.0.0
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}