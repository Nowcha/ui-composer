// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import type { SpecDocument } from "../types/spec";
import { SPEC_VERSION } from "../types/spec";
import { generateHtmlReport } from "../generators/html-report";
import { importHtmlReport } from "./html";

function sequentialIds(): (type: string) => string {
  let n = 0;
  return (type) => `${type}-t${n++}`;
}

describe("round trip: generate -> import (lossless)", () => {
  test("restores ids, types, props, frozen, behavior, and RawBlock", () => {
    const original: SpecDocument = {
      meta: {
        name: "往復テスト",
        mode: "report",
        targetLibrary: "plain-tailwind",
        version: SPEC_VERSION,
      },
      tree: {
        id: "root",
        type: "root",
        props: {},
        children: [
          {
            id: "section-a",
            type: "section",
            props: { title: "概要", headingLevel: "h2" },
            frozen: true,
            behavior: "このセクションは印刷時に改ページ",
            children: [
              {
                id: "stat-b",
                type: "stat-card",
                props: { label: "売上", value: "¥1,000", change: "+5%" },
              },
              {
                id: "raw-c",
                type: "RawBlock",
                props: {},
                raw: '<p style="color:blue">レガシー段落</p>',
              },
            ],
          },
          {
            id: "table-d",
            type: "table",
            props: { columns: "名前, 状態", rowCount: 2 },
          },
        ],
      },
      snapshots: [],
    };

    const html = generateHtmlReport(original);
    const imported = importHtmlReport(html);

    expect(imported.meta.name).toBe("往復テスト");
    expect(imported.meta.mode).toBe("report");
    expect(imported.tree).toEqual(original.tree);
  });

  test("unedited round trip twice produces identical HTML", () => {
    const doc: SpecDocument = {
      meta: {
        name: "安定性テスト",
        mode: "report",
        targetLibrary: "plain-tailwind",
        version: SPEC_VERSION,
      },
      tree: {
        id: "root",
        type: "root",
        props: {},
        children: [
          { id: "hero-a", type: "hero", props: { title: "T" } },
          {
            id: "raw-b",
            type: "RawBlock",
            props: {},
            // Note: raw fidelity is up to DOM serialization normalization
            // (e.g. attribute quotes become double quotes) — see ADR-004
            raw: '<div data-x="1">そのまま</div>',
          },
        ],
      },
      snapshots: [],
    };
    const html1 = generateHtmlReport(doc);
    const html2 = generateHtmlReport(importHtmlReport(html1));
    expect(html2).toBe(html1);
  });
});

describe("foreign HTML import (heuristics + non-destructive)", () => {
  test("maps h2 to section absorbing following siblings", () => {
    const html = `<html><head><title>外部レポート</title></head><body>
      <h2>背景</h2>
      <p>説明文です。</p>
      <h2>結果</h2>
      <table><thead><tr><th>項目</th><th>値</th></tr></thead>
        <tbody><tr><td>売上</td><td>100</td></tr></tbody></table>
    </body></html>`;
    const doc = importHtmlReport(html, sequentialIds());

    expect(doc.meta.name).toBe("外部レポート");
    const sections = doc.tree.children ?? [];
    expect(sections).toHaveLength(2);
    expect(sections[0]?.type).toBe("section");
    expect(sections[0]?.props.title).toBe("背景");
    // paragraph is preserved as RawBlock child
    expect(sections[0]?.children?.[0]?.type).toBe("RawBlock");
    expect(sections[0]?.children?.[0]?.raw).toContain("説明文です。");
  });

  test("maps foreign table with real cell data", () => {
    const html = `<body><table>
      <thead><tr><th>名前</th><th>状態</th></tr></thead>
      <tbody><tr><td>山田</td><td>完了</td></tr><tr><td>佐藤</td><td>着手</td></tr></tbody>
    </table></body>`;
    const doc = importHtmlReport(html, sequentialIds());
    const table = doc.tree.children?.[0];
    expect(table?.type).toBe("table");
    expect(table?.props.columns).toBe("名前, 状態");
    expect(table?.props.rowCount).toBe(2);
    expect(table?.props.rows).toBe("山田 | 完了; 佐藤 | 着手");
  });

  test("maps blockquote to quote", () => {
    const doc = importHtmlReport(
      "<body><blockquote>引用文</blockquote></body>",
      sequentialIds(),
    );
    expect(doc.tree.children?.[0]?.type).toBe("quote");
    expect(doc.tree.children?.[0]?.props.text).toBe("引用文");
  });

  test("unrecognized elements survive as RawBlock and re-export unchanged", () => {
    const original = '<div class="custom-widget" data-config="a">中身<span>x</span></div>';
    const doc = importHtmlReport(`<body>${original}</body>`, sequentialIds());
    const raw = doc.tree.children?.[0];
    expect(raw?.type).toBe("RawBlock");
    expect(raw?.raw).toBe(original);

    // Export writes it back untouched
    const html = generateHtmlReport(doc);
    expect(html).toContain(original);
  });
});
