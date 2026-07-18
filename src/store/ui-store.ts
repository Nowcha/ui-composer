/**
 * Ephemeral UI state (never persisted, never in undo history).
 * Kept separate from spec-store so document state stays pure.
 */

import { create } from "zustand";
import type { PhosphorWeight } from "../types/spec";
import type { DropIndicator } from "../canvas/drop-resolver";

export type DeviceKind = "desktop" | "tablet" | "mobile";

export const DEVICE_WIDTHS: Record<DeviceKind, number> = {
  desktop: 1180,
  tablet: 768,
  mobile: 390,
};

export type LeftTab = "parts" | "icons" | "templates" | "layers";

/** What is currently being dragged (drives the DragOverlay preview). */
export type DragPayload =
  | { kind: "component"; componentId: string }
  | { kind: "icon"; name: string; weight: PhosphorWeight }
  | { kind: "node"; nodeId: string };

interface UiState {
  isDragging: boolean;
  /** True while a width-resize handle is being dragged. */
  isResizing: boolean;
  dragPayload: DragPayload | null;
  dropIndicator: DropIndicator | null;
  /** Innermost hovered canvas node (mouse), for hover outlines. */
  hoveredNodeId: string | null;
  device: DeviceKind;
  zoom: number;
  leftTab: LeftTab;

  startDrag: (payload: DragPayload) => void;
  endDrag: () => void;
  setResizing: (resizing: boolean) => void;
  setDropIndicator: (indicator: DropIndicator | null) => void;
  setHoveredNode: (id: string | null) => void;
  setDevice: (device: DeviceKind) => void;
  setZoom: (zoom: number) => void;
  setLeftTab: (tab: LeftTab) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  isDragging: false,
  isResizing: false,
  dragPayload: null,
  dropIndicator: null,
  hoveredNodeId: null,
  device: "desktop",
  zoom: 1,
  leftTab: "parts",

  startDrag: (payload) =>
    set({ isDragging: true, dragPayload: payload, hoveredNodeId: null }),

  endDrag: () =>
    set({ isDragging: false, dragPayload: null, dropIndicator: null }),

  setResizing: (isResizing) => set({ isResizing }),

  setDropIndicator: (indicator) => {
    const current = get().dropIndicator;
    if (
      current?.nodeId === indicator?.nodeId &&
      current?.position === indicator?.position
    ) {
      return; // avoid re-render storms during drag move
    }
    set({ dropIndicator: indicator });
  },

  setHoveredNode: (id) => {
    if (get().hoveredNodeId !== id) set({ hoveredNodeId: id });
  },

  setDevice: (device) => set({ device }),
  setZoom: (zoom) => set({ zoom: Math.min(1.5, Math.max(0.5, zoom)) }),
  setLeftTab: (leftTab) => set({ leftTab }),
}));
