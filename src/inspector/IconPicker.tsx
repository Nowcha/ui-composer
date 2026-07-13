import { useEffect, useMemo, useState, type FC } from "react";
import type { IconMeta } from "../types/catalog";
import type { IconRef, PhosphorWeight } from "../types/spec";
import iconCategoriesJa from "../data/icon-categories-ja.json";
import { LazyIcon } from "../preview/LazyIcon";

const WEIGHTS: PhosphorWeight[] = [
  "thin",
  "light",
  "regular",
  "bold",
  "fill",
  "duotone",
];
const MAX_RESULTS = 100;

const CATEGORY_JA = iconCategoriesJa as Record<string, string>;

interface IconPickerProps {
  current?: IconRef;
  onSelect: (icon: IconRef) => void;
  onClear: () => void;
  onClose: () => void;
}

/**
 * Icon search dialog. icons.json (1,512 entries) is intentionally NOT
 * in the main bundle — it is dynamically imported when first opened.
 */
export const IconPicker: FC<IconPickerProps> = ({
  current,
  onSelect,
  onClear,
  onClose,
}) => {
  const [icons, setIcons] = useState<IconMeta[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [weight, setWeight] = useState<PhosphorWeight>(
    current?.weight ?? "regular",
  );

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
    // JA category words resolve to their English category first
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="アイコンを選択"
        className="flex max-h-[70vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slate-200 p-3">
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="アイコン名・タグ・カテゴリ(日本語可)で検索…"
            aria-label="アイコンを検索"
            className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <select
            value={weight}
            onChange={(e) => setWeight(e.target.value as PhosphorWeight)}
            aria-label="ウェイト"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
          >
            {WEIGHTS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loadFailed && (
            <p className="text-sm text-red-600">
              アイコン一覧の読み込みに失敗しました。
            </p>
          )}
          {!icons && !loadFailed && (
            <p className="text-sm text-slate-400">読み込み中…(初回のみ)</p>
          )}
          {icons && results.length === 0 && (
            <p className="text-sm text-slate-400">該当するアイコンがありません</p>
          )}
          <ul className="grid grid-cols-8 gap-1">
            {results.map((icon) => (
              <li key={icon.name}>
                <button
                  type="button"
                  onClick={() => onSelect({ name: icon.name, weight })}
                  title={`${icon.name}\n${icon.tags.slice(0, 6).join(", ")}`}
                  className={`flex aspect-square w-full items-center justify-center rounded-md border ${
                    current?.name === icon.name
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <LazyIcon icon={{ name: icon.name, weight }} size={22} />
                </button>
              </li>
            ))}
          </ul>
          {icons && results.length === MAX_RESULTS && (
            <p className="mt-2 text-xs text-slate-400">
              先頭{MAX_RESULTS}件を表示中。キーワードでさらに絞り込めます。
            </p>
          )}
        </div>
        <div className="flex justify-between border-t border-slate-200 p-3">
          <span className="text-xs text-slate-400">
            {current ? `現在: ${current.name} (${current.weight})` : "未設定"}
          </span>
          {current && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-md border border-red-300 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50"
            >
              アイコンを外す
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
