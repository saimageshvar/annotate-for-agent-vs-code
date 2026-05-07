<div align="center">

# Annotate for Agent

**Inline feedback for agent-generated code. Export structured payloads your agent can act on.**

[![Marketplace](https://img.shields.io/badge/marketplace-v1.0.0-0E1116?style=flat-square&logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=SaiMageshvar.annotate-for-agent)
[![VS Code](https://img.shields.io/badge/VS%20Code-%E2%89%A51.85-0E1116?style=flat-square)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-0E1116?style=flat-square)](LICENSE)

<br />

<img src="https://raw.githubusercontent.com/saimageshvar/annotate-for-agent-vs-code/main/media/readme/hero.gif" width="900" alt="Select code, annotate, export — agent applies the fix." />

<sub><i>Select. Annotate. Export. Your agent picks up exactly what you meant.</i></sub>

</div>

## The 60-second pitch

The agent writes the diff. You review it. You spot six things — a wrong null check, a missing return, an off-by-one, three nits. Today: copy the file path, retype the line range, paste the snippet, type the feedback. Six times. By the third one you've forgotten the first.

**Annotate for Agent** turns the editor into the feedback surface.

<br />

<div align="center">

<table>
<tr>
<td align="center" width="280"><b>1 &nbsp; Select</b><br /><sub>Highlight the lines.<br /><kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>A</kbd></sub></td>
<td align="center" width="280"><b>2 &nbsp; Annotate</b><br /><sub>Pick a category. Type the feedback.<br />Six colors. Six shortcuts.</sub></td>
<td align="center" width="280"><b>3 &nbsp; Export</b><br /><sub>Markdown · JSON · CSV.<br />Hand it to the agent.</sub></td>
</tr>
</table>

</div>

<br />

The export is one structured block per note — path, range, snippet, category, feedback. The agent parses it cleanly and acts on each block. No copy-paste tax. No lost context.

<br />

## Install

```
ext install SaiMageshvar.annotate-for-agent
```

Or grab it from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=SaiMageshvar.annotate-for-agent).

<br />

## Features

### Two modes for two speeds

**Panel** — for substantive feedback. <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>A</kbd> opens a rich form beside your code: multi-line comment, fenced ` ```suggestion ` block at one click, `@` to reference any file in the workspace.

<img src="https://raw.githubusercontent.com/saimageshvar/annotate-for-agent-vs-code/main/media/readme/feature-annotate.png" width="900" alt="Annotation panel open beside code, Bug category selected, comment typed" />

<br />

**Quick** — for triage. <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>Q</kbd> drops a native QuickPick. Number key picks the category, enter confirms, one-line feedback, done — two keystrokes. Mid-type, <kbd>Ctrl</kbd> <kbd>Enter</kbd> escalates to the full panel without losing what you typed.

<img src="https://raw.githubusercontent.com/saimageshvar/annotate-for-agent-vs-code/main/media/readme/feature-quick.png" width="900" alt="Quick Capture QuickPick listing six categories with shortcuts" />

<br />

Six categories, each with its own color and shortcut:

<sub><kbd>Alt</kbd>+<kbd>1</kbd> 🔴 Bug · <kbd>Alt</kbd>+<kbd>2</kbd> 🟣 Question · <kbd>Alt</kbd>+<kbd>3</kbd> 🔵 Refactor · <kbd>Alt</kbd>+<kbd>4</kbd> 🟡 Suggestion · <kbd>Alt</kbd>+<kbd>5</kbd> ⚪ Nit · <kbd>Alt</kbd>+<kbd>6</kbd> 🟢 Praise</sub>

<br />

### Track everything · drift detected automatically

<img src="https://raw.githubusercontent.com/saimageshvar/annotate-for-agent-vs-code/main/media/readme/feature-list.png" width="900" alt="Sidebar list with six annotations across files, one marked stale" />

Colored gutter dots mark every annotated line. The sidebar groups by file, category, or status. Bulk-select to resolve, reopen, copy, or export.

Edit code under an existing annotation? It flips to **stale** automatically — orange triangle in the gutter, dotted border on the card, count in the toolbar. You see the drift before the agent does.

<br />

### Export agent-ready feedback

<img src="https://raw.githubusercontent.com/saimageshvar/annotate-for-agent-vs-code/main/media/readme/feature-export.png" width="900" alt="Source code on the left, exported Markdown with structured feedback blocks on the right" />

One click writes a Markdown / JSON / CSV file to `.annotate-for-agent/exports/`. Same content lands on your clipboard. Point your agent at the file. Done.

#### What the agent sees

````markdown
### src/editor/StaleTracker.ts:30-37

```ts
for (const a of matching) {
  const startLine = a.range.startLine - 1
  const endLine = Math.min(a.range.endLine - 1, doc.lineCount - 1)
  if (startLine < 0 || startLine > endLine) {
    if (a.status !== 'stale') await this.store.update(a.id, { status: 'stale' })
    continue
  }
  const snippet = doc.getText(new vscode.Range(startLine, 0, endLine, Number.MAX_SAFE_INTEGER))
```

**Category:** Bug
**Feedback:** When the range overflows the file, `endLine` is silently clamped instead of marked stale. An annotation pinned to deleted lines stays "open" and the hash check passes against the truncated snippet. Mark stale before reading.
````

Each block is path-anchored, language-tagged, and self-contained. Switch to JSON / CSV via `annotateForAgent.defaultFormat`.

<br />

## Keybindings

| Action | Shortcut |
| --- | --- |
| Annotate (default mode) | <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> |
| Quick capture | <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>Q</kbd> |
| Escalate quick capture → panel | <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Enter</kbd> |
| Pick category | <kbd>Alt</kbd> + <kbd>1</kbd> … <kbd>6</kbd> |
| Save annotation | <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Enter</kbd> |
| Cancel annotation | <kbd>Esc</kbd> |

<br />

## Settings

<details>
<summary><b>Nine settings — sensible defaults, tweak as you like</b></summary>

<br />

| Key | Default | What it does |
| --- | --- | --- |
| `annotateForAgent.defaultMode` | `panel` | `panel` for rich form, `quick` for QuickPick + InputBox. |
| `annotateForAgent.defaultFormat` | `markdown` | Export format: `markdown` / `json` / `csv`. |
| `annotateForAgent.exportDir` | `.annotate-for-agent/exports` | Workspace-relative export folder. |
| `annotateForAgent.includeCodeHunk` | `false` | Embed the snippet inside the export block. |
| `annotateForAgent.includeCategoryLegend` | `true` | Prepend a category legend to Markdown exports. |
| `annotateForAgent.autoResolveOnExport` | `false` | Mark annotations resolved as soon as they're exported. |
| `annotateForAgent.showResolved` | `false` | Show resolved cards in the sidebar list. |
| `annotateForAgent.filterCurrentFile` | `false` | Show only annotations for the active file. |
| `annotateForAgent.quickCapture.defaultCategory` | `Suggestion` | Category preselected at the top of the Quick Capture picker. |

</details>

<br />

## Layout tip

Drag the **Annotations** view from the activity bar to the **Secondary Side Bar** on the right (right-click → *Move View*). File tree on the left, code in the middle, annotations on the right — review at a glance, click any card to jump straight to the line.

---

<div align="center">
<a href="https://marketplace.visualstudio.com/items?itemName=SaiMageshvar.annotate-for-agent"><img src="https://img.shields.io/badge/Install-Annotate%20for%20Agent-0E1116?style=for-the-badge" alt="Install" /></a>
<br />
<sub><a href="https://github.com/saimageshvar/annotate-for-agent-vs-code/issues">Report an issue</a> · <a href="https://github.com/saimageshvar/annotate-for-agent-vs-code">Source</a> · <a href="https://github.com/saimageshvar/annotate-for-agent-vs-code/blob/main/LICENSE">License</a></sub>
<br /><br />
<sub><i>Built for the era when most code gets written by an agent and reviewed by you.</i></sub>
</div>
