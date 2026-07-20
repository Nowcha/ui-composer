/**
 * Code generator adapter layer (design v2 §5 出力層).
 * Every adapter is a pure function over SpecDocument. The abstract
 * component model stays library-agnostic; adapters own the mapping.
 */

import type { SpecDocument } from "../../types/spec";

export interface GeneratedFile {
  /** Suggested file name, e.g. "GeneratedScreen.tsx". */
  path: string;
  content: string;
}

export interface CodeGenerator {
  /** Matches SpecMeta.targetLibrary, e.g. "plain-tailwind". */
  id: string;
  label: string;
  /** Short Japanese note appended to the 実装方式 line of generated prompts. */
  promptNote: string;
  generate: (doc: SpecDocument) => GeneratedFile[];
}
