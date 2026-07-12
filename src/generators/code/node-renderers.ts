/**
 * Per-component JSX emitters for the plain-tailwind adapter.
 * Wireframe fidelity: a correct, dependency-free starting point —
 * the generated prompt remains the primary output (design v2 §1).
 */

import type { ComponentNode } from "../../types/spec";
import {
  indent,
  jsxText,
  listProp,
  num,
  pascalCase,
  str,
} from "./emit-utils";

type RenderChildren = (node: ComponentNode, depth: number) => string[];

export type NodeRenderer = (
  node: ComponentNode,
  depth: number,
  children: RenderChildren,
) => string[];

function uic(node: ComponentNode): string {
  return `data-uic-id="${node.id}"`;
}

function iconJsx(node: ComponentNode): string {
  if (!node.icon) return "";
  return `<${pascalCase(node.icon.name)} size={16} weight="${node.icon.weight}" aria-hidden="true" /> `;
}

const BUTTON_VARIANTS: Record<string, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300",
  outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const ALERT_TONES: Record<string, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

function labeledField(
  node: ComponentNode,
  depth: number,
  control: string[],
): string[] {
  const i = indent(depth);
  return [
    `${i}<label className="block" ${uic(node)}>`,
    `${i}  <span className="mb-1 block text-sm font-medium text-slate-700">${jsxText(
      str(node.props.label, "ラベル"),
    )}</span>`,
    ...control.map((line) => `${i}  ${line}`),
    `${i}</label>`,
  ];
}

export const NODE_RENDERERS: Record<string, NodeRenderer> = {
  button: (node, depth) => {
    const variant = str(node.props.variant, "primary");
    return [
      `${indent(depth)}<button type="button" className="rounded-md px-4 py-2 text-sm font-medium ${
        BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary
      }" ${uic(node)}>${iconJsx(node)}${jsxText(str(node.props.label, "ボタン"))}</button>`,
    ];
  },

  link: (node, depth) => [
    `${indent(depth)}<a href="${str(node.props.href, "#")}" className="text-sm text-blue-600 underline hover:text-blue-800" ${uic(node)}>${iconJsx(node)}${jsxText(str(node.props.label, "リンク"))}</a>`,
  ],

  "text-input": (node, depth) =>
    labeledField(node, depth, [
      `<input type="${str(node.props.inputType, "text")}"${
        node.props.required === true ? " required" : ""
      } placeholder="${str(node.props.placeholder)}" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />`,
    ]),

  textarea: (node, depth) =>
    labeledField(node, depth, [
      `<textarea rows={${num(node.props.rows, 4)}} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />`,
    ]),

  select: (node, depth) =>
    labeledField(node, depth, [
      `<select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">`,
      ...listProp(node.props.options).map(
        (option) => `  <option>${jsxText(option)}</option>`,
      ),
      `</select>`,
    ]),

  checkbox: (node, depth) => [
    `${indent(depth)}<label className="flex items-center gap-2 text-sm text-slate-700" ${uic(node)}>`,
    `${indent(depth)}  <input type="checkbox" className="rounded border-slate-300" />`,
    `${indent(depth)}  ${jsxText(str(node.props.label, "チェック"))}`,
    `${indent(depth)}</label>`,
  ],

  "radio-button": (node, depth) => {
    const i = indent(depth);
    return [
      `${i}<fieldset ${uic(node)}>`,
      `${i}  <legend className="mb-1 text-sm font-medium text-slate-700">${jsxText(str(node.props.label, "選択"))}</legend>`,
      ...listProp(node.props.options).flatMap((option) => [
        `${i}  <label className="flex items-center gap-2 text-sm text-slate-700">`,
        `${i}    <input type="radio" name="${node.id}" /> ${jsxText(option)}`,
        `${i}  </label>`,
      ]),
      `${i}</fieldset>`,
    ];
  },

  switch: (node, depth) => [
    `${indent(depth)}<label className="flex items-center gap-2 text-sm text-slate-700" ${uic(node)}>`,
    `${indent(depth)}  <input type="checkbox" role="switch" className="h-5 w-9 appearance-none rounded-full bg-slate-300 transition checked:bg-blue-600" />`,
    `${indent(depth)}  ${jsxText(str(node.props.label, "スイッチ"))}`,
    `${indent(depth)}</label>`,
  ],

  "search-field": (node, depth) => [
    `${indent(depth)}<input type="search" placeholder="${str(node.props.placeholder, "検索…")}" aria-label="検索" className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" ${uic(node)} />`,
  ],

  card: (node, depth, children) => {
    const i = indent(depth);
    const title = str(node.props.title);
    return [
      `${i}<section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" ${uic(node)}>`,
      ...(title
        ? [
            `${i}  <h2 className="mb-4 text-lg font-semibold text-slate-800">${jsxText(title)}</h2>`,
          ]
        : []),
      ...children(node, depth + 1),
      `${i}</section>`,
    ];
  },

  section: (node, depth, children) => {
    const i = indent(depth);
    const tag = str(node.props.headingLevel, "h2");
    return [
      `${i}<section className="my-8" ${uic(node)}>`,
      `${i}  <${tag} className="mb-3 text-lg font-semibold text-slate-800">${jsxText(str(node.props.title, "セクション"))}</${tag}>`,
      ...children(node, depth + 1),
      `${i}</section>`,
    ];
  },

  form: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}<form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()} ${uic(node)}>`,
      ...children(node, depth + 1),
      `${i}  <button type="submit" className="self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">${jsxText(str(node.props.submitLabel, "送信"))}</button>`,
      `${i}</form>`,
    ];
  },

  grid: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}<div className="grid grid-cols-1 gap-4 md:grid-cols-${str(node.props.columns, "3")}" ${uic(node)}>`,
      ...children(node, depth + 1),
      `${i}</div>`,
    ];
  },

  header: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}<header className="${node.props.sticky === true ? "sticky top-0 z-10 " : ""}flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-3" ${uic(node)}>`,
      `${i}  <h1 className="text-base font-bold text-slate-900">${jsxText(str(node.props.title, "アプリ名"))}</h1>`,
      ...children(node, depth + 1),
      `${i}</header>`,
    ];
  },

  toolbar: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}<div role="toolbar" className="flex items-center justify-between gap-2 py-2" ${uic(node)}>`,
      ...children(node, depth + 1),
      `${i}</div>`,
    ];
  },

  table: (node, depth) => {
    const i = indent(depth);
    const columns = listProp(node.props.columns);
    return [
      `${i}<table className="w-full border-collapse text-sm" ${uic(node)}>`,
      `${i}  <thead>`,
      `${i}    <tr className="border-b border-slate-200 text-left text-slate-500">`,
      ...columns.map(
        (col) => `${i}      <th scope="col" className="px-3 py-2">${jsxText(col)}</th>`,
      ),
      `${i}    </tr>`,
      `${i}  </thead>`,
      `${i}  <tbody>{/* TODO: ${num(node.props.rowCount, 5)}行分のデータを描画 */}</tbody>`,
      `${i}</table>`,
    ];
  },

  badge: (node, depth) => [
    `${indent(depth)}<span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700" ${uic(node)}>${jsxText(str(node.props.label, "バッジ"))}</span>`,
  ],

  "stat-card": (node, depth) => {
    const i = indent(depth);
    return [
      `${i}<div className="rounded-lg border border-slate-200 bg-white p-4" ${uic(node)}>`,
      `${i}  <p className="text-sm text-slate-500">${jsxText(str(node.props.label))}</p>`,
      `${i}  <p className="text-2xl font-bold text-slate-900">${jsxText(str(node.props.value))}</p>`,
      `${i}  <p className="text-sm text-blue-600">${jsxText(str(node.props.change))}</p>`,
      `${i}</div>`,
    ];
  },

  alert: (node, depth) => {
    const i = indent(depth);
    const tone = str(node.props.severity, "info");
    return [
      `${i}<div role="status" className="rounded-md border p-4 text-sm ${ALERT_TONES[tone] ?? ALERT_TONES.info}" ${uic(node)}>`,
      `${i}  <p className="font-semibold">${jsxText(str(node.props.title))}</p>`,
      `${i}  <p>${jsxText(str(node.props.message))}</p>`,
      `${i}</div>`,
    ];
  },

  divider: (node, depth) => [
    `${indent(depth)}<hr className="my-6 border-slate-200" ${uic(node)} />`,
  ],

  list: (node, depth) => {
    const i = indent(depth);
    return [
      `${i}<ul className="divide-y divide-slate-200 text-sm text-slate-700" ${uic(node)}>`,
      ...listProp(node.props.items).map(
        (item) => `${i}  <li className="py-2">${jsxText(item)}</li>`,
      ),
      `${i}</ul>`,
    ];
  },

  breadcrumb: (node, depth) => {
    const i = indent(depth);
    const items = listProp(node.props.items);
    return [
      `${i}<nav aria-label="パンくずリスト" ${uic(node)}>`,
      `${i}  <ol className="flex gap-2 text-sm text-slate-500">`,
      ...items.map(
        (item, idx) =>
          `${i}    <li${idx === items.length - 1 ? ' aria-current="page" className="text-slate-900"' : ""}>${jsxText(item)}${idx < items.length - 1 ? " /" : ""}</li>`,
      ),
      `${i}  </ol>`,
      `${i}</nav>`,
    ];
  },

  tabs: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}{/* TODO: タブ切替の状態管理を実装 */}`,
      `${i}<div ${uic(node)}>`,
      `${i}  <div role="tablist" className="flex gap-1 border-b border-slate-200">`,
      ...listProp(node.props.tabs).map(
        (tab, idx) =>
          `${i}    <button type="button" role="tab" aria-selected={${idx === 0 ? "true" : "false"}} className="px-4 py-2 text-sm ${idx === 0 ? "border-b-2 border-blue-600 font-medium text-blue-700" : "text-slate-500 hover:text-slate-700"}">${jsxText(tab)}</button>`,
      ),
      `${i}  </div>`,
      `${i}  <div role="tabpanel" className="py-4">`,
      ...children(node, depth + 2),
      `${i}  </div>`,
      `${i}</div>`,
    ];
  },

  accordion: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}<div className="divide-y divide-slate-200 rounded-md border border-slate-200" ${uic(node)}>`,
      ...listProp(node.props.items).flatMap((item) => [
        `${i}  <details className="group p-3">`,
        `${i}    <summary className="cursor-pointer text-sm font-medium text-slate-800">${jsxText(item)}</summary>`,
        `${i}    <div className="pt-2 text-sm text-slate-600">{/* TODO: 内容 */}</div>`,
        `${i}  </details>`,
      ]),
      ...children(node, depth + 1),
      `${i}</div>`,
    ];
  },

  pagination: (node, depth) => [
    `${indent(depth)}{/* TODO: ページ切替の状態管理を実装(全${num(node.props.totalPages, 10)}ページ) */}`,
    `${indent(depth)}<nav aria-label="ページネーション" className="flex gap-1 text-sm" ${uic(node)}>`,
    `${indent(depth)}  <button type="button" className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50">前へ</button>`,
    `${indent(depth)}  <button type="button" aria-current="page" className="rounded-md bg-blue-600 px-3 py-1 text-white">1</button>`,
    `${indent(depth)}  <button type="button" className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50">次へ</button>`,
    `${indent(depth)}</nav>`,
  ],
};
