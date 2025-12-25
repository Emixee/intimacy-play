/**
 * MediaMessage - Message contenant un média (photo, vidéo, audio)
 * 
 * FIX CRASH COMPLET : 
 * - Gestion robuste de timestamp null (serverTimestamp non résolu)
 * - Gestion robuste de expiresAt null
 * - Try-catch sur toutes les conversions de dates
 * - Fallback sur Date.now() si conversion échoue
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode, Audio, AVPlaybackStatus } from "expo-av";
import { format, differenceInSeconds } from "date-fns";
import { fr } from "date-fns/locale";
import * as Haptics from "expo-haptics";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import type { MessageType } from "../../types";

// ============================================================
// TYPES
// ============================================================

interface MediaMessageProps {
  type: MessageType;
  mediaUrl: string | null;
  thumbnailUrl?: string | null;
  expiresAt: FirebaseFirestoreTypes.Timestamp | null | undefined;
  isDownloaded: boolean;
  isOwnMessage: boolean;
  timestamp: FirebaseFirestoreTypes.Timestamp | Date | null | undefined;
  isPremium?: boolean;
  onPress?: () => void;
  onDownload?: () => Promise<void>;
}

// ============================================================
// HELPER: Conversion sécurisée de timestamp
// ============================================================

const safeToDate = (
  timestamp: FirebaseFirestoreTypes.Timestamp | Date | null | undefined
): Date => {
  // Si null ou undefined
  if (!timestamp) {
    return new Date();
  }
  
  // Si c'est déjà une Date
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Si c'est un objet avec toDate (Firestore Timestamp)
  if (typeof timestamp === "object" && timestamp !== null) {
    // Vérifier si toDate existe et est une fonction
    if ("toDate" in timestamp && typeof (timestamp as any).toDate === "function") {
      try {
        return (timestamp as any).toDate();
      } catch (error) {
        console.warn("[MediaMessage] toDate() failed:", error);
        return new Date();
      }
    }
    
    // Si c'est un objet avec seconds (timestamp brut non résolu)
    if ("seconds" in timestamp && typeof (timestamp as any).seconds === "number") {
      try {
        return new Date((timestamp as any).seconds * 1000);
      } catch (error) {
        console.warn("[MediaMessage] seconds conversion failed:", error);
        return new Date();
      }
    }
  }
  
  // Fallback final
  return new Date();
};

// ============================================================
// COMPOSANT
// ============================================================

export const MediaMessage: React.FC<MediaMessageProps> = ({
  type,
  mediaUrl,
  thumbnailUrl,
  expiresAt,
  isDownloaded,
  isOwnMessage,
  timestamp,
  isPremium = false,
  onPress,
  onDownload,
}) => {
  // État commun
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  // État audio
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  // Refs
  const soundRef = useRef<Audio.Sound | null>(null);

  // ============================================================
  // CLEANUP AUDIO
  // ============================================================

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // ============================================================
  // TIMER D'EXPIRATION (avec protection null complète)
  // ============================================================

  useEffect(() => {
    // Si pas d'expiration définie, pas de timer
    if (!expiresAt) {
      setRemainingSeconds(0);
      setIsExpired(false);
      return;
    }

    const updateTimer = () => {
      try {
        const expirationDate = safeToDate(expiresAt);
        const now = new Date();
        const seconds = differenceInSeconds(expirationDate, now);
        setRemainingSeconds(Math.max(0, seconds));
        setIsExpired(seconds <= 0);
      } catch (error) {
        console.warn("[MediaMessage] Timer update error:", error);
        setRemainingSeconds(0);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // ============================================================
  // FORMATAGE (avec protection)
  // ============================================================

  const formatTimeRemaining = (): string => {
    if (remainingSeconds <= 0) return "Expiré";
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatAudioDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Conversion sécurisée du timestamp pour l'affichage de l'heure
  const messageDate = safeToDate(timestamp);
  const timeString = format(messageDate, "HH:mm", { locale: fr });

  // Couleur du timer selon le temps restant
  const isExpiringSoon = remainingSeconds > 0 && remainingSeconds <= 30;

  // ============================================================
  // HANDLERS
  // ============================================================

  const handlePress = useCallback(() => {
    if (isExpired) {
      Alert.alert("Média expiré", "Ce média n'est plus disponible.");
      return;
    }
    
    if (type === "audio") {
      toggleAudioPlayback();
      return;
    }
    
    onPress?.();
  }, [isExpired, type, onPress]);

  const handleLongPress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isExpired) {
      Alert.alert("Média expiré", "Ce média n'est plus disponible.");
      return;
    }

    if (isOwnMessage) {
      Alert.alert("Info", "Tu ne peux pas télécharger tes propres médias.");
      return;
    }

    if (!isPremium) {
      Alert.alert(
        "Fonctionnalité Premium 👑",
        "Le téléchargement des médias est réservé aux membres Premium.",
        [{ text: "OK", style: "cancel" }]
      );
      return;
    }

    if (isDownloaded) {
      Alert.alert("Déjà téléchargé", "Ce média a déjà été sauvegardé.");
      return;
    }

    if (!onDownload) return;

    Alert.alert(
      "Télécharger le média ?",
      "Le média sera sauvegardé sur ton appareil.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Télécharger",
          onPress: async () => {
            setIsLoading(true);
            try {
              await onDownload();
            } catch (error) {
              console.error("[MediaMessage] Download error:", error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [isExpired, isOwnMessage, isPremium, isDownloaded, onDownload]);

  // ============================================================
  // LECTURE AUDIO
  // ============================================================

  const toggleAudioPlayback = async () => {
    if (!mediaUrl || isExpired) return;

    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
          return;
        }
      }

      setIsLoading(true);
      
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: mediaUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = newSound;
      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);

    } catch (error) {
      console.error("[MediaMessage] Audio playback error:", error);
      Alert.alert("Erreur", "Impossible de lire l'audio");
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setPlaybackPosition(status.positionMillis || 0);
    setPlaybackDuration(status.durationMillis || 0);
    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setPlaybackPosition(0);
      soundRef.current?.setPositionAsync(0);
    }
  };

  // ============================================================
  // RENDU MÉDIA EXPIRÉ
  // ============================================================

  const renderExpiredMedia = () => (
    <View className="w-48 h-48 bg-gray-200 rounded-xl items-center justify-center">
      <Ionicons name="time-outline" size={32} color="#9CA3AF" />
      <Text className="text-gray-500 text-sm mt-2">Média expiré</Text>
    </View>
  );

  // ============================================================
  // RENDU MESSAGE PHOTO
  // ============================================================

  const renderPhotoMessage = () => {
    const imageSource = thumbnailUrl || mediaUrl;

    return (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.9}
        className="relative"
      >
        {imageSource && !imageError ? (
          <Image
            source={{ uri: imageSource }}
            className="w-48 h-48 rounded-xl"
            resizeMode="cover"
            onError={() => setImageError(true)}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
          />
        ) : (
          <View className="w-48 h-48 bg-gray-200 rounded-xl items-center justify-center">
            <Ionicons name="image-outline" size={32} color="#9CA3AF" />
            {imageError && (
              <Text className="text-gray-500 text-xs mt-1">Erreur chargement</Text>
            )}
          </View>
        )}

        {isLoading && (
          <View className="absolute inset-0 bg-black/30 rounded-xl items-center justify-center">
            <ActivityIndicator color="white" size="large" />
          </View>
        )}

        {expiresAt && !isExpired && remainingSeconds > 0 && (
          <View
            className={`absolute top-2 right-2 px-2 py-1 rounded-full flex-row items-center ${
              isExpiringSoon ? "bg-red-500" : "bg-black/60"
            }`}
          >
            <Ionicons name="time-outline" size={12} color="white" />
            <Text className="text-white text-xs ml-1 font-medium">
              {formatTimeRemaining()}
            </Text>
          </View>
        )}

        {isDownloaded && (
          <View className="absolute top-2 left-2 bg-green-500 px-2 py-1 rounded-full">
            <Ionicons name="checkmark" size={12} color="white" />
          </View>
        )}

        {!isOwnMessage && !isDownloaded && isPremium && !isLoading && (
          <View className="absolute bottom-2 left-2 right-2">
            <View className="bg-black/60 px-2 py-1 rounded-full self-center">
              <Text className="text-white text-xs">Appui long pour 💾</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ============================================================
  // RENDU MESSAGE VIDÉO
  // ============================================================

  const renderVideoMessage = () => {
    return (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.9}
        className="relative"
      >
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            className="w-48 h-48 rounded-xl"
            resizeMode="cover"
          />
        ) : mediaUrl ? (
          <View className="w-48 h-48 rounded-xl overflow-hidden">
            <Video
              source={{ uri: mediaUrl }}
              style={{ width: 192, height: 192 }}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isMuted
              onLoadStart={() => setIsLoading(true)}
              onLoad={() => setIsLoading(false)}
            />
          </View>
        ) : (
          <View className="w-48 h-48 bg-gray-800 rounded-xl items-center justify-center">
            <Ionicons name="videocam" size={32} color="white" />
          </View>
        )}

        {isLoading && (
          <View className="absolute inset-0 bg-black/30 rounded-xl items-center justify-center">
            <ActivityIndicator color="white" size="large" />
          </View>
        )}

        <View className="absolute inset-0 items-center justify-center">
          <View className="w-14 h-14 bg-white/90 rounded-full items-center justify-center shadow-lg">
            <Ionicons name="play" size={28} color="#EC4899" style={{ marginLeft: 2 }} />
          </View>
        </View>

        <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-full flex-row items-center">
          <Ionicons name="videocam" size={12} color="white" />
          <Text className="text-white text-xs ml-1">Vidéo</Text>
        </View>

        {expiresAt && !isExpired && remainingSeconds > 0 && (
          <View
            className={`absolute top-2 right-2 px-2 py-1 rounded-full flex-row items-center ${
              isExpiringSoon ? "bg-red-500" : "bg-black/60"
            }`}
          >
            <Ionicons name="time-outline" size={12} color="white" />
            <Text className="text-white text-xs ml-1 font-medium">
              {formatTimeRemaining()}
            </Text>
          </View>
        )}

        {isDownloaded && (
          <View className="absolute top-2 left-2 bg-green-500 px-2 py-1 rounded-full">
            <Ionicons name="checkmark" size={12} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ============================================================
  // RENDU MESSAGE AUDIO
  // ============================================================

  const renderAudioMessage = () => {
    const progress = playbackDuration > 0 ? (playbackPosition / playbackDuration) * 100 : 0;

    return (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.8}
        className={`
          px-4 py-3 rounded-2xl min-w-[220px] max-w-[280px]
          ${isOwnMessage ? "bg-pink-500" : "bg-white border border-gray-100"}
        `}
      >
        <View className="flex-row items-center">
          <View
            className={`
              w-11 h-11 rounded-full items-center justify-center
              ${isOwnMessage ? "bg-white/20" : "bg-pink-100"}
            `}
          >
            {isLoading ? (
              <ActivityIndicator
                color={isOwnMessage ? "white" : "#EC4899"}
                size="small"
              />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={22}
                color={isOwnMessage ? "white" : "#EC4899"}
                style={{ marginLeft: isPlaying ? 0 : 2 }}
              />
            )}
          </View>

          <View className="flex-1 ml-3">
            <View
              className={`h-1 rounded-full overflow-hidden ${
                isOwnMessage ? "bg-white/30" : "bg-gray-200"
              }`}
            >
              <View
                className={`h-full rounded-full ${
                  isOwnMessage ? "bg-white" : "bg-pink-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </View>

            <View className="flex-row justify-between mt-1">
              <Text
                className={`text-xs ${
                  isOwnMessage ? "text-white/70" : "text-gray-500"
                }`}
              >
                {formatAudioDuration(playbackPosition)}
              </Text>
              <Text
                className={`text-xs ${
                  isOwnMessage ? "text-white/70" : "text-gray-500"
                }`}
              >
                {playbackDuration > 0
                  ? formatAudioDuration(playbackDuration)
                  : "0:00"}
              </Text>
            </View>
          </View>
        </View>

        {expiresAt && !isExpired && remainingSeconds > 0 && (
          <View className="flex-row items-center mt-2">
            <Ionicons
              name="time-outline"
              size={10}
              color={isExpiringSoon ? "#EF4444" : isOwnMessage ? "rgba(255,255,255,0.6)" : "#9CA3AF"}
            />
            <Text
              className={`text-xs ml-1 ${
                isExpiringSoon
                  ? "text-red-400"
                  : isOwnMessage
                  ? "text-white/60"
                  : "text-gray-400"
              }`}
            >
              Expire dans {formatTimeRemaining()}
            </Text>
          </View>
        )}

        {isDownloaded && (
          <View className="absolute top-2 right-2">
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={isOwnMessage ? "rgba(255,255,255,0.8)" : "#22C55E"}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================

  const renderMediaContent = () => {
    if (isExpired) {
      return renderExpiredMedia();
    }

    switch (type) {
      case "photo":
        return renderPhotoMessage();
      case "video":
        return renderVideoMessage();
      case "audio":
        return renderAudioMessage();
      default:
        return null;
    }
  };

  return (
    <View
      className={`
        max-w-[80%] mb-2
        ${isOwnMessage ? "self-end" : "self-start"}
      `}
    >
      {renderMediaContent()}

      <View
        className={`
          mt-1 px-1
          ${isOwnMessage ? "items-end" : "items-start"}
        `}
      >
        <Text className="text-xs text-gray-400">{timeString}</Text>
      </View>
    </View>
  );
};

export default MediaMessage;