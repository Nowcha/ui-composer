import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../types/spec";
import {
  adjustInsertionForMove,
  indicatorToInsertion,
  isHorizontalFlow,
  nearestRectId,
  resolveIndicator,
} from "./drop-resolver";

const rect = { top: 100, left: 50, width: 200, height: 100 };

function tree(): ComponentNode {
  return {
    id: "root",
    type: "root",
    props: {},
    children: [
      { id: "a", type: "button", props: {} },
      {
        id: "card1",
        type: "card",
        props: {},
        children: [{ id: "b", type: "badge", props: {} }],
      },
      { id: "c", type: "alert", props: {} },
    ],
  };
}

describe("resolveIndicator", () => {
  it("splits leaf nodes at the vertical midline", () => {
    const base = {
      overNodeId: "a",
      overRect: rect,
      isContainer: false,
      axis: "y" as const,
    };
    expect(
      resolveIndicator({ ...base, pointer: { x: 100, y: 120 } }).position,
    ).toBe("before");
    expect(
      resolveIndicator({ ...base, pointer: { x: 100, y: 180 } }).position,
    ).toBe("after");
  });

  it("gives containers a middle inside band", () => {
    const base = {
      overNodeId: "card1",
      overRect: rect,
      isContainer: true,
      axis: "y" as const,
    };
    expect(
      resolveIndicator({ ...base, pointer: { x: 100, y: 105 } }).position,
    ).toBe("before");
    expect(
      resolveIndicator({ ...base, pointer: { x: 100, y: 150 } }).position,
    ).toBe("inside");
    expect(
      resolveIndicator({ ...base, pointer: { x: 100, y: 195 } }).position,
    ).toBe("after");
  });

  it("uses the x axis when siblings flow horizontally", () => {
    const base = {
      overNodeId: "a",
      overRect: rect,
      isContainer: false,
      axis: "x" as const,
    };
    expect(
      resolveIndicator({ ...base, pointer: { x: 60, y: 150 } }).position,
    ).toBe("before");
    expect(
      resolveIndicator({ ...base, pointer: { x: 240, y: 150 } }).position,
    ).toBe("after");
    expect(isHorizontalFlow("toolbar")).toBe(true);
    expect(isHorizontalFlow("card")).toBe(false);
  });
});

describe("indicatorToInsertion", () => {
  it("maps before/after to the parent slot", () => {
    expect(
      indicatorToInsertion(tree(), { nodeId: "card1", position: "before" }),
    ).toEqual({ parentId: "root", index: 1 });
    expect(
      indicatorToInsertion(tree(), { nodeId: "card1", position: "after" }),
    ).toEqual({ parentId: "root", index: 2 });
  });

  it("maps inside to appending at the container end", () => {
    expect(
      indicatorToInsertion(tree(), { nodeId: "card1", position: "inside" }),
    ).toEqual({ parentId: "card1", index: 1 });
  });

  it("returns null for unknown nodes", () => {
    expect(
      indicatorToInsertion(tree(), { nodeId: "ghost", position: "after" }),
    ).toBeNull();
  });
});

describe("adjustInsertionForMove", () => {
  it("keeps cross-parent moves unchanged", () => {
    expect(
      adjustInsertionForMove(tree(), "a", { parentId: "card1", index: 0 }),
    ).toEqual({ parentId: "card1", index: 0 });
  });

  it("compensates same-parent downward moves", () => {
    // Moving "a" (index 0) to slot 3 → after removal the slot is 2.
    expect(
      adjustInsertionForMove(tree(), "a", { parentId: "root", index: 3 }),
    ).toEqual({ parentId: "root", index: 2 });
  });

  it("treats drops onto the node's own slot as no-ops", () => {
    expect(
      adjustInsertionForMove(tree(), "a", { parentId: "root", index: 0 }),
    ).toBeNull();
    expect(
      adjustInsertionForMove(tree(), "a", { parentId: "root", index: 1 }),
    ).toBeNull();
  });

  it("rejects nesting a container into its own subtree", () => {
    expect(
      adjustInsertionForMove(tree(), "card1", { parentId: "card1", index: 0 }),
    ).toBeNull();
  });
});

describe("nearestRectId", () => {
  // Two span-6 cells side by side with a 12px gap, next row below
  const cells = [
    { id: "left", rect: { top: 0, left: 0, width: 100, height: 40 } },
    { id: "right", rect: { top: 0, left: 112, width: 100, height: 40 } },
    { id: "below", rect: { top: 52, left: 0, width: 212, height: 40 } },
  ];

  it("snaps a pointer in the horizontal gap to the nearest cell", () => {
    expect(nearestRectId({ x: 104, y: 20 }, cells, 16)).toBe("left");
    expect(nearestRectId({ x: 109, y: 20 }, cells, 16)).toBe("right");
  });

  it("snaps a pointer in the vertical gap to the nearest row", () => {
    expect(nearestRectId({ x: 50, y: 44 }, cells, 16)).toBe("left");
    expect(nearestRectId({ x: 50, y: 49 }, cells, 16)).toBe("below");
  });

  it("returns null when nothing is within tolerance", () => {
    expect(nearestRectId({ x: 400, y: 20 }, cells, 16)).toBeNull();
    expect(nearestRectId({ x: 50, y: 200 }, cells, 16)).toBeNull();
  });

  it("prefers the smaller rect on equal distance", () => {
    const nested = [
      { id: "outer", rect: { top: 0, left: 0, width: 300, height: 300 } },
      { id: "inner", rect: { top: 10, left: 10, width: 50, height: 50 } },
    ];
    expect(nearestRectId({ x: 20, y: 20 }, nested, 16)).toBe("inner");
  });

  it("returns null for an empty entry list", () => {
    expect(nearestRectId({ x: 0, y: 0 }, [], 16)).toBeNull();
  });
});
