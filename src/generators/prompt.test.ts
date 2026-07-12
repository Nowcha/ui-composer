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

  test("handles an empty tree", () => {
    const doc = makeDocument();
    doc.tree = { id: "root", type: "root", props: {}, children: [] };
    const output = generatePrompt(doc);
    expect(output).toContain("(コンポーネントなし)");
    expect(output).not.toContain("## 変更禁止");
  });
});
