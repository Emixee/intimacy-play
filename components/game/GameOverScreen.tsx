/**
 * GameOverScreen - Écran de fin de partie
 */

import React, { memo, useState, useEffect, useMemo } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Button, Card } from "../ui";
import { ConfettiAnimation } from "../animations";

interface GameOverScreenProps {
  completedCount: number;
  totalCount: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

const getCompletionMessage = (rate: number): { message: string; emoji: string } => {
  if (rate === 1) return { message: "Parfait ! Vous avez relevé tous les défis !", emoji: "🏆" };
  if (rate >= 0.8) return { message: "Excellent ! Quelle complicité !", emoji: "🔥" };
  if (rate >= 0.5) return { message: "Beau début ! À quand la revanche ?", emoji: "💕" };
  return { message: "L'important c'est de s'amuser !", emoji: "😊" };
};

export const GameOverScreen = memo<GameOverScreenProps>(({ completedCount, totalCount, onPlayAgain, onGoHome }) => {
  const [showConfetti, setShowConfetti] = useState(true);

  const completionRate = useMemo(() => (totalCount === 0 ? 0 : completedCount / totalCount), [completedCount, totalCount]);
  const { message, emoji } = useMemo(() => getCompletionMessage(completionRate), [completionRate]);
  const skippedCount = useMemo(() => totalCount - completedCount, [totalCount, completedCount]);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-pink-50">
      <ConfettiAnimation active={showConfetti} />

      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-8">
          <Text className="text-7xl">{emoji}</Text>
        </View>

        <Text className="text-3xl font-bold text-gray-800 text-center mb-2">Félicitations !</Text>
        <Text className="text-gray-500 text-center text-lg mb-8">{message}</Text>

        <Card variant="elevated" className="mb-8">
          <Card.Content className="py-6">
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-4xl font-bold text-pink-500">{completedCount}</Text>
                <Text className="text-gray-500 text-sm mt-1">Défis accomplis</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="items-center">
                <Text className="text-4xl font-bold text-gray-400">{skippedCount}</Text>
                <Text className="text-gray-500 text-sm mt-1">Défis passés</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View className="bg-pink-100 rounded-xl p-4 mb-8">
          <Text className="text-pink-700 text-center italic">"La distance n'est qu'un test pour voir jusqu'où l'amour peut voyager" 💕</Text>
        </View>

        <View className="gap-3">
          <Button title="Nouvelle partie 🚀" variant="primary" size="lg" fullWidth onPress={onPlayAgain} />
          <Button title="Retour à l'accueil" variant="outline" size="md" fullWidth onPress={onGoHome} />
        </View>
      </View>
    </SafeAreaView>
  );
});

GameOverScreen.displayName = "GameOverScreen";
export default GameOverScreen;
