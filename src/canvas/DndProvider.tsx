/**
 * App-wide DndContext for the WYSIWYG canvas.
 *
 * Collision: pointerWithin filtered to exclude the dragged subtree, then
 * the smallest rect wins — with nested containers the innermost hovered
 * node is always the smallest hit. The exact drop slot (before/after/
 * inside) is resolved from the pointer position by drop-resolver and
 * mirrored into ui-store so CanvasNode can draw insertion lines live.
 */

import type { FC, ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { createNodeId, useSpecStore } from "../store/spec-store";
import { useUiStore, type DragPayload } from "../store/ui-store";
import { findNode, findParent } from "../store/tree-utils";
import {
  buildDefaultProps,
  getCatalogComponent,
  isContainerType,
} from "../catalog/catalog-data";
import type { ComponentNode } from "../types/spec";
import {
  adjustInsertionForMove,
  indicatorToInsertion,
  nearestRectId,
  resolveIndicator,
  type Insertion,
} from "./drop-resolver";
import { getSpan, resolveAxis } from "./layout";
import {
  ROOT_DROP_ID,
  parseIconDragId,
  parsePaletteDragId,
} from "./dnd-ids";
import { DragPreview } from "./DragPreview";

function payloadFromDragId(id: string): DragPayload {
  const componentId = parsePaletteDragId(id);
  if (componentId) return { kind: "component", componentId };
  const icon = parseIconDragId(id);
  if (icon) return { kind: "icon", name: icon.name, weight: icon.weight };
  return { kind: "node", nodeId: id };
}

/** Builds the ComponentNode a palette/icon drop should insert. */
export function buildDropNode(payload: DragPayload): ComponentNode | null {
  if (payload.kind === "component") {
    const def = getCatalogComponent(payload.componentId);
    if (!def) return null;
    return {
      id: createNodeId(def.id),
      type: def.id,
      props: buildDefaultProps(def),
      ...(def.isContainer ? { children: [] } : {}),
    };
  }
  if (payload.kind === "icon") {
    const def = getCatalogComponent("icon");
    return {
      id: createNodeId("icon"),
      type: "icon",
      props: def ? buildDefaultProps(def) : {},
      icon: { name: payload.name, weight: payload.weight },
    };
  }
  return null;
}

/**
 * Resolves the drop indicator for a hovered droppable at a pointer position.
 * Shared by drag-move (live insertion line) and drag-end: dnd-kit's `over`
 * in onDragMove lags one event behind the pointer, so drag-end must
 * recompute from its own (fresh) `event.over` instead of trusting the
 * last indicator mirrored into ui-store.
 */
function indicatorFor(
  overId: string,
  overRect: { top: number; left: number; width: number; height: number },
  pointer: { x: number; y: number },
): ReturnType<typeof resolveIndicator> {
  if (overId === ROOT_DROP_ID) {
    return { nodeId: "root", position: "inside" };
  }
  const tree = useSpecStore.getState().document.tree;
  const parent = findParent(tree, overId);
  const overNode = findNode(tree, overId);
  return resolveIndicator({
    overNodeId: overId,
    overRect,
    pointer,
    isContainer: isContainerType(overNode?.type ?? ""),
    axis: resolveAxis(
      parent?.type ?? "root",
      overNode ? getSpan(overNode) : 12,
    ),
  });
}

export const DndProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // 6px activation distance keeps plain clicks (select) working on canvas
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  /**
   * pointerWithin, minus the dragged subtree, innermost (smallest) first.
   * When the pointer only hits the artboard (grid gaps, padding), it
   * snaps to the nearest cell within GAP_SNAP_TOLERANCE so releases
   * between two cells insert between them instead of appending at the end.
   */
  const collisionDetection: CollisionDetection = (args) => {
    const activeId = String(args.active.id);
    const movingNodeId =
      parsePaletteDragId(activeId) || parseIconDragId(activeId)
        ? null
        : activeId;
    const tree = useSpecStore.getState().document.tree;

    // Excludes the dragged node and its own subtree (can't drop into itself)
    const isEligible = (overId: string): boolean => {
      if (!movingNodeId) return true;
      if (overId === movingNodeId) return false;
      const subtree = findNode(tree, movingNodeId);
      return !(subtree && findNode(subtree, overId));
    };

    const eligible = pointerWithin(args).filter((collision) => {
      const overId = String(collision.id);
      return overId === ROOT_DROP_ID || isEligible(overId);
    });

    const sorted = eligible.sort((a, b) => {
      if (String(a.id) === ROOT_DROP_ID) return 1;
      if (String(b.id) === ROOT_DROP_ID) return -1;
      const rectA = args.droppableRects.get(a.id);
      const rectB = args.droppableRects.get(b.id);
      const areaA = rectA ? rectA.width * rectA.height : Infinity;
      const areaB = rectB ? rectB.width * rectB.height : Infinity;
      return areaA - areaB;
    });

    const hitsOnlyRoot =
      sorted.length === 0 || String(sorted[0]?.id) === ROOT_DROP_ID;
    if (hitsOnlyRoot && args.pointerCoordinates) {
      const entries = [];
      for (const [id, rect] of args.droppableRects) {
        const idStr = String(id);
        if (idStr === ROOT_DROP_ID || !isEligible(idStr)) continue;
        entries.push({ id: idStr, rect });
      }
      const snapped = nearestRectId(args.pointerCoordinates, entries);
      if (snapped) return [{ id: snapped }, ...sorted];
    }
    return sorted;
  };

  function handleDragStart(event: DragStartEvent): void {
    useUiStore.getState().startDrag(payloadFromDragId(String(event.active.id)));
  }

  function handleDragMove(event: DragMoveEvent): void {
    const activator = event.activatorEvent as Partial<PointerEvent>;
    const pointer = {
      x: (activator.clientX ?? 0) + event.delta.x,
      y: (activator.clientY ?? 0) + event.delta.y,
    };
    const ui = useUiStore.getState();
    const over = event.over;
    if (!over) {
      ui.setDropIndicator(null);
      return;
    }
    ui.setDropIndicator(indicatorFor(String(over.id), over.rect, pointer));
  }

  function handleDragEnd(event: DragEndEvent): void {
    const ui = useUiStore.getState();
    const payload = ui.dragPayload;
    ui.endDrag();
    if (!payload || !event.over) return;

    // Recompute from the fresh drag-end `over` + release position; the
    // indicator mirrored during drag-move lags one pointer event behind.
    const activator = event.activatorEvent as Partial<PointerEvent>;
    const pointer = {
      x: (activator.clientX ?? 0) + event.delta.x,
      y: (activator.clientY ?? 0) + event.delta.y,
    };
    const indicator = event.over.rect
      ? indicatorFor(String(event.over.id), event.over.rect, pointer)
      : ui.dropIndicator;
    if (!indicator) return;

    const state = useSpecStore.getState();
    const insertion: Insertion | null = indicatorToInsertion(
      state.document.tree,
      indicator,
    );
    if (!insertion) return;

    if (payload.kind === "node") {
      const adjusted = adjustInsertionForMove(
        state.document.tree,
        payload.nodeId,
        insertion,
      );
      if (!adjusted) return;
      state.moveNodeById(payload.nodeId, adjusted.parentId, adjusted.index);
      return;
    }

    const node = buildDropNode(payload);
    if (node) state.addNode(insertion.parentId, node, insertion.index);
  }

  function handleDragCancel(): void {
    useUiStore.getState().endDrag();
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        <DragPreview />
      </DragOverlay>
    </DndContext>
  );
};
