/**
 * ScreenTransition - Wrapper pour animations de transition entre écrans
 * 
 * Fournit des animations réutilisables :
 * - fadeIn : Apparition en fondu
 * - slideUp : Glissement du bas
 * - slideRight : Glissement de la droite
 * - scale : Mise à l'échelle
 */

import React, { useEffect } from 'react';
import { ViewStyle, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

// ============================================================
// TYPES
// ============================================================

type TransitionType = 'fadeIn' | 'slideUp' | 'slideRight' | 'scale' | 'slideDown';

interface ScreenTransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

// ============================================================
// COMPOSANT
// ============================================================

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  type = 'fadeIn',
  duration = 300,
  delay = 0,
  style,
}) => {
  const opacity = useSharedValue(type === 'fadeIn' || type === 'scale' ? 0 : 1);
  const translateY = useSharedValue(type === 'slideUp' ? 50 : type === 'slideDown' ? -50 : 0);
  const translateX = useSharedValue(type === 'slideRight' ? 50 : 0);
  const scale = useSharedValue(type === 'scale' ? 0.9 : 1);

  useEffect(() => {
    const timingConfig = {
      duration,
      easing: Easing.out(Easing.ease),
    };

    const springConfig = {
      damping: 15,
      stiffness: 150,
    };

    const animate = () => {
      if (type === 'fadeIn') {
        opacity.value = withTiming(1, timingConfig);
      } else if (type === 'slideUp' || type === 'slideDown') {
        translateY.value = withSpring(0, springConfig);
        opacity.value = withTiming(1, { duration: duration * 0.5 });
      } else if (type === 'slideRight') {
        translateX.value = withSpring(0, springConfig);
        opacity.value = withTiming(1, { duration: duration * 0.5 });
      } else if (type === 'scale') {
        scale.value = withSpring(1, springConfig);
        opacity.value = withTiming(1, timingConfig);
      }
    };

    if (delay > 0) {
      const timer = setTimeout(animate, delay);
      return () => clearTimeout(timer);
    } else {
      animate();
    }
  }, [type, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// ============================================================
// COMPOSANTS PRÉDÉFINIS
// ============================================================

export const FadeIn: React.FC<Omit<ScreenTransitionProps, 'type'>> = (props) => (
  <ScreenTransition type="fadeIn" {...props} />
);

export const SlideUp: React.FC<Omit<ScreenTransitionProps, 'type'>> = (props) => (
  <ScreenTransition type="slideUp" {...props} />
);

export const SlideRight: React.FC<Omit<ScreenTransitionProps, 'type'>> = (props) => (
  <ScreenTransition type="slideRight" {...props} />
);

export const ScaleIn: React.FC<Omit<ScreenTransitionProps, 'type'>> = (props) => (
  <ScreenTransition type="scale" {...props} />
);

// ============================================================
// HOOK POUR ANIMATIONS STAGGERED
// ============================================================

interface UseStaggeredAnimationOptions {
  itemCount: number;
  staggerDelay?: number;
  type?: TransitionType;
  duration?: number;
}

export const useStaggeredAnimation = ({
  itemCount,
  staggerDelay = 50,
  type = 'slideUp',
  duration = 300,
}: UseStaggeredAnimationOptions) => {
  return Array.from({ length: itemCount }, (_, index) => ({
    type,
    duration,
    delay: index * staggerDelay,
  }));
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenTransition;