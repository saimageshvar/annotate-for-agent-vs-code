"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAnnotationHandler = resolveAnnotationHandler;
function resolveAnnotationHandler(store) {
    return async (id) => {
        const ann = store.get(id);
        if (!ann)
            return;
        const next = ann.status === 'resolved' ? 'open' : 'resolved';
        await store.update(id, { status: next });
    };
}
//# sourceMappingURL=resolveAnnotation.js.map