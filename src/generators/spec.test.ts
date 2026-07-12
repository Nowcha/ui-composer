import { describe, expect, test } from "vitest";
import type { SpecDocument } from "../types/spec";
import { SPEC_VERSION } from "../types/spec";
import { generateSpecMarkdown } from "./spec";

function makeDoc(): SpecDocument {
  return {
    meta: {
      name: "顧客管理",
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
          id: "card-a",
          type: "card",
          props: { title: "一覧" },
          frozen: true,
          children: [
            {
              id: "table-b",
              type: "table",
              props: { columns: "名前, 状態" },
              behavior: "行クリックで詳細を表示",
            },
            { id: "btn-c", type: "button", props: { label: "追加" } },
          ],
        },
        { id: "btn-d", type: "button", props: { label: "書き出し" } },
      ],
    },
    snapshots: [],
  };
}

describe("generateSpecMarkdown", () => {
  test("matches snapshot", () => {
    expect(generateSpecMarkdown(makeDoc())).toMatchSnapshot();
  });

  test("counts components and aggregates usage", () => {
    const md = generateSpecMarkdown(makeDoc());
    expect(md).toContain("コンポーネント数: 4");
    expect(md).toContain("| ボタン | `button` | 2 |");
  });

  test("lists behavior specs and frozen marks", () => {
    const md = generateSpecMarkdown(makeDoc());
    expect(md).toContain("## 挙動仕様");
    expect(md).toContain("行クリックで詳細を表示");
    expect(md).toContain("🔒");
  });
});
