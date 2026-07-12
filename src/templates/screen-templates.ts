/**
 * Screen templates (docs/02 feature #3).
 * Node ids here are placeholders — applyTemplate clones with fresh ids.
 */

import type { ComponentNode } from "../types/spec";

export interface ScreenTemplate {
  id: string;
  nameJa: string;
  description: string;
  nodes: ComponentNode[];
}

function n(
  type: string,
  props: Record<string, unknown>,
  children?: ComponentNode[],
  behavior?: string,
): ComponentNode {
  return {
    id: `tpl-${type}`,
    type,
    props,
    ...(behavior ? { behavior } : {}),
    ...(children ? { children } : {}),
  };
}

export const screenTemplates: ScreenTemplate[] = [
  {
    id: "login",
    nameJa: "ログイン",
    description: "メール+パスワードの標準ログイン画面",
    nodes: [
      n("card", { title: "ログイン" }, [
        n("text-input", {
          label: "メールアドレス",
          inputType: "email",
          required: true,
        }),
        n("text-input", {
          label: "パスワード",
          inputType: "password",
          required: true,
        }),
        n("checkbox", { label: "ログイン状態を保持する", checked: false }),
        n(
          "button",
          { label: "ログイン", variant: "primary" },
          undefined,
          "クリックで認証。失敗時はフォーム上部にエラーを表示",
        ),
        n("link", { label: "パスワードをお忘れですか?", href: "#" }),
      ]),
    ],
  },
  {
    id: "settings",
    nameJa: "設定",
    description: "タブ切替式の設定画面",
    nodes: [
      n("header", { title: "設定", sticky: true }),
      n("tabs", { tabs: "プロフィール, 通知, セキュリティ" }, [
        n("form", { title: "プロフィール", submitLabel: "保存" }, [
          n("text-input", { label: "表示名", required: true }),
          n("textarea", { label: "自己紹介", rows: 3 }),
          n("switch", { label: "プロフィールを公開する", checked: true }),
        ]),
      ]),
    ],
  },
  {
    id: "dashboard",
    nameJa: "ダッシュボード",
    description: "KPIカード+一覧のダッシュボード",
    nodes: [
      n("header", { title: "ダッシュボード", sticky: true, showSearch: true }),
      n("grid", { columns: "3", gap: "md" }, [
        n("stat-card", { label: "月間売上", value: "¥1,234,000", change: "+12.3%", trend: "up" }),
        n("stat-card", { label: "新規顧客", value: "48件", change: "+8件", trend: "up" }),
        n("stat-card", { label: "解約率", value: "1.2%", change: "-0.3pt", trend: "down" }),
      ]),
      n("card", { title: "最近の注文" }, [
        n("table", {
          columns: "注文ID, 顧客名, 金額, ステータス, 日付",
          rowCount: 5,
          sortable: true,
        }),
      ]),
    ],
  },
  {
    id: "crud-list-detail",
    nameJa: "CRUD一覧+詳細",
    description: "検索・一覧・詳細表示の管理画面",
    nodes: [
      n("header", { title: "顧客管理", sticky: true }),
      n("toolbar", { align: "space-between" }, [
        n("search-field", { placeholder: "顧客名・会社名で検索" }),
        n(
          "button",
          { label: "新規登録", variant: "primary" },
          undefined,
          "クリックで登録モーダルを開く",
        ),
      ]),
      n("table", {
        columns: "顧客名, 会社名, ステータス, 最終更新",
        rowCount: 8,
        sortable: true,
        selectable: true,
      }, undefined, "行クリックで詳細カードに内容を表示"),
      n("pagination", { totalPages: 10 }),
      n("card", { title: "顧客詳細" }, [
        n("description-list", {
          items: "氏名: 山田太郎, 会社: 株式会社アオバ製作所, 部署: 営業部, ステータス: 承認済み",
          layout: "horizontal",
        }),
        n("button-group", { buttons: "編集, 複製, 削除", selectionMode: "none" }),
      ]),
    ],
  },
  {
    id: "form-wizard",
    nameJa: "フォームウィザード",
    description: "ステップ式の入力フォーム",
    nodes: [
      n("stepper", { steps: "基本情報, 詳細入力, 確認, 完了", currentStep: 1 }),
      n("form", { title: "基本情報", submitLabel: "次へ", showCancel: true }, [
        n("text-input", { label: "氏名", required: true }),
        n("text-input", { label: "メールアドレス", inputType: "email", required: true }),
        n("select", { label: "お問い合わせ種別", options: "見積依頼, 資料請求, その他" }),
        n("radio-button", { label: "希望連絡方法", options: "メール, 電話" }),
      ], "「次へ」で入力検証し、エラーがなければステップ2へ進む"),
    ],
  },
];
