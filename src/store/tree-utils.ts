/**
 * Pure tree-manipulation functions for SpecTree.
 * Every function returns a new tree — the input is never mutated.
 * The Zustand store composes these; keeping them pure makes undo/redo
 * (structural snapshots) and unit testing trivial.
 */

import type { ComponentNode } from "../types/spec";

export function findNode(
  node: ComponentNode,
  id: string,
): ComponentNode | undefined {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return undefined;
}

export function findParent(
  node: ComponentNode,
  childId: string,
): ComponentNode | undefined {
  for (const child of node.children ?? []) {
    if (child.id === childId) return node;
    const found = findParent(child, childId);
    if (found) return found;
  }
  return undefined;
}

/** True if `maybeDescendantId` is inside the subtree rooted at `nodeId`. */
export function isDescendant(
  root: ComponentNode,
  nodeId: string,
  maybeDescendantId: string,
): boolean {
  const subtree = findNode(root, nodeId);
  if (!subtree) return false;
  if (nodeId === maybeDescendantId) return true;
  return findNode(subtree, maybeDescendantId) !== undefined;
}

/** Returns a new tree with `patch` shallow-merged into the node `id`. */
export function updateNode(
  root: ComponentNode,
  id: string,
  patch: Partial<Omit<ComponentNode, "id" | "children">>,
): ComponentNode {
  if (root.id === id) return { ...root, ...patch };
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map((child) => updateNode(child, id, patch)),
  };
}

/**
 * Returns a new tree with `newNode` inserted under `parentId`.
 * `index` defaults to appending at the end. Returns the original tree
 * unchanged if `parentId` does not exist.
 */
export function insertNode(
  root: ComponentNode,
  parentId: string,
  newNode: ComponentNode,
  index?: number,
): ComponentNode {
  if (root.id === parentId) {
    const children = root.children ?? [];
    const at = index === undefined ? children.length : index;
    return {
      ...root,
      children: [...children.slice(0, at), newNode, ...children.slice(at)],
    };
  }
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.map((child) =>
      insertNode(child, parentId, newNode, index),
    ),
  };
}

/** Returns a new tree with the node `id` (and its subtree) removed. */
export function removeNode(root: ComponentNode, id: string): ComponentNode {
  if (!root.children) return root;
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== id)
      .map((child) => removeNode(child, id)),
  };
}

/**
 * Returns a new tree with node `id` moved under `newParentId` at `index`.
 * No-op (returns input) when the move would place a node inside its own
 * subtree or when either node is missing.
 */
export function moveNode(
  root: ComponentNode,
  id: string,
  newParentId: string,
  index?: number,
): ComponentNode {
  const node = findNode(root, id);
  if (!node) return root;
  if (isDescendant(root, id, newParentId)) return root;
  if (!findNode(root, newParentId)) return root;
  const without = removeNode(root, id);
  return insertNode(without, newParentId, node, index);
}

/** Collects every node id in the tree (depth-first, root included). */
export function collectIds(root: ComponentNode): string[] {
  const ids = [root.id];
  for (const child of root.children ?? []) {
    ids.push(...collectIds(child));
  }
  return ids;
}

/** Deep-clones a subtree assigning fresh ids (for duplicate). */
export function cloneWithNewIds(
  node: ComponentNode,
  generateId: (type: string) => string,
): ComponentNode {
  return {
    ...node,
    id: generateId(node.type),
    children: node.children?.map((child) =>
      cloneWithNewIds(child, generateId),
    ),
  };
}

/** Counts nodes in the subtree (root included). */
export function countNodes(root: ComponentNode): number {
  return 1 + (root.children ?? []).reduce((n, c) => n + countNodes(c), 0);
}
