/**
 * Store Zustand pour la gestion du jeu
 */

import { create } from "zustand";
import { Session, IntensityLevel } from "../types";
import { DEFAULT_CHALLENGE_COUNT, DEFAULT_INTENSITY } from "../utils/constants";

// ============================================================
// INTERFACE DU STORE
// ============================================================

interface GameState {
  currentSession: Session | null;
  sessionCode: string | null;
  challengeCount: number;
  startIntensity: IntensityLevel;
  isCreator: boolean;
  isGameActive: boolean;
  
  setCurrentSession: (session: Session | null) => void;
  setSessionCode: (code: string | null) => void;
  setChallengeCount: (count: number) => void;
  setStartIntensity: (intensity: IntensityLevel) => void;
  resetConfiguration: () => void;
  setIsCreator: (isCreator: boolean) => void;
  setIsGameActive: (isActive: boolean) => void;
  clearGame: () => void;
}

// ============================================================
// CRÉATION DU STORE
// ============================================================

export const useGameStore = create<GameState>((set) => ({
  currentSession: null,
  sessionCode: null,
  challengeCount: DEFAULT_CHALLENGE_COUNT,
  startIntensity: DEFAULT_INTENSITY as IntensityLevel,
  isCreator: false,
  isGameActive: false,
  
  setCurrentSession: (session) => set({ currentSession: session }),
  setSessionCode: (code) => set({ sessionCode: code }),
  setChallengeCount: (count) => set({ challengeCount: count }),
  setStartIntensity: (intensity) => set({ startIntensity: intensity }),
  resetConfiguration: () =>
    set({
      challengeCount: DEFAULT_CHALLENGE_COUNT,
      startIntensity: DEFAULT_INTENSITY as IntensityLevel,
    }),
  setIsCreator: (isCreator) => set({ isCreator }),
  setIsGameActive: (isActive) => set({ isGameActive: isActive }),
  clearGame: () =>
    set({
      currentSession: null,
      sessionCode: null,
      isCreator: false,
      isGameActive: false,
    }),
}));

// ============================================================
// SELECTORS
// ============================================================

export const selectCurrentSession = (state: GameState) => state.currentSession;
export const selectSessionCode = (state: GameState) => state.sessionCode;
export const selectChallengeCount = (state: GameState) => state.challengeCount;
export const selectStartIntensity = (state: GameState) => state.startIntensity;
export const selectIsCreator = (state: GameState) => state.isCreator;
export const selectIsGameActive = (state: GameState) => state.isGameActive;

export const selectCurrentChallenge = (state: GameState) => {
  const session = state.currentSession;
  if (!session) return null;
  return session.challenges[session.currentChallengeIndex] || null;
};

export const selectProgress = (state: GameState) => {
  const session = state.currentSession;
  if (!session) return 0;
  return (session.currentChallengeIndex / session.challengeCount) * 100;
};

export const selectIsMyTurn = (userId: string) => (state: GameState) => {
  const session = state.currentSession;
  if (!session) return false;
  
  if (session.currentPlayer === "creator") {
    return session.creatorId === userId;
  }
  return session.partnerId === userId;
};