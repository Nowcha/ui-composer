/**
 * HTML direct import (Phase 3, path B).
 *
 * Two parsing modes:
 * - Own HTML (has [data-uic-root]): lossless restore from data-uic-*
 *   attributes and <!--uic:raw:id--> comment markers.
 * - Foreign HTML: heuristic mapping (h1-h3 -> section, table -> table,
 *   blockquote -> quote). Everything unrecognized becomes a RawBlock
 *   holding the serialized source, written back untouched on export.
 *
 * Uses the standard DOMParser API — no extra dependencies.
 */

import type { ComponentNode, SpecDocument } from "../types/spec";
import { RAW_BLOCK_TYPE, SPEC_VERSION } from "../types/spec";
import type { IconRef } from "../types/spec";

type IdGenerator = (type: string) => string;

function defaultIdGenerator(type: string): string {
  return `${type}-${Math.random().toString(36).slice(2, 8)}`;
}

const RAW_START = /^uic:raw:(.+)$/;
const RAW_END = "/uic:raw";
const HEADING_TAGS = new Set(["H1", "H2", "H3"]);

function serializeNode(node: Node): string {
  if (node.nodeType === Node.ELEMENT_NODE) return (node as Element).outerHTML;
  if (node.nodeType === Node.COMMENT_NODE) {
    return `<!--${(node as Comment).data}-->`;
  }
  return node.textContent ?? "";
}

function parseJsonAttr<T>(value: string | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

/** Restores a node rendered by our own HTML generator. */
function restoreUicNode(el: Element, generateId: IdGenerator): ComponentNode {
  const type = el.getAttribute("data-uic-type") ?? RAW_BLOCK_TYPE;
  const node: ComponentNode = {
    id: el.getAttribute("data-uic-id") ?? generateId(type),
    type,
    props:
      parseJsonAttr<Record<string, unknown>>(
        el.getAttribute("data-uic-props") ?? undefined,
      ) ?? {},
  };
  const icon = parseJsonAttr<IconRef>(
    el.getAttribute("data-uic-icon") ?? undefined,
  );
  if (icon) node.icon = icon;
  const behavior = el.getAttribute("data-uic-behavior");
  if (behavior) node.behavior = behavior;
  if (el.getAttribute("data-uic-frozen") === "true") node.frozen = true;

  const children = parseUicChildNodes(el.childNodes, generateId);
  if (children.length > 0) node.children = children;
  return node;
}

/**
 * Walks child nodes of our own HTML: uic-typed elements become nodes,
 * raw comment markers become RawBlocks, presentational wrappers
 * (h2 rendered from props etc.) are descended into and dropped.
 */
function parseUicChildNodes(
  nodes: NodeListOf<ChildNode> | ChildNode[],
  generateId: IdGenerator,
): ComponentNode[] {
  const result: ComponentNode[] = [];
  const list = Array.from(nodes);

  for (let i = 0; i < list.length; i++) {
    const node = list[i];
    if (!node) continue;

    if (node.nodeType === Node.COMMENT_NODE) {
      const match = RAW_START.exec((node as Comment).data.trim());
      if (match) {
        const rawParts: string[] = [];
        let j = i + 1;
        for (; j < list.length; j++) {
          const inner = list[j];
          if (!inner) continue;
          if (
            inner.nodeType === Node.COMMENT_NODE &&
            (inner as Comment).data.trim() === RAW_END
          ) {
            break;
          }
          rawParts.push(serializeNode(inner));
        }
        result.push({
          id: match[1] ?? generateId(RAW_BLOCK_TYPE),
          type: RAW_BLOCK_TYPE,
          props: {},
          raw: rawParts.join(""),
        });
        i = j; // skip past the closing marker
      }
      continue;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el.hasAttribute("data-uic-type")) {
        result.push(restoreUicNode(el, generateId));
      } else {
        // Presentational wrapper — descend to find nested uic nodes
        result.push(...parseUicChildNodes(el.childNodes, generateId));
      }
    }
  }
  return result;
}

/** Extracts "col1, col2" and row data from a foreign <table>. */
function foreignTableNode(
  table: HTMLTableElement,
  generateId: IdGenerator,
): ComponentNode {
  const headers = Array.from(table.querySelectorAll("thead th, tr:first-child th"))
    .map((th) => th.textContent?.trim() ?? "")
    .filter((t) => t.length > 0);
  const bodyRows = Array.from(table.querySelectorAll("tbody tr")).filter(
    (tr) => tr.querySelectorAll("td").length > 0,
  );
  const rows = bodyRows
    .map((tr) =>
      Array.from(tr.querySelectorAll("td"))
        .map((td) => td.textContent?.trim() ?? "")
        .join(" | "),
    )
    .join("; ");
  return {
    id: generateId("table"),
    type: "table",
    props: {
      columns: headers.join(", "),
      rowCount: bodyRows.length || 3,
      ...(rows ? { rows } : {}),
    },
  };
}

/**
 * Foreign HTML heuristics. h1-h3 open a section that absorbs following
 * siblings until the next heading; everything unrecognized is preserved
 * as a RawBlock.
 */
function parseForeignNodes(
  nodes: ChildNode[],
  generateId: IdGenerator,
): ComponentNode[] {
  const result: ComponentNode[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node) continue;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.trim().length > 0) {
        result.push({
          id: generateId(RAW_BLOCK_TYPE),
          type: RAW_BLOCK_TYPE,
          props: {},
          raw: text,
        });
      }
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      if (node.nodeType === Node.COMMENT_NODE) {
        result.push({
          id: generateId(RAW_BLOCK_TYPE),
          type: RAW_BLOCK_TYPE,
          props: {},
          raw: serializeNode(node),
        });
      }
      continue;
    }

    const el = node as Element;

    if (HEADING_TAGS.has(el.tagName)) {
      const sectionChildren: ChildNode[] = [];
      let j = i + 1;
      for (; j < nodes.length; j++) {
        const sibling = nodes[j];
        if (!sibling) continue;
        if (
          sibling.nodeType === Node.ELEMENT_NODE &&
          HEADING_TAGS.has((sibling as Element).tagName)
        ) {
          break;
        }
        sectionChildren.push(sibling);
      }
      const children = parseForeignNodes(sectionChildren, generateId);
      result.push({
        id: generateId("section"),
        type: "section",
        props: {
          title: el.textContent?.trim() ?? "",
          headingLevel: el.tagName.toLowerCase(),
        },
        ...(children.length > 0 ? { children } : {}),
      });
      i = j - 1;
      continue;
    }

    if (el.tagName === "TABLE") {
      result.push(foreignTableNode(el as HTMLTableElement, generateId));
      continue;
    }

    if (el.tagName === "BLOCKQUOTE") {
      result.push({
        id: generateId("quote"),
        type: "quote",
        props: { text: el.textContent?.trim() ?? "" },
      });
      continue;
    }

    // Non-destructive default: keep the element untouched
    result.push({
      id: generateId(RAW_BLOCK_TYPE),
      type: RAW_BLOCK_TYPE,
      props: {},
      raw: serializeNode(el),
    });
  }
  return result;
}

/** Parses a self-contained HTML report into a SpecDocument. */
export function importHtmlReport(
  html: string,
  generateId: IdGenerator = defaultIdGenerator,
): SpecDocument {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const uicRoot = dom.querySelector("[data-uic-root]");

  const children = uicRoot
    ? parseUicChildNodes(uicRoot.childNodes, generateId)
    : parseForeignNodes(Array.from(dom.body.childNodes), generateId);

  const name =
    uicRoot?.getAttribute("data-uic-name") ??
    (dom.title.trim().length > 0 ? dom.title.trim() : "インポートされたレポート");

  return {
    meta: {
      name,
      mode: "report",
      targetLibrary: "plain-tailwind",
      version: SPEC_VERSION,
    },
    tree: { id: "root", type: "root", props: {}, children },
    snapshots: [],
  };
}
