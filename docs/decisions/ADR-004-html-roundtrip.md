# ADR-004: HTMLインポートのマッピング規則とRawBlock境界

- 日付: 2026-07-12(Phase 3)
- ステータス: 採用

## コンテキスト

HTML直接インポート(経路B)とHTML Generatorのロスレス往復。
docs/01-design-v2.md §9 でOpus設計ポイントに指定されていた箇所。

## 決定事項

### 1. 自ツール製HTMLの往復は「メタデータ属性」方式

- 生成HTMLの全コンポーネント要素に `data-uic-id` / `data-uic-type` に加え、
  **`data-uic-props`(JSON)/ `data-uic-icon` / `data-uic-behavior` / `data-uic-frozen`**
  を埋め込む。インポート時はレンダリング結果を解析せず属性から直接復元する
- 理由: レンダリングHTMLの逆解析は表示変更のたびに壊れる。属性方式なら
  ジェネレータのHTML表現を自由に変更しても往復が壊れない
- 往復テストで `tree` の深い等価と、再エクスポートHTML の完全一致を担保

### 2. RawBlockはコメントマーカーで区切る

- 出力形式: `<!--uic:raw:{id}-->原文<!--/uic:raw-->`
- 中身はラッパー要素で包まない(divで包むとレイアウト・CSSセレクタに影響するため)。
  マーカーはコメントなので表示に影響ゼロ
- **忠実度の限界(明文化)**: 「1バイトも変わらない」は DOMParser の
  シリアライズ正規化の範囲内で保証する(属性クォートの `'` → `"`、
  自己終了タグ表記等は正規化される)。初回インポートで正規形に収束後、
  以降の往復は完全に安定(テストで担保)

### 3. 外部HTML(他ツール製)のマッピング規則

| 認識対象 | 変換先 |
|---|---|
| h1〜h3 | `section`(見出し=title、次の見出しまでの兄弟要素を children に吸収) |
| table | `table`(th→columns。**セルデータは `props.rows` に保持**し内容を失わない) |
| blockquote | `quote` |
| 上記以外の要素・テキスト・コメント | `RawBlock`(serializeしたまま保持) |

- 認識率100%は目指さない(設計v2 §9)。認識外がRawBlockで無傷なら実用十分
- 認識ヒューリスティックの拡張は Phase 4 の `import-mappings.json`(データ駆動)で行う

### 4. モード連動カタログ

- `CatalogComponent.modes?: ("ui"|"report")[]`(省略時 `["ui"]`)
- UI/レポート共用コンポーネント(table, quote, timeline等12種)の指定は
  シード各所に書かず `build-catalog.ts` の `REPORT_SHARED_IDS` 変換で一元管理

## 却下した代替案

- **レンダリングHTMLの構造解析による復元**: ジェネレータ変更のたびに
  インポータが壊れる。属性方式に対する利点がない
- **RawBlockのdivラッパー**: 表示・CSSに副作用。コメントマーカーが無害
- **Tailwind CDN読込のレポートHTML**: オフラインで開けない+CSP問題。
  インラインCSS(依存ゼロ)を採用
