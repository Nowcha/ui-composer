import type { FC } from "react";
import { useSpecStore } from "../store/spec-store";
import {
  defaultRuleIds,
  rulesForMode,
} from "../generators/prompt-assets";

/**
 * Shown in the inspector when no node is selected.
 * Toggles which prompt rule snippets are inserted into generated prompts.
 */
export const DocumentSettings: FC = () => {
  const mode = useSpecStore((s) => s.document.meta.mode);
  const promptRules = useSpecStore((s) => s.document.meta.promptRules);
  const setPromptRules = useSpecStore((s) => s.setPromptRules);

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

  return (
    <div className="flex flex-col gap-3 p-3">
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
