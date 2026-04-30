import { strict as assert } from 'node:assert'
import { generateSlug } from '../../src/util/slug'

describe('generateSlug', () => {
  it('returns adjective-animal format', () => {
    const s = generateSlug()
    assert.match(s, /^[a-z]+-[a-z]+$/)
  })

  it('produces at least 100 unique values across 10k runs (low collision rate)', () => {
    const set = new Set<string>()
    for (let i = 0; i < 10_000; i++) set.add(generateSlug())
    assert.ok(set.size > 100, `only ${set.size} unique slugs — wordlists too small`)
  })
})
