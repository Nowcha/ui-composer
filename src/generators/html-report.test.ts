import { describe, expect, test } from "vitest";
import type { SpecDocument } from "../types/spec";
import { SPEC_VERSION } from "../types/spec";
import { generateHtmlReport, escapeHtml } from "./html-report";

function makeReport(): SpecDocument {
  return {
    meta: {
      name: "月次進捗レポート",
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
          id: "hero-a1",
          type: "hero",
          props: {
            title: "月次進捗レポート",
            subtitle: "2026年6月",
            author: "開発部",
          },
        },
        {
          id: "section-b2",
          type: "section",
          props: { title: "サマリー", headingLevel: "h2" },
          frozen: true,
          children: [
            {
              id: "stat-c3",
              type: "stat-card",
              props: { label: "完了タスク", value: "42件", change: "+8件" },
            },
            {
              id: "callout-d4",
              type: "callout",
              props: {
                title: "結論",
                body: "予定どおり進行中。",
                tone: "success",
              },
            },
          ],
        },
        {
          id: "raw-e5",
          type: "RawBlock",
          props: {},
          raw: '<div class="legacy" style="color:red">既存HTML</div>',
        },
      ],
    },
    snapshots: [],
  };
}

describe("generateHtmlReport", () => {
  test("matches snapshot", () => {
    expect(generateHtmlReport(makeReport())).toMatchSnapshot();
  });

  test("is self-contained (no external resources)", () => {
    const html = generateHtmlReport(makeReport());
    expect(html).not.toContain("http://");
    expect(html).not.toContain("https://");
    expect(html).not.toContain("<script");
  });

  test("embeds data-uic-id and data-uic-type on every component", () => {
    const html = generateHtmlReport(makeReport());
    for (const id of ["hero-a1", "section-b2", "stat-c3", "callout-d4"]) {
      expect(html).toContain(`data-uic-id="${id}"`);
    }
    expect(html).toContain('data-uic-frozen="true"');
  });

  test("writes RawBlock content back byte-for-byte inside markers", () => {
    const html = generateHtmlReport(makeReport());
    expect(html).toContain(
      '<!--uic:raw:raw-e5--><div class="legacy" style="color:red">既存HTML</div><!--/uic:raw-->',
    );
  });

  test("escapes HTML in user-provided text", () => {
    const doc = makeReport();
    doc.tree.children = [
      {
        id: "callout-x",
        type: "callout",
        props: { title: "<script>alert(1)</script>", body: "a & b" },
      },
    ];
    const html = generateHtmlReport(doc);
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a &amp; b");
    expect(html).not.toContain("<script>alert");
  });
});

describe("escapeHtml", () => {
  test("escapes all critical characters", () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;",
    );
  });
});
