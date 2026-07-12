/**
 * Catalog build script — regenerates all files under src/data/.
 * Run: npm run gen:catalog
 *
 * Outputs:
 *   src/data/components.json         (from scripts/catalog-seed.ts, validated)
 *   src/data/icons.json              (from @phosphor-icons/core metadata)
 *   src/data/icon-categories-ja.json (JA translation map for icon categories)
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { icons as phosphorIcons } from "@phosphor-icons/core";
import type { CatalogComponent, IconMeta } from "../src/types/catalog";
import { CATEGORIES } from "../src/types/catalog";
import { catalogSeed } from "./catalog-seed/index";

const DATA_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
);

const KEBAB_CASE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * UI components that are also usable in report mode (design v2 §2.2).
 * Applied as a transform here so each seed entry stays single-sourced.
 */
const REPORT_SHARED_IDS = new Set([
  "section",
  "table",
  "quote",
  "timeline",
  "stat-card",
  "stepper",
  "footer",
  "image",
  "divider",
  "list",
  "description-list",
  "badge",
]);

function applyModes(components: CatalogComponent[]): CatalogComponent[] {
  return components.map((c) =>
    REPORT_SHARED_IDS.has(c.id) && !c.modes
      ? { ...c, modes: ["ui", "report"] }
      : c,
  );
}

function validateComponents(components: CatalogComponent[]): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const c of components) {
    if (!KEBAB_CASE.test(c.id)) {
      errors.push(`id "${c.id}" is not kebab-case`);
    }
    if (seenIds.has(c.id)) {
      errors.push(`duplicate id "${c.id}"`);
    }
    seenIds.add(c.id);

    if (!CATEGORIES.includes(c.category)) {
      errors.push(`"${c.id}": invalid category "${c.category}"`);
    }
    if (c.modes) {
      if (c.modes.length === 0) {
        errors.push(`"${c.id}": modes must not be empty when present`);
      }
      for (const mode of c.modes) {
        if (mode !== "ui" && mode !== "report") {
          errors.push(`"${c.id}": invalid mode "${String(mode)}"`);
        }
      }
    }
    if (c.name.trim() === "" || c.nameJa.trim() === "") {
      errors.push(`"${c.id}": name/nameJa must not be empty`);
    }
    if (c.description.trim() === "") {
      errors.push(`"${c.id}": description must not be empty`);
    }
    for (const prop of c.typicalProps) {
      if (prop.type === "enum") {
        if (!prop.enumValues || prop.enumValues.length === 0) {
          errors.push(`"${c.id}".${prop.name}: enum prop needs enumValues`);
        } else if (
          prop.default !== undefined &&
          !prop.enumValues.includes(String(prop.default))
        ) {
          errors.push(
            `"${c.id}".${prop.name}: default "${String(prop.default)}" not in enumValues`,
          );
        }
      }
    }
  }
  return errors;
}

function buildIcons(): IconMeta[] {
  // Phosphor metadata arrays are readonly tuples — copy into mutable arrays
  return phosphorIcons.map((entry) => ({
    name: entry.name,
    pascalName: entry.pascal_name,
    tags: [...entry.tags],
    categories: entry.categories.map((c) => String(c)),
  }));
}

/**
 * JA translation map for Phosphor icon categories (search support).
 * Keys must match the exact category strings in @phosphor-icons/core.
 */
const ICON_CATEGORIES_JA: Record<string, string> = {
  arrows: "矢印",
  brands: "ブランド",
  commerce: "商取引",
  communications: "コミュニケーション",
  design: "デザイン",
  editor: "エディタ",
  finances: "金融",
  games: "ゲーム",
  "health & wellness": "健康・ウェルネス",
  "maps & travel": "地図・旅行",
  media: "メディア",
  nature: "自然",
  objects: "モノ",
  office: "オフィス",
  people: "人物",
  system: "システム",
  "technology & development": "テクノロジー・開発",
  weather: "天気",
};

async function writeJson(fileName: string, data: unknown): Promise<void> {
  const filePath = path.join(DATA_DIR, fileName);
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  console.log(`wrote ${fileName}`);
}

async function main(): Promise<void> {
  const components = applyModes(catalogSeed);
  const errors = validateComponents(components);
  if (errors.length > 0) {
    console.error("components validation failed:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const iconList = buildIcons();
  if (iconList.length < 1000) {
    console.error(
      `icons.json looks too small (${iconList.length} entries) — check @phosphor-icons/core`,
    );
    process.exit(1);
  }

  // Warn when Phosphor introduces categories missing from the JA map
  const knownCategories = new Set(Object.keys(ICON_CATEGORIES_JA));
  const unmapped = new Set<string>();
  for (const icon of iconList) {
    for (const category of icon.categories) {
      if (!knownCategories.has(category)) unmapped.add(category);
    }
  }
  if (unmapped.size > 0) {
    console.warn(
      `warning: categories without JA translation: ${[...unmapped].join(", ")}`,
    );
  }

  await mkdir(DATA_DIR, { recursive: true });
  await writeJson("components.json", components);
  await writeJson("icons.json", iconList);
  await writeJson("icon-categories-ja.json", ICON_CATEGORIES_JA);

  const reportCount = components.filter((c) =>
    c.modes?.includes("report"),
  ).length;
  console.log(
    `done: ${components.length} components (${reportCount} report-capable), ${iconList.length} icons`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
