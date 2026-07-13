/**
 * Encoding rules for dnd-kit draggable/droppable ids.
 *
 * - Canvas nodes use their node id as-is (draggable AND droppable).
 * - Palette items are prefixed "palette:" (new component drops).
 * - Icon catalog entries are prefixed "iconpal:" (drops an icon node).
 * - The artboard root drop area is "into:root".
 */

import type { PhosphorWeight } from "../types/spec";

const PALETTE_PREFIX = "palette:";
const ICON_PREFIX = "iconpal:";
const INTO_PREFIX = "into:";

export const ROOT_DROP_ID = `${INTO_PREFIX}root`;

export function paletteDragId(componentId: string): string {
  return `${PALETTE_PREFIX}${componentId}`;
}

export function parsePaletteDragId(id: string): string | null {
  return id.startsWith(PALETTE_PREFIX) ? id.slice(PALETTE_PREFIX.length) : null;
}

export function iconDragId(name: string, weight: PhosphorWeight): string {
  return `${ICON_PREFIX}${weight}|${name}`;
}

export function parseIconDragId(
  id: string,
): { name: string; weight: PhosphorWeight } | null {
  if (!id.startsWith(ICON_PREFIX)) return null;
  const rest = id.slice(ICON_PREFIX.length);
  const sep = rest.indexOf("|");
  if (sep < 0) return null;
  return {
    weight: rest.slice(0, sep) as PhosphorWeight,
    name: rest.slice(sep + 1),
  };
}
