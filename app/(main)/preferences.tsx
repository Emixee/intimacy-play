/**
 * Écran des préférences utilisateur
 *
 * Sections :
 * - Thèmes : 2 gratuits + 22 premium (grille)
 * - Jouets : 10 jouets (Premium)
 * - Médias : Photo/Audio/Vidéo toggles (Premium)
 * - Petit nom : Input (Premium)
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "../../hooks/useAuth";
import { preferencesService } from "../../services/preferences.service";
import { PaywallModal } from "../../components/ui/PaywallModal";
import { THEMES_FREE, THEMES_PREMIUM, TOYS } from "../../utils/constants";
import { Theme, Toy } from "../../types";

// ============================================================
// TYPES
// ============================================================

interface ThemeItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

interface ToyItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

// ============================================================
// COMPOSANTS
// ============================================================

/**
 * Header de section
 */
function SectionHeader({
  title,
  icon,
  isPremium = false,
  locked = false,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  isPremium?: boolean;
  locked?: boolean;
}) {
  return (
    <View className="flex-row items-center mb-4 mt-6">
      <View className="bg-pink-100 p-2 rounded-xl">
        <Ionicons name={icon} size={20} color="#EC4899" />
      </View>
      <Text className="text-lg font-bold text-gray-800 ml-3 flex-1">
        {title}
      </Text>
      {isPremium && (
        <View className="flex-row items-center bg-amber-100 px-2 py-1 rounded-full">
          <Text className="text-sm mr-1">👑</Text>
          <Text className="text-amber-600 text-xs font-medium">Premium</Text>
        </View>
      )}
      {locked && (
        <Ionicons name="lock-closed" size={18} color="#9CA3AF" />
      )}
    </View>
  );
}

/**
 * Item de thème
 */
function ThemeGridItem({
  theme,
  isSelected,
  isPremium,
  isLocked,
  onPress,
}: {
  theme: ThemeItem;
  isSelected: boolean;
  isPremium: boolean;
  isLocked: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`w-[31%] m-[1%] rounded-2xl p-3 border-2 ${
        isSelected
          ? "border-pink-500 bg-pink-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <View className="items-center">
        {/* Emoji */}
        <Text className="text-3xl mb-1">{theme.emoji}</Text>
        
        {/* Nom */}
        <Text
          className={`text-xs font-medium text-center ${
            isSelected ? "text-pink-600" : "text-gray-700"
          }`}
          numberOfLines={1}
        >
          {theme.name}
        </Text>

        {/* Lock icon pour premium */}
        {isLocked && (
          <View className="absolute top-0 right-0 bg-gray-200 rounded-full p-1">
            <Ionicons name="lock-closed" size={10} color="#9CA3AF" />
          </View>
        )}

        {/* Checkmark si sélectionné */}
        {isSelected && (
          <View className="absolute top-0 left-0 bg-pink-500 rounded-full p-0.5">
            <Ionicons name="checkmark" size={10} color="white" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * Item de jouet
 */
function ToyListItem({
  toy,
  isSelected,
  isLocked,
  onPress,
}: {
  toy: ToyItem;
  isSelected: boolean;
  isLocked: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center p-3 rounded-xl mb-2 border-2 ${
        isSelected
          ? "border-pink-500 bg-pink-50"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* Emoji */}
      <Text className="text-2xl mr-3">{toy.emoji}</Text>

      {/* Infos */}
      <View className="flex-1">
        <Text
          className={`font-medium ${
            isSelected ? "text-pink-600" : "text-gray-800"
          }`}
        >
          {toy.name}
        </Text>
        <Text className="text-xs text-gray-500">{toy.description}</Text>
      </View>

      {/* Lock ou checkmark */}
      {isLocked ? (
        <Ionicons name="lock-closed" size={18} color="#9CA3AF" />
      ) : isSelected ? (
        <View className="bg-pink-500 rounded-full p-1">
          <Ionicons name="checkmark" size={14} color="white" />
        </View>
      ) : (
        <View className="w-6 h-6 border-2 border-gray-300 rounded-full" />
      )}
    </TouchableOpacity>
  );
}

/**
 * Toggle de préférence média
 */
function MediaToggle({
  label,
  emoji,
  value,
  isLocked,
  onToggle,
}: {
  label: string;
  emoji: string;
  value: boolean;
  isLocked: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <View className="flex-row items-center">
        <Text className="text-xl mr-3">{emoji}</Text>
        <Text className="text-gray-800 font-medium">{label}</Text>
      </View>

      {isLocked ? (
        <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
      ) : (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: "#E5E7EB", true: "#F9A8D4" }}
          thumbColor={value ? "#EC4899" : "#9CA3AF"}
        />
      )}
    </View>
  );
}

// ============================================================
// ÉCRAN PRINCIPAL
// ============================================================

export default function PreferencesScreen() {
  const { userData, firebaseUser, isPremium } = useAuth();

  // States locaux
  const [selectedThemes, setSelectedThemes] = useState<Theme[]>([]);
  const [selectedToys, setSelectedToys] = useState<Toy[]>([]);
  const [mediaPrefs, setMediaPrefs] = useState({
    photo: true,
    audio: true,
    video: true,
  });
  const [partnerNickname, setPartnerNickname] = useState("");

  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<string | undefined>();

  // Charger les préférences existantes
  useEffect(() => {
    if (userData?.preferences) {
      setSelectedThemes(userData.preferences.themes || ["romantic", "sensual"]);
      setSelectedToys(userData.preferences.toys || []);
      setMediaPrefs(
        userData.preferences.mediaPreferences || {
          photo: true,
          audio: true,
          video: true,
        }
      );
    }
    // Charger le surnom si existant (à ajouter dans le type User si nécessaire)
    // setPartnerNickname(userData?.partnerNickname || "");
  }, [userData]);

  // ----------------------------------------------------------
  // HANDLERS - THÈMES
  // ----------------------------------------------------------

  const handleThemePress = useCallback(
    (themeId: string, isThemePremium: boolean) => {
      // Si thème premium et user non premium → paywall
      if (isThemePremium && !isPremium) {
        setPaywallFeature("premiumThemes");
        setShowPaywall(true);
        return;
      }

      // Toggle le thème
      setSelectedThemes((prev) => {
        if (prev.includes(themeId as Theme)) {
          // Ne pas désélectionner si c'est le dernier
          if (prev.length === 1) {
            Alert.alert("Attention", "Vous devez garder au moins un thème sélectionné.");
            return prev;
          }
          return prev.filter((t) => t !== themeId);
        }
        return [...prev, themeId as Theme];
      });
    },
    [isPremium]
  );

  // ----------------------------------------------------------
  // HANDLERS - JOUETS
  // ----------------------------------------------------------

  const handleToyPress = useCallback(
    (toyId: string) => {
      // Les jouets sont tous premium
      if (!isPremium) {
        setPaywallFeature("allToys");
        setShowPaywall(true);
        return;
      }

      // Toggle le jouet
      setSelectedToys((prev) => {
        if (prev.includes(toyId as Toy)) {
          return prev.filter((t) => t !== toyId);
        }
        return [...prev, toyId as Toy];
      });
    },
    [isPremium]
  );

  // ----------------------------------------------------------
  // HANDLERS - MÉDIAS
  // ----------------------------------------------------------

  const handleMediaToggle = useCallback(
    (mediaType: "photo" | "audio" | "video") => {
      // Les préférences médias sont premium
      if (!isPremium) {
        setPaywallFeature("mediaPreferences");
        setShowPaywall(true);
        return;
      }

      setMediaPrefs((prev) => {
        const newValue = !prev[mediaType];

        // Vérifier qu'au moins un média reste activé
        const newPrefs = { ...prev, [mediaType]: newValue };
        if (!newPrefs.photo && !newPrefs.audio && !newPrefs.video) {
          Alert.alert("Attention", "Vous devez garder au moins un type de média activé.");
          return prev;
        }

        return newPrefs;
      });
    },
    [isPremium]
  );

  // ----------------------------------------------------------
  // HANDLERS - SURNOM
  // ----------------------------------------------------------

  const handleNicknamePress = useCallback(() => {
    if (!isPremium) {
      setPaywallFeature("partnerNickname");
      setShowPaywall(true);
    }
  }, [isPremium]);

  // ----------------------------------------------------------
  // SAUVEGARDE
  // ----------------------------------------------------------

  const handleSave = useCallback(async () => {
    if (!firebaseUser) return;

    setIsSaving(true);

    try {
      // Sauvegarder les thèmes
      const themesResult = await preferencesService.updateThemes(
        firebaseUser.uid,
        selectedThemes,
        isPremium
      );

      if (!themesResult.success) {
        Alert.alert("Erreur", themesResult.error || "Erreur lors de la sauvegarde des thèmes");
        setIsSaving(false);
        return;
      }

      // Sauvegarder les jouets (si premium)
      if (isPremium) {
        await preferencesService.updateToys(firebaseUser.uid, selectedToys, isPremium);
        await preferencesService.updateMediaPreferences(firebaseUser.uid, mediaPrefs, isPremium);

        if (partnerNickname.trim()) {
          await preferencesService.updatePartnerNickname(
            firebaseUser.uid,
            partnerNickname,
            isPremium
          );
        }
      }

      Alert.alert("Succès", "Vos préférences ont été enregistrées !", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("[Preferences] Save error:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  }, [firebaseUser, selectedThemes, selectedToys, mediaPrefs, partnerNickname, isPremium]);

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-pink-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-800 ml-2 flex-1">
          Préférences
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className="bg-pink-500 px-4 py-2 rounded-xl"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-semibold">Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ========== SECTION THÈMES ========== */}
        <SectionHeader title="Thèmes" icon="color-palette-outline" />

        <Text className="text-gray-500 text-sm mb-3">
          Sélectionnez les thèmes de défis qui vous intéressent
        </Text>

        {/* Grille de thèmes */}
        <View className="flex-row flex-wrap">
          {/* Thèmes gratuits */}
          {THEMES_FREE.map((theme) => (
            <ThemeGridItem
              key={theme.id}
              theme={theme}
              isSelected={selectedThemes.includes(theme.id as Theme)}
              isPremium={false}
              isLocked={false}
              onPress={() => handleThemePress(theme.id, false)}
            />
          ))}

          {/* Thèmes premium */}
          {THEMES_PREMIUM.map((theme) => (
            <ThemeGridItem
              key={theme.id}
              theme={theme}
              isSelected={selectedThemes.includes(theme.id as Theme)}
              isPremium={true}
              isLocked={!isPremium}
              onPress={() => handleThemePress(theme.id, true)}
            />
          ))}
        </View>

        {/* ========== SECTION JOUETS ========== */}
        <SectionHeader
          title="Jouets"
          icon="sparkles-outline"
          isPremium
          locked={!isPremium}
        />

        <Text className="text-gray-500 text-sm mb-3">
          Indiquez les jouets que vous possédez pour des défis adaptés
        </Text>

        {/* Liste des jouets */}
        {TOYS.map((toy) => (
          <ToyListItem
            key={toy.id}
            toy={toy}
            isSelected={selectedToys.includes(toy.id as Toy)}
            isLocked={!isPremium}
            onPress={() => handleToyPress(toy.id)}
          />
        ))}

        {/* ========== SECTION MÉDIAS ========== */}
        <SectionHeader
          title="Types de médias acceptés"
          icon="camera-outline"
          isPremium
          locked={!isPremium}
        />

        <View className="bg-white rounded-2xl p-4">
          <MediaToggle
            label="Photos"
            emoji="📷"
            value={mediaPrefs.photo}
            isLocked={!isPremium}
            onToggle={() => handleMediaToggle("photo")}
          />
          <MediaToggle
            label="Audio"
            emoji="🎤"
            value={mediaPrefs.audio}
            isLocked={!isPremium}
            onToggle={() => handleMediaToggle("audio")}
          />
          <MediaToggle
            label="Vidéos"
            emoji="🎬"
            value={mediaPrefs.video}
            isLocked={!isPremium}
            onToggle={() => handleMediaToggle("video")}
          />
        </View>

        {/* ========== SECTION SURNOM ========== */}
        <SectionHeader
          title="Petit nom du partenaire"
          icon="heart-outline"
          isPremium
          locked={!isPremium}
        />

        <TouchableOpacity
          onPress={handleNicknamePress}
          activeOpacity={isPremium ? 1 : 0.7}
        >
          <View className="bg-white rounded-2xl p-4 flex-row items-center">
            <TextInput
              value={partnerNickname}
              onChangeText={setPartnerNickname}
              placeholder="Mon amour, Chéri(e), Bébé..."
              placeholderTextColor="#9CA3AF"
              editable={isPremium}
              maxLength={20}
              className="flex-1 text-gray-800 text-base"
            />
            {!isPremium && (
              <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
            )}
          </View>
        </TouchableOpacity>

        <Text className="text-gray-400 text-xs mt-2 text-center">
          Ce surnom apparaîtra dans les défis à la place de "votre partenaire"
        </Text>

        {/* ========== UPGRADE BANNER (si non premium) ========== */}
        {!isPremium && (
          <TouchableOpacity
            onPress={() => router.push("/(main)/premium")}
            activeOpacity={0.9}
            className="mt-8"
          >
            <LinearGradient
              colors={["#EC4899", "#F472B6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-2xl p-5"
            >
              <View className="flex-row items-center">
                <Text className="text-3xl mr-3">👑</Text>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg">
                    Débloquez toutes les préférences
                  </Text>
                  <Text className="text-white/80 text-sm">
                    22 thèmes, 10 jouets, médias personnalisés
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ========== PAYWALL MODAL ========== */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature={paywallFeature as any}
      />
    </SafeAreaView>
  );
}