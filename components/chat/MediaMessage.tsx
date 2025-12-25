/**
 * MediaMessage - Message contenant un média (photo, vidéo, audio)
 * 
 * FIX COMPLET : 
 * - Gestion robuste de mediaUrl null/undefined
 * - Affichage placeholder pendant chargement URL
 * - Retry automatique si URL non disponible
 * - Logs détaillés pour debug
 * - Protection timestamps null
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
  if (!timestamp) {
    return new Date();
  }
  
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (typeof timestamp === "object" && timestamp !== null) {
    if ("toDate" in timestamp && typeof (timestamp as any).toDate === "function") {
      try {
        return (timestamp as any).toDate();
      } catch (error) {
        return new Date();
      }
    }
    
    if ("seconds" in timestamp && typeof (timestamp as any).seconds === "number") {
      try {
        return new Date((timestamp as any).seconds * 1000);
      } catch (error) {
        return new Date();
      }
    }
  }
  
  return new Date();
};

// ============================================================
// HELPER: Vérifier si une URL est valide
// ============================================================

const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== "string") {
    return false;
  }
  // Vérifier que c'est une URL Firebase Storage valide
  return url.startsWith("https://") || url.startsWith("http://");
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
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // État audio
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  // Refs
  const soundRef = useRef<Audio.Sound | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // URL valide ?
  const hasValidUrl = isValidUrl(mediaUrl);

  // Log pour debug
  useEffect(() => {
    console.log(`[MediaMessage] Render - type: ${type}, hasUrl: ${hasValidUrl}, url: ${mediaUrl?.substring(0, 50) || 'null'}`);
  }, [type, mediaUrl, hasValidUrl]);

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // ============================================================
  // RETRY SI URL PAS ENCORE DISPONIBLE
  // ============================================================

  useEffect(() => {
    // Si pas d'URL valide et moins de 5 retries, réessayer
    if (!hasValidUrl && retryCount < 5) {
      console.log(`[MediaMessage] URL not ready, retry ${retryCount + 1}/5 in 1s`);
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000);
    }
  }, [hasValidUrl, retryCount]);

  // Reset retry count quand l'URL devient valide
  useEffect(() => {
    if (hasValidUrl && retryCount > 0) {
      console.log(`[MediaMessage] URL now valid after ${retryCount} retries`);
      setRetryCount(0);
    }
  }, [hasValidUrl]);

  // ============================================================
  // TIMER D'EXPIRATION
  // ============================================================

  useEffect(() => {
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
        setRemainingSeconds(0);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // ============================================================
  // FORMATAGE
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

  const messageDate = safeToDate(timestamp);
  const timeString = format(messageDate, "HH:mm", { locale: fr });
  const isExpiringSoon = remainingSeconds > 0 && remainingSeconds <= 30;

  // ============================================================
  // HANDLERS
  // ============================================================

  const handlePress = useCallback(() => {
    if (!hasValidUrl) {
      Alert.alert("Chargement", "Le média est en cours de chargement...");
      return;
    }
    
    if (isExpired) {
      Alert.alert("Média expiré", "Ce média n'est plus disponible.");
      return;
    }
    
    if (type === "audio") {
      toggleAudioPlayback();
      return;
    }
    
    onPress?.();
  }, [hasValidUrl, isExpired, type, onPress]);

  const handleLongPress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!hasValidUrl) {
      Alert.alert("Chargement", "Le média est en cours de chargement...");
      return;
    }

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
  }, [hasValidUrl, isExpired, isOwnMessage, isPremium, isDownloaded, onDownload]);

  // ============================================================
  // LECTURE AUDIO
  // ============================================================

  const toggleAudioPlayback = async () => {
    if (!mediaUrl || !hasValidUrl || isExpired) return;

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
  // RENDU: PLACEHOLDER (URL pas encore prête)
  // ============================================================

  const renderLoadingPlaceholder = () => (
    <View className="w-48 h-48 bg-gray-100 rounded-xl items-center justify-center">
      <ActivityIndicator size="large" color="#EC4899" />
      <Text className="text-gray-500 text-xs mt-2">Chargement...</Text>
    </View>
  );

  // ============================================================
  // RENDU: MÉDIA EXPIRÉ
  // ============================================================

  const renderExpiredMedia = () => (
    <View className="w-48 h-48 bg-gray-200 rounded-xl items-center justify-center">
      <Ionicons name="time-outline" size={32} color="#9CA3AF" />
      <Text className="text-gray-500 text-sm mt-2">Média expiré</Text>
    </View>
  );

  // ============================================================
  // RENDU: MESSAGE PHOTO
  // ============================================================

  const renderPhotoMessage = () => {
    // Si pas d'URL valide, afficher le placeholder
    if (!hasValidUrl) {
      return renderLoadingPlaceholder();
    }

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
            onError={(e) => {
              console.error("[MediaMessage] Image load error:", e.nativeEvent.error);
              setImageError(true);
            }}
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

        {isLoading && !imageError && (
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
  // RENDU: MESSAGE VIDÉO
  // ============================================================

  const renderVideoMessage = () => {
    // Si pas d'URL valide, afficher le placeholder
    if (!hasValidUrl) {
      return renderLoadingPlaceholder();
    }

    return (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.9}
        className="relative"
      >
        {thumbnailUrl && isValidUrl(thumbnailUrl) ? (
          <Image
            source={{ uri: thumbnailUrl }}
            className="w-48 h-48 rounded-xl"
            resizeMode="cover"
            onError={() => console.log("[MediaMessage] Thumbnail load error")}
          />
        ) : mediaUrl ? (
          <View className="w-48 h-48 rounded-xl overflow-hidden bg-gray-800">
            <Video
              source={{ uri: mediaUrl }}
              style={{ width: 192, height: 192 }}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isMuted
              onLoadStart={() => setIsLoading(true)}
              onLoad={() => {
                console.log("[MediaMessage] Video loaded successfully");
                setIsLoading(false);
              }}
              onError={(error) => {
                console.error("[MediaMessage] Video load error:", error);
                setIsLoading(false);
              }}
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
  // RENDU: MESSAGE AUDIO
  // ============================================================

  const renderAudioMessage = () => {
    const progress = playbackDuration > 0 ? (playbackPosition / playbackDuration) * 100 : 0;

    // Si pas d'URL valide, afficher un état de chargement
    const isUrlLoading = !hasValidUrl;

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
            {isLoading || isUrlLoading ? (
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
                {isUrlLoading ? "..." : formatAudioDuration(playbackPosition)}
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