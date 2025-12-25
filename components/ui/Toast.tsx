/**
 * Toast - Composant de notification toast
 * 
 * Affiche des notifications temporaires avec différents types :
 * - success : Confirmation d'action réussie
 * - error : Erreur ou échec
 * - warning : Avertissement
 * - info : Information générale
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';

// ============================================================
// TYPES
// ============================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastStore {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

// ============================================================
// STORE ZUSTAND
// ============================================================

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clearAll: () => set({ toasts: [] }),
}));

// ============================================================
// HOOK HELPER
// ============================================================

export const useToast = () => {
  const addToast = useToastStore((state) => state.addToast);
  const clearAll = useToastStore((state) => state.clearAll);

  const success = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'success', title, message, duration });
  }, [addToast]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'error', title, message, duration });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'warning', title, message, duration });
  }, [addToast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'info', title, message, duration });
  }, [addToast]);

  return { success, error, warning, info, clearAll };
};

// ============================================================
// STYLES
// ============================================================

const SCREEN_WIDTH = Dimensions.get('window').width;

const toastStyles: Record<ToastType, { 
  bg: string; 
  border: string;
  icon: keyof typeof Ionicons.glyphMap; 
  iconColor: string;
  textColor: string;
}> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'checkmark-circle',
    iconColor: '#22C55E',
    textColor: 'text-green-800',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'close-circle',
    iconColor: '#EF4444',
    textColor: 'text-red-800',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'warning',
    iconColor: '#F59E0B',
    textColor: 'text-amber-800',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'information-circle',
    iconColor: '#3B82F6',
    textColor: 'text-blue-800',
  },
};

// ============================================================
// COMPOSANT TOAST ITEM
// ============================================================

interface ToastItemProps {
  toast: ToastData;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const style = toastStyles[toast.type];
  const duration = toast.duration ?? 4000;

  // Animation d'entrée
  useEffect(() => {
    // Haptic feedback selon le type
    if (toast.type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (toast.type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => {
      dismissToast();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const dismissToast = useCallback(() => {
    translateY.value = withTiming(-100, { 
      duration: 200, 
      easing: Easing.out(Easing.ease) 
    });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
  }, [onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      style={[
        { 
          marginHorizontal: 16, 
          marginTop: 8,
          width: SCREEN_WIDTH - 32,
        },
        animatedStyle,
      ]}
    >
      <View 
        className={`
          flex-row items-start p-4 rounded-xl border
          ${style.bg} ${style.border}
        `}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {/* Icône */}
        <View className="mr-3 mt-0.5">
          <Ionicons name={style.icon} size={24} color={style.iconColor} />
        </View>

        {/* Contenu */}
        <View className="flex-1">
          <Text className={`font-semibold text-base ${style.textColor}`}>
            {toast.title}
          </Text>
          {toast.message && (
            <Text className={`mt-1 text-sm ${style.textColor} opacity-80`}>
              {toast.message}
            </Text>
          )}
          
          {/* Action */}
          {toast.action && (
            <TouchableOpacity 
              onPress={() => {
                toast.action?.onPress();
                dismissToast();
              }}
              className="mt-2"
            >
              <Text className={`font-semibold text-sm ${style.textColor} underline`}>
                {toast.action.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bouton fermer */}
        <TouchableOpacity 
          onPress={dismissToast}
          className="p-1 -mr-1 -mt-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={style.iconColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ============================================================
// COMPOSANT TOAST CONTAINER
// ============================================================

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <View 
      className="absolute top-0 left-0 right-0 z-50"
      style={{ paddingTop: 50 }} // Safe area
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </View>
  );
};

export default ToastContainer;