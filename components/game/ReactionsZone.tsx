/**
 * ReactionsZone - Zone de réactions rapides
 */

import React, { memo, useState, useCallback } from "react";
import { View, Modal, Pressable } from "react-native";
import { ReactionPicker, QuickReactionsBar, ReactionOverlay, useReactionOverlay } from "../reactions";
import { useSessionReactions } from "../../hooks/useReactions";
import type { Reaction } from "../../types";

interface ReactionsZoneProps {
  sessionCode: string;
  userId: string;
  isPremium: boolean;
  onShowPaywall?: () => void;
}

export const ReactionsZone = memo<ReactionsZoneProps>(({ sessionCode, userId, isPremium, onShowPaywall }) => {
  const [showPicker, setShowPicker] = useState(false);
  const { reactions, triggerReaction, removeReaction } = useReactionOverlay();

  const { sendReaction } = useSessionReactions({
    sessionCode,
    userId,
    isPremium,
    onPartnerReaction: (reaction) => triggerReaction(reaction.emoji, true),
  });

  const handleSelectReaction = useCallback(async (emoji: Reaction) => {
    triggerReaction(emoji);
    await sendReaction(emoji);
    setShowPicker(false);
  }, [triggerReaction, sendReaction]);

  const handleOpenPicker = useCallback(() => setShowPicker(true), []);
  const handleClosePicker = useCallback(() => setShowPicker(false), []);

  return (
    <>
      <ReactionOverlay reactions={reactions} onReactionComplete={removeReaction} />

      <View className="bg-white border-t border-gray-100 px-4 py-2">
        <View className="flex-row items-center justify-between">
          <QuickReactionsBar onSelect={handleSelectReaction} isPremium={isPremium} onShowMore={handleOpenPicker} />
        </View>
      </View>

      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={handleClosePicker}>
        <Pressable className="flex-1 bg-black/50 justify-center items-center" onPress={handleClosePicker}>
          <View className="mx-4">
            <ReactionPicker onSelect={handleSelectReaction} isPremium={isPremium} onShowPaywall={onShowPaywall} onClose={handleClosePicker} />
          </View>
        </Pressable>
      </Modal>
    </>
  );
});

ReactionsZone.displayName = "ReactionsZone";
export default ReactionsZone;
