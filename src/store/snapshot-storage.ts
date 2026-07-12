/**
 * Snapshot payload storage.
 * SnapshotRef (id/label/createdAt) lives in the document; the tree
 * payload is stored separately in localStorage, lz-string compressed
 * (5MB quota — compression keeps dozens of snapshots practical).
 */

import { compressToUTF16, decompressFromUTF16 } from "lz-string";
import type { ComponentNode } from "../types/spec";

const PREFIX = "ui-composer:snapshot:";

function storageKey(id: string): string {
  return `${PREFIX}${id}`;
}

export function saveSnapshotPayload(id: string, tree: ComponentNode): boolean {
  try {
    window.localStorage.setItem(
      storageKey(id),
      compressToUTF16(JSON.stringify(tree)),
    );
    return true;
  } catch (err) {
    console.error("failed to save snapshot payload", err);
    return false;
  }
}

export function loadSnapshotPayload(id: string): ComponentNode | null {
  try {
    const compressed = window.localStorage.getItem(storageKey(id));
    if (!compressed) return null;
    const json = decompressFromUTF16(compressed);
    if (!json) return null;
    const tree: unknown = JSON.parse(json);
    if (
      typeof tree !== "object" ||
      tree === null ||
      typeof (tree as ComponentNode).id !== "string"
    ) {
      return null;
    }
    return tree as ComponentNode;
  } catch (err) {
    console.error("failed to load snapshot payload", err);
    return null;
  }
}

export function deleteSnapshotPayload(id: string): void {
  try {
    window.localStorage.removeItem(storageKey(id));
  } catch {
    // ignore — storage unavailable means nothing to delete
  }
}
