"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderCsv = renderCsv;
const categoryMeta_1 = require("../store/categoryMeta");
function escape(s) {
    return `"${s.replace(/"/g, '""').replace(/\r?\n/g, '\\n')}"`;
}
function hunkString(a) {
    if (a.context.kind === 'file')
        return a.context.snippet;
    return `${a.context.hunkHeader}\n- ${a.context.before}\n+ ${a.context.after}`;
}
function renderCsv(annotations, opts) {
    const lines = [];
    if (opts.includeCategoryLegend) {
        lines.push('# Category,Action');
        for (const c of categoryMeta_1.CATEGORIES) {
            lines.push(`# ${c},${categoryMeta_1.CATEGORY_META[c].agentHint}`);
        }
    }
    const header = opts.includeCodeHunk
        ? 'path,startLine,endLine,category,status,comment,codeHunk'
        : 'path,startLine,endLine,category,status,comment';
    lines.push(header);
    for (const a of annotations) {
        const row = [
            a.filePath,
            String(a.range.startLine),
            String(a.range.endLine),
            a.category,
            a.status,
            escape(a.comment),
        ];
        if (opts.includeCodeHunk)
            row.push(escape(hunkString(a)));
        lines.push(row.join(','));
    }
    return lines.join('\n');
}
//# sourceMappingURL=csv.js.map