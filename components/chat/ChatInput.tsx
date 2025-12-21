/**
 * ChatInput - Zone de saisie du chat
 * 
 * Permet d'envoyer des messages texte et des médias
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ChatInputProps {
  /** Callback envoi de message texte */
  onSendText: (text: string) => Promise<void>;
  /** Callback pour ouvrir le sélecteur de photo */
  onPickPhoto?: () => void;
  /** Callback pour ouvrir la caméra */
  onOpenCamera?: () => void;
  /** Callback pour démarrer l'enregistrement audio */
  onStartRecording?: () => void;
  /** Placeholder du champ de texte */
  placeholder?: string;
  /** Désactiver la saisie */
  disabled?: boolean;
  /** Afficher les options média */
  showMediaOptions?: boolean;
  /** Afficher l'option audio */
  showAudioOption?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendText,
  onPickPhoto,
  onOpenCamera,
  onStartRecording,
  placeholder = 'Écrire un message...',
  disabled = false,
  showMediaOptions = true,
  showAudioOption = true,
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const trimmedMessage = message.trim();
  const hasText = trimmedMessage.length > 0;

  // Envoyer le message
  const handleSend = async () => {
    if (!hasText || isSending || disabled) return;

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await onSendText(trimmedMessage);
      setMessage('');
      setShowOptions(false);
    } finally {
      setIsSending(false);
    }
  };

  // Toggle menu options
  const toggleOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowOptions(!showOptions);
    if (!showOptions) {
      Keyboard.dismiss();
    }
  };

  // Fermer les options au focus du champ texte
  const handleFocus = () => {
    setShowOptions(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Menu options média */}
      {showOptions && showMediaOptions && (
        <View className="flex-row justify-around py-4 bg-white border-t border-gray-100">
          {/* Photo depuis galerie */}
          {onPickPhoto && (
            <TouchableOpacity
              onPress={onPickPhoto}
              className="items-center"
            >
              <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center">
                <Ionicons name="images" size={24} color="#9333EA" />
              </View>
              <View className="text-xs text-gray-600 mt-1">Galerie</View>
            </TouchableOpacity>
          )}

          {/* Photo depuis caméra */}
          {onOpenCamera && (
            <TouchableOpacity
              onPress={onOpenCamera}
              className="items-center"
            >
              <View className="w-12 h-12 bg-pink-100 rounded-full items-center justify-center">
                <Ionicons name="camera" size={24} color="#EC4899" />
              </View>
              <View className="text-xs text-gray-600 mt-1">Caméra</View>
            </TouchableOpacity>
          )}

          {/* Message vocal */}
          {showAudioOption && onStartRecording && (
            <TouchableOpacity
              onPress={onStartRecording}
              className="items-center"
            >
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
                <Ionicons name="mic" size={24} color="#3B82F6" />
              </View>
              <View className="text-xs text-gray-600 mt-1">Audio</View>
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
              ${showOptions ? 'bg-pink-500' : 'bg-gray-100'}
              ${disabled ? 'opacity-50' : ''}
            `}
          >
            <Ionicons
              name={showOptions ? 'close' : 'add'}
              size={24}
              color={showOptions ? 'white' : '#6B7280'}
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
        <TouchableOpacity
          onPress={hasText ? handleSend : onStartRecording}
          disabled={disabled || isSending || (!hasText && !onStartRecording)}
          className={`
            w-10 h-10 rounded-full items-center justify-center ml-2
            ${hasText ? 'bg-pink-500' : 'bg-gray-100'}
            ${disabled || isSending ? 'opacity-50' : ''}
          `}
        >
          {isSending ? (
            <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : hasText ? (
            <Ionicons name="send" size={18} color="white" />
          ) : showAudioOption && onStartRecording ? (
            <Ionicons name="mic" size={22} color="#6B7280" />
          ) : (
            <Ionicons name="send" size={18} color="#9CA3AF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

/**
 * Version simplifiée sans options média
 */
interface SimpleChatInputProps {
  onSend: (text: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export const SimpleChatInput: React.FC<SimpleChatInputProps> = ({
  onSend,
  placeholder = 'Écrire un message...',
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
