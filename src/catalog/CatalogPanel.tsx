import { useMemo, useState, type FC } from "react";
import type { CatalogComponent, Category } from "../types/catalog";
import { CATEGORY_LABELS_JA } from "../types/catalog";
import { createNodeId, useSpecStore } from "../store/spec-store";
import {
  buildDefaultProps,
  catalogComponents,
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

export const CatalogPanel: FC = () => {
  const [query, setQuery] = useState("");
  const addNode = useSpecStore((s) => s.addNode);
  const selectedNodeId = useSpecStore((s) => s.selectedNodeId);
  const tree = useSpecStore((s) => s.document.tree);

  const grouped = useMemo(() => {
    const filtered = query.trim()
      ? catalogComponents.filter((c) => matches(c, query.trim()))
      : catalogComponents;
    const groups = new Map<Category, CatalogComponent[]>();
    for (const c of filtered) {
      const list = groups.get(c.category) ?? [];
      groups.set(c.category, [...list, c]);
    }
    return groups;
  }, [query]);

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
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => handleAdd(c)}
                    title={c.description}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none"
                  >
                    <span>{c.nameJa}</span>
                    <span className="text-xs text-slate-400">{c.name}</span>
                  </button>
                </li>
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
