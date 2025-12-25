/**
 * ConfettiAnimation - Animation de confettis pour la fin de partie
 */

import React, { useState, useEffect, memo } from "react";
import { View, Animated, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
  initialX: number;
}

interface ConfettiAnimationProps {
  active: boolean;
  count?: number;
  duration?: number;
}

const CONFETTI_COLORS = ["#EC4899", "#F472B6", "#FFD700", "#FF6B6B", "#4ECDC4", "#A855F7"];

export const ConfettiAnimation = memo<ConfettiAnimationProps>(({ 
  active, 
  count = 50,
  duration = 3000 
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const newPieces: ConfettiPiece[] = [];

    for (let i = 0; i < count; i++) {
      const initialX = Math.random() * SCREEN_WIDTH;
      newPieces.push({
        id: i,
        x: new Animated.Value(initialX),
        y: new Animated.Value(-20),
        rotate: new Animated.Value(0),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 10 + 5,
        initialX,
      });
    }

    setPieces(newPieces);

    newPieces.forEach((piece, index) => {
      const animDuration = duration + Math.random() * 2000;
      const delay = index * 50;

      Animated.parallel([
        Animated.timing(piece.y, {
          toValue: SCREEN_HEIGHT + 50,
          duration: animDuration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.x, {
          toValue: piece.initialX + (Math.random() - 0.5) * 200,
          duration: animDuration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotate, {
          toValue: Math.random() * 10,
          duration: animDuration,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => {
      newPieces.forEach((piece) => {
        piece.x.stopAnimation();
        piece.y.stopAnimation();
        piece.rotate.stopAnimation();
      });
    };
  }, [active, count, duration]);

  if (!active || pieces.length === 0) return null;

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 1000 }}>
      {pieces.map((piece) => (
        <Animated.View
          key={piece.id}
          style={{
            position: "absolute",
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.size / 4,
            transform: [
              { translateX: piece.x },
              { translateY: piece.y },
              { rotate: piece.rotate.interpolate({ inputRange: [0, 10], outputRange: ["0deg", "360deg"] }) },
            ],
          }}
        />
      ))}
    </View>
  );
});

ConfettiAnimation.displayName = "ConfettiAnimation";
export default ConfettiAnimation;
