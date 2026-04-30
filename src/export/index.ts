import { Annotation, ExportFormat } from '../store/types'
import { renderMarkdown } from './markdown'
import { renderJson } from './json'
import { renderCsv } from './csv'

export interface ExportOptions {
  format: ExportFormat
  workspace: string
  includeCodeHunk: boolean
  includeCategoryLegend: boolean
  now: Date
}

export function renderExport(annotations: Annotation[], opts: ExportOptions): string {
  switch (opts.format) {
    case 'markdown': return renderMarkdown(annotations, opts)
    case 'json': return renderJson(annotations, opts)
    case 'csv': return renderCsv(annotations, { includeCodeHunk: opts.includeCodeHunk, includeCategoryLegend: opts.includeCategoryLegend })
  }
}

export { buildFilename } from './filename'
