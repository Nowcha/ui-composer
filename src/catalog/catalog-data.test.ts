import { describe, expect, test } from "vitest";
import type { ComponentNode } from "../types/spec";
import {
  getCatalogComponent,
  matchesComponentQuery,
  resolveQuickAddParentId,
} from "./catalog-data";

function tree(children: ComponentNode[] = []): ComponentNode {
  return { id: "root", type: "root", props: {}, children };
}

describe("matchesComponentQuery", () => {
  const button = getCatalogComponent("button")!;

  test("matches by nameJa, id, and English name case-insensitively", () => {
    expect(matchesComponentQuery(button, "ボタン")).toBe(true);
    expect(matchesComponentQuery(button, "button")).toBe(true);
    expect(matchesComponentQuery(button, "BUTTON")).toBe(true);
  });

  test("false for unrelated queries", () => {
    expect(matchesComponentQuery(button, "テーブル")).toBe(false);
  });
});

describe("resolveQuickAddParentId", () => {
  test("returns tree root id when nothing is selected", () => {
    expect(resolveQuickAddParentId(tree(), null)).toBe("root");
  });

  test("returns tree root id when the selected node is not a container", () => {
    const t = tree([{ id: "btn-1", type: "button", props: {} }]);
    expect(resolveQuickAddParentId(t, "btn-1")).toBe("root");
  });

  test("returns the selected node id when it is a container", () => {
    const t = tree([{ id: "card-1", type: "card", props: {}, children: [] }]);
    expect(resolveQuickAddParentId(t, "card-1")).toBe("card-1");
  });

  test("falls back to root when the selected id is stale (not found)", () => {
    expect(resolveQuickAddParentId(tree(), "missing")).toBe("root");
  });
});
