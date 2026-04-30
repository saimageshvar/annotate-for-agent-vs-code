import * as vscode from 'vscode'
import { DiffContext } from '../store/types'
import { snippetHash } from '../util/hash'

interface GitExtensionAPI {
  repositories: Array<{
    rootUri: vscode.Uri
    diffWithHEAD(path?: string): Promise<string>
  }>
}

interface GitExtension {
  getAPI(version: 1): GitExtensionAPI
}

async function getGitApi(): Promise<GitExtensionAPI | undefined> {
  const ext = vscode.extensions.getExtension<GitExtension>('vscode.git')
  if (!ext) return undefined
  if (!ext.isActive) await ext.activate()
  return ext.exports.getAPI(1)
}

function findRepo(api: GitExtensionAPI, fileUri: vscode.Uri): GitExtensionAPI['repositories'][0] | undefined {
  return api.repositories.find(r => fileUri.fsPath.startsWith(r.rootUri.fsPath))
}

export async function captureDiffContext(
  fileUri: vscode.Uri,
  startLine: number,
  endLine: number,
): Promise<DiffContext | undefined> {
  const api = await getGitApi()
  if (!api) return undefined
  const repo = findRepo(api, fileUri)
  if (!repo) return undefined

  const relPath = vscode.workspace.asRelativePath(fileUri)
  const diff = await repo.diffWithHEAD(relPath)
  if (!diff) return undefined

  const hunkRe = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@.*$/gm
  let match: RegExpExecArray | null
  const hunks: Array<{ header: string; newStart: number; newEnd: number; index: number }> = []
  while ((match = hunkRe.exec(diff))) {
    const newStart = parseInt(match[3], 10)
    const newCount = match[4] ? parseInt(match[4], 10) : 1
    hunks.push({ header: match[0], newStart, newEnd: newStart + newCount - 1, index: match.index })
  }

  const overlapping = hunks.filter(h => !(endLine < h.newStart || startLine > h.newEnd))
  if (overlapping.length === 0) return undefined

  const before: string[] = []
  const after: string[] = []
  const first = overlapping[0]
  const last = overlapping[overlapping.length - 1]
  const startIdx = first.index
  const nextHunk = hunks.find(h => h.index > last.index)
  const endIdx = nextHunk ? nextHunk.index : diff.length
  const body = diff.slice(startIdx, endIdx).split('\n').slice(1)

  for (const line of body) {
    if (line.startsWith('-')) before.push(line.slice(1))
    else if (line.startsWith('+')) after.push(line.slice(1))
    else if (line.startsWith(' ')) { before.push(line.slice(1)); after.push(line.slice(1)) }
  }

  const beforeText = before.join('\n')
  const afterText = after.join('\n')
  return {
    kind: 'diff',
    before: beforeText,
    after: afterText,
    hunkHeader: first.header,
    snippetHash: snippetHash(afterText),
  }
}
