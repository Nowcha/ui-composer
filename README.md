# UI Composer for AI — キックオフキット

GUIでUIレイアウト/HTMLレポートを組み立て・編集し、Claude Code向けの構造化指示を生成するツールの開発キット。

## 使い方

1. GitHubリポジトリ `ui-composer` を作成し、このキットを丸ごとコミット(CLAUDE.mdはルートに)
2. `docs/03-dev-plan-model-strategy.md` のセッション計画に沿ってClaude Codeで開発開始
   - Session 1冒頭は plan mode + **Opus** で型設計から
3. Session 2 で `prompts/01-catalog-generation.md` を実行(Sonnet)

## ファイル構成

```
CLAUDE.md                          # プロジェクト規約(リポジトリルートに配置)
prompts/
  01-catalog-generation.md         # カタログ60種+Phosphorメタデータ生成プロンプト
docs/
  01-design-v2.md                  # 設計書(最新。v1は経緯参照用)
  01-design-v1.md
  02-additional-features.md        # 追加機能の優先度とフェーズ割当
  03-dev-plan-model-strategy.md    # セッション計画とOpus/Sonnet使い分け
  04-prebuilt-assets.md            # 事前準備資産9種(規約スニペット/ダミーデータ等)
```

## 設計の要点(v2)

- Claude Design/Figmaとは競合せず、**差分プロンプト・凍結マーク・非破壊インポート・枠ゼロ消費**に価値を集中
- UIモード + レポートモードの2モード制
- 単一の真実は SpecTree JSON。全出力(プロンプト/Markdown/HTML/コード)は純関数で導出
- APIキー不要・完全静的(GitHub Pages + localStorage)
