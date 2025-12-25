/**
 * AudioRecorder - Composant d'enregistrement audio
 * 
 * PROMPT AUDIO : Enregistrement vocal avec :
 * - Bouton "maintenir pour enregistrer"
 * - Timer d'enregistrement
 * - Animation visuelle
 * - Limite de 60 secondes
 * - Annulation par glissement
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

// ============================================================
// TYPES
// ============================================================

interface AudioRecorderProps {
  /** Callback quand l'enregistrement est terminé */
  onRecordingComplete: (uri: string, durationMs: number) => void;
  /** Callback pour annuler l'enregistrement */
  onCancel?: () => void;
  /** Durée max en secondes (défaut: 60) */
  maxDuration?: number;
  /** Désactiver le composant */
  disabled?: boolean;
}

// ============================================================
// CONSTANTES
// ============================================================

const MAX_RECORDING_DURATION_MS = 60 * 1000; // 60 secondes
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: ".m4a",
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
};

// ============================================================
// COMPOSANT
// ============================================================

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  maxDuration = 60,
  disabled = false,
}) => {
  // État
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ============================================================
  // PERMISSION
  // ============================================================

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === "granted");
      
      if (status !== "granted") {
        console.log("[AudioRecorder] Permission denied");
      }
    } catch (error) {
      console.error("[AudioRecorder] Permission error:", error);
      setHasPermission(false);
    }
  };

  // ============================================================
  // ANIMATION PULSE
  // ============================================================

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // ============================================================
  // ENREGISTREMENT
  // ============================================================

  const startRecording = async () => {
    if (disabled || isRecording) return;

    // Vérifier permission
    if (!hasPermission) {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "L'accès au microphone est nécessaire pour enregistrer des messages vocaux."
        );
        return;
      }
      setHasPermission(true);
    }

    try {
      console.log("[AudioRecorder] Starting recording...");

      // Configurer le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Créer et démarrer l'enregistrement
      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recordingRef.current = recording;

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Démarrer le timer
      startTimeRef.current = Date.now();
      setRecordingDuration(0);
      setIsRecording(true);

      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingDuration(elapsed);

        // Auto-stop après la durée max
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);

      console.log("[AudioRecorder] Recording started");
    } catch (error) {
      console.error("[AudioRecorder] Start recording error:", error);
      Alert.alert("Erreur", "Impossible de démarrer l'enregistrement");
      cleanupRecording();
    }
  };

  const stopRecording = async () => {
    if (!isRecording || !recordingRef.current) return;

    try {
      console.log("[AudioRecorder] Stopping recording...");

      // Arrêter le timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Calculer la durée
      const durationMs = Date.now() - startTimeRef.current;

      // Arrêter l'enregistrement
      await recordingRef.current.stopAndUnloadAsync();

      // Récupérer l'URI
      const uri = recordingRef.current.getURI();

      // Reset le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      console.log(`[AudioRecorder] Recording stopped: ${uri}, duration: ${durationMs}ms`);

      // Vérifier durée minimale (1 seconde)
      if (durationMs < 1000) {
        Alert.alert("Trop court", "L'enregistrement doit durer au moins 1 seconde.");
        cleanupRecording();
        return;
      }

      // Callback avec l'URI
      if (uri) {
        onRecordingComplete(uri, durationMs);
      }

      cleanupRecording();
    } catch (error) {
      console.error("[AudioRecorder] Stop recording error:", error);
      Alert.alert("Erreur", "Impossible d'arrêter l'enregistrement");
      cleanupRecording();
    }
  };

  const cancelRecording = async () => {
    if (!isRecording || !recordingRef.current) return;

    try {
      console.log("[AudioRecorder] Cancelling recording...");

      // Arrêter le timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Arrêter et supprimer l'enregistrement
      await recordingRef.current.stopAndUnloadAsync();

      // Reset le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      onCancel?.();
      cleanupRecording();

      console.log("[AudioRecorder] Recording cancelled");
    } catch (error) {
      console.error("[AudioRecorder] Cancel recording error:", error);
      cleanupRecording();
    }
  };

  const cleanupRecording = () => {
    recordingRef.current = null;
    setIsRecording(false);
    setRecordingDuration(0);
    slideAnim.setValue(0);
  };

  // ============================================================
  // FORMATAGE DURÉE
  // ============================================================

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ============================================================
  // RENDU
  // ============================================================

  // Mode enregistrement actif
  if (isRecording) {
    return (
      <View className="flex-row items-center bg-pink-50 px-4 py-3 border-t border-pink-100">
        {/* Bouton annuler */}
        <Pressable
          onPress={cancelRecording}
          className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-3"
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </Pressable>

        {/* Indicateur d'enregistrement */}
        <View className="flex-1 flex-row items-center">
          <Animated.View
            style={{ transform: [{ scale: pulseAnim }] }}
            className="w-3 h-3 bg-red-500 rounded-full mr-3"
          />
          <Text className="text-gray-800 font-medium">
            {formatDuration(recordingDuration)}
          </Text>
          <Text className="text-gray-400 text-sm ml-2">
            / {formatDuration(maxDuration)}
          </Text>
        </View>

        {/* Bouton stop/envoyer */}
        <Pressable
          onPress={stopRecording}
          className="w-12 h-12 bg-pink-500 rounded-full items-center justify-center shadow-lg"
        >
          <Ionicons name="send" size={20} color="white" />
        </Pressable>
      </View>
    );
  }

  // Mode normal - bouton pour démarrer
  return (
    <Pressable
      onPress={startRecording}
      disabled={disabled}
      className={`
        w-10 h-10 rounded-full items-center justify-center
        ${disabled ? "bg-gray-100 opacity-50" : "bg-gray-100"}
      `}
    >
      <Ionicons
        name="mic"
        size={22}
        color={disabled ? "#9CA3AF" : "#6B7280"}
      />
    </Pressable>
  );
};

// ============================================================
// COMPOSANT INLINE POUR CHATINPUT
// ============================================================

interface InlineAudioRecorderProps {
  onRecordingComplete: (uri: string, durationMs: number) => void;
  disabled?: boolean;
}

export const InlineAudioRecorder: React.FC<InlineAudioRecorderProps> = ({
  onRecordingComplete,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animation pulse
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
  }, [isRecording]);

  const startRecording = async () => {
    if (disabled || isRecording) return;

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "L'accès au microphone est nécessaire pour les messages vocaux."
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recordingRef.current = recording;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      startTimeRef.current = Date.now();
      setRecordingDuration(0);
      setIsRecording(true);

      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
        if (elapsed >= 60) stopRecording();
      }, 100);

    } catch (error) {
      console.error("[InlineAudioRecorder] Start error:", error);
      Alert.alert("Erreur", "Impossible de démarrer l'enregistrement");
    }
  };

  const stopRecording = async () => {
    if (!isRecording || !recordingRef.current) return;

    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      const durationMs = Date.now() - startTimeRef.current;
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (durationMs < 1000) {
        Alert.alert("Trop court", "Enregistrement minimum : 1 seconde");
      } else if (uri) {
        onRecordingComplete(uri, durationMs);
      }

      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);
    } catch (error) {
      console.error("[InlineAudioRecorder] Stop error:", error);
      recordingRef.current = null;
      setIsRecording(false);
    }
  };

  const cancelRecording = async () => {
    if (!isRecording || !recordingRef.current) return;

    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.error("[InlineAudioRecorder] Cancel error:", error);
    }

    recordingRef.current = null;
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isRecording) {
    return (
      <View className="flex-row items-center">
        {/* Annuler */}
        <Pressable
          onPress={cancelRecording}
          className="w-8 h-8 items-center justify-center mr-2"
        >
          <Ionicons name="close" size={20} color="#EF4444" />
        </Pressable>

        {/* Timer */}
        <View className="flex-row items-center mr-2">
          <Animated.View
            style={{ transform: [{ scale: pulseAnim }] }}
            className="w-2 h-2 bg-red-500 rounded-full mr-2"
          />
          <Text className="text-red-500 font-mono text-sm">
            {formatDuration(recordingDuration)}
          </Text>
        </View>

        {/* Envoyer */}
        <Pressable
          onPress={stopRecording}
          className="w-10 h-10 bg-pink-500 rounded-full items-center justify-center"
        >
          <Ionicons name="send" size={18} color="white" />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={startRecording}
      disabled={disabled}
      className={`w-10 h-10 rounded-full items-center justify-center ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <Ionicons name="mic" size={22} color="#6B7280" />
    </Pressable>
  );
};

export default AudioRecorder;