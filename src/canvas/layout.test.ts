import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../types/spec";
import { getSpan, isGridFlow, resolveAxis, treeUsesGrid } from "./layout";

describe("getSpan", () => {
  it("defaults to full width when colSpan is absent or invalid", () => {
    expect(getSpan({ props: {} })).toBe(12);
    expect(getSpan({ props: { colSpan: "6" } })).toBe(12);
    expect(getSpan({ props: { colSpan: NaN } })).toBe(12);
  });

  it("clamps and rounds colSpan into 1..12", () => {
    expect(getSpan({ props: { colSpan: 6 } })).toBe(6);
    expect(getSpan({ props: { colSpan: 0 } })).toBe(1);
    expect(getSpan({ props: { colSpan: 99 } })).toBe(12);
    expect(getSpan({ props: { colSpan: 4.4 } })).toBe(4);
  });
});

describe("resolveAxis", () => {
  it("is x inside horizontal-flow containers", () => {
    expect(resolveAxis("toolbar", 12)).toBe("x");
  });

  it("is x for partial-width cells in grid-flow containers", () => {
    expect(resolveAxis("root", 6)).toBe("x");
    expect(resolveAxis("card", 4)).toBe("x");
  });

  it("is y for full-width rows and non-grid containers", () => {
    expect(resolveAxis("root", 12)).toBe("y");
    expect(resolveAxis("sidebar", 6)).toBe("y");
  });

  it("isGridFlow covers the vertical grid containers only", () => {
    expect(isGridFlow("root")).toBe(true);
    expect(isGridFlow("card")).toBe(true);
    expect(isGridFlow("toolbar")).toBe(false);
    expect(isGridFlow("button")).toBe(false);
  });
});

describe("treeUsesGrid", () => {
  const base: ComponentNode = {
    id: "root",
    type: "root",
    props: {},
    children: [
      { id: "a", type: "button", props: {} },
      {
        id: "c",
        type: "card",
        props: {},
        children: [{ id: "b", type: "badge", props: { colSpan: 6 } }],
      },
    ],
  };

  it("finds a colSpan anywhere in the tree", () => {
    expect(treeUsesGrid(base)).toBe(true);
  });

  it("is false when no node declares colSpan", () => {
    const plain: ComponentNode = {
      id: "root",
      type: "root",
      props: {},
      children: [{ id: "a", type: "button", props: {} }],
    };
    expect(treeUsesGrid(plain)).toBe(false);
  });
});
