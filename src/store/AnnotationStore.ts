import { v4 as uuidv4 } from 'uuid'
import { Annotation } from './types'

export interface Memento {
  get<T>(key: string): T | undefined
  update(key: string, value: unknown): Promise<void>
}

type Listener = (annotations: Annotation[]) => void
const KEY = 'annotateForAgent.annotations'

export class AnnotationStore {
  private annotations = new Map<string, Annotation>()
  private listeners = new Set<Listener>()
  private persistTimer: NodeJS.Timeout | undefined

  constructor(private memento: Memento) {}

  async init(): Promise<void> {
    const saved = this.memento.get<Annotation[]>(KEY) ?? []
    // Sort ascending so Map.set keeps the earliest when duplicates are found
    saved.sort((a, b) => a.createdAt - b.createdAt)
    const seen = new Map<string, string>() // fingerprint -> kept id
    let dedupedCount = 0
    for (const a of saved) {
      const fp = `${a.filePath}|${a.range.startLine}-${a.range.endLine}|${a.category}|${a.comment}`
      if (seen.has(fp)) {
        dedupedCount++
        continue
      }
      seen.set(fp, a.id)
      this.annotations.set(a.id, a)
    }
    if (dedupedCount > 0) {
      await this.memento.update(KEY, this.list())
      console.log(`[annotate-for-agent] init dedup removed ${dedupedCount} duplicate annotation(s)`)
    }
  }

  list(): Annotation[] {
    return Array.from(this.annotations.values())
  }

  get(id: string): Annotation | undefined {
    return this.annotations.get(id)
  }

  async create(partial: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Annotation> {
    const now = Date.now()
    // Dedup: if an identical annotation was created in the last 2s, return it
    for (const existing of this.annotations.values()) {
      if (
        existing.filePath === partial.filePath &&
        existing.range.startLine === partial.range.startLine &&
        existing.range.endLine === partial.range.endLine &&
        existing.category === partial.category &&
        existing.comment === partial.comment &&
        now - existing.createdAt < 2000
      ) {
        return existing
      }
    }
    const a: Annotation = { ...partial, id: uuidv4(), createdAt: now, updatedAt: now }
    this.annotations.set(a.id, a)
    this.schedulePersist()
    this.emit()
    return a
  }

  async update(id: string, patch: Partial<Annotation>): Promise<Annotation | undefined> {
    const existing = this.annotations.get(id)
    if (!existing) return undefined
    const updated: Annotation = { ...existing, ...patch, id, updatedAt: Date.now() }
    this.annotations.set(id, updated)
    this.schedulePersist()
    this.emit()
    return updated
  }

  async remove(id: string): Promise<void> {
    if (this.annotations.delete(id)) {
      this.schedulePersist()
      this.emit()
    }
  }

  onDidChange(listener: Listener): { dispose: () => void } {
    this.listeners.add(listener)
    return { dispose: () => this.listeners.delete(listener) }
  }

  async flush(): Promise<void> {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer)
      this.persistTimer = undefined
    }
    await this.memento.update(KEY, this.list())
  }

  private schedulePersist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer)
    this.persistTimer = setTimeout(() => {
      void this.memento.update(KEY, this.list())
      this.persistTimer = undefined
    }, 500)
  }

  private emit(): void {
    const snapshot = this.list()
    for (const l of this.listeners) l(snapshot)
  }
}
