/**
 * IconGrid — visual icon palette (Phosphor, 1,500+ glyphs).
 * Icons render as actual glyphs (lazy-loaded chunk) and drag onto the
 * canvas as icon nodes. Searchable in English tags and Japanese
 * category words.
 */

import { useEffect, useMemo, useState, type FC } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { IconMeta } from "../types/catalog";
import type { PhosphorWeight } from "../types/spec";
import iconCategoriesJa from "../data/icon-categories-ja.json";
import { iconDragId } from "../canvas/dnd-ids";
import { createNodeId, useSpecStore } from "../store/spec-store";
import { LazyIcon } from "../preview/LazyIcon";
import { buildDefaultProps, getCatalogComponent } from "./catalog-data";

const WEIGHTS: PhosphorWeight[] = [
  "thin",
  "light",
  "regular",
  "bold",
  "fill",
  "duotone",
];
const MAX_RESULTS = 96;
const CATEGORY_JA = iconCategoriesJa as Record<string, string>;

const IconCell: FC<{
  icon: IconMeta;
  weight: PhosphorWeight;
  onQuickAdd: (name: string) => void;
}> = ({ icon, weight, onQuickAdd }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: iconDragId(icon.name, weight),
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onDoubleClick={() => onQuickAdd(icon.name)}
      title={`${icon.name}\n(ドラッグで配置 / ダブルクリックで追加)`}
      className={`flex aspect-square cursor-grab items-center justify-center rounded-lg border border-transparent text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:border-blue-400 focus-visible:outline-none active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <LazyIcon icon={{ name: icon.name, weight }} size={22} />
    </button>
  );
};

export const IconGrid: FC = () => {
  const [icons, setIcons] = useState<IconMeta[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [weight, setWeight] = useState<PhosphorWeight>("regular");
  const addNode = useSpecStore((s) => s.addNode);

  useEffect(() => {
    let cancelled = false;
    import("../data/icons.json")
      .then((module) => {
        if (!cancelled) setIcons(module.default as IconMeta[]);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    if (!icons) return [];
    const q = query.trim().toLowerCase();
    if (!q) return icons.slice(0, MAX_RESULTS);
    const jaCategories = Object.entries(CATEGORY_JA)
      .filter(([, ja]) => ja.includes(query.trim()))
      .map(([en]) => en);
    return icons
      .filter(
        (icon) =>
          icon.name.includes(q) ||
          icon.tags.some((t) => t.toLowerCase().includes(q)) ||
          icon.categories.some((c) => jaCategories.includes(c)),
      )
      .slice(0, MAX_RESULTS);
  }, [icons, query]);

  function handleQuickAdd(name: string): void {
    const def = getCatalogComponent("icon");
    addNode("root", {
      id: createNodeId("icon"),
      type: "icon",
      props: def ? buildDefaultProps(def) : {},
      icon: { name, weight },
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 p-3 pb-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="検索(英語タグ / 日本語カテゴリ)…"
          aria-label="アイコンを検索"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:border-blue-400 focus:bg-white focus:outline-none"
        />
        <select
          value={weight}
          onChange={(e) => setWeight(e.target.value as PhosphorWeight)}
          aria-label="ウェイト"
          className="rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
        >
          {WEIGHTS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loadFailed && (
          <p className="text-sm text-red-600">
            アイコン一覧の読み込みに失敗しました。
          </p>
        )}
        {!icons && !loadFailed && (
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 36 }, (_, i) => (
              <span
                key={i}
                className="aspect-square animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        )}
        {icons && results.length === 0 && (
          <p className="text-sm text-slate-400">該当するアイコンがありません</p>
        )}
        <div className="grid grid-cols-6 gap-1">
          {results.map((icon) => (
            <IconCell
              key={icon.name}
              icon={icon}
              weight={weight}
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </div>
        {icons && results.length === MAX_RESULTS && (
          <p className="mt-2 text-[11px] text-slate-400">
            先頭{MAX_RESULTS}件を表示中。キーワードで絞り込めます。
          </p>
        )}
      </div>
      <p className="border-t border-slate-100 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
        ドラッグでキャンバスへ。ボタン等に載せるアイコンは右パネルから設定
      </p>
    </div>
  );
};
