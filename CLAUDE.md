# UI Composer for AI

GUIでUIレイアウトを組み立て、AI(Claude Code等)向けの構造化スペック(プロンプト / Markdown文書 / Reactコード)を生成する静的Webツール。

## プロジェクト原則

- **APIキー不要・完全静的**: バックエンドなし。データはlocalStorage + JSONエクスポート/インポートで完結
- **単一の真実**: キャンバス状態は `SpecTree` JSON のみ。3形式の出力はすべてここから純関数で導出する
- **ライブラリ非依存**: 抽象コンポーネントモデル + アダプタ層。生成コードのデフォルトは plain-tailwind(依存ゼロ)
- **Figmaの再発明はしない**: ワイヤーフレーム級の忠実度で十分。構造の正確さ > 見た目

## 技術スタック

- React 18 + Vite + TypeScript(strict)
- Tailwind CSS
- dnd-kit(D&D)/ Zustand(状態管理 + undo/redo)
- @phosphor-icons/react(アイコンプレビュー兼カタログ)
- デプロイ: GitHub Pages + GitHub Actions

## コマンド

```bash
npm run dev          # 開発サーバー
npm run build        # 本番ビルド(GitHub Pages用、base設定済み)
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run gen:catalog  # scripts/build-catalog.ts で辞書JSON再生成
npm run gen:assets   # scripts/build-assets.ts で規約/ダミーデータJSON再生成
npm test             # Vitest(generators/ は必須カバレッジ)
```

## ディレクトリ構成

```
src/
├── data/            # components.json / icons.json(生成物。手編集禁止)
├── canvas/          # キャンバス・D&D・ツリービュー
├── catalog/         # 左パネル(コンポーネント/アイコン検索)
├── inspector/       # 右パネル(プロパティ編集)
├── generators/      # prompt.ts / spec.ts / code/(純関数のみ)
├── store/           # Zustand ストア
└── types/           # SpecTree 等の型定義
scripts/
└── build-catalog.ts # 辞書生成スクリプト
```

## コーディング規約

- `generators/` は**副作用禁止の純関数のみ**。入力は `SpecTree`、出力は文字列。必ずVitestでスナップショットテストを書く
- `data/*.json` は `npm run gen:catalog` の生成物。直接編集せず `scripts/` 側を修正する
- コンポーネントの型は `src/types/spec.ts` の `ComponentNode` を唯一の定義とし、重複定義しない
- Zustandストアの変更は必ずアクション経由(undo/redo履歴に載せるため)。コンポーネントから直接 `set` しない
- アイコン参照は `{ name: string, weight: PhosphorWeight }` 形式で統一。JSX要素をstoreに入れない
- UIテキストは日本語。コード内コメント・型名は英語
- 1ファイル300行を超えたら分割を検討

## 実装上の注意(ハマりどころ)

- dnd-kitのネストD&Dは `SortableContext` の入れ子で実現。ドロップ先判定は `closestCenter` ではなく `pointerWithin` を使う
- GitHub Pages配信のため `vite.config.ts` の `base` はリポジトリ名に合わせる
- Phosphorの全アイコンをimportするとバンドルが肥大化する。プレビューは動的import + 仮想スクロールで遅延ロード
- localStorageは5MB上限。スペック保存は圧縮(lz-string)を検討

## Definition of Done

- typecheck / lint / test がすべて通る
- generators/ の変更にはスナップショットテスト更新が伴う
- キャンバス操作は undo(Cmd+Z)で戻せる
- モバイル表示で崩壊しない(閲覧のみ可でOK、編集はデスクトップ前提)
