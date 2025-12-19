/**
 * Composant Input réutilisable
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ============================================================
// TYPES
// ============================================================

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerClassName?: string;
}

// ============================================================
// COMPOSANT
// ============================================================

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerClassName,
  secureTextEntry,
  className,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  // Gérer le toggle de visibilité du mot de passe
  const isPassword = secureTextEntry !== undefined;
  const showPassword = isPassword && isPasswordVisible;
  
  // Styles dynamiques
  const borderColor = error
    ? "border-red-500"
    : isFocused
    ? "border-pink-500"
    : "border-gray-300";
  
  const inputContainerClasses = [
    "flex-row items-center",
    "bg-white rounded-xl px-4 py-3",
    "border-2",
    borderColor,
  ].join(" ");
  
  return (
    <View className={containerClassName}>
      {/* Label */}
      {label && (
        <Text className="text-gray-700 font-medium mb-2 ml-1">{label}</Text>
      )}
      
      {/* Input Container */}
      <View className={inputContainerClasses}>
        {/* Left Icon */}
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={error ? "#EF4444" : isFocused ? "#EC4899" : "#9CA3AF"}
            style={{ marginRight: 10 }}
          />
        )}
        
        {/* TextInput */}
        <TextInput
          className={`flex-1 text-gray-800 text-base ${className || ""}`}
          placeholderTextColor="#9CA3AF"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        
        {/* Password Toggle ou Right Icon */}
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={isFocused ? "#EC4899" : "#9CA3AF"}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Error Message */}
      {error && (
        <View className="flex-row items-center mt-1 ml-1">
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text className="text-red-500 text-sm ml-1">{error}</Text>
        </View>
      )}
      
      {/* Hint */}
      {hint && !error && (
        <Text className="text-gray-500 text-sm mt-1 ml-1">{hint}</Text>
      )}
    </View>
  );
}

export default Input;