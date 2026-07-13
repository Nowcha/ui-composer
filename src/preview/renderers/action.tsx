/** Preview renderers: action category (button, button-group, fab, link). */

import type { PreviewRenderer } from "../parts";
import { bool, splitList, str } from "../parts";
import { LazyIcon } from "../LazyIcon";

const BUTTON_VARIANTS: Record<string, string> = {
  primary: "bg-blue-600 text-white",
  secondary: "bg-slate-700 text-white",
  outline: "border border-slate-300 bg-white text-slate-700",
  ghost: "bg-transparent text-slate-600",
  danger: "bg-red-600 text-white",
};

const BUTTON_SIZES: Record<string, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-8 px-3.5 text-sm",
  lg: "h-10 px-5 text-base",
};

const ButtonPreview: PreviewRenderer = ({ node }) => {
  const variant = str(node.props.variant, "primary");
  const size = str(node.props.size, "md");
  return (
    <span
      className={`inline-flex w-fit items-center justify-center gap-1.5 rounded-md font-medium ${
        BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary
      } ${BUTTON_SIZES[size] ?? BUTTON_SIZES.md} ${
        bool(node.props.disabled) ? "opacity-45" : ""
      }`}
    >
      {node.icon && <LazyIcon icon={node.icon} size={16} />}
      {str(node.props.label, "ボタン")}
    </span>
  );
};

const ButtonGroupPreview: PreviewRenderer = ({ node }) => {
  const buttons = splitList(node.props.buttons, ["日", "週", "月"]);
  return (
    <span className="inline-flex w-fit overflow-hidden rounded-md border border-slate-300 bg-white">
      {buttons.map((label, i) => (
        <span
          key={`${label}-${i}`}
          className={`px-3 py-1.5 text-sm ${
            i > 0 ? "border-l border-slate-300" : ""
          } ${i === 0 ? "bg-blue-50 font-medium text-blue-700" : "text-slate-600"}`}
        >
          {label}
        </span>
      ))}
    </span>
  );
};

const FabPreview: PreviewRenderer = ({ node }) => {
  const extended = bool(node.props.extended);
  return (
    <span
      className={`inline-flex w-fit items-center justify-center gap-2 rounded-full bg-blue-600 text-white shadow-lg ${
        extended ? "h-11 px-5 text-sm font-medium" : "h-12 w-12"
      }`}
    >
      {node.icon ? (
        <LazyIcon icon={node.icon} size={20} />
      ) : (
        <svg
          viewBox="0 0 16 16"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
      )}
      {extended && str(node.props.label, "新規作成")}
    </span>
  );
};

const LinkPreview: PreviewRenderer = ({ node }) => (
  <span
    className={`inline-flex w-fit items-center gap-1 text-sm text-blue-600 ${
      bool(node.props.underline, true) ? "underline underline-offset-2" : ""
    }`}
  >
    {node.icon && <LazyIcon icon={node.icon} size={14} />}
    {str(node.props.label, "詳細を見る")}
    {bool(node.props.external) && <span aria-hidden>↗</span>}
  </span>
);

export const actionRenderers: Record<string, PreviewRenderer> = {
  button: ButtonPreview,
  "button-group": ButtonGroupPreview,
  fab: FabPreview,
  link: LinkPreview,
};
