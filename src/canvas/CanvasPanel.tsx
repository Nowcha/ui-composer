import type { FC } from "react";
import { useSpecStore } from "../store/spec-store";
import { TreeNodeView } from "./TreeNodeView";

export const CanvasPanel: FC = () => {
  const tree = useSpecStore((s) => s.document.tree);
  const selectedNodeId = useSpecStore((s) => s.selectedNodeId);
  const selectNode = useSpecStore((s) => s.selectNode);
  const removeNodeById = useSpecStore((s) => s.removeNodeById);
  const duplicateNode = useSpecStore((s) => s.duplicateNode);

  const isEmpty = (tree.children?.length ?? 0) === 0;

  return (
    <main
      aria-label="キャンバス"
      className="flex h-full flex-1 flex-col bg-slate-50"
      onClick={() => selectNode(null)}
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <h2 className="text-sm font-semibold text-slate-700">
          ツリービュー
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!selectedNodeId}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedNodeId) duplicateNode(selectedNodeId);
            }}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            複製
          </button>
          <button
            type="button"
            disabled={!selectedNodeId}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedNodeId) removeNodeById(selectedNodeId);
            }}
            className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-40"
          >
            削除
          </button>
        </div>
      </div>
      <div
        className="flex-1 overflow-y-auto p-3"
        onClick={(e) => e.stopPropagation()}
      >
        {isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <p className="max-w-xs text-center text-sm leading-relaxed text-slate-400">
              左のカタログからコンポーネントをクリックして追加してください。
              コンテナ(カード等)を選択中に追加すると、その中に配置されます。
            </p>
          </div>
        ) : (
          tree.children?.map((child) => (
            <TreeNodeView key={child.id} node={child} depth={0} />
          ))
        )}
      </div>
    </main>
  );
};
