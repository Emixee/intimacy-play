/**
 * Écran d'inscription
 *
 * Version avec TextInput pour la date de naissance
 * Format JJ/MM/AAAA avec auto-formatage
 * Liens cliquables vers CGU et Politique de confidentialité
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
import { useAuth } from "../../hooks/useAuth";
import { Gender } from "../../types";

// ============================================================
// TYPES
// ============================================================

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  gender?: string;
  dateOfBirth?: string;
  terms?: string;
  general?: string;
}

// ============================================================
// CONSTANTES
// ============================================================

const MIN_AGE = 18;

const GENDER_OPTIONS: { value: Gender; label: string; icon: string }[] = [
  { value: "homme", label: "Homme", icon: "male" },
  { value: "femme", label: "Femme", icon: "female" },
];

// ============================================================
// HELPERS
// ============================================================

/**
 * Parse une date au format JJ/MM/AAAA
 */
const parseDate = (dateString: string): Date | null => {
  const parts = dateString.split("/");
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31) return null;
  if (month < 0 || month > 11) return null;
  if (year < 1900 || year > new Date().getFullYear()) return null;

  const date = new Date(year, month, day);

  if (
    date.getDate() !== day ||
    date.getMonth() !== month ||
    date.getFullYear() !== year
  ) {
    return null;
  }

  return date;
};

/**
 * Calcule l'âge à partir d'une date de naissance
 */
const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

/**
 * Formate l'input de date (ajoute les / automatiquement)
 */
const formatDateInput = (text: string): string => {
  const numbers = text.replace(/\D/g, "");
  const limited = numbers.slice(0, 8);

  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 4) {
    return `${limited.slice(0, 2)}/${limited.slice(2)}`;
  } else {
    return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
  }
};

// ============================================================
// VALIDATION
// ============================================================

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

const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | undefined => {
  if (!confirmPassword) {
    return "Confirmez votre mot de passe";
  }
  if (password !== confirmPassword) {
    return "Les mots de passe ne correspondent pas";
  }
  return undefined;
};

const validateGender = (gender: Gender | null): string | undefined => {
  if (!gender) {
    return "Sélectionnez votre genre";
  }
  return undefined;
};

const validateDateOfBirth = (dateString: string): string | undefined => {
  if (!dateString.trim()) {
    return "La date de naissance est requise";
  }

  if (dateString.length !== 10) {
    return "Format attendu : JJ/MM/AAAA";
  }

  const date = parseDate(dateString);
  if (!date) {
    return "Date invalide";
  }

  const age = calculateAge(date);
  if (age < MIN_AGE) {
    return `Vous devez avoir au moins ${MIN_AGE} ans`;
  }

  if (age > 120) {
    return "Date invalide";
  }

  return undefined;
};

const validateTerms = (accepted: boolean): string | undefined => {
  if (!accepted) {
    return "Vous devez accepter les conditions";
  }
  return undefined;
};

// ============================================================
// COMPOSANT
// ============================================================

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [dateOfBirthString, setDateOfBirthString] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isLoading } = useAuth();

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    const genderError = validateGender(gender);
    if (genderError) newErrors.gender = genderError;

    const dateError = validateDateOfBirth(dateOfBirthString);
    if (dateError) newErrors.dateOfBirth = dateError;

    const termsError = validateTerms(termsAccepted);
    if (termsError) newErrors.terms = termsError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, confirmPassword, gender, dateOfBirthString, termsAccepted]);

  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;

    const dateOfBirth = parseDate(dateOfBirthString);
    if (!gender || !dateOfBirth) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await register({
        email: email.trim(),
        password,
        displayName: email.split("@")[0],
        gender,
        dateOfBirth,
      });

      if (!result.success) {
        setErrors({ general: result.error || "Erreur d'inscription" });
      }
    } catch (error: any) {
      setErrors({ general: error.message || "Une erreur est survenue" });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, gender, dateOfBirthString, register, validateForm]);

  const handleDateChange = useCallback((text: string) => {
    const formatted = formatDateInput(text);
    setDateOfBirthString(formatted);
    if (errors.dateOfBirth) {
      setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
    }
  }, [errors.dateOfBirth]);

  const handleGenderSelect = useCallback((selectedGender: Gender) => {
    setGender(selectedGender);
    if (errors.gender) {
      setErrors((prev) => ({ ...prev, gender: undefined }));
    }
  }, [errors.gender]);

  const handleTermsToggle = useCallback(() => {
    setTermsAccepted((prev) => !prev);
    if (errors.terms) {
      setErrors((prev) => ({ ...prev, terms: undefined }));
    }
  }, [errors.terms]);

  const clearFieldError = useCallback((field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Navigation vers les pages légales
  // Routes typées explicitement pour éviter les erreurs TypeScript
  const navigateToTerms = useCallback(() => {
    const route: any = "/(auth)/terms-of-use";
    router.push(route);
  }, []);

  const navigateToPrivacy = useCallback(() => {
    const route: any = "/(auth)/privacy-policy";
    router.push(route);
  }, []);

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
          contentContainerClassName="flex-grow px-6 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 -ml-2"
              disabled={isButtonDisabled}
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Titre */}
          <View className="items-center mb-8">
            <Text className="text-6xl mb-2">💕</Text>
            <Text className="text-3xl font-bold text-pink-500">
              Créer un compte
            </Text>
            <Text className="text-gray-500 mt-2 text-center">
              Rejoignez l'aventure et ravivez la flamme
            </Text>
          </View>

          {/* Formulaire */}
          <View className="bg-white rounded-3xl p-6 shadow-sm">
            {errors.general && (
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <Text className="text-red-600 text-center">{errors.general}</Text>
              </View>
            )}

            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={(text) => { setEmail(text); clearFieldError("email"); }}
              error={errors.email}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!isButtonDisabled}
              containerClassName="mb-4"
            />

            <Input
              label="Mot de passe"
              placeholder="Minimum 6 caractères"
              value={password}
              onChangeText={(text) => { setPassword(text); clearFieldError("password"); }}
              error={errors.password}
              leftIcon="lock-closed-outline"
              secureTextEntry
              autoCapitalize="none"
              editable={!isButtonDisabled}
              containerClassName="mb-4"
            />

            <Input
              label="Confirmer le mot de passe"
              placeholder="Retapez votre mot de passe"
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); clearFieldError("confirmPassword"); }}
              error={errors.confirmPassword}
              leftIcon="lock-closed-outline"
              secureTextEntry
              autoCapitalize="none"
              editable={!isButtonDisabled}
              containerClassName="mb-4"
            />

            {/* Genre */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2 ml-1">Genre</Text>
              <View className="flex-row gap-3">
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleGenderSelect(option.value)}
                    disabled={isButtonDisabled}
                    className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-xl border-2 ${
                      gender === option.value
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={gender === option.value ? "#EC4899" : "#9CA3AF"}
                    />
                    <Text className={`ml-2 font-medium ${
                      gender === option.value ? "text-pink-500" : "text-gray-600"
                    }`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.gender && (
                <View className="flex-row items-center mt-1 ml-1">
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-1">{errors.gender}</Text>
                </View>
              )}
            </View>

            {/* Date de naissance */}
            <Input
              label="Date de naissance"
              placeholder="JJ/MM/AAAA"
              value={dateOfBirthString}
              onChangeText={handleDateChange}
              error={errors.dateOfBirth}
              leftIcon="calendar-outline"
              keyboardType="number-pad"
              maxLength={10}
              editable={!isButtonDisabled}
              containerClassName="mb-2"
              hint={`Vous devez avoir au moins ${MIN_AGE} ans`}
            />

            {/* CGU avec liens cliquables */}
            <View className="mb-6 mt-4">
              <TouchableOpacity
                onPress={handleTermsToggle}
                disabled={isButtonDisabled}
                className="flex-row items-start"
                activeOpacity={0.7}
              >
                <View className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 mt-0.5 ${
                  termsAccepted
                    ? "bg-pink-500 border-pink-500"
                    : errors.terms
                    ? "border-red-500"
                    : "border-gray-300"
                }`}>
                  {termsAccepted && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm">
                    J'accepte les{" "}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* Liens vers les documents légaux */}
              <View className="flex-row flex-wrap ml-9 -mt-1">
                <TouchableOpacity
                  onPress={navigateToTerms}
                  disabled={isButtonDisabled}
                  hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                >
                  <Text className="text-pink-500 font-medium text-sm underline">
                    Conditions Générales d'Utilisation
                  </Text>
                </TouchableOpacity>
                <Text className="text-gray-600 text-sm"> et la </Text>
                <TouchableOpacity
                  onPress={navigateToPrivacy}
                  disabled={isButtonDisabled}
                  hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                >
                  <Text className="text-pink-500 font-medium text-sm underline">
                    Politique de Confidentialité
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {errors.terms && (
              <View className="flex-row items-center -mt-4 mb-4 ml-1">
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text className="text-red-500 text-sm ml-1">{errors.terms}</Text>
              </View>
            )}

            <Button
              title="S'inscrire"
              variant="primary"
              size="lg"
              fullWidth
              loading={isButtonDisabled}
              onPress={handleRegister}
            />
          </View>

          {/* Lien connexion */}
          <View className="flex-row justify-center items-center mt-6 mb-4">
            <Text className="text-gray-600">Déjà un compte ? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity disabled={isButtonDisabled}>
                <Text className="text-pink-500 font-bold">Se connecter</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}