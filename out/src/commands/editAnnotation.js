"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAnnotationHandler = saveAnnotationHandler;
function saveAnnotationHandler(store) {
    return async (payload, mode) => {
        if (mode === 'create') {
            await store.create({
                filePath: payload.filePath,
                range: payload.range,
                category: payload.category,
                comment: payload.comment,
                status: 'open',
                context: payload.context,
            });
        }
        else {
            await store.update(payload.id, { category: payload.category, comment: payload.comment });
        }
    };
}
//# sourceMappingURL=editAnnotation.js.map