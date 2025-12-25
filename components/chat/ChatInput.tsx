/**
 * ChatInput - Zone de saisie du chat
 * 
 * PROMPT AUDIO : Intégration de l'enregistrement vocal
 * - Bouton micro pour enregistrer
 * - Mode enregistrement avec timer
 * - Envoi de messages texte et médias
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { Alert } from "react-native";

// ============================================================
// TYPES
// ============================================================

interface ChatInputProps {
  /** Callback envoi de message texte */
  onSendText: (text: string) => Promise<void>;
  /** Callback pour ouvrir le sélecteur de média */
  onPickPhoto?: () => void;
  /** Callback pour ouvrir la caméra */
  onOpenCamera?: () => void;
  /** Callback pour envoyer un audio */
  onSendAudio?: (uri: string, durationMs: number) => Promise<void>;
  /** Placeholder du champ de texte */
  placeholder?: string;
  /** Désactiver la saisie */
  disabled?: boolean;
  /** Afficher les options média */
  showMediaOptions?: boolean;
  /** Afficher l'option audio */
  showAudioOption?: boolean;
}

// ============================================================
// CONSTANTES AUDIO
// ============================================================

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

const MAX_RECORDING_DURATION = 60; // secondes

// ============================================================
// COMPOSANT
// ============================================================

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendText,
  onPickPhoto,
  onOpenCamera,
  onSendAudio,
  placeholder = "Écrire un message...",
  disabled = false,
  showMediaOptions = true,
  showAudioOption = true,
}) => {
  // État texte
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  // État audio
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Refs
  const inputRef = useRef<TextInput>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const trimmedMessage = message.trim();
  const hasText = trimmedMessage.length > 0;

  // ============================================================
  // ANIMATION PULSE PENDANT ENREGISTREMENT
  // ============================================================

  React.useEffect(() => {
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

  // ============================================================
  // ENVOI MESSAGE TEXTE
  // ============================================================

  const handleSendText = async () => {
    if (!hasText || isSending || disabled) return;

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await onSendText(trimmedMessage);
      setMessage("");
      setShowOptions(false);
    } finally {
      setIsSending(false);
    }
  };

  // ============================================================
  // ENREGISTREMENT AUDIO
  // ============================================================

  const startRecording = async () => {
    if (disabled || isRecording || !onSendAudio) return;

    try {
      // Demander permission
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "L'accès au microphone est nécessaire pour les messages vocaux."
        );
        return;
      }

      // Configurer le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Démarrer l'enregistrement
      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      recordingRef.current = recording;

      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Fermer le clavier et les options
      Keyboard.dismiss();
      setShowOptions(false);

      // Démarrer le timer
      startTimeRef.current = Date.now();
      setRecordingDuration(0);
      setIsRecording(true);

      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingDuration(elapsed);

        // Auto-stop après 60 secondes
        if (elapsed >= MAX_RECORDING_DURATION) {
          stopRecording();
        }
      }, 100);

      console.log("[ChatInput] Recording started");
    } catch (error) {
      console.error("[ChatInput] Start recording error:", error);
      Alert.alert("Erreur", "Impossible de démarrer l'enregistrement");
      cleanupRecording();
    }
  };

  const stopRecording = async () => {
    if (!isRecording || !recordingRef.current) return;

    try {
      console.log("[ChatInput] Stopping recording...");

      // Arrêter le timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Calculer la durée
      const durationMs = Date.now() - startTimeRef.current;

      // Arrêter l'enregistrement
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      // Reset le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      console.log(`[ChatInput] Recording stopped: ${uri}, duration: ${durationMs}ms`);

      // Vérifier durée minimale (1 seconde)
      if (durationMs < 1000) {
        Alert.alert("Trop court", "L'enregistrement doit durer au moins 1 seconde.");
        cleanupRecording();
        return;
      }

      // Envoyer l'audio
      if (uri && onSendAudio) {
        await onSendAudio(uri, durationMs);
      }

      cleanupRecording();
    } catch (error) {
      console.error("[ChatInput] Stop recording error:", error);
      Alert.alert("Erreur", "Impossible d'envoyer l'enregistrement");
      cleanupRecording();
    }
  };

  const cancelRecording = async () => {
    if (!isRecording) return;

    try {
      console.log("[ChatInput] Cancelling recording...");

      // Arrêter le timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Arrêter et supprimer l'enregistrement
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
      }

      // Reset le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      cleanupRecording();
      console.log("[ChatInput] Recording cancelled");
    } catch (error) {
      console.error("[ChatInput] Cancel recording error:", error);
      cleanupRecording();
    }
  };

  const cleanupRecording = () => {
    recordingRef.current = null;
    setIsRecording(false);
    setRecordingDuration(0);
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowOptions(!showOptions);
    if (!showOptions) {
      Keyboard.dismiss();
    }
  };

  const handleFocus = () => {
    setShowOptions(false);
  };

  // ============================================================
  // RENDU MODE ENREGISTREMENT
  // ============================================================

  if (isRecording) {
    return (
      <View className="flex-row items-center px-3 py-3 bg-pink-50 border-t border-pink-100">
        {/* Bouton annuler */}
        <TouchableOpacity
          onPress={cancelRecording}
          className="w-10 h-10 bg-white rounded-full items-center justify-center mr-3 shadow-sm"
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>

        {/* Indicateur d'enregistrement */}
        <View className="flex-1 flex-row items-center bg-white rounded-full px-4 py-2 mr-3 shadow-sm">
          <Animated.View
            style={{ transform: [{ scale: pulseAnim }] }}
            className="w-3 h-3 bg-red-500 rounded-full mr-3"
          />
          <Text className="text-gray-800 font-medium flex-1">
            Enregistrement...
          </Text>
          <Text className="text-pink-500 font-mono">
            {formatDuration(recordingDuration)}
          </Text>
          <Text className="text-gray-400 text-sm ml-1">
            / {formatDuration(MAX_RECORDING_DURATION)}
          </Text>
        </View>

        {/* Bouton envoyer */}
        <TouchableOpacity
          onPress={stopRecording}
          className="w-12 h-12 bg-pink-500 rounded-full items-center justify-center shadow-lg"
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================
  // RENDU NORMAL
  // ============================================================

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Menu options média */}
      {showOptions && showMediaOptions && (
        <View className="flex-row justify-around py-4 bg-white border-t border-gray-100">
          {/* Photo depuis galerie */}
          {onPickPhoto && (
            <TouchableOpacity
              onPress={() => {
                setShowOptions(false);
                onPickPhoto();
              }}
              className="items-center"
            >
              <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center">
                <Ionicons name="images" size={24} color="#9333EA" />
              </View>
              <Text className="text-xs text-gray-600 mt-1">Galerie</Text>
            </TouchableOpacity>
          )}

          {/* Photo depuis caméra */}
          {onOpenCamera && (
            <TouchableOpacity
              onPress={() => {
                setShowOptions(false);
                onOpenCamera();
              }}
              className="items-center"
            >
              <View className="w-12 h-12 bg-pink-100 rounded-full items-center justify-center">
                <Ionicons name="camera" size={24} color="#EC4899" />
              </View>
              <Text className="text-xs text-gray-600 mt-1">Caméra</Text>
            </TouchableOpacity>
          )}

          {/* Message vocal */}
          {showAudioOption && onSendAudio && (
            <TouchableOpacity
              onPress={() => {
                setShowOptions(false);
                startRecording();
              }}
              className="items-center"
            >
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
                <Ionicons name="mic" size={24} color="#3B82F6" />
              </View>
              <Text className="text-xs text-gray-600 mt-1">Audio</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Barre de saisie principale */}
      <View className="flex-row items-end px-3 py-2 bg-white border-t border-gray-100">
        {/* Bouton + pour les options */}
        {showMediaOptions && (
          <TouchableOpacity
            onPress={toggleOptions}
            disabled={disabled}
            className={`
              w-10 h-10 rounded-full items-center justify-center mr-2
              ${showOptions ? "bg-pink-500" : "bg-gray-100"}
              ${disabled ? "opacity-50" : ""}
            `}
          >
            <Ionicons
              name={showOptions ? "close" : "add"}
              size={24}
              color={showOptions ? "white" : "#6B7280"}
            />
          </TouchableOpacity>
        )}

        {/* Champ de texte */}
        <View className="flex-1 flex-row items-end bg-gray-100 rounded-2xl px-4 py-2 min-h-[44px] max-h-[120px]">
          <TextInput
            ref={inputRef}
            value={message}
            onChangeText={setMessage}
            onFocus={handleFocus}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            multiline
            editable={!disabled}
            className="flex-1 text-base text-gray-800 py-0"
            style={{ maxHeight: 100 }}
          />
        </View>

        {/* Bouton envoyer ou micro */}
        {hasText ? (
          // Bouton envoyer texte
          <TouchableOpacity
            onPress={handleSendText}
            disabled={disabled || isSending}
            className={`
              w-10 h-10 rounded-full items-center justify-center ml-2 bg-pink-500
              ${disabled || isSending ? "opacity-50" : ""}
            `}
          >
            {isSending ? (
              <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Ionicons name="send" size={18} color="white" />
            )}
          </TouchableOpacity>
        ) : showAudioOption && onSendAudio ? (
          // Bouton micro pour enregistrer
          <TouchableOpacity
            onPress={startRecording}
            disabled={disabled}
            className={`
              w-10 h-10 rounded-full items-center justify-center ml-2 bg-gray-100
              ${disabled ? "opacity-50" : ""}
            `}
          >
            <Ionicons name="mic" size={22} color="#6B7280" />
          </TouchableOpacity>
        ) : (
          // Bouton envoyer désactivé
          <TouchableOpacity
            disabled
            className="w-10 h-10 rounded-full items-center justify-center ml-2 bg-gray-100 opacity-50"
          >
            <Ionicons name="send" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

// ============================================================
// VERSION SIMPLIFIÉE
// ============================================================

interface SimpleChatInputProps {
  onSend: (text: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export const SimpleChatInput: React.FC<SimpleChatInputProps> = ({
  onSend,
  placeholder = "Écrire un message...",
  disabled = false,
}) => {
  return (
    <ChatInput
      onSendText={onSend}
      placeholder={placeholder}
      disabled={disabled}
      showMediaOptions={false}
      showAudioOption={false}
    />
  );
};

export default ChatInput;