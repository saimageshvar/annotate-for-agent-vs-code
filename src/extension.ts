import * as vscode from 'vscode'
import { AnnotationStore } from './store/AnnotationStore'
import { ListViewProvider } from './views/ListViewProvider'
import { EditorPanel } from './views/EditorPanel'
import { DecorationManager } from './editor/DecorationManager'
import { StaleTracker } from './editor/StaleTracker'
import { registerCommands } from './commands'

export async function activate(context: vscode.ExtensionContext) {
  const store = new AnnotationStore(context.workspaceState as any)
  await store.init()

  let handlers: any

  const editorPanel = new EditorPanel(context.extensionUri, {
    onSave: async (payload, mode) => {
      const saved = await handlers.save(payload, mode)
      if (saved) editorPanel.showView(saved)
    },
    onCancel: () => { /* panel closes itself */ },
    onResolve: async (id) => {
      await handlers.resolve(id)
      const updated = store.get(id)
      if (updated) editorPanel.showView(updated)
    },
    onDelete: async (id) => {
      await handlers.del(id)
      if (!store.get(id)) {
        editorPanel.close()
      }
    },
    onCopy: async (id) => { await vscode.commands.executeCommand('annotateForAgent.copy', [id]) },
    onExport: async (id) => { await vscode.commands.executeCommand('annotateForAgent.export', [id]) },
  }, store)

  const decorations = new DecorationManager(context)
  const staleTracker = new StaleTracker(store)

  const refreshDecorations = () => {
    const showResolved = vscode.workspace.getConfiguration('annotateForAgent').get<boolean>('showResolved') ?? false
    for (const ed of vscode.window.visibleTextEditors) {
      decorations.refresh(ed, store.list(), showResolved)
    }
  }
  store.onDidChange(refreshDecorations)
  vscode.window.onDidChangeActiveTextEditor(() => {
    refreshDecorations()
    listView.postState()
  })
  context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(refreshDecorations))

  const listView = new ListViewProvider(context.extensionUri, store, {
    open: (id) => vscode.commands.executeCommand('annotateForAgent.openAnnotation', id),
    copy: (ids) => vscode.commands.executeCommand('annotateForAgent.copy', ids),
    export: (ids) => vscode.commands.executeCommand('annotateForAgent.export', ids),
    bulkResolve: async (ids, action) => {
      const targetStatus = action === 'reopen' ? 'open' : 'resolved'
      for (const id of ids) {
        const a = store.get(id)
        if (a && a.status !== targetStatus) await store.update(id, { status: targetStatus })
      }
    },
    bulkDelete: async (ids) => {
      const ok = await vscode.window.showWarningMessage(
        `Delete ${ids.length} annotation(s)?`, { modal: true }, 'Delete'
      )
      if (ok !== 'Delete') return
      for (const id of ids) await store.remove(id)
    },
  })

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ListViewProvider.viewType, listView),
    { dispose: () => decorations.dispose() },
    { dispose: () => staleTracker.dispose() },
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('annotateForAgent')) {
        listView.postState()
        // also refresh decorations in case showResolved changed
        const showResolved = vscode.workspace.getConfiguration('annotateForAgent').get<boolean>('showResolved') ?? false
        for (const ed of vscode.window.visibleTextEditors) {
          decorations.refresh(ed, store.list(), showResolved)
        }
      }
    }),
  )

  handlers = registerCommands(context, store, editorPanel as any)

  refreshDecorations()
  void showFirstRunWelcome(context)
  return { store }
}

const FIRST_RUN_KEY = 'annotateForAgent.firstRunShown.v1'

async function showFirstRunWelcome(context: vscode.ExtensionContext): Promise<void> {
  if (context.globalState.get<boolean>(FIRST_RUN_KEY)) return
  await context.globalState.update(FIRST_RUN_KEY, true)
  const open = 'Open walkthrough'
  const dismiss = 'Dismiss'
  const choice = await vscode.window.showInformationMessage(
    'Annotate for Agent installed. Press Ctrl/Cmd+Shift+A to annotate code, or Ctrl/Cmd+Shift+Q for Quick mode.',
    open,
    dismiss,
  )
  if (choice === open) {
    void vscode.commands.executeCommand(
      'workbench.action.openWalkthrough',
      'creative-chaos.annotate-for-agent#getStarted',
      false,
    )
  }
}

export function deactivate(): void {}
