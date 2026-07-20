/**
 * Lightweight SVG preview of the screen-flow graph.
 * Longest-path ranking (cycle-guarded) → columns; no external libs,
 * matching the "Mermaidテキストが本命、プレビューは目安" policy.
 */

import type { FC } from "react";
import type { ScreenFlow } from "../types/spec";
import { collectFlowScreens } from "../generators/flow-mermaid";

const BOX_W = 150;
const BOX_H = 44;
const GAP_X = 210;
const GAP_Y = 76;
const PAD = 24;

interface Point {
  x: number;
  y: number;
}

function layoutScreens(flow: ScreenFlow): Map<string, Point> {
  const screens = collectFlowScreens(flow);
  const rank = new Map<string, number>(screens.map((s) => [s, 0]));

  // Longest-path ranks; iteration cap guards against cycles
  for (let pass = 0; pass < screens.length; pass += 1) {
    let changed = false;
    for (const t of flow.transitions) {
      const from = rank.get(t.from);
      const to = rank.get(t.to);
      if (from === undefined || to === undefined) continue;
      if (from + 1 > to && from + 1 < screens.length) {
        rank.set(t.to, from + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const byRank = new Map<number, string[]>();
  for (const name of screens) {
    const r = rank.get(name) ?? 0;
    byRank.set(r, [...(byRank.get(r) ?? []), name]);
  }

  const positions = new Map<string, Point>();
  for (const [r, names] of byRank) {
    names.forEach((name, i) => {
      positions.set(name, {
        x: PAD + r * GAP_X,
        y: PAD + i * GAP_Y,
      });
    });
  }
  return positions;
}

export const FlowPreview: FC<{ flow: ScreenFlow }> = ({ flow }) => {
  const positions = layoutScreens(flow);
  if (positions.size === 0) {
    return (
      <p className="p-4 text-center text-xs text-slate-400">
        画面を追加するとプレビューが表示されます
      </p>
    );
  }

  const width =
    Math.max(...[...positions.values()].map((p) => p.x)) + BOX_W + PAD;
  const height =
    Math.max(...[...positions.values()].map((p) => p.y)) + BOX_H + PAD;

  return (
    <div className="overflow-auto rounded-md border border-slate-200 bg-slate-50">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="画面遷移図プレビュー"
      >
        <defs>
          <marker
            id="flow-arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#64748b" />
          </marker>
        </defs>
        {flow.transitions.map((t) => {
          const from = positions.get(t.from);
          const to = positions.get(t.to);
          if (!from || !to) return null;
          const x1 = from.x + BOX_W;
          const y1 = from.y + BOX_H / 2;
          const x2 = to.x;
          const y2 = to.y + BOX_H / 2;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          return (
            <g key={t.id}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#64748b"
                strokeWidth={1.5}
                markerEnd="url(#flow-arrow)"
              />
              {t.trigger.trim() && (
                <text
                  x={midX}
                  y={midY - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#475569"
                >
                  {t.trigger}
                </text>
              )}
            </g>
          );
        })}
        {[...positions.entries()].map(([name, p]) => (
          <g key={name}>
            <rect
              x={p.x}
              y={p.y}
              width={BOX_W}
              height={BOX_H}
              rx={8}
              fill="#ffffff"
              stroke="#3b82f6"
              strokeWidth={1.5}
            />
            <text
              x={p.x + BOX_W / 2}
              y={p.y + BOX_H / 2 + 4}
              textAnchor="middle"
              fontSize={12}
              fill="#1e293b"
            >
              {name.length > 12 ? `${name.slice(0, 11)}…` : name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
