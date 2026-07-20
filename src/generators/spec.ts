/**
 * Markdown spec document generator (Phase 4).
 * Pure function: SpecDocument in, human-readable Markdown out.
 * For design docs / PR descriptions rather than AI prompts.
 */

import type { ComponentNode, SpecDocument } from "../types/spec";
import { RAW_BLOCK_TYPE, ROOT_NODE_TYPE } from "../types/spec";
import type { CatalogComponent } from "../types/catalog";
import { getCatalogComponent } from "../catalog/catalog-data";
import { countNodes } from "../store/tree-utils";
import { renderFlowSection } from "./flow-mermaid";

function labelOf(node: ComponentNode): string {
  if (node.type === RAW_BLOCK_TYPE) return "RawBlock";
  const def = getCatalogComponent(node.type);
  return def?.nameJa ?? node.type;
}

function treeLines(node: ComponentNode, depth: number): string[] {
  const lines: string[] = [];
  if (node.type !== ROOT_NODE_TYPE) {
    const marks = [
      node.frozen ? "🔒" : "",
      node.behavior ? "⚙" : "",
    ]
      .filter(Boolean)
      .join("");
    lines.push(
      `${"  ".repeat(depth)}- ${labelOf(node)}${marks ? ` ${marks}` : ""} \`${node.id}\``,
    );
  }
  const childDepth = node.type === ROOT_NODE_TYPE ? depth : depth + 1;
  for (const child of node.children ?? []) {
    lines.push(...treeLines(child, childDepth));
  }
  return lines;
}

function collectUsed(
  node: ComponentNode,
  acc = new Map<string, { def: CatalogComponent; count: number }>(),
): Map<string, { def: CatalogComponent; count: number }> {
  const def = getCatalogComponent(node.type);
  if (def) {
    const entry = acc.get(def.id);
    acc.set(def.id, { def, count: (entry?.count ?? 0) + 1 });
  }
  for (const child of node.children ?? []) collectUsed(child, acc);
  return acc;
}

function collectBehaviors(node: ComponentNode): ComponentNode[] {
  const self = node.behavior ? [node] : [];
  return [
    ...self,
    ...(node.children ?? []).flatMap((c) => collectBehaviors(c)),
  ];
}

/** Generates a Markdown specification document. */
export function generateSpecMarkdown(doc: SpecDocument): string {
  const sections: string[] = [];
  const nodeCount = countNodes(doc.tree) - 1; // exclude root

  sections.push(`# ${doc.meta.name} — 画面スペック`);
  sections.push(
    [
      `- モード: ${doc.meta.mode === "ui" ? "UI" : "レポート"}`,
      `- 実装方式: ${doc.meta.targetLibrary}`,
      `- コンポーネント数: ${nodeCount}`,
    ].join("\n"),
  );

  const lines = treeLines(doc.tree, 0);
  sections.push(
    `## 構造\n\n${lines.length > 0 ? lines.join("\n") : "(コンポーネントなし)"}\n\n凡例: 🔒 = 変更禁止(凍結) / ⚙ = 挙動メモあり`,
  );

  const flowSection = renderFlowSection(doc.flow);
  if (flowSection) sections.push(flowSection);

  const used = [...collectUsed(doc.tree).values()].sort(
    (a, b) => b.count - a.count,
  );
  if (used.length > 0) {
    const rows = used
      .map(
        ({ def, count }) =>
          `| ${def.nameJa} | \`${def.id}\` | ${count} | ${def.description} |`,
      )
      .join("\n");
    sections.push(
      `## 使用コンポーネント\n\n| コンポーネント | type | 個数 | 説明 |\n|---|---|---|---|\n${rows}`,
    );
  }

  const behaviors = collectBehaviors(doc.tree);
  if (behaviors.length > 0) {
    sections.push(
      `## 挙動仕様\n\n${behaviors
        .map((n) => `- **${labelOf(n)}** \`${n.id}\`: ${n.behavior ?? ""}`)
        .join("\n")}`,
    );
  }

  return `${sections.join("\n\n")}\n`;
}
