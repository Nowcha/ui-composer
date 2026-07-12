/**
 * Typed access to the generated catalog data.
 * src/data/*.json are build artifacts of `npm run gen:catalog` — never
 * hand-edit them; fix scripts/catalog-seed.ts instead.
 */

import componentsJson from "../data/components.json";
import type { CatalogComponent } from "../types/catalog";
import type { ComponentNode } from "../types/spec";
import { ROOT_NODE_TYPE } from "../types/spec";

export const catalogComponents =
  componentsJson as unknown as CatalogComponent[];

const byId = new Map<string, CatalogComponent>(
  catalogComponents.map((c) => [c.id, c]),
);

export function getCatalogComponent(
  id: string,
): CatalogComponent | undefined {
  return byId.get(id);
}

/** True when a node of this type can contain children. */
export function isContainerType(type: string): boolean {
  if (type === ROOT_NODE_TYPE) return true;
  return byId.get(type)?.isContainer ?? false;
}

/** Builds default props from the catalog's typicalProps definitions. */
export function buildDefaultProps(
  component: CatalogComponent,
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const prop of component.typicalProps) {
    if (prop.default !== undefined) {
      props[prop.name] = prop.default;
    }
  }
  return props;
}

/** Display label for a node in the tree view. */
export function nodeLabel(node: ComponentNode): string {
  const def = byId.get(node.type);
  const base = def?.nameJa ?? node.type;
  const text =
    typeof node.props.label === "string"
      ? node.props.label
      : typeof node.props.title === "string"
        ? node.props.title
        : undefined;
  return text ? `${base}「${text}」` : base;
}
