"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderJson = renderJson;
const categoryMeta_1 = require("../store/categoryMeta");
function renderJson(annotations, opts) {
    const counts = { open: 0, stale: 0, resolved: 0 };
    for (const a of annotations)
        counts[a.status]++;
    const legend = opts.includeCategoryLegend
        ? Object.fromEntries(categoryMeta_1.CATEGORIES.map(c => [c, categoryMeta_1.CATEGORY_META[c].agentHint]))
        : undefined;
    const items = annotations.map(a => {
        const base = {
            id: a.id,
            path: a.filePath,
            range: a.range,
            category: a.category,
            status: a.status,
            comment: a.comment,
        };
        if (opts.includeCodeHunk) {
            base.context = a.context;
        }
        return base;
    });
    const payload = {
        exportedAt: opts.now.toISOString(),
        workspace: opts.workspace,
        counts,
        annotations: items,
    };
    if (legend)
        payload.categoryLegend = legend;
    return JSON.stringify(payload, null, 2);
}
//# sourceMappingURL=json.js.map