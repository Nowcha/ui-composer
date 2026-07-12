import { describe, expect, test } from "vitest";
import { createEmptyDocument } from "../types/spec";
import { decodeDocumentFromHash, encodeDocumentToHash } from "./url-share";

describe("URL share encode/decode", () => {
  test("round trip restores an equivalent document", () => {
    const doc = createEmptyDocument("ui");
    doc.meta.name = "共有テスト";
    doc.tree.children = [
      { id: "card-1", type: "card", props: { title: "A" }, children: [] },
    ];
    const hash = encodeDocumentToHash(doc);
    expect(hash.startsWith("#s=")).toBe(true);
    expect(decodeDocumentFromHash(hash)).toEqual(doc);
  });

  test("rejects foreign or empty hashes", () => {
    expect(decodeDocumentFromHash("")).toBeNull();
    expect(decodeDocumentFromHash("#other")).toBeNull();
    expect(decodeDocumentFromHash("#s=")).toBeNull();
    expect(decodeDocumentFromHash("#s=not-valid-compressed")).toBeNull();
  });

  test("hash stays URL-safe", () => {
    const doc = createEmptyDocument();
    doc.meta.name = "日本語 & 記号 <test>";
    const hash = encodeDocumentToHash(doc);
    expect(hash).toMatch(/^#s=[A-Za-z0-9+\-$]+$/);
  });
});
