import { useState, type FC } from "react";
import type { PropDef } from "../types/catalog";
import type { ComponentNode } from "../types/spec";
import { useSpecStore } from "../store/spec-store";
import { findNode, findParent } from "../store/tree-utils";
import { getCatalogComponent } from "../catalog/catalog-data";
import { GRID_COLUMNS, getSpan, isGridFlow } from "../canvas/layout";
import { DocumentSettings } from "./DocumentSettings";
import { IconPicker } from "./IconPicker";

const WIDTH_PRESETS: { span: number; label: string }[] = [
  { span: 3, label: "1/4" },
  { span: 4, label: "1/3" },
  { span: 6, label: "1/2" },
  { span: 8, label: "2/3" },
  { span: 9, label: "3/4" },
  { span: 12, label: "全幅" },
];

/** Kintone-style width control: 12-column span presets + fine slider. */
const WidthField: FC<{ node: ComponentNode }> = ({ node }) => {
  const updateNodeById = useSpecStore((s) => s.updateNodeById);
  const span = getSpan(node);

  function setSpan(next: number): void {
    const props: Record<string, unknown> = { ...node.props };
    if (next >= GRID_COLUMNS) delete props.colSpan;
    else props.colSpan = next;
    updateNodeById(node.id, { props });
  }

  return (
    <section>
      <h4 className="mb-1.5 text-xs font-semibold text-slate-500">
        幅(12カラムグリッド)
      </h4>
      <div className="flex gap-1">
        {WIDTH_PRESETS.map((preset) => (
          <button
            key={preset.span}
            type="button"
            onClick={() => setSpan(preset.span)}
            aria-pressed={span === preset.span}
            className={`flex-1 rounded-md border px-1 py-1 text-[11px] ${
              span === preset.span
                ? "border-blue-500 bg-blue-50 font-medium text-blue-700"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="range"
          min={1}
          max={GRID_COLUMNS}
          value={span}
          onChange={(e) => setSpan(Number(e.target.value))}
          aria-label="幅(カラム数)"
          className="flex-1 accent-blue-600"
        />
        <span className="w-10 text-right text-xs tabular-nums text-slate-500">
          {span}/{GRID_COLUMNS}
        </span>
      </div>
    </section>
  );
};

interface PropFieldProps {
  def: PropDef;
  value: unknown;
  onChange: (value: unknown) => void;
}

const PropField: FC<PropFieldProps> = ({ def, value, onChange }) => {
  const inputId = `prop-${def.name}`;
  const base =
    "w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none";

  if (def.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
        />
        {def.name}
      </label>
    );
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1 block text-xs font-medium text-slate-500"
      >
        {def.name}
      </label>
      {def.type === "enum" ? (
        <select
          id={inputId}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        >
          {(def.enumValues ?? []).map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      ) : def.type === "number" ? (
        <input
          id={inputId}
          type="number"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className={base}
        />
      ) : (
        <input
          id={inputId}
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      )}
    </div>
  );
};

const NodeEditor: FC<{ node: ComponentNode }> = ({ node }) => {
  const updateNodeById = useSpecStore((s) => s.updateNodeById);
  const parentType = useSpecStore(
    (s) => findParent(s.document.tree, node.id)?.type ?? "root",
  );
  const catalogDef = getCatalogComponent(node.type);
  const [showIconPicker, setShowIconPicker] = useState(false);

  function setProp(name: string, value: unknown): void {
    updateNodeById(node.id, { props: { ...node.props, [name]: value } });
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          {catalogDef?.nameJa ?? node.type}
        </h3>
        <p className="mt-0.5 break-all text-xs text-slate-400">{node.id}</p>
        {catalogDef && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {catalogDef.description}
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-sm text-amber-900">
        <input
          type="checkbox"
          checked={node.frozen === true}
          onChange={(e) =>
            updateNodeById(node.id, { frozen: e.target.checked })
          }
        />
        🔒 凍結(AIに変更させない)
      </label>

      {isGridFlow(parentType) && <WidthField node={node} />}

      {catalogDef && catalogDef.typicalProps.length > 0 && (
        <section className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-slate-500">
            プロパティ
          </h4>
          {catalogDef.typicalProps.map((def) => (
            <PropField
              key={def.name}
              def={def}
              value={node.props[def.name]}
              onChange={(value) => setProp(def.name, value)}
            />
          ))}
        </section>
      )}

      <section>
        <h4 className="mb-1 text-xs font-semibold text-slate-500">アイコン</h4>
        <button
          type="button"
          onClick={() => setShowIconPicker(true)}
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
        >
          {node.icon
            ? `${node.icon.name} (${node.icon.weight})`
            : "アイコンを選択…"}
        </button>
        {showIconPicker && (
          <IconPicker
            current={node.icon}
            onSelect={(icon) => {
              updateNodeById(node.id, { icon });
              setShowIconPicker(false);
            }}
            onClear={() => {
              updateNodeById(node.id, { icon: undefined });
              setShowIconPicker(false);
            }}
            onClose={() => setShowIconPicker(false)}
          />
        )}
      </section>

      <section>
        <label
          htmlFor="behavior-memo"
          className="mb-1 block text-xs font-semibold text-slate-500"
        >
          挙動メモ(プロンプトに反映)
        </label>
        <textarea
          id="behavior-memo"
          rows={3}
          value={node.behavior ?? ""}
          onChange={(e) =>
            updateNodeById(node.id, { behavior: e.target.value })
          }
          placeholder="例: クリックで保存し、成功時はトースト表示"
          className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
      </section>

      {catalogDef && catalogDef.a11yNotes.length > 0 && (
        <section>
          <h4 className="mb-1 text-xs font-semibold text-slate-500">
            アクセシビリティ注意点
          </h4>
          <ul className="list-inside list-disc text-xs leading-relaxed text-slate-500">
            {catalogDef.a11yNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export const InspectorPanel: FC = () => {
  const tree = useSpecStore((s) => s.document.tree);
  const selectedNodeId = useSpecStore((s) => s.selectedNodeId);
  const node = selectedNodeId ? findNode(tree, selectedNodeId) : undefined;

  return (
    <aside
      aria-label="プロパティパネル"
      className="h-full w-72 overflow-y-auto border-l border-slate-200 bg-white"
    >
      {node ? <NodeEditor key={node.id} node={node} /> : <DocumentSettings />}
    </aside>
  );
};
