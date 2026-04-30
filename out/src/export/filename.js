"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFilename = buildFilename;
const EXT = {
    markdown: 'md',
    json: 'json',
    csv: 'csv',
};
function pad(n) {
    return n.toString().padStart(2, '0');
}
function buildFilename(format, now, slugFn) {
    const ts = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-` +
        `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
    return `${slugFn()}-${ts}.${EXT[format]}`;
}
//# sourceMappingURL=filename.js.map