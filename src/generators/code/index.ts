/**
 * Code generator registry. Adapters for shadcn / MUI plug in here
 * without touching callers (they resolve by SpecMeta.targetLibrary).
 */

import type { CodeGenerator } from "./types";
import { plainTailwindGenerator } from "./plain-tailwind";
import { shadcnGenerator } from "./shadcn";
import { muiGenerator } from "./mui";

export const codeGenerators: CodeGenerator[] = [
  plainTailwindGenerator,
  shadcnGenerator,
  muiGenerator,
];

export function getCodeGenerator(targetLibrary: string): CodeGenerator {
  return (
    codeGenerators.find((g) => g.id === targetLibrary) ??
    plainTailwindGenerator
  );
}
