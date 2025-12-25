/**
 * ChatZone - Zone de chat avec support médias éphémères
 * 
 * Fonctionnalités :
 * - Messages texte
 * - Envoi de photos (galerie ou caméra)
 * - Envoi de vidéos
 * - Médias éphémères (expiration 10 min)
 * - Téléchargement médias (Premium) via partage
 * 
 * PROMPT 10.2 : Intégration complète des médias
 */

import React, { memo, useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";

// Composants chat
import { ChatBubble } from "../chat/ChatBubble";
import { MediaMessage } from "../chat/MediaMessage";
import { ChatInput } from "../chat/ChatInput";

// Services
import { chatService } from "../../services/chat.service";
import { mediaService } from "../../services/media.service";

// Types
import type { Message, Gender, MessageType } from "../../types";

// ============================================================
// TYPES
// ============================================================

interface ChatZoneProps {
  sessionCode: string;
  userId: string;
  userGender: Gender;
  expanded: boolean;
  onToggle: () => void;
  unreadCount: number;
  isPremium?: boolean;
}

// ============================================================
// COMPOSANT
// ============================================================

export const ChatZone = memo<ChatZoneProps>(({
  sessionCode,
  userId,
  userGender,
  expanded,
  onToggle,
  unreadCount,
  isPremium = false,
}) => {
  // État
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // ============================================================
  // EFFETS
  // ============================================================

  // Écoute des messages en temps réel
  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(
      sessionCode,
      (msgs) => {
        setMessages(msgs);
        // Scroll vers le bas après réception
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (error) => {
        console.error("[ChatZone] Messages subscription error:", error);
      }
    );

    return () => unsubscribe();
  }, [sessionCode]);

  // Marquer comme lu quand le chat est ouvert
  useEffect(() => {
    if (expanded && messages.length > 0) {
      chatService.markAllAsRead(sessionCode, userId);
    }
  }, [expanded, messages.length, sessionCode, userId]);

  // ============================================================
  // ENVOI DE MESSAGE TEXTE
  // ============================================================

  const handleSendText = useCallback(async (text: string) => {
    if (isSending) return;

    setIsSending(true);
    try {
      const result = await chatService.sendMessage(
        sessionCode,
        userId,
        userGender,
        text
      );

      if (!result.success) {
        Alert.alert("Erreur", result.error || "Impossible d'envoyer le message");
      }
    } catch (error) {
      console.error("[ChatZone] Send text error:", error);
      Alert.alert("Erreur", "Impossible d'envoyer le message");
    } finally {
      setIsSending(false);
    }
  }, [isSending, sessionCode, userId, userGender]);

  // ============================================================
  // ENVOI DE MÉDIAS
  // ============================================================

  const sendMedia = useCallback(async (uri: string, type: MessageType) => {
    if (isUploading) return;

    setIsUploading(true);
    try {
      const result = await mediaService.sendMediaMessage(
        sessionCode,
        userId,
        userGender,
        uri,
        type
      );

      if (!result.success) {
        Alert.alert("Erreur", result.error || "Impossible d'envoyer le média");
      }
    } catch (error) {
      console.error("[ChatZone] Send media error:", error);
      Alert.alert("Erreur", "Impossible d'envoyer le média");
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, sessionCode, userId, userGender]);

  // ============================================================
  // PICKERS MÉDIAS
  // ============================================================

  // Sélection depuis la galerie (photo ou vidéo)
  const handlePickPhoto = useCallback(async () => {
    try {
      // Demander permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "L'accès à la galerie est nécessaire pour envoyer des photos."
        );
        return;
      }

      // Ouvrir le picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mediaType: MessageType = asset.type === "video" ? "video" : "photo";
        await sendMedia(asset.uri, mediaType);
      }
    } catch (error) {
      console.error("[ChatZone] Pick photo error:", error);
      Alert.alert("Erreur", "Impossible d'accéder à la galerie");
    }
  }, [sendMedia]);

  // Photo depuis la caméra
  const handleOpenCamera = useCallback(async () => {
    try {
      // Demander permission caméra
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "L'accès à la caméra est nécessaire pour prendre des photos."
        );
        return;
      }

      // Ouvrir la caméra
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mediaType: MessageType = asset.type === "video" ? "video" : "photo";
        await sendMedia(asset.uri, mediaType);
      }
    } catch (error) {
      console.error("[ChatZone] Open camera error:", error);
      Alert.alert("Erreur", "Impossible d'accéder à la caméra");
    }
  }, [sendMedia]);

  // Enregistrement audio (placeholder)
  const handleStartRecording = useCallback(() => {
    Alert.alert(
      "Bientôt disponible",
      "L'enregistrement audio sera disponible dans une prochaine version."
    );
  }, []);

  // ============================================================
  // TÉLÉCHARGEMENT MÉDIA (Premium) - Via partage
  // ============================================================

  const handleDownloadMedia = useCallback(async (messageId: string) => {
    try {
      const result = await mediaService.downloadMedia(
        sessionCode,
        messageId,
        isPremium
      );

      if (!result.success) {
        Alert.alert("Erreur", result.error || "Impossible de télécharger");
        return;
      }

      if (result.data && result.data.url) {
        // Vérifier si le partage est disponible
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          // Ouvrir le menu de partage avec l'URL
          // L'utilisateur pourra sauvegarder dans sa galerie
          await Sharing.shareAsync(result.data.url, {
            dialogTitle: "Sauvegarder le média",
            mimeType: result.data.type === "video" ? "video/mp4" : "image/jpeg",
          });
        } else {
          // Fallback : ouvrir l'URL dans le navigateur
          const canOpen = await Linking.canOpenURL(result.data.url);
          if (canOpen) {
            await Linking.openURL(result.data.url);
            Alert.alert(
              "💡 Astuce",
              "Appuyez longuement sur l'image dans le navigateur pour la sauvegarder."
            );
          } else {
            Alert.alert("Erreur", "Impossible d'ouvrir le média");
          }
        }
      }
    } catch (error) {
      console.error("[ChatZone] Download media error:", error);
      Alert.alert("Erreur", "Impossible de télécharger le média");
    }
  }, [sessionCode, isPremium]);

  // ============================================================
  // RENDU D'UN MESSAGE
  // ============================================================

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === userId;

    // Message texte
    if (item.type === "text") {
      return (
        <ChatBubble
          content={item.content}
          isOwnMessage={isOwnMessage}
          timestamp={item.createdAt}
          isRead={item.read}
        />
      );
    }

    // Message média (photo, video, audio)
    return (
      <MediaMessage
        type={item.type}
        mediaUrl={item.mediaUrl}
        thumbnailUrl={item.mediaThumbnail}
        expiresAt={item.mediaExpiresAt}
        isDownloaded={item.mediaDownloaded}
        isOwnMessage={isOwnMessage}
        timestamp={item.createdAt}
        onPress={() => {
          // Ouvrir en plein écran (futur)
          console.log("[ChatZone] View media:", item.id);
        }}
        onDownload={
          isPremium && !isOwnMessage
            ? () => handleDownloadMedia(item.id)
            : undefined
        }
      />
    );
  }, [userId, isPremium, handleDownloadMedia]);

  // ============================================================
  // RENDU
  // ============================================================

  // Mode réduit (barre cliquable)
  if (!expanded) {
    return (
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between bg-white px-4 py-3 border-t border-gray-100"
      >
        <View className="flex-row items-center">
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
          <Text className="text-gray-600 ml-2">Chat</Text>
          {isUploading && (
            <ActivityIndicator size="small" color="#EC4899" style={{ marginLeft: 8 }} />
          )}
        </View>
        <View className="flex-row items-center">
          {unreadCount > 0 && (
            <View className="bg-pink-500 rounded-full w-5 h-5 items-center justify-center mr-2">
              <Text className="text-white text-xs font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
          <Ionicons name="chevron-up" size={20} color="#9CA3AF" />
        </View>
      </Pressable>
    );
  }

  // Mode étendu (chat complet)
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="bg-white border-t border-gray-100"
      style={{ maxHeight: 350 }}
    >
      {/* Header */}
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between px-4 py-2 border-b border-gray-100"
      >
        <View className="flex-row items-center">
          <Text className="text-gray-800 font-medium">Chat</Text>
          {isUploading && (
            <View className="flex-row items-center ml-2">
              <ActivityIndicator size="small" color="#EC4899" />
              <Text className="text-pink-500 text-xs ml-1">Envoi...</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </Pressable>

      {/* Liste des messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 12 }}
        style={{ maxHeight: 200 }}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center py-4">
            Aucun message pour le moment
          </Text>
        }
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />

      {/* Zone de saisie avec options médias */}
      <ChatInput
        onSendText={handleSendText}
        onPickPhoto={handlePickPhoto}
        onOpenCamera={handleOpenCamera}
        onStartRecording={handleStartRecording}
        placeholder="Écris un message..."
        disabled={isSending || isUploading}
        showMediaOptions={true}
        showAudioOption={false}
      />
    </KeyboardAvoidingView>
  );
});

ChatZone.displayName = "ChatZone";
export default ChatZone;