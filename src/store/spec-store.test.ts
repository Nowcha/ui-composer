import { beforeEach, describe, expect, test } from "vitest";
import { useSpecStore } from "./spec-store";
import type { ComponentNode } from "../types/spec";

function node(id: string, type = "button"): ComponentNode {
  return { id, type, props: {} };
}

beforeEach(() => {
  useSpecStore.getState().resetDocument("ui");
});

describe("addNode / removeNodeById", () => {
  test("adds a node under root and selects it", () => {
    useSpecStore.getState().addNode("root", node("btn-1"));
    const { document, selectedNodeId } = useSpecStore.getState();
    expect(document.tree.children?.map((c) => c.id)).toEqual(["btn-1"]);
    expect(selectedNodeId).toBe("btn-1");
  });

  test("removing the selected node clears selection", () => {
    useSpecStore.getState().addNode("root", node("btn-1"));
    useSpecStore.getState().removeNodeById("btn-1");
    const { document, selectedNodeId } = useSpecStore.getState();
    expect(document.tree.children).toHaveLength(0);
    expect(selectedNodeId).toBeNull();
  });
});

describe("undo / redo", () => {
  test("undo restores the previous tree, redo reapplies", () => {
    const store = useSpecStore.getState();
    store.addNode("root", node("btn-1"));
    useSpecStore.getState().addNode("root", node("btn-2"));

    useSpecStore.getState().undo();
    expect(
      useSpecStore.getState().document.tree.children?.map((c) => c.id),
    ).toEqual(["btn-1"]);

    useSpecStore.getState().redo();
    expect(
      useSpecStore.getState().document.tree.children?.map((c) => c.id),
    ).toEqual(["btn-1", "btn-2"]);
  });

  test("a new mutation clears the redo stack", () => {
    useSpecStore.getState().addNode("root", node("btn-1"));
    useSpecStore.getState().addNode("root", node("btn-2"));
    useSpecStore.getState().undo();
    useSpecStore.getState().addNode("root", node("btn-3"));
    useSpecStore.getState().redo(); // must be a no-op
    expect(
      useSpecStore.getState().document.tree.children?.map((c) => c.id),
    ).toEqual(["btn-1", "btn-3"]);
  });

  test("undo with empty history is a no-op", () => {
    const before = useSpecStore.getState().document.tree;
    useSpecStore.getState().undo();
    expect(useSpecStore.getState().document.tree).toBe(before);
  });

  test("no-op mutations do not pollute history", () => {
    useSpecStore.getState().addNode("root", node("btn-1"));
    const pastLen = useSpecStore.getState().past.length;
    // moving a node into its own subtree is rejected by tree-utils
    useSpecStore.getState().moveNodeById("btn-1", "btn-1");
    expect(useSpecStore.getState().past.length).toBe(pastLen);
  });
});

describe("duplicateNode", () => {
  test("duplicates a subtree with fresh ids, inserted after the source", () => {
    useSpecStore.getState().addNode("root", {
      id: "card-1",
      type: "card",
      props: { title: "A" },
      children: [node("btn-1")],
    });
    useSpecStore.getState().duplicateNode("card-1");

    const children = useSpecStore.getState().document.tree.children ?? [];
    expect(children).toHaveLength(2);
    expect(children[0]?.id).toBe("card-1");
    expect(children[1]?.id).not.toBe("card-1");
    expect(children[1]?.type).toBe("card");
    expect(children[1]?.children?.[0]?.id).not.toBe("btn-1");
  });
});

describe("updateNodeById", () => {
  test("updates props and records history", () => {
    useSpecStore.getState().addNode("root", node("btn-1"));
    useSpecStore
      .getState()
      .updateNodeById("btn-1", { props: { label: "保存" }, frozen: true });
    const child = useSpecStore.getState().document.tree.children?.[0];
    expect(child?.props.label).toBe("保存");
    expect(child?.frozen).toBe(true);

    useSpecStore.getState().undo();
    const reverted = useSpecStore.getState().document.tree.children?.[0];
    expect(reverted?.props.label).toBeUndefined();
  });
});

describe("document-level actions", () => {
  test("setMode / setDocumentName do not touch undo history", () => {
    useSpecStore.getState().setMode("report");
    useSpecStore.getState().setDocumentName("週次レポート");
    const { document, past } = useSpecStore.getState();
    expect(document.meta.mode).toBe("report");
    expect(document.meta.name).toBe("週次レポート");
    expect(past).toHaveLength(0);
  });

  test("resetDocument clears tree, selection, and history", () => {
    useSpecStore.getState().addNode("root", node("btn-1"));
    useSpecStore.getState().resetDocument();
    const { document, past, future, selectedNodeId } = useSpecStore.getState();
    expect(document.tree.children).toHaveLength(0);
    expect(past).toHaveLength(0);
    expect(future).toHaveLength(0);
    expect(selectedNodeId).toBeNull();
  });
});
