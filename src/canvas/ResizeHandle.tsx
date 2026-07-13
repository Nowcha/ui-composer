/**
 * ResizeHandle — Kintone-style width resize for grid cells.
 *
 * Dragging the right edge converts pointer movement into column spans
 * (unit = current width / current span), so widths always snap to the
 * 12-column grid. The live span is previewed by the parent CanvasNode
 * and committed to props.colSpan as a single undo entry on release.
 */

import { useRef, type FC, type PointerEvent as ReactPointerEvent } from "react";
import type { ComponentNode } from "../types/spec";
import { useSpecStore } from "../store/spec-store";
import { useUiStore } from "../store/ui-store";
import { GRID_COLUMNS, getSpan } from "./layout";

interface ResizeHandleProps {
  node: ComponentNode;
  liveSpan: number | null;
  onLiveSpanChange: (span: number | null) => void;
}

export const ResizeHandle: FC<ResizeHandleProps> = ({
  node,
  liveSpan,
  onLiveSpanChange,
}) => {
  const updateNodeById = useSpecStore((s) => s.updateNodeById);
  const setResizing = useUiStore((s) => s.setResizing);
  const dragState = useRef<{ startX: number; startSpan: number; unit: number }>();

  function handlePointerDown(e: ReactPointerEvent<HTMLButtonElement>): void {
    // Keep dnd-kit's drag sensor on the wrapper from activating.
    e.stopPropagation();
    e.preventDefault();
    const wrapper = e.currentTarget.parentElement;
    if (!wrapper) return;
    const startSpan = getSpan(node);
    const rect = wrapper.getBoundingClientRect();
    dragState.current = {
      startX: e.clientX,
      startSpan,
      unit: rect.width / startSpan,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic/stale pointer ids can't be captured — resize still works,
      // it just loses tracking if the pointer leaves the handle.
    }
    setResizing(true);
    onLiveSpanChange(startSpan);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLButtonElement>): void {
    const state = dragState.current;
    if (!state) return;
    const deltaSpans = Math.round((e.clientX - state.startX) / state.unit);
    const next = Math.min(
      GRID_COLUMNS,
      Math.max(1, state.startSpan + deltaSpans),
    );
    if (next !== liveSpan) onLiveSpanChange(next);
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLButtonElement>): void {
    const state = dragState.current;
    dragState.current = undefined;
    setResizing(false);
    if (!state) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Pointer was never captured (see handlePointerDown) — safe to ignore.
    }
    const finalSpan = liveSpan ?? state.startSpan;
    onLiveSpanChange(null);
    if (finalSpan === state.startSpan) return;
    // Full width is the default — keep props minimal by dropping colSpan.
    const nextProps: Record<string, unknown> = { ...node.props };
    if (finalSpan === GRID_COLUMNS) delete nextProps.colSpan;
    else nextProps.colSpan = finalSpan;
    updateNodeById(node.id, { props: nextProps });
  }

  const shownSpan = liveSpan ?? getSpan(node);

  return (
    <button
      type="button"
      aria-label={`幅を変更(現在 ${shownSpan}/${GRID_COLUMNS})`}
      title="ドラッグで幅を変更"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => e.stopPropagation()}
      className="pointer-events-auto absolute -right-1.5 top-1/2 z-40 flex h-8 w-3 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-blue-500 bg-white shadow-sm hover:bg-blue-50"
    >
      <span className="h-3.5 w-0.5 rounded-full bg-blue-500" aria-hidden />
      {liveSpan !== null && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white shadow">
          {shownSpan} / {GRID_COLUMNS}
        </span>
      )}
    </button>
  );
};
