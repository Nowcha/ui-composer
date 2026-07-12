/**
 * Asset build script — regenerates prompt-rules.json / dummy-data-ja.json.
 * Run: npm run gen:assets
 * (docs/04-prebuilt-assets.md items #1 and #2)
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promptRules } from "./assets-seed/prompt-rules";
import { dummyDataJa } from "./assets-seed/dummy-data-ja";

const DATA_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
);

function validate(): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const rule of promptRules) {
    if (seen.has(rule.id)) errors.push(`duplicate rule id "${rule.id}"`);
    seen.add(rule.id);
    if (!rule.text.trim()) errors.push(`rule "${rule.id}" has empty text`);
  }
  if (dummyDataJa.people.length < 20) {
    errors.push("dummy people must have at least 20 entries");
  }
  return errors;
}

async function main(): Promise<void> {
  const errors = validate();
  if (errors.length > 0) {
    console.error("assets validation failed:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    path.join(DATA_DIR, "prompt-rules.json"),
    `${JSON.stringify(promptRules, null, 2)}\n`,
    "utf-8",
  );
  await writeFile(
    path.join(DATA_DIR, "dummy-data-ja.json"),
    `${JSON.stringify(dummyDataJa, null, 2)}\n`,
    "utf-8",
  );
  console.log(`done: ${promptRules.length} rules, dummy data set`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
