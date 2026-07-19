/**
 * E2E smoke test for canvas drag & drop on the 12-column grid.
 *
 * Guards against the drop off-by-one bug where dnd-kit's `over` in
 * onDragMove lags one pointer event behind the pointer position: fast
 * "flick and release" drops used to land at the wrong index because the
 * insertion was taken from the stale drag-move indicator instead of
 * being recomputed from the fresh drag-end `over`.
 *
 * Runs a real Chromium via Playwright against a self-started Vite dev
 * server. Not part of `npm run check` (requires the Chromium download:
 * `npx playwright install chromium`).
 *
 * Usage: node scripts/e2e-dnd-smoke.mjs
 */
/* global console, process */
import { createServer } from "vite";
import { chromium } from "playwright";

const STORAGE_KEY = "ui-composer:document:v1";

/** Two span-6 inputs side by side, then a full-width tag below. */
const seedDocument = {
  meta: {
    name: "e2e-dnd-smoke",
    mode: "ui",
    targetLibrary: "plain-tailwind",
    version: 1,
  },
  tree: {
    id: "root",
    type: "root",
    props: {},
    children: [
      {
        id: "input0",
        type: "text-input",
        props: { label: "入力0", colSpan: 6 },
      },
      {
        id: "input1",
        type: "text-input",
        props: { label: "入力1", colSpan: 6 },
      },
      { id: "tag0", type: "tag", props: { label: "タグ" } },
    ],
  },
  snapshots: [],
};

/**
 * Palette-drop scenarios. `target` picks the release point from the
 * measured boxes; `fast` releases immediately after a coarse 4-step
 * move (the regression trigger). `expectIndex` is where the badge
 * must land among root's children.
 */
const scenarios = [
  {
    name: "fast flick to input1 center-right -> after input1",
    fast: true,
    target: (b) => ({
      x: b.input1.x + b.input1.width * 0.75,
      y: b.input1.y + b.input1.height / 2,
    }),
    expectIndex: 2,
  },
  {
    name: "fast flick to input1 left edge -> between inputs",
    fast: true,
    target: (b) => ({ x: b.input1.x + 10, y: b.input1.y + b.input1.height / 2 }),
    expectIndex: 1,
  },
  {
    name: "slow drop at input0 center -> after input0",
    fast: false,
    target: (b) => ({
      x: b.input0.x + b.input0.width / 2,
      y: b.input0.y + b.input0.height / 2,
    }),
    expectIndex: 1,
  },
  {
    name: "slow drop at tag top edge -> before tag",
    fast: false,
    target: (b) => ({ x: b.tag.x + b.tag.width / 2, y: b.tag.y + 4 }),
    expectIndex: 2,
  },
  {
    // Release in the 12px gap between the two cells: gap-snap resolves
    // to the nearest cell instead of appending at the artboard end
    name: "drop in the gap between inputs -> between inputs",
    fast: false,
    target: (b) => ({ x: b.input1.x - 4, y: b.input1.y + b.input1.height / 2 }),
    expectIndex: 1,
  },
  {
    name: "drop far below all cells -> appended at the end",
    fast: false,
    target: (b) => ({ x: b.tag.x + b.tag.width / 2, y: b.tag.y + b.tag.height + 80 }),
    expectIndex: 3,
  },
];

async function measureBoxes(page) {
  const inputs = page.getByRole("treeitem", { name: "テキスト入力" });
  await inputs.first().waitFor({ timeout: 10000 });
  const boxes = [];
  for (const el of await inputs.all()) boxes.push(await el.boundingBox());
  boxes.sort((a, b) => a.x - b.x);
  const tag = await page.getByRole("treeitem", { name: "タグ" }).boundingBox();
  return { input0: boxes[0], input1: boxes[1], tag };
}

async function readRootChildren(page) {
  const saved = await page.evaluate(
    (key) => globalThis.localStorage.getItem(key),
    STORAGE_KEY,
  );
  return JSON.parse(saved).tree.children;
}

async function runPaletteDrop(page, scenario, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const boxes = await measureBoxes(page);
  const target = scenario.target(boxes);

  await page.getByLabel("コンポーネントを検索").fill("バッジ");
  const card = page.locator("li button", { hasText: "バッジ" }).first();
  await card.waitFor({ timeout: 5000 });
  const cardBox = await card.boundingBox();

  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + 20);
  await page.mouse.down();
  if (scenario.fast) {
    await page.mouse.move(target.x, target.y, { steps: 4 });
    await page.mouse.up();
  } else {
    await page.mouse.move(target.x, target.y, { steps: 20 });
    await page.waitForTimeout(120);
    await page.mouse.up();
  }

  // Past the 500ms persistence debounce
  await page.waitForTimeout(900);
  const children = await readRootChildren(page);
  const actual = children.findIndex((c) => c.type === "badge");
  return { actual, order: children.map((c) => c.id).join(", ") };
}

async function runNodeMove(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const boxes = await measureBoxes(page);

  await page.mouse.move(
    boxes.input0.x + boxes.input0.width / 2,
    boxes.input0.y + boxes.input0.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    boxes.input1.x + boxes.input1.width * 0.75,
    boxes.input1.y + boxes.input1.height / 2,
    { steps: 4 },
  );
  await page.mouse.up();

  await page.waitForTimeout(900);
  const children = await readRootChildren(page);
  return children.map((c) => c.id).join(", ");
}

async function main() {
  const server = await createServer({
    server: { port: 4199, strictPort: false },
    logLevel: "silent",
  });
  await server.listen();
  const baseUrl = server.resolvedUrls.local[0];
  console.log(`dev server: ${baseUrl}`);

  const browser = await chromium.launch();
  const failures = [];

  try {
    for (const scenario of scenarios) {
      const page = await browser.newPage({
        viewport: { width: 1600, height: 900 },
      });
      await page.addInitScript(
        ([key, doc]) => globalThis.localStorage.setItem(key, doc),
        [STORAGE_KEY, JSON.stringify(seedDocument)],
      );
      const { actual, order } = await runPaletteDrop(page, scenario, baseUrl);
      const ok = actual === scenario.expectIndex;
      console.log(
        `${ok ? "PASS" : "FAIL"} ${scenario.name} ` +
          `(expected index ${scenario.expectIndex}, got ${actual}; [${order}])`,
      );
      if (!ok) failures.push(scenario.name);
      await page.close();
    }

    const movePage = await browser.newPage({
      viewport: { width: 1600, height: 900 },
    });
    await movePage.addInitScript(
      ([key, doc]) => globalThis.localStorage.setItem(key, doc),
      [STORAGE_KEY, JSON.stringify(seedDocument)],
    );
    const order = await runNodeMove(movePage, baseUrl);
    const moveOk = order === "input1, input0, tag0";
    console.log(
      `${moveOk ? "PASS" : "FAIL"} fast node move input0 -> after input1 ` +
        `(got [${order}])`,
    );
    if (!moveOk) failures.push("node move");
    await movePage.close();
  } finally {
    await browser.close();
    await server.close();
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} scenario(s) failed`);
    process.exit(1);
  }
  console.log("\nall dnd smoke scenarios passed");
}

try {
  await main();
} catch (err) {
  console.error("e2e-dnd-smoke crashed:", err);
  process.exit(1);
}
