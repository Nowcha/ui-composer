import type { CatalogComponent } from "../../src/types/catalog";

export const mediaComponents: CatalogComponent[] = [
  {
    id: "carousel",
    name: "Carousel",
    nameJa: "カルーセル",
    aliases: ["Slider", "Image slider", "Slideshow"],
    description: "複数のコンテンツを横スライドで切り替えて表示する。",
    category: "media",
    isContainer: true,
    typicalProps: [
      { name: "slideCount", type: "number", default: 3 },
      { name: "autoplay", type: "boolean", default: false },
      { name: "showIndicators", type: "boolean", default: true },
      { name: "showArrows", type: "boolean", default: true },
    ],
    implementations: {
      shadcn: "Carousel",
      mui: null,
      radix: null,
      html: null,
    },
    a11yNotes: [
      "自動再生には一時停止ボタンを必ず設ける",
      "スライドは矢印キー・スワイプの両方で操作できること",
    ],
  },
  {
    id: "video-player",
    name: "Video player",
    nameJa: "動画プレイヤー",
    aliases: ["Media player", "Video"],
    description: "動画を再生するプレイヤー。ワイヤーフレームではプレースホルダ。",
    category: "media",
    isContainer: false,
    typicalProps: [
      { name: "showControls", type: "boolean", default: true },
      { name: "autoplay", type: "boolean", default: false },
      {
        name: "aspectRatio",
        type: "enum",
        enumValues: ["16:9", "4:3", "1:1", "9:16"],
        default: "16:9",
      },
      { name: "caption", type: "string" },
    ],
    implementations: {
      shadcn: null,
      mui: null,
      radix: null,
      html: "<video>",
    },
    a11yNotes: [
      "字幕(キャプション)に対応する",
      "自動再生は音声なしに限定する",
    ],
  },
];
