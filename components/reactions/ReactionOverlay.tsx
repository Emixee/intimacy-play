/**
 * ReactionOverlay - Overlay pour afficher les animations de réactions
 * 
 * Gère l'affichage et le cycle de vie des animations de réaction
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { ReactionAnimation, ReactionBurst } from './ReactionAnimation';
import type { Reaction } from '../../types';

interface ActiveReaction {
  id: string;
  reaction: Reaction;
  type: 'single' | 'burst';
  timestamp: number;
}

interface ReactionOverlayProps {
  /** Ref pour permettre le déclenchement depuis l'extérieur */
  children?: React.ReactNode;
}

interface ReactionOverlayRef {
  triggerReaction: (reaction: Reaction, burst?: boolean) => void;
}

export const useReactionOverlay = () => {
  const [reactions, setReactions] = useState<ActiveReaction[]>([]);

  const triggerReaction = useCallback((reaction: Reaction, burst = false) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newReaction: ActiveReaction = {
      id,
      reaction,
      type: burst ? 'burst' : 'single',
      timestamp: Date.now(),
    };

    setReactions((prev) => [...prev, newReaction]);
  }, []);

  const removeReaction = useCallback((id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return {
    reactions,
    triggerReaction,
    removeReaction,
  };
};

interface ReactionOverlayProviderProps {
  reactions: ActiveReaction[];
  onReactionComplete: (id: string) => void;
}

export const ReactionOverlay: React.FC<ReactionOverlayProviderProps> = ({
  reactions,
  onReactionComplete,
}) => {
  if (reactions.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {reactions.map((activeReaction) => {
        if (activeReaction.type === 'burst') {
          return (
            <ReactionBurst
              key={activeReaction.id}
              reaction={activeReaction.reaction}
              count={5}
              onComplete={() => onReactionComplete(activeReaction.id)}
            />
          );
        }

        return (
          <ReactionAnimation
            key={activeReaction.id}
            id={activeReaction.id}
            reaction={activeReaction.reaction}
            size="large"
            onComplete={() => onReactionComplete(activeReaction.id)}
          />
        );
      })}
    </View>
  );
};

/**
 * Provider de contexte pour les réactions globales
 */
import { createContext, useContext } from 'react';

interface ReactionContextType {
  triggerReaction: (reaction: Reaction, burst?: boolean) => void;
}

const ReactionContext = createContext<ReactionContextType | null>(null);

export const ReactionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { reactions, triggerReaction, removeReaction } = useReactionOverlay();

  return (
    <ReactionContext.Provider value={{ triggerReaction }}>
      {children}
      <ReactionOverlay reactions={reactions} onReactionComplete={removeReaction} />
    </ReactionContext.Provider>
  );
};

export const useReactions = () => {
  const context = useContext(ReactionContext);
  if (!context) {
    throw new Error('useReactions must be used within a ReactionProvider');
  }
  return context;
};

export default ReactionOverlay;
