/**
 * Full-spec prompt generator.
 * Pure function: SpecDocument in, Markdown prompt string out.
 * No side effects, no store access — snapshot-tested in prompt.test.ts.
 */

import type { ComponentNode, SpecDocument } from "../types/spec";
import { RAW_BLOCK_TYPE, ROOT_NODE_TYPE } from "../types/spec";
import type { CatalogComponent } from "../types/catalog";
import { getCatalogComponent } from "../catalog/catalog-data";
import {
  renderDummyDataSection,
  renderRulesSection,
} from "./prompt-assets";
import { lintTree } from "../lint/a11y";
import { getCodeGenerator } from "./code/index";
import { renderFlowSection } from "./flow-mermaid";

const INDENT = "  ";

function formatPropValue(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

function formatProps(props: Record<string, unknown>): string {
  const entries = Object.entries(props).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (entries.length === 0) return "";
  return entries.map(([k, v]) => `${k}=${formatPropValue(v)}`).join(", ");
}

function nodeLine(node: ComponentNode, depth: number): string[] {
  const def = getCatalogComponent(node.type);
  const label = def ? `${def.nameJa}(${def.name})` : node.type;
  const parts = [`${INDENT.repeat(depth)}- ${label} [id: ${node.id}]`];

  const propText = formatProps(node.props);
  if (propText) {
    parts.push(`${INDENT.repeat(depth + 1)}- プロパティ: ${propText}`);
  }
  if (node.icon) {
    parts.push(
      `${INDENT.repeat(depth + 1)}- アイコン: ${node.icon.name} (Phosphor, weight=${node.icon.weight})`,
    );
  }
  if (node.behavior) {
    parts.push(`${INDENT.repeat(depth + 1)}- 挙動: ${node.behavior}`);
  }
  if (node.frozen) {
    parts.push(
      `${INDENT.repeat(depth + 1)}- 🔒 このコンポーネントは現状維持(変更禁止)`,
    );
  }
  return parts;
}

function renderTree(node: ComponentNode, depth: number): string[] {
  const lines =
    node.type === ROOT_NODE_TYPE ? [] : nodeLine(node, depth);
  const childDepth = node.type === ROOT_NODE_TYPE ? depth : depth + 1;
  for (const child of node.children ?? []) {
    lines.push(...renderTree(child, childDepth));
  }
  return lines;
}

function collectFrozenNodes(node: ComponentNode): ComponentNode[] {
  const frozen = node.frozen && node.type !== ROOT_NODE_TYPE ? [node] : [];
  return [
    ...frozen,
    ...(node.children ?? []).flatMap((c) => collectFrozenNodes(c)),
  ];
}

function collectUsedComponents(
  node: ComponentNode,
  acc = new Map<string, CatalogComponent>(),
): Map<string, CatalogComponent> {
  if (node.type !== ROOT_NODE_TYPE && node.type !== RAW_BLOCK_TYPE) {
    const def = getCatalogComponent(node.type);
    if (def) acc.set(def.id, def);
  }
  for (const child of node.children ?? []) {
    collectUsedComponents(child, acc);
  }
  return acc;
}

function displayName(node: ComponentNode): string {
  const def = getCatalogComponent(node.type);
  return def ? def.nameJa : node.type;
}

/** True when any node declares a colSpan (12-column grid width). */
function usesGridSpans(node: ComponentNode): boolean {
  if (typeof node.props?.colSpan === "number") return true;
  return (node.children ?? []).some((child) => usesGridSpans(child));
}

/** Generates the full implementation prompt for AI coding agents. */
export function generatePrompt(doc: SpecDocument): string {
  const sections: string[] = [];

  sections.push(`# UI実装指示: ${doc.meta.name}`);
  const headerLines = [
    "以下のレイアウト構造を正確に実装してください。",
    `- 対象: ${doc.meta.mode === "ui" ? "アプリケーションUI" : "HTMLレポート"}`,
    `- 実装方式: ${doc.meta.targetLibrary}(${getCodeGenerator(doc.meta.targetLibrary).promptNote})`,
    "- 構造はこの指示の階層どおりにすること。指示にないコンポーネントを追加しないこと",
    "- 各要素に data-uic-id 属性として [id: ...] の値を付与すること",
  ];
  if (usesGridSpans(doc.tree)) {
    headerLines.push(
      "- レイアウトは12カラムグリッド。プロパティ colSpan=n は横幅 n/12 を占める意味(未指定は全幅=12)。合計12以内で同じ行に収まる隣接要素は横に並べること",
    );
  }
  sections.push(headerLines.join("\n"));

  const rulesSection = renderRulesSection(doc);
  if (rulesSection) sections.push(rulesSection);

  const treeLines = renderTree(doc.tree, 0);
  sections.push(
    `## レイアウト構造\n\n${
      treeLines.length > 0 ? treeLines.join("\n") : "(コンポーネントなし)"
    }`,
  );

  const flowSection = renderFlowSection(doc.flow);
  if (flowSection) {
    sections.push(
      `${flowSection}\n\n遷移はこの図のとおり実装すること。図にない画面・遷移を追加しないこと。`,
    );
  }

  const frozen = collectFrozenNodes(doc.tree);
  if (frozen.length > 0) {
    sections.push(
      `## 変更禁止(凍結)要素\n\n次の要素は現状維持とし、一切変更しないこと:\n${frozen
        .map((n) => `- ${displayName(n)} [id: ${n.id}]`)
        .join("\n")}`,
    );
  }

  const used = collectUsedComponents(doc.tree);
  const a11yLines = [...used.values()]
    .filter((def) => def.a11yNotes.length > 0)
    .map(
      (def) =>
        `- ${def.nameJa}: ${def.a11yNotes.join(" / ")}`,
    );
  if (a11yLines.length > 0) {
    sections.push(
      `## 実装時のアクセシビリティ要件\n\n${a11yLines.join("\n")}`,
    );
  }

  const lintIssues = lintTree(doc.tree);
  if (lintIssues.length > 0) {
    sections.push(
      `## 実装時の注意(スペック検査で検出)\n\n${lintIssues
        .map((issue) => `- [id: ${issue.nodeId}] ${issue.message}`)
        .join("\n")}`,
    );
  }

  const dummySection = renderDummyDataSection(doc);
  if (dummySection) sections.push(dummySection);

  return `${sections.join("\n\n")}\n`;
}
