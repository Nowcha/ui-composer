import { describe, expect, test } from "vitest";
import type { SpecDocument } from "../../types/spec";
import { SPEC_VERSION } from "../../types/spec";
import { generateMuiCode } from "./mui";
import { getCodeGenerator } from "./index";

function makeDoc(): SpecDocument {
  return {
    meta: {
      name: "Dashboard",
      mode: "ui",
      targetLibrary: "mui",
      version: SPEC_VERSION,
    },
    tree: {
      id: "root",
      type: "root",
      props: {},
      children: [
        {
          id: "header-a0",
          type: "header",
          props: { title: "管理画面", sticky: true },
          children: [
            {
              id: "search-a1",
              type: "search-field",
              props: { placeholder: "検索…" },
            },
          ],
        },
        {
          id: "grid-b1",
          type: "grid",
          props: { columns: "3" },
          children: [
            {
              id: "stat-b2",
              type: "stat-card",
              props: { label: "売上", value: "¥1.2M", change: "+8%" },
            },
          ],
        },
        {
          id: "form-c1",
          type: "form",
          props: { submitLabel: "保存" },
          children: [
            {
              id: "input-c2",
              type: "text-input",
              props: { label: "名前", required: true },
            },
            {
              id: "radio-c3",
              type: "radio-button",
              props: { label: "権限", options: "管理者, 一般" },
            },
            {
              id: "check-c4",
              type: "checkbox",
              props: { label: "利用規約に同意" },
            },
          ],
        },
        {
          id: "btn-d1",
          type: "button",
          props: { label: "追加", variant: "primary" },
          icon: { name: "plus", weight: "bold" },
        },
        {
          id: "alert-e1",
          type: "alert",
          props: { severity: "warning", title: "注意", message: "未保存です" },
        },
        { id: "rating-f1", type: "rating", props: { max: 5 } },
        {
          id: "raw-g1",
          type: "RawBlock",
          props: {},
          raw: '<div class="legacy">既存部品</div>',
        },
      ],
    },
    snapshots: [],
  };
}

describe("generateMuiCode", () => {
  test("matches snapshot", () => {
    expect(generateMuiCode(makeDoc())).toMatchSnapshot();
  });

  test("imports only used @mui/material components (single line)", () => {
    const code = generateMuiCode(makeDoc());
    const importLine = code
      .split("\n")
      .find(
        (line) => line.startsWith("import") && line.includes("@mui/material"),
      );
    expect(importLine).toBeDefined();
    for (const name of ["AppBar", "TextField", "Radio", "Alert"]) {
      expect(importLine).toContain(name);
    }
    expect(importLine).not.toContain("Chip");
    expect(importLine).not.toContain("Breadcrumbs");
  });

  test("maps button variants and Phosphor startIcon", () => {
    const code = generateMuiCode(makeDoc());
    expect(code).toContain('<Button variant="contained"');
    expect(code).toContain(
      'startIcon={<Plus size={16} weight="bold" />}',
    );
    expect(code).toContain('import { Plus } from "@phosphor-icons/react";');
  });

  test("renders MUI-native form controls", () => {
    const code = generateMuiCode(makeDoc());
    expect(code).toContain('<TextField label="名前" type="text" required');
    expect(code).toContain("<RadioGroup");
    expect(code).toContain("control={<Checkbox size=\"small\" />}");
    expect(code).toContain('<Alert severity="warning"');
  });

  test("keeps data-uic-id and RawBlock passthrough", () => {
    const code = generateMuiCode(makeDoc());
    for (const id of ["header-a0", "form-c1", "btn-d1", "raw-g1"]) {
      expect(code).toContain(`data-uic-id="${id}"`);
    }
    expect(code).toContain("dangerouslySetInnerHTML");
  });

  test("uncovered component types become MUI Box TODO blocks", () => {
    const code = generateMuiCode(makeDoc());
    expect(code).toContain("TODO: rating を実装");
    expect(code).toContain('border: "1px dashed"');
  });
});

describe("getCodeGenerator (mui)", () => {
  test("resolves mui by id", () => {
    expect(getCodeGenerator("mui").id).toBe("mui");
  });
});
