import { describe, expect, test } from "vitest";
import type { ComponentNode } from "../types/spec";
import { lintTree } from "./a11y";

function root(children: ComponentNode[]): ComponentNode {
  return { id: "root", type: "root", props: {}, children };
}

describe("lintTree", () => {
  test("clean tree produces no issues", () => {
    const issues = lintTree(
      root([
        { id: "a", type: "text-input", props: { label: "氏名" } },
        {
          id: "b",
          type: "button",
          props: { label: "保存" },
          icon: { name: "check", weight: "regular" },
        },
      ]),
    );
    expect(issues).toEqual([]);
  });

  test("detects unlabeled inputs (including nested)", () => {
    const issues = lintTree(
      root([
        {
          id: "card-1",
          type: "card",
          props: {},
          children: [{ id: "in-1", type: "text-input", props: { label: " " } }],
        },
      ]),
    );
    expect(issues.map((i) => i.ruleId)).toContain("input-label");
    expect(issues[0]?.nodeId).toBe("in-1");
  });

  test("detects icon-only buttons", () => {
    const issues = lintTree(
      root([
        {
          id: "btn-1",
          type: "button",
          props: { label: "" },
          icon: { name: "trash", weight: "regular" },
        },
      ]),
    );
    expect(issues.map((i) => i.ruleId)).toEqual(["icon-only-button"]);
  });

  test("plain button without label is not an icon-only issue", () => {
    const issues = lintTree(
      root([{ id: "btn-1", type: "button", props: { label: "" } }]),
    );
    expect(issues).toEqual([]);
  });

  test("detects missing image alt and empty table columns", () => {
    const issues = lintTree(
      root([
        { id: "img-1", type: "image", props: {} },
        { id: "tbl-1", type: "table", props: { columns: "" } },
      ]),
    );
    expect(issues.map((i) => i.ruleId).sort()).toEqual([
      "image-alt",
      "table-columns",
    ]);
  });

  test("detects heading level skips between consecutive sections", () => {
    const issues = lintTree(
      root([
        { id: "s1", type: "section", props: { headingLevel: "h2" } },
        { id: "s2", type: "section", props: { headingLevel: "h4" } },
      ]),
    );
    expect(issues.map((i) => i.ruleId)).toEqual(["heading-skip"]);
    expect(issues[0]?.nodeId).toBe("s2");
  });

  test("descending or equal heading levels are fine", () => {
    const issues = lintTree(
      root([
        { id: "s1", type: "section", props: { headingLevel: "h2" } },
        { id: "s2", type: "section", props: { headingLevel: "h3" } },
        { id: "s3", type: "section", props: { headingLevel: "h2" } },
      ]),
    );
    expect(issues).toEqual([]);
  });
});
