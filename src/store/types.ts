export type Category = 'Bug' | 'Refactor' | 'Nit' | 'Question' | 'Praise' | 'Suggestion'
export type Status = 'open' | 'resolved' | 'stale'
export type ExportFormat = 'markdown' | 'json' | 'csv'

export interface FileContext {
  kind: 'file'
  snippet: string
  snippetHash: string
}

export interface DiffContext {
  kind: 'diff'
  before: string
  after: string
  hunkHeader: string
  snippetHash: string
}

export type AnnotationContext = FileContext | DiffContext

export interface Annotation {
  id: string
  filePath: string
  range: { startLine: number; endLine: number }
  category: Category
  comment: string
  status: Status
  context: AnnotationContext
  createdAt: number
  updatedAt: number
  exportedAt?: number
}

export interface CategoryMeta {
  userHint: string
  agentHint: string
  color: string
  priority: number
}
