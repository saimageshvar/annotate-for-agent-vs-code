import { strict as assert } from 'assert'
import * as vscode from 'vscode'

describe('Activation', () => {
  it('extension activates and registers commands', async () => {
    const ext = vscode.extensions.getExtension('creative-chaos.annotate-for-agent')
    assert.ok(ext, 'extension found')
    await ext!.activate()
    const cmds = await vscode.commands.getCommands(true)
    assert.ok(cmds.includes('annotateForAgent.createAnnotation'))
    assert.ok(cmds.includes('annotateForAgent.openAnnotation'))
    assert.ok(cmds.includes('annotateForAgent.export'))
  })
})
