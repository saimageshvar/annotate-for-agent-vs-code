import { Annotation } from '../store/types'
import { CATEGORIES, CATEGORY_META } from '../store/categoryMeta'

export interface CsvOptions {
  includeCodeHunk: boolean
  includeCategoryLegend: boolean
}

function escape(s: string): string {
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, '\\n')}"`
}

function hunkString(a: Annotation): string {
  if (a.context.kind === 'file') return a.context.snippet
  return `${a.context.hunkHeader}\n- ${a.context.before}\n+ ${a.context.after}`
}

export function renderCsv(annotations: Annotation[], opts: CsvOptions): string {
  const lines: string[] = []
  if (opts.includeCategoryLegend) {
    lines.push('# Category,Action')
    for (const c of CATEGORIES) {
      lines.push(`# ${c},${CATEGORY_META[c].agentHint}`)
    }
  }
  const header = opts.includeCodeHunk
    ? 'path,startLine,endLine,category,status,comment,codeHunk'
    : 'path,startLine,endLine,category,status,comment'
  lines.push(header)
  for (const a of annotations) {
    const row = [
      a.filePath,
      String(a.range.startLine),
      String(a.range.endLine),
      a.category,
      a.status,
      escape(a.comment),
    ]
    if (opts.includeCodeHunk) row.push(escape(hunkString(a)))
    lines.push(row.join(','))
  }
  return lines.join('\n')
}
