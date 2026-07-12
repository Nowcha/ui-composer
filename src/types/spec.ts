/**
 * SpecTree type definitions — the single source of truth.
 * All outputs (prompt / Markdown spec / code / HTML report) are derived
 * from these structures via pure functions in src/generators/.
 *
 * Design reference: docs/01-design-v2.md §5
 */

export type PhosphorWeight =
  | "thin"
  | "light"
  | "regular"
  | "bold"
  | "fill"
  | "duotone";

/** Icon reference. Never store JSX elements in the store. */
export interface IconRef {
  name: string;
  weight: PhosphorWeight;
}

/**
 * A single node in the SpecTree.
 * `id` doubles as the `data-uic-id` attribute in generated HTML,
 * enabling lossless round-trip import (design v2 §3).
 */
export interface ComponentNode {
  /** Unique within the document. Same value as data-uic-id. */
  id: string;
  /** Catalog component id (kebab-case) or the special "RawBlock" / "root". */
  type: string;
  props: Record<string, unknown>;
  icon?: IconRef;
  /** Free-form behavior memo passed through to prompts. */
  behavior?: string;
  /** Frozen mark: prompts instruct AI to leave this node untouched. */
  frozen?: boolean;
  /** RawBlock only: original HTML kept byte-for-byte (non-destructive import). */
  raw?: string;
  children?: ComponentNode[];
}

export type ComposerMode = "ui" | "report";

export interface SpecMeta {
  name: string;
  mode: ComposerMode;
  /** Code generation target. Default adapter is dependency-free plain-tailwind. */
  targetLibrary: string;
  /** Schema version for migration on import. */
  version: number;
  /**
   * Enabled prompt rule ids (src/data/prompt-rules.json).
   * Absent = mode defaults (rules with defaultOn).
   */
  promptRules?: string[];
}

/** Reference to a saved snapshot (payload lives in localStorage, compressed). */
export interface SnapshotRef {
  id: string;
  label: string;
  createdAt: string; // ISO 8601
}

/** Design tokens (Phase 2). Kept minimal until the token editor lands. */
export interface DesignTokens {
  primaryColor?: string;
  borderRadius?: string;
  spacingUnit?: string;
  fontFamily?: string;
}

export interface SpecDocument {
  meta: SpecMeta;
  tree: ComponentNode;
  tokens?: DesignTokens;
  snapshots: SnapshotRef[];
}

/** Current schema version. Bump when SpecDocument shape changes. */
export const SPEC_VERSION = 1;

/** Node type of the invisible tree root (not a catalog component). */
export const ROOT_NODE_TYPE = "root";

/** Node type for non-destructively imported, unrecognized HTML. */
export const RAW_BLOCK_TYPE = "RawBlock";

export function createEmptyDocument(mode: ComposerMode = "ui"): SpecDocument {
  return {
    meta: {
      name: "無題のスペック",
      mode,
      targetLibrary: "plain-tailwind",
      version: SPEC_VERSION,
    },
    tree: {
      id: "root",
      type: ROOT_NODE_TYPE,
      props: {},
      children: [],
    },
    snapshots: [],
  };
}
