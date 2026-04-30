import * as vscode from 'vscode'
import { AnnotationStore } from '../store/AnnotationStore'
import { CATEGORY_META, DEFAULT_CATEGORY } from '../store/categoryMeta'
import { Annotation } from '../store/types'

export interface EditorPanelHandlers {
  onSave(payload: any, mode: 'create' | 'edit'): Promise<void>
  onCancel(): void
  onResolve(id: string): Promise<void>
  onDelete(id: string): Promise<void>
  onCopy(id: string): Promise<void>
  onExport(id: string): Promise<void>
}

export class EditorPanel {
  private panel: vscode.WebviewPanel | undefined
  private pendingInit: any
  private creating = false

  constructor(
    private extensionUri: vscode.Uri,
    private handlers: EditorPanelHandlers,
    private store: AnnotationStore,
  ) {}

  showCreate(payload: { filePath: string; range: { startLine: number; endLine: number }; context: any; initialComment?: string; category?: string }): void {
    this.ensurePanel('New annotation', false)
    const msg = {
      type: 'init-create',
      defaultCategory: payload.category ?? DEFAULT_CATEGORY,
      categoryMeta: CATEGORY_META,
      payload,
    }
    if (this.panel) this.panel.webview.postMessage(msg); else this.pendingInit = msg
  }

  showView(annotation: Annotation): void {
    this.ensurePanel(`Annotation: ${annotation.filePath.split('/').pop() ?? annotation.filePath}:${annotation.range.startLine}`, true)
    const msg = { type: 'init-view', annotation, categoryMeta: CATEGORY_META }
    if (this.panel) this.panel.webview.postMessage(msg); else this.pendingInit = msg
  }

  close(): void {
    this.panel?.dispose()
  }

  private ensurePanel(title: string, preserveFocus: boolean = true): void {
    if (this.panel) {
      this.panel.title = title
      this.panel.reveal(vscode.ViewColumn.Beside, preserveFocus)
      return
    }
    if (this.creating) return
    this.creating = true
    try {
      this.panel = vscode.window.createWebviewPanel(
        'annotateForAgent.editor',
        title,
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus },
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(this.extensionUri, 'dist'),
            vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/editor'),
            vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/shared'),
          ],
        },
      )
      this.panel.webview.html = this.getHtml(this.panel.webview)
      this.panel.webview.onDidReceiveMessage(msg => this.onMessage(msg))
      this.panel.onDidDispose(() => { this.panel = undefined; this.pendingInit = undefined })
      if (this.pendingInit) {
        this.panel.webview.postMessage(this.pendingInit)
        this.pendingInit = undefined
      }
    } finally {
      this.creating = false
    }
  }

  private onMessage(msg: any): void {
    switch (msg.type) {
      case 'ready':
        if (this.pendingInit && this.panel) {
          this.panel.webview.postMessage(this.pendingInit)
          this.pendingInit = undefined
        }
        break
      case 'save':
        console.log('[annotate-for-agent] save received', { mode: msg.mode, payloadId: msg.payload?.id })
        void this.handlers.onSave(msg.payload, msg.mode === 'edit' ? 'edit' : 'create')
        break
      case 'cancel':
        this.handlers.onCancel()
        this.close()
        break
      case 'resolve':
        void this.handlers.onResolve(msg.id)
        break
      case 'delete':
        void this.handlers.onDelete(msg.id)
        break
      case 'copy':
        void this.handlers.onCopy(msg.id)
        break
      case 'export':
        void this.handlers.onExport(msg.id)
        break
      case 'pickFile':
        void this.handleFilePick(msg.cursorAt)
        break
    }
  }

  private async handleFilePick(cursorAt: number): Promise<void> {
    const files = await vscode.workspace.findFiles('**/*', '**/{node_modules,.git,dist,out,build,.next,coverage,.cache}/**', 5000)
    const items = files
      .map(uri => vscode.workspace.asRelativePath(uri))
      .sort((a, b) => a.localeCompare(b))
      .map(label => ({ label }))
    const pick = await vscode.window.showQuickPick(items, {
      placeHolder: 'Reference a file (Esc to cancel)',
      matchOnDescription: true,
      matchOnDetail: true,
    })
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside, false)
      if (pick) {
        this.panel.webview.postMessage({ type: 'fileChosen', path: pick.label, cursorAt })
      } else {
        this.panel.webview.postMessage({ type: 'fileChosen', path: '', cursorAt })
      }
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist/webview/editor/main.js'))
    const tokensUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/shared/tokens.css'))
    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/editor/styles.css'))
    const nonce = String(Date.now())
    return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
<link rel="stylesheet" href="${tokensUri}">
<link rel="stylesheet" href="${stylesUri}">
</head><body><div id="app"></div><script nonce="${nonce}" src="${scriptUri}"></script></body></html>`
  }
}
