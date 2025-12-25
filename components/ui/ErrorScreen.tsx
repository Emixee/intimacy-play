/**
 * ErrorScreen - Écran d'erreur générique
 */

import React, { memo } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./Button";

interface ErrorScreenProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  onGoHome: () => void;
  retryText?: string;
  homeText?: string;
}

export const ErrorScreen = memo<ErrorScreenProps>(({
  message,
  title = "Oups !",
  onRetry,
  onGoHome,
  retryText = "Réessayer",
  homeText = "Retour à l'accueil",
}) => {
  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <View className="flex-1 px-6 justify-center items-center">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-xl font-bold text-gray-800 mt-4">{title}</Text>
        <Text className="text-gray-500 text-center mt-2 px-4">{message}</Text>
        <View className="mt-6 gap-3 w-full">
          {onRetry && <Button title={retryText} variant="primary" fullWidth onPress={onRetry} />}
          <Button title={homeText} variant="outline" fullWidth onPress={onGoHome} />
        </View>
      </View>
    </SafeAreaView>
  );
});

ErrorScreen.displayName = "ErrorScreen";
export default ErrorScreen;
