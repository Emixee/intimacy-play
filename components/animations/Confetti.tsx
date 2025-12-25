/**
 * Confetti - Animation de confettis pour célébrations
 * 
 * Utilisé pour :
 * - Fin de partie victorieuse
 * - Déblocage premium
 * - Achievements
 */

import React, { useEffect, useMemo } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ============================================================
// TYPES
// ============================================================

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  rotation: number;
  duration: number;
}

interface ConfettiProps {
  /** Activer l'animation */
  active: boolean;
  /** Nombre de confettis */
  count?: number;
  /** Durée de l'animation en ms */
  duration?: number;
  /** Couleurs des confettis */
  colors?: string[];
  /** Callback quand l'animation est terminée */
  onComplete?: () => void;
}

// ============================================================
// CONSTANTES
// ============================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DEFAULT_COLORS = [
  '#EC4899', // pink-500
  '#DB2777', // pink-600
  '#F472B6', // pink-400
  '#F59E0B', // amber-500
  '#10B981', // emerald-500
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EF4444', // red-500
];

// ============================================================
// CONFETTI PIECE COMPONENT
// ============================================================

interface ConfettiPieceProps {
  piece: ConfettiPiece;
  duration: number;
}

const ConfettiPieceComponent: React.FC<ConfettiPieceProps> = ({ piece, duration }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(piece.x);
  const rotation = useSharedValue(piece.rotation);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Animation d'apparition
    scale.value = withDelay(
      piece.delay,
      withTiming(1, { duration: 100 })
    );

    // Chute avec oscillation
    const randomXOffset = (Math.random() - 0.5) * 100;
    translateY.value = withDelay(
      piece.delay,
      withTiming(SCREEN_HEIGHT + 50, {
        duration: piece.duration,
        easing: Easing.out(Easing.quad),
      })
    );

    translateX.value = withDelay(
      piece.delay,
      withSequence(
        withTiming(piece.x + randomXOffset, { duration: piece.duration / 2 }),
        withTiming(piece.x - randomXOffset * 0.5, { duration: piece.duration / 2 })
      )
    );

    // Rotation continue
    rotation.value = withDelay(
      piece.delay,
      withTiming(piece.rotation + 720, {
        duration: piece.duration,
        easing: Easing.linear,
      })
    );

    // Fade out à la fin
    opacity.value = withDelay(
      piece.delay + piece.duration * 0.7,
      withTiming(0, { duration: piece.duration * 0.3 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Forme aléatoire : carré, rectangle, ou cercle
  const shapeStyle = useMemo(() => {
    const shapes = [
      { borderRadius: 0 }, // carré
      { borderRadius: piece.size / 2 }, // cercle
      { borderRadius: 2, width: piece.size * 0.6 }, // rectangle
    ];
    return shapes[piece.id % shapes.length];
  }, [piece]);

  return (
    <Animated.View
      style={[
        styles.piece,
        animatedStyle,
        {
          backgroundColor: piece.color,
          width: piece.size,
          height: piece.size,
          left: piece.x,
          ...shapeStyle,
        },
      ]}
    />
  );
};

// ============================================================
// MAIN CONFETTI COMPONENT
// ============================================================

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  count = 50,
  duration = 3000,
  colors = DEFAULT_COLORS,
  onComplete,
}) => {
  // Générer les confettis
  const pieces = useMemo<ConfettiPiece[]>(() => {
    if (!active) return [];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 8,
      delay: Math.random() * 500,
      rotation: Math.random() * 360,
      duration: duration * (0.8 + Math.random() * 0.4),
    }));
  }, [active, count, colors, duration]);

  // Haptic et callback
  useEffect(() => {
    if (active) {
      // Haptic de célébration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Callback après la fin
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration + 500);

      return () => clearTimeout(timer);
    }
  }, [active, duration, onComplete]);

  if (!active || pieces.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPieceComponent
          key={piece.id}
          piece={piece}
          duration={duration}
        />
      ))}
    </View>
  );
};

// ============================================================
// HOOK POUR CONTRÔLER LES CONFETTIS
// ============================================================

export const useConfetti = () => {
  const [isActive, setIsActive] = React.useState(false);

  const trigger = React.useCallback(() => {
    setIsActive(true);
  }, []);

  const reset = React.useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    trigger,
    reset,
    Confetti: (props: Omit<ConfettiProps, 'active'>) => (
      <Confetti {...props} active={isActive} onComplete={reset} />
    ),
  };
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  piece: {
    position: 'absolute',
  },
});

export default Confetti;