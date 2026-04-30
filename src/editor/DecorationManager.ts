import * as vscode from 'vscode'
import { Annotation, Category, Status } from '../store/types'
import { CATEGORY_META } from '../store/categoryMeta'
import { linesToRange } from '../util/range'

function buildHoverMessage(a: Annotation): vscode.MarkdownString {
  const args = encodeURIComponent(JSON.stringify({ id: a.id }))
  const firstLine = (a.comment.split('\n')[0] || '(no comment)').slice(0, 200)
  const meta = CATEGORY_META[a.category]
  const statusLabel = a.status === 'stale' ? '⚠ **stale**' : a.status === 'resolved' ? '✓ resolved' : 'open'
  const md = new vscode.MarkdownString(
    `<span style="color:${meta.color}">**${a.category.toUpperCase()}**</span> · ${statusLabel}\n\n` +
    `${firstLine}\n\n` +
    `[$(edit) Open in pane](command:annotateForAgent.openAnnotation?${args})`
  )
  md.isTrusted = { enabledCommands: ['annotateForAgent.openAnnotation'] }
  md.supportHtml = true
  md.supportThemeIcons = true
  return md
}

function buildMultiHoverMessage(group: Annotation[]): vscode.MarkdownString {
  const parts = group.map((a) => {
    const args = encodeURIComponent(JSON.stringify({ id: a.id }))
    const firstLine = (a.comment.split('\n')[0] || '(no comment)').slice(0, 160)
    const meta = CATEGORY_META[a.category]
    const statusLabel = a.status === 'stale' ? '⚠ stale' : a.status === 'resolved' ? '✓ resolved' : 'open'
    return `<span style="color:${meta.color}">**${a.category.toUpperCase()}**</span> · ${statusLabel}\n\n${firstLine}\n\n[$(edit) Open in pane](command:annotateForAgent.openAnnotation?${args})`
  })
  const md = new vscode.MarkdownString(
    `**${group.length} annotations on this line**\n\n---\n\n` + parts.join('\n\n---\n\n')
  )
  md.isTrusted = { enabledCommands: ['annotateForAgent.openAnnotation'] }
  md.supportHtml = true
  md.supportThemeIcons = true
  return md
}

function svgDataUri(color: string, status: Status): string {
  let svg: string
  if (status === 'stale') {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><path d='M8 2 L14 13 L2 13 Z' fill='${color}' stroke='${color}' stroke-width='1' stroke-linejoin='round'/><rect x='7.25' y='6' width='1.5' height='4' fill='#fff'/><rect x='7.25' y='11' width='1.5' height='1.5' fill='#fff'/></svg>`
  } else if (status === 'resolved') {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><circle cx='8' cy='8' r='5' fill='${color}' opacity='0.6'/><path d='M5.5 8 L7 9.5 L10.5 6.5' fill='none' stroke='#fff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>`
  } else {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><circle cx='8' cy='8' r='5' fill='${color}'/><circle cx='8' cy='8' r='2' fill='#fff'/></svg>`
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export class DecorationManager {
  private rangeTypes = new Map<string, vscode.TextEditorDecorationType>()
  private iconTypes = new Map<string, vscode.TextEditorDecorationType>()

  constructor(private context: vscode.ExtensionContext) {}

  private getRangeType(category: Category, status: Status): vscode.TextEditorDecorationType {
    const key = `${category}:${status}`
    const existing = this.rangeTypes.get(key)
    if (existing) return existing
    const color = CATEGORY_META[category].color
    const opacity = status === 'resolved' ? '0.35' : status === 'stale' ? '0.9' : '1'
    const bgAlpha = status === 'resolved' ? 0.04 : status === 'stale' ? 0.08 : 0.06
    const borderStyle = status === 'resolved' ? 'dotted' : 'solid'
    const type = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      borderWidth: '0 0 0 3px',
      borderStyle,
      borderColor: color,
      backgroundColor: `${color}${Math.floor(bgAlpha * 255).toString(16).padStart(2, '0')}`,
      overviewRulerColor: color,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      opacity,
    })
    this.rangeTypes.set(key, type)
    return type
  }

  private getIconType(category: Category, status: Status): vscode.TextEditorDecorationType {
    const key = `${category}:${status}`
    const existing = this.iconTypes.get(key)
    if (existing) return existing
    const color = CATEGORY_META[category].color
    const iconUri = vscode.Uri.parse(svgDataUri(color, status))
    const type = vscode.window.createTextEditorDecorationType({
      gutterIconPath: iconUri,
      gutterIconSize: 'contain',
    })
    this.iconTypes.set(key, type)
    return type
  }

  refresh(editor: vscode.TextEditor, annotations: Annotation[], showResolved: boolean): void {
    const rangeBuckets = new Map<string, vscode.DecorationOptions[]>()
    const iconBuckets = new Map<string, vscode.DecorationOptions[]>()
    const relPath = vscode.workspace.asRelativePath(editor.document.uri)

    // Collect relevant annotations for this file
    const rel: Annotation[] = []
    for (const a of annotations) {
      if (a.filePath !== relPath && a.filePath !== editor.document.uri.fsPath) continue
      if (a.status === 'resolved' && !showResolved) continue
      rel.push(a)
    }

    // Content dedup — collapse identical annotations by fingerprint
    const byFingerprint = new Map<string, Annotation>()
    for (const a of rel) {
      const fp = `${a.filePath}|${a.range.startLine}-${a.range.endLine}|${a.category}|${a.comment}`
      const existing = byFingerprint.get(fp)
      if (!existing || a.createdAt < existing.createdAt) {
        byFingerprint.set(fp, a)
      }
    }
    const dedupedRel = Array.from(byFingerprint.values())

    // Range decorations: one per annotation (line-range coloring)
    for (const a of dedupedRel) {
      const range = linesToRange(a.range)
      const hoverMessage = buildHoverMessage(a)
      const key = `${a.category}:${a.status}`
      if (!rangeBuckets.has(key)) rangeBuckets.set(key, [])
      rangeBuckets.get(key)!.push({ range, hoverMessage })
      this.getRangeType(a.category, a.status)
    }

    // Icon decorations: dedupe by start line. Pick representative annotation.
    const byStartLine = new Map<number, Annotation[]>()
    for (const a of dedupedRel) {
      const startLine = Math.max(0, a.range.startLine - 1)
      if (!byStartLine.has(startLine)) byStartLine.set(startLine, [])
      byStartLine.get(startLine)!.push(a)
    }
    for (const [startLine, group] of byStartLine) {
      // Representative = highest priority (stale > open > resolved), then lowest category priority number
      const rep = group.slice().sort((a, b) => {
        const sp: Record<Status, number> = { stale: 0, open: 1, resolved: 2 }
        const sa = sp[a.status], sb = sp[b.status]
        if (sa !== sb) return sa - sb
        const pa = CATEGORY_META[a.category].priority
        const pb = CATEGORY_META[b.category].priority
        return pa - pb
      })[0]
      const key = `${rep.category}:${rep.status}`
      if (!iconBuckets.has(key)) iconBuckets.set(key, [])
      iconBuckets.get(key)!.push({ range: new vscode.Range(startLine, 0, startLine, 0) })
      this.getIconType(rep.category, rep.status)
    }

    // Apply all
    for (const [key, type] of this.rangeTypes) {
      editor.setDecorations(type, rangeBuckets.get(key) ?? [])
    }
    for (const [key, type] of this.iconTypes) {
      editor.setDecorations(type, iconBuckets.get(key) ?? [])
    }
  }

  dispose(): void {
    for (const t of this.rangeTypes.values()) t.dispose()
    for (const t of this.iconTypes.values()) t.dispose()
    this.rangeTypes.clear()
    this.iconTypes.clear()
  }
}
