/**
 * Écran d'inscription
 *
 * Fonctionnalités :
 * - Formulaire complet (email, password, genre, date de naissance)
 * - Validation des champs avec vérification 18+
 * - Sélecteur de genre personnalisé
 * - DatePicker pour la date de naissance
 * - Checkbox CGU obligatoire
 * - Gestion des erreurs et loading state
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
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
 * Formate une date en français
 */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

/**
 * Date maximale (18 ans minimum)
 */
const getMaxDate = (): Date => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - MIN_AGE);
  return date;
};

/**
 * Date minimale (100 ans)
 */
const getMinDate = (): Date => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 100);
  return date;
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

const validateDateOfBirth = (date: Date | null): string | undefined => {
  if (!date) {
    return "La date de naissance est requise";
  }
  const age = calculateAge(date);
  if (age < MIN_AGE) {
    return `Vous devez avoir au moins ${MIN_AGE} ans`;
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
  // State du formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // State UI
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Auth hook
  const { register, isLoading } = useAuth();

  // ----------------------------------------------------------
  // VALIDATION
  // ----------------------------------------------------------

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(
      password,
      confirmPassword
    );
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    const genderError = validateGender(gender);
    if (genderError) newErrors.gender = genderError;

    const dateError = validateDateOfBirth(dateOfBirth);
    if (dateError) newErrors.dateOfBirth = dateError;

    const termsError = validateTerms(termsAccepted);
    if (termsError) newErrors.terms = termsError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, confirmPassword, gender, dateOfBirth, termsAccepted]);

  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------

  const handleRegister = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (!gender || !dateOfBirth) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await register({
        email: email.trim(),
        password,
        displayName: email.split("@")[0], // Nom temporaire basé sur l'email
        gender,
        dateOfBirth,
      });

      if (result.success) {
        console.log("[RegisterScreen] Registration successful");
        // La navigation est gérée automatiquement par le layout auth
      } else {
        setErrors({ general: result.error || "Erreur d'inscription" });
      }
    } catch (error: any) {
      console.error("[RegisterScreen] Registration error:", error);
      setErrors({ general: error.message || "Une erreur est survenue" });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    email,
    password,
    gender,
    dateOfBirth,
    register,
    validateForm,
  ]);

  const handleDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      // Sur Android, le picker se ferme automatiquement
      if (Platform.OS === "android") {
        setShowDatePicker(false);
      }

      if (event.type === "set" && selectedDate) {
        setDateOfBirth(selectedDate);
        if (errors.dateOfBirth) {
          setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
        }
      }
    },
    [errors.dateOfBirth]
  );

  const handleGenderSelect = useCallback(
    (selectedGender: Gender) => {
      setGender(selectedGender);
      if (errors.gender) {
        setErrors((prev) => ({ ...prev, gender: undefined }));
      }
    },
    [errors.gender]
  );

  const handleTermsToggle = useCallback(() => {
    setTermsAccepted((prev) => !prev);
    if (errors.terms) {
      setErrors((prev) => ({ ...prev, terms: undefined }));
    }
  }, [errors.terms]);

  const clearFieldError = useCallback(
    (field: keyof FormErrors) => {
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

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
          contentContainerClassName="flex-grow px-6 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec bouton retour */}
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
              onChangeText={(text) => {
                setEmail(text);
                clearFieldError("email");
              }}
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
              placeholder="Minimum 6 caractères"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearFieldError("password");
              }}
              error={errors.password}
              leftIcon="lock-closed-outline"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              editable={!isButtonDisabled}
              containerClassName="mb-4"
            />

            {/* Confirmation mot de passe */}
            <Input
              label="Confirmer le mot de passe"
              placeholder="Retapez votre mot de passe"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearFieldError("confirmPassword");
              }}
              error={errors.confirmPassword}
              leftIcon="lock-closed-outline"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              editable={!isButtonDisabled}
              containerClassName="mb-4"
            />

            {/* Sélecteur de genre */}
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
                    <Text
                      className={`ml-2 font-medium ${
                        gender === option.value
                          ? "text-pink-500"
                          : "text-gray-600"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.gender && (
                <View className="flex-row items-center mt-1 ml-1">
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-1">
                    {errors.gender}
                  </Text>
                </View>
              )}
            </View>

            {/* Date de naissance */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2 ml-1">
                Date de naissance
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                disabled={isButtonDisabled}
                className={`flex-row items-center bg-white rounded-xl px-4 py-3 border-2 ${
                  errors.dateOfBirth
                    ? "border-red-500"
                    : dateOfBirth
                    ? "border-pink-500"
                    : "border-gray-300"
                }`}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={
                    errors.dateOfBirth
                      ? "#EF4444"
                      : dateOfBirth
                      ? "#EC4899"
                      : "#9CA3AF"
                  }
                />
                <Text
                  className={`flex-1 ml-3 text-base ${
                    dateOfBirth ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {dateOfBirth
                    ? formatDate(dateOfBirth)
                    : "Sélectionnez votre date"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              {errors.dateOfBirth && (
                <View className="flex-row items-center mt-1 ml-1">
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-1">
                    {errors.dateOfBirth}
                  </Text>
                </View>
              )}
              <Text className="text-gray-500 text-xs mt-1 ml-1">
                Vous devez avoir au moins {MIN_AGE} ans
              </Text>
            </View>

            {/* Checkbox CGU */}
            <TouchableOpacity
              onPress={handleTermsToggle}
              disabled={isButtonDisabled}
              className="flex-row items-start mb-6"
            >
              <View
                className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 mt-0.5 ${
                  termsAccepted
                    ? "bg-pink-500 border-pink-500"
                    : errors.terms
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              >
                {termsAccepted && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text className="flex-1 text-gray-600 text-sm">
                J'accepte les{" "}
                <Text className="text-pink-500 font-medium">
                  Conditions Générales d'Utilisation
                </Text>{" "}
                et la{" "}
                <Text className="text-pink-500 font-medium">
                  Politique de Confidentialité
                </Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && (
              <View className="flex-row items-center -mt-4 mb-4 ml-1">
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text className="text-red-500 text-sm ml-1">{errors.terms}</Text>
              </View>
            )}

            {/* Bouton S'inscrire */}
            <Button
              title="S'inscrire"
              variant="primary"
              size="lg"
              fullWidth
              loading={isButtonDisabled}
              onPress={handleRegister}
            />
          </View>

          {/* Lien vers connexion */}
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

      {/* DatePicker Modal pour iOS */}
      {Platform.OS === "ios" && showDatePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowDatePicker(false)}
          >
            <Pressable
              className="bg-white rounded-t-3xl"
              onPress={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text className="text-gray-500 font-medium">Annuler</Text>
                </TouchableOpacity>
                <Text className="text-gray-800 font-semibold">
                  Date de naissance
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text className="text-pink-500 font-semibold">OK</Text>
                </TouchableOpacity>
              </View>

              {/* DatePicker */}
              <DateTimePicker
                value={dateOfBirth || getMaxDate()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={getMaxDate()}
                minimumDate={getMinDate()}
                locale="fr-FR"
                textColor="#1F2937"
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* DatePicker pour Android (s'affiche en popup natif) */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={dateOfBirth || getMaxDate()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={getMaxDate()}
          minimumDate={getMinDate()}
        />
      )}
    </SafeAreaView>
  );
}