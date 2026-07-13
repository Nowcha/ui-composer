/**
 * Preview renderers: layout containers
 * (divider, header, footer, toolbar, grid, section, columns, hero).
 */

import type { PreviewRenderer } from "../parts";
import { bool, num, str } from "../parts";

const DividerPreview: PreviewRenderer = ({ node }) => {
  if (str(node.props.orientation, "horizontal") === "vertical") {
    return <span className="mx-2 inline-block h-8 w-px bg-slate-200" />;
  }
  const label = str(node.props.label);
  if (!label) return <hr className="w-full border-slate-200" />;
  return (
    <div className="flex w-full items-center gap-3">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="text-xs text-slate-400">{label}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
};

const HeaderPreview: PreviewRenderer = ({ node, children }) => (
  <header className="flex w-full items-center gap-4 border-b border-slate-200 bg-white px-5 py-3">
    <span className="flex items-center gap-2">
      <span className="h-6 w-6 rounded-md bg-blue-600" />
      <span className="text-sm font-bold text-slate-800">
        {str(node.props.title, "アプリ名")}
      </span>
    </span>
    {bool(node.props.showSearch) && (
      <span className="flex h-7 w-48 items-center rounded-md bg-slate-100 px-2.5 text-xs text-slate-400">
        検索…
      </span>
    )}
    <div className="ml-auto flex items-center gap-3">{children}</div>
  </header>
);

const FooterPreview: PreviewRenderer = ({ node, children }) => {
  const columns = num(Number(node.props.columns), 3);
  return (
    <footer className="w-full border-t border-slate-200 bg-slate-50 px-5 py-5">
      {bool(node.props.showLinks, true) && (
        <div className="grid gap-4 pb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">リンク{i + 1}</span>
              <span className="h-2 w-3/4 rounded bg-slate-200" />
              <span className="h-2 w-1/2 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      )}
      {children}
      <p className="text-xs text-slate-400">
        {str(node.props.copyright, "© 2026 Example Inc.")}
      </p>
    </footer>
  );
};

const ToolbarPreview: PreviewRenderer = ({ node, children }) => {
  const align = str(node.props.align, "left");
  const justify =
    align === "center"
      ? "justify-center"
      : align === "right"
        ? "justify-end"
        : align === "space-between"
          ? "justify-between"
          : "justify-start";
  return (
    <div
      className={`flex w-full flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 ${justify}`}
    >
      {children}
    </div>
  );
};

const GRID_GAPS: Record<string, string> = { sm: "gap-2", md: "gap-4", lg: "gap-6" };

const GridPreview: PreviewRenderer = ({ node, children }) => {
  const columns = num(Number(node.props.columns), 3);
  return (
    <div
      className={`grid w-full ${GRID_GAPS[str(node.props.gap, "md")] ?? "gap-4"}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
};

const HEADING_SIZES: Record<string, string> = {
  h2: "text-lg",
  h3: "text-base",
  h4: "text-sm",
};

const SectionPreview: PreviewRenderer = ({ node, children }) => (
  <section className="flex w-full flex-col gap-3">
    <div>
      <h2
        className={`font-bold text-slate-900 ${
          HEADING_SIZES[str(node.props.headingLevel, "h2")] ?? "text-lg"
        }`}
      >
        {str(node.props.title, "セクション見出し")}
      </h2>
      {str(node.props.description) && (
        <p className="mt-0.5 text-sm text-slate-500">{str(node.props.description)}</p>
      )}
    </div>
    {children}
  </section>
);

const ColumnsPreview: PreviewRenderer = ({ node, children }) => {
  const count = num(Number(node.props.count), 2);
  return (
    <div
      className={`grid w-full ${GRID_GAPS[str(node.props.gap, "md")] ?? "gap-4"}`}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
};

const HeroPreview: PreviewRenderer = ({ node }) => (
  <div className="w-full rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 px-8 py-10 text-white">
    <h1 className="text-2xl font-bold tracking-tight">
      {str(node.props.title, "レポートタイトル")}
    </h1>
    {str(node.props.subtitle) && (
      <p className="mt-2 text-sm text-slate-300">{str(node.props.subtitle)}</p>
    )}
    <p className="mt-4 text-xs text-slate-400">
      {str(node.props.date, "2026/07/13")}
      {str(node.props.author) && ` ・ ${str(node.props.author)}`}
    </p>
  </div>
);

export const layoutRenderers: Record<string, PreviewRenderer> = {
  divider: DividerPreview,
  header: HeaderPreview,
  footer: FooterPreview,
  toolbar: ToolbarPreview,
  grid: GridPreview,
  section: SectionPreview,
  columns: ColumnsPreview,
  hero: HeroPreview,
};
