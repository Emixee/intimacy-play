/**
 * ErrorBoundary - Capture les erreurs React non gérées
 * 
 * Affiche un écran de fallback en cas d'erreur critique
 * et permet à l'utilisateur de relancer l'app
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';

// ============================================================
// TYPES
// ============================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================
// COMPOSANT
// ============================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log l'erreur
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    this.setState({ errorInfo });

    // Callback optionnel
    this.props.onError?.(error, errorInfo);
  }

  handleReload = async (): Promise<void> => {
    try {
      // Essayer de recharger l'app via Expo Updates
      await Updates.reloadAsync();
    } catch (e) {
      // Fallback: reset le state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback personnalisé
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback par défaut
      return (
        <SafeAreaView className="flex-1 bg-pink-50">
          <View className="flex-1 justify-center items-center px-6">
            {/* Icône */}
            <View className="w-24 h-24 bg-red-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="warning" size={48} color="#EF4444" />
            </View>

            {/* Titre */}
            <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
              Oups ! Une erreur est survenue
            </Text>

            {/* Message */}
            <Text className="text-gray-600 text-center mb-8">
              L'application a rencontré un problème inattendu. Nous nous excusons pour la gêne occasionnée.
            </Text>

            {/* Boutons */}
            <View className="w-full space-y-3">
              <TouchableOpacity
                onPress={this.handleReload}
                className="w-full bg-pink-500 py-4 rounded-xl active:bg-pink-600"
              >
                <Text className="text-white font-semibold text-center text-lg">
                  Relancer l'application
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={this.handleReset}
                className="w-full bg-gray-200 py-4 rounded-xl active:bg-gray-300"
              >
                <Text className="text-gray-700 font-semibold text-center text-lg">
                  Réessayer
                </Text>
              </TouchableOpacity>
            </View>

            {/* Détails de l'erreur (dev only) */}
            {__DEV__ && this.state.error && (
              <ScrollView className="mt-8 w-full max-h-48 bg-gray-100 rounded-lg p-4">
                <Text className="text-xs text-gray-600 font-mono">
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text className="text-xs text-gray-500 font-mono mt-2">
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;