import { useEffect, useRef, useState, type FC } from "react";
import { useSpecStore } from "./store/spec-store";
import { parseSpecDocument } from "./store/persistence";
import { importHtmlReport } from "./importers/html";
import { buildShareUrl } from "./store/url-share";
import { CatalogPanel } from "./catalog/CatalogPanel";
import { CanvasPanel } from "./canvas/CanvasPanel";
import { InspectorPanel } from "./inspector/InspectorPanel";
import { OutputDialog } from "./output/OutputDialog";
import { FlowDialog } from "./flow/FlowDialog";
import { DndProvider } from "./canvas/DndProvider";

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

const HeaderButton: FC<{
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
  >
    {children}
  </button>
);

const App: FC = () => {
  const [showOutput, setShowOutput] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const mode = useSpecStore((s) => s.document.meta.mode);
  const name = useSpecStore((s) => s.document.meta.name);
  const setMode = useSpecStore((s) => s.setMode);
  const setDocumentName = useSpecStore((s) => s.setDocumentName);
  const undo = useSpecStore((s) => s.undo);
  const redo = useSpecStore((s) => s.redo);
  const canUndo = useSpecStore((s) => s.past.length > 0);
  const canRedo = useSpecStore((s) => s.future.length > 0);
  const saveSnapshot = useSpecStore((s) => s.saveSnapshot);
  const loadDocument = useSpecStore((s) => s.loadDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleShare(): Promise<void> {
    const url = buildShareUrl(useSpecStore.getState().document);
    try {
      await navigator.clipboard.writeText(url);
      window.alert("共有URLをコピーしました(開くと同じレイアウトが再現されます)");
    } catch {
      window.prompt("以下のURLをコピーしてください:", url);
    }
  }

  function handleSaveSnapshot(): void {
    const label = `基準版 ${new Date().toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    if (saveSnapshot(label)) {
      window.alert(`スナップショット「${label}」を保存しました`);
    } else {
      window.alert(
        "スナップショットの保存に失敗しました(localStorageの容量不足の可能性)",
      );
    }
  }

  async function handleImportFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      const isHtml = /\.html?$/i.test(file.name);
      const doc = isHtml ? importHtmlReport(text) : parseSpecDocument(text);
      if (!doc) {
        window.alert(
          "インポートに失敗しました。UI Composer形式のJSONではありません。",
        );
        return;
      }
      loadDocument(doc);
      // Design v2 §4: create the diff baseline right after import
      saveSnapshot("インポート基準版");
    } catch {
      window.alert("ファイルの読み込みに失敗しました。");
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (isEditableTarget(e.target)) return;
      const isMod = e.metaKey || e.ctrlKey;
      const state = useSpecStore.getState();

      if (isMod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (isMod && e.key.toLowerCase() === "d" && state.selectedNodeId) {
        e.preventDefault();
        state.duplicateNode(state.selectedNodeId);
        return;
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        state.selectedNodeId
      ) {
        e.preventDefault();
        state.removeNodeById(state.selectedNodeId);
        return;
      }
      if (e.key === "Escape") {
        state.selectNode(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2">
        <h1 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
          <span
            aria-hidden
            className="inline-block h-4 w-4 rounded bg-gradient-to-br from-blue-500 to-indigo-600"
          />
          UI Composer
        </h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setDocumentName(e.target.value)}
          aria-label="スペック名"
          className="w-44 rounded-md border border-transparent px-2 py-1 text-sm text-slate-600 hover:border-slate-200 focus:border-blue-400 focus:outline-none"
        />
        <nav aria-label="モード切替" className="flex rounded-lg bg-slate-100 p-0.5">
          {(
            [
              ["ui", "UIモード"],
              ["report", "レポートモード"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                mode === value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <HeaderButton onClick={undo} disabled={!canUndo} title="元に戻す (Ctrl+Z)">
            ↶
          </HeaderButton>
          <HeaderButton
            onClick={redo}
            disabled={!canRedo}
            title="やり直す (Ctrl+Shift+Z)"
          >
            ↷
          </HeaderButton>
          <span className="mx-1 h-4 w-px bg-slate-200" aria-hidden />
          <HeaderButton
            onClick={handleSaveSnapshot}
            title="現在の状態を差分プロンプトの基準として保存"
          >
            📸 基準版
          </HeaderButton>
          <HeaderButton onClick={() => fileInputRef.current?.click()}>
            インポート
          </HeaderButton>
          <HeaderButton
            onClick={() => void handleShare()}
            title="レイアウトをURLに埋め込んで共有"
          >
            共有
          </HeaderButton>
          <HeaderButton
            onClick={() => setShowFlow(true)}
            title="画面遷移図を編集(Mermaidとして出力に自動挿入)"
          >
            遷移図
          </HeaderButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.html,.htm,application/json,text/html"
            className="hidden"
            aria-label="スペックJSONをインポート"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => setShowOutput(true)}
            className="ml-1 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            出力
          </button>
        </div>
      </header>
      {showOutput && <OutputDialog onClose={() => setShowOutput(false)} />}
      {showFlow && <FlowDialog onClose={() => setShowFlow(false)} />}
      <DndProvider>
        <div className="flex min-h-0 flex-1">
          <CatalogPanel />
          <CanvasPanel />
          <InspectorPanel />
        </div>
      </DndProvider>
    </div>
  );
};

export default App;
