/**
 * Zustand store for the SpecTree document.
 *
 * Rules (see CLAUDE.md):
 * - Components must mutate state only through the actions defined here,
 *   never via direct `set` — every tree change goes through history.
 * - Tree manipulation is delegated to pure functions in tree-utils.ts.
 *
 * Undo/redo: structural snapshots of `tree` in past/future stacks.
 * Selection and meta edits are intentionally NOT undoable.
 */

import { create } from "zustand";
import type { ComponentNode, ComposerMode, SpecDocument } from "../types/spec";
import { createEmptyDocument } from "../types/spec";
import {
  cloneWithNewIds,
  findNode,
  findParent,
  insertNode,
  moveNode,
  removeNode,
  updateNode,
} from "./tree-utils";

const HISTORY_LIMIT = 100;

export function createNodeId(type: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${type}-${suffix}`;
}

interface SpecState {
  document: SpecDocument;
  selectedNodeId: string | null;
  past: ComponentNode[];
  future: ComponentNode[];

  // --- selection (not undoable) ---
  selectNode: (id: string | null) => void;

  // --- tree mutations (undoable) ---
  addNode: (parentId: string, node: ComponentNode, index?: number) => void;
  removeNodeById: (id: string) => void;
  updateNodeById: (
    id: string,
    patch: Partial<Omit<ComponentNode, "id" | "children">>,
  ) => void;
  moveNodeById: (id: string, newParentId: string, index?: number) => void;
  duplicateNode: (id: string) => void;

  // --- document-level ---
  setMode: (mode: ComposerMode) => void;
  setDocumentName: (name: string) => void;
  loadDocument: (doc: SpecDocument) => void;
  resetDocument: (mode?: ComposerMode) => void;

  // --- history ---
  undo: () => void;
  redo: () => void;
}

export const useSpecStore = create<SpecState>((set, get) => {
  /** Applies an undoable tree change, pushing the previous tree to history. */
  function commitTree(nextTree: ComponentNode): void {
    const { document, past } = get();
    if (nextTree === document.tree) return; // pure fns return input on no-op
    set({
      document: { ...document, tree: nextTree },
      past: [...past.slice(-(HISTORY_LIMIT - 1)), document.tree],
      future: [],
    });
  }

  return {
    document: createEmptyDocument(),
    selectedNodeId: null,
    past: [],
    future: [],

    selectNode: (id) => set({ selectedNodeId: id }),

    addNode: (parentId, node, index) => {
      commitTree(insertNode(get().document.tree, parentId, node, index));
      set({ selectedNodeId: node.id });
    },

    removeNodeById: (id) => {
      const { document, selectedNodeId } = get();
      commitTree(removeNode(document.tree, id));
      if (selectedNodeId === id) set({ selectedNodeId: null });
    },

    updateNodeById: (id, patch) => {
      commitTree(updateNode(get().document.tree, id, patch));
    },

    moveNodeById: (id, newParentId, index) => {
      commitTree(moveNode(get().document.tree, id, newParentId, index));
    },

    duplicateNode: (id) => {
      const tree = get().document.tree;
      const source = findNode(tree, id);
      const parent = findParent(tree, id);
      if (!source || !parent) return;
      const copy = cloneWithNewIds(source, createNodeId);
      const siblings = parent.children ?? [];
      const at = siblings.findIndex((c) => c.id === id) + 1;
      commitTree(insertNode(tree, parent.id, copy, at));
      set({ selectedNodeId: copy.id });
    },

    setMode: (mode) => {
      const { document } = get();
      set({ document: { ...document, meta: { ...document.meta, mode } } });
    },

    setDocumentName: (name) => {
      const { document } = get();
      set({ document: { ...document, meta: { ...document.meta, name } } });
    },

    loadDocument: (doc) => {
      set({ document: doc, selectedNodeId: null, past: [], future: [] });
    },

    resetDocument: (mode) => {
      const currentMode = get().document.meta.mode;
      set({
        document: createEmptyDocument(mode ?? currentMode),
        selectedNodeId: null,
        past: [],
        future: [],
      });
    },

    undo: () => {
      const { document, past, future } = get();
      const previous = past[past.length - 1];
      if (!previous) return;
      set({
        document: { ...document, tree: previous },
        past: past.slice(0, -1),
        future: [document.tree, ...future],
      });
    },

    redo: () => {
      const { document, past, future } = get();
      const next = future[0];
      if (!next) return;
      set({
        document: { ...document, tree: next },
        past: [...past, document.tree],
        future: future.slice(1),
      });
    },
  };
});
