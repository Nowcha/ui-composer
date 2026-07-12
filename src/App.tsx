import { useEffect, type FC } from "react";
import { useSpecStore } from "./store/spec-store";
import { CatalogPanel } from "./catalog/CatalogPanel";
import { CanvasPanel } from "./canvas/CanvasPanel";
import { InspectorPanel } from "./inspector/InspectorPanel";

const App: FC = () => {
  const mode = useSpecStore((s) => s.document.meta.mode);
  const name = useSpecStore((s) => s.document.meta.name);
  const setMode = useSpecStore((s) => s.setMode);
  const setDocumentName = useSpecStore((s) => s.setDocumentName);
  const undo = useSpecStore((s) => s.undo);
  const redo = useSpecStore((s) => s.redo);
  const canUndo = useSpecStore((s) => s.past.length > 0);
  const canRedo = useSpecStore((s) => s.future.length > 0);

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
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <CatalogPanel />
        <CanvasPanel />
        <InspectorPanel />
      </div>
    </div>
  );
};

export default App;
