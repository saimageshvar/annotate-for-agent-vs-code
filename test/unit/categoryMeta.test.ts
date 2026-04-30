import { strict as assert } from 'node:assert'
import { CATEGORY_META, CATEGORIES } from '../../src/store/categoryMeta'

describe('CATEGORY_META', () => {
  it('has entries for all 6 categories', () => {
    assert.deepEqual(CATEGORIES, ['Bug', 'Refactor', 'Nit', 'Question', 'Praise', 'Suggestion'])
  })

  it('each entry has userHint, agentHint, color, priority', () => {
    for (const cat of CATEGORIES) {
      const meta = CATEGORY_META[cat]
      assert.equal(typeof meta.userHint, 'string')
      assert.equal(typeof meta.agentHint, 'string')
      assert.match(meta.color, /^#[0-9a-f]{6}$/i)
      assert.equal(typeof meta.priority, 'number')
    }
  })

  it('agentHint never contains imperatives like "must" or "fix"', () => {
    for (const cat of CATEGORIES) {
      const a = CATEGORY_META[cat].agentHint.toLowerCase()
      assert.ok(!a.includes(' must '), `agentHint for ${cat} contains "must": ${a}`)
      assert.ok(!/\bfix\b/.test(a), `agentHint for ${cat} contains "fix": ${a}`)
    }
  })

  it('priorities are unique', () => {
    const ps = CATEGORIES.map(c => CATEGORY_META[c].priority)
    assert.equal(new Set(ps).size, ps.length)
  })
})
