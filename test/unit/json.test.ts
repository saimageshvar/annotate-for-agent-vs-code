import { strict as assert } from 'node:assert'
import { renderJson } from '../../src/export/json'
import { Annotation } from '../../src/store/types'

const ann: Annotation = {
  id: 'a1',
  filePath: 'src/auth.ts',
  range: { startLine: 42, endLine: 45 },
  category: 'Bug',
  comment: 'fix me',
  status: 'open',
  context: { kind: 'file', snippet: 'x', snippetHash: 'h' },
  createdAt: 0,
  updatedAt: 0,
}

describe('renderJson', () => {
  it('parses as valid JSON', () => {
    const out = renderJson([ann], { workspace: 'w', includeCodeHunk: true, includeCategoryLegend: true, now: new Date() })
    assert.doesNotThrow(() => JSON.parse(out))
  })

  it('includes counts, categoryLegend, annotations', () => {
    const out = renderJson([ann], { workspace: 'w', includeCodeHunk: true, includeCategoryLegend: true, now: new Date('2026-04-23T14:23:05Z') })
    const obj = JSON.parse(out)
    assert.equal(obj.workspace, 'w')
    assert.deepEqual(obj.counts, { open: 1, stale: 0, resolved: 0 })
    assert.equal(obj.categoryLegend.Bug, 'Dev flagged a defect.')
    assert.equal(obj.annotations.length, 1)
    assert.equal(obj.exportedAt, '2026-04-23T14:23:05.000Z')
  })

  it('omits categoryLegend when flag false', () => {
    const out = renderJson([ann], { workspace: 'w', includeCodeHunk: true, includeCategoryLegend: false, now: new Date() })
    const obj = JSON.parse(out)
    assert.equal(obj.categoryLegend, undefined)
  })

  it('omits context when includeCodeHunk=false', () => {
    const out = renderJson([ann], { workspace: 'w', includeCodeHunk: false, includeCategoryLegend: false, now: new Date() })
    const obj = JSON.parse(out)
    assert.equal(obj.annotations[0].context, undefined)
  })

  it('never emits userHint strings', () => {
    const out = renderJson([ann], { workspace: 'w', includeCodeHunk: true, includeCategoryLegend: true, now: new Date() })
    assert.ok(!out.includes('Something is not working as intended'))
  })
})
