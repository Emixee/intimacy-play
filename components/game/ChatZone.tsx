/**
 * ChatZone - Zone de chat avec support médias éphémères
 * 
 * PROMPT AUDIO : Support complet des messages vocaux
 * - Enregistrement audio via ChatInput
 * - Lecture audio dans MediaMessage
 * - Affichage plein écran dans MediaViewer
 * 
 * Fonctionnalités :
 * - Messages texte
 * - Envoi de photos (galerie ou caméra)
 * - Envoi de vidéos
 * - Envoi de messages vocaux
 * - Médias éphémères (expiration 2 min)
 * - Téléchargement médias (Premium) via appui long
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

// Composants chat
import { ChatBubble } from "../chat/ChatBubble";
import { MediaMessage } from "../chat/MediaMessage";
import { ChatInput } from "../chat/ChatInput";
import { MediaViewer } from "../chat/MediaViewer";

// Services
import { chatService } from "../../services/chat.service";
import { mediaService } from "../../services/media.service";

// Types
import type { Message, Gender, MessageType, MediaViewerData } from "../../types";

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
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  
  // État pour le viewer plein écran
  const [viewerData, setViewerData] = useState<MediaViewerData | null>(null);
  const [showViewer, setShowViewer] = useState(false);

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
  // ENVOI DE MÉDIAS (Photo/Vidéo/Audio)
  // ============================================================

  const sendMedia = useCallback(async (uri: string, type: MessageType) => {
    if (isUploading) return;

    // Validation de l'URI
    if (!uri || typeof uri !== "string") {
      console.error("[ChatZone] Invalid media URI:", uri);
      Alert.alert("Erreur", "Fichier média invalide");
      return;
    }

    setIsUploading(true);
    
    // Message de progression selon le type
    if (type === "audio") {
      setUploadProgress("Envoi audio...");
    } else if (type === "video") {
      setUploadProgress("Envoi vidéo...");
    } else {
      setUploadProgress("Envoi photo...");
    }

    try {
      console.log(`[ChatZone] Sending ${type}: ${uri.substring(0, 50)}...`);

      // Vérifier que l'URI est correctement formatée
      const cleanUri = uri.startsWith("file://") ? uri : `file://${uri}`;

      const result = await mediaService.sendMediaMessage(
        sessionCode,
        userId,
        userGender,
        cleanUri,
        type
      );

      if (!result.success) {
        console.error("[ChatZone] Send media failed:", result.error);
        Alert.alert("Erreur", result.error || "Impossible d'envoyer le média");
      } else {
        console.log("[ChatZone] Media sent successfully");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error("[ChatZone] Send media error:", error);
      
      let errorMessage = "Impossible d'envoyer le média";
      if (error.code === "storage/unknown") {
        errorMessage = "Erreur de connexion. Vérifie ta connexion internet.";
      } else if (error.code === "storage/quota-exceeded") {
        errorMessage = "Fichier trop volumineux (max 50 Mo)";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Erreur", errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [isUploading, sessionCode, userId, userGender]);

  // ============================================================
  // ENVOI D'AUDIO
  // ============================================================

  const handleSendAudio = useCallback(async (uri: string, durationMs: number) => {
    console.log(`[ChatZone] Sending audio: ${uri.substring(0, 50)}..., duration: ${durationMs}ms`);
    await sendMedia(uri, "audio");
  }, [sendMedia]);

  // ============================================================
  // PICKERS MÉDIAS
  // ============================================================

  // Sélection depuis la galerie (photo ou vidéo)
  const handlePickMedia = useCallback(async () => {
    try {
      // Demander permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "L'accès à la galerie est nécessaire pour envoyer des médias."
        );
        return;
      }

      // Ouvrir le picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      console.log("[ChatZone] ImagePicker result:", JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Détecter le type de média
        let mediaType: MessageType;
        if (asset.type === "video") {
          mediaType = "video";
        } else if (asset.mimeType?.startsWith("video/")) {
          mediaType = "video";
        } else if (asset.uri.match(/\.(mp4|mov|avi|webm|mkv|3gp)$/i)) {
          mediaType = "video";
        } else {
          mediaType = "photo";
        }

        console.log(`[ChatZone] Detected media type: ${mediaType}`);
        await sendMedia(asset.uri, mediaType);
      }
    } catch (error) {
      console.error("[ChatZone] Pick media error:", error);
      Alert.alert("Erreur", "Impossible d'accéder à la galerie");
    }
  }, [sendMedia]);

  // Photo/Vidéo depuis la caméra
  const handleOpenCamera = useCallback(async () => {
    try {
      // Demander permission caméra
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "L'accès à la caméra est nécessaire pour prendre des photos/vidéos."
        );
        return;
      }

      // Ouvrir la caméra
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      console.log("[ChatZone] Camera result:", JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Détecter le type de média
        let mediaType: MessageType;
        if (asset.type === "video") {
          mediaType = "video";
        } else if (asset.mimeType?.startsWith("video/")) {
          mediaType = "video";
        } else if (asset.uri.match(/\.(mp4|mov|avi|webm|mkv|3gp)$/i)) {
          mediaType = "video";
        } else {
          mediaType = "photo";
        }

        console.log(`[ChatZone] Detected media type: ${mediaType}`);
        await sendMedia(asset.uri, mediaType);
      }
    } catch (error) {
      console.error("[ChatZone] Open camera error:", error);
      Alert.alert("Erreur", "Impossible d'accéder à la caméra");
    }
  }, [sendMedia]);

  // ============================================================
  // AFFICHAGE PLEIN ÉCRAN
  // ============================================================

  const handleOpenViewer = useCallback((message: Message) => {
    if (!message.mediaUrl) return;

    setViewerData({
      messageId: message.id,
      type: message.type,
      mediaUrl: message.mediaUrl,
      expiresAt: message.mediaExpiresAt,
      isDownloaded: message.mediaDownloaded,
      isOwnMessage: message.senderId === userId,
    });
    setShowViewer(true);
  }, [userId]);

  const handleCloseViewer = useCallback(() => {
    setShowViewer(false);
    setViewerData(null);
  }, []);

  // ============================================================
  // TÉLÉCHARGEMENT MÉDIA (Premium)
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("✅ Téléchargé", "Le média a été sauvegardé.");
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
        isPremium={isPremium}
        onPress={() => handleOpenViewer(item)}
        onDownload={() => handleDownloadMedia(item.id)}
      />
    );
  }, [userId, isPremium, handleOpenViewer, handleDownloadMedia]);

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
            <View className="flex-row items-center ml-2">
              <ActivityIndicator size="small" color="#EC4899" />
              {uploadProgress && (
                <Text className="text-pink-500 text-xs ml-1">{uploadProgress}</Text>
              )}
            </View>
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
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="bg-white border-t border-gray-100"
        style={{ maxHeight: 400 }}
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
                <Text className="text-pink-500 text-xs ml-1">
                  {uploadProgress || "Envoi..."}
                </Text>
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
          style={{ maxHeight: 220 }}
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

        {/* Zone de saisie avec options médias et audio */}
        <ChatInput
          onSendText={handleSendText}
          onPickPhoto={handlePickMedia}
          onOpenCamera={handleOpenCamera}
          onSendAudio={handleSendAudio}
          placeholder="Écris un message..."
          disabled={isSending || isUploading}
          showMediaOptions={true}
          showAudioOption={true}
        />
      </KeyboardAvoidingView>

      {/* Modal de visualisation plein écran */}
      {viewerData && (
        <MediaViewer
          visible={showViewer}
          type={viewerData.type}
          mediaUrl={viewerData.mediaUrl}
          expiresAt={viewerData.expiresAt}
          isDownloaded={viewerData.isDownloaded}
          isOwnMessage={viewerData.isOwnMessage}
          isPremium={isPremium}
          onClose={handleCloseViewer}
          onDownload={() => handleDownloadMedia(viewerData.messageId)}
        />
      )}
    </>
  );
});

ChatZone.displayName = "ChatZone";
export default ChatZone;