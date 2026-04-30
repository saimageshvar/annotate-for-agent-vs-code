import * as vscode from 'vscode'
import { AnnotationStore } from '../store/AnnotationStore'
import { snippetHash } from '../util/hash'

export class StaleTracker {
  private timers = new Map<string, NodeJS.Timeout>()
  private disposables: vscode.Disposable[] = []

  constructor(private store: AnnotationStore) {
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(e => this.schedule(e.document))
    )
  }

  private schedule(doc: vscode.TextDocument): void {
    const key = doc.uri.toString()
    const existing = this.timers.get(key)
    if (existing) clearTimeout(existing)
    this.timers.set(key, setTimeout(() => {
      this.timers.delete(key)
      void this.check(doc)
    }, 300))
  }

  private async check(doc: vscode.TextDocument): Promise<void> {
    const relPath = vscode.workspace.asRelativePath(doc.uri)
    const matching = this.store.list().filter(a =>
      (a.filePath === relPath || a.filePath === doc.uri.fsPath) && a.status !== 'resolved'
    )
    for (const a of matching) {
      const startLine = a.range.startLine - 1
      const endLine = Math.min(a.range.endLine - 1, doc.lineCount - 1)
      if (startLine < 0 || startLine > endLine) {
        if (a.status !== 'stale') await this.store.update(a.id, { status: 'stale' })
        continue
      }
      const snippet = doc.getText(new vscode.Range(startLine, 0, endLine, Number.MAX_SAFE_INTEGER))
      const h = snippetHash(snippet)
      if (h !== a.context.snippetHash && a.status !== 'stale') {
        await this.store.update(a.id, { status: 'stale' })
      }
    }
  }

  dispose(): void {
    for (const t of this.timers.values()) clearTimeout(t)
    for (const d of this.disposables) d.dispose()
  }
}
