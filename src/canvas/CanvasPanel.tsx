/**
 * CanvasPanel — the WYSIWYG work surface.
 * A device-width artboard rendered at real fidelity; components are
 * dropped, selected and rearranged directly on the page image.
 */

import type { FC } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSpecStore } from "../store/spec-store";
import {
  DEVICE_WIDTHS,
  useUiStore,
  type DeviceKind,
} from "../store/ui-store";
import { CanvasNode } from "./CanvasNode";
import { ROOT_DROP_ID } from "./dnd-ids";

const DEVICE_OPTIONS: { kind: DeviceKind; label: string; icon: string }[] = [
  { kind: "desktop", label: "デスクトップ", icon: "🖥" },
  { kind: "tablet", label: "タブレット", icon: "📱" },
  { kind: "mobile", label: "モバイル", icon: "📲" },
];

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5];

const CanvasToolbar: FC = () => {
  const device = useUiStore((s) => s.device);
  const setDevice = useUiStore((s) => s.setDevice);
  const zoom = useUiStore((s) => s.zoom);
  const setZoom = useUiStore((s) => s.setZoom);
  const nodeCount = useSpecStore(
    (s) => s.document.tree.children?.length ?? 0,
  );

  function stepZoom(direction: 1 | -1): void {
    const index = ZOOM_STEPS.findIndex((step) => step >= zoom - 0.001);
    const next = ZOOM_STEPS[Math.min(
      ZOOM_STEPS.length - 1,
      Math.max(0, (index < 0 ? 2 : index) + direction),
    )];
    setZoom(next ?? 1);
  }

  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-1.5">
      <div className="flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label="デバイス幅">
        {DEVICE_OPTIONS.map((option) => (
          <button
            key={option.kind}
            type="button"
            title={`${option.label} (${DEVICE_WIDTHS[option.kind]}px)`}
            aria-pressed={device === option.kind}
            onClick={() => setDevice(option.kind)}
            className={`rounded-md px-2.5 py-1 text-xs ${
              device === option.kind
                ? "bg-white font-medium text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span aria-hidden>{option.icon}</span>
            <span className="ml-1 hidden lg:inline">{option.label}</span>
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-400">{DEVICE_WIDTHS[device]}px</span>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => stepZoom(-1)}
          aria-label="縮小"
          className="h-6 w-6 rounded-md text-sm text-slate-500 hover:bg-slate-100"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          title="100%に戻す"
          className="w-12 rounded-md py-0.5 text-xs tabular-nums text-slate-600 hover:bg-slate-100"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => stepZoom(1)}
          aria-label="拡大"
          className="h-6 w-6 rounded-md text-sm text-slate-500 hover:bg-slate-100"
        >
          +
        </button>
      </div>
      <span className="text-xs text-slate-300">
        {nodeCount > 0 ? `${nodeCount} ブロック` : ""}
      </span>
    </div>
  );
};

/** Onboarding shown on a blank artboard. */
const EmptyState: FC = () => {
  const setLeftTab = useUiStore((s) => s.setLeftTab);
  return (
    <div className="pointer-events-none flex min-h-[60vh] flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl" aria-hidden>
        🎨
      </div>
      <div>
        <p className="text-base font-semibold text-slate-700">
          左のパーツをドラッグして、ここにドロップ
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
          実際の画面イメージを見ながらレイアウトを組み立てられます。
          <br />
          配置したパーツは右パネルで文言やプロパティを調整できます。
        </p>
      </div>
      <button
        type="button"
        onClick={() => setLeftTab("templates")}
        className="pointer-events-auto rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm hover:border-blue-400 hover:text-blue-600"
      >
        テンプレートから始める →
      </button>
    </div>
  );
};

/** 12-column guides shown while dragging or resizing. */
const GridGuides: FC = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 grid grid-cols-12 gap-3 p-5"
  >
    {Array.from({ length: 12 }, (_, i) => (
      <div
        key={i}
        className="h-full rounded-sm bg-blue-500/[0.05] ring-1 ring-inset ring-blue-400/20"
      />
    ))}
  </div>
);

const Artboard: FC = () => {
  const tree = useSpecStore((s) => s.document.tree);
  const selectNode = useSpecStore((s) => s.selectNode);
  const device = useUiStore((s) => s.device);
  const zoom = useUiStore((s) => s.zoom);
  const showGuides = useUiStore((s) => s.isDragging || s.isResizing);
  const rootIndicator = useUiStore(
    (s) => s.dropIndicator?.nodeId === "root",
  );
  const { setNodeRef } = useDroppable({ id: ROOT_DROP_ID });

  const width = DEVICE_WIDTHS[device];
  const children = tree.children ?? [];

  return (
    <div
      className="mx-auto w-fit"
      style={{ width: width * zoom, minHeight: `calc(70vh * ${zoom})` }}
    >
      <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
        <div
          ref={setNodeRef}
          onClick={() => selectNode(null)}
          className={`relative flex min-h-[70vh] flex-col rounded-xl bg-white shadow-[0_2px_16px_rgba(15,23,42,0.08)] ring-1 transition-shadow ${
            rootIndicator ? "ring-2 ring-blue-400" : "ring-slate-200/60"
          }`}
          style={{ width }}
        >
          {showGuides && <GridGuides />}
          {children.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="relative grid flex-1 auto-rows-min grid-cols-12 content-start gap-3 p-5">
              {children.map((child) => (
                <CanvasNode key={child.id} node={child} parentType="root" />
              ))}
              {rootIndicator && (
                <div className="col-span-full h-1 w-full rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.7)]" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CanvasPanel: FC = () => (
  <main
    aria-label="キャンバス"
    className="flex h-full min-w-0 flex-1 flex-col bg-slate-100"
  >
    <CanvasToolbar />
    <div className="flex-1 select-none overflow-auto px-8 py-6 [background-image:radial-gradient(circle,#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]">
      <Artboard />
    </div>
  </main>
);
