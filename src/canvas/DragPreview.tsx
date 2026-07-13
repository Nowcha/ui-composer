/**
 * Drag overlay content — a live miniature of what is being dragged,
 * so the user sees the actual component instead of a text chip.
 */

import type { FC } from "react";
import { useSpecStore } from "../store/spec-store";
import { useUiStore } from "../store/ui-store";
import { findNode } from "../store/tree-utils";
import { getCatalogComponent } from "../catalog/catalog-data";
import { StaticNodeView } from "../preview/NodeRenderer";
import { LazyIcon } from "../preview/LazyIcon";
import { buildDropNode } from "./DndProvider";

export const DragPreview: FC = () => {
  const payload = useUiStore((s) => s.dragPayload);
  const tree = useSpecStore((s) => s.document.tree);
  if (!payload) return null;

  if (payload.kind === "icon") {
    return (
      <div className="pointer-events-none flex h-12 w-12 items-center justify-center rounded-lg border border-blue-300 bg-white/95 text-slate-700 shadow-xl">
        <LazyIcon
          icon={{ name: payload.name, weight: payload.weight }}
          size={26}
        />
      </div>
    );
  }

  const node =
    payload.kind === "node"
      ? findNode(tree, payload.nodeId)
      : (buildDropNode(payload) ?? undefined);
  if (!node) return null;

  const label =
    payload.kind === "component"
      ? getCatalogComponent(payload.componentId)?.nameJa
      : getCatalogComponent(node.type)?.nameJa;

  return (
    <div className="pointer-events-none w-72 opacity-95">
      <span className="mb-1 inline-block rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white shadow">
        {label ?? node.type}
      </span>
      <div className="max-h-48 overflow-hidden rounded-lg bg-white/95 p-2 shadow-2xl ring-2 ring-blue-400/70">
        <StaticNodeView node={node} />
      </div>
    </div>
  );
};
