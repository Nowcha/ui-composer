/**
 * Inline stylesheet for self-contained HTML reports.
 * Zero external dependencies (no CDN) so the file opens anywhere.
 */

export const REPORT_CSS = `
:root {
  --ink: #1e293b; --muted: #64748b; --line: #e2e8f0; --bg: #ffffff;
  --accent: #2563eb; --info-bg: #eff6ff; --info-bd: #bfdbfe;
  --warn-bg: #fffbeb; --warn-bd: #fde68a; --ok-bg: #f0fdf4; --ok-bd: #bbf7d0;
  --danger-bg: #fef2f2; --danger-bd: #fecaca;
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "BIZ UDPGothic", Meiryo, system-ui, sans-serif;
  line-height: 1.8; font-size: 16px;
}
main.uic-report { max-width: 860px; margin: 0 auto; padding: 40px 24px 80px; }
h1, h2, h3 { line-height: 1.4; }
.uic-hero { border-bottom: 2px solid var(--ink); padding-bottom: 20px; margin-bottom: 32px; }
.uic-hero h1 { font-size: 1.9rem; margin: 0 0 8px; }
.uic-hero .uic-subtitle { color: var(--muted); margin: 0 0 4px; }
.uic-hero .uic-meta { color: var(--muted); font-size: .85rem; }
.uic-section { margin: 36px 0; }
.uic-section > h2 { font-size: 1.35rem; border-left: 4px solid var(--accent); padding-left: 10px; }
.uic-toc { background: #f8fafc; border: 1px solid var(--line); border-radius: 8px; padding: 16px 20px; margin: 24px 0; }
.uic-toc h2 { font-size: 1rem; margin: 0 0 8px; }
.uic-toc ol { margin: 0; padding-left: 20px; }
.uic-columns { display: grid; gap: 20px; margin: 20px 0; }
.uic-columns[data-cols="2"] { grid-template-columns: 1fr 1fr; }
.uic-columns[data-cols="3"] { grid-template-columns: 1fr 1fr 1fr; }
@media (max-width: 640px) { .uic-columns { grid-template-columns: 1fr !important; } }
.uic-stat { border: 1px solid var(--line); border-radius: 8px; padding: 16px 20px; margin: 12px 0; }
.uic-stat .uic-stat-label { color: var(--muted); font-size: .85rem; }
.uic-stat .uic-stat-value { font-size: 1.6rem; font-weight: 700; }
.uic-stat .uic-stat-change { font-size: .85rem; color: var(--accent); }
table.uic-table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: .92rem; }
.uic-table th, .uic-table td { border: 1px solid var(--line); padding: 8px 12px; text-align: left; }
.uic-table th { background: #f8fafc; }
.uic-chart { border: 2px dashed var(--line); border-radius: 8px; padding: 28px 20px; text-align: center; color: var(--muted); margin: 16px 0; }
.uic-chart .uic-chart-title { color: var(--ink); font-weight: 600; margin-bottom: 6px; }
.uic-callout { border: 1px solid; border-radius: 8px; padding: 14px 18px; margin: 16px 0; }
.uic-callout-info { background: var(--info-bg); border-color: var(--info-bd); }
.uic-callout-warning { background: var(--warn-bg); border-color: var(--warn-bd); }
.uic-callout-success { background: var(--ok-bg); border-color: var(--ok-bd); }
.uic-callout-danger { background: var(--danger-bg); border-color: var(--danger-bd); }
.uic-callout .uic-callout-title { font-weight: 700; margin-bottom: 4px; }
blockquote.uic-quote { border-left: 4px solid var(--line); margin: 16px 0; padding: 4px 18px; color: var(--muted); }
.uic-quote cite { display: block; font-size: .85rem; margin-top: 6px; }
ol.uic-timeline { list-style: none; padding-left: 0; margin: 16px 0; }
.uic-timeline li { border-left: 2px solid var(--accent); padding: 4px 0 16px 16px; margin-left: 8px; position: relative; }
.uic-timeline li::before { content: ""; position: absolute; left: -6px; top: 10px; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); }
ol.uic-steps { display: flex; gap: 8px; list-style: none; padding: 0; flex-wrap: wrap; counter-reset: step; }
.uic-steps li { counter-increment: step; background: #f8fafc; border: 1px solid var(--line); border-radius: 999px; padding: 4px 14px 4px 8px; font-size: .9rem; }
.uic-steps li::before { content: counter(step); display: inline-block; width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: #fff; text-align: center; line-height: 22px; font-size: .8rem; margin-right: 8px; }
.uic-source { color: var(--muted); font-size: .8rem; margin: 8px 0; }
footer.uic-footer { border-top: 1px solid var(--line); margin-top: 48px; padding-top: 16px; color: var(--muted); font-size: .85rem; }
.uic-badge { display: inline-block; background: #f1f5f9; border-radius: 999px; padding: 1px 10px; font-size: .8rem; }
.uic-image-ph { border: 2px dashed var(--line); border-radius: 8px; padding: 40px 20px; text-align: center; color: var(--muted); margin: 16px 0; }
dl.uic-dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 20px; margin: 16px 0; }
.uic-dl dt { color: var(--muted); }
.uic-dl dd { margin: 0; }
hr.uic-divider { border: none; border-top: 1px solid var(--line); margin: 28px 0; }
.uic-unknown { border: 1px dashed var(--line); border-radius: 6px; padding: 12px; color: var(--muted); font-size: .85rem; margin: 12px 0; }
`.trim();
