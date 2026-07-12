import { describe, expect, test } from "vitest";
import type { ComponentNode } from "../types/spec";
import {
  cloneWithNewIds,
  collectIds,
  countNodes,
  findNode,
  findParent,
  insertNode,
  isDescendant,
  moveNode,
  removeNode,
  updateNode,
} from "./tree-utils";

function fixture(): ComponentNode {
  return {
    id: "root",
    type: "root",
    props: {},
    children: [
      {
        id: "card-1",
        type: "card",
        props: { title: "A" },
        children: [
          { id: "button-1", type: "button", props: { label: "OK" } },
        ],
      },
      { id: "input-1", type: "text-input", props: {} },
    ],
  };
}

describe("findNode / findParent", () => {
  test("finds a nested node by id", () => {
    const found = findNode(fixture(), "button-1");
    expect(found?.type).toBe("button");
  });

  test("returns undefined when id does not exist", () => {
    expect(findNode(fixture(), "nope")).toBeUndefined();
  });

  test("finds the parent of a nested node", () => {
    expect(findParent(fixture(), "button-1")?.id).toBe("card-1");
  });
});

describe("updateNode", () => {
  test("returns a new tree with merged props, original untouched", () => {
    const tree = fixture();
    const next = updateNode(tree, "button-1", { props: { label: "Save" } });
    expect(findNode(next, "button-1")?.props.label).toBe("Save");
    expect(findNode(tree, "button-1")?.props.label).toBe("OK");
    expect(next).not.toBe(tree);
  });

  test("sets the frozen mark", () => {
    const next = updateNode(fixture(), "card-1", { frozen: true });
    expect(findNode(next, "card-1")?.frozen).toBe(true);
  });
});

describe("insertNode", () => {
  test("appends to the end by default", () => {
    const next = insertNode(fixture(), "root", {
      id: "new-1",
      type: "badge",
      props: {},
    });
    expect(next.children?.map((c) => c.id)).toEqual([
      "card-1",
      "input-1",
      "new-1",
    ]);
  });

  test("inserts at a specific index", () => {
    const next = insertNode(
      fixture(),
      "root",
      { id: "new-1", type: "badge", props: {} },
      0,
    );
    expect(next.children?.[0]?.id).toBe("new-1");
  });

  test("returns tree unchanged when parent is missing", () => {
    const tree = fixture();
    const next = insertNode(tree, "ghost", {
      id: "new-1",
      type: "badge",
      props: {},
    });
    expect(collectIds(next)).toEqual(collectIds(tree));
  });
});

describe("removeNode", () => {
  test("removes a nested node and its subtree", () => {
    const next = removeNode(fixture(), "card-1");
    expect(findNode(next, "card-1")).toBeUndefined();
    expect(findNode(next, "button-1")).toBeUndefined();
    expect(findNode(next, "input-1")).toBeDefined();
  });
});

describe("moveNode", () => {
  test("moves a node into another container", () => {
    const next = moveNode(fixture(), "input-1", "card-1", 0);
    expect(findParent(next, "input-1")?.id).toBe("card-1");
    expect(findNode(next, "card-1")?.children?.[0]?.id).toBe("input-1");
  });

  test("rejects moving a node into its own subtree", () => {
    const tree = fixture();
    const next = moveNode(tree, "card-1", "button-1");
    expect(next).toBe(tree);
  });

  test("rejects moving onto itself", () => {
    const tree = fixture();
    expect(moveNode(tree, "card-1", "card-1")).toBe(tree);
  });
});

describe("isDescendant", () => {
  test("detects direct and deep descendants", () => {
    const tree = fixture();
    expect(isDescendant(tree, "root", "button-1")).toBe(true);
    expect(isDescendant(tree, "card-1", "button-1")).toBe(true);
    expect(isDescendant(tree, "input-1", "button-1")).toBe(false);
  });
});

describe("cloneWithNewIds", () => {
  test("assigns fresh ids to every node in the subtree", () => {
    let n = 0;
    const clone = cloneWithNewIds(fixture(), (type) => `${type}-x${n++}`);
    const originalIds = new Set(collectIds(fixture()));
    for (const id of collectIds(clone)) {
      expect(originalIds.has(id)).toBe(false);
    }
    expect(countNodes(clone)).toBe(countNodes(fixture()));
  });
});
