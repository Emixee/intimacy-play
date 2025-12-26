/**
 * Composant Avatar utilisateur
 * 
 * Extrait de profile.tsx pour optimisation
 * Utilise React.memo pour éviter les re-renders inutiles
 */

import React, { memo } from "react";
import { Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface UserAvatarProps {
  name: string;
  size?: number;
}

/**
 * Avatar avec initiale de l'utilisateur
 */
export const UserAvatar = memo<UserAvatarProps>(({ name, size = 96 }) => {
  // Extraire l'initiale (première lettre du prénom)
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  return (
    <LinearGradient
      colors={["#EC4899", "#F472B6"]}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{ fontSize: size * 0.4 }}
        className="text-white font-bold"
      >
        {initial}
      </Text>
    </LinearGradient>
  );
});

UserAvatar.displayName = "UserAvatar";
