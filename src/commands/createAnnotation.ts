import * as vscode from 'vscode'
import { AnnotationStore } from '../store/AnnotationStore'
import { EditorPanel } from '../views/EditorPanel'
import { captureDiffContext } from '../editor/diffHunk'
import { snippetHash } from '../util/hash'
import { rangeToLines } from '../util/range'

export function createAnnotationCommand(store: AnnotationStore, editorPanel: EditorPanel) {
  return async (ctx?: { uri: vscode.Uri; range: vscode.Range; initialComment?: string }) => {
    const active = vscode.window.activeTextEditor
    const uri = ctx?.uri ?? active?.document.uri
    const range = ctx?.range ?? active?.selection
    if (!uri || !range) return

    const filePath = vscode.workspace.asRelativePath(uri)
    const lines = rangeToLines(range)
    const doc = await vscode.workspace.openTextDocument(uri)
    const snippet = doc.getText(new vscode.Range(lines.startLine - 1, 0, lines.endLine - 1, Number.MAX_SAFE_INTEGER))

    let context
    if (uri.scheme === 'git') {
      const diff = await captureDiffContext(uri, lines.startLine, lines.endLine)
      context = diff ?? { kind: 'file' as const, snippet, snippetHash: snippetHash(snippet) }
    } else {
      context = { kind: 'file' as const, snippet, snippetHash: snippetHash(snippet) }
    }

    editorPanel.showCreate({ filePath, range: lines, context, initialComment: ctx?.initialComment })
  }
}
