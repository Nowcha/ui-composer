/**
 * Preview renderers: basic input controls
 * (text-input, textarea, select, checkbox, radio-button, switch,
 *  search-field, number-input).
 */

import type { PreviewRenderer } from "../parts";
import {
  Chevron,
  Field,
  Ghost,
  bool,
  inputBoxClass,
  num,
  splitList,
  str,
} from "../parts";

const TYPE_PLACEHOLDERS: Record<string, string> = {
  email: "you@example.com",
  password: "••••••••",
  tel: "090-1234-5678",
  url: "https://example.com",
  number: "0",
  text: "入力してください",
};

const TextInputPreview: PreviewRenderer = ({ node }) => {
  const inputType = str(node.props.inputType, "text");
  const placeholder = str(
    node.props.placeholder,
    TYPE_PLACEHOLDERS[inputType] ?? TYPE_PLACEHOLDERS.text,
  );
  return (
    <Field
      label={str(node.props.label, "ラベル")}
      required={bool(node.props.required)}
    >
      <span
        className={`${inputBoxClass} ${bool(node.props.disabled) ? "bg-slate-50 opacity-60" : ""}`}
      >
        <Ghost>{placeholder}</Ghost>
      </span>
    </Field>
  );
};

const TextareaPreview: PreviewRenderer = ({ node }) => (
  <Field
    label={str(node.props.label, "コメント")}
    required={bool(node.props.required)}
  >
    <span
      className="flex w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm"
      style={{ minHeight: `${Math.min(num(node.props.rows, 4), 8) * 1.4}rem` }}
    >
      <Ghost>{str(node.props.placeholder, "入力してください")}</Ghost>
    </span>
  </Field>
);

const SelectPreview: PreviewRenderer = ({ node }) => {
  const options = splitList(node.props.options, ["選択肢A", "選択肢B"]);
  return (
    <Field label={str(node.props.label, "選択")}>
      <span
        className={`${inputBoxClass} justify-between ${bool(node.props.disabled) ? "bg-slate-50 opacity-60" : ""}`}
      >
        <span className="truncate">
          {str(node.props.placeholder) ? (
            <Ghost>{str(node.props.placeholder)}</Ghost>
          ) : (
            options[0]
          )}
        </span>
        <Chevron />
      </span>
    </Field>
  );
};

const CheckboxPreview: PreviewRenderer = ({ node }) => {
  const checked = bool(node.props.checked);
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 text-sm text-slate-700 ${
        bool(node.props.disabled) ? "opacity-50" : ""
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded border ${
          checked ? "border-blue-600 bg-blue-600 text-white" : "border-slate-400 bg-white"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M2.5 6.5l2.5 2.5 4.5-5" />
          </svg>
        )}
      </span>
      {str(node.props.label, "同意する")}
    </span>
  );
};

const RadioPreview: PreviewRenderer = ({ node }) => {
  const options = splitList(node.props.options, ["はい", "いいえ"]);
  return (
    <div
      className={`flex flex-col gap-1.5 ${bool(node.props.disabled) ? "opacity-50" : ""}`}
    >
      {str(node.props.label) && (
        <span className="text-xs font-medium text-slate-600">
          {str(node.props.label)}
        </span>
      )}
      <div className="flex flex-wrap gap-4">
        {options.map((option, i) => (
          <span key={`${option}-${i}`} className="inline-flex items-center gap-1.5 text-sm text-slate-700">
            <span
              className={`h-4 w-4 rounded-full border ${
                i === 0 ? "border-[5px] border-blue-600 bg-white" : "border-slate-400 bg-white"
              }`}
            />
            {option}
          </span>
        ))}
      </div>
    </div>
  );
};

const SwitchPreview: PreviewRenderer = ({ node }) => {
  const checked = bool(node.props.checked);
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 text-sm text-slate-700 ${
        bool(node.props.disabled) ? "opacity-50" : ""
      }`}
    >
      <span
        className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
          checked ? "justify-end bg-blue-600" : "justify-start bg-slate-300"
        }`}
      >
        <span className="h-4 w-4 rounded-full bg-white shadow" />
      </span>
      {str(node.props.label, "通知を受け取る")}
    </span>
  );
};

const SearchFieldPreview: PreviewRenderer = ({ node }) => (
  <span className={`${inputBoxClass} gap-2`}>
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </svg>
    <Ghost>{str(node.props.placeholder, "検索…")}</Ghost>
    {bool(node.props.showClearButton, true) && (
      <span className="ml-auto text-xs text-slate-300">✕</span>
    )}
  </span>
);

const NumberInputPreview: PreviewRenderer = ({ node }) => (
  <Field label={str(node.props.label, "数量")}>
    <span className="inline-flex h-8 w-fit items-stretch overflow-hidden rounded-md border border-slate-300 bg-white">
      <span className="flex w-8 items-center justify-center border-r border-slate-300 text-slate-500">
        −
      </span>
      <span className="flex min-w-12 items-center justify-center px-2 text-sm text-slate-700">
        {num(node.props.min, 0)}
      </span>
      <span className="flex w-8 items-center justify-center border-l border-slate-300 text-slate-500">
        +
      </span>
    </span>
  </Field>
);

export const inputBasicRenderers: Record<string, PreviewRenderer> = {
  "text-input": TextInputPreview,
  textarea: TextareaPreview,
  select: SelectPreview,
  checkbox: CheckboxPreview,
  "radio-button": RadioPreview,
  switch: SwitchPreview,
  "search-field": SearchFieldPreview,
  "number-input": NumberInputPreview,
};
