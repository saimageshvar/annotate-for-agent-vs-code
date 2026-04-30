import * as vscode from 'vscode'
import { AnnotationStore } from '../store/AnnotationStore'
import { CATEGORY_META } from '../store/categoryMeta'

export interface ListViewHandlers {
  open(id: string): void
  copy(ids: string[]): void
  export(ids: string[]): void
  bulkResolve(ids: string[], action: 'resolve' | 'reopen'): void
  bulkDelete(ids: string[]): void
}

export class ListViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'annotateForAgent.list'
  private view: vscode.WebviewView | undefined

  constructor(
    private extensionUri: vscode.Uri,
    private store: AnnotationStore,
    private handlers: ListViewHandlers,
  ) {
    store.onDidChange(() => this.postState())
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist'), vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/list'), vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/shared')],
    }
    view.webview.html = this.getHtml(view.webview)
    view.webview.onDidReceiveMessage(msg => this.onMessage(msg))
    this.updateBadge()
  }

  private updateBadge(): void {
    if (!this.view) return
    const openCount = this.store.list().filter(a => a.status === 'open' || a.status === 'stale').length
    if (openCount > 0) {
      this.view.badge = { value: openCount, tooltip: `${openCount} open annotation${openCount === 1 ? '' : 's'}` }
    } else {
      this.view.badge = undefined
    }
  }

  postState(): void {
    this.updateBadge()
    if (!this.view) return
    const cfg = vscode.workspace.getConfiguration('annotateForAgent')
    const activeEditor = vscode.window.activeTextEditor
    let currentFile: string | undefined
    if (activeEditor) {
      currentFile = vscode.workspace.asRelativePath(activeEditor.document.uri)
    }
    this.view.webview.postMessage({
      type: 'state',
      state: {
        annotations: this.store.list(),
        categoryMeta: Object.fromEntries(
          Object.entries(CATEGORY_META).map(([k, v]) => [k, { userHint: v.userHint, color: v.color, priority: v.priority }])
        ),
        settings: {
          includeCodeHunk: cfg.get('includeCodeHunk'),
          defaultFormat: cfg.get('defaultFormat'),
          showResolved: cfg.get('showResolved'),
          filterCurrentFile: cfg.get('filterCurrentFile'),
        },
        currentFile,
      },
    })
  }

  private onMessage(msg: any): void {
    switch (msg.type) {
      case 'ready': this.postState(); break
      case 'open': this.handlers.open(msg.id); break
      case 'copy': this.handlers.copy(msg.ids); break
      case 'export': this.handlers.export(msg.ids); break
      case 'bulkResolve': this.handlers.bulkResolve(msg.ids, msg.action ?? 'resolve'); break
      case 'bulkDelete': this.handlers.bulkDelete(msg.ids); break
      case 'notice': vscode.window.showInformationMessage(msg.text); break
      case 'setSetting': {
        const tgt = vscode.ConfigurationTarget.Global
        vscode.workspace.getConfiguration('annotateForAgent').update(msg.key, msg.value, tgt).then(() => this.postState())
        break
      }
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist/webview/list/main.js'))
    const tokensUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/shared/tokens.css'))
    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/list/styles.css'))
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="${tokensUri}">
<link rel="stylesheet" href="${stylesUri}"></head>
<body><div id="app"></div><script src="${scriptUri}"></script></body></html>`
  }
}
