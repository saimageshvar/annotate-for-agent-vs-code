import { strict as assert } from 'node:assert'
import { buildFilename } from '../../src/export/filename'

describe('buildFilename', () => {
  it('md format: slug-YYYYMMDD-HHMMSS.md', () => {
    const d = new Date('2026-04-23T14:23:05.000Z')
    const name = buildFilename('markdown', d, () => 'swift-otter')
    assert.equal(name, 'swift-otter-20260423-142305.md')
  })

  it('json format → .json extension', () => {
    const d = new Date('2026-04-23T14:23:05.000Z')
    assert.equal(buildFilename('json', d, () => 'swift-otter'), 'swift-otter-20260423-142305.json')
  })

  it('csv format → .csv extension', () => {
    const d = new Date('2026-04-23T14:23:05.000Z')
    assert.equal(buildFilename('csv', d, () => 'swift-otter'), 'swift-otter-20260423-142305.csv')
  })

  it('zero-pads single-digit month/day/hour/min/sec', () => {
    const d = new Date('2026-01-02T03:04:05.000Z')
    assert.equal(buildFilename('markdown', d, () => 'a-b'), 'a-b-20260102-030405.md')
  })
})
