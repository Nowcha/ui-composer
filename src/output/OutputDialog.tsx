import { useEffect, useMemo, useState, type FC } from "react";
import { useSpecStore } from "../store/spec-store";
import { loadSnapshotPayload } from "../store/snapshot-storage";
import { generatePrompt } from "../generators/prompt";
import { generateDiffPrompt } from "../generators/diff-prompt";
import { generateHtmlReport } from "../generators/html-report";

type OutputTab = "prompt" | "diff" | "html" | "json";

const TAB_LABELS: Record<OutputTab, string> = {
  prompt: "全量プロンプト",
  diff: "差分プロンプト",
  html: "HTMLレポート",
  json: "スペックJSON",
};

interface OutputDialogProps {
  onClose: () => void;
}

export const OutputDialog: FC<OutputDialogProps> = ({ onClose }) => {
  const document_ = useSpecStore((s) => s.document);
  const [tab, setTab] = useState<OutputTab>("prompt");
  const [copied, setCopied] = useState(false);
  const snapshots = document_.snapshots;
  const [baseSnapshotId, setBaseSnapshotId] = useState<string | null>(
    snapshots.length > 0 ? (snapshots[snapshots.length - 1]?.id ?? null) : null,
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const availableTabs = useMemo<OutputTab[]>(
    () =>
      document_.meta.mode === "report"
        ? ["prompt", "diff", "html", "json"]
        : ["prompt", "diff", "json"],
    [document_.meta.mode],
  );

  const content = useMemo(() => {
    if (tab === "prompt") return generatePrompt(document_);
    if (tab === "html") return generateHtmlReport(document_);
    if (tab === "json") return `${JSON.stringify(document_, null, 2)}\n`;
    // diff tab
    if (!baseSnapshotId) {
      return "基準となるスナップショットがありません。\nヘッダーの「📸 基準版を保存」で現在の状態を保存してから編集すると、差分プロンプトを生成できます。";
    }
    const ref = snapshots.find((s) => s.id === baseSnapshotId);
    const baseTree = loadSnapshotPayload(baseSnapshotId);
    if (!ref || !baseTree) {
      return "スナップショットの読み込みに失敗しました(削除された可能性があります)。";
    }
    return generateDiffPrompt(baseTree, document_, ref.label);
  }, [tab, document_, baseSnapshotId, snapshots]);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert(
        "クリップボードへのコピーに失敗しました。テキストを手動で選択してコピーしてください。",
      );
    }
  }

  function handleDownload(): void {
    const mime =
      tab === "json"
        ? "application/json;charset=utf-8"
        : tab === "html"
          ? "text/html;charset=utf-8"
          : "text/markdown;charset=utf-8";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const base = document_.meta.name || "spec";
    anchor.download =
      tab === "json"
        ? `${base}.uic.json`
        : tab === "html"
          ? `${base}.html`
          : `${base}-${tab === "diff" ? "diff" : "prompt"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="出力"
        className="flex max-h-full w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <div
            role="tablist"
            aria-label="出力形式"
            className="flex rounded-md bg-slate-100 p-0.5"
          >
            {availableTabs.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`rounded px-3 py-1 text-xs font-medium ${
                  tab === key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {TAB_LABELS[key]}
              </button>
            ))}
          </div>
          {tab === "diff" && snapshots.length > 0 && (
            <select
              value={baseSnapshotId ?? ""}
              onChange={(e) => setBaseSnapshotId(e.target.value)}
              aria-label="基準スナップショット"
              className="rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            >
              {snapshots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}({new Date(s.createdAt).toLocaleString("ja-JP")})
                </option>
              ))}
            </select>
          )}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              {copied ? "コピーしました ✓" : "コピー"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            >
              ダウンロード
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="閉じる"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </div>
        <pre className="flex-1 overflow-auto whitespace-pre-wrap p-4 text-xs leading-relaxed text-slate-800">
          {content}
        </pre>
      </div>
    </div>
  );
};
