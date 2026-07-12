/**
 * Encoding rules for dnd-kit draggable/droppable ids.
 *
 * - Tree nodes use their node id as-is (sortable items).
 * - Palette items are prefixed "palette:" (new component drops).
 * - Container drop zones are prefixed "into:" (nest into container).
 */

const PALETTE_PREFIX = "palette:";
const INTO_PREFIX = "into:";

export function paletteDragId(componentId: string): string {
  return `${PALETTE_PREFIX}${componentId}`;
}

export function intoDropId(nodeId: string): string {
  return `${INTO_PREFIX}${nodeId}`;
}

export function parsePaletteDragId(id: string): string | null {
  return id.startsWith(PALETTE_PREFIX) ? id.slice(PALETTE_PREFIX.length) : null;
}

export function parseIntoDropId(id: string): string | null {
  return id.startsWith(INTO_PREFIX) ? id.slice(INTO_PREFIX.length) : null;
}
