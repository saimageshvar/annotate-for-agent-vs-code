import * as vscode from 'vscode'
import { AnnotationStore } from '../store/AnnotationStore'
import { renderExport } from '../export'
import { ExportFormat } from '../store/types'

export function copyHandler(store: AnnotationStore) {
  return async (ids: string[]) => {
    const cfg = vscode.workspace.getConfiguration('annotateForAgent')
    const all = store.list()
    const selected = ids.length ? all.filter(a => ids.includes(a.id)) : all
    const workspace = vscode.workspace.workspaceFolders?.[0]?.name ?? 'workspace'
    const out = renderExport(selected, {
      format: cfg.get<ExportFormat>('defaultFormat') ?? 'markdown',
      workspace,
      includeCodeHunk: cfg.get<boolean>('includeCodeHunk') ?? true,
      includeCategoryLegend: cfg.get<boolean>('includeCategoryLegend') ?? true,
      now: new Date(),
    })
    await vscode.env.clipboard.writeText(out)
    vscode.window.showInformationMessage(`Copied ${selected.length} annotation(s) to clipboard.`)
  }
}
