/**
 * ReactionAnimation - Animation d'une réaction emoji
 * 
 * Affiche un emoji animé qui flotte vers le haut et disparaît
 */

import React, { useEffect, useRef } from 'react';
import { Text, Animated, Dimensions, Easing } from 'react-native';
import type { Reaction } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReactionAnimationProps {
  /** Emoji de réaction */
  reaction: Reaction;
  /** ID unique pour la clé */
  id: string;
  /** Position X de départ (optionnel, aléatoire sinon) */
  startX?: number;
  /** Position Y de départ (optionnel, bas de l'écran sinon) */
  startY?: number;
  /** Callback quand l'animation est terminée */
  onComplete?: () => void;
  /** Taille de l'emoji */
  size?: 'small' | 'medium' | 'large';
}

export const ReactionAnimation: React.FC<ReactionAnimationProps> = ({
  reaction,
  id,
  startX,
  startY,
  onComplete,
  size = 'medium',
}) => {
  // Valeurs animées
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  // Tailles selon la prop
  const sizeConfig = {
    small: { fontSize: 24, distance: 150 },
    medium: { fontSize: 40, distance: 250 },
    large: { fontSize: 56, distance: 350 },
  };

  const { fontSize, distance } = sizeConfig[size];

  // Position de départ
  const initialX = startX ?? SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 100;
  const initialY = startY ?? SCREEN_HEIGHT - 150;

  // Mouvement latéral aléatoire
  const lateralMovement = (Math.random() - 0.5) * 80;

  useEffect(() => {
    // Animation séquentielle
    Animated.parallel([
      // Apparition avec scale
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 150,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),

      // Fade in puis fade out
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),

      // Montée
      Animated.timing(translateY, {
        toValue: -distance,
        duration: 1650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      // Mouvement latéral ondulant
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: lateralMovement,
          duration: 550,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -lateralMovement,
          duration: 550,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 550,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),

      // Légère rotation
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: 1,
          duration: 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -1,
          duration: 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete?.();
    });
  }, []);

  // Interpolation de la rotation
  const rotateInterpolate = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: initialX - fontSize / 2,
        top: initialY - fontSize / 2,
        transform: [
          { translateX },
          { translateY },
          { scale },
          { rotate: rotateInterpolate },
        ],
        opacity,
      }}
    >
      <Text style={{ fontSize }}>{reaction}</Text>
    </Animated.View>
  );
};

/**
 * Animation de rafale (plusieurs emojis)
 */
interface ReactionBurstProps {
  reaction: Reaction;
  count?: number;
  onComplete?: () => void;
}

export const ReactionBurst: React.FC<ReactionBurstProps> = ({
  reaction,
  count = 5,
  onComplete,
}) => {
  const [animations, setAnimations] = React.useState<string[]>([]);
  const completedCount = useRef(0);

  useEffect(() => {
    // Créer les animations avec un délai
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const id = `${Date.now()}-${i}`;
        ids.push(id);
        setAnimations((prev) => [...prev, id]);
      }, i * 100);
    }

    return () => {
      // Cleanup
    };
  }, [count]);

  const handleComplete = () => {
    completedCount.current++;
    if (completedCount.current >= count) {
      onComplete?.();
    }
  };

  return (
    <>
      {animations.map((id, index) => (
        <ReactionAnimation
          key={id}
          id={id}
          reaction={reaction}
          size={index === 0 ? 'large' : index < 3 ? 'medium' : 'small'}
          startX={SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 150}
          onComplete={handleComplete}
        />
      ))}
    </>
  );
};

export default ReactionAnimation;
