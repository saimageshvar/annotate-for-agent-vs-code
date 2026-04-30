import { Annotation } from '../store/types'
import { CATEGORIES, CATEGORY_META } from '../store/categoryMeta'

export interface JsonOptions {
  workspace: string
  includeCodeHunk: boolean
  includeCategoryLegend: boolean
  now: Date
}

export function renderJson(annotations: Annotation[], opts: JsonOptions): string {
  const counts = { open: 0, stale: 0, resolved: 0 }
  for (const a of annotations) counts[a.status]++

  const legend = opts.includeCategoryLegend
    ? Object.fromEntries(CATEGORIES.map(c => [c, CATEGORY_META[c].agentHint]))
    : undefined

  const items = annotations.map(a => {
    const base: any = {
      id: a.id,
      path: a.filePath,
      range: a.range,
      category: a.category,
      status: a.status,
      comment: a.comment,
    }
    if (opts.includeCodeHunk) {
      base.context = a.context
    }
    return base
  })

  const payload: any = {
    exportedAt: opts.now.toISOString(),
    workspace: opts.workspace,
    counts,
    annotations: items,
  }
  if (legend) payload.categoryLegend = legend

  return JSON.stringify(payload, null, 2)
}
