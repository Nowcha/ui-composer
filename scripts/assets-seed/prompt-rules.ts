/**
 * Prompt rule snippets (docs/04 asset #1 — highest priority).
 * Common quality requirements auto-inserted at the top of prompts.
 * Edit here and run `npm run gen:assets`.
 */

export interface PromptRule {
  id: string;
  label: string;
  /** The instruction text inserted into prompts. */
  text: string;
  category: "ui" | "report";
  defaultOn: boolean;
}

export const promptRules: PromptRule[] = [
  // --- UI実装ルール ---
  {
    id: "responsive",
    label: "レスポンシブ対応",
    text: "モバイルファーストでレスポンシブ対応すること(320px〜1920pxで崩れない)",
    category: "ui",
    defaultOn: true,
  },
  {
    id: "states",
    label: "エラー/ローディング/空状態",
    text: "エラー状態・ローディング状態・空状態を必ず実装すること(正常系のみの納品は不可)",
    category: "ui",
    defaultOn: true,
  },
  {
    id: "phosphor-weight",
    label: "アイコン統一",
    text: "アイコンはPhosphor Iconsで weight=regular に統一すること",
    category: "ui",
    defaultOn: true,
  },
  {
    id: "ja-text",
    label: "日本語UIテキスト",
    text: "UIテキストはすべて日本語にすること(プレースホルダ・エラーメッセージ含む)",
    category: "ui",
    defaultOn: true,
  },
  {
    id: "form-labels",
    label: "フォームラベル必須",
    text: "すべてのフォーム要素にlabelを関連付けること(placeholder をlabel代わりにしない)",
    category: "ui",
    defaultOn: true,
  },
  {
    id: "keyboard",
    label: "キーボード操作",
    text: "すべてのインタラクティブ要素をキーボードのみで操作可能にすること",
    category: "ui",
    defaultOn: false,
  },
  {
    id: "focus-visible",
    label: "フォーカス表示",
    text: "フォーカス状態を視覚的に明示すること(outline を消す場合は代替を用意)",
    category: "ui",
    defaultOn: false,
  },
  {
    id: "no-any",
    label: "TypeScript strict",
    text: "TypeScript strict モードで型エラーゼロにすること。any 禁止",
    category: "ui",
    defaultOn: true,
  },
  {
    id: "component-split",
    label: "コンポーネント分割",
    text: "1ファイル300行を超えないようにコンポーネントを分割すること",
    category: "ui",
    defaultOn: false,
  },
  {
    id: "touch-target",
    label: "タッチターゲット",
    text: "タップ可能要素は最小44x44pxを確保すること",
    category: "ui",
    defaultOn: false,
  },
  // --- レポート生成ルール ---
  {
    id: "self-contained",
    label: "自己完結HTML",
    text: "単一HTMLファイルで完結させること(外部CDN・画像・フォント読込なし)",
    category: "report",
    defaultOn: true,
  },
  {
    id: "print-friendly",
    label: "印刷対応",
    text: "印刷(PDF保存)で崩れないこと。セクション途中の不自然な改ページを避ける",
    category: "report",
    defaultOn: true,
  },
  {
    id: "report-ja-typography",
    label: "日本語タイポグラフィ",
    text: "日本語の行間は1.7〜1.9とし、長文の英数字は等幅にしないこと",
    category: "report",
    defaultOn: true,
  },
  {
    id: "chart-alt",
    label: "チャート代替テキスト",
    text: "チャートには要点を1〜2文の本文でも記載すること(図が読めなくても結論が伝わる)",
    category: "report",
    defaultOn: true,
  },
  {
    id: "heading-order",
    label: "見出し階層",
    text: "見出しレベルを飛ばさないこと(h1はページに1つ、h2の次はh3)",
    category: "report",
    defaultOn: true,
  },
  {
    id: "source-required",
    label: "出典明記",
    text: "データを含む表・チャートには出典または集計条件を注記すること",
    category: "report",
    defaultOn: false,
  },
  {
    id: "toc-links",
    label: "目次アンカー",
    text: "目次の各項目はページ内アンカーリンクにすること",
    category: "report",
    defaultOn: false,
  },
  {
    id: "dark-mode-skip",
    label: "配色固定",
    text: "レポートは常にライト配色で表示すること(prefers-color-scheme に反応させない)",
    category: "report",
    defaultOn: false,
  },
];
