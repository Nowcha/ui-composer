/**
 * Preview renderers: advanced inputs
 * (combobox, date-picker, time-picker, file-upload, slider, rating,
 *  color-picker, form container).
 */

import type { PreviewRenderer } from "../parts";
import {
  Chevron,
  Field,
  Ghost,
  bool,
  inputBoxClass,
  num,
  str,
} from "../parts";

const ComboboxPreview: PreviewRenderer = ({ node }) => (
  <Field label={str(node.props.label, "担当者")}>
    <span className={`${inputBoxClass} justify-between`}>
      <Ghost>{str(node.props.placeholder, "入力して検索…")}</Ghost>
      <Chevron />
    </span>
  </Field>
);

const DatePickerPreview: PreviewRenderer = ({ node }) => {
  const range = bool(node.props.range);
  return (
    <Field label={str(node.props.label, "日付")}>
      <span className={`${inputBoxClass} w-fit gap-2 pr-3`}>
        <svg viewBox="0 0 16 16" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
          <rect x="2" y="3" width="12" height="11" rx="1.5" />
          <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
        </svg>
        <span className="text-slate-600">
          2026/07/13{range && <span className="text-slate-400">〜 2026/07/20</span>}
        </span>
      </span>
    </Field>
  );
};

const TimePickerPreview: PreviewRenderer = ({ node }) => (
  <Field label={str(node.props.label, "時刻")}>
    <span className={`${inputBoxClass} w-fit gap-2 pr-3`}>
      <svg viewBox="0 0 16 16" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4.5V8l2.5 1.5" />
      </svg>
      <span className="text-slate-600">
        {bool(node.props.use24Hour, true) ? "14:30" : "2:30 PM"}
      </span>
    </span>
  </Field>
);

const FileUploadPreview: PreviewRenderer = ({ node }) =>
  bool(node.props.dragDrop, true) ? (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M12 16V5m0 0l-4 4m4-4l4 4" />
        <path d="M4 17v2a1.5 1.5 0 001.5 1.5h13A1.5 1.5 0 0020 19v-2" />
      </svg>
      <span className="text-sm font-medium text-slate-600">
        {str(node.props.label, "ファイルを選択")}
      </span>
      <span className="text-xs text-slate-400">またはここにドラッグ&ドロップ</span>
    </div>
  ) : (
    <span className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700">
      📎 {str(node.props.label, "ファイルを選択")}
    </span>
  );

const SliderPreview: PreviewRenderer = ({ node }) => {
  const min = num(node.props.min, 0);
  const max = num(node.props.max, 100);
  const value = Math.round(min + (max - min) * 0.6);
  return (
    <Field label={str(node.props.label, "音量")}>
      <div className="flex items-center gap-3">
        <div className="relative h-1.5 flex-1 rounded-full bg-slate-200">
          <div className="absolute inset-y-0 left-0 w-[60%] rounded-full bg-blue-600" />
          <span className="absolute left-[60%] top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-600 bg-white shadow" />
        </div>
        {bool(node.props.showValue, true) && (
          <span className="w-8 text-right text-xs tabular-nums text-slate-500">
            {value}
          </span>
        )}
      </div>
    </Field>
  );
};

const RatingPreview: PreviewRenderer = ({ node }) => {
  const max = Math.min(num(node.props.max, 5), 10);
  const value = num(node.props.value, 3);
  return (
    <span className="inline-flex w-fit gap-0.5 text-lg leading-none">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? "text-amber-400" : "text-slate-300"}>
          ★
        </span>
      ))}
    </span>
  );
};

const PRESET_COLORS = ["#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed"];

const ColorPickerPreview: PreviewRenderer = ({ node }) => (
  <Field label={str(node.props.label, "テーマカラー")}>
    <div className="flex items-center gap-2">
      <span className={`${inputBoxClass} w-fit gap-2 pr-3`}>
        <span className="h-4 w-4 rounded border border-slate-200" style={{ background: PRESET_COLORS[0] }} />
        <span className="text-slate-600">#2563EB</span>
      </span>
      {bool(node.props.showPresets, true) &&
        PRESET_COLORS.slice(1).map((color) => (
          <span key={color} className="h-5 w-5 rounded-full border border-white shadow-sm" style={{ background: color }} />
        ))}
    </div>
  </Field>
);

const FormPreview: PreviewRenderer = ({ node, children }) => (
  <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    {str(node.props.title) && (
      <h3 className="text-base font-semibold text-slate-800">
        {str(node.props.title)}
      </h3>
    )}
    <div
      className={
        str(node.props.layout, "vertical") === "inline"
          ? "flex flex-wrap items-end gap-3"
          : "flex flex-col gap-4"
      }
    >
      {children}
    </div>
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
      {bool(node.props.showCancel) && (
        <span className="rounded-md border border-slate-300 px-3.5 py-1.5 text-sm text-slate-600">
          キャンセル
        </span>
      )}
      <span className="rounded-md bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white">
        {str(node.props.submitLabel, "送信")}
      </span>
    </div>
  </div>
);

export const inputAdvancedRenderers: Record<string, PreviewRenderer> = {
  combobox: ComboboxPreview,
  "date-picker": DatePickerPreview,
  "time-picker": TimePickerPreview,
  "file-upload": FileUploadPreview,
  slider: SliderPreview,
  rating: RatingPreview,
  "color-picker": ColorPickerPreview,
  form: FormPreview,
};
