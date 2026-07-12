import { describe, expect, test } from "vitest";
import type { ComponentNode, SpecDocument } from "../types/spec";
import { SPEC_VERSION } from "../types/spec";
import { generateDiffPrompt } from "./diff-prompt";

function makeDoc(tree: ComponentNode): SpecDocument {
  return {
    meta: {
      name: "設定画面",
      mode: "ui",
      targetLibrary: "plain-tailwind",
      version: SPEC_VERSION,
    },
    tree,
    snapshots: [],
  };
}

function baseTree(): ComponentNode {
  return {
    id: "root",
    type: "root",
    props: {},
    children: [
      {
        id: "card-a1",
        type: "card",
        props: { title: "通知設定" },
        children: [
          {
            id: "switch-b2",
            type: "switch",
            props: { label: "メール通知", checked: false },
          },
        ],
      },
    ],
  };
}

describe("generateDiffPrompt", () => {
  test("matches snapshot for a mixed diff", () => {
    const current: ComponentNode = {
      id: "root",
      type: "root",
      props: {},
      children: [
        {
          id: "card-a1",
          type: "card",
          props: { title: "通知設定" },
          frozen: true,
          children: [
            {
              id: "switch-b2",
              type: "switch",
              props: { label: "メール通知を受け取る", checked: true },
            },
            {
              id: "button-c3",
              type: "button",
              props: { label: "保存", variant: "primary" },
              behavior: "クリックで設定を保存",
            },
          ],
        },
      ],
    };
    const output = generateDiffPrompt(baseTree(), makeDoc(current), "初版");
    expect(output).toMatchSnapshot();
  });

  test("states when there is no diff", () => {
    const output = generateDiffPrompt(baseTree(), makeDoc(baseTree()), "初版");
    expect(output).toContain("(差分はありません)");
  });

  test("includes the do-not-change-others instruction", () => {
    const output = generateDiffPrompt(baseTree(), makeDoc(baseTree()), "初版");
    expect(output).toContain("一切変更しないこと");
  });

  test("added subtree is rendered with nested children", () => {
    const current = baseTree();
    current.children?.push({
      id: "card-new",
      type: "card",
      props: { title: "アカウント" },
      children: [
        { id: "btn-new", type: "button", props: { label: "退会" } },
      ],
    });
    const output = generateDiffPrompt(baseTree(), makeDoc(current), "初版");
    expect(output).toContain("## 追加");
    expect(output).toContain("[id: card-new]");
    expect(output).toContain("[id: btn-new]");
  });

  test("removed subtree is a single delete instruction", () => {
    const current: ComponentNode = {
      id: "root",
      type: "root",
      props: {},
      children: [],
    };
    const output = generateDiffPrompt(baseTree(), makeDoc(current), "初版");
    expect(output).toContain("## 削除");
    expect(output).toContain("[id: card-a1] を削除(配下の要素も含む)");
    // The child must not get its own delete line
    expect(output).not.toContain("[id: switch-b2] を削除");
  });

  test("prop changes show before → after values", () => {
    const current = baseTree();
    const switchNode = current.children?.[0]?.children?.[0];
    if (switchNode) switchNode.props = { label: "メール通知", checked: true };
    const output = generateDiffPrompt(baseTree(), makeDoc(current), "初版");
    expect(output).toContain("checked: false → true");
  });
});
