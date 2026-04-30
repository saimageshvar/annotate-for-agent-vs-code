"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFilename = void 0;
exports.renderExport = renderExport;
const markdown_1 = require("./markdown");
const json_1 = require("./json");
const csv_1 = require("./csv");
function renderExport(annotations, opts) {
    switch (opts.format) {
        case 'markdown': return (0, markdown_1.renderMarkdown)(annotations, opts);
        case 'json': return (0, json_1.renderJson)(annotations, opts);
        case 'csv': return (0, csv_1.renderCsv)(annotations, { includeCodeHunk: opts.includeCodeHunk, includeCategoryLegend: opts.includeCategoryLegend });
    }
}
var filename_1 = require("./filename");
Object.defineProperty(exports, "buildFilename", { enumerable: true, get: function () { return filename_1.buildFilename; } });
//# sourceMappingURL=index.js.map