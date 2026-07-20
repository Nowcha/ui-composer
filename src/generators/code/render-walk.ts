/**
 * Shared SpecTree → JSX-lines walker used by every code adapter.
 * Adapters supply per-type renderers plus a fallback for uncovered types;
 * frozen / behavior / RawBlock handling stays identical across libraries.
 */

import type { ComponentNode } from "../../types/spec";
import { RAW_BLOCK_TYPE } from "../../types/spec";
import type { NodeRenderer, RenderChildren } from "./node-renderers";
import { indent } from "./emit-utils";

export interface TreeRenderer {
  renderNode: (node: ComponentNode, depth: number) => string[];
  renderChildren: RenderChildren;
}

export function createTreeRenderer(
  renderers: Record<string, NodeRenderer>,
  fallback: NodeRenderer,
): TreeRenderer {
  function renderNode(node: ComponentNode, depth: number): string[] {
    const lines: string[] = [];
    if (node.frozen) {
      lines.push(`${indent(depth)}{/* 🔒 この要素は変更禁止(凍結) */}`);
    }
    if (node.behavior) {
      lines.push(`${indent(depth)}{/* TODO(挙動): ${node.behavior} */}`);
    }

    if (node.type === RAW_BLOCK_TYPE) {
      lines.push(
        `${indent(depth)}{/* RawBlock ${node.id}: 元HTMLを変更せず移植すること */}`,
        `${indent(depth)}<div data-uic-id="${node.id}" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(node.raw ?? "")} }} />`,
      );
      return lines;
    }

    const renderer = renderers[node.type] ?? fallback;
    lines.push(...renderer(node, depth, renderChildren));
    return lines;
  }

  function renderChildren(node: ComponentNode, depth: number): string[] {
    return (node.children ?? []).flatMap((child) => renderNode(child, depth));
  }

  return { renderNode, renderChildren };
}
