import { describe, expect, test } from "vitest";
import { createEmptyDocument, SPEC_VERSION } from "../types/spec";
import { parseSpecDocument, serializeSpecDocument } from "./persistence";

describe("serialize / parse round trip", () => {
  test("restores an equivalent document", () => {
    const doc = createEmptyDocument("report");
    doc.tree.children = [
      { id: "card-1", type: "card", props: { title: "A" }, children: [] },
    ];
    const restored = parseSpecDocument(serializeSpecDocument(doc));
    expect(restored).toEqual(doc);
  });
});

describe("parseSpecDocument validation", () => {
  test("rejects invalid JSON", () => {
    expect(parseSpecDocument("{not json")).toBeNull();
  });

  test("rejects non-object payloads", () => {
    expect(parseSpecDocument('"string"')).toBeNull();
    expect(parseSpecDocument("null")).toBeNull();
  });

  test("rejects documents missing meta or tree", () => {
    expect(parseSpecDocument(JSON.stringify({ meta: {} }))).toBeNull();
    expect(
      parseSpecDocument(JSON.stringify({ tree: { id: "root", type: "root" } })),
    ).toBeNull();
  });

  test("rejects unknown schema versions", () => {
    const doc = createEmptyDocument();
    const tampered = { ...doc, meta: { ...doc.meta, version: 999 } };
    expect(parseSpecDocument(JSON.stringify(tampered))).toBeNull();
  });

  test("defaults snapshots to empty array when missing", () => {
    const doc = createEmptyDocument();
    const withoutSnapshots: Record<string, unknown> = {
      meta: doc.meta,
      tree: doc.tree,
    };
    const restored = parseSpecDocument(JSON.stringify(withoutSnapshots));
    expect(restored?.snapshots).toEqual([]);
  });

  test("accepts the current schema version", () => {
    const doc = createEmptyDocument();
    expect(doc.meta.version).toBe(SPEC_VERSION);
    expect(parseSpecDocument(serializeSpecDocument(doc))).not.toBeNull();
  });
});
