# annotate-for-agent

VS Code extension. Bridge between devs reviewing agent-generated code and coding agents iterating on feedback.

## Problem

Modern dev flow: agent writes most code in terminal. Dev reviews huge diff in editor. Giving structured feedback back to agent is painful — devs copy-paste snippets, retype line refs, lose context.

## Solution

Let dev annotate code directly in editor (inline comments on ranges/lines). Export one or all annotations in agent-friendly format (path + line range + comment). Agent consumes export, applies fixes selectively.

## Core features

- Add annotation on selected range or line
- List all annotations (sidebar/panel)
- Edit, delete annotation
- Copy single annotation to clipboard in export format
- Copy/export all annotations (clipboard + file)
- Configurable export format (markdown, JSON, custom template)
- Persist annotations per-workspace (survive reloads)
- Clear annotations after export (optional)

## Non-goals

- Not replacing code review tools (GitHub PR review, etc.)
- Not executing agent commands — just producing feedback payload
- No multi-user sync. Local per-workspace only.

## Export format (default)

```
### <relative/path>:<startLine>-<endLine>
<snippet>

Feedback: <comment>
```

Agent parses path + range + feedback, acts on each block.

## Tech stack

- TypeScript
- VS Code Extension API (`vscode` module)
- Build: esbuild or tsc
- Test: `@vscode/test-electron` + mocha

## Key VS Code APIs

- `vscode.commands.registerCommand` — user actions
- `vscode.window.createTreeView` — annotations sidebar
- `TextEditorDecorationType` — highlight annotated ranges
- `workspaceState` / file in `.vscode/` — persistence
- `vscode.env.clipboard.writeText` — copy export

## Project layout (target)

```
src/
  extension.ts        # activate/deactivate
  annotations/        # model, store, persistence
  views/              # tree view, decorations
  export/             # formatters (md, json, custom)
  commands/           # command handlers
package.json          # extension manifest, contributes
```

## Status

Bootstrap. Nothing built yet. Next: scaffold extension via `yo code` or manual `package.json` + `extension.ts`.
