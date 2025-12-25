/**
 * ChatZone - Zone de chat avec support médias éphémères
 * 
 * FIX COMPLET :
 * 1. Détection vidéos robuste (mimeType, type, extension, duration)
 * 2. Logs détaillés pour debug
 * 3. Filtrage messages invalides
 * 4. Protection timestamps null
 */

import React, { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";
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
// HELPERS
// ============================================================

/**
 * Vérifie si un message est valide pour le rendu
 */
const isValidMessage = (message: Message): boolean => {
  if (!message || !message.id || typeof message.id !== "string") {
    return false;
  }
  if (!message.senderId || typeof message.senderId !== "string") {
    return false;
  }
  if (!message.type) {
    return false;
  }
  return true;
};

/**
 * Détecte le type de média depuis un asset ImagePicker
 * FIX: Détection robuste avec mimeType, type, extension ET duration
 */
const detectMediaTypeFromAsset = (asset: ImagePicker.ImagePickerAsset): MessageType => {
  console.log("[ChatZone] detectMediaType - Full asset:", JSON.stringify({
    type: asset.type,
    mimeType: asset.mimeType,
    uri: asset.uri?.substring(0, 80),
    duration: asset.duration,
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize,
  }, null, 2));

  // 1. Vérifier la durée - SI > 0, c'est une vidéo
  if (asset.duration !== undefined && asset.duration !== null && asset.duration > 0) {
    console.log("[ChatZone] ✅ Detected VIDEO from duration:", asset.duration);
    return "video";
  }

  // 2. Vérifier le mimeType
  if (asset.mimeType) {
    const mime = asset.mimeType.toLowerCase();
    if (mime.startsWith("video/")) {
      console.log("[ChatZone] ✅ Detected VIDEO from mimeType:", mime);
      return "video";
    }
    if (mime.startsWith("image/")) {
      console.log("[ChatZone] ✅ Detected PHOTO from mimeType:", mime);
      return "photo";
    }
    if (mime.startsWith("audio/")) {
      console.log("[ChatZone] ✅ Detected AUDIO from mimeType:", mime);
      return "audio";
    }
  }

  // 3. Vérifier le type de l'asset
  if (asset.type === "video") {
    console.log("[ChatZone] ✅ Detected VIDEO from asset.type");
    return "video";
  }
  if (asset.type === "image") {
    console.log("[ChatZone] ✅ Detected PHOTO from asset.type");
    return "photo";
  }

  // 4. Vérifier l'extension du fichier (dernière option)
  const uri = asset.uri.toLowerCase();
  
  // Extensions vidéo
  const videoPatterns = [
    /\.mp4(\?|$)/i,
    /\.mov(\?|$)/i,
    /\.avi(\?|$)/i,
    /\.webm(\?|$)/i,
    /\.mkv(\?|$)/i,
    /\.3gp(\?|$)/i,
    /\.m4v(\?|$)/i,
    /\.wmv(\?|$)/i,
    /\.flv(\?|$)/i,
  ];
  
  for (const pattern of videoPatterns) {
    if (pattern.test(uri)) {
      console.log("[ChatZone] ✅ Detected VIDEO from extension pattern");
      return "video";
    }
  }

  // Extensions audio
  const audioPatterns = [
    /\.mp3(\?|$)/i,
    /\.m4a(\?|$)/i,
    /\.wav(\?|$)/i,
    /\.ogg(\?|$)/i,
    /\.aac(\?|$)/i,
  ];
  
  for (const pattern of audioPatterns) {
    if (pattern.test(uri)) {
      console.log("[ChatZone] ✅ Detected AUDIO from extension pattern");
      return "audio";
    }
  }

  // 5. Par défaut, considérer comme photo
  console.log("[ChatZone] ⚠️ Defaulting to PHOTO (no video indicators found)");
  return "photo";
};

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
  // FILTRER LES MESSAGES VALIDES
  // ============================================================
  
  const validMessages = useMemo(() => {
    try {
      const filtered = messages.filter(isValidMessage);
      console.log(`[ChatZone] Valid messages: ${filtered.length}/${messages.length}`);
      return filtered;
    } catch (error) {
      console.error("[ChatZone] Error filtering messages:", error);
      return [];
    }
  }, [messages]);

  // ============================================================
  // EFFETS
  // ============================================================

  useEffect(() => {
    if (!sessionCode) {
      console.warn("[ChatZone] No session code provided");
      return;
    }

    console.log("[ChatZone] Subscribing to messages for session:", sessionCode);

    const unsubscribe = chatService.subscribeToMessages(
      sessionCode,
      (msgs) => {
        console.log("[ChatZone] Received", msgs.length, "messages");
        // Log details of media messages
        msgs.forEach((msg, idx) => {
          if (msg.type !== "text") {
            console.log(`[ChatZone] Message ${idx}: type=${msg.type}, url=${msg.mediaUrl?.substring(0, 50) || 'null'}`);
          }
        });
        setMessages(msgs || []);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (error) => {
        console.error("[ChatZone] Messages subscription error:", error);
      }
    );

    return () => {
      console.log("[ChatZone] Unsubscribing from messages");
      unsubscribe();
    };
  }, [sessionCode]);

  useEffect(() => {
    if (expanded && validMessages.length > 0 && sessionCode && userId) {
      chatService.markAllAsRead(sessionCode, userId).catch((error) => {
        console.error("[ChatZone] Error marking as read:", error);
      });
    }
  }, [expanded, validMessages.length, sessionCode, userId]);

  // ============================================================
  // ENVOI DE MESSAGE TEXTE
  // ============================================================

  const handleSendText = useCallback(async (text: string) => {
    if (isSending || !text.trim()) return;

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
    if (isUploading) {
      console.log("[ChatZone] Already uploading, skipping");
      return;
    }

    if (!uri || typeof uri !== "string") {
      console.error("[ChatZone] Invalid media URI:", uri);
      Alert.alert("Erreur", "Fichier média invalide");
      return;
    }

    console.log(`[ChatZone] 🚀 Sending ${type.toUpperCase()}: ${uri.substring(0, 80)}...`);

    setIsUploading(true);
    
    const progressMessages: Record<MessageType, string> = {
      audio: "📤 Envoi audio...",
      video: "📤 Envoi vidéo...",
      photo: "📤 Envoi photo...",
      text: "",
    };
    setUploadProgress(progressMessages[type] || "📤 Envoi...");

    try {
      // Nettoyer l'URI
      let cleanUri = uri;
      if (!cleanUri.startsWith("file://") && !cleanUri.startsWith("content://")) {
        cleanUri = `file://${cleanUri}`;
      }

      console.log(`[ChatZone] Clean URI: ${cleanUri.substring(0, 80)}...`);

      const result = await mediaService.sendMediaMessage(
        sessionCode,
        userId,
        userGender,
        cleanUri,
        type
      );

      if (!result.success) {
        console.error("[ChatZone] ❌ Send media failed:", result.error, result.code);
        Alert.alert("Erreur", result.error || "Impossible d'envoyer le média");
      } else {
        console.log("[ChatZone] ✅ Media sent successfully!");
        console.log("[ChatZone] Media URL:", result.data?.mediaUrl?.substring(0, 80));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error("[ChatZone] ❌ Send media error:", error);
      console.error("[ChatZone] Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack?.substring(0, 200),
      });
      
      let errorMessage = "Impossible d'envoyer le média";
      if (error.code === "storage/unknown") {
        errorMessage = "Erreur de connexion. Vérifie ta connexion internet.";
      } else if (error.code === "storage/quota-exceeded") {
        errorMessage = "Fichier trop volumineux (max 50 Mo)";
      } else if (error.code === "storage/unauthorized") {
        errorMessage = "Erreur d'autorisation. Réessaie.";
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
    console.log(`[ChatZone] 🎤 Sending audio: ${uri.substring(0, 50)}..., duration: ${durationMs}ms`);
    await sendMedia(uri, "audio");
  }, [sendMedia]);

  // ============================================================
  // PICKERS MÉDIAS
  // ============================================================

  const handlePickMedia = useCallback(async () => {
    try {
      console.log("[ChatZone] 📷 Opening media picker...");
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "L'accès à la galerie est nécessaire pour envoyer des médias."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      console.log("[ChatZone] ImagePicker result - canceled:", result.canceled);

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const mediaType = detectMediaTypeFromAsset(asset);
        console.log(`[ChatZone] 📁 Selected: ${mediaType.toUpperCase()}`);
        await sendMedia(asset.uri, mediaType);
      }
    } catch (error) {
      console.error("[ChatZone] Pick media error:", error);
      Alert.alert("Erreur", "Impossible d'accéder à la galerie");
    }
  }, [sendMedia]);

  const handleOpenCamera = useCallback(async () => {
    try {
      console.log("[ChatZone] 📸 Opening camera...");
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "L'accès à la caméra est nécessaire pour prendre des photos/vidéos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      console.log("[ChatZone] Camera result - canceled:", result.canceled);

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const mediaType = detectMediaTypeFromAsset(asset);
        console.log(`[ChatZone] 📷 Captured: ${mediaType.toUpperCase()}`);
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
    if (!message || !message.mediaUrl) {
      console.warn("[ChatZone] Cannot open viewer: no mediaUrl");
      return;
    }

    console.log("[ChatZone] Opening viewer:", message.type, message.mediaUrl?.substring(0, 50));

    setViewerData({
      messageId: message.id,
      type: message.type,
      mediaUrl: message.mediaUrl,
      expiresAt: message.mediaExpiresAt,
      isDownloaded: message.mediaDownloaded || false,
      isOwnMessage: message.senderId === userId,
    });
    setShowViewer(true);
  }, [userId]);

  const handleCloseViewer = useCallback(() => {
    setShowViewer(false);
    setViewerData(null);
  }, []);

  // ============================================================
  // TÉLÉCHARGEMENT MÉDIA
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
    if (!item || !item.id || !item.senderId) {
      return null;
    }

    const isOwnMessage = item.senderId === userId;

    if (item.type === "text") {
      return (
        <ChatBubble
          content={item.content || ""}
          isOwnMessage={isOwnMessage}
          timestamp={item.createdAt}
          isRead={item.read}
        />
      );
    }

    return (
      <MediaMessage
        type={item.type}
        mediaUrl={item.mediaUrl}
        thumbnailUrl={item.mediaThumbnail}
        expiresAt={item.mediaExpiresAt}
        isDownloaded={item.mediaDownloaded || false}
        isOwnMessage={isOwnMessage}
        timestamp={item.createdAt}
        isPremium={isPremium}
        onPress={() => handleOpenViewer(item)}
        onDownload={() => handleDownloadMedia(item.id)}
      />
    );
  }, [userId, isPremium, handleOpenViewer, handleDownloadMedia]);

  const keyExtractor = useCallback((item: Message, index: number) => {
    return item?.id || `message-${index}-${Date.now()}`;
  }, []);

  // ============================================================
  // RENDU
  // ============================================================

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

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="bg-white border-t border-gray-100"
        style={{ maxHeight: 400 }}
      >
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

        <FlatList
          ref={flatListRef}
          data={validMessages}
          keyExtractor={keyExtractor}
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
          removeClippedSubviews={false}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
        />

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