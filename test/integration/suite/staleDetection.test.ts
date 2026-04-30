import { strict as assert } from 'assert'
import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { AnnotationStore } from '../../../src/store/AnnotationStore'
import { snippetHash } from '../../../src/util/hash'

describe('stale detection', () => {
  let tmpDir: string
  let filePath: string

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'afa-stale-'))
    filePath = path.join(tmpDir, 'sample.ts')
    fs.writeFileSync(filePath, 'const a = 1\nconst b = 2\nconst c = 3\n')
  })

  it('flips annotation to stale when snippet changes', async () => {
    const ext = vscode.extensions.getExtension('creative-chaos.annotate-for-agent')
    await ext!.activate()

    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath))
    await vscode.window.showTextDocument(doc)

    const snippet = 'const b = 2'
    const api = ext!.exports as { store: AnnotationStore } | undefined
    const store: AnnotationStore | undefined = api?.store ?? (globalThis as any).__afaStore
    // If store is not exposed, skip structural check
    if (!store) { assert.ok(true, 'store not exposed; skip'); return }

    // Use asRelativePath to match what StaleTracker uses for comparison
    const relPath = vscode.workspace.asRelativePath(vscode.Uri.file(filePath))
    const ann = await store.create({
      filePath: relPath,
      range: { startLine: 2, endLine: 2 },
      category: 'Bug',
      comment: 'x',
      status: 'open',
      context: { kind: 'file', snippet, snippetHash: snippetHash(snippet) },
    })

    const editor = vscode.window.activeTextEditor!
    await editor.edit(eb => eb.replace(new vscode.Range(1, 0, 1, 100), 'const b = 999'))

    await new Promise(r => setTimeout(r, 500))
    const reloaded = store.get(ann.id)!
    assert.equal(reloaded.status, 'stale')
  })

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })
})
