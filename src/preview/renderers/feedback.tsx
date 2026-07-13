/**
 * Preview renderers: feedback elements
 * (alert, toast, progress-bar, skeleton, loading-indicator, callout).
 */

import type { PreviewRenderer } from "../parts";
import { bool, num, str } from "../parts";

interface SeverityStyle {
  box: string;
  icon: string;
  symbol: string;
}

const SEVERITY_INFO: SeverityStyle = {
  box: "border-blue-200 bg-blue-50 text-blue-900",
  icon: "text-blue-500",
  symbol: "ℹ",
};
const SEVERITY_SUCCESS: SeverityStyle = {
  box: "border-green-200 bg-green-50 text-green-900",
  icon: "text-green-500",
  symbol: "✓",
};

const SEVERITY_STYLES: Record<string, SeverityStyle> = {
  info: SEVERITY_INFO,
  success: SEVERITY_SUCCESS,
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: "text-amber-500", symbol: "⚠" },
  error: { box: "border-red-200 bg-red-50 text-red-900", icon: "text-red-500", symbol: "✕" },
  danger: { box: "border-red-200 bg-red-50 text-red-900", icon: "text-red-500", symbol: "✕" },
};

const AlertPreview: PreviewRenderer = ({ node }) => {
  const s = SEVERITY_STYLES[str(node.props.severity, "info")] ?? SEVERITY_INFO;
  return (
    <div className={`flex w-full items-start gap-2.5 rounded-lg border px-3.5 py-3 ${s.box}`}>
      <span className={`mt-0.5 text-sm font-bold ${s.icon}`} aria-hidden>
        {s.symbol}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{str(node.props.title, "お知らせ")}</p>
        {str(node.props.message) && (
          <p className="mt-0.5 text-xs opacity-80">{str(node.props.message)}</p>
        )}
      </div>
      {bool(node.props.dismissible) && (
        <span className="text-xs opacity-40" aria-hidden>
          ✕
        </span>
      )}
    </div>
  );
};

const ToastPreview: PreviewRenderer = ({ node }) => {
  const s =
    SEVERITY_STYLES[str(node.props.severity, "success")] ?? SEVERITY_SUCCESS;
  return (
    <div className="inline-flex w-fit items-center gap-2.5 rounded-lg bg-slate-800 px-4 py-2.5 text-white shadow-lg">
      <span className={`text-sm font-bold ${s.icon}`} aria-hidden>
        {s.symbol}
      </span>
      <span className="text-sm">{str(node.props.message, "保存しました")}</span>
      {bool(node.props.showAction) && (
        <span className="ml-1 text-xs font-medium text-blue-300">元に戻す</span>
      )}
    </div>
  );
};

const ProgressBarPreview: PreviewRenderer = ({ node }) => {
  const value = Math.max(0, Math.min(100, num(node.props.value, 60)));
  const indeterminate = bool(node.props.indeterminate);
  return (
    <div className="flex w-full items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full bg-blue-600 ${indeterminate ? "animate-pulse" : ""}`}
          style={{ width: indeterminate ? "40%" : `${value}%` }}
        />
      </div>
      {bool(node.props.showLabel, true) && !indeterminate && (
        <span className="text-xs tabular-nums text-slate-500">{value}%</span>
      )}
    </div>
  );
};

const SkeletonPreview: PreviewRenderer = ({ node }) => {
  const variant = str(node.props.variant, "text");
  const animated = bool(node.props.animated, true) ? "animate-pulse" : "";
  if (variant === "circle") {
    return <span className={`inline-block h-10 w-10 rounded-full bg-slate-200 ${animated}`} />;
  }
  if (variant === "rect") {
    return <div className={`h-24 w-full rounded-lg bg-slate-200 ${animated}`} />;
  }
  if (variant === "card") {
    return (
      <div className={`w-full rounded-xl border border-slate-200 p-4 ${animated}`}>
        <div className="h-24 rounded-lg bg-slate-200" />
        <div className="mt-3 h-3 w-3/4 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
      </div>
    );
  }
  const lines = Math.min(num(node.props.lines, 3), 8);
  return (
    <div className={`flex w-full flex-col gap-2 ${animated}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-slate-200"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
};

const SPINNER_SIZES: Record<string, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[3px]",
};

const LoadingIndicatorPreview: PreviewRenderer = ({ node }) => (
  <span className="inline-flex w-fit items-center gap-2.5">
    <span
      className={`inline-block animate-spin rounded-full border-slate-200 border-t-blue-600 ${
        SPINNER_SIZES[str(node.props.size, "md")] ?? SPINNER_SIZES.md
      }`}
    />
    {str(node.props.label) && (
      <span className="text-sm text-slate-500">{str(node.props.label)}</span>
    )}
  </span>
);

const TONE_BORDERS: Record<string, string> = {
  info: "border-l-blue-500 bg-blue-50/50",
  warning: "border-l-amber-500 bg-amber-50/50",
  success: "border-l-green-500 bg-green-50/50",
  danger: "border-l-red-500 bg-red-50/50",
};

const CalloutPreview: PreviewRenderer = ({ node }) => (
  <div
    className={`w-full rounded-r-lg border-l-4 px-4 py-3 ${
      TONE_BORDERS[str(node.props.tone, "info")] ?? TONE_BORDERS.info
    }`}
  >
    <p className="text-sm font-semibold text-slate-800">
      {str(node.props.title, "ポイント")}
    </p>
    <p className="mt-1 text-sm leading-relaxed text-slate-600">
      {str(node.props.body, "本文がここに入ります。")}
    </p>
  </div>
);

export const feedbackRenderers: Record<string, PreviewRenderer> = {
  alert: AlertPreview,
  toast: ToastPreview,
  "progress-bar": ProgressBarPreview,
  skeleton: SkeletonPreview,
  "loading-indicator": LoadingIndicatorPreview,
  callout: CalloutPreview,
};
