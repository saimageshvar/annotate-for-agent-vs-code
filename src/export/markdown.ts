import { Annotation } from '../store/types'
import { CATEGORIES, CATEGORY_META } from '../store/categoryMeta'

export interface MarkdownOptions {
  workspace: string
  includeCodeHunk: boolean
  includeCategoryLegend: boolean
  now: Date
}

function formatTimestamp(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
         `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

function countByStatus(annotations: Annotation[]): string {
  const counts: Record<string, number> = { open: 0, stale: 0, resolved: 0 }
  for (const a of annotations) counts[a.status]++
  return `${counts.open} open · ${counts.stale} stale`
}

function legendBlock(): string {
  const rows = CATEGORIES.map(c => `| ${c} | ${CATEGORY_META[c].agentHint} |`).join('\n')
  return [
    '## Category legend (dev\'s intent)',
    '| Category | Meaning |',
    '|----------|---------|',
    rows,
    '',
  ].join('\n')
}

function renderContext(a: Annotation, includeCodeHunk: boolean): string {
  if (!includeCodeHunk) return ''
  if (a.context.kind === 'file') {
    return '\n```\n' + a.context.snippet + '\n```\n'
  }
  const before = a.context.before.split('\n').map(l => `- ${l}`).join('\n')
  const after = a.context.after.split('\n').map(l => `+ ${l}`).join('\n')
  return '\n```diff\n' + a.context.hunkHeader + '\n' + before + '\n' + after + '\n```\n'
}

export function renderMarkdown(annotations: Annotation[], opts: MarkdownOptions): string {
  const parts: string[] = []
  parts.push('# Annotations for Agent\n')
  parts.push(`_Exported ${formatTimestamp(opts.now)} from \`${opts.workspace}\` · ${countByStatus(annotations)}_\n`)
  if (opts.includeCategoryLegend) {
    parts.push(legendBlock())
  }
  parts.push('---\n')
  annotations.forEach((a, i) => {
    parts.push(`## ${i + 1}. [${a.category}] \`${a.filePath}:${a.range.startLine}-${a.range.endLine}\`\n`)
    parts.push(`**Comment:** ${a.comment}\n`)
    parts.push(renderContext(a, opts.includeCodeHunk))
  })
  return parts.join('\n')
}
