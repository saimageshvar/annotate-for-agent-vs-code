import { strict as assert } from 'node:assert'
import { renderMarkdown } from '../../src/export/markdown'
import { Annotation } from '../../src/store/types'

const baseAnn: Annotation = {
  id: 'a1',
  filePath: 'src/auth.ts',
  range: { startLine: 42, endLine: 45 },
  category: 'Bug',
  comment: 'Null-check user before toJSON.',
  status: 'open',
  context: { kind: 'file', snippet: 'return user', snippetHash: 'abc' },
  createdAt: 0,
  updatedAt: 0,
}

const fixedDate = new Date('2026-04-23T14:23:05Z')

describe('renderMarkdown', () => {
  it('includes title and workspace line', () => {
    const out = renderMarkdown([baseAnn], { workspace: 'demo', includeCodeHunk: true, includeCategoryLegend: true, now: fixedDate })
    assert.match(out, /# Annotations for Agent/)
    assert.match(out, /from `demo`/)
  })

  it('includes category legend when includeCategoryLegend=true', () => {
    const out = renderMarkdown([baseAnn], { workspace: 'demo', includeCodeHunk: true, includeCategoryLegend: true, now: fixedDate })
    assert.match(out, /## Category legend/)
    assert.match(out, /Bug \| Dev flagged a defect\./)
  })

  it('excludes category legend when flag false', () => {
    const out = renderMarkdown([baseAnn], { workspace: 'demo', includeCodeHunk: true, includeCategoryLegend: false, now: fixedDate })
    assert.ok(!out.includes('Category legend'))
  })

  it('renders file-kind snippet in code fence when includeCodeHunk=true', () => {
    const out = renderMarkdown([baseAnn], { workspace: 'demo', includeCodeHunk: true, includeCategoryLegend: false, now: fixedDate })
    assert.match(out, /```\nreturn user\n```/)
  })

  it('skips code fence when includeCodeHunk=false', () => {
    const out = renderMarkdown([baseAnn], { workspace: 'demo', includeCodeHunk: false, includeCategoryLegend: false, now: fixedDate })
    assert.ok(!out.includes('return user'))
  })

  it('renders diff-kind context as diff fence with header/before/after', () => {
    const diffAnn: Annotation = {
      ...baseAnn,
      id: 'a2',
      context: { kind: 'diff', before: 'return user', after: 'return user.toJSON()', hunkHeader: '@@ -42,4 +42,4 @@', snippetHash: 'x' },
    }
    const out = renderMarkdown([diffAnn], { workspace: 'demo', includeCodeHunk: true, includeCategoryLegend: false, now: fixedDate })
    assert.match(out, /```diff\n@@ -42,4 \+42,4 @@\n- return user\n\+ return user\.toJSON\(\)\n```/)
  })

  it('never emits userHint text', () => {
    const out = renderMarkdown([baseAnn], { workspace: 'demo', includeCodeHunk: true, includeCategoryLegend: true, now: fixedDate })
    assert.ok(!out.includes('Something is not working as intended'))
  })

  it('heading includes category tag, path, line range', () => {
    const out = renderMarkdown([baseAnn], { workspace: 'demo', includeCodeHunk: false, includeCategoryLegend: false, now: fixedDate })
    assert.match(out, /## 1\. \[Bug\] `src\/auth\.ts:42-45`/)
  })
})
