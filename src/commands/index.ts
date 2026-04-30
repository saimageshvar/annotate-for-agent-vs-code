import * as vscode from 'vscode'
import { AnnotationStore } from '../store/AnnotationStore'
import { EditorPanel } from '../views/EditorPanel'
import { createAnnotationCommand } from './createAnnotation'
import { openAnnotationCommand } from './openAnnotation'
import { deleteAnnotationHandler } from './deleteAnnotation'
import { resolveAnnotationHandler } from './resolveAnnotation'
import { copyHandler } from './copySelected'
import { exportHandler } from './exportSelected'
import { saveAnnotationHandler } from './editAnnotation'
import { quickCaptureCommand, escalateActiveQuickCapture } from './quickCapture'

export function registerCommands(
  context: vscode.ExtensionContext,
  store: AnnotationStore,
  editorPanel: EditorPanel,
) {
  const create = createAnnotationCommand(store, editorPanel)
  const quickCapture = quickCaptureCommand(store, editorPanel)
  const open = openAnnotationCommand(store, editorPanel)
  const del = deleteAnnotationHandler(store)
  const resolve = resolveAnnotationHandler(store)
  const copy = copyHandler(store)
  const doExport = exportHandler(store)
  const save = saveAnnotationHandler(store)

  context.subscriptions.push(
    vscode.commands.registerCommand('annotateForAgent.createAnnotation', create),
    vscode.commands.registerCommand('annotateForAgent.quickCapture', quickCapture),
    vscode.commands.registerCommand('annotateForAgent.quickCaptureEscalate', () => escalateActiveQuickCapture()),
    vscode.commands.registerCommand('annotateForAgent.openAnnotation', open),
    vscode.commands.registerCommand('annotateForAgent.deleteAnnotation', del),
    vscode.commands.registerCommand('annotateForAgent.resolveAnnotation', resolve),
    vscode.commands.registerCommand('annotateForAgent.copy', copy),
    vscode.commands.registerCommand('annotateForAgent.export', doExport),
    vscode.commands.registerCommand('annotateForAgent.annotate', async (ctx?: any) => {
      const mode = vscode.workspace.getConfiguration('annotateForAgent').get<string>('defaultMode') ?? 'panel'
      if (mode === 'quick') return quickCapture()
      return create(ctx)
    }),
  )
  return { create, open, del, resolve, copy, doExport, save }
}
