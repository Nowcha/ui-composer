import { useEffect, useRef, useState, type FC } from "react";
import { useSpecStore } from "./store/spec-store";
import { parseSpecDocument } from "./store/persistence";
import { importHtmlReport } from "./importers/html";
import { screenTemplates } from "./templates/screen-templates";
import { buildShareUrl } from "./store/url-share";
import { CatalogPanel } from "./catalog/CatalogPanel";
import { CanvasPanel } from "./canvas/CanvasPanel";
import { InspectorPanel } from "./inspector/InspectorPanel";
import { OutputDialog } from "./output/OutputDialog";
import { DndProvider } from "./canvas/DndProvider";

const App: FC = () => {
  const [showOutput, setShowOutput] = useState(false);
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
  const applyTemplate = useSpecStore((s) => s.applyTemplate);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleApplyTemplate(templateId: string): void {
    const template = screenTemplates.find((t) => t.id === templateId);
    if (!template) return;
    const { document } = useSpecStore.getState();
    const hasContent = (document.tree.children?.length ?? 0) > 0;
    if (
      hasContent &&
      !window.confirm(
        `テンプレート「${template.nameJa}」で現在のキャンバスを置き換えますか?(Ctrl+Zで戻せます)`,
      )
    ) {
      return;
    }
    applyTemplate(template.nodes, template.nameJa);
  }

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
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || e.key.toLowerCase() !== "z") return;
      // Don't hijack undo inside text fields
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-2">
        <h1 className="text-sm font-bold text-slate-800">UI Composer</h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setDocumentName(e.target.value)}
          aria-label="スペック名"
          className="rounded-md border border-transparent px-2 py-1 text-sm text-slate-600 hover:border-slate-300 focus:border-blue-500 focus:outline-none"
        />
        <nav aria-label="モード切替" className="flex rounded-md bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => setMode("ui")}
            aria-pressed={mode === "ui"}
            className={`rounded px-3 py-1 text-xs font-medium ${
              mode === "ui"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            UIモード
          </button>
          <button
            type="button"
            onClick={() => setMode("report")}
            aria-pressed={mode === "report"}
            className={`rounded px-3 py-1 text-xs font-medium ${
              mode === "report"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            レポートモード
          </button>
        </nav>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) handleApplyTemplate(e.target.value);
            e.target.value = "";
          }}
          aria-label="画面テンプレート"
          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="">テンプレート…</option>
          {screenTemplates.map((t) => (
            <option key={t.id} value={t.id} title={t.description}>
              {t.nameJa}
            </option>
          ))}
        </select>
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="元に戻す (Ctrl+Z)"
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            ← 戻す
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="やり直す (Ctrl+Shift+Z)"
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            進む →
          </button>
          <button
            type="button"
            onClick={handleSaveSnapshot}
            title="現在の状態を差分プロンプトの基準として保存"
            className="ml-2 rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
          >
            📸 基準版を保存
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
          >
            インポート
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            title="レイアウトをURLに埋め込んで共有"
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
          >
            共有
          </button>
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
            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            出力
          </button>
        </div>
      </header>
      {showOutput && <OutputDialog onClose={() => setShowOutput(false)} />}
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
