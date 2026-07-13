/**
 * LayersPanel — the document structure tree (Figma-style layers).
 * Selection and hover are two-way synced with the canvas; reordering
 * itself happens on the canvas via drag & drop.
 */

import { useState, type FC } from "react";
import type { ComponentNode } from "../types/spec";
import { useSpecStore } from "../store/spec-store";
import { useUiStore } from "../store/ui-store";
import { isContainerType, nodeLabel } from "./catalog-data";

const LayerRow: FC<{ node: ComponentNode; depth: number }> = ({
  node,
  depth,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const isSelected = useSpecStore((s) => s.selectedNodeId === node.id);
  const selectNode = useSpecStore((s) => s.selectNode);
  const removeNodeById = useSpecStore((s) => s.removeNodeById);
  const isHovered = useUiStore((s) => s.hoveredNodeId === node.id);
  const setHoveredNode = useUiStore((s) => s.setHoveredNode);

  const isContainer = isContainerType(node.type);
  const children = node.children ?? [];

  return (
    <div>
      <div
        role="treeitem"
        aria-selected={isSelected}
        onClick={() => selectNode(node.id)}
        onMouseOver={(e) => {
          e.stopPropagation();
          setHoveredNode(node.id);
        }}
        onMouseLeave={() => {
          if (isHovered) setHoveredNode(null);
        }}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        className={`group flex cursor-pointer items-center gap-1 rounded-md py-1 pr-1.5 text-sm ${
          isSelected
            ? "bg-blue-100 text-blue-900"
            : isHovered
              ? "bg-slate-100 text-slate-700"
              : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        {isContainer ? (
          <button
            type="button"
            aria-label={collapsed ? "展開" : "折りたたみ"}
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] text-slate-400 hover:bg-slate-200"
          >
            {collapsed ? "▶" : "▼"}
          </button>
        ) : (
          <span className="h-4 w-4 shrink-0 text-center text-[9px] leading-4 text-slate-300">
            ・
          </span>
        )}
        {node.frozen && <span aria-label="凍結中">🔒</span>}
        <span className="min-w-0 flex-1 truncate text-xs">
          {nodeLabel(node)}
        </span>
        {isContainer && (
          <span className="text-[10px] text-slate-300">{children.length}</span>
        )}
        <button
          type="button"
          aria-label="削除"
          title="削除"
          onClick={(e) => {
            e.stopPropagation();
            removeNodeById(node.id);
          }}
          className="hidden h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] text-slate-400 hover:bg-red-100 hover:text-red-600 group-hover:flex"
        >
          ✕
        </button>
      </div>
      {isContainer && !collapsed && (
        <div>
          {children.map((child) => (
            <LayerRow key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const LayersPanel: FC = () => {
  const tree = useSpecStore((s) => s.document.tree);
  const children = tree.children ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-2" role="tree" aria-label="レイヤー">
        {children.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs leading-relaxed text-slate-400">
            まだ何も配置されていません。
            <br />
            パーツタブからドラッグして始めましょう。
          </p>
        ) : (
          children.map((child) => (
            <LayerRow key={child.id} node={child} depth={0} />
          ))
        )}
      </div>
      <p className="border-t border-slate-100 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
        並べ替えはキャンバス上のドラッグで行えます
      </p>
    </div>
  );
};
