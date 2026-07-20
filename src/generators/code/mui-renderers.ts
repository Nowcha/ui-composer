/**
 * MUI (@mui/material) renderers. Unlike shadcn, Tailwind classes are
 * useless in an MUI project, so every component type is mapped here.
 * Icons stay Phosphor per the project rule "アイコンはPhosphor統一".
 */

import type { ComponentNode } from "../../types/spec";
import type { NodeRenderer } from "./node-renderers";
import {
  iconJsx,
  indent,
  jsxText,
  listProp,
  num,
  pascalCase,
  str,
  uic,
} from "./emit-utils";

const MUI_BUTTON_ATTRS: Record<string, string> = {
  primary: 'variant="contained"',
  secondary: 'variant="contained" color="inherit"',
  outline: 'variant="outlined"',
  ghost: 'variant="text"',
  danger: 'variant="contained" color="error"',
};

const MUI_ALERT_SEVERITIES = new Set(["info", "success", "warning", "error"]);

/** Phosphor icon as MUI Button startIcon (empty when no icon). */
function startIconAttr(node: ComponentNode): string {
  if (!node.icon) return "";
  return ` startIcon={<${pascalCase(node.icon.name)} size={16} weight="${node.icon.weight}" />}`;
}

export const MUI_RENDERERS: Record<string, NodeRenderer> = {
  button: (node, depth) => {
    const attrs =
      MUI_BUTTON_ATTRS[str(node.props.variant, "primary")] ??
      MUI_BUTTON_ATTRS.primary;
    return [
      `${indent(depth)}<Button ${attrs}${startIconAttr(node)} ${uic(node)}>${jsxText(str(node.props.label, "ボタン"))}</Button>`,
    ];
  },

  link: (node, depth) => [
    `${indent(depth)}<Link href="${str(node.props.href, "#")}" underline="hover" ${uic(node)}>${iconJsx(node)}${jsxText(str(node.props.label, "リンク"))}</Link>`,
  ],

  "text-input": (node, depth) => {
    const placeholder = str(node.props.placeholder);
    return [
      `${indent(depth)}<TextField label="${str(node.props.label, "ラベル")}" type="${str(node.props.inputType, "text")}"${
        node.props.required === true ? " required" : ""
      }${placeholder ? ` placeholder="${placeholder}"` : ""} size="small" fullWidth ${uic(node)} />`,
    ];
  },

  textarea: (node, depth) => [
    `${indent(depth)}<TextField label="${str(node.props.label, "ラベル")}" multiline rows={${num(node.props.rows, 4)}} size="small" fullWidth ${uic(node)} />`,
  ],

  select: (node, depth) => {
    const i = indent(depth);
    return [
      `${i}<TextField select label="${str(node.props.label, "ラベル")}" defaultValue="" size="small" fullWidth ${uic(node)}>`,
      ...listProp(node.props.options).map(
        (option) =>
          `${i}  <MenuItem value="${option}">${jsxText(option)}</MenuItem>`,
      ),
      `${i}</TextField>`,
    ];
  },

  checkbox: (node, depth) => [
    `${indent(depth)}<FormControlLabel control={<Checkbox size="small" />} label="${str(node.props.label, "チェック")}" ${uic(node)} />`,
  ],

  "radio-button": (node, depth) => {
    const i = indent(depth);
    return [
      `${i}<FormControl ${uic(node)}>`,
      `${i}  <FormLabel>${jsxText(str(node.props.label, "選択"))}</FormLabel>`,
      `${i}  <RadioGroup name="${node.id}">`,
      ...listProp(node.props.options).map(
        (option) =>
          `${i}    <FormControlLabel value="${option}" control={<Radio size="small" />} label="${option}" />`,
      ),
      `${i}  </RadioGroup>`,
      `${i}</FormControl>`,
    ];
  },

  switch: (node, depth) => [
    `${indent(depth)}<FormControlLabel control={<Switch />} label="${str(node.props.label, "スイッチ")}" ${uic(node)} />`,
  ],

  "search-field": (node, depth) => [
    `${indent(depth)}<TextField type="search" placeholder="${str(node.props.placeholder, "検索…")}" size="small" ${uic(node)} />`,
  ],

  card: (node, depth, children) => {
    const i = indent(depth);
    const title = str(node.props.title);
    return [
      `${i}<Card variant="outlined" ${uic(node)}>`,
      ...(title ? [`${i}  <CardHeader title="${title}" />`] : []),
      `${i}  <CardContent>`,
      `${i}    <Stack spacing={2}>`,
      ...children(node, depth + 3),
      `${i}    </Stack>`,
      `${i}  </CardContent>`,
      `${i}</Card>`,
    ];
  },

  section: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}<Box component="section" sx={{ my: 4 }} ${uic(node)}>`,
      `${i}  <Typography variant="h6" component="${str(node.props.headingLevel, "h2")}" gutterBottom>${jsxText(str(node.props.title, "セクション"))}</Typography>`,
      ...children(node, depth + 1),
      `${i}</Box>`,
    ];
  },

  form: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}<Box component="form" onSubmit={(e) => e.preventDefault()} ${uic(node)}>`,
      `${i}  <Stack spacing={2} alignItems="flex-start">`,
      ...children(node, depth + 2),
      `${i}    <Button type="submit" variant="contained">${jsxText(str(node.props.submitLabel, "送信"))}</Button>`,
      `${i}  </Stack>`,
      `${i}</Box>`,
    ];
  },

  grid: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}<Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(${str(node.props.columns, "3")}, 1fr)" } }} ${uic(node)}>`,
      ...children(node, depth + 1),
      `${i}</Box>`,
    ];
  },

  header: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}<AppBar position="${node.props.sticky === true ? "sticky" : "static"}" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }} ${uic(node)}>`,
      `${i}  <Toolbar sx={{ gap: 2 }}>`,
      `${i}    <Typography variant="h6" component="h1">${jsxText(str(node.props.title, "アプリ名"))}</Typography>`,
      ...children(node, depth + 2),
      `${i}  </Toolbar>`,
      `${i}</AppBar>`,
    ];
  },

  toolbar: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}<Toolbar disableGutters sx={{ justifyContent: "space-between", gap: 1 }} ${uic(node)}>`,
      ...children(node, depth + 1),
      `${i}</Toolbar>`,
    ];
  },

  table: (node, depth) => {
    const i = indent(depth);
    return [
      `${i}<Table size="small" ${uic(node)}>`,
      `${i}  <TableHead>`,
      `${i}    <TableRow>`,
      ...listProp(node.props.columns).map(
        (col) => `${i}      <TableCell>${jsxText(col)}</TableCell>`,
      ),
      `${i}    </TableRow>`,
      `${i}  </TableHead>`,
      `${i}  <TableBody>{/* TODO: ${num(node.props.rowCount, 5)}行分のデータを描画 */}</TableBody>`,
      `${i}</Table>`,
    ];
  },

  badge: (node, depth) => [
    `${indent(depth)}<Chip label="${str(node.props.label, "バッジ")}" size="small" ${uic(node)} />`,
  ],

  "stat-card": (node, depth) => {
    const i = indent(depth);
    return [
      `${i}<Card variant="outlined" ${uic(node)}>`,
      `${i}  <CardContent>`,
      `${i}    <Typography variant="body2" color="text.secondary">${jsxText(str(node.props.label))}</Typography>`,
      `${i}    <Typography variant="h5" fontWeight={700}>${jsxText(str(node.props.value))}</Typography>`,
      `${i}    <Typography variant="body2" color="primary">${jsxText(str(node.props.change))}</Typography>`,
      `${i}  </CardContent>`,
      `${i}</Card>`,
    ];
  },

  alert: (node, depth) => {
    const i = indent(depth);
    const severity = str(node.props.severity, "info");
    return [
      `${i}<Alert severity="${MUI_ALERT_SEVERITIES.has(severity) ? severity : "info"}" ${uic(node)}>`,
      `${i}  <AlertTitle>${jsxText(str(node.props.title))}</AlertTitle>`,
      `${i}  ${jsxText(str(node.props.message))}`,
      `${i}</Alert>`,
    ];
  },

  divider: (node, depth) => [
    `${indent(depth)}<Divider sx={{ my: 3 }} ${uic(node)} />`,
  ],

  list: (node, depth) => {
    const i = indent(depth);
    return [
      `${i}<List dense ${uic(node)}>`,
      ...listProp(node.props.items).map(
        (item) =>
          `${i}  <ListItem disableGutters><ListItemText primary="${item}" /></ListItem>`,
      ),
      `${i}</List>`,
    ];
  },

  breadcrumb: (node, depth) => {
    const i = indent(depth);
    const items = listProp(node.props.items);
    return [
      `${i}<Breadcrumbs aria-label="パンくずリスト" ${uic(node)}>`,
      ...items.map((item, idx) =>
        idx === items.length - 1
          ? `${i}  <Typography color="text.primary">${jsxText(item)}</Typography>`
          : `${i}  <Link underline="hover" color="inherit" href="#">${jsxText(item)}</Link>`,
      ),
      `${i}</Breadcrumbs>`,
    ];
  },

  tabs: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}{/* TODO: タブ切替の状態管理を実装 */}`,
      `${i}<Box ${uic(node)}>`,
      `${i}  <Tabs value={0} sx={{ borderBottom: 1, borderColor: "divider" }}>`,
      ...listProp(node.props.tabs).map(
        (tab) => `${i}    <Tab label="${tab}" />`,
      ),
      `${i}  </Tabs>`,
      `${i}  <Box sx={{ py: 2 }}>`,
      ...children(node, depth + 2),
      `${i}  </Box>`,
      `${i}</Box>`,
    ];
  },

  accordion: (node, depth, children) => {
    const i = indent(depth);
    return [
      `${i}<Box ${uic(node)}>`,
      ...listProp(node.props.items).flatMap((item) => [
        `${i}  <Accordion variant="outlined">`,
        `${i}    <AccordionSummary>${jsxText(item)}</AccordionSummary>`,
        `${i}    <AccordionDetails>{/* TODO: 内容 */}</AccordionDetails>`,
        `${i}  </Accordion>`,
      ]),
      ...children(node, depth + 1),
      `${i}</Box>`,
    ];
  },

  pagination: (node, depth) => [
    `${indent(depth)}<Pagination count={${num(node.props.totalPages, 10)}} page={1} ${uic(node)} />`,
  ],
};

/** Uncovered types keep structure + a clear TODO (MUI Box styling). */
export const muiFallback: NodeRenderer = (node, depth, children) => {
  const i = indent(depth);
  return [
    `${i}{/* TODO: ${node.type} を実装 */}`,
    `${i}<Box data-uic-id="${node.id}" sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 1, p: 1.5, color: "text.disabled" }}>`,
    `${i}  [${node.type}]`,
    ...children(node, depth + 1),
    `${i}</Box>`,
  ];
};
