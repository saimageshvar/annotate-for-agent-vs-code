# Two modes for two speeds

## Panel mode (default)

Rich webview beside the code. Best for substantive feedback.

- Category pills with color + keyboard shortcut (`Alt+1`–`6`)
- Multi-line comment area
- ```suggestion``` block insert (Bug / Refactor / Nit / Suggestion)
- `@` file picker for cross-file references

## Quick mode

Native QuickPick + InputBox. Best for triage.

- Category picked from list with number key (`1`–`6`)
- Single-line comment in InputBox
- `Ctrl`/`Cmd+Enter` escalates to panel without losing what you typed

## Switching default

[Open settings](command:workbench.action.openSettings?%22annotateForAgent.defaultMode%22) and change `annotateForAgent.defaultMode`. Direct commands stay available regardless of default.
