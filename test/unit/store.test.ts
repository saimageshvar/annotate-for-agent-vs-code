import { strict as assert } from 'node:assert'
import { AnnotationStore, Memento } from '../../src/store/AnnotationStore'
import { Annotation } from '../../src/store/types'

class InMemoryMemento implements Memento {
  private data = new Map<string, unknown>()
  get<T>(key: string): T | undefined { return this.data.get(key) as T | undefined }
  async update(key: string, value: unknown): Promise<void> { this.data.set(key, value) }
}

const sampleAnn: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'> = {
  filePath: 'src/a.ts',
  range: { startLine: 1, endLine: 2 },
  category: 'Bug',
  comment: 'c',
  status: 'open',
  context: { kind: 'file', snippet: 's', snippetHash: 'h' },
}

describe('AnnotationStore', () => {
  it('create assigns uuid, createdAt, updatedAt', async () => {
    const store = new AnnotationStore(new InMemoryMemento())
    await store.init()
    const a = await store.create(sampleAnn)
    assert.match(a.id, /^[0-9a-f-]{36}$/)
    assert.ok(a.createdAt > 0)
    assert.equal(a.updatedAt, a.createdAt)
  })

  it('list returns all created', async () => {
    const store = new AnnotationStore(new InMemoryMemento())
    await store.init()
    await store.create(sampleAnn)
    await store.create({ ...sampleAnn, comment: 'different comment' })
    assert.equal(store.list().length, 2)
  })

  it('deduplicates identical annotations created within 2s', async () => {
    const store = new AnnotationStore(new InMemoryMemento())
    await store.init()
    const a1 = await store.create(sampleAnn)
    const a2 = await store.create(sampleAnn)
    assert.equal(a1.id, a2.id)
    assert.equal(store.list().length, 1)
  })

  it('update modifies and bumps updatedAt', async () => {
    const store = new AnnotationStore(new InMemoryMemento())
    await store.init()
    const a = await store.create(sampleAnn)
    await new Promise(r => setTimeout(r, 5))
    const u = await store.update(a.id, { comment: 'new' })
    assert.equal(u!.comment, 'new')
    assert.ok(u!.updatedAt > a.updatedAt)
  })

  it('remove deletes by id', async () => {
    const store = new AnnotationStore(new InMemoryMemento())
    await store.init()
    const a = await store.create(sampleAnn)
    await store.remove(a.id)
    assert.equal(store.list().length, 0)
  })

  it('persists to memento (survives new instance)', async () => {
    const mem = new InMemoryMemento()
    const s1 = new AnnotationStore(mem)
    await s1.init()
    await s1.create(sampleAnn)
    await s1.flush()

    const s2 = new AnnotationStore(mem)
    await s2.init()
    assert.equal(s2.list().length, 1)
  })

  it('fires onDidChange on mutate', async () => {
    const store = new AnnotationStore(new InMemoryMemento())
    await store.init()
    let count = 0
    store.onDidChange(() => count++)
    await store.create(sampleAnn)
    assert.equal(count, 1)
  })
})
