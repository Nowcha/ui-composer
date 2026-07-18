/**
 * Preview renderers: navigation elements
 * (tabs, breadcrumb, pagination, menu, dropdown-menu, navigation,
 *  sidebar, drawer, stepper, toc).
 */

import type { PreviewRenderer } from "../parts";
import { Chevron, bool, gridSlotClass, num, splitList, str } from "../parts";

const TabsPreview: PreviewRenderer = ({ node, children }) => {
  const tabs = splitList(node.props.tabs, ["概要", "詳細", "設定"]);
  const variant = str(node.props.variant, "underline");
  return (
    <div className="w-full">
      <div
        className={`flex gap-1 ${
          variant === "underline" ? "border-b border-slate-200" : ""
        } ${variant === "enclosed" ? "rounded-t-lg bg-slate-100 p-1" : ""}`}
      >
        {tabs.map((tab, i) => (
          <span
            key={`${tab}-${i}`}
            className={`px-3.5 py-2 text-sm ${
              variant === "pill"
                ? i === 0
                  ? "rounded-full bg-blue-600 font-medium text-white"
                  : "rounded-full text-slate-500"
                : variant === "enclosed"
                  ? i === 0
                    ? "rounded-md bg-white font-medium text-slate-800 shadow-sm"
                    : "text-slate-500"
                  : i === 0
                    ? "-mb-px border-b-2 border-blue-600 font-medium text-blue-700"
                    : "text-slate-500"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>
      <div className={`${gridSlotClass} py-3`}>{children}</div>
    </div>
  );
};

const BreadcrumbPreview: PreviewRenderer = ({ node }) => {
  const items = splitList(node.props.items, ["ホーム", "設定", "プロフィール"]);
  return (
    <nav className="flex w-fit items-center gap-1.5 text-sm">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-300">/</span>}
          <span className={i === items.length - 1 ? "font-medium text-slate-700" : "text-blue-600"}>
            {item}
          </span>
        </span>
      ))}
    </nav>
  );
};

const PaginationPreview: PreviewRenderer = ({ node }) => {
  const total = Math.min(num(node.props.totalPages, 10), 7);
  return (
    <nav className="flex w-fit items-center gap-1">
      {bool(node.props.showFirstLast) && <PageButton label="«" />}
      <PageButton label="‹" />
      {Array.from({ length: Math.min(total, 5) }, (_, i) => (
        <PageButton key={i} label={String(i + 1)} active={i === 0} />
      ))}
      <span className="px-1 text-slate-400">…</span>
      <PageButton label="›" />
      {bool(node.props.showFirstLast) && <PageButton label="»" />}
    </nav>
  );
};

const PageButton: React.FC<{ label: string; active?: boolean }> = ({
  label,
  active,
}) => (
  <span
    className={`flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs ${
      active ? "bg-blue-600 font-medium text-white" : "text-slate-600 hover:bg-slate-100"
    }`}
  >
    {label}
  </span>
);

const MENU_ICONS = ["✏️", "📋", "🗑"];

const MenuPreview: PreviewRenderer = ({ node }) => {
  const items = splitList(node.props.items, ["編集", "複製", "削除"]);
  return (
    <div className="w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-md">
      {items.map((item, i) => (
        <div key={`${item}-${i}`} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700">
          {bool(node.props.showIcons, true) && (
            <span className="text-xs" aria-hidden>
              {MENU_ICONS[i % MENU_ICONS.length]}
            </span>
          )}
          <span className="flex-1">{item}</span>
          {bool(node.props.showShortcuts) && (
            <span className="text-[10px] text-slate-300">⌘{i + 1}</span>
          )}
        </div>
      ))}
    </div>
  );
};

const DropdownMenuPreview: PreviewRenderer = ({ node }) => {
  const items = splitList(node.props.items, ["編集", "共有", "削除"]);
  return (
    <div className="w-fit">
      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700">
        {str(node.props.triggerLabel, "操作")}
        <Chevron />
      </span>
      <div className="mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-md">
        {items.map((item, i) => (
          <div
            key={`${item}-${i}`}
            className={`px-3 py-1.5 text-sm text-slate-700 ${
              bool(node.props.showDividers) && i > 0 ? "border-t border-slate-100" : ""
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

const NavigationPreview: PreviewRenderer = ({ node }) => {
  const items = splitList(node.props.items, ["ホーム", "プロジェクト", "設定"]);
  const horizontal = str(node.props.orientation, "horizontal") === "horizontal";
  return (
    <nav className={`flex ${horizontal ? "w-fit items-center gap-1" : "w-44 flex-col gap-0.5"}`}>
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${
            i === 0 ? "bg-blue-50 font-medium text-blue-700" : "text-slate-600"
          }`}
        >
          {bool(node.props.showIcons) && <span className="h-3.5 w-3.5 rounded bg-current opacity-30" />}
          {item}
        </span>
      ))}
    </nav>
  );
};

const SidebarPreview: PreviewRenderer = ({ node, children }) => (
  <div className="flex w-56 flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
    {bool(node.props.showHeader, true) && (
      <div className="mb-2 flex items-center gap-2 border-b border-slate-200 pb-2.5">
        <span className="h-6 w-6 rounded-md bg-blue-600" />
        <span className="text-sm font-semibold text-slate-800">アプリ名</span>
        {bool(node.props.collapsible, true) && (
          <span className="ml-auto text-slate-300" aria-hidden>
            «
          </span>
        )}
      </div>
    )}
    <div className="flex flex-col gap-2">{children}</div>
  </div>
);

const DrawerPreview: PreviewRenderer = ({ node, children }) => (
  <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100" style={{ minHeight: 180 }}>
    {bool(node.props.showOverlay, true) && <div className="absolute inset-0 bg-slate-900/20" />}
    <div
      className={`absolute inset-y-0 flex w-3/5 flex-col gap-3 bg-white p-4 shadow-xl ${
        str(node.props.position, "right") === "left" ? "left-0" : "right-0"
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-sm font-semibold text-slate-800">
          {str(node.props.title, "メニュー")}
        </span>
        <span className="text-xs text-slate-400" aria-hidden>
          ✕
        </span>
      </div>
      {children}
    </div>
  </div>
);

const StepperPreview: PreviewRenderer = ({ node }) => {
  const steps = splitList(node.props.steps, ["入力", "確認", "完了"]);
  const current = Math.max(1, num(node.props.currentStep, 1));
  return (
    <div className="flex w-full items-center">
      {steps.map((step, i) => {
        const stepNumber = i + 1;
        const done = stepNumber < current;
        const active = stepNumber === current;
        return (
          <div key={`${step}-${i}`} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  done
                    ? "bg-blue-600 text-white"
                    : active
                      ? "border-2 border-blue-600 bg-white text-blue-700"
                      : "border border-slate-300 bg-white text-slate-400"
                }`}
              >
                {done ? "✓" : stepNumber}
              </span>
              <span className={`text-xs ${active ? "font-medium text-slate-800" : "text-slate-400"}`}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={`mx-2 mb-5 h-0.5 flex-1 ${done ? "bg-blue-600" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const TocPreview: PreviewRenderer = ({ node }) => (
  <nav className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4">
    <p className="text-xs font-semibold text-slate-500">
      {str(node.props.title, "目次")}
    </p>
    <ol className="mt-2 flex flex-col gap-1.5 text-sm text-blue-700">
      <li>1. はじめに</li>
      <li>2. 分析結果</li>
      <li className="pl-4 text-xs text-blue-600">2.1 月次推移</li>
      <li>3. まとめ</li>
    </ol>
  </nav>
);

export const navigationRenderers: Record<string, PreviewRenderer> = {
  tabs: TabsPreview,
  breadcrumb: BreadcrumbPreview,
  pagination: PaginationPreview,
  menu: MenuPreview,
  "dropdown-menu": DropdownMenuPreview,
  navigation: NavigationPreview,
  sidebar: SidebarPreview,
  drawer: DrawerPreview,
  stepper: StepperPreview,
  toc: TocPreview,
};
