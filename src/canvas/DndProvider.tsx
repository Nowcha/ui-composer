/**
 * App-wide DndContext for the WYSIWYG canvas.
 *
 * Collision: pointerWithin filtered to exclude the dragged subtree, then
 * the smallest rect wins — with nested containers the innermost hovered
 * node is always the smallest hit. The exact drop slot (before/after/
 * inside) is resolved from the pointer position by drop-resolver and
 * mirrored into ui-store so CanvasNode can draw insertion lines live.
 */

import { useRef, type FC, type ReactNode } from "react";
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

export const DndProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 6px activation distance keeps plain clicks (select) working on canvas
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  /** pointerWithin, minus the dragged subtree, innermost (smallest) first. */
  const collisionDetection: CollisionDetection = (args) => {
    const collisions = pointerWithin(args);
    if (collisions.length === 0) return collisions;

    const activeId = String(args.active.id);
    const movingNodeId =
      parsePaletteDragId(activeId) || parseIconDragId(activeId)
        ? null
        : activeId;
    const tree = useSpecStore.getState().document.tree;

    const eligible = collisions.filter((collision) => {
      const overId = String(collision.id);
      if (overId === ROOT_DROP_ID) return true;
      if (!movingNodeId) return true;
      if (overId === movingNodeId) return false;
      // Exclude the dragged node's own subtree (can't drop into itself)
      const subtree = findNode(tree, movingNodeId);
      return !(subtree && findNode(subtree, overId));
    });

    return eligible.sort((a, b) => {
      if (String(a.id) === ROOT_DROP_ID) return 1;
      if (String(b.id) === ROOT_DROP_ID) return -1;
      const rectA = args.droppableRects.get(a.id);
      const rectB = args.droppableRects.get(b.id);
      const areaA = rectA ? rectA.width * rectA.height : Infinity;
      const areaB = rectB ? rectB.width * rectB.height : Infinity;
      return areaA - areaB;
    });
  };

  function handleDragStart(event: DragStartEvent): void {
    const activator = event.activatorEvent as Partial<PointerEvent>;
    pointerRef.current = {
      x: activator.clientX ?? 0,
      y: activator.clientY ?? 0,
    };
    useUiStore.getState().startDrag(payloadFromDragId(String(event.active.id)));
  }

  function handleDragMove(event: DragMoveEvent): void {
    const activator = event.activatorEvent as Partial<PointerEvent>;
    const pointer = {
      x: (activator.clientX ?? 0) + event.delta.x,
      y: (activator.clientY ?? 0) + event.delta.y,
    };
    pointerRef.current = pointer;

    const ui = useUiStore.getState();
    const over = event.over;
    if (!over) {
      ui.setDropIndicator(null);
      return;
    }
    const overId = String(over.id);
    if (overId === ROOT_DROP_ID) {
      ui.setDropIndicator({ nodeId: "root", position: "inside" });
      return;
    }
    const tree = useSpecStore.getState().document.tree;
    const parent = findParent(tree, overId);
    const overNode = findNode(tree, overId);
    ui.setDropIndicator(
      resolveIndicator({
        overNodeId: overId,
        overRect: over.rect,
        pointer,
        isContainer: isContainerType(overNode?.type ?? ""),
        axis: resolveAxis(
          parent?.type ?? "root",
          overNode ? getSpan(overNode) : 12,
        ),
      }),
    );
  }

  function handleDragEnd(event: DragEndEvent): void {
    const ui = useUiStore.getState();
    const indicator = ui.dropIndicator;
    const payload = ui.dragPayload;
    ui.endDrag();
    if (!indicator || !payload || !event.over) return;

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
