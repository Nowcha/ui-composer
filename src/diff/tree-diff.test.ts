import { describe, expect, test } from "vitest";
import type { ComponentNode } from "../types/spec";
import { diffTrees, isEmptyDiff } from "./tree-diff";

function root(children: ComponentNode[]): ComponentNode {
  return { id: "root", type: "root", props: {}, children };
}

function node(
  id: string,
  type = "button",
  extra: Partial<ComponentNode> = {},
): ComponentNode {
  return { id, type, props: {}, ...extra };
}

describe("diffTrees basics", () => {
  test("identical trees produce an empty diff", () => {
    const tree = root([node("a"), node("b", "card", { children: [node("c")] })]);
    const diff = diffTrees(tree, tree);
    expect(isEmptyDiff(diff)).toBe(true);
  });

  test("throws when given a non-root subtree", () => {
    expect(() => diffTrees(node("a"), root([]))).toThrow();
  });
});

describe("added", () => {
  test("detects an added node with its position", () => {
    const base = root([node("a")]);
    const current = root([node("a"), node("b")]);
    const diff = diffTrees(base, current);
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0]).toMatchObject({ parentId: "root", index: 1 });
    expect(diff.added[0]?.node.id).toBe("b");
  });

  test("reports only the topmost node of an added subtree", () => {
    const base = root([]);
    const current = root([
      node("card-1", "card", { children: [node("btn-1")] }),
    ]);
    const diff = diffTrees(base, current);
    expect(diff.added.map((e) => e.node.id)).toEqual(["card-1"]);
  });

  test("addition does not flag shifted siblings as moved", () => {
    const base = root([node("a"), node("b")]);
    const current = root([node("new"), node("a"), node("b")]);
    const diff = diffTrees(base, current);
    expect(diff.added).toHaveLength(1);
    expect(diff.moved).toHaveLength(0);
  });
});

describe("removed", () => {
  test("detects a removed node", () => {
    const base = root([node("a"), node("b")]);
    const current = root([node("a")]);
    const diff = diffTrees(base, current);
    expect(diff.removed.map((e) => e.node.id)).toEqual(["b"]);
  });

  test("reports only the topmost node of a removed subtree", () => {
    const base = root([node("card-1", "card", { children: [node("btn-1")] })]);
    const current = root([]);
    const diff = diffTrees(base, current);
    expect(diff.removed.map((e) => e.node.id)).toEqual(["card-1"]);
  });

  test("removal does not flag shifted siblings as moved", () => {
    const base = root([node("a"), node("b"), node("c")]);
    const current = root([node("b"), node("c")]);
    const diff = diffTrees(base, current);
    expect(diff.removed).toHaveLength(1);
    expect(diff.moved).toHaveLength(0);
  });
});

describe("moved", () => {
  test("detects a cross-parent move", () => {
    const base = root([
      node("card-1", "card", { children: [] }),
      node("btn-1"),
    ]);
    const current = root([
      node("card-1", "card", { children: [node("btn-1")] }),
    ]);
    const diff = diffTrees(base, current);
    expect(diff.moved).toHaveLength(1);
    expect(diff.moved[0]).toMatchObject({
      id: "btn-1",
      fromParentId: "root",
      toParentId: "card-1",
    });
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });

  test("detects a same-parent reorder", () => {
    const base = root([node("a"), node("b"), node("c")]);
    const current = root([node("c"), node("a"), node("b")]);
    const diff = diffTrees(base, current);
    expect(diff.moved.map((m) => m.id)).toContain("c");
  });
});

describe("changed", () => {
  test("detects prop changes with field names", () => {
    const base = root([node("a", "button", { props: { label: "保存" } })]);
    const current = root([
      node("a", "button", { props: { label: "送信" }, frozen: true }),
    ]);
    const diff = diffTrees(base, current);
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0]?.fields.sort()).toEqual(["frozen", "props"]);
  });

  test("icon and behavior changes are detected", () => {
    const base = root([node("a")]);
    const current = root([
      node("a", "button", {
        icon: { name: "check", weight: "regular" },
        behavior: "クリックで保存",
      }),
    ]);
    const diff = diffTrees(base, current);
    expect(diff.changed[0]?.fields.sort()).toEqual(["behavior", "icon"]);
  });

  test("a moved node with changed props appears in both lists", () => {
    const base = root([
      node("card-1", "card", { children: [node("btn-1")] }),
    ]);
    const current = root([
      node("card-1", "card", { children: [] }),
      node("btn-1", "button", { props: { label: "OK" } }),
    ]);
    const diff = diffTrees(base, current);
    expect(diff.moved.map((m) => m.id)).toEqual(["btn-1"]);
    expect(diff.changed.map((c) => c.id)).toEqual(["btn-1"]);
  });
});
