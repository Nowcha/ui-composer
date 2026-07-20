/**
 * Screen-flow editor dialog (additional-features #6).
 * Edits SpecDocument.flow via the setFlow store action; the Mermaid
 * output is injected into prompt / spec markdown automatically.
 */

import { useEffect, type FC } from "react";
import type { FlowTransition, ScreenFlow } from "../types/spec";
import { useSpecStore } from "../store/spec-store";
import { generateFlowMermaid } from "../generators/flow-mermaid";
import { FlowPreview } from "./FlowPreview";

function createTransitionId(): string {
  return `t-${Math.random().toString(36).slice(2, 8)}`;
}

const EMPTY_FLOW: ScreenFlow = { screens: [], transitions: [] };

interface FlowDialogProps {
  onClose: () => void;
}

export const FlowDialog: FC<FlowDialogProps> = ({ onClose }) => {
  const documentName = useSpecStore((s) => s.document.meta.name);
  const flow = useSpecStore((s) => s.document.flow) ?? EMPTY_FLOW;
  const setFlow = useSpecStore((s) => s.setFlow);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function addScreen(): void {
    const base = flow.screens.length === 0 ? documentName : "新しい画面";
    let name = base;
    let n = 2;
    while (flow.screens.includes(name)) {
      name = `${base} ${n}`;
      n += 1;
    }
    setFlow({ ...flow, screens: [...flow.screens, name] });
  }

  function renameScreen(index: number, nextName: string): void {
    const prevName = flow.screens[index];
    if (prevName === undefined) return;
    const screens = flow.screens.map((s, i) => (i === index ? nextName : s));
    const transitions = flow.transitions.map((t) => ({
      ...t,
      from: t.from === prevName ? nextName : t.from,
      to: t.to === prevName ? nextName : t.to,
    }));
    setFlow({ ...flow, screens, transitions });
  }

  function removeScreen(index: number): void {
    const name = flow.screens[index];
    if (name === undefined) return;
    setFlow({
      screens: flow.screens.filter((_, i) => i !== index),
      transitions: flow.transitions.filter(
        (t) => t.from !== name && t.to !== name,
      ),
    });
  }

  function addTransition(): void {
    const from = flow.screens[0] ?? "";
    const to = flow.screens[1] ?? flow.screens[0] ?? "";
    if (!from) return;
    setFlow({
      ...flow,
      transitions: [
        ...flow.transitions,
        { id: createTransitionId(), from, to, trigger: "" },
      ],
    });
  }

  function updateTransition(
    id: string,
    patch: Partial<Omit<FlowTransition, "id">>,
  ): void {
    setFlow({
      ...flow,
      transitions: flow.transitions.map((t) =>
        t.id === id ? { ...t, ...patch } : t,
      ),
    });
  }

  function removeTransition(id: string): void {
    setFlow({
      ...flow,
      transitions: flow.transitions.filter((t) => t.id !== id),
    });
  }

  const mermaid = generateFlowMermaid(flow);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="画面遷移エディタ"
        className="flex max-h-full w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            画面遷移エディタ
          </h2>
          <p className="text-xs text-slate-400">
            スペック文書とプロンプトに Mermaid 遷移図が自動挿入されます
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="ml-auto rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-auto p-4">
          <section>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-xs font-semibold text-slate-600">画面</h3>
              <button
                type="button"
                onClick={addScreen}
                className="rounded-md bg-blue-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                + 画面を追加
              </button>
            </div>
            {flow.screens.length === 0 ? (
              <p className="text-xs text-slate-400">
                まだ画面がありません。「+ 画面を追加」から始めてください。
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {flow.screens.map((screen, index) => (
                  <li
                    key={`screen-${index}`}
                    className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1"
                  >
                    <input
                      type="text"
                      value={screen}
                      onChange={(e) => renameScreen(index, e.target.value)}
                      aria-label={`画面名 ${index + 1}`}
                      className="w-32 bg-transparent text-xs text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreen(index)}
                      aria-label={`画面「${screen}」を削除`}
                      className="text-xs text-slate-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-xs font-semibold text-slate-600">遷移</h3>
              <button
                type="button"
                onClick={addTransition}
                disabled={flow.screens.length === 0}
                className="rounded-md bg-blue-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                + 遷移を追加
              </button>
            </div>
            {flow.transitions.length === 0 ? (
              <p className="text-xs text-slate-400">
                遷移がありません。「画面A → 画面B」の流れを追加してください。
              </p>
            ) : (
              <ul className="space-y-1.5">
                {flow.transitions.map((t) => (
                  <li key={t.id} className="flex items-center gap-1.5">
                    <select
                      value={t.from}
                      onChange={(e) =>
                        updateTransition(t.id, { from: e.target.value })
                      }
                      aria-label="遷移元画面"
                      className="rounded-md border border-slate-300 px-1.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {flow.screens.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={t.trigger}
                      onChange={(e) =>
                        updateTransition(t.id, { trigger: e.target.value })
                      }
                      placeholder="トリガー(例: ログインボタン)"
                      aria-label="遷移トリガー"
                      className="w-52 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    />
                    <span aria-hidden className="text-xs text-slate-400">
                      →
                    </span>
                    <select
                      value={t.to}
                      onChange={(e) =>
                        updateTransition(t.id, { to: e.target.value })
                      }
                      aria-label="遷移先画面"
                      className="rounded-md border border-slate-300 px-1.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {flow.screens.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeTransition(t.id)}
                      aria-label="この遷移を削除"
                      className="ml-1 text-xs text-slate-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold text-slate-600">
              プレビュー
            </h3>
            <FlowPreview flow={flow} />
          </section>

          {mermaid && (
            <section>
              <h3 className="mb-2 text-xs font-semibold text-slate-600">
                Mermaid ソース
              </h3>
              <pre className="overflow-auto rounded-md bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
                {mermaid}
              </pre>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
