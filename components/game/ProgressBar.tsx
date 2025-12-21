/**
 * ProgressBar - Barre de progression de la partie
 * 
 * Affiche la progression dans les défis
 */

import React from 'react';
import { View, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { INTENSITY_LEVELS, type IntensityLevel } from '../../types';

interface ProgressBarProps {
  /** Nombre de défis complétés */
  completed: number;
  /** Nombre total de défis */
  total: number;
  /** Niveau d'intensité actuel */
  currentIntensity?: IntensityLevel;
  /** Afficher le pourcentage */
  showPercentage?: boolean;
  /** Afficher le compteur x/y */
  showCounter?: boolean;
  /** Hauteur de la barre */
  height?: number;
  /** Animation activée */
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  completed,
  total,
  currentIntensity = 1,
  showPercentage = false,
  showCounter = true,
  height = 8,
  animated = true,
}) => {
  // Calculer le pourcentage
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const progress = total > 0 ? completed / total : 0;

  // Couleurs selon l'intensité
  const intensityColors: Record<IntensityLevel, readonly [string, string]> = {
    1: ['#10B981', '#059669'] as const,
    2: ['#F59E0B', '#D97706'] as const,
    3: ['#EC4899', '#DB2777'] as const,
    4: ['#EF4444', '#DC2626'] as const,
  };

  const gradientColors = intensityColors[currentIntensity];

  // Animation de la largeur
  const animatedWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.spring(animatedWidth, {
        toValue: progress,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(progress);
    }
  }, [progress, animated]);

  // Interpolation pour la largeur
  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="w-full">
      {/* Labels au-dessus de la barre */}
      {(showPercentage || showCounter) && (
        <View className="flex-row justify-between mb-2">
          {showCounter && (
            <Text className="text-sm text-gray-600 font-medium">
              Défi {completed}/{total}
            </Text>
          )}
          {showPercentage && (
            <Text className="text-sm text-gray-500">
              {percentage}%
            </Text>
          )}
        </View>
      )}

      {/* Barre de progression */}
      <View 
        className="w-full bg-gray-200 rounded-full overflow-hidden"
        style={{ height }}
      >
        <Animated.View
          style={{
            width: widthInterpolate,
            height: '100%',
          }}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-1 rounded-full"
          />
        </Animated.View>
      </View>
    </View>
  );
};

/**
 * Progress avec étapes (dots)
 */
interface StepProgressProps {
  /** Index actuel (0-based) */
  currentStep: number;
  /** Nombre total d'étapes */
  totalSteps: number;
  /** Niveaux d'intensité par étape */
  intensityLevels?: IntensityLevel[];
  /** Afficher les emojis */
  showEmojis?: boolean;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps,
  intensityLevels,
  showEmojis = false,
}) => {
  // Limiter l'affichage si trop d'étapes
  const maxVisibleSteps = 10;
  const showDots = totalSteps <= maxVisibleSteps;

  if (!showDots) {
    // Afficher une barre classique pour beaucoup d'étapes
    return (
      <ProgressBar
        completed={currentStep + 1}
        total={totalSteps}
        currentIntensity={intensityLevels?.[currentStep] || 1}
        showCounter
      />
    );
  }

  return (
    <View className="flex-row items-center justify-center">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const intensity = intensityLevels?.[index] || 1;
        const info = INTENSITY_LEVELS.find((i) => i.level === intensity);

        // Couleur du dot
        const dotColor = isCompleted || isCurrent
          ? {
              1: '#10B981',
              2: '#F59E0B',
              3: '#EC4899',
              4: '#EF4444',
            }[intensity]
          : '#E5E7EB';

        return (
          <React.Fragment key={index}>
            {/* Dot ou emoji */}
            <View
              className={`
                items-center justify-center
                ${isCurrent ? 'scale-125' : ''}
              `}
            >
              {showEmojis && info ? (
                <Text 
                  className={`text-lg ${!isCompleted && !isCurrent ? 'opacity-30' : ''}`}
                >
                  {info.emoji}
                </Text>
              ) : (
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
              )}
            </View>

            {/* Ligne de connexion */}
            {index < totalSteps - 1 && (
              <View
                className="h-0.5 mx-1"
                style={{
                  width: 12,
                  backgroundColor: isCompleted ? dotColor : '#E5E7EB',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

/**
 * Progress circulaire
 */
interface CircularProgressProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  completed,
  total,
  size = 60,
  strokeWidth = 4,
  color = '#EC4899',
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      {/* Background circle */}
      <View
        className="absolute rounded-full border-gray-200"
        style={{
          width: size - strokeWidth,
          height: size - strokeWidth,
          borderWidth: strokeWidth,
        }}
      />

      {/* Progress circle (simplified, would need SVG for smooth arc) */}
      <View
        className="absolute rounded-full"
        style={{
          width: size - strokeWidth,
          height: size - strokeWidth,
          borderWidth: strokeWidth,
          borderColor: color,
          borderTopColor: 'transparent',
          borderRightColor: percentage > 25 ? color : 'transparent',
          borderBottomColor: percentage > 50 ? color : 'transparent',
          borderLeftColor: percentage > 75 ? color : 'transparent',
          transform: [{ rotate: '-45deg' }],
        }}
      />

      {/* Center text */}
      <Text className="text-sm font-bold text-gray-800">
        {completed}/{total}
      </Text>
    </View>
  );
};

export default ProgressBar;
