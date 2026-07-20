/**
 * shadcn/ui overrides. shadcn projects are Tailwind projects, so every
 * structural renderer (section / grid / header / ...) is inherited from
 * the plain-tailwind set; only UI primitives are replaced here.
 */

import type { NodeRenderer } from "./node-renderers";
import { NODE_RENDERERS } from "./node-renderers";
import { iconJsx, indent, jsxText, listProp, num, str, uic } from "./emit-utils";

const SHADCN_BUTTON_VARIANTS: Record<string, string> = {
  primary: "default",
  secondary: "secondary",
  outline: "outline",
  ghost: "ghost",
  danger: "destructive",
};

function labeledControl(
  nodeId: string,
  depth: number,
  label: string,
  control: string[],
): string[] {
  const i = indent(depth);
  return [
    `${i}<div className="grid gap-1.5" data-uic-id="${nodeId}">`,
    `${i}  <Label htmlFor="${nodeId}-field">${jsxText(label)}</Label>`,
    ...control.map((line) => `${i}  ${line}`),
    `${i}</div>`,
  ];
}

const SHADCN_OVERRIDES: Record<string, NodeRenderer> = {
  button: (node, depth) => {
    const variant =
      SHADCN_BUTTON_VARIANTS[str(node.props.variant, "primary")] ?? "default";
    return [
      `${indent(depth)}<Button variant="${variant}" ${uic(node)}>${iconJsx(node)}${jsxText(str(node.props.label, "ボタン"))}</Button>`,
    ];
  },

  "text-input": (node, depth) => {
    const placeholder = str(node.props.placeholder);
    return labeledControl(node.id, depth, str(node.props.label, "ラベル"), [
      `<Input id="${node.id}-field" type="${str(node.props.inputType, "text")}"${
        node.props.required === true ? " required" : ""
      }${placeholder ? ` placeholder="${placeholder}"` : ""} />`,
    ]);
  },

  textarea: (node, depth) =>
    labeledControl(node.id, depth, str(node.props.label, "ラベル"), [
      `<Textarea id="${node.id}-field" rows={${num(node.props.rows, 4)}} />`,
    ]),

  select: (node, depth) =>
    labeledControl(node.id, depth, str(node.props.label, "ラベル"), [
      `<Select>`,
      `  <SelectTrigger id="${node.id}-field"><SelectValue placeholder="選択してください" /></SelectTrigger>`,
      `  <SelectContent>`,
      ...listProp(node.props.options).map(
        (option) =>
          `    <SelectItem value="${option}">${jsxText(option)}</SelectItem>`,
      ),
      `  </SelectContent>`,
      `</Select>`,
    ]),

  checkbox: (node, depth) => {
    const i = indent(depth);
    return [
      `${i}<div className="flex items-center gap-2" ${uic(node)}>`,
      `${i}  <Checkbox id="${node.id}-field" />`,
      `${i}  <Label htmlFor="${node.id}-field">${jsxText(str(node.props.label, "チェック"))}</Label>`,
      `${i}</div>`,
    ];
  },

  "radio-button": (node, depth) => {
    const i = indent(depth);
    const options = listProp(node.props.options);
    return [
      `${i}<fieldset ${uic(node)}>`,
      `${i}  <legend className="mb-1 text-sm font-medium">${jsxText(str(node.props.label, "選択"))}</legend>`,
      `${i}  <RadioGroup defaultValue="${options[0] ?? ""}">`,
      ...options.flatMap((option, idx) => [
        `${i}    <div className="flex items-center gap-2">`,
        `${i}      <RadioGroupItem value="${option}" id="${node.id}-${idx}" />`,
        `${i}      <Label htmlFor="${node.id}-${idx}">${jsxText(option)}</Label>`,
        `${i}    </div>`,
      ]),
      `${i}  </RadioGroup>`,
      `${i}</fieldset>`,
    ];
  },

  switch: (node, depth) => {
    const i = indent(depth);
    return [
      `${i}<div className="flex items-center gap-2" ${uic(node)}>`,
      `${i}  <Switch id="${node.id}-field" />`,
      `${i}  <Label htmlFor="${node.id}-field">${jsxText(str(node.props.label, "スイッチ"))}</Label>`,
      `${i}</div>`,
    ];
  },

  "search-field": (node, depth) => [
    `${indent(depth)}<Input type="search" placeholder="${str(node.props.placeholder, "検索…")}" aria-label="検索" className="w-64" ${uic(node)} />`,
  ],

  card: (node, depth, children) => {
    const i = indent(depth);
    const title = str(node.props.title);
    return [
      `${i}<Card ${uic(node)}>`,
      ...(title
        ? [
            `${i}  <CardHeader><CardTitle>${jsxText(title)}</CardTitle></CardHeader>`,
          ]
        : []),
      `${i}  <CardContent className="flex flex-col gap-4">`,
      ...children(node, depth + 2),
      `${i}  </CardContent>`,
      `${i}</Card>`,
    ];
  },

  badge: (node, depth) => [
    `${indent(depth)}<Badge variant="secondary" ${uic(node)}>${jsxText(str(node.props.label, "バッジ"))}</Badge>`,
  ],

  alert: (node, depth) => {
    const i = indent(depth);
    const isError = str(node.props.severity, "info") === "error";
    return [
      `${i}<Alert${isError ? ' variant="destructive"' : ""} ${uic(node)}>`,
      `${i}  <AlertTitle>${jsxText(str(node.props.title))}</AlertTitle>`,
      `${i}  <AlertDescription>${jsxText(str(node.props.message))}</AlertDescription>`,
      `${i}</Alert>`,
    ];
  },

  table: (node, depth) => {
    const i = indent(depth);
    return [
      `${i}<Table ${uic(node)}>`,
      `${i}  <TableHeader>`,
      `${i}    <TableRow>`,
      ...listProp(node.props.columns).map(
        (col) => `${i}      <TableHead>${jsxText(col)}</TableHead>`,
      ),
      `${i}    </TableRow>`,
      `${i}  </TableHeader>`,
      `${i}  <TableBody>{/* TODO: ${num(node.props.rowCount, 5)}行分のデータを描画 */}</TableBody>`,
      `${i}</Table>`,
    ];
  },

  tabs: (node, depth, children) => {
    const i = indent(depth);
    const tabs = listProp(node.props.tabs);
    const first = tabs[0] ?? "tab-1";
    return [
      `${i}<Tabs defaultValue="${first}" ${uic(node)}>`,
      `${i}  <TabsList>`,
      ...tabs.map(
        (tab) =>
          `${i}    <TabsTrigger value="${tab}">${jsxText(tab)}</TabsTrigger>`,
      ),
      `${i}  </TabsList>`,
      `${i}  <TabsContent value="${first}">`,
      ...children(node, depth + 2),
      `${i}  </TabsContent>`,
      `${i}</Tabs>`,
    ];
  },

  accordion: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}<Accordion type="single" collapsible ${uic(node)}>`,
      ...listProp(node.props.items).flatMap((item, idx) => [
        `${i}  <AccordionItem value="item-${idx}">`,
        `${i}    <AccordionTrigger>${jsxText(item)}</AccordionTrigger>`,
        `${i}    <AccordionContent>{/* TODO: 内容 */}</AccordionContent>`,
        `${i}  </AccordionItem>`,
      ]),
      ...children(node, depth + 1),
      `${i}</Accordion>`,
    ];
  },
};

export const SHADCN_RENDERERS: Record<string, NodeRenderer> = {
  ...NODE_RENDERERS,
  ...SHADCN_OVERRIDES,
};

/**
 * Component names per "@/components/ui/<module>" path, used both for
 * import emission and the setup hint (npx shadcn add ...).
 */
export const SHADCN_IMPORT_MAP: Record<string, string[]> = {
  accordion: [
    "Accordion",
    "AccordionContent",
    "AccordionItem",
    "AccordionTrigger",
  ],
  alert: ["Alert", "AlertDescription", "AlertTitle"],
  badge: ["Badge"],
  button: ["Button"],
  card: ["Card", "CardContent", "CardHeader", "CardTitle"],
  checkbox: ["Checkbox"],
  input: ["Input"],
  label: ["Label"],
  "radio-group": ["RadioGroup", "RadioGroupItem"],
  select: [
    "Select",
    "SelectContent",
    "SelectItem",
    "SelectTrigger",
    "SelectValue",
  ],
  switch: ["Switch"],
  table: ["Table", "TableBody", "TableHead", "TableHeader", "TableRow"],
  tabs: ["Tabs", "TabsContent", "TabsList", "TabsTrigger"],
  textarea: ["Textarea"],
};
