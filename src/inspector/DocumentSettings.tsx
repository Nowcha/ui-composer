import { useMemo, type FC } from "react";
import { useSpecStore } from "../store/spec-store";
import {
  defaultRuleIds,
  rulesForMode,
} from "../generators/prompt-assets";
import { lintTree } from "../lint/a11y";
import { nodeLabel } from "../catalog/catalog-data";
import { findNode } from "../store/tree-utils";
import type { DesignTokens } from "../types/spec";

const BORDER_RADIUS_PRESETS = ["0", "0.25rem", "0.5rem", "0.75rem", "9999px"];
const FONT_FAMILY_PRESETS = [
  "Noto Sans JP, sans-serif",
  "Inter, sans-serif",
  "system-ui, sans-serif",
];

/**
 * Shown in the inspector when no node is selected.
 * Toggles which prompt rule snippets are inserted into generated prompts.
 */
export const DocumentSettings: FC = () => {
  const mode = useSpecStore((s) => s.document.meta.mode);
  const promptRules = useSpecStore((s) => s.document.meta.promptRules);
  const setPromptRules = useSpecStore((s) => s.setPromptRules);
  const tree = useSpecStore((s) => s.document.tree);
  const tokens = useSpecStore((s) => s.document.tokens);
  const setTokens = useSpecStore((s) => s.setTokens);
  const snapshots = useSpecStore((s) => s.document.snapshots);
  const deleteSnapshot = useSpecStore((s) => s.deleteSnapshot);
  const selectNode = useSpecStore((s) => s.selectNode);

  const lintIssues = useMemo(() => lintTree(tree), [tree]);

  const rules = rulesForMode(mode);
  const enabled = new Set(promptRules ?? defaultRuleIds(mode));

  function toggle(ruleId: string): void {
    const next = new Set(enabled);
    if (next.has(ruleId)) {
      next.delete(ruleId);
    } else {
      next.add(ruleId);
    }
    setPromptRules([...next]);
  }

  function updateToken(key: keyof DesignTokens, value: string): void {
    setTokens({ ...tokens, [key]: value });
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <section>
        <h3 className="text-sm font-semibold text-slate-800">
          スペック検査(a11y)
        </h3>
        {lintIssues.length === 0 ? (
          <p className="mt-1 text-xs text-green-700">✓ 問題は見つかりませんでした</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1">
            {lintIssues.map((issue) => {
              const node = findNode(tree, issue.nodeId);
              return (
                <li key={`${issue.nodeId}-${issue.ruleId}`}>
                  <button
                    type="button"
                    onClick={() => selectNode(issue.nodeId)}
                    className="w-full rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-left text-xs leading-relaxed text-amber-900 hover:bg-amber-100"
                  >
                    <span className="font-medium">
                      {node ? nodeLabel(node) : issue.nodeId}:
                    </span>{" "}
                    {issue.message}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-1 text-xs text-slate-400">
          検出結果はプロンプトに「実装時の注意」として自動注記されます
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-800">
          デザイントークン
        </h3>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
          一度定義すると、プロンプト・スペック文書・生成コードのヘッダーに自動反映されます。
        </p>
        <div className="mt-2 flex flex-col gap-2.5">
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            プライマリカラー
            <span className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(tokens?.primaryColor ?? "")
                  ? tokens?.primaryColor
                  : "#2563eb"}
                onChange={(e) => updateToken("primaryColor", e.target.value)}
                aria-label="プライマリカラー(カラーピッカー)"
                className="h-7 w-9 cursor-pointer rounded border border-slate-300"
              />
              <input
                type="text"
                value={tokens?.primaryColor ?? ""}
                onChange={(e) => updateToken("primaryColor", e.target.value)}
                placeholder="#2563eb"
                aria-label="プライマリカラー(テキスト)"
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
            </span>
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-600">
            角丸
            <span className="flex flex-wrap items-center gap-1">
              {BORDER_RADIUS_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateToken("borderRadius", preset)}
                  aria-pressed={tokens?.borderRadius === preset}
                  className={`rounded-md border px-1.5 py-0.5 text-xs ${
                    tokens?.borderRadius === preset
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {preset}
                </button>
              ))}
              <input
                type="text"
                value={tokens?.borderRadius ?? ""}
                onChange={(e) => updateToken("borderRadius", e.target.value)}
                placeholder="0.5rem"
                aria-label="角丸(自由入力)"
                className="w-20 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
              />
            </span>
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-600">
            基準スペーシング
            <input
              type="text"
              value={tokens?.spacingUnit ?? ""}
              onChange={(e) => updateToken("spacingUnit", e.target.value)}
              placeholder="4px"
              aria-label="基準スペーシング"
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-600">
            フォント
            <span className="flex flex-wrap items-center gap-1">
              {FONT_FAMILY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateToken("fontFamily", preset)}
                  aria-pressed={tokens?.fontFamily === preset}
                  className={`rounded-md border px-1.5 py-0.5 text-xs ${
                    tokens?.fontFamily === preset
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {preset.split(",")[0]}
                </button>
              ))}
            </span>
            <input
              type="text"
              value={tokens?.fontFamily ?? ""}
              onChange={(e) => updateToken("fontFamily", e.target.value)}
              placeholder="Noto Sans JP, sans-serif"
              aria-label="フォント(自由入力)"
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            />
          </label>
        </div>
      </section>

      {snapshots.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-800">
            スナップショット履歴
          </h3>
          <ul className="mt-1 flex flex-col gap-1">
            {snapshots.map((snap) => (
              <li
                key={snap.id}
                className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1.5 text-xs"
              >
                <span className="min-w-0">
                  <span className="block truncate text-slate-700">
                    {snap.label}
                  </span>
                  <span className="text-slate-400">
                    {new Date(snap.createdAt).toLocaleString("ja-JP")}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`「${snap.label}」を削除しますか?`)) {
                      deleteSnapshot(snap.id);
                    }
                  }}
                  aria-label={`${snap.label}を削除`}
                  className="ml-2 shrink-0 rounded-md border border-red-200 px-2 py-0.5 text-red-700 hover:bg-red-50"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          プロンプト共通規約
        </h3>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
          ONにした規約が全量/差分プロンプトの冒頭に自動挿入されます(指示し忘れ防止)。
        </p>
      </div>
      <ul className="flex flex-col gap-1.5">
        {rules.map((rule) => (
          <li key={rule.id}>
            <label
              className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
              title={rule.text}
            >
              <input
                type="checkbox"
                checked={enabled.has(rule.id)}
                onChange={() => toggle(rule.id)}
                className="mt-0.5"
              />
              <span>
                {rule.label}
                <span className="block text-xs leading-relaxed text-slate-400">
                  {rule.text}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};
