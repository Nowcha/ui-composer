/**
 * Self-contained HTML report generator (Phase 3).
 * Pure function: SpecDocument in, single HTML file string out.
 *
 * Round-trip contract (design v2 §3):
 * - Every rendered element carries data-uic-id / data-uic-type, and its
 *   source props/behavior/icon/frozen as data-uic-* attributes, so the
 *   HTML importer can restore the exact SpecTree (lossless).
 * - RawBlock content is written back byte-for-byte, wrapped only in
 *   comment markers: <!--uic:raw:{id}-->...<!--/uic:raw-->
 */

import type { ComponentNode, SpecDocument } from "../types/spec";
import { RAW_BLOCK_TYPE, ROOT_NODE_TYPE } from "../types/spec";
import { REPORT_CSS } from "./report-css";

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function listProp(value: unknown): string[] {
  return str(value)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Common data-uic-* attributes enabling lossless re-import. */
function uicAttrs(node: ComponentNode): string {
  const parts = [
    `data-uic-id="${escapeHtml(node.id)}"`,
    `data-uic-type="${escapeHtml(node.type)}"`,
  ];
  if (Object.keys(node.props).length > 0) {
    parts.push(`data-uic-props="${escapeHtml(JSON.stringify(node.props))}"`);
  }
  if (node.icon) {
    parts.push(`data-uic-icon="${escapeHtml(JSON.stringify(node.icon))}"`);
  }
  if (node.behavior) {
    parts.push(`data-uic-behavior="${escapeHtml(node.behavior)}"`);
  }
  if (node.frozen) {
    parts.push(`data-uic-frozen="true"`);
  }
  return parts.join(" ");
}

function renderChildren(node: ComponentNode): string {
  return (node.children ?? []).map((c) => renderNode(c)).join("\n");
}

function renderPlaceholderRows(columns: string[], rowCount: number): string {
  const row = `<tr>${columns.map(() => "<td>…</td>").join("")}</tr>`;
  return Array.from({ length: Math.max(1, rowCount) }, () => row).join("\n");
}

function renderNode(node: ComponentNode): string {
  const a = uicAttrs(node);
  const p = node.props;

  switch (node.type) {
    case RAW_BLOCK_TYPE:
      return `<!--uic:raw:${node.id}-->${node.raw ?? ""}<!--/uic:raw-->`;

    case "hero": {
      const sub = str(p.subtitle);
      const meta = [str(p.date), str(p.author)].filter(Boolean).join(" / ");
      return `<header class="uic-hero" ${a}><h1>${escapeHtml(str(p.title, "無題"))}</h1>${
        sub ? `<p class="uic-subtitle">${escapeHtml(sub)}</p>` : ""
      }${meta ? `<p class="uic-meta">${escapeHtml(meta)}</p>` : ""}</header>`;
    }

    case "section": {
      const desc = str(p.description);
      const level = str(p.headingLevel, "h2");
      const tag = level === "h3" || level === "h4" ? level : "h2";
      return `<section class="uic-section" ${a}><${tag}>${escapeHtml(
        str(p.title, "セクション"),
      )}</${tag}>${desc ? `<p>${escapeHtml(desc)}</p>` : ""}\n${renderChildren(node)}</section>`;
    }

    case "toc":
      return `<nav class="uic-toc" aria-label="目次" ${a}><h2>${escapeHtml(
        str(p.title, "目次"),
      )}</h2><ol><li>(実装時にセクション見出しから自動生成すること)</li></ol></nav>`;

    case "columns":
      return `<div class="uic-columns" data-cols="${escapeHtml(
        str(p.count, "2"),
      )}" ${a}>\n${renderChildren(node)}</div>`;

    case "stat-card":
      return `<div class="uic-stat" ${a}><div class="uic-stat-label">${escapeHtml(
        str(p.label),
      )}</div><div class="uic-stat-value">${escapeHtml(
        str(p.value),
      )}</div><div class="uic-stat-change">${escapeHtml(str(p.change))}</div></div>`;

    case "table": {
      const columns = listProp(p.columns);
      const rowCount = typeof p.rowCount === "number" ? p.rowCount : 3;
      return `<table class="uic-table" ${a}><thead><tr>${columns
        .map((c) => `<th scope="col">${escapeHtml(c)}</th>`)
        .join("")}</tr></thead><tbody>\n${renderPlaceholderRows(columns, rowCount)}\n</tbody></table>`;
    }

    case "comparison-table": {
      const subjects = listProp(p.subjects);
      const criteria = listProp(p.criteria);
      const head = `<tr><th scope="col">観点</th>${subjects
        .map((s) => `<th scope="col">${escapeHtml(s)}</th>`)
        .join("")}</tr>`;
      const body = criteria
        .map(
          (c) =>
            `<tr><th scope="row">${escapeHtml(c)}</th>${subjects
              .map(() => "<td>…</td>")
              .join("")}</tr>`,
        )
        .join("\n");
      return `<table class="uic-table" ${a}><thead>${head}</thead><tbody>\n${body}\n</tbody></table>`;
    }

    case "chart-placeholder":
      return `<div class="uic-chart" role="img" aria-label="${escapeHtml(
        str(p.title),
      )}" ${a}><div class="uic-chart-title">${escapeHtml(
        str(p.title),
      )}</div><div>📊 チャート: ${escapeHtml(str(p.chartType, "line"))} / データ: ${escapeHtml(
        str(p.dataNature),
      )}</div>${
        str(p.note) ? `<div>${escapeHtml(str(p.note))}</div>` : ""
      }</div>`;

    case "callout": {
      const tone = str(p.tone, "info");
      return `<div class="uic-callout uic-callout-${escapeHtml(tone)}" ${a}><div class="uic-callout-title">${escapeHtml(
        str(p.title),
      )}</div><div>${escapeHtml(str(p.body))}</div></div>`;
    }

    case "quote": {
      const author = [str(p.author), str(p.source)]
        .filter(Boolean)
        .join(" — ");
      return `<blockquote class="uic-quote" ${a}><p>${escapeHtml(
        str(p.text),
      )}</p>${author ? `<cite>${escapeHtml(author)}</cite>` : ""}</blockquote>`;
    }

    case "timeline":
      return `<ol class="uic-timeline" ${a}>${listProp(p.items)
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ol>`;

    case "stepper":
      return `<ol class="uic-steps" ${a}>${listProp(p.steps)
        .map((s) => `<li>${escapeHtml(s)}</li>`)
        .join("")}</ol>`;

    case "source-note": {
      const url = str(p.url);
      const text = escapeHtml(str(p.text));
      return `<p class="uic-source" ${a}>${
        url ? `<a href="${escapeHtml(url)}">${text}</a>` : text
      }</p>`;
    }

    case "footer":
      return `<footer class="uic-footer" ${a}>${escapeHtml(
        str(p.copyright),
      )}\n${renderChildren(node)}</footer>`;

    case "divider":
      return `<hr class="uic-divider" ${a}>`;

    case "list":
      return `<ul ${a}>${listProp(p.items)
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>`;

    case "description-list": {
      const pairs = listProp(p.items).map((item) => {
        const [key, ...rest] = item.split(":");
        return { key: (key ?? "").trim(), value: rest.join(":").trim() };
      });
      return `<dl class="uic-dl" ${a}>${pairs
        .map(
          (kv) =>
            `<dt>${escapeHtml(kv.key)}</dt><dd>${escapeHtml(kv.value)}</dd>`,
        )
        .join("")}</dl>`;
    }

    case "badge":
      return `<span class="uic-badge" ${a}>${escapeHtml(str(p.label))}</span>`;

    case "image":
      return `<figure class="uic-image-ph" ${a}>🖼 画像プレースホルダ: ${escapeHtml(
        str(p.alt, "画像"),
      )}${
        str(p.caption)
          ? `<figcaption>${escapeHtml(str(p.caption))}</figcaption>`
          : ""
      }</figure>`;

    default:
      // Unknown/UI-only component: keep structure + metadata for round trip
      return `<div class="uic-unknown" ${a}>[${escapeHtml(node.type)}]\n${renderChildren(node)}</div>`;
  }
}

/** Generates a dependency-free, self-contained HTML report. */
export function generateHtmlReport(doc: SpecDocument): string {
  const title = escapeHtml(doc.meta.name || "レポート");
  const body =
    doc.tree.type === ROOT_NODE_TYPE
      ? renderChildren(doc.tree)
      : renderNode(doc.tree);

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="generator" content="ui-composer">
<style>
${REPORT_CSS}
</style>
</head>
<body>
<main class="uic-report" data-uic-root="true" data-uic-name="${title}">
${body}
</main>
</body>
</html>
`;
}
