import { describe, expect, test } from "vitest";
import type { ScreenFlow } from "../types/spec";
import {
  collectFlowScreens,
  generateFlowMermaid,
  renderFlowSection,
} from "./flow-mermaid";

function makeFlow(): ScreenFlow {
  return {
    screens: ["ログイン", "ダッシュボード", "設定"],
    transitions: [
      {
        id: "t1",
        from: "ログイン",
        to: "ダッシュボード",
        trigger: "ログインボタン クリック",
      },
      { id: "t2", from: "ダッシュボード", to: "設定", trigger: "" },
    ],
  };
}

describe("generateFlowMermaid", () => {
  test("matches snapshot", () => {
    expect(generateFlowMermaid(makeFlow())).toMatchSnapshot();
  });

  test("returns null for undefined or empty flow", () => {
    expect(generateFlowMermaid(undefined)).toBeNull();
    expect(generateFlowMermaid({ screens: [], transitions: [] })).toBeNull();
  });

  test("uses indexed ids so Japanese names need no escaping", () => {
    const mermaid = generateFlowMermaid(makeFlow());
    expect(mermaid).toContain('S0["ログイン"]');
    expect(mermaid).toContain('S0 -->|"ログインボタン クリック"| S1');
  });

  test("omits the edge label when trigger is blank", () => {
    const mermaid = generateFlowMermaid(makeFlow());
    expect(mermaid).toContain("S1 --> S2");
  });

  test("escapes double quotes in labels", () => {
    const flow: ScreenFlow = {
      screens: ['画面"A"'],
      transitions: [],
    };
    expect(generateFlowMermaid(flow)).toContain('S0["画面#quot;A#quot;"]');
  });

  test("includes undeclared transition endpoints defensively", () => {
    const flow: ScreenFlow = {
      screens: ["ホーム"],
      transitions: [
        { id: "t1", from: "ホーム", to: "未宣言画面", trigger: "遷移" },
      ],
    };
    expect(collectFlowScreens(flow)).toEqual(["ホーム", "未宣言画面"]);
    expect(generateFlowMermaid(flow)).toContain('S1["未宣言画面"]');
  });
});

describe("renderFlowSection", () => {
  test("wraps mermaid in a fenced markdown section", () => {
    const section = renderFlowSection(makeFlow());
    expect(section).toContain("## 画面遷移");
    expect(section).toContain("```mermaid\nflowchart TD");
  });

  test("returns null when flow is empty", () => {
    expect(renderFlowSection(undefined)).toBeNull();
  });
});
