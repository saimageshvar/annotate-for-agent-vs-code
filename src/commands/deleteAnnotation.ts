import * as vscode from 'vscode'
import { AnnotationStore } from '../store/AnnotationStore'

export function deleteAnnotationHandler(store: AnnotationStore) {
  return async (id: string) => {
    const ann = store.get(id)
    if (!ann) return
    const ok = await vscode.window.showWarningMessage(
      `Delete annotation on ${ann.filePath}:${ann.range.startLine}?`, { modal: true }, 'Delete'
    )
    if (ok === 'Delete') await store.remove(id)
  }
}
