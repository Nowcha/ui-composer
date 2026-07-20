import { describe, expect, test } from "vitest";
import type { SpecDocument } from "../../types/spec";
import { SPEC_VERSION } from "../../types/spec";
import { generateShadcnCode } from "./shadcn";
import { getCodeGenerator } from "./index";

function makeDoc(): SpecDocument {
  return {
    meta: {
      name: "Settings Screen",
      mode: "ui",
      targetLibrary: "shadcn",
      version: SPEC_VERSION,
    },
    tree: {
      id: "root",
      type: "root",
      props: {},
      children: [
        {
          id: "card-a1",
          type: "card",
          props: { title: "アカウント設定" },
          children: [
            {
              id: "input-b2",
              type: "text-input",
              props: {
                label: "メールアドレス",
                inputType: "email",
                required: true,
              },
            },
            {
              id: "select-b3",
              type: "select",
              props: { label: "言語", options: "日本語, English" },
            },
            {
              id: "switch-b4",
              type: "switch",
              props: { label: "通知を受け取る" },
            },
            {
              id: "btn-c3",
              type: "button",
              props: { label: "削除", variant: "danger" },
              icon: { name: "trash", weight: "regular" },
            },
          ],
        },
        {
          id: "tabs-d4",
          type: "tabs",
          props: { tabs: "概要, 履歴" },
          children: [
            {
              id: "table-e5",
              type: "table",
              props: { columns: "日付, 操作", rowCount: 3 },
            },
          ],
        },
        { id: "rating-f6", type: "rating", props: { max: 5 } },
      ],
    },
    snapshots: [],
  };
}

describe("generateShadcnCode", () => {
  test("matches snapshot", () => {
    expect(generateShadcnCode(makeDoc())).toMatchSnapshot();
  });

  test("imports only used shadcn modules with setup hint", () => {
    const code = generateShadcnCode(makeDoc());
    expect(code).toContain(
      'import { Button } from "@/components/ui/button";',
    );
    expect(code).toContain(
      'import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";',
    );
    expect(code).toContain(
      'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";',
    );
    // 未使用モジュールは import しない
    expect(code).not.toContain("@/components/ui/checkbox");
    expect(code).not.toContain("@/components/ui/accordion");
    expect(code).toContain("// 前提: npx shadcn@latest add ");
  });

  test("maps button variants to shadcn variants", () => {
    const code = generateShadcnCode(makeDoc());
    expect(code).toContain('<Button variant="destructive"');
  });

  test("inherits plain-tailwind renderers for structural types", () => {
    const doc = makeDoc();
    doc.tree.children = [
      {
        id: "grid-g1",
        type: "grid",
        props: { columns: "2" },
        children: [],
      },
    ];
    const code = generateShadcnCode(doc);
    expect(code).toContain("md:grid-cols-2");
  });

  test("keeps data-uic-id and Phosphor icon imports", () => {
    const code = generateShadcnCode(makeDoc());
    for (const id of ["card-a1", "input-b2", "btn-c3", "tabs-d4"]) {
      expect(code).toContain(`data-uic-id="${id}"`);
    }
    expect(code).toContain('import { Trash } from "@phosphor-icons/react";');
  });

  test("uncovered component types become explicit TODO blocks", () => {
    expect(generateShadcnCode(makeDoc())).toContain("TODO: rating を実装");
  });
});

describe("getCodeGenerator (shadcn)", () => {
  test("resolves shadcn by id", () => {
    expect(getCodeGenerator("shadcn").id).toBe("shadcn");
  });
});
