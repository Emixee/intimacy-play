/**
 * MediaMessage - Message contenant un média (photo, vidéo, audio)
 * 
 * Gère l'affichage et le téléchargement des médias éphémères
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { MessageType } from '../../types';

interface MediaMessageProps {
  /** Type de média */
  type: MessageType;
  /** URL du média (Firebase Storage) */
  mediaUrl: string | null;
  /** URL de la miniature (pour photos/vidéos) */
  thumbnailUrl?: string | null;
  /** Date d'expiration du média */
  expiresAt: FirebaseFirestoreTypes.Timestamp | null;
  /** Média déjà téléchargé ? */
  isDownloaded: boolean;
  /** C'est mon message ? */
  isOwnMessage: boolean;
  /** Timestamp du message */
  timestamp: FirebaseFirestoreTypes.Timestamp | Date;
  /** Callback au clic sur le média */
  onPress?: () => void;
  /** Callback pour télécharger le média */
  onDownload?: () => Promise<void>;
}

export const MediaMessage: React.FC<MediaMessageProps> = ({
  type,
  mediaUrl,
  thumbnailUrl,
  expiresAt,
  isDownloaded,
  isOwnMessage,
  timestamp,
  onPress,
  onDownload,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Vérifier si le média a expiré
  const isExpired = expiresAt 
    ? expiresAt.toDate() < new Date() 
    : false;

  // Temps restant avant expiration
  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    const minutes = differenceInMinutes(expiresAt.toDate(), new Date());
    if (minutes <= 0) return 'Expiré';
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h`;
  };

  // Convertir le timestamp
  const messageDate = timestamp instanceof Date 
    ? timestamp 
    : timestamp.toDate();
  const timeString = format(messageDate, 'HH:mm', { locale: fr });

  // Handler de téléchargement
  const handleDownload = async () => {
    if (!onDownload || isLoading || isDownloaded) return;
    setIsLoading(true);
    try {
      await onDownload();
    } finally {
      setIsLoading(false);
    }
  };

  // Rendu selon le type de média
  const renderMediaContent = () => {
    if (isExpired) {
      return (
        <View className="w-48 h-48 bg-gray-200 rounded-xl items-center justify-center">
          <Ionicons name="time-outline" size={32} color="#9CA3AF" />
          <Text className="text-gray-500 text-sm mt-2">Média expiré</Text>
        </View>
      );
    }

    switch (type) {
      case 'photo':
        return renderPhotoMessage();
      case 'video':
        return renderVideoMessage();
      case 'audio':
        return renderAudioMessage();
      default:
        return null;
    }
  };

  // Message photo
  const renderPhotoMessage = () => {
    const imageSource = thumbnailUrl || mediaUrl;

    return (
      <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.9}
        className="relative"
      >
        {imageSource && !imageError ? (
          <Image
            source={{ uri: imageSource }}
            className="w-48 h-48 rounded-xl"
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View className="w-48 h-48 bg-gray-200 rounded-xl items-center justify-center">
            <Ionicons name="image-outline" size={32} color="#9CA3AF" />
          </View>
        )}

        {/* Overlay de téléchargement si pas encore téléchargé */}
        {!isDownloaded && (
          <TouchableOpacity
            onPress={handleDownload}
            className="absolute inset-0 bg-black/40 rounded-xl items-center justify-center"
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="large" />
            ) : (
              <>
                <Ionicons name="download-outline" size={32} color="white" />
                <Text className="text-white text-sm mt-2">Télécharger</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Badge expiration */}
        {!isExpired && expiresAt && (
          <View className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-full">
            <Text className="text-white text-xs">
              ⏱ {getTimeRemaining()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Message vidéo
  const renderVideoMessage = () => {
    return (
      <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.9}
        className="relative"
      >
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            className="w-48 h-48 rounded-xl"
            resizeMode="cover"
          />
        ) : (
          <View className="w-48 h-48 bg-gray-800 rounded-xl items-center justify-center">
            <Ionicons name="videocam" size={32} color="white" />
          </View>
        )}

        {/* Bouton play */}
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-14 h-14 bg-white/90 rounded-full items-center justify-center">
            <Ionicons name="play" size={28} color="#EC4899" />
          </View>
        </View>

        {/* Badge expiration */}
        {!isExpired && expiresAt && (
          <View className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-full">
            <Text className="text-white text-xs">
              ⏱ {getTimeRemaining()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Message audio
  const renderAudioMessage = () => {
    return (
      <TouchableOpacity
        onPress={isDownloaded ? onPress : handleDownload}
        activeOpacity={0.8}
        className={`
          flex-row items-center px-4 py-3 rounded-2xl min-w-[200px]
          ${isOwnMessage ? 'bg-pink-500' : 'bg-white border border-gray-100'}
        `}
      >
        <View 
          className={`
            w-10 h-10 rounded-full items-center justify-center
            ${isOwnMessage ? 'bg-white/20' : 'bg-pink-100'}
          `}
        >
          {isLoading ? (
            <ActivityIndicator 
              color={isOwnMessage ? 'white' : '#EC4899'} 
              size="small" 
            />
          ) : (
            <Ionicons 
              name={isDownloaded ? 'play' : 'download-outline'} 
              size={20} 
              color={isOwnMessage ? 'white' : '#EC4899'} 
            />
          )}
        </View>

        <View className="flex-1 ml-3">
          <Text 
            className={`font-medium ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}
          >
            Message vocal
          </Text>
          {expiresAt && !isExpired && (
            <Text 
              className={`text-xs ${isOwnMessage ? 'text-white/70' : 'text-gray-500'}`}
            >
              Expire dans {getTimeRemaining()}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      className={`
        max-w-[80%] mb-2
        ${isOwnMessage ? 'self-end' : 'self-start'}
      `}
    >
      {renderMediaContent()}

      {/* Heure */}
      <View
        className={`
          mt-1 px-1
          ${isOwnMessage ? 'items-end' : 'items-start'}
        `}
      >
        <Text className="text-xs text-gray-400">{timeString}</Text>
      </View>
    </View>
  );
};

export default MediaMessage;
