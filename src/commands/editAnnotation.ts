import { AnnotationStore } from '../store/AnnotationStore'

export function saveAnnotationHandler(store: AnnotationStore) {
  return async (payload: any, mode: 'create' | 'edit') => {
    if (mode === 'create') {
      const created = await store.create({
        filePath: payload.filePath,
        range: payload.range,
        category: payload.category,
        comment: payload.comment,
        status: 'open',
        context: payload.context,
      })
      return created
    }
    if (!payload.id) {
      console.warn('[annotate-for-agent] save with mode=edit but no id on payload; skipping', payload)
      return undefined
    }
    const updated = await store.update(payload.id, {
      category: payload.category,
      comment: payload.comment,
    })
    return updated
  }
}
