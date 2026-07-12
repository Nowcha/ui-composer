import { useEffect, useMemo, useState, type FC } from "react";
import { useSpecStore } from "../store/spec-store";
import { generatePrompt } from "../generators/prompt";

interface OutputDialogProps {
  onClose: () => void;
}

export const OutputDialog: FC<OutputDialogProps> = ({ onClose }) => {
  const document_ = useSpecStore((s) => s.document);
  const [copied, setCopied] = useState(false);
  const prompt = useMemo(() => generatePrompt(document_), [document_]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail on insecure contexts — fall back to selection
      window.alert(
        "クリップボードへのコピーに失敗しました。テキストを手動で選択してコピーしてください。",
      );
    }
  }

  function handleDownload(): void {
    const blob = new Blob([prompt], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${document_.meta.name || "spec"}-prompt.md`;
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
        aria-label="生成されたプロンプト"
        className="flex max-h-full w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Claude Code用プロンプト
          </h2>
          <div className="flex gap-2">
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
              .mdダウンロード
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
          {prompt}
        </pre>
      </div>
    </div>
  );
};
