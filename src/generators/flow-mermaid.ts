/**
 * Screen-flow → Mermaid flowchart generator.
 * Pure function: ScreenFlow in, Mermaid source out (null when empty).
 * Screen names become indexed node ids (S0, S1, ...) so arbitrary
 * Japanese labels never need Mermaid escaping.
 */

import type { ScreenFlow } from "../types/spec";

function escapeLabel(label: string): string {
  return label.replaceAll('"', "#quot;");
}

/**
 * Returns the ordered list of screen names: declared screens first,
 * then any transition endpoints not declared (defensive inclusion).
 */
export function collectFlowScreens(flow: ScreenFlow): string[] {
  const names = [...flow.screens];
  for (const t of flow.transitions) {
    for (const name of [t.from, t.to]) {
      if (name && !names.includes(name)) names.push(name);
    }
  }
  return names;
}

/** Generates a Mermaid flowchart, or null when the flow is empty. */
export function generateFlowMermaid(
  flow: ScreenFlow | undefined,
): string | null {
  if (!flow) return null;
  const screens = collectFlowScreens(flow);
  if (screens.length === 0) return null;

  const idOf = new Map(screens.map((name, i) => [name, `S${i}`]));
  const lines = ["flowchart TD"];
  for (const name of screens) {
    lines.push(`  ${idOf.get(name)}["${escapeLabel(name)}"]`);
  }
  for (const t of flow.transitions) {
    const from = idOf.get(t.from);
    const to = idOf.get(t.to);
    if (!from || !to) continue;
    const label = t.trigger.trim();
    lines.push(
      label
        ? `  ${from} -->|"${escapeLabel(label)}"| ${to}`
        : `  ${from} --> ${to}`,
    );
  }
  return lines.join("\n");
}

/** Markdown section (## 画面遷移 + mermaid fence), or null when empty. */
export function renderFlowSection(flow: ScreenFlow | undefined): string | null {
  const mermaid = generateFlowMermaid(flow);
  if (!mermaid) return null;
  return `## 画面遷移\n\n\`\`\`mermaid\n${mermaid}\n\`\`\``;
}
