# ADR-001: SpecTree型設計とZustandストア設計

- 日付: 2026-07-12(Session 1)
- ステータス: 採用

## コンテキスト

設計書v2(docs/01-design-v2.md §5)の SpecTree スキーマを TypeScript 型に落とし込み、
undo/redo を備えたストアを設計する。Phase 2(差分プロンプト)・Phase 3(HTML往復)を
後付けしやすい形にしておくことが最重要。

## 決定事項

### 1. 型定義(src/types/spec.ts)

- `ComponentNode.id` は生成HTMLの `data-uic-id` と同値とする(Phase 3 のロスレス往復の前提)。
  ID形式は `{type}-{ランダム6文字}`(例: `button-a1b2c3`)で人間可読性を確保
- `frozen` / `raw` / `behavior` は v2 設計書どおり Phase 1 から型に含める
  (後からの型変更はマイグレーションコストが高いため、先に schema を確定)
- ツリーのルートは特殊ノード `type: "root"`(カタログ外)。キャンバス直下の操作を
  「rootへの子追加」に統一でき、ツリー操作の分岐が消える
- `SPEC_VERSION = 1` を導入。インポート時のバージョンマイグレーションの基盤

### 2. ツリー操作は純関数に分離(src/store/tree-utils.ts)

- `findNode / insertNode / removeNode / moveNode / updateNode / cloneWithNewIds` 等
- **全関数がイミュータブル**(新ツリーを返す)。no-op時は入力参照をそのまま返し、
  ストア側で「参照同一なら履歴に積まない」判定に利用
- `moveNode` は自己サブツリーへの移動を拒否(D&D実装前に不変条件をここで保証)
- Phase 2 のツリーdiffアルゴリズムも同じモジュール群に置く想定

### 3. Zustandストア(src/store/spec-store.ts)

- undo/redo は **treeの構造スナップショット方式**(past/future スタック、上限100件)。
  イミュータブル操作なのでスナップショットは参照共有され、メモリコストは実質差分のみ
- **undo対象は tree の変更のみ**。選択状態・meta(名前/モード)は履歴に載せない
  (「モード切替がCtrl+Zで戻る」体験は直感に反するため)
- コンポーネントからの直接 `set` は禁止。全変更はアクション経由(CLAUDE.md規約)

### 4. カタログデータパイプライン

- コンポーネント定義のソースは `scripts/catalog-seed.ts`(TypeScript、型チェック付き)。
  `npm run gen:catalog` がバリデーション(id重複/kebab-case/enum整合)を通して
  `src/data/components.json` を生成。**data/*.json は手編集禁止**
- icons.json は `@phosphor-icons/core` から機械生成(1,512種)。
  アプリ本体ではまだ import しない(バンドル肥大防止。プレビューは後続セッションで
  動的import + 仮想スクロール)

## 却下した代替案

- **Immer + patches による undo/redo**: 依存が増える。イミュータブル純関数 +
  構造スナップショットで十分かつテスト容易
- **ノードの正規化(flat map)ストア**: diff・往復変換が主戦場のツールでは
  ツリー形のままの方が入出力(JSON/HTML)との対応が素直。パフォーマンス問題が
  出たら再検討(ワイヤーフレーム級なら数百ノードで頭打ちの想定)
- **selectionのundo対象化**: 却下(上記)

## 影響

- Session 3(D&D)は `moveNodeById` アクションをそのまま呼べばよい
- Session 4(プロンプト生成)は `SpecDocument` を入力とする純関数を generators/ に足すだけ
- Phase 2 のスナップショットは `SnapshotRef`(参照)+ localStorage(実体)の分離が既に型化済み
