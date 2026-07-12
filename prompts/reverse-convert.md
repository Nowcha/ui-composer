# AI逆変換プロンプト: 既存コード → SpecTree JSON

> 使い方: このプロンプト全体と対象コード(Reactコンポーネント/HTML等)を
> Claude Codeに渡し、出力されたJSONを UI Composer の「インポート」から取り込む。

---

以下のUIコードを解析し、UI Composer の SpecTree JSON(スキーマ後述)に変換してください。

## 変換ルール

1. **出力はJSONのみ**。コードブロック1つで、説明文を混ぜないこと
2. UI構造をコンポーネント単位で木構造に分解する。対応するカタログ `type` は
   下記の一覧から選ぶこと(例: `button`, `text-input`, `card`, `table`, `tabs`)
3. カタログに対応がない要素は `type: "RawBlock"` とし、元のコード断片を
   `raw` フィールドに**無加工で**格納する(削らない・整形しない)
4. `id` は `{type}-{ランダム英数6文字}` 形式で全ノード一意に採番する。
   既存コードに `data-uic-id` 属性がある場合は**必ずその値を再利用**する
5. テキスト・ラベル・variant等は `props` に反映する。イベントハンドラの内容は
   `behavior` に日本語1文で要約する
6. アイコンは Phosphor Icons 名に正規化し `icon: { name, weight }` とする。
   対応が不明なら `behavior` に「アイコン: 〜」と記録して省略してよい
7. 推測で構造を「改善」しないこと。**元コードの構造を忠実に写す**のが目的

## SpecTree JSONスキーマ

```typescript
interface SpecDocument {
  meta: {
    name: string;            // 画面/レポート名(コードから推定)
    mode: "ui" | "report";
    targetLibrary: string;   // 元コードの実装方式(例: "plain-tailwind", "shadcn")
    version: 1;              // 必ず 1
  };
  tree: ComponentNode;       // 必ず { id: "root", type: "root", props: {}, children: [...] }
  snapshots: [];             // 必ず空配列
}

interface ComponentNode {
  id: string;                // data-uic-id と同値
  type: string;              // カタログid or "RawBlock" or "root"
  props: Record<string, unknown>;
  icon?: { name: string; weight: "thin" | "light" | "regular" | "bold" | "fill" | "duotone" };
  behavior?: string;         // 挙動の日本語要約
  frozen?: boolean;          // 通常は省略
  raw?: string;              // RawBlock時のみ: 元コード断片
  children?: ComponentNode[];
}
```

## 利用可能なカタログtype(60種)

action: `button` `button-group` `fab` `link`
input: `text-input` `select` `checkbox` `radio-button` `switch` `textarea` `combobox` `date-picker` `time-picker` `number-input` `file-upload` `search-field` `slider` `rating` `color-picker` `form`
display: `card` `table` `badge` `avatar` `image` `list` `quote` `icon` `tag` `tree-view` `empty-state` `stat-card` `description-list` `timeline`
feedback: `alert` `toast` `progress-bar` `skeleton` `loading-indicator`
disclosure: `modal` `accordion` `tooltip` `popover`
navigation: `tabs` `breadcrumb` `pagination` `menu` `dropdown-menu` `navigation` `sidebar` `drawer` `stepper`
layout: `divider` `header` `footer` `toolbar` `grid` `section`
media: `carousel` `video-player`

## 自己検証(出力前に必ず確認)

- [ ] JSONとしてパース可能である
- [ ] `meta.version` が `1`、`tree.id` が `"root"`、`tree.type` が `"root"`
- [ ] 全ノードの `id` が一意である
- [ ] `type` が上記カタログ一覧・`RawBlock`・`root` のいずれかである
- [ ] `RawBlock` には `raw` があり、元コードの情報が欠落していない

## 往復テストチェックリスト(精度検証用)

変換後、UI Composerで以下を確認する:

1. インポートが成功する(バリデーションエラーが出ない)
2. ツリー構造が元コードの階層と一致している
3. 主要なラベル・テキストが props に反映されている
4. インポート直後に自動作成される「インポート基準版」に対し、
   無編集で差分プロンプトを生成すると「差分はありません」になる
5. 1ノードだけ編集して差分プロンプトを生成すると、その変更のみが出力される

---

## 対象コード

(ここに変換したいコードを貼り付ける)
