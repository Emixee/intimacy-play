/**
 * MediaViewer - Visualisation plein écran des médias
 * 
 * FIX CRASH : Gestion robuste de expiresAt null
 * - Try-catch sur expiresAt.toDate()
 * - Vérification que expiresAt est un Timestamp valide
 * - Fonction helper safeToDate réutilisable
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
  Animated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode, AVPlaybackStatus, Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { differenceInSeconds } from "date-fns";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import type { MessageType } from "../../types";

// ============================================================
// TYPES
// ============================================================

interface MediaViewerProps {
  visible: boolean;
  type: MessageType;
  mediaUrl: string | null;
  expiresAt: FirebaseFirestoreTypes.Timestamp | null | undefined;
  isDownloaded: boolean;
  isOwnMessage: boolean;
  isPremium: boolean;
  onClose: () => void;
  onDownload?: () => Promise<void>;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ============================================================
// HELPER: Conversion sécurisée de timestamp
// ============================================================

const safeToDate = (
  timestamp: FirebaseFirestoreTypes.Timestamp | Date | null | undefined
): Date | null => {
  if (!timestamp) {
    return null;
  }
  
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (typeof timestamp === "object" && timestamp !== null) {
    if ("toDate" in timestamp && typeof (timestamp as any).toDate === "function") {
      try {
        return (timestamp as any).toDate();
      } catch (error) {
        console.warn("[MediaViewer] toDate() failed:", error);
        return null;
      }
    }
    
    if ("seconds" in timestamp && typeof (timestamp as any).seconds === "number") {
      try {
        return new Date((timestamp as any).seconds * 1000);
      } catch (error) {
        console.warn("[MediaViewer] seconds conversion failed:", error);
        return null;
      }
    }
  }
  
  return null;
};

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
  // État général
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [showControls, setShowControls] = useState(true);
  
  // État vidéo
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);
  
  // État audio
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  
  // Refs
  const videoRef = useRef<Video>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Animation pour le swipe down
  const translateY = useRef(new Animated.Value(0)).current;

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Reset à la fermeture
  useEffect(() => {
    if (!visible) {
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
        setSound(null);
      }
      setIsPlaying(false);
      setPlaybackPosition(0);
      setPlaybackDuration(0);
      setIsLoading(true);
      translateY.setValue(0);
    }
  }, [visible]);

  // ============================================================
  // TIMER D'EXPIRATION (FIX: avec protection null)
  // ============================================================

  useEffect(() => {
    if (!visible) return;
    
    // Si pas d'expiration, pas de timer
    if (!expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const updateTimer = () => {
      try {
        const expirationDate = safeToDate(expiresAt);
        
        // Si conversion échoue, pas de timer
        if (!expirationDate) {
          setRemainingSeconds(0);
          return;
        }
        
        const seconds = differenceInSeconds(expirationDate, new Date());
        setRemainingSeconds(Math.max(0, seconds));
        
        // Fermer automatiquement si expiré
        if (seconds <= 0) {
          handleClose();
          Alert.alert("Média expiré", "Ce média n'est plus disponible.");
        }
      } catch (error) {
        console.warn("[MediaViewer] Timer update error:", error);
        setRemainingSeconds(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [visible, expiresAt]);

  // ============================================================
  // FORMATAGE
  // ============================================================

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Expiré";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatAudioTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
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
      if (type !== "audio") {
        setShowControls(false);
      }
    }, 3000);
  }, [type]);

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
  // PAN RESPONDER
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
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            handleClose();
            translateY.setValue(0);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // ============================================================
  // FERMETURE
  // ============================================================

  const handleClose = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.stopAsync().catch(() => {});
    }
    if (videoRef.current && videoStatus?.isLoaded) {
      videoRef.current.stopAsync().catch(() => {});
    }
    onClose();
  }, [videoStatus, onClose]);

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

    try {
      if (videoStatus.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      hideControlsAfterDelay();
    } catch (error) {
      console.error("[MediaViewer] Video toggle error:", error);
    }
  };

  // ============================================================
  // GESTION AUDIO
  // ============================================================

  const loadAndPlayAudio = async () => {
    if (!mediaUrl) return;

    try {
      setIsLoading(true);

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
          setIsLoading(false);
          return;
        }
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: mediaUrl },
        { shouldPlay: true },
        onAudioPlaybackStatusUpdate
      );

      soundRef.current = newSound;
      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);

    } catch (error) {
      console.error("[MediaViewer] Audio load error:", error);
      Alert.alert("Erreur", "Impossible de charger l'audio");
      setIsLoading(false);
    }
  };

  const onAudioPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
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

  const seekAudio = async (position: number) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(position);
    } catch (error) {
      console.error("[MediaViewer] Seek error:", error);
    }
  };

  // Auto-load audio à l'ouverture
  useEffect(() => {
    if (visible && type === "audio" && mediaUrl) {
      loadAndPlayAudio();
    }
  }, [visible, type, mediaUrl]);

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
          {...(type !== "audio" ? panResponder.panHandlers : {})}
        >
          {/* Header avec timer et bouton fermer */}
          {showControls && (
            <View className="absolute top-0 left-0 right-0 z-20 pt-12 px-4 pb-4 bg-black/50">
              <View className="flex-row items-center justify-between">
                {/* Timer d'expiration */}
                {remainingSeconds > 0 && (
                  <View
                    className={`px-3 py-1.5 rounded-full flex-row items-center ${
                      isExpiringSoon ? "bg-red-500" : "bg-black/60"
                    }`}
                  >
                    <Ionicons name="time-outline" size={16} color="white" />
                    <Text className="text-white text-sm font-medium ml-1">
                      {formatTime(remainingSeconds)}
                    </Text>
                  </View>
                )}
                
                {/* Spacer si pas de timer */}
                {remainingSeconds <= 0 && <View />}

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
            onPress={type !== "audio" ? toggleControls : undefined}
            className="flex-1 items-center justify-center"
          >
            {/* Loading indicator */}
            {isLoading && type !== "audio" && (
              <View className="absolute inset-0 items-center justify-center z-10">
                <ActivityIndicator size="large" color="white" />
              </View>
            )}

            {/* Photo */}
            {type === "photo" && (
              <Image
                source={{ uri: mediaUrl }}
                style={{
                  width: SCREEN_WIDTH,
                  height: SCREEN_HEIGHT * 0.8,
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

            {/* Audio - Lecteur complet */}
            {type === "audio" && (
              <View className="items-center justify-center px-8 w-full">
                <View className="w-32 h-32 bg-pink-500 rounded-full items-center justify-center mb-8 shadow-lg">
                  {isLoading ? (
                    <ActivityIndicator size="large" color="white" />
                  ) : (
                    <Ionicons name="musical-notes" size={64} color="white" />
                  )}
                </View>

                <Text className="text-white text-xl font-medium mb-8">
                  Message vocal
                </Text>

                <View className="w-full px-4 mb-4">
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => {
                      const locationX = e.nativeEvent.locationX;
                      const progressWidth = SCREEN_WIDTH - 64;
                      const percentage = locationX / progressWidth;
                      const newPosition = percentage * playbackDuration;
                      seekAudio(newPosition);
                    }}
                    className="w-full"
                  >
                    <View className="h-2 bg-white/30 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-pink-500 rounded-full"
                        style={{
                          width: `${playbackDuration > 0 ? (playbackPosition / playbackDuration) * 100 : 0}%`,
                        }}
                      />
                    </View>
                  </TouchableOpacity>

                  <View className="flex-row justify-between mt-2">
                    <Text className="text-white/60 text-sm">
                      {formatAudioTime(playbackPosition)}
                    </Text>
                    <Text className="text-white/60 text-sm">
                      {formatAudioTime(playbackDuration)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={loadAndPlayAudio}
                  disabled={isLoading}
                  className="w-20 h-20 bg-white rounded-full items-center justify-center shadow-lg"
                >
                  {isLoading ? (
                    <ActivityIndicator size="large" color="#EC4899" />
                  ) : (
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={40}
                      color="#EC4899"
                      style={{ marginLeft: isPlaying ? 0 : 4 }}
                    />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {/* Footer avec bouton télécharger */}
          {showControls && (
            <View className="absolute bottom-0 left-0 right-0 z-20 pb-12 px-4 pt-4 bg-black/50">
              <View className="flex-row items-center justify-center">
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

                {!isPremium && !isOwnMessage && remainingSeconds > 0 && (
                  <View className="flex-row items-center bg-gray-800 px-4 py-2 rounded-full">
                    <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
                    <Text className="text-gray-400 text-sm ml-2">
                      Premium pour télécharger
                    </Text>
                  </View>
                )}

                {isDownloaded && !isOwnMessage && (
                  <View className="flex-row items-center bg-green-600/80 px-4 py-2 rounded-full">
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                    <Text className="text-white text-sm ml-2">
                      Déjà téléchargé
                    </Text>
                  </View>
                )}
              </View>

              {type !== "audio" && (
                <View className="items-center mt-4">
                  <View className="w-10 h-1 bg-white/30 rounded-full" />
                  <Text className="text-white/50 text-xs mt-1">
                    Glisser vers le bas pour fermer
                  </Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default MediaViewer;