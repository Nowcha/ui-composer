/**
 * Typed access to prompt assets + the pure helpers that turn them into
 * prompt sections. Used by generators/prompt.ts.
 */

import promptRulesJson from "../data/prompt-rules.json";
import dummyDataJson from "../data/dummy-data-ja.json";
import type { DummyDataJa, PromptRule } from "../types/assets";
import type { ComponentNode, ComposerMode, SpecDocument } from "../types/spec";

export const promptRules = promptRulesJson as PromptRule[];
export const dummyDataJa = dummyDataJson as DummyDataJa;

export function rulesForMode(mode: ComposerMode): PromptRule[] {
  return promptRules.filter((r) => r.category === mode);
}

export function defaultRuleIds(mode: ComposerMode): string[] {
  return rulesForMode(mode)
    .filter((r) => r.defaultOn)
    .map((r) => r.id);
}

/** Enabled rules for a document (explicit selection or mode defaults). */
export function enabledRules(doc: SpecDocument): PromptRule[] {
  const selected = doc.meta.promptRules;
  const forMode = rulesForMode(doc.meta.mode);
  if (!selected) return forMode.filter((r) => r.defaultOn);
  const set = new Set(selected);
  return forMode.filter((r) => set.has(r.id));
}

/** Rules section text, or null when every rule is off. */
export function renderRulesSection(doc: SpecDocument): string | null {
  const rules = enabledRules(doc);
  if (rules.length === 0) return null;
  return `## 共通実装規約\n\n${rules.map((r) => `- ${r.text}`).join("\n")}`;
}

const DATA_HUNGRY_TYPES = new Set([
  "table",
  "list",
  "description-list",
  "comparison-table",
  "avatar",
  "timeline",
]);

function usesDataHungryComponent(node: ComponentNode): boolean {
  if (DATA_HUNGRY_TYPES.has(node.type)) return true;
  return (node.children ?? []).some((c) => usesDataHungryComponent(c));
}

/**
 * Dummy data section (docs/04 asset #2): included only when the tree
 * contains data-displaying components, so AI never ships empty UIs.
 */
export function renderDummyDataSection(doc: SpecDocument): string | null {
  if (!usesDataHungryComponent(doc.tree)) return null;
  const people = dummyDataJa.people
    .slice(0, 5)
    .map((p) => `${p.name}(${p.kana})`)
    .join("、");
  return [
    "## ダミーデータ指示",
    "",
    "以下の架空データを使い、表示確認可能な状態で納品すること(空のUIは不可):",
    `- 人名: ${people}`,
    `- 会社名: ${dummyDataJa.companies.slice(0, 3).join("、")}`,
    `- 部署/役職: ${dummyDataJa.departments.slice(0, 4).join("、")} / ${dummyDataJa.positions.slice(0, 3).join("、")}`,
    `- ステータス: ${dummyDataJa.statuses.join("、")}`,
    `- 日付: ${dummyDataJa.dates.slice(0, 3).join("、")} / 金額: ${dummyDataJa.amounts.slice(0, 3).join("、")}`,
  ].join("\n");
}
