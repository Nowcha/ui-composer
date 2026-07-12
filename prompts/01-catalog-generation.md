# カタログ生成プロンプト(components.json / icons.json)

> 使い方: Claude Codeセッションでこのファイルを参照させて実行。
> 推奨モデル: **Sonnet**(定型データの量産タスク)。スキーマ設計に迷いが出たらOpusに切替。

---

## タスク1: components.json(60種のコンポーネント辞書)

`scripts/build-catalog.ts` と、その出力となる `src/data/components.json` を作成してください。

### スキーマ(src/types/catalog.ts に型定義も作成)

```typescript
interface CatalogComponent {
  id: string;              // kebab-case, 例: "date-picker"
  name: string;            // 正式名, 例: "Date picker"
  nameJa: string;          // 日本語名, 例: "日付ピッカー"
  aliases: string[];       // 別名, 例: ["Calendar picker", "Date input"]
  description: string;     // 日本語の簡潔な説明(1〜2文)
  category: Category;      // 下記8カテゴリのいずれか
  isContainer: boolean;    // 子要素を持てるか(Card, Modal, Tabs等はtrue)
  typicalProps: PropDef[]; // 典型的なプロパティ定義
  implementations: {       // 主要ライブラリでの対応名(存在しない場合はnull)
    shadcn: string | null;
    mui: string | null;
    radix: string | null;
    html: string | null;   // ネイティブHTML相当, 例: "<details>"
  };
  a11yNotes: string[];     // アクセシビリティ注意点(プロンプト出力に注記される)
}

type Category =
  | "action"      // Button, Button group, FAB...
  | "input"       // Input, Select, Checkbox, Slider, Date picker...
  | "display"     // Avatar, Badge, Card, Table, Image, Quote...
  | "feedback"    // Alert, Toast, Progress, Skeleton, Spinner...
  | "navigation"  // Tabs, Breadcrumb, Pagination, Menu, Drawer...
  | "disclosure"  // Accordion, Tooltip, Popover, Modal...
  | "layout"      // Divider, Header, Footer, Toolbar, Grid...
  | "media";      // Carousel, Video player...

interface PropDef {
  name: string;
  type: "string" | "boolean" | "number" | "enum";
  enumValues?: string[];   // type: "enum" の場合
  default?: unknown;
}
```

### 収録対象(component.gallery の分類に準拠、計60種目安)

以下をシードとして、component.gallery の標準分類に沿って60種まで補完すること:

Accordion, Alert, Avatar, Badge, Breadcrumb, Button, Button group, Card,
Carousel, Checkbox, Combobox, Date picker, Dialog (Modal), Divider, Drawer,
Dropdown menu, Empty state, File upload, Footer, Form, Header, Icon, Image,
Text input, Link, List, Loading indicator, Menu, Navigation, Pagination,
Popover, Progress bar, Quote, Radio button, Rating, Search field, Select,
Skeleton, Slider, Toast (Snackbar), Stepper, Switch (Toggle), Table, Tabs,
Tag (Chip), Textarea, Toolbar, Tooltip, Tree view, Video player

### 制約

- 10種ずつのバッチで生成し、各バッチ後に `npm run gen:catalog && npm run typecheck` で検証してから次へ進むこと
- aliases は component.gallery に載っている別名を優先(例: Accordion → Collapse, Disclosure, Expander)
- implementations が不明な場合は推測で埋めず `null` にすること
- 完了後、全件のバリデーションスクリプト(id重複・カテゴリ妥当性・スキーマ準拠)を scripts/ に追加すること

---

## タスク2: icons.json(Phosphorメタデータ)

`@phosphor-icons/core` パッケージに全アイコンのメタデータ(name, tags, categories)が含まれている。
これを `scripts/build-catalog.ts` 内で読み込み、検索用の `src/data/icons.json` に変換すること。

- 手書きでアイコンリストを作らない(9,000個超あるため必ずパッケージから機械生成)
- 出力形式: `{ name, pascalName, tags, categories }[]`
- 日本語検索対応として、主要カテゴリ名の日英対訳マップ(20語程度)を別途 `src/data/icon-categories-ja.json` に作成

---

## 完了条件

- [ ] `npm run gen:catalog` で両JSONが再生成できる
- [ ] typecheck / lint が通る
- [ ] components.json は60件、バリデーションスクリプトがパスする
- [ ] icons.json はパッケージ由来の全件が入っている
