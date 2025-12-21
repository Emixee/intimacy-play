/**
 * PaywallModal - Modal d'upgrade vers Premium
 * 
 * Affiche les avantages premium et les options d'abonnement
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal } from './Modal';

// Constantes de prix (à synchroniser avec RevenueCat/IAP)
const PRICING = {
  monthly: {
    id: 'premium_monthly',
    price: '6,99 €',
    period: 'mois',
    priceValue: 6.99,
  },
  yearly: {
    id: 'premium_yearly',
    price: '39,99 €',
    period: 'an',
    priceValue: 39.99,
    monthlyEquivalent: '3,33 €',
    savings: '52%',
  },
};

// Avantages Premium
const PREMIUM_FEATURES = [
  {
    icon: 'flame' as const,
    title: 'Tous les niveaux',
    description: 'Accès aux niveaux 3 et 4 (Érotique & Explicite)',
  },
  {
    icon: 'color-palette' as const,
    title: '22 thèmes exclusifs',
    description: 'Fantasmes, BDSM, Kamasutra, et plus...',
  },
  {
    icon: 'infinite' as const,
    title: 'Parties illimitées',
    description: 'Jouez autant que vous voulez',
  },
  {
    icon: 'sparkles' as const,
    title: 'Réactions exclusives',
    description: '6 emojis supplémentaires 🥵💦👅🍑😈💋',
  },
  {
    icon: 'game-controller' as const,
    title: "Jusqu'à 50 défis",
    description: 'Parties plus longues et intenses',
  },
  {
    icon: 'ban' as const,
    title: 'Sans publicité',
    description: 'Profitez sans interruption',
  },
];

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchase: (planId: string) => Promise<void>;
  /** Raison de l'affichage (pour le tracking) */
  triggerReason?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onPurchase,
  triggerReason,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const planId = PRICING[selectedPlan].id;
      await onPurchase(planId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'achat');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      size="large"
      showCloseButton={true}
      closeOnOverlayPress={!isLoading}
    >
      <ScrollView 
        className="max-h-[80vh]"
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec gradient */}
        <LinearGradient
          colors={['#EC4899', '#DB2777']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-6 items-center"
        >
          <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-3">
            <Ionicons name="diamond" size={32} color="white" />
          </View>
          <Text className="text-2xl font-bold text-white">
            Passez Premium
          </Text>
          <Text className="text-white/80 text-center mt-1">
            Débloquez toutes les fonctionnalités
          </Text>
        </LinearGradient>

        {/* Liste des avantages */}
        <View className="p-4">
          {PREMIUM_FEATURES.map((feature, index) => (
            <View 
              key={index}
              className="flex-row items-start py-3 border-b border-gray-100"
            >
              <View className="w-10 h-10 bg-pink-100 rounded-full items-center justify-center mr-3">
                <Ionicons name={feature.icon} size={20} color="#EC4899" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">
                  {feature.title}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Sélection du plan */}
        <View className="px-4 pb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Choisissez votre formule
          </Text>

          {/* Plan annuel (recommandé) */}
          <TouchableOpacity
            onPress={() => setSelectedPlan('yearly')}
            className={`
              p-4 rounded-xl border-2 mb-3 relative
              ${selectedPlan === 'yearly' 
                ? 'border-pink-500 bg-pink-50' 
                : 'border-gray-200 bg-white'}
            `}
          >
            {/* Badge économie */}
            <View className="absolute -top-3 right-4 bg-green-500 px-2 py-0.5 rounded-full">
              <Text className="text-white text-xs font-bold">
                -{PRICING.yearly.savings}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className={`
                  w-5 h-5 rounded-full border-2 mr-3 items-center justify-center
                  ${selectedPlan === 'yearly' ? 'border-pink-500 bg-pink-500' : 'border-gray-300'}
                `}>
                  {selectedPlan === 'yearly' && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
                <View>
                  <Text className="font-semibold text-gray-800">Annuel</Text>
                  <Text className="text-gray-500 text-sm">
                    {PRICING.yearly.monthlyEquivalent}/mois
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-gray-800">
                  {PRICING.yearly.price}
                </Text>
                <Text className="text-gray-500 text-xs">par an</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Plan mensuel */}
          <TouchableOpacity
            onPress={() => setSelectedPlan('monthly')}
            className={`
              p-4 rounded-xl border-2
              ${selectedPlan === 'monthly' 
                ? 'border-pink-500 bg-pink-50' 
                : 'border-gray-200 bg-white'}
            `}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className={`
                  w-5 h-5 rounded-full border-2 mr-3 items-center justify-center
                  ${selectedPlan === 'monthly' ? 'border-pink-500 bg-pink-500' : 'border-gray-300'}
                `}>
                  {selectedPlan === 'monthly' && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
                <Text className="font-semibold text-gray-800">Mensuel</Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-gray-800">
                  {PRICING.monthly.price}
                </Text>
                <Text className="text-gray-500 text-xs">par mois</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Message d'erreur */}
        {error && (
          <View className="mx-4 mb-4 p-3 bg-red-50 rounded-lg">
            <Text className="text-red-600 text-center text-sm">{error}</Text>
          </View>
        )}

        {/* Bouton d'achat */}
        <View className="px-4 pb-6">
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={isLoading}
            className={`
              py-4 rounded-xl items-center
              ${isLoading ? 'bg-gray-300' : 'bg-pink-500 active:bg-pink-600'}
            `}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                S'abonner maintenant
              </Text>
            )}
          </TouchableOpacity>

          {/* Infos légales */}
          <Text className="text-gray-400 text-xs text-center mt-3">
            Paiement via Google Play. Annulable à tout moment.{'\n'}
            L'abonnement se renouvelle automatiquement.
          </Text>

          {/* Lien restaurer achats */}
          <TouchableOpacity className="mt-3">
            <Text className="text-pink-500 text-sm text-center">
              Restaurer mes achats
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
};

export default PaywallModal;
