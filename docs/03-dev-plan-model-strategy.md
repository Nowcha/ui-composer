# 開発計画 & モデル使い分け戦略(Opus / Sonnet)

Claude Code(Proプラン)での開発を前提に、セッション単位でタスクとモデルを事前設計する。
原則: **設計・難所はOpus、量産・反復はSonnet**。Opusの利用枠は「後から直すと高くつく判断」に集中投下する。

## モデル使い分けの判断基準

| Opusを使う | Sonnetを使う |
|---|---|
| 型設計・ストア設計(SpecTree, undo/redo) | カタログJSON量産(定型データ) |
| dnd-kitネストD&Dの実装方針決定 | UIコンポーネントの実装反復 |
| アダプタ層のインターフェース設計 | テスト追加・スナップショット更新 |
| 差分アルゴリズムの設計 | スタイル調整・バグ修正 |
| plan mode でのフェーズ計画レビュー | ドキュメント整備・リファクタ |

運用Tips:
- セッション冒頭は必ず **plan mode(Shift+Tab)** で計画を出させ、承認してから実装に入る
- Opusで設計→ `docs/decisions/` にADR(意思決定記録)として書き出させ、以降のSonnetセッションが参照できるようにする
- モデル切替は `/model` コマンド。1セッション内で「設計だけOpus→実装はSonnet」の切替も可
- コンテキストが濁ってきたら `/compact` より新セッション + CLAUDE.md参照の方が精度が出る

## カスタムスラッシュコマンド(.claude/commands/ に用意)

| コマンド | 内容 | 想定モデル |
|---|---|---|
| `/gen-catalog` | prompts/01-catalog-generation.md を実行 | Sonnet |
| `/add-component <name>` | 辞書に1コンポーネント追加+検証 | Sonnet |
| `/check` | typecheck + lint + test を一括実行し失敗を修正 | Sonnet |
| `/adr <題名>` | 直前の設計判断をADRとして docs/decisions/ に記録 | どちらでも |

## サブエージェント構成(.claude/agents/)

- **catalog-builder**: components.json の追加・修正専任。スキーマとバリデーション手順のみをコンテキストに持つ(メイン会話を汚さない)
- **generator-tester**: generators/ 変更時にスナップショットテストを書く・更新する専任
- ※ Phase 1では過剰。Phase 2以降、リポジトリが育ってから導入

## セッション計画(Phase 1: MVP)

### Session 1: 足場 + 型設計 【Opus → Sonnet】
1. (Opus, plan mode) SpecTree / ComponentNode / CatalogComponent の型設計、Zustandストア設計(undo/redo含む)をレビュー→ADR化
2. (Sonnet) Vite + TS + Tailwind + GitHub Actions デプロイの足場構築、型定義の実装
- 完了条件: 空アプリがGitHub Pagesで表示される、`npm run check` が通る

### Session 2: カタログ生成 【Sonnet】
- prompts/01-catalog-generation.md を実行(バッチ生成+検証)
- 完了条件: 60種辞書 + Phosphor全件メタデータ、バリデーション通過

### Session 3: キャンバスD&D 【Opus(方針)→ Sonnet(実装)】
1. (Opus) dnd-kitでのネストD&D実装方針を決定(SortableContext入れ子 / pointerWithin / ツリー操作のストアアクション設計)→ADR化
2. (Sonnet) 実装: パレットからドロップ、並び替え、ネスト1階層、ツリービュー、選択・削除・複製
- ここがMVP最大の難所。Opusの方針決定を飛ばさないこと

### Session 4: インスペクタ + プロンプト生成 【Sonnet】
- プロパティパネル(variant/テキスト/挙動メモ/アイコン割当)
- generators/prompt.ts(純関数+スナップショットテスト)
- コピー & .mdダウンロード
- 完了条件: 組んだレイアウトからClaude Code用プロンプトが出力できる = **MVP完成**

### Session 5: 磨き 【Sonnet】
- localStorage保存、undo/redo接続、キーボード操作、モバイル閲覧対応

## Phase 2 以降の主要Opusポイント(予約)

- 差分プロンプト: ツリーdiffアルゴリズム設計
- アダプタ層: CodeGenerator インターフェース設計(plain-tailwind実装前に)
- デザイントークン: 全ジェネレータへの反映方式の設計

## 事前準備チェックリスト(セッション開始前に済ませる)

- [ ] GitHubリポジトリ `ui-composer` 作成、CLAUDE.md をルートに配置
- [ ] prompts/ と docs/ を丸ごとリポジトリにコミット(AIが常時参照できる状態に)
- [ ] `.claude/commands/check.md` だけ先に作成(他コマンドはSession 2以降)
- [ ] GitHub Pages有効化(Actions経由)
- [ ] claude-code-hub のベストプラクティスから流用できる設定(permissions, hooks)を確認
