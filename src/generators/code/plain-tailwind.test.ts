import { describe, expect, test } from "vitest";
import type { SpecDocument } from "../../types/spec";
import { SPEC_VERSION } from "../../types/spec";
import { generatePlainTailwindCode } from "./plain-tailwind";
import { getCodeGenerator } from "./index";

function makeDoc(): SpecDocument {
  return {
    meta: {
      name: "Login Screen",
      mode: "ui",
      targetLibrary: "plain-tailwind",
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
          props: { title: "ログイン" },
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
              id: "btn-c3",
              type: "button",
              props: { label: "ログイン", variant: "primary" },
              icon: { name: "sign-in", weight: "regular" },
              behavior: "クリックで認証しダッシュボードへ遷移",
            },
          ],
        },
        {
          id: "raw-d4",
          type: "RawBlock",
          props: {},
          raw: "<div class=\"legacy\">既存部品</div>",
        },
        { id: "rating-e5", type: "rating", props: { max: 5 } },
      ],
    },
    snapshots: [],
  };
}

describe("generatePlainTailwindCode", () => {
  test("matches snapshot", () => {
    expect(generatePlainTailwindCode(makeDoc())).toMatchSnapshot();
  });

  test("derives a PascalCase component name (fallback for non-ascii)", () => {
    const doc = makeDoc();
    expect(generatePlainTailwindCode(doc)).toContain(
      "export default function LoginScreen()",
    );
    doc.meta.name = "ログイン画面";
    expect(generatePlainTailwindCode(doc)).toContain(
      "export default function GeneratedScreen()",
    );
  });

  test("imports only used Phosphor icons", () => {
    const code = generatePlainTailwindCode(makeDoc());
    expect(code).toContain(
      'import { SignIn } from "@phosphor-icons/react";',
    );
    const doc = makeDoc();
    doc.tree.children = [{ id: "d-1", type: "divider", props: {} }];
    expect(generatePlainTailwindCode(doc)).not.toContain(
      "@phosphor-icons/react",
    );
  });

  test("keeps data-uic-id on every rendered element", () => {
    const code = generatePlainTailwindCode(makeDoc());
    for (const id of ["card-a1", "input-b2", "btn-c3", "raw-d4"]) {
      expect(code).toContain(`data-uic-id="${id}"`);
    }
  });

  test("emits behavior TODO comments and RawBlock passthrough", () => {
    const code = generatePlainTailwindCode(makeDoc());
    expect(code).toContain("TODO(挙動): クリックで認証しダッシュボードへ遷移");
    expect(code).toContain("dangerouslySetInnerHTML");
    expect(code).toContain("既存部品");
  });

  test("uncovered component types become explicit TODO blocks", () => {
    const code = generatePlainTailwindCode(makeDoc());
    expect(code).toContain("TODO: rating を実装");
  });

  test("emits a tailwind.config hint only when design tokens are set", () => {
    const doc = makeDoc();
    expect(generatePlainTailwindCode(doc)).not.toContain("tailwind.config");

    doc.tokens = { primaryColor: "#2563eb" };
    expect(generatePlainTailwindCode(doc)).toContain(
      "// デザイントークン(tailwind.config に反映すること):",
    );
  });
});

describe("getCodeGenerator", () => {
  test("resolves by targetLibrary with plain-tailwind fallback", () => {
    expect(getCodeGenerator("plain-tailwind").id).toBe("plain-tailwind");
    expect(getCodeGenerator("unknown-lib").id).toBe("plain-tailwind");
  });
});
