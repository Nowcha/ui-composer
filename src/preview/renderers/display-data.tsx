/**
 * Preview renderers: data-display elements
 * (card, table, stat-card, description-list, timeline, tree-view,
 *  comparison-table, source-note).
 */

import type { PreviewRenderer } from "../parts";
import { Chevron, bool, gridSlotClass, num, splitList, str } from "../parts";

const SAMPLE_CELLS = ["田中 一郎", "佐藤 花子", "鈴木 次郎", "高橋 三奈", "伊藤 健"];
const SAMPLE_STATUS = ["有効", "保留", "有効", "無効", "有効"];

const CardPreview: PreviewRenderer = ({ node, children }) => (
  <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 px-4 py-3">
      <h3 className="text-sm font-semibold text-slate-800">
        {str(node.props.title, "カードタイトル")}
      </h3>
      {str(node.props.description) && (
        <p className="mt-0.5 text-xs text-slate-500">
          {str(node.props.description)}
        </p>
      )}
    </div>
    <div className={`${gridSlotClass} p-4`}>{children}</div>
    {bool(node.props.hasFooter) && (
      <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-2.5">
        <span className="text-xs text-slate-400">フッター</span>
      </div>
    )}
  </div>
);

const TablePreview: PreviewRenderer = ({ node }) => {
  const columns = splitList(node.props.columns, ["名前", "ステータス", "更新日"]);
  const rows = Math.min(num(node.props.rowCount, 5), 8);
  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {bool(node.props.selectable) && (
              <th className="w-8 px-3 py-2">
                <span className="block h-3.5 w-3.5 rounded border border-slate-300 bg-white" />
              </th>
            )}
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 text-xs font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1">
                  {column}
                  {bool(node.props.sortable) && <span className="text-slate-300">↕</span>}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r} className={r > 0 ? "border-t border-slate-100" : ""}>
              {bool(node.props.selectable) && (
                <td className="px-3 py-2">
                  <span className="block h-3.5 w-3.5 rounded border border-slate-300 bg-white" />
                </td>
              )}
              {columns.map((column, c) => (
                <td key={column} className="px-3 py-2 text-xs text-slate-600">
                  {c === 0
                    ? SAMPLE_CELLS[r % SAMPLE_CELLS.length]
                    : c === 1
                      ? SAMPLE_STATUS[r % SAMPLE_STATUS.length]
                      : `2026/07/${String(10 + r).padStart(2, "0")}`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TREND_UP = { symbol: "▲", className: "text-green-600" };
const TREND_STYLE: Record<string, { symbol: string; className: string }> = {
  up: TREND_UP,
  down: { symbol: "▼", className: "text-red-600" },
  flat: { symbol: "→", className: "text-slate-400" },
};

const StatCardPreview: PreviewRenderer = ({ node }) => {
  const trend = TREND_STYLE[str(node.props.trend, "up")] ?? TREND_UP;
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{str(node.props.label, "月間売上")}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        {str(node.props.value, "¥1,234,000")}
      </p>
      {str(node.props.change) && (
        <p className={`mt-1 text-xs font-medium ${trend.className}`}>
          {trend.symbol} {str(node.props.change)}
        </p>
      )}
    </div>
  );
};

const DescriptionListPreview: PreviewRenderer = ({ node }) => {
  const items = splitList(node.props.items, ["氏名: 山田太郎", "部署: 開発部"]);
  const horizontal = str(node.props.layout, "horizontal") === "horizontal";
  return (
    <dl className="w-full rounded-lg border border-slate-200 bg-white">
      {items.map((item, i) => {
        const [term, ...rest] = item.split(/[::]/);
        return (
          <div
            key={`${item}-${i}`}
            className={`px-4 py-2.5 ${horizontal ? "flex gap-4" : "flex flex-col gap-0.5"} ${
              bool(node.props.showDividers, true) && i > 0 ? "border-t border-slate-100" : ""
            }`}
          >
            <dt className={`text-xs font-medium text-slate-500 ${horizontal ? "w-24 shrink-0 pt-0.5" : ""}`}>
              {term?.trim()}
            </dt>
            <dd className="text-sm text-slate-700">{rest.join(":").trim() || "—"}</dd>
          </div>
        );
      })}
    </dl>
  );
};

const TimelinePreview: PreviewRenderer = ({ node }) => {
  const items = splitList(node.props.items, ["受付", "審査中", "承認", "完了"]);
  const vertical = str(node.props.orientation, "vertical") === "vertical";
  if (!vertical) {
    return (
      <div className="flex w-full items-center gap-2">
        {items.map((item, i) => (
          <div key={`${item}-${i}`} className="flex flex-1 items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? "bg-blue-600" : "bg-slate-300"}`} />
            <span className="text-xs text-slate-600">{item}</span>
            {i < items.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
          </div>
        ))}
      </div>
    );
  }
  return (
    <ol className="flex w-full flex-col">
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 && (
            <span className="absolute left-[5px] top-4 h-full w-px bg-slate-200" />
          )}
          <span className={`mt-1 h-[11px] w-[11px] shrink-0 rounded-full ${i === 0 ? "bg-blue-600" : "border-2 border-slate-300 bg-white"}`} />
          <div>
            <p className="text-sm text-slate-700">{item}</p>
            {bool(node.props.showTimestamps, true) && (
              <p className="text-xs text-slate-400">2026/07/{String(10 + i).padStart(2, "0")} 10:0{i}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};

const TreeViewPreview: PreviewRenderer = ({ node }) => {
  const rows: { depth: number; label: string; folder: boolean }[] = [
    { depth: 0, label: "プロジェクト", folder: true },
    { depth: 1, label: "ドキュメント", folder: true },
    { depth: 2, label: "仕様書.md", folder: false },
    { depth: 1, label: "画像", folder: true },
  ];
  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white py-1.5">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-1.5 py-1 text-sm text-slate-700" style={{ paddingLeft: `${row.depth * 16 + 10}px` }}>
          {row.folder ? <Chevron className="h-3 w-3" /> : <span className="w-3" />}
          {bool(node.props.showIcons, true) && (
            <span aria-hidden>{row.folder ? "📁" : "📄"}</span>
          )}
          {row.label}
        </div>
      ))}
    </div>
  );
};

const ComparisonTablePreview: PreviewRenderer = ({ node }) => {
  const subjects = splitList(node.props.subjects, ["案A", "案B", "案C"]);
  const criteria = splitList(node.props.criteria, ["コスト", "導入期間", "拡張性"]);
  const highlight = num(node.props.highlightColumn, 0);
  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2" />
            {subjects.map((subject, i) => (
              <th key={subject} className={`px-3 py-2 text-xs font-semibold ${i + 1 === highlight ? "bg-blue-50 text-blue-800" : "text-slate-600"}`}>
                {subject}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((criterion, r) => (
            <tr key={criterion} className={r > 0 ? "border-t border-slate-100" : ""}>
              <td className="px-3 py-2 text-xs font-medium text-slate-500">{criterion}</td>
              {subjects.map((subject, c) => (
                <td key={subject} className={`px-3 py-2 text-center text-xs text-slate-600 ${c + 1 === highlight ? "bg-blue-50/60" : ""}`}>
                  {["◎", "○", "△"][(r + c) % 3]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SourceNotePreview: PreviewRenderer = ({ node }) => (
  <p className="text-xs text-slate-400">
    {str(node.props.text, "出典: 社内売上データ(2026年6月)")}
    {str(node.props.url) && <span className="ml-1 text-blue-400 underline">{str(node.props.url)}</span>}
  </p>
);

export const displayDataRenderers: Record<string, PreviewRenderer> = {
  card: CardPreview,
  table: TablePreview,
  "stat-card": StatCardPreview,
  "description-list": DescriptionListPreview,
  timeline: TimelinePreview,
  "tree-view": TreeViewPreview,
  "comparison-table": ComparisonTablePreview,
  "source-note": SourceNotePreview,
};
