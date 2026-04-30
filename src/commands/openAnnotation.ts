import * as path from 'node:path'
import * as vscode from 'vscode'
import { AnnotationStore } from '../store/AnnotationStore'
import { EditorPanel } from '../views/EditorPanel'
import { linesToRange } from '../util/range'

export function openAnnotationCommand(store: AnnotationStore, editorPanel: EditorPanel) {
  return async (arg: string | { id: string }) => {
    const id = typeof arg === 'string' ? arg : arg?.id
    if (!id) return
    const ann = store.get(id)
    if (!ann) return

    let uri: vscode.Uri
    if (path.isAbsolute(ann.filePath)) {
      uri = vscode.Uri.file(ann.filePath)
    } else {
      const wsFolders = vscode.workspace.workspaceFolders
      if (!wsFolders || wsFolders.length === 0) {
        vscode.window.showErrorMessage(`Cannot open annotation: no workspace folder open.`)
        return
      }
      uri = vscode.Uri.joinPath(wsFolders[0].uri, ann.filePath)
    }

    const range = linesToRange(ann.range)

    // Find existing tab for this URI
    let targetColumn: vscode.ViewColumn | undefined
    for (const group of vscode.window.tabGroups.all) {
      for (const tab of group.tabs) {
        const input: any = tab.input
        if (input && input.uri && input.uri.toString() === uri.toString()) {
          targetColumn = group.viewColumn
          break
        }
      }
      if (targetColumn) break
    }

    try {
      const editor = await vscode.window.showTextDocument(uri, {
        selection: range,
        preserveFocus: false,
        preview: false,
        viewColumn: targetColumn ?? vscode.ViewColumn.One,
      })
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter)
    } catch (err) {
      vscode.window.showErrorMessage(`Cannot open ${ann.filePath}: ${err instanceof Error ? err.message : String(err)}`)
      return
    }

    editorPanel.showView(ann)
  }
}
