import { strict as assert } from 'node:assert'
import { snippetHash } from '../../src/util/hash'

describe('snippetHash', () => {
  it('returns 40-char hex sha1', () => {
    const h = snippetHash('const x = 1')
    assert.match(h, /^[0-9a-f]{40}$/)
  })

  it('same text → same hash', () => {
    assert.equal(snippetHash('abc'), snippetHash('abc'))
  })

  it('different text → different hash', () => {
    assert.notEqual(snippetHash('abc'), snippetHash('abd'))
  })

  it('ignores leading and trailing whitespace', () => {
    assert.equal(snippetHash('  const x = 1  '), snippetHash('const x = 1'))
  })

  it('ignores line-ending differences (\\r\\n vs \\n)', () => {
    assert.equal(snippetHash('a\r\nb'), snippetHash('a\nb'))
  })
})
