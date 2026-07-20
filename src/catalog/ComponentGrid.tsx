/**
 * ComponentGrid — visual component palette.
 * Every entry shows a live miniature of the actual preview so users can
 * tell components apart at a glance. Drag to place (double-click is a
 * keyboard/quick fallback that appends to the selection or root).
 */

import { useMemo, useState, type FC } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { CatalogComponent, Category } from "../types/catalog";
import { CATEGORY_LABELS_JA } from "../types/catalog";
import { paletteDragId } from "../canvas/dnd-ids";
import { createNodeId, useSpecStore } from "../store/spec-store";
import { NodeRenderer } from "../preview/NodeRenderer";
import { SampleLines } from "../preview/parts";
import {
  buildDefaultProps,
  componentsForMode,
  matchesComponentQuery,
  resolveQuickAddParentId,
} from "./catalog-data";

/** Static thumbnail: the real renderer scaled down into a fixed frame. */
const Thumbnail: FC<{ component: CatalogComponent }> = ({ component }) => {
  const sampleNode = useMemo(
    () => ({
      id: `thumb-${component.id}`,
      type: component.id,
      props: buildDefaultProps(component),
    }),
    [component],
  );
  return (
    <div className="pointer-events-none flex h-[76px] items-center justify-center overflow-hidden rounded-t-lg bg-gradient-to-b from-slate-50 to-slate-100/60 [&_*]:[animation-play-state:paused]">
      <div className="flex w-[240px] shrink-0 origin-center scale-[0.58] justify-center">
        <NodeRenderer node={sampleNode}>
          {component.isContainer ? <SampleLines lines={2} /> : undefined}
        </NodeRenderer>
      </div>
    </div>
  );
};

const PaletteCard: FC<{
  component: CatalogComponent;
  onQuickAdd: (component: CatalogComponent) => void;
}> = ({ component, onQuickAdd }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: paletteDragId(component.id),
  });

  return (
    <li ref={setNodeRef} className={isDragging ? "opacity-40" : ""}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        onDoubleClick={() => onQuickAdd(component)}
        title={`${component.description}\n(ドラッグで配置 / ダブルクリックで末尾に追加)`}
        className="group w-full cursor-grab overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:border-blue-400 focus-visible:outline-none active:cursor-grabbing"
      >
        <Thumbnail component={component} />
        <span className="flex items-baseline justify-between gap-1 border-t border-slate-100 px-2 py-1.5">
          <span className="truncate text-xs font-medium text-slate-700">
            {component.nameJa}
          </span>
          {component.isContainer && (
            <span
              className="shrink-0 rounded bg-slate-100 px-1 text-[9px] text-slate-400"
              title="子要素を入れられます"
            >
              容器
            </span>
          )}
        </span>
      </button>
    </li>
  );
};

export const ComponentGrid: FC = () => {
  const [query, setQuery] = useState("");
  const mode = useSpecStore((s) => s.document.meta.mode);
  const addNode = useSpecStore((s) => s.addNode);
  const selectedNodeId = useSpecStore((s) => s.selectedNodeId);
  const tree = useSpecStore((s) => s.document.tree);

  const grouped = useMemo(() => {
    const forMode = componentsForMode(mode);
    const filtered = query.trim()
      ? forMode.filter((c) => matchesComponentQuery(c, query.trim()))
      : forMode;
    const groups = new Map<Category, CatalogComponent[]>();
    for (const c of filtered) {
      const list = groups.get(c.category) ?? [];
      groups.set(c.category, [...list, c]);
    }
    return groups;
  }, [query, mode]);

  function handleQuickAdd(component: CatalogComponent): void {
    const parentId = resolveQuickAddParentId(tree, selectedNodeId);
    addNode(parentId, {
      id: createNodeId(component.id),
      type: component.id,
      props: buildDefaultProps(component),
      ...(component.isContainer ? { children: [] } : {}),
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-3 pb-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="パーツを検索…"
          aria-label="コンポーネントを検索"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:border-blue-400 focus:bg-white focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {grouped.size === 0 && (
          <p className="px-1 py-4 text-sm text-slate-400">
            該当するパーツがありません
          </p>
        )}
        {[...grouped.entries()].map(([category, components]) => (
          <section key={category} className="mb-4">
            <h3 className="sticky top-0 z-10 -mx-1 mb-1.5 bg-white/95 px-1 py-1 text-[11px] font-semibold tracking-wide text-slate-400">
              {CATEGORY_LABELS_JA[category]}
              <span className="ml-1.5 font-normal text-slate-300">
                {components.length}
              </span>
            </h3>
            <ul className="grid grid-cols-2 gap-2">
              {components.map((component) => (
                <PaletteCard
                  key={component.id}
                  component={component}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="border-t border-slate-100 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
        キャンバスへ<strong className="text-slate-500">ドラッグ&ドロップ</strong>で配置
      </p>
    </div>
  );
};
