/**
 * MediaViewer - Visualisation plein écran des médias
 * 
 * PROMPT MEDIA-FIX : Nouveau composant pour :
 * - Affichage photos en plein écran avec zoom
 * - Lecture vidéos en plein écran
 * - Timer d'expiration visible
 * - Téléchargement pour Premium
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Animated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import * as Haptics from "expo-haptics";
import { differenceInSeconds } from "date-fns";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import type { MessageType } from "../../types";

// ============================================================
// TYPES
// ============================================================

interface MediaViewerProps {
  /** Modal visible */
  visible: boolean;
  /** Type de média */
  type: MessageType;
  /** URL du média */
  mediaUrl: string | null;
  /** Date d'expiration */
  expiresAt: FirebaseFirestoreTypes.Timestamp | null;
  /** Média déjà téléchargé */
  isDownloaded: boolean;
  /** C'est mon message */
  isOwnMessage: boolean;
  /** User is Premium */
  isPremium: boolean;
  /** Callback fermeture */
  onClose: () => void;
  /** Callback téléchargement */
  onDownload?: () => Promise<void>;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ============================================================
// COMPOSANT
// ============================================================

export const MediaViewer: React.FC<MediaViewerProps> = ({
  visible,
  type,
  mediaUrl,
  expiresAt,
  isDownloaded,
  isOwnMessage,
  isPremium,
  onClose,
  onDownload,
}) => {
  // État
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);
  const [showControls, setShowControls] = useState(true);
  
  // Refs
  const videoRef = useRef<Video>(null);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Animation pour le zoom (photos)
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // ============================================================
  // TIMER D'EXPIRATION
  // ============================================================

  useEffect(() => {
    if (!visible || !expiresAt) return;

    const updateTimer = () => {
      const seconds = differenceInSeconds(expiresAt.toDate(), new Date());
      setRemainingSeconds(Math.max(0, seconds));
      
      // Fermer automatiquement si expiré
      if (seconds <= 0) {
        onClose();
        Alert.alert("Média expiré", "Ce média n'est plus disponible.");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [visible, expiresAt, onClose]);

  // ============================================================
  // FORMATAGE DU TEMPS
  // ============================================================

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Expiré";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ============================================================
  // GESTION DES CONTRÔLES
  // ============================================================

  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
    if (!showControls) {
      hideControlsAfterDelay();
    }
  }, [showControls, hideControlsAfterDelay]);

  useEffect(() => {
    if (visible && type === "video") {
      hideControlsAfterDelay();
    }
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [visible, type, hideControlsAfterDelay]);

  // ============================================================
  // PAN RESPONDER (Swipe down pour fermer)
  // ============================================================

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Swipe down assez fort -> fermer
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            translateY.setValue(0);
          });
        } else {
          // Retour à la position initiale
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // ============================================================
  // TÉLÉCHARGEMENT
  // ============================================================

  const handleDownload = async () => {
    if (!onDownload || isDownloading) return;

    setIsDownloading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await onDownload();
      Alert.alert("✅ Succès", "Média sauvegardé !");
    } catch (error) {
      console.error("[MediaViewer] Download error:", error);
      Alert.alert("Erreur", "Impossible de télécharger le média");
    } finally {
      setIsDownloading(false);
    }
  };

  // ============================================================
  // GESTION VIDÉO
  // ============================================================

  const handleVideoPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setVideoStatus(status);
    if (status.isLoaded) {
      setIsLoading(false);
    }
  };

  const toggleVideoPlayback = async () => {
    if (!videoRef.current || !videoStatus?.isLoaded) return;

    if (videoStatus.isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hideControlsAfterDelay();
  };

  // ============================================================
  // RESET À LA FERMETURE
  // ============================================================

  const handleClose = () => {
    // Reset animations
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    setIsLoading(true);
    
    // Stop vidéo si en lecture
    if (videoRef.current && videoStatus?.isLoaded) {
      videoRef.current.stopAsync();
    }
    
    onClose();
  };

  // ============================================================
  // RENDU
  // ============================================================

  if (!visible || !mediaUrl) return null;

  const isExpiringSoon = remainingSeconds > 0 && remainingSeconds <= 30;
  const canDownload = isPremium && !isOwnMessage && !isDownloaded && remainingSeconds > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar hidden />
      
      <View className="flex-1 bg-black">
        <Animated.View
          style={{
            flex: 1,
            transform: [{ translateY }],
          }}
          {...panResponder.panHandlers}
        >
          {/* Header avec timer et bouton fermer */}
          {showControls && (
            <View className="absolute top-0 left-0 right-0 z-20 pt-12 px-4 pb-4 bg-black/50">
              <View className="flex-row items-center justify-between">
                {/* Timer d'expiration */}
                <View
                  className={`px-3 py-1.5 rounded-full flex-row items-center ${
                    isExpiringSoon ? "bg-red-500" : "bg-black/60"
                  }`}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color="white"
                  />
                  <Text className="text-white text-sm font-medium ml-1">
                    {formatTime(remainingSeconds)}
                  </Text>
                </View>

                {/* Bouton fermer */}
                <TouchableOpacity
                  onPress={handleClose}
                  className="w-10 h-10 bg-black/60 rounded-full items-center justify-center"
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Contenu média */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={toggleControls}
            className="flex-1 items-center justify-center"
          >
            {/* Loading indicator */}
            {isLoading && (
              <View className="absolute inset-0 items-center justify-center z-10">
                <ActivityIndicator size="large" color="white" />
              </View>
            )}

            {/* Photo */}
            {type === "photo" && (
              <Animated.Image
                source={{ uri: mediaUrl }}
                style={{
                  width: SCREEN_WIDTH,
                  height: SCREEN_HEIGHT * 0.8,
                  transform: [{ scale }, { translateX }, { translateY: 0 }],
                }}
                resizeMode="contain"
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
              />
            )}

            {/* Video */}
            {type === "video" && (
              <View className="flex-1 w-full items-center justify-center">
                <Video
                  ref={videoRef}
                  source={{ uri: mediaUrl }}
                  style={{
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT * 0.8,
                  }}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping
                  onPlaybackStatusUpdate={handleVideoPlaybackStatusUpdate}
                  onLoadStart={() => setIsLoading(true)}
                />

                {/* Bouton play/pause overlay */}
                {showControls && videoStatus?.isLoaded && (
                  <TouchableOpacity
                    onPress={toggleVideoPlayback}
                    className="absolute w-16 h-16 bg-white/30 rounded-full items-center justify-center"
                  >
                    <Ionicons
                      name={videoStatus.isPlaying ? "pause" : "play"}
                      size={32}
                      color="white"
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Audio placeholder */}
            {type === "audio" && (
              <View className="items-center justify-center p-8">
                <View className="w-24 h-24 bg-pink-500 rounded-full items-center justify-center mb-4">
                  <Ionicons name="musical-notes" size={48} color="white" />
                </View>
                <Text className="text-white text-lg">Message vocal</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Footer avec bouton télécharger */}
          {showControls && (
            <View className="absolute bottom-0 left-0 right-0 z-20 pb-12 px-4 pt-4 bg-black/50">
              <View className="flex-row items-center justify-center">
                {/* Bouton télécharger (Premium uniquement, pas pour ses propres messages) */}
                {canDownload && (
                  <TouchableOpacity
                    onPress={handleDownload}
                    disabled={isDownloading}
                    className="flex-row items-center bg-pink-500 px-6 py-3 rounded-full"
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={20} color="white" />
                        <Text className="text-white font-medium ml-2">
                          Télécharger
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Message si non Premium */}
                {!isPremium && !isOwnMessage && remainingSeconds > 0 && (
                  <View className="flex-row items-center bg-gray-800 px-4 py-2 rounded-full">
                    <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
                    <Text className="text-gray-400 text-sm ml-2">
                      Premium pour télécharger
                    </Text>
                  </View>
                )}

                {/* Message si déjà téléchargé */}
                {isDownloaded && !isOwnMessage && (
                  <View className="flex-row items-center bg-green-600/80 px-4 py-2 rounded-full">
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                    <Text className="text-white text-sm ml-2">
                      Déjà téléchargé
                    </Text>
                  </View>
                )}
              </View>

              {/* Indication swipe */}
              <View className="items-center mt-4">
                <View className="w-10 h-1 bg-white/30 rounded-full" />
                <Text className="text-white/50 text-xs mt-1">
                  Glisser vers le bas pour fermer
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default MediaViewer;