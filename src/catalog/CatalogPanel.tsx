import { useMemo, useState, type FC } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { CatalogComponent, Category } from "../types/catalog";
import { paletteDragId } from "../canvas/dnd-ids";
import { CATEGORY_LABELS_JA } from "../types/catalog";
import { createNodeId, useSpecStore } from "../store/spec-store";
import {
  buildDefaultProps,
  componentsForMode,
  isContainerType,
} from "./catalog-data";
import { findNode } from "../store/tree-utils";

function matches(component: CatalogComponent, query: string): boolean {
  const q = query.toLowerCase();
  return (
    component.name.toLowerCase().includes(q) ||
    component.nameJa.includes(query) ||
    component.id.includes(q) ||
    component.aliases.some((a) => a.toLowerCase().includes(q))
  );
}

/** Palette entry: draggable to the canvas, clickable for quick add. */
const PaletteItem: FC<{
  component: CatalogComponent;
  onAdd: () => void;
}> = ({ component, onAdd }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: paletteDragId(component.id),
  });

  return (
    <li ref={setNodeRef}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={onAdd}
        title={component.description}
        className="flex w-full cursor-grab items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none"
      >
        <span>{component.nameJa}</span>
        <span className="text-xs text-slate-400">{component.name}</span>
      </button>
    </li>
  );
};

export const CatalogPanel: FC = () => {
  const [query, setQuery] = useState("");
  const addNode = useSpecStore((s) => s.addNode);
  const selectedNodeId = useSpecStore((s) => s.selectedNodeId);
  const tree = useSpecStore((s) => s.document.tree);
  const mode = useSpecStore((s) => s.document.meta.mode);

  const grouped = useMemo(() => {
    const forMode = componentsForMode(mode);
    const filtered = query.trim()
      ? forMode.filter((c) => matches(c, query.trim()))
      : forMode;
    const groups = new Map<Category, CatalogComponent[]>();
    for (const c of filtered) {
      const list = groups.get(c.category) ?? [];
      groups.set(c.category, [...list, c]);
    }
    return groups;
  }, [query, mode]);

  function handleAdd(component: CatalogComponent): void {
    // Drop into the selected container when possible, otherwise the root.
    const selected = selectedNodeId
      ? findNode(tree, selectedNodeId)
      : undefined;
    const parentId =
      selected && isContainerType(selected.type) ? selected.id : "root";
    addNode(parentId, {
      id: createNodeId(component.id),
      type: component.id,
      props: buildDefaultProps(component),
      ...(component.isContainer ? { children: [] } : {}),
    });
  }

  return (
    <aside
      aria-label="コンポーネントカタログ"
      className="flex h-full w-64 flex-col border-r border-slate-200 bg-white"
    >
      <div className="border-b border-slate-200 p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="コンポーネントを検索…"
          aria-label="コンポーネントを検索"
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {grouped.size === 0 && (
          <p className="px-2 py-4 text-sm text-slate-500">
            該当するコンポーネントがありません
          </p>
        )}
        {[...grouped.entries()].map(([category, components]) => (
          <section key={category} className="mb-3">
            <h3 className="px-2 py-1 text-xs font-semibold text-slate-500">
              {CATEGORY_LABELS_JA[category]}
            </h3>
            <ul>
              {components.map((c) => (
                <PaletteItem
                  key={c.id}
                  component={c}
                  onAdd={() => handleAdd(c)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="border-t border-slate-200 p-2 text-xs text-slate-400">
        クリックでキャンバスに追加
      </p>
    </aside>
  );
};
