/**
 * Accessibility lint (docs/02 feature #5).
 * Pure function: tree in, issues out. Results are shown in the
 * document settings panel and auto-annotated into generated prompts.
 */

import type { ComponentNode } from "../types/spec";
import { ROOT_NODE_TYPE } from "../types/spec";

export interface LintIssue {
  nodeId: string;
  ruleId: string;
  message: string;
}

const LABELED_INPUT_TYPES = new Set([
  "text-input",
  "select",
  "textarea",
  "combobox",
  "date-picker",
  "time-picker",
  "number-input",
  "slider",
  "color-picker",
]);

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

function headingRank(level: unknown): number | null {
  if (typeof level !== "string") return null;
  const match = /^h([1-6])$/.exec(level);
  return match ? Number(match[1]) : null;
}

function walk(
  node: ComponentNode,
  visit: (node: ComponentNode) => void,
): void {
  if (node.type !== ROOT_NODE_TYPE) visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

/** Runs all lint rules against a full tree. */
export function lintTree(root: ComponentNode): LintIssue[] {
  const issues: LintIssue[] = [];
  const sectionRanks: { nodeId: string; rank: number }[] = [];

  walk(root, (node) => {
    const p = node.props;

    if (LABELED_INPUT_TYPES.has(node.type) && isBlank(p.label)) {
      issues.push({
        nodeId: node.id,
        ruleId: "input-label",
        message: `${node.type} にラベルがありません。label要素を必ず関連付けること`,
      });
    }

    if (
      (node.type === "button" || node.type === "fab") &&
      node.icon &&
      isBlank(p.label)
    ) {
      issues.push({
        nodeId: node.id,
        ruleId: "icon-only-button",
        message: "アイコンのみのボタンです。aria-label を必ず付与すること",
      });
    }

    if (node.type === "image" && isBlank(p.alt)) {
      issues.push({
        nodeId: node.id,
        ruleId: "image-alt",
        message:
          "画像にaltがありません。意味を説明するalt(装飾なら空alt)を指定すること",
      });
    }

    if (node.type === "table" && isBlank(p.columns)) {
      issues.push({
        nodeId: node.id,
        ruleId: "table-columns",
        message: "テーブルに列定義がありません。th見出しを持つ構造にすること",
      });
    }

    if (node.type === "section") {
      const rank = headingRank(p.headingLevel);
      if (rank !== null) sectionRanks.push({ nodeId: node.id, rank });
    }
  });

  // Heading hierarchy: a section must not skip levels vs. the previous one
  for (let i = 1; i < sectionRanks.length; i++) {
    const prev = sectionRanks[i - 1];
    const curr = sectionRanks[i];
    if (prev && curr && curr.rank > prev.rank + 1) {
      issues.push({
        nodeId: curr.nodeId,
        ruleId: "heading-skip",
        message: `見出しレベルが h${prev.rank} から h${curr.rank} に飛んでいます。順番に下げること`,
      });
    }
  }

  return issues;
}
