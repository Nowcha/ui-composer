/**
 * 12-column grid layout helpers (Kintone-style form designer model).
 *
 * Grid-flow containers lay children on a 12-column grid; each child
 * declares its width as `props.colSpan` (1–12, absent = full width).
 * Rows wrap automatically, so layouts stay free yet always aligned.
 */

import type { ComponentNode } from "../types/spec";
import { isHorizontalFlow } from "./drop-resolver";

export const GRID_COLUMNS = 12;

/** Containers whose children area is a 12-column grid. */
const GRID_FLOW_TYPES = new Set([
  "root",
  "card",
  "form",
  "section",
  "modal",
  "tabs",
]);

export function isGridFlow(containerType: string): boolean {
  return GRID_FLOW_TYPES.has(containerType);
}

/** Effective column span of a node (clamped, defaulting to full width). */
export function getSpan(node: Pick<ComponentNode, "props">): number {
  const raw = node.props.colSpan;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return GRID_COLUMNS;
  return Math.min(GRID_COLUMNS, Math.max(1, Math.round(raw)));
}

/** Inline style pinning a canvas node to its span inside a grid slot. */
export function spanGridStyle(span: number): { gridColumn: string } {
  return { gridColumn: `span ${span} / span ${span}` };
}

/**
 * Axis for before/after insertion lines relative to the hovered node.
 * Horizontal-flow containers and partial-width grid cells read along x
 * (side-by-side); full-width rows read along y (stacked).
 */
export function resolveAxis(
  parentType: string,
  overNodeSpan: number,
): "x" | "y" {
  if (isHorizontalFlow(parentType)) return "x";
  if (isGridFlow(parentType) && overNodeSpan < GRID_COLUMNS) return "x";
  return "y";
}

/** True when any node in the tree declares a colSpan (for prompt note). */
export function treeUsesGrid(node: ComponentNode): boolean {
  if (typeof node.props?.colSpan === "number") return true;
  return (node.children ?? []).some((child) => treeUsesGrid(child));
}
