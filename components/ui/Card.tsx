/**
 * Composant Card réutilisable
 *
 * Carte avec différentes variantes et support pour les interactions tactiles.
 * Utilise Pressable pour une meilleure compatibilité de types avec NativeWind.
 */

import React, { ReactNode } from "react";
import {
  View,
  Pressable,
  PressableProps,
  ViewProps,
  StyleProp,
  ViewStyle,
} from "react-native";

// ============================================================
// TYPES
// ============================================================

type CardVariant = "default" | "outlined" | "elevated" | "filled";

interface CardBaseProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

interface CardPressableProps extends CardBaseProps {
  onPress: () => void;
  disabled?: boolean;
  activeOpacity?: number;
}

interface CardStaticProps extends CardBaseProps {
  onPress?: never;
}

type CardProps = CardPressableProps | CardStaticProps;

interface CardSubComponentProps {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

// ============================================================
// STYLES PAR VARIANTE
// ============================================================

const variantStyles: Record<CardVariant, string> = {
  default: "bg-white rounded-2xl",
  outlined: "bg-white rounded-2xl border border-gray-200",
  elevated: "bg-white rounded-2xl shadow-md shadow-black/10",
  filled: "bg-pink-50 rounded-2xl",
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

/**
 * Composant Card
 *
 * @example
 * // Card statique
 * <Card variant="elevated">
 *   <Card.Header>
 *     <Text>Titre</Text>
 *   </Card.Header>
 *   <Card.Content>
 *     <Text>Contenu</Text>
 *   </Card.Content>
 * </Card>
 *
 * @example
 * // Card cliquable
 * <Card variant="outlined" onPress={() => console.log('clicked')}>
 *   <Text>Cliquez-moi</Text>
 * </Card>
 */
export const Card = ({
  children,
  variant = "default",
  className = "",
  style,
  ...props
}: CardProps) => {
  const baseStyles = variantStyles[variant];
  const combinedClassName = `${baseStyles} ${className}`.trim();

  // Si onPress est défini, rendre un Pressable
  if ("onPress" in props && props.onPress) {
    const { onPress, disabled = false, activeOpacity = 0.7 } = props;

    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          { opacity: pressed ? activeOpacity : 1 },
          style,
        ]}
        className={combinedClassName}
      >
        {children}
      </Pressable>
    );
  }

  // Sinon, rendre une View statique
  return (
    <View className={combinedClassName} style={style}>
      {children}
    </View>
  );
};

// ============================================================
// SOUS-COMPOSANTS
// ============================================================

/**
 * En-tête de la carte
 */
const CardHeader = ({ children, className = "", style }: CardSubComponentProps) => {
  return (
    <View className={`px-4 pt-4 pb-2 ${className}`.trim()} style={style}>
      {children}
    </View>
  );
};

/**
 * Contenu principal de la carte
 */
const CardContent = ({ children, className = "", style }: CardSubComponentProps) => {
  return (
    <View className={`px-4 py-2 ${className}`.trim()} style={style}>
      {children}
    </View>
  );
};

/**
 * Pied de page de la carte
 */
const CardFooter = ({ children, className = "", style }: CardSubComponentProps) => {
  return (
    <View className={`px-4 pt-2 pb-4 ${className}`.trim()} style={style}>
      {children}
    </View>
  );
};

// ============================================================
// EXPORTS
// ============================================================

// Attacher les sous-composants
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
