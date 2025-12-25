/**
 * ActionButtons - Boutons d'action du jeu
 */

import React, { memo, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../ui";
import { MAX_CHALLENGE_CHANGES, MAX_BONUS_CHANGES } from "../../types";

interface ActionButtonsProps {
  isChallengeForMe: boolean;
  isMyTurn: boolean;
  isLoading: boolean;
  changesRemaining: number;
  bonusUsed: number;
  isPremium: boolean;
  canRequestPartner: boolean;
  hasPendingRequest: boolean;
  isForMeToCreate: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onWatchAd: () => void;
  onRequestPartner: () => void;
  onCreatePartnerChallenge: () => void;
}

export const ActionButtons = memo<ActionButtonsProps>(({
  isChallengeForMe,
  isMyTurn,
  isLoading,
  changesRemaining,
  bonusUsed,
  isPremium,
  canRequestPartner,
  hasPendingRequest,
  isForMeToCreate,
  onComplete,
  onSkip,
  onWatchAd,
  onRequestPartner,
  onCreatePartnerChallenge,
}) => {
  const canValidate = useMemo(() => isMyTurn && !isChallengeForMe, [isMyTurn, isChallengeForMe]);
  const canChange = useMemo(() => isChallengeForMe && (isPremium || changesRemaining > 0) && !hasPendingRequest, [isChallengeForMe, isPremium, changesRemaining, hasPendingRequest]);
  const canWatchAdForBonus = useMemo(() => !isPremium && bonusUsed < MAX_BONUS_CHANGES, [isPremium, bonusUsed]);
  const totalChanges = useMemo(() => MAX_CHALLENGE_CHANGES + bonusUsed, [bonusUsed]);

  return (
    <View className="gap-3">
      {isForMeToCreate && (
        <Button
          title="✨ Créer le défi personnalisé"
          variant="primary"
          size="lg"
          fullWidth
          onPress={onCreatePartnerChallenge}
          icon={<Text className="text-white mr-2">👑</Text>}
        />
      )}

      {!isForMeToCreate && (
        <Button
          title={isChallengeForMe ? "En attente de validation..." : "Défi accompli ✓"}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canValidate || isLoading}
          loading={isLoading}
          onPress={onComplete}
        />
      )}

      {isChallengeForMe && !hasPendingRequest && (
        <>
          <Button
            title={isPremium ? "Changer de défi ∞" : `Changer de défi (${changesRemaining}/${totalChanges})`}
            variant="outline"
            size="md"
            fullWidth
            disabled={!canChange || isLoading}
            onPress={onSkip}
            icon={<Ionicons name="shuffle-outline" size={20} color={canChange ? "#EC4899" : "#9CA3AF"} />}
          />

          {!isPremium && changesRemaining === 0 && canWatchAdForBonus && (
            <Pressable onPress={onWatchAd} className="flex-row items-center justify-center bg-amber-50 py-3 rounded-xl border border-amber-200 active:bg-amber-100">
              <Ionicons name="play-circle" size={20} color="#F59E0B" />
              <Text className="text-amber-700 font-medium ml-2">Regarder une pub pour +1 changement ({bonusUsed}/{MAX_BONUS_CHANGES})</Text>
            </Pressable>
          )}
        </>
      )}

      {canRequestPartner && isChallengeForMe && !hasPendingRequest && (
        <Pressable onPress={onRequestPartner} className="flex-row items-center justify-center bg-purple-50 py-3 rounded-xl border border-purple-200 active:bg-purple-100">
          <Text className="text-xl mr-2">👑</Text>
          <Text className="text-purple-700 font-medium">Demander un défi personnalisé</Text>
        </Pressable>
      )}
    </View>
  );
});

ActionButtons.displayName = "ActionButtons";
export default ActionButtons;
