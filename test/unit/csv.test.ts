import { strict as assert } from 'node:assert'
import { renderCsv } from '../../src/export/csv'
import { Annotation } from '../../src/store/types'

const ann: Annotation = {
  id: 'a1',
  filePath: 'src/auth.ts',
  range: { startLine: 42, endLine: 45 },
  category: 'Bug',
  comment: 'fix "null", check it',
  status: 'open',
  context: { kind: 'file', snippet: 'return user', snippetHash: 'h' },
  createdAt: 0,
  updatedAt: 0,
}

describe('renderCsv', () => {
  it('includes legend as leading # rows when flag true', () => {
    const out = renderCsv([ann], { includeCodeHunk: true, includeCategoryLegend: true })
    assert.match(out, /^# Category,Action/m)
    assert.match(out, /^# Bug,Dev flagged a defect\./m)
  })

  it('omits legend rows when flag false', () => {
    const out = renderCsv([ann], { includeCodeHunk: false, includeCategoryLegend: false })
    assert.ok(!out.includes('# Category'))
  })

  it('header row always present', () => {
    const out = renderCsv([ann], { includeCodeHunk: true, includeCategoryLegend: false })
    assert.match(out, /^path,startLine,endLine,category,status,comment,codeHunk$/m)
  })

  it('header omits codeHunk column when includeCodeHunk=false', () => {
    const out = renderCsv([ann], { includeCodeHunk: false, includeCategoryLegend: false })
    assert.match(out, /^path,startLine,endLine,category,status,comment$/m)
  })

  it('escapes double quotes and commas in comment/snippet', () => {
    const out = renderCsv([ann], { includeCodeHunk: true, includeCategoryLegend: false })
    assert.match(out, /"fix ""null"", check it"/)
  })

  it('inlines snippet as escaped string with \\n', () => {
    const multi: Annotation = { ...ann, context: { kind: 'file', snippet: 'a\nb', snippetHash: 'h' } }
    const out = renderCsv([multi], { includeCodeHunk: true, includeCategoryLegend: false })
    assert.match(out, /"a\\nb"/)
  })
})
