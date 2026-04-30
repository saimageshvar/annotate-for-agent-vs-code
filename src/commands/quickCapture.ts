import * as vscode from 'vscode'
import { AnnotationStore } from '../store/AnnotationStore'
import { EditorPanel } from '../views/EditorPanel'
import { Category } from '../store/types'
import { CATEGORIES, CATEGORY_META, DEFAULT_CATEGORY } from '../store/categoryMeta'
import { captureDiffContext } from '../editor/diffHunk'
import { snippetHash } from '../util/hash'
import { rangeToLines } from '../util/range'

interface CategoryQuickPickItem extends vscode.QuickPickItem {
  category: Category
}

function buildCategoryItems(preferred: Category): CategoryQuickPickItem[] {
  const ordered = [preferred, ...CATEGORIES.filter(c => c !== preferred)]
  return ordered.map((c, i) => {
    const meta = CATEGORY_META[c]
    return {
      label: `${i + 1}  ●  ${c}`,
      description: meta.userHint,
      category: c,
    }
  })
}

async function pickCategory(preferred: Category, lineLabel: string, filePath: string): Promise<Category | undefined> {
  return new Promise(resolve => {
    const qp = vscode.window.createQuickPick<CategoryQuickPickItem>()
    qp.title = `Quick annotate · ${filePath}:${lineLabel}`
    qp.placeholder = 'Pick category — type 1–6 to select instantly · Esc to cancel'
    qp.items = buildCategoryItems(preferred)
    qp.matchOnDescription = true
    qp.onDidChangeValue(val => {
      if (/^[1-6]$/.test(val)) {
        const idx = parseInt(val, 10) - 1
        if (idx < qp.items.length) {
          const chosen = qp.items[idx].category
          qp.hide()
          resolve(chosen)
        }
      }
    })
    qp.onDidAccept(() => {
      const sel = qp.activeItems[0]
      qp.hide()
      resolve(sel?.category)
    })
    qp.onDidHide(() => {
      qp.dispose()
      resolve(undefined)
    })
    qp.show()
  })
}

export function quickCaptureCommand(store: AnnotationStore, editorPanel: EditorPanel) {
  return async () => {
    const active = vscode.window.activeTextEditor
    if (!active) {
      vscode.window.showWarningMessage('Open a file first to quick-capture.')
      return
    }
    const uri = active.document.uri
    if (uri.scheme === 'untitled') {
      vscode.window.showWarningMessage('Save the file first to quick-capture.')
      return
    }
    const range = active.selection
    const filePath = vscode.workspace.asRelativePath(uri)
    const lines = rangeToLines(range)
    const doc = active.document
    const snippet = doc.getText(new vscode.Range(lines.startLine - 1, 0, lines.endLine - 1, Number.MAX_SAFE_INTEGER))

    let context: any
    if (uri.scheme === 'git') {
      const diff = await captureDiffContext(uri, lines.startLine, lines.endLine)
      context = diff ?? { kind: 'file', snippet, snippetHash: snippetHash(snippet) }
    } else {
      context = { kind: 'file', snippet, snippetHash: snippetHash(snippet) }
    }

    const cfg = vscode.workspace.getConfiguration('annotateForAgent')
    const preferred = (cfg.get<Category>('quickCapture.defaultCategory') ?? DEFAULT_CATEGORY)
    const lineLabel = lines.endLine !== lines.startLine ? `${lines.startLine}-${lines.endLine}` : `${lines.startLine}`

    const category = await pickCategory(preferred, lineLabel, filePath)
    if (!category) return

    const result = await promptComment(category, filePath, lineLabel)
    if (result.kind === 'cancel') return

    if (result.kind === 'escalate') {
      editorPanel.showCreate({ filePath, range: lines, context, initialComment: result.value, category })
      return
    }

    const trimmed = result.value.trim()
    if (!trimmed) {
      vscode.window.showWarningMessage('Empty comment, annotation not saved.')
      return
    }

    await store.create({
      filePath,
      range: lines,
      category,
      comment: trimmed,
      status: 'open',
      context,
    })

    vscode.window.showInformationMessage(`✓ ${category} annotation added.`)
  }
}

type CommentPromptResult =
  | { kind: 'cancel' }
  | { kind: 'submit'; value: string }
  | { kind: 'escalate'; value: string }

interface ActivePrompt {
  ib: vscode.InputBox
  settled: { v: boolean }
  resolve: (r: CommentPromptResult) => void
}
let activePrompt: ActivePrompt | null = null

export function escalateActiveQuickCapture(): void {
  if (!activePrompt) return
  if (activePrompt.settled.v) return
  activePrompt.settled.v = true
  const value = activePrompt.ib.value
  const resolve = activePrompt.resolve
  activePrompt.ib.hide()
  resolve({ kind: 'escalate', value })
}

function promptComment(category: Category, filePath: string, lineLabel: string): Promise<CommentPromptResult> {
  return new Promise(resolve => {
    const ib = vscode.window.createInputBox()
    ib.title = `${category} · ${filePath}:${lineLabel}`
    ib.prompt = 'Ctrl/⌘+Enter to expand multi-line'
    ib.placeholder = 'Off-by-one in loop bound'
    ib.ignoreFocusOut = false
    const expandBtn: vscode.QuickInputButton = {
      iconPath: new vscode.ThemeIcon('layout-panel'),
      tooltip: 'Open multi-line editor (Ctrl/⌘+Enter)',
    }
    ib.buttons = [expandBtn]
    const settled = { v: false }
    activePrompt = { ib, settled, resolve }
    void vscode.commands.executeCommand('setContext', 'annotateForAgent.quickCaptureActive', true)
    ib.onDidChangeValue(val => {
      ib.validationMessage = val.length > 1000 ? 'Comment too long (max 1000 chars).' : undefined
    })
    ib.onDidAccept(() => {
      if (settled.v) return
      settled.v = true
      const value = ib.value
      ib.hide()
      resolve({ kind: 'submit', value })
    })
    ib.onDidTriggerButton(btn => {
      if (settled.v) return
      if (btn === expandBtn) {
        settled.v = true
        const value = ib.value
        ib.hide()
        resolve({ kind: 'escalate', value })
      }
    })
    ib.onDidHide(() => {
      ib.dispose()
      activePrompt = null
      void vscode.commands.executeCommand('setContext', 'annotateForAgent.quickCaptureActive', false)
      if (!settled.v) {
        settled.v = true
        resolve({ kind: 'cancel' })
      }
    })
    ib.show()
  })
}
