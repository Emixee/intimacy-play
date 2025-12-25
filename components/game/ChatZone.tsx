/**
 * ChatZone - Zone de chat en bas de l'écran de jeu
 */

import React, { memo, useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChatBubble } from "../chat";
import { chatService } from "../../services/chat.service";
import type { Message, Gender } from "../../types";

interface ChatZoneProps {
  sessionCode: string;
  userId: string;
  userGender: Gender;
  expanded: boolean;
  onToggle: () => void;
  unreadCount: number;
}

export const ChatZone = memo<ChatZoneProps>(({ sessionCode, userId, userGender, expanded, onToggle, unreadCount }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(sessionCode, (msgs) => {
      setMessages(msgs);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => unsubscribe();
  }, [sessionCode]);

  useEffect(() => {
    if (expanded && messages.length > 0) {
      chatService.markAllAsRead(sessionCode, userId);
    }
  }, [expanded, messages.length, sessionCode, userId]);

  const handleSend = useCallback(async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isSending) return;
    setIsSending(true);
    try {
      await chatService.sendMessage(sessionCode, userId, userGender, trimmedText);
      setInputText("");
    } catch (error) {
      // Erreur silencieuse
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, sessionCode, userId, userGender]);

  if (!expanded) {
    return (
      <Pressable onPress={onToggle} className="flex-row items-center justify-between bg-white px-4 py-3 border-t border-gray-100">
        <View className="flex-row items-center">
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
          <Text className="text-gray-600 ml-2">Chat</Text>
        </View>
        <View className="flex-row items-center">
          {unreadCount > 0 && (
            <View className="bg-pink-500 rounded-full w-5 h-5 items-center justify-center mr-2">
              <Text className="text-white text-xs font-bold">{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
          <Ionicons name="chevron-up" size={20} color="#9CA3AF" />
        </View>
      </Pressable>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="bg-white border-t border-gray-100" style={{ maxHeight: 300 }}>
      <Pressable onPress={onToggle} className="flex-row items-center justify-between px-4 py-2 border-b border-gray-100">
        <Text className="text-gray-800 font-medium">Chat</Text>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </Pressable>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble content={item.content} isOwnMessage={item.senderId === userId} timestamp={item.createdAt} isRead={item.read} />
        )}
        contentContainerStyle={{ padding: 12 }}
        style={{ maxHeight: 180 }}
        ListEmptyComponent={<Text className="text-gray-400 text-center py-4">Aucun message pour le moment</Text>}
        showsVerticalScrollIndicator={false}
      />

      <View className="flex-row items-center px-3 py-2 border-t border-gray-100">
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Écris un message..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
          className={`w-10 h-10 rounded-full items-center justify-center ${inputText.trim() ? "bg-pink-500 active:bg-pink-600" : "bg-gray-200"}`}
        >
          <Ionicons name="send" size={18} color={inputText.trim() ? "#FFF" : "#9CA3AF"} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
});

ChatZone.displayName = "ChatZone";
export default ChatZone;
