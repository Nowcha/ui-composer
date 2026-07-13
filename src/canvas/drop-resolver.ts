/**
 * Pure drop-position resolution for the WYSIWYG canvas.
 *
 * While dragging, the pointer position within the hovered node's rect
 * decides the drop: edge bands insert before/after the node, the middle
 * band of a container nests inside it (Webflow/Framer-style). These
 * functions are pure so the geometry logic is unit-testable.
 */

import type { ComponentNode } from "../types/spec";
import { findParent, findNode, isDescendant } from "../store/tree-utils";

export type DropPosition = "before" | "after" | "inside";

export interface DropIndicator {
  nodeId: string;
  position: DropPosition;
}

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Containers whose children flow horizontally (insert lines go vertical). */
const HORIZONTAL_FLOW_TYPES = new Set([
  "toolbar",
  "grid",
  "columns",
  "header",
]);

export function isHorizontalFlow(parentType: string): boolean {
  return HORIZONTAL_FLOW_TYPES.has(parentType);
}

/** Fraction of the rect treated as the before/after edge for containers. */
const CONTAINER_EDGE_RATIO = 0.28;

/**
 * Maps a pointer position over a node to a drop indicator.
 * Containers get a middle "inside" band; leaves split at the midline.
 */
export function resolveIndicator(args: {
  overNodeId: string;
  overRect: Rect;
  pointer: Point;
  isContainer: boolean;
  parentType: string;
}): DropIndicator {
  const { overNodeId, overRect, pointer, isContainer, parentType } = args;
  const alongX = isHorizontalFlow(parentType);
  const size = alongX ? overRect.width : overRect.height;
  const offset = alongX ? pointer.x - overRect.left : pointer.y - overRect.top;
  const ratio = size > 0 ? offset / size : 0.5;

  if (isContainer) {
    if (ratio < CONTAINER_EDGE_RATIO) {
      return { nodeId: overNodeId, position: "before" };
    }
    if (ratio > 1 - CONTAINER_EDGE_RATIO) {
      return { nodeId: overNodeId, position: "after" };
    }
    return { nodeId: overNodeId, position: "inside" };
  }
  return {
    nodeId: overNodeId,
    position: ratio < 0.5 ? "before" : "after",
  };
}

export interface Insertion {
  parentId: string;
  index: number;
}

/** Translates an indicator into a concrete (parentId, index) insertion. */
export function indicatorToInsertion(
  tree: ComponentNode,
  indicator: DropIndicator,
): Insertion | null {
  if (indicator.position === "inside") {
    const target = findNode(tree, indicator.nodeId);
    if (!target) return null;
    return { parentId: indicator.nodeId, index: (target.children ?? []).length };
  }
  const parent = findParent(tree, indicator.nodeId);
  if (!parent) return null;
  const siblings = parent.children ?? [];
  const at = siblings.findIndex((c) => c.id === indicator.nodeId);
  if (at < 0) return null;
  return {
    parentId: parent.id,
    index: indicator.position === "before" ? at : at + 1,
  };
}

/**
 * Adjusts an insertion for moving an existing node: moveNode removes the
 * node first, so an in-same-parent move past its old slot shifts by one.
 * Returns null when the move is a no-op or would nest a node in itself.
 */
export function adjustInsertionForMove(
  tree: ComponentNode,
  movingNodeId: string,
  insertion: Insertion,
): Insertion | null {
  if (isDescendant(tree, movingNodeId, insertion.parentId)) return null;
  const currentParent = findParent(tree, movingNodeId);
  if (!currentParent || currentParent.id !== insertion.parentId) {
    return insertion;
  }
  const siblings = currentParent.children ?? [];
  const currentIndex = siblings.findIndex((c) => c.id === movingNodeId);
  if (currentIndex < 0) return insertion;
  // Same position (before itself or right after itself) — no-op.
  if (insertion.index === currentIndex || insertion.index === currentIndex + 1) {
    return null;
  }
  return insertion.index > currentIndex
    ? { ...insertion, index: insertion.index - 1 }
    : insertion;
}
