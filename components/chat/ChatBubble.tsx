/**
 * ChatBubble - Bulle de message dans le chat
 * 
 * Affiche un message texte avec l'heure et le statut de lecture
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

interface ChatBubbleProps {
  /** Contenu du message */
  content: string;
  /** C'est mon message ? */
  isOwnMessage: boolean;
  /** Timestamp du message */
  timestamp: FirebaseFirestoreTypes.Timestamp | Date;
  /** Message lu par le destinataire ? */
  isRead?: boolean;
  /** Afficher l'heure */
  showTime?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  isOwnMessage,
  timestamp,
  isRead = false,
  showTime = true,
}) => {
  // Convertir le timestamp si nécessaire
  const messageDate = timestamp instanceof Date 
    ? timestamp 
    : timestamp.toDate();

  const timeString = format(messageDate, 'HH:mm', { locale: fr });

  return (
    <View
      className={`
        max-w-[80%] mb-2
        ${isOwnMessage ? 'self-end' : 'self-start'}
      `}
    >
      {/* Bulle du message */}
      <View
        className={`
          px-4 py-2.5 rounded-2xl
          ${isOwnMessage 
            ? 'bg-pink-500 rounded-br-sm' 
            : 'bg-white rounded-bl-sm border border-gray-100'}
        `}
      >
        <Text
          className={`
            text-base leading-5
            ${isOwnMessage ? 'text-white' : 'text-gray-800'}
          `}
        >
          {content}
        </Text>
      </View>

      {/* Heure et statut */}
      {showTime && (
        <View
          className={`
            flex-row items-center mt-1 px-1
            ${isOwnMessage ? 'justify-end' : 'justify-start'}
          `}
        >
          <Text className="text-xs text-gray-400">{timeString}</Text>
          
          {/* Indicateur de lecture (uniquement pour mes messages) */}
          {isOwnMessage && (
            <View className="ml-1">
              {isRead ? (
                <Ionicons name="checkmark-done" size={14} color="#EC4899" />
              ) : (
                <Ionicons name="checkmark" size={14} color="#9CA3AF" />
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * Séparateur de date dans le chat
 */
interface DateSeparatorProps {
  date: Date;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  const dateString = format(date, 'EEEE d MMMM', { locale: fr });

  return (
    <View className="flex-row items-center justify-center my-4">
      <View className="flex-1 h-px bg-gray-200" />
      <View className="bg-gray-100 px-3 py-1 rounded-full mx-2">
        <Text className="text-xs text-gray-500 capitalize">{dateString}</Text>
      </View>
      <View className="flex-1 h-px bg-gray-200" />
    </View>
  );
};

/**
 * Indicateur "est en train d'écrire..."
 */
interface TypingIndicatorProps {
  partnerName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  partnerName = 'Partenaire' 
}) => {
  return (
    <View className="self-start max-w-[60%] mb-2">
      <View className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
        <View className="flex-row items-center space-x-1">
          <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
          <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100" />
          <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200" />
        </View>
      </View>
      <Text className="text-xs text-gray-400 mt-1 px-1">
        {partnerName} écrit...
      </Text>
    </View>
  );
};

export default ChatBubble;
