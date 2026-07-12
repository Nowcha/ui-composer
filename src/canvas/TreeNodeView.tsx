import type { FC } from "react";
import type { ComponentNode } from "../types/spec";
import { useSpecStore } from "../store/spec-store";
import { isContainerType, nodeLabel } from "../catalog/catalog-data";

interface TreeNodeViewProps {
  node: ComponentNode;
  depth: number;
}

export const TreeNodeView: FC<TreeNodeViewProps> = ({ node, depth }) => {
  const selectedNodeId = useSpecStore((s) => s.selectedNodeId);
  const selectNode = useSpecStore((s) => s.selectNode);
  const isSelected = selectedNodeId === node.id;
  const isContainer = isContainerType(node.type);

  return (
    <div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          selectNode(node.id);
        }}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        className={`flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-sm ${
          isSelected
            ? "bg-blue-100 text-blue-900"
            : "hover:bg-slate-100 focus-visible:bg-slate-100"
        } focus-visible:outline-none`}
      >
        {node.frozen && (
          <span title="凍結中(変更禁止)" aria-label="凍結中">
            🔒
          </span>
        )}
        <span className="truncate">{nodeLabel(node)}</span>
        {isContainer && (
          <span className="text-xs text-slate-400">
            ({node.children?.length ?? 0})
          </span>
        )}
      </button>
      {node.children?.map((child) => (
        <TreeNodeView key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
};
