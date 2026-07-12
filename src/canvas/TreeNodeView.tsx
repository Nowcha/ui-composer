import type { FC } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ComponentNode } from "../types/spec";
import { useSpecStore } from "../store/spec-store";
import { useUiStore } from "../store/ui-store";
import { isContainerType, nodeLabel } from "../catalog/catalog-data";
import { intoDropId } from "./dnd-ids";

/** Drop zone that nests the dragged item INTO a container (vs. reordering). */
const IntoDropZone: FC<{ nodeId: string; depth: number; isEmpty: boolean }> = ({
  nodeId,
  depth,
  isEmpty,
}) => {
  const isDragging = useUiStore((s) => s.isDragging);
  const { setNodeRef, isOver } = useDroppable({ id: intoDropId(nodeId) });

  if (!isDragging && !isEmpty) return null;

  return (
    <div
      ref={setNodeRef}
      style={{ marginLeft: `${(depth + 1) * 16 + 8}px` }}
      className={`my-0.5 rounded border border-dashed px-2 py-1 text-xs ${
        isOver
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : "border-slate-300 text-slate-400"
      }`}
    >
      {isDragging ? "この中にドロップ" : "(空のコンテナ)"}
    </div>
  );
};

interface TreeNodeViewProps {
  node: ComponentNode;
  depth: number;
}

export const TreeNodeView: FC<TreeNodeViewProps> = ({ node, depth }) => {
  const selectedNodeId = useSpecStore((s) => s.selectedNodeId);
  const selectNode = useSpecStore((s) => s.selectNode);
  const isSelected = selectedNodeId === node.id;
  const isContainer = isContainerType(node.type);
  const children = node.children ?? [];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isThisDragging,
  } = useSortable({ id: node.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isThisDragging ? 0.4 : undefined,
      }}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => {
          e.stopPropagation();
          selectNode(node.id);
        }}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        className={`flex w-full cursor-grab items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-sm ${
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
          <span className="text-xs text-slate-400">({children.length})</span>
        )}
      </button>
      {isContainer && (
        <>
          <SortableContext
            items={children.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {children.map((child) => (
              <TreeNodeView key={child.id} node={child} depth={depth + 1} />
            ))}
          </SortableContext>
          <IntoDropZone
            nodeId={node.id}
            depth={depth}
            isEmpty={children.length === 0}
          />
        </>
      )}
    </div>
  );
};
