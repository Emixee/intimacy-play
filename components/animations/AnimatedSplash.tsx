/**
 * AnimatedSplash - Écran de démarrage avec animation
 * 
 * Affiche un écran de chargement animé avec :
 * - Fade in du logo
 * - Animation de pulsation
 * - Transition fluide vers l'app
 */

import React, { useEffect } from 'react';
import { View, Text, Dimensions, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

// ============================================================
// TYPES
// ============================================================

interface AnimatedSplashProps {
  /** L'app est-elle prête ? */
  isReady: boolean;
  /** Callback quand l'animation de sortie est terminée */
  onAnimationComplete: () => void;
  /** Message de chargement */
  loadingMessage?: string;
  /** Afficher une animation Lottie ? */
  showLottie?: boolean;
  /** Source de l'animation Lottie */
  lottieSource?: any;
}

// ============================================================
// CONSTANTES
// ============================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================
// COMPOSANT
// ============================================================

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({
  isReady,
  onAnimationComplete,
  loadingMessage = 'Chargement...',
  showLottie = false,
  lottieSource,
}) => {
  // Valeurs animées
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);
  const dotsOpacity = useSharedValue(0);

  // Animation d'entrée
  useEffect(() => {
    // Fade in du logo
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withTiming(1, { 
      duration: 600, 
      easing: Easing.out(Easing.back(1.2)) 
    });

    // Fade in du texte avec délai
    textOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    // Animation des points de chargement
    dotsOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));

    // Pulsation continue du logo
    pulseScale.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  // Animation de sortie quand l'app est prête
  useEffect(() => {
    if (isReady) {
      // Arrêter la pulsation et animer la sortie
      containerOpacity.value = withTiming(0, { duration: 400 });
      containerScale.value = withTiming(1.1, { 
        duration: 400,
        easing: Easing.in(Easing.ease),
      }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      });
    }
  }, [isReady]);

  // Styles animés
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value * pulseScale.value },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={['#FDF2F8', '#FCE7F3', '#FBCFE8']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo animé */}
          <Animated.View style={logoStyle}>
            {showLottie && lottieSource ? (
              <LottieView
                source={lottieSource}
                autoPlay
                loop
                style={styles.lottie}
              />
            ) : (
              <View style={styles.logoContainer}>
                {/* Logo placeholder - remplacer par votre image */}
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoEmoji}>💕</Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Titre de l'app */}
          <Animated.Text style={[styles.title, textStyle]}>
            Intimacy Play
          </Animated.Text>

          {/* Message de chargement */}
          <Animated.View style={[styles.loadingContainer, dotsStyle]}>
            <Text style={styles.loadingText}>{loadingMessage}</Text>
            <LoadingDots />
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.View style={[styles.footer, textStyle]}>
          <Text style={styles.footerText}>
            Connectez-vous intimement ❤️
          </Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

// ============================================================
// COMPOSANT LOADING DOTS
// ============================================================

const LoadingDots: React.FC = () => {
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  useEffect(() => {
    const animateDot = (value: Animated.SharedValue<number>, delay: number) => {
      value.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 400 })
          ),
          -1,
          false
        )
      );
    };

    animateDot(dot1Opacity, 0);
    animateDot(dot2Opacity, 200);
    animateDot(dot3Opacity, 400);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1Opacity.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2Opacity.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3Opacity.value }));

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, dot1Style]} />
      <Animated.View style={[styles.dot, dot2Style]} />
      <Animated.View style={[styles.dot, dot3Style]} />
    </View>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 48,
  },
  lottie: {
    width: 150,
    height: 150,
  },
  title: {
    marginTop: 24,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#DB2777',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#9D174D',
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EC4899',
    marginHorizontal: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    fontSize: 14,
    color: '#BE185D',
  },
});

export default AnimatedSplash;