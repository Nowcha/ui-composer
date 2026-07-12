# UI Composer for AI — 設計書 v2(Claude Code キックオフ用)

> v1からの主な変更: ①Claude Design(2026/4公開)を踏まえたポジショニング再定義 ②インポート/ラウンドトリップ機能の追加 ③HTMLレポート編集(レポートモード)の追加 ④凍結マーク・差分プロンプトのコア昇格 ⑤フェーズ再編

---

## 1. コンセプト & ポジショニング(v2で再定義)

散在するUIコンポーネント知識(component.gallery)とアイコン(Phosphor Icons)を統合カタログ化し、GUIで組み立て・編集した構造を、AIが誤解しない指示に変換するローカル完結ツール。

### Claude Design / Figma との棲み分け

| | Claude Design | Figma | **UI Composer** |
|---|---|---|---|
| 得意領域 | 0→1の生成・見た目探索 | 精密なビジュアル編集 | **構造管理・反復改修・差分指示** |
| 利用コスト | プラン共通枠を消費 | 別サブスク | **完全ローカル・枠消費ゼロ** |
| 既存物の改修 | 会話ベース(過剰書換リスク) | 手動 | **差分プロンプト+凍結マークで構造的に制御** |
| HTMLレポート | 0→1生成は可 | 対象外 | **非破壊インポート→部分編集が主戦場** |

**戦略:** Claude Designと競合する「ゼロから画面デザイン」は主戦場にしない。
UI Composerは (a) **利用枠を消費しない下ごしらえレイヤー**、(b) **既存物(コード/HTMLレポート)の非破壊改修**、(c) **AIの過剰書き換えを防ぐ構造化差分指示** に価値を集中する。
併用フロー: 見た目探索はClaude Design → 構造化・反復改修はUI Composer → 実装はClaude Code。

### 設計原則(継続)

- APIキー不要・完全静的(GitHub Pages、localStorage + JSON入出力)
- 単一の真実: `SpecTree` JSON。全出力・全編集はここを経由
- ライブラリ非依存(アダプタ層)、Figmaの再発明はしない(ワイヤーフレーム忠実度)

---

## 2. モード構成(v2で2モード制に)

### 2.1 UIモード(v1の機能)
アプリ/画面のUIをコンポーネントで組み立てる。カタログは component.gallery 準拠60種 + Phosphor Icons。

### 2.2 レポートモード(新規)
AI相談結果の共有などに使う自己完結HTMLレポートの作成・改修に特化。

**レポート専用コンポーネントセット(約15種):**
- 構造系: Section(見出し+本文)、目次(TOC)、Hero/タイトルブロック、2カラム/3カラムレイアウト
- データ系: サマリーカード(KPI)、比較表、データテーブル、チャートプレースホルダ(種類+データ性質を指定)
- 強調系: コールアウト(info/warning/success)、引用、タイムライン、ステップフロー
- その他: Rawブロック(後述)、フッター/出典

**出力:** 単一HTML(Tailwind CDN or インラインCSS、依存ゼロで開ける)+ 編集指示プロンプト。

---

## 3. インポート & ラウンドトリップ(新規・コア機能)

「元のデータを渡して直接編集」を実現する3経路。

### 経路A: スペックJSONインポート(ネイティブ)
自ツール製JSONの取込。バリデーション+バージョンマイグレーション付き。

### 経路B: HTML直接インポート(レポートモード用)
ブラウザの `DOMParser` で自己完結HTMLを解析し、SpecTreeへマッピング。
- 見出し(h1-h3)→Section、table→データテーブル、既知のクラスパターン→対応コンポーネント
- **非破壊原則:** 認識できない要素はパースせず `RawBlock` ノード(HTML文字列をそのまま保持)として取り込み、出力時に無加工で書き戻す。「編集した部分以外は1バイトも変わらない」を保証する
- 自ツール出力のHTMLには `data-uic-id` / `data-uic-type` 属性を埋め込み、再インポート時に完全復元(ロスレス往復)

### 経路C: AI逆変換(既存コード用)
React等のコードはツール内でパースしない。同梱の**逆変換プロンプト**(`prompts/reverse-convert.md`)をClaude Codeに渡し、コード→SpecTree JSONに変換させてから経路Aで取込む。
- 生成コード側にも `data-uic-id` を埋めるアダプタオプションを用意し、往復の安定性を確保
- 逆変換の精度検証用に、往復テスト(SpecTree→コード→SpecTree)のチェックリストを同梱

---

## 4. 差分プロンプト & 凍結マーク(v2でコアに昇格)

改修ワークフローの中核。インポート機能とセットで初めて価値が出るため、Phase 2の目玉とする。

- **スナップショット:** SpecTreeの版管理(localStorage、lz-string圧縮)。インポート直後に自動で「基準版」を作成
- **ツリーdiff:** 追加/削除/変更/移動をノード単位で検出
- **差分プロンプト生成:** 「以下の差分のみ実装。他は変更しないこと」形式で出力
- **凍結マーク(🔒):** 任意ノードに変更禁止フラグ。プロンプトに「次の要素は現状維持: ...」として明示され、AIの過剰書き換えを構造的に防ぐ
- レポートモードでは「セクション3の表のみ差し替え、他セクションは非変更」のような部分改修指示が主用途

---

## 5. アーキテクチャ(v2)

```
┌────────────────────────────────────────────────┐
│  モード切替: [UIモード] [レポートモード]              │
├───────────┬──────────────┬─────────────────────┤
│ 統合カタログ  │ GUIキャンバス    │ プロパティパネル        │
│ (モード連動)  │ (D&D/ツリー)    │ (+凍結マーク)          │
├───────────┴──────────────┴─────────────────────┤
│   SpecTree(単一の真実) + スナップショット履歴          │
├────────────────────────────────────────────────┤
│ インポート層                出力層                   │
│ ├ JSON取込          ├ Prompt Generator(全量/差分)  │
│ ├ HTML取込(DOMParser)├ Spec (Markdown+Mermaid)     │
│ └ AI逆変換プロンプト   ├ Code Generator(アダプタ層)   │
│                     └ HTML Generator(レポート)     │
└────────────────────────────────────────────────┘
```

### SpecTreeの拡張(v2)

```typescript
interface ComponentNode {
  id: string;               // data-uic-id と同値
  type: string;             // カタログid or "RawBlock"
  props: Record<string, unknown>;
  icon?: { name: string; weight: PhosphorWeight };
  behavior?: string;        // 挙動メモ
  frozen?: boolean;         // 凍結マーク
  raw?: string;             // RawBlock時のHTML原文(非破壊保持)
  children?: ComponentNode[];
}

interface SpecDocument {
  meta: { name: string; mode: "ui" | "report"; targetLibrary: string; version: number };
  tree: ComponentNode;
  tokens?: DesignTokens;    // Phase 2
  snapshots: SnapshotRef[]; // 差分プロンプトの基準
}
```

---

## 6. 技術スタック(変更なし+追記)

React + Vite + TypeScript / Tailwind / dnd-kit / Zustand / @phosphor-icons/react / GitHub Pages。
v2追記: lz-string(スナップショット圧縮・URL共有)、DOMParser(標準API、依存追加なし)。

---

## 7. 開発フェーズ(v2再編)

### Phase 1: MVP(UIモード基盤)— 変更なし
カタログ(主要20種+Phosphor検索)、D&Dキャンバス、プロパティパネル、全量プロンプト出力、localStorage保存。

### Phase 2: 改修ワークフロー(v2の本丸)
- スナップショット + ツリーdiff + **差分プロンプト生成**
- **凍結マーク**
- スペックJSONエクスポート/インポート(経路A)
- **AI逆変換プロンプト同梱**(経路C)+ 往復テストチェックリスト

### Phase 3: レポートモード
- レポート用コンポーネント15種 + HTML Generator(自己完結HTML)
- **HTML直接インポート(経路B、RawBlock非破壊)**
- data-uic-id ロスレス往復
- ダミーデータ指示、デザイントークン

### Phase 4: 拡充
- カタログ60種完成、shadcn/MUIアダプタ、画面テンプレート
- URL共有(lz-string)、a11yリント、画面遷移エディタ(Mermaid)
- Markdownスペック文書、コマンドパレット

※ Reactコード直接生成はPhase 4に後退(Claude Designとの重複領域のため優先度を下げ、プロンプト出力を主力とする)

---

## 8. リポジトリ構成(v2)

```
ui-composer/
├── CLAUDE.md
├── prompts/
│   ├── 01-catalog-generation.md
│   └── reverse-convert.md        # AI逆変換プロンプト(Phase 2)
├── src/
│   ├── data/                     # components.json / icons.json / report-components.json
│   ├── canvas/  ├── catalog/  ├── inspector/
│   ├── importers/                # json.ts / html.ts(DOMParser)
│   ├── generators/               # prompt.ts / diff-prompt.ts / spec.ts / html-report.ts / code/
│   ├── diff/                     # ツリーdiffアルゴリズム
│   └── store/                    # SpecTree + snapshots
├── scripts/build-catalog.ts
└── .github/workflows/deploy.yml
```

---

## 9. リスクと割り切り(v2)

- **HTMLインポートの認識率**: 100%は目指さない。認識外はRawBlockで非破壊保持できれば実用十分
- **AI逆変換の揺れ**: プロンプトにスキーマ+検証手順を含め、インポート時バリデーションで弾く
- **Claude Designの進化**: 0→1生成領域は今後も同製品が強くなる前提。差分指示・非破壊改修・枠ゼロ消費の3点に投資を集中し、重複領域(コード直接生成等)は深追いしない
- Opus使用ポイント(追加): ツリーdiffアルゴリズム設計、HTMLインポートのマッピング規則設計、RawBlock境界の設計
