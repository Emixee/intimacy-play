/**
 * Modal - Composant de modal réutilisable
 * 
 * Utilisation :
 * <Modal visible={showModal} onClose={() => setShowModal(false)}>
 *   <Text>Contenu du modal</Text>
 * </Modal>
 */

import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  type ModalProps as RNModalProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ModalProps {
  /** Afficher/masquer le modal */
  visible: boolean;
  /** Callback de fermeture */
  onClose: () => void;
  /** Titre du modal (optionnel) */
  title?: string;
  /** Contenu du modal */
  children: React.ReactNode;
  /** Afficher le bouton de fermeture X */
  showCloseButton?: boolean;
  /** Fermer en cliquant sur l'overlay */
  closeOnOverlayPress?: boolean;
  /** Animation du modal */
  animationType?: RNModalProps['animationType'];
  /** Taille du modal */
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnOverlayPress = true,
  animationType = 'fade',
  size = 'medium',
}) => {
  // Classes de taille
  const sizeClasses = {
    small: 'w-4/5 max-w-xs',
    medium: 'w-11/12 max-w-md',
    large: 'w-11/12 max-w-lg',
    fullscreen: 'w-full h-full',
  };

  const handleOverlayPress = () => {
    if (closeOnOverlayPress) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <TouchableWithoutFeedback>
              <View
                className={`
                  ${sizeClasses[size]}
                  ${size !== 'fullscreen' ? 'rounded-2xl' : ''}
                  bg-white
                  shadow-2xl
                  overflow-hidden
                `}
              >
                {/* Header avec titre et bouton fermer */}
                {(title || showCloseButton) && (
                  <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                    {title ? (
                      <Text className="text-lg font-semibold text-gray-800 flex-1">
                        {title}
                      </Text>
                    ) : (
                      <View className="flex-1" />
                    )}

                    {showCloseButton && (
                      <TouchableOpacity
                        onPress={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close" size={20} color="#6B7280" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Contenu */}
                <View className={size === 'fullscreen' ? 'flex-1' : ''}>
                  {children}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

// ============================================================
// VARIANTS PRÉ-CONFIGURÉS
// ============================================================

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
}

/**
 * Modal de confirmation avec boutons Annuler/Confirmer
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmVariant = 'primary',
  isLoading = false,
}) => {
  const confirmButtonClass =
    confirmVariant === 'danger'
      ? 'bg-red-500 active:bg-red-600'
      : 'bg-pink-500 active:bg-pink-600';

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      size="small"
      closeOnOverlayPress={!isLoading}
    >
      <View className="p-4">
        <Text className="text-gray-600 text-center mb-6">{message}</Text>

        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={onClose}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-gray-200 active:bg-gray-300"
          >
            <Text className="text-center font-semibold text-gray-700">
              {cancelText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-xl ${confirmButtonClass} ${
              isLoading ? 'opacity-50' : ''
            }`}
          >
            <Text className="text-center font-semibold text-white">
              {isLoading ? '...' : confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

/**
 * Modal d'alerte simple avec un seul bouton
 */
export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  onClose,
  title,
  message,
  buttonText = 'OK',
  type = 'info',
}) => {
  const iconConfig = {
    info: { name: 'information-circle' as const, color: '#3B82F6' },
    success: { name: 'checkmark-circle' as const, color: '#10B981' },
    warning: { name: 'warning' as const, color: '#F59E0B' },
    error: { name: 'alert-circle' as const, color: '#EF4444' },
  };

  const { name: iconName, color: iconColor } = iconConfig[type];

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      size="small"
      showCloseButton={false}
    >
      <View className="p-6 items-center">
        <Ionicons name={iconName} size={48} color={iconColor} />

        <Text className="text-lg font-semibold text-gray-800 mt-4 text-center">
          {title}
        </Text>

        <Text className="text-gray-600 mt-2 text-center">{message}</Text>

        <TouchableOpacity
          onPress={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-pink-500 active:bg-pink-600"
        >
          <Text className="text-center font-semibold text-white">
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default Modal;
