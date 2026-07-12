/**
 * Serverless URL sharing (docs/02 feature #4).
 * The whole SpecDocument is lz-string compressed into the URL hash,
 * so a GitHub Pages (or file://) deployment can share layouts by link.
 */

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { SpecDocument } from "../types/spec";
import { parseSpecDocument, serializeSpecDocument } from "./persistence";

const HASH_PREFIX = "#s=";

/** Pure: document -> hash fragment ("#s=..."). */
export function encodeDocumentToHash(doc: SpecDocument): string {
  return `${HASH_PREFIX}${compressToEncodedURIComponent(
    serializeSpecDocument(doc),
  )}`;
}

/** Pure: hash fragment -> document (null when absent or invalid). */
export function decodeDocumentFromHash(hash: string): SpecDocument | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const compressed = hash.slice(HASH_PREFIX.length);
  if (!compressed) return null;
  const json = decompressFromEncodedURIComponent(compressed);
  if (!json) return null;
  return parseSpecDocument(json);
}

/** Builds a shareable URL for the current page. */
export function buildShareUrl(doc: SpecDocument): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}${encodeDocumentToHash(doc)}`;
}

/**
 * Reads a shared document from the current URL, then removes the hash
 * so subsequent edits autosave locally without a stale share link.
 */
export function consumeSharedDocumentFromUrl(): SpecDocument | null {
  const doc = decodeDocumentFromHash(window.location.hash);
  if (doc) {
    window.history.replaceState(null, "", window.location.pathname);
  }
  return doc;
}
