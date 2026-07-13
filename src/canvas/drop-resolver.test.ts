import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../types/spec";
import {
  adjustInsertionForMove,
  indicatorToInsertion,
  isHorizontalFlow,
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
      parentType: "root",
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
      parentType: "root",
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

  it("uses the x axis inside horizontal-flow parents", () => {
    const base = {
      overNodeId: "a",
      overRect: rect,
      isContainer: false,
      parentType: "toolbar",
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
