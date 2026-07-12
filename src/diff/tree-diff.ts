/**
 * Tree diff algorithm for SpecTree (Phase 2 core).
 * Pure functions: two trees in, structured diff out.
 *
 * Node ids are stable across edits (never regenerated), so diffing is
 * exact id-map matching — no heuristic tree matching needed.
 *
 * Granularity rule: only the TOPMOST added/removed node is reported;
 * its whole subtree is implied. Moves and prop changes are per-node.
 */

import type { ComponentNode } from "../types/spec";
import { ROOT_NODE_TYPE } from "../types/spec";

interface IndexedNode {
  node: ComponentNode;
  parentId: string;
  index: number;
}

export interface AddedEntry {
  node: ComponentNode;
  parentId: string;
  index: number;
}

export interface RemovedEntry {
  node: ComponentNode;
  parentId: string;
}

export interface MovedEntry {
  id: string;
  fromParentId: string;
  toParentId: string;
  fromIndex: number;
  toIndex: number;
}

/** Node fields whose change is reported (children handled structurally). */
export type ChangedField = "props" | "icon" | "behavior" | "frozen" | "type";

export interface ChangedEntry {
  id: string;
  before: ComponentNode;
  after: ComponentNode;
  fields: ChangedField[];
}

export interface TreeDiff {
  added: AddedEntry[];
  removed: RemovedEntry[];
  moved: MovedEntry[];
  changed: ChangedEntry[];
}

export function isEmptyDiff(diff: TreeDiff): boolean {
  return (
    diff.added.length === 0 &&
    diff.removed.length === 0 &&
    diff.moved.length === 0 &&
    diff.changed.length === 0
  );
}

function indexTree(
  node: ComponentNode,
  map = new Map<string, IndexedNode>(),
): Map<string, IndexedNode> {
  (node.children ?? []).forEach((child, index) => {
    map.set(child.id, { node: child, parentId: node.id, index });
    indexTree(child, map);
  });
  return map;
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function changedFields(
  before: ComponentNode,
  after: ComponentNode,
): ChangedField[] {
  const fields: ChangedField[] = [];
  if (before.type !== after.type) fields.push("type");
  if (!sameValue(before.props, after.props)) fields.push("props");
  if (!sameValue(before.icon, after.icon)) fields.push("icon");
  if ((before.behavior ?? "") !== (after.behavior ?? "")) {
    fields.push("behavior");
  }
  if ((before.frozen ?? false) !== (after.frozen ?? false)) {
    fields.push("frozen");
  }
  return fields;
}

/**
 * Computes the diff from `base` to `current`.
 * Both arguments must be full trees whose roots are the ROOT node
 * (the root itself is never part of the diff).
 */
export function diffTrees(
  base: ComponentNode,
  current: ComponentNode,
): TreeDiff {
  if (base.type !== ROOT_NODE_TYPE || current.type !== ROOT_NODE_TYPE) {
    throw new Error("diffTrees expects full trees starting at the root node");
  }

  const baseIndex = indexTree(base);
  const currentIndex = indexTree(current);
  const diff: TreeDiff = { added: [], removed: [], moved: [], changed: [] };

  // Added: in current but not in base — report only topmost new nodes
  for (const [id, entry] of currentIndex) {
    if (baseIndex.has(id)) continue;
    const parentIsNew =
      entry.parentId !== "root" && !baseIndex.has(entry.parentId);
    if (!parentIsNew) {
      diff.added.push({
        node: entry.node,
        parentId: entry.parentId,
        index: entry.index,
      });
    }
  }

  // Removed: in base but not in current — report only topmost removed nodes
  for (const [id, entry] of baseIndex) {
    if (currentIndex.has(id)) continue;
    const parentAlsoRemoved =
      entry.parentId !== "root" && !currentIndex.has(entry.parentId);
    if (!parentAlsoRemoved) {
      diff.removed.push({ node: entry.node, parentId: entry.parentId });
    }
  }

  // Surviving nodes: cross-parent moves and field changes
  const sameParentSurvivors = new Map<string, string[]>();
  for (const [id, after] of currentIndex) {
    const before = baseIndex.get(id);
    if (!before) continue;

    if (before.parentId !== after.parentId) {
      diff.moved.push({
        id,
        fromParentId: before.parentId,
        toParentId: after.parentId,
        fromIndex: before.index,
        toIndex: after.index,
      });
    } else {
      const list = sameParentSurvivors.get(after.parentId) ?? [];
      list.push(id);
      sameParentSurvivors.set(after.parentId, list);
    }

    const fields = changedFields(before.node, after.node);
    if (fields.length > 0) {
      diff.changed.push({
        id,
        before: before.node,
        after: after.node,
        fields,
      });
    }
  }

  // Same-parent reorders: compare relative order among survivors only,
  // so index shifts caused by pure additions/removals are NOT moves.
  for (const [, ids] of sameParentSurvivors) {
    const baseOrder = [...ids].sort(
      (a, b) => (baseIndex.get(a)?.index ?? 0) - (baseIndex.get(b)?.index ?? 0),
    );
    const currentOrder = [...ids].sort(
      (a, b) =>
        (currentIndex.get(a)?.index ?? 0) - (currentIndex.get(b)?.index ?? 0),
    );
    for (const id of ids) {
      if (baseOrder.indexOf(id) !== currentOrder.indexOf(id)) {
        const before = baseIndex.get(id);
        const after = currentIndex.get(id);
        if (!before || !after) continue;
        diff.moved.push({
          id,
          fromParentId: before.parentId,
          toParentId: after.parentId,
          fromIndex: before.index,
          toIndex: after.index,
        });
      }
    }
  }

  return diff;
}
