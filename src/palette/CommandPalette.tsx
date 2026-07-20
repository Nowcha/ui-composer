/**
 * Command palette (Ctrl/Cmd+K): search-and-place, no drag required.
 * additional-features.md #9 — reuses the same matching/insertion logic
 * as ComponentGrid's double-click quick-add for consistent placement.
 */

import { useEffect, useMemo, useRef, useState, type FC } from "react";
import type { CatalogComponent } from "../types/catalog";
import { createNodeId, useSpecStore } from "../store/spec-store";
import {
  buildDefaultProps,
  componentsForMode,
  matchesComponentQuery,
  resolveQuickAddParentId,
} from "../catalog/catalog-data";

interface CommandPaletteProps {
  onClose: () => void;
}

export const CommandPalette: FC<CommandPaletteProps> = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const mode = useSpecStore((s) => s.document.meta.mode);
  const tree = useSpecStore((s) => s.document.tree);
  const selectedNodeId = useSpecStore((s) => s.selectedNodeId);
  const addNode = useSpecStore((s) => s.addNode);

  const results = useMemo(() => {
    const forMode = componentsForMode(mode);
    const q = query.trim();
    return q
      ? forMode.filter((c) => matchesComponentQuery(c, q)).slice(0, 30)
      : forMode.slice(0, 30);
  }, [mode, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function place(component: CatalogComponent): void {
    const parentId = resolveQuickAddParentId(tree, selectedNodeId);
    addNode(parentId, {
      id: createNodeId(component.id),
      type: component.id,
      props: buildDefaultProps(component),
      ...(component.isContainer ? { children: [] } : {}),
    });
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) place(target);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 pt-[15vh]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="コマンドパレット"
        className="flex max-h-[60vh] w-full max-w-md flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="パーツを検索して配置(↑↓で選択、Enterで配置)"
          aria-label="コマンドパレット検索"
          className="border-b border-slate-200 px-4 py-3 text-sm focus:outline-none"
        />
        <ul ref={listRef} role="listbox" className="flex-1 overflow-y-auto p-1.5">
          {results.length === 0 && (
            <li className="px-3 py-4 text-center text-xs text-slate-400">
              該当するパーツがありません
            </li>
          )}
          {results.map((component, index) => (
            <li key={component.id} data-index={index}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => place(component)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${
                  index === activeIndex
                    ? "bg-blue-50 text-blue-900"
                    : "text-slate-700"
                }`}
              >
                <span>{component.nameJa}</span>
                <span className="text-xs text-slate-400">{component.id}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
