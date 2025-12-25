/**
 * MediaMessage - Message contenant un média (photo, vidéo, audio)
 * 
 * PROMPT AUDIO : Ajout de la lecture audio avec :
 * - Barre de progression
 * - Bouton play/pause
 * - Affichage durée
 * - Timer d'expiration
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
  /** Type de média */
  type: MessageType;
  /** URL du média (Firebase Storage) */
  mediaUrl: string | null;
  /** URL de la miniature (pour photos/vidéos) */
  thumbnailUrl?: string | null;
  /** Date d'expiration du média */
  expiresAt: FirebaseFirestoreTypes.Timestamp | null;
  /** Média déjà téléchargé ? */
  isDownloaded: boolean;
  /** C'est mon message ? */
  isOwnMessage: boolean;
  /** Timestamp du message */
  timestamp: FirebaseFirestoreTypes.Timestamp | Date;
  /** User is Premium */
  isPremium?: boolean;
  /** Callback au clic sur le média (ouvrir en grand) */
  onPress?: () => void;
  /** Callback pour télécharger le média (appui long) */
  onDownload?: () => Promise<void>;
}

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
      // Cleanup sound on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // ============================================================
  // TIMER D'EXPIRATION
  // ============================================================

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const seconds = differenceInSeconds(expiresAt.toDate(), new Date());
      setRemainingSeconds(Math.max(0, seconds));
      setIsExpired(seconds <= 0);
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

  // Convertir le timestamp
  const messageDate = timestamp instanceof Date 
    ? timestamp 
    : timestamp.toDate();
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
    
    // Pour l'audio, on toggle la lecture
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
        [
          { text: "OK", style: "cancel" },
        ]
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
      // Si déjà chargé, toggle play/pause
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

      // Charger et jouer
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

    // Fin de lecture
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPlaybackPosition(0);
      // Remettre au début
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

        {/* Loading overlay */}
        {isLoading && (
          <View className="absolute inset-0 bg-black/30 rounded-xl items-center justify-center">
            <ActivityIndicator color="white" size="large" />
          </View>
        )}

        {/* Badge expiration */}
        {expiresAt && !isExpired && (
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

        {/* Badge téléchargé */}
        {isDownloaded && (
          <View className="absolute top-2 left-2 bg-green-500 px-2 py-1 rounded-full">
            <Ionicons name="checkmark" size={12} color="white" />
          </View>
        )}

        {/* Hint appui long */}
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

        {/* Loading overlay */}
        {isLoading && (
          <View className="absolute inset-0 bg-black/30 rounded-xl items-center justify-center">
            <ActivityIndicator color="white" size="large" />
          </View>
        )}

        {/* Bouton play overlay */}
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-14 h-14 bg-white/90 rounded-full items-center justify-center shadow-lg">
            <Ionicons name="play" size={28} color="#EC4899" style={{ marginLeft: 2 }} />
          </View>
        </View>

        {/* Badge vidéo */}
        <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-full flex-row items-center">
          <Ionicons name="videocam" size={12} color="white" />
          <Text className="text-white text-xs ml-1">Vidéo</Text>
        </View>

        {/* Badge expiration */}
        {expiresAt && !isExpired && (
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

        {/* Badge téléchargé */}
        {isDownloaded && (
          <View className="absolute top-2 left-2 bg-green-500 px-2 py-1 rounded-full">
            <Ionicons name="checkmark" size={12} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ============================================================
  // RENDU MESSAGE AUDIO (avec lecteur)
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
          {/* Bouton play/pause */}
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

          {/* Barre de progression et durée */}
          <View className="flex-1 ml-3">
            {/* Barre de progression */}
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

            {/* Durée */}
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

        {/* Timer d'expiration */}
        {expiresAt && !isExpired && (
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

        {/* Badge téléchargé */}
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

      {/* Heure */}
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