/**
 * TemplateList — screen templates with live miniature previews.
 * Applying replaces the canvas (undoable, confirmed when content exists).
 */

import type { FC } from "react";
import { screenTemplates, type ScreenTemplate } from "../templates/screen-templates";
import { useSpecStore } from "../store/spec-store";
import { StaticNodeView } from "../preview/NodeRenderer";

const TemplateCard: FC<{ template: ScreenTemplate }> = ({ template }) => {
  const applyTemplate = useSpecStore((s) => s.applyTemplate);

  function handleApply(): void {
    const { document } = useSpecStore.getState();
    const hasContent = (document.tree.children?.length ?? 0) > 0;
    if (
      hasContent &&
      !window.confirm(
        `テンプレート「${template.nameJa}」で現在のキャンバスを置き換えますか?(Ctrl+Zで戻せます)`,
      )
    ) {
      return;
    }
    applyTemplate(template.nodes, template.nameJa);
  }

  return (
    <li>
      <button
        type="button"
        onClick={handleApply}
        className="group w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:border-blue-400 focus-visible:outline-none"
      >
        <div className="pointer-events-none relative h-36 overflow-hidden bg-slate-50">
          <div className="w-[640px] origin-top-left scale-[0.38] p-4">
            <div className="flex flex-col gap-3">
              {template.nodes.map((node) => (
                <StaticNodeView key={node.id} node={node} />
              ))}
            </div>
          </div>
          <span className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
        </div>
        <div className="border-t border-slate-100 px-3 py-2">
          <p className="text-sm font-medium text-slate-700 group-hover:text-blue-700">
            {template.nameJa}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
            {template.description}
          </p>
        </div>
      </button>
    </li>
  );
};

export const TemplateList: FC = () => (
  <div className="flex h-full flex-col">
    <div className="flex-1 overflow-y-auto p-3">
      <ul className="flex flex-col gap-3">
      {screenTemplates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
      </ul>
    </div>
    <p className="border-t border-slate-100 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
      クリックで適用(Ctrl+Zで元に戻せます)。適用後は自由に編集できます
    </p>
  </div>
);
