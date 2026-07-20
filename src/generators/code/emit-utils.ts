/**
 * Shared string-emission helpers for code adapters. Pure functions.
 */

import type { ComponentNode } from "../../types/spec";

export function indent(depth: number): string {
  return "  ".repeat(depth);
}

/** "sign-in" -> "SignIn" (Phosphor component names). */
export function pascalCase(kebab: string): string {
  return kebab
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** Safe JSX text: plain when harmless, JS string literal otherwise. */
export function jsxText(text: string): string {
  return /^[^<>{}&"\\]*$/.test(text) ? text : `{${JSON.stringify(text)}}`;
}

export function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function num(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

export function listProp(value: unknown): string[] {
  return str(value)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** data-uic-id attribute shared by every adapter (round-trip anchor). */
export function uic(node: ComponentNode): string {
  return `data-uic-id="${node.id}"`;
}

/** Inline Phosphor icon JSX prefix (empty when the node has no icon). */
export function iconJsx(node: ComponentNode): string {
  if (!node.icon) return "";
  return `<${pascalCase(node.icon.name)} size={16} weight="${node.icon.weight}" aria-hidden="true" /> `;
}

/** Derives the exported component name from the document name. */
export function screenComponentName(docName: string): string {
  const ascii = docName.replace(/[^A-Za-z0-9 _-]/g, "").trim();
  if (!ascii) return "GeneratedScreen";
  const pascal = pascalCase(ascii.replaceAll(" ", "-"));
  return /^[A-Za-z]/.test(pascal) ? pascal : "GeneratedScreen";
}

/** Collects unique icon names used in the tree (for import emission). */
export function collectIconNames(node: ComponentNode): string[] {
  const names = new Set<string>();
  function walk(n: ComponentNode): void {
    if (n.icon) names.add(n.icon.name);
    for (const child of n.children ?? []) walk(child);
  }
  walk(node);
  return [...names].sort();
}
