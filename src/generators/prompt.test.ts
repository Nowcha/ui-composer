import { describe, expect, test } from "vitest";
import type { SpecDocument } from "../types/spec";
import { SPEC_VERSION } from "../types/spec";
import { generatePrompt } from "./prompt";

function makeDocument(): SpecDocument {
  return {
    meta: {
      name: "ログイン画面",
      mode: "ui",
      targetLibrary: "plain-tailwind",
      version: SPEC_VERSION,
    },
    tree: {
      id: "root",
      type: "root",
      props: {},
      children: [
        {
          id: "card-a1",
          type: "card",
          props: { title: "ログイン" },
          children: [
            {
              id: "text-input-b2",
              type: "text-input",
              props: { label: "メールアドレス", inputType: "email" },
            },
            {
              id: "text-input-c3",
              type: "text-input",
              props: { label: "パスワード", inputType: "password" },
              frozen: true,
            },
            {
              id: "button-d4",
              type: "button",
              props: { label: "ログイン", variant: "primary" },
              icon: { name: "sign-in", weight: "regular" },
              behavior: "クリックで認証し、成功時はダッシュボードへ遷移",
            },
          ],
        },
      ],
    },
    snapshots: [],
  };
}

describe("generatePrompt", () => {
  test("matches snapshot for a representative document", () => {
    expect(generatePrompt(makeDocument())).toMatchSnapshot();
  });

  test("is deterministic (same input, same output)", () => {
    const doc = makeDocument();
    expect(generatePrompt(doc)).toBe(generatePrompt(doc));
  });

  test("does not mutate the input document", () => {
    const doc = makeDocument();
    const before = JSON.stringify(doc);
    generatePrompt(doc);
    expect(JSON.stringify(doc)).toBe(before);
  });

  test("renders hierarchy with node ids", () => {
    const output = generatePrompt(makeDocument());
    expect(output).toContain("カード(Card) [id: card-a1]");
    expect(output).toContain("[id: button-d4]");
    expect(output).toContain("data-uic-id");
  });

  test("lists frozen nodes in the do-not-change section", () => {
    const output = generatePrompt(makeDocument());
    expect(output).toContain("## 変更禁止(凍結)要素");
    expect(output).toContain("[id: text-input-c3]");
  });

  test("includes icon and behavior annotations", () => {
    const output = generatePrompt(makeDocument());
    expect(output).toContain("sign-in (Phosphor, weight=regular)");
    expect(output).toContain("挙動: クリックで認証し");
  });

  test("aggregates a11y notes for used components only", () => {
    const output = generatePrompt(makeDocument());
    expect(output).toContain("## 実装時のアクセシビリティ要件");
    expect(output).toContain("テキスト入力:");
    // Table is not used in this document, so its notes must not appear
    expect(output).not.toContain("テーブル:");
  });

  test("includes default prompt rules for the mode", () => {
    const output = generatePrompt(makeDocument());
    expect(output).toContain("## 共通実装規約");
    expect(output).toContain("モバイルファースト");
    // report-only rules must not leak into UI mode
    expect(output).not.toContain("単一HTMLファイル");
  });

  test("empty promptRules selection removes the rules section", () => {
    const doc = makeDocument();
    doc.meta.promptRules = [];
    expect(generatePrompt(doc)).not.toContain("## 共通実装規約");
  });

  test("dummy data section appears only with data-hungry components", () => {
    const doc = makeDocument();
    expect(generatePrompt(doc)).not.toContain("## ダミーデータ指示");

    doc.tree.children?.push({
      id: "table-x1",
      type: "table",
      props: { columns: "名前, 状態" },
    });
    const output = generatePrompt(doc);
    expect(output).toContain("## ダミーデータ指示");
    expect(output).toContain("承認待ち");
  });

  test("annotates a11y lint issues", () => {
    const doc = makeDocument();
    doc.tree.children?.push({
      id: "img-x1",
      type: "image",
      props: {},
    });
    const output = generatePrompt(doc);
    expect(output).toContain("## 実装時の注意(スペック検査で検出)");
    expect(output).toContain("[id: img-x1]");
    // clean documents have no lint section
    expect(generatePrompt(makeDocument())).not.toContain(
      "スペック検査で検出",
    );
  });

  test("handles an empty tree", () => {
    const doc = makeDocument();
    doc.tree = { id: "root", type: "root", props: {}, children: [] };
    const output = generatePrompt(doc);
    expect(output).toContain("(コンポーネントなし)");
    expect(output).not.toContain("## 変更禁止");
  });

  test("embeds the Mermaid flow section only when a flow exists", () => {
    expect(generatePrompt(makeDocument())).not.toContain("## 画面遷移");

    const doc = makeDocument();
    doc.flow = {
      screens: ["ログイン", "ホーム"],
      transitions: [
        { id: "t1", from: "ログイン", to: "ホーム", trigger: "ログイン成功" },
      ],
    };
    const output = generatePrompt(doc);
    expect(output).toContain("## 画面遷移");
    expect(output).toContain("```mermaid");
    expect(output).toContain('S0 -->|"ログイン成功"| S1');
    expect(output).toContain("図にない画面・遷移を追加しないこと");
  });

  test("explains 12-column grid semantics only when colSpan is used", () => {
    // default fixture has no colSpan — no grid note
    expect(generatePrompt(makeDocument())).not.toContain("12カラムグリッド");

    const doc = makeDocument();
    doc.tree.children![0]!.children![0]!.props.colSpan = 6;
    const output = generatePrompt(doc);
    expect(output).toContain("12カラムグリッド");
    expect(output).toContain("colSpan=6");
  });
});
