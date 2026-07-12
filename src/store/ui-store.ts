/**
 * Ephemeral UI state (never persisted, never in undo history).
 * Kept separate from spec-store so document state stays pure.
 */

import { create } from "zustand";

interface UiState {
  /** True while a drag operation is in progress (shows drop zones). */
  isDragging: boolean;
  setDragging: (dragging: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isDragging: false,
  setDragging: (dragging) => set({ isDragging: dragging }),
}));
