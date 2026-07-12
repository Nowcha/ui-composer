/**
 * localStorage persistence for the SpecDocument.
 * Serialization/validation are pure and unit-tested; the subscription
 * wiring (initPersistence) is thin glue called once from main.tsx.
 */

import type { SpecDocument } from "../types/spec";
import { SPEC_VERSION } from "../types/spec";
import { useSpecStore } from "./spec-store";

export const STORAGE_KEY = "ui-composer:document:v1";
const SAVE_DEBOUNCE_MS = 500;

/** Minimal structural validation for untrusted JSON (import / storage). */
export function parseSpecDocument(json: string): SpecDocument | null {
  try {
    const data: unknown = JSON.parse(json);
    if (typeof data !== "object" || data === null) return null;
    const doc = data as Partial<SpecDocument>;
    if (typeof doc.meta !== "object" || doc.meta === null) return null;
    if (typeof doc.tree !== "object" || doc.tree === null) return null;
    if (typeof doc.tree.id !== "string" || typeof doc.tree.type !== "string") {
      return null;
    }
    if (doc.meta.version !== SPEC_VERSION) {
      // Future: run migrations here. For now only v1 exists.
      return null;
    }
    return {
      meta: doc.meta,
      tree: doc.tree,
      tokens: doc.tokens,
      snapshots: Array.isArray(doc.snapshots) ? doc.snapshots : [],
    } as SpecDocument;
  } catch {
    return null;
  }
}

export function serializeSpecDocument(doc: SpecDocument): string {
  return JSON.stringify(doc);
}

export function loadPersistedDocument(): SpecDocument | null {
  try {
    const json = window.localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return parseSpecDocument(json);
  } catch {
    // localStorage can throw (privacy mode); treat as no saved data
    return null;
  }
}

/**
 * Starts autosaving document changes (debounced). Returns an unsubscribe
 * function. Call once at app startup.
 */
export function initPersistence(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const unsubscribe = useSpecStore.subscribe((state, prevState) => {
    if (state.document === prevState.document) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          serializeSpecDocument(state.document),
        );
      } catch (err) {
        // Quota exceeded (5MB) or storage unavailable — keep the app running
        console.error("failed to persist document to localStorage", err);
      }
    }, SAVE_DEBOUNCE_MS);
  });

  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}
