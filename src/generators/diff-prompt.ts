/**
 * Diff prompt generator (Phase 2 flagship).
 * Pure function: base tree + current document in, minimal-change
 * Markdown instruction out. "Implement ONLY this diff" prevents AI
 * from rewriting unrelated parts.
 */

import type { ComponentNode, SpecDocument } from "../types/spec";
import { ROOT_NODE_TYPE } from "../types/spec";
import { diffTrees, isEmptyDiff, type TreeDiff } from "../diff/tree-diff";
import { getCatalogComponent } from "../catalog/catalog-data";

function displayName(node: ComponentNode): string {
  const def = getCatalogComponent(node.type);
  return def ? `${def.nameJa}(${def.name})` : node.type;
}

function locate(tree: ComponentNode, id: string): string {
  if (id === "root") return "トップレベル";
  const found = findById(tree, id);
  return found ? `${displayName(found)} [id: ${id}] の中` : `[id: ${id}] の中`;
}

function findById(node: ComponentNode, id: string): ComponentNode | undefined {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findById(child, id);
    if (found) return found;
  }
  return undefined;
}

function renderSubtree(node: ComponentNode, depth: number): string[] {
  const props = Object.entries(node.props)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${typeof v === "string" ? `"${v}"` : String(v)}`)
    .join(", ");
  const lines = [
    `${"  ".repeat(depth)}- ${displayName(node)} [id: ${node.id}]${
      props ? ` (${props})` : ""
    }`,
  ];
  if (node.behavior) {
    lines.push(`${"  ".repeat(depth + 1)}- 挙動: ${node.behavior}`);
  }
  for (const child of node.children ?? []) {
    lines.push(...renderSubtree(child, depth + 1));
  }
  return lines;
}

function propsDelta(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const lines: string[] = [];
  for (const key of keys) {
    const b = JSON.stringify(before[key] ?? null);
    const a = JSON.stringify(after[key] ?? null);
    if (b !== a) lines.push(`${key}: ${b} → ${a}`);
  }
  return lines;
}

function renderChangedEntry(
  entry: TreeDiff["changed"][number],
  currentTree: ComponentNode,
): string[] {
  const lines = [
    `- ${displayName(entry.after)} [id: ${entry.id}](場所: ${locate(
      currentTree,
      parentIdOf(currentTree, entry.id) ?? "root",
    )})`,
  ];
  for (const field of entry.fields) {
    switch (field) {
      case "props":
        for (const delta of propsDelta(entry.before.props, entry.after.props)) {
          lines.push(`  - プロパティ変更: ${delta}`);
        }
        break;
      case "icon":
        lines.push(
          `  - アイコン変更: ${entry.before.icon?.name ?? "なし"} → ${
            entry.after.icon
              ? `${entry.after.icon.name} (weight=${entry.after.icon.weight})`
              : "なし"
          }`,
        );
        break;
      case "behavior":
        lines.push(`  - 挙動変更: ${entry.after.behavior ?? "(削除)"}`);
        break;
      case "frozen":
        lines.push(
          entry.after.frozen
            ? "  - このノードは以後変更禁止(凍結)になった"
            : "  - 凍結が解除された",
        );
        break;
      case "type":
        lines.push(
          `  - コンポーネント種別変更: ${entry.before.type} → ${entry.after.type}`,
        );
        break;
    }
  }
  return lines;
}

function parentIdOf(tree: ComponentNode, id: string): string | undefined {
  for (const child of tree.children ?? []) {
    if (child.id === id) return tree.id;
    const found = parentIdOf(child, id);
    if (found) return found;
  }
  return undefined;
}

function collectFrozenNodes(node: ComponentNode): ComponentNode[] {
  const self = node.frozen && node.type !== ROOT_NODE_TYPE ? [node] : [];
  return [
    ...self,
    ...(node.children ?? []).flatMap((c) => collectFrozenNodes(c)),
  ];
}

/**
 * Generates a minimal-change prompt from `baseTree` (snapshot) to the
 * current document state.
 */
export function generateDiffPrompt(
  baseTree: ComponentNode,
  doc: SpecDocument,
  baseLabel: string,
): string {
  const diff = diffTrees(baseTree, doc.tree);
  const sections: string[] = [];

  sections.push(`# UI改修指示(差分のみ): ${doc.meta.name}`);
  sections.push(
    [
      `基準版「${baseLabel}」からの差分だけを実装してください。`,
      "**以下に列挙した変更以外は、コード・構造・スタイルを一切変更しないこと。**",
      "対象要素は data-uic-id 属性([id: ...])で特定すること。",
    ].join("\n"),
  );

  if (isEmptyDiff(diff)) {
    sections.push("## 差分\n\n(差分はありません)");
    return `${sections.join("\n\n")}\n`;
  }

  if (diff.added.length > 0) {
    const lines = diff.added.flatMap((entry) => [
      `- 追加先: ${locate(doc.tree, entry.parentId)}、位置: ${entry.index + 1}番目`,
      ...renderSubtree(entry.node, 1),
    ]);
    sections.push(`## 追加\n\n${lines.join("\n")}`);
  }

  if (diff.removed.length > 0) {
    const lines = diff.removed.map(
      (entry) =>
        `- ${displayName(entry.node)} [id: ${entry.node.id}] を削除(配下の要素も含む)`,
    );
    sections.push(`## 削除\n\n${lines.join("\n")}`);
  }

  if (diff.changed.length > 0) {
    const lines = diff.changed.flatMap((entry) =>
      renderChangedEntry(entry, doc.tree),
    );
    sections.push(`## 変更\n\n${lines.join("\n")}`);
  }

  if (diff.moved.length > 0) {
    const lines = diff.moved.map((entry) => {
      const node = findById(doc.tree, entry.id);
      const name = node ? displayName(node) : entry.id;
      return `- ${name} [id: ${entry.id}] を ${locate(
        doc.tree,
        entry.toParentId,
      )}の${entry.toIndex + 1}番目へ移動(見た目・プロパティは変更しない)`;
    });
    sections.push(`## 移動\n\n${lines.join("\n")}`);
  }

  const frozen = collectFrozenNodes(doc.tree);
  if (frozen.length > 0) {
    sections.push(
      `## 変更禁止(凍結)要素\n\n次の要素は上記の差分に含まれていても現状維持を優先し、変更しないこと:\n${frozen
        .map((n) => `- ${displayName(n)} [id: ${n.id}]`)
        .join("\n")}`,
    );
  }

  return `${sections.join("\n\n")}\n`;
}
