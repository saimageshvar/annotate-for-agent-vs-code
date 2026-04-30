# Annotate for Agent

VS Code extension for annotating agent-generated code and exporting structured feedback for the coding agent.

## Layout tip

After first install, drag the "Annotation Editor" view from the activity bar to the Secondary Side Bar (right) via right-click → "Move View" for the best layout.

## Install (dev)

```
npm install
npm run build
# press F5 in VS Code to launch Extension Development Host
```

## Manual verification checklist

- [ ] Open a file, select lines, right-click → "Annotate for Agent: Add Annotation" entry
- [ ] Click entry → right pane opens with category + comment form
- [ ] Save → annotation appears in list (left pane) + gutter indicator, panel stays open showing saved annotation
- [ ] Edit annotated code → gutter icon flips to stale (`⚠`)
- [ ] Click list card → file opens at range, right pane shows view mode
- [ ] Click Edit → form pre-filled, Save updates in place, panel stays open showing updated annotation
- [ ] Mark resolved → card dims (toggle Show resolved to see)
- [ ] Export (all annotations) → file written to `.annotate-for-agent/exports/<slug>-<ts>.md`
- [ ] Toast appears with "Open file" action → opens exported file
- [ ] Copy → clipboard contains same content
- [ ] Toggle "Include code hunk" OFF → export has no code blocks
- [ ] Category legend appears in export header (unless setting disabled)
- [ ] Delete annotation → confirm dialog, then removed from list + gutter, panel closes

## Settings

See `annotateForAgent.*` keys in VS Code Settings.
