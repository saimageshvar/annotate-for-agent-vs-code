import { Category, CategoryMeta } from './types'

export const CATEGORIES: Category[] = ['Bug', 'Refactor', 'Nit', 'Question', 'Praise', 'Suggestion']

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Bug: {
    userHint: 'Something is not working as intended.',
    agentHint: "Dev flagged a defect.",
    color: '#c53030',
    priority: 1,
  },
  Question: {
    userHint: 'Asking for clarification, not a change.',
    agentHint: 'Dev is asking, not requesting a change.',
    color: '#805ad5',
    priority: 2,
  },
  Refactor: {
    userHint: 'Code works but structure could improve.',
    agentHint: 'Dev suggests structural change; behavior unchanged.',
    color: '#3182ce',
    priority: 3,
  },
  Suggestion: {
    userHint: 'An alternative to consider.',
    agentHint: 'Dev offers an alternative.',
    color: '#d69e2e',
    priority: 4,
  },
  Nit: {
    userHint: 'Small preference, optional to address.',
    agentHint: 'Dev notes a small preference.',
    color: '#718096',
    priority: 5,
  },
  Praise: {
    userHint: 'Positive note on good work.',
    agentHint: 'Dev is affirming good work.',
    color: '#38a169',
    priority: 6,
  },
}

export const DEFAULT_CATEGORY: Category = 'Suggestion'
