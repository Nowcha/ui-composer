/**
 * Shared building blocks for preview renderers.
 * Renderers are pure presentation: node in, wireframe-fidelity JSX out.
 * They must never know about drag & drop or selection state.
 */

import type { FC, ReactNode } from "react";
import type { ComponentNode } from "../types/spec";

export interface PreviewProps {
  node: ComponentNode;
  /**
   * Pre-rendered children. The canvas passes interactive-wrapped nodes,
   * thumbnails pass statically rendered ones. Container renderers place
   * this into their content slot; leaf renderers ignore it.
   */
  children?: ReactNode;
}

export type PreviewRenderer = FC<PreviewProps>;

/** Safe string prop access. */
export function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v !== "" ? v : fallback;
}

/** Safe number prop access. */
export function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Safe boolean prop access. */
export function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

/** Splits comma-separated list props ("日, 週, 月") into trimmed items. */
export function splitList(v: unknown, fallback: string[]): string[] {
  if (typeof v !== "string" || v.trim() === "") return fallback;
  return v
    .split(/[,、]/)
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

/** Field wrapper: label + control, the shape shared by most inputs. */
export const Field: FC<{
  label: string;
  required?: boolean;
  children: ReactNode;
}> = ({ label, required, children }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <span className="text-xs font-medium text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
    )}
    {children}
  </div>
);

/** Shared input-box look. */
export const inputBoxClass =
  "flex h-8 w-full items-center rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700";

/** Placeholder-styled text inside an input box. */
export const Ghost: FC<{ children: ReactNode }> = ({ children }) => (
  <span className="truncate text-slate-400">{children}</span>
);

/** Illustration placeholder (image / video / chart areas). */
export const PhotoPlaceholder: FC<{ className?: string; label?: string }> = ({
  className = "",
  label,
}) => (
  <div
    className={`flex w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 ${className}`}
  >
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M3.5 18.5 9 13l4 4 3.5-3.5 4 4" />
    </svg>
    {label && <span className="text-[10px]">{label}</span>}
  </div>
);

/** Simple chevron used across selects / accordions / menus. */
export const Chevron: FC<{ direction?: "down" | "right"; className?: string }> =
  ({ direction = "down", className = "h-3.5 w-3.5" }) => (
    <svg
      viewBox="0 0 16 16"
      className={`${className} ${direction === "right" ? "-rotate-90" : ""} shrink-0 text-slate-400`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );

/** Neutral placeholder rows for empty container thumbnails. */
export const SampleLines: FC<{ lines?: number }> = ({ lines = 2 }) => (
  <div className="flex w-full flex-col gap-1.5">
    {Array.from({ length: lines }, (_, i) => (
      <div
        key={i}
        className="h-2 rounded bg-slate-200"
        style={{ width: `${85 - i * 25}%` }}
      />
    ))}
  </div>
);
