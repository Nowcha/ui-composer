# ADR-005: CodeGeneratorアダプタ層と plain-tailwind 実装

- 日付: 2026-07-12(Phase 4)
- ステータス: 採用

## コンテキスト

3形式出力(プロンプト / Markdown文書 / Reactコード)の最後の柱。
設計書v2 §1 で「コード直接生成はClaude Designと重複するため深追いしない」
と判定された領域のため、**プロンプト出力を主力としたまま、出発点として
使える最小限のコード生成**に留める。

## 決定事項

1. **アダプタインターフェース**(src/generators/code/types.ts):
   `CodeGenerator { id, label, generate(doc): GeneratedFile[] }`。
   `id` は `SpecMeta.targetLibrary` と一致。レジストリ(index.ts)経由で解決し、
   未知のライブラリ指定は plain-tailwind にフォールバック
2. **戻り値は GeneratedFile[]**(単一文字列ではない)。shadcn/MUIアダプタが
   複数ファイル(コンポーネント分割、設定ファイル)を返す将来を先取り
3. **plain-tailwind アダプタ**: React + Tailwind、UIライブラリ依存ゼロ。
   例外は @phosphor-icons/react のみ(プロジェクト規約「アイコンはPhosphor統一」)
   で、**アイコン使用時のみ**import文を出力
4. **カバレッジは主要25種+明示的TODOフォールバック**: 未対応typeは
   `{/* TODO: {type} を実装 */}` +破線ボックスで構造を保持。
   静かに欠落させない(AIや人間が見落とさない)
5. **data-uic-id を全要素に付与**(往復・差分指示の対象特定と一貫)
6. **behavior は `{/* TODO(挙動): ... */}` コメント**、frozen は
   `{/* 🔒 変更禁止 */}` コメントとして出力
7. **RawBlock は dangerouslySetInnerHTML で温存**(移植時に元HTMLを
   変更しないこと、というコメント付き)
8. 状態管理が必要な部品(tabs/pagination等)は静的マークアップ+TODOに留める。
   状態ロジックの実装はプロンプト経由でAIに委ねる(このツールの主戦場)

## 却下した代替案

- **AST(ts-morph等)によるコード生成**: 文字列テンプレートで十分な
  忠実度。依存とバンドルが重くなるだけ
- **全67種のレンダラー実装**: 使用頻度の低い部品はTODOフォールバックで
  実用上問題なし。要望が出た型から追加する
