/**
 * CanvasNode — the interactive wrapper around a node's visual preview.
 *
 * Layers selection ring, hover outline, drag source, drop target, and
 * insertion-line indicators on top of NodeRenderer. The preview content
 * itself is inert (pointer-events-none); nested CanvasNodes re-enable
 * pointer events so the innermost element under the cursor wins.
 */

import type { FC } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { ComponentNode } from "../types/spec";
import { useSpecStore } from "../store/spec-store";
import { useUiStore } from "../store/ui-store";
import { getCatalogComponent, isContainerType } from "../catalog/catalog-data";
import { NodeRenderer } from "../preview/NodeRenderer";
import { isHorizontalFlow } from "./drop-resolver";

/** Insertion line shown while dragging (before/after the hovered node). */
const InsertLine: FC<{ edge: "before" | "after"; horizontal: boolean }> = ({
  edge,
  horizontal,
}) => (
  <span
    aria-hidden
    className={`pointer-events-none absolute z-30 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.7)] ${
      horizontal
        ? `inset-y-0 my-auto h-full w-1 ${edge === "before" ? "-left-1" : "-right-1"}`
        : `inset-x-0 mx-auto h-1 w-full ${edge === "before" ? "-top-1" : "-bottom-1"}`
    }`}
  />
);

/** Placeholder slot rendered inside empty containers. */
const EmptyContainerSlot: FC<{ highlighted: boolean }> = ({ highlighted }) => (
  <div
    className={`pointer-events-none flex min-h-14 w-full items-center justify-center rounded-md border border-dashed text-xs transition-colors ${
      highlighted
        ? "border-blue-400 bg-blue-50 text-blue-600"
        : "border-slate-200 bg-slate-50/50 text-slate-300"
    }`}
  >
    ここにドロップ
  </div>
);

/** Floating toolbar for the selected node (label / duplicate / delete). */
const SelectionToolbar: FC<{ node: ComponentNode }> = ({ node }) => {
  const duplicateNode = useSpecStore((s) => s.duplicateNode);
  const removeNodeById = useSpecStore((s) => s.removeNodeById);
  const label = getCatalogComponent(node.type)?.nameJa ?? node.type;

  return (
    <div className="pointer-events-auto absolute -top-6 left-0 z-40 flex items-stretch overflow-hidden rounded-md bg-blue-600 text-[11px] leading-none text-white shadow-md">
      <span className="flex items-center gap-1 px-2 py-1 font-medium">
        {node.frozen && <span aria-label="凍結中">🔒</span>}
        {label}
      </span>
      <button
        type="button"
        title="複製 (Ctrl+D)"
        onClick={(e) => {
          e.stopPropagation();
          duplicateNode(node.id);
        }}
        className="border-l border-blue-500 px-1.5 hover:bg-blue-700"
      >
        ⧉
      </button>
      <button
        type="button"
        title="削除 (Delete)"
        onClick={(e) => {
          e.stopPropagation();
          removeNodeById(node.id);
        }}
        className="border-l border-blue-500 px-1.5 hover:bg-red-600"
      >
        ✕
      </button>
    </div>
  );
};

interface CanvasNodeProps {
  node: ComponentNode;
  parentType: string;
}

export const CanvasNode: FC<CanvasNodeProps> = ({ node, parentType }) => {
  const isSelected = useSpecStore((s) => s.selectedNodeId === node.id);
  const selectNode = useSpecStore((s) => s.selectNode);
  const isHovered = useUiStore((s) => s.hoveredNodeId === node.id);
  const setHoveredNode = useUiStore((s) => s.setHoveredNode);
  const isDraggingAny = useUiStore((s) => s.isDragging);
  const indicator = useUiStore((s) =>
    s.dropIndicator?.nodeId === node.id ? s.dropIndicator : null,
  );

  const isContainer = isContainerType(node.type);
  const children = node.children ?? [];
  const horizontal = isHorizontalFlow(parentType);

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging: isThisDragging,
  } = useDraggable({ id: node.id });
  const { setNodeRef: setDropRef } = useDroppable({ id: node.id });

  const outline = isSelected
    ? "outline outline-2 outline-blue-500"
    : indicator?.position === "inside"
      ? "outline outline-2 outline-blue-400"
      : isHovered && !isDraggingAny
        ? "outline outline-1 outline-blue-300"
        : "";

  return (
    <div
      ref={(el) => {
        setDragRef(el);
        setDropRef(el);
      }}
      {...attributes}
      {...listeners}
      role="treeitem"
      aria-selected={isSelected}
      aria-label={getCatalogComponent(node.type)?.nameJa ?? node.type}
      tabIndex={-1}
      onClick={(e) => {
        e.stopPropagation();
        selectNode(node.id);
      }}
      onMouseOver={(e) => {
        e.stopPropagation();
        setHoveredNode(node.id);
      }}
      onMouseLeave={() => {
        if (isHovered) setHoveredNode(null);
      }}
      className={`pointer-events-auto relative cursor-grab rounded-sm outline-offset-1 focus-visible:outline-none ${
        horizontal ? "max-w-full" : "w-full"
      } ${outline} ${isThisDragging ? "opacity-30" : ""} ${
        indicator?.position === "inside" ? "bg-blue-50/40" : ""
      }`}
    >
      {indicator?.position === "before" && (
        <InsertLine edge="before" horizontal={horizontal} />
      )}
      {indicator?.position === "after" && (
        <InsertLine edge="after" horizontal={horizontal} />
      )}
      {isSelected && !isDraggingAny && <SelectionToolbar node={node} />}
      <div className="pointer-events-none">
        <NodeRenderer node={node}>
          {isContainer &&
            (children.length > 0
              ? children.map((child) => (
                  <CanvasNode
                    key={child.id}
                    node={child}
                    parentType={node.type}
                  />
                ))
              : [
                  <EmptyContainerSlot
                    key="empty"
                    highlighted={indicator?.position === "inside"}
                  />,
                ])}
        </NodeRenderer>
      </div>
    </div>
  );
};
