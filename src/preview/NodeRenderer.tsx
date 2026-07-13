/**
 * NodeRenderer — resolves a ComponentNode to its visual preview.
 *
 * One registry serves three consumers: the WYSIWYG canvas, catalog
 * thumbnails, and the drag overlay. Renderers are pure presentation;
 * interactivity (selection, dnd) is layered on by the caller.
 */

import type { FC, ReactNode } from "react";
import type { ComponentNode } from "../types/spec";
import { RAW_BLOCK_TYPE } from "../types/spec";
import type { PreviewRenderer } from "./parts";
import { actionRenderers } from "./renderers/action";
import { inputBasicRenderers } from "./renderers/input-basic";
import { inputAdvancedRenderers } from "./renderers/input-advanced";
import { displayBasicRenderers } from "./renderers/display-basic";
import { displayDataRenderers } from "./renderers/display-data";
import { feedbackRenderers } from "./renderers/feedback";
import { navigationRenderers } from "./renderers/navigation";
import { layoutRenderers } from "./renderers/layout";
import { overlayMediaRenderers } from "./renderers/overlay-media";

const registry: Record<string, PreviewRenderer> = {
  ...actionRenderers,
  ...inputBasicRenderers,
  ...inputAdvancedRenderers,
  ...displayBasicRenderers,
  ...displayDataRenderers,
  ...feedbackRenderers,
  ...navigationRenderers,
  ...layoutRenderers,
  ...overlayMediaRenderers,
};

export function hasRenderer(type: string): boolean {
  return type in registry;
}

const RawBlockPreview: FC<{ node: ComponentNode }> = ({ node }) => (
  <div className="w-full rounded-lg border border-dashed border-violet-300 bg-violet-50/50 px-3 py-2">
    <p className="text-xs font-medium text-violet-600">Rawブロック(非破壊)</p>
    <p className="mt-0.5 max-h-10 overflow-hidden font-mono text-[10px] leading-relaxed text-violet-400">
      {(node.raw ?? "").slice(0, 160) || "<div>…</div>"}
    </p>
  </div>
);

const FallbackPreview: FC<{ node: ComponentNode }> = ({ node }) => (
  <div className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2">
    <span className="text-xs font-medium text-slate-500">{node.type}</span>
    <span className="text-[10px] text-slate-400">プレビュー未対応</span>
  </div>
);

interface NodeRendererProps {
  node: ComponentNode;
  /** Pre-rendered children for container types. */
  children?: ReactNode;
}

export const NodeRenderer: FC<NodeRendererProps> = ({ node, children }) => {
  if (node.type === RAW_BLOCK_TYPE) return <RawBlockPreview node={node} />;
  const Renderer = registry[node.type];
  if (!Renderer) return <FallbackPreview node={node} />;
  return <Renderer node={node}>{children}</Renderer>;
};

/** Recursive static render (thumbnails, drag overlays, template previews). */
export const StaticNodeView: FC<{ node: ComponentNode }> = ({ node }) => (
  <NodeRenderer node={node}>
    {node.children?.map((child) => (
      <StaticNodeView key={child.id} node={child} />
    ))}
  </NodeRenderer>
);
