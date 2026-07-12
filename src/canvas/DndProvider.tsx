import { useState, type FC, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { createNodeId, useSpecStore } from "../store/spec-store";
import { useUiStore } from "../store/ui-store";
import { findParent } from "../store/tree-utils";
import {
  buildDefaultProps,
  getCatalogComponent,
} from "../catalog/catalog-data";
import { nodeLabel } from "../catalog/catalog-data";
import { findNode } from "../store/tree-utils";
import { parseIntoDropId, parsePaletteDragId } from "./dnd-ids";

/**
 * App-wide DndContext.
 * Collision detection is pointerWithin (NOT closestCenter) — with nested
 * containers, center-distance heuristics misattribute drops to parents.
 */
export const DndProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [overlayLabel, setOverlayLabel] = useState<string | null>(null);
  const setDragging = useUiStore((s) => s.setDragging);

  // 5px activation distance keeps plain clicks (select / click-to-add) working
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragStart(event: DragStartEvent): void {
    setDragging(true);
    const activeId = String(event.active.id);
    const paletteComponentId = parsePaletteDragId(activeId);
    if (paletteComponentId) {
      const def = getCatalogComponent(paletteComponentId);
      setOverlayLabel(def?.nameJa ?? paletteComponentId);
      return;
    }
    const node = findNode(
      useSpecStore.getState().document.tree,
      activeId,
    );
    setOverlayLabel(node ? nodeLabel(node) : null);
  }

  function handleDragEnd(event: DragEndEvent): void {
    setDragging(false);
    setOverlayLabel(null);

    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const state = useSpecStore.getState();
    const tree = state.document.tree;

    // Resolve drop target: container zone appends, node row inserts at its index
    let parentId: string;
    let index: number | undefined;
    const intoNodeId = parseIntoDropId(overId);
    if (intoNodeId) {
      parentId = intoNodeId;
      index = undefined;
    } else {
      const parent = findParent(tree, overId);
      if (!parent) return;
      parentId = parent.id;
      index = (parent.children ?? []).findIndex((c) => c.id === overId);
    }

    const paletteComponentId = parsePaletteDragId(activeId);
    if (paletteComponentId) {
      const def = getCatalogComponent(paletteComponentId);
      if (!def) return;
      state.addNode(
        parentId,
        {
          id: createNodeId(def.id),
          type: def.id,
          props: buildDefaultProps(def),
          ...(def.isContainer ? { children: [] } : {}),
        },
        index,
      );
      return;
    }

    // moveNode rejects cycles (dropping a container into its own subtree)
    state.moveNodeById(activeId, parentId, index);
  }

  function handleDragCancel(): void {
    setDragging(false);
    setOverlayLabel(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {overlayLabel && (
          <div className="pointer-events-none rounded-md border border-blue-400 bg-blue-50 px-3 py-1.5 text-sm text-blue-900 shadow-lg">
            {overlayLabel}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
