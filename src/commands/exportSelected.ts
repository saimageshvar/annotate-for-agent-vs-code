import * as vscode from 'vscode'
import { AnnotationStore } from '../store/AnnotationStore'
import { renderExport, buildFilename } from '../export'
import { ExportFormat } from '../store/types'
import { generateSlug } from '../util/slug'

export function exportHandler(store: AnnotationStore) {
  return async (ids: string[]) => {
    const cfg = vscode.workspace.getConfiguration('annotateForAgent')
    const format = cfg.get<ExportFormat>('defaultFormat') ?? 'markdown'
    const all = store.list()
    const selected = ids.length ? all.filter(a => ids.includes(a.id)) : all
    const workspace = vscode.workspace.workspaceFolders?.[0]
    if (!workspace) {
      vscode.window.showErrorMessage('Open a workspace to export annotations.')
      return
    }
    const out = renderExport(selected, {
      format,
      workspace: workspace.name,
      includeCodeHunk: cfg.get<boolean>('includeCodeHunk') ?? true,
      includeCategoryLegend: cfg.get<boolean>('includeCategoryLegend') ?? true,
      now: new Date(),
    })
    const dir = cfg.get<string>('exportDir') ?? '.annotate-for-agent/exports'
    const filename = buildFilename(format, new Date(), generateSlug)
    const targetDir = vscode.Uri.joinPath(workspace.uri, dir)
    const targetFile = vscode.Uri.joinPath(targetDir, filename)
    await vscode.workspace.fs.createDirectory(targetDir)
    await vscode.workspace.fs.writeFile(targetFile, Buffer.from(out, 'utf8'))

    if (cfg.get<boolean>('autoResolveOnExport')) {
      for (const a of selected) await store.update(a.id, { status: 'resolved', exportedAt: Date.now() })
    } else {
      for (const a of selected) await store.update(a.id, { exportedAt: Date.now() })
    }

    const choice = await vscode.window.showInformationMessage(
      `Exported ${selected.length} annotation(s) → ${filename}`,
      'Open file',
    )
    if (choice === 'Open file') {
      await vscode.window.showTextDocument(targetFile)
    }
  }
}
