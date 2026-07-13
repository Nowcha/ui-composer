/**
 * CatalogPanel — left sidebar with four tabs:
 * parts (visual palette) / icons / templates / layers.
 */

import type { FC } from "react";
import { useUiStore, type LeftTab } from "../store/ui-store";
import { ComponentGrid } from "./ComponentGrid";
import { IconGrid } from "./IconGrid";
import { TemplateList } from "./TemplateList";
import { LayersPanel } from "./LayersPanel";

const TABS: { id: LeftTab; label: string; icon: string }[] = [
  { id: "parts", label: "パーツ", icon: "◫" },
  { id: "icons", label: "アイコン", icon: "✦" },
  { id: "templates", label: "テンプレ", icon: "▤" },
  { id: "layers", label: "レイヤー", icon: "≡" },
];

export const CatalogPanel: FC = () => {
  const leftTab = useUiStore((s) => s.leftTab);
  const setLeftTab = useUiStore((s) => s.setLeftTab);

  return (
    <aside
      aria-label="カタログ"
      className="flex h-full w-[300px] shrink-0 flex-col border-r border-slate-200 bg-white"
    >
      <nav
        className="flex border-b border-slate-200"
        role="tablist"
        aria-label="カタログタブ"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={leftTab === tab.id}
            onClick={() => setLeftTab(tab.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 border-b-2 px-1 py-2 text-[11px] transition-colors ${
              leftTab === tab.id
                ? "border-blue-600 font-medium text-blue-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <span aria-hidden className="text-sm leading-none">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="min-h-0 flex-1">
        {leftTab === "parts" && <ComponentGrid />}
        {leftTab === "icons" && <IconGrid />}
        {leftTab === "templates" && <TemplateList />}
        {leftTab === "layers" && <LayersPanel />}
      </div>
    </aside>
  );
};
