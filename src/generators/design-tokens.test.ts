import { describe, expect, test } from "vitest";
import type { DesignTokens } from "../types/spec";
import {
  hasDesignTokens,
  renderDesignTokensSection,
  renderTailwindConfigHint,
} from "./design-tokens";

describe("hasDesignTokens", () => {
  test("false for undefined, empty object, or blank-only fields", () => {
    expect(hasDesignTokens(undefined)).toBe(false);
    expect(hasDesignTokens({})).toBe(false);
    expect(hasDesignTokens({ primaryColor: "  " })).toBe(false);
  });

  test("true when at least one field is set", () => {
    expect(hasDesignTokens({ primaryColor: "#2563eb" })).toBe(true);
  });
});

describe("renderDesignTokensSection", () => {
  const tokens: DesignTokens = {
    primaryColor: "#2563eb",
    borderRadius: "0.5rem",
    spacingUnit: "4px",
    fontFamily: "Noto Sans JP",
  };

  test("matches snapshot", () => {
    expect(renderDesignTokensSection(tokens)).toMatchSnapshot();
  });

  test("returns null when no tokens are set", () => {
    expect(renderDesignTokensSection(undefined)).toBeNull();
    expect(renderDesignTokensSection({})).toBeNull();
  });

  test("omits unset fields", () => {
    const section = renderDesignTokensSection({ primaryColor: "#2563eb" });
    expect(section).toContain("プライマリカラー: #2563eb");
    expect(section).not.toContain("角丸");
  });
});

describe("renderTailwindConfigHint", () => {
  test("empty array when no tokens are set", () => {
    expect(renderTailwindConfigHint(undefined)).toEqual([]);
  });

  test("emits one comment line per set token", () => {
    const lines = renderTailwindConfigHint({
      primaryColor: "#2563eb",
      fontFamily: "Noto Sans JP",
    });
    expect(lines[0]).toContain("tailwind.config");
    expect(lines).toContain("//   プライマリカラー: #2563eb");
    expect(lines).toContain("//   フォント: Noto Sans JP");
  });
});
