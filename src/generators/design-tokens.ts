/**
 * DesignTokens → prompt/spec section + code-adapter tailwind.config hint.
 * Pure functions only (design v2 §additional-features #2): tokens are
 * defined once in DocumentSettings and echoed into every output so
 * "毎回色を指示し忘れて後から直す" never happens.
 */

import type { DesignTokens } from "../types/spec";

const TOKEN_LABELS: Record<keyof DesignTokens, string> = {
  primaryColor: "プライマリカラー",
  borderRadius: "角丸",
  spacingUnit: "基準スペーシング",
  fontFamily: "フォント",
};

function definedEntries(tokens: DesignTokens | undefined): [string, string][] {
  if (!tokens) return [];
  return (Object.entries(tokens) as [keyof DesignTokens, string | undefined][])
    .filter((entry): entry is [keyof DesignTokens, string] =>
      Boolean(entry[1]?.trim()),
    )
    .map(([key, value]) => [TOKEN_LABELS[key], value]);
}

/** True when at least one token field is set. */
export function hasDesignTokens(tokens: DesignTokens | undefined): boolean {
  return definedEntries(tokens).length > 0;
}

/** Markdown section for prompt/spec output, or null when no tokens are set. */
export function renderDesignTokensSection(
  tokens: DesignTokens | undefined,
): string | null {
  const entries = definedEntries(tokens);
  if (entries.length === 0) return null;
  return [
    "## デザイントークン",
    "",
    "以下の値を全体で一貫して使用すること:",
    ...entries.map(([label, value]) => `- ${label}: ${value}`),
  ].join("\n");
}

/**
 * Comment lines for generated code headers (a lightweight tailwind.config
 * pointer — the adapters emit fixed utility classes, so this is guidance
 * for the AI/developer wiring the real config, not a live style override).
 */
export function renderTailwindConfigHint(
  tokens: DesignTokens | undefined,
): string[] {
  const entries = definedEntries(tokens);
  if (entries.length === 0) return [];
  return [
    "// デザイントークン(tailwind.config に反映すること):",
    ...entries.map(([label, value]) => `//   ${label}: ${value}`),
  ];
}

/** Same guidance, phrased for the MUI adapter's createTheme() instead. */
export function renderMuiThemeHint(tokens: DesignTokens | undefined): string[] {
  const entries = definedEntries(tokens);
  if (entries.length === 0) return [];
  return [
    "// デザイントークン(createTheme() に反映すること):",
    ...entries.map(([label, value]) => `//   ${label}: ${value}`),
  ];
}
