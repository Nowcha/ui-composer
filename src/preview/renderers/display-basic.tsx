/**
 * Preview renderers: basic display elements
 * (badge, avatar, image, tag, icon, quote, list, empty-state).
 */

import type { PreviewRenderer } from "../parts";
import { PhotoPlaceholder, bool, num, splitList, str } from "../parts";
import { LazyIcon } from "../LazyIcon";

const BADGE_VARIANTS: Record<string, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
};

const BadgePreview: PreviewRenderer = ({ node }) => (
  <span
    className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      BADGE_VARIANTS[str(node.props.variant, "default")] ?? BADGE_VARIANTS.default
    }`}
  >
    {str(node.props.label, "新着")}
  </span>
);

const AVATAR_SIZES: Record<string, string> = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

const AvatarPreview: PreviewRenderer = ({ node }) => {
  const name = str(node.props.name, "山田太郎");
  return (
    <span className="relative inline-flex w-fit">
      <span
        className={`flex items-center justify-center rounded-full bg-indigo-500 font-medium text-white ${
          AVATAR_SIZES[str(node.props.size, "md")] ?? AVATAR_SIZES.md
        }`}
      >
        {name.slice(0, 2)}
      </span>
      {bool(node.props.showStatus) && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
      )}
    </span>
  );
};

const ASPECT_CLASSES: Record<string, string> = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16]",
  auto: "h-32",
};

const ImagePreview: PreviewRenderer = ({ node }) => (
  <figure className="w-full">
    <PhotoPlaceholder
      className={`rounded-lg ${ASPECT_CLASSES[str(node.props.aspectRatio, "16:9")] ?? "aspect-video"}`}
      label={str(node.props.alt, "画像")}
    />
    {str(node.props.caption) && (
      <figcaption className="mt-1 text-xs text-slate-500">
        {str(node.props.caption)}
      </figcaption>
    )}
  </figure>
);

const TagPreview: PreviewRenderer = ({ node }) => (
  <span className="inline-flex w-fit items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
    {str(node.props.label, "デザイン")}
    {bool(node.props.removable) && <span className="text-slate-400">✕</span>}
  </span>
);

const IconPreview: PreviewRenderer = ({ node }) => {
  const size = num(Number(node.props.size), 24);
  if (node.icon) {
    return <LazyIcon icon={node.icon} size={size} className="text-slate-700" />;
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded border border-dashed border-slate-300 text-[9px] text-slate-400"
      style={{ width: size, height: size }}
    >
      icon
    </span>
  );
};

const QuotePreview: PreviewRenderer = ({ node }) => (
  <blockquote className="border-l-4 border-slate-300 py-1 pl-4">
    <p className="text-sm italic leading-relaxed text-slate-600">
      {str(node.props.text, "引用文がここに入ります。")}
    </p>
    {(str(node.props.author) || str(node.props.source)) && (
      <footer className="mt-1.5 text-xs text-slate-400">
        — {str(node.props.author, "発言者名")}
        {str(node.props.source) && `(${str(node.props.source)})`}
      </footer>
    )}
  </blockquote>
);

const ListPreview: PreviewRenderer = ({ node }) => {
  const items = splitList(node.props.items, ["項目1", "項目2", "項目3"]);
  const twoLine = bool(node.props.twoLine);
  return (
    <ul className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
      {items.map((item, i) => (
        <li
          key={`${item}-${i}`}
          className={`flex items-center gap-3 px-3.5 py-2.5 ${
            bool(node.props.showDividers, true) && i > 0
              ? "border-t border-slate-100"
              : ""
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-slate-700">{item}</p>
            {twoLine && (
              <p className="truncate text-xs text-slate-400">補足テキスト</p>
            )}
          </div>
          {bool(node.props.showAction) && (
            <span className="text-slate-300" aria-hidden>
              ›
            </span>
          )}
        </li>
      ))}
    </ul>
  );
};

const EmptyStatePreview: PreviewRenderer = ({ node }) => (
  <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-8 text-center">
    {bool(node.props.showIllustration, true) && (
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
        📭
      </span>
    )}
    <p className="text-sm font-semibold text-slate-700">
      {str(node.props.title, "データがありません")}
    </p>
    <p className="text-xs text-slate-500">
      {str(node.props.description, "最初の項目を作成しましょう")}
    </p>
    {str(node.props.actionLabel) && (
      <span className="mt-1 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white">
        {str(node.props.actionLabel)}
      </span>
    )}
  </div>
);

export const displayBasicRenderers: Record<string, PreviewRenderer> = {
  badge: BadgePreview,
  avatar: AvatarPreview,
  image: ImagePreview,
  tag: TagPreview,
  icon: IconPreview,
  quote: QuotePreview,
  list: ListPreview,
  "empty-state": EmptyStatePreview,
};
