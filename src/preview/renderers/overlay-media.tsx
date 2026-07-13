/**
 * Preview renderers: disclosure overlays and media
 * (modal, accordion, tooltip, popover, carousel, video-player,
 *  chart-placeholder).
 */

import type { PreviewRenderer } from "../parts";
import { Chevron, PhotoPlaceholder, bool, num, splitList, str } from "../parts";

const MODAL_WIDTHS: Record<string, string> = {
  sm: "max-w-xs",
  md: "max-w-sm",
  lg: "max-w-md",
  full: "max-w-full",
};

const ModalPreview: PreviewRenderer = ({ node, children }) => (
  <div className="flex w-full items-center justify-center rounded-lg bg-slate-900/25 p-6">
    <div
      className={`w-full rounded-xl bg-white shadow-2xl ${
        MODAL_WIDTHS[str(node.props.size, "md")] ?? MODAL_WIDTHS.md
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">
          {str(node.props.title, "確認")}
        </h3>
        {bool(node.props.showCloseButton, true) && (
          <span className="text-slate-300" aria-hidden>
            ✕
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  </div>
);

const AccordionPreview: PreviewRenderer = ({ node, children }) => {
  const items = splitList(node.props.items, ["質問1", "質問2", "質問3"]);
  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
      {items.map((item, i) => (
        <div key={`${item}-${i}`} className={i > 0 ? "border-t border-slate-100" : ""}>
          <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-700">
            <span className={i === 0 ? "font-medium" : ""}>{item}</span>
            <Chevron direction={i === 0 ? "down" : "right"} />
          </div>
          {i === 0 && (
            <div className="flex flex-col gap-2 px-4 pb-3">
              {children ?? (
                <p className="text-xs leading-relaxed text-slate-500">
                  回答内容がここに表示されます。
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const TooltipPreview: PreviewRenderer = ({ node }) => (
  <div className="flex w-fit flex-col items-center gap-1">
    <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-white shadow">
      {str(node.props.content, "補足説明")}
    </span>
    <span className="-mt-1.5 h-2 w-2 rotate-45 bg-slate-800" />
    <span className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
      対象要素 <span className="text-xs text-slate-300">ⓘ</span>
    </span>
  </div>
);

const PopoverPreview: PreviewRenderer = ({ node, children }) => (
  <div className="w-fit">
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700">
      {str(node.props.triggerLabel, "詳細")}
      <Chevron />
    </span>
    <div className="mt-1.5 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <div className="flex flex-col gap-2">
        {children ?? (
          <p className="text-xs leading-relaxed text-slate-500">
            ポップオーバーの内容がここに表示されます。
          </p>
        )}
      </div>
    </div>
  </div>
);

const CarouselPreview: PreviewRenderer = ({ node }) => {
  const slides = Math.min(num(node.props.slideCount, 3), 6);
  return (
    <div className="relative w-full">
      <PhotoPlaceholder className="aspect-video rounded-lg" label="スライド 1" />
      {bool(node.props.showArrows, true) && (
        <>
          <span className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow">
            ‹
          </span>
          <span className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow">
            ›
          </span>
        </>
      )}
      {bool(node.props.showIndicators, true) && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {Array.from({ length: slides }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const VideoPlayerPreview: PreviewRenderer = ({ node }) => (
  <figure className="w-full">
    <div
      className={`relative flex w-full items-center justify-center rounded-lg bg-slate-800 ${
        str(node.props.aspectRatio, "16:9") === "9:16" ? "aspect-[9/16]" : "aspect-video"
      }`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 pl-1 text-slate-800">
        ▶
      </span>
      {bool(node.props.showControls, true) && (
        <div className="absolute inset-x-3 bottom-2.5 flex items-center gap-2">
          <span className="h-1 flex-1 rounded-full bg-white/30">
            <span className="block h-full w-1/3 rounded-full bg-white" />
          </span>
          <span className="text-[10px] text-white/70">1:23 / 4:56</span>
        </div>
      )}
    </div>
    {str(node.props.caption) && (
      <figcaption className="mt-1 text-xs text-slate-500">{str(node.props.caption)}</figcaption>
    )}
  </figure>
);

const CHART_SHAPES: Record<string, string> = {
  line: "M0 32 L14 22 L28 26 L42 12 L56 16 L70 6",
  bar: "",
  "horizontal-bar": "",
  pie: "",
  scatter: "",
  gauge: "",
};

const ChartPlaceholderPreview: PreviewRenderer = ({ node }) => {
  const chartType = str(node.props.chartType, "line");
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-700">
        {str(node.props.title, "月次推移")}
      </p>
      <div className="mt-3 flex h-28 items-end justify-center gap-2 rounded-md bg-slate-50 p-3">
        {chartType === "pie" || chartType === "gauge" ? (
          <div
            className="h-20 w-20 rounded-full"
            style={{
              background: "conic-gradient(#2563eb 0 40%, #93c5fd 40% 70%, #e2e8f0 70%)",
              clipPath: chartType === "gauge" ? "inset(0 0 50% 0)" : undefined,
            }}
          />
        ) : chartType === "bar" || chartType === "scatter" ? (
          [40, 65, 50, 80, 60, 90].map((height, i) => (
            <span
              key={i}
              className={
                chartType === "bar"
                  ? "w-6 rounded-t bg-blue-500/80"
                  : "h-2 w-2 rounded-full bg-blue-500"
              }
              style={
                chartType === "bar"
                  ? { height: `${height}%` }
                  : { marginBottom: `${height * 0.7}%` }
              }
            />
          ))
        ) : chartType === "horizontal-bar" ? (
          <div className="flex w-full flex-col justify-center gap-2">
            {[85, 60, 40].map((width, i) => (
              <span key={i} className="h-4 rounded-r bg-blue-500/80" style={{ width: `${width}%` }} />
            ))}
          </div>
        ) : (
          <svg viewBox="0 0 70 36" className="h-full w-full text-blue-500" fill="none" aria-hidden>
            <path d={CHART_SHAPES.line} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>
      {str(node.props.dataNature) && (
        <p className="mt-2 text-xs text-slate-400">データ: {str(node.props.dataNature)}</p>
      )}
    </div>
  );
};

export const overlayMediaRenderers: Record<string, PreviewRenderer> = {
  modal: ModalPreview,
  accordion: AccordionPreview,
  tooltip: TooltipPreview,
  popover: PopoverPreview,
  carousel: CarouselPreview,
  "video-player": VideoPlayerPreview,
  "chart-placeholder": ChartPlaceholderPreview,
};
