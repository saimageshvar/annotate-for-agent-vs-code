import { AnnotationStore } from '../store/AnnotationStore'

export function resolveAnnotationHandler(store: AnnotationStore) {
  return async (id: string) => {
    const ann = store.get(id)
    if (!ann) return
    const next = ann.status === 'resolved' ? 'open' : 'resolved'
    await store.update(id, { status: next })
  }
}
