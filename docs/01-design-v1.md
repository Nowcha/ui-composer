# UI Composer for AI — 設計書(Claude Code キックオフ用)

## 1. コンセプト

散在するUIコンポーネント知識(component.gallery)とアイコン(Phosphor Icons)を統合カタログ化し、GUIキャンバスで画面を組み立てると、AIが誤解しない構造化スペックを自動生成するツール。

**位置づけ:** 「プロンプトのビジュアルエディタ」。Figmaの再発明はしない。ピクセルパーフェクトな編集は捨て、AIに渡す構造情報の正確さに全振りする。

**設計原則:**
- ライブラリ非依存(抽象コンポーネントモデル+アダプタ層)
- APIキー不要・完全静的サイト(GitHub Pages)
- データはローカル完結(localStorage + JSONエクスポート/インポート)
- 出力は3形式すべて対応(プロンプト / スペック文書 / Reactコード)

---

## 2. アーキテクチャ

```
┌─────────────────────────────────────────────┐
│                  UI Composer                 │
├──────────┬──────────────┬───────────────────┤
│ 統合カタログ │ GUIキャンバス   │ プロパティパネル      │
│ (左パネル)  │ (中央)        │ (右パネル)           │
├──────────┴──────────────┴───────────────────┤
│         コンポーネントツリー (内部状態: 階層JSON)     │
├─────────────────────────────────────────────┤
│              スペック生成エンジン                  │
│  ┌──────────┬──────────────┬──────────────┐ │
│  │ Prompt    │ Spec (MD)    │ Code (React) │ │
│  │ Generator │ Generator    │ Generator    │ │
│  └──────────┴──────────────┴──────┬───────┘ │
│                          アダプタ層 ─┤          │
│              (plain-tailwind / shadcn / MUI…) │
└─────────────────────────────────────────────┘
```

### 2.1 統合カタログ

**コンポーネント辞書(静的JSON、ビルド時生成):**
- component.gallery の標準分類(約60種)をベースに、名称・別名(Accordion = Collapse = Disclosure 等)・説明・典型プロパティを収録
- 各コンポーネントに「実装マッピング表」を持たせる:

```json
{
  "id": "accordion",
  "name": "Accordion",
  "aliases": ["Collapse", "Disclosure", "Expander"],
  "description": "折りたたみ可能な見出しの縦スタック",
  "category": "disclosure",
  "typicalProps": ["items", "allowMultiple", "defaultOpen"],
  "implementations": {
    "shadcn": "Accordion",
    "mui": "Accordion",
    "radix": "Accordion",
    "html": "<details>/<summary>"
  }
}
```

**アイコンカタログ:**
- Phosphor Icons のメタデータ(名前・タグ・カテゴリ・6ウェイト)を静的JSON化
- `@phosphor-icons/react` をプレビュー表示に使用(検索はローカル全文一致+タグ)
- 選択したアイコンはコンポーネントの `icon` プロパティとしてスペックに記録

### 2.2 GUIキャンバス

- ドラッグ&ドロップ配置(`dnd-kit` 推奨。react-dnd より軽量・メンテ活発)
- ワイヤーフレーム級の忠実度(グレー基調の簡易レンダリング)
- ネスト対応:コンテナ系(Card, Modal, Tabs, Form)は子要素を持てる
- グリッドスナップ + 12カラムレイアウト
- ブレークポイント切替(mobile / tablet / desktop)— レイアウト差分を記録
- キャンバス操作: 選択・複製・削除・並び替え・階層移動(ツリービュー併設)

### 2.3 プロパティパネル

選択中コンポーネントに対して:
- **variant / size / state**(disabled, loading, error 等)
- **アイコン割当**(カタログから検索して割当、ウェイト指定)
- **挙動メモ**(自由記述:「クリックで確認モーダル」「送信後トースト表示」)
- **データバインディングメモ**(「APIから取得したユーザー一覧」等)
- **ラベル・プレースホルダ等の実テキスト**

### 2.4 内部データモデル(スペックJSON)

```json
{
  "meta": {
    "name": "設定画面",
    "targetLibrary": "shadcn",
    "breakpoints": ["mobile", "desktop"],
    "createdAt": "2026-07-12"
  },
  "tree": {
    "type": "Page",
    "children": [
      {
        "type": "Card",
        "props": { "title": "通知設定" },
        "layout": { "col": 6, "row": 1 },
        "children": [
          {
            "type": "Switch",
            "props": { "label": "メール通知", "defaultChecked": true },
            "icon": { "name": "bell", "weight": "regular" },
            "behavior": "変更即時保存、失敗時トースト"
          }
        ]
      }
    ]
  }
}
```

このJSONが唯一の真実(single source of truth)。3形式の出力はすべてここから導出。

---

## 3. スペック生成エンジン(3形式出力)

### 3.1 Claude Code向けプロンプト

- コンポーネントツリーをインデント付きテキストで表現
- 挙動メモ・状態・アイコンを注釈として付与
- ターゲットライブラリを選択すると実装名に変換した指示文を生成
- 冒頭に規約ブロック(「Phosphor Iconsを使用、ウェイトはregular統一」等)を自動挿入
- ワンクリックコピー + `.md` ダウンロード

出力例:
```
以下のUIを React + Tailwind + shadcn/ui で実装してください。
アイコンは @phosphor-icons/react を使用(weight="regular"統一)。

## 画面: 設定画面
- Card「通知設定」(6カラム幅)
  - Switch「メール通知」(default: ON, icon: Bell)
    - 挙動: 変更即時保存、失敗時トースト表示
```

### 3.2 スペック文書(Markdown)

- 設計レビュー・記録用のフォーマル文書
- コンポーネント一覧表、画面構成図(Mermaid)、挙動仕様一覧を自動生成
- `CLAUDE.md` 追記用スニペット(プロジェクト規約断片)も別途出力

### 3.3 Reactコード直接生成

- アダプタ層でライブラリ選択: `plain-tailwind`(デフォルト・依存ゼロ)/ `shadcn` / `mui`
- テンプレートベースのコード生成(AST不要、文字列テンプレートで十分)
- 出力は単一 `.tsx` ファイル(コピペしてClaude Codeに磨かせる前提の「叩き台」)
- 注: コード生成は完璧を目指さない。プロンプト出力と併用し「構造はコード、細部はAI」の分担

---

## 4. 技術スタック

| 項目 | 選定 | 理由 |
|---|---|---|
| フレームワーク | React + Vite + TypeScript | 既存プロジェクトと統一 |
| スタイル | Tailwind CSS | 同上 |
| D&D | dnd-kit | 軽量、ネスト対応 |
| 状態管理 | Zustand | ツリー操作+undo/redoが簡潔 |
| アイコン | @phosphor-icons/react | プレビュー兼カタログ |
| 永続化 | localStorage + JSON export/import | APIキー不要原則 |
| デプロイ | GitHub Pages + GitHub Actions | 既定パターン |

---

## 5. 開発フェーズ

### Phase 1: MVP(まずここまで)
- カタログ: 主要20コンポーネント + Phosphorアイコン検索
- キャンバス: D&D配置、ネスト1階層、ツリービュー
- プロパティ: テキスト・variant・挙動メモ
- 出力: Claude Code向けプロンプトのみ
- 保存: localStorage

### Phase 2: 出力拡充
- Markdownスペック文書 + Mermaid構成図
- Reactコード生成(plain-tailwindアダプタ)
- JSONエクスポート/インポート
- ブレークポイント対応

### Phase 3: カタログ完成 + 汎用化
- 60コンポーネント全収録 + 別名検索
- shadcn / MUI アダプタ追加
- テンプレート機能(よく使う画面パターンの保存)
- CLAUDE.md スニペット出力

---

## 6. リポジトリ構成案

```
ui-composer/
├── CLAUDE.md                 # プロジェクト規約
├── src/
│   ├── data/
│   │   ├── components.json   # コンポーネント辞書
│   │   └── icons.json        # Phosphorメタデータ
│   ├── canvas/               # キャンバス・D&D
│   ├── catalog/              # カタログパネル
│   ├── inspector/            # プロパティパネル
│   ├── generators/
│   │   ├── prompt.ts
│   │   ├── spec.ts
│   │   └── code/
│   │       ├── adapter.ts    # アダプタIF
│   │       ├── tailwind.ts
│   │       └── shadcn.ts
│   └── store/                # Zustand(tree + undo/redo)
├── scripts/
│   └── build-catalog.ts      # 辞書JSON生成スクリプト
└── .github/workflows/deploy.yml
```

---

## 7. 既知のリスクと割り切り

- **component.gallery のデータは手動移植**(APIなし)。60種の辞書化はClaude Codeに一括生成させ、目視レビューで済ませる
- **Phosphorのライセンス**: MIT。メタデータ同梱は問題なし
- **コード生成の品質**: 叩き台品質で妥協。最終品質はプロンプト出力→Claude Codeで担保
- **Figma連携は非スコープ**(将来検討)
