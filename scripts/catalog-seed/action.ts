import type { CatalogComponent } from "../../src/types/catalog";

export const actionComponents: CatalogComponent[] = [
  {
    id: "button",
    name: "Button",
    nameJa: "ボタン",
    aliases: ["Push button", "CTA"],
    description: "クリックでアクションを実行する基本要素。",
    category: "action",
    isContainer: false,
    typicalProps: [
      { name: "label", type: "string", default: "ボタン" },
      {
        name: "variant",
        type: "enum",
        enumValues: ["primary", "secondary", "outline", "ghost", "danger"],
        default: "primary",
      },
      {
        name: "size",
        type: "enum",
        enumValues: ["sm", "md", "lg"],
        default: "md",
      },
      { name: "disabled", type: "boolean", default: false },
    ],
    implementations: {
      shadcn: "Button",
      mui: "Button",
      radix: null,
      html: "<button>",
    },
    a11yNotes: [
      "アイコンのみの場合は aria-label を必ず付与する",
      "disabled時もフォーカス順序を考慮する",
    ],
  },
  {
    id: "button-group",
    name: "Button group",
    nameJa: "ボタングループ",
    aliases: ["Segmented control", "Split button"],
    description: "関連する複数のボタンをひとまとまりに並べたグループ。",
    category: "action",
    isContainer: false,
    typicalProps: [
      { name: "buttons", type: "string", default: "日, 週, 月" },
      {
        name: "selectionMode",
        type: "enum",
        enumValues: ["none", "single", "multiple"],
        default: "single",
      },
    ],
    implementations: {
      shadcn: null,
      mui: "ButtonGroup",
      radix: "ToggleGroup",
      html: null,
    },
    a11yNotes: [
      "グループに role=group と aria-label を付与する",
      "選択状態は aria-pressed で表現する",
    ],
  },
  {
    id: "fab",
    name: "Floating action button",
    nameJa: "フローティングアクションボタン",
    aliases: ["FAB", "Floating button"],
    description: "画面の主要アクションを促す、浮遊表示の円形ボタン。",
    category: "action",
    isContainer: false,
    typicalProps: [
      { name: "label", type: "string", default: "新規作成" },
      {
        name: "position",
        type: "enum",
        enumValues: ["bottom-right", "bottom-left", "bottom-center"],
        default: "bottom-right",
      },
      { name: "extended", type: "boolean", default: false },
    ],
    implementations: {
      shadcn: null,
      mui: "Fab",
      radix: null,
      html: null,
    },
    a11yNotes: [
      "アイコンのみの場合は aria-label を必ず付与する",
      "コンテンツを覆い隠さない位置に固定する",
    ],
  },
  {
    id: "link",
    name: "Link",
    nameJa: "リンク",
    aliases: ["Anchor", "Hyperlink"],
    description: "別ページや別リソースへ遷移するテキストリンク。",
    category: "action",
    isContainer: false,
    typicalProps: [
      { name: "label", type: "string", default: "詳細を見る" },
      { name: "href", type: "string", default: "#" },
      { name: "external", type: "boolean", default: false },
      { name: "underline", type: "boolean", default: true },
    ],
    implementations: {
      shadcn: null,
      mui: "Link",
      radix: null,
      html: "<a>",
    },
    a11yNotes: [
      "「こちら」等の曖昧なリンクテキストを避ける",
      "外部リンクは新規タブで開くことを明示する",
    ],
  },
];
