import type { CatalogComponent } from "../../src/types/catalog";

export const disclosureComponents: CatalogComponent[] = [
  {
    id: "modal",
    name: "Dialog (Modal)",
    nameJa: "モーダルダイアログ",
    aliases: ["Dialog", "Modal window", "Popup"],
    description: "画面上に重ねて表示し、操作の完了を求めるウィンドウ。",
    category: "disclosure",
    isContainer: true,
    typicalProps: [
      { name: "title", type: "string", default: "確認" },
      { name: "showCloseButton", type: "boolean", default: true },
      {
        name: "size",
        type: "enum",
        enumValues: ["sm", "md", "lg", "full"],
        default: "md",
      },
    ],
    implementations: {
      shadcn: "Dialog",
      mui: "Dialog",
      radix: "Dialog",
      html: "<dialog>",
    },
    a11yNotes: [
      "フォーカストラップを実装する",
      "Escキーで閉じられること",
      "閉じた後は開いた要素にフォーカスを戻す",
    ],
  },
  {
    id: "accordion",
    name: "Accordion",
    nameJa: "アコーディオン",
    aliases: ["Collapse", "Disclosure", "Expander"],
    description: "見出しをクリックして内容を開閉するリスト。",
    category: "disclosure",
    isContainer: true,
    typicalProps: [
      { name: "items", type: "string", default: "質問1, 質問2, 質問3" },
      { name: "allowMultiple", type: "boolean", default: false },
    ],
    implementations: {
      shadcn: "Accordion",
      mui: "Accordion",
      radix: "Accordion",
      html: "<details>",
    },
    a11yNotes: ["トリガーはbutton要素にし aria-expanded を付与する"],
  },
  {
    id: "tooltip",
    name: "Tooltip",
    nameJa: "ツールチップ",
    aliases: ["Hint", "Infotip"],
    description: "ホバー/フォーカス時に補足情報を表示する小さな吹き出し。",
    category: "disclosure",
    isContainer: false,
    typicalProps: [
      { name: "content", type: "string", default: "補足説明" },
      {
        name: "placement",
        type: "enum",
        enumValues: ["top", "bottom", "left", "right"],
        default: "top",
      },
    ],
    implementations: {
      shadcn: "Tooltip",
      mui: "Tooltip",
      radix: "Tooltip",
      html: null,
    },
    a11yNotes: [
      "ホバーだけでなくフォーカスでも表示する",
      "重要な情報はツールチップだけに置かない",
    ],
  },
  {
    id: "popover",
    name: "Popover",
    nameJa: "ポップオーバー",
    aliases: ["Popup panel", "Flyout"],
    description: "クリックで開く、操作可能なコンテンツを持つ小型パネル。",
    category: "disclosure",
    isContainer: true,
    typicalProps: [
      { name: "triggerLabel", type: "string", default: "詳細" },
      {
        name: "placement",
        type: "enum",
        enumValues: ["top", "bottom", "left", "right"],
        default: "bottom",
      },
      { name: "showArrow", type: "boolean", default: true },
    ],
    implementations: {
      shadcn: "Popover",
      mui: "Popover",
      radix: "Popover",
      html: null,
    },
    a11yNotes: [
      "トリガーに aria-expanded / aria-haspopup を付与する",
      "Escキーとフォーカス外れで閉じられること",
    ],
  },
];
